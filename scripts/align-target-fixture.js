const fs = require('fs');
const path = require('path');

const initialDataPath = path.join(__dirname, '..', 'js', 'initialData.js');
let code = fs.readFileSync(initialDataPath, 'utf8');

// 1. Update Invoice INV-2026-TOPUP-01 to INV/2026-27/0086 with description "Credit top-up, Growth Pack"
code = code.replace(
  /id:\s*"INV-2026-TOPUP-01",\s*invoiceNumber:\s*"INV\/2026-27\/0002"/g,
  'id: "INV-2026-TOPUP-01",\n      invoiceNumber: "INV/2026-27/0086"'
);
code = code.replace(
  /description:\s*"Meeting Room Credits Top-Up \(Growth Pack: 100 Credits · 10\.0 hrs\)"/g,
  'description: "Credit top-up, Growth Pack"'
);

// 2. In MR-01 (Boardroom Alpha), add the 4 Nov 19:00 - 20:00 booking if not present
if (!code.includes('BKG-20261104-0002')) {
  const mr01Target = 'id: "MR-01",';
  const mr01Idx = code.indexOf(mr01Target);
  const mr01BookingsEnd = code.indexOf(']', code.indexOf('bookings:', mr01Idx));
  
  const bookingSnippet = `,\n        {\n          id: "BKG-20261104-0002",\n          startupId: "STP-XYZ",\n          startupName: "XYZ Technologies",\n          bookedBy: "Alex Morgan",\n          title: "Investor Update & Governance",\n          purpose: "Investor Update & Governance",\n          date: "2026-11-04",\n          startTime: "19:00",\n          endTime: "20:00",\n          duration: 1,\n          creditHoursUsed: 1,\n          overageHours: 0,\n          attendees: 8,\n          cost: 0,\n          status: "Confirmed"\n        }`;
  code = code.slice(0, mr01BookingsEnd) + bookingSnippet + code.slice(mr01BookingsEnd);
}

// 3. In MR-07 (Synergy Lab), add the 4 Nov 20:30 - 21:30 booking
if (!code.includes('BKG-20261104-0003')) {
  const mr07Target = 'id: "MR-07",';
  const mr07Idx = code.indexOf(mr07Target);
  const mr07BookingsClose = code.indexOf('bookings: []', mr07Idx);
  if (mr07BookingsClose !== -1) {
    const bookingSnippet = `bookings: [\n        {\n          id: "BKG-20261104-0003",\n          startupId: "STP-XYZ",\n          startupName: "XYZ Technologies",\n          bookedBy: "Alex Morgan",\n          title: "Sprint Alignment & Architecture Review",\n          purpose: "Sprint Alignment & Architecture Review",\n          date: "2026-11-04",\n          startTime: "20:30",\n          endTime: "21:30",\n          duration: 1,\n          creditHoursUsed: 1,\n          overageHours: 0,\n          attendees: 6,\n          cost: 0,\n          status: "Confirmed"\n        }\n      ]`;
    code = code.slice(0, mr07BookingsClose) + bookingSnippet + code.slice(mr07BookingsClose + 'bookings: []'.length);
  }
}

// 4. In MR-03 (Brainstorm Pod Beta), add the 5 Nov 22:30 - 23:30 booking
if (!code.includes('BKG-20261105-0002')) {
  const mr03Target = 'id: "MR-03",';
  const mr03Idx = code.indexOf(mr03Target);
  const mr03BookingsClose = code.indexOf('bookings: []', mr03Idx);
  if (mr03BookingsClose !== -1) {
    const bookingSnippet = `bookings: [\n        {\n          id: "BKG-20261105-0002",\n          startupId: "STP-XYZ",\n          startupName: "XYZ Technologies",\n          bookedBy: "Alex Morgan",\n          title: "Late Night Hackathon Sync",\n          purpose: "Late Night Hackathon Sync",\n          date: "2026-11-05",\n          startTime: "22:30",\n          endTime: "23:30",\n          duration: 1,\n          creditHoursUsed: 1,\n          overageHours: 0,\n          attendees: 4,\n          cost: 0,\n          status: "Confirmed"\n        }\n      ]`;
    code = code.slice(0, mr03BookingsClose) + bookingSnippet + code.slice(mr03BookingsClose + 'bookings: []'.length);
  }
}

// 5. In MR-02 (Pitch Arena Nexus), ensure BKG-20261104-0001 (10:00-12:30) is removed so only the past 1,2,3 Nov + 5 Nov 14:00-17:00 exist
code = code.replace(
  /\s*\{\s*id:\s*"BKG-20261104-0001"[\s\S]*?status:\s*"Confirmed"\s*\},?/g,
  ''
);

fs.writeFileSync(initialDataPath, code, 'utf8');
console.log('✅ Updated js/initialData.js with Target Fixture Bookings & Invoice INV/2026-27/0086.');
