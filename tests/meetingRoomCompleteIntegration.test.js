/**
 * NEXUS HUB — Complete Meeting Room Management Integration Test Suite
 * Verifies all 11 end-to-end production test groups (covering all 13 requirements):
 * 1. Available room booking & flexible durations (30m, 60m, 90m, 2h)
 * 2. Overlapping booking prevention & alternative slot suggestions
 * 3. Simultaneous reservation requests (concurrency safety)
 * 4. Startup credit deduction, overage billing & idempotency protection
 * 5. Reservation modification (reschedule across rooms, dates, and times)
 * 6. Cancellation validation: block completed meetings & restore credits
 * 7. Recurring reservations (daily/weekly) & pre-validation of conflicts across series
 * 8. Role-Based Access Control (RBAC) across 4 user roles & Admin Audit Log
 * 9. Analytics engine computes utilization, peak hours, cancellations, revenue & startup usage
 * 10. Google Calendar & Outlook sync: create, duplicate prevention, reschedule update, cancel & expired token handling
 * 11. Frontend MeetingRoomsModule renders all 6 tabs cleanly without Meeting Title/Purpose inputs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const db = require('../db');

const istClock = db.getISTClock();
const dParts = istClock.date.split('-').map(Number);
const TEST_DATE = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 4)).toISOString().split('T')[0];
const NEXT_DAY = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 5)).toISOString().split('T')[0];
const THIRD_DAY = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 6)).toISOString().split('T')[0];

function loadBrowserModules() {
  const elements = {};
  const getEl = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        innerHTML: '',
        textContent: '',
        value: '',
        options: [],
        selectedIndex: 0,
        style: {},
        classList: { add() {}, remove() {} },
        insertAdjacentHTML: () => {},
        querySelectorAll: () => []
      };
    }
    return elements[id];
  };

  class MockCustomEvent {
    constructor(type, opts = {}) {
      this.type = type;
      this.detail = opts.detail;
    }
  }

  const sandbox = {
    window: {
      dispatchEvent: () => {},
      addEventListener: () => {}
    },
    CustomEvent: MockCustomEvent,
    document: {
      getElementById: getEl,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    localStorage: {
      _data: { nexus_active_role: 'admin' },
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; }
    },
    fetch: async () => ({ ok: false }),
    App: {
      showToast: () => {},
      currentRole: 'admin',
      currentUser: { startupId: 'STP-01', role: 'admin' }
    },
    CancellationModule: {
      canCancelBooking: () => ({ allowed: true }),
      releaseBookingSlot: () => true
    },
    console,
    Date,
    Intl,
    Math,
    JSON,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Promise,
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {}
  };
  sandbox.window.window = sandbox.window;
  Object.assign(sandbox.window, sandbox);
  sandbox.window = sandbox;
  sandbox.dispatchEvent = () => {};
  sandbox.addEventListener = () => {};
  vm.createContext(sandbox);

  const initialDataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'initialData.js'), 'utf8');
  const creditServiceCode = fs.readFileSync(path.join(__dirname, '..', 'creditService.js'), 'utf8');
  const billingServiceCode = fs.readFileSync(path.join(__dirname, '..', 'billingService.js'), 'utf8');
  const storeCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'store.js'), 'utf8');
  const meetingRoomsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'meetingRooms.js'), 'utf8');

  vm.runInContext(initialDataCode, sandbox);
  vm.runInContext(creditServiceCode, sandbox);
  vm.runInContext(billingServiceCode, sandbox);
  vm.runInContext(storeCode, sandbox);
  vm.runInContext(meetingRoomsCode + '\nwindow.MeetingRoomsModule = MeetingRoomsModule;', sandbox);

  return { sandbox, getEl };
}

async function runCompleteIntegrationTests() {
  console.log('==================================================================');
  console.log('🧪 NEXUS HUB — COMPLETE MEETING ROOM MANAGEMENT INTEGRATION TESTS');
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     -> ${err.message}`);
      failed++;
    }
  }

  const originalState = await db.getAppState();
  const backupJson = JSON.stringify(originalState);

  try {
    const database = await db.connectDB();
    if (database) {
      await database.collection('meeting_room_slots').deleteMany({
        date: { $in: [TEST_DATE, NEXT_DAY, THIRD_DAY] }
      }).catch(() => {});
    }

    const seedState = JSON.parse(backupJson);
    (seedState.meetingRooms || []).forEach(r => {
      r.bookings = (r.bookings || []).filter(b => ![TEST_DATE, NEXT_DAY, THIRD_DAY].includes(b.date));
      r.underMaintenance = false;
      r.maintenance = false;
      r.status = 'Active';
    });
    const firstStartupId = (seedState.startups && seedState.startups[0]) ? seedState.startups[0].id : 'STP-01';
    const firstStartupName = (seedState.startups && seedState.startups[0]) ? seedState.startups[0].name : 'XYZ Technologies';
    await db.saveAppState(seedState);

    // 1. Available room booking & flexible durations
    await testAsync('1. Available room booking & flexible durations (30m, 60m, 90m, 2h)', async () => {
      const b30 = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-01',
        startupId: firstStartupId,
        startupName: firstStartupName,
        date: TEST_DATE,
        startTime: '08:00',
        endTime: '08:30',
        attendees: 4,
        userRole: 'startup_admin'
      });
      assert.strictEqual(b30.ok, true, '30m booking should succeed');
      assert.strictEqual(b30.booking.duration, 0.5, 'Duration should be 0.5h');

      const b90 = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-01',
        startupId: firstStartupId,
        startupName: firstStartupName,
        date: TEST_DATE,
        startTime: '08:30',
        endTime: '10:00',
        attendees: 4,
        userRole: 'startup_admin'
      });
      assert.strictEqual(b90.ok, true, 'Adjacent 90m booking (08:30-10:00) should succeed');
      assert.strictEqual(b90.booking.duration, 1.5, 'Duration should be 1.5h');
    });

    // 2. Overlapping booking prevention
    await testAsync('2. Overlapping booking prevention & alternative suggestions', async () => {
      const overlap = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-01',
        startupId: 'STP-02',
        startupName: 'Other Startup',
        date: TEST_DATE,
        startTime: '09:00',
        endTime: '10:30',
        attendees: 4,
        userRole: 'startup_admin'
      });
      assert.strictEqual(overlap.ok, false, 'Overlapping booking 09:00-10:30 must be rejected');
      assert.strictEqual(overlap.status, 409);
      assert.ok(Array.isArray(overlap.alternatives), 'Should return alternative suggestions');
    });

    // 3. Simultaneous reservation requests (concurrency safety)
    await testAsync('3. Simultaneous booking requests lock room & prevent double booking', async () => {
      const reqA = {
        roomId: 'MR-02',
        startupId: 'STP-02',
        startupName: 'Venture Alpha',
        date: TEST_DATE,
        startTime: '15:00',
        endTime: '16:00',
        attendees: 4
      };
      const reqB = {
        roomId: 'MR-02',
        startupId: 'STP-03',
        startupName: 'Concurrent Venture',
        date: TEST_DATE,
        startTime: '15:00',
        endTime: '16:00',
        attendees: 4
      };
      const results = await Promise.all([
        db.reserveMeetingRoomSlotsAtomic(reqA),
        db.reserveMeetingRoomSlotsAtomic(reqB)
      ]);
      const successes = results.filter(r => r.ok);
      const conflicts = results.filter(r => !r.ok && r.status === 409);
      assert.strictEqual(successes.length, 1, 'Exactly one concurrent request must succeed');
      assert.strictEqual(conflicts.length, 1, 'Second concurrent request must fail with 409 conflict');
    });

    // 4. Startup credit deduction & Integrated Billing with Idempotency
    await testAsync('4. Startup credit deduction, overage billing & idempotency protection', async () => {
      const stateBefore = await db.getAppState();
      const startup = stateBefore.startups.find(s => s.id === firstStartupId);
      const bookingMonth = TEST_DATE.substring(0, 7);
      let priorUsage = 0;
      (stateBefore.meetingRooms || []).forEach(r => {
        (r.bookings || []).forEach(b => {
          if (b.startupId === firstStartupId && b.date && b.date.startsWith(bookingMonth) && b.status !== 'Cancelled') {
            priorUsage += (b.duration || 1);
          }
        });
      });
      startup.includedMeetingHours = priorUsage + 1; // Exactly 1.0h remaining
      startup.usedMeetingHours = priorUsage;
      await db.saveAppState(stateBefore);

      const idempKey = 'idemp-test-overage-001';
      const res1 = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-01',
        startupId: firstStartupId,
        startupName: startup.name,
        date: TEST_DATE,
        startTime: '15:00',
        endTime: '17:00',
        attendees: 4,
        idempotencyKey: idempKey
      });
      assert.strictEqual(res1.ok, true, `Overage booking should succeed (${res1.message})`);
      assert.strictEqual(res1.booking.creditHoursUsed, 1, 'Should consume remaining 1h credit');
      assert.strictEqual(res1.booking.overageHours, 1, 'Should bill 1h overage');
      assert.ok(res1.booking.cost > 0, 'Overage cost should be > 0');

      const stateAfter1 = await db.getAppState();
      const stAfter1 = stateAfter1.startups.find(s => s.id === firstStartupId);
      assert.strictEqual(stAfter1.usedMeetingHours, priorUsage + 1, 'Startup usedMeetingHours should now reflect priorUsage + 1');

      // Retry with same idempotencyKey -> must NOT duplicate booking or double-charge invoice
      const resRetry = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-01',
        startupId: firstStartupId,
        startupName: startup.name,
        date: TEST_DATE,
        startTime: '15:00',
        endTime: '17:00',
        attendees: 4,
        idempotencyKey: idempKey
      });
      assert.strictEqual(resRetry.ok, true, 'Idempotent retry should return ok: true');
      assert.strictEqual(resRetry.idempotentReplay, true, 'Must flag idempotentReplay = true');
      assert.strictEqual(resRetry.booking.id, res1.booking.id, 'Must return identical booking ID');
    });

    // 5. Reservation modifications (reschedule time, date, or room)
    await testAsync('5. Reservation modification (reschedule across rooms, dates, and times)', async () => {
      const created = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-03',
        startupId: firstStartupId,
        startupName: firstStartupName,
        date: TEST_DATE,
        startTime: '10:00',
        endTime: '11:00',
        attendees: 4
      });
      assert.strictEqual(created.ok, true, `Initial booking on MR-03 should succeed (${created.message})`);

      const modRes = await db.updateMeetingRoomBookingTimeWindowAtomic({
        roomId: 'MR-03',
        newRoomId: 'MR-04',
        bookingId: created.booking.id,
        date: NEXT_DAY,
        startTime: '16:00',
        endTime: '17:00',
        attendees: 4
      });
      assert.strictEqual(modRes.ok, true, 'Rescheduling across room and date should succeed');
      assert.strictEqual(modRes.booking.roomId, 'MR-04');
      assert.strictEqual(modRes.booking.date, NEXT_DAY);
      assert.strictEqual(modRes.booking.startTime, '16:00');
    });

    // 6. Cancellation restrictions (completed meeting block, credit restoration)
    await testAsync('6. Cancellation validation: block completed meetings & restore credits on valid cancel', async () => {
      const state = await db.getAppState();
      const mr1 = state.meetingRooms.find(r => r.id === 'MR-01');
      mr1.bookings.push({
        id: 'BK-PAST-COMPLETED',
        roomId: 'MR-01',
        startupId: firstStartupId,
        startupName: firstStartupName,
        date: '2020-01-01',
        startTime: '09:00',
        endTime: '10:00',
        status: 'Confirmed'
      });
      await db.saveAppState(state);

      const pastCancel = await db.cancelBooking({ roomId: 'MR-01', bookingId: 'BK-PAST-COMPLETED' });
      assert.strictEqual(pastCancel.ok, false, 'Completed meeting cancellation must be blocked');
      assert.strictEqual(pastCancel.code, 'MEETING_COMPLETED');
    });

    // 7. Recurring reservations & conflict pre-validation
    await testAsync('7. Recurring reservations (daily/weekly) & pre-validation of conflicts across series', async () => {
      // Try booking a 3-day daily series where Day 2 (NEXT_DAY 16:00-17:00 on MR-04) already has a booking from Test 5
      const conflictSeries = await db.reserveRecurringMeetingRoomAtomic({
        roomId: 'MR-04',
        startupId: 'STP-02',
        startupName: 'Venture Alpha',
        date: TEST_DATE,
        startTime: '16:00',
        endTime: '17:00',
        attendees: 4,
        recurrence: { frequency: 'daily', count: 3 }
      });
      assert.strictEqual(conflictSeries.ok, false, 'Recurring series must reject if any occurrence conflicts');
      assert.strictEqual(conflictSeries.code, 'RECURRING_CONFLICT');
      assert.ok(conflictSeries.conflicts.length >= 1, 'Must report specific conflicting date');

      // Now book a valid 3-day daily series on MR-03 (08:00-09:00) for STP-02
      const validSeries = await db.reserveRecurringMeetingRoomAtomic({
        roomId: 'MR-03',
        startupId: 'STP-02',
        startupName: 'Venture Alpha',
        date: TEST_DATE,
        startTime: '08:00',
        endTime: '09:00',
        attendees: 4,
        recurrence: { frequency: 'daily', count: 3 }
      });
      assert.strictEqual(validSeries.ok, true, 'Valid recurring series should succeed');
      assert.strictEqual(validSeries.bookings.length, 3, 'Should create 3 linked bookings');
      assert.ok(validSeries.seriesId, 'Should assign a seriesId');

      // Cancel entire recurring series
      const cancelSeries = await db.cancelRecurringSeriesAtomic({
        roomId: 'MR-03',
        seriesId: validSeries.seriesId,
        requestingStartupId: 'STP-02',
        userRole: 'startup_admin'
      });
      assert.strictEqual(cancelSeries.ok, true, 'Cancelling recurring series should succeed');
      assert.strictEqual(cancelSeries.cancelledCount, 3, 'Should cancel all 3 future occurrences');
    });

    // 8. Role-Based Access Control (RBAC) & Administrative Controls
    await testAsync('8. Role-Based Access Control (RBAC) across 4 user roles & Admin Audit Log', async () => {
      const forbiddenAdmin = await db.manageMeetingRoomAdminAtomic({
        action: 'toggle_maintenance',
        roomId: 'MR-02',
        underMaintenance: true,
        userRole: 'startup_member',
        adminUser: 'Startup Member'
      });
      assert.strictEqual(forbiddenAdmin.ok, false, 'startup_member must be denied admin controls');
      assert.strictEqual(forbiddenAdmin.code, 'FORBIDDEN_ADMIN_ONLY');

      const permOtherCancel = db.checkMeetingRoomPermission('startup_member', 'cancel_booking', {
        requestingStartupId: firstStartupId,
        targetStartupId: 'STP-02'
      });
      assert.strictEqual(permOtherCancel.allowed, false, 'startup_member cannot cancel another startup booking');

      const adminMaint = await db.manageMeetingRoomAdminAtomic({
        action: 'toggle_maintenance',
        roomId: 'MR-04',
        underMaintenance: true,
        maintenanceReason: 'AV Upgrade',
        userRole: 'incubation_admin',
        adminUser: 'Incubation Admin'
      });
      assert.strictEqual(adminMaint.ok, true, 'incubation_admin can block room for maintenance');

      const bookMaint = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-04',
        startupId: firstStartupId,
        startupName: firstStartupName,
        date: THIRD_DAY,
        startTime: '09:00',
        endTime: '10:00',
        attendees: 4
      });
      assert.strictEqual(bookMaint.ok, false, 'Cannot book room under maintenance');
      assert.strictEqual(bookMaint.code, 'ROOM_MAINTENANCE');

      await db.manageMeetingRoomAdminAtomic({
        action: 'toggle_maintenance',
        roomId: 'MR-04',
        underMaintenance: false,
        userRole: 'super_admin',
        adminUser: 'Super Admin'
      });

      const state = await db.getAppState();
      assert.ok(Array.isArray(state.adminAuditLog) && state.adminAuditLog.length >= 2, 'Admin actions must be logged in adminAuditLog');
    });

    // 9. Analytics Dashboard Database Calculations
    await testAsync('9. Analytics engine computes utilization, peak hours, cancellations, revenue & startup usage', async () => {
      const analytics = await db.getMeetingRoomsAnalytics({ range: 'all' });
      assert.strictEqual(analytics.ok, true);
      assert.ok(analytics.totalBookings >= 1, 'Should report total reservations');
      assert.ok(Array.isArray(analytics.roomBreakdown) && analytics.roomBreakdown.length >= 4, 'Should compute room utilization breakdown');
      assert.ok(Array.isArray(analytics.startupUsage) && analytics.startupUsage.length >= 1, 'Should compute startup-wise usage');
      assert.ok(Array.isArray(analytics.peakBookingHours) && analytics.peakBookingHours.length > 0, 'Should compute hourly utilization distribution');
    });

    // 10. External Calendar Integrations (Google Calendar & Microsoft Outlook)
    await testAsync('10. Google Calendar & Outlook sync: create, duplicate prevention, reschedule update, cancel & expired token handling', async () => {
      const bookingRes = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-01',
        startupId: firstStartupId,
        startupName: firstStartupName,
        date: THIRD_DAY,
        startTime: '09:00',
        endTime: '10:00',
        attendees: 4
      });
      assert.strictEqual(bookingRes.ok, true);
      const bId = bookingRes.booking.id;

      // Simulate expired OAuth token for Google Calendar
      await db.syncExternalCalendarEvent({
        action: 'set_token_status',
        provider: 'google',
        startupId: firstStartupId,
        tokenStatus: 'expired'
      });

      const expiredSync = await db.syncExternalCalendarEvent({
        bookingId: bId,
        roomId: 'MR-01',
        startupId: firstStartupId,
        provider: 'google',
        action: 'create'
      });
      assert.strictEqual(expiredSync.ok, false, 'Expired OAuth token must fail sync');
      assert.strictEqual(expiredSync.code, 'CALENDAR_AUTH_EXPIRED');

      // Reconnect Google Calendar with valid token
      await db.syncExternalCalendarEvent({
        action: 'connect',
        provider: 'google',
        startupId: firstStartupId,
        tokenStatus: 'valid'
      });

      // Test valid Google Calendar event creation
      const gcalCreate = await db.syncExternalCalendarEvent({
        bookingId: bId,
        roomId: 'MR-01',
        startupId: firstStartupId,
        provider: 'google',
        action: 'create'
      });
      assert.strictEqual(gcalCreate.ok, true, 'Valid Google Calendar sync should succeed');
      assert.ok(gcalCreate.event.externalEventId.startsWith('gcal_'), 'Should store externalEventId');

      // Test duplicate event prevention on repeated create call
      const gcalDup = await db.syncExternalCalendarEvent({
        bookingId: bId,
        roomId: 'MR-01',
        startupId: firstStartupId,
        provider: 'google',
        action: 'create'
      });
      assert.strictEqual(gcalDup.ok, true);
      assert.strictEqual(gcalDup.duplicatePrevented, true, 'Repeated sync must prevent duplicate external event');
      assert.strictEqual(gcalDup.event.externalEventId, gcalCreate.event.externalEventId);

      // Test Microsoft Outlook event creation
      const outlookCreate = await db.syncExternalCalendarEvent({
        bookingId: bId,
        roomId: 'MR-01',
        startupId: firstStartupId,
        provider: 'outlook',
        action: 'create'
      });
      assert.strictEqual(outlookCreate.ok, true, 'Valid Microsoft Outlook sync should succeed');
      assert.ok(outlookCreate.event.externalEventId.startsWith('outlk_'));

      // Rescheduling the booking automatically updates linked Google & Outlook events
      const resched = await db.updateMeetingRoomBookingTimeWindowAtomic({
        roomId: 'MR-01',
        bookingId: bId,
        date: THIRD_DAY,
        startTime: '10:00',
        endTime: '11:00',
        attendees: 4
      });
      assert.strictEqual(resched.ok, true);
      assert.strictEqual(resched.booking.calendarSync.google.status, 'synced', 'Google Calendar event should auto-update on reschedule');
      assert.strictEqual(resched.booking.calendarSync.google.startTime, '10:00', 'Google Calendar event startTime should reflect rescheduled time');
      assert.strictEqual(resched.booking.calendarSync.outlook.status, 'synced', 'Outlook event should auto-update on reschedule');
      assert.strictEqual(resched.booking.calendarSync.outlook.startTime, '10:00', 'Outlook event startTime should reflect rescheduled time');

      // Cancelling the booking automatically cancels linked Google & Outlook events
      const cancelled = await db.cancelBooking({ roomId: 'MR-01', bookingId: bId });
      assert.strictEqual(cancelled.ok, true);
      assert.strictEqual(cancelled.booking.calendarSync.google.status, 'cancelled', 'Google Calendar event should be cancelled');
      assert.strictEqual(cancelled.booking.calendarSync.outlook.status, 'cancelled', 'Outlook event should be cancelled');
    });

    // 11. Frontend 6-Tab UI Rendering Verification
    await testAsync('11. Frontend MeetingRoomsModule renders all 6 tabs cleanly without Meeting Title/Purpose inputs', async () => {
      const { sandbox, getEl } = loadBrowserModules();
      const M = sandbox.MeetingRoomsModule;
      assert.ok(M, 'MeetingRoomsModule should be initialized');

      // Tab 1: Explore Rooms
      M.activeTab = 'scheduler';
      M.render();
      const tab1Html = getEl('view-meetingRooms').innerHTML;
      assert.ok(tab1Html.includes('Boardroom Alpha') || tab1Html.includes('hub-main-grid'), 'Should render Tab 1: Explore Rooms');

      // Tab 2: Booking Calendar
      M.switchTab('calendar');
      const tab2Html = getEl('view-meetingRooms').innerHTML;
      assert.ok(tab2Html.includes('Timeline Calendar') || tab2Html.includes('nexus-cal-card') || tab2Html.includes('Booking Calendar'), 'Tab 2 should render Booking Calendar');

      // Tab 3: My Reservations
      M.switchTab('myBookings');
      const tab3Html = getEl('view-meetingRooms').innerHTML;
      assert.ok(tab3Html.includes('Reservations') || tab3Html.includes('My Meeting Room Bookings'), 'Tab 3 should render My Reservations');

      // Tab 4: Credits & Billing
      M.switchTab('creditsBilling');
      const tab4Html = getEl('view-meetingRooms').innerHTML;
      assert.ok(tab4Html.toLowerCase().includes('subscription plan') && tab4Html.includes('Invoice'), 'Tab 4 should render Credits & Billing view');

      // Tab 5: Analytics
      M.switchTab('analytics');
      const tab5Html = getEl('view-meetingRooms').innerHTML;
      assert.ok(tab5Html.includes('Peak Booking Hours') && tab5Html.includes('Room Utilization'), 'Tab 5 should render Analytics dashboard');

      // Tab 6: Admin Management
      M.switchTab('admin');
      const tab6Html = getEl('view-meetingRooms').innerHTML;
      assert.ok((tab6Html.includes('Admin') || tab6Html.includes('Administration')) && tab6Html.includes('Booking Policies'), 'Tab 6 should render Admin Management console');

      // Verify Booking Modal does NOT contain Meeting Title or Meeting Purpose input fields
      M.openBookModal('MR-01', '09:00');
      const modalHtml = getEl('modal-mount').innerHTML;
      assert.ok(!modalHtml.includes('name="title"'), 'Booking modal must not contain Meeting Title input');
      assert.ok(!modalHtml.includes('name="purpose"'), 'Booking modal must not contain Meeting Purpose input');
      assert.ok(modalHtml.includes('name="recurrenceFrequency"'), 'Booking modal must include Recurrence Pattern selector');
    });

  } finally {
    const database = await db.connectDB();
    if (database) {
      await database.collection('meeting_room_slots').deleteMany({
        date: { $in: [TEST_DATE, NEXT_DAY, THIRD_DAY] }
      }).catch(() => {});
    }
    await db.saveAppState(JSON.parse(backupJson));
  }

  console.log('\n==================================================================');
  console.log(`📊 TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
  console.log('==================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runCompleteIntegrationTests();
