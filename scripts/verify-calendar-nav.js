const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('Testing Meeting Room Calendar & Room Cards navigation...');

// Mock environment
let renderedHtml = '';
let currentTabCalled = null;
const mockStore = {
  getMeetingRooms: () => [
    { id: 'mr-001', name: 'Boardroom Alpha', code: '1F-R01', floor: '1F', capacity: 4, hourlyRate: 1500, status: 'Available', bookings: [] },
    { id: 'mr-002', name: 'Pitch Arena Nexus', code: '1F-R02', floor: '1F', capacity: 6, hourlyRate: 3000, status: 'Available', bookings: [] },
    { id: 'mr-003', name: 'Brainstorm Pod Beta', code: '2F-R01', floor: '2F', capacity: 6, hourlyRate: 2000, status: 'Available', bookings: [] },
    { id: 'mr-004', name: 'Focus Room Quantum', code: '3F-R01', floor: '3F', capacity: 4, hourlyRate: 1500, status: 'Available', bookings: [] },
    { id: 'mr-005', name: 'Executive Suite Zenith', code: '3F-R02', floor: '3F', capacity: 8, hourlyRate: 2500, status: 'Available', bookings: [] },
    { id: 'mr-006', name: 'Collaboration Lab Gamma', code: '4F-R01', floor: '4F', capacity: 6, hourlyRate: 1800, status: 'Available', bookings: [] },
    { id: 'mr-007', name: 'Training Room Delta', code: '6F-R01', floor: '6F', capacity: 4, hourlyRate: 2200, status: 'Available', bookings: [] },
    { id: 'mr-008', name: 'Creative Studio Epsilon', code: '6F-R02', floor: '6F', capacity: 6, hourlyRate: 1200, status: 'Available', bookings: [] },
    { id: 'mr-009', name: 'Workshop Room Sigma', code: '7F-R01', floor: '7F', capacity: 4, hourlyRate: 1800, status: 'Available', bookings: [] },
    { id: 'mr-010', name: 'Innovation Amphitheater', code: '7F-R02', floor: '7F', capacity: 8, hourlyRate: 3500, status: 'Available', bookings: [] }
  ],
  getStartups: () => [
    { id: 'stp-001', name: 'Acme AI', includedMeetingHours: 12, usedMeetingHours: 2 }
  ],
  getCurrentRoleInfo: () => ({ name: 'Founder' }),
  getMaintenanceBlocks: () => [],
  canPerformAction: () => true,
  normalizeRole: (r) => r || 'founder',
  currentRole: 'founder',
  activeFounderId: 'stp-001'
};

const mockApp = {
  currentTab: 'calendar',
  switchTab(tabId) {
    this.currentTab = tabId;
    currentTabCalled = tabId;
    if (tabId === 'meetingRooms') {
      sandbox.MeetingRoomsModule.switchTab('explore');
    }
  },
  showToast: () => {}
};

const mockContainer = {
  set innerHTML(val) { renderedHtml = val; },
  get innerHTML() { return renderedHtml; }
};

const mockDoc = {
  getElementById: (id) => {
    if (id === 'view-meetingRooms') return mockContainer;
    return null;
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const sandbox = {
  window: {
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  document: mockDoc,
  store: mockStore,
  App: mockApp,
  console: console,
  Intl: Intl,
  Date: Date,
  Math: Math,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: () => {},
  clearInterval: () => {}
};
sandbox.window = sandbox;
sandbox.addEventListener = () => {};
sandbox.removeEventListener = () => {};
sandbox.window.store = mockStore;
sandbox.window.App = mockApp;

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'meetingRooms.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const MR = sandbox.MeetingRoomsModule;

console.log('1. Verifying initial state...');
if (!MR) throw new Error('MeetingRoomsModule not loaded');

console.log('2. Switching to calendar view...');
MR.switchTab('calendar');
MR.render();

if (!renderedHtml.includes('Interactive Day Timeline Calendar')) {
  throw new Error('Day timeline calendar not rendered in calendar mode');
}

console.log('3. Checking that "Switch to Room Cards" button is removed...');
if (renderedHtml.includes('Switch to Room Cards')) {
  throw new Error('FAIL: "Switch to Room Cards" is still present in rendered HTML!');
} else {
  console.log('✅ PASS: "Switch to Room Cards" button is removed!');
}

console.log('4. Checking that "Back to Room Cards" button exists...');
if (!renderedHtml.includes('Back to Room Cards')) {
  throw new Error('FAIL: "Back to Room Cards" button not found in rendered HTML!');
} else {
  console.log('✅ PASS: "Back to Room Cards" button is present!');
}

console.log('5. Testing clicking "Back to Room Cards" (calling setSchedulerViewMode("cards"))...');
currentTabCalled = null;
MR.setSchedulerViewMode('cards');

if (currentTabCalled !== 'meetingRooms') {
  throw new Error(`FAIL: App.switchTab was not called with 'meetingRooms' (called: ${currentTabCalled})`);
}
if (MR.activeTab !== 'scheduler') {
  throw new Error(`FAIL: MeetingRoomsModule.activeTab is ${MR.activeTab}, expected 'scheduler'`);
}
if (MR.schedulerViewMode !== 'cards') {
  throw new Error(`FAIL: MeetingRoomsModule.schedulerViewMode is ${MR.schedulerViewMode}, expected 'cards'`);
}
if (!renderedHtml.includes('hub-main-grid')) {
  throw new Error('FAIL: Room cards grid (hub-main-grid) not rendered after Back to Room Cards!');
}
console.log('✅ PASS: Successfully navigated back to Room Cards view with App.switchTab sync!');

console.log('6. Testing standalone setSchedulerViewMode("cards") when App is undefined...');
delete sandbox.App;
delete sandbox.window.App;
MR.switchTab('calendar');
MR.render();
if (!renderedHtml.includes('Interactive Day Timeline Calendar')) {
  throw new Error('Day calendar should be rendered');
}
MR.setSchedulerViewMode('cards');
if (MR.activeTab !== 'scheduler' || MR.schedulerViewMode !== 'cards' || !renderedHtml.includes('hub-main-grid')) {
  throw new Error('FAIL: Standalone setSchedulerViewMode("cards") failed');
}
console.log('✅ PASS: Standalone setSchedulerViewMode("cards") also works cleanly!');

console.log('\n🎉 ALL CALENDAR & ROOM CARDS NAVIGATION TESTS PASSED!');
