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
    classList: { add() {}, remove() {}, contains() { return false; } }
  },
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
  liveMinutes: 7 * 60, // 07:00 AM (before morning session opens at 08:00 AM)
  liveTime12: '07:00 AM'
});

// A. Test Duration options: 30m, 1hr, 1.5hrs, 2hrs, 3hrs
const durations = [30, 60, 90, 120, 180];
console.log('\n--- Test 1: Full-Duration Slots & Conflict Formula ---');
durations.forEach(dur => {
  const slots = gallery.getSlotsForDate(testRoom, '2026-11-03', dur);
  const openSlots = slots.filter(s => s.state === 'open');
  console.log(`Duration: ${dur} mins -> Total Slots: ${slots.length}, Open: ${openSlots.length}`);
  assert(slots.length > 0, `Slots must be generated for ${dur}m duration`);
  
  // Verify that any slot marked open has space for the FULL duration
  openSlots.forEach(slot => {
    const [sh, sm] = slot.start.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = startMin + dur;
    
    // Check against session boundary (Morning closes at 11:00 AM / 660, Afternoon at 07:00 PM / 1140)
    const inMorning = startMin >= 480 && endMin <= 660;
    const inAfternoon = startMin >= 900 && endMin <= 1140;
    assert(inMorning || inAfternoon, `Slot ${slot.start} with duration ${dur}m (${endMin} min) must not breach session close`);
    
    // Check conflicts against existing bookings
    (testRoom.bookings || []).forEach(b => {
      if (b.date === '2026-11-03' && b.status !== 'Cancelled') {
        const [bsh, bsm] = b.startTime.split(':').map(Number);
        const [beh, bem] = b.endTime.split(':').map(Number);
        const bStart = bsh * 60 + bsm;
        const bEnd = beh * 60 + bem;
        const overlaps = startMin < bEnd && endMin > bStart;
        assert(!overlaps, `Open slot ${slot.start} must not overlap booking ${b.startTime}-${b.endTime}`);
      }
    });
  });
});
console.log('✓ All 5 durations correctly enforce session boundaries and booking non-overlap.');

// B. Test Duration button selection & auto-relocation
console.log('\n--- Test 2: Duration Change & Slot Invalidation ---');
gallery.activeRoomId = testRoom.id;
gallery.activeDate = '2026-11-03';
gallery.selectDuration(60); // 1hr
assert.strictEqual(gallery.selectedDurationMins, 60, 'Selected duration should be 60m');

// Pick 10:00 AM (ends at 11:00 AM - morning close)
gallery.selectedSlot = '10:00';
// Now switch to 2hrs (120 mins) -> 10:00 AM to 12:00 PM breaches 11:00 AM close!
gallery.selectDuration(120);
console.log(`Switched to 120m duration; slot automatically relocated to: ${gallery.selectedSlot}`);
assert.notStrictEqual(gallery.selectedSlot, '10:00', '10:00 AM must be invalidated because 2hr duration exceeds 11:00 AM closing');

// C. Test HTML Rendering in renderBookingSection
console.log('\n--- Test 3: HTML Rendering & Labels ---');
const bookingHtml = gallery.renderBookingSection(testRoom, '2026-11-03');
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
const initialDate = MR.selectedDate;
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
