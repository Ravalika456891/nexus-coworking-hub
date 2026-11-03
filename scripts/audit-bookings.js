require('dotenv').config();
const db = require('../db.js');

async function audit() {
  const state = await db.getAppState();
  const rooms = (state && state.meetingRooms) || [];
  const startups = (state && state.startups) || [];

  console.log('=== 1. ROOM CAPACITY AUDIT ===');
  rooms.forEach(r => {
    console.log(`[${r.id}] ${r.name} - Floor: ${r.floor}, Room: ${r.roomNumber || 'N/A'}, Capacity: ${r.capacity} Pax, Rate: ₹${r.hourlyRate}/hr`);
  });

  console.log('\n=== 2. ALL EXISTING BOOKINGS AUDIT ===');
  const allBookings = [];
  const refMap = new Map();
  const capacityViolations = [];

  rooms.forEach(r => {
    (r.bookings || []).forEach(b => {
      const entry = { ...b, roomId: r.id, roomName: r.name, roomCapacity: r.capacity };
      allBookings.push(entry);

      // Duplicate check
      const prev = refMap.get(b.id) || [];
      prev.push(entry);
      refMap.set(b.id, prev);

      // Capacity check
      if (b.attendees > r.capacity) {
        capacityViolations.push({
          bookingId: b.id,
          title: b.title,
          date: b.date,
          roomId: r.id,
          roomName: r.name,
          capacity: r.capacity,
          attendees: b.attendees
        });
      }
    });
  });

  console.log(`Total Bookings: ${allBookings.length}`);

  console.log('\n=== DUPLICATE BOOKING REFS ===');
  let duplicateCount = 0;
  for (const [id, list] of refMap.entries()) {
    if (list.length > 1) {
      duplicateCount++;
      console.log(`❌ Duplicate ID: ${id} used by ${list.length} bookings:`);
      list.forEach(l => console.log(`   - Room: ${l.roomId} (${l.roomName}), Date: ${l.date} ${l.startTime}-${l.endTime}, Startup: ${l.startupName}`));
    }
  }
  if (duplicateCount === 0) console.log('None found in current appState.');

  console.log('\n=== CAPACITY VIOLATIONS ===');
  if (capacityViolations.length > 0) {
    capacityViolations.forEach(v => {
      console.log(`⚠️ Booking ${v.bookingId} (${v.date}): "${v.title}" in ${v.roomName} (Cap: ${v.capacity}) has ${v.attendees} attendees!`);
    });
  } else {
    console.log('None found.');
  }

  console.log('\n=== 3. STARTUP ALLOWANCE & USAGE AUDIT ===');
  startups.forEach(s => {
    console.log(`Startup [${s.id}] ${s.name}: IncludedHours=${s.includedMeetingHours || 12}, UsedHours=${s.usedMeetingHours || 0}, AdditionalRate=₹${s.additionalHourRate || 1000}/hr`);
    // Find all bookings for this startup
    const startupBookings = allBookings.filter(b => b.startupId === s.id && b.status !== 'Cancelled');
    const totalHours = startupBookings.reduce((sum, b) => {
      const [sh, sm] = (b.startTime || '00:00').split(':').map(Number);
      const [eh, em] = (b.endTime || '00:00').split(':').map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    }, 0);
    const totalCost = startupBookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
    console.log(`   -> Active Bookings: ${startupBookings.length}, Total Hours: ${totalHours} hrs, Total Cost billed: ₹${totalCost}`);
  });

  process.exit(0);
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
