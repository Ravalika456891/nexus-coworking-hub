const db = require('../db');

async function updateDatabase() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  const database = await db.connectDB();
  if (!database) {
    console.error('❌ Failed to connect to MongoDB Atlas');
    process.exit(1);
  }
  console.log('✅ Connected to MongoDB Atlas:', database.databaseName);

  // 1. Update meeting_rooms collection with high-res photos & latest schemas
  const roomUpdates = [
    {
      id: 'mr-1',
      name: 'Boardroom Alpha',
      capacity: 10,
      type: 'Boardroom',
      status: 'Available',
      image: 'assets/rooms/mr-01-main.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
      amenities: ['Projector', 'Video Conferencing', 'Whiteboard', 'TV/Display', 'Audio/Mic'],
      rate: '₹2,500/hr',
      hourlyRate: 2500
    },
    {
      id: 'mr-2',
      name: 'Pitch Arena Nexus',
      capacity: 8,
      type: 'Pitch Room',
      status: 'Available',
      image: 'assets/rooms/mr-02-main.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      amenities: ['TV/Display', 'Video Conferencing', 'Audio/Mic', 'Natural Light'],
      rate: '₹3,000/hr',
      hourlyRate: 3000
    },
    {
      id: 'mr-3',
      name: 'Focus Room',
      capacity: 4,
      type: 'Meeting Room',
      status: 'In Use',
      image: 'assets/rooms/mr-03-main.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
      amenities: ['TV/Display', 'Whiteboard', 'Audio/Mic'],
      rate: '₹1,200/hr',
      hourlyRate: 1200
    },
    {
      id: 'mr-4',
      name: 'Collaboration Room',
      capacity: 6,
      type: 'Meeting Room',
      status: 'Available',
      image: 'assets/rooms/mr-04-main.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
      amenities: ['Whiteboard', 'Video Conferencing', 'Natural Light'],
      rate: '₹1,800/hr',
      hourlyRate: 1800
    },
    {
      id: 'mr-5',
      name: 'Training Room',
      capacity: 20,
      type: 'Training Room',
      status: 'Available',
      image: 'assets/rooms/mr-05-main.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
      amenities: ['Projector', 'Audio/Mic', 'Whiteboard', 'Catering', 'Accessible'],
      rate: '₹4,000/hr',
      hourlyRate: 4000
    },
    {
      id: 'mr-6',
      name: 'Creative Studio',
      capacity: 8,
      type: 'Event Space',
      status: 'Available',
      image: 'assets/rooms/mr-06-main.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      amenities: ['TV/Display', 'Whiteboard', 'Natural Light', 'Audio/Mic'],
      rate: '₹2,200/hr',
      hourlyRate: 2200
    }
  ];

  const roomsCol = database.collection('meeting_rooms');
  console.log('📦 Updating meeting_rooms collection...');
  for (const r of roomUpdates) {
    await roomsCol.updateOne(
      { id: r.id },
      { $set: { ...r, updatedAt: new Date() } },
      { upsert: true }
    );
  }
  console.log(`✅ Synced ${roomUpdates.length} meeting rooms in database.`);

  // 2. Update app_state collection
  const appStateCol = database.collection('app_state');
  const appStateDoc = await appStateCol.findOne({ _id: 'global_state' });
  if (appStateDoc && appStateDoc.rooms) {
    for (const r of appStateDoc.rooms) {
      const match = roomUpdates.find(u => u.id === r.id);
      if (match) {
        r.image = match.image;
        r.fallbackImage = match.fallbackImage;
        r.rate = match.rate;
        r.hourlyRate = match.hourlyRate;
      }
    }
    await appStateCol.updateOne(
      { _id: 'global_state' },
      { $set: { rooms: appStateDoc.rooms, updatedAt: new Date() } }
    );
    console.log('✅ Updated app_state.rooms in database.');
  }

  // 3. Initialize/verify partial unique indexes
  await db.initMeetingRoomIndexes();
  console.log('✅ Initialized meeting room indexes.');

  // 4. Force seed/sync all collections if any are empty
  const seedResult = await db.seedAllCollections(false);
  console.log('✅ Collection check summary:', seedResult.summary || 'All collections verified');

  // 5. Query and report stats for all 11 collections
  console.log('\n📊 Database Status & Document Counts:');
  for (const def of db.TABLE_DEFINITIONS) {
    const col = database.collection(def.name);
    const count = await col.countDocuments();
    console.log(`  • ${def.icon} ${def.name.padEnd(18)} : ${count} documents (${def.label})`);
  }

  console.log('\n🚀 Database update completed successfully!\n');
  process.exit(0);
}

updateDatabase().catch(err => {
  console.error('❌ Error updating database:', err);
  process.exit(1);
});
