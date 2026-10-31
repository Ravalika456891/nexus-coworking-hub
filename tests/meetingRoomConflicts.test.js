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
      await database.collection('meeting_room_slots').deleteMany({ date });
      const mrCol = database.collection('meeting_rooms');
      const rooms = await mrCol.find({}).toArray();
      for (const r of rooms) {
        await mrCol.updateOne({ id: r.id }, { $set: { bookings: (r.bookings || []).filter(b => b.date !== date) } });
      }
      const appStateCol = database.collection('app_state');
      const doc = await appStateCol.findOne({ _id: 'current_state' });
      if (doc && doc.state && doc.state.meetingRooms) {
        doc.state.meetingRooms.forEach(r => {
          r.bookings = (r.bookings || []).filter(b => b.date !== date);
        });
        await appStateCol.updateOne({ _id: 'current_state' }, { $set: { 'state.meetingRooms': doc.state.meetingRooms } });
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

  // --- Test 11: 30-Minute & 60-Minute Bookings + Partial-Hour Slot Availability ---
  await testAsync('Test 11: Supports 30-min and 60-min bookings; partial-hour booking does not mark full hour as occupied', async () => {
    const targetRoomId = 'MR-01';
    const targetDate = '2026-11-29';
    await cleanDateSlots(targetRoomId, targetDate);

    // 1. Book first 30-minute half (09:00 - 09:30)
    const firstHalf = await db.reserveMeetingRoomSlotsAtomic({
      roomId: targetRoomId,
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      title: '30-Min Standup A',
      date: targetDate,
      startTime: '09:00',
      endTime: '09:30',
      attendees: 4
    });
    assert.strictEqual(firstHalf.ok, true, 'First 30-minute booking (09:00-09:30) must succeed');

    // Verify 09:00-10:00 hour is NOT marked as fully occupied because 09:30-10:00 is still open
    const stateAfterFirst = await db.getAppState();
    const roomAfterFirst = stateAfterFirst.meetingRooms.find(r => r.id === targetRoomId);
    const statusAfterFirst = db.computeRoomStatus(roomAfterFirst, targetDate, new Date('2026-11-20T09:00:00+05:30'), 'STP-01');
    assert.strictEqual(statusAfterFirst.openSlots, 7, 'Hour with only 30m booked must still have remaining 30m available (not marked fully occupied)');

    // 2. Overlapping partial-hour booking (09:15 - 09:45) must be rejected
    const overlapHalf = await db.reserveMeetingRoomSlotsAtomic({
      roomId: targetRoomId,
      startupId: 'STP-02',
      startupName: 'Solaris Robotics',
      title: 'Overlapping 30-Min',
      date: targetDate,
      startTime: '09:15',
      endTime: '09:45',
      attendees: 4
    });
    assert.strictEqual(overlapHalf.ok, false, 'Overlapping 30-min booking (09:15-09:45) must be rejected');
    assert.strictEqual(overlapHalf.status, 409);

    // 3. Second non-overlapping 30-minute half (09:30 - 10:00) in the same hour must succeed!
    const secondHalf = await db.reserveMeetingRoomSlotsAtomic({
      roomId: targetRoomId,
      startupId: 'STP-02',
      startupName: 'Solaris Robotics',
      title: '30-Min Standup B',
      date: targetDate,
      startTime: '09:30',
      endTime: '10:00',
      attendees: 4
    });
    assert.strictEqual(secondHalf.ok, true, 'Adjacent 30-min booking (09:30-10:00) in the same hour must succeed');

    // Now the full 09:00-10:00 hour is occupied, so openSlots becomes 6 of 7
    const stateAfterSecond = await db.getAppState();
    const roomAfterSecond = stateAfterSecond.meetingRooms.find(r => r.id === targetRoomId);
    const statusAfterSecond = db.computeRoomStatus(roomAfterSecond, targetDate, new Date('2026-11-20T09:00:00+05:30'), 'STP-01');
    assert.strictEqual(statusAfterSecond.openSlots, 6, 'Once both 30-min halves are booked, that hour slot is fully occupied (6 of 7 open)');

    // Clean up
    await db.cancelMeetingRoomSlotsAtomic(targetRoomId, firstHalf.booking.id);
    await db.cancelMeetingRoomSlotsAtomic(targetRoomId, secondHalf.booking.id);
  });

  // --- Test 12: Under Maintenance Room Rejection & Clear Error Message ---
  await testAsync('Test 12: Room Under Maintenance rejects booking with clear error message', async () => {
    const targetRoomId = 'MR-01';
    const targetDate = '2026-11-29';
    const state = await db.getAppState();
    const room = state.meetingRooms.find(r => r.id === targetRoomId);
    const prevStatus = room.status;
    room.status = 'Under Maintenance';
    await db.saveAppState(state);

    try {
      const res = await db.reserveMeetingRoomSlotsAtomic({
        roomId: targetRoomId,
        startupId: 'STP-01',
        startupName: 'NeuroPulse AI',
        title: 'Maintenance Test',
        date: targetDate,
        startTime: '10:00',
        endTime: '11:00',
        attendees: 4
      });
      assert.strictEqual(res.ok, false, 'Under Maintenance room must reject bookings');
      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.code, 'ROOM_MAINTENANCE');
      assert.ok(res.message.toLowerCase().includes('maintenance'), 'Error message must clearly state the room is under maintenance');
    } finally {
      const restoreState = await db.getAppState();
      const restoreRoom = restoreState.meetingRooms.find(r => r.id === targetRoomId);
      if (restoreRoom) restoreRoom.status = prevStatus;
      await db.saveAppState(restoreState);
    }
  });

  // --- Test 13: Dynamic Room Statuses (Available Now, Available Later Today, Fully Booked, Closed for Today, Under Maintenance) ---
  test('Test 13: Dynamic room status engine computes all 5 statuses accurately using date, reservations, operating hours, and IST timezone', () => {
    const sampleDate = '2026-11-30';
    const baseRoom = {
      id: 'MR-01',
      name: 'Boardroom Alpha',
      status: 'Active',
      bookings: [
        { id: 'B1', date: sampleDate, startTime: '09:00', endTime: '10:00', startupId: 'STP-01', status: 'Confirmed' }
      ]
    };

    // 1. Available Now: Today at 08:15 IST (08:00-09:00 is free right now)
    const stAvailableNow = db.computeRoomStatus(baseRoom, sampleDate, new Date('2026-11-30T08:15:00+05:30'));
    assert.strictEqual(stAvailableNow.status, 'Available Now');

    // 2. Available Later Today: Today at 09:15 IST (09:00-10:00 is currently occupied, but 10:00-11:00 and afternoon slots are open)
    const stLaterDuringBusy = db.computeRoomStatus(baseRoom, sampleDate, new Date('2026-11-30T09:15:00+05:30'));
    assert.strictEqual(stLaterDuringBusy.status, 'Available Later Today');

    // Available Later Today during midday break (12:30 IST) when afternoon slots are open
    const stLaterMidday = db.computeRoomStatus(baseRoom, sampleDate, new Date('2026-11-30T12:30:00+05:30'));
    assert.strictEqual(stLaterMidday.status, 'Available Later Today');

    // 3. Fully Booked: All operating hours (08:00-11:00 and 15:00-19:00) booked
    const fullyBookedRoom = {
      id: 'MR-01',
      name: 'Boardroom Alpha',
      status: 'Active',
      bookings: [
        { id: 'BF1', date: sampleDate, startTime: '08:00', endTime: '11:00', startupId: 'STP-01', status: 'Confirmed' },
        { id: 'BF2', date: sampleDate, startTime: '15:00', endTime: '19:00', startupId: 'STP-02', status: 'Confirmed' }
      ]
    };
    const stFullyBooked = db.computeRoomStatus(fullyBookedRoom, sampleDate, new Date('2026-11-30T09:00:00+05:30'));
    assert.strictEqual(stFullyBooked.status, 'Fully Booked');
    assert.strictEqual(stFullyBooked.openSlots, 0);

    // 4. Closed for Today: After 19:00 IST (e.g., 19:30 IST) or on a past date
    const stClosedAfterHours = db.computeRoomStatus(baseRoom, sampleDate, new Date('2026-11-30T19:30:00+05:30'));
    assert.strictEqual(stClosedAfterHours.status, 'Closed for Today');

    const stClosedPastDate = db.computeRoomStatus(baseRoom, '2026-11-29', new Date('2026-11-30T10:00:00+05:30'));
    assert.strictEqual(stClosedPastDate.status, 'Closed for Today');

    // 5. Under Maintenance
    const maintRoom = { ...baseRoom, underMaintenance: true };
    const stMaint = db.computeRoomStatus(maintRoom, sampleDate, new Date('2026-11-30T10:00:00+05:30'));
    assert.strictEqual(stMaint.status, 'Under Maintenance');
    assert.strictEqual(stMaint.openSlots, 0);
  });

  // --- Test 14: Reservation Count Accuracy (Consistent Database Counts & Status/Date Filtering) ---
  await testAsync('Test 14: Reservation counts accurately calculate total, my bookings, other bookings, and available slots while excluding cancelled bookings', async () => {
    const targetDate = '2026-11-29';
    await cleanDateSlots('MR-01', targetDate);

    const beforeCounts = await db.getReservationCounts({
      date: targetDate,
      startupId: 'STP-01',
      currentClock: new Date('2026-11-20T09:00:00+05:30')
    });

    // Add 1 booking for STP-01 (My Booking) and 1 booking for STP-02 (Other Booking)
    const b1 = await db.reserveMeetingRoomSlotsAtomic({
      roomId: 'MR-01',
      startupId: 'STP-01',
      startupName: 'NeuroPulse AI',
      title: 'My Confirmed Session',
      date: targetDate,
      startTime: '08:00',
      endTime: '09:00',
      attendees: 4
    });
    const b2 = await db.reserveMeetingRoomSlotsAtomic({
      roomId: 'MR-01',
      startupId: 'STP-02',
      startupName: 'Solaris Robotics',
      title: 'Other Confirmed Session',
      date: targetDate,
      startTime: '10:00',
      endTime: '11:00',
      attendees: 4
    });
    assert.strictEqual(b1.ok && b2.ok, true);

    const duringCounts = await db.getReservationCounts({
      date: targetDate,
      startupId: 'STP-01',
      currentClock: new Date('2026-11-20T09:00:00+05:30')
    });

    assert.strictEqual(duringCounts.totalBookings, beforeCounts.totalBookings + 2, 'Total confirmed bookings must increase by 2');
    assert.strictEqual(duringCounts.myBookings, beforeCounts.myBookings + 1, 'My bookings must increase by 1');
    assert.strictEqual(duringCounts.otherBookings, beforeCounts.otherBookings + 1, 'Other bookings must increase by 1');
    assert.strictEqual(duringCounts.dateTotalBookings, beforeCounts.dateTotalBookings + 2, 'Date-filtered total bookings must equal 2');
    assert.strictEqual(duringCounts.dateMyBookings, beforeCounts.dateMyBookings + 1, 'Date-filtered my bookings must equal 1');
    assert.strictEqual(duringCounts.dateOtherBookings, beforeCounts.dateOtherBookings + 1, 'Date-filtered other bookings must equal 1');
    assert.strictEqual(duringCounts.availableSlots, beforeCounts.availableSlots - 2, 'Available slots on target date must decrease by 2');

    // Cancel b1 and verify counts immediately reflect only confirmed reservations
    await db.cancelBooking({
      roomId: 'MR-01',
      bookingId: b1.booking.id,
      requestingStartupId: 'STP-01',
      userRole: 'founder',
      currentClock: new Date('2026-11-20T09:00:00+05:30')
    });

    const afterCancelCounts = await db.getReservationCounts({
      date: targetDate,
      startupId: 'STP-01',
      currentClock: new Date('2026-11-20T09:00:00+05:30')
    });
    assert.strictEqual(afterCancelCounts.totalBookings, beforeCounts.totalBookings + 1, 'Cancelled booking must be excluded from total confirmed count');
    assert.strictEqual(afterCancelCounts.dateMyBookings, beforeCounts.dateMyBookings, 'Cancelled booking must be excluded from dateMyBookings');
    assert.strictEqual(afterCancelCounts.availableSlots, beforeCounts.availableSlots - 1, 'Available slots must immediately increase by 1 after cancellation');

    // Clean up b2 and test artefacts
    await db.cancelMeetingRoomSlotsAtomic('MR-01', b2.booking.id);
    await cleanDateSlots('MR-01', targetDate);
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
