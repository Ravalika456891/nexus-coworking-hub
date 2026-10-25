// Module: Meeting Room Scheduling, Capacity Management, My Booked Rooms & Credit Tracking

const MeetingRoomsModule = {
  selectedDate: new Date().toISOString().split('T')[0],
  activeTab: 'scheduler', // 'scheduler' | 'myBookings' | 'allBookings'
  activeStartupFilter: null, // null = defaults to active startup
  myBookingsFilterDate: 'all', // 'all' | 'selected'

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

  renderRoomCard(room, myStartup) {
    const morningSlots = ['08:00', '09:00', '10:00'];
    const afternoonSlots = ['15:00', '16:00', '17:00', '18:00'];
    const timeSlots = [...morningSlots, ...afternoonSlots];
    const bookings = (room.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled');

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

    const accentColor = isFullyBooked ? '#ef4444' : (hasMyBookings ? '#2563eb' : '#10b981');

    const formatSlot12h = (slot24) => {
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

    let roomStatusBadge = '';
    if (isFullyBooked) {
      roomStatusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.35); font-weight: 700; font-size: 11px; padding: 3px 9px; border-radius: 999px;">🔴 Fully Booked</span>`;
    } else if (hasMyBookings) {
      roomStatusBadge = `<span class="badge" style="background: rgba(37, 99, 235, 0.12); color: #1d4ed8; border: 1px solid rgba(37, 99, 235, 0.4); font-weight: 700; font-size: 11px; padding: 3px 9px; border-radius: 999px;">🔵 You Booked (${myBookedHours}h)</span>`;
    } else {
      roomStatusBadge = `<span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.35); font-weight: 700; font-size: 11px; padding: 3px 9px; border-radius: 999px;">🟢 ${availableHours} Slots Open</span>`;
    }

    const renderSlotBtn = (slot) => {
      const curHour = parseInt(slot.split(':')[0], 10);
      const booked = bookings.find(b => {
        const bHour = parseInt(b.startTime.split(':')[0], 10);
        const eHour = parseInt(b.endTime.split(':')[0], 10);
        return curHour >= bHour && curHour < eHour;
      });

      const label = formatSlot12h(slot);
      const isMyBooking = booked && (booked.startupId === myStartup.id || (booked.startupName && booked.startupName.toLowerCase() === myStartup.name.toLowerCase()));

      if (booked) {
        if (isMyBooking) {
          return `
            <div class="slot-btn my-booking" 
                 onclick="MeetingRoomsModule.openPassModal('${room.id}', '${booked.id}')" 
                 title="🔵 Booked by You (${myStartup.name}): ${booked.title} (${booked.startTime} - ${booked.endTime}) • Click for Digital Door Pass">
              <span>🎟️</span> <span>${label}</span> <span style="font-size: 9.5px; opacity: 0.9; font-weight: 800;">(Mine)</span>
            </div>
          `;
        } else {
          return `
            <div class="slot-btn booked" 
                 onclick="App.showToast('Already Reserved: ${room.name} at ${label} is booked by ${booked.startupName} (${booked.title})', 'warning')" 
                 title="🔒 Reserved by ${booked.startupName}: ${booked.title} (${booked.startTime} - ${booked.endTime})">
              <span>🔒</span> <span style="text-decoration: line-through; opacity: 0.8;">${label}</span>
            </div>
          `;
        }
      } else {
        return `
          <div class="slot-btn available" 
               onclick="MeetingRoomsModule.openBookModal('${room.id}', '${slot}', '${myStartup.id}')" 
               title="🟢 Available: Click to reserve ${room.name} at ${label} for ${myStartup.name}">
            <span>🟢</span> <span>${label}</span>
          </div>
        `;
      }
    };

    return `
      <div class="room-card" style="border-top: 3.5px solid ${accentColor};">
        <!-- Room Header & Metadata -->
        <div class="room-header">
          <div style="display: flex; gap: 12px; align-items: center; min-width: 0;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, var(--bg-surface-elevated), rgba(99, 102, 241, 0.08)); border: 1.5px solid var(--border-medium); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; box-shadow: var(--shadow-sm);">
              ${room.icon}
            </div>
            <div style="min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h3 style="font-size: 16.5px; font-weight: 800; color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${room.name}</h3>
                ${roomStatusBadge}
              </div>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                <span class="badge badge-subtle" style="font-size: 11px; padding: 2px 7px; font-weight: 600;">
                  👥 ${room.capacity} Pax Capacity
                </span>
                <span class="badge" style="background: rgba(11, 8, 38, 0.04); border: 1px solid var(--border-subtle); color: var(--text-primary); font-size: 11px; padding: 2px 7px; font-weight: 700;">
                  ₹${room.hourlyRate}/hr
                </span>
              </div>
            </div>
          </div>
          <div>
            ${isFullyBooked ? `
              <button class="btn btn-outline btn-sm" disabled style="opacity: 0.55; border-color: rgba(239, 68, 68, 0.4); color: #dc2626; cursor: not-allowed; font-weight: 700; padding: 6px 12px; font-size: 11.5px; border-radius: 8px;">
                Full Today
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openBookModal('${room.id}', null, '${myStartup.id}')" style="font-weight: 700; padding: 6px 14px; font-size: 11.5px; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;" title="Reserve ${room.name} for ${myStartup.name}">
                <span>+</span> Reserve Room
              </button>
            `}
          </div>
        </div>

        <!-- Amenities Chips -->
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${room.amenities.map(a => `
            <span class="amenity-tag" title="${a}">
              <span>${getAmenityIcon(a)}</span> <span>${a}</span>
            </span>
          `).join('')}
        </div>

        <!-- Integrated Operating Windows & Time Slots Grid -->
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 14px;">
          <!-- Morning Session (08:00 - 11:00 AM) -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #b45309; display: inline-flex; align-items: center; gap: 5px;">
              <span>🌅</span> Morning Session (08:00 – 11:00 AM)
            </span>
            <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 600;">3 Slots</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px;">
            ${morningSlots.map(s => renderSlotBtn(s)).join('')}
          </div>

          <!-- Midday Break Divider -->
          <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0; color: var(--text-muted); font-size: 10.5px; font-weight: 600;">
            <span style="flex: 1; height: 1px; background: var(--border-subtle);"></span>
            <span>☕ 11:00 AM – 03:00 PM Break</span>
            <span style="flex: 1; height: 1px; background: var(--border-subtle);"></span>
          </div>

          <!-- Afternoon Session (03:00 - 07:00 PM) -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #4338ca; display: inline-flex; align-items: center; gap: 5px;">
              <span>🌆</span> Afternoon Session (03:00 – 07:00 PM)
            </span>
            <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 600;">4 Slots</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px;">
            ${afternoonSlots.map(s => renderSlotBtn(s)).join('')}
          </div>
        </div>

        <!-- Quick Hint Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 4px; font-size: 11px; color: var(--text-muted);">
          <span>💡 Click any open green slot to book</span>
          <span style="font-weight: 600;">
            ${hasMyBookings ? `<span style="color: #2563eb; font-weight: 700;">🔵 ${myBookedHours}h Mine</span> • ` : ''}
            <span style="color: #15803d; font-weight: 700;">🟢 ${availableHours} of ${timeSlots.length} Open</span>
          </span>
        </div>
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
  },

  openBookModal(preselectedRoomId = null, preselectedTime = null, preselectedStartupId = null) {
    const rooms = window.store.getMeetingRooms();
    const startups = window.store.getStartups();
    const activeFounderId = preselectedStartupId || this.getMyStartupId();
    const { allStarts } = this.generateStartSlots();

    // Default start time: prefer preselected if valid, else 09:00
    let defaultStartTime = preselectedTime;
    if (!defaultStartTime || !allStarts.some(s => s.value === defaultStartTime)) {
      defaultStartTime = '09:00';
    }

    const validEndSlots = this.getValidEndSlots(defaultStartTime);
    const defaultEndTime = validEndSlots.length > 1 ? validEndSlots[1].value : (validEndSlots[0] ? validEndSlots[0].value : '11:00');

    const html = `
      <div class="modal-overlay active" id="modal-book-room">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">📅 Reserve Meeting Room</h3>
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-book-room')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="form-book-room" onsubmit="MeetingRoomsModule.handleBookSubmit(event)">
              <div class="form-group">
                <label class="form-label">Meeting Room <span class="required-star">*</span></label>
                <select name="roomId" class="form-control" required>
                  ${rooms.map(r => `
                    <option value="${r.id}" ${preselectedRoomId === r.id ? 'selected' : ''}>
                      ${r.name} (${r.capacity} Pax • ₹${r.hourlyRate}/hr)
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Reserving Startup <span class="required-star">*</span></label>
                <select name="startupId" class="form-control" required>
                  ${startups.map(s => {
                    const isSelected = s.id === activeFounderId;
                    return `
                      <option value="${s.id}" ${isSelected ? 'selected' : ''}>
                        ${s.name} (${s.id}) — Free Credits: ${Math.max(0, (s.includedMeetingHours||12) - (s.usedMeetingHours||0))} hrs
                      </option>
                    `;
                  }).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Meeting Title / Objective <span class="required-star">*</span></label>
                <input type="text" name="title" id="book-meeting-title" class="form-control" value="Investor Demo & Product Review" placeholder="e.g. Investor Demo & Product Review" required>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;">
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 2px 8px;" onclick="document.getElementById('book-meeting-title').value = 'Investor Demo & Product Review'">⚡ Investor Demo</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 2px 8px;" onclick="document.getElementById('book-meeting-title').value = 'Sprint Planning & Tech Sync'">🚀 Sprint Planning</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 2px 8px;" onclick="document.getElementById('book-meeting-title').value = 'Board Advisory Session'">🏢 Board Advisory</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 2px 8px;" onclick="document.getElementById('book-meeting-title').value = 'Client Discovery Call'">🤝 Client Discovery</button>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Date <span class="required-star">*</span></label>
                  <input type="date" name="date" class="form-control" value="${this.selectedDate}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Attendees <span class="required-star">*</span></label>
                  <input type="number" name="attendees" class="form-control" value="6" min="1" max="50" required>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Start Time <span class="required-star">*</span></label>
                  <select name="startTime" id="book-start-time" class="form-control" onchange="MeetingRoomsModule.syncEndTime(this.value)" required>
                    <optgroup label="🌅 Morning Session (08:00 AM – 11:00 AM)">
                      ${this.generateStartSlots().morningStarts.map(t => `
                        <option value="${t.value}" ${t.value === defaultStartTime ? 'selected' : ''}>
                          ${t.label}
                        </option>
                      `).join('')}
                    </optgroup>
                    <optgroup label="🌆 Afternoon Session (03:00 PM – 07:00 PM)">
                      ${this.generateStartSlots().afternoonStarts.map(t => `
                        <option value="${t.value}" ${t.value === defaultStartTime ? 'selected' : ''}>
                          ${t.label}
                        </option>
                      `).join('')}
                    </optgroup>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">End Time <span class="required-star">*</span></label>
                  <select name="endTime" id="book-end-time" class="form-control" required>
                    ${validEndSlots.map(t => `
                      <option value="${t.value}" ${t.value === defaultEndTime ? 'selected' : ''}>
                        ${t.label}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Dedicated Operating Hours Policy Banner -->
              <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%); border: 1.5px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md); padding: 10px 14px; font-size: 12px; margin-bottom: 16px;">
                <div style="font-weight: 800; color: var(--text-primary); margin-bottom: 3px; display: flex; align-items: center; gap: 5px;">
                  <span>⏰</span> <span>Operating Windows Policy:</span>
                </div>
                <div style="color: var(--text-secondary); line-height: 1.45;">
                  Bookings are strictly accepted only between <strong>08:00 AM – 11:00 AM</strong> (Morning) and <strong>03:00 PM – 07:00 PM</strong> (Afternoon). Overages (if any) are billed at flat ₹800/hr after monthly credits.
                </div>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="MeetingRoomsModule.closeModal('modal-book-room')">Cancel</button>
                <button type="submit" class="btn btn-primary">Confirm Reservation</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleBookSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    const res = window.store.bookMeetingRoom(data);
    this.closeModal('modal-book-room');

    if (res.success) {
      App.showToast(`✅ ${res.message}`, 'success');
      // If user booked for their own startup, switch to myBookings or keep on scheduler with update
      this.render();
      if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
        DashboardModule.render();
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
