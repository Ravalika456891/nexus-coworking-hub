// Automated Test Suite: NEXUS HUB Startup Command Center Dashboard
const assert = require('assert');
const db = require('../db');

async function runTests() {
  console.log('🧪 Starting NEXUS HUB Startup Command Center Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // --- Test 1: Startup KPI Summary Data ---
  await testAsync('Test 1: getStartupDashboardSummary returns canonical KPI figures', async () => {
    const summary = await db.getStartupDashboardSummary('STP-XYZ', '2026-10', 'startup');
    assert.strictEqual(summary.ok, true, 'Summary query must succeed');
    assert.strictEqual(summary.startup.name, 'XYZ Technologies', 'Must match XYZ Technologies startup');
    assert.ok(summary.kpi, 'KPI object must exist');
    assert.ok(typeof summary.kpi.upcomingMeetings.count === 'number', 'Upcoming meetings count must be numeric');
    assert.ok(typeof summary.kpi.availableRooms.count === 'number', 'Available rooms count must be numeric');
    assert.ok(summary.kpi.availableRooms.total >= 6, 'Total rooms must be at least 6');
    assert.ok(summary.kpi.remainingCredits.remaining > 0, 'Remaining credits must be positive');
    assert.strictEqual(summary.kpi.remainingCredits.unit, 'credits', 'Credit unit must be credits');
  });

  // --- Test 2: Schedule Segmentation (Today vs Upcoming) ---
  await testAsync('Test 2: Today vs Upcoming schedule segregation', async () => {
    const summary = await db.getStartupDashboardSummary('STP-XYZ', '2026-10', 'startup');
    assert.ok(Array.isArray(summary.todaysSchedule), 'todaysSchedule must be an array');
    assert.ok(Array.isArray(summary.upcomingBookings), 'upcomingBookings must be an array');

    summary.todaysSchedule.forEach(item => {
      assert.ok(item.roomName, 'Schedule item must include roomName');
      assert.ok(item.timeRange, 'Schedule item must include timeRange');
      assert.ok(['Confirmed', 'In progress', 'Completed', 'Pending'].includes(item.status), 'Status must be valid');
    });
  });

  // --- Test 3: Role-Based Data Isolation (Founder vs Employee) ---
  await testAsync('Test 3: Employee persona hides financial invoices and sensitive metrics', async () => {
    const founderSummary = await db.getStartupDashboardSummary('STP-XYZ', '2026-10', 'startup');
    assert.ok(founderSummary.startupOverview !== null, 'Founder must receive startup overview');
    assert.ok(founderSummary.startupOverview.outstandingDueFormatted, 'Founder can view invoice summary');

    const employeeSummary = await db.getStartupDashboardSummary('STP-XYZ', '2026-10', 'startup_member');
    assert.strictEqual(employeeSummary.startupOverview, null, 'Employee must NOT receive financial startup overview');
    assert.strictEqual(employeeSummary.role, 'startup_member', 'Role must reflect startup_member');
  });

  // --- Test 4: Live Activity Feed Normalization ---
  await testAsync('Test 4: Scoped activity feed contains valid relative IST timestamps and icons', async () => {
    const summary = await db.getStartupDashboardSummary('STP-XYZ', '2026-10', 'startup');
    assert.ok(Array.isArray(summary.recentActivities), 'recentActivities must be an array');
    assert.ok(summary.recentActivities.length > 0, 'Must have at least one activity item');

    summary.recentActivities.forEach(act => {
      assert.ok(act.icon, 'Activity must have an icon');
      assert.ok(act.title, 'Activity must have a title');
      assert.ok(!act.title.includes('undefined'), 'Title must not contain undefined');
      assert.ok(act.relativeTime, 'Activity must have relativeTime');
      assert.ok(!act.relativeTime.includes('undefined'), 'relativeTime must not contain undefined');
    });
  });

  console.log('\n========================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

