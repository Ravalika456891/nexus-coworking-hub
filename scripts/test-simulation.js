const fs = require('fs');
const vm = require('vm');

class CustomEvent {
  constructor(type, options) {
    this.type = type;
    this.detail = options ? options.detail : null;
  }
}

const elements = {};
function getEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      innerHTML: '',
      innerText: '',
      style: {},
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
      },
      querySelectorAll: (sel) => [],
      querySelector: (sel) => null,
      addEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      dataset: {}
    };
  }
  return elements[id];
}

const navItems = [
  { dataset: { tab: 'dashboard' }, classList: getEl('nav-dash').classList, style: {}, addEventListener: () => {}, getAttribute: () => 'dashboard', querySelector: () => null },
  { dataset: { tab: 'billingCredits' }, id: 'nav-item-billingCredits', classList: getEl('nav-bc').classList, style: {}, addEventListener: () => {}, getAttribute: () => 'billingCredits', querySelector: () => null }
];

const viewContainers = [
  getEl('view-dashboard'),
  getEl('view-meetingRooms'),
  getEl('view-billingCredits')
];

let storedData = {
  nexus_auth_session: JSON.stringify({ userId: 'USR-FOUNDER-1', role: 'startup', activeStartupId: 'STP-XYZ' })
};

const domWindow = {
  CustomEvent,
  Event: CustomEvent,
  document: {
    addEventListener: () => {},
    documentElement: {
      setAttribute: () => {},
      getAttribute: () => 'light',
      classList: { add: () => {}, remove: () => {}, toggle: () => {} }
    },
    getElementById: (id) => getEl(id),
    querySelectorAll: (sel) => {
      if (sel === '.nav-item') return navItems;
      if (sel === '.view-container') return viewContainers;
      return [];
    },
    querySelector: (sel) => null,
    body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } }
  },
  sessionStorage: { getItem: (k) => storedData[k] || null, setItem: (k, v) => { storedData[k] = v; } },
  localStorage: { getItem: (k) => storedData[k] || null, setItem: (k, v) => { storedData[k] = v; } },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  location: { hostname: 'localhost' },
  scrollTo: () => {}
};
domWindow.window = domWindow;
domWindow.window.dispatchEvent = () => {};
domWindow.window.addEventListener = () => {};

const scripts = [
  'js/initialData.js',
  'creditService.js',
  'billingService.js',
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
  try {
    const code = fs.readFileSync(s, 'utf8');
    vm.runInNewContext(code, domWindow, { filename: s });
  } catch (err) {
    console.error('Error running script:', s, err);
    process.exit(1);
  }
}

console.log('App object exists?', typeof domWindow.App);
console.log('MeetingRoomsModule exists?', typeof domWindow.MeetingRoomsModule);

try {
  domWindow.App.init();
  console.log('App.init() ran successfully.');
  console.log('Now calling App.switchTab("billingCredits")...');
  domWindow.App.switchTab('billingCredits');
  const viewMR = getEl('view-meetingRooms');
  console.log('view-meetingRooms active?', viewMR.classList.contains('active'));
  console.log('view-meetingRooms HTML length:', viewMR.innerHTML.length);
  console.log('view-meetingRooms starts with:\n', viewMR.innerHTML.slice(0, 250));
} catch (err) {
  console.error('Crash during switchTab:', err);
}
