const fs = require('fs');
const assert = require('assert');

// Setup mock browser environment
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
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        toggle(c, f) { if (f ?? !this.contains(c)) this.add(c); else this.remove(c); },
        contains(c) { return this._classes.has(c); }
      },
      querySelectorAll: () => [],
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {}
    };
  }
  return elements[id];
};

global.window = {
  INITIAL_DATA: {},
  location: { hostname: 'nexus-coworking-hub.vercel.app', pathname: '/app' },
  addEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: function(n, o) { this.name = n; this.detail = o ? o.detail : null; },
  scrollTo: () => {}
};
global.window.window = global.window;
global.document = {
  hidden: true,
  body: {
    classList: { add() {}, remove() {}, contains() { return false; } },
    appendChild() {},
    removeChild() {}
  },
  createElement: () => ({
    style: {},
    classList: { add() {}, remove() {} },
    appendChild() {},
    addEventListener: () => {},
    remove: () => {}
  }),
  documentElement: { setAttribute() {}, classList: { add() {}, remove() {}, contains() { return false; } } },
  getElementById: getEl,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.sessionStorage = { getItem: (k) => k === 'nexus_auth_token' ? 'token' : null, setItem: () => {}, removeItem: () => {} };
global.localStorage = {
  _s: { nexus_session_authenticated: 'true' },
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = v; },
  removeItem(k, v) { delete this._s[k]; }
};

const scripts = [
  'js/initialData.js',
  'js/store.js',
  'js/modules/dashboard.js',
  'js/modules/onboarding.js',
  'js/modules/startupTables.js',
  'cancellation.js',
  'js/modules/workspace.js',
  'js/modules/roomGallery.js',
  'js/modules/meetingRooms.js',
  'js/modules/invoice.js',
  'js/modules/billing.js',
  'js/modules/payments.js',
  'js/modules/incubation.js',
  'js/modules/milestones.js',
  'js/modules/reports.js',
  'js/modules/contact.js',
  'js/modules/leads.js',
  'js/modules/database.js',
  'js/authGate.js',
  'js/main.js'
];

for (const s of scripts) {
  eval(fs.readFileSync(s, 'utf8'));
}
for (const k of Object.keys(global.window)) {
  global[k] = global.window[k];
}

global.fetch = (url, opts) => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });

console.log('=== VERIFYING BOOKING SYSTEM & BUTTONS ===\n');

// 1. Initialize store and App
window.store.init();
window.App.init();

const rooms = window.store.getMeetingRooms();
console.log(`✓ Meeting Rooms loaded: ${rooms.length} active rooms.`);
assert.strictEqual(rooms.length, 10, 'Must have exactly 10 meeting rooms');

// 2. Test RoomGallery Date and Duration Logic
const gallery = window.RoomGallery;
const testRoom = rooms[0]; // 1F-R01
console.log(`Testing with room: ${testRoom.name} (${testRoom.label || testRoom.id})`);

// Mock IST clock for deterministic testing
gallery.getISTClock = () => ({
  todayStr: '2026-11-03',
  clockMinutes: 7 * 60, // 07:00 AM (before morning session opens at 08:00 AM)
  liveTime12: '07:00 AM'
});

// A. Test Duration options: 30m, 1hr, 1.5hrs, 2hrs, 3hrs
console.log('\n--- Test 1: Slots generation and availability ---');
const slots = gallery.getSlotsForDate(testRoom, '2026-11-03', 60);
const openSlots = slots.filter(s => s.state === 'open');
console.log(`Total slots: ${slots.length}, Open slots: ${openSlots.length}`);
assert(slots.length === 14, 'Must have 14 operating slots');
assert(openSlots.length > 0, 'Must have open slots');

// B. Test Clicking Any Slot and Adaptive Duration
console.log('\n--- Test 2: Click handling & Duration Adaptation ---');
gallery.activeRoomId = testRoom.id;
gallery.activeDate = '2026-11-04'; // Pick date without conflicts
gallery.selectedDurationMins = 180; // 3 hrs

// Click 08:30 AM
gallery.selectSlot('08:30');
console.log(`Clicked 08:30 AM -> Slot: ${gallery.selectedSlot}, Duration: ${gallery.selectedDurationMins}m`);
assert.strictEqual(gallery.selectedSlot, '08:30', '08:30 must be selected');
assert.strictEqual(gallery.selectedDurationMins, 120, 'Duration should adapt to 120m to fit morning close at 11:00 AM');

// Click 10:00 AM
gallery.selectSlot('10:00');
console.log(`Clicked 10:00 AM -> Slot: ${gallery.selectedSlot}, Duration: ${gallery.selectedDurationMins}m`);
assert.strictEqual(gallery.selectedSlot, '10:00', '10:00 must be selected');
assert.strictEqual(gallery.selectedDurationMins, 60, 'Duration should adapt to 60m');

// Click 10:30 AM
gallery.selectSlot('10:30');
console.log(`Clicked 10:30 AM -> Slot: ${gallery.selectedSlot}, Duration: ${gallery.selectedDurationMins}m`);
assert.strictEqual(gallery.selectedSlot, '10:30', '10:30 must be selected');
assert.strictEqual(gallery.selectedDurationMins, 30, 'Duration should adapt to 30m');

// Click 3 hrs duration button
gallery.selectDuration(180);
console.log(`Clicked 3 hrs -> Duration: ${gallery.selectedDurationMins}m, Relocated slot to: ${gallery.selectedSlot}`);
assert.strictEqual(gallery.selectedDurationMins, 180);
assert.strictEqual(gallery.selectedSlot, '08:00', 'Must relocate to 08:00 AM which fits 3 hrs');

// Click 05:00 PM (17:00)
gallery.selectSlot('17:00');
console.log(`Clicked 05:00 PM -> Slot: ${gallery.selectedSlot}, Duration: ${gallery.selectedDurationMins}m`);
assert.strictEqual(gallery.selectedSlot, '17:00');
assert.strictEqual(gallery.selectedDurationMins, 120, '17:00 to 19:00 is 120m (2hrs)');

// C. Test HTML Rendering in renderBookingSection
console.log('\n--- Test 3: HTML Rendering & Labels ---');
const bookingHtml = gallery.renderBookingSection(testRoom, '2026-11-04');
assert(bookingHtml.includes('30m'), 'Must render 30m button');
assert(bookingHtml.includes('1hr'), 'Must render 1hr button');
assert(bookingHtml.includes('1.5hrs'), 'Must render 1.5hrs button');
assert(bookingHtml.includes('2hrs'), 'Must render 2hrs button');
assert(bookingHtml.includes('3hrs'), 'Must render 3hrs button');
assert(bookingHtml.includes('Today'), 'Must render Today button');
assert(bookingHtml.includes('Next Day'), 'Must render Next Day button');
console.log('✓ All 5 duration button labels and Today/Next Day present in rendered output.');

// D. Test MeetingRoomsModule Date and Duration buttons
console.log('\n--- Test 4: MeetingRoomsModule Card UI & Search Panel ---');
const MR = window.MeetingRoomsModule;
MR.setDate('2026-11-04');
assert.strictEqual(MR.selectedDate, '2026-11-04', 'Date must update when setDate is called');

const renderedCardsHtml = MR.renderSchedulerView({
  rooms,
  myStartup: MR.getMyStartup(),
  myBookingsToday: [],
  availableSlotsCount: 10,
  mySlotsCount: 0,
  otherSlotsCount: 0
});
assert(renderedCardsHtml.includes('Next Day'), 'Must render Next Day button in cards and search panel');
assert(renderedCardsHtml.includes('Today'), 'Must render Today button');
console.log('✓ MeetingRoomsModule rendered scheduler cards with Today and Next Day buttons.');

console.log('\n=== ALL BOOKING BUTTON TESTS PASSED SUCCESSFULLY! ===');
