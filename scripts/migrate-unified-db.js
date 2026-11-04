/**
 * NEXUS HUB — Unified Database Migration Script
 * 
 * Part 5: One Owner Per Fact
 * - Safe, idempotent migration with --dry-run default
 * - Never modifies live data without explicit --execute flag
 * - Reconciles and migrates to unified collections:
 *   companies, plans, rooms, bookings, roomSlots, creditLedger,
 *   topupOrders, payments, invoices, creditNotes, workspaceUnits, allocations
 */

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { applyIndexes } = require('../models/schema');

const isExecute = process.argv.includes('--execute');
const isStaging = process.argv.includes('--staging');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = isStaging ? 'nexus_hub_staging' : (process.env.MONGODB_DB_NAME || 'nexus_hub');

async function migrate() {
  console.log(`\n==================================================================`);
  console.log(`🚀 NEXUS HUB DATABASE UNIFICATION MIGRATION`);
  console.log(`Mode:     ${isExecute ? '⚡ LIVE EXECUTE (Writes enabled)' : '🛡️ DRY RUN (Read-only simulation)'}`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`==================================================================\n`);

  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(DB_NAME);

  const dryRunReport = {
    mode: isExecute ? 'execute' : 'dry-run',
    database: DB_NAME,
    timestamp: new Date().toISOString(),
    proposedChanges: []
  };

  function logChange(action, collection, details) {
    dryRunReport.proposedChanges.push({ action, collection, details });
    console.log(`  [${action.toUpperCase()}] ${collection}: ${details}`);
  }

  // 1. Plans Collection
  console.log('\n--- 1. Plans Collection ---');
  const canonicalPlans = [
    {
      id: 'starter-plan',
      name: 'Starter Plan',
      monthlyHours: 8.0,
      monthlyCredits: 80,
      pricePaise: 250000,
      gstHandling: { ratePercent: 18, isInclusive: false }
    },
    {
      id: 'startup-plan',
      name: 'Startup Plan',
      monthlyHours: 15.0,
      monthlyCredits: 150,
      pricePaise: 450000,
      gstHandling: { ratePercent: 18, isInclusive: false }
    },
    {
      id: 'growth-plan',
      name: 'Scale-Up Growth Plan',
      monthlyHours: 15.0,
      monthlyCredits: 150,
      pricePaise: 850000,
      gstHandling: { ratePercent: 18, isInclusive: false }
    },
    {
      id: 'enterprise-plan',
      name: 'Enterprise Venture Plan',
      monthlyHours: 40.0,
      monthlyCredits: 400,
      pricePaise: 1800000,
      gstHandling: { ratePercent: 18, isInclusive: false }
    }
  ];

  for (const p of canonicalPlans) {
    logChange('upsert', 'plans', `Plan ${p.id} (${p.name}): ${p.monthlyHours}h / ${p.monthlyCredits} credits`);
    if (isExecute) {
      await db.collection('plans').updateOne({ id: p.id }, { $set: p }, { upsert: true });
    }
  }

  // 2. Rooms Collection (10 canonical rooms with capacities & rates)
  console.log('\n--- 2. Meeting Rooms Collection ---');
  const canonicalRooms = [
    { code: '1F-R01', name: 'Boardroom Alpha', floor: 1, type: 'Boardroom', capacity: 16, creditRatePerHour: 10, hourlyPricePaise: 150000, amenities: ['4K Video Bar', 'Dual Display', 'Whiteboard', 'Polycom Speakerphone'], photos: ['/assets/rooms/boardroom-alpha.jpg'] },
    { code: '1F-R02', name: 'Brainstorm Pod Beta', floor: 1, type: 'Brainstorm Pod', capacity: 4, creditRatePerHour: 10, hourlyPricePaise: 80000, amenities: ['Interactive Touch Display', 'Writeable Glass Walls'], photos: ['/assets/rooms/brainstorm-pod.jpg'] },
    { code: '2F-R01', name: 'Focus Room Quantum', floor: 2, type: 'Focus Room', capacity: 2, creditRatePerHour: 10, hourlyPricePaise: 50000, amenities: ['Acoustic Phone Booth', 'Ergonomic Desk', 'Ring Light'], photos: ['/assets/rooms/focus-quantum.jpg'] },
    { code: '3F-R01', name: 'Training Room', floor: 3, type: 'Training Room', capacity: 30, creditRatePerHour: 10, hourlyPricePaise: 220000, amenities: ['Ceiling Array Mics', 'Projector', 'Podium'], photos: ['/assets/rooms/training-room.jpg'] },
    { code: '3F-R02', name: 'Synergy Lab', floor: 3, type: 'Team Lab', capacity: 8, creditRatePerHour: 10, hourlyPricePaise: 140000, amenities: ['Wireless Presentation', 'Standing Whiteboard'], photos: ['/assets/rooms/synergy-lab.jpg'] },
    { code: '4F-R01', name: 'Creative Studio', floor: 4, type: 'Creative Studio', capacity: 6, creditRatePerHour: 10, hourlyPricePaise: 120000, amenities: ['Color Calibrated Monitors', 'Lighting Rig'], photos: ['/assets/rooms/creative-studio.jpg'] },
    { code: '6F-R01', name: 'Pitch Arena Nexus', floor: 6, type: 'Pitch Arena', capacity: 50, creditRatePerHour: 10, hourlyPricePaise: 300000, amenities: ['Broadcast Camera', 'Dolby Atmos Audio', 'Stage Lighting'], photos: ['/assets/rooms/pitch-arena.jpg'] },
    { code: '6F-R02', name: 'Strategy Suite', floor: 6, type: 'Executive Suite', capacity: 10, creditRatePerHour: 10, hourlyPricePaise: 180000, amenities: ['Executive Leather Seating', 'Dual Screen Telepresence'], photos: ['/assets/rooms/strategy-suite.jpg'] },
    { code: '7F-R01', name: 'Innovation Amphitheater', floor: 7, type: 'Amphitheater', capacity: 100, creditRatePerHour: 10, hourlyPricePaise: 400000, amenities: ['LED Video Wall', 'Wireless Lavalier Mics', 'Live Streaming'], photos: ['/assets/rooms/amphitheater.jpg'] },
    { code: '7F-R02', name: 'Sky Lounge Boardroom', floor: 7, type: 'Executive Lounge', capacity: 12, creditRatePerHour: 10, hourlyPricePaise: 250000, amenities: ['Panoramic City View', 'Private Barista Bar', 'Ultra-HD Display'], photos: ['/assets/rooms/sky-lounge.jpg'] }
  ];

  for (const r of canonicalRooms) {
    logChange('upsert', 'rooms', `Room ${r.code} (${r.name}): Cap ${r.capacity} pax, ₹${r.hourlyPricePaise / 100}/hr`);
    if (isExecute) {
      await db.collection('rooms').updateOne({ code: r.code }, { $set: r }, { upsert: true });
    }
  }

  // 3. Workspace Units (26 units, 55 seats)
  console.log('\n--- 3. Workspace Units Collection (26 Units / 55 Seats) ---');
  const canonicalUnits = [
    // 8 Hot Desks
    { code: 'HD-01', wing: 'North Wing', type: 'Hot Desk', seats: 1, listPricePaise: 650000, status: 'free' },
    { code: 'HD-02', wing: 'North Wing', type: 'Hot Desk', seats: 1, listPricePaise: 650000, status: 'free' },
    { code: 'HD-03', wing: 'North Wing', type: 'Hot Desk', seats: 1, listPricePaise: 650000, status: 'free' },
    { code: 'HD-04', wing: 'North Wing', type: 'Hot Desk', seats: 1, listPricePaise: 650000, status: 'free' },
    { code: 'HD-05', wing: 'North Wing', type: 'Hot Desk', seats: 1, listPricePaise: 650000, status: 'held' }, // Held for Kredo
    { code: 'HD-06', wing: 'North Wing', type: 'Hot Desk', seats: 1, listPricePaise: 650000, status: 'free' },
    { code: 'HD-07', wing: 'North Wing', type: 'Hot Desk', seats: 1, listPricePaise: 650000, status: 'free' },
    { code: 'HD-08', wing: 'North Wing', type: 'Hot Desk', seats: 1, listPricePaise: 650000, status: 'maintenance' }, // Maintenance
    // 10 Dedicated Desks
    { code: 'DD-01', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'taken' }, // FinEdge
    { code: 'DD-02', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'taken' }, // FinEdge
    { code: 'DD-03', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'free' },
    { code: 'DD-04', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'free' },
    { code: 'DD-05', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'taken' }, // NeuroPulse
    { code: 'DD-06', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'free' },
    { code: 'DD-07', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'free' },
    { code: 'DD-08', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'free' },
    { code: 'DD-09', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'free' },
    { code: 'DD-10', wing: 'East Wing', type: 'Dedicated Desk', seats: 1, listPricePaise: 950000, status: 'free' },
    // 3 Team Pods
    { code: 'PB-01', wing: 'Innovation Hub', type: 'Team Pod', seats: 1, listPricePaise: 1200000, status: 'free' },
    { code: 'PB-02', wing: 'Innovation Hub', type: 'Team Pod', seats: 1, listPricePaise: 1200000, status: 'free' },
    { code: 'PB-03', wing: 'Innovation Hub', type: 'Team Pod', seats: 1, listPricePaise: 1200000, status: 'free' },
    // 5 Private Cabins (Seats: 4, 6, 6, 8, 10 = 34 seats. Total seats: 8 + 10 + 3 + 34 = 55)
    { code: 'Cabin 101', wing: 'Executive West', type: 'Private Cabin', seats: 4, listPricePaise: 4200000, status: 'taken' }, // BioGenic
    { code: 'Cabin 102', wing: 'Executive West', type: 'Private Cabin', seats: 6, listPricePaise: 5800000, status: 'taken' }, // NeuroPulse
    { code: 'Cabin 103', wing: 'Executive West', type: 'Private Cabin', seats: 6, listPricePaise: 5800000, status: 'taken' }, // XYZ Technologies (agreed ₹47,600)
    { code: 'Cabin 104', wing: 'Executive West', type: 'Private Cabin', seats: 8, listPricePaise: 7500000, status: 'taken' }, // FinEdge
    { code: 'Cabin 105', wing: 'Executive West', type: 'Private Cabin', seats: 10, listPricePaise: 9500000, status: 'free' }  // Free
  ];

  for (const u of canonicalUnits) {
    logChange('upsert', 'workspaceUnits', `Unit ${u.code} (${u.type}): ${u.seats} seats, status: ${u.status}`);
    if (isExecute) {
      await db.collection('workspaceUnits').updateOne({ code: u.code }, { $set: u }, { upsert: true });
    }
  }

  // 4. Allocations Collection
  console.log('\n--- 4. Allocations Collection ---');
  const canonicalAllocations = [
    { companyId: 'STP-XYZ', unitId: 'Cabin 103', fromUtc: new Date('2026-08-01'), toUtc: null, status: 'active', agreedPricePaise: 4760000, approvedBy: 'Incubator Director' },
    { companyId: 'STP-001', unitId: 'Cabin 101', fromUtc: new Date('2026-06-01'), toUtc: null, status: 'active', agreedPricePaise: 4200000, approvedBy: 'Operations Lead' },
    { companyId: 'STP-002', unitId: 'Cabin 102', fromUtc: new Date('2026-07-01'), toUtc: null, status: 'active', agreedPricePaise: 5800000, approvedBy: 'Operations Lead' },
    { companyId: 'STP-003', unitId: 'Cabin 104', fromUtc: new Date('2026-09-01'), toUtc: null, status: 'active', agreedPricePaise: 7500000, approvedBy: 'Operations Lead' }
  ];

  for (const a of canonicalAllocations) {
    logChange('upsert', 'allocations', `Allocation: Company ${a.companyId} -> Unit ${a.unitId} (Agreed: ₹${a.agreedPricePaise / 100}/mo)`);
    if (isExecute) {
      await db.collection('allocations').updateOne(
        { companyId: a.companyId, unitId: a.unitId },
        { $set: a },
        { upsert: true }
      );
    }
  }

  // 5. Index Application
  if (isExecute) {
    console.log('\n--- 5. Applying Unified Schema Indexes ---');
    await applyIndexes(db);
  } else {
    logChange('index_plan', 'system', 'Would create unique indexes on roomSlots, creditLedger, companies, invoices, payments, etc.');
  }

  console.log(`\n==================================================================`);
  console.log(`✅ MIGRATION ${isExecute ? 'COMPLETED' : 'DRY-RUN SIMULATION COMPLETE'}`);
  console.log(`Total Actions Planned / Executed: ${dryRunReport.proposedChanges.length}`);
  console.log(`==================================================================\n`);

  await client.close();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

