// Module: Incubation Management & 8-Stage Startup Journey OS

const IncubationModule = {
  activeStageFilter: 'all',
  activeMentorFilter: 'all',
  activeViewTab: 'dashboards', // 'dashboards' | 'pipeline' | 'mentors' | 'milestones'
  searchQuery: '',
  

  render() {
    const container = document.getElementById('view-incubation');
    if (!container) return;

    const stages = window.store.getIncubationJourneyStages();
    const mentors = window.store.getMentors();
    const role = window.store.normalizeRole(window.store.currentRole);
    let startups = role === 'startup' ? window.store.getAccessibleStartups() : window.store.getStartups();

    // Ensure all startups are normalized
    startups = startups.map(s => window.store.normalizeStartupIncubation(s));

    // Calculate stage distribution counts
    const stageCounts = {};
    stages.forEach(st => {
      stageCounts[st.id] = startups.filter(s => (s.incubationJourneyStage || '').toLowerCase() === st.id.toLowerCase()).length;
    });

    const activeIncubatedCount = startups.filter(s => s.status === 'Incubated' || s.status === 'Approved').length;
    const graduatedCount = startups.filter(s => (s.incubationJourneyStage || '').toLowerCase() === 'graduation' || s.progressPercent === 100).length;
    const totalMilestones = window.store.getMilestones().length;
    const avgProgress = startups.length ? Math.round(startups.reduce((acc, s) => acc + (Number(s.progressPercent) || 0), 0) / startups.length) : 0;

    // Filtered list
    let filteredStartups = [...startups];
    if (this.activeStageFilter !== 'all') {
      filteredStartups = filteredStartups.filter(s => (s.incubationJourneyStage || '').toLowerCase() === this.activeStageFilter.toLowerCase());
    }
    if (this.activeMentorFilter !== 'all') {
      filteredStartups = filteredStartups.filter(s => s.mentorId === this.activeMentorFilter || s.mentorName === this.activeMentorFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filteredStartups = filteredStartups.filter(s => s.name.toLowerCase().includes(q) || (s.sector || '').toLowerCase().includes(q) || (s.founders?.name || '').toLowerCase().includes(q));
    }

    container.innerHTML = `
      <!-- Incubation Hero Banner & Unique Value Proposition -->
      <div class="incubation-header-banner">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 26px;">🌱</span>
              <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px;">
                7. Incubation Management
              </h2>
              <span class="badge badge-success" style="font-size: 11px; padding: 4px 10px;">
                ⚡ Core Accelerator Engine
              </span>
            </div>
            <p style="font-size: 13.5px; color: var(--text-secondary); max-width: 820px; line-height: 1.5;">
              <strong>What makes Nexus different from a standard co-working space:</strong> We track the founder's entire incubation lifecycle from <em>Genesis to Cohort Selection, Mentorship, Sprint Milestones, and Demo Day Graduation</em>.
            </p>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" onclick="IncubationModule.viewStartupJourneyModal('STP-XYZ')">
              ⚡ Open XYZ Technologies Dashboard
            </button>
            <button class="btn btn-primary btn-sm" onclick="IncubationModule.openNewMilestoneModal()">
              + Add Venture Milestone
            </button>
          </div>
        </div>

        <!-- Incubation KPI Stats Bar -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 20px;">
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">PORTFOLIO VENTURES</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">${startups.length} Startups</div>
          </div>
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">JOURNEY FUNNEL</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--accent-primary); font-family: var(--font-mono);">8 Stages</div>
          </div>
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">ACTIVE MENTORS</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--status-info); font-family: var(--font-mono);">${mentors.length} Leaders</div>
          </div>
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">AVG PROGRESS</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--status-success); font-family: var(--font-mono);">${avgProgress}%</div>
          </div>
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: var(--radius-md);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">ALUMNI GRADUATED</div>
            <div style="font-size: 20px; font-weight: 800; color: #f59e0b; font-family: var(--font-mono);">${graduatedCount} Ventures</div>
          </div>
        </div>
      </div>

      <!-- The 8-Stage Incubation Journey Flow Pipeline -->
      <div class="journey-pipeline-container">
        <div class="journey-pipeline-header">
          <div>
            <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>🧭 Incubation Journey Pipeline</span>
              <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">
                (Startup → Application → Evaluation → Selection → Incubation → Mentorship → Milestones → Graduation)
              </span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-outline btn-sm ${this.activeStageFilter === 'all' ? 'active' : ''}" style="font-size: 11px; padding: 4px 10px;" onclick="IncubationModule.setStageFilter('all')">
              All Stages (${startups.length})
            </button>
          </div>
        </div>

        <div class="journey-flow-track">
          ${stages.map((st, i) => {
      const isFilterActive = this.activeStageFilter.toLowerCase() === st.id.toLowerCase();
      const count = stageCounts[st.id] || 0;
      return `
              <div class="journey-stage-node ${isFilterActive ? 'active-filter' : ''}" onclick="IncubationModule.setStageFilter('${st.id}')" title="Filter by ${st.name}">
                <div class="journey-node-step">Stage ${st.stageNumber}</div>
                <div class="journey-node-icon">${st.icon}</div>
                <div class="journey-node-title">${st.name}</div>
                <div class="journey-node-count">${count} ${count === 1 ? 'Startup' : 'Startups'}</div>
              </div>
              ${i < stages.length - 1 ? `<div class="journey-flow-arrow">↓</div>` : ''}
            `;
    }).join('')}
        </div>
      </div>

      <!-- View Selector Tabs & Search Filter Controls -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; gap: 8px; background: var(--bg-surface); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <button class="btn btn-sm ${this.activeViewTab === 'dashboards' ? 'btn-primary' : 'btn-outline'}" onclick="IncubationModule.switchTab('dashboards')">
            🎯 Startup Dashboards (${filteredStartups.length})
          </button>
          <button class="btn btn-sm ${this.activeViewTab === 'pipeline' ? 'btn-primary' : 'btn-outline'}" onclick="IncubationModule.switchTab('pipeline')">
            📊 8-Stage Pipeline Board
          </button>
          <button class="btn btn-sm ${this.activeViewTab === 'mentors' ? 'btn-primary' : 'btn-outline'}" onclick="IncubationModule.switchTab('mentors')">
            🧠 Advisory & Mentors (${mentors.length})
          </button>
          <button class="btn btn-sm ${this.activeViewTab === 'milestones' ? 'btn-primary' : 'btn-outline'}" onclick="IncubationModule.switchTab('milestones')">
            🏁 Milestone Matrix (${totalMilestones})
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Filter by Mentor -->
          <select class="form-control" style="width: auto; padding: 7px 12px; font-size: 12px;" onchange="IncubationModule.setMentorFilter(this.value)">
            <option value="all" ${this.activeMentorFilter === 'all' ? 'selected' : ''}>All Mentors</option>
            ${mentors.map(m => `<option value="${m.id}" ${this.activeMentorFilter === m.id ? 'selected' : ''}>Mentor: ${m.name}</option>`).join('')}
          </select>

          <!-- Search Box -->
          <div style="position: relative; width: 220px;">
            <input type="text" class="form-control" style="padding-left: 28px; font-size: 12px;" placeholder="Search startups..." value="${this.searchQuery}" oninput="IncubationModule.handleSearch(this.value)">
            <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 12px; opacity: 0.6;">🔍</span>
          </div>
        </div>
      </div>

      <!-- Render Active Sub-View -->
      ${this.renderActiveViewContent(filteredStartups, stages, mentors)}
    `;
  },

  renderActiveViewContent(startups, stages, mentors) {
    if (this.activeViewTab === 'pipeline') {
      return this.renderPipelineKanban(startups, stages);
    }
    if (this.activeViewTab === 'mentors') {
      return this.renderMentorsHub(mentors, startups);
    }
    if (this.activeViewTab === 'milestones') {
      return this.renderMilestonesMatrix(startups);
    }
    return this.renderStartupDashboardsGrid(startups, stages);
  },

  // 1. Primary Grid: "For Every Startup: Startup Dashboard"
  renderStartupDashboardsGrid(startups, stages) {
    if (!startups.length) {
      return `
        <div class="card" style="text-align: center; padding: 50px 20px;">
          <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">No startups match the current filter</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">Try clearing stage or mentor filters to view the portfolio.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="IncubationModule.resetFilters()">Reset All Filters</button>
        </div>
      `;
    }

    return `
      <div class="startup-dashboards-grid">
        ${startups.map(s => this.renderStartupCard(s, stages)).join('')}
      </div>
    `;
  },

  renderStartupCard(s, stages) {
    const isFeatured = s.id === 'STP-XYZ';
    const asciiBar = window.store.getAsciiProgressBar(s.progressPercent, 14);
    const stageObj = stages.find(st => st.id.toLowerCase() === (s.incubationJourneyStage || 'milestones').toLowerCase()) || stages[6];
    const mentor = window.store.getMentors().find(m => m.id === s.mentorId) || { name: s.mentorName || 'John Smith', avatarEmoji: '👨‍💼', role: 'Head of Incubation' };
    const curIdx = stages.findIndex(st => st.id.toLowerCase() === (s.incubationJourneyStage || 'milestones').toLowerCase());

    return `
      <div class="startup-dashboard-card ${isFeatured ? 'featured-card' : ''}" id="card-${s.id}">
        <!-- Card Header with Startup identity -->
        <div class="dash-card-header">
          <div class="dash-startup-brand">
            <div class="dash-startup-avatar">${s.logoEmoji || '🚀'}</div>
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent-primary); letter-spacing: 0.5px;">Startup Dashboard</div>
              <h3 class="dash-startup-title">Startup: ${s.name}</h3>
              <div class="dash-startup-sector">${s.category || s.sector} • <span style="font-weight: 600; color: var(--text-secondary);">${s.cohort || 'Cohort 2026-A'}</span></div>
            </div>
          </div>

          <div style="text-align: right;">
            <span class="badge ${s.status === 'Completed' ? 'badge-success' : 'badge-info'}" style="font-size: 11px;">
              ${s.status}
            </span>
          </div>
        </div>

        <!-- Dedicated Requirements Block: Incubation Period, Current Stage, Progress, Mentor, Next Milestone -->
        <div class="dash-detail-section">
          <!-- 1. Incubation Period -->
          <div class="dash-detail-row">
            <span class="dash-label">
              <span>📅</span> Incubation Period
            </span>
            <span class="dash-val" style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-secondary);">
              ${s.incubationPeriod || '01 Jan 2026 → 31 Dec 2026'}
            </span>
          </div>

          <!-- 2. Current Stage -->
          <div class="dash-detail-row">
            <span class="dash-label">
              <span>🧭</span> Current Stage
            </span>
            <span class="dash-val" style="display: flex; align-items: center; gap: 6px;">
              <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--accent-primary); border: 1px solid rgba(99, 102, 241, 0.3); font-size: 11.5px;">
                ${s.currentStage || s.stage || 'MVP Development'}
              </span>
            </span>
          </div>

          <!-- 3. Progress (Strict ASCII blocks requirement: ████████████░░ 80%) -->
          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 2px;">
            <div style="display: flex; justify-content: space-between; font-size: 12.5px;">
              <span class="dash-label"><span>📈</span> Progress</span>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Stage ${stageObj.stageNumber} of 8 (${stageObj.name})</span>
            </div>

            <!-- ASCII Terminal Display Box -->
            <div class="ascii-progress-box" title="Progress Bar string">
              <span class="ascii-code-str">${asciiBar}</span>
              <span style="font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">VERIFIED</span>
            </div>

            <!-- Graphical gradient bar -->
            <div class="progress-track" style="height: 6px; margin-top: 2px;">
              <div class="progress-fill" style="width: ${s.progressPercent}%; background: ${s.progressPercent === 100 ? 'var(--status-success)' : 'var(--accent-gradient)'};"></div>
            </div>
          </div>

          <!-- 4. Mentor -->
          <div class="dash-detail-row" style="padding-top: 4px; border-top: 1px solid var(--border-subtle);">
            <span class="dash-label">
              <span>👨‍💼</span> Mentor
            </span>
            <span class="dash-val" style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 14px;">${mentor.avatarEmoji || '👨‍💼'}</span>
              <span style="font-weight: 700; color: var(--text-primary);">${mentor.name}</span>
            </span>
          </div>

          <!-- 5. Next Milestone -->
          <div class="dash-detail-row">
            <span class="dash-label">
              <span>🎯</span> Next Milestone
            </span>
            <span class="dash-val" style="color: var(--status-success); font-weight: 700;">
              ${s.nextMilestone || 'Product Launch'}
            </span>
          </div>
        </div>

        <!-- 8-Step Mini Journey Stepper Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 2px;">
          <div class="micro-journey-stepper" title="Journey: Startup → Application → Evaluation → Selection → Incubation → Mentorship → Milestones → Graduation">
            ${stages.map((st, idx) => {
      const isDone = idx < curIdx || s.progressPercent === 100;
      const isCur = idx === curIdx && s.progressPercent < 100;
      return `<div class="micro-step-dot ${isDone ? 'done' : isCur ? 'current' : ''}" title="${st.name}"></div>`;
    }).join('')}
          </div>
          <span style="font-size: 11px; color: var(--text-muted);">Target: ${s.nextMilestoneDate || 'Q4 2026'}</span>
        </div>

        <!-- Card Action Buttons -->
        <div class="dash-actions-row">
          <button class="btn btn-outline btn-sm" style="flex: 1; font-size: 11px; padding: 6px 8px;" onclick="IncubationModule.openUpdateProgressModal('${s.id}')">
            ✏️ Update Progress
          </button>
          <button class="btn btn-outline btn-sm" style="flex: 1; font-size: 11px; padding: 6px 8px;" onclick="IncubationModule.advanceStageQuick('${s.id}')" title="Advance to next incubation journey stage">
            ⚡ Advance Stage
          </button>
          <button class="btn btn-primary btn-sm" style="flex: 1.2; font-size: 11px; padding: 6px 8px;" onclick="IncubationModule.viewStartupJourneyModal('${s.id}')">
            🚀 Full Journey
          </button>
        </div>
      </div>
    `;
  },

  // 2. 8-Stage Kanban Pipeline View
  renderPipelineKanban(startups, stages) {
    return `
      <div style="overflow-x: auto; padding-bottom: 20px;">
        <div style="display: flex; gap: 14px; min-width: 1400px; align-items: flex-start;">
          ${stages.map(st => {
      const inStage = startups.filter(s => (s.incubationJourneyStage || '').toLowerCase() === st.id.toLowerCase());
      return `
              <div style="flex: 1; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 14px; min-height: 520px; display: flex; flex-direction: column;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">${st.icon}</span>
                    <div>
                      <div style="font-size: 13px; font-weight: 800; color: var(--text-primary);">${st.name}</div>
                      <div style="font-size: 10px; color: var(--text-muted);">Stage ${st.stageNumber} of 8</div>
                    </div>
                  </div>
                  <span class="badge badge-subtle" style="font-size: 11px;">${inStage.length}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
                  ${inStage.map(s => `
                    <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; cursor: pointer; transition: all 0.2s ease;" onclick="IncubationModule.viewStartupJourneyModal('${s.id}')">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-weight: 800; font-size: 13px; color: var(--text-primary);">${s.logoEmoji || '🚀'} ${s.name}</span>
                        <span class="badge ${s.progressPercent >= 80 ? 'badge-success' : 'badge-info'}" style="font-size: 10px;">${s.progressPercent}%</span>
                      </div>
                      <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
                        ${s.currentStage || s.stage}
                      </div>
                      <div class="progress-track" style="height: 4px; margin-bottom: 8px;">
                        <div class="progress-fill" style="width: ${s.progressPercent}%;"></div>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--text-muted);">
                        <span>Mentor: <strong>${s.mentorName || 'John Smith'}</strong></span>
                        <span style="color: var(--accent-primary); font-weight: 600;">View →</span>
                      </div>
                    </div>
                  `).join('')}

                  ${!inStage.length ? `
                    <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); font-size: 12px; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
                      No ventures in ${st.name} stage
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  },

  // 3. Mentorship & Advisory Network View
  renderMentorsHub(mentors, startups) {
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 18px; margin-bottom: 28px;">
        ${mentors.map(m => {
      const mentoredList = startups.filter(s => s.mentorId === m.id || (m.startupsMentored || []).includes(s.id));
      const isJohnSmith = m.id === 'MEN-05' || m.name === 'John Smith';
      return `
            <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; ${isJohnSmith ? 'border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.12);' : ''}">
              <div>
                <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px;">
                  <div style="display: flex; gap: 14px; align-items: center;">
                    <div style="width: 52px; height: 52px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; font-size: 28px;">
                      ${m.avatarEmoji || '👨‍💼'}
                    </div>
                    <div>
                      <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary);">${m.name}</h4>
                      <div style="font-size: 11.5px; color: var(--accent-secondary); font-weight: 600;">${m.role}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${m.email}</div>
                    </div>
                  </div>
                  ${isJohnSmith ? `<span class="badge badge-success" style="font-size: 10px;">★ Lead Advisor</span>` : ''}
                </div>

                <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; margin-bottom: 14px;">
                  <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Advisory Expertise</div>
                  <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4;">${m.expertise}</div>
                  <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
                    🕒 Office Hours: <strong>${m.officeHours || 'Tuesdays & Thursdays, 2 PM - 6 PM'}</strong>
                  </div>
                </div>

                <div style="margin-bottom: 14px;">
                  <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
                    Mentoring (${mentoredList.length} Startups)
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${mentoredList.map(st => `
                      <span class="badge badge-info" style="font-size: 11px; cursor: pointer;" onclick="IncubationModule.viewStartupJourneyModal('${st.id}')">
                        ${st.logoEmoji || '🚀'} ${st.name} (${st.progressPercent}%)
                      </span>
                    `).join('')}
                    ${!mentoredList.length ? `<span style="font-size: 11.5px; color: var(--text-muted);">Available for pairing</span>` : ''}
                  </div>
                </div>
              </div>

              <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
                <button class="btn btn-outline btn-sm" style="font-size: 11px;" onclick="IncubationModule.openLogMentorSessionModal('', '${m.id}')">
                  📅 Log Mentorship Review
                </button>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  },

  // 4. Milestones Matrix View
  renderMilestonesMatrix(startups) {
    const milestones = window.store.getMilestones();

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>🎯 Venture Milestones & KPI Goals Matrix</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm" onclick="App.switchTab('milestones')">
              🎯 Open 8. Milestone Management Engine →
            </button>
            <button class="btn btn-primary btn-sm" onclick="MilestonesModule.openCreateMilestoneModal('STP-XYZ')">
              + Add Milestone
            </button>
          </div>
        </div>

        <div class="milestones-pipeline">
          ${milestones.map(m => {
      const isCompleted = m.status === 'Completed' || m.progressPercent === 100;
      const startup = startups.find(s => s.id === m.startupId);
      return `
              <div class="milestone-item-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span class="badge badge-info" style="font-size: 11px;">${startup ? startup.name : m.startupName}</span>
                      <span class="badge badge-subtle" style="font-size: 11px;">Stage: ${m.stage}</span>
                    </div>
                    <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary);">${m.title}</h4>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                      Target Date: <strong>${m.targetDate}</strong> • Impact: <strong>${m.kpiImpact || 'Key Growth Driver'}</strong>
                    </div>
                  </div>

                  <div style="text-align: right;">
                    <span class="badge ${isCompleted ? 'badge-success' : 'badge-warning'}" style="font-size: 12px; font-weight: 700;">
                      ${isCompleted ? '✓ Completed' : `${m.progressPercent}% In Progress`}
                    </span>
                  </div>
                </div>

                <div>
                  <div class="progress-track" style="margin-bottom: 6px;">
                    <div class="progress-fill" style="width: ${m.progressPercent}%; background: ${isCompleted ? 'var(--status-success)' : 'var(--accent-gradient)'};"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); font-family: var(--font-mono);">
                    <span>${window.store.getAsciiProgressBar(m.progressPercent, 12)}</span>
                    <span>${m.progressPercent}% Target Achieved</span>
                  </div>
                </div>

                ${m.mentorNotes ? `
                  <div style="background: rgba(255, 255, 255, 0.03); border-left: 3px solid var(--accent-primary); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 12px; color: var(--text-secondary); font-style: italic;">
                    💬 Mentor Notes: "${m.mentorNotes}"
                  </div>
                ` : ''}

                <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
                  <button class="btn btn-outline btn-sm" onclick="IncubationModule.openUpdateMilestoneModal('${m.id}')">
                    Update Milestone
                  </button>
                  ${!isCompleted ? `
                    <button class="btn btn-primary btn-sm" onclick="IncubationModule.markMilestoneDone('${m.id}')">
                      ✓ Mark Completed
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // Deep-Dive Modal: Complete Startup Incubation Journey Dossier
  // -------------------------------------------------------------
  viewStartupJourneyModal(startupId) {
    const s = window.store.getStartupById(startupId);
    if (!s) return;
    window.store.normalizeStartupIncubation(s);

    const stages = window.store.getIncubationJourneyStages();
    const mentors = window.store.getMentors();
    const curIdx = stages.findIndex(st => st.id.toLowerCase() === (s.incubationJourneyStage || 'milestones').toLowerCase());
    const isGraduated = s.incubationJourneyStage?.toLowerCase() === 'graduation' || s.progressPercent === 100;
    const asciiBar = window.store.getAsciiProgressBar(s.progressPercent, 14);

    const html = `
      <div class="modal-overlay active" id="modal-startup-journey">
        <div class="modal-content modal-wide" style="max-width: 920px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 32px;">${s.logoEmoji || '⚡'}</div>
              <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent-primary); letter-spacing: 0.5px;">Incubation Journey Dossier</div>
                <h3 class="modal-title" style="font-size: 20px;">Startup: ${s.name}</h3>
                <div style="font-size: 12px; color: var(--text-muted);">${s.sector} • ${s.cohort || 'Cohort 2026-A'} • Founder: <strong>${s.founders?.name || 'Founder'}</strong></div>
              </div>
            </div>
            <button class="modal-close-btn" onclick="IncubationModule.closeModal('modal-startup-journey')">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Hero Metric Strip -->
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px 22px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Incubation Period</div>
                <div style="font-size: 14px; font-weight: 800; color: var(--accent-secondary); margin-top: 4px; font-family: var(--font-mono);">
                  ${s.incubationPeriod || '01 Jan 2026 → 31 Dec 2026'}
                </div>
              </div>

              <div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Current Stage</div>
                <div style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">
                  ${s.currentStage || s.stage || 'MVP Development'}
                </div>
              </div>

              <div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Assigned Mentor</div>
                <div style="font-size: 15px; font-weight: 800; color: var(--status-info); margin-top: 4px;">
                  ${s.mentorName || 'John Smith'}
                </div>
              </div>

              <div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Next Milestone</div>
                <div style="font-size: 15px; font-weight: 800; color: var(--status-success); margin-top: 4px;">
                  ${s.nextMilestone || 'Product Launch'}
                </div>
              </div>
            </div>

            <!-- ASCII Terminal Progress Display (Prompt Mandate) -->
            <div style="background: #090d16; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: var(--radius-md); padding: 16px 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
                  Incubation Progress Metric
                </div>
                <div style="font-size: 11px; color: #38bdf8; font-family: var(--font-mono); font-weight: 700;">
                  Stage ${curIdx + 1} of 8 (${stages[curIdx]?.name || 'Milestones'})
                </div>
              </div>

              <div class="ascii-progress-box" style="font-size: 15px; padding: 10px 14px; margin-bottom: 10px;">
                <span class="ascii-code-str" id="modal-ascii-display">${asciiBar}</span>
                <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">NEXUS-TRACK-OK</span>
              </div>

              <div class="progress-track" style="height: 8px;">
                <div class="progress-fill" id="modal-progress-bar-fill" style="width: ${s.progressPercent}%; background: ${s.progressPercent === 100 ? 'var(--status-success)' : 'var(--accent-gradient)'};"></div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 11.5px; color: var(--text-muted);">
                <span>Adjust Live Progress:</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <input type="range" min="0" max="100" value="${s.progressPercent}" style="width: 180px;" oninput="IncubationModule.handleLiveProgressSlide('${s.id}', this.value)">
                  <span id="modal-slider-value" style="font-weight: 700; font-family: var(--font-mono); color: #38bdf8; width: 40px;">${s.progressPercent}%</span>
                </div>
              </div>
            </div>

            <!-- The Complete 8-Stage Incubation Journey Timeline -->
            <div style="margin-bottom: 28px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <span>🌱 8-Stage Incubation Journey Pipeline</span>
                </h4>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-primary btn-sm" onclick="IncubationModule.advanceStartupStageFromModal('${s.id}')">
                    ⚡ Advance to Next Stage
                  </button>
                  ${isGraduated ? `
                    <button class="btn btn-outline btn-sm" style="color: #f59e0b; border-color: #f59e0b;" onclick="IncubationModule.viewGraduationCertificate('${s.id}')">
                      🎓 View Graduation Diploma
                    </button>
                  ` : ''}
                </div>
              </div>

              <div class="vertical-journey-timeline">
                ${stages.map((st, i) => {
      const isPast = i < curIdx;
      const isCurrent = i === curIdx;
      const isFuture = i > curIdx;
      return `
                    <div class="v-journey-item ${isPast || (isCurrent && s.progressPercent === 100) ? 'completed' : isCurrent ? 'active-stage' : ''}">
                      <div class="v-journey-icon-wrap">
                        ${isPast || (isCurrent && s.progressPercent === 100) ? '✓' : isCurrent ? '●' : st.stageNumber}
                      </div>

                      <div class="v-journey-content">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 16px;">${st.icon}</span>
                            <span style="font-size: 13.5px; font-weight: 800; color: var(--text-primary);">
                              Stage ${st.stageNumber}: ${st.name}
                            </span>
                          </div>
                          <span class="badge ${isPast ? 'badge-success' : isCurrent ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10.5px;">
                            ${isPast ? 'Cleared' : isCurrent ? 'Active Stage' : 'Pending'}
                          </span>
                        </div>

                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
                          ${st.desc}
                        </div>

                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); border-top: 1px dashed var(--border-subtle); padding-top: 6px; margin-top: 6px;">
                          <span>Key Metric Gate: <strong>${st.kpi}</strong></span>
                          <span>${isPast ? `Completed on ${s.journeyHistory?.[i]?.date || '2026-01-01'}` : isCurrent ? `Current Progress: ${s.progressPercent}%` : 'Upcoming'}</span>
                        </div>
                      </div>
                    </div>
                  `;
    }).join('')}
              </div>
            </div>

            <!-- Mentorship & Milestone Deliverables Section -->
            <div class="grid-2col" style="gap: 16px; margin-bottom: 20px;">
              <!-- Left: Deliverables Checklist -->
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h4 style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">🎯 Milestone Deliverables</h4>
                  <span class="badge badge-info" style="font-size: 10px;">${s.milestoneDeliverables?.length || 4} Tasks</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${(s.milestoneDeliverables || []).map((d, dIdx) => `
                    <label style="display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--text-primary); cursor: pointer; padding: 6px 8px; border-radius: var(--radius-sm); background: var(--bg-surface);">
                      <input type="checkbox" ${d.done ? 'checked' : ''} onchange="IncubationModule.toggleDeliverable('${s.id}', ${dIdx}, this.checked)">
                      <span style="${d.done ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${d.task}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <!-- Right: Mentorship Advisory Session Log -->
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h4 style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">👨‍💼 Mentor Advisory Log</h4>
                  <button class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 3px 8px;" onclick="IncubationModule.openLogMentorSessionModal('${s.id}', '${s.mentorId}')">
                    + Log Session
                  </button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; max-height: 200px; overflow-y: auto;">
                  ${(s.mentorshipSessions || []).map(ses => `
                    <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 10px; border-radius: var(--radius-sm);">
                      <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 2px;">
                        <span>👨‍🏫 ${ses.mentorName}</span>
                        <span>${ses.date}</span>
                      </div>
                      <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${ses.topics}</div>
                      <div style="font-size: 11.5px; color: var(--text-secondary); font-style: italic;">"${ses.feedback}"</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Fast Edit Actions Footer -->
            <div class="modal-footer" style="padding: 16px 0 0 0; border-top: 1px solid var(--border-subtle);">
              <button class="btn btn-secondary" onclick="IncubationModule.closeModal('modal-startup-journey')">Close</button>
              <button class="btn btn-outline" onclick="IncubationModule.openUpdateProgressModal('${s.id}')">✏️ Edit Milestone & Details</button>
              <button class="btn btn-primary" onclick="IncubationModule.advanceStartupStageFromModal('${s.id}')">⚡ Advance Stage →</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleLiveProgressSlide(startupId, newPercent) {
    newPercent = Number(newPercent);
    const sliderValEl = document.getElementById('modal-slider-value');
    if (sliderValEl) sliderValEl.innerText = `${newPercent}%`;

    const fillEl = document.getElementById('modal-progress-bar-fill');
    if (fillEl) fillEl.style.width = `${newPercent}%`;

    const asciiBoxEl = document.getElementById('modal-ascii-display');
    if (asciiBoxEl) {
      asciiBoxEl.innerText = window.store.getAsciiProgressBar(newPercent, 14);
    }

    // Persist
    window.store.updateStartupIncubation(startupId, { progressPercent: newPercent });
  },

  toggleDeliverable(startupId, idx, isChecked) {
    const s = window.store.getStartupById(startupId);
    if (!s || !s.milestoneDeliverables) return;
    s.milestoneDeliverables[idx].done = isChecked;

    // Recalculate percent based on checked deliverables
    const doneCount = s.milestoneDeliverables.filter(d => d.done).length;
    const calcPercent = Math.round((doneCount / s.milestoneDeliverables.length) * 100);
    window.store.updateStartupIncubation(startupId, { progressPercent: calcPercent });

    App.showToast(`Updated deliverable: ${s.milestoneDeliverables[idx].task}`, 'info');
    this.viewStartupJourneyModal(startupId);
    this.render();
  },

  advanceStartupStageFromModal(startupId) {
    const res = window.store.advanceStartupJourneyStage(startupId);
    if (res.success) {
      if (res.graduated) {
        App.showToast(`🎓 Huge Congratulations! ${res.startup.name} has officially graduated!`, 'success');
      } else {
        App.showToast(`🚀 Advanced to Stage ${res.nextStage.stageNumber}: ${res.nextStage.name}!`, 'success');
      }
      this.viewStartupJourneyModal(startupId);
      this.render();
    }
  },

  advanceStageQuick(startupId) {
    const res = window.store.advanceStartupJourneyStage(startupId);
    if (res.success) {
      if (res.graduated) {
        App.showToast(`🎓 Congratulations! ${res.startup.name} has reached Graduation!`, 'success');
      } else {
        App.showToast(`🚀 Advanced ${res.startup.name} to Stage: ${res.nextStage.name}!`, 'success');
      }
      this.render();
    }
  },

  // -------------------------------------------------------------
  // Official Incubation Graduation Certificate Modal
  // -------------------------------------------------------------
  viewGraduationCertificate(startupId) {
    const s = window.store.getStartupById(startupId);
    if (!s) return;

    const html = `
      <div class="modal-overlay active" id="modal-graduation-cert">
        <div class="modal-content" style="max-width: 680px;">
          <div class="modal-header">
            <h3 class="modal-title">🎓 Official Incubation Graduation Certificate</h3>
            <button class="modal-close-btn" onclick="IncubationModule.closeModal('modal-graduation-cert')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="graduation-diploma">
              <div class="diploma-seal">🏆</div>
              <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #d97706; font-weight: 700; margin-bottom: 8px;">
                NEXUS INNOVATION & INCUBATION HUB
              </div>
              <h2 style="font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px;">
                Certificate of Incubation Completion
              </h2>
              <div style="font-size: 13px; color: #94a3b8; margin-bottom: 24px;">
                This certifies that the venture entity
              </div>

              <div style="font-size: 26px; font-weight: 800; color: #38bdf8; margin-bottom: 8px;">
                ${s.name}
              </div>
              <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 24px;">
                CIN: <strong>${s.registrationNumber || 'U72900KA2026PTC194820'}</strong> • Cohort: <strong>${s.cohort || 'Cohort 2026-A'}</strong>
              </div>

              <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; max-width: 520px; margin: 0 auto 28px;">
                Has successfully satisfied all criteria of the 8-stage venture acceleration journey: <em>Startup Genesis, Application, Committee Evaluation, Selection, Incubation, Mentorship Advisory, and Product MVP Milestones</em>, and is hereby inducted into the <strong>Nexus Alumni Fellowship</strong>.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; border-top: 1px dashed rgba(217, 119, 6, 0.4); padding-top: 20px; margin-top: 20px;">
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: #fff;">${s.mentorName || 'John Smith'}</div>
                  <div style="font-size: 11px; color: #94a3b8;">Principal Mentor & Advisory Lead</div>
                </div>
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: #fff;">Dr. Siddharth Nambiar</div>
                  <div style="font-size: 11px; color: #94a3b8;">Governing Director, Nexus Hub</div>
                </div>
              </div>

              <div style="margin-top: 24px; font-size: 10.5px; color: #64748b; font-family: var(--font-mono);">
                VERIFICATION ID: NEXUS-GRAD-${s.id}-2026 • ISSUED AT BENGALURU
              </div>
            </div>

            <div class="modal-footer" style="padding-top: 16px; padding-bottom: 0; padding-right: 0;">
              <button class="btn btn-secondary" onclick="IncubationModule.closeModal('modal-graduation-cert')">Close</button>
              <button class="btn btn-primary" onclick="window.print()">🖨️ Print Diploma</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  // -------------------------------------------------------------
  // Update Progress & Next Milestone Modal
  // -------------------------------------------------------------
  openUpdateProgressModal(startupId) {
    const s = window.store.getStartupById(startupId);
    if (!s) return;
    window.store.normalizeStartupIncubation(s);
    const mentors = window.store.getMentors();
    const stages = window.store.getIncubationJourneyStages();

    const html = `
      <div class="modal-overlay active" id="modal-update-progress">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">✏️ Update Incubation: ${s.name}</h3>
            <button class="modal-close-btn" onclick="IncubationModule.closeModal('modal-update-progress')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="IncubationModule.handleUpdateProgressSubmit(event, '${s.id}')">
              <!-- Incubation Period -->
              <div class="form-group">
                <label class="form-label">Incubation Period (e.g. 01 Jan 2026 → 31 Dec 2026) <span class="required-star">*</span></label>
                <input type="text" name="incubationPeriod" class="form-control" value="${s.incubationPeriod || '01 Jan 2026 → 31 Dec 2026'}" required>
              </div>

              <!-- Current Stage -->
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Current Stage (Title) <span class="required-star">*</span></label>
                  <input type="text" name="currentStage" class="form-control" value="${s.currentStage || s.stage || 'MVP Development'}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Journey Pipeline Step <span class="required-star">*</span></label>
                  <select name="incubationJourneyStage" class="form-control">
                    ${stages.map(st => `
                      <option value="${st.id}" ${(s.incubationJourneyStage || '').toLowerCase() === st.id.toLowerCase() ? 'selected' : ''}>
                        Stage ${st.stageNumber}: ${st.name}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Progress Percentage & Live ASCII string -->
              <div class="form-group">
                <div style="display: flex; justify-content: space-between;">
                  <label class="form-label">Progress Percentage: <strong id="prog-num">${s.progressPercent}%</strong></label>
                  <span style="font-size: 11px; font-family: var(--font-mono); color: #38bdf8;" id="prog-ascii">${window.store.getAsciiProgressBar(s.progressPercent, 12)}</span>
                </div>
                <input type="range" name="progressPercent" min="0" max="100" value="${s.progressPercent}" class="form-control" oninput="
                  document.getElementById('prog-num').innerText = this.value + '%';
                  document.getElementById('prog-ascii').innerText = window.store.getAsciiProgressBar(this.value, 12);
                ">
              </div>

              <!-- Assigned Mentor -->
              <div class="form-group">
                <label class="form-label">Assigned Mentor <span class="required-star">*</span></label>
                <select name="mentorId" class="form-control">
                  ${mentors.map(m => `
                    <option value="${m.id}" ${s.mentorId === m.id ? 'selected' : ''}>
                      ${m.name} (${m.role})
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Next Milestone -->
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Next Milestone Goal <span class="required-star">*</span></label>
                  <input type="text" name="nextMilestone" class="form-control" value="${s.nextMilestone || 'Product Launch'}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Milestone Target Date</label>
                  <input type="date" name="nextMilestoneDate" class="form-control" value="${s.nextMilestoneDate || '2026-11-20'}">
                </div>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="IncubationModule.closeModal('modal-update-progress')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Incubation Details</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleUpdateProgressSubmit(e, startupId) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = {
      incubationPeriod: fd.get('incubationPeriod'),
      currentStage: fd.get('currentStage'),
      incubationJourneyStage: fd.get('incubationJourneyStage'),
      progressPercent: Number(fd.get('progressPercent')),
      mentorId: fd.get('mentorId'),
      nextMilestone: fd.get('nextMilestone'),
      nextMilestoneDate: fd.get('nextMilestoneDate')
    };

    window.store.updateStartupIncubation(startupId, updates);
    this.closeModal('modal-update-progress');
    App.showToast('✅ Startup incubation dashboard updated!', 'success');
    this.render();
  },

  // -------------------------------------------------------------
  // Log Mentorship Advisory Session Modal
  // -------------------------------------------------------------
  openLogMentorSessionModal(startupId = '', mentorId = '') {
    const startups = window.store.getStartups();
    const mentors = window.store.getMentors();

    const html = `
      <div class="modal-overlay active" id="modal-log-mentor-session">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">👨‍🏫 Log Mentor Advisory Review Session</h3>
            <button class="modal-close-btn" onclick="IncubationModule.closeModal('modal-log-mentor-session')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="IncubationModule.handleMentorSessionSubmit(event)">
              <div class="form-group">
                <label class="form-label">Select Startup <span class="required-star">*</span></label>
                <select name="startupId" class="form-control" required>
                  ${startups.map(s => `<option value="${s.id}" ${s.id === startupId ? 'selected' : ''}>${s.name} (${s.category})</option>`).join('')}
                </select>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Mentor <span class="required-star">*</span></label>
                  <select name="mentorId" class="form-control" required>
                    ${mentors.map(m => `<option value="${m.id}" ${m.id === mentorId ? 'selected' : ''}>${m.name} (${m.role})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Session Date <span class="required-star">*</span></label>
                  <input type="date" name="date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Review Topics & Key Questions <span class="required-star">*</span></label>
                <input type="text" name="topics" class="form-control" placeholder="e.g. Unit Economics, GTM Pilot Review, Series A Deck" required>
              </div>

              <div class="form-group">
                <label class="form-label">Mentor Feedback & Agreed Action Items <span class="required-star">*</span></label>
                <textarea name="feedback" class="form-control" rows="3" placeholder="Concrete feedback, next milestone checkpoints, intros..." required></textarea>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="IncubationModule.closeModal('modal-log-mentor-session')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Session Record</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleMentorSessionSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const startupId = fd.get('startupId');
    const mentor = window.store.getMentors().find(m => m.id === fd.get('mentorId'));

    window.store.addMentorshipSession(startupId, {
      mentorName: mentor ? mentor.name : 'John Smith',
      date: fd.get('date'),
      topics: fd.get('topics'),
      feedback: fd.get('feedback'),
      rating: 5
    });

    this.closeModal('modal-log-mentor-session');
    App.showToast('✅ Mentor review session successfully recorded!', 'success');
    this.render();
  },

  // -------------------------------------------------------------
  // Add & Update Milestones Modals
  // -------------------------------------------------------------
  openNewMilestoneModal() {
    const startups = window.store.getStartups();

    const html = `
      <div class="modal-overlay active" id="modal-new-milestone">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">🎯 Add Venture Incubation Milestone</h3>
            <button class="modal-close-btn" onclick="IncubationModule.closeModal('modal-new-milestone')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="form-new-milestone" onsubmit="IncubationModule.handleNewMilestoneSubmit(event)">
              <div class="form-group">
                <label class="form-label">Startup <span class="required-star">*</span></label>
                <select name="startupId" class="form-control" required>
                  ${startups.map(s => `<option value="${s.id}">${s.name} (${s.cohort || 'Cohort 2026-A'})</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Milestone Title <span class="required-star">*</span></label>
                <input type="text" name="title" class="form-control" placeholder="e.g. Public Product Launch & Enterprise GA" required>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Target Completion Date <span class="required-star">*</span></label>
                  <input type="date" name="targetDate" class="form-control" value="2026-11-20" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Initial Progress (%)</label>
                  <input type="number" name="progressPercent" class="form-control" value="80" min="0" max="100">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">KPI / Business Impact</label>
                <input type="text" name="kpiImpact" class="form-control" placeholder="e.g. Unlocks ₹25L ARR & 50 Enterprise Accounts">
              </div>

              <div class="form-group">
                <label class="form-label">Mentor Advisory Notes</label>
                <textarea name="mentorNotes" class="form-control" rows="2" placeholder="Mentor guidance from John Smith / Advisory board..."></textarea>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="IncubationModule.closeModal('modal-new-milestone')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Milestone</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleNewMilestoneSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    window.store.addMilestone(data);
    this.closeModal('modal-new-milestone');
    App.showToast('🎯 Milestone successfully registered for startup!', 'success');
    this.render();
  },

  openUpdateMilestoneModal(id) {
    const m = (window.store.getMilestones() || []).find(x => x.id === id);
    if (!m) return;

    const html = `
      <div class="modal-overlay active" id="modal-update-milestone">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Update Milestone: ${m.title}</h3>
            <button class="modal-close-btn" onclick="IncubationModule.closeModal('modal-update-milestone')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="IncubationModule.handleUpdateSubmit(event, '${m.id}')">
              <div class="form-group">
                <label class="form-label">Progress Percentage: <span id="prog-val">${m.progressPercent}%</span></label>
                <input type="range" name="progressPercent" class="form-control" min="0" max="100" value="${m.progressPercent}" oninput="document.getElementById('prog-val').innerText = this.value + '%'">
              </div>

              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="status" class="form-control">
                  <option value="In Progress" ${m.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Completed" ${m.status === 'Completed' ? 'selected' : ''}>Completed</option>
                  <option value="Delayed" ${m.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Latest Mentor / Founder Notes</label>
                <textarea name="mentorNotes" class="form-control" rows="3">${m.mentorNotes || ''}</textarea>
              </div>

              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="IncubationModule.closeModal('modal-update-milestone')">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Milestone</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleUpdateSubmit(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = {
      progressPercent: Number(fd.get('progressPercent')),
      status: fd.get('status'),
      mentorNotes: fd.get('mentorNotes')
    };

    if (updates.progressPercent === 100) updates.status = 'Completed';

    window.store.updateMilestone(id, updates);
    this.closeModal('modal-update-milestone');
    App.showToast('✅ Milestone progress updated!', 'success');
    this.render();
  },

  markMilestoneDone(id) {
    window.store.updateMilestone(id, { progressPercent: 100, status: 'Completed' });
    App.showToast('🏆 Milestone marked as Completed!', 'success');
    this.render();
  },

  // -------------------------------------------------------------
  // Filter & Navigation Helpers
  // -------------------------------------------------------------
  setStageFilter(stageId) {
    this.activeStageFilter = stageId;
    this.render();
  },

  setMentorFilter(mentorId) {
    this.activeMentorFilter = mentorId;
    this.render();
  },

  switchTab(tab) {
    this.activeViewTab = tab;
    this.render();
  },

  handleSearch(q) {
    this.searchQuery = q;
    this.render();
  },

  resetFilters() {
    this.activeStageFilter = 'all';
    this.activeMentorFilter = 'all';
    this.searchQuery = '';
    this.render();
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
