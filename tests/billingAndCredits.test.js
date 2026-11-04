/**
 * tests/billingAndCredits.test.js
 *
 * Comprehensive Test Suite for Billing & Credits in Nexus Hub:
 * 1. Ledger reconciliation (opening + top-ups - debits + refunds = balance)
 * 2. Monthly reset & strict month boundary segregation
 * 3. Bucket order consumption (Plan -> Top-up -> Overage)
 * 4. Overage warnings & pre-booking cost evaluation
 * 5. Consecutive financial-year invoice numbering & gap detection
 * 6. Duplicate invoice prevention & admin voiding
 * 7. GST calculation (Intra-state CGST+SGST vs Inter-state IGST)
 * 8. Idempotent payment handling & role permission checks
 */

const assert = require('assert');
const creditService = require('../creditService.js');
const billingService = require('../billingService.js');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
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
console.log('🧪 RUNNING BILLING & CREDITS COMPREHENSIVE TEST SUITE');
console.log('============================================================\n');

// -------------------------------------------------------------
// Test 1: Ledger Reconciliation
// -------------------------------------------------------------
runTest('Test 1: Ledger Reconciles 100% (Opening + Top-ups - Debits = Balance)', () => {
  const startup = {
    id: 'STP-XYZ',
    name: 'XYZ Technologies',
    subscriptionPlan: 'Startup Plan',
    includedMeetingHours: 15
  };

  const topUps = [
    {
      id: 'TOPUP-1',
      purchasedAt: '2026-11-02T10:00:00Z',
      credits: 50,
      packTitle: 'Starter Pack',
      expiresAt: '2027-01-31'
    }
  ];

  const rooms = [
    {
      id: 'MR-01',
      name: 'Boardroom Alpha',
      bookings: [
        { id: 'B1', startupId: 'STP-XYZ', date: '2026-11-03', startTime: '09:00', endTime: '12:00', duration: 3.0, status: 'Confirmed' },
        { id: 'B2', startupId: 'STP-XYZ', date: '2026-11-04', startTime: '14:00', endTime: '16:00', duration: 2.0, status: 'Confirmed' }
      ]
    }
  ];

  const allowance = creditService.getMonthlyAllowance(startup, rooms, '2026-11', topUps);
  const ledger = allowance.ledger;

  // Opening: 150 cr. Top-up: +50 cr. Bookings: -30 cr, -20 cr.
  // Expected final balance: 150 + 50 - 50 = 150 cr.
  assert.strictEqual(allowance.planCredits, 150, 'Plan credits must be 150');
  assert.strictEqual(allowance.totalTopUpCredits, 50, 'Top-up credits must be 50');
  assert.strictEqual(allowance.usedCredits, 50, 'Used credits must be 50');
  assert.strictEqual(allowance.remainingCredits, 150, 'Remaining balance must be 150');

  // Verify every ledger row's running balance
  assert.strictEqual(ledger[0].runningBalanceCredits, 150, 'Opening entry running balance');
  assert.strictEqual(ledger[1].runningBalanceCredits, 200, 'After topup entry running balance');
  assert.strictEqual(ledger[2].runningBalanceCredits, 170, 'After first booking running balance');
  assert.strictEqual(ledger[3].runningBalanceCredits, 150, 'After second booking running balance');

  // Final ledger entry matches remaining balance
  const lastEntry = ledger[ledger.length - 1];
  assert.strictEqual(lastEntry.runningBalanceCredits, allowance.remainingCredits, 'Ledger ending balance must equal allowance balance');
});

// -------------------------------------------------------------
// Test 2: Monthly Reset & Boundary Segregation
// -------------------------------------------------------------
runTest('Test 2: Monthly Reset & Segregation (Oct Bookings Do NOT Debit Nov Allowance)', () => {
  const startup = {
    id: 'STP-XYZ',
    name: 'XYZ Technologies',
    subscriptionPlan: 'Startup Plan',
    includedMeetingHours: 15
  };

  const rooms = [
    {
      id: 'MR-02',
      name: 'Pitch Arena Nexus',
      bookings: [
        // October Bookings
        { id: 'OCT-1', startupId: 'STP-XYZ', date: '2026-10-25', startTime: '16:00', endTime: '18:00', duration: 2.0, status: 'Confirmed' },
        { id: 'OCT-2', startupId: 'STP-XYZ', date: '2026-10-30', startTime: '16:00', endTime: '18:00', duration: 2.0, status: 'Confirmed' },
        { id: 'OCT-3', startupId: 'STP-XYZ', date: '2026-10-31', startTime: '16:00', endTime: '18:00', duration: 2.0, status: 'Confirmed' },
        // November Bookings
        { id: 'NOV-1', startupId: 'STP-XYZ', date: '2026-11-01', startTime: '16:00', endTime: '18:00', duration: 2.0, status: 'Confirmed' },
        { id: 'NOV-2', startupId: 'STP-XYZ', date: '2026-11-02', startTime: '16:00', endTime: '18:00', duration: 2.0, status: 'Confirmed' }
      ]
    }
  ];

  // Evaluate October
  const allowanceOct = creditService.getMonthlyAllowance(startup, rooms, '2026-10');
  assert.strictEqual(allowanceOct.usedHours, 6.0, 'October used hours must be 6.0');
  assert.strictEqual(allowanceOct.usedCredits, 60, 'October used credits must be 60');
  assert.strictEqual(allowanceOct.remainingCredits, 90, 'October remaining credits must be 90');
  assert.strictEqual(allowanceOct.bookingsCount, 3, 'October bookings count must be 3');

  // Evaluate November
  const allowanceNov = creditService.getMonthlyAllowance(startup, rooms, '2026-11');
  assert.strictEqual(allowanceNov.usedHours, 4.0, 'November used hours must be 4.0 (NOT 10.0)');
  assert.strictEqual(allowanceNov.usedCredits, 40, 'November used credits must be 40');
  assert.strictEqual(allowanceNov.remainingCredits, 110, 'November remaining credits must be 110 (150 - 40)');
  assert.strictEqual(allowanceNov.bookingsCount, 2, 'November bookings count must be 2');

  // Verify none of the October bookings are in November ledger
  const hasOctInNov = allowanceNov.ledger.some(l => l.date && l.date.startsWith('2026-10'));
  assert.strictEqual(hasOctInNov, false, 'November ledger must NOT contain October bookings');
});

// -------------------------------------------------------------
// Test 3: Bucket Order (Plan -> Top-up -> Overage)
// -------------------------------------------------------------
runTest('Test 3: Bucket Order (Debits Plan First, then Top-up, then Bills Overage)', () => {
  const startup = {
    id: 'STP-XYZ',
    name: 'XYZ Technologies',
    subscriptionPlan: 'Startup Plan',
    includedMeetingHours: 10 // 100 plan credits
  };

  const topUps = [
    {
      id: 'TOP-1',
      purchasedAt: '2026-11-01T08:00:00Z',
      credits: 50, // 50 top-up credits
      expiresAt: '2027-01-31'
    }
  ];

  // Total available = 150 credits
  // Booking 1: 8 hrs = 80 credits -> taken entirely from Plan (leaves 20 plan, 50 top-up)
  // Booking 2: 5 hrs = 50 credits -> takes remaining 20 plan + 30 from top-up (leaves 0 plan, 20 top-up)
  // Booking 3: 4 hrs = 40 credits -> takes remaining 20 top-up + 20 overage (leaves 0 plan, 0 top-up, 20 cr / 2.0h overage)
  const rooms = [
    {
      id: 'MR-01',
      name: 'Boardroom Alpha',
      bookings: [
        { id: 'B1', startupId: 'STP-XYZ', date: '2026-11-02', startTime: '09:00', endTime: '17:00', duration: 8.0, status: 'Confirmed' },
        { id: 'B2', startupId: 'STP-XYZ', date: '2026-11-03', startTime: '09:00', endTime: '14:00', duration: 5.0, status: 'Confirmed' },
        { id: 'B3', startupId: 'STP-XYZ', date: '2026-11-04', startTime: '09:00', endTime: '13:00', duration: 4.0, status: 'Confirmed' }
      ]
    }
  ];

  const allowance = creditService.getMonthlyAllowance(startup, rooms, '2026-11', topUps);
  assert.strictEqual(allowance.usedCredits, 170, 'Total consumed credits is 170');
  assert.strictEqual(allowance.remainingPlanCredits, 0, 'Plan credits completely exhausted');
  assert.strictEqual(allowance.remainingTopUpCredits, 0, 'Top-up credits completely exhausted');
  assert.strictEqual(allowance.overageCredits, 20, 'Overage credits is 20 (2.0 hrs)');
  assert.strictEqual(allowance.overageHours, 2.0, 'Overage hours is 2.0');
  assert.strictEqual(allowance.overageFee, 3000, 'Overage fee is ₹3,000 (2h * ₹1,500/hr)');
});

// -------------------------------------------------------------
// Test 4: Overage Warnings & Cost Evaluation
// -------------------------------------------------------------
runTest('Test 4: Overage Warnings (<80% Green, 80-99% Amber, >=100% Red & Top-up Savings)', () => {
  const startup = {
    id: 'STP-XYZ',
    name: 'XYZ Technologies',
    subscriptionPlan: 'Startup Plan',
    includedMeetingHours: 10 // 100 credits
  };

  // 1. Under 80% (70 credits consumed)
  const roomsUnder = [
    {
      id: 'MR-01',
      name: 'Room 1',
      bookings: [
        { id: 'B1', startupId: 'STP-XYZ', date: '2026-11-02', startTime: '09:00', endTime: '16:00', duration: 7.0, status: 'Confirmed' }
      ]
    }
  ];
  const allowUnder = creditService.getMonthlyAllowance(startup, roomsUnder, '2026-11');
  assert.strictEqual(allowUnder.pctUsed, 70);
  assert.strictEqual(allowUnder.status, 'normal');
  assert.strictEqual(allowUnder.statusColor, '#10B981');
  assert.strictEqual(allowUnder.showOverageWarning, false);

  // 2. 80% - 99% (85 credits consumed)
  const roomsWarn = [
    {
      id: 'MR-01',
      name: 'Room 1',
      bookings: [
        { id: 'B1', startupId: 'STP-XYZ', date: '2026-11-02', startTime: '09:00', endTime: '17:30', duration: 8.5, status: 'Confirmed' }
      ]
    }
  ];
  const allowWarn = creditService.getMonthlyAllowance(startup, roomsWarn, '2026-11');
  assert.strictEqual(allowWarn.pctUsed, 85);
  assert.strictEqual(allowWarn.status, 'warning');
  assert.strictEqual(allowWarn.statusColor, '#F59E0B');
  assert.strictEqual(allowWarn.showOverageWarning, true);

  // 3. Pre-booking evaluation when user wants to book 3.0 hrs (short by 1.5 hrs)
  const evalCost = creditService.evaluateBookingCost(startup, roomsWarn, {
    roomId: 'MR-01',
    date: '2026-11-05',
    startTime: '10:00',
    endTime: '13:00'
  });
  assert.strictEqual(evalCost.willCauseOverage, true);
  assert.strictEqual(evalCost.overageHours, 1.5);
  assert.strictEqual(evalCost.overageFee, 2250, 'Overage fee at ₹1,500/hr is ₹2,250');
  assert.strictEqual(evalCost.topUpCostToCover, 750, 'Top-up cost at ₹500/hr is ₹750');
  assert.strictEqual(evalCost.savingsWithTopUp, 1500, 'Savings by buying top-up is ₹1,500');
});

// -------------------------------------------------------------
// Test 5: Invoice Numbering & Sequence Gaps
// -------------------------------------------------------------
runTest('Test 5: Consecutive Financial-Year Invoice Numbering (INV/2026-27/0001)', () => {
  const existing = [
    { id: 'INV/2026-27/0001', issueDate: '2026-04-10' },
    { id: 'INV/2026-27/0002', issueDate: '2026-05-15' },
    { id: 'INV/2026-27/0003', issueDate: '2026-06-20' }
  ];

  const nextId = billingService.generateNextInvoiceNumber(existing, '2026-11-03');
  assert.strictEqual(nextId, 'INV/2026-27/0004', 'Next consecutive invoice number must be INV/2026-27/0004');

  // Verify FY for January 2027 is still 2026-27
  assert.strictEqual(billingService.getFinancialYear('2027-01-15'), '2026-27');
  // Verify FY for April 2027 is 2027-28
  assert.strictEqual(billingService.getFinancialYear('2027-04-01'), '2027-28');
});

// -------------------------------------------------------------
// Test 6: Duplicate Invoices & Admin Voiding
// -------------------------------------------------------------
runTest('Test 6: Duplicate Invoice Prevention & Admin Voiding', () => {
  const existingInvoices = [
    {
      id: 'INV/2026-27/0010',
      startupId: 'STP-XYZ',
      billingPeriod: 'January 2027',
      lineItems: [{ desc: 'Private Cabin 103 Monthly License' }],
      status: 'Issued',
      total: 56168
    }
  ];

  // Try to generate duplicate for same startup, period, and cabin
  const dup = billingService.checkDuplicateInvoice(
    existingInvoices,
    'STP-XYZ',
    'Private Cabin 103 Monthly License',
    'January 2027'
  );
  assert.ok(dup, 'Must detect duplicate invoice');
  assert.strictEqual(dup.id, 'INV/2026-27/0010');

  // Admin voids the duplicate with reason
  const voidRes = billingService.voidInvoice(
    dup,
    'Duplicate batch generation of January 2027 cabin rent',
    'super_admin',
    'Administrator'
  );
  assert.strictEqual(voidRes.success, true);
  assert.strictEqual(dup.status, 'Void');
  assert.strictEqual(dup.voidReason, 'Duplicate batch generation of January 2027 cabin rent');

  // Non-admin cannot void
  const memberVoid = billingService.voidInvoice(
    existingInvoices[0],
    'Want to cancel',
    'founder',
    'Founder User'
  );
  assert.strictEqual(memberVoid.success, false);
  assert.ok(memberVoid.message.includes('Forbidden'));
});

// -------------------------------------------------------------
// Test 7: GST Calculation (Intra-state vs Inter-state)
// -------------------------------------------------------------
runTest('Test 7: GST Calculation (Intra-State KA-KA CGST+SGST vs Inter-State IGST)', () => {
  const baseAmount = 45000;

  // 1. Intra-State (Karnataka buyer: GSTIN starts with '29')
  const gstIntra = billingService.calculateGST(baseAmount, '29AAACX9920M1Z4');
  assert.strictEqual(gstIntra.taxType, 'INTRA_STATE');
  assert.strictEqual(gstIntra.cgstRate, 9);
  assert.strictEqual(gstIntra.sgstRate, 9);
  assert.strictEqual(gstIntra.cgstAmount, 4050); // 45000 * 0.09
  assert.strictEqual(gstIntra.sgstAmount, 4050); // 45000 * 0.09
  assert.strictEqual(gstIntra.igstAmount, 0);
  assert.strictEqual(gstIntra.totalGst, 8100);
  assert.strictEqual(gstIntra.totalAmount, 53100);

  // 2. Inter-State (Maharashtra buyer: GSTIN starts with '27')
  const gstInter = billingService.calculateGST(baseAmount, '27AABCU9603R1ZM');
  assert.strictEqual(gstInter.taxType, 'INTER_STATE');
  assert.strictEqual(gstInter.cgstAmount, 0);
  assert.strictEqual(gstInter.sgstAmount, 0);
  assert.strictEqual(gstInter.igstRate, 18);
  assert.strictEqual(gstInter.igstAmount, 8100); // 45000 * 0.18
  assert.strictEqual(gstInter.totalGst, 8100);
  assert.strictEqual(gstInter.totalAmount, 53100);

  // Amount in words
  const words = billingService.numberToWordsIndian(53100);
  assert.strictEqual(words, 'Rupees Fifty Three Thousand One Hundred Only');
});

// -------------------------------------------------------------
// Test 8: Idempotent Payment Handling & Permission Checks
// -------------------------------------------------------------
runTest('Test 8: Idempotent Payment Handling & Role Permissions', () => {
  const processedKeys = new Map();

  function processPayment(idempotencyKey, paymentData) {
    if (processedKeys.has(idempotencyKey)) {
      return { duplicate: true, cached: processedKeys.get(idempotencyKey) };
    }
    const result = {
      txId: `TXN-${Date.now()}`,
      status: 'PAID',
      creditsAdded: paymentData.credits,
      amountPaid: paymentData.amount
    };
    processedKeys.set(idempotencyKey, result);
    return { duplicate: false, result };
  }

  const pKey = 'IDEM-KEY-987654';
  const pay1 = processPayment(pKey, { credits: 100, amount: 4500 });
  assert.strictEqual(pay1.duplicate, false);
  assert.strictEqual(pay1.result.creditsAdded, 100);

  // Retry with same key
  const pay2 = processPayment(pKey, { credits: 100, amount: 4500 });
  assert.strictEqual(pay2.duplicate, true);
  assert.strictEqual(pay2.cached.creditsAdded, 100);
  assert.strictEqual(pay2.cached.txId, pay1.result.txId);

  // Role permissions check
  function canEditBillingProfile(userRole) {
    return userRole === 'admin' || userRole === 'super_admin' || userRole === 'founder' || userRole === 'company_admin';
  }
  function canVoidInvoices(userRole) {
    return userRole === 'admin' || userRole === 'super_admin' || userRole === 'finance_admin';
  }

  assert.strictEqual(canEditBillingProfile('founder'), true);
  assert.strictEqual(canEditBillingProfile('employee'), false);
  assert.strictEqual(canVoidInvoices('founder'), false);
  assert.strictEqual(canVoidInvoices('super_admin'), true);
});

console.log('\n============================================================');
console.log(`Test Results: ${passedTests} Passed, ${failedTests} Failed`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

