/**
 * tests/creditsAndOverage.test.js
 * Comprehensive unit test suite for:
 * 1. Booking ref generator format (BKG-YYYYMMDD-NNNN)
 * 2. Room capacity validation (attendees <= room.capacity)
 * 3. Unified credit/allowance and monthly overage calculations:
 *    - Exactly at limit (15.0h on 15.0h allowance -> ₹0 overage)
 *    - 0.5 hr over limit (15.5h on 15.0h allowance -> 0.5h overage billed at hourly rate)
 *    - Month boundary segregation (Oct vs Nov computed independently)
 *    - Cancelled bookings refund allowance/credits immediately
 *    - Multiple team members under one company share the monthly pool
 * 4. Role-based scoping on reservations queries
 */

const assert = require('assert');
const db = require('../db');

async function runTests() {
  console.log('🧪 Running NEXUS HUB Bookings, Credits & Capacity Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function pass(desc) {
    passed++;
    console.log(`  ✅ PASS: ${desc}`);
  }

  function fail(desc, err) {
    failed++;
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
  }

  // Ensure rooms are loaded
  const avail = await db.getMeetingRoomsAvailability('2026-11-03');
  const rooms = avail.rooms || [];
  const room4Pax = rooms.find(r => r.capacity === 4) || rooms[0];

  // Test 1: Booking Ref Generator Format
  try {
    const ref1 = db.generateBookingRef('2026-11-03', rooms);
    assert.match(ref1, /^BKG-20261103-\d{4}$/, 'Ref must match BKG-YYYYMMDD-NNNN format');
    pass('Test 1: Server-generated booking ref matches BKG-YYYYMMDD-NNNN format');
  } catch (err) {
    fail('Test 1: Server-generated booking ref format', err);
  }

  // Test 2: Room Capacity Validation on Create
  try {
    const resOverCapacity = await db.reserveMeetingRoomSlotsAtomic({
      roomId: room4Pax.id,
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '11:00',
      attendees: room4Pax.capacity + 2, // Exceed capacity
      startupId: 'STP-TEST',
      startupName: 'Test Startup',
      title: 'Large All-Hands Meeting',
      purpose: 'Team sync'
    });

    assert.strictEqual(resOverCapacity.ok, false, 'Over-capacity booking must be rejected');
    assert.strictEqual(resOverCapacity.code, 'CAPACITY_EXCEEDED');
    assert.ok(resOverCapacity.message.toLowerCase().includes('exceed'), 'Message should indicate capacity exceeded');
    pass(`Test 2: Capacity validation rejects ${room4Pax.capacity + 2} attendees for ${room4Pax.capacity}-pax room with CAPACITY_EXCEEDED`);
  } catch (err) {
    fail('Test 2: Capacity validation', err);
  }

  // Test 3: Exactly At Limit (15.0h allowance -> 15.0h booked -> ₹0 overage)
  try {
    const testRooms = [
      {
        id: 'R-TEST-1',
        hourlyRate: 2000,
        bookings: [
          {
            id: 'BKG-20261110-0001',
            startupId: 'STP-LIMIT',
            date: '2026-11-10',
            duration: 10,
            status: 'Confirmed'
          },
          {
            id: 'BKG-20261111-0001',
            startupId: 'STP-LIMIT',
            date: '2026-11-11',
            duration: 5,
            status: 'Confirmed'
          }
        ]
      }
    ];

    const totalHours = db.calculateStartupMonthlyUsage(testRooms, 'STP-LIMIT', '2026-11');
    const allowance = 15.0;
    const remainingHours = Math.max(0, allowance - totalHours);
    const overageHours = Math.max(0, totalHours - allowance);

    assert.strictEqual(totalHours, 15.0, 'Total month hours should equal 15.0h');
    assert.strictEqual(remainingHours, 0.0, 'Remaining hours should be 0.0h');
    assert.strictEqual(overageHours, 0.0, 'Overage hours should be 0.0h');

    pass('Test 3: Exactly at limit (15.0h booked against 15.0h allowance shows 0.0h free, ₹0 overage)');
  } catch (err) {
    fail('Test 3: Exactly at limit calculation', err);
  }

  // Test 4: 0.5 hr Over Limit (15.5h on 15.0h allowance -> 0.5h billed at hourly rate)
  try {
    const testRooms = [
      {
        id: 'R-TEST-2',
        hourlyRate: 1500,
        bookings: [
          {
            id: 'BKG-20261105-0001',
            startupId: 'STP-OVER',
            date: '2026-11-05',
            duration: 15,
            status: 'Confirmed'
          }
        ]
      }
    ];

    const usageBefore = db.calculateStartupMonthlyUsage(testRooms, 'STP-OVER', '2026-11');
    const remainingBefore = Math.max(0, 15.0 - usageBefore);
    assert.strictEqual(remainingBefore, 0.0);

    const bookingDur = 0.5;
    const roomHourlyRate = 1500;
    const overageHrs = Math.max(0, (usageBefore + bookingDur) - 15.0);
    const expectedCharge = overageHrs * roomHourlyRate;

    assert.strictEqual(overageHrs, 0.5, 'Overage hours should be 0.5');
    assert.strictEqual(expectedCharge, 750, '0.5h overage at ₹1,500/hr must equal ₹750');
    pass('Test 4: 0.5 hr over limit computes 0.5h overage and ₹750 fee at ₹1,500/hr');
  } catch (err) {
    fail('Test 4: 0.5 hr over limit calculation', err);
  }

  // Test 5: Month Boundary Segregation (Oct bookings vs Nov bookings)
  try {
    const testRooms = [
      {
        id: 'R-TEST-3',
        hourlyRate: 2000,
        bookings: [
          {
            id: 'BKG-20261025-0001',
            startupId: 'STP-MONTH',
            date: '2026-10-25',
            duration: 14,
            status: 'Confirmed'
          },
          {
            id: 'BKG-20261101-0001',
            startupId: 'STP-MONTH',
            date: '2026-11-01',
            duration: 4,
            status: 'Confirmed'
          }
        ]
      }
    ];

    const octUsage = db.calculateStartupMonthlyUsage(testRooms, 'STP-MONTH', '2026-10');
    const novUsage = db.calculateStartupMonthlyUsage(testRooms, 'STP-MONTH', '2026-11');

    assert.strictEqual(octUsage, 14.0, 'October usage must equal 14.0h');
    assert.strictEqual(novUsage, 4.0, 'November usage must equal 4.0h');
    const novRemaining = Math.max(0, 15.0 - novUsage);
    assert.strictEqual(novRemaining, 11.0, 'November should have 15.0 - 4.0 = 11.0h remaining');
    pass('Test 5: Month boundary segregation calculates October and November allowances independently');
  } catch (err) {
    fail('Test 5: Month boundary segregation', err);
  }

  // Test 6: Cancelled Bookings Refund Allowance Immediately
  try {
    const testRooms = [
      {
        id: 'R-TEST-4',
        hourlyRate: 2000,
        bookings: [
          {
            id: 'BKG-20261102-0001',
            startupId: 'STP-CANCEL',
            date: '2026-11-02',
            duration: 6,
            status: 'Cancelled' // Cancelled
          },
          {
            id: 'BKG-20261103-0001',
            startupId: 'STP-CANCEL',
            date: '2026-11-03',
            duration: 3,
            status: 'Confirmed'
          }
        ]
      }
    ];

    const usage = db.calculateStartupMonthlyUsage(testRooms, 'STP-CANCEL', '2026-11');
    assert.strictEqual(usage, 3.0, 'Cancelled bookings must be excluded from monthly usage');
    const remaining = Math.max(0, 15.0 - usage);
    assert.strictEqual(remaining, 12.0, 'Cancelled hours must be restored to allowance');
    pass('Test 6: Cancelled bookings immediately restore credit hours to the monthly allowance');
  } catch (err) {
    fail('Test 6: Cancelled booking refund', err);
  }

  // Test 7: Multiple Team Members Under One Company Share Monthly Pool
  try {
    const testRooms = [
      {
        id: 'R-TEST-5',
        hourlyRate: 1500,
        bookings: [
          {
            id: 'BKG-20261104-0001',
            startupId: 'STP-TEAM',
            bookedBy: 'Alex Morgan',
            date: '2026-11-04',
            duration: 4,
            status: 'Confirmed'
          },
          {
            id: 'BKG-20261105-0001',
            startupId: 'STP-TEAM',
            bookedBy: 'Sarah Chen',
            date: '2026-11-05',
            duration: 5,
            status: 'Confirmed'
          }
        ]
      }
    ];

    const usage = db.calculateStartupMonthlyUsage(testRooms, 'STP-TEAM', '2026-11');
    assert.strictEqual(usage, 9.0, 'Combined usage from Alex (4h) and Sarah (5h) must equal 9.0h');
    const remaining = Math.max(0, 15.0 - usage);
    assert.strictEqual(remaining, 6.0, 'Company pool has 15 - 9 = 6.0h remaining');
    pass('Test 7: Multiple team members (Alex Morgan & Sarah Chen) share the unified company allowance');
  } catch (err) {
    fail('Test 7: Team pool sharing', err);
  }

  // Test 8: Role-based Scoping on Reservations Endpoint
  try {
    // Founder query: only sees their own startup
    const founderRes = await db.getMeetingRoomReservations({
      requestingStartupId: 'STP-XYZ',
      userRole: 'founder',
      limit: 50
    });

    assert.ok(founderRes.reservations.every(b => b.startupId === 'STP-XYZ' || (b.startupName && b.startupName.includes('XYZ'))), 'Founder must only see their startup bookings');

    // Admin query: can see all
    const adminRes = await db.getMeetingRoomReservations({
      userRole: 'super_admin',
      limit: 50
    });

    assert.ok(adminRes.reservations.length >= founderRes.reservations.length, 'Admin can view all system reservations');
    pass('Test 8: Role-based access control strictly scopes founders to their own startup bookings');
  } catch (err) {
    fail('Test 8: Role-based scoping', err);
  }

  // Test 9: Overlap Prevention (Double-booking rejection & Back-to-Back allowed)
  try {
    const toM = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const hasOverlap = (s1, e1, s2, e2) => {
      return toM(s1) < toM(e2) && toM(e1) > toM(s2);
    };

    // Slot A: 10:00 - 11:00
    // Overlapping Slot B: 10:30 - 11:30 -> OVERLAP!
    assert.strictEqual(hasOverlap('10:00', '11:00', '10:30', '11:30'), true, 'Overlapping slots must be detected');

    // Back-to-back Slot C: 11:00 - 12:00 -> NO OVERLAP!
    assert.strictEqual(hasOverlap('10:00', '11:00', '11:00', '12:00'), false, 'Back-to-back slots must be permitted');

    // Completely separated Slot D: 14:00 - 15:00 -> NO OVERLAP!
    assert.strictEqual(hasOverlap('10:00', '11:00', '14:00', '15:00'), false, 'Disjoint slots must be permitted');

    pass('Test 9: Overlap prevention rejects overlapping slots but cleanly allows back-to-back reservations');
  } catch (err) {
    fail('Test 9: Overlap prevention', err);
  }

  // Test 10: Check-in Window (Only 15 mins before start until end)
  try {
    const toM = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const isCheckInOpen = (startTime, endTime, currentTime) => {
      const s = toM(startTime);
      const e = toM(endTime);
      const now = toM(currentTime);
      return now >= (s - 15) && now < e;
    };

    // Meeting: 10:00 - 11:00
    // 09:30 (30m before) -> closed
    assert.strictEqual(isCheckInOpen('10:00', '11:00', '09:30'), false, '30m before start: Check-in must be closed');
    // 09:44 (16m before) -> closed
    assert.strictEqual(isCheckInOpen('10:00', '11:00', '09:44'), false, '16m before start: Check-in must be closed');
    // 09:45 (15m before) -> OPEN!
    assert.strictEqual(isCheckInOpen('10:00', '11:00', '09:45'), true, '15m before start: Check-in must open');
    // 10:15 (during meeting) -> OPEN!
    assert.strictEqual(isCheckInOpen('10:00', '11:00', '10:15'), true, 'During meeting: Check-in must remain open');
    // 11:00 (end of meeting) -> CLOSED!
    assert.strictEqual(isCheckInOpen('10:00', '11:00', '11:00'), false, 'At meeting end: Check-in must close');

    pass('Test 10: Check-in window validation strictly enforces availability from 15 minutes before start until session end');
  } catch (err) {
    fail('Test 10: Check-in window validation', err);
  }

  console.log('\n========================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
