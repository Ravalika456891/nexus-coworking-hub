require('dotenv').config();
const db = require('../db.js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('=== STARTING BOOKING DATA MIGRATION ===');
  const appState = await db.getAppState();
  const rooms = (appState && appState.meetingRooms) || [];
  const startups = (appState && appState.startups) || [];

  const issuesFound = {
    duplicateRefs: [],
    capacityViolations: [],
    overageCorrections: []
  };

  // 1. Audit and Correct Capacity Violations
  rooms.forEach(room => {
    (room.bookings || []).forEach(b => {
      if (b.attendees > room.capacity) {
        issuesFound.capacityViolations.push({
          bookingId: b.id,
          room: room.name,
          capacity: room.capacity,
          oldAttendees: b.attendees,
          newAttendees: room.capacity
        });
        b.attendees = room.capacity;
      }
    });
  });

  // 2. Audit and Migrate Booking Refs to BKG-YYYYMMDD-NNNN
  const dateCounters = {};
  const oldToNewIdMap = {};

  // Sort bookings chronologically so sequence numbers match booking order
  const allBookings = [];
  rooms.forEach(r => {
    (r.bookings || []).forEach(b => {
      allBookings.push({ b, r });
    });
  });

  allBookings.sort((a, b) => {
    if (a.b.date !== b.b.date) return (a.b.date || '') > (b.b.date || '') ? 1 : -1;
    return (a.b.startTime || '') > (b.b.startTime || '') ? 1 : -1;
  });

  allBookings.forEach(({ b }) => {
    const rawDate = b.date || '2026-11-03';
    const dClean = rawDate.replace(/[^0-9]/g, '');
    dateCounters[dClean] = (dateCounters[dClean] || 0) + 1;
    const newId = `BKG-${dClean}-${String(dateCounters[dClean]).padStart(4, '0')}`;

    if (b.id !== newId) {
      oldToNewIdMap[b.id] = newId;
      b.id = newId;
    }
  });

  // 3. Recalculate Monthly Allowance and Overages per Billing Cycle
  startups.forEach(startup => {
    const allowance = Number(startup.includedMeetingHours) || 15;
    const addRate = Number(startup.additionalHourRate) || 1000;

    // Group bookings by YYYY-MM
    const months = {};
    rooms.forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.startupId === startup.id && b.status !== 'Cancelled') {
          const m = (b.date || '').substring(0, 7);
          if (!months[m]) months[m] = [];
          months[m].push(b);
        }
      });
    });

    Object.keys(months).forEach(m => {
      const monthBookings = months[m];
      monthBookings.sort((a, b) => {
        if (a.date !== b.date) return (a.date || '') > (b.date || '') ? 1 : -1;
        return (a.startTime || '') > (b.startTime || '') ? 1 : -1;
      });

      let cumulativeHours = 0;
      monthBookings.forEach(b => {
        const [sh, sm] = (b.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (b.endTime || '00:00').split(':').map(Number);
        const dur = Math.max(0.25, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
        b.duration = dur;

        const prior = cumulativeHours;
        cumulativeHours += dur;

        if (prior >= allowance) {
          // Entire booking is overage
          b.creditHoursUsed = 0;
          b.overageHours = dur;
          const oldCost = b.cost || 0;
          b.cost = Math.round(dur * addRate);
          if (b.cost !== oldCost) {
            issuesFound.overageCorrections.push({
              bookingId: b.id,
              date: b.date,
              startup: startup.name,
              overageHours: b.overageHours,
              cost: b.cost
            });
          }
        } else if (cumulativeHours > allowance) {
          // Booking crosses threshold
          b.creditHoursUsed = Number((allowance - prior).toFixed(2));
          b.overageHours = Number((dur - b.creditHoursUsed).toFixed(2));
          const oldCost = b.cost || 0;
          b.cost = Math.round(b.overageHours * addRate);
          if (b.cost !== oldCost) {
            issuesFound.overageCorrections.push({
              bookingId: b.id,
              date: b.date,
              startup: startup.name,
              overageHours: b.overageHours,
              cost: b.cost
            });
          }
        } else {
          // Entire booking covered by allowance
          b.creditHoursUsed = dur;
          b.overageHours = 0;
          b.cost = 0;
        }
      });
    });
  });

  // Save to DB
  await db.saveAppState(appState);
  console.log('✅ AppState updated with clean migrated data.');

  console.log('\n=== MIGRATION REPORT ===');
  console.log('Capacity Violations Fixed:', issuesFound.capacityViolations.length);
  issuesFound.capacityViolations.forEach(v => console.log(` - ${v.bookingId} (${v.room}): Attendees reduced from ${v.oldAttendees} to capacity (${v.newAttendees})`));

  console.log('\nBooking Refs Migrated:', Object.keys(oldToNewIdMap).length);
  Object.entries(oldToNewIdMap).slice(0, 10).forEach(([oldId, newId]) => console.log(` - ${oldId} -> ${newId}`));

  console.log('\nOverage Corrections Applied:', issuesFound.overageCorrections.length);
  issuesFound.overageCorrections.forEach(c => console.log(` - ${c.bookingId} (${c.date}) for ${c.startup}: ${c.overageHours}h overage -> ₹${c.cost}`));

  process.exit(0);
}

runMigration().catch(e => {
  console.error(e);
  process.exit(1);
});

