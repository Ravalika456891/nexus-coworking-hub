const fs = require('fs');
const path = require('path');

const initialDataPath = path.join(__dirname, '..', 'js', 'initialData.js');
let content = fs.readFileSync(initialDataPath, 'utf8');

// 1. Update PC-103 in spaces array to be allocated to XYZ Technologies
const oldPc103 = `{ id: "PC-103", label: "Cabin 103 (6-Seater)", zone: "Zone C: Private Suites", type: "Private Cabin", capacity: 6, monthlyRate: 58000, status: "available", allocatedStartupId: null, allocatedStartupName: null, allocatedSince: null }`;
const newPc103 = `{ id: "PC-103", label: "Cabin 103 (6-Seater)", code: "Cabin 103", name: "Cabin 103", zone: "Zone C: Private Suites", type: "Private Cabin", capacity: 6, monthlyRate: 47600, rate: 47600, rateDisplay: "₹47,600/month", status: "occupied", allocatedStartupId: "STP-XYZ", allocatedStartupName: "XYZ Technologies", allocatedSince: "2026-01-01" }`;

if (content.includes(oldPc103)) {
  content = content.replace(oldPc103, newPc103);
  console.log('✅ Allocated PC-103 to XYZ Technologies');
} else {
  console.log('oldPc103 not found directly, checking regex...');
  const pcRegex = /\{\s*id:\s*"PC-103",[\s\S]*?allocatedStartupName:\s*null[\s\S]*?\}/;
  content = content.replace(pcRegex, newPc103);
  console.log('✅ Replaced PC-103 via regex');
}

// 2. Update HD-05 to be held for Kredo Logistics
const oldHd05 = `{ id: "HD-05", label: "Desk H-05", zone: "Zone A: Open Coworking", type: "Hot Desk", capacity: 1, monthlyRate: 7500, status: "reserved", allocatedStartupId: null, allocatedStartupName: "Kredo (Pending)", allocatedSince: null }`;
const newHd05 = `{ id: "HD-05", label: "Desk HD-05", code: "HD-05", name: "Desk HD-05", zone: "Zone A: Open Coworking", type: "Hot Desk", capacity: 1, monthlyRate: 7500, rate: 7500, rateDisplay: "₹7,500/month", status: "reserved", isHeld: true, allocatedStartupId: "STP-05", allocatedStartupName: "Kredo Logistics (Pending Approval)", allocatedSince: "2026-10-28" }`;

if (content.includes(oldHd05)) {
  content = content.replace(oldHd05, newHd05);
  console.log('✅ Set HD-05 as Held for Kredo');
}

// 3. Update PB-02 to Solarix CleanTech
const oldPb02 = `{ id: "PB-02", label: "Focus Pod Zen-2", zone: "Zone D: Acoustic Pods", type: "Focus Booth", capacity: 1, monthlyRate: 0, status: "occupied", allocatedStartupId: null, allocatedStartupName: "In Use (Call)", allocatedSince: null }`;
const newPb02 = `{ id: "PB-02", label: "Focus Pod Zen-2", code: "PB-02", name: "Focus Pod Zen-2", zone: "Zone D: Acoustic Pods", type: "Focus Booth", capacity: 1, monthlyRate: 0, rate: 0, rateDisplay: "Included with Pass", status: "occupied", allocatedStartupId: "STP-04", allocatedStartupName: "Solarix CleanTech", allocatedSince: "2026-10-15" }`;

if (content.includes(oldPb02)) {
  content = content.replace(oldPb02, newPb02);
  console.log('✅ Set PB-02 to Solarix');
}

// 4. Clean labels to use DD-01, HD-01 format consistently
content = content.replace(/"Desk H-0/g, '"Desk HD-0');
content = content.replace(/"Dedicated D-0/g, '"Dedicated DD-0');
content = content.replace(/"Dedicated D-10/g, '"Dedicated DD-10');

fs.writeFileSync(initialDataPath, content, 'utf8');
console.log('✅ initialData.js spaces updated successfully!');
