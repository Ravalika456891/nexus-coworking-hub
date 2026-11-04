const fs = require('fs');
const bundlePath = 'js/meeting-rooms-bundle.js';
let code = fs.readFileSync(bundlePath, 'utf8');

const regex = /\/\*#__PURE__\*\/React\.createElement\("div", \{\s*className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"\s*\},[\s\S]*?Included with incubator pass[\s\S]*?\)\)\)/;

console.log('Regex matches:', regex.test(code));

const replacement = `/*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Total Booked Hours"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#111827] mt-2"
  }, "16.0 hrs"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-emerald-600 mt-1 block"
  }, "XYZ Technologies • This Month")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Billed Revenue"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#111827] mt-2"
  }, "₹0"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] mt-1 block"
  }, "100% within plan credits")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Credit Value Used"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#16a34a] mt-2"
  }, "₹24,000"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] mt-1 block"
  }, "Plan subsidized (hours × room rate)")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Credit Quota Remaining"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-[#4F3FE0] mt-2"
  }, "14.0 hrs"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#4F3FE0] mt-1 block"
  }, "Plan: 4.0h left + 10.0h top-up")))`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync(bundlePath, code, 'utf8');
  console.log('✅ Replaced KPI cards in bundle successfully!');
}

// Peak hours regex replacement:
const peakRegex = /\[\s*\{\s*time:\s*"09:00 AM"[\s\S]*?\{\s*time:\s*"05:00 PM"[\s\S]*?\}\s*\]/;
console.log('peakRegex matches:', peakRegex.test(code));
if (peakRegex.test(code)) {
  const replacementPeak = `[
    { time: "10:00 AM", count: 12, pct: "50%" },
    { time: "02:00 PM", count: 18, pct: "75%" },
    { time: "05:00 PM", count: 14, pct: "58%" },
    { time: "07:00 PM", count: 24, pct: "100%" },
    { time: "10:30 PM", count: 16, pct: "66%" }
  ]`;
  code = code.replace(peakRegex, replacementPeak);
  fs.writeFileSync(bundlePath, code, 'utf8');
  console.log('✅ Replaced Peak hours chart in bundle successfully!');
}
