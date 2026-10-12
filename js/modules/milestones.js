// Module: Milestone Management & Sequential Venture Targets Engine

const MilestonesModule = {
  selectedStartupId: 'STP-XYZ', // Default to XYZ Technologies as requested
  filterStatus: 'all',          // 'all' | 'Completed' | 'In Progress' | 'Planned'
  activeView: 'sequential',     // 'sequential' | 'cards' | 'kanban' | 'allStartups'
  searchQuery: '',

  render() {
    const container = document.getElementById('view-milestones');
    if (!container) return;

    const startups = window.store.getStartups();
    const mentors = window.store.getMentors();
    const currentRole = window.store.normalizeRole(window.store.currentRole);
    const roleInfo = window.store.getCurrentRoleInfo();

    // Get current startup
    let currentStartup = null;
    if (this.selectedStartupId && this.selectedStartupId !== 'all') {
      currentStartup = startups.find(s => s.id === this.selectedStartupId) || startups[0];
    } else if (startups.length) {
      currentStartup = startups[0];
    }

    // Milestones for current selection
    let displayMilestones = this.selectedStartupId === 'all' 
      ? [...allMilestones] 
      : window.store.getMilestonesByStartup(currentStartup?.id);

    // Apply status filter
    if (this.filterStatus !== 'all') {
      displayMilestones = displayMilestones.filter(m => m.status === this.filterStatus);
    }

    // Apply search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      displayMilestones = displayMilestones.filter(m => 
        m.title.toLowerCase().includes(q) || 
        (m.milestoneLabel || '').toLowerCase().includes(q) ||
        (m.startupName || '').toLowerCase().includes(q)
      );
    }

    // Metrics for selected startup
    const startupMilestones = currentStartup ? window.store.getMilestonesByStartup(currentStartup.id) : allMilestones;
    const completedCount = startupMilestones.filter(m => m.status === 'Completed').length;
    const inProgressCount = startupMilestones.filter(m => m.status === 'In Progress').length;
    const plannedCount = startupMilestones.filter(m => m.status === 'Planned').length;
    const completionRate = startupMilestones.length ? Math.round((completedCount / startupMilestones.length) * 100) : 0;

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="milestones-header-banner">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 26px;">🎯</span>
              <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px;">
                8. Milestone Management
              </h2>
              <span class="badge badge-success" style="font-size: 11px; padding: 4px 10px;">
                ⚡ Admin / Mentor Access
              </span>
            </div>
            <p style="font-size: 13.5px; color: var(--text-secondary); max-width: 820px; line-height: 1.5;">
              <strong>Admin and Mentor can create, track, and verify sequential venture milestones.</strong> Monitor foundational delivery from Business Registration to MVP Development, Beta Launch, and Revenue Generation.
            </p>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <button class="btn btn-primary" onclick="MilestonesModule.openCreateMilestoneModal('${currentStartup?.id || 'STP-XYZ'}')">
              + Create New Milestone
            </button>
          </div>
        </div>

        <!-- Role Authorization & Mode Callout -->
        <div style="margin-top: 18px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; font-size: 12.5px;">
            <span style="font-size: 18px;">${roleInfo.icon}</span>
            <span>
              Active Authority: <strong>${roleInfo.name}</strong> (${roleInfo.user.name})
              <span style="color: var(--text-muted);"> • ${currentRole === 'startup' ? 'Founder viewing milestones & submitting deliverables' : 'Full clearance to create, edit, verify, and approve milestones'}</span>
            </span>
          </div>

          <div style="display: flex; gap: 6px;">
            <button class="btn btn-outline btn-sm ${currentRole === 'mentor' ? 'active' : ''}" style="font-size: 11px;" onclick="App.setRole('mentor')">
              🧠 Mentor (John Smith)
            </button>
            <button class="btn btn-outline btn-sm ${currentRole === 'incubator_admin' ? 'active' : ''}" style="font-size: 11px;" onclick="App.setRole('incubator_admin')">
              🌱 Incubator Admin
            </button>
            <button class="btn btn-outline btn-sm ${currentRole === 'super_admin' ? 'active' : ''}" style="font-size: 11px;" onclick="App.setRole('super_admin')">
              👑 Super Admin
            </button>
          </div>
        </div>

        <!-- KPI Summary Strip -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 16px;">
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">ACTIVE STARTUP</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--accent-primary); margin-top: 2px;">${currentStartup ? currentStartup.name : 'All Startups'}</div>
          </div>
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">TOTAL MILESTONES</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">${startupMilestones.length} Targets</div>
          </div>
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">✓ COMPLETED</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--status-success); font-family: var(--font-mono);">${completedCount} Cleared</div>
          </div>
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">⏳ IN PROGRESS</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--status-warning); font-family: var(--font-mono);">${inProgressCount} Active</div>
          </div>
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">COMPLETION VELOCITY</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--status-info); font-family: var(--font-mono);">${completionRate}%</div>
          </div>
        </div>
      </div>

      <!-- Controls & Startup Selector Bar -->
      <div class="card" style="margin-bottom: 22px; padding: 16px 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <!-- Startup Selector Dropdown -->
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>🚀 Select Startup:</span>
            </label>
            <select class="form-control" style="width: auto; min-width: 260px; font-weight: 700; color: var(--accent-primary);" onchange="MilestonesModule.handleStartupSelect(this.value)">
              <option value="all" ${this.selectedStartupId === 'all' ? 'selected' : ''}>🌐 All Portfolio Startups (${allMilestones.length} Milestones)</option>
              ${startups.map(s => `
                <option value="${s.id}" ${this.selectedStartupId === s.id ? 'selected' : ''}>
                  ${s.logoEmoji || '⚡'} ${s.name} (${s.cohort || 'Cohort 2026-A'})
                </option>
              `).join('')}
            </select>

            ${currentStartup ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-subtle" style="font-size: 11px;">Mentor: <strong>${currentStartup.mentorName || 'John Smith'}</strong></span>
                <span class="badge badge-info" style="font-size: 11px;">Stage: <strong>${currentStartup.currentStage || 'MVP Development'}</strong></span>
                <span style="font-family: var(--font-mono); font-size: 11.5px; color: #38bdf8;">
                  ${window.store.getAsciiProgressBar(currentStartup.progressPercent, 10)}
                </span>
              </div>
            ` : ''}
          </div>

          <!-- View Tabs & Quick Filters -->
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; gap: 6px; background: var(--bg-surface-elevated); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <button class="btn btn-sm ${this.activeView === 'sequential' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11.5px; padding: 4px 10px;" onclick="MilestonesModule.switchView('sequential')">
                🎯 Sequential Timeline
              </button>
              <button class="btn btn-sm ${this.activeView === 'kanban' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11.5px; padding: 4px 10px;" onclick="MilestonesModule.switchView('kanban')">
                📊 Status Kanban
              </button>
              <button class="btn btn-sm ${this.activeView === 'cards' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11.5px; padding: 4px 10px;" onclick="MilestonesModule.switchView('cards')">
                📋 Detailed Matrix
              </button>
            </div>

            <!-- Status Filter -->
            <select class="form-control" style="width: auto; padding: 6px 10px; font-size: 12px;" onchange="MilestonesModule.handleStatusFilter(this.value)">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="Completed" ${this.filterStatus === 'Completed' ? 'selected' : ''}>✓ Completed</option>
              <option value="In Progress" ${this.filterStatus === 'In Progress' ? 'selected' : ''}>⏳ In Progress</option>
              <option value="Planned" ${this.filterStatus === 'Planned' ? 'selected' : ''}>📅 Planned</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Render Selected View Content -->
      ${this.renderViewContent(displayMilestones, currentStartup, startups)}
    `;
  },

  renderViewContent(milestones, startup, startups) {
    if (this.activeView === 'kanban') {
      return this.renderKanbanView(milestones);
    }
    if (this.activeView === 'cards') {
      return this.renderCardsView(milestones);
    }
    return this.renderSequentialTimelineView(milestones, startup);
  },

  // -------------------------------------------------------------
  // View 1: Sequential Timeline View (Exact prompt layout!)
  // -------------------------------------------------------------
  renderSequentialTimelineView(milestones, startup) {
    if (!milestones.length) {
      return `
        <div class="card" style="text-align: center; padding: 50px 20px;">
          <div style="font-size: 36px; margin-bottom: 10px;">🎯</div>
          <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">No milestones defined for this startup yet</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">Admins and mentors can create sequential milestones like Business Registration, MVP Development, Beta Launch, and Revenue Generation.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="MilestonesModule.openCreateMilestoneModal('${startup?.id || 'STP-XYZ'}')">
            + Create Milestone 1
          </button>
        </div>
      `;
    }

    return `
      <div style="max-width: 860px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary);">
              Sequential Venture Targets: ${startup ? startup.name : 'All Milestones'}
            </h3>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              Admin and mentors create sequential progress gates. Each verified milestone advances cohort graduation readiness.
            </div>
          </div>

          <button class="btn btn-outline btn-sm" onclick="MilestonesModule.openCreateMilestoneModal('${startup?.id || 'STP-XYZ'}')">
            + Add Milestone ${milestones.length + 1}
          </button>
        </div>

        <div class="sequential-milestones-track">
          ${milestones.map((m, idx) => this.renderSequentialMilestoneCard(m, idx, milestones.length)).join('')}
        </div>
      </div>
    `;
  },

  renderSequentialMilestoneCard(m, idx, total) {
    const isCompleted = m.status === 'Completed';
    const isInProgress = m.status === 'In Progress';
    const isPlanned = m.status === 'Planned';

    const cardClass = isCompleted ? 'completed-card' : isInProgress ? 'in-progress-card' : 'planned-card';
    const badgeClass = isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'planned';
    const statusText = isCompleted ? '✓ Completed' : isInProgress ? '⏳ In Progress' : '📅 Planned';

    return `
      <div>
        <div class="milestone-seq-card ${cardClass}" id="mls-card-${m.id}">
          <div class="seq-header-row">
            <div>
              <div class="seq-number-badge ${badgeClass}">
                <span>${isCompleted ? '✓' : isInProgress ? '●' : '○'}</span>
                <span>${m.milestoneLabel || `Milestone ${m.sequenceNumber || idx + 1}`}</span>
              </div>
              <h3 class="seq-milestone-title">${m.title}</h3>
              <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 3px;">
                Venture: <strong style="color: var(--text-secondary);">${m.startupName}</strong> • Target: <strong>${m.targetDate || 'Q4 2026'}</strong>
                ${m.completedDate ? ` • <span style="color: var(--status-success);">Completed: <strong>${m.completedDate}</strong></span>` : ''}
              </div>
            </div>

            <div style="text-align: right;">
              <span class="seq-status-badge ${badgeClass}">
                ${statusText} ${isInProgress && m.progressPercent ? `(${m.progressPercent}%)` : ''}
              </span>
            </div>
          </div>

          <!-- Progress Bar if in progress -->
          ${isInProgress ? `
            <div>
              <div class="progress-track" style="height: 6px; margin-bottom: 6px;">
                <div class="progress-fill" style="width: ${m.progressPercent || 80}%; background: var(--status-warning);"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: var(--font-mono); color: var(--text-muted);">
                <span>${window.store.getAsciiProgressBar(m.progressPercent || 80, 12)}</span>
                <span>${m.progressPercent || 80}% Sprint Target Achieved</span>
              </div>
            </div>
          ` : ''}

          <!-- Details & Deliverables Grid -->
          <div class="seq-details-grid">
            <div class="seq-detail-item">
              <span class="seq-detail-label">Key Metric Impact / Deliverable</span>
              <span class="seq-detail-val">${m.kpiImpact || 'Core Venture Acceleration Milestone'}</span>
            </div>

            <div class="seq-detail-item">
              <span class="seq-detail-label">Advisory Verification / Sign-Off</span>
              <span class="seq-detail-val" style="color: ${isCompleted ? 'var(--status-success)' : 'var(--text-primary)'};">
                ${m.verifiedBy || 'John Smith (Mentor)'}
              </span>
            </div>

            <div class="seq-detail-item">
              <span class="seq-detail-label">Created By Authority</span>
              <span class="seq-detail-val">${m.creatorRole || 'Admin'}: ${m.creatorName || 'Operations'}</span>
            </div>
          </div>

          ${m.mentorNotes ? `
            <div style="background: rgba(255, 255, 255, 0.03); border-left: 3px solid ${isCompleted ? 'var(--status-success)' : 'var(--status-warning)'}; border-radius: var(--radius-sm); padding: 8px 12px; font-size: 12px; color: var(--text-secondary); font-style: italic;">
              💬 Mentor Feedback: "${m.mentorNotes}"
            </div>
          ` : ''}

          <!-- Admin / Mentor Fast Action Row -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: 4px;">
            <div style="font-size: 11px; color: var(--text-muted);">
              Sequence: #${m.sequenceNumber || idx + 1} of ${total}
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px;" onclick="MilestonesModule.openEditMilestoneModal('${m.id}')">
                ✏️ Edit
              </button>
              
              <button class="btn ${isCompleted ? 'btn-outline' : 'btn-primary'} btn-sm" style="font-size: 11px; padding: 4px 10px;" onclick="MilestonesModule.toggleMilestoneStatus('${m.id}')">
                ${isCompleted ? '↺ Revert to In Progress' : '✓ Mark Completed'}
              </button>

              <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px; color: var(--status-danger);" onclick="MilestonesModule.deleteMilestone('${m.id}')" title="Delete milestone">
                🗑️
              </button>
            </div>
          </div>
        </div>

        ${idx < total - 1 ? `
          <div class="seq-connector-line">↓</div>
        ` : ''}
      </div>
    `;
  },

  // -------------------------------------------------------------
  // View 2: Status Kanban Board
  // -------------------------------------------------------------
  renderKanbanView(milestones) {
    const columns = [
      { id: 'Completed', label: '✓ Completed', color: 'var(--status-success)', count: milestones.filter(m => m.status === 'Completed').length },
      { id: 'In Progress', label: '⏳ In Progress', color: 'var(--status-warning)', count: milestones.filter(m => m.status === 'In Progress').length },
      { id: 'Planned', label: '📅 Planned / Upcoming', color: 'var(--text-muted)', count: milestones.filter(m => m.status === 'Planned').length }
    ];

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        ${columns.map(col => {
          const inCol = milestones.filter(m => m.status === col.id);
          return `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 16px; min-height: 500px; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 12px;">
                <h4 style="font-size: 14px; font-weight: 800; color: ${col.color};">${col.label}</h4>
                <span class="badge badge-subtle" style="font-size: 11px;">${inCol.length}</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
                ${inCol.map(m => `
                  <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <span class="badge badge-info" style="font-size: 10px;">${m.milestoneLabel || 'Milestone'}</span>
                      <span style="font-size: 10.5px; color: var(--text-muted);">${m.targetDate}</span>
                    </div>

                    <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary);">${m.title}</h4>
                    <div style="font-size: 11px; color: var(--text-secondary);">${m.startupName}</div>

                    <div style="font-size: 11px; color: var(--text-muted); border-top: 1px dashed var(--border-subtle); padding-top: 6px;">
                      Verified by: <strong>${m.verifiedBy || 'John Smith'}</strong>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px;">
                      <button class="btn btn-outline btn-sm" style="font-size: 10px; padding: 2px 6px;" onclick="MilestonesModule.toggleMilestoneStatus('${m.id}')">
                        ${m.status === 'Completed' ? '↺ Revert' : '✓ Mark Done'}
                      </button>
                      <button class="btn btn-outline btn-sm" style="font-size: 10px; padding: 2px 6px;" onclick="MilestonesModule.openEditMilestoneModal('${m.id}')">
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                `).join('')}

                ${!inCol.length ? `
                  <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); font-size: 12px; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
                    No milestones in this stage
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // -------------------------------------------------------------
  // View 3: Cards Matrix
  // -------------------------------------------------------------
  renderCardsView(milestones) {
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px;">
        ${milestones.map((m, idx) => this.renderSequentialMilestoneCard(m, idx, milestones.length)).join('')}
      </div>
    `;
  },

  // -------------------------------------------------------------
  // Admin & Mentor Milestone Creation Modal
  // -------------------------------------------------------------
  openCreateMilestoneModal(presetStartupId = 'STP-XYZ') {
    const startups = window.store.getStartups();
    const mentors = window.store.getMentors();
    const currentStartup = startups.find(s => s.id === presetStartupId) || startups[0];
    const existing = window.store.getMilestonesByStartup(currentStartup?.id);
    const nextSeq = existing.length + 1;

    const html = `
      <div class="modal-overlay active" id="modal-create-milestone">
        <div class="modal-content" style="max-width: 640px;">
          <div class="modal-header">
            <div>
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: var(--accent-primary); letter-spacing: 0.5px;">Admin & Mentor Creation Engine</div>
              <h3 class="modal-title">🎯 Create Venture Incubation Milestone</h3>
            </div>
            <button class="modal-close-btn" onclick="MilestonesModule.closeModal('modal-create-milestone')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="MilestonesModule.handleCreateSubmit(event)">
              <!-- Startup Selection -->
              <div class="form-group">
                <label class="form-label">Target Startup *</label>
                <select name="startupId" class="form-control" required onchange="MilestonesModule.updateSuggestedSeq(this.value)">
                  ${startups.map(s => `
                    <option value="${s.id}" ${s.id === presetStartupId ? 'selected' : ''}>
                      ${s.logoEmoji || '🚀'} ${s.name} (${s.cohort || 'Cohort 2026-A'})
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Milestone Sequence Number & Label -->
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Milestone Sequence Number *</label>
                  <input type="number" name="sequenceNumber" id="form-seq-num" class="form-control" value="${nextSeq}" min="1" max="20" required oninput="
                    document.getElementById('form-milestone-label').value = 'Milestone ' + this.value;
                  ">
                </div>
                <div class="form-group">
                  <label class="form-label">Milestone Label</label>
                  <input type="text" name="milestoneLabel" id="form-milestone-label" class="form-control" value="Milestone ${nextSeq}" required>
                </div>
              </div>

              <!-- Milestone Title with Quick Suggestions -->
              <div class="form-group">
                <label class="form-label">Milestone Title *</label>
                <input type="text" name="title" id="form-milestone-title" class="form-control" placeholder="e.g. Business Registration, MVP Development, Beta Launch, Revenue Generation" required>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;">
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="document.getElementById('form-milestone-title').value='Business Registration'">Business Registration</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="document.getElementById('form-milestone-title').value='MVP Development'">MVP Development</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="document.getElementById('form-milestone-title').value='Beta Launch'">Beta Launch</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="document.getElementById('form-milestone-title').value='Revenue Generation'">Revenue Generation</button>
                  <button type="button" class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="document.getElementById('form-milestone-title').value='Institutional Series A'">Series A</button>
                </div>
              </div>

              <!-- Status & Progress -->
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Initial Status *</label>
                  <select name="status" class="form-control" id="form-status-select" onchange="
                    const isDone = this.value === 'Completed';
                    document.getElementById('form-prog-val').value = isDone ? 100 : (this.value === 'Planned' ? 0 : 50);
                  ">
                    <option value="Completed">✓ Completed</option>
                    <option value="In Progress" selected>⏳ In Progress</option>
                    <option value="Planned">📅 Planned / Upcoming</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Progress Percentage (0-100%)</label>
                  <input type="number" name="progressPercent" id="form-prog-val" class="form-control" value="80" min="0" max="100">
                </div>
              </div>

              <!-- Target Date & Mentor Verification Sign-off -->
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Target Completion Date *</label>
                  <input type="date" name="targetDate" class="form-control" value="2026-11-20" required>
                </div>

                <div class="form-group">
                  <label class="form-label">Mentor Verifier Sign-Off *</label>
                  <select name="verifiedBy" class="form-control">
                    ${mentors.map(m => `
                      <option value="${m.name} (Mentor)" ${m.id === 'MEN-05' ? 'selected' : ''}>
                        ${m.name} (${m.role})
                      </option>
                    `).join('')}
                    <option value="Incubation Steering Committee">Incubation Steering Committee</option>
                  </select>
                </div>
              </div>

              <!-- KPI Impact -->
              <div class="form-group">
                <label class="form-label">KPI Metric Impact / Deliverable Proof</label>
                <input type="text" name="kpiImpact" class="form-control" placeholder="e.g. Target ₹25L ARR & 50 Paying Enterprise Client Contracts">
              </div>

              <!-- Mentor Notes -->
              <div class="form-group">
                <label class="form-label">Mentor Advisory Notes & Recommendations</label>
                <textarea name="mentorNotes" class="form-control" rows="2" placeholder="Advisory feedback from John Smith or committee..."></textarea>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="MilestonesModule.closeModal('modal-create-milestone')">Cancel</button>
                <button type="submit" class="btn btn-primary">Create & Register Milestone</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  updateSuggestedSeq(startupId) {
    const existing = window.store.getMilestonesByStartup(startupId);
    const nextSeq = existing.length + 1;
    const seqInput = document.getElementById('form-seq-num');
    const labelInput = document.getElementById('form-milestone-label');
    if (seqInput) seqInput.value = nextSeq;
    if (labelInput) labelInput.value = `Milestone ${nextSeq}`;
  },

  handleCreateSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    window.store.createMilestone(data);
    this.closeModal('modal-create-milestone');
    App.showToast(`🎯 Created ${data.milestoneLabel}: "${data.title}" successfully!`, 'success');
    this.selectedStartupId = data.startupId;
    this.render();
  },

  // -------------------------------------------------------------
  // Edit Milestone Modal
  // -------------------------------------------------------------
  openEditMilestoneModal(id) {
    const m = (window.store.getMilestones() || []).find(x => x.id === id);
    if (!m) return;
    const mentors = window.store.getMentors();

    const html = `
      <div class="modal-overlay active" id="modal-edit-milestone">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent-primary);">Edit Venture Milestone</div>
              <h3 class="modal-title">${m.milestoneLabel || 'Milestone'}: ${m.title}</h3>
            </div>
            <button class="modal-close-btn" onclick="MilestonesModule.closeModal('modal-edit-milestone')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="MilestonesModule.handleEditSubmit(event, '${m.id}')">
              <div class="form-group">
                <label class="form-label">Milestone Title *</label>
                <input type="text" name="title" class="form-control" value="${m.title}" required>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Status *</label>
                  <select name="status" class="form-control" onchange="
                    if (this.value === 'Completed') document.getElementById('edit-prog-val').value = 100;
                  ">
                    <option value="Completed" ${m.status === 'Completed' ? 'selected' : ''}>✓ Completed</option>
                    <option value="In Progress" ${m.status === 'In Progress' ? 'selected' : ''}>⏳ In Progress</option>
                    <option value="Planned" ${m.status === 'Planned' ? 'selected' : ''}>📅 Planned</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Progress Percentage: <strong id="edit-prog-num">${m.progressPercent || 80}%</strong></label>
                  <input type="range" name="progressPercent" id="edit-prog-val" class="form-control" min="0" max="100" value="${m.progressPercent || 80}" oninput="
                    document.getElementById('edit-prog-num').innerText = this.value + '%';
                  ">
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Target Completion Date</label>
                  <input type="date" name="targetDate" class="form-control" value="${m.targetDate || '2026-11-20'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Verified By Mentor</label>
                  <input type="text" name="verifiedBy" class="form-control" value="${m.verifiedBy || 'John Smith (Mentor)'}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">KPI Metric Impact / Deliverables</label>
                <input type="text" name="kpiImpact" class="form-control" value="${m.kpiImpact || ''}">
              </div>

              <div class="form-group">
                <label class="form-label">Mentor Notes & Feedback</label>
                <textarea name="mentorNotes" class="form-control" rows="3">${m.mentorNotes || ''}</textarea>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="MilestonesModule.closeModal('modal-edit-milestone')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Milestone Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleEditSubmit(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = {
      title: fd.get('title'),
      status: fd.get('status'),
      progressPercent: Number(fd.get('progressPercent')),
      targetDate: fd.get('targetDate'),
      verifiedBy: fd.get('verifiedBy'),
      kpiImpact: fd.get('kpiImpact'),
      mentorNotes: fd.get('mentorNotes')
    };

    window.store.updateMilestone(id, updates);
    this.closeModal('modal-edit-milestone');
    App.showToast('✅ Milestone updated successfully!', 'success');
    this.render();
  },

  toggleMilestoneStatus(id) {
    const res = window.store.toggleMilestoneStatus(id);
    if (res) {
      App.showToast(`Updated ${res.milestoneLabel}: ${res.statusDisplay}`, 'success');
      this.render();
    }
  },

  deleteMilestone(id) {
    if (confirm('Are you sure you want to remove this milestone from the sequence?')) {
      window.store.deleteMilestone(id);
      App.showToast('Milestone removed', 'info');
      this.render();
    }
  },

  // -------------------------------------------------------------
  // Filter & Navigation Handlers
  // -------------------------------------------------------------
  handleStartupSelect(startupId) {
    this.selectedStartupId = startupId;
    this.render();
  },

  handleStatusFilter(status) {
    this.filterStatus = status;
    this.render();
  },

  switchView(view) {
    this.activeView = view;
    this.render();
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
