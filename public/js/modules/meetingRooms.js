// Module: Meeting Room Scheduling, Capacity Management, My Booked Rooms & Credit Tracking

const MeetingRoomsModule = {
  selectedDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
  activeTab: 'scheduler', // 'scheduler' | 'myBookings' | 'allBookings'
  activeStartupFilter: null, // null = defaults to active startup
  myBookingsFilterDate: 'all', // 'all' | 'selected'
  myBookingsViewMode: 'table', // 'table' | 'cards'
  myBookingsSearch: '',
  myBookingsStatusFilter: 'upcoming', // 'upcoming' | 'past' | 'cancelled'
  myBookingsRoomFilter: 'all', // 'all' | roomId
  myBookingsPage: 1,
  myBookingsPageSize: 25,
  myBookingsDateFrom: '',
  myBookingsDateTo: '',
  myBookingsSortBy: 'default',
  myBookingsSortDir: 'asc',
  expandedSeries: {},
  selectedSlotsByRoom: {}, // { [roomId]: ['09:00', '10:00'] }
  selectedDurationByRoom: {}, // { [roomId]: 60 | 30 }
  selectedCustomWindowByRoom: {}, // { [roomId]: { startTime, endTime } }
  schedulerViewMode: 'cards', // 'cards' | 'day' | 'week' | 'month' | 'compare'
  calendarModalViewMode: 'month', // 'day' | 'week' | 'month'
  filterFloor: 'all', // 'all' | '1F' | '2F' | '3F' | '4F' | '5F' | '6F' | '7F'
  filterCategory: 'all', // 'all' | 'meeting' | 'conference' | 'training' | 'pitch' | 'boardroom' | 'event'
  filterRoom: 'all', // 'all' | roomId
  filterCapacity: 'all', // 'all' | '4' | '8' | '16'
  filterAmenity: 'all',  // 'all' | 'projector' | 'video' | 'audio' | 'whiteboard'
  filterSession: 'all',  // 'all' | 'morning' | 'afternoon'
  filterAvailableOnly: false,
  isCalendarLoading: false,
  analyticsRange: 'all', // 'all' | 'day' | 'week' | 'month' | 'custom'
  analyticsStartDate: '',
  analyticsEndDate: '',
  editingAdminRoomId: null,
  waitlist: [],

  isAdminUser() {
    const raw = String((window.store && window.store.currentRole) || 'admin').toLowerCase();
    return raw === 'admin' || raw === 'super_admin' || raw === 'incubation_admin' || raw === 'incubator_admin';
  },

  getISTNow(clockOverride = null) {
    const now = clockOverride ? new Date(clockOverride) : new Date();
    const dFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const tFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    const todayStr = dFormatter.format(now);
    const liveTimeStr = tFormatter.format(now);
    const [h, m] = liveTimeStr.split(':').map(Number);
    const totalMinutes = (h || 0) * 60 + (m || 0);
    const dParts = todayStr.split('-').map(Number);
    const tomObj = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 1));
    const tomorrowStr = tomObj.toISOString().split('T')[0];
    return {
      todayStr,
      dateStr: todayStr,
      tomorrowStr,
      liveTimeStr,
      timeStr: liveTimeStr,
      hour: h || 0,
      minute: m || 0,
      totalMinutes,
      now
    };
  },

  isBookingCompleted(booking, clockOverride = null) {
    if (!booking) return false;
    if (booking.status === 'Completed') return true;
    if (booking.status === 'Cancelled') return false;
    if (typeof CancellationPolicy !== 'undefined' && CancellationPolicy.isBookingCompleted) {
      return CancellationPolicy.isBookingCompleted(booking, clockOverride);
    }
    const { todayStr, totalMinutes } = this.getISTNow(clockOverride);
    if (booking.date < todayStr) return true;
    if (booking.date === todayStr && booking.endTime) {
      return this.parseTimeToMinutes(booking.endTime) <= totalMinutes;
    }
    return false;
  },

  refreshDashboardSummary() {
    if (typeof DashboardModule !== 'undefined') {
      if (typeof DashboardModule.loadSummary === 'function') {
        DashboardModule.loadSummary();
      } else if (typeof DashboardModule.render === 'function') {
        DashboardModule.render();
      }
    }
  },

  isRoomUnderMaintenance(room, targetDate = null, clockOverride = null) {
    if (!room) return false;
    if (room.status === 'Under Maintenance' || room.underMaintenance === true || room.maintenance === true) return true;
    if (typeof window !== 'undefined' && window.store && window.store.getMaintenanceBlocks) {
      const blocks = window.store.getMaintenanceBlocks() || [];
      const ist = this.getISTNow(clockOverride);
      const chkDate = targetDate || this.selectedDate || ist.todayStr;
      const chkTime = ist.liveTimeStr;
      const targetISO = `${chkDate}T${chkTime}:00`;
      return blocks.some(b => {
        if (b.roomId !== room.id || b.status === 'cancelled') return false;
        const bStart = b.startDateTime ? (b.startDateTime.length === 16 ? b.startDateTime + ':00' : b.startDateTime) : '';
        const bEnd = b.endDateTime ? (b.endDateTime.length === 16 ? b.endDateTime + ':00' : b.endDateTime) : '';
        return (bStart <= targetISO && bEnd >= targetISO);
      });
    }
    return false;
  },

  computeRoomStatus(room, targetDate = null, clockOverride = null) {
    const selectedDate = targetDate || this.selectedDate;
    const { todayStr, totalMinutes: curTotalMin } = this.getISTNow(clockOverride);
    const isToday = (selectedDate === todayStr);
    const isPastDay = (selectedDate < todayStr);
    const myStartup = this.getMyStartup();

    const makeResult = (status, statusType, availableSlotsCount, mySlotsCount, otherSlotsCount, activeBookingNow = null) => ({
      status,
      statusType,
      availableSlotsCount,
      mySlotsCount,
      otherSlotsCount,
      openSlots: availableSlotsCount,
      myBookedSlots: mySlotsCount,
      otherBookedSlots: otherSlotsCount,
      bookedSlots: mySlotsCount + otherSlotsCount,
      activeBookingNow
    });

    if (this.isRoomUnderMaintenance(room)) {
      return makeResult('Under Maintenance', 'closed', 0, 0, 0, null);
    }

    const bookings = ((room && room.bookings) || [])
      .filter(b => b.date === selectedDate && b.status !== 'Cancelled')
      .sort((a, b) => this.parseTimeToMinutes(a.startTime) - this.parseTimeToMinutes(b.startTime));

    const timeSlots = ['08:00', '09:00', '10:00', '15:00', '16:00', '17:00', '18:00'];
    let mySlotsCount = 0;
    let otherSlotsCount = 0;
    let availableSlotsCount = 0;
    let availableHalfSlotsLater = 0;

    bookings.forEach(b => {
      const isMine = myStartup && (b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
      if (isMine) mySlotsCount++;
      else otherSlotsCount++;
    });

    timeSlots.forEach(slot => {
      const slotStartMin = this.parseTimeToMinutes(slot);
      const slotEndMin = slotStartMin + 60;
      const half1Start = slotStartMin;
      const half1End = slotStartMin + 30;
      const half2Start = slotStartMin + 30;
      const half2End = slotEndMin;

      const half1Passed = isPastDay || (isToday && half1End <= curTotalMin);
      const half2Passed = isPastDay || (isToday && half2End <= curTotalMin);

      const half1Booked = bookings.some(b => {
        const bs = this.parseTimeToMinutes(b.startTime);
        const be = this.parseTimeToMinutes(b.endTime);
        return bs < half1End && be > half1Start;
      });
      const half2Booked = bookings.some(b => {
        const bs = this.parseTimeToMinutes(b.startTime);
        const be = this.parseTimeToMinutes(b.endTime);
        return bs < half2End && be > half2Start;
      });

      const half1Open = !half1Passed && !half1Booked;
      const half2Open = !half2Passed && !half2Booked;

      if (half1Open) availableHalfSlotsLater++;
      if (half2Open) availableHalfSlotsLater++;
      if (half1Open || half2Open) {
        availableSlotsCount++;
      }
    });

    if (isPastDay || (isToday && curTotalMin >= 19 * 60)) {
      return makeResult('Closed for Today', 'closed', 0, mySlotsCount, otherSlotsCount, null);
    }

    let activeBookingNow = null;
    if (isToday) {
      activeBookingNow = bookings.find(b => {
        const bs = this.parseTimeToMinutes(b.startTime);
        const be = this.parseTimeToMinutes(b.endTime);
        return bs <= curTotalMin && be > curTotalMin;
      }) || null;
    }

    if (availableHalfSlotsLater === 0) {
      return makeResult('Fully Booked', 'occupied', 0, mySlotsCount, otherSlotsCount, activeBookingNow);
    }

    if (isToday) {
      const inMorningHours = (curTotalMin >= 8 * 60 && curTotalMin < 11 * 60);
      const inAfternoonHours = (curTotalMin >= 15 * 60 && curTotalMin < 19 * 60);
      const inOperatingHours = inMorningHours || inAfternoonHours;

      if (inOperatingHours && !activeBookingNow) {
        return makeResult('Available Now', 'available', availableSlotsCount, mySlotsCount, otherSlotsCount, null);
      } else {
        const isMine = activeBookingNow && myStartup && (activeBookingNow.startupId === myStartup.id || (activeBookingNow.startupName && activeBookingNow.startupName.toLowerCase() === myStartup.name.toLowerCase()));
        return makeResult(
          'Available Later Today',
          activeBookingNow ? (isMine ? 'mine' : 'occupied') : 'break',
          availableSlotsCount,
          mySlotsCount,
          otherSlotsCount,
          activeBookingNow
        );
      }
    }

    // Future date with available slots
    return makeResult('Available Now', 'available', availableSlotsCount, mySlotsCount, otherSlotsCount, null);
  },

  setSchedulerViewMode(mode, withSkeleton = false) {
    if (mode === 'cards') {
      this.activeTab = 'scheduler';
      this.schedulerViewMode = 'cards';
      if (typeof window !== 'undefined' && window.App && typeof window.App.switchTab === 'function') {
        window.App.switchTab('meetingRooms');
        return;
      }
      this.isCalendarLoading = false;
      this.render();
      return;
    }
    this.schedulerViewMode = mode || 'cards';
    if (withSkeleton && typeof window !== 'undefined' && typeof setTimeout === 'function') {
      this.isCalendarLoading = true;
      this.render();
      setTimeout(() => {
        this.isCalendarLoading = false;
        this.render();
      }, 160);
    } else {
      this.isCalendarLoading = false;
      this.render();
    }
  },

  setFilterRoom(roomId) {
    this.filterRoom = roomId || 'all';
    this.render();
  },

  setFilterFloor(floorCode) {
    this.filterFloor = floorCode || 'all';
    this.render();
  },

  setFilterCategory(cat) {
    this.filterCategory = cat || 'all';
    this.filterRoom = 'all';
    this.render();
  },

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

  toggleAvailableOnly(val) {
    if (typeof val === 'boolean') {
      this.filterAvailableOnly = val;
    } else {
      this.filterAvailableOnly = !this.filterAvailableOnly;
    }
    this.render();
  },

  toggleMoreFiltersPanel() {
    this.showMoreFilters = !this.showMoreFilters;
    const drawer = document.getElementById('hub-more-filters-drawer');
    if (drawer) {
      drawer.style.display = this.showMoreFilters ? 'block' : 'none';
    } else {
      this.render();
    }
  },

  resetFilters() {
    this.filterFloor = 'all';
    this.filterCategory = 'all';
    this.filterRoom = 'all';
    this.filterCapacity = 'all';
    this.filterAmenity = 'all';
    this.filterSession = 'all';
    this.filterAvailableOnly = false;
    this.render();
  },

  getFilteredRooms(rooms = null, targetDate = null) {
    const checkDate = targetDate || this.selectedDate;
    const sourceRooms = rooms || (typeof window !== 'undefined' && window.store ? window.store.getMeetingRooms() : []);
    return (sourceRooms || []).filter(room => {
      // Building floor filter (1F to 7F)
      if (this.filterFloor && this.filterFloor !== 'all') {
        const targetFloor = String(this.filterFloor).toUpperCase();
        const rFloor = String(room.floor || room.floorCode || '').toUpperCase();
        if (rFloor !== targetFloor) {
          return false;
        }
      }
      if (this.filterRoom && this.filterRoom !== 'all' && room.id !== this.filterRoom) {
        return false;
      }
      if (this.filterCategory && this.filterCategory !== 'all') {
        const cat = this.filterCategory.toLowerCase();
        const rName = (room.name || '').toLowerCase();
        const rDesc = (room.description || '').toLowerCase();
        const rId = (room.id || '').toLowerCase();
        const allText = `${rName} ${rDesc} ${rId}`;

        if (cat === 'meeting') {
          const matches = allText.includes('meeting') || allText.includes('pod') || allText.includes('focus') || allText.includes('brainstorm') || rId === 'mr-03' || rId === 'mr-04';
          if (!matches) return false;
        } else if (cat === 'conference') {
          const matches = allText.includes('conference') || allText.includes('boardroom') || allText.includes('alpha') || allText.includes('arena') || rId === 'mr-01' || rId === 'mr-02';
          if (!matches) return false;
        } else if (cat === 'training') {
          const matches = allText.includes('training') || allText.includes('classroom') || allText.includes('workshop') || rId === 'mr-05';
          if (!matches) return false;
        } else if (cat === 'pitch') {
          const matches = allText.includes('pitch') || allText.includes('arena') || allText.includes('demo') || allText.includes('presentation') || rId === 'mr-02';
          if (!matches) return false;
        } else if (cat === 'boardroom') {
          const matches = allText.includes('boardroom') || allText.includes('executive') || allText.includes('board') || rId === 'mr-01';
          if (!matches) return false;
        } else if (cat === 'event') {
          const matches = allText.includes('event') || allText.includes('amphitheater') || allText.includes('studio') || allText.includes('hall') || rId === 'mr-06' || rId.includes('amphi') || rId.includes('admin');
          if (!matches) return false;
        }
      }
      if (this.filterCapacity !== 'all') {
        const minCap = parseInt(this.filterCapacity, 10);
        if (room.capacity < minCap) return false;
      }
      if (this.filterAmenity !== 'all') {
        const str = (room.amenities || []).join(' ').toLowerCase();
        if (this.filterAmenity === 'projector' && !str.includes('projector') && !str.includes('display') && !str.includes('screen') && !str.includes('4k')) return false;
        if (this.filterAmenity === 'video' && !str.includes('video') && !str.includes('cisco') && !str.includes('webex') && !str.includes('camera') && !str.includes('zoom')) return false;
        if (this.filterAmenity === 'audio' && !str.includes('audio') && !str.includes('mic') && !str.includes('polycom') && !str.includes('speaker') && !str.includes('sound')) return false;
        if (this.filterAmenity === 'whiteboard' && !str.includes('whiteboard') && !str.includes('board') && !str.includes('marker')) return false;
      }
      if (this.filterAvailableOnly) {
        const st = this.computeRoomStatus(room, checkDate);
        if ((st.availableSlotsCount || 0) <= 0 || this.isRoomUnderMaintenance(room)) return false;
      }
      return true;
    });
  },

  getNextAvailableSlotForRoom(room, baseDate = null) {
    if (!room || this.isRoomUnderMaintenance(room)) {
      return { available: false, label: 'Under Maintenance', date: null, startTime: null, endTime: null };
    }
    const ist = this.getISTNow();
    const startCheckDate = (!baseDate || baseDate < ist.todayStr) ? ist.todayStr : baseDate;
    const candidateDates = [startCheckDate];
    const dParts = startCheckDate.split('-').map(Number);
    const nextDayObj = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 1));
    candidateDates.push(nextDayObj.toISOString().split('T')[0]);

    const halfHourCandidates = [
      { start: '08:00', end: '08:30', fullEnd: '09:00' },
      { start: '08:30', end: '09:00', fullEnd: '09:00' },
      { start: '09:00', end: '09:30', fullEnd: '10:00' },
      { start: '09:30', end: '10:00', fullEnd: '10:00' },
      { start: '10:00', end: '10:30', fullEnd: '11:00' },
      { start: '10:30', end: '11:00', fullEnd: '11:00' },
      { start: '15:00', end: '15:30', fullEnd: '16:00' },
      { start: '15:30', end: '16:00', fullEnd: '16:00' },
      { start: '16:00', end: '16:30', fullEnd: '17:00' },
      { start: '16:30', end: '17:00', fullEnd: '17:00' },
      { start: '17:00', end: '17:30', fullEnd: '18:00' },
      { start: '17:30', end: '18:00', fullEnd: '18:00' },
      { start: '18:00', end: '18:30', fullEnd: '19:00' },
      { start: '18:30', end: '19:00', fullEnd: '19:00' }
    ];

    for (const dStr of candidateDates) {
      const isToday = dStr === ist.todayStr;
      const bookings = (room.bookings || []).filter(b => b.date === dStr && b.status !== 'Cancelled');
      for (const cand of halfHourCandidates) {
        const sMin = this.parseTimeToMinutes(cand.start);
        const eMin = this.parseTimeToMinutes(cand.end);
        if (isToday && sMin < ist.totalMinutes) continue;
        const hasConflict30 = bookings.some(b => {
          return this.parseTimeToMinutes(b.startTime) < eMin && this.parseTimeToMinutes(b.endTime) > sMin;
        });
        if (!hasConflict30) {
          const fullEndMin = this.parseTimeToMinutes(cand.fullEnd);
          const hasConflict60 = bookings.some(b => {
            return this.parseTimeToMinutes(b.startTime) < fullEndMin && this.parseTimeToMinutes(b.endTime) > sMin;
          });
          const bestEnd = (!hasConflict60 && cand.start.endsWith(':00')) ? cand.fullEnd : cand.end;
          const dayPrefix = dStr === ist.todayStr ? 'Today' : (dStr === ist.tomorrowStr ? 'Tomorrow' : dStr);
          return {
            available: true,
            date: dStr,
            startTime: cand.start,
            endTime: bestEnd,
            label: `${dayPrefix}, ${this.formatTimeTo12Hour(cand.start)}`
          };
        }
      }
    }
    return { available: false, label: 'No immediate slots', date: null, startTime: null, endTime: null };
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
    if (tab === 'explore' || tab === 'scheduler' || tab === 'cards') {
      this.activeTab = 'scheduler';
      this.schedulerViewMode = 'cards';
    } else if (tab === 'calendar') {
      this.activeTab = 'calendar';
      if (!['day', 'week', 'month', 'compare'].includes(this.schedulerViewMode)) {
        this.schedulerViewMode = 'day';
      }
    } else if (tab === 'admin') {
      if (!this.isAdminUser()) {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('🛡️ Admin Management is restricted to Super Admins & Incubation Admins.', 'warning');
        }
        return;
      }
      this.activeTab = 'admin';
    } else {
      this.activeTab = tab;
    }
    this.render();
  },

  setMyBookingsFilter(filter) {
    this.myBookingsFilterDate = filter;
    this.render();
  },

  parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const str = String(timeStr).trim();
    const isPM = /pm/i.test(str);
    const isAM = /am/i.test(str);
    const clean = str.replace(/[^0-9:]/g, '');
    const parts = clean.split(':').map(n => parseInt(n, 10) || 0);
    let h = parts[0] || 0;
    const m = parts[1] || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  },

  calculateBookingDuration(startTime, endTime) {
    const sMins = this.parseTimeToMinutes(startTime);
    const eMins = this.parseTimeToMinutes(endTime);
    const diff = (eMins - sMins) / 60;
    return Math.max(0.5, isNaN(diff) || diff <= 0 ? 1 : diff);
  },

  getAllBookings(includeCancelled = true) {
    const rooms = (window.store && window.store.getMeetingRooms) ? window.store.getMeetingRooms() : [];
    const rawRole = (window.store && window.store.currentRole) || 'founder';
    const currentRole = (window.store && window.store.normalizeRole) ? window.store.normalizeRole(rawRole) : rawRole;
    const isStartupRole = (currentRole === 'startup' || currentRole === 'startup_member' || currentRole === 'founder');
    const myStartup = this.getMyStartup();
    const list = [];
    rooms.forEach(r => {
      (r.bookings || []).forEach(b => {
        if (!includeCancelled && b.status === 'Cancelled') return;
        // Founders and Employees see only their own startup's bookings (Section 6: Data Privacy)
        if (isStartupRole) {
          const isMine = myStartup && (b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
          if (!isMine) return;
        }
        list.push({ ...b, roomId: r.id, roomName: r.name, roomIcon: r.icon, hourlyRate: r.hourlyRate, capacity: r.capacity });
      });
    });
    return list;
  },

  getMyBookings(includeCancelled = true) {
    const myStartup = this.getMyStartup();
    const all = this.getAllBookings(includeCancelled);
    return all.filter(b => b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
  },

  initAutoRefresh() {
    if (this._autoRefreshInit) return;
    this._autoRefreshInit = true;

    // Auto re-fetch every 30 seconds
    setInterval(() => {
      this.refetchAvailability(false);
    }, 30000);

    // 1-minute ticker refreshes refund countdowns and tiers live
    if (!this._cancellationTicker) {
      this._cancellationTicker = setInterval(() => {
        if (this.activeTab === 'myBookings') {
          this.render();
        }
      }, 60000);
    }

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
    const allBookings = this.getAllBookings(false);
    const myBookings = this.getMyBookings(true);
    const myActiveBookings = myBookings.filter(b => b.status !== 'Cancelled');
    const myBookingsToday = myActiveBookings.filter(b => b.date === this.selectedDate);

    const morningSlots = ['08:00', '09:00', '10:00'];
    const afternoonSlots = ['15:00', '16:00', '17:00', '18:00'];
    const timeSlots = [...morningSlots, ...afternoonSlots];

    // Slot & reservation statistics for selected date using consistent minute-based queries
    let mySlotsCount = 0;
    let otherSlotsCount = 0;
    let availableSlotsCount = 0;

    rooms.forEach(r => {
      const roomStats = this.computeRoomStatus(r, this.selectedDate);
      mySlotsCount += roomStats.mySlotsCount;
      otherSlotsCount += roomStats.otherSlotsCount;
      availableSlotsCount += roomStats.availableSlotsCount;
    });

    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));

    const rawRole = (window.store && window.store.currentRole) || 'founder';
    const currentRole = (window.store && window.store.normalizeRole) ? window.store.normalizeRole(rawRole) : rawRole;
    const isEmployee = currentRole === 'startup_member';
    const canViewBilling = !isEmployee && window.store.canPerformAction('billing.view_startup');
    const canViewAnalytics = !isEmployee && (this.isAdminUser() || window.store.canPerformAction('analytics.view_startup'));

    container.innerHTML = `
      <!-- Main Tab Content Body -->
      ${this.renderActiveContent({ rooms, startups, myStartup, allBookings, myBookings, myBookingsToday, timeSlots, availableSlotsCount, mySlotsCount, otherSlotsCount })}
    `;
  },

  renderActiveContent(data) {
    if (this.activeTab === 'myBookings') {
      return this.renderMyBookingsView(data);
    } else if (this.activeTab === 'allBookings' || this.activeTab === 'creditsBilling') {
      return this.renderCreditsAndBillingView(data);
    } else if (this.activeTab === 'calendar') {
      return this.renderBookingCalendarTabView(data);
    } else if (this.activeTab === 'analytics') {
      return this.renderAnalyticsTabView(data);
    } else if (this.activeTab === 'admin') {
      return this.renderAdminManagementTabView(data);
    } else {
      return this.renderSchedulerView(data);
    }
  },

  renderSchedulerView({ rooms, myStartup, myBookingsToday, availableSlotsCount, mySlotsCount, otherSlotsCount }) {
    const { todayStr, tomorrowStr } = this.getISTNow();
    const isToday = (this.selectedDate === todayStr);
    const isTomorrow = (this.selectedDate === tomorrowStr);

    const dParts = this.selectedDate.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const formattedDateLabel = `${dayName}, ${dayNum} ${monthName}`;

    const filteredRooms = this.getFilteredRooms(rooms);
    const availableRoomsCount = filteredRooms.filter(r => this.computeRoomStatus(r, this.selectedDate).statusType === 'available').length;

    // Check if user is in classic calendar mode (day/week/month/compare)
    if (this.schedulerViewMode !== 'cards') {
      return `
        <!-- Modern Secondary Mode Toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--bg-surface, #ffffff); padding: 12px 18px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); box-shadow: 0 2px 8px rgba(0,0,0,0.02); flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setSchedulerViewMode('cards')" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 8px; background: var(--bg-surface, #ffffff); border: 1px solid var(--border-medium, #cbd5e1); color: var(--text-primary, #1e293b); cursor: pointer; transition: all 0.15s ease;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              <span>Overview Cards</span>
            </button>
            <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--bg-surface-elevated, #f8fafc); border: 1px solid var(--border-subtle, #e2e8f0); padding: 5px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 800; color: var(--text-primary, #0f172a);">
              <span>📅</span> <span>${formattedDateLabel}</span>
            </div>
            <!-- Compact Calendar Floor & People Filter -->
            <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--bg-surface-elevated, #f8fafc); border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 8px; padding: 4px 10px;">
              <span style="font-size: 11px; font-weight: 800; color: var(--text-muted, #64748b);">🏢 Floor:</span>
              <select onchange="MeetingRoomsModule.setFilterFloor(this.value)" style="border: none; background: transparent; font-size: 12px; font-weight: 700; color: #4338ca; cursor: pointer; outline: none;">
                <option value="all" ${(!this.filterFloor || this.filterFloor === 'all') ? 'selected' : ''}>All Floors (10 Rooms)</option>
                <option value="1F" ${this.filterFloor === '1F' ? 'selected' : ''}>1F (2 Rooms)</option>
                <option value="2F" ${this.filterFloor === '2F' ? 'selected' : ''}>2F (1 Room)</option>
                <option value="3F" ${this.filterFloor === '3F' ? 'selected' : ''}>3F (2 Rooms)</option>
                <option value="4F" ${this.filterFloor === '4F' ? 'selected' : ''}>4F (1 Room)</option>
                <option value="5F" ${this.filterFloor === '5F' ? 'selected' : ''}>5F (0 Rooms)</option>
                <option value="6F" ${this.filterFloor === '6F' ? 'selected' : ''}>6F (2 Rooms)</option>
                <option value="7F" ${this.filterFloor === '7F' ? 'selected' : ''}>7F (2 Rooms)</option>
              </select>
            </div>
            <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--bg-surface-elevated, #f8fafc); border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 8px; padding: 4px 10px;">
              <span style="font-size: 11px; font-weight: 800; color: var(--text-muted, #64748b);">👥 People:</span>
              <select onchange="MeetingRoomsModule.setFilterCapacity(this.value)" style="border: none; background: transparent; font-size: 12px; font-weight: 700; color: #4338ca; cursor: pointer; outline: none;">
                <option value="all" ${(!this.filterCapacity || this.filterCapacity === 'all') ? 'selected' : ''}>All</option>
                <option value="4" ${this.filterCapacity === '4' ? 'selected' : ''}>4+ People</option>
                <option value="6" ${this.filterCapacity === '6' ? 'selected' : ''}>6+ People</option>
                <option value="8" ${this.filterCapacity === '8' ? 'selected' : ''}>8+ People</option>
              </select>
            </div>
          </div>
          <div class="hub-view-switcher">
            <button type="button" class="hub-view-btn ${this.schedulerViewMode === 'cards' ? 'active' : ''}" onclick="MeetingRoomsModule.setSchedulerViewMode('cards')">Cards</button>
            <button type="button" class="hub-view-btn ${this.schedulerViewMode === 'day' ? 'active' : ''}" onclick="MeetingRoomsModule.setSchedulerViewMode('day')">Day</button>
            <button type="button" class="hub-view-btn ${this.schedulerViewMode === 'week' ? 'active' : ''}" onclick="MeetingRoomsModule.setSchedulerViewMode('week')">Week</button>
            <button type="button" class="hub-view-btn ${this.schedulerViewMode === 'month' ? 'active' : ''}" onclick="MeetingRoomsModule.setSchedulerViewMode('month')">Month</button>
            <button type="button" class="hub-view-btn ${this.schedulerViewMode === 'compare' ? 'active' : ''}" onclick="MeetingRoomsModule.setSchedulerViewMode('compare')">Compare</button>
          </div>
        </div>

        ${this.filterFloor === '5F' ? `
          <div class="hub-empty-floor-card">
            <div style="font-size: 38px; margin-bottom: 8px;">🏢</div>
            <h4 style="font-size: 17px; font-weight: 800; color: #1e1b4b; margin: 0 0 6px 0;">No meeting rooms on this floor (5F)</h4>
            <p style="font-size: 13.5px; color: #64748b; max-width: 440px; margin: 0 auto 16px auto; line-height: 1.5;">This floor currently has no meeting rooms. Please select another floor to explore available spaces.</p>
            <button type="button" class="btn btn-primary" onclick="MeetingRoomsModule.setFilterFloor('all')" style="border-radius: 10px; font-weight: 700; padding: 8px 18px;">
              View All Floors
            </button>
          </div>
        ` : (
          this.schedulerViewMode === 'day'
            ? this.renderDayCalendarView(filteredRooms, myStartup)
            : this.schedulerViewMode === 'week'
              ? this.renderWeekCalendarView(filteredRooms, myStartup)
              : this.schedulerViewMode === 'month'
                ? this.renderMonthCalendarView(filteredRooms, myStartup)
                : this.renderRoomComparisonView(filteredRooms, myStartup)
        )}
      `;
    }

    return `
      <!-- ==========================================
           NEXUS HUB CLEAN MAIN LAYOUT
           ========================================== -->
      <div class="hub-main-grid">
        
        <!-- LEFT COLUMN: BANNER, FILTERS & ROOM CARDS -->
        <div class="hub-left-content">
          
          <!-- 1. HERO BANNER -->
          <div class="hub-hero-banner">
            <div class="hub-hero-content">
              <div class="hub-brand-pill">
                <span>⚡</span> NEXUS HUB
              </div>
              <h1 class="hub-hero-title">
                Book the right space<br>for every idea
              </h1>
              <p class="hub-hero-desc">
                Modern meeting rooms for productive discussions, workshops and client calls.
              </p>
              <div class="hub-hero-tags">
                <span class="hub-feature-pill"><span class="pill-dot green"></span> Instant Booking</span>
                <span class="hub-feature-pill"><span class="pill-dot blue"></span> Real-time Availability</span>
                <span class="hub-feature-pill"><span class="pill-dot orange"></span> Flexible Durations</span>
                <span class="hub-feature-pill"><span class="pill-dot purple"></span> Integrated Calendar</span>
              </div>
            </div>

            <div class="hub-hero-visual">
              <img src="/assets/rooms/banner-hero.jpg" alt="Meeting Room" onerror="this.src='/assets/landing/hero.jpg'">
            </div>
          </div>

          <!-- 2. SEARCH & BOOKING FILTER BOX -->
          <div class="hub-search-panel">
            <!-- Row 1: Date, Time Window, People / Capacity, Search CTA -->
            <div class="hub-search-row-1">
              <div style="display: flex; align-items: center; gap: 6px;">
                <label class="hub-input-select" title="Select meeting date" style="flex: 1; margin: 0; min-width: 0;">
                  <span>📅</span>
                  <input type="date" value="${this.selectedDate}" onchange="MeetingRoomsModule.setDate(this.value)" style="font-family: inherit; font-size: 13px; width: 100%;">
                </label>
                <button type="button" class="hub-cat-chip ${isToday ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${todayStr}')" style="height: 42px; padding: 0 10px; margin: 0; white-space: nowrap; font-size: 11px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center;">Today</button>
                <button type="button" class="hub-cat-chip ${isTomorrow ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${tomorrowStr}')" style="height: 42px; padding: 0 10px; margin: 0; white-space: nowrap; font-size: 11px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center;">Next Day</button>
              </div>

              <div class="hub-input-select" title="Select time window">
                <span>⏰</span>
                <select onchange="MeetingRoomsModule.filterSession = this.value; MeetingRoomsModule.render();">
                  <option value="all" ${this.filterSession === 'all' ? 'selected' : ''}>09:00 AM – 11:00 AM (Morning)</option>
                  <option value="morning" ${this.filterSession === 'morning' ? 'selected' : ''}>08:00 AM – 11:00 AM (Full Morning)</option>
                  <option value="afternoon" ${this.filterSession === 'afternoon' ? 'selected' : ''}>03:00 PM – 07:00 PM (Afternoon)</option>
                </select>
                <span>▾</span>
              </div>

              <div class="hub-input-select" title="Filter by people / capacity">
                <span>👥</span>
                <select onchange="MeetingRoomsModule.setFilterCapacity(this.value)">
                  <option value="all" ${(!this.filterCapacity || this.filterCapacity === 'all') ? 'selected' : ''}>All Capacities</option>
                  <option value="4" ${this.filterCapacity === '4' ? 'selected' : ''}>4+ People</option>
                  <option value="6" ${this.filterCapacity === '6' ? 'selected' : ''}>6+ People</option>
                  <option value="8" ${this.filterCapacity === '8' ? 'selected' : ''}>8+ People</option>
                </select>
                <span>▾</span>
              </div>

              <button type="button" class="hub-btn-search" onclick="App.showToast('🔍 Matching available rooms refreshed', 'info'); MeetingRoomsModule.render();">
                Search Rooms
              </button>
            </div>

            <!-- Row 2: Category Chips & More Filters -->
            <div class="hub-categories-row">
              <button type="button" class="hub-cat-chip ${(!this.filterCategory || this.filterCategory === 'all') ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCategory('all')">All Rooms</button>
              <button type="button" class="hub-cat-chip ${this.filterCategory === 'meeting' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCategory('meeting')">Meeting Room</button>
              <button type="button" class="hub-cat-chip ${this.filterCategory === 'conference' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCategory('conference')">Conference Room</button>
              <button type="button" class="hub-cat-chip ${this.filterCategory === 'training' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCategory('training')">Training Room</button>
              <button type="button" class="hub-cat-chip ${this.filterCategory === 'pitch' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCategory('pitch')">Pitch Room</button>
              <button type="button" class="hub-cat-chip ${this.filterCategory === 'boardroom' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCategory('boardroom')">Boardroom</button>
              <button type="button" class="hub-cat-chip ${this.filterCategory === 'event' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCategory('event')">Event Space</button>

              <button type="button" class="hub-btn-more-filters" onclick="MeetingRoomsModule.toggleMoreFiltersPanel()">
                <span>⚙</span> <span>More Filters</span>
              </button>
            </div>

            <!-- Collapsible Advanced Filters Drawer -->
            <div id="hub-more-filters-drawer" style="display: ${this.showMoreFilters ? 'block' : 'none'}; background: #f8fafc; border: 1.5px solid #ede9fe; border-radius: 14px; padding: 14px 18px; margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 12px; font-weight: 800; color: #1e1b4b;">🛠️ Advanced Room Filters &amp; Attributes</span>
                <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.resetFilters()" style="font-size: 11px; padding: 2px 8px;">Clear All</button>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 12px;">
                <div>
                  <label style="font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Price Range</label>
                  <select class="form-control" style="font-size: 11.5px; height: 30px; padding: 2px 8px;" onchange="App.showToast('Price filter applied: ' + this.value, 'info')">
                    <option value="all">Any Price</option>
                    <option value="under1000">Under ₹1,000/hr</option>
                    <option value="1000-2000">₹1,000 – ₹2,000/hr</option>
                    <option value="above2000">Above ₹2,000/hr</option>
                  </select>
                </div>
                <div>
                  <label style="font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Floor / Location</label>
                  <select class="form-control" style="font-size: 11.5px; height: 30px; padding: 2px 8px;" onchange="App.showToast('Location filter set', 'info')">
                    <option value="all">All Wings (Cyber City Hub)</option>
                    <option value="l1">Level 1 • Executive Wing</option>
                    <option value="l2">Level 2 • Innovation Wing</option>
                    <option value="l3">Level 3 • DeepTech Arena</option>
                  </select>
                </div>
                <div>
                  <label style="font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Availability Only</label>
                  <button type="button" class="btn btn-sm ${this.filterAvailableOnly ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.toggleAvailableOnly()" style="width: 100%; font-size: 11px; height: 30px; font-weight: 700;">
                    ${this.filterAvailableOnly ? '🟢 Only Open Slots' : 'Show All Rooms'}
                  </button>
                </div>
              </div>
            </div>

            <!-- Row 3: Quick Amenity Toggles -->
            <div class="hub-amenities-row">
              <button type="button" class="hub-amenity-chip ${this.filterAmenity === 'projector' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterAmenity(this.classList.contains('active') ? 'all' : 'projector')">
                <span>📽️</span> Projector
              </button>
              <button type="button" class="hub-amenity-chip ${this.filterAmenity === 'video' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterAmenity(this.classList.contains('active') ? 'all' : 'video')">
                <span>📹</span> Video Conferencing
              </button>
              <button type="button" class="hub-amenity-chip ${this.filterAmenity === 'whiteboard' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterAmenity(this.classList.contains('active') ? 'all' : 'whiteboard')">
                <span>📋</span> Whiteboard
              </button>
              <button type="button" class="hub-amenity-chip" onclick="App.showToast('Filtered by 4K TV/Display', 'info')">
                <span>🖥️</span> TV/Display
              </button>
              <button type="button" class="hub-amenity-chip ${this.filterAmenity === 'audio' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterAmenity(this.classList.contains('active') ? 'all' : 'audio')">
                <span>🎙️</span> Audio/Mic
              </button>
              <button type="button" class="hub-amenity-chip" onclick="App.showToast('Catering amenity filter enabled', 'info')">
                <span>☕</span> Catering
              </button>
              <button type="button" class="hub-amenity-chip" onclick="App.showToast('Accessible rooms only', 'info')">
                <span>♿</span> Accessible
              </button>
              <button type="button" class="hub-amenity-chip" onclick="App.showToast('Natural light preference set', 'info')">
                <span>☀️</span> Natural Light
              </button>
            </div>
          </div>

          <!-- Floor & People Compact Filter Bar -->
          <div class="hub-floor-bar">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="hub-floor-label">
                <span>🏢</span> Floor:
              </span>
              <div class="hub-floor-segmented">
                <button type="button" class="hub-floor-pill ${(!this.filterFloor || this.filterFloor === 'all') ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterFloor('all')">All Floors</button>
                ${['1F', '2F', '3F', '4F', '5F', '6F', '7F'].map(fl => `
                  <button type="button" class="hub-floor-pill ${this.filterFloor === fl ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterFloor('${fl}')">${fl}</button>
                `).join('')}
              </div>
            </div>

            <div style="width: 1px; height: 20px; background: #e2e8f0; margin: 0 4px;" class="hide-mobile"></div>

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="hub-floor-label">
                <span>👥</span> People:
              </span>
              <div class="hub-floor-segmented">
                <button type="button" class="hub-floor-pill ${(!this.filterCapacity || this.filterCapacity === 'all') ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCapacity('all')">All</button>
                <button type="button" class="hub-floor-pill ${this.filterCapacity === '4' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCapacity('4')">4+</button>
                <button type="button" class="hub-floor-pill ${this.filterCapacity === '6' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCapacity('6')">6+</button>
                <button type="button" class="hub-floor-pill ${this.filterCapacity === '8' ? 'active' : ''}" onclick="MeetingRoomsModule.setFilterCapacity('8')">8+</button>
              </div>
            </div>

            <div style="margin-left: auto; font-size: 11.5px; color: #64748b; font-weight: 700;">
              ${this.filterFloor === '5F' ? '0 Rooms on 5F' : `Showing ${filteredRooms.length} of 10 Rooms`}
            </div>
          </div>

          <!-- 3. AVAILABLE ROOMS HEADER & VIEW TOGGLES -->
          <div class="hub-rooms-header">
            <div class="hub-rooms-title-wrap">
              <h3 class="hub-rooms-heading">Available Rooms</h3>
              <span class="hub-count-pill">${availableRoomsCount} rooms available</span>
              ${this.filterFloor && this.filterFloor !== 'all' ? `<span class="hub-count-pill" style="background:#EDE9FE; color:#4338CA; margin-left:6px;">Floor: ${this.filterFloor}</span>` : ''}
            </div>

            <div class="hub-view-switcher">
              <button type="button" class="hub-view-btn active" onclick="MeetingRoomsModule.setSchedulerViewMode('cards')">
                <span>🎴</span> Cards
              </button>
              <button type="button" class="hub-view-btn" onclick="MeetingRoomsModule.setSchedulerViewMode('compare')">
                <span>📑</span> List
              </button>
              <button type="button" class="hub-view-btn" onclick="MeetingRoomsModule.setSchedulerViewMode('day')">
                <span>📅</span> Calendar
              </button>
            </div>
          </div>

          <!-- 4. CLEAN 3-COLUMN ROOM CARDS GRID -->
          <div class="hub-rooms-grid">
            ${this.filterFloor === '5F' ? `
              <div class="hub-empty-floor-card">
                <div style="font-size: 38px; margin-bottom: 8px;">🏢</div>
                <h4 style="font-size: 17px; font-weight: 800; color: #1e1b4b; margin: 0 0 6px 0;">No meeting rooms on this floor (5F)</h4>
                <p style="font-size: 13.5px; color: #64748b; max-width: 440px; margin: 0 auto 16px auto; line-height: 1.5;">This floor currently has no meeting rooms. Please select another floor to explore available spaces.</p>
                <button type="button" class="btn btn-primary" onclick="MeetingRoomsModule.setFilterFloor('all')" style="border-radius: 10px; font-weight: 700; padding: 8px 18px;">
                  View All Floors
                </button>
              </div>
            ` : filteredRooms.length === 0 ? `
              <div class="hub-empty-floor-card">
                <div style="font-size: 34px; margin-bottom: 8px;">🔍</div>
                <h4 style="font-size: 16px; font-weight: 800; color: #1e1b4b; margin: 0 0 6px 0;">No matching meeting rooms</h4>
                <p style="font-size: 13px; color: #64748b; max-width: 400px; margin: 0 auto 14px auto;">No rooms match the selected filters on this date.</p>
                <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.resetFilters()" style="font-weight: 700;">
                  Clear All Filters
                </button>
              </div>
            ` : filteredRooms.map(r => this.renderRoomCard(r, myStartup)).join('')}
          </div>

        </div>

        <!-- RIGHT SIDEBAR (330px): QUICK ACTIONS, TODAY'S SCHEDULE, UPCOMING & CREDITS -->
        <aside class="hub-right-sidebar">
          
          <!-- Widget 1: Quick Actions -->
          <div class="hub-quick-actions-card">
            <h4 class="hub-widget-title">Quick Actions</h4>
            <div class="hub-actions-grid">
              <div class="hub-action-tile" onclick="MeetingRoomsModule.openBookModal()" title="Reserve a new room">
                <span class="tile-icon">📅</span>
                <span class="tile-label">Book a Room</span>
              </div>
              <div class="hub-action-tile" onclick="MeetingRoomsModule.switchTab('myBookings')" title="View My Bookings">
                <span class="tile-icon">📑</span>
                <span class="tile-label">My Bookings</span>
              </div>
              <div class="hub-action-tile" onclick="MeetingRoomsModule.openBookModal(null, null, null, null, true)" title="Schedule recurring series">
                <span class="tile-icon">🔄</span>
                <span class="tile-label">Recurring</span>
              </div>
              <div class="hub-action-tile" onclick="App.showToast('Invite Guests modal ready', 'info')" title="Invite external meeting attendees">
                <span class="tile-icon">👥</span>
                <span class="tile-label">Invite Guests</span>
              </div>
            </div>
          </div>

          <!-- Widget 2: Today's Schedule -->
          <div class="hub-schedule-card">
            <div class="hub-widget-title">
              <span>Today's Schedule</span>
              <a class="hub-widget-link" onclick="MeetingRoomsModule.switchTab('calendar')">View Calendar</a>
            </div>

            <div class="hub-timeline-list">
              <div class="hub-timeline-item">
                <div class="hub-timeline-time">09:00 AM<br>11:00 AM</div>
                <div class="hub-timeline-bar green"></div>
                <div class="hub-timeline-info">
                  <strong>Product Planning</strong>
                  <span>Boardroom Alpha • 👥 8</span>
                </div>
                <button type="button" class="hub-timeline-more">•••</button>
              </div>

              <div class="hub-timeline-item">
                <div class="hub-timeline-time">11:30 AM<br>01:00 PM</div>
                <div class="hub-timeline-bar blue"></div>
                <div class="hub-timeline-info">
                  <strong>Client Meeting</strong>
                  <span>Pitch Arena Nexus • 👥 4</span>
                </div>
                <button type="button" class="hub-timeline-more">•••</button>
              </div>

              <div class="hub-timeline-item">
                <div class="hub-timeline-time">02:00 PM<br>03:00 PM</div>
                <div class="hub-timeline-bar orange"></div>
                <div class="hub-timeline-info">
                  <strong>Team Sync</strong>
                  <span>Focus Room • 👥 3</span>
                </div>
                <button type="button" class="hub-timeline-more">•••</button>
              </div>

              <div class="hub-timeline-item">
                <div class="hub-timeline-time">03:30 PM<br>05:00 PM</div>
                <div class="hub-timeline-bar purple"></div>
                <div class="hub-timeline-info">
                  <strong>Design Review</strong>
                  <span>Collaboration Room • 👥 6</span>
                </div>
                <button type="button" class="hub-timeline-more">•••</button>
              </div>
            </div>
          </div>

          <!-- Widget 3: My Upcoming Bookings -->
          <div class="hub-upcoming-card">
            <div class="hub-widget-title">
              <span>My Upcoming Bookings</span>
              <a class="hub-widget-link" onclick="MeetingRoomsModule.switchTab('myBookings')">View All</a>
            </div>

            <div class="hub-upcoming-item">
              <div class="hub-upcoming-date">Today<br>03:00 PM</div>
              <div class="hub-upcoming-title">
                <strong>Design Review</strong>
                <span>Collaboration Room</span>
              </div>
              <span class="hub-status-pill confirmed">Confirmed</span>
            </div>

            <div class="hub-upcoming-item">
              <div class="hub-upcoming-date">31 Oct<br>10:00 AM</div>
              <div class="hub-upcoming-title">
                <strong>Weekly Sync</strong>
                <span>Pitch Arena Nexus</span>
              </div>
              <span class="hub-status-pill confirmed">Confirmed</span>
            </div>

            <div class="hub-upcoming-item">
              <div class="hub-upcoming-date">02 Nov<br>11:00 AM</div>
              <div class="hub-upcoming-title">
                <strong>Product Demo</strong>
                <span>Boardroom Alpha</span>
              </div>
              <span class="hub-status-pill pending">Pending</span>
            </div>
          </div>

          <!-- Widget 4: Usage & Credits -->
          <div class="hub-credits-card">
            <div class="hub-widget-title">
              <span>Usage &amp; Credits</span>
              <span style="font-size: 11px; font-weight: 800; color: #16a34a;">2 hrs free remaining (this month)</span>
            </div>

            <div style="background: #e0e7ff; height: 7px; border-radius: 999px; overflow: hidden; margin: 10px 0 8px 0;">
              <div style="background: linear-gradient(90deg, #6366f1, #3b82f6); width: 80%; height: 100%; border-radius: 999px;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; font-weight: 700;">
              <span>8 / 10 hours used</span>
              <a class="hub-widget-link" onclick="MeetingRoomsModule.switchTab('creditsBilling')">View Details</a>
            </div>
          </div>

        </aside>

      </div>
      </div>

      <!-- Sticky Multi-Select Booking Action Bar -->
      ${this.renderStickyBookingBar(rooms, myStartup)}
    `;
  },

  formatScheduleDisplay(dateStr, startTime, endTime, durationHours) {
    if (!dateStr) return { dateFormatted: '', timeFormatted: '', durStr: '' };
    const parts = String(dateStr).split('-');
    let dateFormatted = dateStr;
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dateFormatted = `${days[dt.getUTCDay()]}, ${d} ${months[dt.getUTCMonth()]}`;
    }
    const start12 = this.formatTimeTo12Hour(startTime);
    const end12 = this.formatTimeTo12Hour(endTime);
    const durStr = durationHours ? ` (${Number(durationHours).toFixed(1)} hrs)` : '';
    return {
      dateFormatted,
      timeFormatted: `${start12} – ${end12} IST`,
      durStr
    };
  },

  formatDateSectionHeader(dateStr, todayStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    let dayMonth = dateStr;
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dayMonth = `${days[dt.getUTCDay()]}, ${d} ${months[dt.getUTCMonth()]}`;
    }

    if (dateStr === todayStr) {
      return `Today • ${dayMonth}`;
    }
    const todayDt = new Date();
    const yestDt = new Date(todayDt.getTime() - 86400000);
    const yesterdayStr = `${yestDt.getFullYear()}-${String(yestDt.getMonth() + 1).padStart(2, '0')}-${String(yestDt.getDate()).padStart(2, '0')}`;
    if (dateStr === yesterdayStr) {
      return `Yesterday • ${dayMonth}`;
    }
    return dayMonth;
  },

  getFilteredMyBookings(myBookings) {
    const { todayStr, liveTimeStr } = this.getISTNow();
    let list = [...(myBookings || this.getMyBookings())];

    if (this.myBookingsDateFrom) {
      list = list.filter(b => b.date >= this.myBookingsDateFrom);
    }
    if (this.myBookingsDateTo) {
      list = list.filter(b => b.date <= this.myBookingsDateTo);
    }
    if (this.myBookingsRoomFilter && this.myBookingsRoomFilter !== 'all') {
      list = list.filter(b => b.roomId === this.myBookingsRoomFilter);
    }
    if (this.myBookingsStatusFilter === 'past' || this.myBookingsStatusFilter === 'completed') {
      list = list.filter(b => (b.date < todayStr || (b.date === todayStr && b.endTime <= liveTimeStr)) && b.status !== 'Cancelled');
    } else if (this.myBookingsStatusFilter === 'cancelled') {
      list = list.filter(b => b.status === 'Cancelled');
    } else if (this.myBookingsStatusFilter === 'upcoming') {
      list = list.filter(b => (b.date > todayStr || (b.date === todayStr && b.endTime > liveTimeStr)) && b.status !== 'Cancelled');
    }

    if (this.myBookingsSearch && this.myBookingsSearch.trim()) {
      const q = this.myBookingsSearch.trim().toLowerCase();
      list = list.filter(b => {
        return (
          (b.id && b.id.toLowerCase().includes(q)) ||
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.purpose && b.purpose.toLowerCase().includes(q)) ||
          (b.bookedBy && b.bookedBy.toLowerCase().includes(q)) ||
          (b.roomName && b.roomName.toLowerCase().includes(q)) ||
          (b.date && b.date.toLowerCase().includes(q)) ||
          (b.startTime && b.startTime.includes(q)) ||
          (b.endTime && b.endTime.includes(q))
        );
      });
    }

    // Sorting
    if (this.myBookingsSortBy === 'date') {
      list.sort((a, b) => {
        const cmp = a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || '');
        return this.myBookingsSortDir === 'asc' ? cmp : -cmp;
      });
    } else if (this.myBookingsSortBy === 'duration') {
      list.sort((a, b) => {
        const da = this.calculateBookingDuration(a.startTime, a.endTime);
        const db = this.calculateBookingDuration(b.startTime, b.endTime);
        return this.myBookingsSortDir === 'asc' ? da - db : db - da;
      });
    } else if (this.myBookingsSortBy === 'room') {
      list.sort((a, b) => {
        const cmp = (a.roomName || '').localeCompare(b.roomName || '');
        return this.myBookingsSortDir === 'asc' ? cmp : -cmp;
      });
    } else if (this.myBookingsSortBy === 'status') {
      list.sort((a, b) => {
        const cmp = (a.status || '').localeCompare(b.status || '');
        return this.myBookingsSortDir === 'asc' ? cmp : -cmp;
      });
    } else {
      // Default: Upcoming & In-Progress first (soonest first), then past bookings (newest first)
      list.sort((a, b) => {
        const aUpcoming = a.status !== 'Cancelled' && (a.date > todayStr || (a.date === todayStr && a.endTime > liveTimeStr));
        const bUpcoming = b.status !== 'Cancelled' && (b.date > todayStr || (b.date === todayStr && b.endTime > liveTimeStr));
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;
        if (aUpcoming && bUpcoming) {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.startTime || '').localeCompare(b.startTime || '');
        } else {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return (b.startTime || '').localeCompare(a.startTime || '');
        }
      });
    }

    return list;
  },

  renderMyBookingsView({ myStartup, myBookings }) {
    const rawRole = (window.store && window.store.currentRole) || 'founder';
    const currentRole = (window.store && window.store.normalizeRole) ? window.store.normalizeRole(rawRole) : rawRole;
    const { todayStr, liveTimeStr } = this.getISTNow();

    // Active Reservations = upcoming + in-progress only (exclude completed and cancelled)
    const inProgressBookings = myBookings.filter(b => b.status !== 'Cancelled' && b.date === todayStr && b.startTime <= liveTimeStr && b.endTime > liveTimeStr);
    const upcomingBookings = myBookings.filter(b => b.status !== 'Cancelled' && (b.date > todayStr || (b.date === todayStr && b.startTime > liveTimeStr)));
    const activeReservationsCount = inProgressBookings.length + upcomingBookings.length;

    // Scheduled Today = today's bookings not yet completed
    const scheduledTodayList = myBookings.filter(b => b.status !== 'Cancelled' && b.date === todayStr && b.endTime > liveTimeStr);

    // Non-cancelled bookings for stats
    const nonCancelledBookings = myBookings.filter(b => b.status !== 'Cancelled');
    const totalHoursBooked = nonCancelledBookings.reduce((acc, b) => acc + this.calculateBookingDuration(b.startTime, b.endTime), 0);
    const totalFeesBilled = nonCancelledBookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0);

    // Single source of truth: Monthly allowance per calendar month
    const currMonth = todayStr.slice(0, 7);
    const allowance = (window.store && window.store.getMonthlyAllowance)
      ? window.store.getMonthlyAllowance(myStartup.id, currMonth)
      : {
          monthLabel: 'Nov',
          includedHours: Number(myStartup.includedMeetingHours || 15),
          usedHours: 0,
          remainingHours: Number(myStartup.includedMeetingHours || 15),
          overageHours: 0,
          overageFee: 0
        };

    // Categorized sets for filter tabs & badge counts (Upcoming | Past | Cancelled)
    const upcomingList = myBookings.filter(b => (b.date > todayStr || (b.date === todayStr && b.endTime > liveTimeStr)) && b.status !== 'Cancelled');
    const pastList = myBookings.filter(b => (b.date < todayStr || (b.date === todayStr && b.endTime <= liveTimeStr)) && b.status !== 'Cancelled');
    const cancelledList = myBookings.filter(b => b.status === 'Cancelled');

    // Filtered and sorted dataset
    const filteredList = this.getFilteredMyBookings(myBookings);
    const filteredHours = filteredList.reduce((acc, b) => acc + (b.status !== 'Cancelled' ? this.calculateBookingDuration(b.startTime, b.endTime) : 0), 0);

    // Pagination
    const pageSize = this.myBookingsPageSize || 25;
    const totalItems = filteredList.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(1, this.myBookingsPage || 1), totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedList = filteredList.slice(startIndex, endIndex);

    const rooms = window.store.getMeetingRooms();
    const isFiltered = (
      this.myBookingsStatusFilter !== 'upcoming' ||
      (this.myBookingsRoomFilter && this.myBookingsRoomFilter !== 'all') ||
      (this.myBookingsSearch && this.myBookingsSearch.trim() !== '') ||
      Boolean(this.myBookingsDateFrom) ||
      Boolean(this.myBookingsDateTo)
    );

    // Group recurring series on the active page
    const seriesGroups = {};
    paginatedList.forEach(b => {
      const sId = b.seriesId || (b.recurrence && b.recurrence.frequency ? `series-${b.roomId}-${b.startTime}` : null);
      if (sId) {
        if (!seriesGroups[sId]) seriesGroups[sId] = [];
        seriesGroups[sId].push(b);
      }
    });

    const sortIndicator = (col) => {
      if (this.myBookingsSortBy !== col) return ' ↕';
      return this.myBookingsSortDir === 'asc' ? ' ↑' : ' ↓';
    };

    return `
      <!-- My Booked Rooms Banner & 4 KPI Cards -->
      <div style="margin-bottom: 22px;">
        <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px;">
          <!-- 1. Active Reservations -->
          <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(37, 99, 235, 0.3);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Active Reservations</span>
              <div class="kpi-icon-wrap" style="color: #2563eb;">🎟️</div>
            </div>
            <div class="kpi-value" style="font-size: 26px; font-weight: 800; color: #2563eb;">${activeReservationsCount} Bookings</div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>${scheduledTodayList.length} Scheduled Today • ${upcomingBookings.length} Upcoming</span>
            </div>
          </div>

          <!-- 2. Total Hours Booked -->
          <div class="kpi-card" style="padding: 16px; border: 1.5px solid var(--border-subtle);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Total Hours Booked</span>
              <div class="kpi-icon-wrap" style="color: #38bdf8;">⏰</div>
            </div>
            <div class="kpi-value" style="font-size: 26px; font-weight: 800; color: var(--text-primary);">${totalHoursBooked.toFixed(1)} Hours</div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>${myBookings.length} Total Sessions Recorded</span>
            </div>
          </div>

          <!-- 3. Monthly Credit Balance (Single Source of Truth) -->
          <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(34, 197, 94, 0.3);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Monthly Credit Balance</span>
              <div class="kpi-icon-wrap" style="color: #16a34a;">💳</div>
            </div>
            <div class="kpi-value" style="font-size: 26px; font-weight: 800; color: #16a34a;">${allowance.remainingHours.toFixed(1)} hrs free</div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>${allowance.usedHours.toFixed(1)} hrs consumed of ${allowance.includedHours.toFixed(1)} hrs allowance</span>
            </div>
          </div>

          <!-- 4. Booking Fees & Overages -->
          <div class="kpi-card" style="padding: 16px; border: 1.5px solid var(--border-subtle);">
            <div class="kpi-header">
              <span class="kpi-title" style="font-size: 12px; font-weight: 700; text-transform: uppercase;">Booking Fees &amp; Overages</span>
              <div class="kpi-icon-wrap" style="color: var(--accent-primary);">💰</div>
            </div>
            <div class="kpi-value" style="font-size: 24px; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ₹${totalFeesBilled.toLocaleString('en-IN')}
            </div>
            <div class="kpi-footer" style="font-size: 11.5px; color: var(--text-muted);">
              <span>${allowance.overageHours > 0 ? `${allowance.overageHours.toFixed(1)}h overage billed` : '✓ 100% within plan allowance'}</span>
            </div>
          </div>
        </div>

        <!-- Master Card: My Meeting Room Bookings Table -->
        <div class="card" style="margin-bottom: 24px; padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
          
          <!-- Card Header & Actions -->
          <div style="padding: 18px 22px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span>📋 My Meeting Room Bookings &amp; Reservations</span>
                </h3>
                <span class="badge badge-primary" style="font-size: 11px; font-weight: 700; padding: 2px 8px;">
                  ${filteredList.length} of ${myBookings.length} Logged
                </span>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin: 3px 0 0 0;">
                Live reservation ledger, session schedules, hourly credit allowance, and overage billing report.
              </p>
            </div>

            <!-- View Switcher & Export / Action Buttons -->
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <!-- View Switcher (Table vs Cards) -->
              <div style="display: flex; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: 8px; padding: 3px; gap: 2px;">
                <button class="btn btn-sm ${this.myBookingsViewMode === 'table' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setMyBookingsViewMode('table')" style="font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: none;" title="Decluttered Table View" aria-label="Table View">
                  📊 Table
                </button>
                <button class="btn btn-sm ${this.myBookingsViewMode === 'cards' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setMyBookingsViewMode('cards')" style="font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: none;" title="Visual Cards View" aria-label="Cards View">
                  🎴 Cards
                </button>
              </div>

              <!-- Export CSV Button (Respects active filters) -->
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.exportMyBookingsCSV()" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" title="Export filtered bookings to CSV spreadsheet" aria-label="Export CSV">
                <span>📥</span> <span>Export CSV</span>
              </button>

              <!-- Print / PDF Report Button (Respects active filters) -->
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.printMyBookingsReport()" style="font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" title="Print formal report of filtered bookings" aria-label="Print Report">
                <span>🖨️</span> <span>Print Report</span>
              </button>

              <!-- + New Booking Button -->
              <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openBookModal(null, null, '${myStartup.id}')" style="font-weight: 700; padding: 5px 14px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" aria-label="Book a Room">
                <span>⚡</span> <span>+ Book Room</span>
              </button>
            </div>
          </div>

          <!-- Interactive Search, Date-Range & Filtering Toolbar -->
          <div style="padding: 12px 20px; background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <!-- Search Input -->
              <div style="position: relative; min-width: 220px; flex: 1; max-width: 280px;">
                <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-muted); pointer-events: none;">🔍</span>
                <input 
                  type="text" 
                  id="my-bookings-search-input"
                  placeholder="Search purpose, room, ref..." 
                  value="${this.myBookingsSearch || ''}"
                  oninput="MeetingRoomsModule.setMyBookingsSearch(this.value)"
                  aria-label="Search bookings by purpose, room, or ref"
                  style="width: 100%; padding: 6px 10px 6px 30px; font-size: 12px; border-radius: 6px; border: 1px solid var(--border-medium); background: var(--bg-surface-elevated); color: var(--text-primary);"
                >
                ${this.myBookingsSearch ? `
                  <button onclick="MeetingRoomsModule.setMyBookingsSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: none; background: transparent; font-size: 11px; cursor: pointer; color: var(--text-muted);" aria-label="Clear search">✕</button>
                ` : ''}
              </div>

              <!-- Date Range Filter: From & To -->
              <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary);">
                <span>📅 From:</span>
                <input 
                  type="date" 
                  value="${this.myBookingsDateFrom || ''}" 
                  onchange="MeetingRoomsModule.setMyBookingsDateRange(this.value, MeetingRoomsModule.myBookingsDateTo)"
                  aria-label="Filter bookings from date"
                  style="padding: 5px 8px; font-size: 11.5px; border-radius: 6px; border: 1px solid var(--border-medium); background: var(--bg-surface-elevated); color: var(--text-primary);"
                >
                <span>To:</span>
                <input 
                  type="date" 
                  value="${this.myBookingsDateTo || ''}" 
                  onchange="MeetingRoomsModule.setMyBookingsDateRange(MeetingRoomsModule.myBookingsDateFrom, this.value)"
                  aria-label="Filter bookings to date"
                  style="padding: 5px 8px; font-size: 11.5px; border-radius: 6px; border: 1px solid var(--border-medium); background: var(--bg-surface-elevated); color: var(--text-primary);"
                >
              </div>

              <!-- Room Selector Dropdown -->
              <select 
                onchange="MeetingRoomsModule.setMyBookingsRoomFilter(this.value)"
                aria-label="Filter bookings by room"
                style="padding: 6px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid var(--border-medium); background: var(--bg-surface-elevated); color: var(--text-primary); cursor: pointer;"
              >
                <option value="all" ${this.myBookingsRoomFilter === 'all' ? 'selected' : ''}>🏢 All Meeting Spaces</option>
                ${rooms.map(r => `
                  <option value="${r.id}" ${this.myBookingsRoomFilter === r.id ? 'selected' : ''}>${r.icon} ${r.name} (${r.capacity} Pax)</option>
                `).join('')}
              </select>

              ${isFiltered ? `
                <button class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.resetMyBookingsFilters()" style="font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 6px; color: var(--text-secondary);" aria-label="Clear all filters">
                  ✕ Clear filters
                </button>
              ` : ''}
            </div>

            <!-- Tabs: Upcoming | Past | Cancelled (Default view is Upcoming) -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn btn-sm ${this.myBookingsStatusFilter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}" onclick="MeetingRoomsModule.setMyBookingsStatusFilter('upcoming')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700;" aria-label="Show upcoming bookings">
                Upcoming (${upcomingList.length})
              </button>
              <button class="btn btn-sm ${this.myBookingsStatusFilter === 'past' ? 'btn-primary' : 'btn-secondary'}" onclick="MeetingRoomsModule.setMyBookingsStatusFilter('past')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700;" aria-label="Show past bookings">
                Past (${pastList.length})
              </button>
              <button class="btn btn-sm ${this.myBookingsStatusFilter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}" onclick="MeetingRoomsModule.setMyBookingsStatusFilter('cancelled')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700;" aria-label="Show cancelled bookings">
                Cancelled (${cancelledList.length})
              </button>
              ${this.myBookingsStatusFilter === 'all' ? `
                <button class="btn btn-sm btn-primary" onclick="MeetingRoomsModule.setMyBookingsStatusFilter('all')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700;" aria-label="Show all bookings">
                  All (${myBookings.length})
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Content: Decluttered Table or Cards Grid -->
          ${this.myBookingsViewMode === 'table' ? `
            <div class="table-wrapper my-bookings-table-wrapper" style="overflow-x: auto; position: relative;">
              <table class="nexus-table my-bookings-table" style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 0; font-size: 12.5px;">
                <thead>
                  <tr style="background: var(--bg-surface-elevated);">
                    <!-- 1. Room (Sticky Left) -->
                    <th class="col-room" style="position: sticky; left: 0; background: var(--bg-surface-elevated); z-index: 6; box-shadow: 3px 0 6px rgba(0,0,0,0.04); cursor: pointer;" onclick="MeetingRoomsModule.toggleRowSort('room')">
                      Room${sortIndicator('room')}
                    </th>
                    <!-- 2. Purpose & Attendees -->
                    <th class="col-purpose">
                      Purpose &amp; Attendees
                    </th>
                    <!-- 3. Time (IST Header) -->
                    <th class="col-time" style="cursor: pointer;" onclick="MeetingRoomsModule.toggleRowSort('date')">
                      Time (IST)${sortIndicator('date')}
                    </th>
                    <!-- 4. Usage -->
                    <th class="col-usage" style="cursor: pointer;" onclick="MeetingRoomsModule.toggleRowSort('duration')">
                      Usage${sortIndicator('duration')}
                    </th>
                    <!-- 5. Status -->
                    <th class="col-status" style="cursor: pointer;" onclick="MeetingRoomsModule.toggleRowSort('status')">
                      Status${sortIndicator('status')}
                    </th>
                    <!-- 6. Sticky Actions Header -->
                    <th class="col-actions" style="text-align: right; position: sticky; right: 0; background: var(--bg-surface-elevated); z-index: 6; box-shadow: -3px 0 6px rgba(0,0,0,0.06); padding-right: 16px;">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${paginatedList.length === 0 ? `
                    <tr>
                      <td colspan="6" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
                        <div style="font-size: 32px; margin-bottom: 8px;">🎟️</div>
                        <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">
                          No meeting room bookings match your filter criteria.
                        </div>
                        <p style="font-size: 12px; margin: 6px auto 14px; max-width: 400px;">
                          Try adjusting date filters or search query, or reserve a conference room now.
                        </p>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                          ${isFiltered ? `
                            <button class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.resetMyBookingsFilters()" aria-label="Clear filters">
                              Clear filters
                            </button>
                          ` : ''}
                          <button class="btn btn-sm btn-primary" onclick="MeetingRoomsModule.openBookModal(null, null, '${myStartup.id}')" aria-label="Book a Room">
                            + Book a Room
                          </button>
                        </div>
                      </td>
                    </tr>
                  ` : (() => {
                    const renderedRows = [];
                    const renderedSeries = new Set();
                    let currentDateSection = null;

                    paginatedList.forEach(b => {
                      // Date section header grouping
                      if (b.date !== currentDateSection) {
                        currentDateSection = b.date;
                        const headerTitle = this.formatDateSectionHeader(b.date, todayStr);
                        renderedRows.push(`
                          <tr class="date-section-header-row" style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #f1f5f9;">
                            <td colspan="6" style="padding: 10px 18px;">
                              <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="badge" style="background: #ede9fe; color: #4338ca; font-size: 11.5px; font-weight: 800; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.2px;">
                                  📅 ${headerTitle}
                                </span>
                                <span style="height: 1px; flex: 1; background: #e2e8f0;"></span>
                              </div>
                            </td>
                          </tr>
                        `);
                      }

                      const sId = b.seriesId;
                      const isSeriesParent = sId && seriesGroups[sId] && seriesGroups[sId].length > 1;

                      // Recurring series master row
                      if (isSeriesParent && !renderedSeries.has(sId)) {
                        renderedSeries.add(sId);
                        const group = seriesGroups[sId];
                        const isExpanded = Boolean(this.expandedSeries[sId]);
                        const firstItem = group[0];
                        const lastItem = group[group.length - 1];
                        const sRoom = window.store.getMeetingRoomById(firstItem.roomId);
                        const totalSeriesHours = group.reduce((acc, item) => acc + this.calculateBookingDuration(item.startTime, item.endTime), 0);
                        const durClean = totalSeriesHours === 1 ? '1 hr' : `${totalSeriesHours.toFixed(1)} hrs`;
                        const upcomingCount = group.filter(item => !this.isBookingCompleted(item) && item.status !== 'Cancelled').length;

                        renderedRows.push(`
                          <tr style="background: rgba(147, 51, 234, 0.04); border-top: 2px solid rgba(147, 51, 234, 0.2); font-weight: 600;">
                            <td class="col-room" style="position: sticky; left: 0; background: var(--bg-surface); z-index: 5; box-shadow: 3px 0 6px rgba(0,0,0,0.04); white-space: nowrap;">
                              <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 18px;">${firstItem.roomIcon || '🏢'}</span>
                                <div style="min-width: 0; overflow: hidden;">
                                  <strong style="color: var(--text-primary); font-size: 12.5px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; display: block;">${firstItem.roomName}</strong>
                                  <div style="font-size: 10.5px; color: var(--text-muted);">${sRoom ? sRoom.floor : '6F'} • ${sRoom ? sRoom.capacity : 4} Pax</div>
                                </div>
                              </div>
                            </td>
                            <td class="col-purpose" style="min-width: 0;">
                              <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-family: var(--font-mono); font-weight: 800; color: #7e22ce; font-size: 11px;">🔁 Series</span>
                                <span style="font-weight: 700; color: var(--text-primary); font-size: 12.5px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${firstItem.title || 'Enterprise Architecture & Client Demo'}">
                                  ${firstItem.title || 'Enterprise Architecture & Client Demo'}
                                </span>
                              </div>
                              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                👥 <strong>${firstItem.attendees}</strong> • ${group.length} occurrences (${firstItem.date} → ${lastItem.date})
                              </div>
                            </td>
                            <td class="col-time" style="white-space: nowrap;">
                              <div style="font-weight: 700; color: var(--text-primary); font-size: 12px;">
                                ${this.formatTimeTo12Hour(firstItem.startTime)} – ${this.formatTimeTo12Hour(firstItem.endTime)}, ${this.calculateBookingDuration(firstItem.startTime, firstItem.endTime) === 1 ? '1 hr' : `${this.calculateBookingDuration(firstItem.startTime, firstItem.endTime).toFixed(1)} hrs`}
                              </div>
                            </td>
                            <td class="col-usage" style="white-space: nowrap;">
                              <span style="font-weight: 700; font-size: 12px; color: var(--text-primary);">${durClean}</span>
                            </td>
                            <td class="col-status" style="white-space: nowrap;">
                              <span style="display: inline-flex; align-items: center; gap: 5px; font-weight: 700; color: #7e22ce; font-size: 11px;">
                                <span style="width: 7px; height: 7px; border-radius: 50%; background: #9333ea; display: inline-block;"></span>
                                ${upcomingCount} upcoming / ${group.length}
                              </span>
                            </td>
                            <td class="col-actions" style="white-space: nowrap; text-align: right; position: sticky; right: 0; background: var(--bg-surface); z-index: 5; box-shadow: -3px 0 6px rgba(0,0,0,0.06); padding-right: 16px;">
                              <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                                <button type="button" class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.toggleSeriesExpansion('${sId}')" style="font-size: 11px; padding: 4px 9px; font-weight: 700; border-radius: 6px; color: #7e22ce; border-color: rgba(147, 51, 234, 0.4);" aria-label="Toggle series expansion">
                                  ${isExpanded ? '▲ Hide' : `▼ Show ${group.length}`}
                                </button>
                                <button type="button" class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.handleCancelRecurringSeries('${sId}', '${firstItem.roomId}')" style="font-size: 11px; padding: 4px 8px; font-weight: 700; border-radius: 6px; color: #dc2626; border-color: rgba(220, 38, 38, 0.35);" title="Cancel entire recurring series" aria-label="Cancel entire recurring series">
                                  Cancel Series
                                </button>
                              </div>
                            </td>
                          </tr>
                        `);

                        if (isExpanded) {
                          group.forEach((item, idx) => {
                            renderedRows.push(this.renderDeclutteredRowHtml(item, myStartup, currentRole, todayStr, liveTimeStr, true, idx + 1, group.length));
                          });
                        }
                        return;
                      }

                      if (isSeriesParent) return;

                      renderedRows.push(this.renderDeclutteredRowHtml(b, myStartup, currentRole, todayStr, liveTimeStr, false));
                    });

                    return renderedRows.join('');
                  })()}
                </tbody>
              </table>
            </div>

            <!-- Table Summary & Pagination Footer -->
            <div style="padding: 12px 20px; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--text-muted);">
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span>
                  Showing <strong>${totalItems}</strong> reservations (<strong>${filteredHours.toFixed(1)} hrs</strong>)
                </span>
                <span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #15803d; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  <span>💳</span> <span>${allowance.monthLabel || allowance.monthName || 'November'}: ${allowance.usedHours.toFixed(1)} / ${allowance.includedHours.toFixed(1)} hrs used • <strong>${allowance.remainingHours.toFixed(1)} hrs free remaining</strong></span>
                </span>
                ${totalPages > 1 ? `
                  <span>•</span>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>Per page:</span>
                    <select onchange="MeetingRoomsModule.setMyBookingsPageSize(this.value)" style="padding: 3px 6px; font-size: 11.5px; border-radius: 5px; border: 1px solid var(--border-medium); background: var(--bg-surface); color: var(--text-primary); cursor: pointer;" aria-label="Bookings per page">
                      <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
                      <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                      <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                    </select>
                  </div>
                ` : ''}
              </div>

              <!-- Pagination Controls (Hidden when totalPages <= 1) -->
              ${totalPages > 1 ? `
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button 
                    class="btn btn-sm btn-outline" 
                    ${currentPage <= 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : `onclick="MeetingRoomsModule.setMyBookingsPage(${currentPage - 1})"`}
                    style="font-size: 11px; padding: 4px 10px; border-radius: 6px;"
                    aria-label="Previous page"
                  >
                    ◀ Prev
                  </button>
                  <span style="font-weight: 700; color: var(--text-primary); padding: 0 4px;">
                    Page ${currentPage} of ${totalPages}
                  </span>
                  <button 
                    class="btn btn-sm btn-outline" 
                    ${currentPage >= totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : `onclick="MeetingRoomsModule.setMyBookingsPage(${currentPage + 1})"`}
                    style="font-size: 11px; padding: 4px 10px; border-radius: 6px;"
                    aria-label="Next page"
                  >
                    Next ▶
                  </button>
                </div>
              ` : ''}

              <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
                <span>Total Reserved: <strong style="color: var(--text-primary); font-family: var(--font-mono);">${totalHoursBooked.toFixed(1)} hrs</strong></span>
                <span>•</span>
                <span>Total Fees: <strong style="color: #2563eb; font-family: var(--font-mono);">${totalFeesBilled > 0 ? `₹${totalFeesBilled.toLocaleString('en-IN')}` : '₹0 (100% Free)'}</strong></span>
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
                  ${paginatedList.map(b => {
                    const bRoom = window.store.getMeetingRoomById(b.roomId);
                    const dur = this.calculateBookingDuration(b.startTime, b.endTime);
                    const isCompleted = this.isBookingCompleted(b);
                    const sched = this.formatScheduleDisplay(b.date, b.startTime, b.endTime, dur);
                    const roomCap = (bRoom && bRoom.capacity) || b.capacity || 4;
                    const isOverCap = b.attendees > roomCap;

                    return `
                    <div class="my-booking-card" style="${b.status === 'Cancelled' ? 'opacity: 0.75; border-color: rgba(100, 116, 139, 0.3);' : ''}">
                      <div class="my-booking-stripe" style="${b.status === 'Cancelled' ? 'background: #94a3b8;' : ''}"></div>
                      
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <span style="font-size: 26px; width: 44px; height: 44px; border-radius: 10px; background: rgba(37, 99, 235, 0.1); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(37, 99, 235, 0.25);">
                            ${b.roomIcon || '🏢'}
                          </span>
                          <div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                              <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">${b.roomName}</h4>
                              <span class="badge" style="background: #ede9fe; color: #4338ca; font-size: 9.5px; padding: 1px 6px; font-weight: 800;">${bRoom ? (bRoom.floor || '1F') : '1F'}</span>
                            </div>
                            <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
                              ${b.id} • ${roomCap} Pax Max
                              ${isOverCap ? `<span class="badge" style="background: #fee2e2; color: #b91c1c; font-size: 9.5px; padding: 1px 4px; font-weight: 700; margin-left: 4px;">⚠️ Over capacity</span>` : ''}
                            </div>
                          </div>
                        </div>
                        <span class="badge ${b.status === 'Cancelled' ? 'badge-subtle' : isCompleted ? 'badge-secondary' : 'badge-success'}" style="font-size: 11px; padding: 3px 9px;">
                          ${b.status === 'Cancelled' ? '🚫 Cancelled' : isCompleted ? '✓ Completed' : '● Upcoming'}
                        </span>
                      </div>

                      <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle); margin: 12px 0;">
                        <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
                          🎯 ${b.title || b.purpose || 'Executive Review Session'}
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 11.5px; color: var(--text-secondary);">
                          <span>📅 <strong>${sched.dateFormatted}</strong></span>
                          <span>•</span>
                          <span style="font-weight: 700; color: #2563eb;">⏰ ${sched.timeFormatted}${sched.durStr}</span>
                          <span>•</span>
                          <span>👥 <strong>${b.attendees} Pax</strong> ${(b.bookedBy && b.bookedBy !== 'Alex Morgan') ? `(Booked by: <strong>${b.bookedBy}</strong>)` : ''}</span>
                        </div>
                      </div>

                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; gap: 8px;">
                        <div>
                          ${b.status === 'Cancelled' ? `
                            <span class="badge" style="background: rgba(100, 116, 139, 0.12); color: #64748b;">🚫 Cancelled</span>
                          ` : Number(b.cost) > 0 ? `
                            <span class="badge badge-warning" style="font-weight: 700;">⚠️ ₹${Number(b.cost).toLocaleString('en-IN')} Overage</span>
                          ` : `
                            <span class="badge badge-success" style="font-weight: 700;">✓ ${dur === 1 ? '1 hr' : `${dur.toFixed(1)} hrs`}</span>
                          `}
                        </div>
                        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                          <button class="btn btn-sm btn-primary" onclick="MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700;" aria-label="View booking details">
                            📋 Details
                          </button>
                          ${b.status !== 'Cancelled' && !isCompleted ? `
                            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openEditTimeWindowModal('${b.roomId}', '${b.id}')" style="font-size: 11.5px; padding: 5px 9px; border-radius: 6px; color: #2563eb; border-color: rgba(37,99,235,0.4);" aria-label="Reschedule booking">
                              Reschedule
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openCancellationModal('${b.roomId}', '${b.id}')" style="font-size: 11.5px; padding: 5px 10px; border-radius: 6px; color: #dc2626; border-color: rgba(239, 68, 68, 0.4);" aria-label="Cancel booking">
                              Cancel
                            </button>
                          ` : isCompleted ? `
                            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openBookModal('${b.roomId}', null, '${myStartup.id}')" style="font-size: 11.5px; padding: 5px 9px; border-radius: 6px; color: #2563eb; border-color: rgba(37,99,235,0.4);" aria-label="Rebook room">
                              Rebook
                            </button>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          `}
        </div>
      </div>
    `;
  },

  renderDeclutteredRowHtml(b, myStartup, currentRole, todayStr, liveTimeStr, isIndented = false, occurrenceIdx = 1, totalOccurrences = 1) {
    const dur = this.calculateBookingDuration(b.startTime, b.endTime);
    const durStrClean = dur === 1 ? '1 hr' : `${dur.toFixed(1)} hrs`;
    const bRoom = window.store.getMeetingRoomById(b.roomId);
    const roomCap = (bRoom && bRoom.capacity) || b.capacity || 4;
    const isOverCap = b.attendees > roomCap;
    const isCompleted = this.isBookingCompleted(b);
    const isCancelled = b.status === 'Cancelled';
    const isToday = b.date === todayStr;

    const start12 = this.formatTimeTo12Hour(b.startTime);
    const end12 = this.formatTimeTo12Hour(b.endTime);

    const sMins = this.parseTimeToMinutes(b.startTime);
    const eMins = this.parseTimeToMinutes(b.endTime);
    const nowMins = this.parseTimeToMinutes(liveTimeStr);

    const isInProgress = !isCancelled && isToday && (nowMins >= sMins && nowMins < eMins);
    const isStartingSoon = !isCancelled && isToday && (sMins > nowMins && (sMins - nowMins) <= 60);
    const minsUntilStart = isStartingSoon ? (sMins - nowMins) : 0;
    const isCheckInOpen = !isCancelled && isToday && (nowMins >= (sMins - 15) && nowMins < eMins);

    // Status: Small dot + Label
    let statusDotHtml = '';
    if (isCancelled) {
      statusDotHtml = `
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #64748b; font-size: 11.5px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; display: inline-block;"></span>
          Cancelled
        </span>
      `;
    } else if (isCompleted) {
      statusDotHtml = `
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #475569; font-size: 11.5px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #64748b; display: inline-block;"></span>
          Completed
        </span>
      `;
    } else if (isInProgress) {
      statusDotHtml = `
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: #16a34a; font-size: 11.5px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #16a34a; display: inline-block; box-shadow: 0 0 0 2px rgba(22,163,74,0.25);"></span>
          In progress
        </span>
      `;
    } else if (isStartingSoon) {
      statusDotHtml = `
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: #b45309; font-size: 11.5px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span>
          Starts in ${minsUntilStart} min
        </span>
      `;
    } else {
      statusDotHtml = `
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #2563eb; font-size: 11.5px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span>
          Upcoming
        </span>
      `;
    }

    // Actions: 1 primary button + "..." overflow menu
    let primaryBtnHtml = '';
    let menuItemsHtml = '';

    if (isCancelled) {
      primaryBtnHtml = `
        <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openBookModal('${b.roomId}', null, '${myStartup.id}')" style="font-size: 11px; padding: 4px 10px; font-weight: 700; color: #2563eb; border-color: rgba(37,99,235,0.4);" aria-label="Rebook room">
          Rebook
        </button>
      `;
      menuItemsHtml = `
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')" aria-label="View booking details">
          <span>📋</span> <span>Details</span>
        </button>
      `;
    } else if (isCompleted) {
      primaryBtnHtml = `
        <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openBookModal('${b.roomId}', null, '${myStartup.id}')" style="font-size: 11px; padding: 4px 10px; font-weight: 700; color: #2563eb; border-color: rgba(37,99,235,0.4);" aria-label="Book this room again">
          Rebook
        </button>
      `;
      menuItemsHtml = `
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')" aria-label="View booking details">
          <span>📋</span> <span>Details</span>
        </button>
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.printReservationSlip('${b.roomId}', '${b.id}')" aria-label="${Number(b.cost) > 0 ? 'Download invoice receipt' : 'View usage summary'}">
          <span>🧾</span> <span>${Number(b.cost) > 0 ? 'Download Receipt' : 'Usage summary'}</span>
        </button>
      `;
    } else if (isInProgress) {
      primaryBtnHtml = `
        <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.handleQuickExtend('${b.roomId}', '${b.id}', 30)" style="font-size: 11px; padding: 4px 10px; font-weight: 700;" aria-label="Extend reservation by 30 mins">
          Extend
        </button>
      `;
      menuItemsHtml = `
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.handleEndEarly('${b.roomId}', '${b.id}')" aria-label="End meeting session early">
          <span>⏹️</span> <span>End early</span>
        </button>
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')" aria-label="View booking details">
          <span>📋</span> <span>Details</span>
        </button>
      `;
    } else {
      // Upcoming
      if (isCheckInOpen) {
        primaryBtnHtml = `
          <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.checkInBooking('${b.roomId}', '${b.id}')" style="font-size: 11px; padding: 4px 10px; font-weight: 700; background: #16a34a; border-color: #16a34a; color: #fff;" aria-label="Check in to booking">
            Check-in
          </button>
        `;
      } else {
        primaryBtnHtml = `
          <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openEditTimeWindowModal('${b.roomId}', '${b.id}')" style="font-size: 11px; padding: 4px 10px; font-weight: 700; color: #2563eb; border-color: rgba(37,99,235,0.4);" aria-label="Reschedule reservation">
            Reschedule
          </button>
        `;
      }
      menuItemsHtml = `
        ${!isCheckInOpen ? `
          <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.openEditTimeWindowModal('${b.roomId}', '${b.id}')" aria-label="Reschedule reservation">
            <span>🔄</span> <span>Reschedule</span>
          </button>
        ` : ''}
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.handleQuickExtend('${b.roomId}', '${b.id}', 30)" aria-label="Extend booking by 30 mins">
          <span>⏰</span> <span>Extend (+30m)</span>
        </button>
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.openCancellationModal('${b.roomId}', '${b.id}')" style="color: #dc2626;" aria-label="Cancel reservation">
          <span>🚫</span> <span>Cancel</span>
        </button>
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')" aria-label="View booking details">
          <span>📋</span> <span>Details</span>
        </button>
        <button class="row-menu-item" onclick="MeetingRoomsModule.closeAllRowMenus(); MeetingRoomsModule.downloadBookingIcs('${b.id}')" aria-label="Add to Calendar (.ics)">
          <span>📅</span> <span>Add to Calendar (.ics)</span>
        </button>
      `;
    }

    return `
      <tr style="transition: all 0.15s ease; ${isIndented ? 'background: rgba(147, 51, 234, 0.02);' : ''}">
        <!-- 1. Room (Sticky Left) -->
        <td class="col-room" style="position: sticky; left: 0; background: var(--bg-surface); z-index: 5; box-shadow: 3px 0 6px rgba(0,0,0,0.04); white-space: nowrap; ${isIndented ? 'padding-left: 28px;' : ''}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px; width: 30px; height: 30px; border-radius: 7px; background: rgba(37, 99, 235, 0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${b.roomIcon || '🏢'}
            </span>
            <div style="min-width: 0; overflow: hidden;">
              <strong style="color: var(--text-primary); font-size: 12.5px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; display: block;" title="${b.roomName}">
                ${isIndented ? '↳ ' : ''}${b.roomName}
              </strong>
              <div style="font-size: 10.5px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                <span>${bRoom ? (bRoom.floor || '1F') : '1F'}</span>
                <span>•</span>
                <span>${roomCap} Pax</span>
              </div>
            </div>
          </div>
        </td>

        <!-- 2. Purpose & Attendees -->
        <td class="col-purpose" style="min-width: 0;">
          <div style="font-weight: 700; color: var(--text-primary); font-size: 12.5px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 250px;" title="${b.title || b.purpose || 'Meeting'}">
            ${b.title || b.purpose || 'Meeting'}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; margin-top: 2px; white-space: nowrap;">
            <span title="${b.attendees} attendees" style="white-space: nowrap; font-weight: 600;">👥 ${b.attendees}</span>
            ${isOverCap ? `
              <span class="badge" title="Over capacity: ${b.attendees} attendees booked in ${roomCap} pax room" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-size: 9.5px; padding: 1px 5px; font-weight: 700; white-space: nowrap;">
                ⚠️ Over capacity
              </span>
            ` : ''}
            ${(b.bookedBy && b.bookedBy !== 'Alex Morgan') ? `
              <span style="color: var(--text-muted);">•</span>
              <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="Booked by ${b.bookedBy}">By: <strong>${b.bookedBy}</strong></span>
            ` : ''}
          </div>
        </td>

        <!-- 3. Time (IST) -->
        <td class="col-time" style="white-space: nowrap;">
          <div style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">
            ${start12} – ${end12}
          </div>
          ${(!isCompleted && !isCancelled) ? `
            <div style="display: flex; gap: 4px; margin-top: 4px;">
              <button type="button" onclick="MeetingRoomsModule.syncBookingWithProvider('${b.roomId}', '${b.id}', 'google')" style="font-size: 9px; padding: 1px 5px; border-radius: 4px; border: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); color: #2563eb; cursor: pointer;" title="Sync to Google Calendar" aria-label="Sync to Google Calendar">+GCal</button>
              <button type="button" onclick="MeetingRoomsModule.syncBookingWithProvider('${b.roomId}', '${b.id}', 'outlook')" style="font-size: 9px; padding: 1px 5px; border-radius: 4px; border: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); color: #0284c7; cursor: pointer;" title="Sync to Outlook" aria-label="Sync to Outlook">+Outlook</button>
            </div>
          ` : ''}
        </td>

        <!-- 4. Usage (Clear & Free Indicator) -->
        <td class="col-usage" style="white-space: nowrap;">
          <div style="font-weight: 700; font-size: 12.5px; color: var(--text-primary);">${durStrClean}</div>
          ${b.status === 'Cancelled' ? `
            <div style="margin-top: 3px;">
              <span class="badge" style="background: #f1f5f9; color: #64748b; font-size: 9.5px; padding: 1px 6px; font-weight: 600; border-radius: 4px;">Refunded</span>
            </div>
          ` : Number(b.cost) > 0 ? `
            <div style="margin-top: 3px;">
              <span class="badge" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 9.5px; padding: 1px 6px; font-weight: 700; border-radius: 4px;">
                ⚠️ ₹${Number(b.cost).toLocaleString('en-IN')} overage
              </span>
            </div>
          ` : `
            <div style="margin-top: 3px;">
              <span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.25); font-size: 9.5px; padding: 1px 6px; font-weight: 700; border-radius: 4px;">
                ✓ Free (Plan)
              </span>
            </div>
          `}
        </td>

        <!-- 5. Status (Dot + Label) -->
        <td class="col-status" style="white-space: nowrap;">
          ${statusDotHtml}
        </td>

        <!-- 6. Sticky Actions Column -->
        <td class="col-actions" style="white-space: nowrap; text-align: right; position: sticky; right: 0; background: var(--bg-surface); z-index: 5; box-shadow: -3px 0 6px rgba(0,0,0,0.06); padding: 8px 16px 8px 8px;">
          <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center; flex-wrap: nowrap;">
            ${primaryBtnHtml}
            <div class="meeting-row-menu-wrapper" style="position: relative; display: inline-block;">
              <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.toggleRowMenu(event, '${b.id}')" style="font-size: 13px; padding: 3px 7px; line-height: 1; border-color: var(--border-medium); color: var(--text-secondary);" title="More options" aria-label="More actions for booking ${b.id}">
                ⋯
              </button>
              <div id="room-menu-${b.id}" class="meeting-row-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; z-index: 1000; min-width: 165px; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.18); padding: 5px; text-align: left;">
                ${menuItemsHtml}
              </div>
            </div>
          </div>
        </td>
      </tr>
    `;
  },

  renderBookingRowHtml(b, myStartup, currentRole, todayStr, liveTimeStr, isIndented = false, occurrenceIdx = 1, totalOccurrences = 1) {
    return this.renderDeclutteredRowHtml(b, myStartup, currentRole, todayStr, liveTimeStr, isIndented, occurrenceIdx, totalOccurrences);
  },

  formatTimeTo12Hour(time24) {
    if (!time24) return '';
    if (typeof time24 === 'string' && (time24.includes('AM') || time24.includes('PM'))) {
      return time24.trim();
    }
    const parts = String(time24).split(':');
    let h = parseInt(parts[0], 10);
    if (isNaN(h)) return time24;
    const m = parts[1] ? parts[1].slice(0, 2) : '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h < 10 ? '0' : ''}${h}:${m} ${ampm}`;
  },

  renderAllBookingsView({ allBookings, myStartup }) {
    const rawStartups = (window.store && window.store.getStartups) ? window.store.getStartups() : [];
    const currentRole = (window.store && window.store.currentRole) || 'founder';
    const startups = currentRole === 'founder'
      ? rawStartups.filter(s => s.id === myStartup.id || (s.name && s.name.toLowerCase() === myStartup.name.toLowerCase()))
      : rawStartups;

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
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: center; white-space: nowrap;">Details</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: center; white-space: nowrap;">Cancel</th>
              </tr>
            </thead>
            <tbody>
              ${allBookings.length === 0 ? `
                <tr><td colspan="8" style="padding: 40px; text-align: center; color: var(--text-muted);">No reservations recorded in database</td></tr>
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
                    <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
                      <button class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px; color: #2563eb; border-color: rgba(37,99,235,0.4); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;" onclick="MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')">
                        <span>📋</span><span>Details</span>
                      </button>
                    </td>
                    <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
                      ${this.isBookingCompleted(b) ? `
                        <button class="btn btn-outline btn-sm" disabled style="padding: 4px 10px; font-size: 11px; color: #64748b; border-color: rgba(100, 116, 139, 0.3); white-space: nowrap; flex-shrink: 0; font-weight: 600; background: rgba(100, 116, 139, 0.08); opacity: 0.65; cursor: not-allowed;" title="Completed meetings cannot be cancelled">
                          <span>✓</span> <span>Completed</span>
                        </button>
                      ` : `
                        <button class="btn btn-outline btn-sm" style="padding: 4px 12px; font-size: 11px; color: #dc2626; border-color: rgba(239, 68, 68, 0.4); white-space: nowrap; flex-shrink: 0; font-weight: 700; background: rgba(239, 68, 68, 0.04);" onclick="MeetingRoomsModule.openCancellationModal('${b.roomId}', '${b.id}')">
                          <span>❌</span> <span>Cancel</span>
                        </button>
                      `}
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

  // Tab 2: Booking Calendar View (Day View, Week View, Month View, Room-Specific Schedules, 30m & 60m Slots)
  renderBookingCalendarTabView(data) {
    if (this.schedulerViewMode === 'cards') {
      this.activeTab = 'scheduler';
      return this.renderSchedulerView(data);
    }
    if (!['day', 'week', 'month', 'compare'].includes(this.schedulerViewMode)) {
      this.schedulerViewMode = 'day';
    }
    return this.renderSchedulerView(data);
  },

  // Tab 4: Credits & Billing View (Single Source of Truth, Quota Tracker, Reconciled Ledger, GST Invoices & Top-Up)
  creditsBillingSubTab: 'overview', // 'overview' | 'ledger' | 'invoices' | 'profile'
  creditsBillingMonth: null, // null defaults to current IST month
  ledgerTypeFilter: 'all',
  ledgerSearch: '',
  invoiceStatusFilter: 'all',
  invoiceSearch: '',

  setCreditsBillingSubTab(tab) {
    this.creditsBillingSubTab = tab;
    this.render();
  },

  setCreditsBillingMonth(month) {
    this.creditsBillingMonth = month;
    this.render();
  },

  setLedgerTypeFilter(type) {
    this.ledgerTypeFilter = type;
    this.render();
  },

  setLedgerSearch(q) {
    this.ledgerSearch = q;
    this.render();
    const input = document.getElementById('ledger-search-input');
    if (input) {
      input.focus();
      input.value = q;
      input.setSelectionRange(q.length, q.length);
    }
  },

  setInvoiceStatusFilter(status) {
    this.invoiceStatusFilter = status;
    this.render();
  },

  setInvoiceSearch(q) {
    this.invoiceSearch = q;
    this.render();
    const input = document.getElementById('invoice-search-input');
    if (input) {
      input.focus();
      input.value = q;
      input.setSelectionRange(q.length, q.length);
    }
  },

  exportLedgerCSV() {
    const startup = this.getMyStartup();
    const istNow = this.getISTNow();
    const targetMonth = this.creditsBillingMonth || istNow.todayStr.substring(0, 7);
    const rooms = (data && data.rooms) || (window.store && window.store.getMeetingRooms ? window.store.getMeetingRooms() : []);
    const cs = (typeof window !== 'undefined' && window.creditService) ? window.creditService : require('../../creditService');
    const bs = (typeof window !== 'undefined' && window.billingService) ? window.billingService : require('../../billingService');

    const allowance = cs.getMonthlyAllowance(startup, rooms, targetMonth, startup.topUps || []);
    const ledger = allowance.ledger || [];

    const headers = ['Date', 'Time', 'Type', 'Description', 'Booking Ref', 'Credits', 'Hours', 'Running Balance Credits', 'Running Balance Hours', 'Expires On'];
    const rows = [headers.join(',')];

    ledger.forEach(entry => {
      const row = [
        bs.sanitizeCSVCell(entry.displayDate || entry.date),
        bs.sanitizeCSVCell(entry.time),
        bs.sanitizeCSVCell(entry.typeLabel || entry.type),
        bs.sanitizeCSVCell(entry.description),
        bs.sanitizeCSVCell(entry.bookingRef || 'N/A'),
        bs.sanitizeCSVCell(entry.creditsDisplay),
        bs.sanitizeCSVCell(entry.hoursDisplay),
        bs.sanitizeCSVCell(entry.runningBalanceCredits),
        bs.sanitizeCSVCell(entry.runningBalanceHours),
        bs.sanitizeCSVCell(entry.expiresAt || 'N/A')
      ];
      rows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `nexus-credits-ledger-${targetMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`📊 Exported credit ledger for ${targetMonth} (${ledger.length} entries).`, 'success');
    }
  },

  renderCreditsAndBillingView(data) {
    const startup = data.myStartup || (window.store && window.store.getActiveStartup ? window.store.getActiveStartup() : null) || {
      id: 'STP-XYZ',
      name: 'XYZ Technologies',
      subscriptionPlan: 'Startup Plan',
      includedMeetingHours: 15
    };

    const istNow = this.getISTNow();
    const currentMonth = istNow.todayStr.substring(0, 7);
    const targetMonth = this.creditsBillingMonth || currentMonth;
    const rooms = (data && data.rooms) || (window.store && window.store.getMeetingRooms ? window.store.getMeetingRooms() : []);

    // Use unified server-side creditService (Single Source of Truth)
    const cs = (typeof window !== 'undefined' && window.creditService) ? window.creditService : require('../../creditService');
    const bs = (typeof window !== 'undefined' && window.billingService) ? window.billingService : require('../../billingService');

    const allowance = cs.getMonthlyAllowance(startup, rooms, targetMonth, startup.topUps || []);
    const subTab = this.creditsBillingSubTab || 'overview';

    // SVG Donut calculation - SHOW USED
    const circumference = 301.59;
    const strokeOffset = Math.max(0, (circumference * (1 - (allowance.pctUsed / 100))).toFixed(2));

    // User Role for Permission Checks
    const rawRole = (window.store && window.store.currentRole) || 'founder';
    const currentRole = (window.store && window.store.normalizeRole) ? window.store.normalizeRole(rawRole) : rawRole;
    const isAdmin = currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'incubator_admin' || currentRole === 'finance_admin';

    // Invoices list for this startup
    const allInvoices = (window.store && window.store.getInvoices) ? window.store.getInvoices() : [];
    let startupInvoices = allInvoices.filter(inv => !inv.startupId || inv.startupId === startup.id || inv.startupName === startup.name);
    if (startupInvoices.length === 0) startupInvoices = allInvoices.slice(0, 5);

    // Latest or Next Due Invoice
    const nextDueInvoice = startupInvoices.find(inv => {
      const s = bs.evaluateInvoiceStatus(inv, istNow.todayStr);
      return s === 'Overdue' || s === 'Pending';
    }) || startupInvoices[0];
    const nextDueStatus = nextDueInvoice ? bs.evaluateInvoiceStatus(nextDueInvoice, istNow.todayStr) : 'Paid';
    const isNextDuePendingOrOverdue = nextDueStatus === 'Pending' || nextDueStatus === 'Overdue';

    return `
      <div style="display: flex; flex-direction: column; gap: 20px; animation: fadeIn 0.25s ease;">
        <!-- Top Page Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; color: var(--text-muted, #8A90A2); text-transform: uppercase; margin-bottom: 4px;">
              Billing &amp; Meeting Room Credits
            </div>
            <h2 style="font-size: 26px; font-weight: 900; color: var(--text-primary, #111827); margin: 0; letter-spacing: -0.02em;">
              Billing &amp; Meeting Room Credits
            </h2>
            <p style="font-size: 13px; color: var(--text-muted, #64748B); margin: 4px 0 0 0;">
              Single source of truth for credit allowances, strictly segregated monthly reset, GST invoices, and top-up checkout.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <!-- Month Selector -->
            <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-surface-elevated, #F8FAFC); border: 1px solid var(--border-subtle, #ECEEF4); padding: 4px 10px; border-radius: 10px;">
              <span style="font-size: 12px;">📅</span>
              <select onchange="MeetingRoomsModule.setCreditsBillingMonth(this.value)" style="border: none; background: transparent; font-size: 12px; font-weight: 800; color: var(--text-primary, #111827); cursor: pointer;" aria-label="Select billing month">
                <option value="2026-11" ${targetMonth === '2026-11' ? 'selected' : ''}>November 2026 (Active)</option>
                <option value="2026-10" ${targetMonth === '2026-10' ? 'selected' : ''}>October 2026</option>
                <option value="2026-09" ${targetMonth === '2026-09' ? 'selected' : ''}>September 2026</option>
              </select>
            </div>

            <!-- Purchase Extra Credits CTA -->
            <button
              type="button"
              onclick="MeetingRoomsModule.openCreditTopUpModal('${startup.id}')"
              class="btn btn-primary"
              style="background: #4F3FE0; border-color: #4338CA; color: #ffffff; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(79, 63, 224, 0.25);"
            >
              <span style="font-size: 15px;">+</span>
              <span>Purchase Extra Credits</span>
            </button>
          </div>
        </div>

        <!-- Overage Warning Banner (At >= 80% usage or active overage) -->
        ${allowance.showOverageWarning ? `
          <div style="background: ${allowance.overageCredits > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.1)'}; border: 1.5px solid ${allowance.overageCredits > 0 ? '#EF4444' : '#F59E0B'}; border-radius: 14px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">${allowance.overageCredits > 0 ? '⚠️' : '⚡'}</span>
              <div>
                <div style="font-size: 13px; font-weight: 900; color: ${allowance.overageCredits > 0 ? '#B91C1C' : '#B45309'};">
                  ${allowance.overageCredits > 0 ? `Quota Exceeded! ${allowance.overageHours} hrs (${allowance.overageCredits} cr) overage billed` : `Quota Alert: ${allowance.pctUsed}% of monthly allowance consumed`}
                </div>
                <div style="font-size: 11.5px; color: ${allowance.overageCredits > 0 ? '#DC2626' : '#92400E'}; margin-top: 2px;">
                  Overage penalty rate is <strong>₹1,500/hr</strong>. Top up extra credits now at <strong>₹500/hr</strong> to save ₹1,000/hr on room bookings!
                </div>
              </div>
            </div>
            <button
              type="button"
              onclick="MeetingRoomsModule.openCreditTopUpModal('${startup.id}')"
              class="btn btn-sm"
              style="background: ${allowance.overageCredits > 0 ? '#DC2626' : '#D97706'}; color: #ffffff; border: none; font-weight: 800; font-size: 12px; padding: 6px 16px; border-radius: 8px; cursor: pointer;"
            >
              Top Up Now &amp; Save
            </button>
          </div>
        ` : ''}

        <!-- Sub-Tab Navigation Bar -->
        <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--border-subtle, #ECEEF4); padding-bottom: 8px; overflow-x: auto;">
          <button
            type="button"
            onclick="MeetingRoomsModule.setCreditsBillingSubTab('overview')"
            style="border: none; background: ${subTab === 'overview' ? '#4F3FE0' : 'transparent'}; color: ${subTab === 'overview' ? '#ffffff' : 'var(--text-muted, #64748B)'}; font-size: 12.5px; font-weight: 800; padding: 8px 18px; border-radius: 10px; cursor: pointer; transition: all 0.15s ease;"
          >
            📊 Quota &amp; Overview
          </button>
          <button
            type="button"
            onclick="MeetingRoomsModule.setCreditsBillingSubTab('ledger')"
            style="border: none; background: ${subTab === 'ledger' ? '#4F3FE0' : 'transparent'}; color: ${subTab === 'ledger' ? '#ffffff' : 'var(--text-muted, #64748B)'}; font-size: 12.5px; font-weight: 800; padding: 8px 18px; border-radius: 10px; cursor: pointer; transition: all 0.15s ease;"
          >
            📑 Full Credit Ledger (${allowance.ledger.length})
          </button>
          <button
            type="button"
            onclick="MeetingRoomsModule.setCreditsBillingSubTab('invoices')"
            style="border: none; background: ${subTab === 'invoices' ? '#4F3FE0' : 'transparent'}; color: ${subTab === 'invoices' ? '#ffffff' : 'var(--text-muted, #64748B)'}; font-size: 12.5px; font-weight: 800; padding: 8px 18px; border-radius: 10px; cursor: pointer; transition: all 0.15s ease;"
          >
            🧾 GST Tax Invoices (${startupInvoices.length})
          </button>
          <button
            type="button"
            onclick="MeetingRoomsModule.setCreditsBillingSubTab('payments')"
            style="border: none; background: ${subTab === 'payments' ? '#4F3FE0' : 'transparent'}; color: ${subTab === 'payments' ? '#ffffff' : 'var(--text-muted, #64748B)'}; font-size: 12.5px; font-weight: 800; padding: 8px 18px; border-radius: 10px; cursor: pointer; transition: all 0.15s ease;"
          >
            💳 Payment History &amp; Receipts
          </button>
          <button
            type="button"
            onclick="MeetingRoomsModule.setCreditsBillingSubTab('profile')"
            style="border: none; background: ${subTab === 'profile' ? '#4F3FE0' : 'transparent'}; color: ${subTab === 'profile' ? '#ffffff' : 'var(--text-muted, #64748B)'}; font-size: 12.5px; font-weight: 800; padding: 8px 18px; border-radius: 10px; cursor: pointer; transition: all 0.15s ease;"
          >
            ⚙️ Plan &amp; Billing Profile
          </button>
        </div>

        <!-- TAB 1: OVERVIEW & QUOTA -->
        ${subTab === 'overview' ? `
          <!-- Section: Three Modern KPI Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
            <!-- Card 1: Available Credit Balance -->
            <div class="nexus-billing-kpi-card">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(79, 63, 224, 0.1); color: #4F3FE0; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                      🪙
                    </div>
                    <div>
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #8A90A2);">Available Balance</span>
                      <div style="font-size: 26px; font-weight: 900; color: var(--text-primary, #111827); margin-top: 2px;">
                        ${allowance.remainingCredits} <span style="font-size: 14px; font-weight: 700; color: var(--text-muted, #64748B);">credits · ${allowance.remainingHours.toFixed(1)} hrs</span>
                      </div>
                    </div>
                  </div>
                  <span class="badge" style="background: ${allowance.statusColor}20; color: ${allowance.statusColor}; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 999px;">
                    ${allowance.statusLabel}
                  </span>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted, #64748B); margin-top: 16px; font-weight: 600;">
                  <span>${allowance.usedCredits} credits used (${allowance.pctUsed}%)</span>
                  <span style="font-weight: 800; color: #4F3FE0;">${allowance.totalAvailableCredits} credits total</span>
                </div>

                <!-- Progress Bar: Direction SHOW USED -->
                <div style="width: 100%; height: 8px; background: var(--bg-surface-elevated, #EEEBFF); border-radius: 999px; margin-top: 8px; overflow: hidden;">
                  <div style="height: 100%; background: ${allowance.statusColor}; border-radius: 999px; width: ${allowance.pctUsed}%; transition: width 0.4s ease;"></div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 600; color: var(--text-muted, #8A90A2); padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--border-subtle, #ECEEF4);">
                <span>10 credits = 1.0 hour</span>
                <span>Plan: ${allowance.remainingPlanCredits} cr • Top-up: ${allowance.remainingTopUpCredits} cr</span>
              </div>
            </div>

            <!-- Card 2: Monthly Free Hours -->
            <div class="nexus-billing-kpi-card">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); color: #059669; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                      ⏱️
                    </div>
                    <div>
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #8A90A2);">Monthly Free Hours</span>
                      <div style="font-size: 26px; font-weight: 900; color: #059669; margin-top: 2px;">
                        ${allowance.remainingHours.toFixed(1)} <span style="font-size: 14px; font-weight: 700; color: #059669;">hrs left · ${allowance.remainingCredits} cr</span>
                      </div>
                    </div>
                  </div>
                  <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #059669; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 999px;">
                    ${allowance.monthLabel}
                  </span>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted, #64748B); margin-top: 16px; font-weight: 600;">
                  <span>${allowance.usedHours.toFixed(1)} / ${allowance.totalAvailableHours.toFixed(1)} hrs consumed</span>
                  <span style="font-weight: 800; color: #059669;">${allowance.pctUsed}% used</span>
                </div>

                <!-- Progress Bar: Direction SHOW USED -->
                <div style="width: 100%; height: 8px; background: var(--bg-surface-elevated, #E6F4EA); border-radius: 999px; margin-top: 8px; overflow: hidden;">
                  <div style="height: 100%; background: ${allowance.statusColor}; border-radius: 999px; width: ${allowance.pctUsed}%; transition: width 0.4s ease;"></div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 600; color: var(--text-muted, #8A90A2); padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--border-subtle, #ECEEF4);">
                <span>Overage: ₹${allowance.hourlyOverageRate}/hr</span>
                <span>${allowance.overageHours > 0 ? `<strong style="color: #dc2626;">₹${allowance.overageFee.toLocaleString('en-IN')} fee</strong>` : 'Zero overage fees'}</span>
              </div>
            </div>

            <!-- Card 3: Single Plan Record -->
            <div class="nexus-billing-kpi-card">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(245, 158, 11, 0.12); color: #D97706; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                      👑
                    </div>
                    <div>
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #8A90A2);">Subscription Plan</span>
                      <div style="font-size: 22px; font-weight: 900; color: var(--text-primary, #111827); margin-top: 2px;">${allowance.planName}</div>
                    </div>
                  </div>
                  <span style="background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 10px; font-weight: 800; padding: 4px 9px; border-radius: 999px; border: 1px solid rgba(16, 185, 129, 0.25);">
                    ● ACTIVE
                  </span>
                </div>

                <p style="font-size: 12px; color: var(--text-muted, #64748B); margin: 14px 0 0 0; font-weight: 500;">
                  Plan credits reset at month-end (<strong>${allowance.planExpiryDate}</strong>)
                </p>
              </div>

              <!-- 3 mini specs -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--border-subtle, #ECEEF4); font-size: 11px;">
                <div>
                  <span style="display: block; font-size: 9.5px; font-weight: 700; color: var(--text-muted, #8A90A2); text-transform: uppercase;">Plan Quota</span>
                  <span style="font-weight: 800; color: var(--text-primary, #111827);">${allowance.includedHours} hrs</span>
                </div>
                <div>
                  <span style="display: block; font-size: 9.5px; font-weight: 700; color: var(--text-muted, #8A90A2); text-transform: uppercase;">Top-up Rate</span>
                  <span style="font-weight: 800; color: var(--text-primary, #111827);">₹500 / 10 cr</span>
                </div>
                <div>
                  <span style="display: block; font-size: 9.5px; font-weight: 700; color: var(--text-muted, #8A90A2); text-transform: uppercase;">Overage Rate</span>
                  <span style="font-weight: 800; color: #dc2626;">₹1,500 / hr</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section: Recent / Next Due Tax Invoice -->
          ${nextDueInvoice ? `
            <div style="background: var(--bg-surface, #ffffff); border: 1.5px solid ${isNextDuePendingOrOverdue ? (nextDueStatus === 'Overdue' ? '#EF4444' : '#F59E0B') : 'var(--border-subtle, #ECEEF4)'}; border-radius: 14px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 42px; height: 42px; border-radius: 10px; background: ${isNextDuePendingOrOverdue ? (nextDueStatus === 'Overdue' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)') : 'rgba(79, 63, 224, 0.08)'}; color: ${isNextDuePendingOrOverdue ? (nextDueStatus === 'Overdue' ? '#DC2626' : '#D97706') : '#4F3FE0'}; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                  🧾
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted, #8A90A2);">
                      ${isNextDuePendingOrOverdue ? (nextDueStatus === 'Overdue' ? '⚠️ Overdue Tax Invoice' : '⏳ Next Invoice Due') : '✓ Latest Tax Invoice'}
                    </span>
                    <span class="badge" style="background: ${nextDueStatus === 'Paid' ? 'rgba(16, 185, 129, 0.12)' : nextDueStatus === 'Overdue' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'}; color: ${nextDueStatus === 'Paid' ? '#059669' : nextDueStatus === 'Overdue' ? '#DC2626' : '#D97706'}; font-weight: 800; font-size: 10.5px; padding: 2px 7px; border-radius: 4px;">
                      ${nextDueStatus === 'Paid' ? 'Paid' : nextDueStatus}
                    </span>
                  </div>
                  <div style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin-top: 2px;">
                    ${nextDueInvoice.id} • ${nextDueInvoice.billingPeriod || 'November 2026'} (₹${Number(nextDueInvoice.total || 0).toLocaleString('en-IN')})
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted, #64748B); margin-top: 1px;">
                    Issued: ${cs.formatDateIndian(nextDueInvoice.issueDate || '2026-11-01')} • Due: <strong>${cs.formatDateIndian(nextDueInvoice.dueDate || '2026-11-05')}</strong>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  onclick="MeetingRoomsModule.openInvoiceDetailsModal('${nextDueInvoice.id}')"
                  style="font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 8px; color: #2563EB; border-color: rgba(37,99,235,0.35);"
                >
                  👁️ View Invoice
                </button>
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  onclick="window.print()"
                  style="font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 8px; color: #059669; border-color: rgba(16,185,129,0.35);"
                >
                  🖨️ Print
                </button>
                ${isNextDuePendingOrOverdue ? `
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    onclick="App.showToast('Redirecting to payment gateway for ${nextDueInvoice.id}...', 'info')"
                    style="font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 8px; background: #4F3FE0; border-color: #4338CA; color: #ffffff;"
                  >
                    Pay Now
                  </button>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Main 2-Column: Dynamic Donut + Room Breakdown & Quick Ledger -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: start;">
            <!-- Left Column: Donut Meter & Room Breakdown -->
            <div class="nexus-billing-panel">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                <h4 style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 24px; height: 24px; border-radius: 8px; background: rgba(79, 63, 224, 0.1); color: #4F3FE0; display: flex; align-items: center; justify-content: center; font-size: 12px;">📊</span>
                  <span>Room Quota Consumption (${allowance.monthLabel})</span>
                </h4>
                <span style="font-size: 11px; font-weight: 800; color: ${allowance.statusColor}; background: ${allowance.statusColor}15; padding: 4px 8px; border-radius: 6px;">
                  ${allowance.usedHours.toFixed(1)} hrs (${allowance.pctUsed}%) consumed
                </span>
              </div>

              <!-- Donut and Legend -->
              <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
                <!-- Circular SVG Donut (SHOW USED) -->
                <div style="position: relative; width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin: auto;">
                  <svg style="width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="48" stroke="var(--bg-surface-elevated, #EEEBFF)" stroke-width="13" fill="transparent" />
                    <circle cx="60" cy="60" r="48" stroke="${allowance.statusColor}" stroke-width="13" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeOffset}" stroke-linecap="round" fill="transparent" />
                  </svg>
                  <div style="position: absolute; text-align: center;">
                    <div style="font-size: 22px; font-weight: 900; color: var(--text-primary, #111827); line-height: 1;">${allowance.pctUsed}%</div>
                    <div style="font-size: 10px; color: var(--text-muted, #8A90A2); font-weight: 800; margin-top: 2px;">CONSUMED</div>
                  </div>
                </div>

                <!-- Legend Breakdown: Strictly sums to consumed total -->
                <div style="flex: 1; min-width: 170px; display: flex; flex-direction: column; gap: 9px; font-size: 12px;">
                  ${allowance.roomBreakdown.length > 0 ? allowance.roomBreakdown.map((rb, idx) => {
                    const colors = ['#4F3FE0', '#059669', '#D97706', '#2563EB', '#8B5CF6'];
                    return `
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 7px;">
                          <div style="width: 8px; height: 8px; border-radius: 999px; background: ${colors[idx % colors.length]};"></div>
                          <span style="font-weight: 600; color: var(--text-primary, #374151);">${rb.name}</span>
                        </div>
                        <span style="font-weight: 800; color: var(--text-primary, #111827);">
                          ${rb.hours.toFixed(1)} hrs · ${rb.credits} cr
                        </span>
                      </div>
                    `;
                  }).join('') : `
                    <div style="font-size: 12px; color: var(--text-muted, #64748B); padding: 8px 0;">No room bookings recorded for ${allowance.monthLabel}.</div>
                  `}

                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border-subtle, #ECEEF4); font-size: 11.5px;">
                    <div style="display: flex; align-items: center; gap: 7px;">
                      <div style="width: 8px; height: 8px; border-radius: 999px; background: #10B981;"></div>
                      <span style="color: var(--text-muted, #6B7280); font-weight: 600;">Remaining Balance</span>
                    </div>
                    <span style="font-weight: 800; color: #059669;">${allowance.remainingCredits} cr · ${allowance.remainingHours.toFixed(1)} hrs</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Recent Ledger (Reconciled) -->
            <div class="nexus-billing-panel">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h4 style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 24px; height: 24px; border-radius: 8px; background: rgba(79, 63, 224, 0.1); color: #4F3FE0; display: flex; align-items: center; justify-content: center; font-size: 12px;">📑</span>
                  <span>Ledger Activity (${allowance.monthLabel})</span>
                </h4>
                <button type="button" onclick="MeetingRoomsModule.setCreditsBillingSubTab('ledger')" style="background: none; border: none; font-size: 12px; font-weight: 800; color: #4F3FE0; cursor: pointer;">
                  View Full Ledger (${allowance.ledger.length}) →
                </button>
              </div>

              <div style="display: flex; flex-direction: column;">
                ${allowance.ledger.slice(0, 6).map(entry => `
                  <div class="nexus-ledger-row">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div style="width: 36px; height: 36px; border-radius: 10px; background: ${entry.isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(79, 63, 224, 0.08)'}; color: ${entry.isPositive ? '#059669' : '#4F3FE0'}; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                        ${entry.type === 'credit' ? '🎁' : entry.type === 'top-up' ? '🪙' : '📅'}
                      </div>
                      <div>
                        <div style="font-size: 12.5px; font-weight: 800; color: var(--text-primary, #111827);">
                          ${entry.description}
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted, #8A90A2); margin-top: 1px;">
                          ${entry.displayDateTime} ${entry.bookingRef ? `• <a href="javascript:void(0)" onclick="MeetingRoomsModule.switchTab('myBookings')" style="color: #2563EB; font-weight: 700;">Ref: ${entry.bookingRef}</a>` : ''}
                        </div>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 12.5px; font-weight: 900; color: ${entry.isPositive ? '#059669' : 'var(--text-primary, #111827)'};">
                        ${entry.creditsDisplay}
                      </div>
                      <div style="font-size: 10.5px; color: var(--text-muted, #8A90A2); font-weight: 600;">
                        bal: ${entry.runningBalanceCredits} cr
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- TAB 2: FULL RECONCILED LEDGER -->
        ${subTab === 'ledger' ? `
          <div class="nexus-billing-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 900; color: var(--text-primary, #111827); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span>📑</span>
                  <span>Credit Ledger — ${allowance.monthLabel}</span>
                </h3>
                <p style="font-size: 12px; color: var(--text-muted, #64748B); margin: 4px 0 0 0;">
                  Reconciled account statement: opening quota + top-ups - room booking debits = ending balance (${allowance.remainingCredits} credits · ${allowance.remainingHours.toFixed(1)} hrs).
                </p>
              </div>

              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <!-- Search Input -->
                <input
                  type="text"
                  id="ledger-search-input"
                  placeholder="Search ledger..."
                  value="${this.ledgerSearch || ''}"
                  oninput="MeetingRoomsModule.setLedgerSearch(this.value)"
                  style="padding: 6px 12px; font-size: 12px; border-radius: 8px; border: 1px solid var(--border-subtle, #E2E8F0); background: var(--bg-surface, #ffffff);"
                />

                <!-- Export CSV Button (Formula injection safe) -->
                <button
                  type="button"
                  onclick="MeetingRoomsModule.exportLedgerCSV()"
                  class="btn btn-outline btn-sm"
                  style="font-size: 12px; font-weight: 800; border-radius: 8px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px; color: #4F3FE0; border-color: rgba(79, 63, 224, 0.35);"
                >
                  <span>📥 Export CSV</span>
                </button>
              </div>
            </div>

            <!-- Full Ledger Table -->
            <div style="overflow-x: auto; border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 12px;">
              <table class="nexus-billing-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time (IST)</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Booking Ref</th>
                    <th>Credits</th>
                    <th>Hours</th>
                    <th>Running Balance</th>
                    <th>Expires On</th>
                  </tr>
                </thead>
                <tbody>
                  ${allowance.ledger
                    .filter(e => {
                      if (!this.ledgerSearch) return true;
                      const q = this.ledgerSearch.toLowerCase();
                      return e.description.toLowerCase().includes(q) || (e.bookingRef && e.bookingRef.toLowerCase().includes(q));
                    })
                    .map(entry => `
                      <tr>
                        <td style="white-space: nowrap; font-size: 12px; font-weight: 700; color: var(--text-primary, #111827);">
                          ${entry.displayDateTime}
                        </td>
                        <td>
                          <span class="badge" style="background: ${entry.isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(79, 63, 224, 0.08)'}; color: ${entry.isPositive ? '#059669' : '#4F3FE0'}; font-weight: 800; font-size: 10.5px; padding: 2px 7px; border-radius: 4px;">
                            ${entry.typeLabel || entry.type}
                          </span>
                        </td>
                        <td style="max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;" title="${entry.description}">
                          ${entry.description}
                        </td>
                        <td style="font-family: monospace; font-size: 11.5px;">
                          ${entry.bookingRef ? `
                            <a href="javascript:void(0)" onclick="MeetingRoomsModule.switchTab('myBookings')" style="color: #2563EB; font-weight: 800; text-decoration: none;">
                              ${entry.bookingRef}
                            </a>
                          ` : '<span style="color: #94A3B8;">—</span>'}
                        </td>
                        <td style="font-weight: 900; color: ${entry.isPositive ? '#059669' : 'var(--text-primary, #111827)'}; font-size: 12.5px;">
                          ${entry.creditsDisplay}
                        </td>
                        <td style="font-weight: 700; color: ${entry.isPositive ? '#059669' : 'var(--text-muted, #64748B)'}; font-size: 12px;">
                          ${entry.hoursDisplay}
                        </td>
                        <td style="font-weight: 900; color: #4F3FE0; font-size: 12.5px;">
                          ${entry.runningBalanceCredits} cr · ${entry.runningBalanceHours}h
                        </td>
                        <td style="font-size: 11.5px; color: var(--text-muted, #64748B);">
                          ${entry.expiresAt ? entry.expiresAt : '—'}
                        </td>
                      </tr>
                    `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- TAB 3: GST TAX INVOICES & RECEIPTS -->
        ${subTab === 'invoices' ? `
          <div class="nexus-billing-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 900; color: var(--text-primary, #111827); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span>🧾</span>
                  <span>Official GST Tax Invoices</span>
                </h3>
                <p style="font-size: 12px; color: var(--text-muted, #64748B); margin: 4px 0 0 0;">
                  SAC Code 997212 (Co-working Space &amp; Conference Facilities). Consecutive Financial Year numbers.
                </p>
              </div>

              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <!-- Status Filter -->
                <select onchange="MeetingRoomsModule.setInvoiceStatusFilter(this.value)" style="padding: 6px 10px; font-size: 12px; border-radius: 8px; border: 1px solid var(--border-subtle, #E2E8F0); background: var(--bg-surface, #ffffff); font-weight: 700;" aria-label="Filter invoices by status">
                  <option value="all" ${this.invoiceStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                  <option value="Paid" ${this.invoiceStatusFilter === 'Paid' ? 'selected' : ''}>Paid</option>
                  <option value="Pending" ${this.invoiceStatusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
                  <option value="Overdue" ${this.invoiceStatusFilter === 'Overdue' ? 'selected' : ''}>Overdue</option>
                  <option value="Void" ${this.invoiceStatusFilter === 'Void' ? 'selected' : ''}>Void</option>
                </select>

                <!-- Search Input -->
                <input
                  type="text"
                  id="invoice-search-input"
                  placeholder="Search invoices..."
                  value="${this.invoiceSearch || ''}"
                  oninput="MeetingRoomsModule.setInvoiceSearch(this.value)"
                  style="padding: 6px 12px; font-size: 12px; border-radius: 8px; border: 1px solid var(--border-subtle, #E2E8F0); background: var(--bg-surface, #ffffff);"
                />

                ${isAdmin ? `
                  <button
                    type="button"
                    onclick="if(typeof InvoiceModule !== 'undefined') InvoiceModule.openGenerator('${startup.id}');"
                    class="btn btn-outline btn-sm"
                    style="font-size: 12px; font-weight: 800; border-radius: 8px; padding: 6px 14px; color: #4F3FE0; border-color: rgba(79, 63, 224, 0.35);"
                  >
                    + Generate Custom Invoice
                  </button>
                ` : `
                  <button
                    type="button"
                    onclick="MeetingRoomsModule.openRequestInvoiceModal('${startup.id}')"
                    class="btn btn-outline btn-sm"
                    style="font-size: 12px; font-weight: 800; border-radius: 8px; padding: 6px 14px; color: #4F3FE0; border-color: rgba(79, 63, 224, 0.35);"
                  >
                    ✉️ Request Invoice
                  </button>
                `}
              </div>
            </div>

            <!-- Invoices Table -->
            <div style="overflow-x: auto; border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 12px;">
              <table class="nexus-billing-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Billing Period</th>
                    <th>Issued Date</th>
                    <th>Due Date</th>
                    <th>Description</th>
                    <th>Base (₹)</th>
                    <th>GST (₹)</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${startupInvoices
                    .filter(inv => {
                      if (this.invoiceStatusFilter && this.invoiceStatusFilter !== 'all') {
                        const s = bs.evaluateInvoiceStatus(inv, istNow.todayStr);
                        if (s !== this.invoiceStatusFilter) return false;
                      }
                      if (this.invoiceSearch) {
                        const q = this.invoiceSearch.toLowerCase();
                        return (inv.id && inv.id.toLowerCase().includes(q)) || (inv.billingPeriod && inv.billingPeriod.toLowerCase().includes(q));
                      }
                      return true;
                    })
                    .map(inv => {
                      const computedStatus = bs.evaluateInvoiceStatus(inv, istNow.todayStr);
                      const baseAmt = inv.subtotal || inv.taxableAmount || Math.round((inv.total || 0) / 1.18);
                      const gstAmt = inv.taxGst || (inv.total ? inv.total - baseAmt : 0);
                      const isPaid = computedStatus === 'Paid';
                      const isOverdue = computedStatus === 'Overdue';
                      const isVoid = computedStatus === 'Void';

                      return `
                        <tr>
                          <td style="font-weight: 800; font-family: monospace; font-size: 13px; color: #4F3FE0; white-space: nowrap;">
                            ${inv.id}
                          </td>
                          <td style="font-weight: 700; color: var(--text-primary, #111827); white-space: nowrap;">
                            ${inv.billingPeriod || 'November 2026'}
                          </td>
                          <td style="color: var(--text-muted, #64748B); font-size: 12px; white-space: nowrap;">
                            ${inv.issueDate ? cs.formatDateIndian(inv.issueDate) : '01 Nov 2026'}
                          </td>
                          <td style="color: var(--text-muted, #64748B); font-size: 12px; white-space: nowrap;">
                            ${inv.dueDate ? cs.formatDateIndian(inv.dueDate) : '05 Nov 2026'}
                          </td>
                          <td style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px;" title="${(inv.lineItems && inv.lineItems[0]) ? inv.lineItems[0].desc : 'Membership & Meeting Quota'}">
                            ${(inv.lineItems && inv.lineItems[0]) ? inv.lineItems[0].desc : 'Membership & Meeting Quota'}
                          </td>
                          <td style="font-weight: 700; font-size: 12px; color: var(--text-muted, #64748B);">
                            ₹${Number(baseAmt).toLocaleString('en-IN')}
                          </td>
                          <td style="font-weight: 700; font-size: 12px; color: var(--text-muted, #64748B);">
                            ₹${Number(gstAmt).toLocaleString('en-IN')}
                          </td>
                          <td style="font-weight: 900; color: var(--text-primary, #111827); font-size: 13px;">
                            ₹${Number(inv.total || 0).toLocaleString('en-IN')}
                          </td>
                          <td>
                            <span class="badge" style="background: ${isPaid ? 'rgba(16, 185, 129, 0.12)' : isOverdue ? 'rgba(239, 68, 68, 0.12)' : isVoid ? 'rgba(148, 163, 184, 0.2)' : 'rgba(245, 158, 11, 0.12)'}; color: ${isPaid ? '#059669' : isOverdue ? '#DC2626' : isVoid ? '#64748B' : '#D97706'}; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 6px;">
                              ${isPaid ? '✓ Paid' : isOverdue ? '● Overdue' : isVoid ? '✕ Void' : '● ' + computedStatus}
                            </span>
                          </td>
                          <td style="text-align: right; white-space: nowrap;">
                            <button
                              type="button"
                              class="btn btn-outline btn-sm"
                              onclick="MeetingRoomsModule.openInvoiceDetailsModal('${inv.id}')"
                              style="font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; margin-right: 4px; color: #2563EB; border-color: rgba(37,99,235,0.3);"
                              title="View Tax Invoice Details"
                            >
                              👁️ View
                            </button>
                            <button
                              type="button"
                              class="btn btn-outline btn-sm"
                              onclick="window.print()"
                              style="font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; margin-right: 4px; color: #059669; border-color: rgba(16,185,129,0.3);"
                              title="Print Invoice"
                            >
                              🖨️ Print
                            </button>
                            ${!isPaid && !isVoid ? `
                              <button
                                type="button"
                                class="btn btn-primary btn-sm"
                                onclick="App.showToast('Redirecting to payment gateway for ${inv.id}...', 'info')"
                                style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; background: #4F3FE0; border-color: #4338CA; color: #ffffff;"
                              >
                                Pay Now
                              </button>
                            ` : ''}
                            ${isAdmin && !isVoid ? `
                              <button
                                type="button"
                                class="btn btn-outline btn-sm"
                                onclick="MeetingRoomsModule.openVoidInvoiceModal('${inv.id}')"
                                style="font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; color: #DC2626; border-color: rgba(220,38,38,0.3);"
                                title="Void this invoice (Admin only)"
                              >
                                ✕ Void
                              </button>
                            ` : ''}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Credit Notes Section (Linked to Original Invoice) -->
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-subtle, #ECEEF4);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                  <h4 style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span>🔖</span>
                    <span>GST Credit Notes &amp; Adjustments</span>
                  </h4>
                  <p style="font-size: 11.5px; color: var(--text-muted, #64748B); margin: 2px 0 0 0;">
                    Tax credit adjustments and downtime refunds linked directly to parent tax invoices.
                  </p>
                </div>
              </div>

              <div style="overflow-x: auto; border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 12px;">
                <table class="nexus-billing-table">
                  <thead>
                    <tr>
                      <th>Credit Note No</th>
                      <th>Issued Date</th>
                      <th>Original Invoice</th>
                      <th>Reason / Adjustment</th>
                      <th>Base (₹)</th>
                      <th>GST (₹)</th>
                      <th>Total Adjusted</th>
                      <th>Status</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="font-weight: 800; font-family: monospace; font-size: 12.5px; color: #059669;">
                        CN/2026-27/0001
                      </td>
                      <td style="color: var(--text-muted, #64748B); font-size: 12px;">
                        10 Oct 2026
                      </td>
                      <td style="font-family: monospace; font-size: 12px; font-weight: 700; color: #2563EB;">
                        <a href="javascript:void(0)" onclick="MeetingRoomsModule.openInvoiceDetailsModal('${startupInvoices[0] ? startupInvoices[0].id : 'INV-2026-080'}')">
                          ${startupInvoices[0] ? startupInvoices[0].id : 'INV-2026-080'}
                        </a>
                      </td>
                      <td style="font-size: 12px; color: var(--text-primary, #374151);">
                        AV maintenance downtime credit (2.0 hrs)
                      </td>
                      <td style="font-size: 12px; font-weight: 700; color: var(--text-muted, #64748B);">
                        ₹2,000
                      </td>
                      <td style="font-size: 12px; font-weight: 700; color: var(--text-muted, #64748B);">
                        ₹360
                      </td>
                      <td style="font-weight: 900; color: #059669; font-size: 13px;">
                        ₹2,360
                      </td>
                      <td>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 4px;">
                          ✓ Applied
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <button
                          type="button"
                          class="btn btn-outline btn-sm"
                          onclick="App.showToast('Credit Note CN/2026-27/0001 details downloaded', 'success')"
                          style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; color: #059669; border-color: rgba(16,185,129,0.3);"
                        >
                          📥 Receipt
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- TAB 4: PAYMENT HISTORY & RECEIPTS (SEPARATE FROM INVOICES) -->
        ${subTab === 'payments' ? `
          <div class="nexus-billing-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 900; color: var(--text-primary, #111827); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span>💳</span>
                  <span>Payment History &amp; Transaction Receipts</span>
                </h3>
                <p style="font-size: 12px; color: var(--text-muted, #64748B); margin: 4px 0 0 0;">
                  Live payment transactions, gateway confirmation references, and instant downloadable receipts.
                </p>
              </div>
            </div>

            <!-- Payments Table -->
            <div style="overflow-x: auto; border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 12px;">
              <table class="nexus-billing-table">
                <thead>
                  <tr>
                    <th>Payment Date &amp; Time (IST)</th>
                    <th>Transaction Reference</th>
                    <th>Payment Method</th>
                    <th>Invoice / Service</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th style="text-align: right;">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-size: 12px; font-weight: 700; color: var(--text-primary, #111827); white-space: nowrap;">
                      01 Nov 2026, 10:15 AM
                    </td>
                    <td style="font-family: monospace; font-size: 12px; font-weight: 800; color: #4F3FE0;">
                      PAY-2026-NOV-9982
                    </td>
                    <td style="font-size: 12px; color: var(--text-primary, #374151);">
                      💳 HDFC Corporate Visa •••• 4821
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted, #64748B);">
                      INV-2026-080 • Monthly Membership &amp; Quota
                    </td>
                    <td style="font-weight: 900; font-size: 13px; color: var(--text-primary, #111827);">
                      ₹29,500
                    </td>
                    <td>
                      <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 4px;">
                        ✓ Successful
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        onclick="MeetingRoomsModule.downloadPaymentReceipt('PAY-2026-NOV-9982', 29500, '01 Nov 2026', 'HDFC Corporate Visa')"
                        style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; color: #2563EB; border-color: rgba(37,99,235,0.3);"
                      >
                        📥 Receipt
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; font-weight: 700; color: var(--text-primary, #111827); white-space: nowrap;">
                      15 Oct 2026, 04:30 PM
                    </td>
                    <td style="font-family: monospace; font-size: 12px; font-weight: 800; color: #4F3FE0;">
                      PAY-2026-OCT-8814
                    </td>
                    <td style="font-size: 12px; color: var(--text-primary, #374151);">
                      ⚡ Instant UPI AutoPay (HDFC Bank)
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted, #64748B);">
                      Growth Pack (+100 Credits) Top-Up
                    </td>
                    <td style="font-weight: 900; font-size: 13px; color: var(--text-primary, #111827);">
                      ₹5,310
                    </td>
                    <td>
                      <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 4px;">
                        ✓ Successful
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        onclick="MeetingRoomsModule.downloadPaymentReceipt('PAY-2026-OCT-8814', 5310, '15 Oct 2026', 'Instant UPI AutoPay')"
                        style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; color: #2563EB; border-color: rgba(37,99,235,0.3);"
                      >
                        📥 Receipt
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; font-weight: 700; color: var(--text-primary, #111827); white-space: nowrap;">
                      01 Oct 2026, 09:45 AM
                    </td>
                    <td style="font-family: monospace; font-size: 12px; font-weight: 800; color: #4F3FE0;">
                      PAY-2026-OCT-7712
                    </td>
                    <td style="font-size: 12px; color: var(--text-primary, #374151);">
                      💳 HDFC Corporate Visa •••• 4821
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted, #64748B);">
                      INV-2026-072 • Monthly Membership &amp; Quota
                    </td>
                    <td style="font-weight: 900; font-size: 13px; color: var(--text-primary, #111827);">
                      ₹29,500
                    </td>
                    <td>
                      <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 4px;">
                        ✓ Successful
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        onclick="MeetingRoomsModule.downloadPaymentReceipt('PAY-2026-OCT-7712', 29500, '01 Oct 2026', 'HDFC Corporate Visa')"
                        style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; color: #2563EB; border-color: rgba(37,99,235,0.3);"
                      >
                        📥 Receipt
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- TAB 5: BILLING PROFILE, PLAN MANAGEMENT & AUTO-RENEW -->
        ${subTab === 'profile' ? `
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Plan Management Card (Upgrade, Downgrade, Pause, Cancel with Unused Credits Policies) -->
            <div class="nexus-billing-panel">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                <div>
                  <h4 style="font-size: 15px; font-weight: 900; color: var(--text-primary, #111827); margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span>👑</span>
                    <span>Subscription Plan Lifecycle &amp; Credit Policies</span>
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted, #64748B); margin: 3px 0 0 0;">
                    Manage your tier with full transparency on effective dates and unused quota rollover rules.
                  </p>
                </div>
                <span style="background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(16, 185, 129, 0.25);">
                  ● CURRENT: ${allowance.planName}
                </span>
              </div>

              <!-- 4 Action Bento Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                <!-- Upgrade -->
                <div style="background: var(--bg-surface-elevated, #F8FAFC); border: 1.5px solid var(--border-subtle, #E2E8F0); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="font-size: 11px; font-weight: 800; color: #4F3FE0; text-transform: uppercase;">Growth Upgrade</div>
                    <div style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 4px 0;">Growth Plan (30 hrs)</div>
                    <div style="font-size: 11.5px; color: var(--text-muted, #64748B);">
                      • Effective: <strong>Immediately</strong><br/>
                      • Unused credits: <strong>All rollover</strong><br/>
                      • Rate: ₹49,500/mo (prorated)
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-primary" onclick="MeetingRoomsModule.openPlanActionModal('upgrade')" style="margin-top: 12px; background: #4F3FE0; border-color: #4338CA; font-weight: 800; font-size: 11.5px; padding: 6px 12px; border-radius: 8px;">
                    Upgrade Tier →
                  </button>
                </div>

                <!-- Downgrade -->
                <div style="background: var(--bg-surface-elevated, #F8FAFC); border: 1.5px solid var(--border-subtle, #E2E8F0); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Starter Tier</div>
                    <div style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 4px 0;">Starter Plan (8 hrs)</div>
                    <div style="font-size: 11.5px; color: var(--text-muted, #64748B);">
                      • Effective: <strong>Next cycle (1 Dec)</strong><br/>
                      • Unused credits: <strong>Active till Nov 30</strong><br/>
                      • Rate: ₹18,000/mo
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.openPlanActionModal('downgrade')" style="margin-top: 12px; font-weight: 800; font-size: 11.5px; padding: 6px 12px; border-radius: 8px; color: var(--text-primary, #111827);">
                    Downgrade Tier
                  </button>
                </div>

                <!-- Pause -->
                <div style="background: var(--bg-surface-elevated, #F8FAFC); border: 1.5px solid var(--border-subtle, #E2E8F0); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="font-size: 11px; font-weight: 800; color: #D97706; text-transform: uppercase;">Temporary Hold</div>
                    <div style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 4px 0;">Pause (1–3 Months)</div>
                    <div style="font-size: 11.5px; color: var(--text-muted, #64748B);">
                      • Effective: <strong>Next billing cycle</strong><br/>
                      • Unused credits: <strong>Frozen &amp; preserved</strong><br/>
                      • Maintenance fee: ₹0/mo
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.openPlanActionModal('pause')" style="margin-top: 12px; font-weight: 800; font-size: 11.5px; padding: 6px 12px; border-radius: 8px; color: #D97706; border-color: rgba(217,119,6,0.35);">
                    Pause Membership
                  </button>
                </div>

                <!-- Cancel -->
                <div style="background: var(--bg-surface-elevated, #F8FAFC); border: 1.5px solid var(--border-subtle, #E2E8F0); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="font-size: 11px; font-weight: 800; color: #DC2626; text-transform: uppercase;">Termination</div>
                    <div style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 4px 0;">Cancel Subscription</div>
                    <div style="font-size: 11.5px; color: var(--text-muted, #64748B);">
                      • Effective: <strong>Cycle end (Nov 30)</strong><br/>
                      • Plan credits: <strong>Expire on Nov 30</strong><br/>
                      • Top-up credits: <strong>Valid for 90 days</strong>
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.openPlanActionModal('cancel')" style="margin-top: 12px; font-weight: 800; font-size: 11.5px; padding: 6px 12px; border-radius: 8px; color: #DC2626; border-color: rgba(220,38,38,0.35);">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>

            <!-- Profile & Payment Methods 2-Column Bento -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
              <!-- Profile Card -->
              <div class="nexus-billing-panel">
                <h4 style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">
                  <span>🏢</span>
                  <span>GST Legal Billing Profile</span>
                </h4>
                <form onsubmit="MeetingRoomsModule.updateBillingProfile('${startup.id}', event)">
                  <div style="display: flex; flex-direction: column; gap: 12px; font-size: 12px;">
                    <div>
                      <label style="display: block; font-weight: 800; color: var(--text-muted, #64748B); text-transform: uppercase; font-size: 10.5px; margin-bottom: 4px;">
                        Company Legal Name
                      </label>
                      <input type="text" id="billing-legal-name" value="${startup.name || 'XYZ Technologies Private Limited'}" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle, #E2E8F0); background: var(--bg-surface, #ffffff); font-size: 12.5px; font-weight: 700;" required />
                    </div>
                    <div>
                      <label style="display: block; font-weight: 800; color: var(--text-muted, #64748B); text-transform: uppercase; font-size: 10.5px; margin-bottom: 4px;">
                        GSTIN (15 Characters)
                      </label>
                      <input type="text" id="billing-gstin" value="${startup.gstin || '29AAACX9920M1Z4'}" maxlength="15" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle, #E2E8F0); background: var(--bg-surface, #ffffff); font-size: 12.5px; font-weight: 700; font-family: monospace;" required />
                    </div>
                    <div>
                      <label style="display: block; font-weight: 800; color: var(--text-muted, #64748B); text-transform: uppercase; font-size: 10.5px; margin-bottom: 4px;">
                        Registered Billing Address
                      </label>
                      <textarea id="billing-address" rows="2" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle, #E2E8F0); background: var(--bg-surface, #ffffff); font-size: 12px;">Cabin PC-103, Nexus Hub, Indiranagar, Bengaluru, Karnataka 560038</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" style="background: #4F3FE0; border-color: #4338CA; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; align-self: flex-start;">
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>

              <!-- Payment Methods & Auto-Renew Card -->
              <div class="nexus-billing-panel">
                <h4 style="font-size: 14px; font-weight: 900; color: var(--text-primary, #111827); margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">
                  <span>💳</span>
                  <span>Payment Methods &amp; Auto-Renew</span>
                </h4>
                <div style="display: flex; flex-direction: column; gap: 14px; font-size: 12px;">
                  <!-- Saved Card -->
                  <div style="border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 12px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="font-size: 20px;">💳</span>
                      <div>
                        <div style="font-weight: 800; color: var(--text-primary, #111827);">HDFC Corporate Visa •••• 4821</div>
                        <div style="font-size: 10.5px; color: var(--text-muted, #8A90A2); margin-top: 2px;">Expires 08/29 • Primary method</div>
                      </div>
                    </div>
                    <span style="font-size: 10.5px; font-weight: 800; background: rgba(16, 185, 129, 0.12); color: #059669; padding: 3px 8px; border-radius: 6px;">
                      ✓ Default
                    </span>
                  </div>

                  <!-- Auto Renew Toggle -->
                  <div style="background: var(--bg-surface-elevated, #F8FAFC); border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-weight: 800; color: var(--text-primary, #111827);">Auto-Renew Membership</div>
                      <div style="font-size: 11px; color: var(--text-muted, #64748B); margin-top: 2px;">Next charge: <strong>1 Dec 2026</strong> (₹29,500 via HDFC Corporate)</div>
                    </div>
                    <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;">
                      <input type="checkbox" checked onchange="MeetingRoomsModule.toggleAutoRenew('${startup.id}', this.checked)" style="opacity: 0; width: 0; height: 0;" />
                      <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4F3FE0; transition: .3s; border-radius: 24px;"></span>
                    </label>
                  </div>

                  <!-- Failed Payment Policy Note -->
                  <div style="font-size: 11px; color: var(--text-muted, #64748B); background: rgba(79, 63, 224, 0.05); padding: 8px 12px; border-radius: 8px; line-height: 1.4;">
                    ℹ️ <strong>Retry &amp; Grace Period:</strong> Failed auto-renewals retry automatically on Day 2, 4, and 7. Your account enjoys a 7-day grace period with unhindered room bookings.
                  </div>

                  <!-- TDS Deduction Option -->
                  <div style="border: 1px dashed var(--border-subtle, #CBD5E1); border-radius: 12px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-weight: 800; color: var(--text-primary, #111827);">Pay Net of TDS (Section 194-I)</div>
                      <div style="font-size: 10.5px; color: var(--text-muted, #64748B); margin-top: 2px;">Upload Form 16A TDS certificate for 10% tax credit.</div>
                    </div>
                    <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openTDSModal('${startupInvoices[0] ? startupInvoices[0].id : 'INV-2026-080'}')" style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
                      Upload TDS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  openPlanActionModal(action) {
    const startup = (window.store && window.store.getActiveStartup) ? window.store.getActiveStartup() : { name: 'XYZ Technologies' };
    let title = '';
    let icon = '👑';
    let detailsHtml = '';

    if (action === 'upgrade') {
      title = 'Upgrade to Growth Plan';
      icon = '🚀';
      detailsHtml = `
        <div style="background: rgba(79, 63, 224, 0.08); border: 1.5px solid #4F3FE0; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #4F3FE0; text-transform: uppercase;">Selected Tier</div>
          <div style="font-size: 16px; font-weight: 900; color: #111827; margin: 2px 0;">Growth Plan • 30 hrs (300 credits) / month</div>
          <div style="font-size: 13px; font-weight: 800; color: #4F3FE0; margin-top: 4px;">₹49,500 / month + GST (Prorated for current cycle)</div>
        </div>
        <div style="font-size: 12.5px; line-height: 1.6; color: var(--text-primary, #374151); display: flex; flex-direction: column; gap: 8px;">
          <div>⚡ <strong>Effective Date:</strong> Immediate. Your meeting allowance will increase by +15 hours immediately.</div>
          <div>🪙 <strong>Unused Credits:</strong> All your current unused plan credits carry over and combine with the new quota.</div>
          <div>💳 <strong>Billing:</strong> The prorated difference will be charged to your default corporate payment method.</div>
        </div>
      `;
    } else if (action === 'downgrade') {
      title = 'Downgrade to Starter Plan';
      icon = '📉';
      detailsHtml = `
        <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Selected Tier</div>
          <div style="font-size: 16px; font-weight: 900; color: #111827; margin: 2px 0;">Starter Plan • 8 hrs (80 credits) / month</div>
          <div style="font-size: 13px; font-weight: 800; color: #111827; margin-top: 4px;">₹18,000 / month + GST</div>
        </div>
        <div style="font-size: 12.5px; line-height: 1.6; color: var(--text-primary, #374151); display: flex; flex-direction: column; gap: 8px;">
          <div>📅 <strong>Effective Date:</strong> Next billing cycle (<strong>1 December 2026</strong>).</div>
          <div>🪙 <strong>Unused Credits:</strong> You continue to enjoy your full 15.0 hrs allowance through 30 November 2026 without interruption.</div>
          <div>💳 <strong>Next Charge:</strong> On 1 Dec 2026, you will be billed ₹18,000 + GST.</div>
        </div>
      `;
    } else if (action === 'pause') {
      title = 'Pause Membership';
      icon = '⏸️';
      detailsHtml = `
        <div style="background: rgba(245, 158, 11, 0.08); border: 1.5px solid #F59E0B; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #D97706; text-transform: uppercase;">Temporary Account Hold</div>
          <div style="font-size: 16px; font-weight: 900; color: #111827; margin: 2px 0;">Select Pause Duration: 1 to 3 Months</div>
          <div style="font-size: 12.5px; color: #92400E; margin-top: 4px;">Desk reservations &amp; auto-renewals paused. Monthly maintenance fee: ₹0.</div>
        </div>
        <div style="font-size: 12.5px; line-height: 1.6; color: var(--text-primary, #374151); display: flex; flex-direction: column; gap: 8px;">
          <div>📅 <strong>Effective Date:</strong> Starts from <strong>1 December 2026</strong>.</div>
          <div>🪙 <strong>Unused Credits:</strong> Your remaining plan credits will be <strong>frozen</strong> and restored when your membership reactivates.</div>
        </div>
      `;
    } else {
      title = 'Cancel Subscription';
      icon = '⚠️';
      detailsHtml = `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1.5px solid #EF4444; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #DC2626; text-transform: uppercase;">Membership Termination</div>
          <div style="font-size: 16px; font-weight: 900; color: #111827; margin: 2px 0;">Cancellation of Startup Plan</div>
          <div style="font-size: 12.5px; color: #991B1B; margin-top: 4px;">Auto-renewal will be turned off immediately.</div>
        </div>
        <div style="font-size: 12.5px; line-height: 1.6; color: var(--text-primary, #374151); display: flex; flex-direction: column; gap: 8px;">
          <div>📅 <strong>Effective Date:</strong> End of current cycle (<strong>30 November 2026</strong>).</div>
          <div>🪙 <strong>Plan Credits:</strong> Plan credits will expire on 30 Nov 2026.</div>
          <div>🪙 <strong>Top-up Credits:</strong> Any purchased extra top-up credits will remain valid for <strong>90 days</strong> from their purchase date.</div>
        </div>
      `;
    }

    const html = `
      <div class="modal-overlay active" id="modal-plan-action" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-plan-action')" style="display: flex; align-items: center; justify-content: center; z-index: 1060; padding: 16px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);">
        <div style="background: #ffffff; border-radius: 18px; max-width: 520px; width: 100%; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.35); border: 1px solid #E2E8F0;">
          <div style="background: #0F172A; color: #ffffff; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">${icon}</span>
              <h3 style="font-size: 17px; font-weight: 800; margin: 0; color: #ffffff;">${title}</h3>
            </div>
            <button type="button" onclick="MeetingRoomsModule.closeModal('modal-plan-action')" style="color: #ffffff; background: rgba(255,255,255,0.15); border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 15px; cursor: pointer;">✕</button>
          </div>
          <div style="padding: 22px;">
            ${detailsHtml}
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #E2E8F0;">
              <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-plan-action')" style="padding: 7px 16px; border-radius: 8px; font-weight: 700;">
                Back
              </button>
              <button type="button" class="btn btn-sm ${action === 'cancel' ? 'btn-danger' : 'btn-primary'}" onclick="MeetingRoomsModule.closeModal('modal-plan-action'); if(typeof App !== 'undefined') App.showToast('Plan request recorded successfully.', 'success');" style="padding: 7px 20px; border-radius: 8px; font-weight: 800; ${action !== 'cancel' ? 'background: #4F3FE0; border-color: #4338CA;' : ''}">
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = html;
  },

  downloadPaymentReceipt(paymentRef, amount, date, method) {
    const html = `
      <div class="modal-overlay active" id="modal-receipt-view" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-receipt-view')" style="display: flex; align-items: center; justify-content: center; z-index: 1060; padding: 16px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);">
        <div style="background: #ffffff; border-radius: 18px; max-width: 500px; width: 100%; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.35); border: 1px solid #E2E8F0;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85;">Official Payment Confirmation</div>
              <h3 style="font-size: 19px; font-weight: 900; margin: 4px 0 0 0; color: #ffffff;">Payment Receipt</h3>
            </div>
            <button type="button" onclick="MeetingRoomsModule.closeModal('modal-receipt-view')" style="color: #ffffff; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 15px; cursor: pointer;">✕</button>
          </div>
          <div style="padding: 24px; font-size: 12.5px; display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
              <span style="color: #64748B;">Transaction Ref:</span>
              <strong style="font-family: monospace; color: #4F3FE0;">${paymentRef}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
              <span style="color: #64748B;">Date &amp; Time:</span>
              <strong>${date}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
              <span style="color: #64748B;">Payment Mode:</span>
              <strong>${method}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
              <span style="color: #64748B;">Payment Gateway:</span>
              <strong>Razorpay Verified (Idempotent)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #10B981; padding-top: 6px;">
              <span>Amount Paid:</span>
              <span>₹${Number(amount).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-receipt-view')" style="font-weight: 700; border-radius: 8px;">
                Close
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.print()" style="background: #10B981; border-color: #059669; font-weight: 800; border-radius: 8px;">
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = html;
  },

  openCreditTopUpModal(startupId) {
    const sId = startupId || (window.store && window.store.getActiveStartup ? window.store.getActiveStartup().id : 'STP-XYZ');
    const startup = (window.store && window.store.getStartupById) ? window.store.getStartupById(sId) : null;
    const startupName = startup ? startup.name : 'Your Startup';
    const idemKey = `IDEM-TOPUP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const modalHtml = `
      <div class="modal-overlay active" id="modal-credit-topup" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-credit-topup')" style="display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 16px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); animation: fadeIn 0.2s ease;">
        <div style="background: var(--bg-surface, #ffffff); border-radius: 20px; width: 100%; max-width: 580px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.3); border: 1px solid var(--border-subtle, #e2e8f0); position: relative;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4F3FE0 0%, #3B82F6 100%); padding: 22px 26px; color: #ffffff; position: relative;">
            <button type="button" onclick="MeetingRoomsModule.closeModal('modal-credit-topup')" style="position: absolute; right: 18px; top: 18px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s;">
              ✕
            </button>
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">
              Instant Allowance Top-Up
            </div>
            <h3 style="font-size: 20px; font-weight: 900; margin: 4px 0 0 0; color: #ffffff;">
              Purchase Extra Meeting Credits
            </h3>
            <p style="font-size: 12.5px; opacity: 0.9; margin: 4px 0 0 0;">
              Credits immediately reflect in ${startupName}'s account and are valid for 90 days.
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
            <!-- Pack Selection Grid -->
            <div>
              <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted, #64748B); letter-spacing: 0.05em; margin-bottom: 10px;">
                Select Credit Package:
              </label>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <!-- Pack 1: Starter -->
                <div class="nexus-topup-card" id="topup-pack-5" onclick="MeetingRoomsModule.selectTopUpPack(5, 2500, 'Starter Pack')">
                  <div style="font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase;">Starter</div>
                  <div style="font-size: 18px; font-weight: 900; color: #111827; margin: 4px 0;">+5 Hours</div>
                  <div style="font-size: 11px; color: #4F3FE0; font-weight: 700;">50 Credits</div>
                  <div style="font-size: 14px; font-weight: 900; color: #111827; margin-top: 8px;">₹2,500</div>
                  <div style="font-size: 9.5px; color: #8A90A2;">₹500 / hr</div>
                </div>

                <!-- Pack 2: Growth (Popular) -->
                <div class="nexus-topup-card active" id="topup-pack-10" onclick="MeetingRoomsModule.selectTopUpPack(10, 4500, 'Growth Pack')">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 10px; font-weight: 800; color: #4F3FE0; text-transform: uppercase;">Growth</span>
                    <span style="font-size: 8.5px; font-weight: 800; background: #4F3FE0; color: #ffffff; padding: 1px 5px; border-radius: 4px;">Popular</span>
                  </div>
                  <div style="font-size: 18px; font-weight: 900; color: #111827; margin: 4px 0;">+10 Hours</div>
                  <div style="font-size: 11px; color: #4F3FE0; font-weight: 700;">100 Credits</div>
                  <div style="font-size: 14px; font-weight: 900; color: #111827; margin-top: 8px;">₹4,500</div>
                  <div style="font-size: 9.5px; color: #059669; font-weight: 700;">Save 10% (₹450/hr)</div>
                </div>

                <!-- Pack 3: Enterprise Scale -->
                <div class="nexus-topup-card" id="topup-pack-20" onclick="MeetingRoomsModule.selectTopUpPack(20, 8000, 'Scale Pack')">
                  <div style="font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase;">Scale</div>
                  <div style="font-size: 18px; font-weight: 900; color: #111827; margin: 4px 0;">+20 Hours</div>
                  <div style="font-size: 11px; color: #4F3FE0; font-weight: 700;">200 Credits</div>
                  <div style="font-size: 14px; font-weight: 900; color: #111827; margin-top: 8px;">₹8,000</div>
                  <div style="font-size: 9.5px; color: #059669; font-weight: 700;">Save 20% (₹400/hr)</div>
                </div>
              </div>
            </div>

            <!-- Payment Method Selection -->
            <div>
              <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted, #64748B); letter-spacing: 0.05em; margin-bottom: 8px;">
                Payment Method:
              </label>
              <div style="display: flex; gap: 10px;">
                <label style="flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 700;">
                  <input type="radio" name="topup-paymethod" value="UPI" checked />
                  <span>⚡ Instant UPI / NetBanking</span>
                </label>
                <label style="flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 700;">
                  <input type="radio" name="topup-paymethod" value="Corporate Card" />
                  <span>💳 Corporate Card</span>
                </label>
              </div>
            </div>

            <!-- Tax Summary Box -->
            <div style="background: var(--bg-surface-elevated, #F8FAFC); border: 1px solid var(--border-subtle, #E2E8F0); border-radius: 12px; padding: 14px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; color: var(--text-muted, #64748B); margin-bottom: 4px;">
                <span>Package Subtotal:</span>
                <span id="topup-subtotal" style="font-weight: 700; color: var(--text-primary, #111827);">₹4,500</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--text-muted, #64748B); margin-bottom: 6px;">
                <span>GST (18% ITC Eligible):</span>
                <span id="topup-gst" style="font-weight: 700; color: var(--text-primary, #111827);">₹810</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle, #E2E8F0); padding-top: 8px; font-size: 13.5px; font-weight: 900;">
                <span style="color: var(--text-primary, #111827);">Total Payable:</span>
                <span id="topup-total" style="color: #4F3FE0;">₹5,310</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; background: var(--bg-surface-elevated, #F8FAFC); border-top: 1px solid var(--border-subtle, #E2E8F0); display: flex; justify-content: flex-end; gap: 10px; align-items: center;">
            <button type="button" class="btn btn-outline" onclick="MeetingRoomsModule.closeModal('modal-credit-topup')" style="font-weight: 700; font-size: 12.5px; padding: 8px 18px; border-radius: 8px;">
              Cancel
            </button>
            <button type="button" id="btn-confirm-topup" class="btn btn-primary" onclick="MeetingRoomsModule.confirmCreditTopUp('${sId}', '${idemKey}')" style="background: #4F3FE0; border-color: #4338CA; font-weight: 800; font-size: 12.5px; padding: 9px 24px; border-radius: 8px; box-shadow: 0 4px 14px rgba(79, 63, 224, 0.3);">
              Confirm &amp; Add Credits
            </button>
          </div>
        </div>
      </div>
    `;

    this._selectedTopUp = { hours: 10, credits: 100, amount: 4500, packTitle: 'Growth Pack' };
    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = modalHtml;
  },

  selectTopUpPack(hours, amount, packTitle) {
    const credits = hours * 10;
    this._selectedTopUp = { hours, credits, amount, packTitle };
    [5, 10, 20].forEach(h => {
      const el = document.getElementById(`topup-pack-${h}`);
      if (el) {
        if (h === hours) el.classList.add('active');
        else el.classList.remove('active');
      }
    });

    const gst = Math.round(amount * 0.18);
    const total = amount + gst;
    const subEl = document.getElementById('topup-subtotal');
    const gstEl = document.getElementById('topup-gst');
    const totEl = document.getElementById('topup-total');
    if (subEl) subEl.textContent = `₹${amount.toLocaleString('en-IN')}`;
    if (gstEl) gstEl.textContent = `₹${gst.toLocaleString('en-IN')}`;
    if (totEl) totEl.textContent = `₹${total.toLocaleString('en-IN')}`;
  },

  async confirmCreditTopUp(startupId, idempotencyKey) {
    const pack = this._selectedTopUp || { hours: 10, credits: 100, amount: 4500, packTitle: 'Growth Pack' };
    const btn = document.getElementById('btn-confirm-topup');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; vertical-align: middle;"></span> Processing...`;
    }

    try {
      const sId = startupId || (window.store && window.store.getActiveStartup ? window.store.getActiveStartup().id : 'STP-XYZ');
      const startup = (window.store && window.store.getStartupById) ? window.store.getStartupById(sId) : null;
      const paymentMethodRadio = document.querySelector('input[name="topup-paymethod"]:checked');
      const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : 'UPI';

      const res = await fetch('/api/credits/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: sId,
          credits: pack.credits || pack.hours * 10,
          hours: pack.hours,
          amount: pack.amount,
          packTitle: pack.packTitle,
          paymentMethod,
          idempotencyKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Top-up transaction could not be processed.');
      }

      // Sync client store state with server response
      if (startup) {
        if (!Array.isArray(startup.topUps)) startup.topUps = [];
        startup.topUps.push(data.topUp);
      }
      if (window.store && window.store.state && Array.isArray(window.store.state.invoices)) {
        window.store.state.invoices.unshift(data.invoice);
        if (window.store.save) window.store.save();
      }

      this.closeModal('modal-credit-topup');
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`🎉 Top-up successful! Added ${pack.credits} credits (${pack.hours} hrs) to ${startup ? startup.name : 'account'}.`, 'success');
      }

      this.render();
      this.refreshDashboardSummary();
      window.dispatchEvent(new CustomEvent('store:updated'));
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Confirm & Add Credits';
      }
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`Error processing credit top-up: ${err.message}`, 'danger');
      }
    }
  },

  openInvoiceDetailsModal(invoiceId) {
    const inv = window.store ? window.store.getInvoiceById(invoiceId) : null;
    if (!inv) {
      if (typeof App !== 'undefined') App.showToast('Invoice not found.', 'danger');
      return;
    }

    const bs = (typeof window !== 'undefined' && window.billingService) ? window.billingService : require('../../billingService');
    const baseAmt = inv.subtotal || inv.taxableAmount || Math.round((inv.total || 0) / 1.18);
    const gstAmt = inv.taxGst || (inv.total ? inv.total - baseAmt : 0);
    const gst = bs.calculateGST(baseAmt, inv.gstin || '29AAACX9920M1Z4');
    const words = bs.numberToWordsIndian(inv.total);

    const modalHtml = `
      <div class="modal-overlay active" id="modal-invoice-detail" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-invoice-detail')" style="display: flex; align-items: center; justify-content: center; z-index: 1060; padding: 16px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);">
        <div style="background: #ffffff; border-radius: 18px; max-width: 680px; width: 100%; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.35); border: 1px solid #E2E8F0; color: #1E293B;">
          <!-- Header -->
          <div style="background: #0F172A; color: #ffffff; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #38BDF8; letter-spacing: 0.08em; text-transform: uppercase;">TAX INVOICE (GST)</div>
              <h3 style="font-size: 20px; font-weight: 900; margin: 4px 0 0 0; color: #ffffff; font-family: monospace;">${inv.id}</h3>
            </div>
            <button type="button" onclick="MeetingRoomsModule.closeModal('modal-invoice-detail')" style="color: #ffffff; background: rgba(255,255,255,0.15); border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; cursor: pointer;">✕</button>
          </div>

          <!-- Body -->
          <div style="padding: 24px; max-height: 75vh; overflow-y: auto; font-size: 12px; display: flex; flex-direction: column; gap: 16px;">
            <!-- Two Column Seller & Buyer Info -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px;">
              <div>
                <div style="font-size: 10.5px; font-weight: 800; color: #64748B; text-transform: uppercase;">SUPPLIER / ISSUER</div>
                <div style="font-weight: 800; font-size: 12.5px; margin-top: 2px;">${bs.SELLER_INFO.legalName}</div>
                <div style="color: #64748B; font-size: 11px; margin-top: 2px;">GSTIN: <strong>${bs.SELLER_INFO.gstin}</strong> (State: 29)</div>
                <div style="color: #64748B; font-size: 11px;">SAC Code: <strong>${bs.SELLER_INFO.sacCode}</strong></div>
              </div>
              <div>
                <div style="font-size: 10.5px; font-weight: 800; color: #64748B; text-transform: uppercase;">BILLED TO (BUYER)</div>
                <div style="font-weight: 800; font-size: 12.5px; margin-top: 2px;">${inv.startupName || 'XYZ Technologies Private Limited'}</div>
                <div style="color: #64748B; font-size: 11px; margin-top: 2px;">GSTIN: <strong>${inv.gstin || '29AAACX9920M1Z4'}</strong></div>
                <div style="color: #64748B; font-size: 11px;">Billing Period: <strong>${inv.billingPeriod || 'November 2026'}</strong></div>
              </div>
            </div>

            <!-- Line Items Table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="border-bottom: 2px solid #E2E8F0; text-align: left; color: #64748B; font-size: 10.5px; text-transform: uppercase;">
                  <th style="padding: 8px 4px;">Description / Service</th>
                  <th style="padding: 8px 4px;">SAC</th>
                  <th style="padding: 8px 4px; text-align: right;">Base (₹)</th>
                  <th style="padding: 8px 4px; text-align: right;">GST (₹)</th>
                  <th style="padding: 8px 4px; text-align: right;">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 10px 4px; font-weight: 700;">${(inv.lineItems && inv.lineItems[0]) ? inv.lineItems[0].desc : 'Co-Working Membership & Meeting Allowance'}</td>
                  <td style="padding: 10px 4px; color: #64748B;">997212</td>
                  <td style="padding: 10px 4px; text-align: right; font-weight: 700;">₹${baseAmt.toLocaleString('en-IN')}</td>
                  <td style="padding: 10px 4px; text-align: right; font-weight: 700;">₹${gstAmt.toLocaleString('en-IN')}</td>
                  <td style="padding: 10px 4px; text-align: right; font-weight: 900;">₹${Number(inv.total || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <!-- GST Tax Breakdown -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Taxable Amount (Base):</span>
                <span style="font-weight: 800;">₹${baseAmt.toLocaleString('en-IN')}</span>
              </div>
              ${gst.taxType === 'INTRA_STATE' ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748B;">
                  <span>CGST (9%):</span>
                  <span style="font-weight: 700;">₹${gst.cgstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748B;">
                  <span>SGST (9%):</span>
                  <span style="font-weight: 700;">₹${gst.sgstAmount.toLocaleString('en-IN')}</span>
                </div>
              ` : `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748B;">
                  <span>IGST (18%):</span>
                  <span style="font-weight: 700;">₹${gst.igstAmount.toLocaleString('en-IN')}</span>
                </div>
              `}
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 8px; font-size: 14px; font-weight: 900; color: #4F3FE0;">
                <span>Invoice Total:</span>
                <span>₹${Number(inv.total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 6px; font-style: italic;">
                Amount in Words: <strong>${words}</strong>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div style="padding: 14px 24px; background: #F8FAFC; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="App.showToast('Invoice sent to registered email addresses.', 'success')" style="font-weight: 700;">
              ✉️ Email Invoice
            </button>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="window.print()" style="font-weight: 700;">
                🖨️ Print / PDF
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.closeModal('modal-invoice-detail')" style="background: #4F3FE0; border-color: #4338CA; font-weight: 800;">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = modalHtml;
  },

  openVoidInvoiceModal(invoiceId) {
    const modalHtml = `
      <div class="modal-overlay active" id="modal-void-invoice" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-void-invoice')" style="display: flex; align-items: center; justify-content: center; z-index: 1070; padding: 16px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);">
        <div style="background: #ffffff; border-radius: 18px; max-width: 480px; width: 100%; overflow: hidden; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.35);">
          <h3 style="font-size: 18px; font-weight: 900; color: #DC2626; margin: 0 0 8px 0;">
            ⚠️ Void Invoice #${invoiceId}
          </h3>
          <p style="font-size: 12.5px; color: #64748B; margin: 0 0 16px 0;">
            Voiding marks this invoice as cancelled without deleting the record from the audit trail. A valid operational reason is mandatory.
          </p>
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 6px;">
              Reason for Voiding: <span style="color: #dc2626;">*</span>
            </label>
            <textarea id="void-reason-input" rows="3" placeholder="e.g. Duplicate batch generation of January 2027 cabin rent..." style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #CBD5E1; font-size: 12px;" required></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn btn-outline" onclick="MeetingRoomsModule.closeModal('modal-void-invoice')" style="font-size: 12px; font-weight: 700; padding: 6px 14px;">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" onclick="MeetingRoomsModule.confirmVoidInvoice('${invoiceId}')" style="background: #DC2626; border-color: #B91C1C; font-size: 12px; font-weight: 800; padding: 6px 18px;">
              Confirm Void
            </button>
          </div>
        </div>
      </div>
    `;
    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = modalHtml;
  },

  async confirmVoidInvoice(invoiceId) {
    const input = document.getElementById('void-reason-input');
    const reason = input ? input.value.trim() : '';
    if (!reason || reason.length < 5) {
      if (typeof App !== 'undefined') App.showToast('A specific reason (minimum 5 chars) is required.', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/invoices/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'super_admin' },
        body: JSON.stringify({ invoiceId, reason })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to void invoice');

      const inv = window.store.getInvoiceById(invoiceId);
      if (inv) {
        inv.status = 'Void';
        inv.voidReason = reason;
      }

      this.closeModal('modal-void-invoice');
      if (typeof App !== 'undefined') App.showToast(`Invoice #${invoiceId} voided.`, 'success');
      this.render();
    } catch (err) {
      if (typeof App !== 'undefined') App.showToast(err.message, 'danger');
    }
  },

  openRequestInvoiceModal(startupId) {
    const modalHtml = `
      <div class="modal-overlay active" id="modal-req-invoice" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-req-invoice')" style="display: flex; align-items: center; justify-content: center; z-index: 1070; padding: 16px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);">
        <div style="background: #ffffff; border-radius: 18px; max-width: 480px; width: 100%; overflow: hidden; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.35);">
          <h3 style="font-size: 18px; font-weight: 900; color: #111827; margin: 0 0 8px 0;">
            ✉️ Request Custom Tax Invoice
          </h3>
          <p style="font-size: 12.5px; color: #64748B; margin: 0 0 16px 0;">
            Submit a request to Finance Operations for custom billing, credit note adjustment, or corporate purchase order matching.
          </p>
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">Service / Subject</label>
            <input type="text" id="req-inv-subject" placeholder="e.g. November 2026 Top-Up Bulk Order" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #CBD5E1; font-size: 12px;" />
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">Notes / PO Details</label>
            <textarea id="req-inv-notes" rows="3" placeholder="Enter PO reference, special instructions..." style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #CBD5E1; font-size: 12px;"></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn btn-outline" onclick="MeetingRoomsModule.closeModal('modal-req-invoice')" style="font-size: 12px; font-weight: 700;">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="MeetingRoomsModule.closeModal('modal-req-invoice'); App.showToast('Invoice request dispatched to Finance Ops.', 'success');" style="background: #4F3FE0; font-size: 12px; font-weight: 800;">Submit Request</button>
          </div>
        </div>
      </div>
    `;
    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = modalHtml;
  },

  updateBillingProfile(startupId, event) {
    if (event) event.preventDefault();
    const legalName = document.getElementById('billing-legal-name')?.value;
    const gstin = document.getElementById('billing-gstin')?.value;
    const address = document.getElementById('billing-address')?.value;

    const bs = (typeof window !== 'undefined' && window.billingService) ? window.billingService : require('../../billingService');
    if (gstin && !bs.validateGSTIN(gstin)) {
      if (typeof App !== 'undefined') App.showToast('Invalid GSTIN format (must be 15 alphanumeric characters).', 'danger');
      return;
    }

    const startup = window.store.getStartupById(startupId);
    if (startup) {
      startup.name = legalName || startup.name;
      startup.gstin = gstin ? gstin.trim().toUpperCase() : startup.gstin;
      startup.billingAddress = address;
      if (window.store.save) window.store.save();
    }

    if (typeof App !== 'undefined') App.showToast('Billing profile saved successfully.', 'success');
  },

  toggleAutoRenew(startupId, enabled) {
    if (typeof App !== 'undefined') {
      App.showToast(enabled ? 'Auto-renew enabled for next cycle (1 Dec 2026).' : 'Auto-renew disabled.', 'info');
    }
  },

  openTDSModal(invoiceId) {
    const modalHtml = `
      <div class="modal-overlay active" id="modal-tds" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-tds')" style="display: flex; align-items: center; justify-content: center; z-index: 1070; padding: 16px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px);">
        <div style="background: #ffffff; border-radius: 18px; max-width: 460px; width: 100%; overflow: hidden; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.35);">
          <h3 style="font-size: 18px; font-weight: 900; color: #111827; margin: 0 0 6px 0;">
            🏢 Section 194-I TDS Credit
          </h3>
          <p style="font-size: 12px; color: #64748B; margin: 0 0 14px 0;">
            Attach Form 16A or Challan ITNS 281 for 10% rent TDS deduction on invoice #${invoiceId}.
          </p>
          <div style="border: 2px dashed #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px; cursor: pointer;" onclick="document.getElementById('tds-file').click()">
            <span style="font-size: 28px;">📄</span>
            <div style="font-weight: 800; font-size: 12px; margin-top: 4px; color: #4F3FE0;">Click to select Form 16A PDF</div>
            <div style="font-size: 10px; color: #94A3B8;">Max size: 5 MB</div>
            <input type="file" id="tds-file" accept=".pdf" style="display: none;" onchange="document.getElementById('tds-filename').textContent = this.files[0]?.name || ''" />
            <div id="tds-filename" style="font-weight: 700; color: #059669; font-size: 11px; margin-top: 4px;"></div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-tds')" style="font-weight: 700;">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.closeModal('modal-tds'); App.showToast('TDS certificate submitted for Admin approval.', 'success');" style="background: #4F3FE0; font-weight: 800;">Upload &amp; Submit</button>
          </div>
        </div>
      </div>
    `;
    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = modalHtml;
  },

  // Tab 5: Analytics Dashboard View (Utilization, Peak Hours, Cancellations, Revenue, Startup Usage)
  setAnalyticsFilterRange(range, startDate = '', endDate = '') {
    this.analyticsRange = range;
    if (startDate !== undefined) this.analyticsStartDate = startDate;
    if (endDate !== undefined) this.analyticsEndDate = endDate;
    this.render();
  },

  renderAnalyticsTabView({ rooms }) {
    const ist = this.getISTNow();
    const startups = (window.store && window.store.getStartups) ? window.store.getStartups() : [];
    const range = this.analyticsRange || 'all';
    let minDate = this.analyticsStartDate || null;
    let maxDate = this.analyticsEndDate || null;

    if (range !== 'custom' && range !== 'all') {
      const baseParts = ist.todayStr.split('-').map(Number);
      const todayUtc = new Date(Date.UTC(baseParts[0], baseParts[1] - 1, baseParts[2]));
      if (range === 'day') {
        minDate = ist.todayStr;
        maxDate = ist.todayStr;
      } else if (range === 'week') {
        const s = new Date(todayUtc.getTime() - 6 * 86400000);
        const e = new Date(todayUtc.getTime() + 7 * 86400000);
        minDate = s.toISOString().split('T')[0];
        maxDate = e.toISOString().split('T')[0];
      } else if (range === 'month') {
        minDate = `${ist.todayStr.slice(0, 7)}-01`;
        maxDate = `${ist.todayStr.slice(0, 7)}-31`;
      }
    }

    let totalBookings = 0;
    let confirmedBookings = 0;
    let cancelledBookings = 0;
    let totalBookedHours = 0;
    let totalRevenue = 0;

    const hourlyCounts = { '08:00': 0, '09:00': 0, '10:00': 0, '15:00': 0, '16:00': 0, '17:00': 0, '18:00': 0 };
    const daysCount = range === 'day' ? 1 : range === 'week' ? 7 : 30;
    const availPerRoom = daysCount * 7;

    const roomStats = (rooms || []).map(r => {
      let rConfirmed = 0;
      let rCancelled = 0;
      let rHours = 0;
      let rRev = 0;
      (r.bookings || []).forEach(b => {
        if (minDate && b.date < minDate) return;
        if (maxDate && b.date > maxDate) return;
        totalBookings++;
        const dur = this.calculateBookingDuration(b.startTime, b.endTime);
        if (b.status === 'Cancelled') {
          cancelledBookings++;
          rCancelled++;
          return;
        }
        confirmedBookings++;
        rConfirmed++;
        rHours += dur;
        totalBookedHours += dur;
        const cost = Number(b.cost || 0);
        rRev += cost;
        totalRevenue += cost;

        const sMin = this.parseTimeToMinutes(b.startTime);
        const eMin = this.parseTimeToMinutes(b.endTime);
        [8, 9, 10, 15, 16, 17, 18].forEach(h => {
          if (sMin < (h + 1) * 60 && eMin > h * 60) {
            const k = `${h < 10 ? '0' : ''}${h}:00`;
            hourlyCounts[k] = (hourlyCounts[k] || 0) + 1;
          }
        });
      });
      const utilPct = Math.min(100, Math.round((rHours / Math.max(1, availPerRoom)) * 100));
      return {
        id: r.id,
        name: r.name,
        icon: r.icon || '🏢',
        capacity: r.capacity,
        hourlyRate: r.hourlyRate,
        confirmed: rConfirmed,
        cancelled: rCancelled,
        bookedHours: Number(rHours.toFixed(1)),
        availableHours: availPerRoom,
        utilPct,
        revenue: rRev
      };
    }).sort((a, b) => b.bookedHours - a.bookedHours);

    const totalAvailHours = Math.max(1, (rooms || []).length * availPerRoom);
    const overallUtilPct = Math.min(100, Math.round((totalBookedHours / totalAvailHours) * 100));
    const cancelRatePct = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;
    const peakEntries = Object.entries(hourlyCounts).sort((a, b) => b[1] - a[1]);
    const peakHour = peakEntries[0] || ['09:00', 0];
    const maxPeakCount = Math.max(1, peakHour[1]);
    const totalCreditsConsumed = startups.reduce((s, st) => s + (Number(st.usedMeetingHours) || 0), 0);

    return `
      <!-- Analytics Filter Bar -->
      <div class="card" style="padding: 14px 20px; margin-bottom: 20px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-surface-elevated); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
            <span>📊</span> Meeting Room Utilization &amp; Revenue Analytics
          </h3>
          <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">
            Real-time metrics computed directly from confirmed &amp; cancelled database reservation records.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm ${range === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setAnalyticsFilterRange('all')" style="border-radius: 8px; font-size: 11.5px; font-weight: 700;">All Time</button>
          <button type="button" class="btn btn-sm ${range === 'day' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setAnalyticsFilterRange('day')" style="border-radius: 8px; font-size: 11.5px; font-weight: 700;">Today</button>
          <button type="button" class="btn btn-sm ${range === 'week' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setAnalyticsFilterRange('week')" style="border-radius: 8px; font-size: 11.5px; font-weight: 700;">This Week</button>
          <button type="button" class="btn btn-sm ${range === 'month' ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setAnalyticsFilterRange('month')" style="border-radius: 8px; font-size: 11.5px; font-weight: 700;">This Month</button>
          <input type="date" value="${this.analyticsStartDate || ''}" onchange="MeetingRoomsModule.setAnalyticsFilterRange('custom', this.value, MeetingRoomsModule.analyticsEndDate)" class="form-control" style="width: auto; font-size: 11.5px; padding: 4px 8px; border-radius: 6px;" title="Custom Start Date">
          <span style="font-size: 11px; color: var(--text-muted);">to</span>
          <input type="date" value="${this.analyticsEndDate || ''}" onchange="MeetingRoomsModule.setAnalyticsFilterRange('custom', MeetingRoomsModule.analyticsStartDate, this.value)" class="form-control" style="width: auto; font-size: 11.5px; padding: 4px 8px; border-radius: 6px;" title="Custom End Date">
        </div>
      </div>

      <!-- 6 Analytics KPI Cards -->
      <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 14px; margin-bottom: 22px;">
        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(37, 99, 235, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Reservations</div>
          <div style="font-size: 26px; font-weight: 800; color: #2563eb; margin-top: 4px;">${confirmedBookings} Confirmed</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${totalBookedHours.toFixed(1)}h booked vs ${totalAvailHours}h capacity</div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(16, 185, 129, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Room Utilization Rate</div>
          <div style="font-size: 26px; font-weight: 800; color: #16a34a; margin-top: 4px;">${overallUtilPct}%</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Top: ${roomStats[0] ? roomStats[0].name : 'N/A'}</div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(99, 102, 241, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Peak Booking Window</div>
          <div style="font-size: 24px; font-weight: 800; color: #4f46e5; margin-top: 4px;">⏰ ${this.formatTimeTo12Hour(peakHour[0])}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${peakHour[1]} active sessions in slot</div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(239, 68, 68, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Cancellation Rate</div>
          <div style="font-size: 26px; font-weight: 800; color: #dc2626; margin-top: 4px;">${cancelRatePct}%</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${cancelledBookings} cancelled of ${totalBookings} total</div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(245, 158, 11, 0.25);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Overage Revenue</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">₹${totalRevenue.toLocaleString('en-IN')}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Billed beyond plan credits</div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid var(--border-subtle);">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Credits Consumed</div>
          <div style="font-size: 26px; font-weight: 800; color: #0284c7; margin-top: 4px;">${totalCreditsConsumed.toFixed(1)} hrs</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Across ${startups.length} incubated startups</div>
        </div>
      </div>

      <!-- 2-Column Analytics Breakdown: Room Utilization & Peak Booking Hours -->
      <div class="grid-2col" style="margin-bottom: 24px;">
        <!-- Room Popularity & Utilization -->
        <div class="card" style="padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 14px;">
          <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin: 0 0 14px 0;">
            🏢 Room Utilization, Popularity &amp; Revenue Breakdown
          </h4>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${roomStats.map(rs => `
              <div style="background: var(--bg-surface-elevated); padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div style="font-weight: 800; font-size: 13px; color: var(--text-primary);">
                    ${rs.icon} ${rs.name} <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">(${rs.capacity} Pax • ₹${rs.hourlyRate}/hr)</span>
                  </div>
                  <div style="font-size: 12px; font-weight: 800; color: #2563eb; font-family: var(--font-mono);">
                    ${rs.bookedHours}h / ${rs.availableHours}h (${rs.utilPct}%)
                  </div>
                </div>
                <div style="height: 7px; width: 100%; background: var(--border-subtle); border-radius: 999px; overflow: hidden; margin-bottom: 6px;">
                  <div style="height: 100%; width: ${rs.utilPct}%; background: linear-gradient(90deg, #2563eb, #10b981); border-radius: 999px;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                  <span>✅ ${rs.confirmed} Confirmed • 🚫 ${rs.cancelled} Cancelled</span>
                  <span>💰 Revenue: <strong style="color: var(--text-primary);">₹${rs.revenue.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Peak Booking Hours Distribution -->
        <div class="card" style="padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 14px;">
          <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin: 0 0 14px 0;">
            ⏰ Peak Operating Hours Demand Distribution (IST)
          </h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${Object.entries(hourlyCounts).map(([slot, cnt]) => {
              const barPct = Math.round((cnt / maxPeakCount) * 100);
              return `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 3px;">
                    <span style="font-family: var(--font-mono);">${this.formatTimeTo12Hour(slot)}</span>
                    <span style="color: #2563eb;">${cnt} ${cnt === 1 ? 'reservation' : 'reservations'}</span>
                  </div>
                  <div style="height: 8px; width: 100%; background: var(--border-subtle); border-radius: 999px; overflow: hidden;">
                    <div style="height: 100%; width: ${barPct}%; background: #4f46e5; border-radius: 999px;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Startup Usage Table -->
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 14px; margin-bottom: 22px;">
        <div style="padding: 14px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle);">
          <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">📊 Startup-Wise Booking Usage & Credit Consumption</h4>
        </div>
        <div style="overflow-x: auto;">
          <table class="nexus-table" style="width: 100%; margin: 0; font-size: 12.5px;">
            <thead>
              <tr>
                <th>Startup</th>
                <th>Plan</th>
                <th>Included Hrs</th>
                <th>Used Credits</th>
                <th>Remaining</th>
                <th>Bookings</th>
                <th>Booked Hrs</th>
                <th>Overage Billed</th>
              </tr>
            </thead>
            <tbody>
              ${startups.length === 0 ? `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:20px;">No startup data available.</td></tr>` :
                startups.map(st => {
                  const included = Number(st.includedMeetingHours !== undefined ? st.includedMeetingHours : 12);
                  const used = Number(st.usedMeetingHours || 0);
                  const remaining = Math.max(0, included - used);
                  const usePct = Math.min(100, Math.round((used / Math.max(1, included)) * 100));
                  const allBookings = [];
                  (rooms || []).forEach(r => {
                    (r.bookings || []).forEach(b => {
                      if (b.startupId === st.id && b.status !== 'Cancelled') allBookings.push(b);
                    });
                  });
                  const bookedHrs = allBookings.reduce((s, b) => s + (b.duration || 0), 0);
                  const overage = allBookings.reduce((s, b) => s + (Number(b.cost) || 0), 0);
                  return `
                    <tr>
                      <td><strong>${st.name}</strong></td>
                      <td><span class="badge badge-primary" style="font-size:10.5px;">${st.subscriptionPlan || 'Growth Plan'}</span></td>
                      <td style="font-family:var(--font-mono);">${included}h</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="flex:1;height:5px;background:var(--border-subtle);border-radius:999px;overflow:hidden;min-width:50px;">
                            <div style="height:100%;width:${usePct}%;background:${usePct >= 90 ? '#dc2626' : usePct >= 70 ? '#f59e0b' : '#16a34a'};border-radius:999px;"></div>
                          </div>
                          <span style="font-family:var(--font-mono);font-size:11.5px;">${used.toFixed(1)}h</span>
                        </div>
                      </td>
                      <td style="font-family:var(--font-mono);color:${remaining <= 2 ? '#dc2626' : '#16a34a'};">${remaining.toFixed(1)}h</td>
                      <td>${allBookings.length}</td>
                      <td style="font-family:var(--font-mono);">${bookedHrs.toFixed(1)}h</td>
                      <td style="font-family:var(--font-mono);color:${overage > 0 ? '#dc2626' : 'var(--text-muted)'};">${overage > 0 ? '₹'+overage.toLocaleString('en-IN') : '—'}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // Tab 6: Admin Management View (Add/Edit Rooms, Maintenance Block, Booking Policies, Approvals, Audit Log)
  renderAdminManagementTabView({ rooms }) {
    if (!this.isAdminUser()) {
      return `
        <div class="card" style="padding: 40px 24px; text-align: center; border: 1.5px solid #ef4444; border-radius: 16px;">
          <div style="font-size: 36px; margin-bottom: 8px;">🔒</div>
          <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">Administrator Authorization Required</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Only Super Administrators and Incubation Administrators can access room configuration and booking policies.</p>
        </div>
      `;
    }

    const policies = (window.store && window.store.getMeetingRoomPolicies) ? window.store.getMeetingRoomPolicies() : {
      maxDurationHours: 4,
      minDurationMins: 30,
      cancellationCutoffHours: 1,
      rescheduleCutoffHours: 1,
      allowRecurring: true,
      maxRecurringOccurrences: 12,
      requireApprovalAboveHours: 0,
      operatingHoursLabel: '08:00 AM – 11:00 AM & 03:00 PM – 07:00 PM IST'
    };
    const auditLogs = (window.store && window.store.getAdminAuditLog) ? window.store.getAdminAuditLog() : [];
    const editingRoom = this.editingAdminRoomId ? (rooms || []).find(r => r.id === this.editingAdminRoomId) : null;

    const pendingApprovals = [];
    (rooms || []).forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.status === 'Pending Approval') {
          pendingApprovals.push({ ...b, roomId: r.id, roomName: r.name });
        }
      });
    });

    return `
      <!-- Admin Header & Role Badge -->
      <div class="card" style="padding: 16px 22px; margin-bottom: 20px; border: 1.5px solid rgba(99, 102, 241, 0.35); border-radius: 14px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
            <span>🛡️</span> Meeting Room Administration &amp; Governance Control Center
          </h3>
          <p style="font-size: 12px; color: var(--text-secondary); margin: 3px 0 0 0;">
            Configure room inventory, capacities, amenities, hourly rates, maintenance blocks, booking policies, and audit trails.
          </p>
        </div>
        <span class="badge badge-primary" style="font-size: 11.5px; font-weight: 800; padding: 5px 12px;">
          👑 Authorized Admin (${(window.store && window.store.currentRole) || 'super_admin'})
        </span>
      </div>

      <!-- Building Floor Directory Overview -->
      <div class="card" style="padding: 16px 20px; border: 1px solid var(--border-subtle); border-radius: 14px; margin-bottom: 20px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <h4 style="font-size: 14px; font-weight: 800; color: #1e1b4b; margin: 0; display: flex; align-items: center; gap: 8px;">
            <span>🏢</span> Building Floors &amp; Inventory Directory (NEXUS Cyber City Hub)
          </h4>
          <span class="badge badge-primary" style="font-size: 11px; font-weight: 700; padding: 3px 10px;">
            7 Building Floors • 10 Meeting Rooms
          </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          ${[
            { floor: '1F', label: '1st Floor', count: (rooms || []).filter(r => (r.floor || '1F') === '1F').length, badge: '2 Rooms' },
            { floor: '2F', label: '2nd Floor', count: (rooms || []).filter(r => (r.floor || '') === '2F').length, badge: '1 Room' },
            { floor: '3F', label: '3rd Floor', count: (rooms || []).filter(r => (r.floor || '') === '3F').length, badge: '2 Rooms' },
            { floor: '4F', label: '4th Floor', count: (rooms || []).filter(r => (r.floor || '') === '4F').length, badge: '1 Room' },
            { floor: '5F', label: '5th Floor', count: 0, badge: '0 Rooms (Empty)', empty: true },
            { floor: '6F', label: '6th Floor', count: (rooms || []).filter(r => (r.floor || '') === '6F').length, badge: '2 Rooms' },
            { floor: '7F', label: '7th Floor (Skydeck)', count: (rooms || []).filter(r => (r.floor || '') === '7F').length, badge: '2 Rooms' }
          ].map(fl => `
            <div style="background: ${fl.empty ? '#fef2f2' : '#f8fafc'}; border: 1.5px solid ${fl.empty ? '#fecaca' : '#e2e8f0'}; border-radius: 10px; padding: 10px 12px; text-align: center;">
              <div style="font-size: 16px; font-weight: 800; color: ${fl.empty ? '#dc2626' : '#4f3fe0'};">${fl.floor}</div>
              <div style="font-size: 10.5px; color: #64748b; font-weight: 600; margin: 2px 0 4px 0;">${fl.label}</div>
              <span class="badge ${fl.empty ? 'badge-danger' : 'badge-info'}" style="font-size: 10px; padding: 1px 7px;">
                ${fl.badge}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2-Column Admin Panel: Add/Edit Room Form + Booking Policies -->
      <div class="grid-2col" style="margin-bottom: 22px;">
        <!-- Add / Edit Room Form -->
        <div class="card" style="padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">
              ${editingRoom ? `✏️ Edit Room: ${editingRoom.name} (${editingRoom.id})` : '➕ Add / Configure Meeting Room'}
            </h4>
            ${editingRoom ? `
              <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.editingAdminRoomId = null; MeetingRoomsModule.render();" style="font-size: 11px;">
                Cancel Edit
              </button>
            ` : ''}
          </div>
          <form onsubmit="MeetingRoomsModule.handleSaveAdminRoom(event)">
            <input type="hidden" name="id" value="${editingRoom ? editingRoom.id : ''}">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Room Name *</label>
                <input type="text" name="name" class="form-control" value="${editingRoom ? editingRoom.name : ''}" placeholder="e.g. Executive Pod Delta" required style="font-size: 12px;">
              </div>
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Capacity (Pax) *</label>
                <input type="number" name="capacity" class="form-control" value="${editingRoom ? editingRoom.capacity : 10}" min="1" max="200" required style="font-size: 12px;">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Building Floor *</label>
                <select name="floor" class="form-control" style="font-size: 12px;">
                  <option value="1F" ${editingRoom && editingRoom.floor === '1F' ? 'selected' : ''}>1F (First Floor)</option>
                  <option value="2F" ${editingRoom && editingRoom.floor === '2F' ? 'selected' : ''}>2F (Second Floor)</option>
                  <option value="3F" ${editingRoom && editingRoom.floor === '3F' ? 'selected' : ''}>3F (Third Floor)</option>
                  <option value="4F" ${editingRoom && editingRoom.floor === '4F' ? 'selected' : ''}>4F (Fourth Floor)</option>
                  <option value="5F" ${editingRoom && editingRoom.floor === '5F' ? 'selected' : ''}>5F (Fifth Floor - Zero Rooms)</option>
                  <option value="6F" ${editingRoom && editingRoom.floor === '6F' ? 'selected' : ''}>6F (Sixth Floor)</option>
                  <option value="7F" ${editingRoom && editingRoom.floor === '7F' ? 'selected' : ''}>7F (Seventh Floor / Skydeck)</option>
                </select>
              </div>
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Room Location Number *</label>
                <input type="text" name="roomNumber" class="form-control" value="${editingRoom ? (editingRoom.roomNumber || '') : ''}" placeholder="e.g. 1F-R01" required style="font-size: 12px; font-family: monospace;">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Hourly Rate (₹/hr) *</label>
                <input type="number" name="hourlyRate" class="form-control" value="${editingRoom ? editingRoom.hourlyRate : 1200}" min="0" step="100" required style="font-size: 12px;">
              </div>
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Operating Hours (IST)</label>
                <input type="text" name="operatingHours" class="form-control" value="${editingRoom ? (editingRoom.operatingHours || '08:00-11:00, 15:00-19:00') : '08:00-11:00, 15:00-19:00'}" style="font-size: 12px;">
              </div>
            </div>
            <div style="margin-bottom: 12px;">
              <label class="form-label" style="font-size: 11px; font-weight: 700;">Amenities (comma-separated)</label>
              <input type="text" name="amenities" class="form-control" value="${editingRoom && Array.isArray(editingRoom.amenities) ? editingRoom.amenities.join(', ') : '4K Projector, Video Conferencing, Whiteboard, High-Speed Wi-Fi'}" style="font-size: 12px;">
            </div>
            <button type="submit" class="btn btn-primary btn-sm" style="font-weight: 800; border-radius: 8px; padding: 7px 18px;">
              ${editingRoom ? '💾 Save Room Changes' : '➕ Save Room to Inventory'}
            </button>
          </form>
        </div>

        <!-- Hub Booking Policies Form -->
        <div class="card" style="padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 14px;">
          <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0 0 12px 0;">
            ⚙️ Hub Booking Policies &amp; Approval Rules
          </h4>
          <form onsubmit="MeetingRoomsModule.handleUpdateBookingPolicies(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Max Booking Duration (Hours)</label>
                <input type="number" name="maxDurationHours" class="form-control" value="${policies.maxDurationHours || 4}" min="1" max="12" style="font-size: 12px;">
              </div>
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Require Approval Above (Hours, 0=Off)</label>
                <input type="number" name="requireApprovalAboveHours" class="form-control" value="${policies.requireApprovalAboveHours || 0}" min="0" max="12" step="0.5" style="font-size: 12px;">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Recurring Reservations</label>
                <select name="allowRecurring" class="form-control" style="font-size: 12px;">
                  <option value="true" ${policies.allowRecurring !== false ? 'selected' : ''}>Enabled (Daily / Weekly / Bi-weekly)</option>
                  <option value="false" ${policies.allowRecurring === false ? 'selected' : ''}>Disabled</option>
                </select>
              </div>
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Max Recurring Occurrences</label>
                <input type="number" name="maxRecurringOccurrences" class="form-control" value="${policies.maxRecurringOccurrences || 12}" min="2" max="24" style="font-size: 12px;">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Advance Booking Window (Days)</label>
                <input type="number" name="advanceBookingDays" class="form-control" value="${policies.advanceBookingDays || 30}" min="1" max="180" style="font-size: 12px;">
              </div>
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Min Advance Notice (Minutes)</label>
                <input type="number" name="minAdvanceNoticeMins" class="form-control" value="${policies.minAdvanceNoticeMins || 60}" min="0" max="1440" step="30" style="font-size: 12px;">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Max Active Reservations / Startup</label>
                <input type="number" name="maxActiveReservationsPerStartup" class="form-control" value="${policies.maxActiveReservationsPerStartup || 5}" min="1" max="20" style="font-size: 12px;">
              </div>
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Max Daily Hours / Startup</label>
                <input type="number" name="maxDailyBookingHoursPerStartup" class="form-control" value="${policies.maxDailyBookingHoursPerStartup || 8}" min="1" max="12" style="font-size: 12px;">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Cancellation Cutoff (Hours before)</label>
                <input type="number" name="cancellationCutoffHours" class="form-control" value="${policies.cancellationCutoffHours != null ? policies.cancellationCutoffHours : 1}" min="0" max="72" style="font-size: 12px;">
              </div>
              <div>
                <label class="form-label" style="font-size: 11px; font-weight: 700;">Reschedule Cutoff (Hours before)</label>
                <input type="number" name="rescheduleCutoffHours" class="form-control" value="${policies.rescheduleCutoffHours != null ? policies.rescheduleCutoffHours : 1}" min="0" max="48" style="font-size: 12px;">
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-sm" style="font-weight: 800; border-radius: 8px; padding: 7px 18px;">
              ⚙️ Update Booking Policies
            </button>
          </form>
        </div>
      </div>

      <!-- Room Inventory & Maintenance Control Table -->
      <div class="card" style="margin-bottom: 22px; padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 14px;">
        <div style="padding: 14px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle);">
          <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">
            🏢 Room Inventory, Pricing &amp; Maintenance Controls (${(rooms || []).length} Rooms)
          </h4>
        </div>
        <div style="overflow-x: auto;">
          <table class="nexus-table" style="width: 100%; margin: 0; font-size: 12.5px;">
            <thead>
              <tr>
                <th>Room</th>
                <th>Floor &amp; Location</th>
                <th>Capacity</th>
                <th>Hourly Price</th>
                <th>Amenities</th>
                <th>Status</th>
                <th style="text-align: right;">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              ${(rooms || []).map(r => {
                const isMaint = this.isRoomUnderMaintenance(r);
                return `
                  <tr>
                    <td><strong>${r.icon || '🏢'} ${r.name}</strong> <span style="font-size: 11px; color: var(--text-muted);">(${r.id})</span></td>
                    <td>
                      <span class="badge" style="background:#EDE9FE; color:#4338CA; font-weight:800; font-size:11px; padding:2px 7px;">${r.floor || '1F'}</span>
                      <code style="font-size: 11.5px; font-weight: 700; color: #1e293b; margin-left: 4px;">${r.roomNumber || '1F-R01'}</code>
                    </td>
                    <td>${r.capacity} Pax</td>
                    <td style="font-family: var(--font-mono); font-weight: 700;">₹${r.hourlyRate}/hr</td>
                    <td style="font-size: 11.5px; color: var(--text-secondary);">${Array.isArray(r.amenities) ? r.amenities.join(' • ') : (r.amenities || 'Standard AV')}</td>
                    <td>
                      <span class="badge ${isMaint ? 'badge-warning' : 'badge-success'}" style="font-size: 11px; font-weight: 700;">
                        ${isMaint ? '🔧 Under Maintenance' : '● Active'}
                      </span>
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                      <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.editingAdminRoomId = '${r.id}'; MeetingRoomsModule.render();" style="font-size: 11px; padding: 4px 10px; margin-right: 6px;">
                        ✏️ Edit
                      </button>
                      <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.handleToggleRoomMaintenance('${r.id}', ${!isMaint})" style="font-size: 11px; padding: 4px 10px; color: ${isMaint ? '#16a34a' : '#ea580c'}; border-color: ${isMaint ? 'rgba(22,163,74,0.4)' : 'rgba(234,88,12,0.4)'};">
                        ${isMaint ? '✓ Restore Active' : '🔧 Block Maintenance'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pending Reservation Approvals & Admin Activity Audit Log -->
      <div class="grid-2col">
        <div class="card" style="padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 14px;">
          <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin: 0 0 12px 0;">
            🟣 Pending Reservation Approvals (${pendingApprovals.length})
          </h4>
          ${pendingApprovals.length === 0 ? `
            <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12.5px; background: var(--bg-surface-elevated); border-radius: 10px;">
              All eligible reservations are currently approved and confirmed.
            </div>
          ` : pendingApprovals.map(b => `
            <div style="padding: 10px 12px; border: 1px solid var(--border-subtle); border-radius: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
              <div>
                <div style="font-weight: 800; font-size: 12.5px;">${b.roomName} — ${b.startupName}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">📅 ${b.date} • ⏰ ${b.startTime}–${b.endTime} (${b.id})</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.handleApproveRejectBooking('${b.roomId}', '${b.id}', 'approve_booking')" style="font-size: 11px; padding: 4px 10px; background: #16a34a;">Approve</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.handleApproveRejectBooking('${b.roomId}', '${b.id}', 'reject_booking')" style="font-size: 11px; padding: 4px 10px; color: #dc2626;">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card" style="padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 14px;">
          <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin: 0 0 12px 0;">
            📜 Administrative Activity Audit Log
          </h4>
          <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            ${auditLogs.length === 0 ? `
              <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12.5px; background: var(--bg-surface-elevated); border-radius: 10px;">
                Administrative room and policy updates are recorded here with full role attribution.
              </div>
            ` : auditLogs.slice(0, 15).map(log => `
              <div style="padding: 8px 12px; background: var(--bg-surface-elevated); border-radius: 8px; border: 1px solid var(--border-subtle); font-size: 11.5px;">
                <div style="font-weight: 700; color: var(--text-primary);">🛡️ ${log.summary}</div>
                <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">Role: ${log.role || 'super_admin'} • ${log.timestamp}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Timed Maintenance Blocks Scheduler -->
      <div class="card" style="margin-top: 22px; padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 14px;">
        <div style="padding: 14px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">
            🔧 Maintenance & Availability Blocks
          </h4>
          <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.openMaintenanceModal()" style="font-size: 11.5px; font-weight: 700; border-radius: 8px;">
            + Schedule Maintenance Block
          </button>
        </div>
        ${(() => {
          const blocks = (window.store && window.store.getMaintenanceBlocks) ? window.store.getMaintenanceBlocks() : [];
          if (!blocks.length) return `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 12.5px;">No maintenance blocks scheduled. Use the button above to block a room for maintenance, cleaning, or private events.</div>`;
          return `<div style="overflow-x: auto;"><table class="nexus-table" style="width: 100%; margin: 0; font-size: 12.5px;">
            <thead><tr><th>Room</th><th>Reason</th><th>Start</th><th>End</th><th>Status</th><th>Created By</th><th style="text-align:right;">Actions</th></tr></thead>
            <tbody>${blocks.map(b => `
              <tr>
                <td><strong>${b.roomName || b.roomId}</strong></td>
                <td>${b.reason || '—'}</td>
                <td style="font-family:var(--font-mono);font-size:11.5px;">${b.startDateTime ? b.startDateTime.replace('T',' ').slice(0,16) : '—'}</td>
                <td style="font-family:var(--font-mono);font-size:11.5px;">${b.endDateTime ? b.endDateTime.replace('T',' ').slice(0,16) : '—'}</td>
                <td><span class="badge ${b.status === 'active' ? 'badge-warning' : 'badge-success'}" style="font-size:11px;">${b.status || 'scheduled'}</span></td>
                <td style="font-size:11.5px;color:var(--text-muted);">${b.createdBy || 'Admin'}</td>
                <td style="text-align:right;">
                  <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.handleDeleteMaintenanceBlock('${b.id}')" style="font-size:11px;padding:3px 8px;color:#dc2626;border-color:rgba(220,38,38,0.3);">Remove</button>
                </td>
              </tr>
            `).join('')}</tbody>
          </table></div>`;
        })()}
      </div>

      <!-- All Reservations Dashboard -->
      <div class="card" style="margin-top: 22px; padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: 14px;" id="admin-reservations-panel">
        <div style="padding: 14px 20px; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">
            📋 All Reservations — Admin Dashboard
          </h4>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select id="admin-res-filter-status" class="form-control" style="font-size: 11.5px; padding: 4px 8px; height: 30px; width: 140px;" onchange="MeetingRoomsModule.refreshAdminReservations()">
              <option value="">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
            <select id="admin-res-filter-room" class="form-control" style="font-size: 11.5px; padding: 4px 8px; height: 30px; width: 160px;" onchange="MeetingRoomsModule.refreshAdminReservations()">
              <option value="">All Rooms</option>
              ${(rooms || []).map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
            </select>
            <input type="date" id="admin-res-filter-from" class="form-control" style="font-size: 11.5px; padding: 4px 8px; height: 30px; width: 130px;" onchange="MeetingRoomsModule.refreshAdminReservations()" placeholder="From date">
            <input type="date" id="admin-res-filter-to" class="form-control" style="font-size: 11.5px; padding: 4px 8px; height: 30px; width: 130px;" onchange="MeetingRoomsModule.refreshAdminReservations()" placeholder="To date">
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.exportReservationsCSV()" style="font-size: 11.5px; font-weight: 700; border-radius: 8px; white-space: nowrap;">
              ⬇️ Export CSV
            </button>
          </div>
        </div>
        <div id="admin-reservations-table-body" style="overflow-x: auto; min-height: 80px;">
          ${this.renderAdminReservationsTable(rooms)}
        </div>
      </div>
    `;
  },

  async handleSaveAdminRoom(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const roomData = Object.fromEntries(fd.entries());
    const res = await window.store.manageMeetingRoomAdmin({ action: 'save_room', roomData });
    if (res && res.success) {
      this.editingAdminRoomId = null;
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`✅ ${res.message}`, 'success');
      this.render();
    } else if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`⚠️ ${res ? res.message : 'Failed to save room'}`, 'danger');
    }
  },

  async handleToggleRoomMaintenance(roomId, underMaintenance) {
    const res = await window.store.manageMeetingRoomAdmin({
      action: 'toggle_maintenance',
      roomId,
      underMaintenance
    });
    if (res && res.success) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`🔧 ${res.message}`, 'info');
      this.render();
    } else if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`⚠️ ${res ? res.message : 'Could not update maintenance status'}`, 'danger');
    }
  },

  async handleUpdateBookingPolicies(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const raw = Object.fromEntries(fd.entries());
    const policyData = {
      maxDurationHours: Number(raw.maxDurationHours) || 4,
      requireApprovalAboveHours: Number(raw.requireApprovalAboveHours) || 0,
      allowRecurring: raw.allowRecurring !== 'false',
      maxRecurringOccurrences: Number(raw.maxRecurringOccurrences) || 12,
      advanceBookingDays: Number(raw.advanceBookingDays) || 30,
      minAdvanceNoticeMins: Number(raw.minAdvanceNoticeMins) || 60,
      maxActiveReservationsPerStartup: Number(raw.maxActiveReservationsPerStartup) || 5,
      maxDailyBookingHoursPerStartup: Number(raw.maxDailyBookingHoursPerStartup) || 8,
      cancellationCutoffHours: raw.cancellationCutoffHours != null ? Number(raw.cancellationCutoffHours) : 1,
      rescheduleCutoffHours: raw.rescheduleCutoffHours != null ? Number(raw.rescheduleCutoffHours) : 1
    };
    const res = await window.store.manageMeetingRoomAdmin({ action: 'update_policy', policyData });
    if (res && res.success) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ Booking policies updated!', 'success');
      this.render();
    }
  },

  async handleApproveRejectBooking(roomId, bookingId, action) {
    const res = await window.store.manageMeetingRoomAdmin({ action, roomId, bookingId });
    if (res && res.success) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`✅ ${res.message}`, 'success');
      this.render();
    }
  },

  // ── Admin: Maintenance Block Methods ──────────────────────────
  openMaintenanceModal(existingBlock = null) {
    const rooms = window.store ? window.store.getMeetingRooms() : [];
    const b = existingBlock || {};
    const now = new Date();
    const pad = n => (n < 10 ? '0' : '') + n;
    const defaultStart = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T09:00`;
    const defaultEnd   = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T18:00`;
    const html = `
      <div id="modal-maintenance" style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);">
        <div style="background:var(--bg-surface);border-radius:16px;width:480px;max-width:95vw;box-shadow:0 24px 80px rgba(0,0,0,0.4);overflow:hidden;">
          <div style="padding:16px 22px;background:var(--bg-surface-elevated);border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:16px;font-weight:800;margin:0;">🔧 ${b.id ? 'Edit' : 'Schedule'} Maintenance Block</h3>
            <button type="button" onclick="MeetingRoomsModule.closeModal('modal-maintenance')" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">×</button>
          </div>
          <form onsubmit="MeetingRoomsModule.handleSaveMaintenanceBlock(event)" style="padding:20px 22px;display:flex;flex-direction:column;gap:12px;">
            <input type="hidden" name="id" value="${b.id || ''}">
            <div>
              <label class="form-label" style="font-size:11px;font-weight:700;">Room *</label>
              <select name="roomId" class="form-control" required style="font-size:12.5px;">
                ${rooms.map(r => `<option value="${r.id}" ${b.roomId === r.id ? 'selected' : ''}>${r.icon || '🏢'} ${r.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="form-label" style="font-size:11px;font-weight:700;">Reason *</label>
              <select name="reason" class="form-control" style="font-size:12.5px;">
                <option value="Preventive Maintenance" ${b.reason === 'Preventive Maintenance' ? 'selected' : ''}>Preventive Maintenance</option>
                <option value="Cleaning" ${b.reason === 'Cleaning' ? 'selected' : ''}>Cleaning</option>
                <option value="Equipment Repair" ${b.reason === 'Equipment Repair' ? 'selected' : ''}>Equipment Repair</option>
                <option value="Private Event" ${b.reason === 'Private Event' ? 'selected' : ''}>Private Event</option>
                <option value="Administrative Use" ${b.reason === 'Administrative Use' ? 'selected' : ''}>Administrative Use</option>
                <option value="Unexpected Outage" ${b.reason === 'Unexpected Outage' ? 'selected' : ''}>Unexpected Outage</option>
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label class="form-label" style="font-size:11px;font-weight:700;">Start Date & Time *</label>
                <input type="datetime-local" name="startDateTime" class="form-control" value="${b.startDateTime ? b.startDateTime.slice(0,16) : defaultStart}" required style="font-size:12px;">
              </div>
              <div>
                <label class="form-label" style="font-size:11px;font-weight:700;">End Date & Time *</label>
                <input type="datetime-local" name="endDateTime" class="form-control" value="${b.endDateTime ? b.endDateTime.slice(0,16) : defaultEnd}" required style="font-size:12px;">
              </div>
            </div>
            <div>
              <label class="form-label" style="font-size:11px;font-weight:700;">Notes (optional)</label>
              <textarea name="notes" class="form-control" rows="2" style="font-size:12px;" placeholder="Additional details...">${b.notes || ''}</textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-maintenance')" style="font-size:12px;">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="font-size:12px;font-weight:800;">🔧 ${b.id ? 'Update Block' : 'Create Block'}</button>
            </div>
          </form>
        </div>
      </div>
    `;
    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = html;
  },

  async handleSaveMaintenanceBlock(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const raw = Object.fromEntries(fd.entries());
    const maintenanceData = {
      id: raw.id || undefined,
      roomId: raw.roomId,
      reason: raw.reason,
      startDateTime: raw.startDateTime,
      endDateTime: raw.endDateTime,
      notes: raw.notes || '',
      status: 'scheduled'
    };
    const isEdit = Boolean(raw.id);
    const res = await window.store.manageMaintenance({ action: isEdit ? 'edit' : 'add', maintenanceData });
    this.closeModal('modal-maintenance');
    if (res && res.success) {
      const conflictMsg = res.conflictingBookings && res.conflictingBookings.length > 0
        ? ` ⚠️ ${res.conflictingBookings.length} existing booking(s) may be affected.`
        : '';
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`🔧 ${res.message}${conflictMsg}`, 'success');
      this.render();
    } else if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`⚠️ ${res ? res.message : 'Could not save maintenance block'}`, 'danger');
    }
  },

  async handleDeleteMaintenanceBlock(maintenanceId) {
    if (!confirm('Remove this maintenance block?')) return;
    const res = await window.store.manageMaintenance({ action: 'delete', maintenanceId });
    if (res && res.success) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast('✅ Maintenance block removed.', 'info');
      this.render();
    }
  },

  // ── Admin: All Reservations Table ─────────────────────────────
  renderAdminReservationsTable(rooms) {
    const all = [];
    (rooms || []).forEach(r => {
      (r.bookings || []).forEach(b => {
        all.push({ ...b, roomId: r.id, roomName: r.name, roomIcon: r.icon || '🏢' });
      });
    });
    all.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.startTime > a.startTime ? 1 : -1));
    const displayed = all.slice(0, 50);

    if (!displayed.length) {
      return `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12.5px;">No reservations found.</div>`;
    }

    const statusColor = s => {
      if (s === 'Confirmed') return '#16a34a';
      if (s === 'Cancelled' || s === 'Rejected') return '#dc2626';
      if (s === 'Pending Approval') return '#7c3aed';
      if (s === 'Completed') return '#0369a1';
      return '#64748b';
    };

    return `
      <table class="nexus-table" style="width:100%;font-size:12px;margin:0;">
        <thead>
          <tr>
            <th>Booking ID</th><th>Startup</th><th>Room</th><th>Date</th>
            <th>Time</th><th>Duration</th><th>Attendees</th><th>Purpose</th>
            <th>Status</th><th>Cost</th><th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${displayed.map(b => `
            <tr>
              <td style="font-family:var(--font-mono);font-size:11px;font-weight:700;">${b.id}</td>
              <td style="font-weight:700;">${b.startupName || '—'}</td>
              <td>${b.roomIcon} ${b.roomName}</td>
              <td style="font-size:11.5px;">${b.date}</td>
              <td style="font-family:var(--font-mono);font-size:11px;">${b.startTime}–${b.endTime}</td>
              <td style="font-size:11.5px;">${b.duration ? Number(b.duration).toFixed(1)+'h' : '—'}</td>
              <td style="font-size:11.5px;">${b.attendees || '—'}</td>
              <td style="font-size:11px;color:var(--text-secondary);max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${b.purpose || b.title || ''}">${b.purpose || b.title || '—'}</td>
              <td><span style="display:inline-block;padding:2px 7px;border-radius:6px;font-size:10.5px;font-weight:800;background:${statusColor(b.status)}1a;color:${statusColor(b.status)};">${b.status || 'Unknown'}</span></td>
              <td style="font-family:var(--font-mono);font-size:11px;">${b.cost > 0 ? '₹'+b.cost : '—'}</td>
              <td style="text-align:right;white-space:nowrap;">
                ${(b.status === 'Pending Approval') ? `
                  <button type="button" class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.handleApproveRejectBooking('${b.roomId}','${b.id}','approve_booking')" style="font-size:10px;padding:2px 7px;background:#16a34a;margin-right:4px;">✓</button>
                  <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.handleApproveRejectBooking('${b.roomId}','${b.id}','reject_booking')" style="font-size:10px;padding:2px 7px;color:#dc2626;">✗</button>
                ` : (b.status !== 'Cancelled' && b.status !== 'Completed') ? `
                  <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cancelBooking('${b.roomId}','${b.id}')" style="font-size:10px;padding:2px 7px;color:#dc2626;">Cancel</button>
                ` : '—'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${all.length > 50 ? `<div style="padding:10px 16px;font-size:11.5px;color:var(--text-muted);border-top:1px solid var(--border-subtle);">Showing 50 of ${all.length} reservations. Use Export CSV to download all.</div>` : ''}
    `;
  },

  async refreshAdminReservations() {
    const statusEl = document.getElementById('admin-res-filter-status');
    const roomEl   = document.getElementById('admin-res-filter-room');
    const fromEl   = document.getElementById('admin-res-filter-from');
    const toEl     = document.getElementById('admin-res-filter-to');
    const body     = document.getElementById('admin-reservations-table-body');
    if (!body) return;

    body.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">Loading...</div>';

    const params = {
      status:   statusEl ? statusEl.value : '',
      roomId:   roomEl   ? roomEl.value   : '',
      dateFrom: fromEl   ? fromEl.value   : '',
      dateTo:   toEl     ? toEl.value     : ''
    };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

    const res = await window.store.getAdminReservations(params);
    if (!res || !res.ok) {
      body.innerHTML = '<div style="padding:20px;text-align:center;color:#dc2626;font-size:12px;">Failed to load reservations.</div>';
      return;
    }

    // Build table from filtered results
    const reservations = res.reservations || [];
    if (!reservations.length) {
      body.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12.5px;">No reservations match the selected filters.</div>';
      return;
    }
    const statusColor = s => {
      if (s === 'Confirmed') return '#16a34a';
      if (s === 'Cancelled' || s === 'Rejected') return '#dc2626';
      if (s === 'Pending Approval') return '#7c3aed';
      if (s === 'Completed') return '#0369a1';
      return '#64748b';
    };
    body.innerHTML = `
      <table class="nexus-table" style="width:100%;font-size:12px;margin:0;">
        <thead>
          <tr><th>Booking ID</th><th>Startup</th><th>Room</th><th>Date</th><th>Time</th><th>Dur.</th><th>Pax</th><th>Purpose</th><th>Status</th><th>Cost</th><th style="text-align:right;">Actions</th></tr>
        </thead>
        <tbody>
          ${reservations.map(b => `
            <tr>
              <td style="font-family:var(--font-mono);font-size:11px;font-weight:700;">${b.id}</td>
              <td style="font-weight:700;">${b.startupName || '—'}</td>
              <td>${b.roomIcon || '🏢'} ${b.roomName || b.roomId}</td>
              <td style="font-size:11.5px;">${b.date}</td>
              <td style="font-family:var(--font-mono);font-size:11px;">${b.startTime}–${b.endTime}</td>
              <td style="font-size:11.5px;">${b.duration ? Number(b.duration).toFixed(1)+'h' : '—'}</td>
              <td style="font-size:11.5px;">${b.attendees || '—'}</td>
              <td style="font-size:11px;color:var(--text-secondary);max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.purpose || b.title || '—'}</td>
              <td><span style="display:inline-block;padding:2px 7px;border-radius:6px;font-size:10.5px;font-weight:800;background:${statusColor(b.status)}1a;color:${statusColor(b.status)};">${b.status || '—'}</span></td>
              <td style="font-family:var(--font-mono);font-size:11px;">${b.cost > 0 ? '₹'+b.cost : '—'}</td>
              <td style="text-align:right;white-space:nowrap;">
                ${(b.status === 'Pending Approval') ? `
                  <button class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.handleApproveRejectBooking('${b.roomId}','${b.id}','approve_booking')" style="font-size:10px;padding:2px 7px;background:#16a34a;margin-right:3px;">✓</button>
                  <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.handleApproveRejectBooking('${b.roomId}','${b.id}','reject_booking')" style="font-size:10px;padding:2px 7px;color:#dc2626;">✗</button>
                ` : (b.status !== 'Cancelled' && b.status !== 'Completed') ? `
                  <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cancelBooking('${b.roomId}','${b.id}')" style="font-size:10px;padding:2px 7px;color:#dc2626;">Cancel</button>
                ` : '—'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${res.total > res.limit ? `<div style="padding:10px 16px;font-size:11.5px;color:var(--text-muted);border-top:1px solid var(--border-subtle);">Showing ${reservations.length} of ${res.total} results. Use Export CSV for full data.</div>` : ''}
    `;
  },

  exportReservationsCSV() {
    const statusEl = document.getElementById('admin-res-filter-status');
    const roomEl   = document.getElementById('admin-res-filter-room');
    const fromEl   = document.getElementById('admin-res-filter-from');
    const toEl     = document.getElementById('admin-res-filter-to');
    const params = new URLSearchParams({ userRole: (window.store && window.store.currentRole) || 'super_admin' });
    if (statusEl && statusEl.value) params.set('status', statusEl.value);
    if (roomEl && roomEl.value) params.set('roomId', roomEl.value);
    if (fromEl && fromEl.value) params.set('dateFrom', fromEl.value);
    if (toEl && toEl.value) params.set('dateTo', toEl.value);
    const url = `/api/meeting-rooms/export-csv?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-reservations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof App !== 'undefined' && App.showToast) App.showToast('⬇️ CSV export started!', 'success');
  },

  async handleCancelRecurringSeries(seriesId, roomId) {
    const res = await window.store.cancelRecurringSeries(seriesId, roomId);
    if (res && res.success) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`✅ ${res.message}`, 'info');
      this.render();
    } else if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`⚠️ ${res ? res.message : 'Could not cancel recurring series'}`, 'warning');
    }
  },

  async syncBookingWithProvider(roomId, bookingId, provider = 'google', action = 'sync') {
    const myStartup = this.getMyStartup();
    const res = await window.store.syncExternalCalendar({
      action,
      provider,
      startupId: myStartup.id,
      roomId,
      bookingId
    });
    if (res && res.ok) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`📅 ${res.message}`, 'success');
    } else if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`⚠️ ${res ? res.message : 'Calendar sync failed'}`, 'warning');
    }
    this.render();
    const detailsModal = document.getElementById('modal-reservation-details');
    if (detailsModal) {
      this.openReservationDetailsModal(roomId, bookingId);
    }
    return res;
  },

  setDate(date) {
    if (!date) return;
    this.selectedDate = date;
    this.render();
  },

  cycleDate(deltaDays) {
    const base = this.selectedDate || this.getISTNow().todayStr;
    const parts = base.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + deltaDays);
    const pad = n => (n < 10 ? '0' : '') + n;
    this.selectedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    this.render();
  },

  cycleCalendarRange(dir) {
    const step = Number(dir) >= 0 ? 1 : -1;
    if (this.schedulerViewMode === 'week') {
      this.cycleDate(step * 7);
    } else if (this.schedulerViewMode === 'month') {
      const base = this.selectedDate || this.getISTNow().todayStr;
      const parts = base.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1 + step, Math.min(parts[2] || 1, 28));
      const pad = n => (n < 10 ? '0' : '') + n;
      this.selectedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      this.render();
    } else {
      this.cycleDate(step);
    }
  },

  renderCalendarLoadingSkeleton() {
    return `
      <div class="card" style="padding: 20px; margin-bottom: 24px; border: 1px solid var(--border-subtle); border-radius: 16px; background: var(--bg-surface);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="width: 220px; height: 22px; border-radius: 6px; background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 200% 100%; animation: pulse 1.2s infinite;"></div>
          <div style="width: 140px; height: 22px; border-radius: 6px; background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);"></div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          ${[1, 2, 3, 4, 5, 6, 7, 8].map(() => `
            <div style="height: 84px; border-radius: 12px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 12px;">
              <div style="width: 65%; height: 12px; border-radius: 4px; background: #cbd5e1; margin-bottom: 10px; opacity: 0.5;"></div>
              <div style="width: 45%; height: 10px; border-radius: 4px; background: #cbd5e1; opacity: 0.35;"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  getVisualSlotStatus(room, dateStr, startStr, endStr, myStartup) {
    const bookingStartISO = `${dateStr}T${startStr}:00`;
    const bookingEndISO = `${dateStr}T${endStr}:00`;
    const blocks = (typeof window !== 'undefined' && window.store && window.store.getMaintenanceBlocks) ? window.store.getMaintenanceBlocks() : [];
    const timedBlock = blocks.find(b => {
      if (b.roomId !== room.id || b.status === 'cancelled') return false;
      const bStart = b.startDateTime ? (b.startDateTime.length === 16 ? b.startDateTime + ':00' : b.startDateTime) : '';
      const bEnd = b.endDateTime ? (b.endDateTime.length === 16 ? b.endDateTime + ':00' : b.endDateTime) : '';
      return (bStart < bookingEndISO && bEnd > bookingStartISO);
    });

    if (this.isRoomUnderMaintenance(room) || timedBlock) {
      return {
        key: 'maintenance',
        label: timedBlock ? `Maint: ${timedBlock.reason}` : 'Maintenance',
        bg: 'rgba(249, 115, 22, 0.14)',
        border: 'rgba(249, 115, 22, 0.45)',
        color: '#c2410c',
        dot: '#f97316',
        booking: null
      };
    }

    const ist = this.getISTNow();
    const isPastDay = dateStr < ist.todayStr;
    const isToday = dateStr === ist.todayStr;
    const sMin = this.parseTimeToMinutes(startStr);
    const eMin = this.parseTimeToMinutes(endStr);
    const bookings = (room.bookings || []).filter(b => b.date === dateStr && b.status !== 'Cancelled');
    const overlapping = bookings.find(b => {
      return this.parseTimeToMinutes(b.startTime) < eMin && this.parseTimeToMinutes(b.endTime) > sMin;
    });

    if (overlapping) {
      if (overlapping.status === 'Pending' || overlapping.status === 'Pending Approval') {
        return {
          key: 'pending',
          label: 'Pending Approval',
          bg: 'rgba(147, 51, 234, 0.14)',
          border: 'rgba(147, 51, 234, 0.45)',
          color: '#7e22ce',
          dot: '#9333ea',
          booking: overlapping
        };
      }
      const isMine = myStartup && (overlapping.startupId === myStartup.id || (overlapping.startupName && overlapping.startupName.toLowerCase() === myStartup.name.toLowerCase()));
      if (isMine) {
        return {
          key: 'mine',
          label: overlapping.title || 'My Reservation',
          bg: 'rgba(37, 99, 235, 0.14)',
          border: 'rgba(37, 99, 235, 0.45)',
          color: '#1d4ed8',
          dot: '#2563eb',
          booking: overlapping
        };
      }
      return {
        key: 'occupied',
        label: overlapping.startupName || 'Booked',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.4)',
        color: '#b91c1c',
        dot: '#ef4444',
        booking: overlapping
      };
    }

    if (isPastDay || (isToday && eMin <= ist.totalMinutes)) {
      return {
        key: 'past',
        label: 'Past / Closed',
        bg: 'rgba(148, 163, 184, 0.14)',
        border: 'rgba(148, 163, 184, 0.35)',
        color: '#64748b',
        dot: '#94a3b8',
        booking: null
      };
    }

    return {
      key: 'available',
      label: 'Available',
      bg: 'rgba(34, 197, 94, 0.12)',
      border: 'rgba(34, 197, 94, 0.4)',
      color: '#15803d',
      dot: '#22c55e',
      booking: null
    };
  },

  renderDayCalendarView(filteredRooms, myStartup) {
    const ist = this.getISTNow();
    const morningHalfSlots = [
      { start: '08:00', end: '08:30', label: '08:00 AM' },
      { start: '08:30', end: '09:00', label: '08:30 AM' },
      { start: '09:00', end: '09:30', label: '09:00 AM' },
      { start: '09:30', end: '10:00', label: '09:30 AM' },
      { start: '10:00', end: '10:30', label: '10:00 AM' },
      { start: '10:30', end: '11:00', label: '10:30 AM' },
      { start: '11:00', end: '11:30', label: '11:00 AM' },
      { start: '11:30', end: '12:00', label: '11:30 AM' },
      { start: '12:00', end: '12:30', label: '12:00 PM' },
      { start: '12:30', end: '13:00', label: '12:30 PM' }
    ];
    const afternoonHalfSlots = [
      { start: '13:00', end: '13:30', label: '01:00 PM' },
      { start: '13:30', end: '14:00', label: '01:30 PM' },
      { start: '14:00', end: '14:30', label: '02:00 PM' },
      { start: '14:30', end: '15:00', label: '02:30 PM' },
      { start: '15:00', end: '15:30', label: '03:00 PM' },
      { start: '15:30', end: '16:00', label: '03:30 PM' },
      { start: '16:00', end: '16:30', label: '04:00 PM' },
      { start: '16:30', end: '17:00', label: '04:30 PM' },
      { start: '17:00', end: '17:30', label: '05:00 PM' },
      { start: '17:30', end: '18:00', label: '05:30 PM' },
      { start: '18:00', end: '18:30', label: '06:00 PM' },
      { start: '18:30', end: '19:00', label: '06:30 PM' },
      { start: '19:00', end: '19:30', label: '07:00 PM' },
      { start: '19:30', end: '20:00', label: '07:30 PM' }
    ];

    const slotsToShow = this.filterSession === 'morning'
      ? morningHalfSlots
      : this.filterSession === 'afternoon'
        ? afternoonHalfSlots
        : [...morningHalfSlots, ...afternoonHalfSlots];

    return `
      <div class="nexus-cal-card">
        <!-- Day View Card Header -->
        <div class="nexus-cal-header">
          <div>
            <h3 class="nexus-cal-title">
              <span>📅 Interactive Day Timeline Calendar</span>
              <span class="badge badge-primary" style="font-size: 12px; font-weight: 700; padding: 3px 10px;">${this.selectedDate}</span>
            </h3>
            <p class="nexus-cal-subtitle">
              Granular timeline across all meeting rooms. Click any green slot to book immediately, or click a booked slot to manage.
            </p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cycleDate(-1)" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 12px;">‹ Prev Day</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setDate('${ist.todayStr}')" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 14px; background: #eef2ff; color: #4338ca; border-color: #c7d2fe;">Today</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cycleDate(1)" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 12px;">Next Day ›</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.openBookModal()" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 14px; margin-left: 4px;">
              + Custom Booking
            </button>
          </div>
        </div>

        <!-- Day Legend Bar -->
        <div class="nexus-cal-legend">
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot mine"></span> Your Reservation</span>
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot available"></span> Available Slot (Click to Book)</span>
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot other"></span> Reserved by Others</span>
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot past"></span> Past Time</span>
        </div>

        <!-- Day Timeline Table -->
        <div style="overflow-x: auto;">
          <table class="nexus-cal-table nexus-cal-day-table">
            <thead>
              <tr>
                <th class="col-room">Meeting Space</th>
                ${slotsToShow.map(s => `
                  <th class="day-slot-header">
                    <div style="font-size: 11px; font-weight: 800; color: var(--text-primary);">${s.start}</div>
                    <div style="font-size: 9px; color: var(--text-muted); font-weight: 600;">30m</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredRooms.map(room => {
                const roomSt = this.computeRoomStatus(room, this.selectedDate);
                return `
                  <tr>
                    <!-- Sticky Room Column (Fixed 250px) -->
                    <td class="col-room">
                      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                          <span style="font-size: 20px; flex-shrink: 0;">${room.icon || '🏢'}</span>
                          <div style="min-width: 0;">
                            <div style="font-weight: 800; font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${room.name}">
                              ${room.name}
                            </div>
                            <div style="font-size: 10.5px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; margin-top: 1px;">
                              <span>👥 ${room.capacity} Pax</span>
                              <span>•</span>
                              <span style="font-weight: 700; color: #4f46e5;">₹${room.hourlyRate}/hr</span>
                            </div>
                          </div>
                        </div>
                        <span class="badge" style="font-size: 9px; font-weight: 700; padding: 2px 6px; flex-shrink: 0; background: ${roomSt.status === 'Available Now' ? 'rgba(34,197,94,0.14)' : roomSt.status === 'Under Maintenance' ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.14)'}; color: ${roomSt.status === 'Available Now' ? '#15803d' : roomSt.status === 'Under Maintenance' ? '#c2410c' : '#475569'};">
                          ${roomSt.status}
                        </span>
                      </div>
                    </td>

                    <!-- Timeline Slot Cells -->
                    ${slotsToShow.map(s => {
                      const st = this.getVisualSlotStatus(room, this.selectedDate, s.start, s.end, myStartup);
                      if (st.key === 'available') {
                        return `
                          <td onclick="MeetingRoomsModule.openBookModal('${room.id}', '${s.start}', '${myStartup.id}', '${s.end}')"
                              class="cal-day-cell cal-day-open"
                              title="Click to book ${room.name} (${s.start} – ${s.end})">
                            <div class="cal-day-open-content">
                              <span class="cal-dot-green"></span>
                              <span class="cal-day-open-btn">+ Book</span>
                            </div>
                          </td>
                        `;
                      }
                      if (st.key === 'mine' && st.booking) {
                        return `
                          <td onclick="MeetingRoomsModule.openReservationDetailsModal('${room.id}', '${st.booking.id}')"
                              class="cal-day-cell cal-day-mine"
                              title="Reserved by ${myStartup.name}: ${st.booking.title || 'Session'} (${st.booking.startTime}–${st.booking.endTime}) — Click for details">
                            <div class="cal-day-mine-content">
                              <span class="cal-day-mine-badge">🔵 Mine</span>
                              <span class="cal-day-mine-title">${st.booking.title || 'Session'}</span>
                            </div>
                          </td>
                        `;
                      }
                      if (st.key === 'occupied' && st.booking) {
                        return `
                          <td class="cal-day-cell cal-day-occupied" title="Booked by ${st.booking.startupName} (${st.booking.startTime}–${st.booking.endTime})">
                            <div class="cal-day-occ-content">
                              <span>🔒</span>
                            </div>
                          </td>
                        `;
                      }
                      if (st.key === 'maintenance') {
                        return `
                          <td class="cal-day-cell" style="background: rgba(249, 115, 22, 0.08); color: #c2410c; font-size: 10px; font-weight: 700;" title="${room.name} is Under Maintenance">
                            <span>🟠</span>
                          </td>
                        `;
                      }
                      if (st.key === 'pending') {
                        return `
                          <td class="cal-day-cell" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce; font-size: 10px; font-weight: 700;" title="Pending Approval">
                            <span>🟣</span>
                          </td>
                        `;
                      }
                      return `
                        <td class="cal-day-cell cal-day-past" title="Time elapsed (${s.start} – ${s.end})">
                          <div class="cal-day-past-content">
                            <span>—</span>
                          </div>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderWeekCalendarView(filteredRooms, myStartup) {
    const ist = this.getISTNow();
    const parts = (this.selectedDate || ist.todayStr).split('-').map(Number);
    const anchorDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = anchorDate.getDay(); // 0 = Sun
    const weekStart = new Date(anchorDate);
    weekStart.setDate(anchorDate.getDate() - dayOfWeek);

    const pad = n => (n < 10 ? '0' : '') + n;
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      weekDays.push({
        dateStr: dStr,
        shortDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dStr === ist.todayStr,
        isSelected: dStr === this.selectedDate,
        isPast: dStr < ist.todayStr
      });
    }

    const weekRangeLabel = `${weekDays[0].monthShort} ${weekDays[0].dayNum} – ${weekDays[6].monthShort} ${weekDays[6].dayNum}, ${weekStart.getFullYear()}`;

    return `
      <div class="nexus-cal-card">
        <!-- Calendar Card Header & Navigation -->
        <div class="nexus-cal-header">
          <div>
            <h3 class="nexus-cal-title">
              <span>📆 7-Day Weekly Availability &amp; Reservations</span>
              <span class="badge badge-primary" style="font-size: 11.5px; font-weight: 700; padding: 3px 9px;">${weekRangeLabel}</span>
            </h3>
            <p class="nexus-cal-subtitle">
              Click any open room cell to instantly book that space, or click a reservation pill to manage.
            </p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cycleDate(-7)" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 12px;">‹ Prev Week</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setDate('${ist.todayStr}')" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 14px; background: #eef2ff; color: #4338ca; border-color: #c7d2fe;">Today</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cycleDate(7)" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 12px;">Next Week ›</button>
          </div>
        </div>

        <!-- Clean Status Legend Bar -->
        <div class="nexus-cal-legend">
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot mine"></span> Your Team's Booking</span>
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot available"></span> Available Slot (Click cell to book)</span>
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot other"></span> Reserved by Others</span>
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot past"></span> Past Date</span>
        </div>

        <!-- Weekly Interactive Grid -->
        <div style="overflow-x: auto;">
          <table class="nexus-cal-table">
            <thead>
              <tr>
                <th class="col-room">Meeting Room Space</th>
                ${weekDays.map(wd => `
                  <th onclick="MeetingRoomsModule.setDate('${wd.dateStr}')"
                      class="day-header ${wd.isToday ? 'today' : ''}"
                      title="Click to focus on ${wd.shortDay}, ${wd.dayNum} ${wd.monthShort}">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                      <span style="font-size: 11.5px; font-weight: 800; color: ${wd.isToday ? '#4f46e5' : wd.isSelected ? '#2563eb' : 'var(--text-muted)'}; text-transform: uppercase; letter-spacing: 0.04em;">${wd.shortDay}</span>
                      ${wd.isToday ? '<span style="font-size: 9px; font-weight: 800; background: #4f46e5; color: #fff; padding: 1.5px 5px; border-radius: 4px;">TODAY</span>' : ''}
                    </div>
                    <div style="font-size: 14.5px; font-weight: 800; color: ${wd.isToday ? '#1e1b4b' : 'var(--text-primary)'}; margin-top: 2px;">
                      ${wd.dayNum} ${wd.monthShort}
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredRooms.map(room => {
                const isMaint = this.isRoomUnderMaintenance(room);
                return `
                  <tr>
                    <!-- Sticky Room Header Column -->
                    <td class="col-room">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 22px; flex-shrink: 0;">${room.icon || '🏢'}</span>
                        <div style="min-width: 0;">
                          <div style="font-weight: 800; font-size: 13.5px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${room.name}">
                            ${room.name}
                          </div>
                          <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                            <span>👥 ${room.capacity} Pax</span>
                            <span>•</span>
                            <span style="font-weight: 700; color: #4f46e5;">₹${room.hourlyRate}/hr</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- 7 Days Grid Cells -->
                    ${weekDays.map(wd => {
                      if (isMaint) {
                        return `
                          <td style="background: rgba(249, 115, 22, 0.05); text-align: center; vertical-align: middle; color: #c2410c; font-size: 11px; font-weight: 700;">
                            🟠 Maintenance
                          </td>
                        `;
                      }

                      const st = this.computeRoomStatus(room, wd.dateStr);
                      const dayBookings = (room.bookings || []).filter(b => b.date === wd.dateStr && b.status !== 'Cancelled');
                      const myDayBookings = dayBookings.filter(b => b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
                      const otherDayBookings = dayBookings.length - myDayBookings.length;

                      if (wd.isPast) {
                        return `
                          <td class="cal-cell-past" onclick="MeetingRoomsModule.setDate('${wd.dateStr}')" title="Past date — ${dayBookings.length} session(s) completed">
                            <div style="display: flex; flex-direction: column; justify-content: center; height: 100%; text-align: center;">
                              ${dayBookings.length > 0 ? `
                                <span style="font-size: 10.5px; font-weight: 700; color: #94a3b8;">✓ ${dayBookings.length} completed</span>
                              ` : `
                                <span style="font-size: 11px; color: #cbd5e1;">—</span>
                              `}
                            </div>
                          </td>
                        `;
                      }

                      return `
                        <td class="cal-cell-available"
                            onclick="MeetingRoomsModule.setDate('${wd.dateStr}'); MeetingRoomsModule.openBookModal('${room.id}', null, '${myStartup.id}')"
                            title="Click to reserve ${room.name} on ${wd.shortDay}, ${wd.dayNum} ${wd.monthShort}">
                          ${(myDayBookings.length === 0 && otherDayBookings === 0) ? `
                            <!-- Pristine Minimal Open Cell (Prompt on Hover Only) -->
                            <div class="cal-open-cell-inner">
                              <div class="cal-open-hover-hint">
                                <span style="font-size: 13px; line-height: 1;">+</span>
                                <span>Reserve Slot</span>
                              </div>
                            </div>
                          ` : `
                            <!-- Day with Active Bookings -->
                            <div style="display: flex; flex-direction: column; gap: 4px; height: 100%;">
                              <!-- User's Active Bookings (Rendered as Sleek Event Cards) -->
                              ${myDayBookings.map(mb => {
                                let displayTitle = mb.title || 'Team Session';
                                displayTitle = displayTitle.replace(new RegExp(`\\s+in\\s+${room.name}`, 'i'), '').trim();
                                if (!displayTitle) displayTitle = 'Team Session';
                                return `
                                  <div onclick="event.stopPropagation(); MeetingRoomsModule.openReservationDetailsModal('${room.id}', '${mb.id}')"
                                       class="cal-event-card mine"
                                       title="Your Booking: ${mb.startTime}–${mb.endTime} • ${displayTitle} (Click to view or reschedule)">
                                    <div class="cal-event-time">⏰ ${mb.startTime} – ${mb.endTime}</div>
                                    <div class="cal-event-title">${displayTitle}</div>
                                  </div>
                                `;
                              }).join('')}

                              <!-- Other Bookings -->
                              ${otherDayBookings > 0 ? `
                                <div class="cal-event-card other" title="${otherDayBookings} slot(s) reserved by other members">
                                  <span>🔒 ${otherDayBookings} Reserved</span>
                                </div>
                              ` : ''}

                              <!-- Remaining Availability Pill if still slots open -->
                              ${st.availableSlotsCount > 0 ? `
                                <div class="cal-slot-avail-mini" title="${st.availableSlotsCount} slots still available on this day">
                                  <span class="cal-dot-green"></span>
                                  <span>+ ${st.availableSlotsCount} open</span>
                                </div>
                              ` : ''}
                            </div>
                          `}
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderMonthCalendarView(filteredRooms, myStartup) {
    const ist = this.getISTNow();
    const selParts = (this.selectedDate || ist.todayStr).split('-').map(Number);
    const year = selParts[0];
    const month = selParts[1] - 1;
    const pad = n => (n < 10 ? '0' : '') + n;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthLabel = `${monthNames[month]} ${year}`;
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const bookingsByDate = {};
    filteredRooms.forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.status !== 'Cancelled') {
          if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
          bookingsByDate[b.date].push({ ...b, roomId: r.id, roomName: r.name });
        }
      });
    });

    let cellsHtml = '';
    for (let i = 0; i < firstDayIndex; i++) {
      cellsHtml += `<div style="background: rgba(0,0,0,0.02); min-height: 88px; border-radius: 10px; border: 1px dashed var(--border-subtle); opacity: 0.35;"></div>`;
    }

    const activeBookableRooms = filteredRooms.filter(r => !this.isRoomUnderMaintenance(r));
    const maxSlotsPerDay = Math.max(0, activeBookableRooms.length * 7);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const isToday = dateStr === ist.todayStr;
      const isPast = dateStr < ist.todayStr;
      const isSelected = dateStr === this.selectedDate;
      const dayBookings = bookingsByDate[dateStr] || [];
      const myCount = dayBookings.filter(b => b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase())).length;
      const otherCount = dayBookings.length - myCount;
      const openCount = Math.max(0, maxSlotsPerDay - dayBookings.length);

      cellsHtml += `
        <div onclick="MeetingRoomsModule.setDate('${dateStr}'); MeetingRoomsModule.setSchedulerViewMode('day')"
             title="Click to view detailed hourly &amp; 30-min availability for ${dateStr}"
             style="background: ${isSelected ? 'rgba(37, 99, 235, 0.08)' : isToday ? 'rgba(34, 197, 94, 0.06)' : isPast ? 'rgba(148, 163, 184, 0.1)' : 'var(--bg-surface)'};
                    border: ${isSelected ? '2px solid #2563eb' : isToday ? '2px solid #22c55e' : '1px solid var(--border-subtle)'};
                    border-radius: 10px; padding: 8px 10px; min-height: 88px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; opacity: ${isPast ? '0.7' : '1'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 800; color: ${isSelected ? '#2563eb' : isToday ? '#15803d' : 'var(--text-primary)'};">${day}</span>
            ${isToday ? `<span class="badge badge-success" style="font-size: 9px; padding: 1px 5px;">Today</span>` : isPast ? `<span class="badge" style="font-size: 9px; padding: 1px 5px; background: #e2e8f0; color: #64748b;">Past</span>` : ''}
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 4px;">
            ${myCount > 0 ? `<span style="font-size: 9.5px; font-weight: 700; color: #1d4ed8; background: rgba(37, 99, 235, 0.14); padding: 1px 5px; border-radius: 4px;">🔵 ${myCount} My Booking${myCount > 1 ? 's' : ''}</span>` : ''}
            ${otherCount > 0 ? `<span style="font-size: 9.5px; font-weight: 700; color: #b91c1c; background: rgba(239, 68, 68, 0.12); padding: 1px 5px; border-radius: 4px;">🔴 ${otherCount} Booked</span>` : ''}
            ${!isPast && openCount > 0 ? `<span style="font-size: 9.5px; font-weight: 700; color: #15803d; background: rgba(34, 197, 94, 0.12); padding: 1px 5px; border-radius: 4px;">🟢 ${openCount} Open</span>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="nexus-cal-card">
        <!-- Month Card Header -->
        <div class="nexus-cal-header">
          <div>
            <h3 class="nexus-cal-title">
              <span>🗓️ Monthly Booking Activity — ${currentMonthLabel}</span>
            </h3>
            <p class="nexus-cal-subtitle">Select any date to inspect detailed slot availability or reserve a room.</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cycleCalendarRange(-1)" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 12px;">‹ Prev Month</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setDate('${ist.todayStr}')" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 14px; background: #eef2ff; color: #4338ca; border-color: #c7d2fe;">Today</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.cycleCalendarRange(1)" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 12px;">Next Month ›</button>
          </div>
        </div>

        <!-- Month Legend -->
        <div class="nexus-cal-legend">
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot mine"></span> Your Reservation</span>
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot available"></span> Open Slots</span>
          <span class="nexus-cal-legend-item"><span class="nexus-cal-legend-dot other"></span> Reserved</span>
        </div>

        <!-- Month Grid -->
        <div style="padding: 18px 20px;">
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px; text-align: center;">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">${d}</div>`).join('')}
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
            ${cellsHtml}
          </div>
        </div>
      </div>
    `;
  },

  renderRoomComparisonView(filteredRooms, myStartup) {
    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));

    return `
      <div class="nexus-cal-card">
        <div class="nexus-cal-header">
          <div>
            <h3 class="nexus-cal-title">
              <span>⚖️ Side-by-Side Meeting Room Comparison (${this.selectedDate})</span>
            </h3>
            <p class="nexus-cal-subtitle">
              Compare capacity, hourly rate, included amenities, next available slot, and real-time room status.
            </p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.setSchedulerViewMode('cards')" style="font-size: 12px; font-weight: 700; border-radius: 8px; padding: 6px 14px;">
            🎴 Back to Room Cards
          </button>
        </div>

        <div class="table-wrapper" style="overflow-x: auto;">
          <table class="nexus-table" style="width: 100%; margin: 0; font-size: 12.5px;">
            <thead>
              <tr>
                <th style="min-width: 200px;">Room Name</th>
                <th style="min-width: 110px; text-align: center;">Capacity</th>
                <th style="min-width: 140px;">Hourly Price</th>
                <th style="min-width: 240px;">Included Amenities</th>
                <th style="min-width: 170px;">Next Available Time</th>
                <th style="min-width: 150px;">Current Status</th>
                <th style="min-width: 140px; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRooms.map(room => {
                const st = this.computeRoomStatus(room, this.selectedDate);
                const nextSlot = this.getNextAvailableSlotForRoom(room, this.selectedDate);
                const isMaint = this.isRoomUnderMaintenance(room);
                const canBook = !isMaint && nextSlot.available;

                let statusBadgeStyle = 'background: rgba(34, 197, 94, 0.14); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.35);';
                if (st.status === 'Under Maintenance') {
                  statusBadgeStyle = 'background: rgba(249, 115, 22, 0.15); color: #c2410c; border: 1px solid rgba(249, 115, 22, 0.4);';
                } else if (st.status === 'Fully Booked') {
                  statusBadgeStyle = 'background: rgba(239, 68, 68, 0.14); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.35);';
                } else if (st.status === 'Closed for Today') {
                  statusBadgeStyle = 'background: rgba(148, 163, 184, 0.16); color: #475569; border: 1px solid rgba(148, 163, 184, 0.35);';
                } else if (st.status === 'Available Later Today') {
                  statusBadgeStyle = 'background: rgba(59, 130, 246, 0.14); color: #1d4ed8; border: 1px solid rgba(59, 130, 246, 0.35);';
                }

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 22px; width: 38px; height: 38px; border-radius: 10px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center;">
                          ${room.icon || '🏢'}
                        </span>
                        <div>
                          <div style="font-weight: 800; font-size: 13.5px; color: var(--text-primary);">${room.name}</div>
                          <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${room.id} • ${st.availableSlotsCount} of 7 slots open</div>
                        </div>
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge badge-info" style="font-size: 11.5px; font-weight: 800; padding: 4px 10px;">
                        👥 ${room.capacity} Pax
                      </span>
                    </td>
                    <td>
                      <div style="font-weight: 800; font-size: 13.5px; color: var(--text-primary); font-family: var(--font-mono);">
                        ₹${(room.hourlyRate || 0).toLocaleString('en-IN')}/hr
                      </div>
                      <div style="font-size: 10.5px; color: ${remainingCredits > 0 ? '#16a34a' : 'var(--text-muted)'}; font-weight: 700;">
                        ${remainingCredits > 0 ? `✓ Plan Credits Eligible (${remainingCredits}h free)` : 'Standard Hourly Billing'}
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${(room.amenities || ['4K Display', 'High-Speed WiFi', 'Whiteboard']).map(am => `
                          <span style="font-size: 10.5px; font-weight: 600; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 2px 8px; border-radius: 999px; color: var(--text-secondary);">
                            ${am}
                          </span>
                        `).join('')}
                      </div>
                    </td>
                    <td>
                      ${nextSlot.available ? `
                        <div style="font-family: var(--font-mono); font-weight: 800; font-size: 12px; color: #15803d;">
                          ⏰ ${nextSlot.label}
                        </div>
                        <div style="font-size: 10.5px; color: var(--text-muted);">
                          ${nextSlot.startTime} – ${nextSlot.endTime}
                        </div>
                      ` : `
                        <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">
                          ${nextSlot.label}
                        </span>
                      `}
                    </td>
                    <td>
                      <span class="badge" style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; ${statusBadgeStyle}">
                        ● ${st.status}
                      </span>
                    </td>
                    <td style="text-align: center;">
                      ${canBook ? `
                        <button type="button" class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.setDate('${nextSlot.date}'); MeetingRoomsModule.openBookModal('${room.id}', '${nextSlot.startTime}', '${myStartup.id}', '${nextSlot.endTime}')" style="background: #16a34a; border-color: #15803d; font-weight: 800; font-size: 11.5px; padding: 6px 14px; border-radius: 8px; white-space: nowrap;">
                          ⚡ Book Now
                        </button>
                      ` : `
                        <button type="button" class="btn btn-outline btn-sm" disabled style="font-size: 11px; padding: 6px 12px; border-radius: 8px; opacity: 0.55; cursor: not-allowed;">
                          ${isMaint ? '🔧 Maintenance' : 'Unavailable'}
                        </button>
                      `}
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
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (this.isRoomUnderMaintenance(room)) {
      App.showToast('⚠️ This room is currently Under Maintenance and cannot be booked.', 'warning');
      return;
    }

    const ist = this.getISTNow();
    const todayStr = ist.dateStr;
    const liveTimeStr = ist.timeStr;
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
    if (!this.selectedCustomWindowByRoom) this.selectedCustomWindowByRoom = {};
    if (!this.selectedDurationByRoom) this.selectedDurationByRoom = {};

    // Clear custom partial window if user clicks a full-hour slot
    delete this.selectedCustomWindowByRoom[roomId];

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
    if (this.selectedSlotsByRoom[roomId].length === 1 && !this.selectedDurationByRoom[roomId]) {
      this.selectedDurationByRoom[roomId] = 60;
    } else if (this.selectedSlotsByRoom[roomId].length > 1) {
      this.selectedDurationByRoom[roomId] = this.selectedSlotsByRoom[roomId].length * 60;
    }
    this.render();
  },

  selectPartialSlot(roomId, startTime, endTime) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (this.isRoomUnderMaintenance(room)) {
      App.showToast('⚠️ This room is currently Under Maintenance and cannot be booked.', 'warning');
      return;
    }

    const ist = this.getISTNow();
    const isPastDate = (this.selectedDate < ist.dateStr);
    const isToday = (this.selectedDate === ist.dateStr);
    if (isPastDate || (isToday && endTime <= ist.timeStr)) {
      App.showToast('This session time has already passed and cannot be booked.', 'warning');
      return;
    }

    if (!this.selectedSlotsByRoom) this.selectedSlotsByRoom = {};
    if (!this.selectedCustomWindowByRoom) this.selectedCustomWindowByRoom = {};
    if (!this.selectedDurationByRoom) this.selectedDurationByRoom = {};

    const curCustom = this.selectedCustomWindowByRoom[roomId];
    if (curCustom && curCustom.startTime === startTime && curCustom.endTime === endTime) {
      delete this.selectedCustomWindowByRoom[roomId];
      delete this.selectedSlotsByRoom[roomId];
      delete this.selectedDurationByRoom[roomId];
    } else {
      this.selectedCustomWindowByRoom[roomId] = { startTime, endTime };
      this.selectedSlotsByRoom[roomId] = [startTime];
      this.selectedDurationByRoom[roomId] = 30;
    }
    this.render();
  },

  setInlineSlotDuration(roomId, durationMins, customStart = null, customEnd = null) {
    if (!this.selectedDurationByRoom) this.selectedDurationByRoom = {};
    if (!this.selectedCustomWindowByRoom) this.selectedCustomWindowByRoom = {};
    this.selectedDurationByRoom[roomId] = durationMins;
    if (customStart && customEnd) {
      this.selectedCustomWindowByRoom[roomId] = { startTime: customStart, endTime: customEnd };
    } else if (durationMins === 60) {
      delete this.selectedCustomWindowByRoom[roomId];
    }
    this.render();
  },

  clearSlotSelection(roomId) {
    if (this.selectedSlotsByRoom && this.selectedSlotsByRoom[roomId]) {
      delete this.selectedSlotsByRoom[roomId];
    }
    if (this.selectedCustomWindowByRoom && this.selectedCustomWindowByRoom[roomId]) {
      delete this.selectedCustomWindowByRoom[roomId];
    }
    if (this.selectedDurationByRoom && this.selectedDurationByRoom[roomId]) {
      delete this.selectedDurationByRoom[roomId];
    }
    this.render();
  },

  getSelectedWindowForRoom(roomId) {
    const slots = (this.selectedSlotsByRoom && this.selectedSlotsByRoom[roomId]) ? [...this.selectedSlotsByRoom[roomId]].sort() : [];
    if (!slots.length) return null;

    const custom = this.selectedCustomWindowByRoom && this.selectedCustomWindowByRoom[roomId];
    if (custom && custom.startTime && custom.endTime) {
      const durHours = this.calculateBookingDuration(custom.startTime, custom.endTime);
      return {
        startTime: custom.startTime,
        endTime: custom.endTime,
        durationHours: durHours,
        durationMins: Math.round(durHours * 60),
        slotCount: slots.length
      };
    }

    const startSlot = slots[0];
    const prefMins = (this.selectedDurationByRoom && this.selectedDurationByRoom[roomId]) || (slots.length * 60);
    const [sh, sm] = startSlot.split(':').map(Number);
    const totalEnd = sh * 60 + (sm || 0) + prefMins;
    const pad = n => (n < 10 ? '0' : '') + n;
    const endH = Math.floor(totalEnd / 60);
    const endM = totalEnd % 60;
    const endSlotStr = `${pad(endH)}:${pad(endM)}`;
    const durHours = prefMins / 60;

    return {
      startTime: startSlot,
      endTime: endSlotStr,
      durationHours: durHours,
      durationMins: prefMins,
      slotCount: slots.length
    };
  },

  renderStickyBookingBar(rooms, myStartup) {
    if (!this.selectedSlotsByRoom) return '';
    const roomId = Object.keys(this.selectedSlotsByRoom).find(id => this.selectedSlotsByRoom[id] && this.selectedSlotsByRoom[id].length > 0);
    if (!roomId) return '';

    const room = rooms.find(r => r.id === roomId);
    if (!room) return '';

    const win = this.getSelectedWindowForRoom(roomId);
    if (!win) return '';

    const formatSlot12h = (slot24) => {
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const generate12hTimeOptions = (selectedVal) => {
      const times = [];
      for (let h = 8; h <= 21; h++) {
        for (let m = 0; m < 60; m += 30) {
          if (h === 21 && m > 0) break;
          const val24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const dispH = ((h + 11) % 12) + 1;
          const label12 = `${String(dispH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
          times.push({ val: val24, label: label12 });
        }
      }
      if (selectedVal && !times.some(t => t.val === selectedVal)) {
        const [sh, sm] = selectedVal.split(':').map(Number);
        const ampm = sh >= 12 ? 'PM' : 'AM';
        const dispH = ((sh + 11) % 12) + 1;
        const label12 = `${String(dispH).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')} ${ampm}`;
        times.push({ val: selectedVal, label: label12 });
        times.sort((a, b) => a.val.localeCompare(b.val));
      }
      return times.map(t => `<option value="${t.val}" ${t.val === selectedVal ? 'selected' : ''}>${t.label}</option>`).join('');
    };

    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
    const isCovered = remainingCredits >= win.durationHours;
    const totalCost = Math.round(room.hourlyRate * win.durationHours);
    const costText = isCovered ? 'Covered by Plan (₹0)' : `₹${totalCost.toLocaleString('en-IN')}`;
    const durLabel = win.durationMins === 30 ? '30 min' : `${win.durationHours} hr${win.durationHours > 1 ? 's' : ''}`;

    return `
      <div id="sticky-booking-bar" class="sticky-booking-bar">
        <div class="sticky-booking-info">
          <div class="sticky-room-badge">
            <span>${room.icon || '🏢'}</span>
            <strong>${room.name}</strong>
          </div>
          <div class="sticky-details">
            <strong>${durLabel}</strong>
            <span style="color: var(--text-muted);">·</span>
            <span style="font-family: var(--font-mono); font-weight: 800; color: #2563eb;">${formatSlot12h(win.startTime)} to ${formatSlot12h(win.endTime)}</span>
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
    if (this.isRoomUnderMaintenance(room)) {
      App.showToast('⚠️ This room is currently Under Maintenance and cannot be booked.', 'warning');
      return;
    }

    const morningSlots = ['08:00', '09:00', '10:00'];
    const afternoonSlots = ['15:00', '16:00', '17:00', '18:00'];
    const allSlots = [...morningSlots, ...afternoonSlots];

    const ist = this.getISTNow();
    const todayStr = ist.dateStr;
    const liveTimeStr = ist.timeStr;
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
      const sMin = sHour * 60;
      const endHour = sHour + 1;
      const eMin = endHour * 60;
      // Strictly prevent past or current started slots for today
      if (isToday && (sMin <= ist.totalMinutes || slot <= liveTimeStr)) return false;
      const isBooked = bookings.some(b => {
        const [bsh, bsm] = (b.startTime || '00:00').split(':').map(Number);
        const [beh, bem] = (b.endTime || '00:00').split(':').map(Number);
        return (bsh * 60 + (bsm || 0)) < eMin && (beh * 60 + (bem || 0)) > sMin;
      });
      return !isBooked;
    });

    if (!nextSlot && isToday) {
      const dParts = todayStr.split('-').map(Number);
      const tomorrowObj = new Date(dParts[0], dParts[1] - 1, dParts[2] + 1);
      const pad = n => (n < 10 ? '0' : '') + n;
      const tomorrowStr = `${tomorrowObj.getFullYear()}-${pad(tomorrowObj.getMonth() + 1)}-${pad(tomorrowObj.getDate())}`;
      const tomorrowBookings = (room.bookings || []).filter(b => b.date === tomorrowStr && b.status !== 'Cancelled');
      nextSlot = allSlots.find(slot => {
        const sHour = parseInt(slot.split(':')[0], 10);
        const sMin = sHour * 60;
        const eMin = (sHour + 1) * 60;
        return !tomorrowBookings.some(b => {
          const [bsh, bsm] = (b.startTime || '00:00').split(':').map(Number);
          const [beh, bem] = (b.endTime || '00:00').split(':').map(Number);
          return (bsh * 60 + (bsm || 0)) < eMin && (beh * 60 + (bem || 0)) > sMin;
        });
      });
      if (nextSlot) {
        this.selectedDate = tomorrowStr;
        App.showToast(`Today's slots have passed. Switched to tomorrow (${tomorrowStr}) for ${room.name}.`, 'info');
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
    if (this.isRoomUnderMaintenance(room)) {
      App.showToast('⚠️ This room is currently Under Maintenance and cannot be booked.', 'warning');
      return;
    }

    const win = this.getSelectedWindowForRoom(roomId);
    if (!win) {
      App.showToast('Please select at least one open time slot first.', 'warning');
      return;
    }

    const ist = this.getISTNow ? this.getISTNow() : { dateStr: new Date().toISOString().split('T')[0], totalMinutes: new Date().getHours() * 60 + new Date().getMinutes(), liveTimeStr: '12:00' };
    const isToday = (this.selectedDate === ist.dateStr);

    let startSlot = win.startTime;
    let endSlotStr = win.endTime;

    // Check if the initial startSlot is in the past or booked; if so, auto-advance to next genuinely available slot
    const [initSh, initSm] = (startSlot || '00:00').split(':').map(Number);
    const initStartMin = (initSh || 0) * 60 + (initSm || 0);
    const isStartPast = isToday && (initStartMin <= ist.totalMinutes);
    const roomBookings = (room.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled' && b.status !== 'Rejected');
    const isStartBooked = roomBookings.some(b => {
      const [bsh, bsm] = (b.startTime || '00:00').split(':').map(Number);
      const [beh, bem] = (b.endTime || '00:00').split(':').map(Number);
      return (bsh * 60 + (bsm || 0)) <= initStartMin && (beh * 60 + (bem || 0)) > initStartMin;
    });

    if (isStartPast || isStartBooked) {
      const candidateStarts = [];
      for (let h = 8; h <= 20; h++) {
        for (let m = 0; m < 60; m += 30) {
          candidateStarts.push(h * 60 + m);
        }
      }
      const durMins = win.durationMins || 60;
      const validStartMin = candidateStarts.find(sMin => {
        if (isToday && sMin <= ist.totalMinutes) return false;
        const eMin = sMin + durMins;
        return !roomBookings.some(b => {
          const [bsh, bsm] = (b.startTime || '00:00').split(':').map(Number);
          const [beh, bem] = (b.endTime || '00:00').split(':').map(Number);
          return (bsh * 60 + (bsm || 0)) < eMin && (beh * 60 + (bem || 0)) > sMin;
        });
      });

      if (validStartMin !== undefined) {
        const pad = n => (n < 10 ? '0' : '') + n;
        const newStart = `${pad(Math.floor(validStartMin / 60))}:${pad(validStartMin % 60)}`;
        const validEndMin = validStartMin + durMins;
        const newEnd = `${pad(Math.floor(validEndMin / 60))}:${pad(validEndMin % 60)}`;
        startSlot = newStart;
        endSlotStr = newEnd;
        if (!this.selectedSlotsByRoom) this.selectedSlotsByRoom = {};
        this.selectedSlotsByRoom[roomId] = [newStart];
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(`Prior slot was unavailable. Automatically moved to the next open slot (${newStart}).`, 'info');
        }
      }
    }

    const count = win.durationHours;
    const durText = win.durationMins === 30 ? '30 min' : `${count} hr${count > 1 ? 's' : ''}`;

    const formatSlot12h = (slot24) => {
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const generate12hTimeOptions = (selectedVal, isStartTime = true) => {
      const times = [];
      for (let h = 8; h <= 21; h++) {
        for (let m = 0; m < 60; m += 30) {
          if (h === 21 && m > 0) break;
          const val24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const dispH = ((h + 11) % 12) + 1;
          const label12 = `${String(dispH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
          const slotMin = h * 60 + m;

          let status = 'available';
          let statusText = '';
          if (isToday && (isStartTime ? slotMin <= ist.totalMinutes : slotMin <= ist.totalMinutes + 15)) {
            status = 'past';
            statusText = ' (Unavailable / Past)';
          } else if (isStartTime && roomBookings.some(b => {
            const [bsh, bsm] = (b.startTime || '00:00').split(':').map(Number);
            const [beh, bem] = (b.endTime || '00:00').split(':').map(Number);
            return slotMin >= (bsh * 60 + (bsm || 0)) && slotMin < (beh * 60 + (bem || 0));
          })) {
            status = 'booked';
            statusText = ' (Unavailable / Booked)';
          }

          times.push({ val: val24, label: label12, status, statusText });
        }
      }

      if (selectedVal && !times.some(t => t.val === selectedVal)) {
        const [sh, sm] = selectedVal.split(':').map(Number);
        const ampm = sh >= 12 ? 'PM' : 'AM';
        const dispH = ((sh + 11) % 12) + 1;
        const label12 = `${String(dispH).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')} ${ampm}`;
        const slotMin = sh * 60 + (sm || 0);
        let status = 'available';
        let statusText = '';
        if (isToday && slotMin <= ist.totalMinutes) {
          status = 'past';
          statusText = ' (Unavailable / Past)';
        }
        times.push({ val: selectedVal, label: label12, status, statusText });
        times.sort((a, b) => a.val.localeCompare(b.val));
      }

      return times.map(t => {
        const isSelected = t.val === selectedVal;
        const isDisabled = t.status === 'past' || t.status === 'booked';
        const color = t.status === 'past' ? '#9ca3af' : t.status === 'booked' ? '#ef4444' : '#111827';
        const bg = t.status === 'past' ? '#f3f4f6' : t.status === 'booked' ? '#fee2e2' : '#ffffff';
        return `<option value="${t.val}" ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} style="color: ${color}; background: ${bg}; font-weight: ${isDisabled ? '500' : '700'};">
          ${t.label}${t.statusText}
        </option>`;
      }).join('');
    };

    const myStartup = this.getMyStartup();
    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
    const isCovered = remainingCredits >= count;
    const totalCost = Math.round(room.hourlyRate * count);
    const payableAmount = isCovered ? 0 : Math.round(Math.max(0, count - remainingCredits) * room.hourlyRate);

    const dParts = this.selectedDate.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const formattedDate = `${dayName}, ${dayNum} ${monthName}`;

    const availableAmenities = ['4K Display / Projector', 'Video Conferencing', 'Whiteboard & Markers', 'High-Speed Wi-Fi', 'Speakerphone', 'Tea / Coffee Service'];

    const modalHtml = `
      <div class="modal-overlay active" id="modal-confirm-booking" onclick="if(event.target===this) MeetingRoomsModule.closeModal('modal-confirm-booking')" style="z-index: 1050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); padding: 16px;">
        <div class="modal-content" style="max-width: 560px; width: 100%; max-height: min(92vh, 720px); border-radius: 18px; background: var(--bg-surface); color: var(--text-primary); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-xl); animation: scaleUp 0.2s ease;">
          
          <div class="modal-header" style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🔒</span>
              <div>
                <h3 style="font-size: 15px; font-weight: 800; margin: 0; color: var(--text-primary);">Confirm Room Reservation</h3>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">Step 2 of 2: Review details, pricing &amp; finalize booking</div>
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
                    ${isCovered ? 'Covered by Plan (₹0)' : `₹${payableAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                  <span>📅 <strong>${formattedDate}</strong></span>
                  <span style="font-size: 11px; color: var(--text-muted);">🏢 Startup: <strong>${myStartup.name}</strong></span>
                </div>

                <!-- Interactive Time Window Selection -->
                <div style="background: var(--bg-surface); border: 1.5px solid var(--border-medium); border-radius: 10px; padding: 10px 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent-primary, #2563eb); margin: 0; display: flex; align-items: center; gap: 5px;">
                      <span>⏰</span> Change Booking Time <span style="color: #ef4444;">*</span>
                    </label>
                    <span id="confirm-duration-label" style="font-size: 11.5px; font-family: var(--font-mono); font-weight: 800; color: #16a34a;">
                      ${durText}
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
                      <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 3px; display: block;">Start Time (12-Hour AM/PM)</label>
                      <select id="confirm-start-time" class="form-control" onchange="MeetingRoomsModule.updateConfirmModalTiming('${room.id}')" style="font-size: 12.5px; font-weight: 700; padding: 7px 10px; border-radius: 8px; background: #ffffff; border: 1.5px solid var(--border-medium); cursor: pointer;" required>
                        ${generate12hTimeOptions(startSlot, true)}
                      </select>
                    </div>
                    <div>
                      <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 3px; display: block;">End Time (12-Hour AM/PM)</label>
                      <select id="confirm-end-time" class="form-control" onchange="MeetingRoomsModule.updateConfirmModalTiming('${room.id}')" style="font-size: 12.5px; font-weight: 700; padding: 7px 10px; border-radius: 8px; background: #ffffff; border: 1.5px solid var(--border-medium); cursor: pointer;" required>
                        ${generate12hTimeOptions(endSlotStr, false)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Attendees with Capacity Validation -->
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 11.5px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <span>Number of Attendees <span class="required-star">*</span></span>
                  <span id="confirm-capacity-hint" style="font-size: 11px; font-weight: 700; color: #16a34a;">Max Capacity: ${room.capacity} Pax</span>
                </label>
                <input type="number" id="confirm-attendees" class="form-control" required min="1" max="${room.capacity}" value="${Math.min(4, room.capacity)}" oninput="MeetingRoomsModule.validateConfirmCapacity('${room.id}')" style="font-size: 12.5px; padding: 7px 12px; border-radius: 8px; font-weight: 700;">
              </div>

              <!-- Required Amenities Checkboxes -->
              <div>
                <label class="form-label" style="font-weight: 700; font-size: 11.5px; margin-bottom: 5px; display: block;">
                  Required Amenities
                </label>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${availableAmenities.map((am, idx) => `
                    <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); padding: 4px 9px; border-radius: 6px; cursor: pointer;">
                      <input type="checkbox" class="confirm-amenity-cb" value="${am}" ${idx < 2 ? 'checked' : ''} style="margin: 0; accent-color: #2563eb;">
                      <span>${am}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Special Requests -->
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 11.5px; margin-bottom: 4px;">
                  Special Requests / Setup Notes
                </label>
                <input type="text" id="confirm-special-requests" class="form-control" placeholder="e.g., HDMI adapter needed, whiteboard markers, water bottles..." style="font-size: 12px; padding: 7px 10px; border-radius: 8px;">
              </div>

              <!-- Inline Proactive Slot Availability Warning -->
              <div id="confirm-slot-warning" style="display: none; background: #fef2f2; border: 1.5px solid #ef4444; color: #b91c1c; padding: 10px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; align-items: center; gap: 8px;"></div>

              <!-- Feature 5: Pre-Finalization Confirmation Summary -->
              <div id="confirm-pricing-breakdown" style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(16, 185, 129, 0.06) 100%); border: 1.5px solid rgba(37, 99, 235, 0.25); border-radius: 10px; padding: 10px 14px; font-size: 11.5px; display: flex; flex-direction: column; gap: 4px;">
                <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #1d4ed8; letter-spacing: 0.04em; margin-bottom: 2px;">
                  📋 Reservation &amp; Cost Breakdown
                </div>
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                  <span>Hourly Rate (${room.name}):</span>
                  <strong style="font-family: var(--font-mono);">₹${room.hourlyRate.toLocaleString('en-IN')}/hr × ${count}h = ₹${totalCost.toLocaleString('en-IN')}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                  <span>Included Plan Credits (${myStartup.name}):</span>
                  <strong style="color: #16a34a;">${remainingCredits}h available</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-medium); padding-top: 4px; margin-top: 2px; font-size: 12px;">
                  <span style="font-weight: 800; color: var(--text-primary);">Additional Amount Payable:</span>
                  <strong id="confirm-payable-amount" style="font-family: var(--font-mono); font-weight: 800; color: ${isCovered ? '#16a34a' : '#2563eb'};">
                    ${isCovered ? '₹0 (Covered by Plan Credits)' : `₹${payableAmount.toLocaleString('en-IN')}`}
                  </strong>
                </div>
              </div>
            </div>

            <!-- Sticky Form Footer -->
            <div style="flex-shrink: 0; padding: 12px 20px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; gap: 10px; justify-content: flex-end; align-items: center;">
              <button type="button" class="btn btn-outline" onclick="MeetingRoomsModule.closeModal('modal-confirm-booking')" style="padding: 8px 14px; border-radius: 8px; font-size: 12px;">
                Cancel
              </button>
              <button type="submit" id="btn-confirm-booking-submit" class="btn btn-primary" style="background: #16a34a; border-color: #15803d; font-weight: 800; font-size: 12.5px; padding: 8px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);">
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

  validateConfirmCapacity(roomId) {
    const room = window.store.getMeetingRoomById(roomId);
    const attendeesEl = document.getElementById('confirm-attendees');
    const hintEl = document.getElementById('confirm-capacity-hint');
    const submitBtn = document.getElementById('btn-confirm-booking-submit');
    if (!room || !attendeesEl) return true;
    const val = parseInt(attendeesEl.value, 10) || 0;
    if (val > room.capacity) {
      if (hintEl) {
        hintEl.textContent = `⚠️ Exceeds max capacity of ${room.capacity} Pax!`;
        hintEl.style.color = '#dc2626';
      }
      if (submitBtn) submitBtn.disabled = true;
      return false;
    } else if (val < 1) {
      if (hintEl) {
        hintEl.textContent = `⚠️ Minimum 1 attendee required`;
        hintEl.style.color = '#dc2626';
      }
      if (submitBtn) submitBtn.disabled = true;
      return false;
    } else {
      if (hintEl) {
        hintEl.textContent = `✓ Within Capacity (${val}/${room.capacity} Pax)`;
        hintEl.style.color = '#16a34a';
      }
      if (submitBtn) submitBtn.disabled = false;
      return true;
    }
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
    const endVal = `${pad(endH)}:${pad(endM)}`;

    if (endInput.tagName === 'SELECT') {
      const exists = Array.from(endInput.options).some(opt => opt.value === endVal);
      if (!exists) {
        const ampm = endH >= 12 ? 'PM' : 'AM';
        const dispH = ((endH + 11) % 12) + 1;
        const opt = document.createElement('option');
        opt.value = endVal;
        opt.textContent = `${String(dispH).padStart(2, '0')}:${pad(endM)} ${ampm}`;
        endInput.appendChild(opt);
      }
    }
    endInput.value = endVal;
    this.updateConfirmModalTiming(roomId);
  },

  updateConfirmModalTiming(roomId) {
    const startInput = document.getElementById('confirm-start-time');
    const endInput = document.getElementById('confirm-end-time');
    const durationLabel = document.getElementById('confirm-duration-label');
    const costBadge = document.getElementById('confirm-cost-badge');
    const payableEl = document.getElementById('confirm-payable-amount');
    const warningEl = document.getElementById('confirm-slot-warning');
    const form = document.getElementById('form-confirm-booking');
    const submitBtn = document.getElementById('btn-confirm-booking-submit') || (form ? form.querySelector('button[type="submit"]') : null);
    if (!startInput || !endInput) return;

    const startVal = startInput.value;
    const endVal = endInput.value;
    if (!startVal || !endVal) return;

    const [sh, sm] = startVal.split(':').map(Number);
    const [eh, em] = endVal.split(':').map(Number);
    const sMin = sh * 60 + (sm || 0);
    const eMin = eh * 60 + (em || 0);

    const room = window.store.getMeetingRoomById(roomId);
    const ist = (this.getISTNow ? this.getISTNow() : null) || { dateStr: new Date().toISOString().split('T')[0], totalMinutes: new Date().getHours() * 60 + new Date().getMinutes(), liveTimeStr: '12:00' };
    const isToday = (this.selectedDate === ist.dateStr);

    let isSlotUnavailable = false;
    let unavailableReason = '';

    if (eMin <= sMin) {
      isSlotUnavailable = true;
      unavailableReason = 'End time must be later than start time.';
    } else if (isToday && sMin <= ist.totalMinutes) {
      isSlotUnavailable = true;
      unavailableReason = `This time slot has already passed. Current IST time is ${ist.liveTimeStr}. Please pick an open future time period.`;
    } else if (room) {
      const roomBookings = (room.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled' && b.status !== 'Rejected');
      const conflict = roomBookings.find(b => {
        const [bsh, bsm] = (b.startTime || '00:00').split(':').map(Number);
        const [beh, bem] = (b.endTime || '00:00').split(':').map(Number);
        return sMin < (beh * 60 + (bem || 0)) && eMin > (bsh * 60 + (bsm || 0));
      });
      if (conflict) {
        isSlotUnavailable = true;
        unavailableReason = `This time slot is already reserved (${conflict.startTime} - ${conflict.endTime}). Please pick another time period.`;
      }
    }

    if (warningEl) {
      if (isSlotUnavailable) {
        warningEl.style.display = 'flex';
        warningEl.innerHTML = `<span style="font-size: 16px; flex-shrink: 0;">⚠️</span><div><strong>Time Slot Unavailable:</strong> ${unavailableReason}</div>`;
      } else {
        warningEl.style.display = 'none';
      }
    }

    if (submitBtn) {
      if (isSlotUnavailable) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.title = unavailableReason;
      } else {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.title = 'Confirm your reservation';
      }
    }

    if (eMin <= sMin) {
      if (durationLabel) {
        durationLabel.textContent = 'Invalid time range';
        durationLabel.style.color = '#ef4444';
      }
      return;
    }

    const durMinutes = eMin - sMin;
    const durHours = durMinutes / 60;
    const myStartup = this.getMyStartup();
    const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
    const isCovered = remainingCredits >= durHours;
    const billableHours = Math.max(0, durHours - remainingCredits);
    const cost = isCovered ? 0 : Math.round((room ? room.hourlyRate : 1500) * billableHours);

    if (durationLabel) {
      const hPart = Math.floor(durMinutes / 60);
      const mPart = durMinutes % 60;
      let text = '';
      if (hPart > 0 && mPart > 0) text = `${hPart} hr ${mPart} min`;
      else if (hPart > 0) text = `${hPart} hr${hPart > 1 ? 's' : ''}`;
      else text = `${mPart} min`;
      durationLabel.textContent = isSlotUnavailable ? `${text} (Unavailable)` : text;
      durationLabel.style.color = isSlotUnavailable ? '#ef4444' : '#16a34a';
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

    if (payableEl) {
      payableEl.textContent = isCovered ? '₹0 (Covered by Plan Credits)' : `₹${cost.toLocaleString('en-IN')}`;
      payableEl.style.color = isCovered ? '#16a34a' : '#2563eb';
    }
  },

  async submitBookingConfirmation(event, roomId) {
    if (event) event.preventDefault();
    const form = document.getElementById('form-confirm-booking');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Confirm & Reserve Room ➔';

    const titleInput = document.getElementById('confirm-meeting-title');
    const purposeInput = document.getElementById('confirm-meeting-purpose');
    const attendeesInput = document.getElementById('confirm-attendees');
    const specialReqInput = document.getElementById('confirm-special-requests');
    const amenityCheckboxes = document.querySelectorAll('.confirm-amenity-cb:checked');

    const title = (titleInput && titleInput.value.trim()) || 'Strategic Review & Team Sprint';
    const purpose = (purposeInput && purposeInput.value.trim()) || title;
    const attendees = parseInt((attendeesInput && attendeesInput.value) || '4', 10);
    const specialRequests = (specialReqInput && specialReqInput.value.trim()) || '';
    const requestedAmenities = Array.from(amenityCheckboxes).map(cb => cb.value);

    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (room && attendees > room.capacity) {
      App.showToast(`⚠️ Attendees (${attendees}) cannot exceed ${room.name} capacity of ${room.capacity} Pax.`, 'warning');
      return;
    }

    const startTimeInput = document.getElementById('confirm-start-time');
    const endTimeInput = document.getElementById('confirm-end-time');
    let startTime = startTimeInput ? startTimeInput.value.trim() : '';
    let endTime = endTimeInput ? endTimeInput.value.trim() : '';

    if (!startTime || !endTime) {
      const win = this.getSelectedWindowForRoom(roomId);
      if (!win) return;
      startTime = win.startTime;
      endTime = win.endTime;
    }

    if (startTime >= endTime) {
      App.showToast('⚠️ End time must be later than start time', 'warning');
      return;
    }

    const myStartup = this.getMyStartup();

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
        purpose,
        date: this.selectedDate,
        startTime,
        endTime,
        attendees,
        requestedAmenities,
        specialRequests
      });

      if (res.success) {
        this.closeModal('modal-confirm-booking');
        this.clearSlotSelection(roomId);
        this.render();
        this.refreshDashboardSummary();

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
        if (res.code === 'CAPACITY_EXCEEDED') {
          App.showToast(`⚠️ ${res.message}`, 'warning');
          return;
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

    // Clean up any existing modal instance
    const existing = document.getElementById('modal-booking-success');
    if (existing) existing.remove();

    const formatSlot12h = (slot24) => {
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const generate12hTimeOptions = (selectedVal) => {
      const times = [];
      for (let h = 8; h <= 21; h++) {
        for (let m = 0; m < 60; m += 30) {
          if (h === 21 && m > 0) break;
          const val24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const dispH = ((h + 11) % 12) + 1;
          const label12 = `${String(dispH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
          times.push({ val: val24, label: label12 });
        }
      }
      if (selectedVal && !times.some(t => t.val === selectedVal)) {
        const [sh, sm] = selectedVal.split(':').map(Number);
        const ampm = sh >= 12 ? 'PM' : 'AM';
        const dispH = ((sh + 11) % 12) + 1;
        const label12 = `${String(dispH).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')} ${ampm}`;
        times.push({ val: selectedVal, label: label12 });
        times.sort((a, b) => a.val.localeCompare(b.val));
      }
      return times.map(t => `<option value="${t.val}" ${t.val === selectedVal ? 'selected' : ''}>${t.label}</option>`).join('');
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
      <div class="modal-overlay active" id="modal-booking-success" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-booking-success')" style="z-index: 100050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); padding: 16px; animation: fadeIn 0.2s ease;">
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
                ● Booked
              </span>
            </div>

            <!-- Bento Details Grid -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 9px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  🆔 Reservation ID
                </div>
                <div style="font-size: 12px; font-weight: 800; color: #2563eb; margin-top: 2px; font-family: var(--font-mono);">
                  ${booking.id || 'BKG-CONFIRMED'}
                </div>
              </div>

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
            </div>

            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">
                  💳 Billing / Plan
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #16a34a; margin-top: 2px;">
                  ${booking.cost === 0 ? 'Covered by Plan (₹0)' : `₹${booking.cost}`}
                </div>
              </div>
              <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); background: var(--bg-surface); padding: 5px 12px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                👥 ${booking.attendees || 4} Pax Expected
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

    const mount = document.getElementById('modal-mount') || document.body;
    mount.insertAdjacentHTML('beforeend', html);
  },

  openRescheduleModal(roomId, bookingId) {
    this.openEditTimeWindowModal(roomId, bookingId);
  },

  openEditTimeWindowModal(roomId, bookingId) {
    this.closeModal('modal-booking-success');
    this.closeModal('modal-room-door-pass');
    this.closeModal('modal-reservation-details');
    this.closeModal('modal-edit-time-window');
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) {
      App.showToast('Reservation not found', 'warning');
      return;
    }

    const myStartup = this.getMyStartup();
    const userRole = (window.store && window.store.currentUserRole) || 'admin';
    if (userRole !== 'admin' && booking.startupId && booking.startupId !== myStartup.id) {
      App.showToast('⚠️ You only have permission to edit or reschedule your own startup reservations.', 'warning');
      return;
    }

    if (this.isBookingCompleted(booking)) {
      App.showToast('⚠️ Completed meetings cannot be edited or rescheduled.', 'warning');
      return;
    }

    const [sh, sm] = (booking.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (booking.endTime || '09:00').split(':').map(Number);
    const curMin = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));

    // Convert start time to 12h
    const startPeriod = sh >= 12 ? 'PM' : 'AM';
    let startHour12 = sh % 12;
    if (startHour12 === 0) startHour12 = 12;
    const startMin = sm || 0;

    this.editTimeState = {
      originalRoomId: roomId,
      roomId,
      bookingId,
      date: booking.date,
      startHour12,
      startMin,
      startPeriod,
      endTime: booking.endTime || '09:00',
      attendees: booking.attendees || 4,
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

    const availableAmenities = ['4K Display / Projector', 'Video Conferencing', 'Whiteboard & Markers', 'High-Speed Wi-Fi', 'Speakerphone', 'Tea / Coffee Service'];
    const currentAmenities = Array.isArray(booking.requestedAmenities)
      ? booking.requestedAmenities
      : (booking.requestedAmenities ? String(booking.requestedAmenities).split(',').map(s => s.trim()) : ['4K Display / Projector', 'Video Conferencing']);

    const html = `
      <div class="modal-overlay active" id="modal-edit-time-window" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-edit-time-window')" style="z-index: 1070; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); padding: 16px; animation: fadeIn 0.2s ease;">
        <div class="modal-content" style="max-width: 560px; width: 100%; max-height: min(92vh, 740px); border-radius: 20px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px -12px rgba(0,0,0,0.4); animation: scaleUp 0.22s ease;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; padding: 16px 20px; position: relative; flex-shrink: 0;">
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-edit-time-window')" style="position: absolute; right: 14px; top: 14px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
            <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd; font-weight: 700;">
              🔄 Edit &amp; Reschedule Reservation • Ref: ${booking.id}
            </div>
            <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 3px 0 0 0;">
              Modify or Reschedule Meeting
            </h2>
            <div style="font-size: 12px; color: #bfdbfe; margin-top: 2px; font-weight: 500;">
              Update room, date, time window, attendees, or meeting details in-place.
            </div>
          </div>

          <form id="form-edit-time-window" onsubmit="MeetingRoomsModule.submitEditTimeWindow(event, '${room.id}', '${booking.id}')" style="margin: 0; display: flex; flex-direction: column; flex: 1; overflow: hidden;">
            <div style="padding: 16px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px;">
              
              <!-- Room, Date & Attendees Selection Row -->
              <div style="display: grid; grid-template-columns: 1.3fr 1fr 90px; gap: 10px;">
                <div>
                  <label style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">
                    🏢 Meeting Room <span style="color: #ef4444;">*</span>
                  </label>
                  <select id="edit-room-id" class="form-control" onchange="MeetingRoomsModule.onEditRoomOrDateChange()" style="font-size: 12px; font-weight: 700; padding: 7px 10px; border-radius: 8px;">
                    ${rooms.filter(r => !this.isRoomUnderMaintenance(r) || r.id === room.id).map(r => `
                      <option value="${r.id}" ${r.id === room.id ? 'selected' : ''}>
                        ${r.icon || '🏢'} ${r.name} (${r.capacity} Pax • ₹${r.hourlyRate}/hr)
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">
                    📅 Meeting Date <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="date" id="edit-booking-date" class="form-control" value="${booking.date}" onchange="MeetingRoomsModule.onEditRoomOrDateChange()" style="font-size: 12px; font-weight: 700; padding: 6px 10px; border-radius: 8px;" required>
                </div>
                <div>
                  <label style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">
                    👥 Pax <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="number" id="edit-attendees" class="form-control" min="1" max="${room.capacity}" value="${booking.attendees || 4}" oninput="MeetingRoomsModule.syncEditModalUI(false)" required style="font-size: 12px; font-weight: 700; padding: 6px 8px; border-radius: 8px; text-align: center;">
                </div>
              </div>

              <!-- Presets: 30 min, 45 min, 1 hr, 90 min, 2 hr, 3 hr -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                  <label style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">
                    Quick Duration Presets
                  </label>
                  <span id="edit-cost-badge" class="badge ${booking.cost === 0 ? 'badge-success' : 'badge-primary'}" style="font-size: 10.5px; font-weight: 800;">
                    ${booking.cost === 0 ? 'Covered by Plan (₹0)' : `₹${booking.cost}`}
                  </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;">
                  ${presets.map(p => `
                    <button type="button" 
                      id="edit-preset-${p.m}" 
                      class="btn ${curMin === p.m ? 'btn-primary' : 'btn-outline'}" 
                      onclick="MeetingRoomsModule.setEditPresetDuration(${p.m})" 
                      style="height: 36px; font-size: 11px; padding: 0; border-radius: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; ${curMin === p.m ? 'background: #2563eb; color: #ffffff; border-color: #1d4ed8; box-shadow: 0 3px 10px rgba(37,99,235,0.3);' : ''}">
                      ${p.label}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Start Time & End Time -->
              <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-medium); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
                
                <!-- Start Time -->
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
                      Start Time
                    </label>
                    <span id="edit-start-preview" style="font-size: 12px; font-weight: 800; color: #2563eb; font-family: var(--font-mono);">
                      ${this.formatTime12h(booking.startTime)}
                    </span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 96px; gap: 8px;">
                    <!-- Hour 1 to 12 only -->
                    <div>
                      <select id="edit-start-hour" class="form-control" onchange="MeetingRoomsModule.onEditStartHourChange(this.value)" style="height: 40px; font-size: 14px; font-weight: 700; border-radius: 8px; padding: 0 10px; cursor: pointer; text-align: center;" title="Start Hour">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => `
                          <option value="${h}" ${startHour12 === h ? 'selected' : ''}>${h}</option>
                        `).join('')}
                      </select>
                    </div>

                    <!-- Minutes 00, 15, 30, 45 only -->
                    <div>
                      <select id="edit-start-min" class="form-control" onchange="MeetingRoomsModule.onEditStartMinChange(this.value)" style="height: 40px; font-size: 14px; font-weight: 700; border-radius: 8px; padding: 0 10px; cursor: pointer; text-align: center;" title="Start Minute">
                        ${[0, 15, 30, 45].map(m => {
                          const pad = (m < 10 ? '0' : '') + m;
                          return `<option value="${m}" ${startMin === m ? 'selected' : ''}>:${pad}</option>`;
                        }).join('')}
                      </select>
                    </div>

                    <!-- AM / PM Switch -->
                    <div style="display: flex; height: 40px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); border-radius: 8px; padding: 3px; gap: 3px;">
                      <button type="button" id="btn-period-am" onclick="MeetingRoomsModule.onEditStartPeriodChange('AM')" style="flex: 1; height: 100%; border: none; border-radius: 6px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s ease; ${startPeriod === 'AM' ? 'background: #2563eb; color: #fff; box-shadow: 0 2px 6px rgba(37,99,235,0.35);' : 'background: transparent; color: var(--text-secondary);'}">
                        AM
                      </button>
                      <button type="button" id="btn-period-pm" onclick="MeetingRoomsModule.onEditStartPeriodChange('PM')" style="flex: 1; height: 100%; border: none; border-radius: 6px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s ease; ${startPeriod === 'PM' ? 'background: #2563eb; color: #fff; box-shadow: 0 2px 6px rgba(37,99,235,0.35);' : 'background: transparent; color: var(--text-secondary);'}">
                        PM
                      </button>
                    </div>
                  </div>
                </div>

                <!-- End Time Dropdown -->
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
                      End Time (15-min intervals)
                    </label>
                    <span id="edit-end-preview" style="font-size: 12px; font-weight: 800; color: #16a34a; font-family: var(--font-mono);">
                      ${this.formatTime12h(booking.endTime)}
                    </span>
                  </div>

                  <select id="edit-end-time-select" class="form-control" onchange="MeetingRoomsModule.onEditEndTimeChange(this.value)" style="height: 40px; font-size: 13.5px; font-weight: 700; border-radius: 8px; padding: 0 12px; width: 100%; cursor: pointer;">
                  </select>
                </div>
              </div>

              <!-- Amenities & Special Requests -->
              <div>
                <label style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">
                  Required Amenities &amp; Special Requests
                </label>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px;">
                  ${availableAmenities.map(am => `
                    <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600; background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); padding: 3px 8px; border-radius: 6px; cursor: pointer;">
                      <input type="checkbox" class="edit-amenity-cb" value="${am}" ${currentAmenities.includes(am) ? 'checked' : ''} style="margin: 0; accent-color: #2563eb;">
                      <span>${am}</span>
                    </label>
                  `).join('')}
                </div>
                <input type="text" id="edit-special-requests" class="form-control" value="${(booking.specialRequests || '').replace(/"/g, '&quot;')}" placeholder="Special setup notes or requests..." style="font-size: 11.5px; padding: 6px 10px; border-radius: 8px;">
              </div>

              <!-- Hidden inputs -->
              <input type="hidden" id="edit-start-time" value="${booking.startTime}">
              <input type="hidden" id="edit-end-time" value="${booking.endTime}">

              <!-- Summary Line -->
              <div>
                <div id="edit-summary-line" style="font-size: 13px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 9px 14px; border-radius: 10px;">
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
            <div style="flex-shrink: 0; padding: 12px 20px; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-edit-time-window')" style="height: 40px; padding: 0 18px; border-radius: 10px; font-size: 12.5px; font-weight: 700;">
                Cancel
              </button>
              <button type="submit" id="btn-submit-edit-time" class="btn btn-primary btn-sm" style="height: 40px; font-weight: 800; padding: 0 22px; border-radius: 10px; font-size: 13px; background: #2563eb; border-color: #1d4ed8; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                ✓ Save Changes &amp; Reschedule
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

  onEditRoomOrDateChange() {
    if (!this.editTimeState) return;
    const roomSelect = document.getElementById('edit-room-id');
    const dateInput = document.getElementById('edit-booking-date');
    if (roomSelect && roomSelect.value) {
      this.editTimeState.roomId = roomSelect.value;
    }
    if (dateInput && dateInput.value) {
      this.editTimeState.date = dateInput.value;
    }
    this.syncEditModalUI(false);
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
    return this.formatTimeTo12Hour(timeStr);
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
    if (!validationError && st.date < ist.date) {
      validationError = 'Cannot reschedule a reservation to a past date.';
    } else if (!validationError && st.date === ist.date && startMins <= ist.minutes) {
      validationError = 'This start time has already passed for today. Please select an upcoming slot.';
    }

    // Validate capacity against selected target room
    const targetRoom = window.store.getMeetingRoomById(st.roomId);
    const attendeesInput = document.getElementById('edit-attendees');
    if (targetRoom && attendeesInput) {
      attendeesInput.max = targetRoom.capacity;
      const attVal = parseInt(attendeesInput.value, 10) || 1;
      if (!validationError && attVal > targetRoom.capacity) {
        validationError = `Attendee count (${attVal} Pax) exceeds ${targetRoom.name} capacity of ${targetRoom.capacity} Pax.`;
      }
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
    const roomSelect = document.getElementById('edit-room-id');
    const dateInput = document.getElementById('edit-booking-date');
    const titleInput = document.getElementById('edit-booking-title');
    const purposeInput = document.getElementById('edit-booking-purpose');
    const attendeesInput = document.getElementById('edit-attendees');
    const specialReqInput = document.getElementById('edit-special-requests');
    const amenityCheckboxes = document.querySelectorAll('.edit-amenity-cb:checked');

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

    const newRoomId = (roomSelect && roomSelect.value) ? roomSelect.value : roomId;
    const newDate = (dateInput && dateInput.value) ? dateInput.value : booking.date;
    const title = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : booking.title;
    const purpose = (purposeInput && purposeInput.value.trim()) ? purposeInput.value.trim() : (booking.purpose || title);
    const attendees = attendeesInput ? parseInt(attendeesInput.value, 10) : booking.attendees;
    const specialRequests = specialReqInput ? specialReqInput.value.trim() : (booking.specialRequests || '');
    const requestedAmenities = amenityCheckboxes ? Array.from(amenityCheckboxes).map(cb => cb.value) : (booking.requestedAmenities || []);

    const targetRoom = window.store.getMeetingRoomById(newRoomId) || room;
    if (targetRoom && attendees > targetRoom.capacity) {
      App.showToast(`⚠️ Attendees (${attendees}) cannot exceed ${targetRoom.name} capacity of ${targetRoom.capacity} Pax.`, 'warning');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-edit-time');
    const origText = submitBtn ? submitBtn.innerHTML : '✓ Save Changes &amp; Reschedule';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Verifying &amp; Saving...';
    }

    try {
      const res = await window.store.updateBookingTimeWindow(roomId, bookingId, {
        newRoomId,
        date: newDate,
        startTime,
        endTime,
        attendees,
        title,
        purpose,
        requestedAmenities,
        specialRequests
      });

      if (res.success) {
        this.closeModal('modal-edit-time-window');
        if (newDate !== this.selectedDate) {
          this.selectedDate = newDate;
        }
        this.render();
        this.refreshDashboardSummary();
        App.showToast(`✅ Reservation updated & rescheduled (${targetRoom.name} • ${newDate} • ${startTime}–${endTime})!`, 'success');
        const updatedRoom = window.store.getMeetingRoomById(newRoomId) || targetRoom;
        const updatedBooking = res.booking || (updatedRoom.bookings || []).find(b => b.id === bookingId);
        if (updatedBooking) {
          this.showBookingSuccessModal(updatedRoom, updatedBooking, this.getMyStartup());
        }
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
        const errBox = document.getElementById('edit-time-error');
        const errText = document.getElementById('edit-time-error-text');
        if (errBox && errText) {
          errText.textContent = res.message || 'Conflict detected for the selected time window.';
          errBox.style.display = 'flex';
        }
        App.showToast(`⚠️ Cannot reschedule: ${res.message || 'Conflict detected'}`, 'danger');
      }
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
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

  setQuickTargetRoom(roomId) {
    this.quickFlowState.selectedRoomId = roomId || null;
    this.quickFlowState.selectedStartTime = null;
    this.quickFlowState.selectedEndTime = null;
    this.renderQuickSessionModal();
  },

  setQuickTitle(val) {
    this.quickFlowState.title = (val || '').trim() || 'Executive Strategy & Team Sprint';
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
          <span>💡</span> <span>Tap any available start time above to review summary &amp; book instantly.</span>
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
    const billableHours = Math.max(0, durationHours - remainingCredits);
    const cost = isCovered ? 0 : Math.round(room.hourlyRate * billableHours);
    const creditsAfter = Math.max(0, Number((remainingCredits - Math.min(remainingCredits, durationHours)).toFixed(2)));

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
              ${durationHours >= 1 ? `${durationHours} hr${durationHours > 1 ? 's' : ''}` : `${durationMins} min`} • 📅 ${this.selectedDate} • 🎟️ Startup Credits: <strong>${remainingCredits}h left</strong> (${creditsAfter}h after booking)
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-primary" onclick="MeetingRoomsModule.confirmQuickSessionBooking('${room.id}', '${selectedStartTime}', '${selectedEndTime}')" style="background: #16a34a; border-color: #15803d; font-weight: 800; font-size: 13px; padding: 8px 22px; border-radius: 8px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35); cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
          <span>✓ Confirm &amp; Book</span> <span>➔</span>
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
        this.refreshDashboardSummary();
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

    const ist = this.getISTNow();
    const pad = n => (n < 10 ? '0' : '') + n;
    const todayStr = ist.dateStr;
    const isToday = (this.selectedDate === todayStr);
    const liveTimeMin = ist.totalMinutes;

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
      const isMaintenance = this.isRoomUnderMaintenance(room);
      const bookings = (room.bookings || []).filter(b => b.date === this.selectedDate && b.status !== 'Cancelled');
      const isCapacityOk = !attendees || room.capacity >= attendees;

      // Candidate start times: 30-min steps (or 15-min if duration is custom and not multiple of 30)
      const step = (durationMins % 30 !== 0) ? 15 : 30;
      const validStarts = [];

      if (!isMaintenance && this.selectedDate >= todayStr) {
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

            <!-- Optional Room Filter & Attendees -->
            <div style="display: grid; grid-template-columns: 1fr 120px; gap: 10px;">
              <div>
                <label style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px; display: block;">
                  🏢 Preselected Room
                </label>
                <select onchange="MeetingRoomsModule.setQuickTargetRoom(this.value)" class="form-control" style="font-size: 11.5px; font-weight: 700; padding: 5px 8px; border-radius: 6px;">
                  <option value="" ${!selectedRoomId ? 'selected' : ''}>All Eligible Rooms</option>
                  ${rooms.map(r => `
                    <option value="${r.id}" ${selectedRoomId === r.id ? 'selected' : ''}>${r.icon || '🏢'} ${r.name} (${r.capacity} Pax)</option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px; display: block;">
                  👥 Pax
                </label>
                <input type="number" min="1" max="40" value="${attendees}" onchange="MeetingRoomsModule.setQuickAttendees(this.value)" class="form-control" style="font-size: 11.5px; font-weight: 700; padding: 5px 8px; border-radius: 6px; text-align: center;">
              </div>
            </div>

            <!-- Startup Plan Credits Strip -->
            <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
              <span style="color: var(--text-secondary);">🏢 Startup: <strong>${myStartup.name}</strong></span>
              <span style="color: #16a34a; font-weight: 800;">🎟️ ${Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0))}h Plan Credits Remaining</span>
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

    // Calculate intelligent real-time operating availability in Incubation Center Timezone (IST)
    const ist = this.getISTNow();
    const pad = n => (n < 10 ? '0' : '') + n;
    const liveTimeStr = ist.timeStr;
    const todayStr = ist.dateStr;
    const isToday = (this.selectedDate === todayStr);
    const isPastDay = (this.selectedDate < todayStr);

    const toMin = (t) => {
      if (!t || typeof t !== 'string') return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const roomStatusInfo = this.computeRoomStatus(room, this.selectedDate);
    const isMaintenance = this.isRoomUnderMaintenance(room);
    const myBookedHours = roomStatusInfo.myBookedSlots;
    const otherBookedHours = roomStatusInfo.otherBookedSlots;
    const totalBookedHours = roomStatusInfo.bookedSlots;
    const availableHours = roomStatusInfo.openSlots;

    const formatSlot12h = (slot24) => {
      if (!slot24) return '';
      const [h, m] = slot24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH < 10 ? '0' : ''}${displayH}:${m < 10 ? '0' : ''}${m} ${period}`;
    };

    const statusType = roomStatusInfo.statusType;
    const statusPillText = roomStatusInfo.status;

    // Formatted date string e.g. "Sunday, 25 October"
    const dParts = this.selectedDate.split('-').map(Number);
    const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = dObj.getDate();
    const monthName = dObj.toLocaleDateString('en-US', { month: 'long' });
    const formattedDateStr = `${dayName}, ${dayNum} ${monthName}`;

    // Tomorrow date string for quick switcher (based on IST today)
    const tParts = todayStr.split('-').map(Number);
    const tomorrowObj = new Date(tParts[0], tParts[1] - 1, tParts[2] + 1);
    const tomorrowStr = `${tomorrowObj.getFullYear()}-${pad(tomorrowObj.getMonth() + 1)}-${pad(tomorrowObj.getDate())}`;
    const isTomorrow = (this.selectedDate === tomorrowStr);

    // Selected slots for inline lock-in
    const selectedSlots = (this.selectedSlotsByRoom && this.selectedSlotsByRoom[room.id]) || [];
    const customWin = (this.selectedCustomWindowByRoom && this.selectedCustomWindowByRoom[room.id]) || null;

    const renderSlotCard = (slot) => {
      const curHour = parseInt(slot.split(':')[0], 10);
      const endHour = curHour + 1;
      const endSlotStr = `${endHour < 10 ? '0' : ''}${endHour}:00`;
      const halfSlotStr = `${curHour < 10 ? '0' : ''}${curHour}:30`;
      const timeRangeLabel = `${formatSlot12h(slot)} – ${formatSlot12h(endSlotStr)}`;

      if (isMaintenance) {
        return `
          <div class="clear-slot-card booked"
               title="${room.name} is currently Under Maintenance"
               aria-disabled="true"
               style="cursor: not-allowed; opacity: 0.75;">
            <div class="slot-time">${timeRangeLabel}</div>
            <div class="slot-status">🔧 Under Maintenance</div>
          </div>
        `;
      }

      const slotStartMin = curHour * 60;
      const slotMidMin = slotStartMin + 30;
      const slotEndMin = endHour * 60;

      const overlapping = bookings.filter(b => {
        const bStart = toMin(b.startTime);
        const bEnd = toMin(b.endTime);
        return bStart < slotEndMin && bEnd > slotStartMin;
      });

      const firstHalfBooking = overlapping.find(b => toMin(b.startTime) < slotMidMin && toMin(b.endTime) > slotStartMin);
      const secondHalfBooking = overlapping.find(b => toMin(b.startTime) < slotEndMin && toMin(b.endTime) > slotMidMin);

      const isPassed = isPastDay || (isToday && endSlotStr <= liveTimeStr);

      if (isPassed) {
        const booked = overlapping[0];
        if (booked) {
          const isMine = booked.startupId === myStartup.id || (booked.startupName && booked.startupName.toLowerCase() === myStartup.name.toLowerCase());
          if (isMine) {
            return `
              <div class="clear-slot-card past booked-mine" 
                   onclick="MeetingRoomsModule.openReservationDetailsModal('${room.id}', '${booked.id}')"
                   title="Past session (${formatSlot12h(booked.startTime)} – ${formatSlot12h(booked.endTime)}) • Reserved by your team • Click to view reservation details">
                <div class="slot-time">${timeRangeLabel}</div>
                <div class="slot-status">📅 Reserved by you (Past)</div>
              </div>
            `;
          } else {
            return `
              <div class="clear-slot-card past booked-other" 
                   title="Past booking (${formatSlot12h(booked.startTime)} – ${formatSlot12h(booked.endTime)}) • Reserved by ${booked.startupName || 'Another Startup'}">
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
      // Case 1: Both 30-minute halves of the hour are occupied
      if (firstHalfBooking && secondHalfBooking) {
        const primaryBooked = firstHalfBooking;
        const isMine = overlapping.some(b => b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase()));
        const myBookingObj = overlapping.find(b => b.startupId === myStartup.id || (b.startupName && b.startupName.toLowerCase() === myStartup.name.toLowerCase())) || primaryBooked;
        if (isMine) {
          return `
            <div class="clear-slot-card mine" 
                 onclick="MeetingRoomsModule.openBookingDetailsModal('${room.id}', '${myBookingObj.id}')"
                 title="Reserved by you (${formatSlot12h(myBookingObj.startTime)} – ${formatSlot12h(myBookingObj.endTime)}) • Click to view details or cancel">
              <div class="slot-time">${timeRangeLabel}</div>
              <div class="slot-status">🎟️ Booked by you</div>
            </div>
          `;
        } else {
          return `
            <div class="clear-slot-card booked" 
                 title="Booked by ${primaryBooked.startupName || 'Another Startup'} (${timeRangeLabel})"
                 tabindex="0"
                 aria-disabled="true"
                 style="cursor: not-allowed;">
              <div class="slot-time">${timeRangeLabel}</div>
              <div class="slot-status">🔒 Booked</div>
            </div>
          `;
        }
      }

      // Case 2: Partial-hour booking! Only one 30-minute half is booked, the other 30-minute half is open
      if (firstHalfBooking || secondHalfBooking) {
        const bookedHalf = firstHalfBooking || secondHalfBooking;
        const isMine = bookedHalf.startupId === myStartup.id || (bookedHalf.startupName && bookedHalf.startupName.toLowerCase() === myStartup.name.toLowerCase());
        const freeStart = firstHalfBooking ? halfSlotStr : slot;
        const freeEnd = firstHalfBooking ? endSlotStr : halfSlotStr;
        const isFreeHalfPassed = isPastDay || (isToday && freeEnd <= liveTimeStr);
        const isPartialSelected = Boolean(customWin && customWin.startTime === freeStart && customWin.endTime === freeEnd);

        const bookedBadgeHtml = isMine
          ? `<div onclick="event.stopPropagation(); MeetingRoomsModule.openBookingDetailsModal('${room.id}', '${bookedHalf.id}')" style="font-size: 10.5px; font-weight: 700; color: #2563eb; background: rgba(37, 99, 235, 0.1); border-radius: 5px; padding: 2px 6px; cursor: pointer;" title="Your 30-min booking (${bookedHalf.startTime}–${bookedHalf.endTime}) • Click for details">🎟️ ${bookedHalf.startTime}–${bookedHalf.endTime} (Yours)</div>`
          : `<div style="font-size: 10.5px; font-weight: 700; color: #dc2626; background: rgba(239, 68, 68, 0.1); border-radius: 5px; padding: 2px 6px;" title="Booked ${bookedHalf.startTime}–${bookedHalf.endTime} by ${bookedHalf.startupName || 'Another Startup'}">🔒 ${bookedHalf.startTime}–${bookedHalf.endTime} Booked</div>`;

        const freeActionHtml = isFreeHalfPassed
          ? `<div style="font-size: 10.5px; color: var(--text-muted); padding: 2px 6px;">⌛ ${freeStart}–${freeEnd} Passed</div>`
          : `<div style="font-size: 10.5px; font-weight: 800; color: ${isPartialSelected ? '#ffffff' : '#15803d'}; background: ${isPartialSelected ? '#16a34a' : 'rgba(22, 163, 74, 0.14)'}; border: 1px solid rgba(22, 163, 74, 0.4); border-radius: 5px; padding: 2px 6px;">${isPartialSelected ? '✓ Selected' : '🟢 Open 30m'}: ${freeStart}–${freeEnd}</div>`;

        return `
          <div class="clear-slot-card available ${isPartialSelected ? 'selected' : ''}"
               ${!isFreeHalfPassed ? `onclick="MeetingRoomsModule.selectPartialSlot('${room.id}', '${freeStart}', '${freeEnd}')"` : ''}
               style="${isFreeHalfPassed ? 'cursor: default; opacity: 0.75;' : ''}"
               title="Partial Hour Availability • ${bookedHalf.startTime}–${bookedHalf.endTime} is booked; ${freeStart}–${freeEnd} (30 min) is available to book">
            <div class="slot-time">${timeRangeLabel}</div>
            <div class="slot-status" style="display: flex; flex-direction: column; gap: 3px; margin-top: 3px;">
              ${firstHalfBooking ? `${bookedBadgeHtml}${freeActionHtml}` : `${freeActionHtml}${bookedBadgeHtml}`}
            </div>
          </div>
        `;
      }

      // Case 3: Entire 60-minute slot is open
      const isSelected = selectedSlots.includes(slot) && !customWin;
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
    };

    // Dynamic Lock-In Action Strip
    let lockInBarHtml = '';
    const selectedWin = this.getSelectedWindowForRoom(room.id);
    if (selectedWin) {
      const startSlot = selectedWin.startTime;
      const endSlotStr = selectedWin.endTime;
      const duration = selectedWin.durationHours;
      const durationMins = selectedWin.durationMins;
      const durText = durationMins === 30 ? '30 min' : `${duration} hr${duration > 1 ? 's' : ''}`;
      const remainingCredits = Math.max(0, (myStartup.includedMeetingHours || 12) - (myStartup.usedMeetingHours || 0));
      const isCovered = remainingCredits >= duration;
      const costBadge = isCovered ? 'Covered by Plan (₹0)' : `₹${Math.round(room.hourlyRate * duration)}`;

      const showDurationToggle = selectedSlots.length === 1 && (!customWin || durationMins === 30);
      const baseHourSlot = selectedSlots[0] ? `${selectedSlots[0].split(':')[0]}:00` : startSlot;
      const baseHourNum = parseInt(baseHourSlot.split(':')[0], 10);
      const halfHourSlot = `${baseHourNum < 10 ? '0' : ''}${baseHourNum}:30`;
      const nextHourSlot = `${(baseHourNum + 1) < 10 ? '0' : ''}${baseHourNum + 1}:00`;

      // Check if full hour is free (so we can offer 30m vs 60m toggle)
      const isFullHourFree = !bookings.some(b => toMin(b.startTime) < (baseHourNum + 1) * 60 && toMin(b.endTime) > baseHourNum * 60);

      lockInBarHtml = `
        <div class="lockin-action-bar" style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid rgba(16, 185, 129, 0.4); color: var(--text-primary, #0f172a); margin-top: 10px; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
          <div style="min-width: 0; flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 13px; font-weight: 800; color: var(--text-primary, #0f172a); display: flex; align-items: center; gap: 5px;">
                <span>📅</span> <span>Booking:</span> <strong style="color: #059669; font-family: var(--font-mono);">${formatSlot12h(startSlot)} – ${formatSlot12h(endSlotStr)}</strong> <span style="color: var(--text-secondary, #64748b); font-size: 11px;">(${durText})</span>
              </span>
              <span class="badge ${isCovered ? 'badge-success' : 'badge-primary'}" style="font-size: 10.5px; padding: 2px 8px; font-weight: 700;">
                ${costBadge}
              </span>
              ${showDurationToggle && isFullHourFree ? `
                <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                  <button type="button" class="btn btn-sm ${durationMins === 30 && startSlot === baseHourSlot ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setInlineSlotDuration('${room.id}', 30, '${baseHourSlot}', '${halfHourSlot}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 700;">30m (${baseHourSlot}–${halfHourSlot})</button>
                  <button type="button" class="btn btn-sm ${durationMins === 30 && startSlot === halfHourSlot ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setInlineSlotDuration('${room.id}', 30, '${halfHourSlot}', '${nextHourSlot}')" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 700;">30m (${halfHourSlot}–${nextHourSlot})</button>
                  <button type="button" class="btn btn-sm ${durationMins === 60 ? 'btn-primary' : 'btn-outline'}" onclick="MeetingRoomsModule.setInlineSlotDuration('${room.id}', 60)" style="font-size: 10.5px; padding: 2px 8px; border-radius: 6px; font-weight: 700;">60m (Full Hour)</button>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.clearSlotSelection('${room.id}')" style="font-size: 11.5px; padding: 6px 12px; border-radius: 6px; color: var(--text-secondary, #64748b); border-color: var(--border-medium, #cbd5e1);" title="Clear selection">
              ✕ Cancel
            </button>
            <button class="btn btn-sm" onclick="MeetingRoomsModule.lockInSelectedSlots('${room.id}')" style="font-size: 12px; font-weight: 800; padding: 7px 16px; border-radius: 8px; background: #16a34a; color: #ffffff; border: 1px solid #15803d; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);" title="Book this reservation immediately">
              <span>⚡</span> <span>Book Now</span>
            </button>
          </div>
        </div>
      `;
    }

    const showMorning = this.filterSession === 'all' || this.filterSession === 'morning';
    const showAfternoon = this.filterSession === 'all' || this.filterSession === 'afternoon';

    // If using Modern Card View (default), render clean, uncluttered 16:9 card
    if (this.schedulerViewMode === 'cards') {
      const RG = window.RoomGallery;
      const images = RG ? RG.getImages(room) : [];
      const primaryImg = images[0] ? (images[0].thumbUrl || images[0].url) : '/assets/rooms/mr-01-main.jpg';
      const isAvailable = statusType === 'available';
      const isMaint = isMaintenance;
      const badgeClass = isMaint ? 'maintenance' : (isAvailable ? 'available' : 'in-use');
      const badgeText = isMaint ? 'Under Maintenance' : (isAvailable ? 'Available' : 'In Use');
      
      return `
        <div class="hub-room-card" id="hub-room-card-${room.id}">
          <div class="hub-card-thumb-wrap" onclick="RoomGallery.openDetails('${room.id}')" title="Click to view full room details and booking schedule">
            <img src="${primaryImg}" alt="${room.name}" loading="lazy" onerror="RoomGallery.onImgError(this)">
            <span class="hub-card-status-badge ${badgeClass}">${badgeText}</span>
            <span style="position: absolute; bottom: 8px; left: 8px; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(4px); color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 2px 7px; border-radius: 6px; font-family: monospace;">${room.roomNumber || '1F-R01'}</span>
            <button type="button" class="hub-card-heart-btn" onclick="event.stopPropagation(); App.showToast('❤️ Saved to favorites', 'success');" title="Save to favorites">
              ♡
            </button>
          </div>

          <div class="hub-card-body">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 2px;">
              <h4 class="hub-card-title" title="${room.name}" style="margin: 0; min-width: 0;">${room.name}</h4>
              <span class="hub-card-floor-badge" title="Building Floor">${room.floor || '1F'}</span>
            </div>
            <div style="font-size: 11.5px; color: #64748b; font-weight: 700; margin-bottom: 5px;">
              Floor: <strong style="color: #1e293b;">${room.floor || '1F'}</strong> · Room: <strong style="color: #4f3fe0; font-family: monospace;">${room.roomNumber || '1F-R01'}</strong>
            </div>
            <div class="hub-card-capacity">
              <span>👥</span>
              <span>${room.capacity} people</span>
              <span style="color: #cbd5e1; margin: 0 4px;">•</span>
              <span style="color: #4f46e5; font-weight: 800;">₹${room.hourlyRate}/hr</span>
            </div>

            <div class="hub-card-footer">
              <div class="hub-card-icons" title="Amenities included">
                <span title="Display / Projector">🖥️</span>
                <span title="Video Conferencing">📹</span>
                <span title="Microphone / Audio">🎙️</span>
                <span title="Fast Wi-Fi">📶</span>
              </div>
              <div>
                ${isAvailable && !isMaint ? `
                  <button type="button" class="hub-card-btn-book" onclick="RoomGallery.openDetails('${room.id}')">
                    Book Now
                  </button>
                ` : `
                  <button type="button" class="hub-card-btn-schedule" onclick="RoomGallery.openDetails('${room.id}')">
                    View Schedule
                  </button>
                `}
              </div>
            </div>
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
            <div class="exec-title-content">
              <div class="exec-title-top-line">
                <h3 class="exec-room-title" title="${room.name}">${room.name}</h3>
                <span class="exec-status-pill ${statusType}">● ${statusPillText}</span>
              </div>
              <div class="exec-meta-row">
                <span class="exec-pill-badge">👥 ${room.capacity} Pax Capacity</span>
                <span class="exec-pill-badge" style="background: #ede9fe; color: #4f46e5; border: 1px solid rgba(99,102,241,0.28); font-weight: 800;">₹${room.hourlyRate}/hr</span>
                <span style="font-size: 11px; color: ${isPastDay ? '#9ca3af' : availableHours === 0 ? '#dc2626' : otherBookedHours > 0 ? '#dc2626' : statusType === 'available' ? '#15803d' : '#6b7280'}; font-weight: 700;">
                  ${isMaintenance
                    ? `🔧 Under Maintenance`
                    : isPastDay 
                      ? `History • ${totalBookedHours > 0 ? totalBookedHours + ' Booked (Completed)' : 'Completed'}`
                      : (availableHours === 0 
                          ? (statusPillText === 'Fully Booked' ? `0 Slots Open (🔴 Fully Booked)` : `All sessions ended for today`)
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

        <!-- Room Media Row: 16:9 primary photo (opens gallery) + description, key amenities & actions -->
        ${(() => {
          const RG = window.RoomGallery;
          if (!RG) return '';
          const amenities = Array.isArray(room.amenities) ? room.amenities : [];
          const shown = amenities.slice(0, 4);
          const desc = RG.getDescription(room);
          return `
            <div class="exec-media-row">
              ${RG.renderCardThumb(room)}
              <div class="exec-media-info">
                ${desc ? `<p class="exec-media-desc" title="${RG.esc(desc)}">${RG.esc(desc)}</p>` : ''}
                <div class="exec-media-amenities">
                  ${shown.map(a => `<span class="exec-amenity-chip">${RG.esc(a)}</span>`).join('')}
                  ${amenities.length > shown.length ? `<span class="exec-amenity-chip more">+${amenities.length - shown.length} more</span>` : ''}
                </div>
                <div class="exec-media-actions">
                  <button type="button" class="btn btn-outline btn-sm" onclick="RoomGallery.openDetails('${room.id}')">View Details</button>
                  <button type="button" class="btn btn-primary btn-sm" onclick="MeetingRoomsModule.bookNextAvailable('${room.id}')" ${isMaintenance ? 'disabled title="Room is under maintenance"' : ''}>⚡ Book Now</button>
                </div>
              </div>
            </div>
          `;
        })()}

        <!-- Room-Specific Date & Calendar Bar -->
        <div class="room-calendar-bar">
          <div class="room-cal-left">
            <button type="button" class="room-cal-nav-btn" onclick="MeetingRoomsModule.cycleDate(-1)" title="Previous Day (‹)">‹</button>
            <label class="room-cal-date-picker" title="Click to open calendar and pick any date for ${room.name}">
              <span class="room-cal-icon">📅</span>
              <span class="room-cal-date-text">${formattedDateStr}</span>
              ${isToday ? `<span class="room-cal-badge today">Today</span>` : isTomorrow ? `<span class="room-cal-badge tomorrow">Next Day</span>` : isPastDay ? `<span class="room-cal-badge" style="background: #e2e8f0; color: #64748b;">Past</span>` : ''}
              <span class="room-cal-arrow">▾</span>
              <input type="date" value="${this.selectedDate}" onchange="MeetingRoomsModule.setDate(this.value)" onclick="try{this.showPicker?.()}catch(e){}" class="room-cal-native-input" title="Pick date for ${room.name}">
            </label>
            <button type="button" class="room-cal-nav-btn" onclick="MeetingRoomsModule.cycleDate(1)" title="Next Day (›)">›</button>
          </div>

          <div class="room-cal-right">
            <button type="button" class="room-cal-chip ${isToday ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${todayStr}')">Today</button>
            <button type="button" class="room-cal-chip ${isTomorrow ? 'active' : ''}" onclick="MeetingRoomsModule.setDate('${tomorrowStr}')">Next Day</button>
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
              <div class="clear-session-header" onclick="MeetingRoomsModule.openQuickSessionModal('morning', '${room.id}')" style="cursor: pointer; border-radius: 8px; padding: 4px 6px; margin: -4px -6px 8px -6px; transition: background 0.15s ease;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background=''" title="Click to open 'How long do you need?' for Morning Session">
                <div class="clear-session-title">
                  <span>🌅</span>
                  <span>Morning Session</span>
                  <span class="badge" style="font-size: 10px; font-weight: 800; background: #ede9fe; color: #4f46e5; border: 1px solid rgba(99,102,241,0.3); margin-left: 6px; border-radius: 6px; padding: 1px 7px; letter-spacing: 0.02em;">⚡ Quick Book</span>
                </div>
                <span class="clear-session-hours" style="color: #4f46e5; font-weight: 700;">08:00 AM – 11:00 AM ➔</span>
              </div>
              <div class="clear-slots-grid">
                ${morningSlots.map(renderSlotCard).join('')}
              </div>
            </div>
          ` : ''}

          ${showAfternoon ? `
            <!-- Afternoon Session -->
            <div class="clear-session-block">
              <div class="clear-session-header" onclick="MeetingRoomsModule.openQuickSessionModal('afternoon', '${room.id}')" style="cursor: pointer; border-radius: 8px; padding: 4px 6px; margin: -4px -6px 8px -6px; transition: background 0.15s ease;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background=''" title="Click to open 'How long do you need?' for Afternoon Session">
                <div class="clear-session-title">
                  <span>🌆</span>
                  <span>Afternoon Session</span>
                  <span class="badge" style="font-size: 10px; font-weight: 800; background: #ede9fe; color: #4f46e5; border: 1px solid rgba(99,102,241,0.3); margin-left: 6px; border-radius: 6px; padding: 1px 7px; letter-spacing: 0.02em;">⚡ Quick Book</span>
                </div>
                <span class="clear-session-hours" style="color: #4f46e5; font-weight: 700;">03:00 PM – 07:00 PM ➔</span>
              </div>
              <div class="clear-slots-grid">
                ${afternoonSlots.map(renderSlotCard).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Inline Lock-In Strip (Slides down when slot selected) -->
        ${lockInBarHtml}



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
              <th style="white-space: nowrap; text-align: center;">Details</th>
              <th style="white-space: nowrap; text-align: center;">Cancel</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(b => {
              const isMine = b.startupId === myStartup.id;
              const isCompleted = this.isBookingCompleted(b);
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
                    <code style="font-family: var(--font-mono); font-weight: 700; color: ${isMine ? '#2563eb' : 'inherit'}; white-space: nowrap; display: inline-block;">${this.formatTimeTo12Hour(b.startTime)} – ${this.formatTimeTo12Hour(b.endTime)}</code>
                  </td>
                  <td style="white-space: nowrap; text-align: center;">${b.attendees} Pax</td>
                  <td style="white-space: nowrap;">
                    ${b.cost === 0 ? '<span style="color: #16a34a; font-weight: 600; white-space: nowrap;">Covered by Plan</span>' : `<span style="white-space: nowrap;">₹${b.cost}</span>`}
                  </td>
                  <td style="white-space: nowrap; text-align: center;">
                    <button class="btn btn-outline btn-sm" style="font-size: 11.5px; padding: 4px 10px; color: #2563eb; border-color: rgba(37,99,235,0.4); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; line-height: 1; flex-shrink: 0;" onclick="MeetingRoomsModule.openReservationDetailsModal('${b.roomId}', '${b.id}')">
                      <span>📋</span><span>Details</span>
                    </button>
                  </td>
                  <td style="white-space: nowrap; text-align: center;">
                    ${isCompleted ? `
                      <button class="btn btn-outline btn-sm" disabled title="Completed meetings cannot be cancelled" style="font-size: 11.5px; padding: 4px 12px; color: #64748b; border-color: #cbd5e1; white-space: nowrap; line-height: 1; flex-shrink: 0; font-weight: 600; cursor: not-allowed; opacity: 0.65;">
                        ✓ Completed
                      </button>
                    ` : `
                      <button class="btn btn-outline btn-sm" style="font-size: 11.5px; padding: 4px 12px; color: var(--status-danger); border-color: rgba(239,68,68,0.4); white-space: nowrap; line-height: 1; flex-shrink: 0; font-weight: 700; background: rgba(239, 68, 68, 0.04);" onclick="MeetingRoomsModule.openCancellationModal('${b.roomId}', '${b.id}')">
                        <span>❌</span> <span>Cancel</span>
                      </button>
                    `}
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
    const isCompleted = this.isBookingCompleted(booking);
    const isCancelled = booking.status === 'Cancelled';

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
                  ${isCompleted ? 'Completed Session' : 'Confirmed Reservation'}
                </div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
                  Booked in system • Zero double-booking verified
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 11.5px; font-weight: 800; padding: 4px 10px;">
                ${isCompleted ? 'Completed' : (booking.status || 'Confirmed')}
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



            <!-- Billing & Amenities -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Billing / Plan</div>
                <div style="font-size: 13px; font-weight: 800; color: #16a34a; margin-top: 2px;">
                  ${booking.cost === 0 ? 'Covered by Plan (₹0)' : `₹${booking.cost}`}
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Requested Amenities</div>
                <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px; font-weight: 600;">
                  ${Array.isArray(booking.requestedAmenities) && booking.requestedAmenities.length > 0 ? booking.requestedAmenities.join(' • ') : 'Polycom 4K • Screen • WiFi'}
                </div>
              </div>
            </div>

            ${booking.specialRequests ? `
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 9px 14px;">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Special Requests</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${booking.specialRequests}</div>
              </div>
            ` : ''}

            <!-- Calendar Export & External Sync -->
            <div style="background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #1d4ed8;">
                  <span>📅</span> <span>External Calendar Sync:</span>
                </div>
                <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">
                  ${booking.calendarSync?.google?.synced ? `<span style="color:#16a34a; font-weight:700;">✓ Google Synced</span>` : 'Google: Not Synced'} •
                  ${booking.calendarSync?.outlook?.synced ? `<span style="color:#0284c7; font-weight:700;">✓ Outlook Synced</span>` : 'Outlook: Not Synced'}
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.syncBookingWithProvider('${booking.id}', 'google')" style="font-size: 11px; padding: 4px 10px; border-radius: 6px; color: #2563eb; border-color: rgba(37,99,235,0.35);">
                  ${booking.calendarSync?.google?.synced ? '✓ Google Calendar' : '+ Sync Google'}
                </button>
                <button class="btn btn-sm btn-outline" onclick="MeetingRoomsModule.syncBookingWithProvider('${booking.id}', 'outlook')" style="font-size: 11px; padding: 4px 10px; border-radius: 6px; color: #0284c7; border-color: rgba(2,132,199,0.35);">
                  ${booking.calendarSync?.outlook?.synced ? '✓ Outlook' : '+ Sync Outlook'}
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
              ${!isCompleted && !isCancelled ? `
                <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-reservation-details'); MeetingRoomsModule.openEditTimeWindowModal('${room.id}', '${booking.id}')" style="font-weight: 700; font-size: 12px; border-radius: 8px; color: #2563eb; border-color: rgba(37,99,235,0.4); padding: 7px 14px;">
                  🔄 Edit / Reschedule
                </button>
                <button class="btn btn-outline btn-sm" onclick="MeetingRoomsModule.closeModal('modal-reservation-details'); MeetingRoomsModule.openCancellationModal('${room.id}', '${booking.id}')" style="font-weight: 700; font-size: 12px; border-radius: 8px; color: #dc2626; border-color: rgba(220,38,38,0.4); padding: 7px 14px;">
                  Cancel
                </button>
              ` : `
                <button class="btn btn-outline btn-sm" disabled title="Completed meetings cannot be cancelled" style="font-weight: 600; font-size: 12px; border-radius: 8px; color: #64748b; border-color: #cbd5e1; padding: 7px 14px; cursor: not-allowed; opacity: 0.65;">
                  ${isCancelled ? 'Cancelled' : '✓ Completed (Cannot Cancel)'}
                </button>
              `}
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

  setBookModalDuration(mins) {
    const startSelect = document.getElementById('book-start-time');
    const endSelect = document.getElementById('book-end-time');
    if (!startSelect || !endSelect) return;
    const [sh, sm] = (startSelect.value || '09:00').split(':').map(Number);
    const targetMin = sh * 60 + (sm || 0) + mins;
    const th = Math.floor(targetMin / 60);
    const tm = targetMin % 60;
    const pad = n => (n < 10 ? '0' : '') + n;
    const targetStr = `${pad(th)}:${pad(tm)}`;
    if ([...endSelect.options].some(o => o.value === targetStr)) {
      endSelect.value = targetStr;
    } else if (endSelect.options.length > 0) {
      endSelect.selectedIndex = endSelect.options.length - 1;
    }
    this.updateModalCostPreview();
  },

  updateModalCostPreview() {
    const roomSelect = document.getElementById('book-modal-room-id');
    const startupSelect = document.getElementById('book-modal-startup-id');
    const startSelect = document.getElementById('book-start-time');
    const endSelect = document.getElementById('book-end-time');
    const attendeesInput = document.getElementById('book-modal-attendees');
    const capHint = document.getElementById('book-modal-capacity-hint');
    const titleEl = document.getElementById('modal-cost-summary-title');
    const badgeEl = document.getElementById('modal-credits-remaining-badge');
    const breakdownEl = document.getElementById('book-modal-confirm-breakdown');
    const submitBtn = document.getElementById('btn-book-modal-submit');
    if (!roomSelect || !startupSelect || !startSelect || !endSelect || !titleEl) return;

    const roomId = roomSelect.value;
    const startupId = startupSelect.value;
    const startTime = startSelect.value;
    const endTime = endSelect.value;

    const room = window.store.getMeetingRoomById(roomId);
    const startup = window.store.getStartupById(startupId);
    if (!room || !startup) return;

    // Validate capacity
    if (attendeesInput) {
      attendeesInput.max = room.capacity;
      const att = parseInt(attendeesInput.value, 10) || 1;
      if (att > room.capacity) {
        if (capHint) {
          capHint.textContent = `⚠️ Exceeds ${room.capacity} Pax!`;
          capHint.style.color = '#dc2626';
        }
        if (submitBtn) submitBtn.disabled = true;
      } else {
        if (capHint) {
          capHint.textContent = `Max: ${room.capacity} Pax`;
          capHint.style.color = '#16a34a';
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    }

    const startH = parseFloat(startTime.split(':')[0]) + parseFloat(startTime.split(':')[1] || 0) / 60;
    const endH = parseFloat(endTime.split(':')[0]) + parseFloat(endTime.split(':')[1] || 0) / 60;
    const duration = Math.max(0.25, Number((endH - startH).toFixed(2)));
    const durMins = Math.round(duration * 60);
    const durText = durMins < 60 ? `${durMins} min` : (durMins % 60 === 0 ? `${duration} hr${duration > 1 ? 's' : ''}` : `${Math.floor(duration)}h ${durMins % 60}m`);

    const durContainer = document.getElementById('book-modal-duration-group');
    if (durContainer) {
      durContainer.querySelectorAll('.duration-pill').forEach(btn => {
        const bm = parseInt(btn.getAttribute('data-mins'), 10);
        if (bm === durMins) {
          btn.style.background = '#4F3FE0';
          btn.style.color = '#ffffff';
          btn.style.borderColor = '#4F3FE0';
        } else {
          btn.style.background = 'transparent';
          btn.style.color = 'inherit';
          btn.style.borderColor = '';
        }
      });
    }

    const dateInput = document.getElementById('book-modal-date');
    const bookDate = (dateInput && dateInput.value) || this.selectedDate || '2026-11-03';

    // Single source of truth credit evaluation
    let evalResult = null;
    const cs = (typeof window !== 'undefined' && window.creditService) ? window.creditService : (typeof creditService !== 'undefined' ? creditService : null);
    if (cs && typeof cs.evaluateBookingCost === 'function') {
      const allRooms = window.store.getMeetingRooms();
      evalResult = cs.evaluateBookingCost(startup, allRooms, {
        roomId,
        date: bookDate,
        startTime,
        endTime
      });
    }

    if (evalResult) {
      if (evalResult.willCauseOverage) {
        titleEl.innerHTML = `⚠️ Quota Exceeded — Extra Overage: ₹${evalResult.overageFee.toLocaleString('en-IN')} • <span style="font-size: 11.5px; font-weight: 600; color: #dc2626;">${evalResult.overageHours} hrs @ ₹1,500/hr</span>`;
        titleEl.style.color = '#dc2626';
        if (badgeEl) {
          badgeEl.className = 'badge badge-danger';
          badgeEl.style.background = '#FEE2E2';
          badgeEl.style.color = '#B91C1C';
          badgeEl.textContent = `₹${evalResult.overageFee.toLocaleString('en-IN')} overage`;
        }
        if (breakdownEl) {
          breakdownEl.innerHTML = `
            <div style="display: flex; justify-content: space-between;"><span>Reservation Duration:</span><strong>${durText} (${evalResult.neededCredits} credits)</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Available Allowance (${startup.name}):</span><strong style="color: #2563eb;">${evalResult.availableCredits} credits (${(evalResult.availableCredits / 10).toFixed(1)} hrs)</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Overage Billed (${evalResult.overageHours} hrs @ ₹1,500/hr):</span><strong style="color: #dc2626;">₹${evalResult.overageFee.toLocaleString('en-IN')}</strong></div>
            <div style="margin-top: 6px; padding: 8px 12px; background: #FEF3C7; border: 1.5px solid #F59E0B; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <div style="font-size: 11px; color: #92400E; font-weight: 700; line-height: 1.3;">
                💡 Top up instead for ₹500/hr (Save ₹${evalResult.savingsWithTopUp.toLocaleString('en-IN')})!
              </div>
              <button type="button" class="btn btn-sm" onclick="MeetingRoomsModule.openCreditTopUpModal('${startup.id}')" style="background: #D97706; color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; white-space: nowrap;">
                + Top Up Instead
              </button>
            </div>
          `;
        }
      } else {
        const remAfter = evalResult.availableCredits - evalResult.neededCredits;
        const remHours = Number((remAfter / 10).toFixed(1));
        titleEl.innerHTML = `Covered by Plan (₹0) • <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">${durText} (${evalResult.neededCredits} credits) deducted</span>`;
        titleEl.style.color = '#15803d';
        if (badgeEl) {
          badgeEl.className = 'badge badge-success';
          badgeEl.style.background = '#DCFCE7';
          badgeEl.style.color = '#15803D';
          badgeEl.textContent = `${remAfter} credits · ${remHours} hrs left`;
        }
        if (breakdownEl) {
          breakdownEl.innerHTML = `
            <div style="display: flex; justify-content: space-between;"><span>Reservation Duration:</span><strong>${durText} (${evalResult.neededCredits} credits)</strong></div>
            <div style="display: flex; justify-content: space-between;"><span>Monthly Allowance (${startup.name}):</span><strong style="color: #16a34a;">${evalResult.availableCredits} credits (${(evalResult.availableCredits / 10).toFixed(1)} hrs)</strong></div>
            <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(37,99,235,0.25); padding-top: 3px; margin-top: 2px;"><span><strong>Payable Amount:</strong></span><strong style="color: #16a34a;">₹0 (Covered by ${startup.subscriptionPlan || 'Startup Plan'})</strong></div>
          `;
        }
      }
    } else {
      const remainingCredits = Math.max(0, (startup.includedMeetingHours || 12) - (startup.usedMeetingHours || 0));
      const isCovered = remainingCredits >= duration;
      const billableHours = Math.max(0, duration - remainingCredits);
      const charge = isCovered ? 0 : Math.round(room.hourlyRate * billableHours);

      if (isCovered) {
        titleEl.innerHTML = `Covered by Plan (₹0) • <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">${durText} deducted</span>`;
        titleEl.style.color = '#15803d';
        if (badgeEl) {
          badgeEl.className = 'badge badge-success';
          badgeEl.textContent = `${Number((remainingCredits - duration).toFixed(2))} hrs remaining`;
        }
      } else {
        titleEl.innerHTML = `Additional Payable: ₹${charge.toLocaleString('en-IN')} • <span style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">${durText} at ₹${room.hourlyRate}/hr</span>`;
        titleEl.style.color = '#2563eb';
        if (badgeEl) {
          badgeEl.className = 'badge badge-primary';
          badgeEl.textContent = `₹${charge.toLocaleString('en-IN')} payable`;
        }
      }

      if (breakdownEl) {
        breakdownEl.innerHTML = `
          <div style="display: flex; justify-content: space-between;"><span>Hourly Rate (${room.name}):</span><strong>₹${room.hourlyRate}/hr × ${durText}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Included Plan Credits (${startup.name}):</span><strong style="color: #16a34a;">${remainingCredits}h available</strong></div>
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(37,99,235,0.25); padding-top: 3px; margin-top: 2px;"><span><strong>Additional Amount Payable:</strong></span><strong style="color: ${isCovered ? '#16a34a' : '#2563eb'};">${isCovered ? '₹0 (Covered by Plan)' : `₹${charge.toLocaleString('en-IN')}`}</strong></div>
        `;
      }
    }
  },

  openBookModal(preselectedRoomId = null, preselectedTime = null, preselectedStartupId = null, preselectedEndTime = null) {
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

    const availableAmenities = ['4K Display / Projector', 'Video Conferencing', 'Whiteboard & Markers', 'High-Speed Wi-Fi', 'Speakerphone', 'Tea / Coffee Service'];

    const html = `
      <div class="modal-overlay active" id="modal-book-room" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-book-room')" style="display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 16px;">
        <div class="modal-content" style="max-width: 600px; width: 100%; border-radius: 20px; overflow: hidden; background: var(--bg-surface); border: 1.5px solid var(--border-medium); box-shadow: 0 25px 60px -12px rgba(0,0,0,0.35);">
          
          <!-- Premium Modal Header -->
          <div style="background: linear-gradient(135deg, #0b2545 0%, #1e3a8a 60%, #2563eb 100%); color: #ffffff; padding: 18px 24px; position: relative;">
            <button type="button" class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-book-room')" style="position: absolute; right: 18px; top: 18px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">✕</button>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd; font-weight: 700;">
              <span>⚡ Nexus Conference System</span> • <span>Conflict-Free Scheduler</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 800; margin: 4px 0 2px 0; color: #ffffff; display: flex; align-items: center; gap: 8px;">
              <span>📅</span> Reserve Meeting Room
            </h2>
            <div style="font-size: 12px; color: #bfdbfe;">
              Select session, time window, amenities, and confirm your reservation details.
            </div>
          </div>

          <!-- Modal Body -->
          <div style="padding: 18px 24px; max-height: calc(88vh - 110px); overflow-y: auto;">
            <form id="form-book-room" onsubmit="MeetingRoomsModule.handleBookSubmit(event)">
              
              <!-- 2-Column Bento: Room & Reserving Venture -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <!-- Room Selector -->
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 9px 12px;">
                  <label class="form-label" style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 5px;">
                    <span>🏢</span> Meeting Room <span style="color: #ef4444;">*</span>
                  </label>
                  <select name="roomId" id="book-modal-room-id" class="form-control" style="font-weight: 700; font-size: 12px; padding: 6px 8px; border-radius: 8px;" onchange="MeetingRoomsModule.updateModalCostPreview()" required>
                    ${rooms.filter(r => !this.isRoomUnderMaintenance(r) || r.id === initialRoom.id).map(r => `
                      <option value="${r.id}" ${r.id === initialRoom.id ? 'selected' : ''}>
                        ${r.icon} ${r.name} (${r.capacity} Pax • ₹${r.hourlyRate}/hr)
                      </option>
                    `).join('')}
                  </select>
                </div>

                <!-- Venture Selector -->
                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 9px 12px;">
                  <label class="form-label" style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 5px;">
                    <span>👤</span> Startup Name <span style="color: #ef4444;">*</span>
                  </label>
                  <select name="startupId" id="book-modal-startup-id" class="form-control" style="font-weight: 700; font-size: 12px; padding: 6px 8px; border-radius: 8px;" onchange="MeetingRoomsModule.updateModalCostPreview()" required>
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

              <!-- Date, Attendees & Booked By Row -->
              <div style="display: grid; grid-template-columns: 1.2fr 0.9fr 1.1fr; gap: 10px; margin-bottom: 12px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">
                    📅 Reservation Date <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="date" name="date" id="book-modal-date" class="form-control" style="font-weight: 700; font-size: 12px; border-radius: 8px; padding: 7px 10px;" value="${this.selectedDate}" onchange="MeetingRoomsModule.updateModalCostPreview()" required>
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: flex; justify-content: space-between;">
                    <span>👥 Attendees <span style="color: #ef4444;">*</span></span>
                    <span id="book-modal-capacity-hint" style="font-size: 10.5px; color: #16a34a;">Max: ${initialRoom.capacity}</span>
                  </label>
                  <input type="number" name="attendees" id="book-modal-attendees" class="form-control" style="font-weight: 700; font-size: 12px; border-radius: 8px; padding: 7px 10px;" value="${Math.min(6, initialRoom.capacity)}" min="1" max="${initialRoom.capacity}" oninput="MeetingRoomsModule.updateModalCostPreview()" required>
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">
                    <span>👤 Booked By <span style="color: #ef4444;">*</span></span>
                  </label>
                  <input type="text" name="bookedBy" id="book-modal-booked-by" class="form-control" value="${(window.store && window.store.currentUser && window.store.currentUser.name) || 'Alex Morgan'}" style="font-weight: 700; font-size: 12px; border-radius: 8px; padding: 7px 10px;" required>
                </div>
              </div>

              <!-- Operating Session & Duration Selector Tabs -->
              <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 14px; padding: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                  <label class="form-label" style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin: 0;">
                    ⏰ Operating Session &amp; Duration <span style="color: #ef4444;">*</span>
                  </label>
                  <div style="display: flex; gap: 4px;" id="book-modal-duration-group">
                    <button type="button" class="btn btn-outline btn-sm duration-pill" data-mins="30" onclick="MeetingRoomsModule.setBookModalDuration(30)" style="font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 700;">30m</button>
                    <button type="button" class="btn btn-outline btn-sm duration-pill" data-mins="60" onclick="MeetingRoomsModule.setBookModalDuration(60)" style="font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 700;">1hr</button>
                    <button type="button" class="btn btn-outline btn-sm duration-pill" data-mins="90" onclick="MeetingRoomsModule.setBookModalDuration(90)" style="font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 700;">1.5hrs</button>
                    <button type="button" class="btn btn-outline btn-sm duration-pill" data-mins="120" onclick="MeetingRoomsModule.setBookModalDuration(120)" style="font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 700;">2hrs</button>
                    <button type="button" class="btn btn-outline btn-sm duration-pill" data-mins="180" onclick="MeetingRoomsModule.setBookModalDuration(180)" style="font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 700;">3hrs</button>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                  <button type="button" id="tab-session-morning" class="btn btn-sm ${initialSession === 'morning' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11.5px; font-weight: 700; padding: 7px 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 5px;" onclick="MeetingRoomsModule.switchModalSession('morning')">
                    <span>🌅</span> <span>Morning (08:00 – 11:00 AM)</span>
                  </button>
                  <button type="button" id="tab-session-afternoon" class="btn btn-sm ${initialSession === 'afternoon' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11.5px; font-weight: 700; padding: 7px 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 5px;" onclick="MeetingRoomsModule.switchModalSession('afternoon')">
                    <span>🌆</span> <span>Afternoon (03:00 – 07:00 PM)</span>
                  </button>
                </div>

                <!-- Start & End Time Dropdowns -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <label class="form-label" style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 3px;">
                      Start Time
                    </label>
                    <select name="startTime" id="book-start-time" class="form-control" style="font-weight: 700; font-size: 12px; border-radius: 8px;" onchange="MeetingRoomsModule.syncEndTime(this.value); MeetingRoomsModule.updateModalCostPreview();" required>
                      <!-- Populated dynamically based on active session -->
                    </select>
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 3px;">
                      End Time (Duration)
                    </label>
                    <select name="endTime" id="book-end-time" class="form-control" style="font-weight: 700; font-size: 12px; border-radius: 8px;" onchange="MeetingRoomsModule.updateModalCostPreview()" required>
                      <!-- Populated dynamically -->
                    </select>
                  </div>
                </div>
              </div>

              <!-- Recurring Reservation Schedule -->
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 10px 12px; margin-bottom: 12px;">
                <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 10px; align-items: end;">
                  <div>
                    <label class="form-label" style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: block;">
                      🔁 Recurrence Pattern
                    </label>
                    <select name="recurrenceFrequency" id="book-recurrence-freq" class="form-control" style="font-weight: 700; font-size: 12px; padding: 6px 8px; border-radius: 8px;" onchange="const cEl = document.getElementById('book-recurrence-count-wrap'); if(cEl) cEl.style.display = this.value === 'none' ? 'none' : 'block'; MeetingRoomsModule.updateModalCostPreview();">
                      <option value="none">One-Time Reservation</option>
                      <option value="daily">Daily Series</option>
                      <option value="weekly">Weekly Series</option>
                      <option value="biweekly">Bi-Weekly Series</option>
                    </select>
                  </div>
                  <div id="book-recurrence-count-wrap" style="display: none;">
                    <label class="form-label" style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: block;">
                      Occurrences (2–12)
                    </label>
                    <input type="number" name="recurrenceCount" id="book-recurrence-count" class="form-control" value="3" min="2" max="12" style="font-weight: 700; font-size: 12px; padding: 6px 8px; border-radius: 8px;" oninput="MeetingRoomsModule.updateModalCostPreview()">
                  </div>
                </div>
              </div>

              <!-- Required Amenities & Special Requests -->
              <div style="margin-bottom: 12px;">
                <label class="form-label" style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px; display: block;">
                  🔌 Required Amenities &amp; Special Requests
                </label>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px;">
                  ${availableAmenities.map((am, idx) => `
                    <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); padding: 4px 8px; border-radius: 6px; cursor: pointer;">
                      <input type="checkbox" class="book-modal-amenity-cb" value="${am}" ${idx < 2 ? 'checked' : ''} style="margin: 0; accent-color: #2563eb;">
                      <span>${am}</span>
                    </label>
                  `).join('')}
                </div>
                <input type="text" name="specialRequests" id="book-special-requests" class="form-control" placeholder="Special requests (e.g., catering, whiteboard markers, adapter)..." style="font-size: 11.5px; padding: 6px 10px; border-radius: 8px;">
              </div>

              <!-- Live Cost & Plan Credits Summary Strip -->
              <div id="modal-cost-summary-box" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%); border: 1.5px solid rgba(34, 197, 94, 0.35); border-radius: 12px; padding: 10px 14px; margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
                  <div>
                    <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                      Pre-Finalization Billing &amp; Credits Summary
                    </div>
                    <div id="modal-cost-summary-title" style="font-size: 13px; font-weight: 800; color: #15803d; margin-top: 1px;">
                      Covered by Incubation Plan (₹0)
                    </div>
                  </div>
                  <div id="modal-credits-remaining-badge" class="badge badge-success" style="font-size: 11px; padding: 3px 9px; font-weight: 700;">
                    Plan Credits Active
                  </div>
                </div>
                <div id="book-modal-confirm-breakdown" style="font-size: 11px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 2px;"></div>
              </div>

              <!-- Footer Buttons -->
              <div style="display: flex; gap: 10px; justify-content: flex-end; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                <button type="button" class="btn btn-secondary" onclick="MeetingRoomsModule.closeModal('modal-book-room')" style="font-weight: 600; padding: 8px 18px; border-radius: 8px; font-size: 12.5px;">
                  Cancel
                </button>
                <button type="submit" id="btn-book-modal-submit" class="btn btn-primary" style="font-weight: 800; padding: 9px 24px; border-radius: 8px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);">
                  <span>⚡ Confirm &amp; Book</span> <span>➔</span>
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
      if (startSelect && Array.from(startSelect.options || []).some(o => o.value === preselectedTime)) {
        startSelect.value = preselectedTime;
        this.syncEndTime(preselectedTime);
      }
    }
    if (preselectedEndTime) {
      const endSelect = document.getElementById('book-end-time');
      if (endSelect && Array.from(endSelect.options || []).some(o => o.value === preselectedEndTime)) {
        endSelect.value = preselectedEndTime;
      }
    }
    this.updateModalCostPreview();
  },

  async handleBookSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '<span>⚡ Confirm & Book</span> <span>➔</span>';

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const startups = window.store.getStartups();
    const selectedStartup = startups.find(s => s.id === data.startupId) || this.getMyStartup();
    data.startupName = selectedStartup.name;
    if (!data.purpose) {
      const roomObj = window.store.getMeetingRoomById(data.roomId);
      data.purpose = roomObj ? `Team Session in ${roomObj.name}` : 'Executive Working Session';
    }
    if (!data.title) data.title = data.purpose;
    data.bookedBy = (data.bookedBy && data.bookedBy.trim()) || ((window.store && window.store.currentUser && window.store.currentUser.name) || 'Alex Morgan');

    if (data.recurrenceFrequency && data.recurrenceFrequency !== 'none') {
      data.recurrence = {
        frequency: data.recurrenceFrequency,
        count: Math.max(2, Math.min(12, parseInt(data.recurrenceCount, 10) || 3))
      };
    }
    data.idempotencyKey = `book-${data.roomId}-${data.startupId}-${data.date}-${data.startTime}-${data.endTime}-${data.recurrenceFrequency || 'once'}`;

    const amenityCbs = form.querySelectorAll('.book-modal-amenity-cb:checked');
    data.requestedAmenities = Array.from(amenityCbs).map(cb => cb.value);

    const roomId = data.roomId;
    const room = window.store.getMeetingRoomById(roomId);
    const attendeesNum = parseInt(data.attendees, 10) || 4;
    if (room && attendeesNum > room.capacity) {
      App.showToast(`⚠️ Attendees (${attendeesNum}) cannot exceed ${room.name} capacity of ${room.capacity} Pax.`, 'warning');
      return;
    }

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

      if (res.success) {
        this.closeModal('modal-book-room');
        if (data.date && data.date !== this.selectedDate) {
          this.selectedDate = data.date;
        }
        App.showToast(`✅ ${res.message}`, 'success');
        this.render();
        this.refreshDashboardSummary();

        const bookedRoom = window.store.getMeetingRoomById(data.roomId) || room;
        if (bookedRoom && res.booking) {
          this.showBookingSuccessModal(bookedRoom, res.booking, selectedStartup);
        }
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
        if (res.code === 'CAPACITY_EXCEEDED') {
          App.showToast(`⚠️ ${res.message}`, 'warning');
          return;
        }
        this.closeModal('modal-book-room');
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
              <span>🔒</span> Slot Unavailable
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
              <span class="badge" style="background: #dc2626; color: #ffffff; font-weight: 800; font-size: 11px; padding: 4px 9px;">Unavailable 🔒</span>
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
      this.refreshDashboardSummary();
      const room = window.store.getMeetingRoomById(roomId);
      if (room && res.booking) {
        this.showBookingSuccessModal(room, res.booking, myStartup);
      }
      App.showToast(`🎉 Booked alternative: ${room ? room.name : 'Meeting Room'} (${startTime} - ${endTime})!`, 'success');
    } else {
      App.showToast(`⚠️ Could not book alternative: ${res.message}`, 'danger');
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
      const td = targetMenu.closest('td');
      if (td) td.style.zIndex = '9999';
      const tr = targetMenu.closest('tr');
      if (tr) tr.style.zIndex = '9999';
    }
  },

  closeAllRowMenus() {
    document.querySelectorAll('.meeting-row-menu').forEach(menu => {
      menu.style.display = 'none';
      const td = menu.closest('td');
      if (td) td.style.zIndex = '5';
      const tr = menu.closest('tr');
      if (tr) tr.style.zIndex = '';
    });
  },

  exportMyBookingsCSV() {
    const myStartup = this.getMyStartup();
    const filteredBookings = this.getFilteredMyBookings();
    let csv = 'BookingRef,RoomID,RoomName,Floor,Purpose,BookedBy,Date,StartTime,EndTime,DurationHours,Attendees,CreditsUsedHours,FeesOrOverageINR,Status\n';
    filteredBookings.forEach(b => {
      const dur = this.calculateBookingDuration(b.startTime, b.endTime);
      const bRoom = window.store.getMeetingRoomById(b.roomId);
      const floor = bRoom ? bRoom.floor : '1F';
      const creditsUsed = b.creditHoursUsed !== undefined ? Number(b.creditHoursUsed) : (Number(b.cost) === 0 ? dur : 0);
      const fee = Number(b.cost) || 0;
      csv += `"${b.id}","${b.roomId}","${(b.roomName || '').replace(/"/g, '""')}","${floor}","${(b.title || b.purpose || '').replace(/"/g, '""')}","${(b.bookedBy || 'Alex Morgan').replace(/"/g, '""')}","${b.date}","${b.startTime}","${b.endTime}",${dur.toFixed(1)},${b.attendees || 4},${creditsUsed.toFixed(1)},${fee},"${b.status || 'Confirmed'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_my_meeting_room_bookings_report_${myStartup.id}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof App !== 'undefined') {
      App.showToast(`📥 Exported ${filteredBookings.length} filtered booking records to CSV!`, 'success');
    }
  },

  printMyBookingsReport() {
    const myStartup = this.getMyStartup();
    const filteredBookings = this.getFilteredMyBookings();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const activeBookings = filteredBookings.filter(b => b.status !== 'Cancelled');
    const totalHours = activeBookings.reduce((acc, b) => {
      return acc + this.calculateBookingDuration(b.startTime, b.endTime);
    }, 0);
    const totalFees = activeBookings.reduce((acc, b) => acc + (Number(b.cost) || 0), 0);

    const rowsHtml = filteredBookings.map(b => {
      const dur = this.calculateBookingDuration(b.startTime, b.endTime);
      const isCancelled = b.status === 'Cancelled';
      const sched = this.formatScheduleDisplay(b.date, b.startTime, b.endTime, dur);
      const creditsUsed = b.creditHoursUsed !== undefined ? Number(b.creditHoursUsed) : (Number(b.cost) === 0 ? dur : 0);

      return `
        <tr style="${isCancelled ? 'opacity: 0.7;' : ''}">
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: ${isCancelled ? '#64748b' : '#2563eb'};">${b.id}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">${b.roomName} <span style="font-size: 11px; color: #64748b;">(Max ${b.capacity} Pax)</span></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;"><strong>${b.title || b.purpose}</strong><br><span style="font-size: 11px; color: #64748b;">👥 ${b.attendees} Pax • Booked by: ${b.bookedBy || 'Alex Morgan'}</span></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">${sched.dateFormatted}<br><strong>${sched.timeFormatted}</strong></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${dur.toFixed(1)} hrs</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: ${isCancelled ? '#64748b' : '#16a34a'}; font-weight: bold;">${isCancelled ? 'Released' : (Number(b.cost) === 0 ? `${creditsUsed.toFixed(1)}h allowance` : `₹${Number(b.cost).toLocaleString('en-IN')}`)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="background: ${isCancelled ? '#f1f5f9' : '#ecfdf5'}; color: ${isCancelled ? '#64748b' : '#065f46'}; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: bold;">
              ${isCancelled ? 'Cancelled' : 'Confirmed'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Meeting Room Bookings &amp; Fee Report - ${myStartup.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 36px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12.5px; }
          th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; letter-spacing: 0.5px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 22px; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
          .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🏢 NEXUS COWORKING &amp; INCUBATION HUB</h1>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13.5px;">Official Meeting Room Bookings &amp; Fee Utilization Report</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 800; color: #2563eb;">${myStartup.name}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Venture ID: ${myStartup.id}</div>
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px;">Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Filtered Bookings</div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 3px;">${filteredBookings.length} Logged</div>
          </div>
          <div class="stat-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Active Reserved Hours</div>
            <div style="font-size: 20px; font-weight: 800; color: #2563eb; margin-top: 3px;">${totalHours.toFixed(1)} Hours</div>
          </div>
          <div class="stat-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Credit Allowance Left</div>
            <div style="font-size: 20px; font-weight: 800; color: #16a34a; margin-top: 3px;">${Math.max(0, (myStartup.includedMeetingHours || 15) - (myStartup.usedMeetingHours || 0))} hrs free</div>
          </div>
          <div class="stat-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Total Fees Billed</div>
            <div style="font-size: 20px; font-weight: 800; color: #2563eb; margin-top: 3px;">₹${totalFees.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Booking Ref</th>
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

  setMyBookingsDateRange(from, to) {
    this.myBookingsDateFrom = from || '';
    this.myBookingsDateTo = to || '';
    this.myBookingsPage = 1;
    this.render();
  },

  setMyBookingsPage(page) {
    this.myBookingsPage = Math.max(1, page);
    this.render();
  },

  setMyBookingsPageSize(size) {
    this.myBookingsPageSize = parseInt(size, 10) || 25;
    this.myBookingsPage = 1;
    this.render();
  },

  toggleRowSort(col) {
    if (this.myBookingsSortBy === col) {
      this.myBookingsSortDir = this.myBookingsSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.myBookingsSortBy = col;
      this.myBookingsSortDir = 'asc';
    }
    this.render();
  },

  toggleSeriesExpansion(seriesId) {
    this.expandedSeries[seriesId] = !this.expandedSeries[seriesId];
    this.render();
  },

  handleQuickExtend(roomId, bookingId, extensionMins = 30) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return;

    const [h, m] = booking.endTime.split(':').map(Number);
    const newEndTotalMins = h * 60 + m + extensionMins;
    const newH = Math.floor(newEndTotalMins / 60);
    const newM = newEndTotalMins % 60;
    const newEndTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;

    const closeMins = this.parseTimeToMinutes(room.operatingHours ? room.operatingHours.close : '20:00');
    if (newEndTotalMins > closeMins) {
      if (typeof App !== 'undefined') App.showToast(`Cannot extend past room closing time (${room.operatingHours.close}).`, 'warning');
      return;
    }

    const hasConflict = (room.bookings || []).some(b => {
      if (b.id === bookingId || b.status === 'Cancelled') return false;
      if (b.date !== booking.date) return false;
      const bStart = this.parseTimeToMinutes(b.startTime);
      const bEnd = this.parseTimeToMinutes(b.endTime);
      const extStart = this.parseTimeToMinutes(booking.endTime);
      return extStart < bEnd && newEndTotalMins > bStart;
    });

    if (hasConflict) {
      if (typeof App !== 'undefined') {
        App.showToast(`Cannot extend: Room is reserved by another member starting at ${booking.endTime}.`, 'warning');
      }
      return;
    }

    booking.endTime = newEndTime;
    const newDur = this.calculateBookingDuration(booking.startTime, booking.endTime);
    booking.duration = newDur;
    window.store.saveToStorage();
    if (typeof App !== 'undefined') {
      App.showToast(`✅ Reservation extended by ${extensionMins} mins until ${this.formatTimeTo12Hour(newEndTime)}!`, 'success');
    }
    this.render();
  },

  handleEndEarly(roomId, bookingId) {
    const rooms = window.store.getMeetingRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return;
    const { liveTimeStr } = this.getISTNow();
    if (booking.endTime <= liveTimeStr) {
      if (typeof App !== 'undefined') App.showToast('Meeting has already concluded.', 'info');
      return;
    }
    booking.endTime = liveTimeStr;
    const dur = this.calculateBookingDuration(booking.startTime, booking.endTime);
    booking.duration = dur;
    window.store.saveToStorage();
    if (typeof App !== 'undefined') {
      App.showToast(`Meeting #${bookingId} concluded early. Room released!`, 'success');
    }
    this.render();
  },

  checkInBooking(roomId, bookingId) {
    if (typeof App !== 'undefined') {
      App.showToast(`🔑 Checked into booking #${bookingId}! Access granted.`, 'success');
    }
    this.printReservationSlip(roomId, bookingId);
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
            <tr><td><strong>Scheduled Time:</strong></td><td><strong>${this.formatTimeTo12Hour(booking.startTime)} – ${this.formatTimeTo12Hour(booking.endTime)}</strong></td></tr>
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
  },

  openCancellationModal(roomId, bookingId) {
    const room = window.store.getMeetingRoomById(roomId);
    if (!room) return;
    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast('Reservation not found', 'warning');
      return;
    }

    if (this.isBookingCompleted(booking)) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('⚠️ Cannot cancel a completed meeting.', 'warning');
      }
      return;
    }

    const myStartup = this.getMyStartup();
    const currentRole = (window.store && window.store.currentRole) || 'founder';
    const quote = (typeof CancellationPolicy !== 'undefined' && CancellationPolicy.calculateRefundQuote)
      ? CancellationPolicy.calculateRefundQuote(booking)
      : { allowed: true, refundPct: 80, refundPaise: Math.floor((booking.cost || 0) * 80), feePaise: Math.floor((booking.cost || 0) * 20), minsBeforeStart: 420 };

    if (!quote.allowed) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('⚠️ ' + (quote.reason || 'Cancellation is closed. Less than 1 hour remains before meeting start.'), 'warning');
      }
      return;
    }

    const remainingHours = Math.floor(quote.minsBeforeStart / 60);
    const remainingMins = quote.minsBeforeStart % 60;
    const countdownLabel = `${remainingHours}h ${remainingMins}m remaining before start`;

    const refundAmountDisplay = quote.isPlanCovered
      ? `${quote.durationHours} Credit Hours Restored`
      : CancellationPolicy.formatPaiseToINR(quote.refundPaise);

    const feeAmountDisplay = quote.isPlanCovered
      ? '₹0.00 (No fee)'
      : CancellationPolicy.formatPaiseToINR(quote.feePaise);

    const originalAmountDisplay = quote.isPlanCovered
      ? 'Covered by Plan (₹0)'
      : CancellationPolicy.formatPaiseToINR(quote.amountPaise);

    const modalHtml = `
      <div class="modal-overlay active" id="modal-cancellation-confirm" onclick="if(event.target === this) MeetingRoomsModule.closeModal('modal-cancellation-confirm')" style="z-index: 1070; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); padding: 16px; animation: fadeIn 0.2s ease;">
        <div class="modal-content" style="max-width: 520px; width: 100%; border-radius: 20px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px -12px rgba(0,0,0,0.4); animation: scaleUp 0.22s ease;">
          
          <!-- Modal Header -->
          <div style="background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); color: #ffffff; padding: 20px 24px; position: relative;">
            <button class="modal-close-btn" onclick="MeetingRoomsModule.closeModal('modal-cancellation-confirm')" style="position: absolute; right: 14px; top: 14px; color: #ffffff; background: rgba(255,255,255,0.18); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 26px;">❌</span>
              <div>
                <h2 style="font-size: 19px; font-weight: 800; color: #ffffff; margin: 0;">
                  Cancel Meeting Reservation
                </h2>
                <div style="font-size: 12.5px; color: #fecaca; margin-top: 3px; font-weight: 500;">
                  Review cancellation breakdown and refund quote
                </div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto;">
            
            <!-- Reservation Summary Card -->
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 24px;">${room.icon || '🏢'}</span>
                  <div>
                    <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">${room.name}</h3>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                      ${booking.title}
                    </div>
                  </div>
                </div>
                <code style="font-size: 11.5px; color: #2563eb; background: rgba(37,99,235,0.08); padding: 3px 8px; border-radius: 6px; font-weight: 700;">${booking.id}</code>
              </div>
              <div style="display: flex; gap: 14px; margin-top: 10px; font-size: 12px; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 8px;">
                <span>📅 <strong>${booking.date}</strong></span>
                <span>•</span>
                <span>⏰ <strong>${this.formatTimeTo12Hour(booking.startTime)} – ${this.formatTimeTo12Hour(booking.endTime)}</strong></span>
                <span>•</span>
                <span>👥 <strong>${booking.attendees} Pax</strong></span>
              </div>
            </div>

            <!-- Refund Policy Ticker & Countdown Banner -->
            <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #15803d; letter-spacing: 0.04em;">
                  Anytime Cancellation Policy
                </div>
                <div style="font-size: 14px; font-weight: 800; color: #166534; margin-top: 2px;">
                  ⚡ 100% Full Refund Anytime • ${countdownLabel}
                </div>
              </div>
              <div style="text-align: right;">
                <span class="badge" style="background: #16a34a; color: #ffffff; font-size: 13px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">
                  100% Full Refund
                </span>
                <div style="font-size: 10.5px; color: #15803d; margin-top: 3px;">
                  Zero cancellation fee
                </div>
              </div>
            </div>

            <!-- Detailed Financial Breakdown -->
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px 16px;">
              <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 10px;">
                Refund Breakdown &amp; Settlement
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                  <span>Original Booking Cost:</span>
                  <strong style="color: var(--text-primary); font-family: var(--font-mono);">${originalAmountDisplay}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: #16a34a; font-weight: 700;">
                  <span>Refund (100% Full Amount):</span>
                  <span style="font-size: 15px; font-family: var(--font-mono);">+${refundAmountDisplay}</span>
                </div>
                <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 12px;">
                  <span>Cancellation Fee Kept (0%):</span>
                  <span style="font-family: var(--font-mono);">₹0.00 (Zero Fee)</span>
                </div>
                <div style="border-top: 1px dashed var(--border-medium); margin-top: 4px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
                  <span>Refund Destination:</span>
                  <strong style="color: var(--text-primary);">${quote.isPlanCovered ? 'Monthly Quota Restored' : (booking.razorpayPaymentId || quote.paymentGateway === 'Razorpay' ? 'Original Razorpay Account (Instant)' : 'Credit Note on Next Invoice')}</strong>
                </div>
              </div>
            </div>

            <div style="font-size: 11.5px; color: var(--text-muted); line-height: 1.4;">
              ⚠️ By confirming cancellation, your scheduled time slot will be immediately freed for other venture bookings. This action cannot be reversed.
            </div>
          </div>

          <!-- Footer Actions -->
          <div style="padding: 14px 24px; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 10px; align-items: center;">
            <button type="button" class="btn btn-outline" onclick="MeetingRoomsModule.closeModal('modal-cancellation-confirm')" style="font-weight: 700; font-size: 12.5px; padding: 8px 16px; border-radius: 8px;">
              Keep Reservation
            </button>
            <button type="button" id="btn-confirm-cancellation" class="btn btn-primary" onclick="MeetingRoomsModule.confirmCancellation('${roomId}', '${bookingId}')" style="background: #dc2626; border-color: #b91c1c; font-weight: 800; font-size: 12.5px; padding: 8px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);">
              Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    `;

    const mount = document.getElementById('modal-mount');
    if (mount) {
      mount.innerHTML = modalHtml;
    }
  },

  async confirmCancellation(roomId, bookingId) {
    const btn = document.getElementById('btn-confirm-cancellation');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; vertical-align: middle;"></span> Cancelling...`;
    }

    try {
      const res = await window.store.cancelBooking(roomId, bookingId);
      this.closeModal('modal-cancellation-confirm');

      if (res.success) {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(res.message || 'Cancelled. ₹900.00 will be refunded.', 'success');
        }
        this.render();
        this.refreshDashboardSummary();
        if (typeof PaymentsModule !== 'undefined' && PaymentsModule.render) {
          PaymentsModule.render();
        }
      } else {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(res.message || 'Cancellation could not be completed.', 'error');
        }
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Confirm Cancellation';
      }
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(err.message || 'An error occurred during cancellation.', 'error');
      }
    }
  },

  cancelBooking(roomId, bookingId) {
    this.openCancellationModal(roomId, bookingId);
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
