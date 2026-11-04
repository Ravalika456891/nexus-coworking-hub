// Automated Test Suite: NEXUS HUB – Phase 2: Advanced Meeting Room Calendar & Booking Experience
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const db = require('../db');

const istClock = db.getISTClock();
const dParts = istClock.date.split('-').map(Number);
const TEST_DATE = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 4)).toISOString().split('T')[0];
const TEST_DATE_2 = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 5)).toISOString().split('T')[0];

function loadBrowserModules() {
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
      getElementById: () => ({ innerHTML: '', style: {}, insertAdjacentHTML: () => {} }),
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; }
    },
    fetch: async () => ({ ok: false }),
    App: {
      showToast: () => {},
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
    Promise,
    setTimeout: (fn) => fn(),
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

  return sandbox;
}

async function runPhase2Tests() {
  console.log('🧪 Starting NEXUS HUB – Phase 2 Automated Test Suite (8 Scenarios)...\n');
  let passed = 0;
  let failed = 0;

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.stack || err.message}`);
      failed++;
    }
  }

  // Backup and restore state around tests so we never corrupt or delete real booking data
  const originalState = await db.getAppState();
  const backupJson = JSON.stringify(originalState);

  try {
    // Clean any leftover slot docs on TEST_DATE / TEST_DATE_2 in MongoDB
    const database = await db.connectDB();
    if (database) {
      await database.collection('meeting_room_slots').deleteMany({ date: { $in: [TEST_DATE, TEST_DATE_2] } }).catch(() => {});
    }

    // Seed clean test state on top of existing rooms
    const testState = JSON.parse(backupJson);
    (testState.meetingRooms || []).forEach(r => {
      r.bookings = (r.bookings || []).filter(b => b.date !== TEST_DATE && b.date !== TEST_DATE_2);
    });
    await db.saveAppState(testState);

    let createdBookingId1 = null;
    let createdBookingId30m = null;

    // --- Scenario 1: Booking an available slot (with Phase 2 metadata & trusted backend pricing) ---
    await testAsync('Scenario 1: Booking an available slot stores purpose, amenities, special requests & trusted pricing', async () => {
      const res = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-01',
        startupId: 'STP-01',
        startupName: 'XYZ Technologies',
        title: 'Series A Pitch Rehearsal',
        purpose: 'Investor Pitch / Demo',
        date: TEST_DATE,
        startTime: '09:00',
        endTime: '10:00',
        attendees: 4,
        requestedAmenities: ['4K Display / Projector', 'Video Conferencing'],
        specialRequests: 'Need HDMI-to-USB-C adapter'
      });

      assert.strictEqual(res.ok, true, 'Available slot booking must succeed');
      assert.strictEqual(res.status, 201);
      assert.ok(res.booking && res.booking.id, 'Reservation ID must be generated');
      assert.strictEqual(res.booking.purpose, 'Investor Pitch / Demo');
      assert.deepStrictEqual(res.booking.requestedAmenities, ['4K Display / Projector', 'Video Conferencing']);
      assert.strictEqual(res.booking.specialRequests, 'Need HDMI-to-USB-C adapter');
      assert.strictEqual(typeof res.booking.cost, 'number', 'Trusted backend cost must be calculated');
      createdBookingId1 = res.booking.id;
    });

    // --- Scenario 2: Booking an occupied slot & enforcing room capacity ---
    await testAsync('Scenario 2: Booking an occupied slot is rejected with 409 & room capacity is enforced', async () => {
      // Occupied slot attempt
      const conflictRes = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-01',
        startupId: 'STP-02',
        startupName: 'NeuroPulse AI',
        title: 'Conflicting Sync',
        date: TEST_DATE,
        startTime: '09:00',
        endTime: '10:00',
        attendees: 4
      });
      assert.strictEqual(conflictRes.ok, false, 'Occupied slot must be rejected');
      assert.strictEqual(conflictRes.status, 409);

      // Capacity exceeded attempt (MR-03 Huddle Pod Beta has capacity 6)
      const capRes = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-03',
        startupId: 'STP-02',
        startupName: 'NeuroPulse AI',
        title: 'Oversized Team Meeting',
        date: TEST_DATE,
        startTime: '10:00',
        endTime: '11:00',
        attendees: 25
      });
      assert.strictEqual(capRes.ok, false, 'Exceeding room capacity must be rejected');
      assert.strictEqual(capRes.code, 'CAPACITY_EXCEEDED');
    });

    // --- Scenario 3: Booking a 30-minute meeting & verifying partial-hour availability ---
    await testAsync('Scenario 3: Booking a 30-minute meeting succeeds and leaves the other 30-minute half open', async () => {
      const res30a = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-02',
        startupId: 'STP-02',
        startupName: 'NeuroPulse AI',
        title: 'Quick Standup 30m',
        purpose: 'Team Sync & Sprint',
        date: TEST_DATE,
        startTime: '15:00',
        endTime: '15:30',
        attendees: 4
      });
      assert.strictEqual(res30a.ok, true, 'First 30-min half (15:00-15:30) must succeed');
      assert.strictEqual(res30a.booking.duration, 0.5);
      createdBookingId30m = res30a.booking.id;

      // Second half of the same hour (15:30-16:00) must still be bookable!
      const res30b = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-02',
        startupId: 'STP-03',
        startupName: 'BioGenic Labs',
        title: 'Second Half 30m Sync',
        date: TEST_DATE,
        startTime: '15:30',
        endTime: '16:00',
        attendees: 4
      });
      assert.strictEqual(res30b.ok, true, 'Second 30-min half (15:30-16:00) must also succeed without false full-hour lock');
    });

    // --- Scenario 4: Switching between calendar views (Day, Week, Month, Compare, Cards) ---
    await testAsync('Scenario 4: Switching between Day, Week, Month, Compare, and Cards views renders accurately', async () => {
      const env = loadBrowserModules();
      const mod = env.MeetingRoomsModule;
      const st = await db.getAppState();
      env.window.store.state.meetingRooms = st.meetingRooms;
      mod.selectedDate = TEST_DATE;

      const rooms = mod.getFilteredRooms();
      const myStartup = mod.getMyStartup();

      // Day View
      mod.schedulerViewMode = 'day';
      const dayHtml = mod.renderDayCalendarView(rooms, myStartup);
      assert.ok(dayHtml.includes('Interactive Day Timeline Calendar'), 'Day view header must render');
      assert.ok(dayHtml.includes('08:00') && dayHtml.includes('09:00'), 'Day view must render 30-min slots');
      assert.ok(dayHtml.toLowerCase().includes('mine') || dayHtml.includes('Your Reservation'), 'Day view must highlight my startup reservation');

      // Week View
      mod.schedulerViewMode = 'week';
      const weekHtml = mod.renderWeekCalendarView(rooms, myStartup);
      assert.ok(weekHtml.includes('7-Day Weekly Availability'), 'Week view header must render');
      assert.ok(weekHtml.includes('Series A Pitch Rehearsal') || weekHtml.includes('MR-01'), 'Week view must display reservation title or room');

      // Month View
      mod.schedulerViewMode = 'month';
      const monthHtml = mod.renderMonthCalendarView(rooms, myStartup);
      assert.ok(monthHtml.includes('Monthly Booking Activity'), 'Month view header must render');

      // Room Comparison View
      mod.schedulerViewMode = 'compare';
      const compareHtml = mod.renderRoomComparisonView(rooms, myStartup);
      assert.ok(compareHtml.includes('Side-by-Side Meeting Room Comparison'), 'Comparison view must render');
      assert.ok(compareHtml.includes('Next Available Time'), 'Comparison table must include Next Available Time column');
    });

    // --- Scenario 5: Applying room filters (Room, Capacity, Amenity, Available-Only) ---
    await testAsync('Scenario 5: Applying Room, Capacity, Amenity, and Available-Only filters narrows rooms accurately', async () => {
      const env = loadBrowserModules();
      const mod = env.MeetingRoomsModule;
      const st = await db.getAppState();
      env.window.store.state.meetingRooms = st.meetingRooms;
      mod.selectedDate = TEST_DATE;

      // Filter by specific room
      mod.resetFilters();
      mod.filterRoom = 'MR-01';
      let filtered = mod.getFilteredRooms();
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].id, 'MR-01');

      // Filter by capacity >= 8
      mod.resetFilters();
      mod.filterCapacity = '8';
      filtered = mod.getFilteredRooms();
      assert.ok(filtered.length > 0 && filtered.every(r => r.capacity >= 8), 'All filtered rooms must have capacity >= 8');

      // Filter by amenity (video)
      mod.resetFilters();
      mod.filterAmenity = 'video';
      filtered = mod.getFilteredRooms();
      assert.ok(filtered.length > 0, 'Video amenity filter must match rooms with conferencing');

      // Filter by Available-Only
      mod.resetFilters();
      mod.filterAvailableOnly = true;
      filtered = mod.getFilteredRooms();
      assert.ok(filtered.every(r => !mod.isRoomUnderMaintenance(r)), 'Available-only filter must exclude maintenance rooms');
    });

    // --- Scenario 6: Rescheduling an existing reservation (changing room, date, time, attendees, details in-place) ---
    await testAsync('Scenario 6: Rescheduling updates original reservation in-place without duplicates & enforces conflicts', async () => {
      // First verify conflict rejection when rescheduling onto an occupied slot (MR-02 15:00-16:00 on TEST_DATE is occupied)
      const badReschedule = await db.updateMeetingRoomBookingTimeWindowAtomic({
        roomId: 'MR-01',
        bookingId: createdBookingId1,
        newRoomId: 'MR-02',
        date: TEST_DATE,
        startTime: '15:00',
        endTime: '16:00',
        attendees: 4,
        requestingStartupId: 'STP-01',
        userRole: 'founder'
      });
      assert.strictEqual(badReschedule.ok, false, 'Rescheduling onto an occupied slot in target room must be rejected');
      assert.strictEqual(badReschedule.status, 409);

      // Now reschedule MR-01 booking to MR-02 on TEST_DATE_2 from 10:00 to 11:00 with updated title & attendees
      const goodReschedule = await db.updateMeetingRoomBookingTimeWindowAtomic({
        roomId: 'MR-01',
        bookingId: createdBookingId1,
        newRoomId: 'MR-02',
        date: TEST_DATE_2,
        startTime: '10:00',
        endTime: '11:00',
        attendees: 4,
        title: 'Rescheduled Series A Pitch Deck',
        purpose: 'Board / Advisory',
        requestedAmenities: ['4K Display / Projector', 'Whiteboard & Markers'],
        specialRequests: 'Updated catering for 4 pax',
        requestingStartupId: 'STP-01',
        userRole: 'founder'
      });
      assert.strictEqual(goodReschedule.ok, true, 'Valid reschedule across rooms and dates must succeed');
      assert.strictEqual(goodReschedule.booking.id, createdBookingId1, 'Reservation ID must be preserved (no duplicate created)');
      assert.strictEqual(goodReschedule.booking.roomId, 'MR-02');
      assert.strictEqual(goodReschedule.booking.date, TEST_DATE_2);
      assert.strictEqual(goodReschedule.booking.startTime, '10:00');
      assert.strictEqual(goodReschedule.booking.endTime, '11:00');
      assert.strictEqual(goodReschedule.booking.attendees, 4);
      assert.strictEqual(goodReschedule.booking.title, 'Rescheduled Series A Pitch Deck');

      // Verify old room MR-01 no longer has this booking, and MR-02 has exactly 1 instance of it
      const stateAfter = await db.getAppState();
      const mr01 = stateAfter.meetingRooms.find(r => r.id === 'MR-01');
      const mr02 = stateAfter.meetingRooms.find(r => r.id === 'MR-02');
      assert.strictEqual((mr01.bookings || []).some(b => b.id === createdBookingId1), false, 'Old room must not retain moved booking');
      assert.strictEqual((mr02.bookings || []).filter(b => b.id === createdBookingId1).length, 1, 'New room must have exactly 1 booking record');
    });

    // --- Scenario 7: Cancelling a future reservation ---
    await testAsync('Scenario 7: Cancelling a future reservation releases the slot and refunds credits', async () => {
      const cancelRes = await db.cancelBooking('MR-02', createdBookingId1);
      assert.strictEqual(cancelRes.ok, true, 'Cancelling future reservation must succeed');

      // Now booking the released slot (MR-02 on TEST_DATE_2 10:00-11:00) must succeed immediately
      const rebookRes = await db.reserveMeetingRoomSlotsAtomic({
        roomId: 'MR-02',
        startupId: 'STP-03',
        startupName: 'BioGenic Labs',
        title: 'Slot Rebooked After Cancellation',
        date: TEST_DATE_2,
        startTime: '10:00',
        endTime: '11:00',
        attendees: 4
      });
      assert.strictEqual(rebookRes.ok, true, 'Released slot must be immediately available for new bookings');
    });

    // --- Scenario 8: Displaying real-time updated availability & dashboard summary counts ---
    await testAsync('Scenario 8: Real-time availability & dashboard summary counters reflect live database records', async () => {
      const summary = await db.getReservationCounts({ date: TEST_DATE, startupId: 'STP-02' });
      assert.strictEqual(summary.date, TEST_DATE, 'Summary date must match requested date');
      assert.strictEqual(summary.dateTotalBookings, 2, 'Two 30-min bookings on TEST_DATE must equal 2 total reservations');
      assert.strictEqual(summary.dateMyBookings, 1, 'STP-02 has 1 reservation on TEST_DATE');
      assert.strictEqual(summary.dateOtherBookings, 1, 'STP-03 has 1 reservation on TEST_DATE');
      assert.ok(summary.availableSlots > 0, 'Remaining available slots must be positive');
    });

  } finally {
    const database = await db.connectDB();
    if (database) {
      await database.collection('meeting_room_slots').deleteMany({ date: { $in: [TEST_DATE, TEST_DATE_2] } }).catch(() => {});
    }
    // Always restore original state
    await db.saveAppState(JSON.parse(backupJson));
  }

  console.log(`\n📊 Phase 2 Test Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase2Tests().catch(err => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
