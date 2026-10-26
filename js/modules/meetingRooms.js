// Module: Meeting Room Scheduling, Capacity Management, My Booked Rooms & Credit Tracking

const MeetingRoomsModule = {
  selectedDate: new Date().toISOString().split('T')[0],
  activeTab: 'scheduler', // 'scheduler' | 'myBookings' | 'allBookings'
  activeStartupFilter: null, // null = defaults to active startup
  myBookingsFilterDate: 'all', // 'all' | 'selected'
  selectedSlotsByRoom: {}, // { [roomId]: ['09:00', '10:00'] }

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

  render() {
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

    rooms.forEach(r => {
      const bList = (r.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled');
      timeSlots.forEach(slot => {
        const curHour = parseInt(slot.split(':')[0], 10);
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
        }
      });
    });

    const availableSlotsCount = Math.max(0, totalSlotsCount - mySlotsCount - otherSlotsCount);
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
            <span>🎟️</span> My Booked Rooms
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
                  <span class="badge" style="background: rgba(37, 99, 235, 0.15); color: #1d4ed8; border: 1px solid rgba(37, 99, 235, 0.4); font-size: 11.5px; padding: 3px 9px; font-weight: 700; cursor: pointer;" onclick="MeetingRoomsModule.openPassModal('${b.roomId}', '${b.id}')" title="Click to view digital pass">
                    🏢 ${b.roomName}: ⏰ ${b.startTime} - ${b.endTime} (${b.title}) ➔ Pass
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

      <!-- Unified Modern Scheduler Toolbar (Operating Windows + Status Legend) -->
      <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 14px; padding: 12px 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
        <!-- Windows -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px;">
            <span>⏰</span> Operating Windows:
          </span>
          <span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.35); font-weight: 700; font-size: 11.5px; padding: 4px 12px; border-radius: 999px;">
            🌅 Morning: 08:00 – 11:00 AM
          </span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; padding: 4px 10px; background: var(--bg-surface); border-radius: 6px; border: 1px solid var(--border-subtle);">
            ☕ 11:00 AM – 03:00 PM Break
          </span>
          <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #4338ca; border: 1px solid rgba(99, 102, 241, 0.35); font-weight: 700; font-size: 11.5px; padding: 4px 12px; border-radius: 999px;">
            🌆 Afternoon: 03:00 – 07:00 PM
          </span>
        </div>

        <!-- Legend & Realtime Summary -->
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.6);"></span>
            <span style="color: #15803d; font-weight: 800;">${availableSlotsCount} Available</span>
          </div>
          <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb; box-shadow: 0 0 6px rgba(37,99,235,0.6);"></span>
            <span style="color: #1d4ed8; font-weight: 800;">${mySlotsCount} Reserved (Mine)</span>
          </div>
          <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span>
            <span style="color: var(--text-muted); font-weight: 600;">${otherSlotsCount} Booked</span>
          </div>
          <div style="font-size: 11.5px; font-family: var(--font-mono); font-weight: 700; color: var(--text-secondary); background: var(--bg-surface); padding: 4px 12px; border-radius: 999px; border: 1px solid var(--border-subtle); margin-left: 2px;">
            📅 ${this.selectedDate}
          </div>
        </div>
      </div>

      <!-- Room Cards Grid -->
      <div class="grid-2col" style="margin-bottom: 26px;">
        ${rooms.map(r => this.renderRoomCard(r, myStartup)).join('')}
      </div>

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
    `;
  },

  renderMyBookingsView({ myStartup, myBookings }) {
    let list = [...myBookings];
    if (this.myBookingsFilterDate === 'selected') {
      list = list.filter(b => b.date === this.selectedDate);
    }

    const totalHours = list.reduce((acc, b) => {
      const sH = parseFloat(b.startTime.split(':')[0]) + parseFloat(b.startTime.split(':')[1] || '0') / 60;
      const eH = parseFloat(b.endTime.split(':')[0]) + parseFloat(b.endTime.split(':')[1] || '0') / 60;
      return acc + Math.max(1, eH - sH);
    }, 0);

    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));

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
              <span>Across Nexus Conference & Boardrooms</span>
            </div>
          </div>

          <div class="kpi-card" style="padding: 16px; border: 1.5px solid var(--border-subtle);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Total Hours Booked</span>
              <div class="kpi-icon-wrap" style="color: #38bdf8;">⏰</div>
            </div>
            <div class="kpi-value" style="font-size: 26px; font-weight: 800; color: var(--text-primary);">${totalHours} Hours</div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>${list.length} sessions scheduled</span>
            </div>
          </div>

          <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(34, 197, 94, 0.3);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Monthly Credit Balance</span>
              <div class="kpi-icon-wrap" style="color: #16a34a;">💳</div>
            </div>
            <div class="kpi-value" style="font-size: 26px; font-weight: 800; color: #16a34a;">${remainingCredits} hrs free</div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>Included in Incubation Plan</span>
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
              ${myStartup.id}
            </div>
          </div>
        </div>

        <!-- Filter Sub-bar for My Bookings -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-elevated); padding: 10px 16px; border-radius: 12px; border: 1px solid var(--border-subtle); margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">Filter by Schedule:</span>
            <button class="btn btn-sm ${this.myBookingsFilterDate === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setMyBookingsFilter('all')" style="border-radius: 999px; font-size: 11.5px; padding: 4px 12px;">
              All Upcoming (${myBookings.length})
            </button>
            <button class="btn btn-sm ${this.myBookingsFilterDate === 'selected' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setMyBookingsFilter('selected')" style="border-radius: 999px; font-size: 11.5px; padding: 4px 12px;">
              Only Selected Date (${this.selectedDate})
            </button>
          </div>

          <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openBookModal()" style="font-weight: 700; border-radius: 6px; padding: 6px 14px;">
            + Book Another Room
          </button>
        </div>

        <!-- My Booked Rooms Cards Grid -->
        ${list.length === 0 ? `
          <div style="background: var(--bg-surface); border: 2px dashed var(--border-medium); border-radius: 16px; padding: 48px 24px; text-align: center;">
            <div style="font-size: 42px; margin-bottom: 12px;">📅</div>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">No Rooms Booked for ${myStartup.name}</h3>
            <p style="font-size: 13.5px; color: var(--text-secondary); max-width: 460px; margin: 0 auto 18px auto;">
              You haven't reserved any meeting rooms for ${this.myBookingsFilterDate === 'selected' ? this.selectedDate : 'the upcoming period'}. Book an executive boardroom or presentation arena with zero conflict.
            </p>
            <button class="btn btn-primary" onclick="MeetingRoomsModule.openBookModal(null, null, '${myStartup.id}')" style="font-weight: 700; padding: 8px 22px; border-radius: 8px;">
              + Reserve a Meeting Room Now
            </button>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
            ${list.map(b => `
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

                <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
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
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-primary" onclick="MeetingRoomsModule.openPassModal('${b.roomId}', '${b.id}')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                      <span>🎫</span> View Pass
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
    `;
  },

  renderAllBookingsView({ allBookings, myStartup }) {
    return `
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <div style="padding: 16px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">
              📋 All Confirmed Meeting Room Reservations (${allBookings.length})
            </h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">
              Production database records across all incubator ventures and meeting spaces.
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
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">Date & Time Window</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: center; white-space: nowrap;">Attendees</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">Billing / Credits</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: right; white-space: nowrap;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${allBookings.length === 0 ? `
                <tr><td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted);">No reservations recorded in database</td></tr>
              ` : allBookings.map(b => {
                const isMine = b.startupId === myStartup.id;
                return `
                  <tr style="border-bottom: 1px solid var(--border-subtle); background: ${isMine ? 'rgba(37, 99, 235, 0.04)' : 'transparent'};">
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${b.roomIcon || '🏢'}</span>
                        <strong style="color: var(--text-primary);">${b.roomName}</strong>
                      </div>
                    </td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <span class="badge ${isMine ? 'badge-primary' : 'badge-subtle'}" style="font-weight: 700; white-space: nowrap;">
                        ${b.startupName} ${isMine ? '★ (You)' : ''}
                      </span>
                    </td>
                    <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary); min-width: 170px;">${b.title}</td>
                    <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: 11.5px; white-space: nowrap;">
                      📅 ${b.date} • <strong style="color: #2563eb; white-space: nowrap;">${b.startTime} - ${b.endTime}</strong>
                    </td>
                    <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">${b.attendees} Pax</td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      ${b.cost === 0 ? '<span style="color: #16a34a; font-weight: 700; white-space: nowrap;">Covered by Plan (₹0)</span>' : `<span style="white-space: nowrap;">₹${b.cost}</span>`}
                    </td>
                    <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
                      <div style="display: inline-flex; gap: 6px; align-items: center; white-space: nowrap;">
                        <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px; color: #2563eb; border-color: rgba(37,99,235,0.4); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;" onclick="MeetingRoomsModule.openPassModal('${b.roomId}', '${b.id}')">
                          <span>🎫</span><span>Pass</span>
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
    this.selectedDate = date;
    this.render();
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

  lockInSelectedSlots(roomId) {
    if (!this.selectedSlotsByRoom || !this.selectedSlotsByRoom[roomId]) return;
    const slots = [...this.selectedSlotsByRoom[roomId]].sort();
    if (!slots.length) return;

    const startTime = slots[0];
    const lastSlot = slots[slots.length - 1];
    const lastH = parseInt(lastSlot.split(':')[0], 10) + 1;
    const endTime = `${lastH < 10 ? '0' : ''}${lastH}:00`;

    const myStartup = this.getMyStartup();
    const titleInput = document.getElementById(`lockin-title-${roomId}`);
    const title = (titleInput && titleInput.value.trim()) || 'Strategic Review & Team Sprint';

    const res = window.store.bookMeetingRoom({
      roomId,
      startupId: myStartup.id,
      title,
      date: this.selectedDate,
      startTime,
      endTime,
      attendees: 4
    });

    if (res.success) {
      App.showToast(`🔒 Locked In! Reserved ${startTime} – ${endTime} for ${myStartup.name}`, 'success');
      delete this.selectedSlotsByRoom[roomId];
      this.render();
      if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
        DashboardModule.render();
      }

      // Show the requested "Successfully Booked Room" confirmation modal
      const rooms = window.store.getMeetingRooms();
      const bookedRoom = rooms.find(r => r.id === roomId);
      if (bookedRoom && res.booking) {
        this.showBookingSuccessModal(bookedRoom, res.booking, myStartup);
      }
    } else {
      App.showToast(`⚠️ ${res.message}`, 'danger');
    }
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
      <div class="modal-overlay active" id="modal-booking-success" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-booking-success')" style="z-index: 1060; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); padding: 20px; animation: fadeIn 0.2s ease;">
        <div class="modal-content" style="max-width: 520px; width: 100%; border-radius: 22px; background: var(--bg-surface); border: 1.5px solid rgba(34, 197, 94, 0.4); overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6); animation: scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);">
          
          <!-- Celebratory Header Banner -->
          <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%); color: #ffffff; padding: 28px 24px 22px 24px; text-align: center; position: relative;">
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-booking-success')" style="position: absolute; right: 16px; top: 16px; color: #ffffff; background: rgba(255,255,255,0.15); border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s;">&times;</button>
            
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #22c55e; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.25), 0 8px 24px rgba(34, 197, 94, 0.5); margin-bottom: 12px;">
              ✓
            </div>
            
            <h2 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 4px 0; letter-spacing: -0.01em;">
              Room Successfully Booked!
            </h2>
            <p style="font-size: 13px; color: #a7f3d0; margin: 0;">
              Your reservation is confirmed & synced to the door display tablet.
            </p>
          </div>

          <!-- Booking Summary Card -->
          <div style="padding: 22px 24px;">
            <!-- Room Info Card -->
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 14px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(34, 197, 94, 0.12); border: 1.5px solid rgba(34, 197, 94, 0.35); display: flex; align-items: center; justify-content: center; font-size: 22px;">
                  ${room.icon || '🏢'}
                </div>
                <div>
                  <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0;">${room.name}</h3>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                    👥 ${room.capacity} Pax Capacity • ₹${room.hourlyRate}/hr
                  </div>
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 11px; padding: 4px 10px; font-weight: 800;">
                ● Locked In
              </span>
            </div>

            <!-- Bento Details Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 14px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  📅 Date
                </div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">
                  ${formattedDate}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 14px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  ⏰ Time Window
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #2563eb; margin-top: 4px; font-family: var(--font-mono);">
                  ${formatSlot12h(booking.startTime)} – ${formatSlot12h(booking.endTime)}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 14px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  🎯 Meeting Agenda
                </div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${booking.title}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 14px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  💳 Billing / Plan
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #16a34a; margin-top: 4px;">
                  ${booking.cost === 0 ? 'Covered by Plan (₹0)' : `₹${booking.cost}`}
                </div>
              </div>
            </div>

            <!-- Smart Keypad Door Access PIN Strip -->
            <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%); border: 1.5px dashed rgba(37, 99, 235, 0.4); border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div>
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #1d4ed8;">
                  🔑 Smart Door Keypad PIN
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                  Enter on the Condeco tablet keypad outside ${room.name}
                </div>
              </div>
              <div style="font-family: var(--font-mono); font-size: 18px; font-weight: 900; letter-spacing: 0.2em; color: #1e40af; background: var(--bg-surface); padding: 4px 14px; border-radius: 8px; border: 1px solid rgba(37, 99, 235, 0.25);">
                * ${pinDigits} #
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openKioskModal('${room.id}'); MeetingRoomsModule.closeModal('modal-booking-success');" style="font-weight: 700; padding: 8px 14px; border-radius: 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">
                <span>📱</span> Door Tablet View
              </button>
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openPassModal('${room.id}', '${booking.id}'); MeetingRoomsModule.closeModal('modal-booking-success');" style="font-weight: 700; padding: 8px 14px; border-radius: 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px; color: #2563eb; border-color: rgba(37, 99, 235, 0.35);">
                <span>🎫</span> Digital Pass
              </button>
              <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.closeModal('modal-booking-success')" style="font-weight: 800; padding: 8px 20px; border-radius: 8px; font-size: 12px; background: #16a34a; border-color: #15803d; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
                ✓ Done
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const mount = document.getElementById('modal-mount');
    if (mount) {
      mount.insertAdjacentHTML('beforeend', html);
    }
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

    let myBookedHours = 0;
    let otherBookedHours = 0;

    timeSlots.forEach(slot => {
      const curHour = parseInt(slot.split(':')[0], 10);
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
      }
    });

    const totalBookedHours = myBookedHours + otherBookedHours;
    const isFullyBooked = (totalBookedHours === timeSlots.length);
    const hasMyBookings = myBookedHours > 0;
    const availableHours = timeSlots.length - totalBookedHours;

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

    // Calculate intelligent real-time operating availability
    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const liveTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const isToday = (this.selectedDate === todayStr);

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

    if (isToday) {
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

      if (booked) {
        const isMine = booked.startupId === myStartup.id || (booked.startupName && booked.startupName.toLowerCase() === myStartup.name.toLowerCase());
        if (isMine) {
          return `
            <div class="clear-slot-card mine" 
                 onclick="MeetingRoomsModule.openPassModal('${room.id}', '${booked.id}')"
                 title="Reserved by Your Team (${timeRangeLabel}) • Click to view Door Pass">
              <div class="slot-time">${timeRangeLabel}</div>
              <div class="slot-status">🎟️ Your Team (Pass)</div>
            </div>
          `;
        } else {
          return `
            <div class="clear-slot-card booked" 
                 onclick="App.showToast('Slot booked: ${booked.title} (${booked.startupName})', 'warning')"
                 title="Reserved by ${booked.startupName || 'Startup'} (${timeRangeLabel})">
              <div class="slot-time">${timeRangeLabel}</div>
              <div class="slot-status">🔒 ${booked.startupName || 'Reserved'}</div>
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
              ${isSelected ? '✓ Selected' : `🟢 Open • ₹${room.hourlyRate}`}
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
        <div class="lockin-action-bar" style="background: rgba(16, 185, 129, 0.16); border: 1.5px solid rgba(16, 185, 129, 0.55); color: #ffffff; margin-top: 10px; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div style="min-width: 0; flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 13px; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 5px;">
                <span>🔒</span> <span>Lock In:</span> <strong style="color: #4ade80; font-family: var(--font-mono);">${formatSlot12h(startSlot)} – ${formatSlot12h(endSlotStr)}</strong> <span style="color: #cbd5e1; font-size: 11px;">(${duration} hr${duration > 1 ? 's' : ''})</span>
              </span>
              <span class="badge ${isCovered ? 'badge-success' : 'badge-primary'}" style="font-size: 10.5px; padding: 2px 8px; font-weight: 700;">
                ${costBadge}
              </span>
            </div>
            <div style="margin-top: 8px;">
              <input type="text" id="lockin-title-${room.id}" class="form-control" style="font-size: 12px; padding: 6px 12px; height: 32px; width: 100%; max-width: 320px; background: rgba(0,0,0,0.35); color: #ffffff; border-color: rgba(255,255,255,0.22); border-radius: 6px;" placeholder="Meeting title / agenda..." value="Executive Strategy & Client Sprint">
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.clearSlotSelection('${room.id}')" style="font-size: 11.5px; padding: 6px 12px; border-radius: 6px; color: #cbd5e1; border-color: rgba(255,255,255,0.25);" title="Clear selection">
              ✕ Cancel
            </button>
            <button class="btn btn-sm" onclick="MeetingRoomsModule.lockInSelectedSlots('${room.id}')" style="font-size: 12px; font-weight: 800; padding: 7px 16px; border-radius: 8px; background: #22c55e; color: #ffffff; border: 1px solid #16a34a; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.45);" title="Lock in this reservation immediately">
              <span>🔒</span> <span>Lock In Now</span>
            </button>
          </div>
        </div>
      `;
    }

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
                <span class="exec-pill-badge">₹${room.hourlyRate}/hr</span>
                <span style="font-size: 11px; color: ${statusType === 'available' ? '#4ade80' : '#cbd5e1'}; font-weight: 700;">
                  ${availableHours} of 7 Slots Open
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

        <!-- Date Navigation Bar (Prev / Next & Quick Selectors) -->
        <div class="clear-date-bar">
          <div class="clear-date-nav">
            <button type="button" class="clear-date-btn" onclick="MeetingRoomsModule.cycleDate(-1)" title="Previous day">‹ Prev Day</button>
            <div style="font-size: 12.5px; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 6px;">
              <span>📅</span>
              <span>${formattedDateStr}</span>
              ${isToday ? `<span class="badge badge-success" style="font-size: 10px; padding: 1px 6px;">Today</span>` : isTomorrow ? `<span class="badge badge-info" style="font-size: 10px; padding: 1px 6px;">Tomorrow</span>` : ''}
            </div>
            <button type="button" class="clear-date-btn" onclick="MeetingRoomsModule.cycleDate(1)" title="Next day">Next Day ›</button>
          </div>

          <div class="clear-date-quick-chips">
            <button type="button" class="clear-chip-btn ${isToday ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${todayStr}')">Today</button>
            <button type="button" class="clear-chip-btn ${isTomorrow ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${tomorrowStr}')">Tomorrow</button>
          </div>
        </div>

        <!-- The Clear Way: Intuitive Time Slots Grid -->
        <div class="clear-sessions-wrap">
          <!-- Morning Session -->
          <div class="clear-session-block">
            <div class="clear-session-header">
              <div class="clear-session-title">
                <span>🌅</span>
                <span>Morning Session</span>
              </div>
              <span class="clear-session-hours">08:00 AM – 11:00 AM</span>
            </div>
            <div class="clear-slots-grid">
              ${morningSlots.map(renderSlotCard).join('')}
            </div>
          </div>

          <!-- Afternoon Session -->
          <div class="clear-session-block">
            <div class="clear-session-header">
              <div class="clear-session-title">
                <span>🌆</span>
                <span>Afternoon Session</span>
              </div>
              <span class="clear-session-hours">03:00 PM – 07:00 PM</span>
            </div>
            <div class="clear-slots-grid">
              ${afternoonSlots.map(renderSlotCard).join('')}
            </div>
          </div>
        </div>

        <!-- Inline Lock-In Strip (Slides down when slot selected) -->
        ${lockInBarHtml}

        <!-- Amenities Chips & Quick Actions Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            ${room.amenities.map(a => `
              <span class="amenity-tag" style="background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); color: #cbd5e1; font-size: 10.5px; padding: 2px 7px;">
                <span>${getAmenityIcon(a)}</span> <span>${a}</span>
              </span>
            `).join('')}
          </div>

          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openKioskModal('${room.id}')" style="font-size: 11px; padding: 5px 11px; border-radius: 6px; color: #cbd5e1; border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.05);" title="View 1:1 Wall-Mounted Tablet Kiosk">
              <span>📱</span> Door Tablet
            </button>
            <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openBookModal('${room.id}', null, '${myStartup.id}')" style="font-size: 11px; font-weight: 700; padding: 5px 13px; border-radius: 6px;">
              <span>+</span> Custom Book
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
                      <button class="btn btn-outline btn-sm" style="font-size: 11.5px; padding: 4px 10px; color: #2563eb; border-color: rgba(37,99,235,0.4); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; line-height: 1; flex-shrink: 0;" onclick="MeetingRoomsModule.openPassModal('${b.roomId}', '${b.id}')">
                        <span>🎫</span><span>Pass</span>
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

  openPassModal(roomId, bookingId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return;

    const html = `
      <div class="modal-overlay active" id="modal-room-door-pass" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-room-door-pass')" style="z-index: 1050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); padding: 20px;">
        <div class="modal-content" style="max-width: 480px; width: 100%; border-radius: 18px; background: var(--bg-surface); border: 1px solid var(--border-subtle); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Pass Top Banner -->
          <div style="background: linear-gradient(135deg, #0b2545 0%, #001f54 60%, #1d4ed8 100%); color: #ffffff; padding: 22px 24px; position: relative;">
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-room-door-pass')" style="position: absolute; right: 16px; top: 16px; color: #ffffff; background: rgba(255,255,255,0.15); border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 16px; cursor: pointer;">&times;</button>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #93c5fd; font-weight: 700;">
              <span>⚡ Nexus Incubation OS</span> • <span>Digital Entry Pass</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 0 0; color: #ffffff; display: flex; align-items: center; gap: 8px;">
              <span>${room.icon || '🏢'}</span> ${room.name}
            </h2>
            <div style="font-size: 12px; color: #bfdbfe; margin-top: 3px;">
              ${room.capacity} Pax Capacity • Smart Glass & Cisco Access Enabled
            </div>
          </div>

          <!-- Pass Details Body -->
          <div style="padding: 24px;">
            <div style="background: var(--bg-surface-elevated); border: 1.5px dashed var(--border-medium); border-radius: 14px; padding: 18px; margin-bottom: 20px; text-align: center;">
              
              <!-- QR Code Mockup -->
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 130px; height: 130px; background: #ffffff; border-radius: 12px; padding: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); margin-bottom: 12px; border: 1px solid #e2e8f0;">
                <svg width="114" height="114" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- QR Code Pattern -->
                  <rect width="100" height="100" fill="white"/>
                  <rect x="10" y="10" width="25" height="25" fill="#0f172a"/>
                  <rect x="15" y="15" width="15" height="15" fill="white"/>
                  <rect x="18" y="18" width="9" height="9" fill="#0f172a"/>
                  <rect x="65" y="10" width="25" height="25" fill="#0f172a"/>
                  <rect x="70" y="15" width="15" height="15" fill="white"/>
                  <rect x="73" y="18" width="9" height="9" fill="#0f172a"/>
                  <rect x="10" y="65" width="25" height="25" fill="#0f172a"/>
                  <rect x="15" y="70" width="15" height="15" fill="white"/>
                  <rect x="18" y="73" width="9" height="9" fill="#0f172a"/>
                  <rect x="42" y="12" width="6" height="16" fill="#0f172a"/>
                  <rect x="52" y="18" width="6" height="18" fill="#0f172a"/>
                  <rect x="42" y="42" width="16" height="16" fill="#2563eb"/>
                  <rect x="65" y="42" width="8" height="14" fill="#0f172a"/>
                  <rect x="78" y="42" width="12" height="6" fill="#0f172a"/>
                  <rect x="42" y="65" width="14" height="10" fill="#0f172a"/>
                  <rect x="62" y="65" width="10" height="25" fill="#0f172a"/>
                  <rect x="78" y="65" width="12" height="25" fill="#0f172a"/>
                </svg>
              </div>

              <div style="font-family: var(--font-mono); font-size: 13px; font-weight: 800; color: #2563eb; letter-spacing: 0.05em;">
                ENTRY PIN: NX-${booking.id.replace('BKG-', '')}
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
                Scan QR or enter PIN at the boardroom door console
              </div>
            </div>

            <!-- Booking Metadata Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px; margin-bottom: 20px;">
              <div>
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Reserving Venture</div>
                <div style="font-weight: 700; color: var(--text-primary); margin-top: 2px;">${booking.startupName}</div>
              </div>
              <div>
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Session Date</div>
                <div style="font-weight: 700; color: var(--text-primary); margin-top: 2px;">📅 ${booking.date}</div>
              </div>
              <div>
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Time Slot Window</div>
                <div style="font-weight: 800; color: #2563eb; font-family: var(--font-mono); margin-top: 2px;">⏰ ${booking.startTime} - ${booking.endTime}</div>
              </div>
              <div>
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Attendees Expected</div>
                <div style="font-weight: 700; color: var(--text-primary); margin-top: 2px;">👥 ${booking.attendees} Pax</div>
              </div>
            </div>

            <div style="background: var(--bg-surface-elevated); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 20px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Session Agenda</div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${booking.title}</div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button class="btn btn-outline" onclick="window.print()" style="font-weight: 600; font-size: 12.5px; border-radius: 8px;">
                🖨️ Print Pass
              </button>
              <button class="btn btn-primary" onclick="MeetingRoomsModule.closeModal('modal-room-door-pass')" style="font-weight: 700; font-size: 12.5px; border-radius: 8px;">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
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
    const isMorning = (startMin < 12 * 60);

    const maxEndMin = isMorning ? (11 * 60) : (19 * 60);
    const endSlots = [];

    for (let cur = startMin + 30; cur <= maxEndMin; cur += 30) {
      const curH = Math.floor(cur / 60);
      const curM = cur % 60;
      const val = `${curH < 10 ? '0' : ''}${curH}:${curM < 10 ? '0' : ''}${curM}`;
      const duration = (cur - startMin) / 60;
      const displayHour = curH > 12 ? (curH - 12) : curH;
      const period = curH >= 12 ? 'PM' : 'AM';
      const label = `${val} (${displayHour}:${curM < 10 ? '0' : ''}${curM} ${period} • ${duration} hr${duration > 1 ? 's' : ''})`;
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
              Select session, time window, and lock in with instant digital door pass.
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

  handleBookSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    const res = window.store.bookMeetingRoom(data);
    this.closeModal('modal-book-room');

    if (res.success) {
      App.showToast(`✅ ${res.message}`, 'success');
      this.render();
      if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
        DashboardModule.render();
      }

      const rooms = window.store.getMeetingRooms();
      const bookedRoom = rooms.find(r => r.id === data.roomId);
      const myStartup = this.getMyStartup();
      if (bookedRoom && res.booking) {
        this.showBookingSuccessModal(bookedRoom, res.booking, myStartup);
      }
    } else {
      App.showToast(`⚠️ ${res.message}`, 'danger');
    }
  },

  cancelBooking(roomId, bookingId) {
    if (!confirm('Are you sure you want to cancel this room reservation? The time slot will immediately become available.')) return;
    const res = window.store.cancelBooking(roomId, bookingId);
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
  }
};

window.MeetingRoomsModule = MeetingRoomsModule;
