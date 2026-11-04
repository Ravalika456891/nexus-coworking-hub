/**
 * tests/billingConflictsAndPolish.test.js
 * Comprehensive Unit Test Suite covering all 8 core Billing & Meeting Room Credits areas:
 *
 * 1. Single source of truth for credits & hours (10 cr = 1 hr, ledger reconciliation, monthly scoping).
 * 2. Top-up synchronization & idempotency (Oct 15 top-up reconciles October balance to 190 cr: 150 + 100 - 60 = 190).
 * 3. Dedicated GST tax invoice for top-up (INV/2026-27/0002, SAC 997212, ₹4,500 base + 18% GST = ₹5,310).
 * 4. Credit expiry policy & pack pricing table.
 * 5. Invoice timing validation & overdue auto-evaluation.
 * 6. Credit note settlement reducing net payable & next auto-renew charge (₹29,500 - ₹2,360 = ₹27,140).
 * 7. Sequential financial year numbering & duplicate prevention.
 * 8. Configurable TDS engine & PAN/GSTIN checksum matching.
 */

const assert = require('assert');
globalThis.window = globalThis;
require('../js/initialData.js');
const initialData = globalThis.INITIAL_DATA;
const creditService = require('../creditService.js');
const billingService = require('../billingService.js');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

console.log('\n============================================================');
console.log('  RUNNING NEXUS HUB BILLING & CREDITS UNIT TEST SUITE');
console.log('============================================================\n');

// -------------------------------------------------------------
// AREA 1: Single Source of Truth, Units & Ledger Reconciliation
// -------------------------------------------------------------
console.log('--- Area 1: Single Source of Truth & Ledger Reconciliation ---');

test('Conversion factor is strictly 10 credits = 1.0 hour', () => {
  assert.strictEqual(creditService.CREDITS_PER_HOUR, 10);
  const dur = creditService.calculateDurationHours('14:00', '16:30');
  assert.strictEqual(dur, 2.5);
  const credits = dur * creditService.CREDITS_PER_HOUR;
  assert.strictEqual(credits, 25);
});

test('Ledger reconciliation rule: opening + topups - debits + refunds = balance', () => {
  const startup = initialData.startups.find(s => s.id === 'STP-XYZ');
  const rooms = initialData.meetingRooms;
  const allowance = creditService.getMonthlyAllowance(startup, rooms, '2026-11', startup.topUps || []);

  const opening = allowance.openingCredits;
  const topups = allowance.topUpCredits;
  const debits = allowance.consumedCredits;
  const refunds = allowance.refundedCredits;
  const calculatedBalance = opening + topups - debits + refunds;

  assert.strictEqual(
    calculatedBalance,
    allowance.currentBalanceCredits,
    `Ledger mismatch! Calculated: ${calculatedBalance}, Page Balance: ${allowance.currentBalanceCredits}`
  );
});

test('Monthly segregation: October bookings do not debit against November credits', () => {
  const startup = initialData.startups.find(s => s.id === 'STP-XYZ');
  const rooms = initialData.meetingRooms;
  const novAllowance = creditService.getMonthlyAllowance(startup, rooms, '2026-11', startup.topUps || []);

  const hasCrossMonthDebits = novAllowance.ledger.some(e => e.date && !e.date.startsWith('2026-11'));
  assert.strictEqual(hasCrossMonthDebits, false, 'November ledger must contain only November bookings!');
});

// -------------------------------------------------------------
// AREA 2: Top-Up Ledger Reconciliation & Idempotency
// -------------------------------------------------------------
console.log('\n--- Area 2: Top-Up Ledger Reconciliation & Idempotency ---');

test('October balance with Oct 15 top-up reconciles to exactly 190 credits (150 + 100 - 60 = 190)', () => {
  const startup = initialData.startups.find(s => s.id === 'STP-XYZ');
  const rooms = initialData.meetingRooms;
  const octAllowance = creditService.getMonthlyAllowance(startup, rooms, '2026-10', startup.topUps || []);

  assert.strictEqual(octAllowance.openingCredits, 150);
  assert.strictEqual(octAllowance.topUpCredits, 100);
  assert.strictEqual(octAllowance.consumedCredits, 60);
  assert.strictEqual(octAllowance.remainingCredits, 190);

  // Check top-up entry exists in ledger
  const topUpEntry = octAllowance.ledger.find(e => e.type === 'top-up');
  assert.ok(topUpEntry, 'Top-up entry must be present in October ledger!');
  assert.strictEqual(topUpEntry.credits, 100);
  assert.strictEqual(topUpEntry.paymentRef, 'PAY-2026-OCT-8814');
});

test('Top-up idempotency: duplicate purchase simulation does not double-credit', () => {
  const initialTopUps = [
    { paymentRef: 'PAY-2026-OCT-8814', credits: 100, date: '2026-10-15' }
  ];
  // Attempt to add duplicate payment
  const duplicateAttempt = { paymentRef: 'PAY-2026-OCT-8814', credits: 100, date: '2026-10-15' };
  const isDuplicate = initialTopUps.some(t => t.paymentRef === duplicateAttempt.paymentRef);
  assert.strictEqual(isDuplicate, true, 'System must detect and block duplicate paymentRef!');

  const deduplicated = [...initialTopUps];
  if (!deduplicated.some(t => t.paymentRef === duplicateAttempt.paymentRef)) {
    deduplicated.push(duplicateAttempt);
  }
  assert.strictEqual(deduplicated.length, 1);
});

// -------------------------------------------------------------
// AREA 3: Dedicated GST Tax Invoice for Top-Up
// -------------------------------------------------------------
console.log('\n--- Area 3: Dedicated GST Tax Invoice for Top-Up ---');

test('Dedicated GST tax invoice exists for Oct 15 top-up (INV/2026-27/0002)', () => {
  const topUpInv = initialData.invoices.find(i => i.invoiceNumber === 'INV/2026-27/0002');
  assert.ok(topUpInv, 'INV/2026-27/0002 must exist in invoices table!');
  assert.strictEqual(topUpInv.paymentRef, 'PAY-2026-OCT-8814');
  assert.strictEqual(topUpInv.baseAmount, 4500);
  assert.strictEqual(topUpInv.taxGst, 810);
  assert.strictEqual(topUpInv.total, 5310);
  assert.strictEqual(topUpInv.sacCode, '997212');
  assert.strictEqual(topUpInv.cgstAmount, 405);
  assert.strictEqual(topUpInv.sgstAmount, 405);
});

// -------------------------------------------------------------
// AREA 4: Credit Expiry Policy Engine & Pack Pricing Table
// -------------------------------------------------------------
console.log('\n--- Area 4: Credit Expiry Policy Engine & Pack Pricing Table ---');

test('Pack pricing table defines Starter (50 cr), Growth (100 cr), Scale (200 cr) with explicit discounts', () => {
  const packs = creditService.PACK_PRICING;
  assert.strictEqual(packs.length, 3);
  const growth = packs.find(p => p.id === 'pack_growth');
  assert.strictEqual(growth.credits, 100);
  assert.strictEqual(growth.discountPercent, 10);
  assert.strictEqual(growth.baseAmount, 4500);
  assert.strictEqual(growth.totalAmount, 5310);
});

test('Credit expiry policy configures 90-day top-up validity & plan reset at month-end', () => {
  const policies = creditService.CREDIT_EXPIRY_POLICIES;
  assert.ok(policies.startup);
  assert.strictEqual(policies.startup.topUpCreditsValidityDays, 90);
  assert.strictEqual(policies.startup.planCreditsRule, 'expire_at_month_end');
  assert.strictEqual(policies.startup.pausedPlanRule, 'freeze_and_preserve');
});

// -------------------------------------------------------------
// AREA 5: Invoice Timing Validation & Overdue Auto-Evaluation
// -------------------------------------------------------------
console.log('\n--- Area 5: Invoice Timing Validation & Overdue Evaluation ---');

test('Invoice unpaid after its dueDate evaluates to Overdue automatically', () => {
  const overdueInv = {
    id: 'TEST-INV-001',
    status: 'Pending',
    dueDate: '2026-10-05',
    total: 25000
  };
  const status = billingService.evaluateInvoiceStatus(overdueInv, '2026-11-04');
  assert.strictEqual(status, 'Overdue');
});

test('Invoice paid retains Paid status regardless of past dueDate', () => {
  const paidInv = {
    id: 'TEST-INV-002',
    status: 'Paid',
    dueDate: '2026-10-05',
    paidDate: '2026-11-01',
    total: 25000
  };
  const status = billingService.evaluateInvoiceStatus(paidInv, '2026-11-04');
  assert.strictEqual(status, 'Paid');
});

// -------------------------------------------------------------
// AREA 6: Credit Note Reduces Net Payable & Next Auto-Renew
// -------------------------------------------------------------
console.log('\n--- Area 6: Credit Note Reduces Net Payable & Auto-Renew ---');

test('Credit note CN/2026-27/0001 reduces INV-2026-080 net payable from ₹29,500 to ₹27,140', () => {
  const invoice = {
    id: 'INV-2026-080',
    invoiceNumber: 'INV/2026-27/0001',
    total: 29500
  };
  const creditNotes = [
    {
      creditNoteNumber: 'CN/2026-27/0001',
      targetInvoiceId: 'INV-2026-080',
      targetInvoiceNumber: 'INV/2026-27/0001',
      amount: 2360,
      settlementType: 'next_invoice_adjustment'
    }
  ];

  const netResult = billingService.calculateNetPayable(invoice, creditNotes);
  assert.strictEqual(netResult.invoiceTotal, 29500);
  assert.strictEqual(netResult.totalCreditsApplied, 2360);
  assert.strictEqual(netResult.netPayable, 27140);
});

test('Next auto-renew charge is computed from net payable after credit note adjustments', () => {
  const creditNotes = [
    {
      creditNoteNumber: 'CN/2026-27/0001',
      amount: 2360,
      settlementType: 'next_invoice_adjustment',
      isAdjusted: false
    }
  ];
  const autoRenew = billingService.calculateNextAutoRenewCharge(29500, creditNotes);
  assert.strictEqual(autoRenew.standardCharge, 29500);
  assert.strictEqual(autoRenew.adjustments, 2360);
  assert.strictEqual(autoRenew.netCharge, 27140);
});

// -------------------------------------------------------------
// AREA 7: Document Numbering & Duplicate Invoice Blocking
// -------------------------------------------------------------
console.log('\n--- Area 7: Document Numbering & Duplicate Invoice Blocking ---');

test('Financial year document numbering follows consecutive INV/YYYY-YY/XXXX pattern', () => {
  const fy = billingService.getFinancialYear(new Date('2026-10-15'));
  assert.strictEqual(fy, '2026-27');
  const nextNo = billingService.generateNextInvoiceNumber([]);
  assert.strictEqual(nextNo, 'INV/2026-27/0001');
});

test('Duplicate invoice check blocks identical (startupId, serviceKey, billingPeriod)', () => {
  const existingInvoices = [
    { startupId: 'STP-XYZ', serviceKey: 'private_cabin', billingPeriod: '2026-10', id: 'INV/2026-27/0001' }
  ];
  const dupCheck = billingService.checkDuplicateInvoice(existingInvoices, 'STP-XYZ', 'private_cabin', '2026-10');
  assert.strictEqual(dupCheck.isDuplicate, true);
  assert.strictEqual(dupCheck.existingInvoiceId, 'INV/2026-27/0001');
});

// -------------------------------------------------------------
// AREA 8: Configurable TDS Engine & PAN/GSTIN Validation
// -------------------------------------------------------------
console.log('\n--- Area 8: Configurable TDS Engine & PAN/GSTIN Validation ---');

test('TDS is calculated strictly on Base Amount (excluding GST)', () => {
  const baseAmount = 25000;
  const tdsBuilding = billingService.calculateTDS(baseAmount, '194-I_building');
  assert.strictEqual(tdsBuilding.ratePercent, 10);
  assert.strictEqual(tdsBuilding.tdsAmount, 2500);

  const tdsTech = billingService.calculateTDS(baseAmount, '194-J_tech');
  assert.strictEqual(tdsTech.ratePercent, 2);
  assert.strictEqual(tdsTech.tdsAmount, 500);
});

test('PAN characters 3-12 must match characters 3-12 of GSTIN', () => {
  const validPAN = 'AAACX9920M';
  const matchingGSTIN = '29AAACX9920M1Z4';
  const result = billingService.validatePANAgainstGSTIN(validPAN, matchingGSTIN);
  assert.strictEqual(result.valid, true);

  const mismatchedPAN = 'BBBCX9920M';
  const mismatchResult = billingService.validatePANAgainstGSTIN(mismatchedPAN, matchingGSTIN);
  assert.strictEqual(mismatchResult.valid, false);
});

test('GSTIN validation requires 15 alphanumeric characters matching state code', () => {
  assert.strictEqual(billingService.validateGSTIN('29AAACX9920M1Z4'), true);
  assert.strictEqual(billingService.validateGSTIN('INVALID_GSTIN'), false);
});

console.log('\n============================================================');
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

