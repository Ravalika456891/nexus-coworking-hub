// Module: Workspace Management (Interactive Floor Map, Hot Desks, Dedicated Desks, Cabins, Tap-to-Book)

const WorkspaceModule = {
  activeViewMode: 'floorplan', // 'floorplan' (default per request) | 'cards'
  activeDeskFilter: 'all',    // 'all' | 'hot' | 'dedicated' | 'cabins' | 'pods'
  activeDeskStatus: 'all',    // 'all' | 'free' | 'yours' | 'taken'
  activeTypeFilter: 'all',    // For cards view inventory
  activeStatusFilter: 'all',  // For cards view inventory
  selectedDeskId: null,       // Currently tapped desk
  bookingTerm: 'daily',       // 'daily' | 'monthly'
  bookingDays: 1,             // 1, 3, 7, 14
  bookingMonths: 1,           // 1, 3, 6, 12
  highlightStartupId: null,
  waitlist: [],

  getMyStartupId() {
    if (window.store) {
      if (window.store.activeFounderId) return window.store.activeFounderId;
      if (window.store.state && window.store.state.activeStartupId) return window.store.state.activeStartupId;
    }
    if (window.App && window.App.currentStartupId) return window.App.currentStartupId;
    return 'STP-01'; // Default: NeuroPulse AI
  },

  getMyStartup() {
    const id = this.getMyStartupId();
    if (window.store && window.store.getStartupById) {
      const s = window.store.getStartupById(id);
      if (s) return s;
    }
    const all = (window.store && window.store.getStartups) ? window.store.getStartups() : [];
    const found = all.find(x => x.id === id);
    return found || { id: 'STP-01', name: 'NeuroPulse AI', logoEmoji: '🧠', founders: { name: 'Aarav Sharma' } };
  },

  getDeskStatus(space, myStartupId, myStartupName) {
    if (!space) return 'free';
    const status = (space.status || 'available').toLowerCase();
    if (status === 'available') return 'free';
    if (status === 'occupied') {
      if (space.allocatedStartupId === myStartupId || (myStartupName && space.allocatedStartupName === myStartupName)) {
        return 'yours';
      }
      return 'taken';
    }
    if (status === 'reserved') {
      if (space.allocatedStartupId === myStartupId) return 'yours';
      return 'taken';
    }
    if (status === 'maintenance') {
      return 'maintenance';
    }
    return 'free';
  },

  render() {
    const container = document.getElementById('view-workspace');
    if (!container) return;

    const stats = window.store.getWorkspaceStats();
    let workspaces = window.store.getWorkspaces();
    const spaces = window.store.getSpaces();
    const myStartup = this.getMyStartup();
    const myStartupId = myStartup.id;

    // Filter by Type for cards view
    if (this.activeTypeFilter !== 'all') {
      workspaces = workspaces.filter(w => w.type.toLowerCase() === this.activeTypeFilter.toLowerCase());
    }

    // Filter by Status for cards view
    if (this.activeStatusFilter !== 'all') {
      workspaces = workspaces.filter(w => w.status.toLowerCase() === this.activeStatusFilter.toLowerCase());
    }

    // Counts for Category Tabs (Cards View)
    const typeCounts = {
      all: window.store.getWorkspaces().length,
      cabins: window.store.getWorkspaces().filter(w => w.type === 'Private Cabin').length,
      dedicated: window.store.getWorkspaces().filter(w => w.type === 'Dedicated Desk').length,
      hot: window.store.getWorkspaces().filter(w => w.type === 'Hot Desk').length,
      meeting: window.store.getWorkspaces().filter(w => w.type === 'Meeting Room').length,
      conference: window.store.getWorkspaces().filter(w => w.type === 'Conference Room').length,
      training: window.store.getWorkspaces().filter(w => w.type === 'Training Room').length,
      events: window.store.getWorkspaces().filter(w => w.type === 'Event Space').length
    };

    container.innerHTML = `
      <!-- Workspace Management Header -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 14px;">
          <div>
            <h2 style="font-size: 21px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px; margin: 0;">
              <span>🏢 Workspaces &amp; Desks</span>
              <span class="badge badge-info" style="font-size: 11.5px; font-weight: 700;">Tap-to-Book Map</span>
            </h2>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 3px 0 0 0;">
              Visual interactive floor plan: tap any free desk, choose daily or monthly pass, and confirm with instant digital pass issuance.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- View Mode Switcher -->
            <div class="role-badge-toggle" style="background: var(--bg-surface-elevated); padding: 3px; border-radius: 10px; border: 1.5px solid var(--border-subtle); display: inline-flex;">
              <button class="role-btn ${this.activeViewMode === 'floorplan' ? 'active' : ''}" onclick="WorkspaceModule.setViewMode('floorplan')" style="font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 8px;">
                🗺️ Floor Map
              </button>
              <button class="role-btn ${this.activeViewMode === 'cards' ? 'active' : ''}" onclick="WorkspaceModule.setViewMode('cards')" style="font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 8px;">
                🗂️ Cards View
              </button>
            </div>

            <button class="btn btn-primary btn-sm" onclick="WorkspaceModule.openAddWorkspaceModal()" style="font-weight: 700; padding: 7px 14px; border-radius: 8px;">
              + Add Space
            </button>
          </div>
        </div>
      </div>

      <!-- Inventory Metrics Bar -->
      <div class="kpi-grid" style="margin-bottom: 22px;">
        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Total Units</span>
            <div class="kpi-icon-wrap" style="color: var(--accent-primary);">🏢</div>
          </div>
          <div class="kpi-value" style="font-size: 22px;">${stats.totalCount}</div>
          <div class="kpi-footer">
            <span>Across 4 Architectural Wings</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Total Seating Capacity</span>
            <div class="kpi-icon-wrap" style="color: var(--status-info);">👥</div>
          </div>
          <div class="kpi-value" style="font-size: 22px;">${stats.totalCapacity} Pax</div>
          <div class="kpi-footer">
            <span class="trend-pill up">${stats.occupiedCapacity} Pax Occupied</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Occupancy / Utilization</span>
            <div class="kpi-icon-wrap" style="color: var(--status-success);">📈</div>
          </div>
          <div class="kpi-value" style="font-size: 22px;">${stats.utilizationRate}%</div>
          <div class="kpi-footer">
            <span class="trend-pill up">${stats.occupiedCount} Units Active</span>
            <span>${stats.availableCount} Vacant</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px; border: 1.5px solid rgba(34, 197, 94, 0.3);">
          <div class="kpi-header">
            <span class="kpi-title">Vacant &amp; Ready Desks</span>
            <div class="kpi-icon-wrap" style="color: #16a34a;">⚡</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: #16a34a;">${stats.availableCount} Desks</div>
          <div class="kpi-footer">
            <span>Ready for Immediate Booking</span>
          </div>
        </div>
      </div>

      <!-- Main Content Views -->
      ${this.activeViewMode === 'floorplan' 
        ? this.renderFloorPlanView(spaces, myStartup) 
        : this.renderCardsView(workspaces, typeCounts, stats)}

      <!-- Sticky Tap-to-Book Bar (Visible when a desk is selected) -->
      ${this.renderStickyBookingBar(spaces, myStartup)}
    `;
  },

  setViewMode(mode) {
    this.activeViewMode = mode;
    this.render();
  },

  setDeskTypeFilter(filter) {
    this.activeDeskFilter = filter;
    this.render();
  },

  setDeskStatusFilter(status) {
    this.activeDeskStatus = status;
    this.render();
  },

  setTypeFilter(type) {
    this.activeTypeFilter = type;
    this.render();
  },

  setStatusFilter(status) {
    this.activeStatusFilter = status;
    this.render();
  },

  setBookingTerm(term) {
    this.bookingTerm = term;
    this.render();
  },

  setBookingDuration(val) {
    if (this.bookingTerm === 'daily') {
      this.bookingDays = parseInt(val, 10);
    } else {
      this.bookingMonths = parseInt(val, 10);
    }
    this.render();
  },

  clearDeskSelection() {
    this.selectedDeskId = null;
    this.render();
  },

  // --- Render Visual Floor Plan Map with Tap-to-Book ---
  renderFloorPlanView(spaces, myStartup) {
    const myStartupId = myStartup.id;
    const myStartupName = myStartup.name;

    // Filter spaces by Desk Category (Hot desk vs dedicated desk vs cabins vs pods)
    const hotDesks = spaces.filter(s => s.type === 'Hot Desk' || s.zone.includes('Zone A'));
    const dedicatedDesks = spaces.filter(s => s.type === 'Dedicated Desk' || s.zone.includes('Zone B'));
    const privateCabins = spaces.filter(s => s.type === 'Private Cabin' || s.zone.includes('Zone C'));
    const acousticPods = spaces.filter(s => s.type === 'Focus Booth' || s.type === 'Phone Booth' || s.zone.includes('Zone D'));

    // Compute live status counts across all spaces
    let totalFree = 0;
    let totalYours = 0;
    let totalTaken = 0;

    spaces.forEach(s => {
      const st = this.getDeskStatus(s, myStartupId, myStartupName);
      if (st === 'free') totalFree++;
      else if (st === 'yours') totalYours++;
      else if (st === 'taken') totalTaken++;
    });

    const isMatchFilter = (space) => {
      // Type filter
      if (this.activeDeskFilter === 'hot' && space.type !== 'Hot Desk' && !space.zone.includes('Zone A')) return false;
      if (this.activeDeskFilter === 'dedicated' && space.type !== 'Dedicated Desk' && !space.zone.includes('Zone B')) return false;
      if (this.activeDeskFilter === 'cabins' && space.type !== 'Private Cabin' && !space.zone.includes('Zone C')) return false;
      if (this.activeDeskFilter === 'pods' && !space.type.includes('Booth') && !space.zone.includes('Zone D')) return false;

      // Status filter
      if (this.activeDeskStatus !== 'all') {
        const st = this.getDeskStatus(space, myStartupId, myStartupName);
        if (this.activeDeskStatus === 'free' && st !== 'free') return false;
        if (this.activeDeskStatus === 'yours' && st !== 'yours') return false;
        if (this.activeDeskStatus === 'taken' && st !== 'taken') return false;
      }
      return true;
    };

    const filteredHotDesks = hotDesks.filter(isMatchFilter);
    const filteredDedicatedDesks = dedicatedDesks.filter(isMatchFilter);
    const filteredCabins = privateCabins.filter(isMatchFilter);
    const filteredPods = acousticPods.filter(isMatchFilter);

    const hasAnyResults = filteredHotDesks.length > 0 || filteredDedicatedDesks.length > 0 || filteredCabins.length > 0 || filteredPods.length > 0;

    return `
      <!-- Floor Plan Toolbar & Filters Bar -->
      <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 16px; padding: 14px 18px; margin-bottom: 22px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        
        <!-- Row 1: Hot Desk vs Dedicated Desk Filter Pills -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-right: 4px;">
              Filter Workspaces:
            </span>
            
            <button class="btn btn-sm ${this.activeDeskFilter === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskTypeFilter('all')" style="font-weight: 700; border-radius: 999px; font-size: 11.5px; padding: 4px 12px;">
              ✨ All Workspaces (${spaces.length})
            </button>

            <button class="btn btn-sm ${this.activeDeskFilter === 'hot' ? 'btn-primary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskTypeFilter('hot')" style="font-weight: 700; border-radius: 999px; font-size: 11.5px; padding: 4px 12px;">
              🔥 Hot Desks (${hotDesks.length})
            </button>

            <button class="btn btn-sm ${this.activeDeskFilter === 'dedicated' ? 'btn-primary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskTypeFilter('dedicated')" style="font-weight: 700; border-radius: 999px; font-size: 11.5px; padding: 4px 12px;">
              🖥️ Dedicated Desks (${dedicatedDesks.length})
            </button>

            <button class="btn btn-sm ${this.activeDeskFilter === 'cabins' ? 'btn-primary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskTypeFilter('cabins')" style="font-weight: 700; border-radius: 999px; font-size: 11.5px; padding: 4px 12px;">
              🏢 Private Cabins (${privateCabins.length})
            </button>

            <button class="btn btn-sm ${this.activeDeskFilter === 'pods' ? 'btn-primary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskTypeFilter('pods')" style="font-weight: 700; border-radius: 999px; font-size: 11.5px; padding: 4px 12px;">
              🎧 Acoustic Pods (${acousticPods.length})
            </button>
          </div>

          <!-- Active Venture Pill -->
          <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #1d4ed8; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); padding: 4px 12px; border-radius: 999px;">
            <span>${myStartup.logoEmoji || '🧠'}</span>
            <span>Active Team: <strong>${myStartup.name}</strong></span>
          </div>
        </div>

        <!-- Row 2: Status Legend & Real-time Filter Strip -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 10px; flex-wrap: wrap; gap: 12px;">
          <!-- Status Filter Pills -->
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-right: 2px;">
              Status Filter:
            </span>

            <button class="btn btn-sm ${this.activeDeskStatus === 'all' ? 'btn-secondary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskStatusFilter('all')" style="font-size: 11px; padding: 3px 9px; border-radius: 6px;">
              All Statuses
            </button>

            <button class="btn btn-sm ${this.activeDeskStatus === 'free' ? 'btn-primary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskStatusFilter('free')" style="font-size: 11px; padding: 3px 9px; border-radius: 6px; color: #15803d; border-color: rgba(34, 197, 94, 0.4);">
              🟢 Free to Book (${totalFree})
            </button>

            <button class="btn btn-sm ${this.activeDeskStatus === 'yours' ? 'btn-primary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskStatusFilter('yours')" style="font-size: 11px; padding: 3px 9px; border-radius: 6px; color: #1d4ed8; border-color: rgba(59, 130, 246, 0.4);">
              🔵 Booked by You (${totalYours})
            </button>

            <button class="btn btn-sm ${this.activeDeskStatus === 'taken' ? 'btn-primary' : 'btn-outline'}" onclick="WorkspaceModule.setDeskStatusFilter('taken')" style="font-size: 11px; padding: 3px 9px; border-radius: 6px; color: #dc2626; border-color: rgba(239, 68, 68, 0.4);">
              🔴 Taken (${totalTaken})
            </button>
          </div>

          <!-- Color Coding Legend (Parity with Meeting Rooms) -->
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 11.5px;">
            <div style="display: inline-flex; align-items: center; gap: 5px;">
              <span class="legend-swatch swatch-free"></span>
              <span style="color: #15803d; font-weight: 700;">🟢 Free (Tap to book)</span>
            </div>
            <div style="display: inline-flex; align-items: center; gap: 5px;">
              <span class="legend-swatch swatch-yours"></span>
              <span style="color: #1d4ed8; font-weight: 700;">🔵 Booked by You (Tap for pass)</span>
            </div>
            <div style="display: inline-flex; align-items: center; gap: 5px;">
              <span class="legend-swatch swatch-taken"></span>
              <span style="color: #dc2626; font-weight: 700;">🔴 Taken (Waitlist)</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Floor Plan Zones -->
      <div class="floorplan-container" style="background: var(--bg-surface); border: 1.5px solid var(--border-subtle); border-radius: 18px; padding: 22px; position: relative;">
        
        ${!hasAnyResults ? `
          <div style="padding: 48px 24px; text-align: center; color: var(--text-muted);">
            <div style="font-size: 36px; margin-bottom: 12px;">🔍</div>
            <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">No matching desks or workspaces found</h4>
            <p style="font-size: 13px; margin: 0 0 16px 0;">Try resetting your category or status filters to view full floor inventory.</p>
            <button class="btn btn-outline btn-sm" onclick="WorkspaceModule.setDeskTypeFilter('all'); WorkspaceModule.setDeskStatusFilter('all')" style="font-weight: 700; border-radius: 8px;">
              Reset Filters
            </button>
          </div>
        ` : ''}

        <!-- WING A: HOT DESKS -->
        ${filteredHotDesks.length > 0 ? `
          <div class="floorplan-zone-title" style="margin-top: 0;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🔥</span>
              <div>
                <strong style="font-size: 15px; color: var(--text-primary);">Wing A: Hot Desks &amp; Flex Workstations</strong>
                <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">
                  Open Coworking Commons • Plug &amp; Play • Ultra-fast Wi-Fi 7 • Cafeteria Access
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.3); font-weight: 700; font-size: 11px;">
                ₹450/day · ₹7,500/mo
              </span>
              <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">${filteredHotDesks.length} Desks</span>
            </div>
          </div>
          <div class="seats-grid">
            ${filteredHotDesks.map(desk => this.renderDeskCard(desk, myStartupId, myStartupName)).join('')}
          </div>
        ` : ''}

        <!-- WING B: DEDICATED DESKS -->
        ${filteredDedicatedDesks.length > 0 ? `
          <div class="floorplan-zone-title">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🖥️</span>
              <div>
                <strong style="font-size: 15px; color: var(--text-primary);">Wing B: Dedicated Desks &amp; Reserved Bays</strong>
                <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">
                  Fixed Ergonomic Workstations • Under-desk Lockers • High-speed LAN • 24/7 Access
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #4338ca; border: 1px solid rgba(99, 102, 241, 0.3); font-weight: 700; font-size: 11px;">
                ₹750/day · ₹12,000/mo
              </span>
              <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">${filteredDedicatedDesks.length} Desks</span>
            </div>
          </div>
          <div class="seats-grid">
            ${filteredDedicatedDesks.map(desk => this.renderDeskCard(desk, myStartupId, myStartupName)).join('')}
          </div>
        ` : ''}

        <!-- WING C: PRIVATE CABINS -->
        ${filteredCabins.length > 0 ? `
          <div class="floorplan-zone-title">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🏢</span>
              <div>
                <strong style="font-size: 15px; color: var(--text-primary);">Wing C: Soundproof Private Cabins &amp; Team Suites</strong>
                <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">
                  Acoustic Glass Walls • Private Display • Keycard Access • Dedicated Fiber Drop
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge" style="background: rgba(245, 158, 11, 0.12); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 700; font-size: 11px;">
                From ₹42,000/mo
              </span>
              <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">${filteredCabins.length} Suites</span>
            </div>
          </div>
          <div class="cabins-grid">
            ${filteredCabins.map(cabin => this.renderCabinCard(cabin, myStartupId, myStartupName)).join('')}
          </div>
        ` : ''}

        <!-- WING D: ACOUSTIC FOCUS PODS -->
        ${filteredPods.length > 0 ? `
          <div class="floorplan-zone-title">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🎧</span>
              <div>
                <strong style="font-size: 15px; color: var(--text-primary);">Wing D: Acoustic Pods &amp; Focus Calling Booths</strong>
                <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">
                  Soundproof Zen Pods • Ergonomic Stool • Active Ventilation • Internal Ring Light
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge badge-success" style="font-weight: 700; font-size: 11px;">
                Complimentary
              </span>
              <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">${filteredPods.length} Pods</span>
            </div>
          </div>
          <div class="seats-grid">
            ${filteredPods.map(pod => this.renderDeskCard(pod, myStartupId, myStartupName)).join('')}
          </div>
        ` : ''}

      </div>
    `;
  },

  // --- Render Individual Desk Card Tile with Meeting Rooms Parity Color Status ---
  renderDeskCard(desk, myStartupId, myStartupName) {
    const status = this.getDeskStatus(desk, myStartupId, myStartupName);
    const isSelected = (this.selectedDeskId === desk.id);

    // Pricing display
    const isHot = (desk.type === 'Hot Desk' || desk.id.startsWith('HD'));
    const isPod = (desk.type.includes('Booth') || desk.id.startsWith('PB'));
    const rateText = isPod ? 'Free (Included)' : isHot ? '₹450/d · ₹7.5k/m' : '₹750/d · ₹12k/m';

    // Status label & badge
    let statusBadgeHtml = '';
    if (isSelected) {
      statusBadgeHtml = `<span style="font-size: 10px; font-weight: 800; color: #15803d; background: #dcfce7; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">✓ Selected</span>`;
    } else if (status === 'free') {
      statusBadgeHtml = `<span style="font-size: 10px; font-weight: 700; color: #15803d; background: rgba(34, 197, 94, 0.12); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">🟢 Free</span>`;
    } else if (status === 'yours') {
      statusBadgeHtml = `<span style="font-size: 10px; font-weight: 700; color: #1d4ed8; background: rgba(59, 130, 246, 0.12); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">🎟️ Booked by you</span>`;
    } else if (status === 'taken') {
      const occupant = desk.allocatedStartupName || 'Reserved';
      statusBadgeHtml = `<span style="font-size: 10px; font-weight: 700; color: #dc2626; background: rgba(239, 68, 68, 0.1); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="Occupied by ${occupant}">🔴 Taken</span>`;
    } else if (status === 'maintenance') {
      statusBadgeHtml = `<span style="font-size: 10px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">⚪ Service</span>`;
    }

    return `
      <div class="desk-card status-${status} ${isSelected ? 'selected' : ''}" 
           id="desk-tile-${desk.id}"
           onclick="WorkspaceModule.handleDeskClick('${desk.id}')"
           title="${status === 'free' ? 'Tap to book daily or monthly' : status === 'yours' ? 'Tap to view your digital desk pass' : 'Tap to join waitlist'}">
        
        <div class="desk-header">
          <span class="desk-id" style="display: flex; align-items: center; gap: 4px;">
            <span>${isPod ? '🎧' : isHot ? '🔥' : '🖥️'}</span>
            <span>${desk.id}</span>
          </span>
          <span class="desk-type-tag">${desk.capacity || 1} Pax</span>
        </div>

        <div style="margin: 2px 0;">
          ${statusBadgeHtml}
        </div>

        <div class="desk-occupant" style="font-size: 11px;">
          ${status === 'free' ? '<span style="color: #15803d; font-weight: 600;">Tap to Reserve</span>' : 
            status === 'yours' ? `<span style="color: #1d4ed8; font-weight: 700;">★ ${myStartupName}</span>` : 
            status === 'taken' ? `<span style="color: #991b1b; font-weight: 600;">${desk.allocatedStartupName || 'Occupied'}</span>` : 
            'Maintenance'}
        </div>

        <div class="desk-rate" style="font-size: 10.5px; margin-top: auto; padding-top: 4px; border-top: 1px dashed rgba(0,0,0,0.06);">
          ${rateText}
        </div>
      </div>
    `;
  },

  // --- Render Cabin Card Tile ---
  renderCabinCard(cabin, myStartupId, myStartupName) {
    const status = this.getDeskStatus(cabin, myStartupId, myStartupName);
    const isSelected = (this.selectedDeskId === cabin.id);

    return `
      <div class="cabin-card status-${status} ${isSelected ? 'selected' : ''}" 
           id="cabin-tile-${cabin.id}"
           onclick="WorkspaceModule.handleDeskClick('${cabin.id}')"
           title="${status === 'free' ? 'Tap to reserve this suite' : status === 'yours' ? 'Tap to view cabin pass' : 'Occupied by ' + (cabin.allocatedStartupName || 'Tenant')}">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <h4 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 0;">${cabin.label}</h4>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${cabin.capacity} Workstations Suite</div>
          </div>
          <div>
            ${isSelected ? `
              <span class="badge badge-success" style="font-size: 10px; font-weight: 800;">✓ Selected</span>
            ` : status === 'free' ? `
              <span class="badge badge-success" style="font-size: 10px; font-weight: 800;">🟢 Free</span>
            ` : status === 'yours' ? `
              <span class="badge badge-primary" style="font-size: 10px; font-weight: 800;">🔵 Booked by you</span>
            ` : `
              <span class="badge" style="background: #fef2f2; color: #dc2626; border: 1.5px solid #fca5a5; font-size: 10px; font-weight: 800;">🔴 Taken</span>
            `}
          </div>
        </div>

        <div style="font-size: 12px; margin-bottom: 8px; font-weight: 600;">
          ${status === 'free' ? `<span style="color: #15803d;">Ready for immediate move-in</span>` : 
            status === 'yours' ? `<span style="color: #1d4ed8;">Tenant: ★ ${myStartupName}</span>` : 
            `<span style="color: #991b1b;">Tenant: ${cabin.allocatedStartupName || 'Incubated Startup'}</span>`}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; font-family: var(--font-mono); color: var(--text-muted); border-top: 1px dashed var(--border-subtle); padding-top: 6px;">
          <span>₹${(cabin.monthlyRate || 42000).toLocaleString('en-IN')}/mo</span>
          <span style="font-size: 11px; color: var(--accent-primary); font-weight: 700;">
            ${status === 'free' ? 'Tap to Lock In ➔' : status === 'yours' ? 'View Pass 🎫' : 'Waitlist 🔔'}
          </span>
        </div>
      </div>
    `;
  },

  // --- Desk Tap Handler (Meeting Rooms Parity) ---
  handleDeskClick(deskId) {
    const space = window.store.getSpaceById(deskId);
    if (!space) return;

    const myStartup = this.getMyStartup();
    const status = this.getDeskStatus(space, myStartup.id, myStartup.name);

    if (status === 'free') {
      // Toggle selection for tap-to-book
      if (this.selectedDeskId === deskId) {
        this.selectedDeskId = null;
      } else {
        this.selectedDeskId = deskId;
        // Default term for Hot Desk or Dedicated Desk
        if (space.type === 'Private Cabin') {
          this.bookingTerm = 'monthly';
        }
      }
      this.render();
      if (this.selectedDeskId) {
        App.showToast(`Selected ${space.label}. Choose daily or monthly in the booking bar below.`, 'info');
      }
    } else if (status === 'yours') {
      // Open digital pass for booked desk
      this.openDeskPassModal(deskId);
    } else if (status === 'taken') {
      // Open waitlist / occupant modal
      this.openDeskWaitlistModal(deskId);
    } else if (status === 'maintenance') {
      App.showToast(`Desk ${space.label} is currently undergoing scheduled electrical inspection.`, 'warning');
    }
  },

  // --- Sticky Tap-to-Book Bar (Parity with Meeting Rooms Sticky Bar) ---
  renderStickyBookingBar(spaces, myStartup) {
    if (!this.selectedDeskId) return '';

    const desk = window.store.getSpaceById(this.selectedDeskId);
    if (!desk) return '';

    const isHot = (desk.type === 'Hot Desk' || desk.id.startsWith('HD'));
    const isCabin = (desk.type === 'Private Cabin' || desk.id.startsWith('PC'));
    const isPod = (desk.type.includes('Booth') || desk.id.startsWith('PB'));

    // Rates
    const dailyRate = isHot ? 450 : isCabin ? 2500 : 750;
    const monthlyRate = desk.monthlyRate || (isHot ? 7500 : 12000);

    // Compute dynamic total
    let totalAmount = 0;
    let durationLabel = '';

    if (isPod) {
      totalAmount = 0;
      durationLabel = 'Complimentary (Incubated Founder)';
    } else if (this.bookingTerm === 'daily') {
      totalAmount = dailyRate * this.bookingDays;
      durationLabel = `${this.bookingDays} Day${this.bookingDays > 1 ? 's' : ''} (₹${dailyRate}/day)`;
    } else {
      totalAmount = monthlyRate * this.bookingMonths;
      durationLabel = `${this.bookingMonths} Month${this.bookingMonths > 1 ? 's' : ''} (₹${monthlyRate.toLocaleString('en-IN')}/mo)`;
    }

    return `
      <div id="sticky-booking-bar" class="sticky-booking-bar" style="max-width: 920px;">
        <div class="sticky-booking-info" style="gap: 16px;">
          <!-- Desk Identity Pill -->
          <div class="sticky-room-badge" style="background: rgba(34, 197, 94, 0.12); color: #15803d; border-color: rgba(34, 197, 94, 0.35);">
            <span>${isCabin ? '🏢' : isPod ? '🎧' : isHot ? '🔥' : '🖥️'}</span>
            <strong>${desk.label || desk.id}</strong>
            <span style="font-size: 11px; opacity: 0.85;">(${desk.type})</span>
          </div>

          <!-- Daily vs Monthly Switcher (User explicit requirement) -->
          ${!isPod ? `
            <div style="display: inline-flex; align-items: center; gap: 4px; background: var(--bg-surface-elevated); padding: 3px; border-radius: 9px; border: 1px solid var(--border-subtle);">
              <button type="button" 
                      class="term-pill-btn ${this.bookingTerm === 'daily' ? 'active' : ''}" 
                      onclick="WorkspaceModule.setBookingTerm('daily')"
                      title="Switch to daily pass rate">
                📅 Daily Pass
              </button>
              <button type="button" 
                      class="term-pill-btn ${this.bookingTerm === 'monthly' ? 'active' : ''}" 
                      onclick="WorkspaceModule.setBookingTerm('monthly')"
                      title="Switch to monthly lease rate">
                📆 Monthly Lease
              </button>
            </div>

            <!-- Quick Duration Chips -->
            <div style="display: inline-flex; align-items: center; gap: 4px;">
              ${this.bookingTerm === 'daily' ? `
                ${[1, 3, 7, 14].map(d => `
                  <button type="button" 
                          onclick="WorkspaceModule.setBookingDuration(${d})" 
                          style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid ${this.bookingDays === d ? 'var(--accent-primary)' : 'var(--border-subtle)'}; background: ${this.bookingDays === d ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)'}; color: ${this.bookingDays === d ? 'var(--accent-primary)' : 'var(--text-secondary)'}; cursor: pointer;">
                    ${d}d
                  </button>
                `).join('')}
              ` : `
                ${[1, 3, 6, 12].map(m => `
                  <button type="button" 
                          onclick="WorkspaceModule.setBookingDuration(${m})" 
                          style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid ${this.bookingMonths === m ? 'var(--accent-primary)' : 'var(--border-subtle)'}; background: ${this.bookingMonths === m ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)'}; color: ${this.bookingMonths === m ? 'var(--accent-primary)' : 'var(--text-secondary)'}; cursor: pointer;">
                    ${m}mo
                  </button>
                `).join('')}
              `}
            </div>
          ` : ''}

          <!-- Live Pricing Breakdown -->
          <div class="sticky-details">
            <span style="font-size: 12px; color: var(--text-muted);">${durationLabel}</span>
            <span style="color: var(--border-medium);">·</span>
            <span class="badge badge-success" style="font-size: 12.5px; padding: 4px 10px; font-weight: 800;">
              Total: ₹${totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <!-- Sticky Actions -->
        <div class="sticky-booking-actions">
          <button type="button" class="btn btn-outline btn-sm" onclick="WorkspaceModule.clearDeskSelection()" style="font-size: 12px; padding: 7px 14px; border-radius: 8px;">
            ✕ Clear
          </button>
          <button type="button" class="btn btn-primary" onclick="WorkspaceModule.openDeskConfirmModal('${desk.id}')" style="background: #16a34a; border-color: #15803d; font-weight: 800; font-size: 13px; padding: 8px 20px; border-radius: 8px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); display: inline-flex; align-items: center; gap: 6px;">
            <span>Confirm Booking</span> ➔
          </button>
        </div>
      </div>
    `;
  },

  // --- Step 2: Confirmation Modal (Meeting Rooms Parity) ---
  openDeskConfirmModal(deskId) {
    const desk = window.store.getSpaceById(deskId);
    if (!desk) return;

    const myStartup = this.getMyStartup();
    const isHot = (desk.type === 'Hot Desk' || desk.id.startsWith('HD'));
    const isCabin = (desk.type === 'Private Cabin' || desk.id.startsWith('PC'));
    const isPod = (desk.type.includes('Booth') || desk.id.startsWith('PB'));

    const dailyRate = isHot ? 450 : isCabin ? 2500 : 750;
    const monthlyRate = desk.monthlyRate || (isHot ? 7500 : 12000);

    const term = isPod ? 'free' : this.bookingTerm;
    const durationCount = isPod ? 1 : (term === 'daily' ? this.bookingDays : this.bookingMonths);
    const totalAmount = isPod ? 0 : (term === 'daily' ? dailyRate * durationCount : monthlyRate * durationCount);

    const todayStr = new Date().toISOString().split('T')[0];

    const modalHtml = `
      <div class="modal-overlay active" id="modal-confirm-desk" onclick="if(event.target===this) WorkspaceModule.closeModal('modal-confirm-desk')" style="z-index: 1050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); padding: 16px;">
        <div class="modal-content" style="max-width: 520px; width: 100%; border-radius: 18px; background: var(--bg-surface); color: var(--text-primary); border: 1.5px solid var(--border-medium); display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-xl); animation: scaleUp 0.2s ease;">
          
          <!-- Modal Header -->
          <div class="modal-header" style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🔒</span>
              <div>
                <h3 style="font-size: 15.5px; font-weight: 800; margin: 0; color: var(--text-primary);">Confirm Desk Reservation</h3>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">Step 2 of 2: Finalize booking term &amp; member pass</div>
              </div>
            </div>
            <button class="modal-close-btn" onclick="WorkspaceModule.closeModal('modal-confirm-desk')">&times;</button>
          </div>

          <!-- Modal Body Form -->
          <form id="form-confirm-desk" onsubmit="WorkspaceModule.submitDeskConfirmation(event, '${desk.id}')" style="display: flex; flex-direction: column; margin: 0;">
            <div class="modal-body" style="padding: 16px 20px; display: flex; flex-direction: column; gap: 14px;">
              
              <!-- Desk Identity Card -->
              <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 12px; padding: 14px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">${isCabin ? '🏢' : isPod ? '🎧' : isHot ? '🔥' : '🖥️'}</span>
                    <strong style="font-size: 15px; color: var(--text-primary);">${desk.label || desk.id}</strong>
                  </div>
                  <span class="badge badge-success" style="font-weight: 800; font-size: 11.5px;">
                    ${isPod ? 'Complimentary' : `Total: ₹${totalAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 3px;">
                  <div>📍 Location: <strong>${desk.zone}</strong></div>
                  <div>📋 Type: <strong>${desk.type} (${desk.capacity || 1} Pax)</strong></div>
                  <div>📆 Term: <strong>${term === 'daily' ? `Daily Pass (${durationCount} Days)` : `Monthly Lease (${durationCount} Months)`}</strong></div>
                </div>
              </div>

              <!-- Team Member Name -->
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12px; margin-bottom: 4px; display: block;">
                  Assigned Team Member / Founder Name <span class="required-star">*</span>
                </label>
                <input type="text" id="confirm-desk-member-name" class="form-control" required value="${(myStartup.founders && myStartup.founders.name) || 'Aarav Sharma'}" placeholder="e.g. Aarav Sharma (Lead Engineer)" style="font-size: 12.5px; padding: 8px 12px; border-radius: 8px;">
              </div>

              <!-- Start Date Picker -->
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12px; margin-bottom: 4px; display: block;">
                  Start Date <span class="required-star">*</span>
                </label>
                <input type="date" id="confirm-desk-start-date" class="form-control" required value="${todayStr}" style="font-size: 12.5px; padding: 8px 12px; border-radius: 8px;">
              </div>

              <!-- Pricing Summary Breakdown Table -->
              <div style="background: rgba(34, 197, 94, 0.06); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 10px; padding: 10px 14px; font-size: 11.5px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--text-secondary);">Base Rate:</span>
                  <strong>${term === 'daily' ? `₹${dailyRate}/day` : `₹${monthlyRate.toLocaleString('en-IN')}/month`}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--text-secondary);">Duration:</span>
                  <strong>${durationCount} ${term === 'daily' ? 'Day' + (durationCount > 1 ? 's' : '') : 'Month' + (durationCount > 1 ? 's' : '')}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(34, 197, 94, 0.3); padding-top: 5px; margin-top: 5px; font-weight: 800; font-size: 13px; color: #15803d;">
                  <span>Net Total Due:</span>
                  <span>₹${totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                <span>💡</span>
                <span>Upon confirmation, a Digital Desk Pass with 4-digit locker PIN and Wi-Fi credentials is issued immediately.</span>
              </div>

            </div>

            <!-- Sticky Modal Footer -->
            <div style="padding: 12px 20px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; gap: 10px; justify-content: flex-end; align-items: center;">
              <button type="button" class="btn btn-outline" onclick="WorkspaceModule.closeModal('modal-confirm-desk')" style="padding: 8px 14px; border-radius: 8px; font-size: 12px;">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" style="background: #16a34a; border-color: #15803d; font-weight: 800; font-size: 12.5px; padding: 8px 18px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
                <span>Confirm &amp; Issue Desk Pass</span> 🔒
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = modalHtml;
  },

  submitDeskConfirmation(e, deskId) {
    e.preventDefault();
    const desk = window.store.getSpaceById(deskId);
    if (!desk) return;

    const myStartup = this.getMyStartup();
    const memberName = document.getElementById('confirm-desk-member-name')?.value || (myStartup.founders && myStartup.founders.name) || myStartup.name;
    const startDate = document.getElementById('confirm-desk-start-date')?.value || new Date().toISOString().split('T')[0];

    const isHot = (desk.type === 'Hot Desk' || desk.id.startsWith('HD'));
    const isCabin = (desk.type === 'Private Cabin' || desk.id.startsWith('PC'));
    const isPod = (desk.type.includes('Booth') || desk.id.startsWith('PB'));

    const dailyRate = isHot ? 450 : isCabin ? 2500 : 750;
    const monthlyRate = desk.monthlyRate || (isHot ? 7500 : 12000);
    const term = isPod ? 'free' : this.bookingTerm;
    const durationCount = isPod ? 1 : (term === 'daily' ? this.bookingDays : this.bookingMonths);
    const totalAmount = isPod ? 0 : (term === 'daily' ? dailyRate * durationCount : monthlyRate * durationCount);

    const bookingId = `DSK-${Math.floor(10000 + Math.random() * 90000)}`;
    const accessPin = Math.floor(1000 + Math.random() * 9000).toString();

    // Allocate in store
    const res = window.store.allocateSpace(deskId, myStartup.id, {
      term,
      duration: durationCount,
      startDate,
      memberName,
      totalAmount,
      bookingId,
      accessPin
    });

    this.closeModal('modal-confirm-desk');
    this.selectedDeskId = null;

    if (res.success) {
      App.showToast(`🎉 Desk ${desk.label} confirmed for ${myStartup.name}!`, 'success');
      this.render();
      if (window.DashboardModule && window.DashboardModule.render) {
        window.DashboardModule.render();
      }
      // Open Digital Desk Pass immediately
      this.openDeskPassModal(deskId);
    } else {
      App.showToast(`❌ ${res.message}`, 'danger');
    }
  },

  // --- Digital Desk Pass Modal (For Blue Desks) ---
  openDeskPassModal(deskId) {
    const space = window.store.getSpaceById(deskId);
    if (!space) return;

    const myStartup = this.getMyStartup();
    const isMine = (space.allocatedStartupId === myStartup.id || space.allocatedStartupName === myStartup.name);
    const tenantName = space.allocatedStartupName || myStartup.name;
    const memberName = space.allocatedMemberName || (myStartup.founders && myStartup.founders.name) || tenantName;
    const bookingId = space.bookingId || `DSK-${Math.floor(10000 + Math.random() * 90000)}`;
    const accessPin = space.accessPin || '4821';
    const term = space.bookingTerm || 'monthly';
    const duration = space.duration || 1;
    const sinceDate = space.allocatedSince || new Date().toISOString().split('T')[0];

    const modalHtml = `
      <div class="modal-overlay active" id="modal-desk-pass" onclick="if(event.target===this) WorkspaceModule.closeModal('modal-desk-pass')" style="z-index: 1050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); padding: 16px;">
        <div class="modal-content" style="max-width: 500px; width: 100%; border-radius: 18px; background: var(--bg-surface); color: var(--text-primary); border: 2px solid #3b82f6; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.25); animation: scaleUp 0.2s ease;">
          
          <!-- Pass Header Strip -->
          <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); color: #ffffff; padding: 18px 22px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; opacity: 0.85;">
                Nexus Innovation Hub • Desk Reservation Details
              </div>
              <h3 style="font-size: 18px; font-weight: 800; margin: 4px 0 0 0; color: #ffffff;">
                ${space.label || space.id}
              </h3>
              <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
                ${space.zone} • ${space.type}
              </div>
            </div>
            <button class="modal-close-btn" onclick="WorkspaceModule.closeModal('modal-desk-pass')" style="color: #ffffff; background: rgba(255,255,255,0.2); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;">&times;</button>
          </div>

          <!-- Pass Body -->
          <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px dashed var(--border-subtle); padding-bottom: 12px;">
              <div>
                <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Assigned Venture</span>
                <div style="font-size: 15px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <span>🧠</span> <span>${tenantName}</span>
                </div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Reservation ID</span>
                <div style="font-size: 13px; font-family: var(--font-mono); font-weight: 800; color: #2563eb; margin-top: 2px;">
                  ${bookingId}
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
              <div>
                <span style="font-size: 11px; color: var(--text-muted);">Assigned Member:</span>
                <div style="font-weight: 700; color: var(--text-primary); margin-top: 1px;">${memberName}</div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--text-muted);">Booking Term:</span>
                <div style="font-weight: 700; color: var(--text-primary); margin-top: 1px; text-transform: capitalize;">
                  ${term} (${duration} ${term === 'daily' ? 'Days' : 'Months'})
                </div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--text-muted);">Valid From:</span>
                <div style="font-weight: 700; color: var(--text-primary); margin-top: 1px;">${sinceDate}</div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--text-muted);">Status:</span>
                <div style="font-weight: 800; color: #16a34a; margin-top: 1px;">● Active Reservation</div>
              </div>
            </div>

            <!-- Access Credentials Box -->
            <div style="background: var(--bg-surface-elevated); border: 1.5px solid var(--border-subtle); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Door &amp; Locker PIN</div>
                <div style="font-size: 24px; font-family: var(--font-mono); font-weight: 900; letter-spacing: 0.2em; color: #2563eb; margin-top: 2px;">
                  ${accessPin}
                </div>
                <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">Keypad PIN for under-desk pedestal &amp; wing portal</div>
              </div>

              <!-- QR Code Mock Graphic -->
              <div style="background: #ffffff; padding: 6px; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column; align-items: center;">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="#0f172a">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm10 0h2v2h-2v-2zm4 0h4v2h-4v-2zm0 4h2v2h-2v-2zm-4 2h2v2h-2v-2zm6-2h2v4h-2v-4zm-2-4h2v2h-2v-2zm-4 0h2v2h-2v-2z"/>
                </svg>
                <span style="font-size: 9px; font-weight: 700; color: #64748b; margin-top: 2px;">NFC / SCAN</span>
              </div>
            </div>

            <div style="font-size: 11.5px; color: var(--text-secondary); background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
              <span>📶</span>
              <div>
                <strong>Wi-Fi 7:</strong> <code>Nexus-Founders-HighSpeed</code> • Key: <code>Innovation#2026</code>
              </div>
            </div>

          </div>

          <!-- Pass Actions Footer -->
          <div style="padding: 12px 20px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            ${isMine ? `
              <button type="button" class="btn btn-outline btn-sm" onclick="WorkspaceModule.openDeallocateModal('${space.id}')" style="color: #dc2626; border-color: rgba(239, 68, 68, 0.4); font-size: 11.5px; padding: 6px 12px; border-radius: 8px;">
                🔄 Release Desk
              </button>
            ` : '<span></span>'}

            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="window.print()" style="font-size: 11.5px; padding: 6px 12px; border-radius: 8px;">
                🖨️ Print Details
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="WorkspaceModule.closeModal('modal-desk-pass')" style="font-size: 11.5px; padding: 6px 16px; border-radius: 8px;">
                Done
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = modalHtml;
  },

  // --- Desk Waitlist Modal (For Red / Taken Desks) ---
  openDeskWaitlistModal(deskId) {
    const space = window.store.getSpaceById(deskId);
    if (!space) return;

    const myStartup = this.getMyStartup();
    const occupant = space.allocatedStartupName || 'Incubated Venture';
    const sinceDate = space.allocatedSince || '2026-01-15';

    const modalHtml = `
      <div class="modal-overlay active" id="modal-desk-waitlist" onclick="if(event.target===this) WorkspaceModule.closeModal('modal-desk-waitlist')" style="z-index: 1050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); padding: 16px;">
        <div class="modal-content" style="max-width: 480px; width: 100%; border-radius: 18px; background: var(--bg-surface); color: var(--text-primary); border: 1.5px solid #fca5a5; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-xl); animation: scaleUp 0.2s ease;">
          
          <div class="modal-header" style="background: rgba(239, 68, 68, 0.08); border-bottom: 1px solid rgba(239, 68, 68, 0.25); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🔴</span>
              <div>
                <h3 style="font-size: 15.5px; font-weight: 800; margin: 0; color: #991b1b;">
                  ${space.label || space.id} — Currently Occupied
                </h3>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 1px;">Join waitlist to receive instant alert when freed up</div>
              </div>
            </div>
            <button class="modal-close-btn" onclick="WorkspaceModule.closeModal('modal-desk-waitlist')">&times;</button>
          </div>

          <form onsubmit="WorkspaceModule.submitWaitlist(event, '${space.id}')" style="display: flex; flex-direction: column; margin: 0;">
            <div class="modal-body" style="padding: 16px 20px; display: flex; flex-direction: column; gap: 14px;">
              
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 14px; font-size: 12.5px;">
                <div style="margin-bottom: 4px;">Current Occupant: <strong style="color: #991b1b;">${occupant}</strong></div>
                <div style="margin-bottom: 4px; color: var(--text-secondary);">Location: <strong>${space.zone}</strong></div>
                <div style="color: var(--text-muted);">Occupied Since: <strong>${sinceDate}</strong></div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12px; margin-bottom: 4px; display: block;">
                  Your Name / Startup
                </label>
                <input type="text" id="waitlist-name" class="form-control" required value="${myStartup.name} (${(myStartup.founders && myStartup.founders.name) || 'Founder'})" style="font-size: 12.5px; padding: 8px 12px; border-radius: 8px;">
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12px; margin-bottom: 4px; display: block;">
                  Notification Email / WhatsApp
                </label>
                <input type="text" id="waitlist-contact" class="form-control" required value="${(myStartup.founders && myStartup.founders.email) || 'founder@startup.io'}" style="font-size: 12.5px; padding: 8px 12px; border-radius: 8px;">
              </div>

              <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #92400e;">
                🔔 You will receive high-priority automated notification the moment this desk or cabin is marked available.
              </div>

            </div>

            <div style="padding: 12px 20px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn btn-outline" onclick="WorkspaceModule.closeModal('modal-desk-waitlist')" style="font-size: 12px; padding: 8px 14px; border-radius: 8px;">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" style="background: #ef4444; border-color: #dc2626; font-weight: 800; font-size: 12.5px; padding: 8px 18px; border-radius: 8px;">
                🔔 Join Priority Waitlist
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = modalHtml;
  },

  submitWaitlist(e, deskId) {
    e.preventDefault();
    const space = window.store.getSpaceById(deskId);
    const label = space ? space.label : deskId;
    this.closeModal('modal-desk-waitlist');
    App.showToast(`🔔 Added to waitlist for ${label}! You will be alerted upon deallocation.`, 'success');
  },

  // --- Render Cards View (Secondary View Mode) ---
  renderCardsView(workspaces, typeCounts, stats) {
    return `
      <!-- Category Filter Tabs Bar (All 7 types requested by user) -->
      <div style="background: var(--bg-surface); padding: 12px 18px; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); margin-bottom: 22px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-right: 6px;">Category:</span>
          
          <button class="btn btn-sm ${this.activeTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkspaceModule.setTypeFilter('all')">
            All Spaces (${typeCounts.all})
          </button>
          <button class="btn btn-sm ${this.activeTypeFilter === 'private cabin' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkspaceModule.setTypeFilter('private cabin')">
            Private Cabins (${typeCounts.cabins})
          </button>
          <button class="btn btn-sm ${this.activeTypeFilter === 'dedicated desk' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkspaceModule.setTypeFilter('dedicated desk')">
            Dedicated Desks (${typeCounts.dedicated})
          </button>
          <button class="btn btn-sm ${this.activeTypeFilter === 'hot desk' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkspaceModule.setTypeFilter('hot desk')">
            Hot Desks (${typeCounts.hot})
          </button>
          <button class="btn btn-sm ${this.activeTypeFilter === 'meeting room' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkspaceModule.setTypeFilter('meeting room')">
            Meeting Rooms (${typeCounts.meeting})
          </button>
          <button class="btn btn-sm ${this.activeTypeFilter === 'conference room' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkspaceModule.setTypeFilter('conference room')">
            Conference Rooms (${typeCounts.conference})
          </button>
          <button class="btn btn-sm ${this.activeTypeFilter === 'training room' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkspaceModule.setTypeFilter('training room')">
            Training Rooms (${typeCounts.training})
          </button>
          <button class="btn btn-sm ${this.activeTypeFilter === 'event space' ? 'btn-primary' : 'btn-secondary'}" onclick="WorkspaceModule.setTypeFilter('event space')">
            Event Spaces (${typeCounts.events})
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">Status:</span>
            <button class="btn btn-sm ${this.activeStatusFilter === 'all' ? 'btn-outline' : 'btn-secondary'}" style="font-size: 11px; padding: 3px 8px;" onclick="WorkspaceModule.setStatusFilter('all')">
              All Statuses
            </button>
            <button class="btn btn-sm ${this.activeStatusFilter === 'available' ? 'btn-outline' : 'btn-secondary'}" style="font-size: 11px; padding: 3px 8px; color: var(--status-success);" onclick="WorkspaceModule.setStatusFilter('available')">
              ● Available (${stats.availableCount})
            </button>
            <button class="btn btn-sm ${this.activeStatusFilter === 'occupied' ? 'btn-outline' : 'btn-secondary'}" style="font-size: 11px; padding: 3px 8px; color: var(--accent-primary);" onclick="WorkspaceModule.setStatusFilter('occupied')">
              ● Occupied (${stats.occupiedCount})
            </button>
            <button class="btn btn-sm ${this.activeStatusFilter === 'reserved' ? 'btn-outline' : 'btn-secondary'}" style="font-size: 11px; padding: 3px 8px; color: var(--status-warning);" onclick="WorkspaceModule.setStatusFilter('reserved')">
              ● Reserved (${stats.reservedCount})
            </button>
            <button class="btn btn-sm ${this.activeStatusFilter === 'maintenance' ? 'btn-outline' : 'btn-secondary'}" style="font-size: 11px; padding: 3px 8px; color: var(--text-muted);" onclick="WorkspaceModule.setStatusFilter('maintenance')">
              ● Maintenance (${stats.maintenanceCount})
            </button>
          </div>

          <span style="font-size: 12px; color: var(--text-muted);">
            Showing <strong>${workspaces.length}</strong> matching workspaces
          </span>
        </div>
      </div>

      ${workspaces.length === 0 ? `
        <div style="background: var(--bg-surface); padding: 50px; text-align: center; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); color: var(--text-muted);">
          No workspaces found matching the selected filters.
        </div>
      ` : `
        <div class="grid-3col">
          ${workspaces.map(ws => this.renderWorkspaceCard(ws)).join('')}
        </div>
      `}
    `;
  },

  renderWorkspaceCard(ws) {
    const isHighlighted = this.highlightStartupId && ws.allocatedStartupId === this.highlightStartupId;
    const highlightStyle = isHighlighted ? 'box-shadow: 0 0 0 3px #10b981; transform: scale(1.02);' : '';
    const statusClass = this.getStatusBadgeClass(ws.status);
    const icon = this.getTypeIcon(ws.type);

    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 14px; position: relative; ${highlightStyle}">
        <div>
          <div style="display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 10px; border-bottom: 2px solid var(--border-subtle); margin-bottom: 12px;">
            <div>
              <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
                Workspace
              </div>
              <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin-top: 2px; display: flex; align-items: center; gap: 8px;">
                <span>${icon}</span>
                <span>${ws.code}</span>
              </h3>
            </div>
            <span class="badge ${statusClass}" style="font-size: 11.5px; font-weight: 700;">
              ${ws.status}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Type:</span>
              <strong style="color: var(--text-primary);">${ws.type}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Capacity:</span>
              <strong style="color: var(--text-primary);">${ws.capacity} Pax</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Rent / Rate:</span>
              <strong style="color: var(--accent-primary); font-family: var(--font-mono);">${ws.rateDisplay}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Wing:</span>
              <span style="color: var(--text-primary); font-size: 12px;">${ws.zone || 'Main Wing'}</span>
            </div>

            ${ws.status === 'Occupied' ? `
              <div style="background: rgba(37, 99, 235, 0.08); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid rgba(37, 99, 235, 0.2); margin-top: 4px;">
                <div style="font-size: 11px; color: var(--text-muted);">Current Occupant:</div>
                <div style="font-weight: 700; color: #2563eb;">${ws.currentOccupant || 'Incubated Startup'}</div>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
          ${ws.status === 'Available' ? `
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="WorkspaceModule.openAllocateModal('${ws.id}')">
              Allocate
            </button>
          ` : ws.status === 'Occupied' ? `
            <button class="btn btn-outline btn-sm" style="flex: 1; color: var(--status-danger);" onclick="WorkspaceModule.openDeallocateModal('${ws.id}')">
              Release
            </button>
          ` : `
            <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="WorkspaceModule.toggleStatus('${ws.id}', 'Available')">
              Mark Available
            </button>
          `}
          <button class="btn btn-secondary btn-sm" onclick="WorkspaceModule.openEditModal('${ws.id}')">
            ✏️
          </button>
        </div>
      </div>
    `;
  },

  getTypeIcon(type) {
    switch (type) {
      case 'Private Cabin': return '🏢';
      case 'Dedicated Desk': return '🖥️';
      case 'Hot Desk': return '💻';
      case 'Meeting Room': return '🚪';
      case 'Conference Room': return '🎤';
      case 'Training Room': return '🎓';
      case 'Event Space': return '🎪';
      default: return '📍';
    }
  },

  getStatusBadgeClass(status) {
    switch (status) {
      case 'Available': return 'badge-success';
      case 'Occupied': return 'badge-info';
      case 'Reserved': return 'badge-warning';
      case 'Maintenance': return 'badge-subtle';
      default: return 'badge-subtle';
    }
  },

  // --- Add Workspace Modal ---
  openAddWorkspaceModal() {
    const html = `
      <div class="modal-overlay active" id="modal-add-ws">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">🏢 Add New Workspace Resource</h3>
            <button class="modal-close-btn" onclick="WorkspaceModule.closeModal('modal-add-ws')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="WorkspaceModule.handleAddWorkspaceSubmit(event)">
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Workspace Category <span class="required-star">*</span></label>
                  <select name="type" class="form-control" id="ws-type-select" onchange="WorkspaceModule.handleTypeSelectChange(this.value)" required>
                    <option value="Private Cabin">Private Cabin</option>
                    <option value="Dedicated Desk">Dedicated Desk</option>
                    <option value="Hot Desk">Hot Desk</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Conference Room">Conference Room</option>
                    <option value="Training Room">Training Room</option>
                    <option value="Event Space">Event Space</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Identifier / Code <span class="required-star">*</span></label>
                  <input type="text" name="code" class="form-control" placeholder="e.g. Cabin A-103 or Room M-03" required>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Seating Capacity (Pax) <span class="required-star">*</span></label>
                  <input type="number" name="capacity" class="form-control" min="1" max="500" value="10" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Pricing Type <span class="required-star">*</span></label>
                  <select name="pricingType" id="ws-pricing-type" class="form-control" required>
                    <option value="monthly">Monthly Rent (₹/month)</option>
                    <option value="hourly">Hourly Rate (₹/hour)</option>
                  </select>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Rate / Rent (₹) <span class="required-star">*</span></label>
                  <input type="number" name="rate" class="form-control" min="0" step="50" placeholder="e.g. 25000" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Wing / Floor Location</label>
                  <input type="text" name="zone" class="form-control" placeholder="e.g. Wing A: Executive Level" value="Wing A: Executive Level">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Amenities &amp; Equipment (comma separated)</label>
                <input type="text" name="amenities" class="form-control" placeholder="e.g. Ergonomic Chairs, 4K Smart Display, Whiteboard, High-speed LAN">
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="WorkspaceModule.closeModal('modal-add-ws')">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Workspace</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleTypeSelectChange(type) {
    const pricingSelect = document.getElementById('ws-pricing-type');
    if (pricingSelect) {
      if (type.includes('Desk') || type.includes('Cabin')) {
        pricingSelect.value = 'monthly';
      } else {
        pricingSelect.value = 'hourly';
      }
    }
  },

  handleAddWorkspaceSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    const created = window.store.addWorkspace(data);
    this.closeModal('modal-add-ws');
    App.showToast(`✅ Created ${created.code} (${created.type})!`, 'success');
    this.render();
    if (window.DashboardModule && window.DashboardModule.render) {
      window.DashboardModule.render();
    }
  },

  // --- Edit Workspace Modal ---
  openEditModal(wsId) {
    const ws = window.store.getWorkspaceById(wsId);
    if (!ws) return;

    const html = `
      <div class="modal-overlay active" id="modal-edit-ws">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">✏️ Edit Workspace: ${ws.code}</h3>
            <button class="modal-close-btn" onclick="WorkspaceModule.closeModal('modal-edit-ws')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="WorkspaceModule.handleEditSubmit(event, '${ws.id}')">
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <input type="text" class="form-control" value="${ws.type}" disabled>
                </div>
                <div class="form-group">
                  <label class="form-label">Capacity (Pax) <span class="required-star">*</span></label>
                  <input type="number" name="capacity" class="form-control" value="${ws.capacity}" min="1" required>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Pricing Type</label>
                  <select name="pricingType" class="form-control">
                    <option value="monthly" ${ws.pricingType === 'monthly' ? 'selected' : ''}>Monthly Rent</option>
                    <option value="hourly" ${ws.pricingType === 'hourly' ? 'selected' : ''}>Hourly Rate</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Rate / Rent (₹) <span class="required-star">*</span></label>
                  <input type="number" name="rate" class="form-control" value="${ws.rate}" required>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select name="status" class="form-control">
                    <option value="Available" ${ws.status === 'Available' ? 'selected' : ''}>Available</option>
                    <option value="Occupied" ${ws.status === 'Occupied' ? 'selected' : ''}>Occupied</option>
                    <option value="Reserved" ${ws.status === 'Reserved' ? 'selected' : ''}>Reserved</option>
                    <option value="Maintenance" ${ws.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Location Wing</label>
                  <input type="text" name="zone" class="form-control" value="${ws.zone || ''}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Amenities</label>
                <input type="text" name="amenities" class="form-control" value="${(ws.amenities || []).join(', ')}">
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-outline" style="color: var(--status-danger); margin-right: auto;" onclick="WorkspaceModule.handleDelete('${ws.id}')">
                  Delete
                </button>
                <button type="button" class="btn btn-secondary" onclick="WorkspaceModule.closeModal('modal-edit-ws')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleEditSubmit(e, wsId) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = {
      capacity: Number(fd.get('capacity')),
      pricingType: fd.get('pricingType'),
      rate: Number(fd.get('rate')),
      status: fd.get('status'),
      zone: fd.get('zone'),
      amenities: fd.get('amenities') ? fd.get('amenities').split(',').map(s=>s.trim()) : []
    };

    window.store.updateWorkspace(wsId, updates);
    this.closeModal('modal-edit-ws');
    App.showToast('Workspace updated successfully!', 'success');
    this.render();
  },

  handleDelete(wsId) {
    if (confirm('Are you sure you want to remove this workspace from inventory?')) {
      window.store.deleteWorkspace(wsId);
      this.closeModal('modal-edit-ws');
      App.showToast('Workspace deleted.', 'warning');
      this.render();
    }
  },

  // --- Allocate Space Modal ---
  openAllocateModal(wsId) {
    const ws = window.store.getWorkspaceById(wsId);
    if (!ws) return;

    const startups = window.store.getStartups().filter(s => s.status === 'Approved' || s.status === 'Incubated');

    const html = `
      <div class="modal-overlay active" id="modal-allocate-ws">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">🏢 Allocate Workspace: ${ws.code}</h3>
            <button class="modal-close-btn" onclick="WorkspaceModule.closeModal('modal-allocate-ws')">&times;</button>
          </div>
          <div class="modal-body">
            <div style="background: var(--bg-surface-elevated); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 16px; font-size: 13px;">
              <div>Type: <strong>${ws.type}</strong> • Capacity: <strong>${ws.capacity} Pax</strong></div>
              <div>Rent / Rate: <strong style="color: var(--accent-primary);">${ws.rateDisplay}</strong></div>
              <div>Location: <strong>${ws.zone}</strong></div>
            </div>

            <form onsubmit="WorkspaceModule.handleAllocateSubmit(event, '${ws.id}')">
              <div class="form-group">
                <label class="form-label">Select Incubated / Approved Startup <span class="required-star">*</span></label>
                <select name="startupId" class="form-control" required>
                  <option value="">-- Choose Startup to Allocate --</option>
                  ${startups.map(s => `
                    <option value="${s.id}">
                      ${s.name} [Status: ${s.status}] (${s.category || s.sector} - ${s.numberOfEmployees || s.teamSize} Pax)
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="WorkspaceModule.closeModal('modal-allocate-ws')">Cancel</button>
                <button type="submit" class="btn btn-primary">Confirm Allocation</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleAllocateSubmit(e, wsId) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const startupId = fd.get('startupId');

    const res = window.store.allocateWorkspace(wsId, startupId);
    this.closeModal('modal-allocate-ws');

    if (res.success) {
      App.showToast(`✅ ${res.message}`, 'success');
      this.render();
      if (window.DashboardModule && window.DashboardModule.render) {
        window.DashboardModule.render();
      }
    } else {
      App.showToast(`❌ ${res.message}`, 'danger');
    }
  },

  // --- Release / Deallocate Space Modal ---
  openDeallocateModal(spaceOrWsId) {
    const ws = window.store.getWorkspaceById(spaceOrWsId);
    const space = window.store.getSpaceById(spaceOrWsId);
    const identifier = (ws && ws.code) || (space && space.label) || spaceOrWsId;
    const occupant = (ws && ws.currentOccupant) || (space && space.allocatedStartupName) || 'Tenant';

    const html = `
      <div class="modal-overlay active" id="modal-deallocate-ws" onclick="if(event.target===this) WorkspaceModule.closeModal('modal-deallocate-ws')">
        <div class="modal-content" style="max-width: 460px;">
          <div class="modal-header">
            <h3 class="modal-title">Release Workspace: ${identifier}</h3>
            <button class="modal-close-btn" onclick="WorkspaceModule.closeModal('modal-deallocate-ws')">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 14px;">
              Are you sure you want to release <strong>${identifier}</strong> currently occupied by <strong>${occupant}</strong>?
            </p>
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--status-danger); padding: 10px 14px; border-radius: var(--radius-md); font-size: 12px; color: var(--status-danger);">
              ⚠️ The workspace status will revert to <strong>Available</strong>, and digital desk passes will be deactivated.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="WorkspaceModule.closeModal('modal-deallocate-ws')">Cancel</button>
            <button type="button" class="btn btn-primary" style="background: var(--status-danger);" onclick="WorkspaceModule.confirmDeallocate('${spaceOrWsId}')">
              Confirm Release
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  confirmDeallocate(id) {
    if (window.store.getSpaceById(id)) {
      window.store.deallocateSpace(id);
    }
    if (window.store.getWorkspaceById(id)) {
      window.store.deallocateWorkspace(id);
    }
    this.closeModal('modal-deallocate-ws');
    this.closeModal('modal-desk-pass');
    App.showToast(`🔄 Workspace released successfully! Now available for booking.`, 'info');
    this.render();
    if (window.DashboardModule && window.DashboardModule.render) {
      window.DashboardModule.render();
    }
  },

  toggleStatus(wsId, status) {
    window.store.updateWorkspace(wsId, { status });
    App.showToast(`Status updated to ${status}!`, 'info');
    this.render();
  },

  highlightForStartup(startupId) {
    this.highlightStartupId = startupId;
    this.render();
    setTimeout(() => {
      this.highlightStartupId = null;
    }, 4000);
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
  }
};

window.WorkspaceModule = WorkspaceModule;
