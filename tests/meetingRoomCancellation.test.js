// Automated Test Suite: NEXUS HUB Meeting Room Cancellation & Refund Policy
const assert = require('assert');
const cancellation = require('../cancellation');
const db = require('../db');

async function runTests() {
  console.log('🧪 Starting NEXUS HUB Meeting Room Cancellation & Refund Policy Test Suite...\n');
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

  async function cleanAllTestDates() {
    const testDates = ['2026-10-30', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-28'];
    const database = await db.connectDB();
    if (database) {
      await database.collection('meeting_room_slots').deleteMany({ date: { $in: testDates } });
      const state = await db.getAppState();
      if (state && state.meetingRooms) {
        state.meetingRooms.forEach(r => {
          r.bookings = (r.bookings || []).filter(b => !testDates.includes(b.date));
        });
        await db.saveAppState(state);
      }
    }
  }

  await cleanAllTestDates();

  // --- Test 1: Anytime 100% Full Refund & Integer Paise Math ---
  test('Test 1: Anytime 100% refund policy across all windows and integer paise math', () => {
    // 1h boundary (60 min) -> 100%
    const tier1h = cancellation.getRefundTier(60);
    assert.strictEqual(tier1h.allowed, true, '60m must be allowed');
    assert.strictEqual(tier1h.refundPct, 100, 'Must yield 100% full refund');

    // 1h 59m boundary (119 min) -> 100%
    const tier1h59 = cancellation.getRefundTier(119);
    assert.strictEqual(tier1h59.allowed, true, '119m must be allowed');
    assert.strictEqual(tier1h59.refundPct, 100, '119m must yield 100% full refund');

    // 2h boundary (120 min) -> 100%
    const tier2h = cancellation.getRefundTier(120);
    assert.strictEqual(tier2h.allowed, true, '120m must be allowed');
    assert.strictEqual(tier2h.refundPct, 100, '2 whole hours must yield 100% refund');

    // 3h, 4h, 5h, 6h, 7h boundaries -> 100%
    assert.strictEqual(cancellation.getRefundTier(180).refundPct, 100, '3h must yield 100%');
    assert.strictEqual(cancellation.getRefundTier(240).refundPct, 100, '4h must yield 100%');
    assert.strictEqual(cancellation.getRefundTier(300).refundPct, 100, '5h must yield 100%');
    assert.strictEqual(cancellation.getRefundTier(360).refundPct, 100, '6h must yield 100%');
    assert.strictEqual(cancellation.getRefundTier(420).refundPct, 100, '7h must yield 100%');
    assert.strictEqual(cancellation.getRefundTier(720).refundPct, 100, '12h must yield 100%');

    // Integer paise calculations on ₹1,500.00 (150,000 paise) -> 100% refund
    const testBookingPaid = {
      id: 'BKG-T1',
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '11:00',
      cost: 1500,
      amountPaise: 150000
    };

    const clock2h = new Date('2026-11-20T08:00:00+05:30');
    const quote2h = cancellation.calculateRefundQuote(testBookingPaid, clock2h);
    assert.strictEqual(quote2h.allowed, true);
    assert.strictEqual(quote2h.refundPct, 100);
    assert.strictEqual(quote2h.amountPaise, 150000);
    assert.strictEqual(quote2h.refundPaise, 150000, '100% of 150000 paise is 150000 paise (₹1500)');
    assert.strictEqual(quote2h.feePaise, 0, 'Fee kept is 0 paise (₹0)');
    assert.strictEqual(quote2h.refundRupees, 1500);
    assert.strictEqual(cancellation.formatPaiseToINR(quote2h.refundPaise), '₹1,500.00');

    // Non-round amount check: ₹999.00 (99,900 paise) at 100%
    const testOdd = { date: '2026-11-20', startTime: '10:00', cost: 999 };
    const clock1h = new Date('2026-11-20T09:00:00+05:30');
    const quoteOdd = cancellation.calculateRefundQuote(testOdd, clock1h);
    assert.strictEqual(quoteOdd.refundPaise, 99900);
    assert.strictEqual(quoteOdd.feePaise, 0);
  });

  // --- Test 2: Anytime Cancellation (Allowed even under 1 hour with 100% full refund) ---
  await testAsync('Test 2: Anytime cancellation allowed under 1 hour (< 60m) with 100% full refund', async () => {
    // Policy helper check
    const tier59 = cancellation.getRefundTier(59);
    assert.strictEqual(tier59.allowed, true, '59m must be allowed');
    assert.strictEqual(tier59.refundPct, 100, '59m must yield 100% refund');

    const tier0 = cancellation.getRefundTier(0);
    assert.strictEqual(tier0.allowed, true, '0m must be allowed');
    assert.strictEqual(tier0.refundPct, 100, '0m must yield 100% refund');

    // Ensure clean state for test date
    await cleanAllTestDates();

    // Server-side cancelBooking verification with mock clock 40 minutes before start
    const roomId = 'MR-01';
    const date = '2026-11-21';
    const startTime = '14:00';
    const endTime = '15:00';

    const bookRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      title: 'Under 1h Test Meeting',
      date,
      startTime,
      endTime,
      attendees: 4,
      cost: 1000
    });
    assert.strictEqual(bookRes.ok, true);
    const testBookingId = bookRes.booking.id;

    // Clock set to 13:20 (40 mins before start)
    const clock40m = new Date('2026-11-21T13:20:00+05:30');
    const cancelRes = await db.cancelBooking({
      roomId,
      bookingId: testBookingId,
      requestingStartupId: 'STP-01',
      userRole: 'founder',
      currentClock: clock40m
    });

    assert.strictEqual(cancelRes.ok, true, 'Server must allow cancellation under 1 hour');
    assert.strictEqual(cancelRes.status, 200, 'HTTP status must be 200 OK');
    assert.strictEqual(cancelRes.quote.refundPct, 100, 'Refund percent must be 100%');
    assert.strictEqual(cancelRes.quote.refundRupees, 1000, 'Full ₹1000 refunded');

    // Clean up test booking
    const stateClean = await db.getAppState();
    const rClean = stateClean.meetingRooms.find(r => r.id === roomId);
    if (rClean) {
      rClean.bookings = (rClean.bookings || []).filter(b => b.id !== testBookingId);
    }
    stateClean.cancellations = (stateClean.cancellations || []).filter(c => c.bookingId !== testBookingId);
    stateClean.payments = (stateClean.payments || []).filter(p => p.bookingId !== testBookingId);
    await db.saveAppState(stateClean);
  });

  // --- Test 3: Double-Click / Repeat Cancel Protection (Confirmed -> Cancelled only once) ---
  await testAsync('Test 3: Double-click cancels once only (idempotent / 409 conflict)', async () => {
    const roomId = 'MR-01';
    const date = '2026-11-22';
    const startTime = '10:00';
    const endTime = '11:00';

    const bookRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      title: 'Double Cancellation Guard Test',
      date,
      startTime,
      endTime,
      attendees: 4,
      cost: 1500
    });
    assert.strictEqual(bookRes.ok, true);
    const testBookingId = bookRes.booking.id;

    // Future clock 5 hours before (05:00 IST -> 100% refund)
    const clock5h = new Date('2026-11-22T05:00:00+05:30');

    // First cancellation call
    const firstRes = await db.cancelBooking({
      roomId,
      bookingId: testBookingId,
      requestingStartupId: 'STP-01',
      userRole: 'founder',
      currentClock: clock5h
    });

    assert.strictEqual(firstRes.ok, true, 'First cancellation must succeed');
    assert.strictEqual(firstRes.status, 200);
    assert.strictEqual(firstRes.quote.refundPct, 100, 'Must be 100% refund');
    assert.strictEqual(firstRes.quote.refundRupees, 1500, '100% of ₹1500 is ₹1500');
    assert.strictEqual(firstRes.cancellation.bookingId, testBookingId);

    // Second call immediately with same bookingId (simulating rapid double-click)
    const secondRes = await db.cancelBooking({
      roomId,
      bookingId: testBookingId,
      requestingStartupId: 'STP-01',
      userRole: 'founder',
      currentClock: clock5h
    });

    assert.strictEqual(secondRes.ok, false, 'Second cancellation must be rejected');
    assert.strictEqual(secondRes.status, 409, 'Double cancellation must return 409 Conflict');
    assert.strictEqual(secondRes.code, 'ALREADY_CANCELLED', 'Code must be ALREADY_CANCELLED');
  });

  // --- Test 4: Another Startup Cannot Cancel (Unauthorized Rejection) ---
  await testAsync('Test 4: Another startup cannot cancel someone else\'s booking (403 Forbidden)', async () => {
    const roomId = 'MR-01';
    const date = '2026-11-23';
    const startTime = '15:00';
    const endTime = '16:00';

    const bookRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      startupId: 'STP-01', // Owned by NeuroPulse AI
      startupName: 'NeuroPulse AI',
      title: 'Confidential Strategy Sync',
      date,
      startTime,
      endTime,
      attendees: 4,
      cost: 1500
    });
    assert.strictEqual(bookRes.ok, true);
    const testBookingId = bookRes.booking.id;

    // Startup STP-02 (AeroKite Dynamics) attempts to cancel
    const clock = new Date('2026-11-23T10:00:00+05:30');
    const unauthorizedRes = await db.cancelBooking({
      roomId,
      bookingId: testBookingId,
      requestingStartupId: 'STP-02', // Different startup
      userRole: 'founder',
      currentClock: clock
    });

    assert.strictEqual(unauthorizedRes.ok, false, 'Unauthorized cancel must be rejected');
    assert.strictEqual(unauthorizedRes.status, 403, 'Must return 403 Forbidden');
    assert.strictEqual(unauthorizedRes.code, 'UNAUTHORIZED');

    // Admin CAN cancel on behalf of startup
    const adminRes = await db.cancelBooking({
      roomId,
      bookingId: testBookingId,
      requestingStartupId: 'STP-02', // Even if mismatched, admin role allows
      userRole: 'admin',
      currentClock: clock
    });
    assert.strictEqual(adminRes.ok, true, 'Admin must be authorized to cancel');

    // Clean up
    const stateClean = await db.getAppState();
    const rClean = stateClean.meetingRooms.find(r => r.id === roomId);
    rClean.bookings = (rClean.bookings || []).filter(b => b.id !== testBookingId);
    stateClean.cancellations = (stateClean.cancellations || []).filter(c => c.bookingId !== testBookingId);
    stateClean.payments = (stateClean.payments || []).filter(p => p.bookingId !== testBookingId);
    await db.saveAppState(stateClean);
  });

  // --- Test 5: Slot is Free Again After Cancellation ---
  await testAsync('Test 5: Slot is immediately free for rebooking after cancellation', async () => {
    const roomId = 'MR-01'; // Boardroom Alpha
    const date = '2026-11-24';
    const startTime = '16:00';
    const endTime = '17:00';

    // 1. Initial reservation
    const initialRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      date,
      startTime,
      endTime,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      attendees: 4,
      cost: 1500
    });
    assert.strictEqual(initialRes.ok, true, 'Initial reservation must succeed');
    const bookingId = initialRes.booking.id;

    // 2. Immediate overlapping attempt should fail with 409 SLOT_TAKEN
    const conflictRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      date,
      startTime,
      endTime,
      startupId: 'STP-02',
      startupName: 'AeroKite Dynamics',
      attendees: 4
    });
    assert.strictEqual(conflictRes.ok, false, 'Overlap before cancel must be rejected');
    assert.strictEqual(conflictRes.code, 'SLOT_TAKEN');

    // 3. Cancel the booking (clock set 24h before)
    const clock = new Date('2026-11-23T16:00:00+05:30');
    const cancelRes = await db.cancelBooking({
      roomId,
      bookingId,
      requestingStartupId: 'STP-01',
      userRole: 'founder',
      currentClock: clock
    });
    assert.strictEqual(cancelRes.ok, true, 'Cancellation must succeed');

    // 4. Rebooking the exact same slot must now succeed!
    const rebookRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      date,
      startTime,
      endTime,
      startupId: 'STP-02',
      startupName: 'AeroKite Dynamics',
      attendees: 4,
      cost: 1500
    });
    assert.strictEqual(rebookRes.ok, true, 'Rebooking freed slot must succeed immediately');

    // Clean up rebooked slot
    await db.cancelBooking({
      roomId,
      bookingId: rebookRes.booking.id,
      userRole: 'admin',
      currentClock: clock
    });

    const finalState = await db.getAppState();
    const rFinal = finalState.meetingRooms.find(r => r.id === roomId);
    rFinal.bookings = (rFinal.bookings || []).filter(b => b.date !== date);
    finalState.cancellations = (finalState.cancellations || []).filter(c => c.bookingId !== bookingId && c.bookingId !== rebookRes.booking.id);
    finalState.payments = (finalState.payments || []).filter(p => p.bookingId !== bookingId && p.bookingId !== rebookRes.booking.id);
    await db.saveAppState(finalState);
  });

  // --- Test 6: Refund Appears in Payments Ledger and Subtracts from Dashboard Summary ---
  await testAsync('Test 6: Refund appears in payments ledger and subtracts from dashboard totals', async () => {
    const roomId = 'MR-01';
    const date = '2026-11-26';
    const startTime = '10:00';
    const endTime = '11:00';

    // Baseline dashboard summary
    const summaryBefore = await db.getDashboardSummary('2026-11');
    const collectedBefore = summaryBefore.collected.value;

    // Create a confirmed paid booking (₹1500)
    const bookRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      date,
      startTime,
      endTime,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      attendees: 4,
      cost: 1500
    });
    assert.strictEqual(bookRes.ok, true);
    const bookingId = bookRes.booking.id;

    // Clock set to 2 hours before start: 100% full refund
    // Refund = 100% of ₹1500 = ₹1500.00
    const clock5h = new Date('2026-11-26T08:00:00+05:30');
    const cancelRes = await db.cancelBooking({
      roomId,
      bookingId,
      requestingStartupId: 'STP-01',
      userRole: 'founder',
      currentClock: clock5h
    });

    assert.strictEqual(cancelRes.ok, true);
    assert.strictEqual(cancelRes.quote.refundRupees, 1500);
    assert.strictEqual(cancelRes.quote.refundPct, 100);
    assert.ok(cancelRes.refundId, 'Refund ID must be generated and returned');

    // Check payments ledger
    const appState = await db.getAppState();
    const refundPayment = (appState.payments || []).find(p => p.bookingId === bookingId && p.type === 'Refund');
    assert.ok(refundPayment, 'Refund entry must appear in payments ledger');
    assert.strictEqual(refundPayment.amount, -1500, 'Refund amount in ledger must be negative (-1500)');
    assert.strictEqual(refundPayment.status, 'Successful');
    assert.strictEqual(refundPayment.transactionRef, cancelRes.refundId);

    // Check dashboard summary reflects deduction
    const summaryAfter = await db.getDashboardSummary('2026-11');
    assert.strictEqual(summaryAfter.collected.value, collectedBefore - 1500, 'Dashboard collected total must subtract refund (-₹1500)');

    // Clean up test booking & ledger
    const cleanState = await db.getAppState();
    const rClean = cleanState.meetingRooms.find(r => r.id === roomId);
    rClean.bookings = (rClean.bookings || []).filter(b => b.id !== bookingId);
    cleanState.cancellations = (cleanState.cancellations || []).filter(c => c.bookingId !== bookingId);
    cleanState.payments = (cleanState.payments || []).filter(p => p.bookingId !== bookingId);
    await db.saveAppState(cleanState);
  });

  // --- Test 7: Completed Meeting Cancellation Validation (Disabled in UI & Rejected in Backend) ---
  await testAsync('Test 7: Completed meetings cannot be cancelled (disabled in UI & rejected with 400 MEETING_COMPLETED)', async () => {
    const roomId = 'MR-01';
    const date = '2026-11-25';
    const startTime = '09:00';
    const endTime = '10:00';

    const bookRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      date,
      startTime,
      endTime,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      attendees: 4,
      cost: 1500
    });
    assert.strictEqual(bookRes.ok, true);
    const booking = bookRes.booking;

    // Clock set AFTER the meeting end time (e.g., 10:05 IST on 2026-11-25)
    const clockAfterEnd = new Date('2026-11-25T10:05:00+05:30');
    assert.strictEqual(cancellation.isBookingCompleted(booking, clockAfterEnd), true, 'Booking must be marked completed after endTime');

    const quoteAfterEnd = cancellation.calculateRefundQuote(booking, clockAfterEnd);
    assert.strictEqual(quoteAfterEnd.allowed, false, 'Refund quote must disallow cancelling completed meeting');
    assert.strictEqual(quoteAfterEnd.isCompleted, true);

    // UI cell helper must render a disabled Completed button
    const cellHtml = cancellation.cancellationCell(booking, { id: 'STP-01', name: 'NeuroPulse AI' }, 'founder', clockAfterEnd);
    assert.ok(cellHtml.includes('disabled'), 'Completed meeting cell must render a disabled button');
    assert.ok(cellHtml.includes('Completed'), 'Completed meeting cell must indicate Completed status');

    // Backend cancelBooking must reject with 400 MEETING_COMPLETED and NOT release or cancel the booking
    const cancelRes = await db.cancelBooking({
      roomId,
      bookingId: booking.id,
      requestingStartupId: 'STP-01',
      userRole: 'founder',
      currentClock: clockAfterEnd
    });
    assert.strictEqual(cancelRes.ok, false, 'Backend must reject cancelling a completed meeting');
    assert.strictEqual(cancelRes.status, 400);
    assert.strictEqual(cancelRes.code, 'MEETING_COMPLETED');

    // Clean up test booking
    const cleanState = await db.getAppState();
    const rClean = cleanState.meetingRooms.find(r => r.id === roomId);
    rClean.bookings = (rClean.bookings || []).filter(b => b.id !== booking.id);
    await db.saveAppState(cleanState);
  });

  console.log('\n========================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
