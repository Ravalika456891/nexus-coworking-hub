// tests/meetingRoomPhase4Admin.test.js
// Automated test suite for Phase 4: Administrative Controls & Advanced Analytics

const assert = require('assert');
const db = require('../db');

async function runTests() {
  console.log('==================================================================');
  console.log('🧪 NEXUS HUB — PHASE 4: ADMINISTRATIVE CONTROLS & ANALYTICS TESTS');
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  const ist = db.getISTClock();
  const dParts = ist.date.split('-').map(Number);
  const nextDay = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 2)).toISOString().split('T')[0];
  const farDay = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 45)).toISOString().split('T')[0];

  // 1. Admin Room Management (Add, Edit, Archive)
  await test('1. Admin can add a new room, edit its configuration, and archive empty rooms', async () => {
    // Add room
    const addRes = await db.manageMeetingRoomAdminAtomic({
      action: 'save_room',
      userRole: 'super_admin',
      roomData: {
        id: 'MR-TEST-ADMIN',
        name: 'Innovation Amphitheater',
        capacity: 40,
        hourlyRate: 3500,
        amenities: 'Dolby Atmos, 4K Projection, Wireless Podium, Acoustic Paneling',
        icon: '🎭',
        operatingHours: '08:00-11:00, 15:00-19:00'
      }
    });
    assert.strictEqual(addRes.ok, true, 'Failed to add room');
    assert.strictEqual(addRes.room.name, 'Innovation Amphitheater');
    assert.strictEqual(addRes.room.capacity, 40);

    // Edit room
    const editRes = await db.manageMeetingRoomAdminAtomic({
      action: 'save_room',
      userRole: 'super_admin',
      roomData: {
        id: 'MR-TEST-ADMIN',
        name: 'Innovation Amphitheater (Upgraded)',
        capacity: 50,
        hourlyRate: 4000
      }
    });
    assert.strictEqual(editRes.ok, true, 'Failed to edit room');
    assert.strictEqual(editRes.room.capacity, 50);

    // Archive empty room
    const archiveRes = await db.manageMeetingRoomAdminAtomic({
      action: 'archive_room',
      userRole: 'super_admin',
      roomId: 'MR-TEST-ADMIN'
    });
    assert.strictEqual(archiveRes.ok, true, 'Failed to archive room');
    assert.strictEqual(archiveRes.room.archived, true);
  });

  // 2. RBAC Enforcement
  await test('2. Non-admin roles (founder, startup) are rejected with 403 on admin actions', async () => {
    const res = await db.manageMeetingRoomAdminAtomic({
      action: 'save_room',
      userRole: 'founder',
      roomData: { name: 'Hacker Pod' }
    });
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 403);
  });

  // 3. Timed Maintenance Blocks & Conflict Detection
  await test('3. Scheduled maintenance block rejects bookings during the window and surfaces conflicts', async () => {
    const appState = await db.getAppState();
    const existingRoom = (appState.meetingRooms || []).find(r => !r.archived) || { id: 'MR-01', name: 'Boardroom Alpha' };
    const room1Id = existingRoom.id;
    const room2Id = (appState.meetingRooms || [])[1] ? appState.meetingRooms[1].id : 'MR-02';
    const room3Id = (appState.meetingRooms || [])[2] ? appState.meetingRooms[2].id : 'MR-03';

    const maintStart = `${nextDay}T08:00:00`;
    const maintEnd = `${nextDay}T12:00:00`;

    // Create timed maintenance block for room1Id
    const blockRes = await db.manageMeetingRoomMaintenanceAtomic({
      action: 'add',
      userRole: 'super_admin',
      maintenanceData: {
        id: 'MNT-TEST-01',
        roomId: room1Id,
        reason: 'Air Conditioning System Overhaul',
        startDateTime: maintStart,
        endDateTime: maintEnd,
        notes: 'Annual HVAC servicing by Daikin technicians'
      }
    });
    assert.strictEqual(blockRes.ok, true, `Failed to create maintenance block: ${blockRes.message}`);
    assert.strictEqual(blockRes.block.reason, 'Air Conditioning System Overhaul');

    // Attempt booking during the maintenance window
    const bookRes = await db.reserveMeetingRoomSlotsAtomic({
      roomId: room1Id,
      startupId: 'STP-XYZ',
      date: nextDay,
      startTime: '09:00',
      endTime: '10:00',
      attendees: 4,
      userRole: 'founder'
    });
    assert.strictEqual(bookRes.ok, false);
    assert.strictEqual(bookRes.status, 409);
    assert.strictEqual(bookRes.code, 'ROOM_UNDER_TIMED_MAINTENANCE');

    // Remove maintenance block
    const delRes = await db.manageMeetingRoomMaintenanceAtomic({
      action: 'delete',
      userRole: 'super_admin',
      maintenanceId: 'MNT-TEST-01'
    });
    assert.strictEqual(delRes.ok, true, `Failed to delete maintenance block: ${delRes.message}`);
  });

  // 4. Configurable Booking Policies Enforcement
  await test('4. Booking policies enforce advance booking window and duration limits', async () => {
    const appState = await db.getAppState();
    const room1 = (appState.meetingRooms || []).find(r => !r.archived) || { id: 'MR-01' };

    // Set strict booking policies
    await db.manageMeetingRoomAdminAtomic({
      action: 'update_policy',
      userRole: 'super_admin',
      policyData: {
        maxDurationHours: 3,
        advanceBookingDays: 14,
        requireApprovalAboveHours: 2,
        maxActiveReservationsPerStartup: 10
      }
    });

    // A) Try to book 45 days in advance (exceeds 14-day limit)
    const farBook = await db.reserveMeetingRoomSlotsAtomic({
      roomId: room1.id,
      startupId: 'STP-XYZ',
      date: farDay,
      startTime: '09:00',
      endTime: '10:00',
      attendees: 4,
      userRole: 'founder'
    });
    assert.strictEqual(farBook.ok, false);
    assert.strictEqual(farBook.code, 'ADVANCE_BOOKING_EXCEEDED');

    // B) Try to book 4 hours duration (exceeds 3h limit)
    const longBook = await db.reserveMeetingRoomSlotsAtomic({
      roomId: room1.id,
      startupId: 'STP-XYZ',
      date: nextDay,
      startTime: '15:00',
      endTime: '19:00', // 4 hours
      attendees: 4,
      userRole: 'founder'
    });
    assert.strictEqual(longBook.ok, false);
    assert.strictEqual(longBook.code, 'MAX_DURATION_EXCEEDED');

    // Reset policies back to standard defaults for other tests
    await db.manageMeetingRoomAdminAtomic({
      action: 'update_policy',
      userRole: 'super_admin',
      policyData: {
        maxDurationHours: 4,
        advanceBookingDays: 60,
        requireApprovalAboveHours: 2,
        maxActiveReservationsPerStartup: 20
      }
    });
  });

  // 5. Reservation Approval Workflow
  await test('5. Booking requiring approval sets status to Pending Approval, can be approved or rejected with reason', async () => {
    const appState = await db.getAppState();
    const validRooms = (appState.meetingRooms || []).filter(r => !r.archived);
    const room2 = validRooms[1] || validRooms[0];
    const room3 = validRooms[2] || validRooms[0];
    const approvalTestDate = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 4 + Math.floor(Math.random() * 8))).toISOString().split('T')[0];

    // Book 2.5 hours on room2 (exceeds requireApprovalAboveHours=2)
    const pendingBook = await db.reserveMeetingRoomSlotsAtomic({
      roomId: room2.id,
      startupId: 'STP-APPROVAL-01',
      date: approvalTestDate,
      startTime: '15:00',
      endTime: '17:30', // 2.5 hours
      attendees: 4,
      userRole: 'founder'
    });
    assert.strictEqual(pendingBook.ok, true, `Pending booking failed: ${pendingBook.message}`);
    assert.strictEqual(pendingBook.booking.status, 'Pending Approval');

    // Admin approves the reservation
    const approveRes = await db.manageMeetingRoomAdminAtomic({
      action: 'approve_booking',
      userRole: 'super_admin',
      roomId: room2.id,
      bookingId: pendingBook.booking.id
    });
    assert.strictEqual(approveRes.ok, true);
    assert.strictEqual(approveRes.booking.status, 'Confirmed');

    // Test rejection workflow on another booking
    const anotherPending = await db.reserveMeetingRoomSlotsAtomic({
      roomId: room3.id,
      startupId: 'STP-APPROVAL-02',
      date: approvalTestDate,
      startTime: '15:00',
      endTime: '17:30',
      attendees: 4,
      userRole: 'founder'
    });
    assert.strictEqual(anotherPending.ok, true, `Second pending booking failed: ${anotherPending.message}`);

    const rejectRes = await db.manageMeetingRoomAdminAtomic({
      action: 'reject_booking',
      userRole: 'super_admin',
      roomId: room3.id,
      bookingId: anotherPending.booking.id,
      rejectionReason: 'Room is reserved for VIP board review'
    });
    assert.strictEqual(rejectRes.ok, true);
    assert.strictEqual(rejectRes.booking.status, 'Rejected');
    assert.strictEqual(rejectRes.booking.rejectionReason, 'Room is reserved for VIP board review');

    // Clean up test booking to keep database pristine
    await db.cancelBooking({ roomId: room2.id, bookingId: pendingBook.booking.id, userRole: 'super_admin' }).catch(() => {});
  });

  // 6. Admin Reservations Query & Analytics
  await test('6. Admin reservations list and analytics return live accurate aggregations', async () => {
    const listRes = await db.getMeetingRoomReservations({
      userRole: 'super_admin',
      page: 1,
      limit: 20
    });
    assert.strictEqual(listRes.ok, true);
    assert(Array.isArray(listRes.reservations));
    assert(listRes.total >= 1);

    const analytics = await db.getMeetingRoomsAnalytics({ range: 'all' });
    assert.strictEqual(analytics.ok, true);
    assert(analytics.totalBookings >= 1);
    assert(typeof analytics.utilizationRate === 'number');
    assert(Array.isArray(analytics.peakBookingHours));
    assert(Array.isArray(analytics.startupUsage));

    // Reset policies cleanly
    await db.manageMeetingRoomAdminAtomic({
      action: 'update_policy',
      userRole: 'super_admin',
      policyData: {
        maxDurationHours: 4,
        advanceBookingDays: 60,
        requireApprovalAboveHours: 0,
        maxActiveReservationsPerStartup: 20
      }
    });
  });

  console.log('\n==================================================================');
  console.log(`📊 PHASE 4 TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
  console.log('==================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
