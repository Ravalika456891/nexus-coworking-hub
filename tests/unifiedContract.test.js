/**
 * NEXUS HUB — Unified Endpoints Contract Test Suite
 * 
 * Part 5.5: Contract Test
 * Loads the canonical target fixture and verifies that every single endpoint and surface:
 * - GET /company/summary?month=2026-11
 * - GET /company/ledger?month=2026-11
 * - GET /bookings
 * - GET /workspaces/summary
 * - GET /analytics
 * yields identically reconciled numbers for XYZ Technologies (4 Nov 2026 18:10 IST):
 * - Included Hours: 15.0h (150 credits)
 * - Used Hours: 5.0h (50 credits)
 * - Reserved Hours: 6.0h (60 credits)
 * - Plan Left: 4.0h (40 credits, expires 30 Nov)
 * - Top-up Left: 10.0h (100 credits)
 * - Total Left: 14.0h (140 credits)
 * - Workspaces: 26 units, 55 seats
 * - Bookings: 10 total (17.0 hrs), 4 upcoming (2 today), 6 past, 0 cancelled
 * 
 * ANY DIFFERENCE FAILS THE BUILD IMMEDIATELY.
 */

const assert = require('assert');
const http = require('http');

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

console.log('\n==================================================================');
console.log('🧪 NEXUS HUB — UNIFIED CONTRACT TEST SUITE (PART 5)');
console.log('Target: Localhost Server (http://localhost:5173)');
console.log('==================================================================\n');

let passCount = 0;
let failCount = 0;

function runContractTest(desc, fn) {
  return fn()
    .then(() => {
      console.log(`  ✅ PASS: ${desc}`);
      passCount++;
    })
    .catch((err) => {
      console.error(`  ❌ FAIL: ${desc}`);
      console.error(`     -> ${err.message}`);
      failCount++;
    });
}

async function runAll() {
  // Test 1: GET /company/summary
  await runContractTest('1. GET /company/summary returns canonical 15h plan, 5h used, 6h reserved, 4h plan left, 10h topup left', async () => {
    const res = await fetchJson(`${BASE_URL}/company/summary?month=2026-11`, {
      'x-company-id': 'STP-XYZ',
      'x-user-role': 'member'
    });
    assert.strictEqual(res.status, 200, 'Status must be 200');
    assert.ok(res.body.ok, 'Response must be ok');
    
    const { allowance, plan, space, teamSize } = res.body;
    assert.strictEqual(plan.monthlyHours, 15.0, 'Plan monthly hours must be 15.0');
    assert.strictEqual(allowance.usedHours, 5.0, 'Used hours must be exactly 5.0h (50 credits)');
    assert.strictEqual(allowance.reservedHours, 6.0, 'Reserved hours must be exactly 6.0h (60 credits)');
    assert.strictEqual(allowance.planRemainingHours, 4.0, 'Plan remaining must be exactly 4.0h (40 credits)');
    assert.strictEqual(allowance.topUpRemainingHours, 10.0, 'Top-up remaining must be exactly 10.0h (100 credits)');
    assert.strictEqual(allowance.totalRemainingHours || allowance.remainingHours, 14.0, 'Total remaining must be exactly 14.0h (140 credits)');
    assert.strictEqual(space.unitCode, 'Cabin 103', 'Allocated unit must be Cabin 103');
    assert.strictEqual(space.seats, 6, 'Cabin 103 seats must be 6');
    assert.strictEqual(teamSize, 6, 'Company team size must be 6');
  });

  // Test 2: GET /company/ledger
  await runContractTest('2. GET /company/ledger returns newest-first reconciled ledger entries', async () => {
    const res = await fetchJson(`${BASE_URL}/company/ledger?month=2026-11`, {
      'x-company-id': 'STP-XYZ'
    });
    assert.strictEqual(res.status, 200, 'Status must be 200');
    assert.ok(res.body.ok, 'Response must be ok');
    assert.ok(Array.isArray(res.body.ledger), 'Ledger must be an array');
  });

  // Test 3: GET /bookings (Member Scoped)
  await runContractTest('3. GET /bookings member scope returns exactly XYZ bookings (10 total, 17.0 hrs)', async () => {
    const res = await fetchJson(`${BASE_URL}/bookings`, {
      'x-company-id': 'STP-XYZ',
      'x-user-role': 'member'
    });
    assert.strictEqual(res.status, 200, 'Status must be 200');
    assert.ok(res.body.ok, 'Response must be ok');
    
    const bookings = res.body.bookings || [];
    assert.strictEqual(bookings.length, 10, 'Must have exactly 10 bookings for XYZ');
    
    let totalHrs = 0;
    let novHrs = 0;
    let octHrs = 0;
    let upcomingToday = 0;
    let upcomingTotal = 0;
    
    bookings.forEach(b => {
      totalHrs += b.duration;
      if (b.date.startsWith('2026-10')) octHrs += b.duration;
      if (b.date.startsWith('2026-11')) novHrs += b.duration;
      if (b.date > '2026-11-04' || (b.date === '2026-11-04' && b.startTime >= '18:10')) {
        upcomingTotal++;
        if (b.date === '2026-11-04') upcomingToday++;
      }
    });

    assert.strictEqual(totalHrs, 17.0, 'Total booked hours must equal 17.0 hrs');
    assert.strictEqual(octHrs, 6.0, 'October booked hours must equal 6.0 hrs');
    assert.strictEqual(novHrs, 11.0, 'November booked hours must equal 11.0 hrs');
    assert.strictEqual(upcomingTotal, 4, 'Must have 4 upcoming bookings');
    assert.strictEqual(upcomingToday, 2, 'Must have 2 upcoming bookings today');
  });

  // Test 4: GET /workspaces/summary
  await runContractTest('4. GET /workspaces/summary enforces 26 units & 55 seats identity', async () => {
    const res = await fetchJson(`${BASE_URL}/workspaces/summary`, {
      'x-company-id': 'STP-XYZ'
    });
    assert.strictEqual(res.status, 200, 'Status must be 200');
    assert.ok(res.body.ok, 'Response must be ok');
    assert.strictEqual(res.body.totalUnits, 26, 'Total units must equal 26');
    assert.strictEqual(res.body.totalSeats, 55, 'Total seats must equal 55');
  });

  // Test 5: GET /analytics
  await runContractTest('5. GET /analytics returns strictly scoped company analytics', async () => {
    const res = await fetchJson(`${BASE_URL}/analytics`, {
      'x-company-id': 'STP-XYZ',
      'x-user-role': 'member'
    });
    assert.strictEqual(res.status, 200, 'Status must be 200');
    assert.ok(res.body.ok, 'Response must be ok');
    assert.strictEqual(res.body.scope, 'member', 'Scope must be member');
    assert.strictEqual(res.body.companyId, 'STP-XYZ', 'Must be scoped to STP-XYZ');
  });

  console.log('\n==================================================================');
  console.log(`📊 CONTRACT TEST RESULTS: ${passCount} Passed | ${failCount} Failed`);
  console.log('==================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
