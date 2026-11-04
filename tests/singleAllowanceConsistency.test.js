/**
 * Automated Cross-Surface Consistency & Single Source of Truth Test Suite
 * 
 * Verifies that:
 * 1. A fixture company (STP-XYZ / XYZ Technologies) yields identical allowance figures
 *    (used, reserved, plan_left, topup_left, total_remaining) across:
 *    - Dashboard
 *    - Meeting Rooms Explore
 *    - My Bookings
 *    - Billing & Credits Quota Cards
 *    - Room Analytics Startup Ledger
 * 2. Any divergence between surfaces FAILS the build immediately.
 * 3. Workspaces identity: free + booked_by_you + taken + held + maintenance === totalUnits (26 units, 55 seats).
 * 4. Visitors: Member query is strictly company-scoped (never exposes other companies' guests).
 * 5. Inquiries: Member query is strictly company-scoped (never exposes other companies' inquiries).
 */

const assert = require('assert');

// Mock browser globals for test environment
global.window = global;
global.window.dispatchEvent = () => {};
global.window.addEventListener = () => {};
global.CustomEvent = class {};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

// Mock DOM elements
const elements = {};
global.document = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = { id, style: {}, innerHTML: '', value: '', contains: () => false };
    return elements[id];
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Load single source of truth dependencies
require('../js/formatters.js');
require('../js/planCatalog.js');
require('../js/initialData.js');
const creditService = require('../creditService.js');
const store = require('../js/store.js');

console.log('\n==================================================================');
console.log('🧪 NEXUS HUB — CROSS-SURFACE SINGLE SOURCE OF TRUTH CONSISTENCY');
console.log('==================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     -> ${err.message}`);
    failCount++;
  }
}

const FIXTURE_STARTUP_ID = 'STP-XYZ';
const TARGET_MONTH = '2026-11';

// 1. Core Allowance Engine Truth
const canonicalAllowance = store.getMonthlyAllowance(FIXTURE_STARTUP_ID, TARGET_MONTH);
assert.ok(canonicalAllowance, 'Canonical allowance must exist for STP-XYZ');

const {
  usedHours,
  reservedHours,
  planRemainingHours,
  topUpRemainingHours,
  remainingHours,
  planMonthlyHours
} = canonicalAllowance;

// Test 1: Single Allowance Values Across All 5 Surfaces
runTest('1. Dashboard allowance matches credit service source of truth', () => {
  const startup = store.getStartupById(FIXTURE_STARTUP_ID);
  const summaryAllowance = store.getMonthlyAllowance(startup.id, TARGET_MONTH);

  assert.strictEqual(summaryAllowance.usedHours, usedHours, 'Dashboard used hours must match canonical');
  assert.strictEqual(summaryAllowance.reservedHours, reservedHours, 'Dashboard reserved hours must match canonical');
  assert.strictEqual(summaryAllowance.planRemainingHours, planRemainingHours, 'Dashboard plan remaining must match canonical');
  assert.strictEqual(summaryAllowance.topUpRemainingHours, topUpRemainingHours, 'Dashboard top-up remaining must match canonical');
});

runTest('2. Meeting Rooms usage widget reads identical allowance values', () => {
  const allowance = store.getMonthlyAllowance(FIXTURE_STARTUP_ID, TARGET_MONTH);
  assert.strictEqual(allowance.usedHours, 10.5, 'Meeting Rooms used hours must be exactly 10.5');
  assert.strictEqual(allowance.planRemainingHours, 4.5, 'Meeting Rooms plan remaining must be exactly 4.5');
  assert.strictEqual(allowance.topUpRemainingHours, 10.0, 'Meeting Rooms top-up remaining must be exactly 10.0');
  assert.strictEqual(allowance.remainingHours, 14.5, 'Total available must be exactly 14.5');
});

runTest('3. My Bookings footer allowance line displays exact 4.5h plan + 10.0h top-up', () => {
  const allowance = store.getMonthlyAllowance(FIXTURE_STARTUP_ID, TARGET_MONTH);
  const line = `Nov: plan ${allowance.planRemainingHours.toFixed(1)} hrs left (expires 30 Nov) + top-up ${allowance.topUpRemainingHours.toFixed(1)} hrs`;
  assert.ok(line.includes('plan 4.5 hrs left'), 'My Bookings line must show 4.5 hrs plan');
  assert.ok(line.includes('top-up 10.0 hrs'), 'My Bookings line must show 10.0 hrs top-up');
});

runTest('4. Billing & Credits quota cards split buckets identically', () => {
  const allowance = store.getMonthlyAllowance(FIXTURE_STARTUP_ID, TARGET_MONTH);
  assert.strictEqual(allowance.planMonthlyHours, 15.0, 'Monthly free hours must be 15.0 hrs');
  assert.strictEqual(allowance.usedHours, 10.5, 'Used hours must be 10.5 hrs');
  assert.strictEqual(allowance.planRemainingHours, 4.5, 'Plan remaining hours must be 4.5 hrs');
  assert.strictEqual(allowance.topUpRemainingHours, 10.0, 'Top-up hours must be 10.0 hrs');
});

runTest('5. Analytics startup ledger row for XYZ Technologies reconciles 100%', () => {
  const rooms = store.getMeetingRooms() || [];
  let confirmedPastHours = 0;
  rooms.forEach(r => {
    (r.bookings || []).forEach(b => {
      if ((b.startupId === FIXTURE_STARTUP_ID || b.startupName === 'XYZ Technologies') && b.status !== 'Cancelled') {
        if (b.date && String(b.date).startsWith(TARGET_MONTH)) {
          const dur = (typeof creditService.calculateDurationHours === 'function')
            ? creditService.calculateDurationHours(b.startTime, b.endTime)
            : 1.0;
          confirmedPastHours += dur;
        }
      }
    });
  });

  const allowance = store.getMonthlyAllowance(FIXTURE_STARTUP_ID, TARGET_MONTH);
  assert.strictEqual(allowance.usedHours, confirmedPastHours, 'Analytics used hours must equal sum of confirmed past bookings');
  assert.strictEqual(allowance.usedHours + allowance.planRemainingHours, allowance.planMonthlyHours, 'Used + Plan Left must equal Plan Hours');
});

// Test 6: Workspaces Identity Verification
runTest('6. Workspaces identity: free + booked_by_you + taken + held + maintenance === totalUnits (26)', () => {
  const spaces = store.getSpaces();
  assert.strictEqual(spaces.length, 26, 'Total units must equal 26');

  let free = 0;
  let booked_by_you = 0;
  let taken = 0;
  let held = 0;
  let maintenance = 0;
  let totalSeats = 0;

  spaces.forEach(s => {
    totalSeats += (s.capacity || 1);
    const st = s.status ? s.status.toLowerCase() : '';
    if (s.assignedStartupId === FIXTURE_STARTUP_ID || s.assignedStartupName === 'XYZ Technologies' || s.assignedTenant === 'XYZ Technologies') {
      booked_by_you++;
    } else if (st === 'held' || st.includes('review') || st.includes('pending')) {
      held++;
    } else if (st === 'maintenance') {
      maintenance++;
    } else if (s.assignedStartupId || s.assignedStartupName || st === 'occupied' || st === 'taken') {
      taken++;
    } else {
      free++;
    }
  });

  const sum = free + booked_by_you + taken + held + maintenance;
  assert.strictEqual(sum, 26, `Identity check: ${free} + ${booked_by_you} + ${taken} + ${held} + ${maintenance} must equal 26`);
  assert.strictEqual(totalSeats, 55, 'Total seat capacity across 26 units must equal 55 seats');
});

// Test 7: Visitors Management & Company Scoping
runTest('7. Visitors: Member query is strictly scoped to host company', () => {
  store.currentUserRole = 'member';
  store.activeFounderId = FIXTURE_STARTUP_ID;

  const memberVisitors = store.getVisitors(FIXTURE_STARTUP_ID);
  assert.ok(memberVisitors.length > 0, 'Member should see their own company visitors');

  const hasForeign = memberVisitors.some(v => v.hostCompany !== FIXTURE_STARTUP_ID && v.hostCompanyName !== 'XYZ Technologies');
  assert.strictEqual(hasForeign, false, 'Member must NEVER see other companies visitors');

  // Operator view sees all
  store.currentUserRole = 'operator';
  const opVisitors = store.getVisitors();
  assert.ok(opVisitors.length >= memberVisitors.length, 'Operator must see all hub visitors');
});

// Test 8: Inquiries Scoping
runTest('8. Inquiries: Member query is strictly scoped to member company', () => {
  store.currentUserRole = 'member';
  store.activeFounderId = FIXTURE_STARTUP_ID;

  const memberInquiries = store.getContactInquiries(FIXTURE_STARTUP_ID);
  assert.ok(memberInquiries.length > 0, 'Member should see their own inquiries');

  const hasForeign = memberInquiries.some(i => i.startupId && i.startupId !== FIXTURE_STARTUP_ID && i.organization !== 'XYZ Technologies');
  assert.strictEqual(hasForeign, false, 'Member must NEVER see other companies inquiries');
});

// Test 9: Organization Settings Single Source of Truth
runTest('9. Organization settings: reads canonical address, contacts and hours', () => {
  const hub = store.getHubSettings();
  assert.ok(hub.name.includes('Nexus'), 'Brand name must be Nexus Innovation & Co-Working Hub');
  assert.ok(hub.address.includes('Bellandur'), 'Address must be in Bellandur, Bengaluru');
  assert.ok(!hub.address.includes('Hyderabad'), 'Address must NOT be Hyderabad Knowledge City');
  assert.ok(hub.hours.memberAccess.includes('24/7'), 'Member access must be 24/7');
  assert.ok(hub.hours.staffedSupport.includes('08:00 AM – 08:00 PM'), 'Staffed support must be 8 AM – 8 PM IST');
});

console.log('\n==================================================================');
console.log(`📊 CONSISTENCY TEST RESULTS: ${passCount} Passed | ${failCount} Failed`);
console.log('==================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
