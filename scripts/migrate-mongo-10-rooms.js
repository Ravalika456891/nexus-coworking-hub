const fs = require('fs');
const path = require('path');
const db = require('../db');

// Load canonical 10 rooms from js/initialData.js
const initialDataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'initialData.js'), 'utf8');
global.window = {};
eval(initialDataCode);
const CANONICAL_ROOMS = window.INITIAL_DATA.meetingRooms;

console.log('Canonical 10 rooms count:', CANONICAL_ROOMS.length);

async function migrate() {
  const database = await db.connectDB();
  if (!database) {
    console.error('Could not connect to MongoDB database.');
    process.exit(1);
  }

  const canonicalMap = {};
  const canonicalIds = new Set();
  CANONICAL_ROOMS.forEach(r => {
    canonicalMap[r.id] = r;
    canonicalIds.add(r.id);
  });

  // 1. Clean and update 'meeting_rooms' collection
  const mrCol = database.collection('meeting_rooms');
  
  // Remove non-canonical / duplicate rooms
  const delResult = await mrCol.deleteMany({ id: { $nin: Array.from(canonicalIds) } });
  console.log('Deleted non-canonical meeting_rooms documents:', delResult.deletedCount);

  // Update or insert all canonical 10 rooms
  for (const cRoom of CANONICAL_ROOMS) {
    const existing = await mrCol.findOne({ id: cRoom.id });
    const preservedBookings = existing && existing.bookings ? existing.bookings : (cRoom.bookings || []);
    const updateDoc = {
      ...cRoom,
      bookings: preservedBookings,
      _syncedAt: new Date()
    };
    delete updateDoc._id;

    await mrCol.updateOne(
      { id: cRoom.id },
      { $set: updateDoc },
      { upsert: true }
    );
    console.log(`Updated meeting_room ${cRoom.id} (${cRoom.roomNumber}): capacity ${cRoom.capacity}, floor ${cRoom.floor}`);
  }

  // 2. Clean and update 'app_state' collection
  const appStateCol = database.collection('app_state');
  const doc = await appStateCol.findOne({ _id: 'current_state' });
  let state = (doc && doc.state) ? doc.state : {};

  // Preserve existing bookings
  const existingRooms = state.meetingRooms || [];
  const bookingsMap = {};
  existingRooms.forEach(r => {
    if (r.id && Array.isArray(r.bookings)) {
      bookingsMap[r.id] = r.bookings;
    }
  });

  const updatedStateRooms = CANONICAL_ROOMS.map(cRoom => {
    const b = bookingsMap[cRoom.id] || cRoom.bookings || [];
    return {
      ...cRoom,
      bookings: b
    };
  });

  state.meetingRooms = updatedStateRooms;
  if (!state.building) state.building = window.INITIAL_DATA.building || {};
  state.building.totalFloors = 7;
  state.building.totalMeetingRooms = 10;
  state.floors = window.INITIAL_DATA.floors || [];

  await appStateCol.updateOne(
    { _id: 'current_state' },
    { $set: { state, updatedAt: new Date() } },
    { upsert: true }
  );

  console.log('✅ Successfully updated MongoDB app_state current_state with exactly 10 canonical meeting rooms!');

  // Verify
  const verifyDoc = await appStateCol.findOne({ _id: 'current_state' });
  const finalRooms = verifyDoc.state.meetingRooms;
  console.log('\n--- Verification of MongoDB records ---');
  console.log('Total rooms:', finalRooms.length);
  finalRooms.forEach(r => {
    console.log(`  ${r.id} | ${r.roomNumber} | ${r.name} | ${r.floor} | Capacity: ${r.capacity} Pax | Rate: ₹${r.hourlyRate}/hr`);
  });

  const allMrDocs = await mrCol.find({}).toArray();
  console.log('\nTotal meeting_rooms collection documents:', allMrDocs.length);

  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
