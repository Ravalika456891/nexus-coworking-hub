// Module: Meeting Room Scheduling, Capacity Management & Credit Tracking

const MeetingRoomsModule = {
  selectedDate: new Date().toISOString().split('T')[0],

  render() {
    const container = document.getElementById('view-meetingRooms');
    if (!container) return;

    const rooms = window.store.getMeetingRooms();
    const startups = window.store.getStartups();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary);">
            Meeting Rooms & Conference Scheduler
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
            State-of-the-art boardrooms, presentation arenas, and focus pods with conflict prevention.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="date" class="form-control" style="width: auto; padding: 6px 12px; font-size: 13px;" value="${this.selectedDate}" onchange="MeetingRoomsModule.setDate(this.value)">
          <button class="btn btn-primary" onclick="MeetingRoomsModule.openBookModal()">
            + Reserve Room
          </button>
        </div>
      </div>

      <!-- Room Cards Grid -->
      <div class="grid-2col" style="margin-bottom: 26px;">
        ${rooms.map(r => this.renderRoomCard(r)).join('')}
      </div>

      <!-- Bookings for Selected Date -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>📅 Confirmed Reservations for ${this.selectedDate}</span>
          </div>
          <span class="badge badge-info">${this.getBookingsCountForDate()} Sessions</span>
        </div>
        ${this.renderBookingsTable(rooms)}
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

  renderRoomCard(room) {
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const bookings = (room.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled');

    return `
      <div class="room-card">
        <div class="room-header">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; font-size: 22px;">
              ${room.icon}
            </div>
            <div>
              <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">${room.name}</h3>
              <span style="font-size: 12px; color: var(--text-muted);">Capacity: <strong>${room.capacity} Pax</strong> • Rate: ₹${room.hourlyRate}/hr</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openBookModal('${room.id}')">
            Book Now
          </button>
        </div>

        <div class="room-amenities-tags">
          ${room.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
        </div>

        <div>
          <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; text-transform: uppercase;">
            Time Slot Availability (${this.selectedDate}):
          </div>
          <div class="time-slot-picker">
            ${timeSlots.map(slot => {
              const booked = bookings.find(b => {
                const bHour = parseInt(b.startTime.split(':')[0]);
                const eHour = parseInt(b.endTime.split(':')[0]);
                const curHour = parseInt(slot.split(':')[0]);
                return curHour >= bHour && curHour < eHour;
              });

              if (booked) {
                return `<div class="slot-btn booked" title="Booked by ${booked.startupName}: ${booked.title}">${slot}</div>`;
              } else {
                return `<div class="slot-btn" onclick="MeetingRoomsModule.openBookModal('${room.id}', '${slot}')">${slot}</div>`;
              }
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderBookingsTable(rooms) {
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
        <table class="nexus-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Meeting Purpose</th>
              <th>Startup</th>
              <th>Time Window</th>
              <th>Attendees</th>
              <th>Fee / Credits</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(b => `
              <tr>
                <td><strong>${b.roomName}</strong></td>
                <td>${b.title}</td>
                <td><span class="badge badge-info">${b.startupName}</span></td>
                <td><code style="font-family: var(--font-mono);">${b.startTime} - ${b.endTime}</code></td>
                <td>${b.attendees} Pax</td>
                <td>${b.cost === 0 ? '<span style="color: var(--status-success); font-weight: 600;">Covered by Plan</span>' : `₹${b.cost}`}</td>
                <td>
                  <button class="btn btn-outline btn-sm" style="color: var(--status-danger);" onclick="MeetingRoomsModule.cancelBooking('${b.roomId}', '${b.id}')">
                    Cancel
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let min of [0, 30]) {
        if (hour === 21 && min === 30) continue;
        const hStr = hour < 10 ? `0${hour}` : `${hour}`;
        const mStr = min < 10 ? `0${min}` : `${min}`;
        const timeVal = `${hStr}:${mStr}`;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const displayStr = `${displayHour}:${mStr} ${period}`;
        slots.push({ value: timeVal, label: `${timeVal} (${displayStr})` });
      }
    }
    return slots;
  },

  syncEndTime(startTimeVal) {
    const endSelect = document.getElementById('book-end-time');
    if (!endSelect || !startTimeVal) return;
    const parts = startTimeVal.split(':');
    const startH = parseInt(parts[0], 10);
    const startM = parseInt(parts[1] || '0', 10);
    let endH = startH + 1;
    let endM = startM;
    if (endH > 21 || (endH === 21 && endM > 0)) {
      endH = 21;
      endM = 0;
    }
    const endVal = `${endH < 10 ? '0' : ''}${endH}:${endM < 10 ? '0' : ''}${endM}`;
    endSelect.value = endVal;
  },

  openBookModal(preselectedRoomId = null, preselectedTime = null, preselectedStartupId = null) {
    const rooms = window.store.getMeetingRooms();
    const startups = window.store.getStartups();
    const activeFounderId = window.store.activeFounderId;
    const timeSlots = this.generateTimeSlots();

    const defaultStartTime = preselectedTime || '11:00';
    const endHour = parseInt(defaultStartTime.split(':')[0]) + 1;
    const defaultEndTime = `${endHour < 10 ? '0' : ''}${endHour}:00`;

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
                    const isSelected = preselectedStartupId ? (s.id === preselectedStartupId) : (activeFounderId ? s.id === activeFounderId : false);
                    return `
                    <option value="${s.id}" ${isSelected ? 'selected' : ''}>
                      ${s.name} (Remaining Credits: ${Math.max(0, (s.includedMeetingHours||12) - (s.usedMeetingHours||0))} hrs)
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
                    ${timeSlots.map(t => `
                      <option value="${t.value}" ${t.value === defaultStartTime ? 'selected' : ''}>
                        ${t.label}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">End Time <span class="required-star">*</span></label>
                  <select name="endTime" id="book-end-time" class="form-control" required>
                    ${timeSlots.map(t => `
                      <option value="${t.value}" ${t.value === defaultEndTime ? 'selected' : ''}>
                        ${t.label}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 10px 14px; font-size: 12px; margin-bottom: 16px;">
                💡 <strong>Smart Policy:</strong> Booking uses included monthly allowance credits first. Overages (if any) are billed at flat ₹800/hr on the next monthly tax invoice.
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
      this.render();
      DashboardModule.render();
    } else {
      App.showToast(`⚠️ ${res.message}`, 'danger');
    }
  },

  cancelBooking(roomId, bookingId) {
    const res = window.store.cancelBooking(roomId, bookingId);
    if (res.success) {
      App.showToast('Reservation successfully cancelled.', 'warning');
      this.render();
      DashboardModule.render();
    }
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};

window.MeetingRoomsModule = MeetingRoomsModule;

