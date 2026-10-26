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

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
