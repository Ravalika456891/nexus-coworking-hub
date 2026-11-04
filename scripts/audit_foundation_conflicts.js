const fs = require('fs');
const vm = require('vm');
const path = require('path');

// 1. Load initialData
const initialDataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'initialData.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(initialDataCode, sandbox);
const data = sandbox.window.INITIAL_DATA;

console.log('===========================================================');
console.log('1. ROOMS AUDIT: CAPACITIES, RATES & EXCESS ATTENDEES');
console.log('===========================================================');
const rooms = data.meetingRooms || [];
rooms.forEach(r => {
  console.log(`- [${r.id}] ${r.name}: Capacity = ${r.capacity} pax | Hourly Rate = ₹${r.hourlyRate}/hr | Floor: ${r.floor} | Type: ${r.type || 'Standard'}`);
});

console.log('\n--- Bookings exceeding room capacity ---');
let overCount = 0;
rooms.forEach(r => {
  (r.bookings || []).forEach(b => {
    if (b.attendees > r.capacity) {
      overCount++;
      console.log(`  * [${r.name}] (Capacity: ${r.capacity}) has Booking ${b.id} "${b.title || b.purpose}" with ${b.attendees} attendees on ${b.date} (${b.startTime}-${b.endTime})`);
    }
  });
});
console.log(`Total bookings exceeding nominal capacity: ${overCount}`);

console.log('\n===========================================================');
console.log('2. INVOICE INV/2026-27/0086 & TOP-UPS AUDIT');
console.log('===========================================================');
const inv86 = (data.invoices || []).filter(i => i.id && i.id.includes('0086'));
console.log('Found invoices matching 0086:', JSON.stringify(inv86, null, 2));

const startups = data.startups || [];
console.log('\n--- Top-ups across all startups ---');
startups.forEach(s => {
  if (s.topUps && s.topUps.length > 0) {
    console.log(`Startup: ${s.name} (${s.id}) top-ups:`, JSON.stringify(s.topUps, null, 2));
  }
});

console.log('\n===========================================================');
console.log('3. STARTUP PLAN CONFLICTS IN DATA & CODE');
console.log('===========================================================');
startups.forEach(s => {
  console.log(`- ${s.name} (${s.id}): subscriptionPlan="${s.subscriptionPlan}", includedMeetingHours=${s.includedMeetingHours}`);
});

console.log('\n===========================================================');
console.log('4. SEARCH CODEBASE FOR CONFLICTING TERMS');
console.log('===========================================================');

function searchDir(dir, patterns) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === '.vercel' || f === '.system_generated') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full, patterns);
    } else if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.json') || f.endsWith('.sql')) {
      const content = fs.readFileSync(full, 'utf8');
      patterns.forEach(p => {
        if (content.includes(p)) {
          console.log(`Found '${p}' in ${full}`);
        }
      });
    }
  }
}

searchDir(path.join(__dirname, '..'), ['0086', 'Scale-Up Growth', 'Scale-up Venture', 'Scale-Up Venture', '11:13', '5,310', '5310']);
