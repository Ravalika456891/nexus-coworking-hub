const fs = require('fs');
const path = require('path');
const vm = require('vm');

let elementMap = {};
function createMockElement(id) {
  return {
    id,
    disabled: false,
    innerHTML: '',
    style: {},
    remove: function() { delete elementMap[this.id]; },
    insertAdjacentHTML: function(pos, html) { mockDoc.body.insertAdjacentHTML(pos, html); },
    classList: {
      add: function(c) { this[c] = true; },
      remove: function(c) { delete this[c]; },
      contains: function(c) { return !!this[c]; }
    }
  };
}

const mockDoc = {
  getElementById: (id) => {
    if (!elementMap[id]) elementMap[id] = createMockElement(id);
    return elementMap[id];
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  body: {
    classList: { add: () => {}, remove: () => {} },
    insertAdjacentHTML: (pos, html) => {
      const idMatches = html.matchAll(/id=["']([^"']+)["']/g);
      for (const m of idMatches) {
        if (!elementMap[m[1]]) elementMap[m[1]] = createMockElement(m[1]);
      }
    }
  }
};

const mockStore = {
  getMeetingRooms: () => [
    {
      id: 'mr-001',
      name: 'Boardroom Alpha',
      roomNumber: '1F-R01',
      floor: '1F',
      capacity: 4,
      hourlyRate: 1500,
      bookings: [
        { id: 'b1', date: '2026-11-03', startTime: '15:00', endTime: '17:00', status: 'Confirmed', startupName: 'Acme' }
      ]
    }
  ],
  getStartups: () => [{ id: 's1', name: 'Acme', includedMeetingHours: 12, usedMeetingHours: 2 }],
  getMeetingRoomPolicies: () => ({})
};

const sandbox = {
  window: {},
  document: mockDoc,
  store: mockStore,
  console: console,
  Intl,
  Date,
  Math,
  setTimeout,
  clearTimeout,
  parseInt,
  Number,
  String
};
sandbox.window = sandbox;
sandbox.window.store = mockStore;

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'roomGallery.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const RG = sandbox.RoomGallery;
RG.openDetails('mr-001');

console.log('activeRoomId:', RG.activeRoomId);
console.log('selectedSlot:', RG.selectedSlot);
const footBtn = mockDoc.getElementById('rg-foot-book-btn');
console.log('footBtn state initially:', { disabled: footBtn.disabled, innerHTML: footBtn.innerHTML });

if (footBtn.disabled) {
  throw new Error('FAIL: FootBtn should NOT be disabled when an open slot is selected');
}
if (!footBtn.innerHTML.includes('Confirm & Book Now')) {
  throw new Error('FAIL: FootBtn should say Confirm & Book Now');
}

console.log('Selecting slot 17:30...');
RG.selectSlot('17:30');
console.log('selectedSlot after selecting 17:30:', RG.selectedSlot);
console.log('footBtn after selecting 17:30:', { disabled: footBtn.disabled, innerHTML: footBtn.innerHTML });
if (footBtn.disabled) {
  throw new Error('FAIL: FootBtn should NOT be disabled after selecting open slot 17:30');
}

console.log('Changing duration to 30m...');
RG.selectDuration(30);
console.log('duration:', RG.selectedDurationMins);
console.log('footBtn after duration 30m:', { disabled: footBtn.disabled, innerHTML: footBtn.innerHTML });
if (footBtn.disabled) {
  throw new Error('FAIL: FootBtn should NOT be disabled after duration change');
}

console.log('Testing proceedToBooking...');
let bookingPayload = null;
sandbox.store.bookMeetingRoom = async (payload) => {
  bookingPayload = payload;
  return { success: true, booking: { id: 'BKG-999', ...payload } };
};

RG.proceedToBooking('mr-001').then(() => {
  console.log('proceedToBooking completed successfully with payload:', bookingPayload);
  if (!bookingPayload || bookingPayload.roomId !== 'mr-001' || bookingPayload.startTime !== '17:30') {
    throw new Error('FAIL: proceedToBooking did not book expected room/slot');
  }
  console.log('\n🎉 ALL ROOM GALLERY BOOKING VALIDATIONS PASSED!');
});
