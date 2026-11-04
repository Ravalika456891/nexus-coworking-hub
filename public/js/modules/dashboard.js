// Module: Modern Startup Command Center Dashboard
// Minimal, clean, responsive, role-based single source of truth

const DashboardModule = {
  summaryData: null,
  isLoading: false,
  selectedMonth: null, // 'YYYY-MM'
  activeScheduleTab: 'today', // 'today' | 'upcoming'

  init() {
    if (!this.selectedMonth) {
      const now = new Date();
      const dFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' });
      this.selectedMonth = dFormatter.format(now);
    }
  },

  async loadSummary(month = null) {
    this.isLoading = true;
    if (month) this.selectedMonth = month;
    this.init();

    // Fetch from single source of truth endpoint
    const summary = await window.store.fetchDashboardSummary(this.selectedMonth);
    if (summary && summary.ok) {
      this.summaryData = summary;
    }
    this.isLoading = false;
    this.render();
  },

  getTimeGreeting() {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  },

  getFormattedDate() {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
  },

  switchScheduleTab(tab) {
    this.activeScheduleTab = tab;
    const btnToday = document.getElementById('dash-tab-today');
    const btnUpcoming = document.getElementById('dash-tab-upcoming');
    const listToday = document.getElementById('dash-list-today');
    const listUpcoming = document.getElementById('dash-list-upcoming');

    if (btnToday && btnUpcoming && listToday && listUpcoming) {
      btnToday.classList.toggle('active', tab === 'today');
      btnUpcoming.classList.toggle('active', tab === 'upcoming');
      listToday.style.display = tab === 'today' ? 'flex' : 'none';
      listUpcoming.style.display = tab === 'upcoming' ? 'flex' : 'none';
    }
  },

  navigateToUnpaidInvoices() {
    if (window.App && window.App.switchTab) {
      window.App.switchTab('billing');
      setTimeout(() => {
        const filterEl = document.getElementById('billing-filter-status');
        if (filterEl) {
          filterEl.value = 'Overdue';
          filterEl.dispatchEvent(new Event('change'));
        }
      }, 100);
    }
  },

  sendOverdueReminder(invoiceId, startupName) {
    if (window.App && window.App.showToast) {
      window.App.showToast(`📲 Automated WhatsApp & Email payment reminder dispatched to ${startupName} for invoice #${invoiceId}.`, 'success');
    }
  },

  openInviteGuestsModal() {
    const modalId = 'modal-invite-guests';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = modalId;
      overlay.className = 'modal-overlay active';
      document.body.appendChild(overlay);
    } else {
      overlay.className = 'modal-overlay active';
    }

    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 480px; padding: 22px; border-radius: 16px;">
        <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">👥</span>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Invite External Guests</h3>
              <span style="font-size: 11.5px; color: #64748b;">Issue visitor security passes and calendar invitations</span>
            </div>
          </div>
          <button class="modal-close-btn" onclick="DashboardModule.closeModal('${modalId}')">&times;</button>
        </div>

        <form onsubmit="DashboardModule.handleInviteSubmit(event, '${modalId}')">
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Guest Full Name <span style="color: #ef4444;">*</span></label>
            <input type="text" id="guest-invite-name" required placeholder="e.g. Sarah Jenkins" class="form-control" style="font-size: 13px; padding: 8px 12px;">
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Guest Email Address <span style="color: #ef4444;">*</span></label>
            <input type="email" id="guest-invite-email" required placeholder="e.g. sarah.j@acmeventures.com" class="form-control" style="font-size: 13px; padding: 8px 12px;">
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Target Meeting Session</label>
            <select id="guest-invite-meeting" class="form-control" style="font-size: 13px; padding: 8px 12px;">
              <option value="upcoming-1">AI Medical Board Advisory Session (Today, 09:00 - 11:00 AM)</option>
              <option value="upcoming-2">Pre-Series A VC Due Diligence (Today, 03:00 - 05:00 PM)</option>
              <option value="general">General Day Visitor Pass (Cyber City Hub)</option>
            </select>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary" onclick="DashboardModule.closeModal('${modalId}')" style="font-size: 12px;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="font-size: 12px; background: #4f46e5; border-color: #4338ca;">Send Guest Pass &amp; Calendar Invite</button>
          </div>
        </form>
      </div>
    `;
  },

  handleInviteSubmit(e, modalId) {
    if (e) e.preventDefault();
    const name = document.getElementById('guest-invite-name')?.value;
    const email = document.getElementById('guest-invite-email')?.value;
    this.closeModal(modalId);
    if (window.App && window.App.showToast) {
      window.App.showToast(`📩 Digital visitor pass and gate QR code dispatched to ${name} (${email}).`, 'success');
    }
  },

  // Modal: Batch Invoice Generation for Admins
  async openGenerateInvoicesModal(selectedPeriod = 'November 2026') {
    const modalId = 'modal-generate-invoices-preview';
    let overlay = document.getElementById(modalId);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = modalId;
      overlay.className = 'modal-overlay active';
      document.body.appendChild(overlay);
    } else {
      overlay.className = 'modal-overlay active';
    }

    overlay.innerHTML = `
      <div class="modal-content modal-wide" style="max-width: 680px; padding: 24px; border-radius: 16px;">
        <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">⚡</span>
            <div>
              <h3 class="modal-title" style="margin: 0; font-size: 18px; font-weight: 800;">Generate Invoices Batch</h3>
              <span style="font-size: 12px; color: var(--text-muted);">Preview automated monthly billing run before confirmation</span>
            </div>
          </div>
          <button class="modal-close-btn" onclick="DashboardModule.closeModal('${modalId}')">&times;</button>
        </div>
        <div style="text-align: center; padding: 30px;">
          <div class="skeleton-box" style="width: 100%; height: 120px; border-radius: 8px;"></div>
          <p style="margin-top: 12px; font-size: 13px; color: var(--text-muted);">Calculating eligible active allocations &amp; verifying duplicate prevention index...</p>
        </div>
      </div>
    `;

    try {
      const res = await fetch('/api/invoices/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': window.store.currentRole || 'incubator_admin' },
        body: JSON.stringify({ billingPeriod: selectedPeriod, previewOnly: true })
      });
      const data = await res.json();

      if (!data.ok) {
        overlay.innerHTML = `
          <div class="modal-content" style="max-width: 500px; padding: 24px; border-radius: 16px;">
            <h3 style="color: #ef4444; margin-bottom: 12px;">Batch Generation Error</h3>
            <p style="font-size: 13px; color: var(--text-muted);">${data.error || 'Failed to fetch invoice preview.'}</p>
            <div style="margin-top: 20px; text-align: right;">
              <button class="btn btn-secondary" onclick="DashboardModule.closeModal('${modalId}')">Close</button>
            </div>
          </div>
        `;
        return;
      }

      overlay.innerHTML = `
        <div class="modal-content modal-wide" style="max-width: 680px; padding: 24px; border-radius: 16px;">
          <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">⚡</span>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 18px; font-weight: 800;">Generate Invoices Batch Preview</h3>
                <span style="font-size: 12px; color: var(--text-muted);">Period: <strong>${data.billingPeriod}</strong></span>
              </div>
            </div>
            <button class="modal-close-btn" onclick="DashboardModule.closeModal('${modalId}')">&times;</button>
          </div>

          <div class="modal-body" style="padding: 10px 0;">
            <div style="display: flex; gap: 14px; background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <div style="flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Eligible Startups</div>
                <div style="font-size: 22px; font-weight: 800; color: var(--text-primary); font-family: 'Inter', sans-serif;" class="tabular-nums">${data.eligibleCount} ventures</div>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Total Invoiced</div>
                <div style="font-size: 22px; font-weight: 800; color: #059669; font-family: 'Inter', sans-serif;" class="tabular-nums">${data.totalInvoicedFormatted || '₹0.00'}</div>
              </div>
            </div>

            <p style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 12px;">
              Executing batch generation will create official GST tax invoices for all incubated ventures with active space allocations in ${data.billingPeriod}.
            </p>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;">
            <button class="btn btn-secondary" onclick="DashboardModule.closeModal('${modalId}')">Cancel</button>
            <button class="btn btn-primary" ${data.eligibleCount === 0 ? 'disabled' : ''} onclick="DashboardModule.confirmGenerateInvoices('${data.billingPeriod}', '${modalId}')">
              Confirm &amp; Dispatch (${data.eligibleCount} Invoices)
            </button>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Error opening generate invoices preview:', err);
    }
  },

  async confirmGenerateInvoices(billingPeriod, modalId) {
    try {
      const res = await fetch('/api/invoices/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': window.store.currentRole || 'incubator_admin' },
        body: JSON.stringify({ billingPeriod, previewOnly: false })
      });
      const data = await res.json();
      if (data.ok) {
        if (window.App && window.App.showToast) {
          window.App.showToast(`✅ ${data.message}`, 'success');
        }
        this.closeModal(modalId);
        await window.store.init();
        await this.loadSummary();
      } else {
        alert(data.error || 'Failed to generate invoices.');
      }
    } catch (err) {
      console.error('Error confirming invoice generation:', err);
    }
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
  },

  render() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    this.init();

    // If data is loading and no summary yet, show clean skeleton
    if (!this.summaryData && !this.isLoading) {
      this.loadSummary();
      container.innerHTML = this.renderSkeleton();
      return;
    }

    if (this.isLoading && !this.summaryData) {
      container.innerHTML = this.renderSkeleton();
      return;
    }

    const currentRole = window.store.currentRole || 'startup';
    const isStartupUser = currentRole === 'startup' || currentRole === 'startup_member';
    const isEmployee = currentRole === 'startup_member';

    // Get active startup info
    const startup = (this.summaryData && this.summaryData.startup) || {
      id: window.store.activeFounderId || 'STP-XYZ',
      name: 'XYZ Technologies',
      founderName: 'Alex Morgan',
      plan: 'Scale-Up Growth Plan',
      totalCredits: 120,
      usedCredits: 40,
      remainingCredits: 80,
      remainingPercent: 66,
      renewalDate: '1 Nov 2026'
    };

    const userName = isStartupUser
      ? (startup.founderName || 'Alex')
      : (currentRole === 'super_admin' ? 'Dev Sharma' : 'Priya Nair');

    const firstName = userName.split(' ')[0] || userName;
    const greeting = `${this.getTimeGreeting()}, ${firstName}!`;

    const subtitle = isStartupUser
      ? `Here's what's happening at ${startup.name} today.`
      : `Here's what's happening across NEXUS HUB Incubation Centers today.`;

    const dateStr = this.getFormattedDate();

    // Render Startup or Admin Command Center
    container.innerHTML = `
      <div class="dash-container">
        
        <!-- 1. Compact Personalized Welcome Header -->
        <div class="dash-welcome-hero">
          <div class="dash-welcome-text">
            <h1>
              <span>⚡</span>
              <span>${greeting}</span>
            </h1>
            <p>${subtitle}</p>
          </div>

          <div class="dash-welcome-actions">
            <div class="dash-date-pill">
              <span>📅</span>
              <span>${dateStr}</span>
            </div>

            <div class="dash-role-badge">
              <span>${isStartupUser ? '🚀' : '👑'}</span>
              <span>${isStartupUser ? `${startup.name} (${isEmployee ? 'Member' : 'Founder'})` : 'Executive Command'}</span>
            </div>

            <button type="button" class="btn btn-secondary btn-icon" onclick="DashboardModule.loadSummary()" title="Refresh Dashboard" style="width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;">
              🔄
            </button>
          </div>
        </div>

        <!-- 2. Four Clean KPI Cards -->
        ${isStartupUser ? this.renderStartupKpis(this.summaryData, isEmployee) : this.renderAdminKpis(this.summaryData)}

        <!-- 3. Middle Two-Column Grid: Quick Actions & Unified Schedule -->
        <div class="dash-middle-grid">
          
          <!-- Left Column: Quick Actions + Startup Credits Summary / Overview -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Quick Actions Card -->
            <div class="dash-card">
              <div class="dash-card-header">
                <h3 class="dash-card-title">
                  <span>⚡</span> Quick Actions
                </h3>
                <span style="font-size: 11px; font-weight: 700; color: #64748b;">Shortcuts</span>
              </div>

              <div class="dash-quick-grid">
                <button type="button" class="dash-quick-btn" onclick="App.switchTab('meetingRooms')">
                  <div class="dash-quick-icon">📅</div>
                  <div class="dash-quick-text">
                    <div class="dash-quick-label">Book a Room</div>
                    <div class="dash-quick-desc">Conference &amp; Focus Pods</div>
                  </div>
                </button>

                <button type="button" class="dash-quick-btn" onclick="App.switchTab('bookings')">
                  <div class="dash-quick-icon">📑</div>
                  <div class="dash-quick-text">
                    <div class="dash-quick-label">My Bookings</div>
                    <div class="dash-quick-desc">Active Reservations</div>
                  </div>
                </button>

                <button type="button" class="dash-quick-btn" onclick="App.switchTab('calendar')">
                  <div class="dash-quick-icon">📆</div>
                  <div class="dash-quick-text">
                    <div class="dash-quick-label">Open Calendar</div>
                    <div class="dash-quick-desc">Schedule Timeline</div>
                  </div>
                </button>

                <button type="button" class="dash-quick-btn" onclick="DashboardModule.openInviteGuestsModal()">
                  <div class="dash-quick-icon">👥</div>
                  <div class="dash-quick-text">
                    <div class="dash-quick-label">Invite Guests</div>
                    <div class="dash-quick-desc">Visitor Security Pass</div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Credits & Allowance Summary (for Startup) -->
            ${isStartupUser ? this.renderStartupCreditsWidget(startup, isEmployee) : this.renderAdminOperationalWidget(this.summaryData)}

            <!-- Startup Overview Card (If Founder or Admin, not Employee) -->
            ${(isStartupUser && !isEmployee) ? this.renderStartupOverviewWidget(this.summaryData) : ''}

          </div>

          <!-- Right Column: Unified Schedule Widget (Today & Upcoming Tabs) -->
          <div class="dash-card">
            <div class="dash-card-header">
              <h3 class="dash-card-title">
                <span>🗓️</span> Schedule &amp; Bookings
              </h3>
              
              <!-- Tab Switcher: Today vs Upcoming -->
              <div class="dash-schedule-tabs">
                <button type="button" class="dash-tab-btn ${this.activeScheduleTab === 'today' ? 'active' : ''}" id="dash-tab-today" onclick="DashboardModule.switchScheduleTab('today')">
                  Today (${(this.summaryData?.todaysSchedule || []).length})
                </button>
                <button type="button" class="dash-tab-btn ${this.activeScheduleTab === 'upcoming' ? 'active' : ''}" id="dash-tab-upcoming" onclick="DashboardModule.switchScheduleTab('upcoming')">
                  Upcoming (${(this.summaryData?.upcomingBookings || []).length})
                </button>
              </div>
            </div>

            <!-- List: Today's Meetings -->
            <div class="dash-schedule-list" id="dash-list-today" style="display: ${this.activeScheduleTab === 'today' ? 'flex' : 'none'};">
              ${this.renderScheduleList(this.summaryData?.todaysSchedule || [], 'today')}
            </div>

            <!-- List: Upcoming Meetings -->
            <div class="dash-schedule-list" id="dash-list-upcoming" style="display: ${this.activeScheduleTab === 'upcoming' ? 'flex' : 'none'};">
              ${this.renderScheduleList(this.summaryData?.upcomingBookings || [], 'upcoming')}
            </div>
          </div>

        </div>

        <!-- 4. Bottom Row: Recent Activity & Alerts -->
        <div class="dash-bottom-grid">
          
          <!-- Recent Activity Panel -->
          <div class="dash-card">
            <div class="dash-card-header">
              <h3 class="dash-card-title">
                <span>📜</span> Recent Activity
              </h3>
              <span style="font-size: 11px; font-weight: 700; color: #64748b;">Live Feed</span>
            </div>

            ${this.renderActivityFeed(this.summaryData?.recentActivities || this.summaryData?.activityFeed || [])}
          </div>

          <!-- Secondary Bottom Panel: Operational Focus -->
          ${isStartupUser ? this.renderStartupAssistanceCard() : this.renderNeedsAttentionPanel(this.summaryData)}

        </div>

      </div>
    `;

    this.applyProductionHiding();
  },

  renderStartupKpis(data, isEmployee) {
    const kpi = data?.kpi || {
      upcomingMeetings: { count: 3, nextHint: 'Next: Today at 3:00 PM', linkTab: 'bookings' },
      availableRooms: { count: 5, total: 6, timeBasis: 'Available right now', linkTab: 'meetingRooms' },
      remainingCredits: { remaining: 80, total: 120, unit: 'credits', percent: 66, linkTab: 'billingCredits' },
      pendingRequests: { count: 0, description: 'All requests approved', linkTab: 'bookings' }
    };

    return `
      <div class="dash-kpi-grid">
        
        <!-- KPI 1: Upcoming Meetings -->
        <div class="dash-kpi-card" onclick="App.switchTab('bookings')" title="Click to view My Bookings">
          <div class="dash-kpi-header">
            <span class="dash-kpi-title">Upcoming Meetings</span>
            <div class="dash-kpi-icon icon-purple">📅</div>
          </div>
          <div class="dash-kpi-value tabular-nums">${kpi.upcomingMeetings.count}</div>
          <div class="dash-kpi-footer" style="flex-wrap: wrap; gap: 4px;">
            <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">
              ${kpi.upcomingMeetings.nextHint || 'Confirmed bookings'}
            </span>
            <span class="dash-kpi-link">My Bookings &rarr;</span>
          </div>
        </div>

        <!-- KPI 2: Available Meeting Rooms -->
        <div class="dash-kpi-card" onclick="App.switchTab('meetingRooms')" title="Click to view Meeting Rooms">
          <div class="dash-kpi-header">
            <span class="dash-kpi-title">Available Rooms</span>
            <div class="dash-kpi-icon icon-green">🚪</div>
          </div>
          <div class="dash-kpi-value tabular-nums" style="color: #059669;">
            ${kpi.availableRooms.count} <span style="font-size: 14px; font-weight: 600; color: #64748b;">/ ${kpi.availableRooms.total}</span>
          </div>
          <div class="dash-kpi-footer">
            <span>${kpi.availableRooms.timeBasis || 'Open right now'}</span>
            <span class="dash-kpi-link">Reserve &rarr;</span>
          </div>
        </div>

        <!-- KPI 3: Remaining Booking Credits -->
        <div class="dash-kpi-card" onclick="App.switchTab('${isEmployee ? 'meetingRooms' : 'billingCredits'}')" title="Click to view Credits &amp; Billing">
          <div class="dash-kpi-header">
            <span class="dash-kpi-title">Remaining Credits</span>
            <div class="dash-kpi-icon icon-blue">💳</div>
          </div>
          <div class="dash-kpi-value tabular-nums" style="color: #2563eb;">
            ${kpi.remainingCredits.remaining} <span style="font-size: 13px; font-weight: 600; color: #64748b;">credits</span>
          </div>
          <div class="dash-kpi-footer">
            <span>${kpi.remainingCredits.percent || 0}% used • ${kpi.remainingCredits.percentLeft ?? (100 - (kpi.remainingCredits.percent || 0))}% left</span>
            <span class="dash-kpi-link">${isEmployee ? 'Details' : 'Upgrade'} &rarr;</span>
          </div>
        </div>

        <!-- KPI 4: Pending Requests -->
        <div class="dash-kpi-card" onclick="App.switchTab('bookings')" title="Click to view requests">
          <div class="dash-kpi-header">
            <span class="dash-kpi-title">Pending Requests</span>
            <div class="dash-kpi-icon icon-amber">⏳</div>
          </div>
          <div class="dash-kpi-value tabular-nums" style="color: ${kpi.pendingRequests.count > 0 ? '#d97706' : '#0f172a'};">
            ${kpi.pendingRequests.count}
          </div>
          <div class="dash-kpi-footer">
            <span>${kpi.pendingRequests.description || 'All confirmed'}</span>
            ${kpi.pendingRequests.count > 0 ? `<span class="dash-kpi-link">Review &rarr;</span>` : ''}
          </div>
        </div>

      </div>
    `;
  },

  renderAdminKpis(data) {
    const s = data || {};
    const activeStartups = s.lifecycle?.allocated || s.lifecycle?.startups || 10;
    const availableRooms = s.kpi?.availableRooms?.count ?? 5;
    const totalRooms = s.kpi?.availableRooms?.total ?? 6;
    const mrr = s.mrr?.formatted || '₹5,80,000';
    const pendingCollections = s.pendingCollections?.formatted || '₹1,50,000';
    const pendingInvoicesCount = s.pendingCollections?.invoiceCount || 3;
    const pendingApprovalsCount = (s.needsAttention?.pendingApplications?.length || 0) + (s.needsAttention?.unverifiedDocuments?.length || 0);

    return `
      <div class="dash-kpi-grid">
        
        <!-- Admin KPI 1: Active Ventures / MRR -->
        <div class="dash-kpi-card" onclick="App.switchTab('startupTables')" title="Click to view All Startups">
          <div class="dash-kpi-header">
            <span class="dash-kpi-title">Active Ventures</span>
            <div class="dash-kpi-icon icon-blue">🚀</div>
          </div>
          <div class="dash-kpi-value tabular-nums" style="color: #2563eb;">${activeStartups}</div>
          <div class="dash-kpi-footer">
            <span>MRR: <strong>${mrr}</strong></span>
            <span class="dash-kpi-link">Ventures &rarr;</span>
          </div>
        </div>

        <!-- Admin KPI 2: Available Rooms & Occupancy -->
        <div class="dash-kpi-card" onclick="App.switchTab('meetingRooms')" title="Click to view Meeting Rooms">
          <div class="dash-kpi-header">
            <span class="dash-kpi-title">Available Rooms</span>
            <div class="dash-kpi-icon icon-green">🚪</div>
          </div>
          <div class="dash-kpi-value tabular-nums" style="color: #059669;">
            ${availableRooms} <span style="font-size: 14px; font-weight: 600; color: #64748b;">/ ${totalRooms}</span>
          </div>
          <div class="dash-kpi-footer">
            <span>Occupancy: <strong>${s.occupancy?.rate || 68}%</strong></span>
            <span class="dash-kpi-link">Rooms &rarr;</span>
          </div>
        </div>

        <!-- Admin KPI 3: Pending Collections -->
        <div class="dash-kpi-card" onclick="DashboardModule.navigateToUnpaidInvoices()" title="Click to view Unpaid Invoices">
          <div class="dash-kpi-header">
            <span class="dash-kpi-title">Pending Collections</span>
            <div class="dash-kpi-icon icon-amber">⏳</div>
          </div>
          <div class="dash-kpi-value tabular-nums" style="color: #d97706;">
            ${pendingCollections}
          </div>
          <div class="dash-kpi-footer">
            <span>${pendingInvoicesCount} Invoices Due</span>
            <span class="dash-kpi-link">Filter &rarr;</span>
          </div>
        </div>

        <!-- Admin KPI 4: Pending Approvals & Compliance -->
        <div class="dash-kpi-card" onclick="App.switchTab('adminRooms')" title="Click to view Admin Governance">
          <div class="dash-kpi-header">
            <span class="dash-kpi-title">Pending Approvals</span>
            <div class="dash-kpi-icon icon-purple">🛡️</div>
          </div>
          <div class="dash-kpi-value tabular-nums" style="color: #4f46e5;">
            ${pendingApprovalsCount || 1}
          </div>
          <div class="dash-kpi-footer">
            <span>Applications &amp; KYC</span>
            <span class="dash-kpi-link">Review &rarr;</span>
          </div>
        </div>

      </div>
    `;
  },

  renderStartupCreditsWidget(startup, isEmployee) {
    const total = startup.totalCredits || 150;
    const remaining = startup.remainingCredits ?? 140;
    const used = startup.usedCredits ?? (total - remaining);
    const usedPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    const leftPct = Math.max(0, 100 - usedPct);

    // Progress color: green <80%, amber 80-99%, red at 100%
    let barColor = '#10B981';
    if (usedPct >= 100) barColor = '#EF4444';
    else if (usedPct >= 80) barColor = '#F59E0B';

    return `
      <div class="dash-card">
        <div class="dash-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">💳</span>
            <div>
              <h3 class="dash-card-title">Booking Allowance</h3>
              <span style="font-size: 11px; font-weight: 700; color: #4338ca;">${startup.plan || 'Startup Plan'}</span>
            </div>
          </div>
          ${!isEmployee ? `
            <button type="button" class="btn btn-sm btn-primary" onclick="App.switchTab('billingCredits')" style="font-size: 11px; padding: 4px 10px; background: #4f46e5; border-color: #4338ca;">
              Upgrade
            </button>
          ` : ''}
        </div>

        <div style="display: flex; align-items: baseline; justify-content: space-between;">
          <div style="font-size: 20px; font-weight: 900; color: #1e1b4b;" class="tabular-nums">
            ${remaining} credits <span style="font-size: 12px; font-weight: 600; color: #64748b;">remaining</span>
          </div>
          <span style="font-size: 11.5px; font-weight: 700; color: ${barColor};">${usedPct}% used (${leftPct}% left)</span>
        </div>

        <div class="dash-progress-track" title="${usedPct}% quota consumed">
          <div class="dash-progress-bar" style="width: ${usedPct}%; background: ${barColor};"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #64748b; font-weight: 600;">
          <div style="display: flex; justify-content: space-between;">
            <span>Plan Credits: <strong>${startup.planCredits || remaining} cr</strong> (exp. ${startup.planCreditsExpiry || 'Month-end'})</span>
            <span>Consumed: <strong>${used} cr</strong></span>
          </div>
          ${startup.topUpCredits > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #4338ca;">
              <span>Top-Up Credits: <strong>+${startup.topUpCredits} cr</strong></span>
              <span>Valid 90 Days</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed #e2e8f0; padding-top: 4px; margin-top: 2px;">
            <span>Next Billing Cycle</span>
            <span>Renews on <strong>${startup.renewalDate || '1 Dec 2026'}</strong></span>
          </div>
        </div>
      </div>
    `;
  },

  renderStartupOverviewWidget(data) {
    const ov = data?.startupOverview || {
      teamCount: 6,
      assignedSpace: 'Pod #4 (6 Desks)',
      unpaidInvoicesCount: 0,
      outstandingDueFormatted: '₹0.00',
      upcomingMilestone: 'Revenue Generation (Due 20 Nov 2026)',
      isMilestoneOverdue: false
    };

    return `
      <div class="dash-card">
        <div class="dash-card-header">
          <h3 class="dash-card-title">
            <span>🏢</span> Venture Overview
          </h3>
          <span style="font-size: 11px; font-weight: 700; color: #64748b;">Facility &amp; Team</span>
        </div>

        <div class="dash-overview-chips">
          <div class="dash-overview-chip">
            <span class="dash-chip-label">Active Team</span>
            <span class="dash-chip-val tabular-nums">${ov.teamCount} Members</span>
          </div>

          <div class="dash-overview-chip">
            <span class="dash-chip-label">Allocated Space</span>
            <span class="dash-chip-val" style="font-size: 13px;">${ov.assignedSpace}</span>
          </div>

          <div class="dash-overview-chip">
            <span class="dash-chip-label">Invoices Due</span>
            <span class="dash-chip-val tabular-nums" style="color: ${ov.unpaidInvoicesCount > 0 ? '#ef4444' : '#059669'};">
              ${ov.unpaidInvoicesCount > 0 ? `${ov.unpaidInvoicesCount} Due (${ov.outstandingDueFormatted})` : 'All Settled ✓'}
            </span>
          </div>

          <div class="dash-overview-chip">
            <span class="dash-chip-label">Next Milestone</span>
            <span class="dash-chip-val" style="font-size: 12px; color: ${ov.isMilestoneOverdue ? '#dc2626' : '#4338ca'}; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
              <span>${ov.upcomingMilestone}</span>
              ${ov.isMilestoneOverdue ? `
                <span style="background: #ef4444; color: #ffffff; font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 4px; text-transform: uppercase;">Overdue</span>
              ` : ''}
            </span>
          </div>
        </div>
      </div>
    `;
  },

  renderAdminOperationalWidget(data) {
    return `
      <div class="dash-card">
        <div class="dash-card-header">
          <h3 class="dash-card-title">
            <span>🛡️</span> Administrative Actions
          </h3>
          <span style="font-size: 11px; font-weight: 700; color: #64748b;">Governance</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.switchTab('adminRooms')" style="justify-content: flex-start; gap: 8px; font-size: 12px; padding: 8px 12px;">
            <span>🛡️</span> Room Governance &amp; Approvals
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="DashboardModule.openGenerateInvoicesModal()" style="justify-content: flex-start; gap: 8px; font-size: 12px; padding: 8px 12px; color: #4f46e5; border-color: rgba(99,102,241,0.3);">
            <span>⚡</span> Batch Monthly Invoice Run
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="App.switchTab('database')" style="justify-content: flex-start; gap: 8px; font-size: 12px; padding: 8px 12px;">
            <span>🗄️</span> Database Tables (10 Collections)
          </button>
        </div>
      </div>
    `;
  },

  renderScheduleList(items, type) {
    if (!items || items.length === 0) {
      return `
        <div class="dash-empty-state">
          <div class="dash-empty-icon">📅</div>
          <div class="dash-empty-title">No ${type === 'today' ? "meetings scheduled today" : "upcoming reservations"}</div>
          <div class="dash-empty-desc">Meeting rooms and focus pods are ready to be booked.</div>
          <button type="button" class="btn btn-sm btn-primary" onclick="App.switchTab('meetingRooms')" style="font-size: 11.5px; background: #4f46e5; border-color: #4338ca;">
            Book a Meeting Room
          </button>
        </div>
      `;
    }

    return items.map(item => {
      let statusClass = 'dash-status-confirmed';
      if (item.status === 'In progress') statusClass = 'dash-status-progress';
      else if (item.status === 'Pending') statusClass = 'dash-status-pending';
      else if (item.status === 'Completed') statusClass = 'dash-status-completed';

      return `
        <div class="dash-schedule-item">
          <div class="dash-schedule-info">
            <div class="dash-schedule-timebox">
              <span class="dash-time-main tabular-nums">${item.startTime || '09:00'}</span>
              <span class="dash-time-sub tabular-nums">${item.endTime || '11:00'}</span>
            </div>

            <div style="min-width: 0;">
              <div class="dash-schedule-title" title="${item.title}">${item.title}</div>
              <div class="dash-schedule-meta">
                <span>📍 <strong>${item.roomName}</strong></span>
                <span>•</span>
                <span>👥 ${item.attendees || 4} pax</span>
                ${item.date && item.date !== this.selectedMonth ? `<span>• 📅 ${item.date}</span>` : ''}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <span class="dash-status-pill ${statusClass}">${item.status}</span>
            <button type="button" class="btn btn-sm btn-secondary" onclick="App.switchTab('meetingRooms'); if(window.MeetingRoomsModule) MeetingRoomsModule.openRoomDetails('${item.roomId || 'MR-01'}')" style="font-size: 11px; padding: 4px 8px;" title="View Room Details">
              Open &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderActivityFeed(activities) {
    if (!activities || activities.length === 0) {
      return `
        <div class="dash-empty-state" style="padding: 24px;">
          <div style="font-size: 24px; margin-bottom: 4px;">📜</div>
          <div style="font-size: 12.5px; font-weight: 700; color: #1e293b;">No recent activities logged</div>
          <div style="font-size: 11px; color: #64748b;">System events will appear here in chronological order.</div>
        </div>
      `;
    }

    return `
      <div class="dash-activity-list">
        ${activities.slice(0, 5).map(act => `
          <div class="dash-activity-item" ${act.linkTab ? `onclick="App.switchTab('${act.linkTab}')"` : ''} style="${act.linkTab ? 'cursor: pointer;' : ''}">
            <div class="dash-activity-icon">${act.icon || '📌'}</div>
            <div class="dash-activity-content">
              <div class="dash-activity-title" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <span>${act.title}</span>
                ${act.linkTab ? `<span style="font-size: 10px; color: #4f46e5; font-weight: 700;">View &rarr;</span>` : ''}
              </div>
              <div class="dash-activity-time">
                <span style="font-weight: 700; color: #0f172a;">${act.actor || 'Operations'}</span>
                <span>•</span>
                <span style="color: #64748b;">${act.module || 'System'}</span>
                <span>•</span>
                <span class="tabular-nums">${act.relativeTime || 'Just now'}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderStartupAssistanceCard() {
    const hub = (typeof window !== 'undefined' && window.store && window.store.getHubInfo) ? window.store.getHubInfo() : {
      name: 'Nexus Co-Working & Incubation Hub',
      address: 'Survey No. 45/1, Outer Ring Road, Tech Corridor, Bangalore 560103',
      contactEmail: 'operations@nexushub.co',
      contactPhone: '+91 80 4968 2000'
    };

    return `
      <div class="dash-card">
        <div class="dash-card-header">
          <h3 class="dash-card-title">
            <span>💡</span> Incubation Hub Assistance
          </h3>
          <span style="font-size: 11px; font-weight: 700; color: #64748b;">Helpdesk</span>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 12px;">
          <div style="font-size: 12.5px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
            ${hub.name || 'Nexus Hub Community Helpdesk'}
          </div>
          <div style="font-size: 11.5px; color: #64748b; line-height: 1.4;">
            📍 ${hub.address || 'Outer Ring Road, Bangalore'}<br>
            ✉️ ${hub.contactEmail || 'operations@nexushub.co'} • 📞 ${hub.contactPhone || '+91 80 4968 2000'}
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.switchTab('contact')" style="flex: 1; font-size: 11.5px; justify-content: center;">
            📍 Hub Directory
          </button>
          <button type="button" class="btn btn-primary btn-sm" onclick="if(window.App) App.showToast('📞 Community Ops alerted. Manager Dev Sharma will assist your desk momentarily.', 'info')" style="flex: 1; font-size: 11.5px; justify-content: center; background: #4f46e5; border-color: #4338ca;">
            ⚡ Call Ops Desk
          </button>
        </div>
      </div>
    `;
  },

  renderNeedsAttentionPanel(data) {
    const s = data || {};
    const overdue = s.needsAttention?.overdueInvoices || [];
    const apps = s.needsAttention?.pendingApplications || [];

    return `
      <div class="dash-card">
        <div class="dash-card-header">
          <h3 class="dash-card-title" style="color: #ef4444;">
            <span>⚠️</span> Needs Attention
          </h3>
          <span style="font-size: 11px; font-weight: 700; color: #64748b;">Operational Alerts</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${overdue.length > 0 ? `
            <div style="padding: 10px 12px; border-radius: 10px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #b91c1c;">🔴 ${overdue.length} Overdue Invoices</div>
                <div style="font-size: 11px; color: #64748b;">Totaling ${s.pendingCollections?.overdueAmountFormatted || '₹0.00'}</div>
              </div>
              <button type="button" class="btn btn-sm" onclick="DashboardModule.navigateToUnpaidInvoices()" style="font-size: 10.5px; padding: 3px 8px; background: #ef4444; color: #fff; border: none;">
                Review
              </button>
            </div>
          ` : '<div style="font-size: 12px; color: #059669; padding: 6px 0;">✓ All invoices are settled or current.</div>'}

          ${apps.length > 0 ? `
            <div style="padding: 10px 12px; border-radius: 10px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #b45309;">📋 ${apps.length} Applications Waiting Review</div>
                <div style="font-size: 11px; color: #64748b;">New prospective ventures</div>
              </div>
              <button type="button" class="btn btn-sm btn-secondary" onclick="App.switchTab('onboarding')" style="font-size: 10.5px; padding: 3px 8px;">
                Pipeline
              </button>
            </div>
          ` : '<div style="font-size: 12px; color: #059669; padding: 6px 0;">✓ Application pipeline is clear.</div>'}
        </div>
      </div>
    `;
  },

  renderSkeleton() {
    return `
      <div class="dash-container" style="padding: 10px 0;">
        <div class="skeleton-box" style="width: 100%; height: 75px; border-radius: 16px;"></div>
        <div class="dash-kpi-grid">
          <div class="skeleton-box" style="height: 110px; border-radius: 14px;"></div>
          <div class="skeleton-box" style="height: 110px; border-radius: 14px;"></div>
          <div class="skeleton-box" style="height: 110px; border-radius: 14px;"></div>
          <div class="skeleton-box" style="height: 110px; border-radius: 14px;"></div>
        </div>
        <div class="dash-middle-grid" style="margin-top: 10px;">
          <div class="skeleton-box" style="height: 260px; border-radius: 16px;"></div>
          <div class="skeleton-box" style="height: 260px; border-radius: 16px;"></div>
        </div>
      </div>
    `;
  },

  applyProductionHiding() {
    const isProd = window.__ENV__?.isProduction || 
                   (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
                   (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

    if (isProd) {
      document.body.classList.add('is-production');
      document.querySelectorAll('.dev-only, #btn-reset-demo-data, #header-dev-tools-wrapper, .persona-banner-bar, #dynamic-persona-banner').forEach(el => {
        el.style.display = 'none';
      });
    }
  }
};

window.DashboardModule = DashboardModule;
