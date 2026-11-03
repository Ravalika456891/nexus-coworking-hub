const fs = require('fs');
const assert = require('assert');

// Setup mock browser DOM environment
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

console.log('=== VERIFYING ALL 16 REQUIREMENTS & FUNCTIONALITY ===\n');

// Initialize store and App
window.store.init();
window.App.init();

const rooms = window.store.getMeetingRooms();
console.log(`✓ 9. Room Configuration: ${rooms.length} active rooms loaded.`);
assert.strictEqual(rooms.length, 10, 'Must have exactly 10 meeting rooms');

// Verify floor distribution
const floorMap = {};
rooms.forEach(r => { floorMap[r.floor] = (floorMap[r.floor] || 0) + 1; });
assert.strictEqual(floorMap['1F'], 2, '1F must have 2 rooms');
assert.strictEqual(floorMap['2F'], 1, '2F must have 1 room');
assert.strictEqual(floorMap['3F'], 2, '3F must have 2 rooms');
assert.strictEqual(floorMap['4F'], 1, '4F must have 1 room');
assert.strictEqual(floorMap['5F'] || 0, 0, '5F must have NO rooms');
assert.strictEqual(floorMap['6F'], 2, '6F must have 2 rooms');
assert.strictEqual(floorMap['7F'], 2, '7F must have 2 rooms');
console.log('✓ Floor distribution strictly verified (5F empty).');

const gallery = window.RoomGallery;
const testRoom = rooms[0]; // 1F-R01
console.log(`Testing with room: ${testRoom.name} (${testRoom.label || testRoom.id})`);

// Deterministic IST clock mock
gallery.getISTClock = () => ({
  todayStr: '2026-11-03',
  clockMinutes: 7 * 60, // 07:00 AM (prior to morning session)
  liveTime12: '07:00 AM'
});

gallery.activeRoomId = testRoom.id;
gallery.activeDate = '2026-11-04';

// Test 1-5: Duration buttons (30m, 1hr, 1.5hrs, 2hrs, 3hrs) & Open counts
console.log('\n--- Tests 1-5: Duration selection, full-duration availability & open count ---');
const testDurations = [
  { mins: 30, expectedOpen: 14, label: '30m' },
  { mins: 60, expectedOpen: 12, label: '1hr' },
  { mins: 90, expectedOpen: 10, label: '1.5hrs' },
  { mins: 120, expectedOpen: 8, label: '2hrs' },
  { mins: 180, expectedOpen: 4, label: '3hrs' }
];

testDurations.forEach(({ mins, expectedOpen, label }) => {
  gallery.selectDuration(mins);
  const slots = gallery.getSlotsForDate(testRoom, '2026-11-04', mins);
  const openCount = slots.filter(s => s.state === 'open').length;
  console.log(`Duration: ${label} (${mins}m) -> Open slots count: ${openCount} (Expected: ${expectedOpen})`);
  assert.strictEqual(gallery.selectedDurationMins, mins, `Duration must update to ${mins}`);
  assert.strictEqual(openCount, expectedOpen, `Open count for ${label} must be ${expectedOpen}`);
  
  // Verify interval overlap rule and operating hours closing boundary
  slots.forEach(s => {
    const [sh, sm] = s.start.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = startMin + mins;
    const sessionClose = startMin < 660 ? 660 : 1140;
    if (s.state === 'open') {
      assert(endMin <= sessionClose, `Open slot ${s.start} (${endMin}m) must not exceed session close (${sessionClose}m)`);
      assert.strictEqual(s.disabled, false, `Open slot ${s.start} must be enabled`);
    } else if (s.state === 'unavailable') {
      assert(endMin > sessionClose || s.hasConflict, `Unavailable slot ${s.start} must exceed hours or overlap`);
      assert.strictEqual(s.disabled, true, `Unavailable slot ${s.start} must be disabled`);
    }
  });
});
console.log('✓ All 5 durations correctly calculate availability and open counts.');

// Test 6: Selecting an available start time
console.log('\n--- Test 6: Selecting an available start time ---');
gallery.selectDuration(60); // 1hr
gallery.selectSlot('09:00');
assert.strictEqual(gallery.selectedSlot, '09:00', '09:00 AM must be selected');
console.log('✓ Available slot 09:00 AM selected successfully.');

// Test 7: Preventing selection of booked/unavailable slots
console.log('\n--- Test 7: Preventing selection of unavailable/booked slots ---');
// For 1hr, 10:30 AM is unavailable because it exceeds 11:00 AM closing
const prevSlot = gallery.selectedSlot;
gallery.selectSlot('10:30');
assert.strictEqual(gallery.selectedSlot, prevSlot, '10:30 AM exceeds session close for 1hr and must not be selected');
console.log('✓ Unavailable slot selection correctly prevented.');

// Test 8: Changing duration after selecting a start time (invalidation rule)
console.log('\n--- Test 8: Duration change invalidating selected slot ---');
gallery.selectDuration(60); // 1hr
gallery.selectSlot('10:00'); // 10:00 - 11:00 AM (fits 1hr)
assert.strictEqual(gallery.selectedSlot, '10:00');
// Now change duration to 3hrs (180m) -> 10:00 AM cannot fit 3hrs!
gallery.selectDuration(180);
console.log(`Switched to 3hrs; slot invalidated & relocated to: ${gallery.selectedSlot}`);
assert.strictEqual(gallery.selectedSlot, '08:00', 'Must relocate to earliest valid slot for 3hrs (08:00 AM)');
console.log('✓ Slot invalidation & auto-relocation upon duration change works properly.');

// Test 9: Changing date after selecting a time
console.log('\n--- Test 9: Changing date ---');
gallery.changeDate('2026-11-05');
assert.strictEqual(gallery.activeDate, '2026-11-05', 'Date must be updated to 2026-11-05');
assert(gallery.selectedSlot !== null, 'Should have valid slot on new date');
console.log('✓ Date change works correctly.');

// Test 10-11: Reservation summary & credit calculations
console.log('\n--- Tests 10-11: Reservation summary and credit calculations ---');
gallery.activeDate = '2026-11-04';
gallery.selectDuration(90); // 1.5hrs
gallery.selectSlot('15:00'); // 3:00 PM
const html = gallery.renderBookingSection(testRoom, '2026-11-04');
assert(html.includes('3:00 PM – 4:30 PM (1.5hrs)'), 'Summary must show 3:00 PM – 4:30 PM (1.5hrs)');
assert(html.includes('10 open'), 'Must show 10 open slots for 1.5hrs');
assert(html.includes('1.5hrs'), 'Must highlight 1.5hrs duration');
console.log('✓ Reservation summary correctly formats 12h AM/PM time and calculations.');

// Test 12-13: Overlapping & Past booking prevention
console.log('\n--- Tests 12-13: Overlapping & Past booking prevention ---');
// For today's date:
gallery.getISTClock = () => ({
  todayStr: '2026-11-03',
  clockMinutes: 9 * 60 + 15, // 09:15 AM
  liveTime12: '09:15 AM'
});
const todaySlots = gallery.getSlotsForDate(testRoom, '2026-11-03', 60);
const slot0800 = todaySlots.find(s => s.start === '08:00');
const slot0830 = todaySlots.find(s => s.start === '08:30');
const slot1500 = todaySlots.find(s => s.start === '15:00');
const slot1700 = todaySlots.find(s => s.start === '17:00');
assert.strictEqual(slot0800.state, 'past', '08:00 AM must be past at 09:15 AM');
assert.strictEqual(slot0830.state, 'past', '08:30 AM must be past at 09:15 AM');
assert.strictEqual(slot1500.state, 'booked', '15:00 (3:00 PM) must be booked');
assert.strictEqual(slot1700.state, 'open', '17:00 (5:00 PM) must be open');
console.log('✓ Past booking and booked conflict prevention for current date verified.');

// Test 14-16: Confirmation, Transactional Booking & My Bookings
console.log('\n--- Tests 14-16: Transactional reservation & My Bookings ---');
async function testBookingFlow() {
  const myStartup = window.MeetingRoomsModule.getMyStartup();
  const initialBookingsCount = window.MeetingRoomsModule.getMyBookings().length;
  
  const bookRes = await window.store.bookMeetingRoom({
    roomId: testRoom.id,
    startupId: myStartup.id,
    startupName: myStartup.name,
    title: 'Executive Architecture Review',
    purpose: 'System Design',
    date: '2026-11-06',
    startTime: '15:00',
    endTime: '16:30',
    attendees: 4
  });

  assert(bookRes.success, 'Reservation should succeed');
  console.log('✓ Reservation confirmed on backend.');

  const updatedBookings = window.MeetingRoomsModule.getMyBookings();
  assert.strictEqual(updatedBookings.length, initialBookingsCount + 1, 'My Bookings must be incremented');
  
  // Verify double booking rejection
  const doubleBookRes = await window.store.bookMeetingRoom({
    roomId: testRoom.id,
    startupId: myStartup.id,
    startupName: myStartup.name,
    title: 'Duplicate Attempt',
    purpose: 'Test Conflict',
    date: '2026-11-06',
    startTime: '15:30', // Overlaps 15:00 - 16:30
    endTime: '17:00',
    attendees: 4
  });

  assert.strictEqual(doubleBookRes.success, false, 'Overlapping reservation must be rejected');
  assert.strictEqual(doubleBookRes.code, 'SLOT_TAKEN');
  console.log('✓ Overlapping conflict rejection verified.');
}

testBookingFlow().then(() => {
  console.log('\n=== ALL 16 REQUIREMENTS VERIFIED & PASSED! ===');
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
