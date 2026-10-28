// Automated Test Suite: Meeting Room Double-Booking Prevention & Concurrency
const assert = require('assert');
const db = require('../db');

// Future test date safely beyond today to test pure scheduling logic
const TEST_DATE = '2026-11-15';
const TOMORROW_DATE = '2026-11-16';

async function runTests() {
  console.log('🧪 Starting Meeting Room Double-Booking & Conflict Test Suite...\n');
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

  // --- Test 1: Canonical Conflict Rule - Exact Slot Overlap ---
  test('Test 1: Exact slot overlap is detected and rejected', () => {
    const existing = { roomId: 'MR-01', date: TEST_DATE, startTime: '09:00', endTime: '10:00', status: 'Confirmed' };
    const newAttempt = { roomId: 'MR-01', date: TEST_DATE, startTime: '09:00', endTime: '10:00' };
    const conflict = db.hasBookingConflict(existing, newAttempt);
    assert.strictEqual(conflict, true, 'Exact slot overlap must conflict');
  });

  // --- Test 2: Canonical Conflict Rule - Partial Overlap ---
  test('Test 2: Partial overlap (09:00-11:00 vs 10:00-11:00 and custom 09:30-10:30) is rejected', () => {
    const existingLong = { roomId: 'MR-01', date: TEST_DATE, startTime: '09:00', endTime: '11:00', status: 'Confirmed' };
    const attemptInside = { roomId: 'MR-01', date: TEST_DATE, startTime: '10:00', endTime: '11:00' };
    assert.strictEqual(db.hasBookingConflict(existingLong, attemptInside), true, 'Contained slot must conflict');

    const existingOneHr = { roomId: 'MR-01', date: TEST_DATE, startTime: '09:00', endTime: '10:00', status: 'Confirmed' };
    const attemptCustom = { roomId: 'MR-01', date: TEST_DATE, startTime: '09:30', endTime: '10:30' };
    assert.strictEqual(db.hasBookingConflict(existingOneHr, attemptCustom), true, 'Custom fractional overlap must conflict');
  });

  // --- Test 3: Back-to-Back Bookings Allowed ---
  test('Test 3: Back-to-back bookings (09:00-10:00 and 10:00-11:00) are allowed', () => {
    const slot1 = { roomId: 'MR-01', date: TEST_DATE, startTime: '09:00', endTime: '10:00', status: 'Confirmed' };
    const slot2 = { roomId: 'MR-01', date: TEST_DATE, startTime: '10:00', endTime: '11:00' };
    assert.strictEqual(db.hasBookingConflict(slot1, slot2), false, 'Back-to-back bookings must NOT conflict');

    const afternoonSlot1 = { roomId: 'MR-01', date: TEST_DATE, startTime: '15:00', endTime: '16:00', status: 'Confirmed' };
    const afternoonSlot2 = { roomId: 'MR-01', date: TEST_DATE, startTime: '16:00', endTime: '17:00' };
    assert.strictEqual(db.hasBookingConflict(afternoonSlot1, afternoonSlot2), false, 'Afternoon back-to-back must NOT conflict');
  });

  // --- Test 4: Cancelled Bookings Free the Slot ---
  test('Test 4: Cancelled bookings do not count as conflicts', () => {
    const cancelled = { roomId: 'MR-01', date: TEST_DATE, startTime: '09:00', endTime: '10:00', status: 'Cancelled' };
    const newAttempt = { roomId: 'MR-01', date: TEST_DATE, startTime: '09:00', endTime: '10:00' };
    assert.strictEqual(db.hasBookingConflict(cancelled, newAttempt), false, 'Cancelled booking must NOT block new booking');
  });

  // --- Test 5: Same Startup Multi-Room Concurrent Conflict ---
  test('Test 5: Same startup concurrent multi-room booking conflict is detected', () => {
    const bookingInAlpha = {
      id: 'BKG-ALPHA',
      roomId: 'MR-01',
      startupId: 'STP-01',
      date: TEST_DATE,
      startTime: '09:00',
      endTime: '10:00',
      status: 'Confirmed'
    };

    // Same startup attempting to book Pitch Arena (MR-02) at the same overlapping time
    const attemptInArena = {
      roomId: 'MR-02',
      startupId: 'STP-01',
      date: TEST_DATE,
      startTime: '09:00',
      endTime: '10:00'
    };

    const conflict = db.hasStartupConcurrentConflict(bookingInAlpha, attemptInArena);
    assert.strictEqual(conflict, true, 'Startup cannot book two different rooms at the same time');
  });

  // --- Test 6: Past Date & Slot Rejection via IST Server Clock ---
  await testAsync('Test 6: Past slots / dates are rejected by server IST clock', async () => {
    const ist = db.getISTClock();
    assert.ok(ist.date, 'IST date must be present');
    assert.ok(ist.time, 'IST time must be present');

    // Attempting to book a date in the past
    const pastRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId: 'MR-01',
      startupId: 'STP-01',
      date: '2020-01-01',
      startTime: '09:00',
      endTime: '10:00'
    });
    assert.strictEqual(pastRes.ok, false, 'Past date must be rejected');
    assert.strictEqual(pastRes.status, 400);
    assert.ok(pastRes.message.includes('Cannot book past dates'));
  });

  // --- Test 7: Race Condition Prevention via Mutex Serialization ---
  await testAsync('Test 7: Race condition test - 2 simultaneous requests for same slot -> 1 succeeds, 1 fails with 409 & alternatives', async () => {
    const targetRoomId = 'MR-01';
    const targetDate = '2026-11-20';
    const targetStart = '09:00';
    const targetEnd = '10:00';

    // Fire 2 concurrent reservation requests at the exact same millisecond
    const p1 = db.reserveMeetingRoomSlotsAtomic({
      roomId: targetRoomId,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      title: 'Parallel Request 1',
      date: targetDate,
      startTime: targetStart,
      endTime: targetEnd,
      attendees: 6
    });

    const p2 = db.reserveMeetingRoomSlotsAtomic({
      roomId: targetRoomId,
      startupId: 'STP-02',
      startupName: 'Solaris Robotics',
      title: 'Parallel Request 2',
      date: targetDate,
      startTime: targetStart,
      endTime: targetEnd,
      attendees: 8
    });

    const [res1, res2] = await Promise.all([p1, p2]);

    const successes = [res1, res2].filter(r => r.ok && r.status === 201);
    const conflicts = [res1, res2].filter(r => !r.ok && r.status === 409);

    assert.strictEqual(successes.length, 1, 'Exactly one concurrent booking request must succeed');
    assert.strictEqual(conflicts.length, 1, 'The competing concurrent request must be rejected with 409');
    assert.strictEqual(conflicts[0].code, 'SLOT_TAKEN', 'Rejected response must have code SLOT_TAKEN');
    assert.ok(conflicts[0].alternatives && conflicts[0].alternatives.length > 0, 'Rejected response must provide alternatives');

    // Clean up test booking
    const winningBooking = successes[0].booking;
    if (winningBooking) {
      await db.cancelMeetingRoomSlotsAtomic(targetRoomId, winningBooking.id);
    }
  });

  // --- Test 8: Alternatives Generator Quality Check ---
  test('Test 8: Alternatives generator provides up to 3 valid smart alternatives', () => {
    const mockRooms = [
      {
        id: 'MR-01',
        name: 'Boardroom Alpha',
        capacity: 16,
        hourlyRate: 1500,
        bookings: [
          { id: 'B-1', date: TEST_DATE, startTime: '09:00', endTime: '10:00', status: 'Confirmed' }
        ]
      },
      {
        id: 'MR-02',
        name: 'Pitch Arena Nexus',
        capacity: 35,
        hourlyRate: 3000,
        bookings: []
      }
    ];

    const alts = db.findBookingAlternatives(mockRooms, {
      roomId: 'MR-01',
      date: TEST_DATE,
      startTime: '09:00',
      endTime: '10:00',
      attendees: 10,
      startupId: 'STP-01'
    });

    assert.ok(Array.isArray(alts), 'Alternatives must be an array');
    assert.ok(alts.length >= 1 && alts.length <= 3, 'Must return 1 to 3 alternatives');
    // Pitch Arena is free at 09:00 and has capacity 35 >= 10
    const arenaAlt = alts.find(a => a.roomId === 'MR-02');
    assert.ok(arenaAlt, 'Should suggest Pitch Arena Nexus at the same time');
    assert.strictEqual(arenaAlt.startTime, '09:00');
  });

  // Helper to ensure clean date slots before testing
  async function cleanDateSlots(roomId, date) {
    const database = await db.connectDB();
    if (database) {
      await database.collection('meeting_room_slots').deleteMany({ roomId, date });
      const mrCol = database.collection('meeting_rooms');
      const mr = await mrCol.findOne({ id: roomId });
      if (mr) {
        const filtered = (mr.bookings || []).filter(b => b.date !== date);
        await mrCol.updateOne({ id: roomId }, { $set: { bookings: filtered } });
      }
      const appStateCol = database.collection('app_state');
      const doc = await appStateCol.findOne({ _id: 'current_state' });
      if (doc && doc.state && doc.state.meetingRooms) {
        const r = doc.state.meetingRooms.find(x => x.id === roomId);
        if (r) {
          r.bookings = (r.bookings || []).filter(b => b.date !== date);
          await appStateCol.updateOne({ _id: 'current_state' }, { $set: { 'state.meetingRooms': doc.state.meetingRooms } });
        }
      }
    }
  }

  // --- Test 9: User-Customized Arbitrary Time Window Booking & Minimum 15-min Enforcement ---
  await testAsync('Test 9: User can book customized flexible time window (e.g. 45 mins: 10:15 to 11:00)', async () => {
    const targetRoomId = 'MR-01';
    const targetDate = '2026-11-25';
    const customStart = '10:15';
    const customEnd = '11:00';

    await cleanDateSlots(targetRoomId, targetDate);

    const res = await db.reserveMeetingRoomSlotsAtomic({
      roomId: targetRoomId,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      title: 'Custom 45-Min Sprint',
      date: targetDate,
      startTime: customStart,
      endTime: customEnd,
      attendees: 5
    });

    assert.strictEqual(res.ok, true, 'Custom time window must succeed');
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.booking.startTime, '10:15');
    assert.strictEqual(res.booking.endTime, '11:00');

    // Attempting overlapping booking (10:30 - 11:30) must conflict and fail
    const conflictRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId: targetRoomId,
      startupId: 'STP-02',
      startupName: 'Solaris Robotics',
      title: 'Conflicting Custom Booking',
      date: targetDate,
      startTime: '10:30',
      endTime: '11:30',
      attendees: 4
    });
    assert.strictEqual(conflictRes.ok, false, 'Overlapping custom window must conflict');
    assert.strictEqual(conflictRes.status, 409);

    // Clean up
    await db.cancelMeetingRoomSlotsAtomic(targetRoomId, res.booking.id);
  });

  // --- Test 10: Dynamic Time Window Customization / Update for Existing Booking ---
  await testAsync('Test 10: User can customize / update time window of an existing booking atomically', async () => {
    const targetRoomId = 'MR-01';
    const targetDate = '2026-11-28';

    await cleanDateSlots(targetRoomId, targetDate);

    // 1. Initial 1-hour booking (09:00 - 10:00)
    const initial = await db.reserveMeetingRoomSlotsAtomic({
      roomId: targetRoomId,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      title: 'Executive Sync',
      date: targetDate,
      startTime: '09:00',
      endTime: '10:00',
      attendees: 6
    });
    assert.strictEqual(initial.ok, true);

    // 2. User customizes time window to 09:00 - 10:45 (1h 45m)
    const updateRes = await db.updateMeetingRoomBookingTimeWindowAtomic({
      roomId: targetRoomId,
      bookingId: initial.booking.id,
      date: targetDate,
      startTime: '09:00',
      endTime: '10:45'
    });
    assert.strictEqual(updateRes.ok, true, 'Customized update must succeed');
    assert.strictEqual(updateRes.booking.startTime, '09:00');
    assert.strictEqual(updateRes.booking.endTime, '10:45');

    // Clean up
    await db.cancelMeetingRoomSlotsAtomic(targetRoomId, initial.booking.id);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
