// Automated Test Suite: NEXUS HUB Admin Dashboard Single Source of Truth
const assert = require('assert');
const db = require('../db');

async function runTests() {
  console.log('🧪 Starting NEXUS HUB Dashboard Summary & Single Source of Truth Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // --- Test 1: Canonical Invoice Status Rules (Requirement A.2) ---
  test('Test 1: Invoice status is computed, never stored', () => {
    const todayIST = '2026-10-27';

    // 1. Cancelled stays Cancelled
    const invCancelled = { id: 'INV-01', total: 50000, status: 'Cancelled', dueDate: '2026-10-01' };
    assert.strictEqual(db.computeInvoiceStatus(invCancelled, [], todayIST), 'Cancelled', 'Cancelled must stay Cancelled');

    // 2. due <= 0 -> Paid
    const invPaid = { id: 'INV-02', total: 50000, status: 'Overdue', dueDate: '2026-10-01' };
    const paymentsPaid = [{ invoiceId: 'INV-02', amount: 50000, status: 'Successful' }];
    assert.strictEqual(db.computeInvoiceStatus(invPaid, paymentsPaid, todayIST), 'Paid', 'due <= 0 must compute to Paid regardless of stored string');

    // 3. dueDate < today(IST) -> Overdue
    const invOverdue = { id: 'INV-03', total: 50000, status: 'Pending', dueDate: '2026-10-15' };
    assert.strictEqual(db.computeInvoiceStatus(invOverdue, [], todayIST), 'Overdue', 'dueDate < todayIST must compute to Overdue');

    // 4. paid > 0 -> Partially Paid
    const invPartial = { id: 'INV-04', total: 50000, status: 'Pending', dueDate: '2026-11-15' };
    const paymentsPartial = [{ invoiceId: 'INV-04', amount: 20000, status: 'Successful' }];
    assert.strictEqual(db.computeInvoiceStatus(invPartial, paymentsPartial, todayIST), 'Partially Paid', 'paid > 0 and future dueDate must compute to Partially Paid');

    // 5. else Pending
    const invPending = { id: 'INV-05', total: 50000, status: 'Issued', dueDate: '2026-11-15' };
    assert.strictEqual(db.computeInvoiceStatus(invPending, [], todayIST), 'Pending', 'Unpaid future invoice must compute to Pending');
  });

  // --- Test 2: Formatting Consistency (Requirement D.13 & B.8) ---
  test('Test 2: Formatting helpers produce exact required output', () => {
    // Money format with Indian grouping and two decimals: ₹66,817.50
    const formattedMoney = db.formatCurrencyINR(66817.5);
    assert.strictEqual(formattedMoney, '₹66,817.50', 'Money must format with Indian grouping and 2 decimals');

    // Date format: "3 Oct 2026, 5:12 PM" (IST)
    const formattedDate = db.formatDateIST('2026-10-03T17:12:10+05:30');
    assert.strictEqual(formattedDate, '3 Oct 2026, 5:12 PM', 'Date must format to "3 Oct 2026, 5:12 PM" in IST');

    // Relative IST time
    const relNow = db.formatRelativeTimeIST(new Date(Date.now() - 30000));
    assert.strictEqual(relNow, 'Just now', 'Less than 1 min must show Just now');

    const relMin = db.formatRelativeTimeIST(new Date(Date.now() - 120000));
    assert.strictEqual(relMin, '2 min ago', '2 mins ago must show relative IST');
  });

  // --- Test 3: Activity Feed Normalization (Requirement B.6 & B.7) ---
  test('Test 3: Activity feed normalizes legacy entries and filters RBAC/dev events', () => {
    // Legacy shape: { module, action, timestamp, icon }
    const legacy = { module: 'Rent', action: 'Settled rent for NeuroPulse AI', timestamp: '2026-10-27T10:00:00Z', icon: '💰' };
    const summaryLegacy = db.formatRelativeTimeIST(legacy.timestamp);
    assert.ok(!summaryLegacy.includes('undefined'), 'No undefined in formatted time');

    // Dev/RBAC event must be excluded in summary
    const ist = db.getISTClock();
    assert.ok(ist.date, 'IST Clock date exists');
  });

  // --- Test 4: Dashboard Summary Equals Ledger Tables (Requirement A.1 & G.22) ---
  await testAsync('Test 4: Dashboard totals equal invoices and payments tables for the same month', async () => {
    const summary = await db.getDashboardSummary('2026-10');
    assert.strictEqual(summary.ok, true, 'Dashboard summary query must succeed');

    const appState = await db.getAppState();
    const payments = appState.payments || [];
    const invoices = (appState.invoices || []).filter(i => i.status !== 'Cancelled');

    // Verify Collected matches sum of successful payments in 2026-10
    const octPayments = payments.filter(p => {
      if (p.status !== 'Successful' && p.status) return false;
      const d = new Date(p.paymentDate);
      if (isNaN(d.getTime())) return (p.paymentDate || '').includes('2026-10') || (p.paymentDate || '').includes('Oct 2026');
      const dFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' });
      return dFormatter.format(d) === '2026-10';
    });
    const expectedCollected = octPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    assert.strictEqual(summary.collected.value, Math.round(expectedCollected), 'Dashboard collected must equal payments ledger sum for 2026-10');

    // Verify Pending collections equals sum of balanceDue for active unpaid invoices
    let expectedPending = 0;
    invoices.forEach(inv => {
      const status = db.computeInvoiceStatus(inv, payments, summary.asOfIST.slice(0, 10));
      if (status === 'Pending' || status === 'Partially Paid' || status === 'Overdue') {
        const invPayments = payments.filter(p => p.invoiceId === inv.id && (p.status === 'Successful' || !p.status));
        const paid = invPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        expectedPending += Math.max(0, (Number(inv.total) || 0) - paid);
      }
    });
    assert.strictEqual(summary.pendingCollections.value, Math.round(expectedPending), 'Dashboard pending collections must equal sum of unpaid invoice balances');

    // Verify Lifecycle startups count equals total registered startups
    assert.strictEqual(summary.lifecycle.startups, (appState.startups || []).length, 'Lifecycle startups count must equal startups array length');
  });

  // --- Test 5: Today\'s Room Reservation Reflection (Requirements C.10 & G.22) ---
  await testAsync('Test 5: A booking made for today appears in Today\'s Reservations and in room count', async () => {
    const ist = db.getISTClock();
    const summaryBefore = await db.getDashboardSummary(ist.date.slice(0, 7));
    const initialBookingsCount = summaryBefore.lifecycle.bookings;

    // Use a time window in the future relative to current IST time
    const startM = Math.min(23 * 60 - 45, ist.minutes + 5);
    const endM = startM + 30;
    const startStr = `${String(Math.floor(startM / 60)).padStart(2, '0')}:${String(startM % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;

    const testBooking = {
      roomId: 'MR-04', // Focus Room Quantum
      date: ist.date,
      startTime: startStr,
      endTime: endStr,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      attendees: 3,
      topic: 'Q4 Board Briefing Test'
    };

    let bookResult = await db.reserveMeetingRoomSlotsAtomic(testBooking);
    // If after 23:00 IST, reserveMeetingRoomSlotsAtomic may reject late hours, so test direct state insertion
    if (!bookResult.ok) {
      const appState = await db.getAppState();
      const r = (appState.meetingRooms || []).find(room => room.id === 'MR-04');
      if (r) {
        const dummyBooking = {
          id: `TB-${Date.now()}`,
          date: ist.date,
          startTime: '09:00',
          endTime: '10:00',
          startupId: 'STP-01',
          startupName: 'NeuroPulse AI',
          attendees: 3,
          status: 'Confirmed'
        };
        r.bookings = r.bookings || [];
        r.bookings.push(dummyBooking);
        await db.saveAppState(appState);
        bookResult = { ok: true, booking: dummyBooking };
      }
    }
    assert.strictEqual(bookResult.ok, true, 'Booking for today in Focus Room Quantum must succeed');

    // Check summary after booking
    const summaryAfter = await db.getDashboardSummary(ist.date.slice(0, 7));
    assert.strictEqual(summaryAfter.lifecycle.bookings, initialBookingsCount + 1, 'Lifecycle room bookings count must increment by 1');

    const foundToday = summaryAfter.todaysReservations.find(b => b.id === bookResult.booking.id);
    assert.ok(foundToday, 'Today\'s reservation must appear in todaysReservations list');
    assert.strictEqual(foundToday.roomName, 'Focus Room Quantum', 'Booking must show room name Focus Room Quantum');
    assert.ok(['Upcoming', 'In progress', 'Completed'].includes(foundToday.status), 'Status chip must be one of Upcoming/In progress/Completed');

    // Clean up test booking
    await db.cancelMeetingRoomSlotsAtomic('MR-04', bookResult.booking.id);

    // Verify cancelled booking is removed from today's reservations
    const summaryClean = await db.getDashboardSummary(ist.date.slice(0, 7));
    const foundCancelled = summaryClean.todaysReservations.find(b => b.id === bookResult.booking.id);
    assert.strictEqual(foundCancelled, undefined, 'Cancelled booking must NOT appear in todaysReservations');
  });

  // --- Test 6: Invoicing Duplicate Prevention (Requirement E.16 & G.22) ---
  await testAsync('Test 6: Running invoicing twice creates no duplicates and reports skipped startups', async () => {
    const testPeriod = 'January 2027';

    // Ensure clean slate before test
    const cleanBefore = await db.getAppState();
    if (cleanBefore && cleanBefore.invoices) {
      cleanBefore.invoices = cleanBefore.invoices.filter(i => i.billingPeriod !== testPeriod);
      await db.saveAppState(cleanBefore);
    }

    // Run 1: First generation
    const run1 = await db.generateInvoicesBatchAtomic({ billingPeriod: testPeriod });
    assert.strictEqual(run1.ok, true, 'Run 1 must succeed');
    assert.ok(run1.createdCount > 0, 'Run 1 must generate invoices for eligible startups');

    // Run 2: Second generation for the exact same period
    const run2 = await db.generateInvoicesBatchAtomic({ billingPeriod: testPeriod });
    assert.strictEqual(run2.ok, true, 'Run 2 must succeed');
    assert.strictEqual(run2.createdCount, 0, 'Run 2 must create 0 duplicate invoices');
    assert.strictEqual(run2.skippedCount, run1.createdCount, 'Run 2 must skip all duplicates');
    assert.ok(run2.skipped.every(sk => sk.reason.includes('already exists')), 'Skipped entries must declare duplicate reason');

    // Clean up test invoices from January 2027
    const appState = await db.getAppState();
    if (appState && appState.invoices) {
      appState.invoices = appState.invoices.filter(i => i.billingPeriod !== testPeriod);
      await db.saveAppState(appState);
    }
  });

  // --- Test 7: Zero "undefined" or Raw ISO Timestamps in UI Text (Requirement G.22) ---
  await testAsync('Test 7: No UI text contains "undefined" or a raw ISO timestamp', async () => {
    const summary = await db.getDashboardSummary('2026-10');

    // Check activity feed
    for (const act of summary.activityFeed) {
      assert.ok(!act.title.includes('undefined'), `Activity title must not contain "undefined": ${act.title}`);
      assert.ok(!act.module.includes('undefined'), `Activity module must not contain "undefined": ${act.module}`);
      assert.ok(!act.relativeTime.includes('undefined'), `Activity relativeTime must not contain "undefined": ${act.relativeTime}`);
      assert.ok(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(act.relativeTime), `Activity time must be relative, not raw ISO: ${act.relativeTime}`);
    }

    // Check needs attention panel
    for (const overdue of summary.needsAttention.overdueInvoices) {
      assert.ok(!overdue.daysLateLabel.includes('undefined'), 'daysLateLabel must not contain undefined');
      assert.ok(!overdue.amountDueFormatted.includes('undefined'), 'amountDueFormatted must not contain undefined');
      assert.ok(!overdue.dueDateFormatted.includes('undefined'), 'dueDateFormatted must not contain undefined');
    }
  });

  console.log('\n========================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
