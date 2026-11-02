const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '..', 'js', 'meeting-rooms-bundle.js');
let code = fs.readFileSync(bundlePath, 'utf8');

// 1. Target INITIAL_ROOMS definition
const initialRoomsStart = code.indexOf('var INITIAL_ROOMS = [');
if (initialRoomsStart === -1) {
  console.error('Could not find INITIAL_ROOMS');
  process.exit(1);
}

// Find the end of INITIAL_ROOMS
const initialRoomsEnd = code.indexOf('var ROOM_TYPES = [', initialRoomsStart);
if (initialRoomsEnd === -1) {
  console.error('Could not find ROOM_TYPES after INITIAL_ROOMS');
  process.exit(1);
}

const newInitialRoomsCode = `var INITIAL_ROOMS = [{
  id: "mr-1",
  name: "Boardroom Alpha",
  floor: "1F",
  roomNumber: "1F-R01",
  capacity: 4,
  type: "Boardroom",
  status: "Available",
  image: "assets/rooms/mr-01-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
  amenities: ["Interactive 4K Display", "Jabra Panacast 180°", "Dual Whiteboards", "High-Speed Wi-Fi"],
  rate: "₹1,500/hr"
}, {
  id: "mr-3",
  name: "Brainstorm Pod Beta",
  floor: "1F",
  roomNumber: "1F-R02",
  capacity: 6,
  type: "Meeting Room",
  status: "Available",
  image: "assets/rooms/mr-03-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
  amenities: ["Floor-to-Ceiling Whiteboard", "Apple TV AirPlay", "Magnetic Sticky Wall", "Ergonomic Chairs"],
  rate: "₹800/hr"
}, {
  id: "mr-4",
  name: "Focus Room Quantum",
  floor: "2F",
  roomNumber: "2F-R01",
  capacity: 6,
  type: "Meeting Room",
  status: "Available",
  image: "assets/rooms/mr-04-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80",
  amenities: ["High-Def Webcam", "Noise Dampening", "Dual 27-inch Monitors", "Fast Mesh Wi-Fi 7"],
  rate: "₹500/hr"
}, {
  id: "mr-5",
  name: "Training Room",
  floor: "3F",
  roomNumber: "3F-R01",
  capacity: 4,
  type: "Training Room",
  status: "Available",
  image: "assets/rooms/mr-05-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
  amenities: ["Interactive Projector", "Flexible Modular Desks", "Wireless Presentation", "High-Speed Wi-Fi"],
  rate: "₹2,200/hr"
}, {
  id: "mr-7",
  name: "Synergy Lab",
  floor: "3F",
  roomNumber: "3F-R02",
  capacity: 8,
  type: "Meeting Room",
  status: "Available",
  image: "assets/rooms/mr-03-table.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  amenities: ["Interactive Smartboard", "Dual 4K Displays", "Fast Mesh Wi-Fi 7", "Video Conferencing Bar"],
  rate: "₹1,400/hr"
}, {
  id: "mr-6",
  name: "Creative Studio",
  floor: "4F",
  roomNumber: "4F-R01",
  capacity: 6,
  type: "Event Space",
  status: "Available",
  image: "assets/rooms/mr-06-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
  amenities: ["Podcast Audio Kit", "Softbox Lighting", "Modular Seating", "4K Video Cam"],
  rate: "₹1,200/hr"
}, {
  id: "mr-2",
  name: "Pitch Arena Nexus",
  floor: "6F",
  roomNumber: "6F-R01",
  capacity: 4,
  type: "Pitch Room",
  status: "Available",
  image: "assets/rooms/mr-02-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  amenities: ["Laser Projector & Stage", "Wireless Lapel Mics", "Livestream Console", "Acoustic Baffles"],
  rate: "₹3,000/hr"
}, {
  id: "mr-8",
  name: "Strategy Suite",
  floor: "6F",
  roomNumber: "6F-R02",
  capacity: 6,
  type: "Boardroom",
  status: "Available",
  image: "assets/rooms/mr-01-table.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
  amenities: ["4K Video Conferencing", "Smart Touchscreen", "Executive Seating", "Acoustic Walls"],
  rate: "₹1,800/hr"
}, {
  id: "mr-test-admin",
  name: "Innovation Amphitheater",
  floor: "7F",
  roomNumber: "7F-R01",
  capacity: 4,
  type: "Event Space",
  status: "Available",
  image: "assets/rooms/mr-amphitheater.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  amenities: ["Dolby Atmos Sound", "4K Projection Screen", "Wireless Podium", "Acoustic Wall Paneling", "Stage Lighting"],
  rate: "₹4,000/hr"
}, {
  id: "mr-9",
  name: "Sky Lounge Boardroom",
  floor: "7F",
  roomNumber: "7F-R02",
  capacity: 8,
  type: "Boardroom",
  status: "Available",
  image: "assets/rooms/mr-01-main.jpg",
  fallbackImage: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
  amenities: ["Panoramic Skyline View", "Cisco Webex Kit", "4K Dual Display", "Executive Leather", "Polycom Audio"],
  rate: "₹2,500/hr"
}];\n`;

code = code.substring(0, initialRoomsStart) + newInitialRoomsCode + code.substring(initialRoomsEnd);

// 2. Add selectedFloor state
const stateTarget = 'selectedType = _useState6[0],\n    setSelectedType = _useState6[1];';
if (!code.includes(stateTarget)) {
  console.error('Could not find stateTarget');
  process.exit(1);
}
const stateAddition = stateTarget + `\n  var _useStateFloor = useState("all"),\n    _useStateFloor2 = _slicedToArray(_useStateFloor, 2),\n    selectedFloor = _useStateFloor2[0],\n    setSelectedFloor = _useStateFloor2[1];`;
code = code.replace(stateTarget, stateAddition);

// 3. Update filteredRooms logic
const filteredRoomsTarget = `  var filteredRooms = useMemo(function () {
    return rooms.filter(function (room) {
      if (selectedType !== "All Rooms" && room.type !== selectedType) return false;
      if (room.capacity < selectedPeople) return false;
      if (selectedAmenities.length > 0) {
        var hasAll = selectedAmenities.every(function (a) {
          return room.amenities.includes(a);
        });
        if (!hasAll) return false;
      }
      if (searchQuery.trim()) {
        var q = searchQuery.toLowerCase();
        var matchName = room.name.toLowerCase().includes(q);
        var matchType = room.type.toLowerCase().includes(q);
        var matchAmenity = room.amenities.some(function (a) {
          return a.toLowerCase().includes(q);
        });
        if (!matchName && !matchType && !matchAmenity) return false;
      }
      return true;
    });
  }, [rooms, selectedType, selectedPeople, selectedAmenities, searchQuery]);`;

const newFilteredRoomsCode = `  var filteredRooms = useMemo(function () {
    return rooms.filter(function (room) {
      if (selectedFloor !== "all" && (room.floor || "1F") !== selectedFloor) return false;
      if (selectedType !== "All Rooms" && room.type !== selectedType) return false;
      if (selectedPeople && room.capacity < selectedPeople) return false;
      if (selectedAmenities.length > 0) {
        var hasAll = selectedAmenities.every(function (a) {
          return room.amenities.includes(a);
        });
        if (!hasAll) return false;
      }
      if (searchQuery.trim()) {
        var q = searchQuery.toLowerCase();
        var matchName = room.name.toLowerCase().includes(q);
        var matchType = room.type.toLowerCase().includes(q);
        var matchFloor = room.floor && room.floor.toLowerCase().includes(q);
        var matchRoomNum = room.roomNumber && room.roomNumber.toLowerCase().includes(q);
        var matchAmenity = room.amenities.some(function (a) {
          return a.toLowerCase().includes(q);
        });
        if (!matchName && !matchType && !matchFloor && !matchRoomNum && !matchAmenity) return false;
      }
      return true;
    });
  }, [rooms, selectedFloor, selectedType, selectedPeople, selectedAmenities, searchQuery]);`;

if (!code.includes(filteredRoomsTarget)) {
  console.error('Could not find filteredRoomsTarget');
  process.exit(1);
}
code = code.replace(filteredRoomsTarget, newFilteredRoomsCode);

// 4. Add Floor & People filter bar
const filterBarTarget = `/*#__PURE__*/React.createElement("div", {\n    className: "flex items-center justify-between pt-2"\n  }, /*#__PURE__*/React.createElement("div", {\n    className: "flex items-center gap-3"\n  }, /*#__PURE__*/React.createElement("h3", {\n    className: "text-xl font-black text-[#111827]"\n  }, "Available Rooms")`;

const floorAndPeopleBar = `/*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft flex items-center justify-between flex-wrap gap-3 my-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-[#111827] flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "🏢"), "Floor:"), ["all", "1F", "2F", "3F", "4F", "5F", "6F", "7F"].map(function (fl) {
    var isActive = selectedFloor === fl;
    return /*#__PURE__*/React.createElement("button", {
      key: fl,
      type: "button",
      onClick: function onClick() { setSelectedFloor(fl); },
      className: "px-3 py-1 rounded-xl text-xs font-bold transition-all " + (isActive ? "bg-[#4F3FE0] text-white shadow-xs" : "bg-[#F6F7FB] text-[#64748B] hover:bg-[#EDE9FE] hover:text-[#4338CA]")
    }, fl === "all" ? "All Floors" : fl);
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-[#111827] flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "👥"), "People:"), [0, 4, 6, 8].map(function (num) {
    var isActive = (num === 0 && (!selectedPeople || selectedPeople === 0)) || selectedPeople === num;
    return /*#__PURE__*/React.createElement("button", {
      key: num,
      type: "button",
      onClick: function onClick() { setSelectedPeople(num); },
      className: "px-3 py-1 rounded-xl text-xs font-bold transition-all " + (isActive ? "bg-[#4F3FE0] text-white shadow-xs" : "bg-[#F6F7FB] text-[#64748B] hover:bg-[#EDE9FE] hover:text-[#4338CA]")
    }, num === 0 ? "All" : num + "+");
  }))), ` + filterBarTarget;

if (!code.includes(filterBarTarget)) {
  console.error('Could not find filterBarTarget');
  process.exit(1);
}
code = code.replace(filterBarTarget, floorAndPeopleBar);

// 5. Update room card to include Floor badge and room number
const cardHeaderTarget = `/*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-[15px] text-[#111827] cursor-pointer hover:text-[#4F3FE0] transition-colors flex items-center justify-between",
      onClick: function onClick() {
        return openBookingDrawer(room);
      }
    }, /*#__PURE__*/React.createElement("span", null, room.name), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-semibold text-[#4F3FE0] bg-[#F4F2FF] px-2 py-0.5 rounded-full border border-[#E0D8FF]"
    }, "Quick Book \\u2197")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1.5 text-xs text-[#64748B] font-medium mt-1"`;

const newCardHeader = `/*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between gap-2 mb-1"
    }, /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-[15px] text-[#111827] cursor-pointer hover:text-[#4F3FE0] transition-colors leading-tight",
      onClick: function onClick() {
        return openBookingDrawer(room);
      }
    }, room.name), room.floor ? /*#__PURE__*/React.createElement("span", {
      className: "px-2 py-0.5 bg-[#EDE9FE] text-[#4338CA] text-[10px] font-extrabold rounded-md uppercase shrink-0"
    }, room.floor) : null), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-semibold text-[#64748B] mb-1"
    }, "Floor: ", /*#__PURE__*/React.createElement("strong", {
      className: "text-[#1E293B]"
    }, room.floor || "1F"), " · Room: ", /*#__PURE__*/React.createElement("strong", {
      className: "text-[#4F3FE0] font-mono"
    }, room.roomNumber || room.id)), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1.5 text-xs text-[#64748B] font-medium mt-1"`;

if (!code.includes(cardHeaderTarget)) {
  console.error('Could not find cardHeaderTarget');
  process.exit(1);
}
code = code.replace(cardHeaderTarget, newCardHeader);

// 6. Handle empty state (including 5F)
const gridTarget = `/*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
  }, filteredRooms.map(function (room) {`;

const newGridCode = `/*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
  }, filteredRooms.length === 0 ? (
    selectedFloor === "5F" ? /*#__PURE__*/React.createElement("div", {
      className: "bg-white border-2 border-dashed border-[#ECEEF4] rounded-2xl p-12 text-center my-6 flex flex-col items-center justify-center col-span-full shadow-soft"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-14 h-14 rounded-2xl bg-[#F6F7FB] flex items-center justify-center text-2xl mb-4 shadow-inner"
    }, "🏢"), /*#__PURE__*/React.createElement("h3", {
      className: "text-base font-bold text-[#111827] mb-1"
    }, "No meeting rooms on 5F"), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-[#64748B] max-w-sm mb-5 leading-relaxed"
    }, "This floor currently has no meeting rooms. Please select another floor to explore available spaces."), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: function onClick() { setSelectedFloor("all"); },
      className: "px-5 py-2.5 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
    }, "View All Floors")) : /*#__PURE__*/React.createElement("div", {
      className: "bg-white border border-[#ECEEF4] rounded-2xl p-10 text-center text-[#64748B] text-sm my-6 col-span-full"
    }, "No meeting rooms match your filter criteria. Try clearing some filters.")
  ) : filteredRooms.map(function (room) {`;

if (!code.includes(gridTarget)) {
  console.error('Could not find gridTarget');
  process.exit(1);
}
code = code.replace(gridTarget, newGridCode);

fs.writeFileSync(bundlePath, code, 'utf8');
console.log('✅ Successfully patched js/meeting-rooms-bundle.js');
