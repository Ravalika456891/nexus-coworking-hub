const fs = require('fs');

let html = fs.readFileSync('meeting-rooms.html', 'utf8');

console.log("Preparing replacement...");

const stateAnchor = '// Enhanced Custom Room Booking & Real-Time Availability Drawer State';
const stateEndAnchor = 'const DASHBOARD_ACTIVITIES = [';

const stateIndex = html.indexOf(stateAnchor);
const stateEndIndex = html.indexOf(stateEndAnchor);

if (stateIndex === -1 || stateEndIndex === -1) {
  console.error("State anchors not found!");
  process.exit(1);
}

const newStateSection = `// ── Live Meeting Room Booking Popup & Real-Time Availability States ──
      const [bookingModalRoom, setBookingModalRoom] = useState(null);
      const [bookingTitle, setBookingTitle] = useState("");
      const [bookingDate, setBookingDate] = useState("2026-10-31");
      const [bookingStartTime, setBookingStartTime] = useState("11:30 AM");
      const [bookingDuration, setBookingDuration] = useState(1.0);
      const [bookingAttendees, setBookingAttendees] = useState(4);
      const [bookingNotes, setBookingNotes] = useState("");
      const [bookingSyncGCal, setBookingSyncGCal] = useState(true);
      const [roomBackendBookings, setRoomBackendBookings] = useState([]);
      const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
      const [startupCreditsRemaining, setStartupCreditsRemaining] = useState(113);
      const [bookingSuccessData, setBookingSuccessData] = useState(null);

      const getTodayDateIso = () => "2026-10-31";
      const getTomorrowDateIso = () => "2026-11-01";

      const handleSetToday = () => {
        setBookingDate(getTodayDateIso());
        showToast("📅 Switched to Today's availability (31 Oct)");
      };

      const handleSetNextDay = () => {
        setBookingDate(getTomorrowDateIso());
        showToast("📅 Switched to Next Day's availability (01 Nov)");
      };

      const openBookingDrawer = (room) => {
        if (!room) return;
        setBookingModalRoom(room);
        setBookingTitle(\`Strategy Sync (\${room.name})\`);
        setBookingDate(getTodayDateIso());
        setBookingStartTime("11:30 AM");
        setBookingDuration(1.0);
        setBookingAttendees(Math.min(selectedPeople || 4, room.capacity));
        setBookingNotes("");
        setBookingSyncGCal(true);
        setBookingSuccessData(null);
      };

      const TIME_SLOTS_12H = [
        "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
        "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
        "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM"
      ];

      const timeStrToMinutes = (str) => {
        if (!str) return 0;
        const parts = str.trim().split(/\\s+/);
        const time = parts[0];
        const ampm = (parts[1] || "").toUpperCase();
        const [hStr, mStr] = time.split(":");
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10) || 0;
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        return h * 60 + m;
      };

      const minutesToTimeStr = (totalMins) => {
        let h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        const ampm = h >= 12 ? "PM" : "AM";
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        return \`\${String(h).padStart(2, "0")}:\${String(m).padStart(2, "0")} \${ampm}\`;
      };

      const getSlotState = (slotTime, room, date, startTime, duration) => {
        if (!room) return { status: "available", label: "Available" };
        const slotMins = timeStrToMinutes(slotTime);
        const selectedStartMins = timeStrToMinutes(startTime);
        const selectedEndMins = selectedStartMins + Math.round(duration * 60);

        const todayStr = getTodayDateIso();
        const isPastDate = date < todayStr;
        
        let isPastSlot = false;
        if (isPastDate) {
          isPastSlot = true;
        } else if (date === todayStr) {
          const nowHr = new Date().getHours();
          const nowMin = new Date().getMinutes();
          const currentClock = nowHr * 60 + nowMin;
          const threshold = (nowHr >= 8 && nowHr <= 20) ? currentClock : (11 * 60);
          if (slotMins < threshold) {
            isPastSlot = true;
          }
        }

        if (isPastSlot) {
          return { status: "past", label: "Past / Completed", isPast: true, disabled: true };
        }

        const allBookings = [
          ...upcomingBookings.filter(b => b.status !== "Cancelled" && (b.room === room.name || b.roomId === room.id)),
          ...roomBackendBookings.filter(b => b.status !== "Cancelled")
        ];

        for (const b of allBookings) {
          const matchDate = (b.date === date || (date === todayStr && b.date === "Today") || b.fullDate === date);
          if (!matchDate) continue;

          let bStart = 0;
          let bEnd = 0;
          if (b.time && b.time.includes("–")) {
            const [s, e] = b.time.split("–");
            bStart = timeStrToMinutes(s.trim());
            bEnd = timeStrToMinutes(e.trim());
          } else if (b.startTime && b.endTime) {
            bStart = timeStrToMinutes(b.startTime);
            bEnd = timeStrToMinutes(b.endTime);
          } else {
            bStart = timeStrToMinutes(b.time);
            bEnd = bStart + 60;
          }

          if (slotMins >= bStart && slotMins < bEnd) {
            return { status: "booked", label: "Booked", isBooked: true, disabled: true };
          }
        }

        if (slotMins >= selectedStartMins && slotMins < selectedEndMins) {
          return { status: "selected", label: "Selected", isSelected: true, disabled: false };
        }

        const reqEndMins = slotMins + Math.round(duration * 60);
        if (reqEndMins > 1200) {
          return { status: "unavailable", label: "Exceeds Hours", isConflict: true, disabled: true };
        }

        for (const b of allBookings) {
          const matchDate = (b.date === date || (date === todayStr && b.date === "Today") || b.fullDate === date);
          if (!matchDate) continue;

          let bStart = 0;
          let bEnd = 0;
          if (b.time && b.time.includes("–")) {
            const [s, e] = b.time.split("–");
            bStart = timeStrToMinutes(s.trim());
            bEnd = timeStrToMinutes(e.trim());
          } else if (b.startTime && b.endTime) {
            bStart = timeStrToMinutes(b.startTime);
            bEnd = timeStrToMinutes(b.endTime);
          } else {
            bStart = timeStrToMinutes(b.time);
            bEnd = bStart + 60;
          }

          if (Math.max(slotMins, bStart) < Math.min(reqEndMins, bEnd)) {
            return { status: "unavailable", label: "Overlap Conflict", isConflict: true, disabled: true };
          }
        }

        return { status: "available", label: "Available", isAvailable: true, disabled: false };
      };

      const getGCalUrl = (booking) => {
        const dStr = (booking.fullDate || booking.date || "2026-10-31").replace(/-/g, "").replace("Today", "20261031");
        const startMin = timeStrToMinutes(booking.startTime);
        const endMin = timeStrToMinutes(booking.endTime);
        const startH = String(Math.floor(startMin / 60)).padStart(2, "0");
        const startM = String(startMin % 60).padStart(2, "0");
        const endH = String(Math.floor(endMin / 60)).padStart(2, "0");
        const endM = String(endMin % 60).padStart(2, "0");
        const startIso = \`\${dStr}T\${startH}\${startM}00\`;
        const endIso = \`\${dStr}T\${endH}\${endM}00\`;
        const text = encodeURIComponent(\`\${booking.title} • \${booking.room}\`);
        const details = encodeURIComponent(
          \`NEXUS HUB Reservation: \${booking.room}\\nDuration: \${booking.duration}\\nAttendees: \${booking.attendees} people\\nLocation: Ground Floor East Wing, NEXUS HUB Innovation Campus\`
        );
        const loc = encodeURIComponent(\`\${booking.room}, NEXUS HUB Innovation Campus\`);
        return \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${text}&dates=\${startIso}/\${endIso}&details=\${details}&location=\${loc}\`;
      };

      const downloadIcsFile = (booking) => {
        const dStr = (booking.fullDate || booking.date || "2026-10-31").replace(/-/g, "").replace("Today", "20261031");
        const startMin = timeStrToMinutes(booking.startTime);
        const endMin = timeStrToMinutes(booking.endTime);
        const startH = String(Math.floor(startMin / 60)).padStart(2, "0");
        const startM = String(startMin % 60).padStart(2, "0");
        const endH = String(Math.floor(endMin / 60)).padStart(2, "0");
        const endM = String(endMin % 60).padStart(2, "0");

        const ics = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//NEXUS HUB//Booking//EN",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "BEGIN:VEVENT",
          \`UID:\${booking.resId || Date.now()}@nexushub.co\`,
          \`DTSTAMP:\${dStr}T000000Z\`,
          \`DTSTART:\${dStr}T\${startH}\${startM}00\`,
          \`DTEND:\${dStr}T\${endH}\${endM}00\`,
          \`SUMMARY:\${booking.title} - \${booking.room}\`,
          \`DESCRIPTION:NEXUS HUB Reservation for \${booking.attendees} attendees\`,
          \`LOCATION:\${booking.room}, NEXUS HUB\`,
          "STATUS:CONFIRMED",
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\\r\\n");

        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = \`nexus-\${(booking.resId || "bkg").toLowerCase()}.ics\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      const handleConfirmBookingModal = (e) => {
        if (e) e.preventDefault();
        if (!bookingModalRoom) return;

        const slotState = getSlotState(bookingStartTime, bookingModalRoom, bookingDate, bookingStartTime, bookingDuration);
        if (slotState.disabled && !slotState.isSelected) {
          showToast(\`⚠️ Conflict: Selected start time is \${slotState.label}. Please pick an available slot.\`);
          return;
        }

        const startMin = timeStrToMinutes(bookingStartTime);
        const endMin = startMin + Math.round(bookingDuration * 60);
        const endTimeStr = minutesToTimeStr(endMin);
        const formattedRange = \`\${bookingStartTime} – \${endTimeStr}\`;
        const resId = \`RES-2026-\${Math.floor(1000 + Math.random() * 9000)}\`;
        const title = bookingTitle.trim() || \`Strategy Sync (\${bookingModalRoom.name})\`;
        const hourlyRate = parseInt((bookingModalRoom.rate || "").replace(/[^0-9]/g, ""), 10) || 2000;
        const totalCost = Math.round(hourlyRate * bookingDuration);

        setStartupCreditsRemaining(prev => Math.max(0, prev - bookingDuration));

        const newBooking = {
          id: \`bkg-\${Date.now()}\`,
          resId: resId,
          date: bookingDate === "2026-10-31" ? "Today" : bookingDate,
          fullDate: bookingDate,
          time: formattedRange,
          startTime: bookingStartTime,
          endTime: endTimeStr,
          duration: \`\${bookingDuration} hrs\`,
          title: title,
          room: bookingModalRoom.name,
          roomId: bookingModalRoom.id,
          roomImage: bookingModalRoom.image || "assets/rooms/mr-01-main.jpg",
          attendees: bookingAttendees,
          credits: bookingDuration,
          cost: totalCost,
          notes: bookingNotes,
          status: "Confirmed",
          statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
          barColor: "bg-emerald-500",
          createdAt: new Date().toISOString()
        };

        setUpcomingBookings(prev => [newBooking, ...prev]);

        if (bookingDate === "2026-10-31" || bookingDate === "Today") {
          setTodaysSchedule(prev => [
            ...prev,
            {
              time: formattedRange,
              title: title,
              room: bookingModalRoom.name,
              attendees: bookingAttendees,
              dotColor: "bg-emerald-500",
              tintColor: "border-l-4 border-l-emerald-500"
            }
          ]);
        }

        setBookingSuccessData(newBooking);
        showToast(\`🎉 Room booked! \${bookingModalRoom.name} confirmed (#\${resId})\`);

        try {
          fetch('/api/meeting-rooms/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: bookingModalRoom.id || "MR-01",
              startupId: "STP-XYZ",
              startupName: "XYZ Technologies",
              title: title,
              date: bookingDate,
              startTime: bookingStartTime,
              endTime: endTimeStr,
              attendees: bookingAttendees,
              cost: totalCost
            })
          }).catch(err => console.log('Backend sync offline:', err));
        } catch (e) {}
      };

      useEffect(() => {
        if (!bookingModalRoom || !bookingDate) return;
        setIsLoadingAvailability(true);
        fetch(\`/api/meeting-rooms/availability?date=\${bookingDate}\`)
          .then(res => res.json())
          .then(data => {
            if (data && data.ok && data.rooms) {
              const r = data.rooms.find(x => x.id === bookingModalRoom.id || x.name === bookingModalRoom.name);
              if (r && r.bookings) {
                setRoomBackendBookings(r.bookings);
              } else {
                setRoomBackendBookings([]);
              }
            }
          })
          .catch(e => console.log("Availability offline fallback:", e))
          .finally(() => setIsLoadingAvailability(false));
      }, [bookingModalRoom, bookingDate]);

      `;

html = html.substring(0, stateIndex) + newStateSection + html.substring(stateEndIndex);
console.log("State section updated successfully.");

const modalAnchor = '{/* =========================================================================\n              CUSTOM ROOM DETAILS & REAL-TIME AVAILABILITY SLIDE-OUT DRAWER';
const modalEndAnchor = '{/* ── Cancellation Confirmation Modal ── */}';

const mStart = html.indexOf(modalAnchor);
const mEnd = html.indexOf(modalEndAnchor);

if (mStart === -1 || mEnd === -1) {
  console.error("Modal anchors not found!");
  process.exit(1);
}

const newModalMarkup = `{/* =========================================================================
              ENHANCED MEETING ROOM BOOKING POPUP & REAL-TIME AVAILABILITY
              ========================================================================= */}
          {bookingModalRoom && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-[#ECEEF4] max-h-[92vh] overflow-y-auto relative animate-scaleUp">
                
                {/* 1. HEADER */}
                <div className="flex items-center justify-between pb-4 border-b border-[#ECEEF4]">
                  <div className="flex items-center gap-3">
                    <img
                      src={bookingModalRoom.image || "assets/rooms/mr-01-main.jpg"}
                      alt={bookingModalRoom.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#ECEEF4] shadow-xs flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-[#111827]">{bookingModalRoom.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4F3FE0] text-white uppercase tracking-wider">
                          {bookingModalRoom.type}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A90A2] mt-0.5">
                        Instant confirmation • Deducts 1 hour credit
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingModalRoom(null);
                      setBookingSuccessData(null);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                    title="Close"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. MAIN POPUP CONTENT / SUCCESS VIEW */}
                {bookingSuccessData ? (
                  <div className="py-6 text-center space-y-4 animate-scaleUp">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto text-2xl font-bold shadow-sm">
                      ✓
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Reservation Confirmed
                      </span>
                      <h3 className="text-xl font-black text-[#111827] mt-2">{bookingSuccessData.title}</h3>
                      <p className="text-xs text-[#8A90A2]">
                        Booking Reference: <strong className="font-mono text-[#111827]">#{bookingSuccessData.resId}</strong>
                      </p>
                    </div>

                    <div className="bg-[#F8FAFC] border border-[#ECEEF4] rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                      <div className="flex justify-between">
                        <span className="text-[#8A90A2]">Facility:</span>
                        <strong className="text-[#111827]">{bookingSuccessData.room}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A90A2]">Date &amp; Time:</span>
                        <strong className="text-[#111827]">{bookingSuccessData.date} • {bookingSuccessData.time}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A90A2]">Duration &amp; Attendees:</span>
                        <strong className="text-[#111827]">{bookingSuccessData.duration} • {bookingSuccessData.attendees} people</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A90A2]">Credit Deducted:</span>
                        <span className="text-emerald-600 font-bold">-{bookingSuccessData.credits} cr (Covered by Incubation Plan)</span>
                      </div>
                    </div>

                    {/* Google Calendar 1-Click Sync */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-left max-w-md mx-auto space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📅</span>
                        <strong className="text-xs font-black text-[#111827]">Sync with Your Calendar</strong>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Export this reservation directly to Google Calendar or download an .ICS invite for Outlook / Apple Calendar.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={getGCalUrl(bookingSuccessData)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-white hover:bg-blue-50 text-[#2B71FF] border border-blue-300 font-bold py-2 px-3 rounded-xl text-xs text-center shadow-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <span>Google Calendar (1-Click)</span>
                          <Icon name="externalLink" className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadIcsFile(bookingSuccessData)}
                          className="bg-white hover:bg-gray-50 text-[#374151] border border-gray-300 font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition-all"
                          title="Download iCal (.ics) file"
                        >
                          📥 .ICS
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setBookingModalRoom(null);
                          setBookingSuccessData(null);
                          navigateTo("My Bookings");
                        }}
                        className="px-5 py-2.5 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        View in My Bookings &rarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingModalRoom(null);
                          setBookingSuccessData(null);
                        }}
                        className="px-5 py-2.5 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmBookingModal} className="mt-4 space-y-4">
                    {/* FIELD 1: MEETING TITLE */}
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-1">
                        Meeting Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingTitle}
                        onChange={(e) => setBookingTitle(e.target.value)}
                        placeholder="e.g. Q4 Executive Pitch Session"
                        className="w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#4F3FE0] focus:bg-white transition-all"
                      />
                    </div>

                    {/* FIELD 2: DATE PICKER WITH TODAY & NEXT DAY QUICK ACTIONS */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                          <Icon name="calendar" className="w-3.5 h-3.5 text-[#4F3FE0]" />
                          <span>Reservation Date</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSetToday}
                            className={\`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all \${
                              bookingDate === getTodayDateIso()
                                ? "bg-[#4F3FE0] text-white border-[#4F3FE0] shadow-xs"
                                : "bg-[#F8FAFC] border-[#ECEEF4] text-[#374151] hover:bg-white hover:border-[#4F3FE0]/40"
                            }\`}
                          >
                            ⚡ Today
                          </button>
                          <button
                            type="button"
                            onClick={handleSetNextDay}
                            className={\`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all \${
                              bookingDate === getTomorrowDateIso()
                                ? "bg-[#4F3FE0] text-white border-[#4F3FE0] shadow-xs"
                                : "bg-[#F8FAFC] border-[#ECEEF4] text-[#374151] hover:bg-white hover:border-[#4F3FE0]/40"
                            }\`}
                          >
                            ⚡ Next Day
                          </button>
                        </div>
                      </div>

                      {/* Calendar Native Picker */}
                      <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2">
                        <Icon name="calendar" className="w-4 h-4 text-[#8A90A2]" />
                        <input
                          type="date"
                          min="2026-10-31"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-[#111827] outline-none cursor-pointer flex-1"
                        />
                        <span className="text-[11px] text-[#8A90A2] font-medium">
                          {bookingDate === getTodayDateIso() ? "(Today)" : bookingDate === getTomorrowDateIso() ? "(Tomorrow)" : ""}
                        </span>
                      </div>
                    </div>

                    {/* FIELD 3: TIME PICKER (12-HOUR FORMAT WITH AM/PM) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#374151] mb-1 flex items-center gap-1.5">
                          <Icon name="clock" className="w-3.5 h-3.5 text-[#4F3FE0]" />
                          <span>Start Time (12-Hour AM/PM)</span>
                        </label>
                        <select
                          value={bookingStartTime}
                          onChange={(e) => setBookingStartTime(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#4F3FE0] cursor-pointer"
                        >
                          {TIME_SLOTS_12H.map(slot => {
                            const slotInfo = getSlotState(slot, bookingModalRoom, bookingDate, bookingStartTime, bookingDuration);
                            return (
                              <option
                                key={slot}
                                value={slot}
                                disabled={slotInfo.disabled && slotInfo.status !== 'selected'}
                              >
                                {slot} {slotInfo.status === 'past' ? '(Past)' : slotInfo.status === 'booked' ? '(Booked)' : slotInfo.status === 'unavailable' ? '(Overlap)' : '(Available)'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#374151] mb-1 flex items-center gap-1.5">
                          <Icon name="clock" className="w-3.5 h-3.5 text-[#4F3FE0]" />
                          <span>Duration &amp; End Time</span>
                        </label>
                        <select
                          value={bookingDuration}
                          onChange={(e) => setBookingDuration(parseFloat(e.target.value))}
                          className="w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#4F3FE0] cursor-pointer"
                        >
                          {[0.5, 1.0, 1.5, 2.0, 3.0, 4.0].map(dur => {
                            const sMin = timeStrToMinutes(bookingStartTime);
                            const eMin = sMin + Math.round(dur * 60);
                            const endStr = minutesToTimeStr(eMin);
                            return (
                              <option key={dur} value={dur}>
                                {dur === 0.5 ? "30 mins" : \`\${dur} hrs\`} (Ends at \${endStr})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* FIELD 4: VISIBLE TIME SLOT BAR / AVAILABILITY SECTION */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                            Time Slot Bar &amp; Live Availability
                          </label>
                          <p className="text-[11px] text-[#8A90A2]">
                            {isLoadingAvailability ? "Updating live availability..." : "Click any green slot to select your start time"}
                          </p>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-2 text-[10.5px] font-semibold text-[#64748B] flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#4F3FE0]" /> Selected
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Booked
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Past
                          </span>
                        </div>
                      </div>

                      {/* 12-Hour AM/PM Slots Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 border border-[#ECEEF4] rounded-2xl bg-[#FAFAFC]">
                        {TIME_SLOTS_12H.map(slot => {
                          const slotState = getSlotState(slot, bookingModalRoom, bookingDate, bookingStartTime, bookingDuration);
                          
                          if (slotState.status === "past") {
                            return (
                              <div
                                key={slot}
                                className="p-2 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 text-center cursor-not-allowed select-none opacity-50"
                                title="This time slot has already passed for today"
                              >
                                <div className="text-[11.5px] font-bold line-through">{slot}</div>
                                <div className="text-[9.5px] text-gray-500 font-semibold mt-0.5">⏳ Past</div>
                              </div>
                            );
                          }

                          if (slotState.status === "booked") {
                            return (
                              <div
                                key={slot}
                                className="p-2 rounded-xl border border-gray-200 bg-gray-100/90 text-gray-400 text-center cursor-not-allowed select-none opacity-60"
                                title="Slot already reserved by another founder"
                              >
                                <div className="text-[11.5px] font-bold line-through">{slot}</div>
                                <div className="text-[9.5px] text-gray-500 font-semibold mt-0.5">🔒 Booked</div>
                              </div>
                            );
                          }

                          if (slotState.status === "unavailable") {
                            return (
                              <div
                                key={slot}
                                className="p-2 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-700 text-center cursor-not-allowed select-none"
                                title="Overlap conflict: Duration would overlap a reserved slot"
                              >
                                <div className="text-[11.5px] font-bold">{slot}</div>
                                <div className="text-[9.5px] font-semibold text-amber-600 mt-0.5">Overlap</div>
                              </div>
                            );
                          }

                          if (slotState.status === "selected") {
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setBookingStartTime(slot)}
                                className="p-2 rounded-xl border border-[#4F3FE0] bg-[#4F3FE0] text-white text-center shadow-sm ring-2 ring-[#4F3FE0]/25 transition-all"
                              >
                                <div className="text-[11.5px] font-bold">{slot}</div>
                                <div className="text-[9.5px] font-bold text-purple-100 mt-0.5">★ Selected</div>
                              </button>
                            );
                          }

                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingStartTime(slot)}
                              className="p-2 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-400 text-emerald-950 text-center transition-all hover:shadow-xs active:scale-95"
                            >
                              <div className="text-[11.5px] font-bold">{slot}</div>
                              <div className="text-[9.5px] font-bold text-emerald-600 mt-0.5">✓ Available</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* FIELD 5: ATTENDEES COUNT */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                          <Icon name="users" className="w-3.5 h-3.5 text-[#4F3FE0]" />
                          <span>Attendees Count</span>
                        </label>
                        <span className="text-[11px] text-[#8A90A2]">
                          Room Max: {bookingModalRoom.capacity} seats
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setBookingAttendees(prev => Math.max(1, prev - 1))}
                          className="w-9 h-9 rounded-xl border border-[#ECEEF4] bg-[#F8FAFC] hover:bg-white text-lg font-bold flex items-center justify-center text-[#111827]"
                        >
                          -
                        </button>
                        <div className="flex-1 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl py-2 text-center text-xs font-black text-[#111827]">
                          {bookingAttendees} attendees
                        </div>
                        <button
                          type="button"
                          onClick={() => setBookingAttendees(prev => Math.min(bookingModalRoom.capacity, prev + 1))}
                          className="w-9 h-9 rounded-xl border border-[#ECEEF4] bg-[#F8FAFC] hover:bg-white text-lg font-bold flex items-center justify-center text-[#111827]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 3. DYNAMIC SUMMARY BOX */}
                    {(() => {
                      const hourlyRate = parseInt((bookingModalRoom.rate || "").replace(/[^0-9]/g, ""), 10) || 2000;
                      const sMin = timeStrToMinutes(bookingStartTime);
                      const eMin = sMin + Math.round(bookingDuration * 60);
                      const endStr = minutesToTimeStr(eMin);
                      const currentSelectedState = getSlotState(bookingStartTime, bookingModalRoom, bookingDate, bookingStartTime, bookingDuration);

                      return (
                        <div className="bg-[#F8F9FD] border border-[#E3DEFF] rounded-2xl p-4 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#8A90A2]">Room Rate:</span>
                            <span className="font-bold text-[#111827]">{bookingModalRoom.rate} (Covered by Credits)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8A90A2]">Date &amp; Time:</span>
                            <span className="font-bold text-[#4F3FE0]">
                              {bookingDate} • {bookingStartTime} – {endStr} ({bookingDuration} hrs)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8A90A2]">Attendees:</span>
                            <span className="font-bold text-[#111827]">
                              {bookingAttendees} people (Capacity: {bookingModalRoom.capacity})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#8A90A2]">Credits Used:</span>
                            <span className="text-emerald-600 font-bold">
                              -{bookingDuration} cr ({startupCreditsRemaining - bookingDuration} cr remaining in quota)
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-[#E3DEFF]">
                            <span className="font-bold text-[#111827]">Final Charge:</span>
                            <span className="text-emerald-600 font-black text-sm">₹0.00 (100% Covered)</span>
                          </div>

                          {currentSelectedState.disabled && !currentSelectedState.isSelected && (
                            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-1.5 mt-2">
                              <span>⚠️</span>
                              <span>Selected time slot is {currentSelectedState.label}. Please pick an available green slot.</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Google Calendar Sync Option */}
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-blue-900 font-semibold">
                        <span>📅</span>
                        <span>Auto-generate Google Calendar invite</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bookingSyncGCal}
                          onChange={(e) => setBookingSyncGCal(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F3FE0]"></div>
                      </label>
                    </div>

                    {/* 4. FOOTER BUTTONS */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECEEF4]">
                      <button
                        type="button"
                        onClick={() => setBookingModalRoom(null)}
                        className="px-4 py-2.5 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-2"
                      >
                        <span>⚡ Confirm Reservation</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          `;

html = html.substring(0, mStart) + newModalMarkup + html.substring(mEnd);
console.log("Modal markup updated successfully.");

fs.writeFileSync('meeting-rooms.html', html, 'utf8');
console.log("meeting-rooms.html written successfully.");

