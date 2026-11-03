/**
 * Audit Script & Database Query: Room Capacity Violations & Allowance Verification
 * Run: node scripts/audit-capacity.js
 */

const fs = require('fs');
const path = require('path');

// Mock window to load browser bundles safely in Node
global.window = {};
require('../js/initialData.js');

function auditCapacityAndAllowance() {
  console.log('===============================================================');
  console.log('🔍 NEXUS HUB: ROOM CAPACITY & MONTHLY ALLOWANCE AUDIT');
  console.log('===============================================================\n');

  const rooms = (window.INITIAL_DATA && window.INITIAL_DATA.meetingRooms) || [];
  const startups = (window.INITIAL_DATA && window.INITIAL_DATA.startups) || [];

  // 1. Audit Room Capacities vs Bookings
  console.log('--- 1. ROOM CAPACITY AUDIT ---');
  const capacityViolations = [];
  const allBookings = [];

  rooms.forEach(r => {
    console.log(`• [${r.id}] ${r.name.padEnd(24)} | Capacity: ${r.capacity} Pax | Rate: ₹${r.hourlyRate}/hr`);
    (r.bookings || []).forEach(b => {
      const isOver = b.attendees > r.capacity;
      const rec = {
        bookingId: b.id,
        roomId: r.id,
        roomName: r.name,
        roomCapacity: r.capacity,
        date: b.date,
        time: `${b.startTime} - ${b.endTime}`,
        startupId: b.startupId,
        startupName: b.startupName,
        bookedBy: b.bookedBy,
        attendees: b.attendees,
        overBy: b.attendees - r.capacity,
        status: b.status
      };
      allBookings.push(rec);
      if (isOver) {
        capacityViolations.push(rec);
      }
    });
  });

  console.log(`\nTotal Bookings Scanned: ${allBookings.length}`);
  console.log(`Capacity Violations Found: ${capacityViolations.length}\n`);

  if (capacityViolations.length > 0) {
    console.log('⚠️ EXISTING OVER-CAPACITY BOOKINGS (Flagged with "Over capacity" badge in UI):');
    console.table(capacityViolations.map(v => ({
      'Booking Ref': v.bookingId,
      'Room': v.roomName,
      'Max Cap': `${v.roomCapacity} Pax`,
      'Registered': `${v.attendees} Pax`,
      'Over By': `+${v.overBy}`,
      'Date': v.date,
      'Startup': v.startupName
    })));
  } else {
    console.log('✅ Zero capacity violations found.');
  }

  // 2. Audit Allowance Segregation (October vs November)
  console.log('\n--- 2. MONTHLY ALLOWANCE AUDIT (SINGLE SOURCE OF TRUTH) ---');
  const targetStartup = startups.find(s => s.id === 'STP-XYZ') || { id: 'STP-XYZ', name: 'XYZ Technologies', includedMeetingHours: 15 };
  
  const months = ['2026-10', '2026-11'];
  months.forEach(m => {
    let bookedHours = 0;
    const mBookings = allBookings.filter(b => b.startupId === targetStartup.id && b.status !== 'Cancelled' && b.date.startsWith(m));
    mBookings.forEach(b => {
      const [sh, sm] = (b.time.split('-')[0].trim()).split(':').map(Number);
      const [eh, em] = (b.time.split('-')[1].trim()).split(':').map(Number);
      bookedHours += ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    });

    const inc = targetStartup.includedMeetingHours || 15;
    const rem = Math.max(0, inc - bookedHours);
    const ovg = Math.max(0, bookedHours - inc);
    console.log(`Month ${m}: ${mBookings.length} bookings, ${bookedHours} hrs booked / ${inc} hrs allowance ➔ ${rem} hrs left (${ovg} hrs overage)`);
  });

  console.log('\n===============================================================');
  console.log('SQL Query to list all over-capacity bookings in PostgreSQL:');
  console.log(`
    SELECT b.id AS booking_ref, b.date, b.start_time, b.end_time, r.name AS room_name,
           r.capacity AS room_capacity, b.attendees AS registered_attendees,
           (b.attendees - r.capacity) AS excess_pax, b.startup_name, b.status
    FROM bookings b
    JOIN meeting_rooms r ON b.room_id = r.id
    WHERE b.attendees > r.capacity
      AND b.status != 'Cancelled'
    ORDER BY b.date DESC, b.start_time ASC;
  `);
  console.log('===============================================================');
}

auditCapacityAndAllowance();

