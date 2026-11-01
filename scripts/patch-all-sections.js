const fs = require('fs');

const bundlePath = 'js/meeting-rooms-bundle.js';
let code = fs.readFileSync(bundlePath, 'utf8');

// 1. Fix typo in duration label: " (Ends at $" -> " (Ends at "
code = code.replace('" (Ends at $", endStr', '" (Ends at ", endStr');

// 2. Add state hooks for the interactive sections right after setBookingSuccessData
const stateSearch = 'setBookingSuccessData = _useState66[1];';

const newStates = `setBookingSuccessData = _useState66[1];

  var _useStateCalView = useState("Day"),
    calendarView = _useStateCalView[0],
    setCalendarView = _useStateCalView[1];

  var _useStateAnalyticsPer = useState("This Month"),
    analyticsPeriod = _useStateAnalyticsPer[0],
    setAnalyticsPeriod = _useStateAnalyticsPer[1];

  var _useStateDeskFloor = useState("Ground Floor (East Wing)"),
    activeDeskFloor = _useStateDeskFloor[0],
    setActiveDeskFloor = _useStateDeskFloor[1];

  var _useStateVisTab = useState("All Visitors"),
    visitorsTab = _useStateVisTab[0],
    setVisitorsTab = _useStateVisTab[1];

  var _useStateVisModal = useState(false),
    isVisitorModalOpen = _useStateVisModal[0],
    setIsVisitorModalOpen = _useStateVisModal[1];

  var _useStateNewVis = useState({ name: "", org: "", host: "Alex Morgan", room: "Boardroom Alpha", time: "10:00 AM" }),
    newVisitorData = _useStateNewVis[0],
    setNewVisitorData = _useStateNewVis[1];

  var _useStateVisitorsList = useState([
    { id: "v-1", name: "Vikram Malhotra", org: "Sequoia Capital", host: "Alex Morgan", room: "Boardroom Alpha", time: "09:00 AM", status: "Pass Issued" },
    { id: "v-2", name: "Dr. Ananya Rao", org: "Apollo Health Tech", host: "Sarah Chen", room: "Collaboration Room", time: "03:30 PM", status: "Checked In" },
    { id: "v-3", name: "Rohit Sharma", org: "Nexus Capital", host: "David Kim", room: "Pitch Arena Nexus", time: "11:30 AM", status: "Completed" },
    { id: "v-4", name: "Meera Nair", org: "AWS Cloud", host: "Priya Patel", room: "Focus Room", time: "05:00 PM", status: "Pass Issued" }
  ]),
    visitorsList = _useStateVisitorsList[0],
    setVisitorsList = _useStateVisitorsList[1];

  var _useStateMemSearch = useState(""),
    memberSearchQuery = _useStateMemSearch[0],
    setMemberSearchQuery = _useStateMemSearch[1];

  var _useStateInvModal = useState(false),
    isInviteModalOpen = _useStateInvModal[0],
    setIsInviteModalOpen = _useStateInvModal[1];

  var _useStateNewMem = useState({ name: "", email: "", role: "AI Engineer", desk: "Desk 4E (Floating)" }),
    newMemberData = _useStateNewMem[0],
    setNewMemberData = _useStateNewMem[1];

  var _useStateMembersList = useState([
    { id: "m-1", name: "Alex Morgan", role: "Co-Founder & CEO", email: "alex.m@xyztech.io", avatar: "AM", desk: "Desk 4A", hoursBooked: 14, access: "Full Incubator Admin" },
    { id: "m-2", name: "Sarah Chen", role: "CTO & Co-Founder", email: "sarah.c@xyztech.io", avatar: "SC", desk: "Desk 4B", hoursBooked: 10, access: "Full Incubator Admin" },
    { id: "m-3", name: "David Kim", role: "Head of Product", email: "david.k@xyztech.io", avatar: "DK", desk: "Desk 4C", hoursBooked: 8, access: "Member Access" },
    { id: "m-4", name: "Priya Patel", role: "Lead AI Engineer", email: "priya.p@xyztech.io", avatar: "PP", desk: "Desk 4D", hoursBooked: 6, access: "Member Access" },
    { id: "m-5", name: "Arjun Reddy", role: "Full-Stack Engineer", email: "arjun.r@xyztech.io", avatar: "AR", desk: "Desk 4E (Floating)", hoursBooked: 4, access: "Member Access" },
    { id: "m-6", name: "Sneha Joshi", role: "UI/UX Designer", email: "sneha.j@xyztech.io", avatar: "SJ", desk: "Desk 4F (Floating)", hoursBooked: 2, access: "Member Access" }
  ]),
    membersList = _useStateMembersList[0],
    setMembersList = _useStateMembersList[1];`;

if (code.includes(stateSearch)) {
  code = code.replace(stateSearch, newStates);
  console.log('✓ Injected state hooks successfully');
} else {
  console.error('State hook insertion target not found!');
  process.exit(1);
}

// 3. Replace Calendar section (activeNav === "Calendar")
const calStart = 'activeNav === "Calendar" && /*#__PURE__*/React.createElement("div", {\n    className: "space-y-6 animate-fadeIn"\n  }, /*#__PURE__*/React.createElement("div", {\n    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"';
const calEnd = 'activeNav === "Billing & Credits"';

const calIdxStart = code.indexOf(calStart);
const calIdxEnd = code.indexOf(calEnd);

if (calIdxStart === -1 || calIdxEnd === -1) {
  console.error('Calendar boundaries not found!');
  process.exit(1);
}

const newCalendarCode = `activeNav === "Calendar" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Interactive Room Calendar"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Real-time room occupancy and timeline scheduling")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 bg-[#F8FAFC] border border-[#ECEEF4] p-1 rounded-xl"
  }, ["Day", "Week", "Month"].map(function (v) {
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: function onClick() {
        return setCalendarView(v);
      },
      className: "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ".concat(calendarView === v ? "bg-[#4F3FE0] text-white shadow-xs" : "text-[#64748B] hover:text-[#111827]")
    }, v);
  }))), calendarView === "Day" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4] flex-wrap gap-2 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-[#111827] flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    className: "w-4 h-4 text-[#4F3FE0]"
  }), /*#__PURE__*/React.createElement("span", null, "Monday, 2 November 2026 \u2022 Full Schedule")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 text-[11px] font-semibold text-[#8A90A2]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-[#4F3FE0]"
  }), " Reserved Meeting"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-emerald-500"
  }), " Open Slot (Click to Book)"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-6 gap-2 text-center font-bold text-xs text-[#64748B] pb-2"
  }, rooms.map(function (r) {
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      className: "truncate px-1 bg-[#F8FAFC] py-2 rounded-lg border border-[#ECEEF4]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-extrabold text-[#111827] truncate"
    }, r.name), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-[#8A90A2] font-semibold mt-0.5"
    }, r.capacity, " Pax"));
  })), ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"].map(function (hour) {
    return /*#__PURE__*/React.createElement("div", {
      key: hour,
      className: "grid grid-cols-6 gap-2 items-center py-2.5 border-b border-gray-100 text-xs"
    }, rooms.map(function (r) {
      var isOccupied = (hour === "09:00 AM" && r.id === "mr-1") ||
                       (hour === "11:00 AM" && r.id === "mr-2") ||
                       (hour === "03:00 PM" && r.id === "mr-4") ||
                       (hour === "04:00 PM" && r.id === "mr-1");
      return isOccupied ? /*#__PURE__*/React.createElement("div", {
        key: r.id,
        className: "bg-[#EEEBFF] border border-[#D5CCFF] text-[#4F3FE0] p-2.5 rounded-xl text-center font-bold truncate shadow-2xs"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-[11px]"
      }, "Occupied (", hour, ")"), /*#__PURE__*/React.createElement("div", {
        className: "text-[9.5px] font-semibold text-[#6D5CD6] truncate mt-0.5"
      }, r.id === "mr-1" ? "Leadership Review" : r.id === "mr-2" ? "Investor Pitch" : "Sprint Planning")) : /*#__PURE__*/React.createElement("button", {
        key: r.id,
        onClick: function onClick() {
          openBookingModal(r);
        },
        className: "bg-[#F8FAFC] border border-dashed border-[#ECEEF4] hover:border-[#4F3FE0] hover:bg-[#F3EFFE] text-[#8A90A2] hover:text-[#4F3FE0] p-2.5 rounded-xl text-center font-medium transition-all group"
      }, /*#__PURE__*/React.createElement("span", {
        className: "group-hover:font-bold"
      }, "+ Open (", hour, ")"));
    }));
  })), calendarView === "Week" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4] text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-[#111827]"
  }, "Week of Nov 2 \u2013 Nov 8, 2026"), /*#__PURE__*/React.createElement("div", {
    className: "text-[#8A90A2]"
  }, "7 Active Bookings Across 6 Suites")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-3 text-center"
  }, [
    { day: "Mon", date: "Nov 2", count: 3, active: true },
    { day: "Tue", date: "Nov 3", count: 2, active: false },
    { day: "Wed", date: "Nov 4", count: 4, active: false },
    { day: "Thu", date: "Nov 5", count: 1, active: false },
    { day: "Fri", date: "Nov 6", count: 5, active: false },
    { day: "Sat", date: "Nov 7", count: 0, active: false },
    { day: "Sun", date: "Nov 8", count: 0, active: false }
  ].map(function (d) {
    return /*#__PURE__*/React.createElement("div", {
      key: d.day,
      className: "p-4 rounded-xl border transition-all ".concat(d.active ? "border-[#4F3FE0] bg-[#EEEBFF]" : "border-[#ECEEF4] bg-[#F8FAFC]")
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#8A90A2]"
    }, d.day), /*#__PURE__*/React.createElement("div", {
      className: "text-base font-black text-[#111827] mt-0.5"
    }, d.date), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#4F3FE0] mt-2"
    }, d.count, " bookings"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setCalendarView("Day");
      },
      className: "mt-3 w-full text-[11px] font-bold py-1.5 bg-white border border-[#ECEEF4] rounded-lg text-[#111827] hover:border-[#4F3FE0]"
    }, "View Day"));
  }))), calendarView === "Month" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-[#ECEEF4] text-xs font-bold text-[#111827]"
  }, /*#__PURE__*/React.createElement("span", null, "November 2026"), /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2]"
  }, "30 Days \u2022 18 Reserved Slots")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-2 text-center text-xs"
  }, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (h) {
    return /*#__PURE__*/React.createElement("div", {
      key: h,
      className: "font-black text-[#8A90A2] py-2"
    }, h);
  }), Array.from({ length: 30 }, function (_, i) {
    var dayNum = i + 1;
    var hasBookings = [2, 3, 4, 6, 9, 11, 14, 18, 20, 25].includes(dayNum);
    return /*#__PURE__*/React.createElement("div", {
      key: dayNum,
      onClick: function onClick() {
        return setCalendarView("Day");
      },
      className: "p-2.5 rounded-xl border border-[#ECEEF4] bg-[#F8FAFC] hover:border-[#4F3FE0] hover:bg-[#EEEBFF] cursor-pointer transition-all flex flex-col items-center justify-between min-h-[58px]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-[#111827]"
    }, dayNum), hasBookings && /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full bg-[#4F3FE0]"
    }));
  })))), `;

code = code.slice(0, calIdxStart) + newCalendarCode + code.slice(calIdxEnd);
console.log('✓ Replaced Calendar view successfully');

// 4. Replace Analytics, Workspace & Desks, Visitors, Members (from activeNav === "Analytics" to activeNav === "Database Tables")
const anaStart = 'activeNav === "Analytics" && /*#__PURE__*/React.createElement("div", {\n    className: "space-y-6 animate-fadeIn"\n  }, /*#__PURE__*/React.createElement("div", {\n    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft"';
const dbStart = 'activeNav === "Database Tables"';

const anaIdxStart = code.indexOf(anaStart);
const dbIdxStart = code.indexOf(dbStart);

if (anaIdxStart === -1 || dbIdxStart === -1) {
  console.error('Analytics/Workspace/Visitors/Members boundaries not found!');
  process.exit(1);
}

const newEnhancedSections = `activeNav === "Analytics" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Meeting Space Insights & Analytics"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Utilization frequency, party density, peak hours, and incubator credit savings")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 bg-[#F8FAFC] border border-[#ECEEF4] p-1 rounded-xl"
  }, ["This Month", "Last 7 Days", "Last 90 Days"].map(function (p) {
    return /*#__PURE__*/React.createElement("button", {
      key: p,
      onClick: function onClick() {
        return setAnalyticsPeriod(p);
      },
      className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all ".concat(analyticsPeriod === p ? "bg-[#4F3FE0] text-white shadow-xs" : "text-[#64748B] hover:text-[#111827]")
    }, p);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return showToast("Analytics summary report (CSV) exported successfully!");
    },
    className: "bg-[#111827] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Export Report")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Total Booked Hours"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#111827] mt-2"
  }, "28 hrs"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-emerald-600 mt-1 block"
  }, "\u2191 14% vs last month")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Favorite Room"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-[#4F3FE0] mt-2"
  }, "Boardroom Alpha"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] mt-1 block"
  }, "82% utilization rate")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Average Attendance"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-[#111827] mt-2"
  }, "5.8 pax"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] mt-1 block"
  }, "Healthy meeting density")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Credits Saved"), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-emerald-600 mt-2"
  }, "\u20B914,500"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] mt-1 block"
  }, "Included with incubator pass"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-extrabold text-[#111827]"
  }, "Room Utilization Frequency"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Percentage of available operating hours booked")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, [
    { name: "Boardroom Alpha", pct: 82, hrs: "28 hrs", color: "bg-[#4F3FE0]" },
    { name: "Pitch Arena Nexus", pct: 68, hrs: "22 hrs", color: "bg-indigo-500" },
    { name: "Collaboration Room", pct: 55, hrs: "16 hrs", color: "bg-purple-500" },
    { name: "Focus Room", pct: 48, hrs: "14 hrs", color: "bg-blue-500" },
    { name: "Training Room", pct: 35, hrs: "10 hrs", color: "bg-emerald-500" },
    { name: "Creative Studio", pct: 28, hrs: "8 hrs", color: "bg-amber-500" }
  ].map(function (item) {
    return /*#__PURE__*/React.createElement("div", {
      key: item.name,
      className: "space-y-1.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between text-xs font-bold"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#111827]"
    }, item.name), /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2]"
    }, item.pct, "% (", item.hrs, ")")), /*#__PURE__*/React.createElement("div", {
      className: "w-full h-2.5 rounded-full bg-[#F1F3F9] overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full rounded-full ".concat(item.color),
      style: { width: "".concat(item.pct, "%") }
    })));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-extrabold text-[#111827]"
  }, "Peak Meeting Hours & Distribution"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-0.5"
  }, "Hourly booking volume across the day (12-hour format)")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-5 gap-2 items-end h-40 pt-4"
  }, [
    { time: "09:00 AM", count: 18, pct: "75%" },
    { time: "11:00 AM", count: 24, pct: "100%" },
    { time: "01:00 PM", count: 12, pct: "50%" },
    { time: "03:00 PM", count: 22, pct: "92%" },
    { time: "05:00 PM", count: 14, pct: "58%" }
  ].map(function (slot) {
    return /*#__PURE__*/React.createElement("div", {
      key: slot.time,
      className: "flex flex-col items-center gap-1.5 h-full justify-end"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-black text-[#4F3FE0]"
    }, slot.count), /*#__PURE__*/React.createElement("div", {
      className: "w-full bg-[#EEEBFF] hover:bg-[#4F3FE0] transition-colors rounded-t-lg",
      style: { height: slot.pct }
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-bold text-[#8A90A2] whitespace-nowrap mt-1"
    }, slot.time));
  })), /*#__PURE__*/React.createElement("div", {
    className: "pt-4 border-t border-[#ECEEF4] grid grid-cols-2 gap-3 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] rounded-xl border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2] text-[11px] font-bold"
  }, "Executive / Board"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black text-[#111827] mt-0.5"
  }, "42% of bookings")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-[#F8FAFC] rounded-xl border border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[#8A90A2] text-[11px] font-bold"
  }, "Sprint Syncs / Tech"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-black text-[#111827] mt-0.5"
  }, "31% of bookings")))))), activeNav === "Workspace & Desks" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Workspace & Dedicated Pods"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Cyber City Hub \u2022 Ground Floor East Wing \u2022 Dedicated Incubator Zone")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold"
  }, "Allocated: Dedicated Pod #4"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return showToast("Floating desk reservation confirmed for today!");
    },
    className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
  }, "+ Book Hot Desk"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#EEEBFF] border border-[#D5CCFF] rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-11 h-11 rounded-xl bg-[#4F3FE0] text-white flex items-center justify-center text-xl flex-shrink-0"
  }, "\uD83C\uDFE2"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-extrabold text-[#111827]"
  }, "XYZ Technologies Dedicated Workstation Quad"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#4F3FE0] font-semibold mt-0.5"
  }, "6 Dedicated Desks \u2022 2 Floating Hot Desks \u2022 24/7 Biometric Access \u2022 1 Gbps Fiber"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, ["Ground Floor (East Wing)", "1st Floor (Open Zone)", "2nd Floor (Quiet Hub)"].map(function (floor) {
    return /*#__PURE__*/React.createElement("button", {
      key: floor,
      onClick: function onClick() {
        return setActiveDeskFloor(floor);
      },
      className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all ".concat(activeDeskFloor === floor ? "bg-[#4F3FE0] text-white shadow-xs" : "bg-white/80 border border-[#ECEEF4] text-[#374151] hover:bg-white")
    }, floor);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-base font-extrabold text-[#111827]"
  }, "Assigned Team Workstations (", activeDeskFloor, ")"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full"
  }, "6 / 6 Assigned & Active")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
  }, [
    { desk: "Desk 4A", user: "Alex Morgan", role: "CEO & Co-Founder", specs: "Standing Desk + Dual 4K Displays", status: "Active" },
    { desk: "Desk 4B", user: "Sarah Chen", role: "CTO & Co-Founder", specs: "Dual 4K Displays + Gigabit LAN", status: "Active" },
    { desk: "Desk 4C", user: "David Kim", role: "Head of Product", specs: "Ultrawide 34-inch Curved Monitor", status: "Active" },
    { desk: "Desk 4D", user: "Priya Patel", role: "Lead AI Engineer", specs: "High-Perf Workstation + Dual Display", status: "Active" },
    { desk: "Desk 4E", user: "Arjun Reddy", role: "Full-Stack Dev (Floating)", specs: "Hot Desk with USB-C Hub", status: "Floating" },
    { desk: "Desk 4F", user: "Sneha Joshi", role: "UI/UX Designer (Floating)", specs: "Hot Desk with Calibrated Monitor", status: "Floating" }
  ].map(function (d, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "p-4 bg-[#F8FAFC] border border-[#ECEEF4] rounded-2xl flex flex-col justify-between gap-3 hover:border-[#4F3FE0]/50 transition-all shadow-2xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-2xl"
    }, "\uD83E\uDE91"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-black text-sm text-[#111827]"
    }, d.desk), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#4F3FE0]"
    }, d.user))), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-black px-2 py-0.5 rounded-full ".concat(d.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-purple-50 text-purple-700 border border-purple-200")
    }, d.status)), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#8A90A2] font-medium"
    }, d.specs), /*#__PURE__*/React.createElement("div", {
      className: "pt-2 border-t border-[#ECEEF4] flex items-center justify-between text-[11px]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#64748B] font-semibold"
    }, d.role), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return showToast("Workstation reallocation request logged.");
      },
      className: "text-[#4F3FE0] hover:underline font-bold"
    }, "Manage")));
  })))), activeNav === "Visitors" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Visitor Gate Passes & Invites"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "Issue instant QR security credentials and track arriving guest founders")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 bg-[#F8FAFC] border border-[#ECEEF4] p-1 rounded-xl"
  }, ["All Visitors", "Expected Today", "Checked In"].map(function (tab) {
    return /*#__PURE__*/React.createElement("button", {
      key: tab,
      onClick: function onClick() {
        return setVisitorsTab(tab);
      },
      className: "px-3 py-1.5 rounded-lg text-xs font-bold transition-all ".concat(visitorsTab === tab ? "bg-[#4F3FE0] text-white shadow-xs" : "text-[#64748B] hover:text-[#111827]")
    }, tab);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsVisitorModalOpen(true);
    },
    className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold"
  }, "+"), /*#__PURE__*/React.createElement("span", null, "Create Guest Pass")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Expected Today"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-[#111827] mt-1"
  }, "2 Visitors"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#4F3FE0] font-semibold mt-0.5 block"
  }, "Security desks notified")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Currently Checked In"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-emerald-600 mt-1"
  }, "1 Guest Active"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-[#8A90A2] font-semibold mt-0.5 block"
  }, "Meeting in Collaboration Room")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-[#8A90A2]"
  }, "Monthly Passes Issued"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-black text-[#111827] mt-1"
  }, "14 Passes"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-emerald-600 font-semibold mt-0.5 block"
  }, "Zero security incidents"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-base font-extrabold text-[#111827]"
  }, "Guest Pass Directory & Status"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, visitorsList.filter(function (v) {
    if (visitorsTab === "Expected Today") return v.status === "Pass Issued";
    if (visitorsTab === "Checked In") return v.status === "Checked In";
    return true;
  }).map(function (v) {
    return /*#__PURE__*/React.createElement("div", {
      key: v.id,
      className: "p-4 bg-[#F8FAFC] border border-[#ECEEF4] rounded-2xl flex items-center justify-between flex-wrap gap-3 text-xs hover:border-[#4F3FE0]/40 transition-all shadow-2xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-10 h-10 rounded-xl bg-[#EEEBFF] text-[#4F3FE0] font-black flex items-center justify-center text-sm flex-shrink-0"
    }, v.name.split(" ").map(function (n) { return n[0]; }).join("")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-black text-sm text-[#111827]"
    }, v.name, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-semibold text-[#8A90A2] ml-2"
    }, "(", v.org, ")")), /*#__PURE__*/React.createElement("div", {
      className: "text-[#64748B] text-xs font-medium mt-0.5"
    }, "Host: ", /*#__PURE__*/React.createElement("strong", { className: "text-[#111827]" }, v.host), " \u2022 Session in ", /*#__PURE__*/React.createElement("strong", { className: "text-[#4F3FE0]" }, v.room), " at ", /*#__PURE__*/React.createElement("strong", null, v.time)))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "px-3 py-1 rounded-full font-bold text-xs ".concat(v.status === "Checked In" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : v.status === "Pass Issued" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-gray-100 text-gray-600 border border-gray-200")
    }, v.status), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        setVisitorsList(function (prev) {
          return prev.map(function (item) {
            return item.id === v.id ? Object.assign({}, item, { status: item.status === "Checked In" ? "Completed" : "Checked In" }) : item;
          });
        });
        showToast("Visitor status updated for ".concat(v.name));
      },
      className: "px-3 py-1 bg-white border border-[#ECEEF4] hover:border-[#4F3FE0] hover:text-[#4F3FE0] text-[#111827] text-xs font-bold rounded-lg transition-all"
    }, v.status === "Checked In" ? "Check Out" : "Check In"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return showToast("QR gate pass re-sent to ".concat(v.name));
      },
      className: "px-3 py-1 bg-[#EEEBFF] text-[#4F3FE0] text-xs font-bold rounded-lg hover:bg-[#E3DEFF] transition-all"
    }, "Resend QR")));
  }))), isVisitorModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-[#111827]"
  }, "Create Guest Gate Pass"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsVisitorModalOpen(false);
    },
    className: "text-[#8A90A2] hover:text-[#111827] font-bold"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 text-xs font-bold text-[#374151]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Visitor Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newVisitorData.name,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { name: e.target.value }));
    },
    placeholder: "e.g. Sridhar Vembu",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Company / Organization"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newVisitorData.org,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { org: e.target.value }));
    },
    placeholder: "e.g. Zoho Corporation",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Host Founder"), /*#__PURE__*/React.createElement("select", {
    value: newVisitorData.host,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { host: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, ["Alex Morgan", "Sarah Chen", "David Kim", "Priya Patel"].map(function (h) {
    return /*#__PURE__*/React.createElement("option", {
      key: h,
      value: h
    }, h);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Meeting Room"), /*#__PURE__*/React.createElement("select", {
    value: newVisitorData.room,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { room: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, rooms.map(function (r) {
    return /*#__PURE__*/React.createElement("option", {
      key: r.name,
      value: r.name
    }, r.name);
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Arrival Time (12-Hour AM/PM)"), /*#__PURE__*/React.createElement("select", {
    value: newVisitorData.time,
    onChange: function onChange(e) {
      return setNewVisitorData(Object.assign({}, newVisitorData, { time: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, ["09:00 AM", "10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"].map(function (t) {
    return /*#__PURE__*/React.createElement("option", {
      key: t,
      value: t
    }, t);
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-2 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsVisitorModalOpen(false);
    },
    className: "px-4 py-2 border border-[#ECEEF4] rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-50"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      if (!newVisitorData.name.trim()) return showToast("Please enter visitor name");
      var newV = {
        id: "v-".concat(Date.now()),
        name: newVisitorData.name,
        org: newVisitorData.org || "External Partner",
        host: newVisitorData.host,
        room: newVisitorData.room,
        time: newVisitorData.time,
        status: "Pass Issued"
      };
      setVisitorsList(function (prev) {
        return [newV].concat(prev);
      });
      setIsVisitorModalOpen(false);
      setNewVisitorData({ name: "", org: "", host: "Alex Morgan", room: "Boardroom Alpha", time: "10:00 AM" });
      showToast("Security QR gate pass issued for ".concat(newV.name));
    },
    className: "px-4 py-2 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-xs"
  }, "Issue Security Pass"))))), activeNav === "Members" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black text-[#111827]"
  }, "Venture Team Directory"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-[#8A90A2] mt-1"
  }, "XYZ Technologies registered incubator founders, keyholders, and allocated credits")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 flex-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    className: "w-3.5 h-3.5 text-[#8A90A2] absolute left-3 top-1/2 -translate-y-1/2"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: memberSearchQuery,
    onChange: function onChange(e) {
      return setMemberSearchQuery(e.target.value);
    },
    placeholder: "Search team members...",
    className: "bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0] w-48 font-medium"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsInviteModalOpen(true);
    },
    className: "bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold"
  }, "+"), /*#__PURE__*/React.createElement("span", null, "Invite Member")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
  }, membersList.filter(function (m) {
    if (!memberSearchQuery) return true;
    var q = memberSearchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  }).map(function (m) {
    return /*#__PURE__*/React.createElement("div", {
      key: m.id,
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between gap-4 hover:border-[#4F3FE0]/50 transition-all shadow-2xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start gap-3.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-12 h-12 rounded-full bg-gradient-to-tr from-[#4F3FE0] to-[#8B5CF6] text-white font-extrabold flex items-center justify-center text-sm shadow-sm flex-shrink-0"
    }, m.avatar), /*#__PURE__*/React.createElement("div", {
      className: "truncate flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-black text-sm text-[#111827] truncate"
    }, m.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs font-bold text-[#4F3FE0]"
    }, m.role), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-[#8A90A2] truncate mt-0.5"
    }, m.email))), /*#__PURE__*/React.createElement("div", {
      className: "bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl p-3 space-y-1.5 text-[11px]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2] font-semibold"
    }, "Allocated Desk:"), /*#__PURE__*/React.createElement("span", {
      className: "font-black text-[#111827]"
    }, m.desk)), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2] font-semibold"
    }, "Monthly Usage:"), /*#__PURE__*/React.createElement("span", {
      className: "font-black text-[#4F3FE0]"
    }, m.hoursBooked, " hrs booked")), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[#8A90A2] font-semibold"
    }, "Access Level:"), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-emerald-600"
    }, m.access))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-xs pt-2 border-t border-[#ECEEF4]"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return showToast("Direct Slack invite sent to ".concat(m.name));
      },
      className: "text-[#4F3FE0] font-bold hover:underline"
    }, "Message \u2192"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return showToast("Member permissions opened for ".concat(m.name));
      },
      className: "text-[#8A90A2] hover:text-[#111827] font-semibold"
    }, "Settings")));
  })), isInviteModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-[#111827]"
  }, "Invite Venture Team Member"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsInviteModalOpen(false);
    },
    className: "text-[#8A90A2] hover:text-[#111827] font-bold"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 text-xs font-bold text-[#374151]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newMemberData.name,
    onChange: function onChange(e) {
      return setNewMemberData(Object.assign({}, newMemberData, { name: e.target.value }));
    },
    placeholder: "e.g. Rohini Gupta",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Work Email Address"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: newMemberData.email,
    onChange: function onChange(e) {
      return setNewMemberData(Object.assign({}, newMemberData, { email: e.target.value }));
    },
    placeholder: "rohini.g@xyztech.io",
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Role / Title"), /*#__PURE__*/React.createElement("select", {
    value: newMemberData.role,
    onChange: function onChange(e) {
      return setNewMemberData(Object.assign({}, newMemberData, { role: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, ["Software Engineer", "AI/ML Specialist", "Product Designer", "Operations Manager", "Growth Lead"].map(function (r) {
    return /*#__PURE__*/React.createElement("option", {
      key: r,
      value: r
    }, r);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block mb-1 text-[#111827]"
  }, "Workstation"), /*#__PURE__*/React.createElement("select", {
    value: newMemberData.desk,
    onChange: function onChange(e) {
      return setNewMemberData(Object.assign({}, newMemberData, { desk: e.target.value }));
    },
    className: "w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
  }, ["Desk 4E (Floating)", "Desk 4F (Floating)", "Flexible Hot Desk", "Remote Keyholder"].map(function (d) {
    return /*#__PURE__*/React.createElement("option", {
      key: d,
      value: d
    }, d);
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-2 border-t border-[#ECEEF4]"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setIsInviteModalOpen(false);
    },
    className: "px-4 py-2 border border-[#ECEEF4] rounded-xl text-xs font-bold text-[#64748B] hover:bg-gray-50"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      if (!newMemberData.name.trim() || !newMemberData.email.trim()) return showToast("Please provide name and email");
      var initials = newMemberData.name.split(" ").map(function (n) { return n[0]; }).join("").toUpperCase().slice(0, 2);
      var newM = {
        id: "m-".concat(Date.now()),
        name: newMemberData.name,
        email: newMemberData.email,
        role: newMemberData.role,
        avatar: initials || "TM",
        desk: newMemberData.desk,
        hoursBooked: 0,
        access: "Member Access"
      };
      setMembersList(function (prev) {
        return [newM].concat(prev);
      });
      setIsInviteModalOpen(false);
      setNewMemberData({ name: "", email: "", role: "AI Engineer", desk: "Desk 4E (Floating)" });
      showToast("Incubator invite sent to ".concat(newM.email));
    },
    className: "px-4 py-2 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-xs"
  }, "Send Team Invite"))))), `;

code = code.slice(0, anaIdxStart) + newEnhancedSections + code.slice(dbIdxStart);
console.log('✓ Replaced Analytics, Workspace & Desks, Visitors, and Members sections successfully');

// Write out to js/meeting-rooms-bundle.js and public/js/meeting-rooms-bundle.js
fs.writeFileSync(bundlePath, code, 'utf8');
fs.writeFileSync('public/js/meeting-rooms-bundle.js', code, 'utf8');
console.log('✅ Updated bundle successfully in both js/ and public/js/!');
