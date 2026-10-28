// Module: Meeting Room Scheduling, Capacity Management, My Booked Rooms & Credit Tracking

const MeetingRoomsModule = {
  selectedDate: new Date().toISOString().split('T')[0],
  activeTab: 'scheduler', // 'scheduler' | 'myBookings' | 'allBookings'
  activeStartupFilter: null, // null = defaults to active startup
  myBookingsFilterDate: 'all', // 'all' | 'selected'
  myBookingsViewMode: 'table', // 'table' | 'cards'
  myBookingsSearch: '',
  myBookingsStatusFilter: 'all', // 'all' | 'today' | 'upcoming' | 'completed'
  myBookingsRoomFilter: 'all', // 'all' | roomId
  selectedSlotsByRoom: {}, // { [roomId]: ['09:00', '10:00'] }
  filterCapacity: 'all', // 'all' | '4' | '8' | '16'
  filterAmenity: 'all',  // 'all' | 'projector' | 'video' | 'audio'
  filterSession: 'all',  // 'all' | 'morning' | 'afternoon'
  waitlist: [],

  setFilterCapacity(cap) {
    this.filterCapacity = cap;
    this.render();
  },

  setFilterAmenity(amenity) {
    this.filterAmenity = amenity;
    this.render();
  },

  setFilterSession(session) {
    this.filterSession = session;
    this.render();
  },

  resetFilters() {
    this.filterCapacity = 'all';
    this.filterAmenity = 'all';
    this.filterSession = 'all';
    this.render();
  },

  getFilteredRooms(rooms) {
    return (rooms || []).filter(room => {
      if (this.filterCapacity !== 'all') {
        const minCap = parseInt(this.filterCapacity, 10);
        if (room.capacity < minCap) return false;
      }
      if (this.filterAmenity !== 'all') {
        const str = (room.amenities || []).join(' ').toLowerCase();
        if (this.filterAmenity === 'projector' && !str.includes('projector') && !str.includes('display') && !str.includes('screen')) return false;
        if (this.filterAmenity === 'video' && !str.includes('video') && !str.includes('cisco') && !str.includes('webex') && !str.includes('camera')) return false;
        if (this.filterAmenity === 'audio' && !str.includes('audio') && !str.includes('mic') && !str.includes('polycom') && !str.includes('speaker')) return false;
      }
      return true;
    });
  },

  getMyStartupId() {
    if (this.activeStartupFilter) return this.activeStartupFilter;
    if (window.store) {
      if (window.store.activeFounderId) return window.store.activeFounderId;
      if (window.store.state && window.store.state.activeStartupId) return window.store.state.activeStartupId;
    }
    return 'STP-XYZ';
  },

  getMyStartup() {
    const id = this.getMyStartupId();
    if (window.store && window.store.getStartupById) {
      const s = window.store.getStartupById(id);
      if (s) return s;
    }
    const all = (window.store && window.store.getStartups) ? window.store.getStartups() : [];
    const found = all.find(x => x.id === id);
    return found || { id: 'STP-XYZ', name: 'XYZ Technologies', logoEmoji: '🚀', includedMeetingHours: 12, usedMeetingHours: 4 };
  },

  setStartupFilter(id) {
    this.activeStartupFilter = id;
    this.render();
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  setMyBookingsFilter(filter) {
    this.myBookingsFilterDate = filter;
    this.render();
  },

  getAllBookings() {
    const rooms = (window.store && window.store.getMeetingRooms) ? window.store.getMeetingRooms() : [];
    const list = [];
    rooms.forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.status !== 'Cancelled') {
          list.push({ ...b, roomId: r.id, roomName: r.name, roomIcon: r.icon, hourlyRate: r.hourlyRate, capacity: r.capacity });
        }
      });
    });
    return list;
  },

  getMyBookings() {
    const myStartup = this.getMyStartup();
    const all = this.getAllBookings();
    return all.filter(b => b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
  },

  initAutoRefresh() {
    if (this._autoRefreshInit) return;
    this._autoRefreshInit = true;

    // Auto re-fetch every 30 seconds
    setInterval(() => {
      this.refetchAvailability(false);
    }, 30000);

    // Auto re-fetch when window gains focus
    window.addEventListener('focus', () => {
      this.refetchAvailability(false);
    });
  },

  async refetchAvailability(showToast = false) {
    if (!window.store || !window.store.fetchMeetingRoomsAvailability) return;
    try {
      await window.store.fetchMeetingRoomsAvailability(this.selectedDate);
      this.render();
      if (showToast && typeof App !== 'undefined' && App.showToast) {
        App.showToast('Meeting room availability updated.', 'info');
      }
    } catch (e) {
      // offline fallback
    }
  },

  render() {
    this.initAutoRefresh();
    const container = document.getElementById('view-meetingRooms');
    if (!container) return;

    const rooms = window.store.getMeetingRooms();
    const startups = window.store.getStartups();
    const myStartup = this.getMyStartup();
    const allBookings = this.getAllBookings();
    const myBookings = this.getMyBookings();
    const myBookingsToday = myBookings.filter(b => b.date === this.selectedDate);

    const morningSlots = ['08:00', '09:00', '10:00'];
    const afternoonSlots = ['15:00', '16:00', '17:00', '18:00'];
    const timeSlots = [...morningSlots, ...afternoonSlots];

    // Slot statistics for selected date
    let totalSlotsCount = rooms.length * timeSlots.length;
    let mySlotsCount = 0;
    let otherSlotsCount = 0;

    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const liveTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const isPastDate = (this.selectedDate < todayStr);
    const isToday = (this.selectedDate === todayStr);

    let activeSlotsCount = 0;

    rooms.forEach(r => {
      const bList = (r.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled');
      timeSlots.forEach(slot => {
        const curHour = parseInt(slot.split(':')[0], 10);
        const endHour = curHour + 1;
        const endSlotStr = `${endHour < 10 ? '0' : ''}${endHour}:00`;
        const isSlotPassed = isPastDate || (isToday && endSlotStr <= liveTimeStr);

        const booked = bList.find(b => {
          const bHour = parseInt(b.startTime.split(':')[0], 10);
          const eHour = parseInt(b.endTime.split(':')[0], 10);
          return curHour >= bHour && curHour < eHour;
        });
        if (booked) {
          if (booked.startupId === myStartup.id || (booked.startupName && booked.startupName.toLowerCase() === myStartup.name.toLowerCase())) {
            mySlotsCount++;
          } else {
            otherSlotsCount++;
          }
        } else if (!isSlotPassed) {
          activeSlotsCount++;
        }
      });
    });

    const availableSlotsCount = isPastDate ? 0 : activeSlotsCount;
    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));

    container.innerHTML = `
      <!-- Top Header & Controls -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>📅</span> Meeting Rooms & Conference Scheduler
            </h2>
            <span class="badge" style="background: rgba(37, 99, 235, 0.12); color: #2563eb; font-weight: 700; font-size: 11.5px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(37, 99, 235, 0.25);">
              🏢 ${myStartup.name} Perspective
            </span>
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <!-- Perspective Selector for Testing / Multi-Startup view -->
          <select class="form-control" style="width: auto; padding: 7px 12px; font-size: 12px; font-weight: 600; border-radius: 8px;" onchange="MeetingRoomsModule.setStartupFilter(this.value)" title="Switch active startup perspective">
            ${startups.map(s => `
              <option value="${s.id}" ${s.id === myStartup.id ? 'selected' : ''}>
                👤 ${s.name} (${s.id})
              </option>
            `).join('')}
          </select>

          <button class="btn btn-outline" onclick="MeetingRoomsModule.openCalendarModal()" style="font-size: 12.5px; font-weight: 700; padding: 7px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;" title="Open Master Month Calendar">
            <span>🗓️</span> <span>Month Calendar</span>
          </button>

          <input type="date" class="form-control" style="width: auto; padding: 7px 14px; font-size: 13px; font-weight: 600; border-radius: 8px;" value="${this.selectedDate}" onchange="MeetingRoomsModule.setDate(this.value)">
          
          <button class="btn btn-primary" onclick="MeetingRoomsModule.openBookModal()" style="border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
            <span>+</span> Reserve Room
          </button>
        </div>
      </div>

      <!-- Segmented Sub-Tab Switcher -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 6px; background: var(--bg-surface-elevated); padding: 5px; border-radius: 999px; border: 1.5px solid var(--border-subtle); box-shadow: 0 2px 8px rgba(0,0,0,0.03); flex-wrap: wrap;">
          <button class="btn btn-sm ${this.activeTab === 'scheduler' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.switchTab('scheduler')" style="border-radius: 999px; font-weight: 700; padding: 6px 18px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 7px;">
            <span>🏢</span> All Rooms & Timings
          </button>
          <button class="btn btn-sm ${this.activeTab === 'myBookings' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.switchTab('myBookings')" style="border-radius: 999px; font-weight: 700; padding: 6px 18px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 7px;">
            <span>🎟️</span> My Bookings &amp; Feed Report
            <span class="badge ${this.activeTab === 'myBookings' ? 'badge-light' : 'badge-primary'}" style="font-size: 10.5px; border-radius: 999px; padding: 2px 7px;">
              ${myBookings.length}
            </span>
          </button>
          <button class="btn btn-sm ${this.activeTab === 'allBookings' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.switchTab('allBookings')" style="border-radius: 999px; font-weight: 700; padding: 6px 18px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 7px;">
            <span>📋</span> All Confirmed Reservations
            <span class="badge ${this.activeTab === 'allBookings' ? 'badge-light' : 'badge-subtle'}" style="font-size: 10.5px; border-radius: 999px; padding: 2px 7px;">
              ${allBookings.length}
            </span>
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); background: var(--bg-surface-elevated); padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border-subtle);">
          <span>💳 Monthly Credit Allowance:</span>
          <strong style="color: #16a34a; font-family: var(--font-mono);">${remainingCredits} hrs free remaining</strong>
          <span>(of ${myStartup.includedMeetingHours || 12} hrs)</span>
        </div>
      </div>

      <!-- Main Tab Content Body -->
      ${this.renderActiveContent({ rooms, startups, myStartup, allBookings, myBookings, myBookingsToday, timeSlots, availableSlotsCount, mySlotsCount, otherSlotsCount })}
    `;
  },

  renderActiveContent(data) {
    if (this.activeTab === 'myBookings') {
      return this.renderMyBookingsView(data);
    } else if (this.activeTab === 'allBookings') {
      return this.renderAllBookingsView(data);
    } else {
      return this.renderSchedulerView(data);
    }
  },

  renderSchedulerView({ rooms, myStartup, myBookingsToday, availableSlotsCount, mySlotsCount, otherSlotsCount }) {
    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const isToday = (this.selectedDate === todayStr);
    const tomorrowObj = new Date(now);
    tomorrowObj.setDate(now.getDate() + 1);
    const tomorrowStr = `${tomorrowObj.getFullYear()}-${pad(tomorrowObj.getMonth() + 1)}-${pad(tomorrowObj.getDate())}`;
    const isTomorrow = (this.selectedDate === tomorrowStr);

    const dParts = this.selectedDate.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const formattedDateLabel = `${dayName}, ${dayNum} ${monthName}`;

    const filteredRooms = this.getFilteredRooms(rooms);

    return `
      <!-- If My Startup has bookings today, show prominent Quick Shelf -->
      ${myBookingsToday.length > 0 ? `
        <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(56, 189, 248, 0.06) 100%); border: 1.5px solid rgba(37, 99, 235, 0.35); border-radius: 14px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
              🎟️
            </div>
            <div>
              <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">
                You have ${myBookingsToday.length} room reservation(s) today for ${myStartup.name}:
              </div>
              <div style="display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                ${myBookingsToday.map(b => `
                  <span class="badge" style="background: rgba(37, 99, 235, 0.15); color: #1d4ed8; border: 1px solid rgba(37, 99, 235, 0.4); font-size: 11.5px; padding: 3px 9px; font-weight: 700; cursor: pointer;" onclick="MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')" title="Click to view reservation details">
                    🏢 ${b.roomName}: ⏰ ${b.startTime} - ${b.endTime} (${b.title}) ➔ Details
                  </span>
                `).join('')}
              </div>
            </div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="MeetingRoomsModule.switchTab('myBookings')" style="font-weight: 700; padding: 6px 16px; border-radius: 8px;">
            Manage My Booked Rooms
          </button>
        </div>
      ` : ''}

      <!-- Top Master Date Navigation Bar & Calendar Picker -->
      <div class="clear-date-bar" style="margin-bottom: 14px;">
        <div class="clear-date-nav">
          <button type="button" class="clear-date-btn" onclick="MeetingRoomsModule.cycleDate(-1)" title="Previous day (‹)">‹ Prev Day</button>

          <!-- Interactive Calendar Date Picker Button -->
          <label class="clear-date-picker-wrap" title="Click to choose a date from calendar">
            <span style="font-size: 13.5px;">📅</span>
            <span style="font-size: 12.5px; font-weight: 800; color: var(--text-primary, #0f172a); white-space: nowrap;">${formattedDateLabel}</span>
            ${isToday ? `<span class="badge badge-success" style="font-size: 10px; padding: 1px 6px;">Today</span>` : isTomorrow ? `<span class="badge badge-info" style="font-size: 10px; padding: 1px 6px;">Tomorrow</span>` : ''}
            <span style="font-size: 10px; color: var(--text-muted); margin-left: 2px;">▾</span>
            <input type="date" value="${this.selectedDate}" onchange="MeetingRoomsModule.setDate(this.value)" onclick="try{this.showPicker?.()}catch(e){}" style="position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer;" title="Pick a date from calendar">
          </label>

          <button type="button" class="clear-date-btn" onclick="MeetingRoomsModule.cycleDate(1)" title="Next day (›)">Next Day ›</button>
        </div>

        <div class="clear-date-quick-chips">
          <button type="button" class="clear-chip-btn ${isToday ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${todayStr}')">Today</button>
          <button type="button" class="clear-chip-btn ${isTomorrow ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${tomorrowStr}')">Tomorrow</button>
          <button type="button" class="clear-chip-btn" onclick="MeetingRoomsModule.openCalendarModal()" title="Open month calendar view">🗓️ Month View</button>
        </div>
      </div>

      <!-- Filters Bar: Capacity, Amenities & Time of Day -->
      <div class="meeting-filters-bar">
        <div class="meeting-filters-left">
          <!-- Capacity Filter -->
          <div class="meeting-filter-group">
            <span class="meeting-filter-label">👥 Capacity:</span>
            <div class="meeting-filter-pills">
              <button class="meeting-filter-pill ${this.filterCapacity === 'all' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCapacity('all')">All</button>
              <button class="meeting-filter-pill ${this.filterCapacity === '4' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCapacity('4')">4+ Pax</button>
              <button class="meeting-filter-pill ${this.filterCapacity === '8' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCapacity('8')">8+ Pax</button>
              <button class="meeting-filter-pill ${this.filterCapacity === '16' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCapacity('16')">16+ Pax</button>
            </div>
          </div>

          <!-- Amenities Filter -->
          <div class="meeting-filter-group">
            <span class="meeting-filter-label">✨ Amenities:</span>
            <div class="meeting-filter-pills">
              <button class="meeting-filter-pill ${this.filterAmenity === 'all' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterAmenity('all')">All</button>
              <button class="meeting-filter-pill ${this.filterAmenity === 'projector' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterAmenity('projector')">📽️ Projector</button>
              <button class="meeting-filter-pill ${this.filterAmenity === 'video' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterAmenity('video')">📹 Video Kit</button>
              <button class="meeting-filter-pill ${this.filterAmenity === 'audio' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterAmenity('audio')">🎙️ Audio/Mic</button>
            </div>
          </div>

          <!-- Time of Day Session Filter -->
          <div class="meeting-filter-group">
            <span class="meeting-filter-label">⏰ Time of Day:</span>
            <div class="meeting-filter-pills">
              <button class="meeting-filter-pill ${this.filterSession === 'all' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterSession('all')">All Day</button>
              <button class="meeting-filter-pill ${this.filterSession === 'morning' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterSession('morning')">🌅 Morning</button>
              <button class="meeting-filter-pill ${this.filterSession === 'afternoon' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterSession('afternoon')">🌆 Afternoon</button>
            </div>
          </div>
        </div>

        ${(this.filterCapacity !== 'all' || this.filterAmenity !== 'all' || this.filterSession !== 'all') ? `
          <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.resetFilters()" style="font-size: 11px; padding: 4px 10px; border-radius: 7px; color: var(--text-muted);">
            ✕ Clear Filters
          </button>
        ` : ''}
      </div>

      <!-- Operating Windows & Legend Strip -->
      <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 14px; padding: 10px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
        <!-- Windows -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px;">
            <span>⏰</span> Windows:
          </span>
          <button type="button" class="badge" onclick="MeetingRoomsModule.openQuickSessionModal('morning')" style="background: rgba(34, 197, 94, 0.15); color: #15803d; border: 1.5px solid rgba(34, 197, 94, 0.4); font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 999px; cursor: pointer; transition: all 0.15s ease;" title="Click to open 'How long do you need?' for Morning Session">
            🌅 Morning (08:00 – 11:00 AM) ⚡
          </button>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; padding: 3px 8px; background: var(--bg-surface); border-radius: 6px; border: 1px solid var(--border-subtle);">
            ☕ 11:00 AM – 03:00 PM Break
          </span>
          <button type="button" class="badge" onclick="MeetingRoomsModule.openQuickSessionModal('afternoon')" style="background: rgba(99, 102, 241, 0.15); color: #4338ca; border: 1.5px solid rgba(99, 102, 241, 0.4); font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 999px; cursor: pointer; transition: all 0.15s ease;" title="Click to open 'How long do you need?' for Afternoon Session">
            🌆 Afternoon (03:00 – 07:00 PM) ⚡
          </button>
        </div>

        <!-- Legend & Realtime Summary -->
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          ${(this.selectedDate < todayStr) ? `
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #94a3b8;"></span>
              <span style="color: #64748b; font-weight: 700;">Past Date (${mySlotsCount + otherSlotsCount} Completed Bookings)</span>
            </div>
            ${otherSlotsCount > 0 ? `
              <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span>
                <span style="color: #dc2626; font-weight: 700;">${otherSlotsCount} Booked (Completed)</span>
              </div>
            ` : ''}
            ${mySlotsCount > 0 ? `
              <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb;"></span>
                <span style="color: #1d4ed8; font-weight: 700;">${mySlotsCount} Reserved by You</span>
              </div>
            ` : ''}
          ` : `
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
              <span style="color: #15803d; font-weight: 700;">${availableSlotsCount} Available ${isToday ? 'Remaining Today' : ''}</span>
            </div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb;"></span>
              <span style="color: #1d4ed8; font-weight: 700;">${mySlotsCount} Reserved by You</span>
            </div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #64748b;"></span>
              <span style="color: #64748b; font-weight: 700;">${otherSlotsCount} Booked (🔒)</span>
            </div>
          `}
        </div>
      </div>

      <!-- Room Cards Grid -->
      ${filteredRooms.length === 0 ? `
        <div style="background: var(--bg-surface-elevated); border: 1.5px dashed var(--border-medium); border-radius: 16px; padding: 40px 20px; text-align: center; margin-bottom: 26px;">
          <div style="font-size: 32px; margin-bottom: 10px;">🔍</div>
          <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">No matching rooms found</h4>
          <p style="font-size: 12.5px; color: var(--text-muted); margin: 0 0 16px 0;">Try adjusting your capacity, amenities, or session filters.</p>
          <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.resetFilters()" style="font-weight: 700; border-radius: 8px;">
            Reset Filters
          </button>
        </div>
      ` : `
        <div class="grid-2col" style="margin-bottom: 26px;">
          ${filteredRooms.map(r => this.renderRoomCard(r, myStartup)).join('')}
        </div>
      `}

      <!-- Confirmed Bookings for Selected Date -->
      <div class="card" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface); overflow: hidden;">
        <div class="card-header" style="padding: 16px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <div class="card-title" style="font-size: 14px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <span>📅 Confirmed Reservations for ${this.selectedDate}</span>
          </div>
          <span class="badge ${myBookingsToday.length > 0 ? 'badge-primary' : 'badge-subtle'}" style="font-weight: 700;">
            ${this.getBookingsCountForDate()} Total Sessions (${myBookingsToday.length} by You)
          </span>
        </div>
        ${this.renderBookingsTable(rooms, myStartup)}
      </div>

      <!-- Sticky Multi-Select Booking Action Bar -->
      ${this.renderStickyBookingBar(rooms, myStartup)}
    `;
  },

  renderMyBookingsView({ myStartup, myBookings }) {
    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const liveTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Total hours booked across all active reservations
    const totalHours = myBookings.reduce((acc, b) => {
      const sH = parseFloat(b.startTime.split(':')[0]) + parseFloat(b.startTime.split(':')[1] || '0') / 60;
      const eH = parseFloat(b.endTime.split(':')[0]) + parseFloat(b.endTime.split(':')[1] || '0') / 60;
      return acc + Math.max(0.5, eH - sH);
    }, 0);

    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));

    // Categorized sets for badges & filtering
    const todayList = myBookings.filter(b => b.date === todayStr && b.status !== 'Cancelled');
    const upcomingList = myBookings.filter(b => (b.date > todayStr || (b.date === todayStr && b.startTime > liveTimeStr)) && b.status !== 'Cancelled');
    const completedList = myBookings.filter(b => (b.date < todayStr || (b.date === todayStr && b.endTime <= liveTimeStr)) && b.status !== 'Cancelled');

    // Filter pipeline
    let filteredList = [...myBookings];

    if (this.myBookingsFilterDate === 'selected') {
      filteredList = filteredList.filter(b => b.date === this.selectedDate);
    }

    if (this.myBookingsStatusFilter === 'today') {
      filteredList = filteredList.filter(b => b.date === todayStr);
    } else if (this.myBookingsStatusFilter === 'upcoming') {
      filteredList = filteredList.filter(b => (b.date > todayStr || (b.date === todayStr && b.startTime > liveTimeStr)));
    } else if (this.myBookingsStatusFilter === 'completed') {
      filteredList = filteredList.filter(b => (b.date < todayStr || (b.date === todayStr && b.endTime <= liveTimeStr)));
    }

    if (this.myBookingsRoomFilter && this.myBookingsRoomFilter !== 'all') {
      filteredList = filteredList.filter(b => b.roomId === this.myBookingsRoomFilter);
    }

    if (this.myBookingsSearch && this.myBookingsSearch.trim()) {
      const q = this.myBookingsSearch.trim().toLowerCase();
      filteredList = filteredList.filter(b => {
        return (
          (b.id && b.id.toLowerCase().includes(q)) ||
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.roomName && b.roomName.toLowerCase().includes(q)) ||
          (b.date && b.date.toLowerCase().includes(q)) ||
          (b.startTime && b.startTime.includes(q)) ||
          (b.endTime && b.endTime.includes(q))
        );
      });
    }

    const rooms = window.store.getMeetingRooms();
    const isFiltered = (this.myBookingsStatusFilter !== 'all' || this.myBookingsRoomFilter !== 'all' || (this.myBookingsSearch && this.myBookingsSearch.trim() !== '') || this.myBookingsFilterDate === 'selected');

    return `
      <!-- My Booked Rooms Banner & 4 KPI Cards -->
      <div style="margin-bottom: 22px;">
        <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px;">
          <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(37, 99, 235, 0.3);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Active Reservations</span>
              <div class="kpi-icon-wrap" style="color: #2563eb;">🎟️</div>
            </div>
            <div class="kpi-value" style="font-size: 26px; font-weight: 800; color: #2563eb;">${myBookings.length} Bookings</div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>${todayList.length} Scheduled Today</span>
            </div>
          </div>

          <div class="kpi-card" style="padding: 16px; border: 1.5px solid var(--border-subtle);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Total Hours Booked</span>
              <div class="kpi-icon-wrap" style="color: #38bdf8;">⏰</div>
            </div>
            <div class="kpi-value" style="font-size: 26px; font-weight: 800; color: var(--text-primary);">${totalHours.toFixed(1)} Hours</div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>Across Boardrooms &amp; Pods</span>
            </div>
          </div>

          <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(34, 197, 94, 0.3);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Monthly Credit Balance</span>
              <div class="kpi-icon-wrap" style="color: #16a34a;">💳</div>
            </div>
            <div class="kpi-value" style="font-size: 26px; font-weight: 800; color: #16a34a;">${remainingCredits} hrs free</div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>${myStartup.usedMeetingHours || 0} hrs consumed this month</span>
            </div>
          </div>

          <div class="kpi-card" style="padding: 16px; border: 1.5px solid var(--border-subtle);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Registered Venture</span>
              <div class="kpi-icon-wrap" style="color: var(--accent-primary);">🏢</div>
            </div>
            <div class="kpi-value" style="font-size: 20px; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${myStartup.name}
            </div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--accent-primary); font-family: var(--font-mono);">
              ${myStartup.id} • ${myStartup.category || 'Incubation Member'}
            </div>
          </div>
        </div>

        <!-- Master Card: My Meeting Room Bookings Feed Report Table -->
        <div class="card" style="margin-bottom: 24px; padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
          
          <!-- Card Header & Feed Controls -->
          <div style="padding: 18px 22px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span>📋 My Meeting Room Bookings Feed &amp; Report</span>
                </h3>
                <span class="badge badge-primary" style="font-size: 11px; font-weight: 700; padding: 2px 8px;">
                  ${filteredList.length} of ${myBookings.length} Logged
                </span>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin: 3px 0 0 0;">
                Live reservation ledger, session schedules, calendar synchronization, and hourly allowance tracking.
              </p>
            </div>

            <!-- View Toggle & Export / Action Buttons -->
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <!-- View Switcher (Table vs Cards) -->
              <div style="display: flex; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: 8px; padding: 3px; gap: 2px;">
                <button class="btn btn-sm ${this.myBookingsViewMode === 'table' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setMyBookingsViewMode('table')" style="font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: none;" title="Feed Report Table View">
                  📊 Table
                </button>
                <button class="btn btn-sm ${this.myBookingsViewMode === 'cards' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setMyBookingsViewMode('cards')" style="font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: none;" title="Visual Cards View">
                  🎴 Cards
                </button>
              </div>

              <!-- Export CSV Button -->
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.exportMyBookingsCSV()" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" title="Export bookings feed to CSV spreadsheet">
                <span>📥</span> <span>Export CSV</span>
              </button>

              <!-- Print / PDF Report Button -->
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.printMyBookingsReport()" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" title="Print formal report of bookings">
                <span>🖨️</span> <span>Print Report</span>
              </button>

              <!-- + New Booking Button -->
              <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openBookModal(null, null, '${myStartup.id}')" style="font-weight: 700; padding: 5px 14px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;">
                <span>⚡</span> <span>+ Book Room</span>
              </button>
            </div>
          </div>

          <!-- Interactive Search & Filtering Sub-Bar -->
          <div style="padding: 12px 20px; background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; min-width: 280px;">
              
              <!-- Search Input -->
              <div style="position: relative; min-width: 220px; flex: 1; max-width: 320px;">
                <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
                <input 
                  type="text" 
                  id="my-bookings-search-input"
                  placeholder="Search purpose, room, ID..." 
                  value="${this.myBookingsSearch || ''}"
                  oninput="MeetingRoomsModule.setMyBookingsSearch(this.value)"
                  style="width: 100%; padding: 6px 10px 6px 30px; font-size: 12px; border-radius: 6px; border: 1px solid var(--border-medium); background: var(--bg-surface-elevated); color: var(--text-primary);"
                >
                ${this.myBookingsSearch ? `
                  <button onclick="MeetingRoomsModule.setMyBookingsSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: none; background: transparent; font-size: 11px; cursor: pointer; color: var(--text-muted);">✕</button>
                ` : ''}
              </div>

              <!-- Room Selector Dropdown -->
              <select 
                onchange="MeetingRoomsModule.setMyBookingsRoomFilter(this.value)"
                style="padding: 6px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid var(--border-medium); background: var(--bg-surface-elevated); color: var(--text-primary); cursor: pointer;"
              >
                <option value="all" ${this.myBookingsRoomFilter === 'all' ? 'selected' : ''}>🏢 All Meeting Spaces</option>
                ${rooms.map(r => `
                  <option value="${r.id}" ${this.myBookingsRoomFilter === r.id ? 'selected' : ''}>${r.icon} ${r.name} (${r.capacity} Pax)</option>
                `).join('')}
              </select>

              <!-- Status Filter Pills -->
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                <button class="btn btn-sm ${this.myBookingsStatusFilter === 'all' && this.myBookingsFilterDate === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="MeetingRoomsModule.setMyBookingsStatusFilter('all'); MeetingRoomsModule.setMyBookingsFilter('all')" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
                  All (${myBookings.length})
                </button>
                <button class="btn btn-sm ${this.myBookingsStatusFilter === 'today' ? 'btn-primary' : 'btn-secondary'}" onclick="MeetingRoomsModule.setMyBookingsStatusFilter('today')" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
                  Today (${todayList.length})
                </button>
                <button class="btn btn-sm ${this.myBookingsStatusFilter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}" onclick="MeetingRoomsModule.setMyBookingsStatusFilter('upcoming')" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
                  Upcoming (${upcomingList.length})
                </button>
                <button class="btn btn-sm ${this.myBookingsStatusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}" onclick="MeetingRoomsModule.setMyBookingsStatusFilter('completed')" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
                  Completed (${completedList.length})
                </button>
              </div>
            </div>

            ${isFiltered ? `
              <button class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.resetMyBookingsFilters()" style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; color: var(--text-secondary);">
                ✕ Reset Filters
              </button>
            ` : ''}
          </div>

          <!-- Content: Feed Report Table or Cards Grid -->
          ${this.myBookingsViewMode === 'table' ? `
            <div class="table-wrapper" style="overflow-x: auto;">
              <table class="nexus-table" style="width: 100%; table-layout: auto; margin: 0; font-size: 12.5px;">
                <thead>
                  <tr>
                    <th style="min-width: 130px; white-space: nowrap;">Booking Ref</th>
                    <th style="min-width: 170px; white-space: nowrap;">Meeting Space</th>
                    <th style="min-width: 180px;">Purpose &amp; Agenda</th>
                    <th style="min-width: 140px; white-space: nowrap;">Date &amp; Schedule</th>
                    <th style="min-width: 110px; white-space: nowrap;">Duration</th>
                    <th style="min-width: 130px; white-space: nowrap;">Allowance / Cost</th>
                    <th style="min-width: 110px; white-space: nowrap;">Live Status</th>
                    <th style="min-width: 140px; text-align: right; white-space: nowrap;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredList.length === 0 ? `
                    <tr>
                      <td colspan="8" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
                        <div style="font-size: 32px; margin-bottom: 8px;">🎟️</div>
                        <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">
                          No meeting room bookings match your filter criteria.
                        </div>
                        <p style="font-size: 12px; margin: 6px auto 14px; max-width: 400px;">
                          Try resetting your search query or reserve an executive space right now.
                        </p>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                          ${isFiltered ? `
                            <button class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.resetMyBookingsFilters()">
                              Clear Filters
                            </button>
                          ` : ''}
                          <button class="btn btn-sm btn-primary" onclick="MeetingRoomsModule.openBookModal(null, null, '${myStartup.id}')">
                            + Book a Room
                          </button>
                        </div>
                      </td>
                    </tr>
                  ` : filteredList.map(b => {
                    const sParts = b.startTime.split(':').map(Number);
                    const eParts = b.endTime.split(':').map(Number);
                    const dur = Math.max(0.5, ((eParts[0] * 60 + (eParts[1] || 0)) - (sParts[0] * 60 + (sParts[1] || 0))) / 60);
                    const isMorning = sParts[0] < 12;

                    let statusBadge = '<span class="badge badge-info" style="font-size: 10.5px; font-weight: 700;">⏳ Upcoming</span>';
                    if (b.status === 'Cancelled') {
                      statusBadge = '<span class="badge" style="background: rgba(100, 116, 139, 0.12); color: #64748b; border: 1px solid rgba(100, 116, 139, 0.25); font-weight: 700; font-size: 10.5px;">🚫 Cancelled</span>';
                    } else if (b.date === todayStr && b.startTime <= liveTimeStr && b.endTime > liveTimeStr) {
                      statusBadge = '<span class="badge badge-success" style="font-size: 10.5px; font-weight: 700; background: #16a34a; color: #fff;">🟢 In Session (Now)</span>';
                    } else if (b.date < todayStr || (b.date === todayStr && b.endTime <= liveTimeStr)) {
                      statusBadge = '<span class="badge" style="font-size: 10.5px; font-weight: 600; background: rgba(100, 116, 139, 0.12); color: #475569; border: 1px solid rgba(100, 116, 139, 0.25);">✓ Completed</span>';
                    } else if (b.date === todayStr) {
                      statusBadge = '<span class="badge badge-warning" style="font-size: 10.5px; font-weight: 700;">⏰ Today</span>';
                    }

                    return `
                      <tr style="transition: all 0.15s ease;">
                        <!-- 1. Booking Ref & QR indicator -->
                        <td style="white-space: nowrap;">
                          <div style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-primary); font-size: 13px;">
                            ${b.id}
                          </div>
                          <div style="display: inline-flex; align-items: center; gap: 4px; margin-top: 3px; font-size: 10.5px; color: #16a34a; font-weight: 600;">
                            <span>✅</span> <span>Confirmed Reservation</span>
                          </div>
                        </td>

                        <!-- 2. Meeting Space & Capacity -->
                        <td style="white-space: nowrap;">
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 22px; width: 34px; height: 34px; border-radius: 8px; background: rgba(37, 99, 235, 0.08); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(37, 99, 235, 0.2);">
                              ${b.roomIcon || '🏢'}
                            </span>
                            <div>
                              <strong style="color: var(--text-primary); font-size: 13px;">${b.roomName}</strong>
                              <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                                <span class="badge badge-info" style="font-size: 9.5px; padding: 1px 6px;">${b.capacity || 10} Pax</span>
                                <span>${b.roomId}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <!-- 3. Purpose & Agenda -->
                        <td style="min-width: 180px;">
                          <div style="font-weight: 700; color: var(--text-primary); font-size: 13px;">
                            ${b.title || 'Executive Working Session'}
                          </div>
                          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                            👥 <strong>${b.attendees} Attendees</strong> registered
                          </div>
                        </td>

                        <!-- 4. Date & Schedule Window -->
                        <td style="white-space: nowrap;">
                          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary); font-size: 12.5px;">
                            ${b.date}
                          </div>
                          <div style="font-size: 11px; color: #2563eb; font-family: var(--font-mono); font-weight: 700; margin-top: 2px;">
                            ⏰ ${b.startTime} – ${b.endTime}
                          </div>
                        </td>

                        <!-- 5. Duration & Session Tag -->
                        <td style="white-space: nowrap;">
                          <div style="font-family: var(--font-mono); font-weight: 800; font-size: 13px; color: var(--text-primary);">
                            ${dur.toFixed(1)} hrs
                          </div>
                          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">
                            ${isMorning ? '🌅 Morning' : '🌇 Afternoon'}
                          </div>
                        </td>

                        <!-- 6. Allowance / Cost -->
                        <td style="white-space: nowrap;">
                          ${b.cost === 0 ? `
                            <span class="badge badge-success" style="font-size: 10.5px; font-weight: 700; padding: 3px 8px;">
                              ✓ Plan Credit (₹0)
                            </span>
                          ` : `
                            <span class="badge badge-warning" style="font-size: 10.5px; font-weight: 700; padding: 3px 8px;">
                              ₹${Number(b.cost).toLocaleString('en-IN')} Overage
                            </span>
                          `}
                          <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                            ${b.cost === 0 ? 'Incubation allowance' : 'Billed on invoice'}
                          </div>
                        </td>

                        <!-- 7. Live Status -->
                        <td style="white-space: nowrap;">
                          ${statusBadge}
                        </td>

                        <!-- 8. Actions (Clean Primary + ⋯ Popover Menu) -->
                        <td style="white-space: nowrap; text-align: right;">
                          <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end; white-space: nowrap;">
                            <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; color: #2563eb; border-color: rgba(37, 99, 235, 0.4); font-weight: 600; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;" onclick="MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')" title="View Reservation Details">
                              <span>📋</span> <span>Details</span>
                            </button>

                            <!-- Compact "⋯" Popover Menu -->
                            <div class="meeting-row-menu-wrapper" style="position: relative; display: inline-block;">
                              <button class="btn btn-outline btn-sm row-menu-trigger" onclick="MeetingRoomsModule.toggleRowMenu(event, '${b.id}')" style="font-size: 14px; padding: 3px 8px; line-height: 1; border-color: var(--border-medium); color: var(--text-secondary); min-width: 28px;" title="More options for booking #${b.id}">
                                ⋯
                              </button>
                              <div id="room-menu-${b.id}" class="meeting-row-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; z-index: 1000; min-width: 185px; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.18); padding: 5px; text-align: left;">
                                <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.downloadBookingIcs('${b.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: #2563eb; border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                                  <span>📅</span> <span>Add to Calendar (.ics)</span>
                                </button>
                                <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.printPassSlip('${b.roomId}', '${b.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                                  <span>🖨️</span> <span>Print Details</span>
                                </button>
                                ${b.status !== 'Cancelled' ? `
                                  <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.openEditTimeWindowModal('${b.roomId}', '${b.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: #2563eb; border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                                    <span>⏰</span> <span>Change Booking Time</span>
                                  </button>
                                  <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.cancelBooking('${b.roomId}', '${b.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: #dc2626; border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                                    <span>❌</span> <span>Cancel Reservation</span>
                                  </button>
                                ` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Table Summary Footer -->
            <div style="padding: 12px 20px; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 12px; color: var(--text-muted);">
              <div>
                Showing <strong>${filteredList.length}</strong> of <strong>${myBookings.length}</strong> meeting reservations.
              </div>
              <div style="display: flex; gap: 14px; align-items: center;">
                <span>Total Reserved: <strong style="color: var(--text-primary); font-family: var(--font-mono);">${totalHours.toFixed(1)} hrs</strong></span>
                <span>•</span>
                <span>Free Balance: <strong style="color: #16a34a; font-family: var(--font-mono);">${remainingCredits} hrs free</strong></span>
              </div>
            </div>
          ` : `
            <!-- Visual Cards Grid View -->
            <div style="padding: 20px;">
              ${filteredList.length === 0 ? `
                <div style="background: var(--bg-surface); border: 2px dashed var(--border-medium); border-radius: 16px; padding: 48px 24px; text-align: center;">
                  <div style="font-size: 42px; margin-bottom: 12px;">📅</div>
                  <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">No Matching Bookings</h3>
                  <p style="font-size: 13.5px; color: var(--text-secondary); max-width: 460px; margin: 0 auto 18px auto;">
                    No room reservations match your current filter settings.
                  </p>
                  <button class="btn btn-primary" onclick="MeetingRoomsModule.openBookModal(null, null, '${myStartup.id}')" style="font-weight: 700; padding: 8px 22px; border-radius: 8px;">
                    + Reserve a Meeting Room Now
                  </button>
                </div>
              ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
                  ${filteredList.map(b => `
                    <div class="my-booking-card">
                      <div class="my-booking-stripe"></div>
                      
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <span style="font-size: 26px; width: 44px; height: 44px; border-radius: 10px; background: rgba(37, 99, 235, 0.1); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(37, 99, 235, 0.25);">
                            ${b.roomIcon || '🏢'}
                          </span>
                          <div>
                            <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0;">${b.roomName}</h4>
                            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                              Booking ID: <code style="color: #2563eb; font-weight: 700;">${b.id}</code>
                            </div>
                          </div>
                        </div>
                        <span class="badge badge-success" style="font-size: 11px; padding: 3px 9px;">
                          ● Confirmed
                        </span>
                      </div>

                      <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle); margin: 12px 0;">
                        <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
                          🎯 ${b.title || 'Executive Review Session'}
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: var(--text-secondary);">
                          <span>📅 <strong>${b.date}</strong></span>
                          <span>•</span>
                          <span style="font-family: var(--font-mono); font-weight: 700; color: #2563eb;">⏰ ${b.startTime} - ${b.endTime}</span>
                          <span>•</span>
                          <span>👥 <strong>${b.attendees} Pax</strong></span>
                        </div>
                      </div>

                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted);">
                        <div>
                          Cost: <strong style="color: #16a34a;">${b.cost === 0 ? 'Covered by Plan (₹0)' : `₹${b.cost}`}</strong>
                        </div>
                        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                          <button class="btn btn-sm btn-primary" onclick="MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                            <span>📋</span> Details
                          </button>
                          <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openEditTimeWindowModal('${b.roomId}', '${b.id}')" style="font-size: 11.5px; padding: 5px 9px; border-radius: 6px; color: #2563eb; border-color: rgba(37,99,235,0.4);" title="Change booking time">
                            ⏰ Time
                          </button>
                          <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.downloadBookingIcs('${b.id}')" style="font-size: 11.5px; padding: 5px 9px; border-radius: 6px; color: #2563eb; border-color: rgba(37,99,235,0.4);" title="Download calendar invite">
                            📅 .ics
                          </button>
                          <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cancelBooking('${b.roomId}', '${b.id}')" style="font-size: 11.5px; padding: 5px 10px; border-radius: 6px; color: #dc2626; border-color: rgba(239, 68, 68, 0.4);" title="Cancel this reservation">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          `}
        </div>
      </div>
    `;
  },

  formatTimeTo12Hour(time24) {
    if (!time24) return '';
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h < 10 ? '0' : ''}${h}:${m} ${ampm}`;
  },

  renderAllBookingsView({ allBookings, myStartup }) {
    const startups = (window.store && window.store.getStartups) ? window.store.getStartups() : [];

    return `
      <!-- Company-by-Company Monthly Meeting Room Consumption & Invoice Ledger -->
      <div class="card" style="margin-bottom: 24px; padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <div style="padding: 16px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>🏢 Company-by-Company Monthly Meeting Room Consumption &amp; Invoice Ledger</span>
            </h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 3px 0 0 0;">
              Total monthly bookings count, exact date/time (AM/PM), credit consumption, and invoice charges across all incubated ventures.
            </p>
          </div>
          <span class="badge badge-success" style="font-size: 11px; font-weight: 700; padding: 4px 10px;">
            ✓ 100% Plan Subsidized • Zero Overages
          </span>
        </div>

        <div style="overflow-x: auto;">
          <table class="nexus-table" style="width: 100%; table-layout: auto; margin: 0; font-size: 12.5px;">
            <thead>
              <tr>
                <th style="min-width: 180px; white-space: nowrap;">Company / Startup</th>
                <th style="min-width: 120px; text-align: center; white-space: nowrap;">Monthly Bookings</th>
                <th style="min-width: 250px;">Date, Timing &amp; AM / PM Session Window</th>
                <th style="min-width: 160px; white-space: nowrap;">Credit Hours Used / Plan</th>
                <th style="min-width: 120px; white-space: nowrap;">Overages Billed</th>
                <th style="min-width: 140px; white-space: nowrap;">Cost on All Invoices</th>
                <th style="min-width: 110px; text-align: right; white-space: nowrap;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${startups.map(s => {
                const sBookings = allBookings.filter(b => b.startupId === s.id || (b.startupName && b.startupName.toLowerCase() === s.name.toLowerCase()));
                const isMine = s.id === myStartup.id;
                const included = s.includedMeetingHours || 12;
                const used = s.usedMeetingHours || sBookings.reduce((acc, b) => {
                  const sParts = b.startTime.split(':').map(Number);
                  const eParts = b.endTime.split(':').map(Number);
                  return acc + Math.max(0.5, ((eParts[0] * 60 + (eParts[1] || 0)) - (sParts[0] * 60 + (sParts[1] || 0))) / 60);
                }, 0);
                const overageHours = Math.max(0, used - included);
                const overageCost = overageHours * 800;
                const fillPct = Math.min(100, Math.round((used / included) * 100));

                return `
                  <tr style="${isMine ? 'background: rgba(37, 99, 235, 0.04); outline: 1px solid rgba(37, 99, 235, 0.2);' : ''}">
                    <!-- 1. Company Name & Info -->
                    <td style="white-space: nowrap;">
                      <div style="display: flex; align-items: center; gap: 9px;">
                        <span style="font-size: 20px;">${s.logoEmoji || '🚀'}</span>
                        <div>
                          <strong style="color: var(--text-primary); font-size: 13px;">${s.name}</strong>
                          ${isMine ? '<span class="badge badge-primary" style="font-size: 9px; padding: 1px 5px; margin-left: 4px;">You</span>' : ''}
                          <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">
                            ${s.id} • ${s.category || 'Incubation Member'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 2. Monthly Bookings Count -->
                    <td style="text-align: center; white-space: nowrap;">
                      <span class="badge ${sBookings.length > 0 ? 'badge-primary' : 'badge-subtle'}" style="font-size: 11.5px; font-weight: 700; padding: 4px 10px;">
                        ${sBookings.length} ${sBookings.length === 1 ? 'Booking' : 'Bookings'}
                      </span>
                    </td>

                    <!-- 3. Exact Date, Timing & AM/PM Window -->
                    <td style="min-width: 250px;">
                      ${sBookings.length === 0 ? `
                        <span style="color: var(--text-muted); font-size: 11.5px; font-style: italic;">No active room reservations this cycle</span>
                      ` : `
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                          ${sBookings.map(b => {
                            const sHour = parseInt(b.startTime.split(':')[0], 10);
                            const isAM = sHour < 12;
                            const ampmTag = isAM ? '🌅 Morning (AM)' : '🌇 Afternoon (PM)';
                            const time12 = `${this.formatTimeTo12Hour(b.startTime)} – ${this.formatTimeTo12Hour(b.endTime)}`;
                            return `
                              <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; background: var(--bg-surface-elevated); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-subtle); flex-wrap: wrap;">
                                <span>📅 <strong>${b.date}</strong></span>
                                <span>•</span>
                                <span style="font-family: var(--font-mono); font-weight: 700; color: #2563eb;">⏰ ${time12}</span>
                                <span>•</span>
                                <span class="badge ${isAM ? 'badge-warning' : 'badge-info'}" style="font-size: 9.5px; padding: 1px 5px; font-weight: 700;">
                                  ${ampmTag}
                                </span>
                                <span style="color: var(--text-muted); font-size: 10px;">(${b.roomName})</span>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      `}
                    </td>

                    <!-- 4. Credit Hours Used vs Included Allowance -->
                    <td style="white-space: nowrap;">
                      <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; font-family: var(--font-mono); margin-bottom: 3px;">
                        <span>${used.toFixed(1)} hrs</span>
                        <span style="color: var(--text-muted);">of ${included} hrs free</span>
                      </div>
                      <div class="progress-track" style="height: 6px; width: 130px; background: var(--border-subtle); border-radius: 999px; overflow: hidden;">
                        <div class="progress-fill" style="width: ${fillPct}%; height: 100%; background: ${fillPct > 90 ? '#ef4444' : fillPct > 60 ? '#f59e0b' : '#10b981'}; border-radius: 999px;"></div>
                      </div>
                    </td>

                    <!-- 5. Overages Billed -->
                    <td style="white-space: nowrap;">
                      ${overageHours > 0 ? `
                        <span style="font-size: 12px; font-weight: 700; color: #dc2626; font-family: var(--font-mono);">
                          ⚠️ ${overageHours.toFixed(1)} hrs over
                        </span>
                      ` : `
                        <span style="font-size: 11.5px; font-weight: 600; color: #16a34a;">
                          ✓ 0 hrs (Within Plan)
                        </span>
                      `}
                    </td>

                    <!-- 6. Cost on All Invoices -->
                    <td style="white-space: nowrap;">
                      ${overageCost > 0 ? `
                        <div style="font-weight: 800; font-family: var(--font-mono); color: #dc2626; font-size: 13px;">
                          ₹${overageCost.toLocaleString('en-IN')}
                        </div>
                        <div style="font-size: 10px; color: var(--text-muted);">Billed on monthly rent invoice</div>
                      ` : `
                        <div style="font-weight: 700; font-family: var(--font-mono); color: #16a34a; font-size: 12.5px;">
                          ₹0.00 (Covered)
                        </div>
                        <div style="font-size: 10px; color: var(--text-muted);">Included in incubation grant</div>
                      `}
                    </td>

                    <!-- 7. Action -->
                    <td style="text-align: right; white-space: nowrap;">
                      <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 9px;" onclick="MeetingRoomsModule.openBookModal(null, null, '${s.id}')" title="Book space for ${s.name}">
                        + Book
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- All Individual Confirmed Meeting Room Reservations Ledger -->
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <div style="padding: 16px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">
              📋 All Confirmed Meeting Room Reservations (${allBookings.length})
            </h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">
              Itemized production records across all incubator ventures and meeting spaces.
            </p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openBookModal()" style="font-weight: 700; border-radius: 6px;">
            + Reserve Room
          </button>
        </div>

        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
            <thead>
              <tr style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">Room</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">Startup Venture</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; min-width: 170px;">Meeting Purpose</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">Date &amp; AM/PM Timing</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: center; white-space: nowrap;">Attendees</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">Billing / Cost</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: right; white-space: nowrap;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${allBookings.length === 0 ? `
                <tr><td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted);">No reservations recorded in database</td></tr>
              ` : allBookings.map(b => {
                const isMine = b.startupId === myStartup.id;
                const sHour = parseInt(b.startTime.split(':')[0], 10);
                const isAM = sHour < 12;
                const ampmLabel = isAM ? '🌅 Morning (AM)' : '🌇 Afternoon (PM)';
                const time12 = `${this.formatTimeTo12Hour(b.startTime)} – ${this.formatTimeTo12Hour(b.endTime)}`;

                return `
                  <tr style="border-bottom: 1px solid var(--border-subtle); background: ${isMine ? 'rgba(37, 99, 235, 0.04)' : 'transparent'};">
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${b.roomIcon || '🏢'}</span>
                        <strong style="color: var(--text-primary);">${b.roomName}</strong>
                      </div>
                    </td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <span class="badge" style="font-weight: 700; white-space: nowrap; ${isMine ? 'background: rgba(37, 99, 235, 0.12); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.3);' : 'background: #fef2f2; color: #dc2626; border: 1.5px solid #fca5a5;'}">
                        ${isMine ? '★ ' + b.startupName + ' (You)' : '🔴 ' + b.startupName + ' (Booked)'}
                      </span>
                    </td>
                    <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary); min-width: 170px;">${b.title}</td>
                    <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: 11.5px; white-space: nowrap;">
                      📅 ${b.date} • <strong style="color: #2563eb; white-space: nowrap;">${time12}</strong>
                      <span class="badge ${isAM ? 'badge-warning' : 'badge-info'}" style="font-size: 9.5px; padding: 1px 5px; margin-left: 4px;">
                        ${ampmLabel}
                      </span>
                    </td>
                    <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">${b.attendees} Pax</td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      ${b.cost === 0 ? '<span style="color: #16a34a; font-weight: 700; white-space: nowrap;">Covered by Plan (₹0)</span>' : `<span style="white-space: nowrap;">₹${b.cost}</span>`}
                    </td>
                    <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
                      <div style="display: inline-flex; gap: 6px; align-items: center; white-space: nowrap;">
                        <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px; color: #2563eb; border-color: rgba(37,99,235,0.4); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;" onclick="MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')">
                          <span>📋</span><span>Details</span>
                        </button>
                        <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px; color: #dc2626; border-color: rgba(239, 68, 68, 0.4); white-space: nowrap; flex-shrink: 0;" onclick="MeetingRoomsModule.cancelBooking('${b.roomId}', '${b.id}')">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setDate(date) {
    if (!date) return;
    this.selectedDate = date;
    this.render();
  },

  cycleDate(deltaDays) {
    const base = this.selectedDate || new Date().toISOString().split('T')[0];
    const parts = base.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + deltaDays);
    const pad = n => (n < 10 ? '0' : '') + n;
    this.selectedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    this.render();
  },

  openCalendarModal(yearMonthStr, roomId) {
    if (yearMonthStr && (yearMonthStr.startsWith('mr-') || !yearMonthStr.includes('-') || yearMonthStr.length > 7)) {
      roomId = yearMonthStr;
      yearMonthStr = null;
    }

    let year, month;
    if (yearMonthStr) {
      const parts = yearMonthStr.split('-').map(Number);
      year = parts[0];
      month = parts[1] - 1;
    } else {
      const selParts = (this.selectedDate || new Date().toISOString().split('T')[0]).split('-').map(Number);
      year = selParts[0];
      month = selParts[1] - 1;
    }

    const pad = n => (n < 10 ? '0' : '') + n;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const liveTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthLabel = `${monthNames[month]} ${year}`;

    // Prev / Next Month Strings
    const prevMonthDate = new Date(year, month - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${pad(prevMonthDate.getMonth() + 1)}`;
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextMonthStr = `${nextMonthDate.getFullYear()}-${pad(nextMonthDate.getMonth() + 1)}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const rooms = (window.store && window.store.getMeetingRooms) ? window.store.getMeetingRooms() : [];
    const myStartup = this.getMyStartup();
    const targetRoom = roomId ? rooms.find(r => r.id === roomId) : null;

    // Map bookings by date for this month
    const bookingsByDate = {};
    const relevantRooms = targetRoom ? [targetRoom] : rooms;
    relevantRooms.forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.status !== 'Cancelled') {
          if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
          bookingsByDate[b.date].push({ ...b, roomId: r.id, roomName: r.name });
        }
      });
    });

    // Generate day cells
    let dayCellsHtml = '';
    // Empty prefix cells
    for (let i = 0; i < firstDayIndex; i++) {
      dayCellsHtml += `<div style="background: rgba(0,0,0,0.02); min-height: 80px; border-radius: 8px; border: 1px dashed var(--border-subtle); opacity: 0.35;"></div>`;
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const isToday = (dateStr === todayStr);
      const isPast = (dateStr < todayStr);
      const isSelected = (dateStr === this.selectedDate);
      const dayBookings = bookingsByDate[dateStr] || [];
      const hasMyBooking = dayBookings.some(b => b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
      const totalBookedSessions = dayBookings.length;
      const maxSlotsForDay = targetRoom ? 7 : (rooms.length * 7);
      const isRoomFull = totalBookedSessions >= maxSlotsForDay;
      const openCount = Math.max(0, maxSlotsForDay - totalBookedSessions);

      // Past days: grey tile, label "Past" or "Completed", no click, show bookings history but NEVER "Open"
      if (isPast) {
        dayCellsHtml += `
          <div style="background: var(--bg-hover, #f1f5f9);
                      border: 1px solid var(--border-subtle, #e2e8f0);
                      border-radius: 10px;
                      padding: 8px 10px;
                      min-height: 80px;
                      cursor: not-allowed;
                      opacity: 0.65;
                      display: flex;
                      flex-direction: column;
                      justify-content: space-between;"
               title="${dateStr} • Past date (Completed)">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-muted, #94a3b8); text-decoration: line-through;">
                ${day}
              </span>
              <span class="badge" style="font-size: 9px; padding: 1px 5px; background: #e2e8f0; color: #64748b; font-weight: 700;">Past</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 4px;">
              ${hasMyBooking ? `
                <span style="font-size: 9.5px; font-weight: 700; color: #64748b; background: rgba(0, 0, 0, 0.06); padding: 1px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <span>📅</span> <span>My Booking</span>
                </span>
              ` : ''}
              ${totalBookedSessions > 0 ? `
                <span style="font-size: 9.5px; font-weight: 700; color: #64748b; background: rgba(0, 0, 0, 0.06); padding: 1px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
                  <span>📅</span> <span>${totalBookedSessions} Booked</span>
                </span>
              ` : `
                <span style="font-size: 9.5px; font-weight: 600; color: #94a3b8;">
                  Completed
                </span>
              `}
            </div>
          </div>
        `;
        continue;
      }

      // Today: calculate remaining open slots that haven't ended yet
      let todayActiveRemainingOpen = openCount;
      if (isToday) {
        const operatingSlots = ['08:00', '09:00', '10:00', '15:00', '16:00', '17:00', '18:00'];
        const passedOperatingSlots = operatingSlots.filter(s => {
          const endH = parseInt(s.split(':')[0], 10) + 1;
          const endStr = `${endH < 10 ? '0' : ''}${endH}:00`;
          return endStr <= liveTimeStr;
        });
        let passedUnbooked = 0;
        const targetRoomsList = targetRoom ? [targetRoom] : rooms;
        targetRoomsList.forEach(r => {
          const rBookings = (r.bookings || []).filter(b => b.date === todayStr && b.status !== 'Cancelled');
          passedOperatingSlots.forEach(s => {
            const sH = parseInt(s.split(':')[0], 10);
            const isB = rBookings.some(b => {
              const bH = parseInt(b.startTime.split(':')[0], 10);
              const eH = parseInt(b.endTime.split(':')[0], 10);
              return sH >= bH && sH < eH;
            });
            if (!isB) passedUnbooked++;
          });
        });
        todayActiveRemainingOpen = Math.max(0, openCount - passedUnbooked);
      }

      dayCellsHtml += `
        <div onclick="MeetingRoomsModule.setDate('${dateStr}'); MeetingRoomsModule.closeModal('modal-meeting-calendar')"
             style="background: ${isSelected ? 'rgba(99, 102, 241, 0.08)' : isToday ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-surface)'};
                    border: ${isSelected ? '2px solid #6366f1' : isToday ? '2px solid #22c55e' : '1px solid var(--border-subtle)'};
                    border-radius: 10px;
                    padding: 8px 10px;
                    min-height: 80px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    transition: all 0.18s ease;
                    box-shadow: ${isSelected ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none'};"
             onmouseenter="this.style.transform='translateY(-2px)'; this.style.borderColor='#6366f1';"
             onmouseleave="this.style.transform='none'; this.style.borderColor='${isSelected ? '#6366f1' : isToday ? '#22c55e' : 'var(--border-subtle)'}';">
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 800; color: ${isSelected ? '#4f46e5' : isToday ? '#15803d' : 'var(--text-primary)'};">
              ${day}
            </span>
            ${isToday ? `<span class="badge badge-success" style="font-size: 9.5px; padding: 1px 5px;">Today</span>` : ''}
            ${isSelected && !isToday ? `<span class="badge badge-primary" style="font-size: 9.5px; padding: 1px 5px;">Active</span>` : ''}
          </div>

          <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 4px;">
            ${hasMyBooking ? `
              <span style="font-size: 9.5px; font-weight: 700; color: #1d4ed8; background: rgba(59, 130, 246, 0.12); padding: 1px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <span>📅</span> <span>My Booking</span>
              </span>
            ` : ''}
            ${totalBookedSessions > 0 ? `
              <span style="font-size: 9.5px; font-weight: 700; color: #dc2626; background: rgba(239, 68, 68, 0.1); padding: 1px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
                <span>🔴</span> <span>${isRoomFull ? 'Fully Booked' : totalBookedSessions + ' Booked'}</span>
              </span>
            ` : ''}
            ${isToday ? (todayActiveRemainingOpen > 0 ? `
              <span style="font-size: 9.5px; font-weight: 600; color: #16a34a; background: rgba(34, 197, 94, 0.08); padding: 1px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
                <span>🟢</span> <span>${todayActiveRemainingOpen} Open</span>
              </span>
            ` : `
              <span style="font-size: 9.5px; font-weight: 600; color: #94a3b8;">
                Closed for today
              </span>
            `) : (openCount > 0 ? `
              <span style="font-size: 9.5px; font-weight: 600; color: #16a34a; background: rgba(34, 197, 94, 0.08); padding: 1px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
                <span>🟢</span> <span>${openCount} Open</span>
              </span>
            ` : '')}
          </div>
        </div>
      `;
    }

    const modalHtml = `
      <div class="modal-overlay active" id="modal-meeting-calendar" onclick="if(event.target===this) MeetingRoomsModule.closeModal('modal-meeting-calendar')">
        <div class="modal-content" style="max-width: 740px; background: var(--bg-surface); color: var(--text-primary); border-radius: 16px; box-shadow: var(--shadow-xl); overflow: hidden; border: 1px solid var(--border-subtle);">
          <!-- Modal Header -->
          <div class="modal-header" style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🗓️</span>
              <div>
                <h3 style="font-size: 16px; font-weight: 800; margin: 0; color: var(--text-primary);">
                  ${targetRoom ? `${targetRoom.name} — Monthly Calendar` : 'Meeting Room Master Calendar'}
                </h3>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  ${targetRoom ? `Availability and reservations schedule for ${targetRoom.name} (${targetRoom.capacity} Pax Capacity)` : 'Select any date to view operating sessions, book slots, or check confirmed reservations'}
                </div>
              </div>
            </div>
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-meeting-calendar')">&times;</button>
          </div>

          <!-- Month Selector Toolbar -->
          <div style="padding: 14px 20px; background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openCalendarModal('${prevMonthStr}', '${roomId || ''}')" style="font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 6px;">
                ‹ Prev Month
              </button>
              <h4 style="font-size: 16px; font-weight: 800; margin: 0; min-width: 150px; text-align: center; color: var(--text-primary);">
                ${currentMonthLabel}
              </h4>
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openCalendarModal('${nextMonthStr}', '${roomId || ''}')" style="font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 6px;">
                Next Month ›
              </button>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              ${targetRoom ? `
                <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openCalendarModal(null, '')" style="font-size: 11.5px; font-weight: 700; padding: 5px 11px; border-radius: 6px;">
                  🌐 View All Rooms
                </button>
              ` : ''}
              <button class="btn btn-secondary btn-sm" onclick="MeetingRoomsModule.setDate('${todayStr}'); MeetingRoomsModule.closeModal('modal-meeting-calendar')" style="font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 6px;">
                📅 Jump to Today
              </button>
            </div>
          </div>

          <!-- Calendar Body -->
          <div style="padding: 16px 20px;">
            <!-- Day Headers -->
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px; text-align: center;">
              ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; padding: 4px 0;">
                  ${d}
                </div>
              `).join('')}
            </div>

            <!-- Days Grid -->
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
              ${dayCellsHtml}
            </div>
          </div>

          <!-- Footer with Legend -->
          <div style="padding: 12px 20px; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
              <span style="display: inline-flex; align-items: center; gap: 5px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
                <span>Open Slots</span>
              </span>
              <span style="display: inline-flex; align-items: center; gap: 5px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span>
                <span>Booked Sessions</span>
              </span>
              <span style="display: inline-flex; align-items: center; gap: 5px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb;"></span>
                <span>Your Reservations</span>
              </span>
            </div>

            <button class="btn btn-secondary btn-sm" onclick="MeetingRoomsModule.closeModal('modal-meeting-calendar')" style="padding: 5px 14px; border-radius: 6px;">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = modalHtml;
  },

  getBookingsCountForDate() {
    const rooms = window.store.getMeetingRooms();
    let count = 0;
    rooms.forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.date === this.selectedDate && b.status !== 'Cancelled') count++;
      });
    });
    return count;
  },

  toggleSlotSelection(roomId, slot) {
    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const liveTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const isPastDate = (this.selectedDate < todayStr);
    const isToday = (this.selectedDate === todayStr);

    const sHour = parseInt(slot.split(':')[0], 10);
    const endHour = sHour + 1;
    const endSlotStr = `${endHour < 10 ? '0' : ''}${endHour}:00`;

    if (isPastDate || (isToday && endSlotStr <= liveTimeStr)) {
      App.showToast('This session time has already passed and cannot be booked.', 'warning');
      return;
    }

    if (!this.selectedSlotsByRoom) this.selectedSlotsByRoom = {};
    if (!this.selectedSlotsByRoom[roomId]) {
      this.selectedSlotsByRoom[roomId] = [];
    }
    const list = this.selectedSlotsByRoom[roomId];
    const idx = list.indexOf(slot);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      const isMorning = parseInt(slot.split(':')[0], 10) < 12;
      const hasOppositeSession = list.some(s => (parseInt(s.split(':')[0], 10) < 12) !== isMorning);
      if (hasOppositeSession) {
        this.selectedSlotsByRoom[roomId] = [slot];
      } else {
        list.push(slot);
        list.sort();
      }
    }
    this.render();
  },

  clearSlotSelection(roomId) {
    if (this.selectedSlotsByRoom && this.selectedSlotsByRoom[roomId]) {
      delete this.selectedSlotsByRoom[roomId];
      this.render();
    }
  },

  renderStickyBookingBar(rooms, myStartup) {
    if (!this.selectedSlotsByRoom) return '';
    const roomId = Object.keys(this.selectedSlotsByRoom).find(id => this.selectedSlotsByRoom[id] && this.selectedSlotsByRoom[id].length > 0);
    if (!roomId) return '';

    const room = rooms.find(r => r.id === roomId);
    if (!room) return '';

    const slots = [...this.selectedSlotsByRoom[roomId]].sort();
    const count = slots.length;
    if (count === 0) return '';

    const startSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    const endH = parseInt(lastSlot.split(':')[0], 10) + 1;
    const endSlotStr = `${endH < 10 ? '0' : ''}${endH}:00`;

    const formatSlot12h = (slot24) => {
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
    const isCovered = remainingCredits >= count;
    const totalCost = room.hourlyRate * count;
    const costText = isCovered ? 'Covered by Plan (₹0)' : `₹${totalCost.toLocaleString('en-IN')}`;

    return `
      <div id="sticky-booking-bar" class="sticky-booking-bar">
        <div class="sticky-booking-info">
          <div class="sticky-room-badge">
            <span>${room.icon || '🏢'}</span>
            <strong>${room.name}</strong>
          </div>
          <div class="sticky-details">
            <strong>${count} slot${count > 1 ? 's' : ''}</strong>
            <span style="color: var(--text-muted);">·</span>
            <span style="font-family: var(--font-mono); font-weight: 800; color: #2563eb;">${formatSlot12h(startSlot)} to ${formatSlot12h(endSlotStr)}</span>
            <span style="color: var(--text-muted);">·</span>
            <span class="badge ${isCovered ? 'badge-success' : 'badge-primary'}" style="font-size: 11.5px; padding: 3px 9px; font-weight: 800;">
              ${costText}
            </span>
          </div>
        </div>

        <div class="sticky-booking-actions">
          <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.clearSlotSelection('${room.id}')" style="font-size: 12px; padding: 7px 14px; border-radius: 8px;">
            ✕ Clear
          </button>
          <button type="button" class="btn btn-primary" onclick="MeetingRoomsModule.openConfirmBookingModal('${room.id}')" style="background: #16a34a; border-color: #15803d; font-weight: 800; font-size: 13px; padding: 8px 20px; border-radius: 8px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); display: inline-flex; align-items: center; gap: 6px;">
            <span>Confirm Booking</span> ➔
          </button>
        </div>
      </div>
    `;
  },

  bookNextAvailable(roomId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const morningSlots = ['08:00', '09:00', '10:00'];
    const afternoonSlots = ['15:00', '16:00', '17:00', '18:00'];
    const allSlots = [...morningSlots, ...afternoonSlots];

    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const liveTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const isPastDate = (this.selectedDate < todayStr);

    // If viewing a past date, switch to today
    if (isPastDate) {
      this.selectedDate = todayStr;
      App.showToast(`Switched from past date to today for booking.`, 'info');
    }

    const isToday = (this.selectedDate === todayStr);
    const bookings = (room.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled');

    let nextSlot = allSlots.find(slot => {
      const sHour = parseInt(slot.split(':')[0], 10);
      const endHour = sHour + 1;
      const endSlotStr = `${endHour < 10 ? '0' : ''}${endHour}:00`;
      if (isToday && endSlotStr <= liveTimeStr) return false;
      const isBooked = bookings.some(b => {
        const bHour = parseInt(b.startTime.split(':')[0], 10);
        const eHour = parseInt(b.endTime.split(':')[0], 10);
        return sHour >= bHour && sHour < eHour;
      });
      return !isBooked;
    });

    if (!nextSlot && isToday) {
      const tomorrowObj = new Date(now);
      tomorrowObj.setDate(now.getDate() + 1);
      const tomorrowStr = `${tomorrowObj.getFullYear()}-${pad(tomorrowObj.getMonth() + 1)}-${pad(tomorrowObj.getDate())}`;
      const tomorrowBookings = (room.bookings || []).filter(b => b.date === tomorrowStr && b.status !== 'Cancelled');
      nextSlot = allSlots.find(slot => {
        const sHour = parseInt(slot.split(':')[0], 10);
        return !tomorrowBookings.some(b => {
          const bHour = parseInt(b.startTime.split(':')[0], 10);
          const eHour = parseInt(b.endTime.split(':')[0], 10);
          return sHour >= bHour && sHour < eHour;
        });
      });
      if (nextSlot) {
        this.selectedDate = tomorrowStr;
        App.showToast(`Switched to tomorrow for ${room.name} as today's slots are completed.`, 'info');
      }
    }

    if (!nextSlot) {
      App.showToast(`No open slots found for ${room.name}. Please select another date from the calendar.`, 'warning');
      return;
    }

    this.selectedSlotsByRoom = { [roomId]: [nextSlot] };
    this.render();
    this.openConfirmBookingModal(roomId);
  },

  lockInSelectedSlots(roomId) {
    this.openConfirmBookingModal(roomId);
  },

  openConfirmBookingModal(roomId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const slots = (this.selectedSlotsByRoom && this.selectedSlotsByRoom[roomId]) ? [...this.selectedSlotsByRoom[roomId]].sort() : [];
    if (!slots.length) {
      App.showToast('Please select at least one open time slot first.', 'warning');
      return;
    }

    const startSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    const endH = parseInt(lastSlot.split(':')[0], 10) + 1;
    const endSlotStr = `${endH < 10 ? '0' : ''}${endH}:00`;
    const count = slots.length;

    const formatSlot12h = (slot24) => {
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const myStartup = this.getMyStartup();
    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
    const isCovered = remainingCredits >= count;
    const totalCost = room.hourlyRate * count;

    const dParts = this.selectedDate.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const formattedDate = `${dayName}, ${dayNum} ${monthName}`;

    const modalHtml = `
      <div class="modal-overlay active" id="modal-confirm-booking" onclick="if(event.target===this) MeetingRoomsModule.closeModal('modal-confirm-booking')" style="z-index: 1050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); padding: 16px;">
        <div class="modal-content" style="max-width: 520px; width: 100%; max-height: min(92vh, 620px); border-radius: 18px; background: var(--bg-surface); color: var(--text-primary); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-xl); animation: scaleUp 0.2s ease;">
          
          <div class="modal-header" style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🔒</span>
              <div>
                <h3 style="font-size: 15px; font-weight: 800; margin: 0; color: var(--text-primary);">Confirm Room Reservation</h3>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">Step 2 of 2: Finalize meeting details</div>
              </div>
            </div>
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-confirm-booking')">&times;</button>
          </div>

          <form id="form-confirm-booking" onsubmit="MeetingRoomsModule.submitBookingConfirmation(event, '${room.id}')" style="display: flex; flex-direction: column; flex: 1; overflow: hidden; margin: 0;">
            <div class="modal-body" style="padding: 16px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px;">
              <!-- Selected Room & Interactive Time Window Customizer -->
              <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 12px; padding: 14px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">${room.icon || '🏢'}</span>
                    <strong style="font-size: 14.5px; color: var(--text-primary);">${room.name}</strong>
                    <span class="badge badge-info" style="font-size: 10px; padding: 1px 6px;">${room.capacity} Pax</span>
                  </div>
                  <span id="confirm-cost-badge" class="badge ${isCovered ? 'badge-success' : 'badge-primary'}" style="font-weight: 800; font-size: 11px;">
                    ${isCovered ? 'Covered by Plan (₹0)' : `₹${totalCost.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
                  📅 <strong>${formattedDate}</strong>
                </div>

                <!-- Interactive Time Window Selection -->
                <div style="background: var(--bg-surface); border: 1.5px solid var(--border-medium); border-radius: 10px; padding: 10px 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent-primary, #2563eb); margin: 0; display: flex; align-items: center; gap: 5px;">
                      <span>⏰</span> Change Booking Time <span style="color: #ef4444;">*</span>
                    </label>
                    <span id="confirm-duration-label" style="font-size: 11.5px; font-family: var(--font-mono); font-weight: 800; color: #16a34a;">
                      ${count} hr${count > 1 ? 's' : ''}
                    </span>
                  </div>

                  <!-- Quick Duration Shortcut Chips -->
                  <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px;">
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setConfirmDuration(30, '${room.id}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">30 min</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setConfirmDuration(45, '${room.id}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">45 min</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setConfirmDuration(60, '${room.id}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">1 hr</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setConfirmDuration(90, '${room.id}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">90 min</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setConfirmDuration(120, '${room.id}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">2 hr</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setConfirmDuration(180, '${room.id}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">3 hr</button>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                      <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 3px; display: block;">Start Time</label>
                      <input type="time" id="confirm-start-time" class="form-control" value="${startSlot}" onchange="MeetingRoomsModule.updateConfirmModalTiming('${room.id}')" style="font-size: 12.5px; font-weight: 700; font-family: var(--font-mono); padding: 5px 8px; border-radius: 6px;" required>
                    </div>
                    <div>
                      <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 3px; display: block;">End Time</label>
                      <input type="time" id="confirm-end-time" class="form-control" value="${endSlotStr}" onchange="MeetingRoomsModule.updateConfirmModalTiming('${room.id}')" style="font-size: 12.5px; font-weight: 700; font-family: var(--font-mono); padding: 5px 8px; border-radius: 6px;" required>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Form Fields -->
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12px; margin-bottom: 4px; display: block;">
                  Meeting Title / Purpose <span class="required-star">*</span>
                </label>
                <input type="text" id="confirm-meeting-title" class="form-control" required placeholder="e.g. Product Sprint & Architecture Sync" value="Executive Strategy & Client Sprint" style="font-size: 12.5px; padding: 8px 12px; border-radius: 8px;">
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <span>Number of Attendees <span class="required-star">*</span></span>
                  <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">Max: ${room.capacity} Pax</span>
                </label>
                <input type="number" id="confirm-attendees" class="form-control" required min="1" max="${room.capacity}" value="4" style="font-size: 12.5px; padding: 8px 12px; border-radius: 8px;">
              </div>

              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #065f46; display: flex; align-items: center; gap: 6px;">
                <span>💡</span>
                <span>Once confirmed, your reservation is instantly locked with conflict protection.</span>
              </div>
            </div>

            <!-- Sticky Form Footer -->
            <div style="flex-shrink: 0; padding: 12px 20px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; gap: 10px; justify-content: flex-end; align-items: center;">
              <button type="button" class="btn btn-outline" onclick="MeetingRoomsModule.closeModal('modal-confirm-booking')" style="padding: 8px 14px; border-radius: 8px; font-size: 12px;">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" style="background: #16a34a; border-color: #15803d; font-weight: 800; font-size: 12.5px; padding: 8px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);">
                Confirm &amp; Reserve Room ➔
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = modalHtml;
    setTimeout(() => {
      const input = document.getElementById('confirm-meeting-title');
      if (input) input.focus();
    }, 100);
  },

  setConfirmDuration(mins, roomId) {
    const startInput = document.getElementById('confirm-start-time');
    const endInput = document.getElementById('confirm-end-time');
    if (!startInput || !endInput) return;
    const startVal = startInput.value || '08:00';
    const [h, m] = startVal.split(':').map(Number);
    const startTotal = h * 60 + (m || 0);
    const endTotal = startTotal + mins;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const pad = n => (n < 10 ? '0' : '') + n;
    endInput.value = `${pad(endH)}:${pad(endM)}`;
    this.updateConfirmModalTiming(roomId);
  },

  updateConfirmModalTiming(roomId) {
    const startInput = document.getElementById('confirm-start-time');
    const endInput = document.getElementById('confirm-end-time');
    const durationLabel = document.getElementById('confirm-duration-label');
    const costBadge = document.getElementById('confirm-cost-badge');
    if (!startInput || !endInput) return;

    const startVal = startInput.value;
    const endVal = endInput.value;
    if (!startVal || !endVal) return;

    const [sh, sm] = startVal.split(':').map(Number);
    const [eh, em] = endVal.split(':').map(Number);
    const sMin = sh * 60 + (sm || 0);
    const eMin = eh * 60 + (em || 0);
    if (eMin <= sMin) {
      if (durationLabel) {
        durationLabel.textContent = 'Invalid time range';
        durationLabel.style.color = '#ef4444';
      }
      return;
    }

    const durMinutes = eMin - sMin;
    const durHours = durMinutes / 60;
    const room = window.store.getMeetingRoomById(roomId);
    const myStartup = this.getMyStartup();
    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
    const isCovered = remainingCredits >= durHours;
    const cost = isCovered ? 0 : Math.round((room ? room.hourlyRate : 1500) * durHours);

    if (durationLabel) {
      const hPart = Math.floor(durMinutes / 60);
      const mPart = durMinutes % 60;
      let text = '';
      if (hPart > 0 && mPart > 0) text = `${hPart} hr ${mPart} min`;
      else if (hPart > 0) text = `${hPart} hr${hPart > 1 ? 's' : ''}`;
      else text = `${mPart} min`;
      durationLabel.textContent = text;
      durationLabel.style.color = '#16a34a';
    }

    if (costBadge) {
      if (isCovered) {
        costBadge.className = 'badge badge-success';
        costBadge.textContent = 'Covered by Plan (₹0)';
      } else {
        costBadge.className = 'badge badge-primary';
        costBadge.textContent = `₹${cost.toLocaleString('en-IN')}`;
      }
    }
  },

  async submitBookingConfirmation(event, roomId) {
    if (event) event.preventDefault();
    const form = document.getElementById('form-confirm-booking');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Confirm & Reserve Room ➔';

    const titleInput = document.getElementById('confirm-meeting-title');
    const attendeesInput = document.getElementById('confirm-attendees');
    const title = (titleInput && titleInput.value.trim()) || 'Strategic Review & Team Sprint';
    const attendees = parseInt((attendeesInput && attendeesInput.value) || '4', 10);

    const startTimeInput = document.getElementById('confirm-start-time');
    const endTimeInput = document.getElementById('confirm-end-time');
    let startTime = startTimeInput ? startTimeInput.value.trim() : '';
    let endTime = endTimeInput ? endTimeInput.value.trim() : '';

    if (!startTime || !endTime) {
      const slots = (this.selectedSlotsByRoom && this.selectedSlotsByRoom[roomId]) ? [...this.selectedSlotsByRoom[roomId]].sort() : [];
      if (!slots.length) return;
      startTime = slots[0];
      const lastSlot = slots[slots.length - 1];
      const lastH = parseInt(lastSlot.split(':')[0], 10) + 1;
      endTime = `${lastH < 10 ? '0' : ''}${lastH}:00`;
    }

    if (startTime >= endTime) {
      App.showToast('⚠️ End time must be later than start time', 'warning');
      return;
    }

    const myStartup = this.getMyStartup();
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);

    // Disable button and show spinner
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; vertical-align: middle;"></span> Verifying & Reserving...`;
    }

    try {
      // Re-validate availability in the background before confirming
      await window.store.fetchMeetingRoomsAvailability(this.selectedDate);
      const freshRoom = window.store.getMeetingRoomById(roomId) || room;
      const recentConflict = (freshRoom.bookings || []).find(b => {
        return window.store.hasBookingConflict({ ...b, roomId }, { roomId, date: this.selectedDate, startTime, endTime });
      });

      if (recentConflict) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
        this.closeModal('modal-confirm-booking');
        const alternatives = window.store.findBookingAlternatives({ roomId, date: this.selectedDate, startTime, endTime, attendees, startupId: myStartup.id });
        this.showConflictAlternativesModal(
          freshRoom, 
          { startTime, endTime, date: this.selectedDate, attendees, title }, 
          "This slot was just booked by another startup. Pick another time below.", 
          alternatives
        );
        return;
      }

      const res = await window.store.bookMeetingRoom({
        roomId,
        startupId: myStartup.id,
        startupName: myStartup.name,
        title,
        date: this.selectedDate,
        startTime,
        endTime,
        attendees
      });

      if (res.success) {
        this.closeModal('modal-confirm-booking');
        delete this.selectedSlotsByRoom[roomId];
        this.render();
        if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
          DashboardModule.render();
        }

        const bookedRoom = window.store.getMeetingRoomById(roomId) || room;
        if (bookedRoom && res.booking) {
          this.showBookingSuccessModal(bookedRoom, res.booking, myStartup);
        }
        App.showToast(`🎉 Reservation confirmed for ${bookedRoom ? bookedRoom.name : 'Meeting Room'}!`, 'success');
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
        this.closeModal('modal-confirm-booking');
        const alternatives = res.alternatives || window.store.findBookingAlternatives({ roomId, date: this.selectedDate, startTime, endTime, attendees, startupId: myStartup.id });
        this.showConflictAlternativesModal(
          room,
          { startTime, endTime, date: this.selectedDate, attendees, title },
          res.message || "This slot was just booked by another startup. Pick another time below.",
          alternatives
        );
      }
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
      App.showToast(`⚠️ Booking error: ${err.message}`, 'danger');
    }
  },

  addToGoogleCalendar(bookingId, roomId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return;

    const cleanDate = booking.date.replace(/-/g, '');
    const startH = booking.startTime.replace(/:/g, '');
    const endH = booking.endTime.replace(/:/g, '');
    const startIso = `${cleanDate}T${startH}00`;
    const endIso = `${cleanDate}T${endH}00`;
    const details = `Room: ${room.name} (${room.capacity} Pax)\nReserved by: ${booking.startupName || 'Your Team'}\nAgenda: ${booking.title}\nConfirmed Reservation • Nexus Co-Working & Incubation Hub`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.title + ' (' + room.name + ')')}&dates=${startIso}/${endIso}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(room.name + ', Nexus Hub')}`;
    window.open(url, '_blank');
  },

  downloadIcs(bookingId, roomId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return;

    const cleanDate = booking.date.replace(/-/g, '');
    const startH = booking.startTime.replace(/:/g, '');
    const endH = booking.endTime.replace(/:/g, '');
    const startIso = `${cleanDate}T${startH}00`;
    const endIso = `${cleanDate}T${endH}00`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexus Hub//Meeting Room Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${booking.id || Date.now()}@nexushub.io`,
      `DTSTAMP:${cleanDate}T000000Z`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${booking.title} (${room.name})`,
      `DESCRIPTION:Reserved in ${room.name} by ${booking.startupName || 'Your Team'}. Nexus Co-Working Hub.`,
      `LOCATION:${room.name}, Nexus Hub`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `meeting_${room.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${booking.date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    App.showToast('📅 Calendar event (.ics) downloaded!', 'success');
  },

  showBookingSuccessModal(room, booking, myStartup) {
    if (!room || !booking) return;

    const formatSlot12h = (slot24) => {
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const dParts = booking.date.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const formattedDate = `${dayName}, ${dayNum} ${monthName}`;

    // Deterministic 4-digit PIN based on booking ID
    const pinDigits = String(Math.abs((booking.id || 'BKG100').split('').reduce((acc, c) => acc + c.charCodeAt(0), 1234)) % 9000 + 1000);

    const html = `
      <div class="modal-overlay active" id="modal-booking-success" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-booking-success')" style="z-index: 1060; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); padding: 16px; animation: fadeIn 0.2s ease;">
        <div class="modal-content" style="max-width: 520px; width: 100%; max-height: min(92vh, 660px); border-radius: 20px; background: var(--bg-surface); border: 1.5px solid rgba(34, 197, 94, 0.4); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6); animation: scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);">
          
          <!-- Celebratory Header Banner (Fixed) -->
          <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%); color: #ffffff; padding: 18px 20px 14px 20px; text-align: center; position: relative; flex-shrink: 0;">
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-booking-success')" style="position: absolute; right: 14px; top: 14px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s;">&times;</button>
            
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #22c55e; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.25), 0 6px 18px rgba(34, 197, 94, 0.45); margin-bottom: 8px;">
              ✓
            </div>
            
            <h2 style="font-size: 19px; font-weight: 800; color: #ffffff; margin: 0 0 3px 0; letter-spacing: -0.01em;">
              Room Successfully Booked!
            </h2>
            <p style="font-size: 12px; color: #a7f3d0; margin: 0;">
              Your reservation is confirmed &amp; synced across schedules.
            </p>
          </div>

          <!-- Scrollable Body Container -->
          <div style="padding: 16px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 11px;">
            <!-- Room Info Card -->
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(34, 197, 94, 0.12); border: 1.5px solid rgba(34, 197, 94, 0.35); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                  ${room.icon || '🏢'}
                </div>
                <div>
                  <h3 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">${room.name}</h3>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
                    👥 ${room.capacity} Pax Capacity • ₹${room.hourlyRate}/hr
                  </div>
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 10.5px; padding: 3px 8px; font-weight: 800;">
                ● Locked In
              </span>
            </div>

            <!-- Bento Details Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 9px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  📅 Date
                </div>
                <div style="font-size: 12.5px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">
                  ${formattedDate}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1.5px solid rgba(37, 99, 235, 0.35); border-radius: 10px; padding: 9px 12px; position: relative;">
                <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  ⏰ Time
                </div>
                <div style="font-size: 12.5px; font-weight: 800; color: #2563eb; margin-top: 2px; font-family: var(--font-mono);">
                  ${formatSlot12h(booking.startTime)} – ${formatSlot12h(booking.endTime)}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 9px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  🎯 Meeting Agenda
                </div>
                <div style="font-size: 12.5px; font-weight: 700; color: var(--text-primary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${booking.title}">
                  ${booking.title}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 9px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  💳 Billing / Plan
                </div>
                <div style="font-size: 12.5px; font-weight: 800; color: #16a34a; margin-top: 2px;">
                  ${booking.cost === 0 ? 'Covered by Plan (₹0)' : `₹${booking.cost}`}
                </div>
              </div>
            </div>

            <!-- Add to Calendar Bar -->
            <div style="background: rgba(37, 99, 235, 0.06); border: 1.5px solid rgba(37, 99, 235, 0.25); border-radius: 12px; padding: 9px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
              <div>
                <div style="font-size: 12px; font-weight: 800; color: #1d4ed8; display: flex; align-items: center; gap: 5px;">
                  <span>📅</span> <span>Add to Personal Calendar</span>
                </div>
                <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 1px;">
                  Sync reservation with Google Calendar, Outlook, or Apple Calendar
                </div>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn btn-sm" onclick="MeetingRoomsModule.addToGoogleCalendar('${booking.id}', '${room.id}')" style="background: #ffffff; color: #1e293b; border: 1.5px solid #cbd5e1; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer;">
                  <span>🌐</span> Google Calendar
                </button>
                <button class="btn btn-sm" onclick="MeetingRoomsModule.downloadIcs('${booking.id}', '${room.id}')" style="background: #ffffff; color: #1e293b; border: 1.5px solid #cbd5e1; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer;">
                  <span>📥</span> iCal (.ics)
                </button>
              </div>
            </div>
          </div>

          <!-- Fixed Action Footer (Always Visible & Accessible) -->
          <div style="flex-shrink: 0; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openReservationDetailsModal('${room.id}', '${booking.id}'); MeetingRoomsModule.closeModal('modal-booking-success');" style="font-weight: 700; padding: 7px 14px; border-radius: 7px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 5px; background: #2563eb; border-color: #1d4ed8; color: #fff;">
                <span>📋</span> View Details
              </button>
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-booking-success'); MeetingRoomsModule.switchTab('allBookings');" style="font-weight: 700; padding: 7px 12px; border-radius: 7px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 5px; color: #16a34a; border-color: rgba(34, 197, 94, 0.35);" title="Check all confirmed reservations">
                <span>📂</span> All Confirmed Reservations
              </button>
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openEditTimeWindowModal('${room.id}', '${booking.id}')" style="font-weight: 700; padding: 7px 12px; border-radius: 7px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 5px; color: #2563eb; border-color: rgba(37, 99, 235, 0.4); background: rgba(37, 99, 235, 0.05);" title="Change reservation time">
                <span>⏰</span> Change Time
              </button>
            </div>
            <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.closeModal('modal-booking-success')" style="font-weight: 800; padding: 7px 22px; border-radius: 7px; font-size: 12px; background: #16a34a; border-color: #15803d; box-shadow: 0 3px 10px rgba(22, 163, 74, 0.35); cursor: pointer;">
              ✓ Done
            </button>
          </div>
        </div>
      </div>
    `;

    const mount = document.getElementById('modal-mount');
    if (mount) {
      mount.insertAdjacentHTML('beforeend', html);
    }
  },

  openEditTimeWindowModal(roomId, bookingId) {
    this.closeModal('modal-booking-success');
    this.closeModal('modal-room-door-pass');
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) {
      App.showToast('Reservation not found', 'warning');
      return;
    }

    const myStartup = this.getMyStartup();
    const [sh, sm] = (booking.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (booking.endTime || '09:00').split(':').map(Number);
    const curMin = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));

    // Convert start time to 12h
    const startPeriod = sh >= 12 ? 'PM' : 'AM';
    let startHour12 = sh % 12;
    if (startHour12 === 0) startHour12 = 12;
    const startMin = sm || 0;

    this.editTimeState = {
      roomId,
      bookingId,
      date: booking.date,
      startHour12,
      startMin,
      startPeriod,
      endTime: booking.endTime || '09:00',
      selectedPreset: [30, 45, 60, 90, 120, 180].includes(curMin) ? curMin : 60
    };

    const presets = [
      { m: 30, label: '30 min' },
      { m: 45, label: '45 min' },
      { m: 60, label: '1 hr' },
      { m: 90, label: '90 min' },
      { m: 120, label: '2 hr' },
      { m: 180, label: '3 hr' }
    ];

    const html = `
      <div class="modal-overlay active" id="modal-edit-time-window" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-edit-time-window')" style="z-index: 1070; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); padding: 16px; animation: fadeIn 0.2s ease;">
        <div class="modal-content" style="max-width: 500px; width: 100%; border-radius: 20px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px -12px rgba(0,0,0,0.4); animation: scaleUp 0.22s ease;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; padding: 18px 20px; position: relative;">
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-edit-time-window')" style="position: absolute; right: 14px; top: 14px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
            <h2 style="font-size: 19px; font-weight: 800; color: #ffffff; margin: 0;">
              Change booking time
            </h2>
            <div style="font-size: 12.5px; color: #bfdbfe; margin-top: 4px; font-weight: 500;">
              ${room.name} • 📅 ${booking.date}
            </div>
          </div>

          <form id="form-edit-time-window" onsubmit="MeetingRoomsModule.submitEditTimeWindow(event, '${room.id}', '${booking.id}')" style="margin: 0; display: flex; flex-direction: column;">
            <div style="padding: 18px 20px; display: flex; flex-direction: column; gap: 14px;">
              
              <!-- Room & Meeting Context -->
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13.5px; font-weight: 800; color: var(--text-primary);">${booking.title}</div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
                    Booking Ref: <code style="color: #2563eb; font-weight: 700;">${booking.id}</code>
                  </div>
                </div>
                <span id="edit-cost-badge" class="badge ${booking.cost === 0 ? 'badge-success' : 'badge-primary'}" style="font-size: 11px; font-weight: 800;">
                  ${booking.cost === 0 ? 'Covered by Plan (₹0)' : `₹${booking.cost}`}
                </span>
              </div>

              <!-- Presets: 30 min, 45 min, 1 hr, 90 min, 2 hr, 3 hr -->
              <div>
                <label style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: block;">
                  Quick Duration Presets
                </label>
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;">
                  ${presets.map(p => `
                    <button type="button" 
                      id="edit-preset-${p.m}" 
                      class="btn ${curMin === p.m ? 'btn-primary' : 'btn-outline'}" 
                      onclick="MeetingRoomsModule.setEditPresetDuration(${p.m})" 
                      style="height: 44px; font-size: 11.5px; padding: 0; border-radius: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; ${curMin === p.m ? 'background: #2563eb; color: #ffffff; border-color: #1d4ed8; box-shadow: 0 3px 10px rgba(37,99,235,0.3);' : ''}">
                      ${p.label}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Start Time & End Time -->
              <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-medium); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 14px;">
                
                <!-- Start Time -->
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label style="font-size: 11.5px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
                      Start Time
                    </label>
                    <span id="edit-start-preview" style="font-size: 12.5px; font-weight: 800; color: #2563eb; font-family: var(--font-mono);">
                      ${this.formatTime12h(booking.startTime)}
                    </span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 100px; gap: 8px;">
                    <!-- Hour 1 to 12 only -->
                    <div>
                      <select id="edit-start-hour" class="form-control" onchange="MeetingRoomsModule.onEditStartHourChange(this.value)" style="height: 48px; font-size: 15px; font-weight: 700; border-radius: 10px; padding: 0 10px; cursor: pointer; text-align: center;" title="Start Hour">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => `
                          <option value="${h}" ${startHour12 === h ? 'selected' : ''}>${h}</option>
                        `).join('')}
                      </select>
                    </div>

                    <!-- Minutes 00, 15, 30, 45 only -->
                    <div>
                      <select id="edit-start-min" class="form-control" onchange="MeetingRoomsModule.onEditStartMinChange(this.value)" style="height: 48px; font-size: 15px; font-weight: 700; border-radius: 10px; padding: 0 10px; cursor: pointer; text-align: center;" title="Start Minute">
                        ${[0, 15, 30, 45].map(m => {
                          const pad = (m < 10 ? '0' : '') + m;
                          return `<option value="${m}" ${startMin === m ? 'selected' : ''}>:${pad}</option>`;
                        }).join('')}
                      </select>
                    </div>

                    <!-- AM / PM Switch -->
                    <div style="display: flex; height: 48px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); border-radius: 10px; padding: 3px; gap: 3px;">
                      <button type="button" id="btn-period-am" onclick="MeetingRoomsModule.onEditStartPeriodChange('AM')" style="flex: 1; height: 100%; border: none; border-radius: 7px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.15s ease; ${startPeriod === 'AM' ? 'background: #2563eb; color: #fff; box-shadow: 0 2px 6px rgba(37,99,235,0.35);' : 'background: transparent; color: var(--text-secondary);'}">
                        AM
                      </button>
                      <button type="button" id="btn-period-pm" onclick="MeetingRoomsModule.onEditStartPeriodChange('PM')" style="flex: 1; height: 100%; border: none; border-radius: 7px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.15s ease; ${startPeriod === 'PM' ? 'background: #2563eb; color: #fff; box-shadow: 0 2px 6px rgba(37,99,235,0.35);' : 'background: transparent; color: var(--text-secondary);'}">
                        PM
                      </button>
                    </div>
                  </div>
                </div>

                <!-- End Time Dropdown -->
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label style="font-size: 11.5px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
                      End Time (15-min intervals)
                    </label>
                    <span id="edit-end-preview" style="font-size: 12.5px; font-weight: 800; color: #16a34a; font-family: var(--font-mono);">
                      ${this.formatTime12h(booking.endTime)}
                    </span>
                  </div>

                  <select id="edit-end-time-select" class="form-control" onchange="MeetingRoomsModule.onEditEndTimeChange(this.value)" style="height: 48px; font-size: 14.5px; font-weight: 700; border-radius: 10px; padding: 0 14px; width: 100%; cursor: pointer;">
                  </select>
                </div>
              </div>

              <!-- Hidden inputs -->
              <input type="hidden" id="edit-start-time" value="${booking.startTime}">
              <input type="hidden" id="edit-end-time" value="${booking.endTime}">

              <!-- Summary Line -->
              <div>
                <div id="edit-summary-line" style="font-size: 13.5px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: 10px;">
                  <span id="edit-summary-text" style="font-family: var(--font-mono); color: #2563eb; font-weight: 800;">
                    ${this.formatTime12h(booking.startTime)} – ${this.formatTime12h(booking.endTime)} · ${this.formatMinutesDuration(curMin)}
                  </span>
                  <span id="edit-duration-label" style="font-size: 11.5px; font-weight: 700; color: #16a34a;">
                    ${this.formatMinutesDuration(curMin)}
                  </span>
                </div>

                <!-- Clear error message under the summary -->
                <div id="edit-time-error" style="display: none; font-size: 12px; font-weight: 700; color: #dc2626; background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.25); border-radius: 8px; padding: 8px 12px; margin-top: 8px; align-items: center; gap: 6px;">
                  <span>⚠️</span>
                  <span id="edit-time-error-text"></span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 12px 20px; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-edit-time-window')" style="height: 44px; padding: 0 18px; border-radius: 10px; font-size: 13px; font-weight: 700;">
                Cancel
              </button>
              <button type="submit" id="btn-submit-edit-time" class="btn btn-primary btn-sm" style="height: 44px; font-weight: 800; padding: 0 24px; border-radius: 10px; font-size: 13.5px; background: #2563eb; border-color: #1d4ed8; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                Update time
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const mount = document.getElementById('modal-mount');
    if (mount) {
      mount.insertAdjacentHTML('beforeend', html);
      this.syncEditModalUI();
    }
  },

  parseTimeTo12h(timeStr) {
    if (!timeStr) return { hour12: 8, minute: 0, period: 'AM' };
    const [h24, m] = timeStr.split(':').map(Number);
    const period = h24 >= 12 ? 'PM' : 'AM';
    let hour12 = h24 % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour12, minute: m || 0, period };
  },

  toTime24h(hour12, minute, period) {
    let h = Number(hour12) % 12;
    if (period === 'PM') h += 12;
    const pad = n => (n < 10 ? '0' : '') + n;
    return `${pad(h)}:${pad(minute || 0)}`;
  },

  formatTime12h(timeStr) {
    if (!timeStr) return '';
    const { hour12, minute, period } = this.parseTimeTo12h(timeStr);
    const pad = n => (n < 10 ? '0' : '') + n;
    return `${hour12}:${pad(minute)} ${period}`;
  },

  formatMinutesDuration(mins) {
    if (mins === 30) return '30 min';
    if (mins === 45) return '45 min';
    if (mins === 60) return '1 hr';
    if (mins === 90) return '90 min';
    if (mins === 120) return '2 hr';
    if (mins === 180) return '3 hr';
    if (mins % 60 === 0) return `${mins / 60} hr${mins / 60 > 1 ? 's' : ''}`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  },

  onEditStartHourChange(val) {
    if (!this.editTimeState) return;
    this.editTimeState.startHour12 = parseInt(val, 10);
    this.syncEditModalUI(true);
  },

  onEditStartMinChange(val) {
    if (!this.editTimeState) return;
    this.editTimeState.startMin = parseInt(val, 10);
    this.syncEditModalUI(true);
  },

  onEditStartPeriodChange(period) {
    if (!this.editTimeState) return;
    this.editTimeState.startPeriod = period;
    const btnAm = document.getElementById('btn-period-am');
    const btnPm = document.getElementById('btn-period-pm');
    if (btnAm && btnPm) {
      if (period === 'AM') {
        btnAm.style.background = '#2563eb';
        btnAm.style.color = '#fff';
        btnAm.style.boxShadow = '0 2px 6px rgba(37,99,235,0.35)';
        btnPm.style.background = 'transparent';
        btnPm.style.color = 'var(--text-secondary)';
        btnPm.style.boxShadow = 'none';
      } else {
        btnPm.style.background = '#2563eb';
        btnPm.style.color = '#fff';
        btnPm.style.boxShadow = '0 2px 6px rgba(37,99,235,0.35)';
        btnAm.style.background = 'transparent';
        btnAm.style.color = 'var(--text-secondary)';
        btnAm.style.boxShadow = 'none';
      }
    }
    this.syncEditModalUI(true);
  },

  setEditPresetDuration(mins) {
    if (!this.editTimeState) return;
    this.editTimeState.selectedPreset = mins;
    this.syncEditModalUI(false, mins);
  },

  onEditEndTimeChange(val) {
    if (!this.editTimeState) return;
    this.editTimeState.endTime = val;
    this.syncEditModalUI(false);
  },

  syncEditModalUI(adjustEndToPreset = false, forcedPresetMins = null) {
    if (!this.editTimeState) return;
    const st = this.editTimeState;
    const start24 = this.toTime24h(st.startHour12, st.startMin, st.startPeriod);
    const [sh, sm] = start24.split(':').map(Number);
    const startMins = sh * 60 + sm;

    const startInput = document.getElementById('edit-start-time');
    const endInput = document.getElementById('edit-end-time');
    const startPreview = document.getElementById('edit-start-preview');
    const endPreview = document.getElementById('edit-end-preview');
    const selectEnd = document.getElementById('edit-end-time-select');
    const summaryText = document.getElementById('edit-summary-text');
    const durLabel = document.getElementById('edit-duration-label');
    const errBox = document.getElementById('edit-time-error');
    const errText = document.getElementById('edit-time-error-text');
    const submitBtn = document.getElementById('btn-submit-edit-time');
    const costBadge = document.getElementById('edit-cost-badge');

    if (startInput) startInput.value = start24;
    if (startPreview) startPreview.textContent = this.formatTime12h(start24);

    // Bookable sessions validation:
    // Morning: 08:00 (480m) to 11:00 (660m)
    // Afternoon: 15:00 (900m) to 19:00 (1140m)
    const isMorning = startMins >= 480 && startMins < 660;
    const isAfternoon = startMins >= 900 && startMins < 1140;

    let sessionEnd = 0;
    let validationError = null;

    if (isMorning) {
      sessionEnd = 660; // 11:00 AM
    } else if (isAfternoon) {
      sessionEnd = 1140; // 7:00 PM
    } else {
      validationError = 'Start time must be inside Morning (8:00 to 11:00 AM) or Afternoon (3:00 to 7:00 PM) session.';
    }

    // Check if start time is past today's IST clock
    const ist = (typeof window.store !== 'undefined' && window.store.getISTClock) 
      ? window.store.getISTClock() 
      : { date: new Date().toISOString().split('T')[0], minutes: 0 };
    if (!validationError && st.date === ist.date && startMins <= ist.minutes) {
      validationError = 'This start time has already passed for today. Please select an upcoming slot.';
    }

    // Generate 15-minute step options for End Time (starting 15 min after start time, inside session, max 4h)
    const availableSteps = [];
    if (!validationError && sessionEnd > startMins) {
      const maxEnd = Math.min(sessionEnd, startMins + 240); // up to 4 hours
      for (let m = startMins + 15; m <= maxEnd; m += 15) {
        const hPart = Math.floor(m / 60);
        const mPart = m % 60;
        const pad = n => (n < 10 ? '0' : '') + n;
        const val = `${pad(hPart)}:${pad(mPart)}`;
        const duration = m - startMins;
        availableSteps.push({ val, mins: m, duration });
      }
    }

    if (!validationError && availableSteps.length === 0) {
      validationError = 'No slots available for this start time inside the session.';
    }

    // Populate dropdown
    if (selectEnd) {
      selectEnd.innerHTML = '';
      availableSteps.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.val;
        opt.textContent = `${this.formatTime12h(s.val)} (${this.formatMinutesDuration(s.duration)})`;
        selectEnd.appendChild(opt);
      });
    }

    // Determine current/new end time
    let selectedEndTime = st.endTime;
    const targetPreset = forcedPresetMins || st.selectedPreset || 60;

    if (forcedPresetMins) {
      const targetM = startMins + forcedPresetMins;
      const matched = availableSteps.find(s => s.mins === targetM);
      if (matched) {
        selectedEndTime = matched.val;
      } else if (availableSteps.length > 0) {
        // Pick largest available up to target
        const smaller = availableSteps.filter(s => s.mins <= targetM);
        selectedEndTime = smaller.length > 0 ? smaller[smaller.length - 1].val : availableSteps[0].val;
      }
    } else if (adjustEndToPreset) {
      const targetM = startMins + targetPreset;
      const matched = availableSteps.find(s => s.mins === targetM);
      if (matched) {
        selectedEndTime = matched.val;
      } else if (availableSteps.length > 0) {
        selectedEndTime = availableSteps[0].val;
      }
    } else {
      const isValidCurrent = availableSteps.some(s => s.val === selectedEndTime);
      if (!isValidCurrent && availableSteps.length > 0) {
        const targetM = startMins + targetPreset;
        const matched = availableSteps.find(s => s.mins === targetM);
        selectedEndTime = matched ? matched.val : availableSteps[0].val;
      }
    }

    st.endTime = selectedEndTime;
    if (selectEnd && selectedEndTime) {
      selectEnd.value = selectedEndTime;
    }
    if (endInput && selectedEndTime) {
      endInput.value = selectedEndTime;
    }
    if (endPreview && selectedEndTime) {
      endPreview.textContent = this.formatTime12h(selectedEndTime);
    }

    // Compute duration & update presets
    let currentDurMinutes = 0;
    if (selectedEndTime) {
      const [eh, em] = selectedEndTime.split(':').map(Number);
      currentDurMinutes = (eh * 60 + em) - startMins;
    }

    // Update Presets styling (selected one turns blue, others outlined)
    const presetMins = [30, 45, 60, 90, 120, 180];
    presetMins.forEach(pm => {
      const btn = document.getElementById(`edit-preset-${pm}`);
      if (btn) {
        if (!validationError && currentDurMinutes === pm) {
          btn.style.background = '#2563eb';
          btn.style.color = '#ffffff';
          btn.style.borderColor = '#1d4ed8';
          btn.style.boxShadow = '0 3px 10px rgba(37,99,235,0.3)';
        } else {
          btn.style.background = 'var(--bg-surface)';
          btn.style.color = 'var(--text-primary)';
          btn.style.borderColor = 'var(--border-medium)';
          btn.style.boxShadow = 'none';
        }
      }
    });

    // Update Summary line & error display
    if (validationError) {
      if (errBox && errText) {
        errText.textContent = validationError;
        errBox.style.display = 'flex';
      }
      if (summaryText) {
        summaryText.textContent = 'Invalid time selection';
        summaryText.style.color = '#dc2626';
      }
      if (durLabel) durLabel.textContent = '--';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.45';
        submitBtn.style.cursor = 'not-allowed';
      }
    } else {
      if (errBox) errBox.style.display = 'none';
      if (summaryText) {
        summaryText.textContent = `${this.formatTime12h(start24)} – ${this.formatTime12h(selectedEndTime)} · ${this.formatMinutesDuration(currentDurMinutes)}`;
        summaryText.style.color = '#2563eb';
      }
      if (durLabel) {
        durLabel.textContent = this.formatMinutesDuration(currentDurMinutes);
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }

      // Cost badge
      if (costBadge) {
        const room = window.store.getMeetingRoomById(st.roomId);
        const myStartup = this.getMyStartup();
        const durHours = currentDurMinutes / 60;
        const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
        const isCovered = remainingCredits >= durHours;
        const cost = isCovered ? 0 : Math.round((room ? room.hourlyRate : 1500) * durHours);
        if (isCovered) {
          costBadge.className = 'badge badge-success';
          costBadge.textContent = 'Covered by Plan (₹0)';
        } else {
          costBadge.className = 'badge badge-primary';
          costBadge.textContent = `₹${cost.toLocaleString('en-IN')}`;
        }
      }
    }
  },

  async submitEditTimeWindow(event, roomId, bookingId) {
    if (event) event.preventDefault();
    const startInput = document.getElementById('edit-start-time');
    const endInput = document.getElementById('edit-end-time');
    const startTime = startInput ? startInput.value.trim() : '';
    const endTime = endInput ? endInput.value.trim() : '';

    if (!startTime || !endTime) {
      App.showToast('Please specify both start and end time', 'warning');
      return;
    }
    if (startTime >= endTime) {
      App.showToast('End time must be after start time', 'warning');
      return;
    }

    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    const booking = (room && room.bookings || []).find(b => b.id === bookingId);
    if (!room || !booking) return;

    try {
      const res = await window.store.updateBookingTimeWindow(roomId, bookingId, {
        date: booking.date,
        startTime,
        endTime
      });

      if (res.success) {
        this.closeModal('modal-edit-time-window');
        this.render();
        if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
          DashboardModule.render();
        }
        App.showToast(`✅ Time window updated to ${startTime} – ${endTime}!`, 'success');
        const updatedRoom = window.store.getMeetingRoomById(roomId) || room;
        const updatedBooking = res.booking || (updatedRoom.bookings || []).find(b => b.id === bookingId);
        if (updatedBooking) {
          this.showBookingSuccessModal(updatedRoom, updatedBooking, this.getMyStartup());
        }
      } else {
        App.showToast(`⚠️ Cannot update time window: ${res.message || 'Conflict detected'}`, 'danger');
      }
    } catch (err) {
      App.showToast(`⚠️ Update error: ${err.message}`, 'danger');
    }
  },

  // --- New User Flow: "How long do you need?" Session & Duration Flow ---
  quickFlowState: {
    session: 'morning', // 'morning' | 'afternoon'
    durationMins: 60,
    customMins: 45,
    isCustom: false,
    attendees: 4,
    title: 'Executive Strategy & Team Sprint',
    selectedRoomId: null,
    selectedStartTime: null,
    selectedEndTime: null
  },

  getDurationLabel(mins) {
    if (mins === 30) return '30 min';
    if (mins === 45) return '45 min';
    if (mins === 60) return '1 hr';
    if (mins === 90) return '90 min';
    if (mins === 120) return '2 hrs';
    if (mins === 180) return '3 hrs';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${m} min`;
  },

  openQuickSessionModal(session = 'morning', targetRoomId = null) {
    this.quickFlowState.session = session;
    this.quickFlowState.durationMins = 60;
    this.quickFlowState.isCustom = false;
    this.quickFlowState.selectedRoomId = targetRoomId || null;
    this.quickFlowState.selectedStartTime = null;
    this.quickFlowState.selectedEndTime = null;

    this.renderQuickSessionModal();
  },

  setQuickSession(session) {
    this.quickFlowState.session = session;
    this.quickFlowState.selectedStartTime = null;
    this.quickFlowState.selectedEndTime = null;
    this.renderQuickSessionModal();
  },

  setQuickDuration(mins) {
    this.quickFlowState.durationMins = mins;
    this.quickFlowState.isCustom = false;
    this.quickFlowState.selectedStartTime = null;
    this.quickFlowState.selectedEndTime = null;
    this.renderQuickSessionModal();
  },

  setQuickCustomDuration(mins) {
    const val = parseInt(mins, 10) || 45;
    this.quickFlowState.durationMins = val;
    this.quickFlowState.customMins = val;
    this.quickFlowState.isCustom = true;
    this.quickFlowState.selectedStartTime = null;
    this.quickFlowState.selectedEndTime = null;
    this.renderQuickSessionModal();
  },

  setQuickAttendees(count) {
    const parsed = parseInt(count, 10);
    this.quickFlowState.attendees = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    this.renderQuickSessionModal();
  },

  selectQuickSlot(roomId, startTime, endTime) {
    this.quickFlowState.selectedRoomId = roomId;
    this.quickFlowState.selectedStartTime = startTime;
    this.quickFlowState.selectedEndTime = endTime;
    this.updateQuickSummaryBar();

    const modal = document.getElementById('modal-quick-duration-book');
    if (modal) {
      modal.querySelectorAll('.quick-slot-pill').forEach(btn => {
        const isMatch = btn.getAttribute('data-room-id') === roomId && btn.getAttribute('data-start') === startTime;
        if (isMatch) {
          btn.style.background = '#2563eb';
          btn.style.color = '#ffffff';
          btn.style.borderColor = '#1d4ed8';
          btn.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.35)';
        } else {
          btn.style.background = 'var(--bg-surface)';
          btn.style.color = 'var(--text-primary)';
          btn.style.borderColor = 'var(--border-medium)';
          btn.style.boxShadow = 'none';
        }
      });
    }
  },

  updateQuickSummaryBar() {
    const container = document.getElementById('quick-summary-mount');
    if (!container) return;
    const { selectedRoomId, selectedStartTime, selectedEndTime, durationMins } = this.quickFlowState;
    if (!selectedRoomId || !selectedStartTime || !selectedEndTime) {
      container.innerHTML = `
        <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
          <span>💡</span> <span>Tap any available start time above to review summary &amp; lock in instantly.</span>
        </div>
      `;
      return;
    }

    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === selectedRoomId);
    if (!room) return;

    const myStartup = this.getMyStartup();
    const durationHours = durationMins / 60;
    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
    const isCovered = remainingCredits >= durationHours;
    const cost = isCovered ? 0 : Math.round(room.hourlyRate * durationHours);

    const formatSlot12h = (slot24) => {
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const startLabel = formatSlot12h(selectedStartTime);
    const endLabel = formatSlot12h(selectedEndTime);
    const priceText = isCovered ? 'Covered by Plan (₹0)' : `₹${cost.toLocaleString('en-IN')}`;

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%); border: 1.5px solid rgba(37, 99, 235, 0.35); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; width: 100%; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">${room.icon || '🏢'}</span>
          <div>
            <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em;">
              ${room.name} · ${startLabel} to ${endLabel} · <span style="color: ${isCovered ? '#16a34a' : '#2563eb'}; font-weight: 800;">${priceText}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
              ${durationHours >= 1 ? `${durationHours} hr${durationHours > 1 ? 's' : ''}` : `${durationMins} min`} duration • 📅 ${this.selectedDate} • Keypad PIN automatically synced
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-primary" onclick="MeetingRoomsModule.confirmQuickSessionBooking('${room.id}', '${selectedStartTime}', '${selectedEndTime}')" style="background: #16a34a; border-color: #15803d; font-weight: 800; font-size: 13px; padding: 8px 22px; border-radius: 8px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35); cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
          <span>✓ Confirm</span> <span>➔</span>
        </button>
      </div>
    `;
  },

  async confirmQuickSessionBooking(roomId, startTime, endTime) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const myStartup = this.getMyStartup();
    const title = this.quickFlowState.title || 'Executive Strategy & Team Sprint';
    const attendees = this.quickFlowState.attendees || 4;

    const modal = document.getElementById('modal-quick-duration-book');
    const confirmBtn = modal ? modal.querySelector('#quick-summary-mount button') : null;
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; vertical-align: middle;"></span> Reserving...`;
    }

    try {
      const res = await window.store.bookMeetingRoom({
        roomId,
        startupId: myStartup.id,
        startupName: myStartup.name,
        title,
        date: this.selectedDate,
        startTime,
        endTime,
        attendees
      });

      if (res.success) {
        this.closeModal('modal-quick-duration-book');
        this.render();
        if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
          DashboardModule.render();
        }
        const bookedRoom = window.store.getMeetingRoomById(roomId) || room;
        if (bookedRoom && res.booking) {
          this.showBookingSuccessModal(bookedRoom, res.booking, myStartup);
        }
        App.showToast(`🎉 Reservation confirmed for ${bookedRoom ? bookedRoom.name : 'Meeting Room'}!`, 'success');
      } else {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<span>✓ Confirm</span> <span>➔</span>';
        }
        this.closeModal('modal-quick-duration-book');
        const alternatives = res.alternatives || window.store.findBookingAlternatives({ roomId, date: this.selectedDate, startTime, endTime, attendees, startupId: myStartup.id });
        this.showConflictAlternativesModal(
          room,
          { startTime, endTime, date: this.selectedDate, attendees, title },
          res.message || "This slot was just booked by another startup. Pick another time below.",
          alternatives
        );
      }
    } catch (err) {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<span>✓ Confirm</span> <span>➔</span>';
      }
      App.showToast(`⚠️ Booking error: ${err.message}`, 'danger');
    }
  },

  renderQuickSessionModal() {
    const { session, durationMins, isCustom, customMins, attendees, title, selectedRoomId, selectedStartTime } = this.quickFlowState;
    const rooms = window.store.getMeetingRooms();
    const myStartup = this.getMyStartup();

    const dParts = this.selectedDate.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const formattedDate = `${dayName}, ${dayNum} ${monthName}`;

    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const isToday = (this.selectedDate === todayStr);
    const liveTimeMin = now.getHours() * 60 + now.getMinutes();

    // Session Bounds
    const isMorning = (session === 'morning');
    const sessionStartMin = isMorning ? (8 * 60) : (15 * 60);
    const sessionEndMin = isMorning ? (11 * 60) : (19 * 60);

    const durLabel = this.getDurationLabel(durationMins);
    const otherSessionLabel = isMorning ? 'Afternoon' : 'Morning';
    const otherSessionKey = isMorning ? 'afternoon' : 'morning';

    const formatSlot12h = (slot24) => {
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    // Calculate room availability
    const roomsHtml = rooms.map(room => {
      const bookings = (room.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled');
      const isCapacityOk = !attendees || room.capacity >= attendees;

      // Candidate start times: 30-min steps (or 15-min if duration is custom and not multiple of 30)
      const step = (durationMins % 30 !== 0) ? 15 : 30;
      const validStarts = [];

      for (let cur = sessionStartMin; cur + durationMins <= sessionEndMin; cur += step) {
        if (isToday && cur <= liveTimeMin) {
          continue; // Slot has already passed today
        }

        const endCur = cur + durationMins;
        const curStartStr = `${pad(Math.floor(cur / 60))}:${pad(cur % 60)}`;
        const curEndStr = `${pad(Math.floor(endCur / 60))}:${pad(endCur % 60)}`;

        // Check conflicts
        const hasConflict = bookings.some(b => {
          const [bsh, bsm] = b.startTime.split(':').map(Number);
          const [beh, bem] = b.endTime.split(':').map(Number);
          const bStart = bsh * 60 + (bsm || 0);
          const bEnd = beh * 60 + (bem || 0);
          return bStart < endCur && bEnd > cur;
        });

        if (!hasConflict) {
          validStarts.push({
            startStr: curStartStr,
            endStr: curEndStr,
            startDisplay: formatSlot12h(curStartStr),
            endDisplay: formatSlot12h(curEndStr)
          });
        }
      }

      return `
        <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
          <!-- Room Title & Badges -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">${room.icon || '🏢'}</span>
              <strong style="font-size: 14px; color: var(--text-primary);">${room.name}</strong>
              <span class="badge badge-info" style="font-size: 10.5px; padding: 2px 7px;">${room.capacity} Pax</span>
            </div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-secondary); font-family: var(--font-mono);">
              ₹${room.hourlyRate}/hr
            </div>
          </div>

          <!-- Capacity Alert if attendee count exceeds room size -->
          ${!isCapacityOk ? `
            <div style="font-size: 11px; color: #dc2626; background: rgba(239, 68, 68, 0.08); padding: 6px 10px; border-radius: 6px;">
              ⚠️ Room capacity (${room.capacity} Pax) is less than your ${attendees} attendees.
            </div>
          ` : ''}

          <!-- Available Start Times or Fallback Notice -->
          ${validStarts.length > 0 ? `
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.04em;">
                Available Start Times (${durLabel}):
              </div>
              <div style="display: flex; gap: 7px; flex-wrap: wrap;">
                ${validStarts.map(s => {
                  const isSelected = (selectedRoomId === room.id && selectedStartTime === s.startStr);
                  return `
                    <button type="button" 
                            class="quick-slot-pill" 
                            data-room-id="${room.id}" 
                            data-start="${s.startStr}" 
                            onclick="MeetingRoomsModule.selectQuickSlot('${room.id}', '${s.startStr}', '${s.endStr}')"
                            style="${isSelected ? 'background: #2563eb; color: #ffffff; border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35);' : 'background: var(--bg-surface); color: var(--text-primary); border-color: var(--border-medium);'} font-size: 12px; font-weight: 700; padding: 6px 13px; border-radius: 8px; border: 1.5px solid; cursor: pointer; transition: all 0.15s ease; font-family: var(--font-mono);">
                      ${s.startDisplay}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : `
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.35); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #b45309; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span>
                <span>No slot for ${durLabel}. Try <button type="button" onclick="MeetingRoomsModule.setQuickDuration(60)" style="background: none; border: none; color: #2563eb; text-decoration: underline; font-weight: 700; cursor: pointer; padding: 0;">1 hr</button> or the <button type="button" onclick="MeetingRoomsModule.setQuickSession('${otherSessionKey}')" style="background: none; border: none; color: #2563eb; text-decoration: underline; font-weight: 700; cursor: pointer; padding: 0;">${otherSessionLabel}</button>.</span>
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setQuickDuration(60)" style="font-size: 10.5px; padding: 2px 8px; border-radius: 5px; font-weight: 600;">Try 1 hr</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setQuickSession('${otherSessionKey}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 5px; font-weight: 600;">Try ${otherSessionLabel}</button>
              </div>
            </div>
          `}
        </div>
      `;
    }).join('');

    const modalHtml = `
      <div class="modal-overlay active" id="modal-quick-duration-book" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-quick-duration-book')" style="z-index: 1060; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); padding: 16px; animation: fadeIn 0.2s ease;">
        <div class="modal-content" style="max-width: 580px; width: 100%; max-height: min(94vh, 720px); border-radius: 20px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.45); animation: scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0b2545 0%, #1e3a8a 60%, #2563eb 100%); color: #ffffff; padding: 18px 22px; position: relative; flex-shrink: 0;">
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-quick-duration-book')" style="position: absolute; right: 14px; top: 14px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd; font-weight: 700;">
              <span>⚡ Nexus Fast Booker</span> • <span>📅 ${formattedDate}</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 800; color: #ffffff; margin: 4px 0 2px 0;">
              How long do you need?
            </h2>
            <div style="font-size: 12px; color: #bfdbfe;">
              Select session, duration, and tap any available start time to reserve instantly.
            </div>
          </div>

          <!-- Scrollable Body -->
          <div style="padding: 16px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px;">
            
            <!-- Session Switcher Tabs (Morning vs Afternoon) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: var(--bg-surface-elevated); padding: 4px; border-radius: 12px; border: 1px solid var(--border-medium);">
              <button type="button" class="btn btn-sm ${isMorning ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setQuickSession('morning')" style="font-size: 12px; font-weight: 800; padding: 8px 12px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <span>🌅</span> <span>Morning (08:00 – 11:00 AM)</span>
              </button>
              <button type="button" class="btn btn-sm ${!isMorning ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setQuickSession('afternoon')" style="font-size: 12px; font-weight: 800; padding: 8px 12px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <span>🌆</span> <span>Afternoon (03:00 – 07:00 PM)</span>
              </button>
            </div>

            <!-- Duration Chips & Custom Selector -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em; margin: 0;">
                  ⏱️ Duration Needed
                </label>
                <span style="font-size: 12px; font-weight: 800; color: #2563eb; font-family: var(--font-mono);">
                  ${durLabel} selected
                </span>
              </div>
              
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="btn btn-sm ${(!isCustom && durationMins === 30) ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setQuickDuration(30)" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 8px;">30 min</button>
                <button type="button" class="btn btn-sm ${(!isCustom && durationMins === 60) ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setQuickDuration(60)" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 8px;">1 hr</button>
                <button type="button" class="btn btn-sm ${(!isCustom && durationMins === 90) ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setQuickDuration(90)" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 8px;">90 min</button>
                <button type="button" class="btn btn-sm ${(!isCustom && durationMins === 120) ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setQuickDuration(120)" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 8px;">2 hr</button>
                <button type="button" class="btn btn-sm ${(!isCustom && durationMins === 180) ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setQuickDuration(180)" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 8px;">3 hr</button>
                <button type="button" class="btn btn-sm ${isCustom ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setQuickCustomDuration(${customMins})" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 8px;">Custom ✎</button>
              </div>

              ${isCustom ? `
                <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                  <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">Custom Duration:</span>
                  <input type="number" min="15" max="240" step="15" value="${customMins}" onchange="MeetingRoomsModule.setQuickCustomDuration(this.value)" style="width: 70px; padding: 4px 8px; font-size: 12px; font-weight: 700; font-family: var(--font-mono); border-radius: 6px; border: 1px solid var(--border-medium); background: var(--bg-surface); color: var(--text-primary);">
                  <span style="font-size: 11.5px; color: var(--text-muted);">minutes</span>
                  <div style="display: flex; gap: 4px; margin-left: auto;">
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setQuickCustomDuration(45)" style="font-size: 10.5px; padding: 2px 6px;">45m</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setQuickCustomDuration(75)" style="font-size: 10.5px; padding: 2px 6px;">75m</button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setQuickCustomDuration(105)" style="font-size: 10.5px; padding: 2px 6px;">105m</button>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Optional Attendees & Title -->
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 10px;">
              <div>
                <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px; display: block;">
                  👥 Attendees
                </label>
                <input type="number" min="1" max="40" value="${attendees}" onchange="MeetingRoomsModule.setQuickAttendees(this.value)" class="form-control" style="font-size: 12px; font-weight: 700; padding: 5px 8px; border-radius: 6px;">
              </div>
              <div>
                <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px; display: block;">
                  🎯 Purpose / Agenda
                </label>
                <input type="text" id="quick-agenda-title" value="${title}" oninput="MeetingRoomsModule.quickFlowState.title = this.value" placeholder="e.g. Executive Strategy &amp; Team Sprint" class="form-control" style="font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 6px;">
              </div>
            </div>

            <!-- Room Start Times List -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${roomsHtml}
            </div>
          </div>

          <!-- Sticky Live Summary Bar & Confirm Footer -->
          <div id="quick-summary-mount" style="flex-shrink: 0; padding: 12px 20px; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; min-height: 64px;">
            <!-- Populated reactively by updateQuickSummaryBar() -->
          </div>
        </div>
      </div>
    `;

    let mount = document.getElementById('modal-mount');
    if (!mount) {
      mount = document.body;
    }
    const existing = document.getElementById('modal-quick-duration-book');
    if (existing) {
      existing.outerHTML = modalHtml;
    } else {
      mount.insertAdjacentHTML('beforeend', modalHtml);
    }
    this.updateQuickSummaryBar();
  },

  openWaitlistModal(roomId, slot, bookedBookingId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookedBookingId) || {};
    const myStartup = this.getMyStartup();

    const curHour = parseInt(slot.split(':')[0], 10);
    const endHour = curHour + 1;
    const endSlotStr = `${endHour < 10 ? '0' : ''}${endHour}:00`;

    const formatSlot12h = (slot24) => {
      if (!slot24) return '';
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const timeRangeLabel = `${formatSlot12h(slot)} – ${formatSlot12h(endSlotStr)}`;

    const dParts = this.selectedDate.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const formattedDate = `${dayName}, ${dayNum} ${monthName}`;

    const html = `
      <div class="modal-overlay active" id="modal-waitlist" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-waitlist')" style="z-index: 1060; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); padding: 16px;">
        <div class="modal-content" style="max-width: 480px; width: 100%; max-height: min(92vh, 600px); border-radius: 18px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-xl); animation: scaleUp 0.2s ease;">
          
          <div class="modal-header" style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🔔</span>
              <div>
                <h3 style="font-size: 15px; font-weight: 800; margin: 0; color: var(--text-primary);">Join Waitlist / Notify Me</h3>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">Get alerted if this slot becomes available</div>
              </div>
            </div>
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-waitlist')">&times;</button>
          </div>

          <form id="form-waitlist" onsubmit="MeetingRoomsModule.submitWaitlist(event, '${room.id}', '${slot}')" style="display: flex; flex-direction: column; flex: 1; overflow: hidden; margin: 0;">
            <div class="modal-body" style="padding: 16px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px;">
              <!-- Slot Overview Card -->
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 14px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">${room.icon || '🏢'}</span>
                    <strong style="font-size: 14.5px; color: var(--text-primary);">${room.name}</strong>
                  </div>
                  <span class="badge" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; font-weight: 700; font-size: 11px;">
                    🔒 Currently Booked
                  </span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 2px;">
                  <div>📅 <strong>${formattedDate}</strong></div>
                  <div>⏰ <strong>${timeRangeLabel}</strong> (1 hr)</div>
                  <div style="color: var(--text-muted); font-size: 11px; margin-top: 2px;">
                    Reserved by: <strong>${booking.startupName || 'Another venture'}</strong>${booking.title ? ` • ${booking.title}` : ''}
                  </div>
                </div>
              </div>

              <!-- Notice -->
              <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 10px; padding: 10px 14px; font-size: 11.5px; color: #1e40af; display: flex; align-items: center; gap: 8px;">
                <span>💡</span>
                <span>If the reserving team releases or reschedules this slot, you will be notified immediately via email and portal alert.</span>
              </div>

              <!-- Inputs -->
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12px; margin-bottom: 4px; display: block;">
                  Alert Email Address <span class="required-star">*</span>
                </label>
                <input type="email" id="waitlist-email" class="form-control" required value="founder@${myStartup.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.io" style="font-size: 12.5px; padding: 8px 12px; border-radius: 8px;">
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12px; margin-bottom: 4px; display: block;">
                  Mobile / WhatsApp (Optional)
                </label>
                <input type="text" id="waitlist-phone" class="form-control" placeholder="+91 98765 43210" value="+91 98765 43210" style="font-size: 12.5px; padding: 8px 12px; border-radius: 8px;">
              </div>
            </div>

            <div style="flex-shrink: 0; padding: 12px 20px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; gap: 10px; justify-content: flex-end; align-items: center;">
              <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-waitlist')" style="padding: 8px 14px; border-radius: 8px; font-size: 12px;">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary btn-sm" style="background: #2563eb; border-color: #1d4ed8; font-weight: 800; font-size: 12.5px; padding: 8px 20px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
                <span>🔔</span> Join Waitlist
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').insertAdjacentHTML('beforeend', html);
  },

  submitWaitlist(event, roomId, slot) {
    if (event) event.preventDefault();
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    const email = document.getElementById('waitlist-email')?.value || 'founder@venture.io';

    if (!this.waitlist) this.waitlist = [];
    this.waitlist.push({
      roomId,
      roomName: room ? room.name : roomId,
      date: this.selectedDate,
      slot,
      email,
      timestamp: new Date().toISOString()
    });

    this.closeModal('modal-waitlist');
    App.showToast(`🔔 Added to waitlist! We will alert ${email} the moment ${room ? room.name : 'this slot'} opens up.`, 'success');
  },

  switchRoomWindow(roomId, session) {
    if (!this.roomActiveSession) this.roomActiveSession = {};
    this.roomActiveSession[roomId] = session;
    this.render();
  },

  cycleDate(delta) {
    const parts = this.selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + delta);
    const pad = n => (n < 10 ? '0' : '') + n;
    this.selectedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    this.render();
  },

  openKioskModal(roomId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId) || rooms[0];
    if (!room) return;
    const myStartup = this.getMyStartup();

    const html = `
      <div id="modal-condeco-kiosk" class="condeco-kiosk-backdrop">
        <div style="position: absolute; top: 20px; right: 24px; z-index: 10000; display: flex; gap: 10px; align-items: center;">
          <select class="form-control" style="background: rgba(0,0,0,0.6); color: #ffffff; border-color: rgba(255,255,255,0.25); font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px;" onchange="MeetingRoomsModule.openKioskModal(this.value)">
            ${rooms.map(r => `<option value="${r.id}" ${r.id === room.id ? 'selected' : ''}>🏢 Switch Door: ${r.name}</option>`).join('')}
          </select>
          <button class="btn btn-outline" onclick="MeetingRoomsModule.closeModal('modal-condeco-kiosk')" style="color: #ffffff; border-color: rgba(255,255,255,0.3); font-weight: 700; border-radius: 8px; padding: 6px 14px;">
            ✕ Exit Door Kiosk
          </button>
        </div>

        <div class="condeco-kiosk-mount">
          ${this.renderRoomCard(room, myStartup)}
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  renderRoomCard(room, myStartup) {
    const morningSlots = ['08:00', '09:00', '10:00'];
    const afternoonSlots = ['15:00', '16:00', '17:00', '18:00'];
    const timeSlots = [...morningSlots, ...afternoonSlots];
    const bookings = (room.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled').sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Active session for timeline
    if (!this.roomActiveSession) this.roomActiveSession = {};
    const activeSession = this.roomActiveSession[room.id] || 'morning';
    const sessionSlots = (activeSession === 'morning') ? morningSlots : afternoonSlots;

    // Calculate intelligent real-time operating availability
    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const liveTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const isToday = (this.selectedDate === todayStr);
    const isPastDay = (this.selectedDate < todayStr);

    let myBookedHours = 0;
    let otherBookedHours = 0;
    let passedUnbookedHours = 0;

    timeSlots.forEach(slot => {
      const curHour = parseInt(slot.split(':')[0], 10);
      const endHour = curHour + 1;
      const endSlotStr = `${endHour < 10 ? '0' : ''}${endHour}:00`;
      const isSlotPassed = isPastDay || (isToday && endSlotStr <= liveTimeStr);

      const booked = bookings.find(b => {
        const bHour = parseInt(b.startTime.split(':')[0], 10);
        const eHour = parseInt(b.endTime.split(':')[0], 10);
        return curHour >= bHour && curHour < eHour;
      });
      if (booked) {
        if (booked.startupId === myStartup.id || (booked.startupName && booked.startupName.toLowerCase() === myStartup.name.toLowerCase())) {
          myBookedHours++;
        } else {
          otherBookedHours++;
        }
      } else if (isSlotPassed) {
        passedUnbookedHours++;
      }
    });

    const totalBookedHours = myBookedHours + otherBookedHours;
    const isFullyBooked = (totalBookedHours === timeSlots.length);
    const hasMyBookings = myBookedHours > 0;
    const availableHours = isPastDay ? 0 : Math.max(0, timeSlots.length - totalBookedHours - passedUnbookedHours);

    const formatSlot12h = (slot24) => {
      if (!slot24) return '';
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const getAmenityIcon = (name) => {
      const n = (name || '').toLowerCase();
      if (n.includes('display') || n.includes('tv') || n.includes('screen')) return '🖥️';
      if (n.includes('webex') || n.includes('video') || n.includes('camera') || n.includes('cisco')) return '📹';
      if (n.includes('audio') || n.includes('speaker') || n.includes('polycom')) return '🔊';
      if (n.includes('mic')) return '🎙️';
      if (n.includes('projector') || n.includes('stage')) return '📽️';
      if (n.includes('glass')) return '🪟';
      if (n.includes('leather') || n.includes('chair') || n.includes('seat')) return '💺';
      if (n.includes('livestream') || n.includes('console')) return '📡';
      if (n.includes('acoustic') || n.includes('quiet') || n.includes('sound')) return '🔇';
      return '✦';
    };

    const curHour = now.getHours();
    const curMin = now.getMinutes();
    const curTotalMin = curHour * 60 + curMin;

    let activeBookingNow = null;
    if (isToday) {
      activeBookingNow = bookings.find(b => b.startTime <= liveTimeStr && b.endTime > liveTimeStr);
    }

    let statusType = 'available'; // 'available' | 'occupied' | 'mine' | 'break' | 'closed'
    let statusPillText = 'Available';
    let headlineText = '';
    let nextMeetingText = '';

    if (isPastDay) {
      statusType = 'closed';
      statusPillText = 'Completed';
      headlineText = `${totalBookedHours > 0 ? totalBookedHours + ' Completed Reservation' + (totalBookedHours === 1 ? '' : 's') : 'Past Operating Log'} for ${this.selectedDate}`;
      nextMeetingText = totalBookedHours > 0 ? 'Historical day record • All sessions completed' : 'No reservations recorded for this date';
    } else if (isToday) {
      if (curTotalMin >= 19 * 60) {
        // After 07:00 PM: Hub is closed for the day
        statusType = 'closed';
        statusPillText = 'Closed for Today';
        headlineText = 'Operating Closed • Opens Tomorrow at 08:00 AM';
        nextMeetingText = 'Operating Windows: Morning (08:00–11:00 AM) & Afternoon (03:00–07:00 PM)';
      } else if (curTotalMin < 8 * 60) {
        // Before 08:00 AM
        statusType = 'available';
        statusPillText = 'Opens at 08:00 AM';
        const firstB = bookings[0];
        headlineText = firstB ? `Opens at 08:00 AM • First session at ${formatSlot12h(firstB.startTime)}` : 'Opens at 08:00 AM • All slots available';
        nextMeetingText = firstB ? `${firstB.title} (${firstB.startupName}) - ${formatSlot12h(firstB.startTime)}` : 'No morning reservations scheduled yet';
      } else if (curTotalMin >= 11 * 60 && curTotalMin < 15 * 60) {
        // Midday break (11:00 AM - 03:00 PM)
        statusType = 'break';
        statusPillText = 'Midday Break';
        headlineText = 'Midday Break (11:00 AM – 03:00 PM)';
        const afternoonBookings = bookings.filter(b => parseInt(b.startTime.split(':')[0], 10) >= 15);
        if (afternoonBookings.length > 0) {
          nextMeetingText = `Afternoon session opens 03:00 PM • Next: ${afternoonBookings[0].title} (${formatSlot12h(afternoonBookings[0].startTime)})`;
        } else {
          nextMeetingText = 'Afternoon session opens 03:00 PM • All afternoon slots open';
        }
      } else if (activeBookingNow) {
        const isMine = activeBookingNow.startupId === myStartup.id || (activeBookingNow.startupName && activeBookingNow.startupName.toLowerCase() === myStartup.name.toLowerCase());
        statusType = isMine ? 'mine' : 'occupied';
        statusPillText = isMine ? 'Reserved by You' : 'In Session';
        headlineText = isMine 
          ? `Reserved by Your Team until ${formatSlot12h(activeBookingNow.endTime)}` 
          : `Occupied until ${formatSlot12h(activeBookingNow.endTime)} — ${activeBookingNow.title}`;
        
        const afterList = bookings.filter(b => b.startTime >= activeBookingNow.endTime);
        if (afterList.length > 0) {
          nextMeetingText = `Next: ${afterList[0].title} (${formatSlot12h(afterList[0].startTime)} – ${formatSlot12h(afterList[0].endTime)})`;
        } else {
          nextMeetingText = 'No further reservations scheduled for this operating window';
        }
      } else {
        // Room is currently available during operating hours
        const upcoming = bookings.filter(b => b.startTime > liveTimeStr);
        if (upcoming.length > 0) {
          const nextB = upcoming[0];
          statusType = 'available';
          statusPillText = 'Available Now';
          headlineText = `Available until ${formatSlot12h(nextB.startTime)} today`;
          nextMeetingText = `Next: ${nextB.title} (${formatSlot12h(nextB.startTime)} – ${formatSlot12h(nextB.endTime)})`;
        } else {
          statusType = 'available';
          statusPillText = 'Available Now';
          const sessionEnd = curTotalMin < 11 * 60 ? '11:00 AM' : '07:00 PM';
          headlineText = `Available for immediate use until ${sessionEnd}`;
          nextMeetingText = 'No further bookings today • Walk-in collaboration open';
        }
      }
    } else {
      // Future or past date selected
      if (isFullyBooked) {
        statusType = 'occupied';
        statusPillText = 'Fully Booked';
        headlineText = `Fully Booked for ${this.selectedDate}`;
        nextMeetingText = bookings[0] ? `${bookings[0].title} (${formatSlot12h(bookings[0].startTime)})` : 'Full capacity';
      } else if (bookings.length > 0) {
        statusType = hasMyBookings ? 'mine' : 'available';
        statusPillText = `${availableHours} Slots Open`;
        const firstB = bookings[0];
        headlineText = `${availableHours} Open Slots on ${this.selectedDate}`;
        nextMeetingText = `First session: ${firstB.title} (${formatSlot12h(firstB.startTime)} – ${formatSlot12h(firstB.endTime)})`;
      } else {
        statusType = 'available';
        statusPillText = 'All Slots Open';
        headlineText = `All 7 Operating Slots Open on ${this.selectedDate}`;
        nextMeetingText = 'No reservations recorded • Free to book morning or afternoon';
      }
    }

    // Formatted date string e.g. "Sunday, 25 October"
    const dParts = this.selectedDate.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'long' });
    const formattedDateStr = `${dayName}, ${dayNum} ${monthName}`;

    // Tomorrow date string for quick switcher
    const tomorrowObj = new Date(now);
    tomorrowObj.setDate(now.getDate() + 1);
    const tomorrowStr = `${tomorrowObj.getFullYear()}-${pad(tomorrowObj.getMonth() + 1)}-${pad(tomorrowObj.getDate())}`;
    const isTomorrow = (this.selectedDate === tomorrowStr);

    // Selected slots for inline lock-in
    const selectedSlots = (this.selectedSlotsByRoom && this.selectedSlotsByRoom[room.id]) || [];

    const renderSlotCard = (slot) => {
      const curHour = parseInt(slot.split(':')[0], 10);
      const endHour = curHour + 1;
      const endSlotStr = `${endHour < 10 ? '0' : ''}${endHour}:00`;
      const timeRangeLabel = `${formatSlot12h(slot)} – ${formatSlot12h(endSlotStr)}`;

      const booked = bookings.find(b => {
        const bHour = parseInt(b.startTime.split(':')[0], 10);
        const eHour = parseInt(b.endTime.split(':')[0], 10);
        return curHour >= bHour && curHour < eHour;
      });

      const isPassed = isPastDay || (isToday && endSlotStr <= liveTimeStr);

      if (isPassed) {
        if (booked) {
          const isMine = booked.startupId === myStartup.id || (booked.startupName && booked.startupName.toLowerCase() === myStartup.name.toLowerCase());
          if (isMine) {
            return `
              <div class="clear-slot-card past booked-mine" 
                   onclick="MeetingRoomsModule.openReservationDetailsModal('${room.id}', '${booked.id}')"
                   title="Past session (${timeRangeLabel}) • Reserved by your team • Click to view reservation details">
                <div class="slot-time">${timeRangeLabel}</div>
                <div class="slot-status">📅 Reserved by you (Past)</div>
              </div>
            `;
          } else {
            return `
              <div class="clear-slot-card past booked-other" 
                   title="Past booking (${timeRangeLabel}) • Reserved by ${booked.startupName || 'Another Startup'}">
                <div class="slot-time">${timeRangeLabel}</div>
                <div class="slot-status">🔒 Booked (Past)</div>
              </div>
            `;
          }
        } else {
          return `
            <div class="clear-slot-card past unbooked" 
                 title="${timeRangeLabel} • This session time has passed">
              <div class="slot-time">${timeRangeLabel}</div>
              <div class="slot-status">⌛ Passed</div>
            </div>
          `;
        }
      }

      // Slot is active / future (Today upcoming or Future date)
      if (booked) {
        const isMine = booked.startupId === myStartup.id || (booked.startupName && booked.startupName.toLowerCase() === myStartup.name.toLowerCase());
        if (isMine) {
          return `
            <div class="clear-slot-card mine" 
                 onclick="MeetingRoomsModule.openBookingDetailsModal('${room.id}', '${booked.id}')"
                 title="Reserved by you (${timeRangeLabel}) • Click to view details or cancel">
              <div class="slot-time">${timeRangeLabel}</div>
              <div class="slot-status">🎟️ Booked by you</div>
            </div>
          `;
        } else {
          return `
            <div class="clear-slot-card booked" 
                 title="Booked by ${booked.startupName || 'Another Startup'} (${timeRangeLabel})"
                 tabindex="0"
                 aria-disabled="true"
                 style="cursor: not-allowed;">
              <div class="slot-time">${timeRangeLabel}</div>
              <div class="slot-status">🔒 Booked</div>
            </div>
          `;
        }
      } else {
        const isSelected = selectedSlots.includes(slot);
        return `
          <div class="clear-slot-card available ${isSelected ? 'selected' : ''}"
               onclick="MeetingRoomsModule.toggleSlotSelection('${room.id}', '${slot}')"
               title="${isSelected ? '✓ Selected: Click to unselect' : 'Click to select ' + timeRangeLabel}">
            <div class="slot-time">${timeRangeLabel}</div>
            <div class="slot-status">
              ${isSelected ? '✓ Selected' : '🟢 Available'}
            </div>
          </div>
        `;
      }
    };

    // Dynamic Lock-In Action Strip
    let lockInBarHtml = '';
    if (selectedSlots.length > 0) {
      const sorted = [...selectedSlots].sort();
      const startSlot = sorted[0];
      const endSlotLast = sorted[sorted.length - 1];
      const endHour = parseInt(endSlotLast.split(':')[0], 10) + 1;
      const endSlotStr = `${endHour < 10 ? '0' : ''}${endHour}:00`;

      const duration = sorted.length;
      const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
      const isCovered = remainingCredits >= duration;
      const costBadge = isCovered ? 'Covered by Plan (₹0)' : `₹${room.hourlyRate * duration}`;

      lockInBarHtml = `
        <div class="lockin-action-bar" style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid rgba(16, 185, 129, 0.4); color: var(--text-primary, #0f172a); margin-top: 10px; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div style="min-width: 0; flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 13px; font-weight: 800; color: var(--text-primary, #0f172a); display: flex; align-items: center; gap: 5px;">
                <span>🔒</span> <span>Lock In:</span> <strong style="color: #059669; font-family: var(--font-mono);">${formatSlot12h(startSlot)} – ${formatSlot12h(endSlotStr)}</strong> <span style="color: var(--text-secondary, #64748b); font-size: 11px;">(${duration} hr${duration > 1 ? 's' : ''})</span>
              </span>
              <span class="badge ${isCovered ? 'badge-success' : 'badge-primary'}" style="font-size: 10.5px; padding: 2px 8px; font-weight: 700;">
                ${costBadge}
              </span>
            </div>
            <div style="margin-top: 8px;">
              <input type="text" id="lockin-title-${room.id}" class="form-control" style="font-size: 12px; padding: 6px 12px; height: 32px; width: 100%; max-width: 320px; background: var(--bg-surface, #ffffff); color: var(--text-primary, #0f172a); border-color: var(--border-medium, #cbd5e1); border-radius: 6px;" placeholder="Meeting title / agenda..." value="Executive Strategy & Client Sprint">
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.clearSlotSelection('${room.id}')" style="font-size: 11.5px; padding: 6px 12px; border-radius: 6px; color: var(--text-secondary, #64748b); border-color: var(--border-medium, #cbd5e1);" title="Clear selection">
              ✕ Cancel
            </button>
            <button class="btn btn-sm" onclick="MeetingRoomsModule.lockInSelectedSlots('${room.id}')" style="font-size: 12px; font-weight: 800; padding: 7px 16px; border-radius: 8px; background: #16a34a; color: #ffffff; border: 1px solid #15803d; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);" title="Lock in this reservation immediately">
              <span>🔒</span> <span>Lock In Now</span>
            </button>
          </div>
        </div>
      `;
    }

    const showMorning = this.filterSession === 'all' || this.filterSession === 'morning';
    const showAfternoon = this.filterSession === 'all' || this.filterSession === 'afternoon';

    return `
      <div class="exec-room-card" id="exec-card-${room.id}">
        <!-- Top Row: Room Header + Live Clock & Company Brand -->
        <div class="exec-header-row">
          <div class="exec-title-group">
            <div class="exec-status-indicator ${statusType}"></div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h3 class="exec-room-title">${room.name}</h3>
                <span class="exec-status-pill ${statusType}">● ${statusPillText}</span>
              </div>
              <div class="exec-meta-row">
                <span class="exec-pill-badge">👥 ${room.capacity} Pax Capacity</span>
                <span class="exec-pill-badge" style="background: rgba(99, 102, 241, 0.08); color: #4f46e5; border: 1px solid rgba(99, 102, 241, 0.25); font-weight: 800;">₹${room.hourlyRate}/hr</span>
                <span style="font-size: 11px; color: ${isPastDay ? 'var(--text-muted, #94a3b8)' : availableHours === 0 ? '#dc2626' : otherBookedHours > 0 ? '#dc2626' : statusType === 'available' ? '#16a34a' : 'var(--text-secondary, #64748b)'}; font-weight: 700;">
                  ${isPastDay 
                    ? `History • ${totalBookedHours > 0 ? totalBookedHours + ' Booked (Completed)' : 'Completed'}`
                    : (availableHours === 0 
                        ? (totalBookedHours > 0 ? `0 Slots Open (🔴 Fully Booked)` : `All sessions ended for today`)
                        : (otherBookedHours > 0 
                            ? `${availableHours} Open Remaining • <span style="color: #dc2626; font-weight: 800;">🔴 ${otherBookedHours} Booked</span>` 
                            : `${availableHours} of 7 Slots Open`))}
                </span>
              </div>
            </div>
          </div>

          <div class="exec-brand-clock">
            <div class="exec-digital-clock">${liveTimeStr}</div>
            <div class="exec-brand-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
              <span>NEXUS</span>
            </div>
          </div>
        </div>

        <!-- Room-Specific Date & Calendar Bar -->
        <div class="room-calendar-bar">
          <div class="room-cal-left">
            <button type="button" class="room-cal-nav-btn" onclick="MeetingRoomsModule.cycleDate(-1)" title="Previous Day (‹)">‹</button>
            <label class="room-cal-date-picker" title="Click to open calendar and pick any date for ${room.name}">
              <span class="room-cal-icon">📅</span>
              <span class="room-cal-date-text">${formattedDateStr}</span>
              ${isToday ? `<span class="room-cal-badge today">Today</span>` : isTomorrow ? `<span class="room-cal-badge tomorrow">Tomorrow</span>` : isPastDay ? `<span class="room-cal-badge" style="background: #e2e8f0; color: #64748b;">Past</span>` : ''}
              <span class="room-cal-arrow">▾</span>
              <input type="date" value="${this.selectedDate}" onchange="MeetingRoomsModule.setDate(this.value)" onclick="try{this.showPicker?.()}catch(e){}" class="room-cal-native-input" title="Pick date for ${room.name}">
            </label>
            <button type="button" class="room-cal-nav-btn" onclick="MeetingRoomsModule.cycleDate(1)" title="Next Day (›)">›</button>
          </div>

          <div class="room-cal-right">
            <button type="button" class="room-cal-chip ${isToday ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${todayStr}')">Today</button>
            <button type="button" class="room-cal-chip ${isTomorrow ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${tomorrowStr}')">Tomorrow</button>
            <button type="button" class="room-cal-month-trigger" onclick="MeetingRoomsModule.openCalendarModal(null, '${room.id}')" title="Open ${room.name} full month calendar">
              <span>🗓️</span> <span>Calendar</span>
            </button>
          </div>
        </div>

        <!-- The Clear Way: Intuitive Time Slots Grid -->
        <div class="clear-sessions-wrap">
          ${showMorning ? `
            <!-- Morning Session -->
            <div class="clear-session-block">
              <div class="clear-session-header" onclick="MeetingRoomsModule.openQuickSessionModal('morning', '${room.id}')" style="cursor: pointer; transition: background 0.15s ease;" title="Click to open 'How long do you need?' for Morning Session">
                <div class="clear-session-title">
                  <span>🌅</span>
                  <span>Morning Session</span>
                  <span class="badge" style="font-size: 10px; font-weight: 700; background: rgba(37, 99, 235, 0.1); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.3); margin-left: 6px;">⚡ Quick Book</span>
                </div>
                <span class="clear-session-hours" style="color: #2563eb; font-weight: 700;">08:00 AM – 11:00 AM ➔</span>
              </div>
              <div class="clear-slots-grid">
                ${morningSlots.map(renderSlotCard).join('')}
              </div>
            </div>
          ` : ''}

          ${showAfternoon ? `
            <!-- Afternoon Session -->
            <div class="clear-session-block">
              <div class="clear-session-header" onclick="MeetingRoomsModule.openQuickSessionModal('afternoon', '${room.id}')" style="cursor: pointer; transition: background 0.15s ease;" title="Click to open 'How long do you need?' for Afternoon Session">
                <div class="clear-session-title">
                  <span>🌆</span>
                  <span>Afternoon Session</span>
                  <span class="badge" style="font-size: 10px; font-weight: 700; background: rgba(37, 99, 235, 0.1); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.3); margin-left: 6px;">⚡ Quick Book</span>
                </div>
                <span class="clear-session-hours" style="color: #2563eb; font-weight: 700;">03:00 PM – 07:00 PM ➔</span>
              </div>
              <div class="clear-slots-grid">
                ${afternoonSlots.map(renderSlotCard).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Inline Lock-In Strip (Slides down when slot selected) -->
        ${lockInBarHtml}

        <!-- Amenities Chips & Quick Actions Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 6px; border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));">
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            ${room.amenities.map(a => `
              <span class="amenity-tag" style="background: rgba(0, 0, 0, 0.04); border: 1px solid var(--border-subtle, rgba(0,0,0,0.08)); color: var(--text-secondary, #475569); font-size: 10.5px; padding: 3px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                <span>${getAmenityIcon(a)}</span> <span>${a}</span>
              </span>
            `).join('')}
          </div>

          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-sm" onclick="MeetingRoomsModule.openQuickSessionModal('morning', '${room.id}')" style="background: rgba(37, 99, 235, 0.12); color: #1d4ed8; border: 1.5px solid rgba(37, 99, 235, 0.35); font-weight: 800; font-size: 11px; padding: 5px 11px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" title="Book by duration (30m, 1h, 1.5h, 2h, 3h)">
              <span>⚡</span> Quick Book
            </button>
            <button class="btn btn-sm" onclick="MeetingRoomsModule.bookNextAvailable('${room.id}')" style="background: rgba(34, 197, 94, 0.12); color: #15803d; border: 1.5px solid rgba(34, 197, 94, 0.35); font-weight: 800; font-size: 11px; padding: 5px 11px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" title="Pick the nearest open slot and book in one tap">
              <span>🚀</span> Next Open
            </button>
            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openCalendarModal(null, '${room.id}')" style="font-size: 11px; padding: 5px 11px; border-radius: 6px; color: var(--text-primary, #1e293b); border-color: var(--border-medium, #cbd5e1); background: var(--bg-surface, #ffffff); font-weight: 700; display: inline-flex; align-items: center; gap: 5px;" title="View ${room.name} full month calendar">
              <span>📅</span> Calendar
            </button>
            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openKioskModal('${room.id}')" style="font-size: 11px; padding: 5px 11px; border-radius: 6px; color: var(--text-primary, #1e293b); border-color: var(--border-medium, #cbd5e1); background: var(--bg-surface, #ffffff);" title="View Wall-Mounted Digital Room Display">
              <span>📱</span> Door display
            </button>
            <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openBookModal('${room.id}', null, '${myStartup.id}')" style="background: var(--accent-primary, #4f46e5); color: #ffffff; font-weight: 800; border: none; padding: 6px 14px; border-radius: 7px; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);" title="Open custom booking form">
              <span>+</span> Custom
            </button>
          </div>
        </div>

        <!-- Bottom Embedded Glowing LED Strip -->
        <div class="exec-bottom-led ${statusType}" title="Room status: ${statusPillText}"></div>
      </div>
    `;
  },

  renderBookingsTable(rooms, myStartup) {
    const list = [];
    rooms.forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.date === this.selectedDate && b.status !== 'Cancelled') {
          list.push({ ...b, roomId: r.id, roomName: r.name });
        }
      });
    });

    if (list.length === 0) {
      return `
        <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px;">
          No reservations recorded for ${this.selectedDate}. All rooms are currently open for booking.
        </div>
      `;
    }

    return `
      <div class="table-wrapper">
        <table class="nexus-table" style="font-size: 12.5px;">
          <thead>
            <tr>
              <th style="white-space: nowrap;">Room</th>
              <th style="min-width: 170px;">Meeting Purpose</th>
              <th style="white-space: nowrap;">Startup</th>
              <th style="white-space: nowrap;">Time Window</th>
              <th style="white-space: nowrap; text-align: center;">Attendees</th>
              <th style="white-space: nowrap;">Fee / Credits</th>
              <th style="white-space: nowrap; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(b => {
              const isMine = b.startupId === myStartup.id;
              return `
                <tr style="background: ${isMine ? 'rgba(37, 99, 235, 0.05)' : 'transparent'};">
                  <td style="white-space: nowrap;"><strong>${b.roomName}</strong></td>
                  <td style="min-width: 170px; font-weight: 500;">${b.title}</td>
                  <td style="white-space: nowrap;">
                    <span class="badge ${isMine ? 'badge-primary' : 'badge-info'}" style="font-weight: 700; white-space: nowrap;">
                      ${b.startupName} ${isMine ? '★ (Mine)' : ''}
                    </span>
                  </td>
                  <td style="white-space: nowrap;">
                    <code style="font-family: var(--font-mono); font-weight: 700; color: ${isMine ? '#2563eb' : 'inherit'}; white-space: nowrap; display: inline-block;">${b.startTime} - ${b.endTime}</code>
                  </td>
                  <td style="white-space: nowrap; text-align: center;">${b.attendees} Pax</td>
                  <td style="white-space: nowrap;">
                    ${b.cost === 0 ? '<span style="color: #16a34a; font-weight: 600; white-space: nowrap;">Covered by Plan</span>' : `<span style="white-space: nowrap;">₹${b.cost}</span>`}
                  </td>
                  <td style="white-space: nowrap; text-align: right;">
                    <div style="display: inline-flex; gap: 6px; align-items: center; white-space: nowrap;">
                      <button class="btn btn-outline btn-sm" style="font-size: 11.5px; padding: 4px 10px; color: #2563eb; border-color: rgba(37,99,235,0.4); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; line-height: 1; flex-shrink: 0;" onclick="MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')">
                        <span>📋</span><span>Details</span>
                      </button>
                      <button class="btn btn-outline btn-sm" style="font-size: 11.5px; padding: 4px 10px; color: var(--status-danger); border-color: rgba(239,68,68,0.4); white-space: nowrap; line-height: 1; flex-shrink: 0;" onclick="MeetingRoomsModule.cancelBooking('${b.roomId}', '${b.id}')">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openReservationDetailsModal(roomId, bookingId) {
    this.closeModal('modal-room-door-pass');
    this.closeModal('modal-reservation-details');
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return;

    const [sh, sm] = (booking.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (booking.endTime || '09:00').split(':').map(Number);
    const curMin = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));

    const html = `
      <div class="modal-overlay active" id="modal-reservation-details" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-reservation-details')" style="z-index: 1050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); padding: 16px; animation: fadeIn 0.2s ease;">
        <div class="modal-content" style="max-width: 520px; width: 100%; max-height: min(92vh, 660px); border-radius: 20px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: scaleUp 0.22s ease;">
          
          <!-- Top Banner -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; padding: 18px 22px; position: relative; flex-shrink: 0;">
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-reservation-details')" style="position: absolute; right: 14px; top: 14px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd; font-weight: 700;">
              <span>📋 Confirmed Reservation</span> • <span>Ref: ${booking.id}</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 800; margin: 4px 0 0 0; color: #ffffff; display: flex; align-items: center; gap: 8px;">
              <span>${room.icon || '🏢'}</span> ${room.name}
            </h2>
            <div style="font-size: 12px; color: #bfdbfe; margin-top: 2px;">
              ${room.capacity} Pax Capacity • ₹${room.hourlyRate}/hr • Floor 3, Nexus Hub
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 18px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px;">
            
            <!-- Confirmed Status Banner -->
            <div style="background: rgba(34, 197, 94, 0.08); border: 1.5px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #16a34a; display: flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
                  Confirmed Reservation
                </div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
                  Locked in system • Zero double-booking verified
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 11.5px; font-weight: 800; padding: 4px 10px;">
                ${booking.status || 'Confirmed'}
              </span>
            </div>

            <!-- Details Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Session Date</div>
                <div style="font-size: 13.5px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">📅 ${booking.date}</div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Time & Duration</div>
                <div style="font-size: 13px; font-weight: 800; color: #2563eb; font-family: var(--font-mono); margin-top: 2px;">
                  ⏰ ${this.formatTime12h(booking.startTime)} – ${this.formatTime12h(booking.endTime)}
                </div>
                <div style="font-size: 11px; color: #16a34a; font-weight: 700; margin-top: 1px;">
                  ${this.formatMinutesDuration(curMin)}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Reserving Venture</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">🏢 ${booking.startupName}</div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Attendees Expected</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">👥 ${booking.attendees} Pax</div>
              </div>
            </div>

            <!-- Agenda -->
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 14px;">
              <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Meeting Agenda / Title</div>
              <div style="font-size: 13.5px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">${booking.title}</div>
            </div>

            <!-- Billing & Amenities -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Billing / Plan</div>
                <div style="font-size: 13px; font-weight: 800; color: #16a34a; margin-top: 2px;">
                  ${booking.cost === 0 ? 'Covered by Plan (₹0)' : `₹${booking.cost}`}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Included Amenities</div>
                <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px; font-weight: 600;">
                  Polycom 4K • Screen • WiFi
                </div>
              </div>
            </div>

            <!-- Calendar Export -->
            <div style="background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <div style="font-size: 12px; font-weight: 700; color: #1d4ed8;">
                <span>📅</span> <span>Add to Personal Calendar:</span>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.addToGoogleCalendar('${booking.id}', '${room.id}')" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
                  Google Calendar
                </button>
                <button class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.downloadBookingIcs('${booking.id}')" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
                  iCal (.ics)
                </button>
              </div>
            </div>
          </div>

          <!-- Fixed Footer -->
          <div style="flex-shrink: 0; padding: 12px 20px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-reservation-details'); MeetingRoomsModule.openEditTimeWindowModal('${room.id}', '${booking.id}')" style="font-weight: 700; font-size: 12px; border-radius: 8px; color: #2563eb; border-color: rgba(37,99,235,0.4); padding: 7px 14px;">
                ⏰ Change Time
              </button>
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-reservation-details'); MeetingRoomsModule.cancelBooking('${room.id}', '${booking.id}')" style="font-weight: 700; font-size: 12px; border-radius: 8px; color: #dc2626; border-color: rgba(220,38,38,0.4); padding: 7px 14px;">
                Cancel
              </button>
            </div>
            <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.closeModal('modal-reservation-details')" style="font-weight: 800; font-size: 12px; border-radius: 8px; padding: 7px 22px; background: #2563eb; border-color: #1d4ed8;">
              Done
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  openPassModal(roomId, bookingId) {
    this.openReservationDetailsModal(roomId, bookingId);
  },

  generateStartSlots() {
    const morningStarts = [
      { value: '08:00', label: '08:00 AM (Morning Session)' },
      { value: '08:30', label: '08:30 AM (Morning Session)' },
      { value: '09:00', label: '09:00 AM (Morning Session)' },
      { value: '09:30', label: '09:30 AM (Morning Session)' },
      { value: '10:00', label: '10:00 AM (Morning Session)' },
      { value: '10:30', label: '10:30 AM (Morning Session)' }
    ];
    const afternoonStarts = [
      { value: '15:00', label: '03:00 PM (Afternoon Session)' },
      { value: '15:30', label: '03:30 PM (Afternoon Session)' },
      { value: '16:00', label: '04:00 PM (Afternoon Session)' },
      { value: '16:30', label: '04:30 PM (Afternoon Session)' },
      { value: '17:00', label: '05:00 PM (Afternoon Session)' },
      { value: '17:30', label: '05:30 PM (Afternoon Session)' },
      { value: '18:00', label: '06:00 PM (Afternoon Session)' },
      { value: '18:30', label: '06:30 PM (Afternoon Session)' }
    ];
    return { morningStarts, afternoonStarts, allStarts: [...morningStarts, ...afternoonStarts] };
  },

  getValidEndSlots(startVal) {
    if (!startVal) return [];
    const [h, m] = startVal.split(':').map(Number);
    const startMin = h * 60 + (m || 0);

    // Allow user-customized windows up to 4 hours or until 21:00
    const maxEndMin = Math.min(startMin + 240, 21 * 60);
    const endSlots = [];

    for (let cur = startMin + 15; cur <= maxEndMin; cur += 15) {
      const curH = Math.floor(cur / 60);
      const curM = cur % 60;
      const val = `${curH < 10 ? '0' : ''}${curH}:${curM < 10 ? '0' : ''}${curM}`;
      const durMinutes = cur - startMin;
      const duration = durMinutes / 60;
      const displayHour = curH > 12 ? (curH - 12) : curH;
      const period = curH >= 12 ? 'PM' : 'AM';
      let durText = '';
      if (durMinutes < 60) durText = `${durMinutes}m`;
      else if (durMinutes % 60 === 0) durText = `${duration}h`;
      else durText = `${Math.floor(duration)}h ${durMinutes % 60}m`;
      const label = `${val} (${displayHour}:${curM < 10 ? '0' : ''}${curM} ${period} • ${durText})`;
      endSlots.push({ value: val, label });
    }
    return endSlots;
  },

  syncEndTime(startTimeVal) {
    const endSelect = document.getElementById('book-end-time');
    if (!endSelect || !startTimeVal) return;
    const validEnds = this.getValidEndSlots(startTimeVal);
    endSelect.innerHTML = validEnds.map(e => `
      <option value="${e.value}">
        ${e.label}
      </option>
    `).join('');
    // Default to 1 hour (2nd option if available)
    if (validEnds.length > 1) {
      endSelect.selectedIndex = 1;
    } else if (validEnds.length > 0) {
      endSelect.selectedIndex = 0;
    }
    this.updateModalCostPreview();
  },

  setModalTitle(text) {
    const el = document.getElementById('book-meeting-title');
    if (el) el.value = text;
  },

  switchModalSession(session) {
    const morningBtn = document.getElementById('tab-session-morning');
    const afternoonBtn = document.getElementById('tab-session-afternoon');
    if (morningBtn && afternoonBtn) {
      if (session === 'morning') {
        morningBtn.className = 'btn btn-sm btn-primary';
        morningBtn.style.background = '#2563eb';
        morningBtn.style.color = '#ffffff';
        afternoonBtn.className = 'btn btn-sm btn-outline';
        afternoonBtn.style.background = 'transparent';
        afternoonBtn.style.color = 'var(--text-primary)';
      } else {
        morningBtn.className = 'btn btn-sm btn-outline';
        morningBtn.style.background = 'transparent';
        morningBtn.style.color = 'var(--text-primary)';
        afternoonBtn.className = 'btn btn-sm btn-primary';
        afternoonBtn.style.background = '#2563eb';
        afternoonBtn.style.color = '#ffffff';
      }
    }

    const { morningStarts, afternoonStarts } = this.generateStartSlots();
    const starts = session === 'morning' ? morningStarts : afternoonStarts;
    const startSelect = document.getElementById('book-start-time');
    if (startSelect) {
      startSelect.innerHTML = starts.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
      startSelect.selectedIndex = 0;
      this.syncEndTime(starts[0].value);
      this.updateModalCostPreview();
    }
  },

  updateModalCostPreview() {
    const roomSelect = document.getElementById('book-modal-room-id');
    const startupSelect = document.getElementById('book-modal-startup-id');
    const startSelect = document.getElementById('book-start-time');
    const endSelect = document.getElementById('book-end-time');
    const titleEl = document.getElementById('modal-cost-summary-title');
    const badgeEl = document.getElementById('modal-credits-remaining-badge');
    if (!roomSelect || !startupSelect || !startSelect || !endSelect || !titleEl) return;

    const roomId = roomSelect.value;
    const startupId = startupSelect.value;
    const startTime = startSelect.value;
    const endTime = endSelect.value;

    const room = window.store.getMeetingRoomById(roomId);
    const startup = window.store.getStartupById(startupId);
    if (!room || !startup) return;

    const startH = parseFloat(startTime.split(':')[0]) + parseFloat(startTime.split(':')[1] || 0) / 60;
    const endH = parseFloat(endTime.split(':')[0]) + parseFloat(endTime.split(':')[1] || 0) / 60;
    const duration = Math.max(0.5, endH - startH);

    const remainingCredits = Math.max(0, (startup.includedMeetingHours || 12) - (startup.usedMeetingHours || 0));
    if (remainingCredits >= duration) {
      titleEl.innerHTML = `Covered by Plan (₹0) • <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">${duration} hr${duration > 1 ? 's' : ''} deducted</span>`;
      titleEl.style.color = '#15803d';
      if (badgeEl) {
        badgeEl.className = 'badge badge-success';
        badgeEl.textContent = `${remainingCredits - duration} hrs remaining`;
      }
    } else {
      const charge = Math.round(room.hourlyRate * duration);
      titleEl.innerHTML = `Total Amount: ₹${charge} • <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">${duration} hr${duration > 1 ? 's' : ''} at ₹${room.hourlyRate}/hr</span>`;
      titleEl.style.color = '#2563eb';
      if (badgeEl) {
        badgeEl.className = 'badge badge-primary';
        badgeEl.textContent = `₹${charge} will be invoiced`;
      }
    }
  },

  openBookModal(preselectedRoomId = null, preselectedTime = null, preselectedStartupId = null) {
    const rooms = window.store.getMeetingRooms();
    const startups = window.store.getStartups();
    const activeFounderId = preselectedStartupId || this.getMyStartupId();
    const activeStartup = startups.find(s => s.id === activeFounderId) || startups[0];
    const initialRoom = rooms.find(r => r.id === preselectedRoomId) || rooms[0];

    // Determine initial session from preselectedTime
    let initialSession = 'morning';
    let initialStartTime = '09:00';
    if (preselectedTime) {
      initialStartTime = preselectedTime;
      const h = parseInt(preselectedTime.split(':')[0], 10);
      initialSession = (h >= 12) ? 'afternoon' : 'morning';
    }

    const html = `
      <div class="modal-overlay active" id="modal-book-room" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-book-room')" style="display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 16px;">
        <div class="modal-content" style="max-width: 580px; width: 100%; border-radius: 20px; overflow: hidden; background: var(--bg-surface); border: 1.5px solid var(--border-medium); box-shadow: 0 25px 60px -12px rgba(0,0,0,0.35);">
          
          <!-- Premium Modal Header -->
          <div style="background: linear-gradient(135deg, #0b2545 0%, #1e3a8a 60%, #2563eb 100%); color: #ffffff; padding: 22px 24px; position: relative;">
            <button type="button" class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-book-room')" style="position: absolute; right: 18px; top: 18px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">✕</button>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd; font-weight: 700;">
              <span>⚡ Nexus Conference System</span> • <span>Conflict-Free Scheduler</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 800; margin: 6px 0 2px 0; color: #ffffff; display: flex; align-items: center; gap: 8px;">
              <span>📅</span> Reserve Meeting Room
            </h2>
            <div style="font-size: 12.5px; color: #bfdbfe;">
              Select session, time window, and lock in your reservation details.
            </div>
          </div>

          <!-- Modal Body -->
          <div style="padding: 22px 24px; max-height: calc(85vh - 120px); overflow-y: auto;">
            <form id="form-book-room" onsubmit="MeetingRoomsModule.handleBookSubmit(event)">
              
              <!-- 2-Column Bento: Room & Reserving Venture -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <!-- Room Selector -->
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 10px 12px;">
                  <label class="form-label" style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
                    <span>🏢</span> Meeting Room <span style="color: #ef4444;">*</span>
                  </label>
                  <select name="roomId" id="book-modal-room-id" class="form-control" style="font-weight: 700; font-size: 12.5px; padding: 6px 8px; border-radius: 8px;" onchange="MeetingRoomsModule.updateModalCostPreview()" required>
                    ${rooms.map(r => `
                      <option value="${r.id}" ${r.id === initialRoom.id ? 'selected' : ''}>
                        ${r.icon} ${r.name} (${r.capacity} Pax • ₹${r.hourlyRate}/hr)
                      </option>
                    `).join('')}
                  </select>
                </div>

                <!-- Venture Selector -->
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 10px 12px;">
                  <label class="form-label" style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
                    <span>👤</span> Reserving Venture <span style="color: #ef4444;">*</span>
                  </label>
                  <select name="startupId" id="book-modal-startup-id" class="form-control" style="font-weight: 700; font-size: 12.5px; padding: 6px 8px; border-radius: 8px;" onchange="MeetingRoomsModule.updateModalCostPreview()" required>
                    ${startups.map(s => {
                      const rem = Math.max(0, (s.includedMeetingHours || 12) - (s.usedMeetingHours || 0));
                      return `
                        <option value="${s.id}" ${s.id === activeStartup.id ? 'selected' : ''}>
                          ${s.name} (${rem}h credits left)
                        </option>
                      `;
                    }).join('')}
                  </select>
                </div>
              </div>

              <!-- Meeting Purpose / Title with Modern Chips -->
              <div style="margin-bottom: 16px;">
                <label class="form-label" style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                  <span>🎯</span> Meeting Title / Agenda <span style="color: #ef4444;">*</span>
                </label>
                <div style="position: relative;">
                  <input type="text" name="title" id="book-meeting-title" class="form-control" style="padding-left: 34px; font-weight: 600; font-size: 13px; border-radius: 10px;" value="Investor Demo & Product Review" placeholder="e.g. Investor Demo & Product Review" required>
                  <span style="position: absolute; left: 11px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.6;">📌</span>
                </div>
                <!-- Quick Agenda Chips -->
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 600;" onclick="MeetingRoomsModule.setModalTitle('Investor Demo & Product Review')">⚡ Investor Demo</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 600;" onclick="MeetingRoomsModule.setModalTitle('Sprint Planning & Tech Sync')">🚀 Sprint Planning</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 600;" onclick="MeetingRoomsModule.setModalTitle('Board Advisory Session')">🏢 Board Advisory</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 600;" onclick="MeetingRoomsModule.setModalTitle('Client Discovery & Demo')">🤝 Client Discovery</button>
                </div>
              </div>

              <!-- Date & Attendees Row -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
                    📅 Reservation Date <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="date" name="date" id="book-modal-date" class="form-control" style="font-weight: 700; font-size: 12.5px; border-radius: 10px;" value="${this.selectedDate}" onchange="MeetingRoomsModule.updateModalCostPreview()" required>
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
                    👥 Expected Attendees <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="number" name="attendees" class="form-control" style="font-weight: 700; font-size: 12.5px; border-radius: 10px;" value="6" min="1" max="50" required>
                </div>
              </div>

              <!-- Operating Session Selector Tabs -->
              <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <label class="form-label" style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin: 0;">
                    ⏰ Dedicated Operating Session <span style="color: #ef4444;">*</span>
                  </label>
                  <span style="font-size: 11px; color: var(--text-muted);">Strict operating policy</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                  <button type="button" id="tab-session-morning" class="btn btn-sm ${initialSession === 'morning' ? 'btn-primary' : 'btn-outline'}" style="font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="MeetingRoomsModule.switchModalSession('morning')">
                    <span>🌅</span> <span>Morning (08:00 – 11:00 AM)</span>
                  </button>
                  <button type="button" id="tab-session-afternoon" class="btn btn-sm ${initialSession === 'afternoon' ? 'btn-primary' : 'btn-outline'}" style="font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="MeetingRoomsModule.switchModalSession('afternoon')">
                    <span>🌆</span> <span>Afternoon (03:00 – 07:00 PM)</span>
                  </button>
                </div>

                <!-- Start & End Time Dropdowns -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <label class="form-label" style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">
                      Start Time
                    </label>
                    <select name="startTime" id="book-start-time" class="form-control" style="font-weight: 700; font-size: 12.5px; border-radius: 8px;" onchange="MeetingRoomsModule.syncEndTime(this.value); MeetingRoomsModule.updateModalCostPreview();" required>
                      <!-- Populated dynamically based on active session -->
                    </select>
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">
                      End Time (Duration)
                    </label>
                    <select name="endTime" id="book-end-time" class="form-control" style="font-weight: 700; font-size: 12.5px; border-radius: 8px;" onchange="MeetingRoomsModule.updateModalCostPreview()" required>
                      <!-- Populated dynamically -->
                    </select>
                  </div>
                </div>

                <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  <span>☕</span> <span>Midday Break: 11:00 AM – 03:00 PM is strictly reserved for cleaning & reset.</span>
                </div>
              </div>

              <!-- Live Cost & Plan Credits Summary Strip -->
              <div id="modal-cost-summary-box" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%); border: 1.5px solid rgba(34, 197, 94, 0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                  <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                    Billing Calculation
                  </div>
                  <div id="modal-cost-summary-title" style="font-size: 13.5px; font-weight: 800; color: #15803d; margin-top: 2px;">
                    Covered by Incubation Plan (₹0)
                  </div>
                </div>
                <div id="modal-credits-remaining-badge" class="badge badge-success" style="font-size: 11.5px; padding: 4px 10px; font-weight: 700;">
                  Plan Credits Active
                </div>
              </div>

              <!-- Footer Buttons -->
              <div style="display: flex; gap: 10px; justify-content: flex-end; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                <button type="button" class="btn btn-secondary" onclick="MeetingRoomsModule.closeModal('modal-book-room')" style="font-weight: 600; padding: 8px 18px; border-radius: 8px; font-size: 12.5px;">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" style="font-weight: 800; padding: 9px 24px; border-radius: 8px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);">
                  <span>🔒 Confirm & Lock In</span> <span>➔</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
    this.switchModalSession(initialSession);
    if (preselectedTime) {
      const startSelect = document.getElementById('book-start-time');
      if (startSelect && [...startSelect.options].some(o => o.value === preselectedTime)) {
        startSelect.value = preselectedTime;
        this.syncEndTime(preselectedTime);
      }
    }
    this.updateModalCostPreview();
  },

  async handleBookSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '<span>🔒 Confirm & Lock In</span> <span>➔</span>';

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const myStartup = this.getMyStartup();
    data.startupName = myStartup.name;

    const roomId = data.roomId;
    const room = window.store.getMeetingRoomById(roomId);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; vertical-align: middle;"></span> Verifying & Locking In...`;
    }

    try {
      // Re-validate availability in background
      await window.store.fetchMeetingRoomsAvailability(data.date || this.selectedDate);
      const freshRoom = window.store.getMeetingRoomById(roomId) || room;
      const recentConflict = (freshRoom.bookings || []).find(b => {
        return window.store.hasBookingConflict({ ...b, roomId }, { roomId, date: data.date, startTime: data.startTime, endTime: data.endTime });
      });

      if (recentConflict) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
        this.closeModal('modal-book-room');
        const alternatives = window.store.findBookingAlternatives({ roomId, date: data.date, startTime: data.startTime, endTime: data.endTime, attendees: data.attendees, startupId: data.startupId });
        this.showConflictAlternativesModal(
          freshRoom,
          data,
          "This slot was just booked by another startup. Pick another time below.",
          alternatives
        );
        return;
      }

      const res = await window.store.bookMeetingRoom(data);
      this.closeModal('modal-book-room');

      if (res.success) {
        App.showToast(`✅ ${res.message}`, 'success');
        this.render();
        if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
          DashboardModule.render();
        }

        const bookedRoom = window.store.getMeetingRoomById(data.roomId) || room;
        if (bookedRoom && res.booking) {
          this.showBookingSuccessModal(bookedRoom, res.booking, myStartup);
        }
      } else {
        const alternatives = res.alternatives || window.store.findBookingAlternatives({ roomId: data.roomId, date: data.date, startTime: data.startTime, endTime: data.endTime, attendees: data.attendees, startupId: data.startupId });
        this.showConflictAlternativesModal(
          room,
          data,
          res.message || "This slot was just booked by another startup. Pick another time below.",
          alternatives
        );
      }
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
      App.showToast(`⚠️ Booking error: ${err.message}`, 'danger');
    }
  },

  openBookingDetailsModal(roomId, bookingId) {
    this.openReservationDetailsModal(roomId, bookingId);
  },

  showConflictAlternativesModal(room, req, message, alternatives = []) {
    const formatSlot12h = (slot24) => {
      if (!slot24) return '';
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const requestedLabel = `${formatSlot12h(req.startTime)} – ${formatSlot12h(req.endTime)} on ${req.date}`;

    const html = `
      <div class="modal-overlay active" id="modal-conflict-alternatives" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-conflict-alternatives')" style="display: flex; align-items: center; justify-content: center; z-index: 1060; padding: 16px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);">
        <div class="modal-content" style="max-width: 540px; width: 100%; border-radius: 20px; overflow: hidden; background: var(--bg-surface); border: 2px solid #ef4444; box-shadow: 0 25px 60px -12px rgba(239, 68, 68, 0.35); animation: scaleUp 0.2s ease;">
          
          <div style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 60%, #dc2626 100%); color: #ffffff; padding: 20px 24px; position: relative;">
            <button type="button" class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-conflict-alternatives')" style="position: absolute; right: 16px; top: 16px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #fecaca; font-weight: 700;">
              <span>⚠️ Scheduling Conflict Prevented</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 800; margin: 6px 0 2px 0; color: #ffffff; display: flex; align-items: center; gap: 8px;">
              <span>🔒</span> Slot Already Reserved
            </h2>
            <div style="font-size: 13px; color: #fee2e2; margin-top: 4px; line-height: 1.4;">
              ${message}
            </div>
          </div>

          <div style="padding: 20px 24px; max-height: calc(85vh - 120px); overflow-y: auto;">
            <div style="background: rgba(239, 68, 68, 0.06); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <div>
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #b91c1c;">Requested Slot:</div>
                <div style="font-size: 13.5px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">
                  🏢 ${room ? room.name : 'Meeting Room'} • ⏰ ${requestedLabel}
                </div>
              </div>
              <span class="badge" style="background: #dc2626; color: #ffffff; font-weight: 800; font-size: 11px; padding: 4px 9px;">Taken 🔒</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <h4 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 6px;">
                <span>✨</span> Recommended Open Alternatives:
              </h4>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">1-tap instant reservation</span>
            </div>

            ${alternatives.length === 0 ? `
              <div style="background: var(--bg-surface-elevated); border: 1.5px dashed var(--border-medium); border-radius: 12px; padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
                No matching alternative slots found for this time window. Please pick another date or view the full schedule.
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px;">
                ${alternatives.map((alt) => {
                  let badgeType = 'Next Free Slot Today';
                  let badgeIcon = '🌅';
                  if (alt.type === 'other_room_same_time') {
                    badgeType = 'Different Room (Same Time)';
                    badgeIcon = '🏢';
                  } else if (alt.type === 'same_room_next_day') {
                    badgeType = 'Tomorrow (Same Time)';
                    badgeIcon = '📅';
                  }

                  const timeDisplay = `${formatSlot12h(alt.startTime)} – ${formatSlot12h(alt.endTime)}`;
                  return `
                    <div class="alt-option-card" style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-medium); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: all 0.15s ease;">
                      <div style="min-width: 0; flex: 1;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                          <span class="badge" style="background: rgba(37, 99, 235, 0.12); color: #2563eb; font-size: 10px; font-weight: 700; padding: 2px 7px;">
                            ${badgeIcon} ${badgeType}
                          </span>
                          <span style="font-size: 11px; color: var(--text-muted);">• ${alt.capacity} Pax</span>
                        </div>
                        <div style="font-size: 13.5px; font-weight: 800; color: var(--text-primary);">
                          ${alt.roomName}
                        </div>
                        <div style="font-size: 12px; color: #16a34a; font-weight: 700; margin-top: 2px; font-family: var(--font-mono);">
                          📅 ${alt.date} • ⏰ ${timeDisplay}
                        </div>
                      </div>

                      <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.quickBookAlternative('${alt.roomId}', '${alt.date}', '${alt.startTime}', '${alt.endTime}', ${req.attendees || 4}, '${encodeURIComponent(req.title || 'Strategic Planning Session')}')" style="background: #16a34a; border-color: #15803d; font-weight: 800; padding: 8px 14px; border-radius: 8px; font-size: 12px; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
                        <span>⚡ Book</span>
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            `}

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn btn-outline" onclick="MeetingRoomsModule.closeModal('modal-conflict-alternatives')" style="font-size: 12px; padding: 7px 16px; border-radius: 8px;">
                Close
              </button>
              <button type="button" class="btn btn-secondary" onclick="MeetingRoomsModule.closeModal('modal-conflict-alternatives'); MeetingRoomsModule.setDate('${req.date}'); MeetingRoomsModule.switchTab('scheduler');" style="font-size: 12px; padding: 7px 16px; border-radius: 8px; font-weight: 700;">
                View All Rooms Grid ➔
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  async quickBookAlternative(roomId, date, startTime, endTime, attendees = 4, encodedTitle = '') {
    const title = decodeURIComponent(encodedTitle || 'Strategic Planning Session');
    const myStartup = this.getMyStartup();
    this.closeModal('modal-conflict-alternatives');

    App.showToast(`⚡ Reserving alternative slot in ${roomId}...`, 'info');

    const res = await window.store.bookMeetingRoom({
      roomId,
      startupId: myStartup.id,
      startupName: myStartup.name,
      title,
      date,
      startTime,
      endTime,
      attendees: Number(attendees) || 4
    });

    if (res.success) {
      this.selectedDate = date;
      this.render();
      if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
        DashboardModule.render();
      }
      const room = window.store.getMeetingRoomById(roomId);
      if (room && res.booking) {
        this.showBookingSuccessModal(room, res.booking, myStartup);
      }
      App.showToast(`🎉 Booked alternative: ${room ? room.name : 'Meeting Room'} (${startTime} - ${endTime})!`, 'success');
    } else {
      App.showToast(`⚠️ Could not book alternative: ${res.message}`, 'danger');
    }
  },

  async cancelBooking(roomId, bookingId) {
    if (!confirm('Are you sure you want to cancel this room reservation? The time slot will immediately become available.')) return;
    const res = await window.store.cancelBooking(roomId, bookingId);
    if (res.success) {
      App.showToast('Reservation successfully cancelled.', 'warning');
      this.render();
      if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
        DashboardModule.render();
      }
    }
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  setMyBookingsViewMode(mode) {
    this.myBookingsViewMode = mode;
    this.render();
  },

  setMyBookingsSearch(q) {
    this.myBookingsSearch = q;
    this.render();
    const searchInput = document.getElementById('my-bookings-search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.value = q;
      searchInput.setSelectionRange(q.length, q.length);
    }
  },

  setMyBookingsStatusFilter(status) {
    this.myBookingsStatusFilter = status;
    this.render();
  },

  setMyBookingsRoomFilter(roomId) {
    this.myBookingsRoomFilter = roomId;
    this.render();
  },

  resetMyBookingsFilters() {
    this.myBookingsSearch = '';
    this.myBookingsStatusFilter = 'all';
    this.myBookingsRoomFilter = 'all';
    this.myBookingsFilterDate = 'all';
    this.render();
  },

  toggleRowMenu(event, menuKey) {
    if (event) {
      event.stopPropagation();
    }
    const targetMenu = document.getElementById(`room-menu-${menuKey}`);
    const isCurrentlyOpen = targetMenu && targetMenu.style.display === 'block';
    this.closeAllRowMenus();
    if (targetMenu && !isCurrentlyOpen) {
      targetMenu.style.display = 'block';
    }
  },

  closeAllRowMenus() {
    document.querySelectorAll('.meeting-row-menu').forEach(menu => {
      menu.style.display = 'none';
    });
  },

  exportMyBookingsCSV() {
    const myStartup = this.getMyStartup();
    const myBookings = this.getMyBookings();
    let csv = 'BookingID,RoomID,RoomName,Capacity,MeetingPurpose,Date,StartTime,EndTime,DurationHours,Session,Attendees,Status,Cost,StartupID,StartupName\n';
    myBookings.forEach(b => {
      const sParts = b.startTime.split(':').map(Number);
      const eParts = b.endTime.split(':').map(Number);
      const dur = Math.max(0.5, ((eParts[0] * 60 + (eParts[1] || 0)) - (sParts[0] * 60 + (sParts[1] || 0))) / 60);
      const session = sParts[0] < 12 ? 'Morning' : 'Afternoon';
      csv += `"${b.id}","${b.roomId}","${b.roomName}",${b.capacity || 10},"${(b.title || '').replace(/"/g, '""')}","${b.date}","${b.startTime}","${b.endTime}",${dur.toFixed(1)},"${session}",${b.attendees},"${b.status || 'Confirmed'}","${b.cost === 0 ? 'Plan Credit' : '₹' + b.cost}","${b.startupId}","${b.startupName}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_my_meeting_room_bookings_${myStartup.id}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof App !== 'undefined') {
      App.showToast(`📥 Exported ${myBookings.length} booking records to CSV!`, 'success');
    }
  },

  printMyBookingsReport() {
    const myStartup = this.getMyStartup();
    const myBookings = this.getMyBookings();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalHours = myBookings.reduce((acc, b) => {
      const sH = parseFloat(b.startTime.split(':')[0]) + parseFloat(b.startTime.split(':')[1] || '0') / 60;
      const eH = parseFloat(b.endTime.split(':')[0]) + parseFloat(b.endTime.split(':')[1] || '0') / 60;
      return acc + Math.max(0.5, eH - sH);
    }, 0);

    const rowsHtml = myBookings.map(b => {
      const sParts = b.startTime.split(':').map(Number);
      const eParts = b.endTime.split(':').map(Number);
      const dur = Math.max(0.5, ((eParts[0] * 60 + (eParts[1] || 0)) - (sParts[0] * 60 + (sParts[1] || 0))) / 60);
      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #2563eb;">${b.id}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">${b.roomName} <span style="font-size: 11px; color: #64748b;">(${b.capacity} Pax)</span></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;"><strong>${b.title}</strong><br><span style="font-size: 11px; color: #64748b;">👥 ${b.attendees} Attendees</span></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${b.date}<br><strong>${b.startTime} - ${b.endTime}</strong></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${dur.toFixed(1)} hrs</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #16a34a; font-weight: bold;">${b.cost === 0 ? 'Plan Credit (₹0)' : '₹' + b.cost}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;"><span style="background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: bold;">Confirmed</span></td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Meeting Room Bookings Feed Report - ${myStartup.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 36px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12.5px; }
          th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; letter-spacing: 0.5px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 22px; }
          .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px; }
          .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🏢 NEXUS COWORKING &amp; INCUBATION HUB</h1>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13.5px;">Official Meeting Room Bookings Feed &amp; Utilization Report</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 800; color: #2563eb;">${myStartup.name}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Venture ID: ${myStartup.id}</div>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px;">Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Total Reservations</div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 3px;">${myBookings.length} Bookings</div>
          </div>
          <div class="stat-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Total Reserved Hours</div>
            <div style="font-size: 20px; font-weight: 800; color: #2563eb; margin-top: 3px;">${totalHours.toFixed(1)} Hours</div>
          </div>
          <div class="stat-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Credit Allowance</div>
            <div style="font-size: 20px; font-weight: 800; color: #16a34a; margin-top: 3px;">${Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0))} hrs free left</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Meeting Space</th>
              <th>Purpose &amp; Attendees</th>
              <th>Date &amp; Timing</th>
              <th style="text-align: center;">Duration</th>
              <th style="text-align: right;">Billing</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
          <span>Nexus Facility Operations &amp; Resource Allocation</span>
          <span>Official Incubation Ledger • Validated ✓</span>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  },

  downloadBookingIcs(bookingId) {
    const b = this.getMyBookings().find(x => x.id === bookingId);
    if (!b) return;
    const cleanDate = b.date.replace(/-/g, '');
    const cleanStart = b.startTime.replace(/:/g, '') + '00';
    const cleanEnd = b.endTime.replace(/:/g, '') + '00';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexus Incubation OS//Meeting Rooms//EN',
      'BEGIN:VEVENT',
      `UID:${b.id}@nexus-hub.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${cleanDate}T${cleanStart}`,
      `DTEND:${cleanDate}T${cleanEnd}`,
      `SUMMARY:${b.title || 'Meeting Room Reservation'} - ${b.roomName}`,
      `DESCRIPTION:Reserved by ${b.startupName} for ${b.attendees} attendees. Booking ID: ${b.id}`,
      `LOCATION:Nexus Coworking & Incubation Hub, ${b.roomName}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_meeting_${b.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof App !== 'undefined') {
      App.showToast(`📅 Downloaded calendar invite for ${b.roomName}!`, 'success');
    }
  },

  printReservationSlip(roomId, bookingId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return;

    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reservation Details - ${booking.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; text-align: center; color: #0f172a; }
          .receipt-card { max-width: 420px; margin: 0 auto; border: 2px dashed #0f172a; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
          h2 { margin: 8px 0 4px; font-size: 20px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #2563eb; color: #fff; font-weight: bold; font-size: 12px; margin: 8px 0; }
          table { width: 100%; text-align: left; margin: 16px 0; font-size: 13px; border-collapse: collapse; }
          td { padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: bold;">Nexus Coworking &amp; Startup Hub</div>
          <h2>${room.icon || '🏢'} ${room.name}</h2>
          <div class="badge">Confirmation ID: ${booking.id}</div>
          <table>
            <tr><td><strong>Venture:</strong></td><td>${booking.startupName}</td></tr>
            <tr><td><strong>Session Title:</strong></td><td>${booking.title}</td></tr>
            <tr><td><strong>Date:</strong></td><td>${booking.date}</td></tr>
            <tr><td><strong>Scheduled Time:</strong></td><td><strong>${booking.startTime} - ${booking.endTime}</strong></td></tr>
            <tr><td><strong>Attendees:</strong></td><td>${booking.attendees} Pax (Capacity: ${room.capacity})</td></tr>
            <tr><td><strong>Status:</strong></td><td><strong style="color: #16a34a;">${booking.status || 'Confirmed'}</strong></td></tr>
          </table>
          <div style="font-size: 10.5px; color: #64748b; margin-top: 10px;">
            Reservation confirmed in system • Nexus Coworking &amp; Startup Hub
          </div>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  printPassSlip(roomId, bookingId) {
    this.printReservationSlip(roomId, bookingId);
  }
};

// Global click listener to close popover row menus
if (typeof window !== 'undefined' && !window.__meetingMenuListenerAttached) {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.meeting-row-menu-wrapper')) {
      if (window.MeetingRoomsModule && window.MeetingRoomsModule.closeAllRowMenus) {
        window.MeetingRoomsModule.closeAllRowMenus();
      }
    }
  });
  window.__meetingMenuListenerAttached = true;
}

window.MeetingRoomsModule = MeetingRoomsModule;
