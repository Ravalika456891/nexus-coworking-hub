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

  async function cleanDate(date) {
    const database = await db.connectDB();
    if (database) {
      await database.collection('meeting_room_slots').deleteMany({ date });
      const state = await db.getAppState();
      if (state && state.meetingRooms) {
        state.meetingRooms.forEach(r => {
          r.bookings = (r.bookings || []).filter(b => b.date !== date);
        });
        await db.saveAppState(state);
      }
    }
  }

  // --- Test 1: Tier Boundaries & Integer Paise Math ---
  test('Test 1: Refund tier boundaries (1h, 1h59, 2h, 7h) and integer paise math', () => {
    // 1h boundary (60 min) -> 20%
    const tier1h = cancellation.getRefundTier(60);
    assert.strictEqual(tier1h.allowed, true, '60m must be allowed');
    assert.strictEqual(tier1h.wholeHours, 1, '60m is 1 whole hour');
    assert.strictEqual(tier1h.refundPct, 20, '1 whole hour must yield 20% refund');

    // 1h 59m boundary (119 min) -> 20%
    const tier1h59 = cancellation.getRefundTier(119);
    assert.strictEqual(tier1h59.allowed, true, '119m must be allowed');
    assert.strictEqual(tier1h59.wholeHours, 1, '119m is 1 whole hour');
    assert.strictEqual(tier1h59.refundPct, 20, '119m must still yield 20% refund');

    // 2h boundary (120 min) -> 30%
    const tier2h = cancellation.getRefundTier(120);
    assert.strictEqual(tier2h.allowed, true, '120m must be allowed');
    assert.strictEqual(tier2h.wholeHours, 2, '120m is 2 whole hours');
    assert.strictEqual(tier2h.refundPct, 30, '2 whole hours must yield 30% refund');

    // 3h boundary (180 min) -> 40%
    assert.strictEqual(cancellation.getRefundTier(180).refundPct, 40, '3h must yield 40%');

    // 4h boundary (240 min) -> 50%
    assert.strictEqual(cancellation.getRefundTier(240).refundPct, 50, '4h must yield 50%');

    // 5h boundary (300 min) -> 60%
    assert.strictEqual(cancellation.getRefundTier(300).refundPct, 60, '5h must yield 60%');

    // 6h boundary (360 min) -> 70%
    assert.strictEqual(cancellation.getRefundTier(360).refundPct, 70, '6h must yield 70%');

    // 7h boundary (420 min) -> 80%
    const tier7h = cancellation.getRefundTier(420);
    assert.strictEqual(tier7h.allowed, true, '420m must be allowed');
    assert.strictEqual(tier7h.wholeHours, 7, '420m is 7 whole hours');
    assert.strictEqual(tier7h.refundPct, 80, '7 whole hours must yield 80% refund');

    // >7h (720 min / 12h) -> 80%
    assert.strictEqual(cancellation.getRefundTier(720).refundPct, 80, '12h must yield 80%');

    // Integer paise calculations on ₹1,500.00 (150,000 paise)
    const testBookingPaid = {
      id: 'BKG-T1',
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '11:00',
      cost: 1500,
      amountPaise: 150000
    };

    // At 120m (2h, 30% tier):
    // start time is 2026-11-20T10:00:00+05:30
    // clock at 2026-11-20T08:00:00+05:30 (exactly 120m before)
    const clock2h = new Date('2026-11-20T08:00:00+05:30');
    const quote2h = cancellation.calculateRefundQuote(testBookingPaid, clock2h);
    assert.strictEqual(quote2h.allowed, true);
    assert.strictEqual(quote2h.wholeHours, 2);
    assert.strictEqual(quote2h.refundPct, 30);
    assert.strictEqual(quote2h.amountPaise, 150000);
    assert.strictEqual(quote2h.refundPaise, 45000, '30% of 150000 paise is 45000 paise (₹450)');
    assert.strictEqual(quote2h.feePaise, 105000, 'Fee kept is 105000 paise (₹1050)');
    assert.strictEqual(quote2h.refundRupees, 450);
    assert.strictEqual(cancellation.formatPaiseToINR(quote2h.refundPaise), '₹450.00');

    // Floor check with non-round division: ₹999.00 (99,900 paise) at 20%
    const testOdd = { date: '2026-11-20', startTime: '10:00', cost: 999 };
    const clock1h = new Date('2026-11-20T09:00:00+05:30');
    const quoteOdd = cancellation.calculateRefundQuote(testOdd, clock1h);
    assert.strictEqual(quoteOdd.refundPaise, Math.floor(99900 * 20 / 100));
  });

  // --- Test 2: Closed Under 1 Hour (< 60 minutes) ---
  await testAsync('Test 2: Cancellation is closed under 1 hour (< 60m disallowed)', async () => {
    // Policy helper check
    const tier59 = cancellation.getRefundTier(59);
    assert.strictEqual(tier59.allowed, false, '59m must NOT be allowed');
    assert.strictEqual(tier59.refundPct, 0, 'Refund percent is 0 when disallowed');

    const tier0 = cancellation.getRefundTier(0);
    assert.strictEqual(tier0.allowed, false, '0m must NOT be allowed');

    const tierPast = cancellation.getRefundTier(-30);
    assert.strictEqual(tierPast.allowed, false, 'Past start time must NOT be allowed');

    // Server-side cancelBooking verification with mock clock 40 minutes before start
    const roomId = 'MR-01';
    const date = '2026-11-21';
    const startTime = '14:00';
    const endTime = '15:00';
    await cleanDate(date);

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

    assert.strictEqual(cancelRes.ok, false, 'Server must reject cancellation under 1 hour');
    assert.strictEqual(cancelRes.status, 400, 'HTTP status must be 400 Bad Request');
    assert.strictEqual(cancelRes.code, 'CANCELLATION_DISALLOWED', 'Code must be CANCELLATION_DISALLOWED');

    // Clean up test booking via admin override
    await db.cancelBooking({ roomId, bookingId: testBookingId, userRole: 'admin', currentClock: clock40m });
    await cleanDate(date);
  });

  // --- Test 3: Double-Click / Repeat Cancel Protection (Confirmed -> Cancelled only once) ---
  await testAsync('Test 3: Double-click cancels once only (idempotent / 409 conflict)', async () => {
    const roomId = 'MR-01';
    const date = '2026-11-22';
    const startTime = '10:00';
    const endTime = '11:00';
    await cleanDate(date);

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

    // Future clock 5 hours before (05:00 IST -> 5h tier = 60%)
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
    assert.strictEqual(firstRes.quote.refundPct, 60, '5 hours left must be 60% refund');
    assert.strictEqual(firstRes.quote.refundRupees, 900, '60% of ₹1500 is ₹900');
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

    // Clean up
    await cleanDate(date);
  });

  // --- Test 4: Another Startup Cannot Cancel (Unauthorized Rejection) ---
  await testAsync('Test 4: Another startup cannot cancel someone else\'s booking (403 Forbidden)', async () => {
    const roomId = 'MR-01';
    const date = '2026-11-23';
    const startTime = '15:00';
    const endTime = '16:00';
    await cleanDate(date);

    const bookRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      startupId: 'STP-01', // Owned by NeuroPulse AI
      startupName: 'NeuroPulse AI',
      title: 'Confidential Strategy Sync',
      date,
      startTime,
      endTime,
      attendees: 6,
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
    await cleanDate(date);

    // 1. Initial reservation
    const initialRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId,
      date,
      startTime,
      endTime,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      attendees: 5,
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
      attendees: 5
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
      attendees: 5,
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
    const date = '2026-10-30';
    const startTime = '17:00';
    const endTime = '18:00';
    await cleanDate(date);

    // Baseline dashboard summary
    const summaryBefore = await db.getDashboardSummary('2026-10');
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

    // Clock set to 5 hours before start:
    // 5 whole hours left -> 60% refund tier
    // Refund = floor(1500 * 60 / 100) = ₹900.00
    const clock5h = new Date('2026-10-30T12:00:00+05:30');
    const cancelRes = await db.cancelBooking({
      roomId,
      bookingId,
      requestingStartupId: 'STP-01',
      userRole: 'founder',
      currentClock: clock5h
    });

    assert.strictEqual(cancelRes.ok, true);
    assert.strictEqual(cancelRes.quote.refundRupees, 900);
    assert.ok(cancelRes.refundId, 'Refund ID must be generated and returned');

    // Check payments ledger
    const appState = await db.getAppState();
    const refundPayment = (appState.payments || []).find(p => p.bookingId === bookingId && p.type === 'Refund');
    assert.ok(refundPayment, 'Refund entry must appear in payments ledger');
    assert.strictEqual(refundPayment.amount, -900, 'Refund amount in ledger must be negative (-900)');
    assert.strictEqual(refundPayment.status, 'Successful');
    assert.strictEqual(refundPayment.transactionRef, cancelRes.refundId);

    // Check dashboard summary reflects deduction
    const summaryAfter = await db.getDashboardSummary('2026-10');
    assert.strictEqual(summaryAfter.collected.value, collectedBefore - 900, 'Dashboard collected total must subtract refund (-₹900)');

    // Clean up test booking & ledger
    const cleanState = await db.getAppState();
    const rClean = cleanState.meetingRooms.find(r => r.id === roomId);
    rClean.bookings = (rClean.bookings || []).filter(b => b.id !== bookingId);
    cleanState.cancellations = (cleanState.cancellations || []).filter(c => c.bookingId !== bookingId);
    cleanState.payments = (cleanState.payments || []).filter(p => p.bookingId !== bookingId);
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
