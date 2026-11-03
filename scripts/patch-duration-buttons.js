const fs = require('fs');

let bundle = fs.readFileSync('js/meeting-rooms-bundle.js', 'utf8');

// 1. Add handleSelectDuration after getSlotState
const marker1 = '  var getGCalUrl = function getGCalUrl(booking) {';
if (!bundle.includes('var handleSelectDuration = function')) {
  const insert1 = '  var handleSelectDuration = function handleSelectDuration(newDur) {\r\n' +
    '    setBookingDuration(newDur);\r\n' +
    '    if (!bookingModalRoom) return;\r\n' +
    '    var slotInfo = getSlotState(bookingStartTime, bookingModalRoom, bookingDate, bookingStartTime, newDur);\r\n' +
    '    if (slotInfo.disabled || slotInfo.status === "unavailable" || slotInfo.status === "booked" || slotInfo.status === "past") {\r\n' +
    '      var firstOpen = TIME_SLOTS_12H.find(function(s) {\r\n' +
    '        var st = getSlotState(s, bookingModalRoom, bookingDate, s, newDur);\r\n' +
    '        return !st.disabled && st.status === "available";\r\n' +
    '      });\r\n' +
    '      if (firstOpen) {\r\n' +
    '        setBookingStartTime(firstOpen);\r\n' +
    '      }\r\n' +
    '    }\r\n' +
    '  };\r\n';
  bundle = bundle.replace(marker1, insert1 + marker1);
  console.log('Added handleSelectDuration');
} else {
  console.log('handleSelectDuration already present');
}

// 2. Replace the <select> duration dropdown with the 5 duration buttons
const selectStart = '/*#__PURE__*/React.createElement(Icon, {\r\n    name: "clock",\r\n    className: "w-3.5 h-3.5 text-[#4F3FE0]"\r\n  }), /*#__PURE__*/React.createElement("span", null, "Duration & End Time")), /*#__PURE__*/React.createElement("select", {';
const selectEnd = 'dur === 0.5 ? "30 mins" : "".concat(dur, " hrs"), " (Ends at ", endStr, ")");\r\n  }))';

const replacement2 = '/*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {\r\n' +
  '    className: "flex items-center justify-between mb-1.5"\r\n' +
  '  }, /*#__PURE__*/React.createElement("label", {\r\n' +
  '    className: "text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-1.5"\r\n' +
  '  }, /*#__PURE__*/React.createElement(Icon, {\r\n' +
  '    name: "clock",\r\n' +
  '    className: "w-3.5 h-3.5 text-[#4F3FE0]"\r\n' +
  '  }), /*#__PURE__*/React.createElement("span", null, "Booking Duration")), /*#__PURE__*/React.createElement("span", {\r\n' +
  '    className: "text-[11.5px] font-bold text-[#4F3FE0]"\r\n' +
  '  }, (function () {\r\n' +
  '    var sMin = timeStrToMinutes(bookingStartTime);\r\n' +
  '    var eMin = sMin + Math.round(bookingDuration * 60);\r\n' +
  '    var endStr = minutesToTimeStr(eMin);\r\n' +
  '    return endStr ? "Ends at ".concat(endStr) : "";\r\n' +
  '  })())), /*#__PURE__*/React.createElement("div", {\r\n' +
  '    className: "grid grid-cols-5 gap-1.5"\r\n' +
  '  }, [\r\n' +
  '    { label: "30m", val: 0.5 },\r\n' +
  '    { label: "1hr", val: 1.0 },\r\n' +
  '    { label: "1.5hrs", val: 1.5 },\r\n' +
  '    { label: "2hrs", val: 2.0 },\r\n' +
  '    { label: "3hrs", val: 3.0 }\r\n' +
  '  ].map(function (d) {\r\n' +
  '    var isSelected = bookingDuration === d.val;\r\n' +
  '    return /*#__PURE__*/React.createElement("button", {\r\n' +
  '      key: d.label,\r\n' +
  '      type: "button",\r\n' +
  '      onClick: function onClick() {\r\n' +
  '        return handleSelectDuration(d.val);\r\n' +
  '      },\r\n' +
  '      className: "py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ".concat(isSelected ? "bg-[#4F3FE0] text-white border-[#4F3FE0] shadow-sm ring-1 ring-[#4F3FE0]" : "bg-[#F8FAFC] border-[#ECEEF4] text-[#374151] hover:bg-[#F1F3F9] hover:border-[#CBD5E1]")\r\n' +
  '    }, d.label);\r\n' +
  '  }))';

const pStart = bundle.indexOf(selectStart);
const pEnd = bundle.indexOf(selectEnd, pStart);
if (pStart !== -1 && pEnd !== -1) {
  const divBefore = bundle.lastIndexOf('/*#__PURE__*/React.createElement("div", null,', pStart);
  bundle = bundle.substring(0, divBefore) + replacement2 + bundle.substring(pEnd + selectEnd.length);
  console.log('Replaced duration select with 5 duration buttons');
} else {
  console.error('Could not find duration select element:', pStart, pEnd);
  process.exit(1);
}

fs.writeFileSync('js/meeting-rooms-bundle.js', bundle, 'utf8');
console.log('Updated js/meeting-rooms-bundle.js successfully');

