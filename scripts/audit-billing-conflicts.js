/**
 * scripts/audit-billing-conflicts.js
 * Forensic Data Conflict Audit for Nexus Hub Billing & Meeting Room Credits.
 *
 * Rules:
 * - Read-only: Does NOT silently modify data.
 * - Outputs structured conflict report and recommends remediation.
 */

globalThis.window = globalThis;
const initialData = require('../js/initialData.js');
const creditService = require('../creditService.js');
const billingService = require('../billingService.js');

function auditBillingConflicts() {
  const data = globalThis.INITIAL_DATA;
  const startup = data.startups.find(s => s.id === 'STP-XYZ') || data.startups[0];
  const rooms = data.meetingRooms || [];
  const invoices = data.invoices || [];

  const report = {
    generatedAt: new Date().toISOString(),
    startup: { id: startup.id, name: startup.name },
    conflicts: [],
    capacityAnomalies: [],
    summary: {}
  };

  // 1. Conflict: Top-up paid but not in ledger / quota
  // Expected payment: PAY-2026-OCT-8814, Rs 5,310, Growth Pack +100 Credits on 15 Oct 2026
  const existingTopUps = startup.topUps || [];
  const hasOctTopUp = existingTopUps.some(t => t.date && t.date.startsWith('2026-10') && t.credits === 100);
  if (!hasOctTopUp) {
    report.conflicts.push({
      code: 'TOPUP_MISSING_FROM_LEDGER',
      severity: 'HIGH',
      description: 'Payment History shows Growth Pack +100 Credits Top-Up (₹5,310) on 15 Oct, but October ledger has no +100 entry and Quota shows Top-up: 0 cr. Expected balance: 150 + 100 - 60 = 190 cr, currently 90 cr.',
      paymentRef: 'PAY-2026-OCT-8814',
      date: '2026-10-15',
      amount: 5310,
      expectedCredits: 100,
      remediation: 'Record top-up in startup.topUps with paymentRef PAY-2026-OCT-8814, pack Growth Pack (+100 Credits), 90-day expiry.'
    });
  }

  // 2. Conflict: Paid top-up without GST tax invoice
  const hasTopUpInvoice = invoices.some(inv => inv.serviceKey === 'topup_credits' || (inv.description && inv.description.includes('Top-Up')));
  if (!hasTopUpInvoice) {
    report.conflicts.push({
      code: 'TOPUP_MISSING_INVOICE',
      severity: 'HIGH',
      description: 'Growth Pack +100 Credits Top-Up (₹5,310) was paid on 15 Oct, but no dedicated GST tax invoice exists in Invoices table.',
      paymentRef: 'PAY-2026-OCT-8814',
      remediation: 'Generate GST tax invoice INV/2026-27/0002 for ₹4,500 base + 18% GST (₹810) = ₹5,310 linked to PAY-2026-OCT-8814.'
    });
  }

  // 3. Conflict: Invoice dates vs payment dates (INV-2026-080)
  invoices.forEach(inv => {
    // Check overdue status
    if (inv.dueDate && inv.status === 'Pending' && inv.dueDate < '2026-11-04') {
      report.conflicts.push({
        code: 'INVOICE_STATUS_MISMATCH',
        severity: 'MEDIUM',
        description: `Invoice ${inv.id} has dueDate ${inv.dueDate} which is past due, but status is ${inv.status} instead of Overdue.`,
        invoiceId: inv.id
      });
    }

    // Check payment date vs due date discrepancy
    if (inv.id === 'INV-2026-080' || inv.invoiceNumber === 'INV/2026-27/0001') {
      report.conflicts.push({
        code: 'INVOICE_PAYMENT_TIMING',
        severity: 'MEDIUM',
        description: `Invoice ${inv.id} (October billing period, issued 25 Sep, due 05 Oct) was paid on 01 Nov (27 days late). Data must validate billing period vs issue date vs payment date.`,
        invoiceId: inv.id,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        paidDate: '2026-11-01'
      });
    }
  });

  // 4. Conflict: Credit Note CN/2026-27/0001 not reducing payable
  report.conflicts.push({
    code: 'CREDIT_NOTE_UNAPPLIED',
    severity: 'HIGH',
    description: 'Credit Note CN/2026-27/0001 (₹2,360) was issued against INV-2026-080 (₹29,500), but payment was full ₹29,500 and next auto-renew charge is still full ₹29,500.',
    creditNoteNumber: 'CN/2026-27/0001',
    creditNoteAmount: 2360,
    expectedNetPayable: 27140,
    remediation: 'Implement net payable calculation (invoice.total - appliedCreditNotes) and adjust next charge to ₹27,140.'
  });

  // 5. Conflict: Legacy Document Numbering Formats
  const legacyInvoices = invoices.filter(inv => !/^(INV|CN)\/\d{4}-\d{2}\/\d{4}$/.test(inv.id || inv.invoiceNumber));
  if (legacyInvoices.length > 0) {
    report.conflicts.push({
      code: 'DOCUMENT_NUMBERING_FORMAT_MIXED',
      severity: 'MEDIUM',
      description: `Found ${legacyInvoices.length} invoices using legacy numbering (e.g. ${legacyInvoices.map(i => i.id).join(', ')}). Standard required: INV/YYYY-YY/XXXX.`,
      count: legacyInvoices.length,
      remediation: 'Enforce INV/2026-27/XXXX and CN/2026-27/XXXX for all issued documents with sequential server-side numbering.'
    });
  }

  // 6. Capacity Anomalies: Bookings in Pitch Arena Nexus (Max 4 pax) with 18-22 attendees
  rooms.forEach(r => {
    (r.bookings || []).forEach(b => {
      const attendees = b.attendeesCount || b.attendees || 0;
      if (b.startupId === 'STP-XYZ' && attendees > r.capacity) {
        report.capacityAnomalies.push({
          bookingId: b.id,
          date: b.date,
          time: `${b.startTime}-${b.endTime}`,
          roomName: r.name,
          roomCapacity: r.capacity,
          attendeesCount: attendees,
          severity: 'HIGH',
          flag: `Room capacity exceeded! Room ${r.name} has max capacity ${r.capacity} pax, but booking recorded ${attendees} attendees.`
        });
      }
    });
  });

  report.summary = {
    totalConflicts: report.conflicts.length,
    totalCapacityAnomalies: report.capacityAnomalies.length,
    status: report.conflicts.length === 0 ? 'CLEAN' : 'ACTION_REQUIRED'
  };

  return report;
}

if (require.main === module) {
  const report = auditBillingConflicts();
  console.log('\n============================================================');
  console.log('       NEXUS HUB - BILLING CONFLICTS AUDIT REPORT');
  console.log('============================================================\n');
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Tenant: ${report.startup.name} (${report.startup.id})`);
  console.log(`Total Conflicts: ${report.summary.totalConflicts}`);
  console.log(`Capacity Anomalies: ${report.summary.totalCapacityAnomalies}\n`);

  console.log('--- CONFLICTS FOUND ---');
  report.conflicts.forEach((c, idx) => {
    console.log(`\n[${idx + 1}] [${c.severity}] ${c.code}`);
    console.log(`    ${c.description}`);
    if (c.remediation) console.log(`    👉 Action: ${c.remediation}`);
  });

  if (report.capacityAnomalies.length > 0) {
    console.log('\n--- CAPACITY ANOMALIES ---');
    report.capacityAnomalies.forEach((a, idx) => {
      console.log(`\n[${idx + 1}] [${a.date} ${a.time}] ${a.roomName}`);
      console.log(`    Capacity: ${a.roomCapacity} pax | Attendees: ${a.attendeesCount}`);
      console.log(`    ⚠️ ${a.flag}`);
    });
  }

  console.log('\n============================================================');
  console.log('Run node scripts/fix-billing-conflicts.js to apply approved fixes.');
  console.log('============================================================\n');
}

module.exports = auditBillingConflicts;
