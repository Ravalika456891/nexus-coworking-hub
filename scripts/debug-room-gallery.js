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
      // Find elements with ids in html
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
  Intl: Intl,
  Date: Date,
  Math: Math,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  parseInt: parseInt,
  Number: Number,
  String: String
};
sandbox.window = sandbox;
sandbox.window.store = mockStore;

let code = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'roomGallery.js'), 'utf8');

// Test moving closeDetails to top of openDetails
code = code.replace('openDetails(roomId) {\n    const room = this.getRoom(roomId);', 'openDetails(roomId) {\n    this.closeDetails();\n    const room = this.getRoom(roomId);');
code = code.replace('    this.closeDetails();\n    const mount', '    const mount');

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const RG = sandbox.RoomGallery;
RG.openDetails('mr-001');

console.log('activeRoomId:', RG.activeRoomId);
console.log('activeDate:', RG.activeDate);
console.log('selectedDurationMins:', RG.selectedDurationMins);
console.log('selectedSlot:', RG.selectedSlot);

const footBtn = mockDoc.getElementById('rg-foot-book-btn');
console.log('footBtn state:', {
  disabled: footBtn.disabled,
  innerHTML: footBtn.innerHTML
});

const room = RG.getRoom(RG.activeRoomId);
const slots = RG.getSlotsForDate(room, RG.activeDate, 60);
console.log('Slots 16:30 - 18:30:');
slots.filter(s => s.start >= '16:30' && s.start <= '18:30').forEach(s => {
  console.log(`  ${s.start}: state=${s.state}, disabled=${s.disabled}`);
});

console.log('\nNow calling RG.selectSlot("17:00")...');
RG.selectSlot('17:00');
console.log('selectedSlot:', RG.selectedSlot);
console.log('footBtn state after selectSlot:', {
  disabled: footBtn.disabled,
  innerHTML: footBtn.innerHTML
});
