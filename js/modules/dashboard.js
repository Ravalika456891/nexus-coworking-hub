// Module: Dashboard Overview & Lifecycle Command Center

const DashboardModule = {
  viewStyle: 'classic', // 'classic' (Before Style) | 'showcase' (Wireframe 10) | 'combined'
  isDemoMode: true,
  revenueTimeframe: '6m',

  setViewStyle(style) {
    this.viewStyle = style;
    this.render();
  },

  toggleDemoMode(val) {
    this.isDemoMode = val;
    this.render();
  },

  setRevenueTimeframe(tf) {
    this.revenueTimeframe = tf;
    this.render();
  },

  sendInvoiceNudge() {
    if (window.App && window.App.showToast) {
      window.App.showToast('📲 Automated WhatsApp & Email payment nudges dispatched to 4 founders with outstanding invoices (Total: ₹1.25L).', 'success');
    }
  },

  render() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const role = window.store.normalizeRole(window.store.currentRole);
    const roleInfo = window.store.getCurrentRoleInfo();
    const stats = window.store.getDashboardStats();
    const startups = window.store.getStartups();
    const rooms = window.store.getMeetingRooms();
    const activities = window.store.state.activityLog || [];
    const invoices = window.store.getInvoices();
    const milestones = window.store.getMilestones();
    const payments = window.store.getAccessiblePayments ? window.store.getAccessiblePayments() : (window.store.getPayments ? window.store.getPayments() : []);

    // Count for lifecycle pipeline nodes
    const onboardingCount = startups.filter(s => s.status === 'Applied' || s.status === 'Under Review').length;
    const allocatedCount = startups.filter(s => s.allocatedSeats && s.allocatedSeats.length > 0).length;
    const bookedRoomsCount = stats.totalRoomBookingsCount;
    const billedStartupsCount = allocatedCount;
    const invoicedCount = invoices.length;
    const paidCount = invoices.filter(i => i.status === 'Paid').length;
    const incubationTrackingCount = milestones.filter(m => m.status === 'In Progress').length;

    // Role-specific KPI Grid rendering
    let kpiHtml = '';
    if (role === 'incubator_admin') {
      kpiHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Active Incubated Startups</span>
              <div class="kpi-icon-wrap" style="color: #10b981;">🚀</div>
            </div>
            <div class="kpi-value">${stats.activeStartupsCount}</div>
            <div class="kpi-footer">
              <span class="trend-pill up">Batch 2026</span>
              <span>${stats.totalStartupsCount} total registered ventures</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Applications In Pipeline</span>
              <div class="kpi-icon-wrap" style="color: #6366f1;">📋</div>
            </div>
            <div class="kpi-value">${onboardingCount}</div>
            <div class="kpi-footer">
              <span class="trend-pill warning">Under Review</span>
              <span>Awaiting evaluation & committee</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Mentor Advisory Network</span>
              <div class="kpi-icon-wrap" style="color: #8b5cf6;">🧠</div>
            </div>
            <div class="kpi-value">6 Mentors</div>
            <div class="kpi-footer">
              <span class="trend-pill up">Active</span>
              <span>100% paired with cohorts</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Floorplan Allocation</span>
              <div class="kpi-icon-wrap" style="color: #06b6d4;">🏢</div>
            </div>
            <div class="kpi-value">${stats.occupancyRate}%</div>
            <div class="kpi-footer">
              <span class="trend-pill up">84% Utilized</span>
              <span>${stats.occupiedSpaces} of ${stats.totalSpaces} spaces assigned</span>
            </div>
          </div>
        </div>
      `;
    } else if (role === 'finance_admin') {
      kpiHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Monthly Run-Rate (MRR)</span>
              <div class="kpi-icon-wrap" style="color: #10b981;">₹</div>
            </div>
            <div class="kpi-value">₹${(stats.mrr / 100000).toFixed(2)}L</div>
            <div class="kpi-footer">
              <span class="trend-pill up">↑ 14.2% MoM</span>
              <span>Gross projected recurring billing</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Pending Collections</span>
              <div class="kpi-icon-wrap" style="color: #f59e0b;">⏳</div>
            </div>
            <div class="kpi-value" style="color: #f59e0b;">₹${(stats.totalOutstanding / 1000).toFixed(0)}k</div>
            <div class="kpi-footer">
              <span class="trend-pill warning">${stats.pendingInvoicesCount} Invoices Due</span>
              <span>Awaiting settlement gateway</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Total Invoices Issued</span>
              <div class="kpi-icon-wrap" style="color: #6366f1;">🧾</div>
            </div>
            <div class="kpi-value">${invoicedCount}</div>
            <div class="kpi-footer">
              <span class="trend-pill up">${paidCount} Cleared</span>
              <span>Itemized GST invoices</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">GST Tax Collections (18%)</span>
              <div class="kpi-icon-wrap" style="color: #ec4899;">🏛️</div>
            </div>
            <div class="kpi-value">₹54,900</div>
            <div class="kpi-footer">
              <span class="trend-pill up">Compliant</span>
              <span>CGST (9%) + SGST (9%) accrued</span>
            </div>
          </div>
        </div>
      `;
    } else if (role === 'startup') {
      const activeStartupId = window.store.activeFounderId || 'STP-XYZ';
      const myStartup = window.store.getStartupById(activeStartupId) || startups[0];
      const spaceLabel = (myStartup && myStartup.allocatedSeats && myStartup.allocatedSeats.length > 0)
        ? myStartup.allocatedSeats.join(', ')
        : (myStartup ? (myStartup.spacePreference || 'Desk Allocation Pending') : 'Cabin PC-103');
      const stageLabel = myStartup ? (myStartup.stage || 'Incubation') : 'MVP Development';
      kpiHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">My Allocated Space</span>
              <div class="kpi-icon-wrap" style="color: #06b6d4;">🏢</div>
            </div>
            <div class="kpi-value" style="font-size: 19px;">${spaceLabel}</div>
            <div class="kpi-footer">
              <span class="trend-pill up">${myStartup ? myStartup.status : 'Active'}</span>
              <span>${myStartup ? (myStartup.teamSize || 2) + ' Team Members' : '4 Executive Seats'}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Incubation Progress</span>
              <div class="kpi-icon-wrap" style="color: #10b981;">🌱</div>
            </div>
            <div class="kpi-value">80%</div>
            <div class="kpi-footer">
              <span class="trend-pill up">On Track</span>
              <span>Current Stage: MVP Development</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Assigned Lead Mentor</span>
              <div class="kpi-icon-wrap" style="color: #8b5cf6;">👨‍💼</div>
            </div>
            <div class="kpi-value" style="font-size: 20px;">John Smith</div>
            <div class="kpi-footer">
              <span class="trend-pill up">Weekly Office Hours</span>
              <span>Incubation Advisory Lead</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Next Milestone</span>
              <div class="kpi-icon-wrap" style="color: #f59e0b;">🎯</div>
            </div>
            <div class="kpi-value" style="font-size: 19px;">Revenue Gen</div>
            <div class="kpi-footer">
              <span class="trend-pill warning">Due 30 Oct</span>
              <span>Target: First ₹50k MRR</span>
            </div>
          </div>
        </div>
      `;
    } else if (role === 'mentor') {
      kpiHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Assigned Startups</span>
              <div class="kpi-icon-wrap" style="color: #8b5cf6;">🚀</div>
            </div>
            <div class="kpi-value">2 Ventures</div>
            <div class="kpi-footer">
              <span class="trend-pill up">Active Mentee</span>
              <span>XYZ Technologies & NeuroPulse</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Milestones In Progress</span>
              <div class="kpi-icon-wrap" style="color: #f59e0b;">🎯</div>
            </div>
            <div class="kpi-value">4 Sprint Targets</div>
            <div class="kpi-footer">
              <span class="trend-pill warning">1 Awaiting Review</span>
              <span>Verification requested</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Advisory Sessions Logged</span>
              <div class="kpi-icon-wrap" style="color: #10b981;">📅</div>
            </div>
            <div class="kpi-value">12 Hours</div>
            <div class="kpi-footer">
              <span class="trend-pill up">High Engagement</span>
              <span>Next session: Today at 2:00 PM</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Cohort Incubation Stage</span>
              <div class="kpi-icon-wrap" style="color: #06b6d4;">🌱</div>
            </div>
            <div class="kpi-value">Stage 5 of 8</div>
            <div class="kpi-footer">
              <span class="trend-pill up">Mentorship Phase</span>
              <span>Preparing for Product Launch</span>
            </div>
          </div>
        </div>
      `;
    } else {
      // Super Admin: Omnipotent Overview
      kpiHtml = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Workspace Occupancy</span>
              <div class="kpi-icon-wrap" style="color: var(--status-success);">🏢</div>
            </div>
            <div class="kpi-value">${stats.occupancyRate}%</div>
            <div class="kpi-footer">
              <span class="trend-pill up">↑ 8% MoM</span>
              <span>${stats.occupiedSpaces} of ${stats.totalSpaces} seats occupied</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Active Incubated Startups</span>
              <div class="kpi-icon-wrap" style="color: var(--accent-primary);">🚀</div>
            </div>
            <div class="kpi-value">${stats.activeStartupsCount}</div>
            <div class="kpi-footer">
              <span class="trend-pill up">Batch 2026</span>
              <span>${stats.totalStartupsCount} total registered founders</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Monthly Run-Rate (MRR)</span>
              <div class="kpi-icon-wrap" style="color: var(--accent-secondary);">₹</div>
            </div>
            <div class="kpi-value">₹${(stats.mrr / 100000).toFixed(2)}L</div>
            <div class="kpi-footer">
              <span class="trend-pill up">↑ 14.2%</span>
              <span>Gross projected billing</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Pending Collections</span>
              <div class="kpi-icon-wrap" style="color: var(--status-warning);">⏳</div>
            </div>
            <div class="kpi-value" style="color: ${stats.totalOutstanding > 0 ? 'var(--status-warning)' : 'var(--text-primary)'};">
              ₹${(stats.totalOutstanding / 1000).toFixed(0)}k
            </div>
            <div class="kpi-footer">
              <span class="trend-pill ${stats.pendingInvoicesCount > 0 ? 'warning' : 'up'}">
                ${stats.pendingInvoicesCount} Invoices
              </span>
              <span>Awaiting payment clearance</span>
            </div>
          </div>
        </div>
      `;
    }

    // Role-specific action spotlight bar
    let spotlightHtml = '';
    if (role === 'incubator_admin') {
      spotlightHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-lg); margin-top: 20px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: #10b981; margin-bottom: 3px;">
              🌱 Incubator Admin Perspective: Startup Onboarding & Journey Pipeline
            </h4>
            <p style="font-size: 12px; color: var(--text-secondary);">
              Review incoming venture applications, advance startups along the 8-stage incubation lifecycle, and allocate desks.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm" onclick="App.switchTab('onboarding')">
              📋 Review Startups (${onboardingCount})
            </button>
            <button class="btn btn-primary btn-sm" onclick="App.switchTab('incubation')">
              🌱 Incubation Journey
            </button>
          </div>
        </div>
      `;
    } else if (role === 'finance_admin') {
      spotlightHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-lg); margin-top: 20px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: #f59e0b; margin-bottom: 3px;">
              💰 Finance Admin Perspective: Invoicing & Payment Operations
            </h4>
            <p style="font-size: 12px; color: var(--text-secondary);">
              Generate automated monthly rent invoices with grant subsidies, reconcile payments, and inspect GST receipts.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="App.runMonthlyBillingBatch()">
              ⚡ Run Monthly Invoicing Batch
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.switchTab('payments')">
              💳 Payments Ledger
            </button>
          </div>
        </div>
      `;
    } else if (role === 'startup') {
      spotlightHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--radius-lg); margin-top: 20px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: #06b6d4; margin-bottom: 3px;">
              🚀 Startup Founder Dashboard (XYZ Technologies - Alex Morgan)
            </h4>
            <p style="font-size: 12px; color: var(--text-secondary);">
              Track incubation milestones with Mentor John Smith, review allocated cabin PC-103, and pay monthly invoices online.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="App.switchTab('milestones')">
              🎯 View My Milestones
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.switchTab('meetingRooms')">
              📅 Book Meeting Room
            </button>
          </div>
        </div>
      `;
    } else if (role === 'mentor') {
      spotlightHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-lg); margin-top: 20px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: #8b5cf6; margin-bottom: 3px;">
              🧠 Lead Mentor Workbench (John Smith - Head of Incubation)
            </h4>
            <p style="font-size: 12px; color: var(--text-secondary);">
              Review progress for assigned startups (XYZ Technologies & NeuroPulse AI), verify completed milestones, and schedule sessions.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="App.switchTab('milestones')">
              🎯 Review Milestones
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.switchTab('incubation')">
              🌱 Incubation Tracker
            </button>
          </div>
        </div>
      `;
    } else {
      spotlightHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: var(--accent-gradient-subtle); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); margin-top: 20px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px;">
              👑 Super Admin: Monthly Billing Automation Run
            </h4>
            <p style="font-size: 12px; color: var(--text-secondary);">
              Generate itemized tax invoices with incubation grant subsidies for all active startups with 1 click.
            </p>
          </div>
          <button class="btn btn-primary" onclick="App.runMonthlyBillingBatch()">
            ⚡ Run October Invoicing
          </button>
        </div>
      `;
    }

    const styleSwitcherHtml = `
      <div class="dashboard-style-switcher" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; padding: 12px 18px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: var(--radius-md); background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; font-size: 18px;">
            🎛️
          </div>
          <div>
            <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span>Dashboard Style</span>
              <span class="badge ${this.viewStyle === 'classic' ? 'badge-primary' : 'badge-subtle'}" style="font-size: 10px; font-weight: 700;">
                ${this.viewStyle === 'classic' ? 'Classic (Before) Active' : (this.viewStyle === 'showcase' ? 'Showcase Active' : 'Combined View')}
              </span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              Switch between the clean operational layout (Before) and the executive showcase screen (Item 10)
            </div>
          </div>
        </div>

        <div style="display: flex; background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); border-radius: var(--radius-full); padding: 3px; gap: 4px;">
          <button class="btn btn-sm ${this.viewStyle === 'classic' ? 'btn-primary' : 'btn-ghost'}" onclick="DashboardModule.setViewStyle('classic')" style="font-size: 11px; padding: 5px 14px; border-radius: var(--radius-full); font-weight: 700;">
            📋 Classic Operational (Before Style)
          </button>
          <button class="btn btn-sm ${this.viewStyle === 'showcase' ? 'btn-primary' : 'btn-ghost'}" onclick="DashboardModule.setViewStyle('showcase')" style="font-size: 11px; padding: 5px 14px; border-radius: var(--radius-full); font-weight: 700;">
            🏛️ Showcase Screen (Item 10)
          </button>
          <button class="btn btn-sm ${this.viewStyle === 'combined' ? 'btn-primary' : 'btn-ghost'}" onclick="DashboardModule.setViewStyle('combined')" style="font-size: 11px; padding: 5px 14px; border-radius: var(--radius-full); font-weight: 700;">
            🔀 Combined View
          </button>
        </div>
      </div>
    `;

    if (this.viewStyle === 'showcase') {
      container.innerHTML = `
        ${styleSwitcherHtml}
        ${this.renderShowcaseScreen(stats, startups, rooms)}
      `;
      return;
    }

    const showcaseBlock = (this.viewStyle === 'combined') 
      ? this.renderShowcaseScreen(stats, startups, rooms) 
      : '';

    container.innerHTML = `
      ${styleSwitcherHtml}
      ${showcaseBlock}

      <!-- 1. Role-Adaptive High-Impact KPI Grid -->
      ${kpiHtml}

      <!-- Role-Specific Action Spotlight Banner -->
      ${spotlightHtml}

      <!-- 2. Interactive Lifecycle Pipeline Bar -->
      <div class="lifecycle-stepper-card">
        <div class="lifecycle-stepper-header">
          <div class="lifecycle-stepper-title">
            <span>🔄 Incubation & Space Lifecycle Journey</span>
            <span class="badge badge-info" style="font-size: 11px;">Complete End-to-End Workflow</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="App.openOnboardModal()">
            + Quick Onboard
          </button>
        </div>

        <div class="lifecycle-stages-bar">
          <div class="lifecycle-node active-stage" onclick="App.switchTab('onboarding')">
            <div class="node-icon-circle">1</div>
            <span class="node-label">Onboarding</span>
            <span class="node-count">${onboardingCount} Startups</span>
          </div>
          <span class="lifecycle-arrow">➔</span>

          <div class="lifecycle-node" onclick="App.switchTab('workspace')">
            <div class="node-icon-circle">2</div>
            <span class="node-label">Workspace</span>
            <span class="node-count">${allocatedCount} Allocated</span>
          </div>
          <span class="lifecycle-arrow">➔</span>

          <div class="lifecycle-node" onclick="App.switchTab('meetingRooms')">
            <div class="node-icon-circle">3</div>
            <span class="node-label">Meeting Rooms</span>
            <span class="node-count">${bookedRoomsCount} Bookings</span>
          </div>
          <span class="lifecycle-arrow">➔</span>

          <div class="lifecycle-node" onclick="App.switchTab('billing')">
            <div class="node-icon-circle">4</div>
            <span class="node-label">Rent Engine</span>
            <span class="node-count">Auto-Prorated</span>
          </div>
          <span class="lifecycle-arrow">➔</span>

          <div class="lifecycle-node" onclick="App.switchTab('billing')">
            <div class="node-icon-circle">5</div>
            <span class="node-label">Invoices</span>
            <span class="node-count">${invoicedCount} Issued</span>
          </div>
          <span class="lifecycle-arrow">➔</span>

          <div class="lifecycle-node" onclick="App.switchTab('payments')">
            <div class="node-icon-circle">6</div>
            <span class="node-label">Payments</span>
            <span class="node-count">${paidCount} Cleared</span>
          </div>
          <span class="lifecycle-arrow">➔</span>

          <div class="lifecycle-node" onclick="App.switchTab('incubation')">
            <div class="node-icon-circle">7</div>
            <span class="node-label">Incubation</span>
            <span class="node-count">${incubationTrackingCount} Milestones</span>
          </div>
          <span class="lifecycle-arrow">➔</span>

          <div class="lifecycle-node" onclick="App.switchTab('reports')">
            <div class="node-icon-circle">8</div>
            <span class="node-label">Reports</span>
            <span class="node-count">Analytics</span>
          </div>
        </div>
      </div>

      <!-- 3. Dashboard Body Grid: Activity Feed & Today's Schedule -->
      <div class="grid-2col">
        <!-- Real-time Activity Ledger -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>⚡ Live Hub Activity Feed</span>
            </div>
            <span class="badge badge-subtle">Real-Time</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${activities.slice(0, 5).map(act => `
              <div style="display: flex; align-items: flex-start; gap: 12px; padding: 10px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
                <div style="font-size: 20px; line-height: 1;">${act.icon}</div>
                <div style="flex: 1;">
                  <div style="font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 2px;">
                    ${act.description}
                  </div>
                  <div style="display: flex; gap: 8px; font-size: 11px; color: var(--text-muted);">
                    <span style="font-weight: 600; color: var(--accent-secondary);">${act.category}</span>
                    <span>•</span>
                    <span>${act.timestamp}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Today's Conference & Meeting Room Schedule -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📅 Today's Room Reservations</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="App.switchTab('meetingRooms')">
              + Book Room
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${this.renderTodayBookings(rooms)}
          </div>
        </div>
      </div>

      <!-- 4. Reconciled Payment History & Financial Settlements Section -->
      ${this.renderDashboardPaymentHistory(role, payments)}

      <!-- Role-Specific Bottom Action Bar -->
      ${(role === 'super_admin' || role === 'finance_admin') ? `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: var(--accent-gradient-subtle); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); margin-top: 20px;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px;">
              ⚡ Monthly Billing & Rent Automation Engine
            </h4>
            <p style="font-size: 12px; color: var(--text-secondary);">
              Generate itemized tax invoices with incubation grant subsidies for all active startups with 1 click.
            </p>
          </div>
          <button class="btn btn-primary" onclick="App.runMonthlyBillingBatch()">
            ⚡ Run October Invoicing
          </button>
        </div>
      ` : ''}
    `;
  },

  renderDashboardPaymentHistory(role, payments) {
    if (role === 'startup') {
      const activeStartupId = window.store.activeFounderId || 'STP-XYZ';
      const summary = window.store.getPaymentSummaryForStartup ? window.store.getPaymentSummaryForStartup(activeStartupId) : null;
      const startupPayments = window.store.getPaymentsByStartupId ? window.store.getPaymentsByStartupId(activeStartupId) : payments;
      const myStartup = window.store.getStartupById ? window.store.getStartupById(activeStartupId) : null;
      const sName = myStartup ? myStartup.name : 'My Venture';

      return `
        <div class="card" style="margin-top: 20px;">
          <div class="card-header" style="padding: 16px 20px; flex-wrap: wrap; gap: 12px; background: var(--bg-surface);">
            <div>
              <div class="card-title" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span>💳 My Payment History & Reconciled Receipts</span>
                <span class="badge badge-success" style="font-size: 11px;">${startupPayments.length} Settlements</span>
                ${summary ? `
                  <span class="badge" style="background: rgba(16,185,129,0.12); color: var(--status-success); font-family: var(--font-mono); font-weight: 700;">
                    ₹${Math.round(summary.totalPaid).toLocaleString('en-IN')} Paid
                  </span>
                  ${summary.balanceDue > 0 ? `
                    <span class="badge" style="background: rgba(239,68,68,0.12); color: var(--status-danger); font-family: var(--font-mono); font-weight: 700;">
                      ₹${Math.round(summary.balanceDue).toLocaleString('en-IN')} Balance Due
                    </span>
                  ` : ''}
                ` : ''}
              </div>
              <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 3px;">
                Verified tax payments, official receipts, and settlement statements for ${sName}.
              </div>
            </div>

            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" onclick="PaymentsModule.openStartupPaymentHistoryModal('${activeStartupId}')" title="Open complete payment ledger dossier">
                📊 Open Full Payment Dossier
              </button>
              <button class="btn btn-primary btn-sm" onclick="window.store.exportPaymentsCSV('${activeStartupId}')" title="Download official CSV payment statement">
                📥 Export Statement (CSV)
              </button>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="nexus-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Linked Invoice</th>
                  <th>Gateway / Method</th>
                  <th>Transaction Ref / UTR</th>
                  <th>Amount Paid</th>
                  <th style="text-align: right;">Receipt</th>
                </tr>
              </thead>
              <tbody>
                ${startupPayments.length > 0 ? startupPayments.slice(0, 5).map(p => `
                  <tr>
                    <td>
                      <span class="badge badge-subtle" style="font-family: var(--font-mono); font-size: 11px;">
                        ${p.receiptNo || p.id}
                      </span>
                    </td>
                    <td style="font-size: 12px; color: var(--text-secondary);">${p.paymentDate || '—'}</td>
                    <td>
                      <button class="btn btn-ghost btn-sm" style="font-family: var(--font-mono); font-size: 11px; padding: 2px 6px;"
                        onclick="InvoiceModule.viewInvoice('${p.invoiceId}')">
                        🧾 ${p.invoiceId || '—'}
                      </button>
                    </td>
                    <td>
                      <span class="badge ${p.gateway === 'Razorpay' ? 'badge-info' : p.gateway === 'Stripe' ? '' : 'badge-success'}"
                        style="${p.gateway === 'Stripe' ? 'background: rgba(99,91,255,0.15); color: #635bff;' : ''} font-size: 10.5px;">
                        ${p.gateway || p.method || 'Online'}
                      </span>
                    </td>
                    <td>
                      <code style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted);">
                        ${p.transactionRef || '—'}
                      </code>
                    </td>
                    <td>
                      <strong style="font-family: var(--font-mono); font-size: 12.5px; color: var(--status-success);">
                        ₹${Number(p.amount || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 8px; color: var(--status-success); border-color: var(--status-success);"
                        onclick="PaymentsModule.viewReceipt('${p.id}')">
                        📄 Receipt
                      </button>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">
                      No payment settlements recorded yet for this venture.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Super Admin & Management Overview
    const recentPayments = payments.slice(0, 5);
    const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

    return `
      <div class="card" style="margin-top: 20px;">
        <div class="card-header" style="padding: 16px 20px; flex-wrap: wrap; gap: 12px; background: var(--bg-surface);">
          <div>
            <div class="card-title" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span>💳 Recent Hub Payment Settlements (Stage 6)</span>
              <span class="badge badge-success" style="font-size: 11px;">${payments.length} Reconciled</span>
              <span class="badge" style="background: rgba(16,185,129,0.12); color: var(--status-success); font-family: var(--font-mono); font-weight: 700;">
                ₹${Math.round(totalCollected).toLocaleString('en-IN')} Total Collected
              </span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 3px;">
              Live settlement audit trail from Razorpay, Stripe, UPI, and Bank Wire collections.
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" onclick="App.switchTab('payments')" title="Open Stage 6 Payments Ledger">
              📋 View Full Ledger
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.store.exportPaymentsCSV()" title="Export all payments to CSV">
              📥 Export Payments (CSV)
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="nexus-table">
            <thead>
              <tr>
                <th>Payment / Receipt</th>
                <th>Startup</th>
                <th>Settlement Date</th>
                <th>Gateway</th>
                <th>Amount</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${recentPayments.length > 0 ? recentPayments.map(p => `
                <tr>
                  <td>
                    <div style="font-family: var(--font-mono); font-weight: 700; font-size: 12px; color: var(--text-primary);">${p.receiptNo || p.id}</div>
                    <code style="font-size: 10.5px; font-family: var(--font-mono); color: var(--text-muted);">${p.transactionRef || ''}</code>
                  </td>
                  <td>
                    <div style="font-weight: 600; font-size: 12.5px; color: var(--text-primary);">${p.startupName || '—'}</div>
                    <span style="font-size: 10.5px; color: var(--text-muted);">${p.startupId || ''}</span>
                  </td>
                  <td style="font-size: 12px; color: var(--text-secondary);">${p.paymentDate || '—'}</td>
                  <td>
                    <span class="badge ${p.gateway === 'Razorpay' ? 'badge-info' : p.gateway === 'Stripe' ? '' : 'badge-success'}"
                      style="${p.gateway === 'Stripe' ? 'background: rgba(99,91,255,0.15); color: #635bff;' : ''} font-size: 10.5px;">
                      ${p.gateway || p.method || 'Online'}
                    </span>
                  </td>
                  <td>
                    <strong style="font-family: var(--font-mono); font-size: 13px; color: var(--status-success);">
                      ₹${Number(p.amount || 0).toLocaleString('en-IN')}
                    </strong>
                    ${p.isPartial ? '<span class="badge badge-subtle" style="font-size: 9.5px; margin-left: 4px;">Partial</span>' : ''}
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                      <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 8px; color: var(--status-success); border-color: var(--status-success);"
                        onclick="PaymentsModule.viewReceipt('${p.id}')" title="View Reconciled Receipt">
                        📄 Receipt
                      </button>
                      ${p.startupId ? `
                        <button class="btn btn-ghost btn-sm" style="font-size: 11px; padding: 3px 6px;"
                          onclick="PaymentsModule.openStartupPaymentHistoryModal('${p.startupId}')" title="View Startup History Dossier">
                          📊 History
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTodayBookings(rooms) {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = [];
    rooms.forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.date === today && b.status !== 'Cancelled') {
          todayBookings.push({ ...b, roomName: r.name, roomColor: r.badgeColor });
        }
      });
    });

    if (todayBookings.length === 0) {
      return `
        <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px;">
          No meeting room reservations scheduled for today yet.
        </div>
      `;
    }

    return todayBookings.map(b => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
        <div>
          <div style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">${b.title}</div>
          <div style="font-size: 11.5px; color: var(--text-muted); display: flex; gap: 8px; margin-top: 3px;">
            <span style="color: ${b.roomColor}; font-weight: 600;">${b.roomName}</span>
            <span>•</span>
            <span>${b.startupName}</span>
            <span>•</span>
            <span>${b.attendees} attendees</span>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-info" style="font-family: var(--font-mono);">${b.startTime} - ${b.endTime}</span>
        </div>
      </div>
    `).join('');
  },

  renderShowcaseScreen(stats, startups, rooms) {
    const isShowcase = this.isDemoMode;
    const tf = this.revenueTimeframe || '6m';

    const showcaseData = {
      startupsCount: isShowcase ? 48 : stats.totalStartupsCount,
      workspacesCount: isShowcase ? 72 : stats.totalSpaces,
      monthlyRevenue: isShowcase ? '₹8.4 L' : `₹${(stats.mrr / 100000).toFixed(1)} L`,
      pendingInvoices: isShowcase ? '₹1.25 L' : `₹${(stats.totalOutstanding / 100000).toFixed(2)} L`,
      occupancy: isShowcase ? '86%' : `${stats.occupancyRate}%`,
      cohortInfo: isShowcase ? '48 Incubated Startups • Cohort 2026-B' : `${stats.activeStartupsCount} Active Incubated Ventures`,
      occupiedDesks: isShowcase ? 62 : stats.occupiedSpaces,
      totalDesks: isShowcase ? 72 : stats.totalSpaces,
      availableDesks: isShowcase ? 10 : (stats.totalSpaces - stats.occupiedSpaces),
      pendingCount: isShowcase ? '4 Invoices Outstanding • 1 Overdue' : `${stats.pendingInvoicesCount} Invoices Awaiting Settlement`
    };

    return `
      <div class="showcase-frame" id="admin-showcase-container">
        <!-- ─── Showcase Header Deck ─────────────────────────────────── -->
        <div class="showcase-title-banner">
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div class="showcase-icon-box">
              🏛️
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span class="showcase-title-text">INCUBATION MANAGEMENT</span>
                <span class="showcase-title-badge-pill">
                  <span class="showcase-pulse-dot"></span>
                  <span style="font-size: 11px; font-weight: 800; color: #22d3ee; letter-spacing: 0.5px;">LIVE HUB OPS</span>
                </span>
              </div>
              <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.6px; margin-top: 3px;">
                10. ADMIN DASHBOARD • MAIN SHOWCASE SCREEN • CYBER CITY CAMPUS, BENGALURU
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Live Time Pill -->
            <div class="showcase-time-pill">
              <span class="showcase-dot-green">●</span>
              <span>OCT 2026 • 15:15 IST</span>
            </div>

            <!-- Mode Switcher & Layout Return -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="showcase-mode-switcher-wrap">
                <button class="btn btn-sm ${this.isDemoMode ? 'btn-primary' : 'btn-ghost'}" onclick="DashboardModule.toggleDemoMode(true)" style="font-size: 11px; padding: 4px 12px; border-radius: var(--radius-full); font-weight: 700;">
                  ✨ Showcase Mode (48 / ₹8.4L)
                </button>
                <button class="btn btn-sm ${!this.isDemoMode ? 'btn-primary' : 'btn-ghost'}" onclick="DashboardModule.toggleDemoMode(false)" style="font-size: 11px; padding: 4px 12px; border-radius: var(--radius-full); font-weight: 700;">
                  ⚡ Live Store Mode
                </button>
              </div>

              <button class="btn btn-ghost btn-sm showcase-classic-btn" onclick="DashboardModule.setViewStyle('classic')" title="Return to Before / Classic Operational Dashboard" style="font-size: 11px; padding: 5px 12px; border-radius: var(--radius-full);">
                ↩ Classic Layout
              </button>
            </div>
          </div>
        </div>

        <!-- ─── Top 3-Column Hero KPI Grid ─────────────────────────────── -->
        <!-- Startups (48) | Workspaces (72) | Monthly Revenue (₹8.4 L) -->
        <div class="showcase-kpi-3col">
          <!-- Card 1: Startups (48) -->
          <div class="showcase-kpi-card" style="--card-accent: #10b981; cursor: pointer;" onclick="App.switchTab('onboarding')" title="View Startup Directory & Pipeline">
            <div class="kpi-label">
              <span>Startups</span>
              <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                🚀
              </div>
            </div>

            <div style="display: flex; align-items: baseline; justify-content: space-between;">
              <div class="kpi-number" style="color: #10b981;">${showcaseData.startupsCount}</div>
              <!-- Mini Sparkline SVG -->
              <svg width="80" height="32" viewBox="0 0 80 32" style="overflow: visible;">
                <path d="M 0,26 Q 20,22 40,14 T 80,4" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" />
                <path d="M 0,26 Q 20,22 40,14 T 80,4 L 80,32 L 0,32 Z" fill="rgba(16, 185, 129, 0.12)" />
                <circle cx="80" cy="4" r="3.5" fill="#10b981" />
              </svg>
            </div>

            <!-- Incubation Stages Distribution Meter -->
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
              <div style="flex: 1; height: 5px; border-radius: 3px; background: #10b981;" title="Incubation Phase: 18"></div>
              <div style="flex: 1; height: 5px; border-radius: 3px; background: #06b6d4;" title="MVP Development: 12"></div>
              <div style="flex: 1; height: 5px; border-radius: 3px; background: #8b5cf6;" title="Mentorship Stage: 14"></div>
              <div style="flex: 0.4; height: 5px; border-radius: 3px; background: #f59e0b;" title="Graduation Ready: 4"></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              <span class="trend-pill up">+12 This Quarter</span>
              <span style="color: var(--text-secondary); font-weight: 600;">94% Active Retention</span>
            </div>
          </div>

          <!-- Card 2: Workspaces (72) -->
          <div class="showcase-kpi-card" style="--card-accent: #818cf8; cursor: pointer;" onclick="App.switchTab('workspace')" title="View Floorplan & Space Allocator">
            <div class="kpi-label">
              <span>Workspaces</span>
              <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                🏢
              </div>
            </div>

            <div style="display: flex; align-items: baseline; justify-content: space-between;">
              <div class="kpi-number" style="color: #a5b4fc;">${showcaseData.workspacesCount}</div>
              <!-- Mini Donut / Segment Pill -->
              <div style="display: flex; flex-direction: column; align-items: flex-end; font-size: 11px; font-family: var(--font-mono); color: var(--text-muted);">
                <span style="color: #a5b4fc; font-weight: 700;">62 Assigned</span>
                <span style="color: #10b981; font-weight: 700;">10 Available</span>
              </div>
            </div>

            <!-- Workspace Type Breakdown Bar -->
            <div style="display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: rgba(255, 255, 255, 0.08); margin-top: 2px;">
              <div style="width: 52%; background: #6366f1;" title="Dedicated Desks: 38"></div>
              <div style="width: 26%; background: #06b6d4;" title="Hot Desks: 18"></div>
              <div style="width: 22%; background: #ec4899;" title="Private Cabins: 16"></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              <span class="trend-pill up">86% Occupancy</span>
              <span style="color: var(--text-secondary); font-weight: 600;">Dedicated • Hot • Cabins</span>
            </div>
          </div>

          <!-- Card 3: Monthly Revenue (₹8.4 L) -->
          <div class="showcase-kpi-card" style="--card-accent: #06b6d4; cursor: pointer;" onclick="App.switchTab('billing')" title="View Monthly Rent & GST Invoices">
            <div class="kpi-label">
              <span>Monthly Revenue</span>
              <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                💰
              </div>
            </div>

            <div style="display: flex; align-items: baseline; justify-content: space-between;">
              <div class="kpi-number" style="color: #22d3ee;">${showcaseData.monthlyRevenue}</div>
              <!-- Mini Sparkline SVG -->
              <svg width="80" height="32" viewBox="0 0 80 32" style="overflow: visible;">
                <path d="M 0,28 Q 20,20 40,16 T 80,4" fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round" />
                <path d="M 0,28 Q 20,20 40,16 T 80,4 L 80,32 L 0,32 Z" fill="rgba(6, 182, 212, 0.12)" />
                <circle cx="80" cy="4" r="3.5" fill="#22d3ee" />
              </svg>
            </div>

            <!-- Mini Revenue Milestone Meter -->
            <div class="progress-track" style="height: 6px; margin-top: 2px;">
              <div class="progress-fill" style="width: 100%; background: linear-gradient(90deg, #6366f1, #06b6d4);"></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              <span class="trend-pill up">↑ 18.2% YoY</span>
              <span style="color: #22d3ee; font-weight: 700; font-family: var(--font-mono);">₹1.01 Cr Proj. ARR</span>
            </div>
          </div>
        </div>

        <!-- ─── Centerpiece: Revenue Analytics (📈) ─────────────────────── -->
        <div class="showcase-analytics-card">
          <div class="showcase-analytics-header">
            <div>
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span style="font-size: 22px;">📈</span>
                <span style="font-size: 17px; font-weight: 900; color: var(--text-primary); letter-spacing: 0.3px;">Revenue Analytics</span>
                <span class="badge badge-success" style="font-size: 11.5px; font-weight: 800; padding: 3px 10px;">
                  ★ Peak MRR: ${showcaseData.monthlyRevenue}
                </span>
                <span style="font-size: 11.5px; color: #10b981; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                  <span>↑</span> <span>18.2% vs Previous Quarter</span>
                </span>
              </div>
              <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">
                Monthly recurring billing progression across incubation licenses, workspace allocation, and conference room demand.
              </p>
            </div>

            <!-- Timeframe Filter Buttons -->
            <div style="display: flex; align-items: center; gap: 6px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-full); padding: 3px;">
              <button class="btn btn-sm ${tf === '6m' ? 'btn-primary' : 'btn-ghost'}" onclick="DashboardModule.setRevenueTimeframe('6m')" style="font-size: 11px; padding: 3px 10px; border-radius: var(--radius-full); font-weight: 700;">
                6M Trajectory
              </button>
              <button class="btn btn-sm ${tf === 'q3' ? 'btn-primary' : 'btn-ghost'}" onclick="DashboardModule.setRevenueTimeframe('q3')" style="font-size: 11px; padding: 3px 10px; border-radius: var(--radius-full); font-weight: 700;">
                Q3 Cohorts
              </button>
              <button class="btn btn-sm ${tf === 'annual' ? 'btn-primary' : 'btn-ghost'}" onclick="DashboardModule.setRevenueTimeframe('annual')" style="font-size: 11px; padding: 3px 10px; border-radius: var(--radius-full); font-weight: 700;">
                FY26 Targets
              </button>
            </div>
          </div>

          <!-- Deluxe SVG Spline Area Chart -->
          <div style="width: 100%; height: 210px; margin: 12px 0 16px;">
            ${this.renderRevenueSvgChart(tf)}
          </div>

          <!-- Revenue Category Breakdown Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
            <!-- Stream 1 -->
            <div style="padding: 14px 16px; border-radius: var(--radius-md); background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(99, 102, 241, 0.25);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Workspace Licenses</span>
                <span style="font-size: 11px; font-weight: 800; color: #a5b4fc;">69%</span>
              </div>
              <div style="font-size: 19px; font-weight: 900; color: #a5b4fc; margin: 4px 0 8px; font-family: var(--font-mono);">
                ₹5,80,000 <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">/ mo</span>
              </div>
              <div class="progress-track" style="height: 5px;">
                <div class="progress-fill" style="width: 69%; background: #6366f1;"></div>
              </div>
            </div>

            <!-- Stream 2 -->
            <div style="padding: 14px 16px; border-radius: var(--radius-md); background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(16, 185, 129, 0.25);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Incubation & Mentorship</span>
                <span style="font-size: 11px; font-weight: 800; color: #10b981;">19%</span>
              </div>
              <div style="font-size: 19px; font-weight: 900; color: #10b981; margin: 4px 0 8px; font-family: var(--font-mono);">
                ₹1,60,000 <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">/ mo</span>
              </div>
              <div class="progress-track" style="height: 5px;">
                <div class="progress-fill" style="width: 19%; background: #10b981;"></div>
              </div>
            </div>

            <!-- Stream 3 -->
            <div style="padding: 14px 16px; border-radius: var(--radius-md); background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(6, 182, 212, 0.25);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Meeting Rooms & Credits</span>
                <span style="font-size: 11px; font-weight: 800; color: #22d3ee;">12%</span>
              </div>
              <div style="font-size: 19px; font-weight: 900; color: #22d3ee; margin: 4px 0 8px; font-family: var(--font-mono);">
                ₹1,00,000 <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">/ mo</span>
              </div>
              <div class="progress-track" style="height: 5px;">
                <div class="progress-fill" style="width: 12%; background: #06b6d4;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Middle 2-Column KPI Cards ──────────────────────────────── -->
        <!-- Pending Invoices (₹1.25 L) | Occupancy (86%) -->
        <div class="showcase-kpi-2col">
          <!-- Pending Invoices Card -->
          <div class="showcase-kpi-card" style="--card-accent: #f59e0b; cursor: pointer;" onclick="App.switchTab('billing')" title="Review Pending Invoices & Rent Ledger">
            <div class="kpi-label">
              <span>Pending Invoices</span>
              <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                ⏳
              </div>
            </div>

            <div style="display: flex; align-items: baseline; justify-content: space-between;">
              <div class="kpi-number" style="color: #fbbf24;">${showcaseData.pendingInvoices}</div>
              <span class="trend-pill warning">4 Invoices Due</span>
            </div>

            <!-- Overdue Warning Callout -->
            <div style="padding: 10px 12px; border-radius: var(--radius-md); background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); font-size: 11.5px; color: #fbbf24; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span>⚠️ 1 Overdue (₹29,500) • 3 Due in 5 Days</span>
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); DashboardModule.sendInvoiceNudge();" style="font-size: 10.5px; padding: 3px 8px; border-color: rgba(245, 158, 11, 0.5); color: #fbbf24;">
                ⚡ Nudge Founders
              </button>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              <span>Automated Razorpay & UPI Links active</span>
              <span style="color: var(--accent-primary); font-weight: 700;">Open Billing Engine ➔</span>
            </div>
          </div>

          <!-- Occupancy Card -->
          <div class="showcase-kpi-card" style="--card-accent: #10b981; cursor: pointer;" onclick="App.switchTab('workspace')" title="View Floorplan Space Allocation">
            <div class="kpi-label">
              <span>Occupancy</span>
              <div style="width: 34px; height: 34px; border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                📊
              </div>
            </div>

            <div style="display: flex; align-items: baseline; justify-content: space-between;">
              <div class="kpi-number" style="color: #34d399;">${showcaseData.occupancy}</div>
              <span class="trend-pill up">${showcaseData.occupiedDesks} of ${showcaseData.totalDesks} Desks</span>
            </div>

            <!-- Segmented Multi-Zone Bar -->
            <div style="margin-top: 2px;">
              <div class="progress-track" style="height: 8px;">
                <div class="progress-fill" style="width: ${showcaseData.occupancy}; background: linear-gradient(90deg, #10b981, #06b6d4);"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); margin-top: 6px;">
                <span>Zone A (Floor 1): 92%</span>
                <span>Zone B (Floor 2): 80%</span>
                <span style="color: #10b981; font-weight: 700;">Cabins: 100% Full</span>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              <span style="color: #34d399; font-weight: 700;">${showcaseData.availableDesks} Desks Ready for Move-In</span>
              <span style="color: var(--accent-primary); font-weight: 700;">Floorplan Map ➔</span>
            </div>
          </div>
        </div>

        <!-- ─── Bottom Section: Recent Bookings ────────────────────────── -->
        <div class="showcase-bookings-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">📅</span>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 16px; font-weight: 900; color: var(--text-primary);">Recent Bookings</span>
                  <span class="badge badge-info" style="font-size: 11px; padding: 2px 8px;">4 Active Reservations Today</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  Real-time conference room reservations, investor pitch sessions, and mentor 1-on-1 bookings.
                </div>
              </div>
            </div>

            <button class="btn btn-primary btn-sm" onclick="App.switchTab('meetingRooms')" style="font-size: 11.5px; padding: 6px 14px; gap: 6px;">
              + Book Meeting Room
            </button>
          </div>

          <!-- Booking Rows directly matching wireframe: Startup A & Startup B -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Wireframe Item 1: Startup A → Meeting Room 01 → 10:00 AM -->
            <div class="showcase-booking-item">
              <div class="booking-wireframe-route">
                <span style="font-weight: 800; color: #10b981; font-size: 15px;">Startup A</span>
                <span class="booking-arrow-glyph">➔</span>
                <span style="font-weight: 700; color: var(--text-primary);">Meeting Room 01</span>
                <span class="booking-arrow-glyph">➔</span>
                <span class="booking-time-badge">10:00 AM</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span style="font-size: 12px; color: var(--text-muted);">Discussion Pod (4 Pax) • 4K Screen Active</span>
                <span class="badge badge-success" style="font-size: 11px; font-weight: 800;">● IN SESSION</span>
              </div>
            </div>

            <!-- Wireframe Item 2: Startup B → Conference Room → 2:00 PM -->
            <div class="showcase-booking-item">
              <div class="booking-wireframe-route">
                <span style="font-weight: 800; color: #818cf8; font-size: 15px;">Startup B</span>
                <span class="booking-arrow-glyph">➔</span>
                <span style="font-weight: 700; color: var(--text-primary);">Conference Room</span>
                <span class="booking-arrow-glyph">➔</span>
                <span class="booking-time-badge">2:00 PM</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span style="font-size: 12px; color: var(--text-muted);">Executive Boardroom (12 Pax) • VC Pitch Rehearsal</span>
                <span class="badge badge-info" style="font-size: 11px; font-weight: 800;">⏳ CONFIRMED</span>
              </div>
            </div>

            <!-- Item 3: XYZ Technologies (STP-XYZ) -->
            <div class="showcase-booking-item">
              <div class="booking-wireframe-route">
                <span style="font-weight: 800; color: #22d3ee; font-size: 15px;">XYZ Technologies</span>
                <span class="booking-arrow-glyph">➔</span>
                <span style="font-weight: 700; color: var(--text-primary);">Meeting Room 02</span>
                <span class="booking-arrow-glyph">➔</span>
                <span class="booking-time-badge">11:30 AM</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span style="font-size: 12px; color: var(--text-muted);">Principal Mentor Advisory Sync with John Smith</span>
                <span class="badge badge-warning" style="font-size: 11px; font-weight: 800;">⏳ UP NEXT</span>
              </div>
            </div>

            <!-- Item 4: NeuroPulse AI -->
            <div class="showcase-booking-item">
              <div class="booking-wireframe-route">
                <span style="font-weight: 800; color: #c084fc; font-size: 15px;">NeuroPulse AI</span>
                <span class="booking-arrow-glyph">➔</span>
                <span style="font-weight: 700; color: var(--text-primary);">Brainstorm Lab</span>
                <span class="booking-arrow-glyph">➔</span>
                <span class="booking-time-badge">4:00 PM</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span style="font-size: 12px; color: var(--text-muted);">Neural AI Architecture Sprint • 8 Attendees</span>
                <span class="badge badge-subtle" style="font-size: 11px; font-weight: 800;">📅 SCHEDULED</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Interactive Workflow Shortcut Dock ─────────────────────── -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap; gap: 12px;">
          <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">
            ⚡ Quick Workflow Navigation:
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="App.switchTab('onboarding')" style="font-size: 11px; padding: 4px 10px;">
              🚀 1. Onboarding
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.switchTab('workspace')" style="font-size: 11px; padding: 4px 10px;">
              🏢 2. Workspaces
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.switchTab('meetingRooms')" style="font-size: 11px; padding: 4px 10px;">
              📅 3. Bookings
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.switchTab('billing')" style="font-size: 11px; padding: 4px 10px;">
              🧾 4. Invoices
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.switchTab('payments')" style="font-size: 11px; padding: 4px 10px;">
              💳 6. Payments
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.switchTab('incubation')" style="font-size: 11px; padding: 4px 10px;">
              🌱 7. Incubation
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.switchTab('milestones')" style="font-size: 11px; padding: 4px 10px;">
              🎯 8. Milestones
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.openRbacMatrixModal()" style="font-size: 11px; padding: 4px 10px;">
              🛡️ 9. RBAC Matrix
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderRevenueSvgChart(timeframe = '6m') {
    let dataPoints = [
      { month: 'May', val: 4.8, x: 50, y: 155 },
      { month: 'Jun', val: 5.6, x: 140, y: 130 },
      { month: 'Jul', val: 6.4, x: 230, y: 105 },
      { month: 'Aug', val: 7.1, x: 320, y: 82 },
      { month: 'Sep', val: 7.8, x: 410, y: 58 },
      { month: 'Oct', val: 8.4, x: 500, y: 36 }
    ];

    if (timeframe === 'q3') {
      dataPoints = [
        { month: 'Jul', val: 6.4, x: 70, y: 150 },
        { month: 'Aug', val: 7.1, x: 190, y: 115 },
        { month: 'Sep', val: 7.8, x: 310, y: 75 },
        { month: 'Oct', val: 8.4, x: 460, y: 36 }
      ];
    } else if (timeframe === 'annual') {
      dataPoints = [
        { month: 'Q1', val: 3.2, x: 60, y: 160 },
        { month: 'Q2', val: 5.6, x: 180, y: 120 },
        { month: 'Q3', val: 7.8, x: 320, y: 70 },
        { month: 'Q4 (Est)', val: 9.6, x: 480, y: 30 }
      ];
    }

    const peakPoint = dataPoints[dataPoints.length - 1];

    return `
      <svg viewBox="0 0 550 190" width="100%" height="100%" style="overflow: visible;">
        <defs>
          <linearGradient id="showcaseAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.5" />
            <stop offset="50%" stop-color="#6366f1" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0" />
          </linearGradient>

          <linearGradient id="showcaseLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="50%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="#10b981" />
          </linearGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Horizontal Reference Gridlines -->
        <line x1="35" y1="36" x2="525" y2="36" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4" />
        <text x="12" y="39" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">₹8.5L</text>

        <line x1="35" y1="80" x2="525" y2="80" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4" />
        <text x="12" y="83" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">₹6.5L</text>

        <line x1="35" y1="125" x2="525" y2="125" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4" />
        <text x="12" y="128" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">₹4.5L</text>

        <line x1="35" y1="168" x2="525" y2="168" stroke="rgba(255,255,255,0.15)" />

        <!-- Area Fill Under Curve -->
        <path d="M ${dataPoints[0].x},${dataPoints[0].y} ${dataPoints.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')} L ${peakPoint.x},168 L ${dataPoints[0].x},168 Z" fill="url(#showcaseAreaGradient)" />

        <!-- Smooth Curve Stroke -->
        <path d="M ${dataPoints[0].x},${dataPoints[0].y} ${dataPoints.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}" fill="none" stroke="url(#showcaseLineGradient)" stroke-width="3.5" filter="url(#glowFilter)" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Data Nodes & Value Tags -->
        ${dataPoints.map((dp, i) => `
          <g style="cursor: pointer;">
            <circle cx="${dp.x}" cy="${dp.y}" r="${i === dataPoints.length - 1 ? 6.5 : 4.5}" fill="${i === dataPoints.length - 1 ? '#10b981' : '#06b6d4'}" stroke="#ffffff" stroke-width="2" />
            <text x="${dp.x}" y="${dp.y - 12}" fill="${i === dataPoints.length - 1 ? '#10b981' : 'var(--text-primary)'}" font-size="11" font-weight="800" font-family="var(--font-mono)" text-anchor="middle">₹${dp.val}L</text>
            <text x="${dp.x}" y="182" fill="var(--text-secondary)" font-size="11" font-weight="600" text-anchor="middle">${dp.month}</text>
          </g>
        `).join('')}

        <!-- Peak Milestone Callout -->
        <g transform="translate(${peakPoint.x - 45}, 12)">
          <rect x="0" y="0" width="90" height="20" rx="10" fill="#10b981" />
          <text x="45" y="14" fill="#000000" font-size="9.5" font-weight="900" text-anchor="middle">★ ₹8.4L PEAK</text>
        </g>
      </svg>
    `;
  }
};
