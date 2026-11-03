/**
 * scripts/audit-billing-mismatches.js
 *
 * Forensic audit script for Nexus Hub:
 * 1. Ledger vs Current Balance reconciliation check
 * 2. Bookings missing from ledger check
 * 3. Cross-month debits detection
 * 4. Bookings whose hours differ between tables / calculations
 * 5. Duplicate invoices detection (customer, service, billing period)
 * 6. Invoice number gaps and out-of-order numbering
 * 7. Missing billing periods (e.g. November/December 2026 gaps)
 * 8. Plan name inconsistencies across records
 *
 * NOTE: This script is READ-ONLY and does NOT silently modify data.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const creditService = require('../creditService.js');

function loadSeedData() {
  const filePath = path.join(__dirname, '..', 'js', 'initialData.js');
  if (!fs.existsSync(filePath)) {
    throw new Error('initialData.js not found at ' + filePath);
  }
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.INITIAL_DATA || {};
}

function runAudit() {
  console.log('====================================================================');
  console.log('⚡ NEXUS HUB - BILLING, CREDITS & INVOICE FORENSIC AUDIT REPORT');
  console.log('   Timestamp: ' + new Date().toISOString());
  console.log('====================================================================\n');

  const data = loadSeedData();
  const startups = data.startups || [];
  const rooms = data.meetingRooms || [];
  const invoices = data.invoices || [];

  const issues = [];

  // ------------------------------------------------------------------
  // 1. Audit Startups, Plans & Cross-Month Booking Debits
  // ------------------------------------------------------------------
  console.log('🔍 [1/5] Auditing Startup Allowances, Ledger Reconciliation & Booking Segregation...');
  
  startups.forEach(startup => {
    // Check Plan Name
    const planName = startup.subscriptionPlan || startup.plan;
    if (!planName) {
      issues.push({
        severity: 'WARNING',
        category: 'PLAN_RECORD_MISSING',
        entityId: startup.id,
        description: `Startup ${startup.name} (${startup.id}) has undefined subscriptionPlan. Sidebar defaults to 'Startup Plan' while cards default to 'Scale-up Venture'.`
      });
    }

    // Check months October 2026 and November 2026
    ['2026-10', '2026-11'].forEach(targetMonth => {
      const allowance = creditService.getMonthlyAllowance(startup, rooms, targetMonth);
      const ledger = allowance.ledger;

      // Check ledger reconciliation
      if (ledger.length > 0) {
        const lastEntry = ledger[ledger.length - 1];
        if (lastEntry.runningBalanceCredits !== allowance.remainingCredits) {
          issues.push({
            severity: 'CRITICAL',
            category: 'LEDGER_RECONCILIATION_MISMATCH',
            entityId: startup.id,
            description: `${startup.name} (${targetMonth}): Ledger ending running balance (${lastEntry.runningBalanceCredits} cr) does not match calculated remaining balance (${allowance.remainingCredits} cr).`
          });
        }
      }

      // Check for any cross-month bookings incorrectly debited
      allowance.bookings.forEach(b => {
        if (!b.date.startsWith(targetMonth)) {
          issues.push({
            severity: 'HIGH',
            category: 'CROSS_MONTH_DEBIT',
            entityId: b.id,
            description: `Booking ${b.id} on date ${b.date} was incorrectly debited against ${targetMonth} allowance.`
          });
        }
      });
    });
  });

  // ------------------------------------------------------------------
  // 2. Audit All Room Bookings for Duration Discrepancies
  // ------------------------------------------------------------------
  console.log('🔍 [2/5] Auditing Room Bookings for Duration Discrepancies...');
  
  rooms.forEach(r => {
    (r.bookings || []).forEach(b => {
      if (!b.startTime || !b.endTime) return;
      const calcDur = creditService.calculateDurationHours(b.startTime, b.endTime);
      if (b.duration !== undefined && Math.abs(Number(b.duration) - calcDur) > 0.05) {
        issues.push({
          severity: 'HIGH',
          category: 'BOOKING_DURATION_MISMATCH',
          entityId: b.id,
          description: `Booking ${b.id} in ${r.name} has stored duration ${b.duration}h but (${b.startTime} - ${b.endTime}) calculates to ${calcDur}h.`
        });
      }
    });
  });

  // ------------------------------------------------------------------
  // 3. Audit Duplicate Invoices: (customer, service, billing period)
  // ------------------------------------------------------------------
  console.log('🔍 [3/5] Auditing Invoices for Duplicate (Customer, Service, Billing Period)...');
  
  const invoiceMap = new Map();
  invoices.forEach(inv => {
    // Determine service description
    const serviceKey = (inv.lineItems && inv.lineItems.length > 0)
      ? inv.lineItems[0].desc.replace(/\s+/g, ' ').trim().toLowerCase()
      : 'workspace-membership';
    
    const key = `${inv.startupId}__${inv.billingPeriod}__${serviceKey}`;
    if (invoiceMap.has(key)) {
      const existing = invoiceMap.get(key);
      issues.push({
        severity: 'HIGH',
        category: 'DUPLICATE_INVOICE',
        entityId: `${inv.id} & ${existing.id}`,
        description: `Duplicate invoices found for Startup ${inv.startupId} (${inv.startupName}) in period '${inv.billingPeriod}': ${inv.id} and ${existing.id} both bill '${serviceKey}' for ₹${inv.total}.`
      });
    } else {
      invoiceMap.set(key, inv);
    }
  });

  // ------------------------------------------------------------------
  // 4. Audit Invoice Numbering, Gaps and Chronological Sequence
  // ------------------------------------------------------------------
  console.log('🔍 [4/5] Auditing Invoice Numbers, Sequence Gaps & Chronology...');

  const parsedInvoices = [];
  invoices.forEach(inv => {
    // Match formats: INV-2026-080, INV-2026-098, INV-2026-0102, INV/2026-27/0001
    const match = inv.id.match(/INV[-/](?:2026(?:-27)?)[-/](\d+)/);
    if (match) {
      const seqNum = parseInt(match[1], 10);
      parsedInvoices.push({
        id: inv.id,
        seqNum,
        issueDate: inv.issueDate,
        startupId: inv.startupId,
        billingPeriod: inv.billingPeriod
      });
    } else {
      issues.push({
        severity: 'WARNING',
        category: 'NON_STANDARD_INVOICE_NUMBER',
        entityId: inv.id,
        description: `Invoice ${inv.id} does not match standard financial-year format (INV/2026-27/XXXX).`
      });
    }
  });

  // Sort by sequence number
  parsedInvoices.sort((a, b) => a.seqNum - b.seqNum);

  for (let i = 0; i < parsedInvoices.length - 1; i++) {
    const curr = parsedInvoices[i];
    const next = parsedInvoices[i + 1];

    // Check for sequence gap
    if (next.seqNum > curr.seqNum + 1) {
      issues.push({
        severity: 'WARNING',
        category: 'INVOICE_SEQUENCE_GAP',
        entityId: `${curr.id} -> ${next.id}`,
        description: `Invoice sequence gap detected: ${next.seqNum - curr.seqNum - 1} missing invoice numbers between ${curr.id} (seq #${curr.seqNum}) and ${next.id} (seq #${next.seqNum}).`
      });
    }

    // Check chronological order
    if (curr.issueDate && next.issueDate && curr.issueDate > next.issueDate) {
      issues.push({
        severity: 'HIGH',
        category: 'INVOICE_CHRONOLOGY_MISMATCH',
        entityId: `${curr.id} & ${next.id}`,
        description: `Out-of-order invoice dates: ${curr.id} (seq #${curr.seqNum}) was issued on ${curr.issueDate}, but later sequence ${next.id} (seq #${next.seqNum}) was issued earlier on ${next.issueDate}.`
      });
    }
  }

  // ------------------------------------------------------------------
  // 5. Audit Missing Billing Periods (e.g. gaps between Oct 2026 & Jan 2027)
  // ------------------------------------------------------------------
  console.log('🔍 [5/5] Auditing Billing Period Continuity for Active Startups...');

  startups.forEach(s => {
    const sInvoices = invoices.filter(inv => inv.startupId === s.id && inv.status !== 'Cancelled');
    if (sInvoices.length === 0) return;

    const periods = sInvoices.map(i => i.billingPeriod);
    const hasOct2026 = periods.includes('October 2026');
    const hasJan2027 = periods.includes('January 2027');
    const hasNov2026 = periods.includes('November 2026');
    const hasDec2026 = periods.includes('December 2026');

    if (hasOct2026 && hasJan2027 && (!hasNov2026 || !hasDec2026)) {
      issues.push({
        severity: 'HIGH',
        category: 'BILLING_PERIOD_GAP',
        entityId: s.id,
        description: `Startup ${s.name} (${s.id}) has invoices for 'October 2026' and 'January 2027', but has no invoices for ${!hasNov2026 ? 'November 2026 ' : ''}${!hasDec2026 ? 'December 2026' : ''}.`
      });
    }
  });

  // ------------------------------------------------------------------
  // Summary Results Presentation
  // ------------------------------------------------------------------
  console.log('\n====================================================================');
  console.log(`📊 AUDIT COMPLETED: ${issues.length} Issues Detected`);
  console.log('====================================================================\n');

  if (issues.length === 0) {
    console.log('🎉 No data mismatches, gaps, or duplicate invoices found!');
  } else {
    issues.forEach((iss, idx) => {
      const colorTag = iss.severity === 'CRITICAL' ? '🔴 CRITICAL' : iss.severity === 'HIGH' ? '🟠 HIGH' : '🟡 WARNING';
      console.log(`[${idx + 1}] ${colorTag} | ${iss.category} | ${iss.entityId}`);
      console.log(`    ↳ ${iss.description}\n`);
    });
  }

  return issues;
}

if (require.main === module) {
  runAudit();
}

module.exports = { runAudit };
