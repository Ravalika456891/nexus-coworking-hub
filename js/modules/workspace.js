// Module: Workspace Management (Private Cabins, Desks, Meeting Rooms, Conference, Training, Event Spaces)

const WorkspaceModule = {
  activeTypeFilter: 'all',
  activeStatusFilter: 'all',
  activeViewMode: 'cards', // 'cards' | 'floorplan'
  highlightStartupId: null,

  render() {
    const container = document.getElementById('view-workspace');
    if (!container) return;

    const stats = window.store.getWorkspaceStats();
    let workspaces = window.store.getWorkspaces();

    // Counts for Category Tabs
    const typeCounts = {
      all: workspaces.length,
      cabins: workspaces.filter(w => w.type === 'Private Cabin').length,
      dedicated: workspaces.filter(w => w.type === 'Dedicated Desk').length,
      hot: workspaces.filter(w => w.type === 'Hot Desk').length,
      meeting: workspaces.filter(w => w.type === 'Meeting Room').length,
      conference: workspaces.filter(w => w.type === 'Conference Room').length,
      training: workspaces.filter(w => w.type === 'Training Room').length,
      events: workspaces.filter(w => w.type === 'Event Space').length
    };

    // Filter by Type
    if (this.activeTypeFilter !== 'all') {
      workspaces = workspaces.filter(w => w.type.toLowerCase() === this.activeTypeFilter.toLowerCase());
    }

    // Filter by Status
    if (this.activeStatusFilter !== 'all') {
      workspaces = workspaces.filter(w => w.status.toLowerCase() === this.activeStatusFilter.toLowerCase());
    }

    container.innerHTML = `
      <!-- Workspace Management Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
            <span>🏢 Workspace Management</span>
            <span class="badge badge-info" style="font-size: 12px;">Stage 2 of Lifecycle</span>
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
            Admin inventory control across Private Cabins, Dedicated Desks, Hot Desks, Meeting Rooms, Conference Rooms, Training Rooms & Event Spaces.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <!-- View Toggle -->
          <div class="role-badge-toggle" style="margin-right: 4px;">
            <button class="role-btn ${this.activeViewMode === 'cards' ? 'active' : ''}" onclick="WorkspaceModule.setViewMode('cards')">
              🗂️ Cards View
            </button>
            <button class="role-btn ${this.activeViewMode === 'floorplan' ? 'active' : ''}" onclick="WorkspaceModule.setViewMode('floorplan')">
              🗺️ Floor Plan Map
            </button>
          </div>

          <button class="btn btn-primary" onclick="WorkspaceModule.openAddWorkspaceModal()">
            + Add New Workspace
          </button>
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
            <span>Across 7 Space Categories</span>
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

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Vacant & Ready Units</span>
            <div class="kpi-icon-wrap" style="color: var(--status-warning);">⚡</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-success);">${stats.availableCount}</div>
          <div class="kpi-footer">
            <span>Ready for Immediate Allocation</span>
          </div>
        </div>
      </div>

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

      <!-- Main Content Views -->
      ${this.activeViewMode === 'cards' 
        ? this.renderCardsView(workspaces) 
        : this.renderFloorPlanView()}
    `;
  },

  setTypeFilter(type) {
    this.activeTypeFilter = type;
    this.render();
  },

  setStatusFilter(status) {
    this.activeStatusFilter = status;
    this.render();
  },

  setViewMode(mode) {
    this.activeViewMode = mode;
    this.render();
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

  // --- Render Cards View Matching User Example ---
  renderCardsView(workspaces) {
    if (workspaces.length === 0) {
      return `
        <div style="background: var(--bg-surface); padding: 50px; text-align: center; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); color: var(--text-muted);">
          No workspaces found matching the selected filters.
        </div>
      `;
    }

    return `
      <div class="grid-3col">
        ${workspaces.map(ws => this.renderWorkspaceCard(ws)).join('')}
      </div>
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
          <!-- Header: Workspace Identifier & Status -->
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
            <span class="badge ${statusClass}" style="font-weight: 700; font-size: 12px;">
              ${ws.status}
            </span>
          </div>

          <!-- Exact Details Formatted as requested -->
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; line-height: 1.5; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Type:</span>
              <strong style="color: var(--text-primary);">${ws.type}</strong>
            </div>

            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Capacity:</span>
              <strong style="color: var(--text-primary); font-family: var(--font-mono);">${ws.capacity} Pax</strong>
            </div>

            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">${ws.pricingType === 'hourly' ? 'Rate:' : 'Rent:'}</span>
              <strong style="color: var(--accent-primary); font-family: var(--font-mono); font-size: 14px;">
                ${ws.rateDisplay}
              </strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-muted);">Status:</span>
              <strong style="color: ${ws.status === 'Available' ? 'var(--status-success)' : ws.status === 'Occupied' ? 'var(--accent-secondary)' : 'var(--status-warning)'};">
                ${ws.status}
              </strong>
            </div>

            ${ws.status === 'Occupied' ? `
              <div style="background: rgba(99, 102, 241, 0.08); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); margin-top: 4px; font-size: 12px;">
                <span style="color: var(--text-muted); display: block; font-size: 10.5px; text-transform: uppercase; font-weight: 700;">Current Tenant:</span>
                <strong style="color: var(--text-primary);">${ws.currentOccupant || 'Incubated Venture'}</strong>
                ${ws.allocatedSince ? `<span style="font-size: 11px; color: var(--text-muted); display: block;">Since: ${ws.allocatedSince}</span>` : ''}
              </div>
            ` : ws.status === 'Reserved' ? `
              <div style="background: var(--status-warning-bg); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 11.5px; color: var(--status-warning);">
                Reserved: ${ws.currentOccupant || 'Pending Move-in'}
              </div>
            ` : ''}

            <!-- Amenities Badges -->
            ${(ws.amenities && ws.amenities.length > 0) ? `
              <div style="margin-top: 6px;">
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  ${ws.amenities.slice(0, 3).map(a => `<span class="amenity-tag" style="font-size: 10.5px;">${a}</span>`).join('')}
                  ${ws.amenities.length > 3 ? `<span class="amenity-tag" style="font-size: 10.5px;">+${ws.amenities.length - 3} more</span>` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Card Action Buttons -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; display: flex; gap: 6px;">
          ${ws.status === 'Available' ? `
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="WorkspaceModule.openAllocateModal('${ws.id}')">
              🏢 Allocate Space
            </button>
          ` : ws.status === 'Occupied' ? `
            <button class="btn btn-outline btn-sm" style="flex: 1; color: var(--status-danger);" onclick="WorkspaceModule.openDeallocateModal('${ws.id}')">
              Release Space
            </button>
          ` : `
            <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="WorkspaceModule.toggleStatus('${ws.id}', 'Available')">
              Mark Available
            </button>
          `}

          <button class="btn btn-secondary btn-sm" title="Edit Workspace" onclick="WorkspaceModule.openEditModal('${ws.id}')">
            ✏️ Edit
          </button>
        </div>
      </div>
    `;
  },

  // --- Render Visual Floor Plan Map ---
  renderFloorPlanView() {
    const spaces = window.store.getSpaces();
    const zones = {
      'Wing A: Hot Desks': spaces.filter(s => s.zone.includes('Zone A')),
      'Wing B: Dedicated Bays': spaces.filter(s => s.zone.includes('Zone B')),
      'Wing C: Private Cabins': spaces.filter(s => s.zone.includes('Zone C')),
      'Wing D: Acoustic Pods': spaces.filter(s => s.zone.includes('Zone D'))
    };

    return `
      <div class="floorplan-container">
        <div class="floorplan-legend">
          <div class="legend-item"><span class="legend-swatch swatch-available"></span><span>Available</span></div>
          <div class="legend-item"><span class="legend-swatch swatch-occupied"></span><span>Occupied</span></div>
          <div class="legend-item"><span class="legend-swatch swatch-reserved"></span><span>Reserved</span></div>
          <div class="legend-item"><span class="legend-swatch swatch-maintenance"></span><span>Maintenance</span></div>
        </div>

        <div class="floorplan-zone-title">
          <span>Wing 1: Hot Desks & Flex Workstations</span>
          <span style="font-size: 11.5px; color: var(--text-muted);">8 Desks</span>
        </div>
        <div class="seats-grid">
          ${zones['Wing A: Hot Desks'].map(s => this.renderSeatTile(s)).join('')}
        </div>

        <div class="floorplan-zone-title">
          <span>Wing 2: Dedicated Desks & Reserved Bays</span>
          <span style="font-size: 11.5px; color: var(--text-muted);">10 Desks</span>
        </div>
        <div class="seats-grid">
          ${zones['Wing B: Dedicated Bays'].map(s => this.renderSeatTile(s)).join('')}
        </div>

        <div class="floorplan-zone-title">
          <span>Wing 3: Soundproof Private Cabins & Team Suites</span>
          <span style="font-size: 11.5px; color: var(--text-muted);">5 Executive Cabins</span>
        </div>
        <div class="cabins-grid">
          ${zones['Wing C: Private Cabins'].map(s => this.renderCabinTile(s)).join('')}
        </div>
      </div>
    `;
  },

  renderSeatTile(seat) {
    return `
      <div class="seat-card status-${seat.status}" onclick="WorkspaceModule.handleLegacySeatClick('${seat.id}')">
        <div class="seat-header">
          <span class="seat-id">${seat.id}</span>
          <span class="seat-type-tag">${seat.capacity} Pax</span>
        </div>
        <div class="seat-occupant">
          ${seat.status === 'occupied' ? seat.allocatedStartupName : seat.status === 'reserved' ? 'Reserved' : seat.status === 'maintenance' ? 'Repair' : 'Available'}
        </div>
        <div class="seat-rate">
          ${seat.monthlyRate > 0 ? `₹${(seat.monthlyRate/1000).toFixed(1)}k/mo` : 'Free'}
        </div>
      </div>
    `;
  },

  renderCabinTile(cabin) {
    return `
      <div class="cabin-card status-${cabin.status}" onclick="WorkspaceModule.handleLegacySeatClick('${cabin.id}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${cabin.label}</h4>
            <span style="font-size: 11px; color: var(--text-muted);">${cabin.capacity} Workstations</span>
          </div>
          <span class="badge ${cabin.status === 'occupied' ? 'badge-info' : 'badge-success'}">
            ${cabin.status === 'occupied' ? 'Occupied' : 'Vacant'}
          </span>
        </div>
        <div style="font-size: 12px; font-weight: 600; color: var(--accent-secondary); margin-bottom: 6px;">
          ${cabin.status === 'occupied' ? `Tenant: ${cabin.allocatedStartupName}` : 'Ready for move-in'}
        </div>
        <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
          ₹${cabin.monthlyRate.toLocaleString('en-IN')}/month
        </div>
      </div>
    `;
  },

  handleLegacySeatClick(seatId) {
    const ws = window.store.getWorkspaceById(seatId);
    if (ws) {
      if (ws.status === 'Occupied') {
        this.openDeallocateModal(ws.id);
      } else {
        this.openAllocateModal(ws.id);
      }
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
                  <label class="form-label">Workspace Category *</label>
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
                  <label class="form-label">Identifier / Code *</label>
                  <input type="text" name="code" class="form-control" placeholder="e.g. Cabin A-103 or Room M-03" required>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Seating Capacity (Pax) *</label>
                  <input type="number" name="capacity" class="form-control" min="1" max="500" value="10" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Pricing Type *</label>
                  <select name="pricingType" id="ws-pricing-type" class="form-control" required>
                    <option value="monthly">Monthly Rent (₹/month)</option>
                    <option value="hourly">Hourly Rate (₹/hour)</option>
                  </select>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Rate / Rent (₹) *</label>
                  <input type="number" name="rate" class="form-control" min="0" step="50" placeholder="e.g. 25000" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Wing / Floor Location</label>
                  <input type="text" name="zone" class="form-control" placeholder="e.g. Wing A: Executive Level" value="Wing A: Executive Level">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Amenities & Equipment (comma separated)</label>
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
    DashboardModule.render();
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
                  <label class="form-label">Capacity (Pax) *</label>
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
                  <label class="form-label">Rate / Rent (₹) *</label>
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
                <label class="form-label">Select Incubated / Approved Startup *</label>
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
      DashboardModule.render();
    } else {
      App.showToast(`❌ ${res.message}`, 'danger');
    }
  },

  // --- Release / Deallocate Space Modal ---
  openDeallocateModal(wsId) {
    const ws = window.store.getWorkspaceById(wsId);
    if (!ws) return;

    const html = `
      <div class="modal-overlay active" id="modal-deallocate-ws">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Release Workspace: ${ws.code}</h3>
            <button class="modal-close-btn" onclick="WorkspaceModule.closeModal('modal-deallocate-ws')">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 14px;">
              Are you sure you want to release <strong>${ws.code}</strong> currently occupied by <strong>${ws.currentOccupant || 'Tenant'}</strong>?
            </p>
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--status-danger); padding: 10px 14px; border-radius: var(--radius-md); font-size: 12px; color: var(--status-danger);">
              ⚠️ The workspace status will revert to <strong>Available</strong>, and tenant desk mappings will be cleared.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="WorkspaceModule.closeModal('modal-deallocate-ws')">Cancel</button>
            <button type="button" class="btn btn-primary" style="background: var(--status-danger);" onclick="WorkspaceModule.confirmDeallocate('${ws.id}')">
              Confirm Release
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  confirmDeallocate(wsId) {
    const res = window.store.deallocateWorkspace(wsId);
    this.closeModal('modal-deallocate-ws');
    if (res.success) {
      App.showToast(`🔄 ${res.message}`, 'success');
      this.render();
      DashboardModule.render();
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
