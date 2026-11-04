// Main Orchestrator: Routing, Theme, Role Switching, Search & Event Bindings

const App = {
  currentTab: 'dashboard',

  init() {
    this.bindEvents();
    // Default to white background with Navy Blue CTAs ('light')
    const storedTheme = localStorage.getItem('nexus_theme');
    const initialTheme = (!sessionStorage.getItem('theme_user_toggled')) ? 'light' : (storedTheme || 'light');
    this.applyTheme(initialTheme);
    this.updateRoleIndicator();

    if (window.AuthGate) {
      window.AuthGate.checkAuthGate();
    }

    // Subscribe to state updates
    window.store.subscribe(() => {
      this.refreshCurrentView();
      this.updateHeaderStats();
    });

    // Production check for dev tools & demo reset (Requirement E.17)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      document.body.classList.add('is-production');
    }
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg && cfg.isProduction) {
          document.body.classList.add('is-production');
        }
      })
      .catch(() => {});

    // Render initial view
    this.switchTab('dashboard');
    this.updateHeaderStats();
  },

  bindEvents() {
    // Nav link click listeners
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = item.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = curTheme === 'light' ? 'navy' : 'light';
        sessionStorage.setItem('theme_user_toggled', 'true');
        this.applyTheme(newTheme);
      });
    }

    // Global Search
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleGlobalSearch(e.target.value.toLowerCase().trim());
      });
    }

    // Close role dropdown and dev tools panel when clicking outside
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('role-dropdown-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
      }

      const devPanel = document.getElementById('dev-tools-dropdown-panel');
      const devBtn = document.getElementById('header-dev-tools-btn');
      if (devPanel && devPanel.style.display === 'block') {
        if (!devPanel.contains(e.target) && (!devBtn || !devBtn.contains(e.target))) {
          devPanel.style.display = 'none';
        }
      }

      if (typeof BillingModule !== 'undefined' && BillingModule.closeAllRowMenus) {
        if (!e.target.closest('.row-menu-wrapper')) {
          BillingModule.closeAllRowMenus();
        }
      }
    });

    // Close mobile sidebar on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggleMobileSidebar(false);
      }
    });
  },

  toggleMobileSidebar(forceState) {
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.getElementById('sidebar-mobile-backdrop');
    if (!sidebar) return;
    const isCurrentlyOpen = sidebar.classList.contains('mobile-open');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;
    sidebar.classList.toggle('mobile-open', shouldOpen);
    if (backdrop) backdrop.classList.toggle('active', shouldOpen);
    document.body.classList.toggle('sidebar-locked', shouldOpen);
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    this.toggleMobileSidebar(false);

    // 1. Update Nav bar active states - highlight the EXACT tab clicked
    document.querySelectorAll('.nav-item').forEach(item => {
      const itemTab = item.getAttribute('data-tab');
      item.classList.toggle('active', itemTab === tabId);
      if (item.id === 'nav-item-meetingRooms') {
        item.style.background = '';
        item.style.color = '';
      }
    });

    // 2. Hide all view containers, show target container
    document.querySelectorAll('.view-container').forEach(view => {
      view.classList.remove('active');
    });

    let containerTab = tabId;
    if (['meetingRooms', 'bookings', 'myReservations', 'calendar', 'billingCredits', 'roomAnalytics', 'adminRooms'].includes(tabId)) {
      containerTab = 'meetingRooms';
    }

    const activeView = document.getElementById('view-' + containerTab);
    if (activeView) {
      activeView.classList.add('active');
    }

    // 3. Update Header Title
    const titleEl = document.getElementById('header-page-title');
    const titles = {
      dashboard: '⚡ Command Center',
      meetingRooms: '📅 Meeting Rooms',
      bookings: '📑 My Bookings & Reservations',
      myReservations: '📑 My Bookings & Reservations',
      calendar: '📆 Meeting Schedule Calendar',
      billingCredits: '💳 Credits & Meeting Room Billing',
      roomAnalytics: '📈 Meeting Room Analytics',
      adminRooms: '🛡️ Room Administration',
      workspace: '🏢 Workspaces & Desks',
      contact: '👥 Visitor Gate Passes',
      startupTables: '👥 Community Members & Startups',
      database: '🗄️ Database Tables (10 Collections)',
      onboarding: '🚀 Startup Onboarding',
      billing: '🧾 Invoices & Rent',
      payments: '💳 Payments Ledger',
      incubation: '🌱 Incubation Journey',
      milestones: '🎯 Milestones',
      reports: '📊 Analytics',
      leads: '📥 Inbound Leads & Applications'
    };
    if (titleEl) titleEl.innerText = titles[tabId] || 'Command Center';

    // Update Lifecycle Pill in sidebar
    this.updateSidebarLifecyclePill(tabId);

    // 4. RBAC Permission Guard
    if (!window.store.isTabAllowed(tabId)) {
      if (activeView) {
        activeView.innerHTML = this.renderRbacGate(tabId);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 5. Dispatch sub-tab views to MeetingRoomsModule
    if (tabId === 'meetingRooms') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('explore');
      } else {
        this.renderModule('meetingRooms');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'bookings' || tabId === 'myReservations') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('myBookings');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'calendar') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('calendar');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'billingCredits') {
      if (window.MeetingRoomsModule && window.MeetingRoomsModule.switchTab) {
        window.MeetingRoomsModule.switchTab('creditsBilling');
      } else {
        setTimeout(() => {
          if (window.MeetingRoomsModule && window.MeetingRoomsModule.switchTab) {
            window.MeetingRoomsModule.switchTab('creditsBilling');
          } else {
            this.renderModule('billingCredits');
          }
        }, 150);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'roomAnalytics') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('analytics');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'adminRooms') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('admin');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 6. Render main module
    this.renderModule(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

    renderRbacGate(tabId) {
    const roleInfo = window.store.getCurrentRoleInfo();
    const titles = {
      dashboard: 'Hub Command Center',
      onboarding: 'Startup Onboarding & Ventures',
      workspace: 'Floor Plan & Space Allocation',
      meetingRooms: 'Meeting Rooms & Scheduler',
      billing: 'Rent Engine & Tax Invoicing',
      payments: 'Payments & Receipts Ledger',
      incubation: 'Incubation Management Journey',
      milestones: 'Venture Milestone Management',
      reports: 'Reports & Analytics'
    };
    const modTitle = titles[tabId] || tabId;

    const allRoles = window.store.getRoles();
    const permittedRoles = Object.values(allRoles).filter(r => r.allowedTabs.includes(tabId));

    return `
      <div class="rbac-gate-card">
        <div class="rbac-gate-shield">🛡️</div>
        <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 4px 14px; border-radius: var(--radius-full); background: ${roleInfo.accentColor}22; border: 1px solid ${roleInfo.accentColor}44; color: ${roleInfo.accentColor}; font-weight: 700; font-size: 13px;">
          <span>${roleInfo.icon} Active Role: ${roleInfo.name}</span>
        </div>
        <h2 class="rbac-gate-title">Access Restricted by RBAC Policy</h2>
        <p class="rbac-gate-desc">
          You are currently signed in as <strong>${roleInfo.user.name}</strong> (<em>${roleInfo.user.roleTitle}</em>).<br>
          Under the <strong>Role-Based Access Control</strong> matrix, the <strong>${modTitle}</strong> module is outside your assigned role permissions.
        </p>

        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px 24px; margin-bottom: 24px; text-align: left;">
          <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            Authorized Modules for ${roleInfo.name}:
          </div>
          <div class="rbac-allowed-chips" style="justify-content: flex-start; margin: 0;">
            ${roleInfo.features.map(f => `<span class="rbac-chip">✓ ${f}</span>`).join('')}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 520px; margin: 0 auto;">
          <div style="font-size: 12px; color: var(--text-muted);">
            Roles with authorized access to this module: <strong>${permittedRoles.map(r => `${r.icon} ${r.name}`).join(', ')}</strong>
          </div>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 6px;">
            <button class="btn btn-primary" onclick="App.setRole('${permittedRoles[0] ? permittedRoles[0].id : 'super_admin'}')">
              ⚡ Switch to ${permittedRoles[0] ? permittedRoles[0].name : 'Super Admin'}
            </button>
            <button class="btn btn-outline" onclick="App.openRbacMatrixModal()">
              🛡️ View RBAC Matrix
            </button>
            <button class="btn btn-secondary" onclick="App.switchTab('dashboard')">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderModule(tabId) {
    switch (tabId) {
      case 'dashboard':
        DashboardModule.render();
        break;
      case 'onboarding':
        OnboardingModule.render();
        break;
      case 'workspace':
        WorkspaceModule.render();
        break;
      case 'meetingRooms':
        MeetingRoomsModule.render();
        break;
      case 'billingCredits':
        if (window.MeetingRoomsModule && window.MeetingRoomsModule.switchTab) {
          window.MeetingRoomsModule.switchTab('creditsBilling');
        } else if (window.MeetingRoomsModule && window.MeetingRoomsModule.render) {
          window.MeetingRoomsModule.activeTab = 'creditsBilling';
          window.MeetingRoomsModule.render();
        }
        break;
      case 'billing':
        BillingModule.render();
        break;
      case 'payments':
        PaymentsModule.render();
        break;
      case 'incubation':
        IncubationModule.render();
        break;
      case 'milestones':
        MilestonesModule.render();
        break;
      case 'reports':
        ReportsModule.render();
        break;
      case 'contact':
        ContactModule.render();
        break;
      case 'leads':
        LeadsModule.render();
        break;
      case 'startupTables':
        if (typeof StartupTablesModule !== 'undefined' && StartupTablesModule.render) {
          StartupTablesModule.render();
        }
        break;
      case 'database':
        if (typeof DatabaseModule !== 'undefined' && DatabaseModule.render) {
          DatabaseModule.render();
        }
        break;
    }
  },

  refreshCurrentView() {
    this.renderModule(this.currentTab);
  },

  updateHeaderStats() {
    const stats = window.store.getDashboardStats();
    const statPill = document.getElementById('header-stat-pill');
    if (statPill) {
      statPill.innerHTML = `
        <span style="color: var(--status-success); font-weight: 700; white-space: nowrap;">● ${stats.occupancyRate}% Occupied</span>
        <span style="color: var(--border-medium); margin: 0 2px;">•</span>
        <span style="color: var(--accent-secondary); font-weight: 700; white-space: nowrap;">₹${(stats.mrr/100000).toFixed(1)}L MRR</span>
      `;
    }
  },

  updateSidebarLifecyclePill(tabId) {
    const stepMap = {
      onboarding: 0,
      workspace: 1,
      meetingRooms: 2,
      billing: 3,
      payments: 4,
      incubation: 5,
      milestones: 6,
      reports: 7
    };
    const stepIdx = stepMap[tabId] !== undefined ? stepMap[tabId] : -1;
    const indicators = document.querySelectorAll('.step-indicator');
    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i <= stepIdx);
    });
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      if (theme === 'thub') themeIcon.innerText = '🔥';
      else if (theme === 'thub-dark') themeIcon.innerText = '🔥';
      else if (theme === 'light') themeIcon.innerText = '🌙';
      else themeIcon.innerText = '☀️';
    }
  },

  toggleThubTheme() {
    const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
    let newTheme;
    if (curTheme === 'thub') {
      newTheme = 'light';
    } else if (curTheme === 'thub-dark') {
      newTheme = 'navy';
    } else if (curTheme === 'navy' || curTheme === 'dark') {
      newTheme = 'thub-dark';
    } else {
      newTheme = 'thub';
    }
    sessionStorage.setItem('theme_user_toggled', 'true');
    this.applyTheme(newTheme);
    this.showToast(`Theme switched to ${newTheme.startsWith('thub') ? '🔥 T-Hub Innovation Flame' : '🍏 Apple Cupertino'}`, 'info');
  },

  setRole(role) {
    window.store.setRole(role);
    const roleInfo = window.store.getCurrentRoleInfo();

    // If current tab is not allowed under the newly chosen role, navigate to allowed tab
    if (!window.store.isTabAllowed(this.currentTab)) {
      const fallbackTab = roleInfo.allowedTabs[0] || 'dashboard';
      this.switchTab(fallbackTab);
    } else {
      this.refreshCurrentView();
    }

    this.updateRoleIndicator();
    this.showToast(`Switched perspective to ${roleInfo.icon} ${roleInfo.name}`, 'info');
  },

  toggleRoleDropdown(e) {
    if (e) e.stopPropagation();
    const wrapper = document.getElementById('role-dropdown-wrapper');
    if (wrapper) wrapper.classList.toggle('open');
  },

  closeRoleDropdown() {
    const wrapper = document.getElementById('role-dropdown-wrapper');
    if (wrapper) wrapper.classList.remove('open');
  },

  toggleDevToolsMenu(e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById('dev-tools-dropdown-panel');
    if (panel) {
      const isVisible = panel.style.display === 'block';
      panel.style.display = isVisible ? 'none' : 'block';
    }
  },

  closeDevToolsMenu() {
    const panel = document.getElementById('dev-tools-dropdown-panel');
    if (panel) panel.style.display = 'none';
  },

  togglePersonaBanner(show) {
    const banner = document.getElementById('dynamic-persona-banner');
    if (banner) {
      if (show === undefined) {
        const isHidden = banner.style.display === 'none';
        banner.style.display = isHidden ? 'flex' : 'none';
      } else {
        banner.style.display = show ? 'flex' : 'none';
      }
    }
  },

  updateRoleIndicator() {
    const role = window.store.normalizeRole(window.store.currentRole);
    const roleInfo = window.store.getCurrentRoleInfo();

    // Update Header Role Dropdown Trigger Pill
    const headerAvatar = document.getElementById('header-role-avatar');
    const headerRole = document.getElementById('header-role-text');
    if (headerAvatar) headerAvatar.innerText = roleInfo.icon;
    if (headerRole) headerRole.innerText = roleInfo.name;

    // Update Header Super Admin Login Button
    const adminBtn = document.getElementById('header-admin-login-btn');
    if (adminBtn) {
      if (role === 'super_admin') {
        adminBtn.innerHTML = `<span>👑</span> <span id="header-admin-login-btn-text">Dev Sharma (Admin)</span> <span style="font-size: 10px; opacity: 0.85;">✓</span>`;
        adminBtn.style.background = '#f59e0b';
        adminBtn.style.color = '#ffffff';
        adminBtn.style.borderColor = '#f59e0b';
        adminBtn.title = 'Authenticated as Super Admin (Platform Director). Click to view authentication details.';
      } else {
        adminBtn.innerHTML = `<span>👑</span> <span id="header-admin-login-btn-text">Admin Login</span>`;
        adminBtn.style.background = 'transparent';
        adminBtn.style.color = '#f59e0b';
        adminBtn.style.borderColor = '#f59e0b';
        adminBtn.title = 'Super Admin Authentication Portal';
      }
    }

    // Update Header Startup Login Button
    const loginBtn = document.getElementById('header-startup-login-btn');
    if (loginBtn) {
      if (role === 'startup') {
        const sName = (roleInfo.user && roleInfo.user.startupName) || roleInfo.name || 'Startup';
        loginBtn.innerHTML = `<span>${roleInfo.icon || '🚀'}</span> <span id="header-startup-login-btn-text">${sName}</span> <span style="font-size: 10px; opacity: 0.85;">▾</span>`;
        loginBtn.style.background = 'var(--accent-primary)';
        loginBtn.style.color = '#ffffff';
        loginBtn.style.borderColor = 'var(--accent-primary)';
        loginBtn.title = `Signed in as ${sName}. Click to switch startup or logout.`;
      } else {
        loginBtn.innerHTML = `<span>🚀</span> <span id="header-startup-login-btn-text">Startup Login</span>`;
        loginBtn.style.background = 'transparent';
        loginBtn.style.color = 'var(--accent-primary)';
        loginBtn.style.borderColor = 'var(--accent-primary)';
        loginBtn.title = 'Startup Founder Portal Login';
      }
    }

    // Update Dropdown options active status
    const roleKeys = ['super_admin', 'incubator_admin', 'finance_admin', 'startup', 'mentor'];
    roleKeys.forEach(rk => {
      const opt = document.getElementById(`role-opt-${rk}`);
      if (opt) opt.classList.toggle('active', role === rk);
    });

    // Hide unauthorized administrative navigation & dev tools
    const isSuper = role === 'super_admin';
    const isIncubator = role === 'incubator_admin';
    const isAdmin = isSuper || isIncubator;
    document.querySelectorAll('.nav-item').forEach(item => {
      const tabId = item.getAttribute('data-tab');
      if (tabId) {
        if (tabId === 'adminRooms') {
          item.style.display = isAdmin ? 'flex' : 'none';
        } else if (tabId === 'database') {
          item.style.display = isSuper ? 'flex' : 'none';
        } else {
          item.style.display = 'flex';
        }
        const badgeEl = item.querySelector('.nav-item-restricted-badge');
        if (badgeEl) badgeEl.remove();
        item.classList.remove('nav-item-restricted');
      }
    });

    // Hide Dev tools outside super_admin role
    const devWrapper = document.getElementById('header-dev-tools-wrapper');
    if (devWrapper) {
      devWrapper.style.display = isSuper ? 'inline-block' : 'none';
    }

    // Remove redundant user banner under header
    const banner = document.getElementById('dynamic-persona-banner');
    if (banner) {
      banner.style.display = 'none';
    }

    this.updateSidebarPlanAllowance();
  },

  updateSidebarPlanAllowance() {
    const allowance = (window.store && window.store.getMonthlyAllowance)
      ? window.store.getMonthlyAllowance()
      : { includedHours: 15, usedHours: 0, remainingHours: 15, overageHours: 0, overageFee: 0 };

    const included = allowance.includedHours;
    const used = allowance.usedHours;
    const rem = allowance.remainingHours;
    const pct = Math.min(100, Math.round((rem / Math.max(1, included)) * 100));

    const allwEl = document.getElementById('sidebar-plan-allowance');
    const progEl = document.getElementById('sidebar-plan-progress');
    const remEl = document.getElementById('sidebar-plan-remaining');

    if (allwEl) allwEl.innerText = `${included} hrs allowance`;
    if (progEl) progEl.style.width = `${pct}%`;
    if (remEl) {
      if (allowance.overageHours > 0) {
        remEl.innerHTML = `<span style="color: #ea580c; font-weight: 800;">${allowance.overageHours.toFixed(1)}h overage</span> (₹${allowance.overageFee})`;
      } else {
        remEl.innerText = `${rem.toFixed(1)} hrs free balance`;
      }
    }
  },

  openRbacMatrixModal() {
    const matrix = window.store.getRbacMatrixData();
    const roles = window.store.getRoles();
    const activeRole = window.store.normalizeRole(window.store.currentRole);

    const modalMount = document.getElementById('modal-mount');
    if (!modalMount) return;

    modalMount.innerHTML = `
      <div class="modal-overlay active" id="modal-rbac-governance" onclick="App.closeModal(event)" style="z-index: 9999;">
        <div class="modal-content modal-wide" style="max-width: 980px; max-height: 90vh; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
          <div class="modal-header" style="display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0;">
                <span>🛡️</span>
                <span>Role-Based Access Control (RBAC) Governance Matrix</span>
              </h3>
              <p style="font-size: 12.5px; color: var(--text-secondary); margin: 4px 0 0 0;">
                Strict separation of duties across 5 organizational personas with fine-grained module clearance.
              </p>
            </div>
            <button class="modal-close-btn" onclick="App.closeRbacModal()" style="font-size: 18px; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px 8px; line-height: 1;">✕</button>
          </div>

          <div class="modal-body" style="overflow-y: auto; padding: 20px 24px; flex: 1;">
            <!-- Role Cards Quick Switcher -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 20px;">
              ${Object.values(roles).map(r => `
                <div onclick="App.setRole('${r.id}'); App.closeRbacModal();" style="cursor: pointer; padding: 12px; border-radius: var(--radius-md); border: 2px solid ${activeRole === r.id ? r.accentColor : 'var(--border-subtle)'}; background: ${activeRole === r.id ? `${r.accentColor}15` : 'var(--bg-surface-elevated)'}; transition: all 0.2s ease;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 20px;">${r.icon}</span>
                    ${activeRole === r.id ? `<span style="font-size: 10px; padding: 2px 6px; border-radius: var(--radius-full); background: ${r.accentColor}; color: #fff; font-weight: 700;">ACTIVE</span>` : ''}
                  </div>
                  <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">${r.name}</div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px; line-height: 1.3;">${r.scopeSummary}</div>
                </div>
              `).join('')}
            </div>

            <!-- Permission Comparison Table -->
            <div style="border: 1px solid var(--border-medium); border-radius: var(--radius-lg); overflow-x: auto; background: var(--bg-surface);">
              <table class="rbac-matrix-table" style="width: 100%; border-collapse: collapse; min-width: 700px;">
                <thead>
                  <tr>
                    <th style="width: 28%; padding: 12px 14px; text-align: left; background: var(--bg-surface-elevated); border-bottom: 2px solid var(--border-medium); color: var(--text-secondary); font-size: 12px; font-weight: 700;">Module / Feature</th>
                    <th style="text-align: center; width: 14%; padding: 12px 14px; background: var(--bg-surface-elevated); border-bottom: 2px solid var(--border-medium); color: var(--text-secondary); font-size: 12px; font-weight: 700;">👑 Super Admin</th>
                    <th style="text-align: center; width: 14%; padding: 12px 14px; background: var(--bg-surface-elevated); border-bottom: 2px solid var(--border-medium); color: var(--text-secondary); font-size: 12px; font-weight: 700;">🌱 Incubator Admin</th>
                    <th style="text-align: center; width: 14%; padding: 12px 14px; background: var(--bg-surface-elevated); border-bottom: 2px solid var(--border-medium); color: var(--text-secondary); font-size: 12px; font-weight: 700;">💰 Finance Admin</th>
                    <th style="text-align: center; width: 14%; padding: 12px 14px; background: var(--bg-surface-elevated); border-bottom: 2px solid var(--border-medium); color: var(--text-secondary); font-size: 12px; font-weight: 700;">🚀 Startup</th>
                    <th style="text-align: center; width: 14%; padding: 12px 14px; background: var(--bg-surface-elevated); border-bottom: 2px solid var(--border-medium); color: var(--text-secondary); font-size: 12px; font-weight: 700;">🧠 Mentor</th>
                  </tr>
                </thead>
                <tbody>
                  ${matrix.map(row => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 12px 14px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 16px;">${row.icon}</span>
                          <div>
                            <div style="font-weight: 700; color: var(--text-primary); font-size: 13px;">${row.module}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">${row.description}</div>
                          </div>
                        </div>
                      </td>
                      <td style="text-align: center; padding: 12px 14px;">
                        ${row.access.super_admin ? `<span class="rbac-check" title="Allowed">✓</span>` : `<span class="rbac-cross" title="Restricted">—</span>`}
                      </td>
                      <td style="text-align: center; padding: 12px 14px;">
                        ${row.access.incubator_admin ? `<span class="rbac-check" title="Allowed">✓</span>` : `<span class="rbac-cross" title="Restricted">—</span>`}
                      </td>
                      <td style="text-align: center; padding: 12px 14px;">
                        ${row.access.finance_admin ? `<span class="rbac-check" title="Allowed">✓</span>` : `<span class="rbac-cross" title="Restricted">—</span>`}
                      </td>
                      <td style="text-align: center; padding: 12px 14px;">
                        ${row.access.startup ? `<span class="rbac-check" title="Allowed">✓</span>` : `<span class="rbac-cross" title="Restricted">—</span>`}
                      </td>
                      <td style="text-align: center; padding: 12px 14px;">
                        ${row.access.mentor ? `<span class="rbac-check" title="Allowed">✓</span>` : `<span class="rbac-cross" title="Restricted">—</span>`}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Role Specifications Summary -->
            <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
              <div style="padding: 14px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
                <div style="font-weight: 700; font-size: 12.5px; color: #10b981; margin-bottom: 4px;">🌱 Incubator Admin Scope</div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
                  Manages Startup Applications, 8-Stage Incubation, Mentor Network, Workspace Allocation & Intelligence Reports. Billing and payment collection modules are isolated.
                </div>
              </div>
              <div style="padding: 14px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
                <div style="font-weight: 700; font-size: 12.5px; color: #f59e0b; margin-bottom: 4px;">💰 Finance Admin Scope</div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
                  Manages Rent engine, Automated GST Invoicing, Payment Gateways, Receipts ledger and Financial MRR Reports. Incubation admissions and milestone reviews are isolated.
                </div>
              </div>
              <div style="padding: 14px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
                <div style="font-weight: 700; font-size: 12.5px; color: #06b6d4; margin-bottom: 4px;">🚀 Startup (Founder) Scope</div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
                  Authenticated portal for Alex Morgan (XYZ Technologies): Profile, Allocated Space (PC-103), Room Bookings, Invoices, Online Payments & 80% Incubation progress.
                </div>
              </div>
              <div style="padding: 14px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
                <div style="font-weight: 700; font-size: 12.5px; color: #8b5cf6; margin-bottom: 4px;">🧠 Mentor Scope</div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
                  Advisory workbench for John Smith: Assigned Startups, Sprint Milestones creation & verification, 1-on-1 Sessions log, Progress velocity and Feedback.
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated);">
            <span style="font-size: 12px; color: var(--text-muted);">
              Current Active Perspective: <strong style="color: var(--text-primary);">${roles[activeRole].name}</strong> (${roles[activeRole].user.name})
            </span>
            <button class="btn btn-secondary" onclick="App.closeRbacModal()">Close Matrix</button>
          </div>
        </div>
      </div>
    `;
  },

  closeRbacModal() {
    const modalMount = document.getElementById('modal-mount');
    if (modalMount) modalMount.innerHTML = '';
  },

  closeModal(target) {
    if (typeof target === 'string') {
      const el = document.getElementById(target);
      if (el) el.remove();
      else {
        const modalMount = document.getElementById('modal-mount');
        if (modalMount) modalMount.innerHTML = '';
      }
      return;
    }
    if (target && target.target && !target.target.classList.contains('modal-overlay') && !target.target.classList.contains('modal-backdrop')) return;
    const modalMount = document.getElementById('modal-mount');
    if (modalMount) modalMount.innerHTML = '';
  },

  openStartupLoginModal() {
    const startups = window.store.getStartups();
    const currentRole = window.store.normalizeRole(window.store.currentRole);
    const activeFounderId = window.store.activeFounderId;
    const currentStartup = (currentRole === 'startup' && activeFounderId) ? window.store.getStartupById(activeFounderId) : null;

    const modalMount = document.getElementById('modal-mount');
    if (!modalMount) return;

    modalMount.innerHTML = `
      <div class="modal-overlay active" id="modal-startup-login" onclick="if(event.target === this) App.closeModal('modal-startup-login')">
        <div class="modal-content founder-portal-modal" onclick="event.stopPropagation()">
          
          <!-- Header Banner -->
          <div class="founder-portal-header">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🚀</span>
                <h3 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.3px;">
                  Startup Founder Portal Login
                </h3>
                <span style="font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; background: rgba(59, 130, 246, 0.25); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4);">
                  Nexus Hub
                </span>
              </div>
              <p style="font-size: 12.5px; color: #94a3b8; margin: 6px 0 0 0; line-height: 1.45;">
                Access your dedicated venture dashboard, workspace allocations, GST invoices, and incubation roadmap.
              </p>
            </div>
            <button type="button" class="founder-portal-close" onclick="App.closeModal('modal-startup-login')" title="Close">&times;</button>
          </div>

          <!-- Active Session Notice (if already logged in) -->
          ${currentStartup ? `
            <div class="founder-active-session-banner">
              <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                <span style="font-size: 22px;">${currentStartup.logoEmoji || '🚀'}</span>
                <div style="min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="founder-active-dot"></span>
                    <strong style="font-size: 13.5px; color: var(--text-primary);">${currentStartup.name}</strong>
                    <span class="fintech-status-pill pill-status-paid" style="font-size: 10.5px; padding: 1px 7px;">Active Session</span>
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                    Logged in as <strong>${currentStartup.founders?.name || 'Founder'}</strong> (${currentStartup.founders?.email || currentStartup.id})
                  </div>
                </div>
              </div>
              <button type="button" class="btn btn-outline btn-sm" onclick="App.logoutStartup()" style="font-size: 11.5px; font-weight: 600; color: #dc2626; border-color: rgba(220,38,38,0.3); padding: 5px 12px; border-radius: 7px; background: rgba(220,38,38,0.04);">
                🚪 Sign Out
              </button>
            </div>
          ` : ''}

          <!-- Segmented Pill Tabs Switcher -->
          <div class="founder-tabs-track">
            <button type="button" id="tab-btn-quick-login" class="founder-tab-pill active" onclick="App.switchStartupLoginTab('quick')">
              <span>⚡</span>
              <span>Quick Select Startup (${startups.length})</span>
            </button>
            <button type="button" id="tab-btn-cred-login" class="founder-tab-pill" onclick="App.switchStartupLoginTab('cred')">
              <span>🔑</span>
              <span>Email / ID Credentials</span>
            </button>
          </div>

          <div class="founder-scroll-container">
            
            <!-- TAB 1: QUICK 1-CLICK SELECT -->
            <div id="startup-login-tab-quick" style="display: block;">
              <div style="position: relative; margin-bottom: 14px;">
                <input type="text" id="quick-startup-search" class="form-control" placeholder="Search startup name, founder, or sector..." oninput="App.filterStartupLoginList(this.value)" style="font-size: 13px; padding: 9px 14px 9px 36px; border-radius: 10px; border: 1.5px solid var(--border-medium); width: 100%; outline: none;">
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--text-muted); pointer-events: none;">🔍</span>
              </div>

              <div id="startup-login-cards-container" style="display: flex; flex-direction: column; gap: 8px;">
                ${startups.map(s => {
                  const isCurrent = currentStartup && currentStartup.id === s.id;
                  return `
                    <div class="startup-portal-card ${isCurrent ? 'active-session' : ''}" data-search="${(s.name + ' ' + (s.founders?.name || '') + ' ' + (s.founders?.email || '') + ' ' + s.category + ' ' + s.id).toLowerCase()}">
                      <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                        <div class="startup-portal-avatar">
                          ${s.logoEmoji || '🚀'}
                        </div>
                        <div style="min-width: 0;">
                          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <strong style="font-size: 14px; color: var(--text-primary); letter-spacing: -0.2px;">${s.name}</strong>
                            <span class="inv-code-badge" style="font-size: 10.5px; padding: 2px 7px; background: rgba(11,8,38,0.05); cursor: default;">${s.id}</span>
                            <span class="fintech-status-pill pill-status-partial" style="font-size: 10.5px; padding: 2px 8px;">${s.stage || 'Incubation'}</span>
                            ${isCurrent ? `<span class="fintech-status-pill pill-status-paid" style="font-size: 10px; padding: 1px 6px;">Active</span>` : ''}
                          </div>
                          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            <span style="color: var(--text-secondary); font-weight: 600;">👤 ${s.founders?.name || 'Founder'}</span>
                            <span style="margin: 0 4px; opacity: 0.5;">•</span>
                            <span>✉️ ${s.founders?.email || (s.id.toLowerCase() + '@venture.io')}</span>
                          </div>
                        </div>
                      </div>
                      <button type="button" class="btn-portal-login" onclick="App.loginAsStartup('${s.id}')" title="Sign in as ${s.name}">
                        <span>Login</span>
                        <span style="font-size: 11px;">➔</span>
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- TAB 2: CREDENTIALS LOGIN -->
            <div id="startup-login-tab-cred" style="display: none;">
              <form id="form-startup-cred-login" onsubmit="App.handleStartupLoginForm(event)" novalidate>
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label" style="font-weight: 600; font-size: 12.5px;">Registered 10-Digit Mobile Number, Email, or Startup ID <span class="required-star">*</span></label>
                  <input type="text" id="input-startup-identifier" class="form-control" value="9880012345" placeholder="e.g. 9880012345, +91 98800 12345, or STP-XYZ" required style="padding: 10px 14px; border-radius: 9px; font-size: 13px;">
                  <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">
                    Mobile numbers must be strictly 10 digits. (+91 prefix accepted)
                  </span>
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label" style="font-weight: 600; font-size: 12.5px;">Password (10 to 16 positions) <span class="required-star">*</span></label>
                  <input type="password" id="input-startup-password" class="form-control" value="password123" placeholder="Enter password (10-16 characters)" required style="padding: 10px 14px; border-radius: 9px; font-size: 13px;">
                  <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">
                    Must be 10–16 characters only. Demo password: <code>password123</code> (11 chars).
                  </span>
                </div>

                <div id="startup-login-error" style="display: none; padding: 10px 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--status-danger); border-radius: var(--radius-md); color: var(--status-danger); font-size: 12.5px; margin-bottom: 14px;"></div>

                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 11px; font-size: 13.5px; font-weight: 700; background: linear-gradient(135deg, #0B0826 0%, #1e1b4b 100%); border-radius: 9px; box-shadow: 0 4px 14px rgba(11, 8, 38, 0.25);">
                  Sign In to Founder Portal 🚀
                </button>
              </form>
            </div>

          </div>

          <!-- Footer / Registration Link -->
          <div style="background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); padding: 14px 26px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="font-size: 12.5px; color: var(--text-secondary);">
              🌱 New venture applying for incubation cohort?
            </div>
            <a href="index.html#cta" class="btn btn-outline btn-sm" onclick="App.closeModal('modal-startup-login')" style="font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 8px; text-decoration: none; color: #0B0826; border-color: rgba(11,8,38,0.3);">
              + Apply &amp; Register on Website ➔
            </a>
          </div>

        </div>
      </div>
    `;
  },

  switchStartupLoginTab(tab) {
    const quickTab = document.getElementById('startup-login-tab-quick');
    const credTab = document.getElementById('startup-login-tab-cred');
    const btnQuick = document.getElementById('tab-btn-quick-login');
    const btnCred = document.getElementById('tab-btn-cred-login');
    if (!quickTab || !credTab) return;

    if (tab === 'quick') {
      quickTab.style.display = 'block';
      credTab.style.display = 'none';
      if (btnQuick) btnQuick.classList.add('active');
      if (btnCred) btnCred.classList.remove('active');
    } else {
      quickTab.style.display = 'none';
      credTab.style.display = 'block';
      if (btnCred) btnCred.classList.add('active');
      if (btnQuick) btnQuick.classList.remove('active');
    }
  },

  filterStartupLoginList(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.startup-login-card');
    cards.forEach(card => {
      const searchData = card.getAttribute('data-search') || '';
      card.style.display = searchData.includes(q) ? 'flex' : 'none';
    });
  },

  handleStartupLoginForm(e) {
    e.preventDefault();
    const idInput = document.getElementById('input-startup-identifier');
    const passInput = document.getElementById('input-startup-password');
    const errBox = document.getElementById('startup-login-error');
    if (!idInput) return;

    const idVal = (idInput.value || '').trim();
    const passVal = passInput ? passInput.value : '';

    // 1. Mobile number validation if digits are present & not email
    let digits = idVal.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

    const isDirectId = idVal.toUpperCase().startsWith('STP-');
    if (!idVal.includes('@') && !isDirectId) {
      if (digits.length !== 10) {
        if (errBox) {
          errBox.innerText = `⚠️ Mobile number must be exactly 10 digits. More or fewer digits are not allowed (you entered ${digits.length} digits: "${idVal}").`;
          errBox.style.display = 'block';
          idInput.focus();
        }
        return;
      }
    }

    // 2. Password validation (10 to 16 positions only)
    if (passVal.length < 10) {
      if (errBox) {
        errBox.innerText = `⚠️ Password must be between 10 and 16 characters only. (You entered ${passVal.length} characters, minimum 10 required).`;
        errBox.style.display = 'block';
        if (passInput) passInput.focus();
      }
      return;
    }
    if (passVal.length > 16) {
      if (errBox) {
        errBox.innerText = `⚠️ Password must be between 10 and 16 characters only. More than 16 characters is not allowed (you entered ${passVal.length} characters).`;
        errBox.style.display = 'block';
        if (passInput) passInput.focus();
      }
      return;
    }

    const res = window.store.loginAsStartup(idVal, passVal);
    if (res.success) {
      if (errBox) errBox.style.display = 'none';
      sessionStorage.setItem('nexus_auth_session', JSON.stringify({
        role: 'startup',
        startupId: res.startup.id,
        startupName: res.startup.name,
        founderName: res.startup.founders?.name || 'Founder',
        timestamp: Date.now()
      }));
      document.documentElement.classList.remove('auth-locked');
      this.closeModal('modal-startup-login');
      this.updateRoleIndicator();
      this.showToast(`🎉 Welcome back, ${res.startup.founders?.name || 'Founder'}! Signed into ${res.startup.name} Founder Portal.`, 'success');
      this.switchTab('dashboard');
    } else {
      if (errBox) {
        errBox.innerText = res.message || 'Login failed. Please verify credentials.';
        errBox.style.display = 'block';
      }
    }
  },

  loginAsStartup(startupId) {
    const s = window.store.getStartupById(startupId);
    if (!s) {
      this.showToast('Startup not found.', 'danger');
      return;
    }
    window.store.loginAsStartup(s.id);
    sessionStorage.setItem('nexus_auth_session', JSON.stringify({
      role: 'startup',
      startupId: s.id,
      startupName: s.name,
      founderName: s.founders?.name || 'Founder',
      timestamp: Date.now()
    }));
    document.documentElement.classList.remove('auth-locked');
    this.closeModal('modal-startup-login');
    this.updateRoleIndicator();
    this.showToast(`🎉 Welcome back, ${s.founders?.name || 'Founder'}! Signed into ${s.name} Founder Portal.`, 'success');
    this.switchTab('dashboard');
  },

  logoutStartup() {
    window.store.setRole('super_admin');
    window.store.activeFounderId = null;
    this.closeModal('modal-startup-login');
    this.updateRoleIndicator();
    this.showToast('🚪 Logged out from Founder Portal. Switched to Super Admin perspective.', 'info');
    this.switchTab('dashboard');
  },

  openAdminLoginModal() {
    const currentRole = window.store.normalizeRole(window.store.currentRole);
    const isSuperAdmin = currentRole === 'super_admin';
    const roleInfo = window.store.getCurrentRoleInfo();

    const modalMount = document.getElementById('modal-mount');
    if (!modalMount) return;

    modalMount.innerHTML = `
      <div class="modal-overlay active" id="modal-admin-login" onclick="if(event.target === this) App.closeModal('modal-admin-login')">
        <div class="modal-content" style="max-width: 580px; padding: 0; display: flex; flex-direction: column; max-height: 90vh; border-radius: var(--radius-lg); overflow: hidden;" onclick="event.stopPropagation()">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 18px 22px; border-bottom: 1px solid rgba(245, 158, 11, 0.3); display: flex; justify-content: space-between; align-items: flex-start; color: #ffffff; flex-shrink: 0;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">👑</span>
                <h3 style="font-size: 17px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em;">
                  Super Admin Authentication Portal
                </h3>
                <span class="badge" style="font-size: 10px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: 700;">
                  Executive Level
                </span>
              </div>
              <p style="font-size: 12px; color: #cbd5e1; margin: 4px 0 0 0;">
                Platform Director & Executive Command Center • Unrestricted System Governance
              </p>
            </div>
            <button class="modal-close-btn" onclick="App.closeModal('modal-admin-login')" style="color: #cbd5e1; font-size: 22px; cursor: pointer; border: none; background: none;">&times;</button>
          </div>

          <!-- Active Session Notice -->
          ${isSuperAdmin ? `
            <div style="background: rgba(245, 158, 11, 0.08); border-bottom: 1px solid rgba(245, 158, 11, 0.25); padding: 10px 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">👑</span>
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
                    Active Session: Dev Sharma (Super Admin)
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted);">
                    Managing Director & Platform Head • Full 9-module unrestricted access
                  </div>
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 11px; white-space: nowrap;">✓ Authenticated</span>
            </div>
          ` : `
            <div style="background: rgba(239, 68, 68, 0.06); border-bottom: 1px solid rgba(239, 68, 68, 0.2); padding: 10px 22px; display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
              <span style="font-size: 16px;">ℹ️</span>
              <span style="font-size: 12px; color: var(--text-secondary);">
                Active perspective: <strong>${roleInfo.name}</strong>. Sign in below to elevate to Super Admin.
              </span>
            </div>
          `}

          <!-- Scrollable Body Content -->
          <div style="padding: 18px 22px; overflow-y: auto; flex: 1;">
            <!-- Login Form -->
            <form id="form-super-admin-login" onsubmit="App.handleAdminLoginForm(event)">
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label" style="font-weight: 600; font-size: 12.5px;">Super Admin 10-Digit Mobile or Email <span class="required-star">*</span></label>
                <div class="input-with-icon">
                  <span class="input-icon">👑</span>
                  <input type="text" id="input-admin-identifier" class="form-control" value="9800011111" placeholder="9800011111 or dev.sharma@nexusincubation.io" required>
                </div>
                <span style="font-size: 11px; color: var(--text-muted); margin-top: 3px; display: block;">
                  Mobile: <code>9800011111</code> (10 digits) or <code>dev.sharma@nexusincubation.io</code>
                </span>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label" style="font-weight: 600; font-size: 12.5px;">Master Security Password (10 to 16 positions) <span class="required-star">*</span></label>
                <div class="input-with-icon">
                  <span class="input-icon">🔒</span>
                  <input type="password" id="input-admin-password" class="form-control" value="admin12345" placeholder="Master password (10-16 characters)" required>
                </div>
                <span style="font-size: 11px; color: var(--text-muted); margin-top: 3px; display: block;">
                  Must be 10–16 characters only. Master password: <code>admin12345</code> (10 chars).
                </span>
              </div>

              <div id="admin-login-error" style="display: none; padding: 10px 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--status-danger); border-radius: var(--radius-md); color: var(--status-danger); font-size: 12.5px; margin-bottom: 12px;"></div>

              <div style="margin-bottom: 16px;">
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 10px 16px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                  Authenticate Super Admin 👑
                </button>
              </div>
            </form>

            <!-- Executive Quick Switch Presets -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 14px;">
              <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">
                Platform Leadership Personas:
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <button type="button" class="admin-persona-card ${isSuperAdmin ? 'active' : ''}" onclick="App.setRole('super_admin'); App.closeModal('modal-admin-login'); App.showToast('👑 Switched to Super Admin (Dev Sharma)', 'success');">
                  <span style="font-size: 22px; line-height: 1; margin-bottom: 5px;">👑</span>
                  <strong style="font-size: 12.5px; color: var(--text-primary); margin-bottom: 2px;">Dev Sharma</strong>
                  <span style="font-size: 11px; color: #f59e0b; font-weight: 700;">Super Admin</span>
                </button>
                <button type="button" class="admin-persona-card ${currentRole === 'incubator_admin' ? 'active' : ''}" onclick="App.setRole('incubator_admin'); App.closeModal('modal-admin-login'); App.showToast('🌱 Switched to Incubator Admin (Priya Nair)', 'info');">
                  <span style="font-size: 22px; line-height: 1; margin-bottom: 5px;">🌱</span>
                  <strong style="font-size: 12.5px; color: var(--text-primary); margin-bottom: 2px;">Priya Nair</strong>
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Incubator Admin</span>
                </button>
                <button type="button" class="admin-persona-card ${currentRole === 'finance_admin' ? 'active' : ''}" onclick="App.setRole('finance_admin'); App.closeModal('modal-admin-login'); App.showToast('💰 Switched to Finance Admin (Rohan Verma)', 'info');">
                  <span style="font-size: 22px; line-height: 1; margin-bottom: 5px;">💰</span>
                  <strong style="font-size: 12.5px; color: var(--text-primary); margin-bottom: 2px;">Rohan Verma</strong>
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Finance Admin</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Security Footer -->
          <div style="background: var(--bg-surface-elevated); border-top: 1px solid var(--border-subtle); padding: 10px 22px; display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>🛡️</span>
              <span>Zero-Trust RBAC Governance</span>
            </div>
            <button class="btn-link" onclick="App.closeModal('modal-admin-login'); App.openRbacMatrixModal();" style="font-size: 11.5px; color: var(--accent-primary); background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline;">
              View Full RBAC Matrix ➔
            </button>
          </div>

        </div>
      </div>
    `;
  },

  handleAdminLoginForm(e) {
    e.preventDefault();
    const idInput = document.getElementById('input-admin-identifier');
    const passInput = document.getElementById('input-admin-password');
    const pinInput = document.getElementById('input-admin-pin');
    const errBox = document.getElementById('admin-login-error');
    if (!idInput) return;

    const idVal = (idInput.value || '').trim();
    const passVal = passInput ? passInput.value : '';

    // Mobile number validation if digits are present & not email
    let digits = idVal.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

    if (!idVal.includes('@') && idVal.toLowerCase() !== 'admin' && idVal.toLowerCase() !== 'superadmin' && idVal.toLowerCase() !== 'dev') {
      if (digits.length !== 10) {
        if (errBox) {
          errBox.innerText = `⚠️ Mobile number must be exactly 10 digits. More or fewer digits are not allowed (you entered ${digits.length} digits: "${idVal}").`;
          errBox.style.display = 'block';
          idInput.focus();
        }
        return;
      }
    }

    // Password validation (10 to 16 positions only)
    if (passVal.length < 10) {
      if (errBox) {
        errBox.innerText = `⚠️ Password must be between 10 and 16 characters only. (You entered ${passVal.length} characters, minimum 10 required).`;
        errBox.style.display = 'block';
        if (passInput) passInput.focus();
      }
      return;
    }
    if (passVal.length > 16) {
      if (errBox) {
        errBox.innerText = `⚠️ Password must be between 10 and 16 characters only. More than 16 characters is not allowed (you entered ${passVal.length} characters).`;
        errBox.style.display = 'block';
        if (passInput) passInput.focus();
      }
      return;
    }

    const res = window.store.loginAsSuperAdmin(idVal, passVal, pinInput ? pinInput.value : '');
    if (res.success) {
      if (errBox) errBox.style.display = 'none';
      sessionStorage.setItem('nexus_auth_session', JSON.stringify({
        role: 'super_admin',
        userName: 'Dev Sharma',
        timestamp: Date.now()
      }));
      document.documentElement.classList.remove('auth-locked');
      this.closeModal('modal-admin-login');
      this.updateRoleIndicator();
      this.showToast('👑 Welcome, Dev Sharma! Super Admin privileges verified. Full 9-module unrestricted access active.', 'success');
      this.switchTab('dashboard');
    } else {
      if (errBox) {
        errBox.innerText = res.message || 'Authentication failed. Please verify credentials.';
        errBox.style.display = 'block';
      }
    }
  },

  loginAsSuperAdminQuick() {
    window.store.loginAsSuperAdmin('admin', 'admin12345');
    sessionStorage.setItem('nexus_auth_session', JSON.stringify({
      role: 'super_admin',
      userName: 'Dev Sharma',
      timestamp: Date.now()
    }));
    document.documentElement.classList.remove('auth-locked');
    this.closeModal('modal-admin-login');
    this.updateRoleIndicator();
    this.showToast('👑 Welcome, Dev Sharma! Authenticated as Super Admin.', 'success');
    this.switchTab('dashboard');
  },

  handleGlobalSearch(query) {
    if (this.currentTab === 'meetingRooms' && typeof MeetingRoomsModule !== 'undefined' && MeetingRoomsModule.activeTab === 'creditsBilling') {
      MeetingRoomsModule.setLedgerSearch(query);
      MeetingRoomsModule.setInvoiceSearch(query);
      MeetingRoomsModule.render();
      return;
    }

    if (!query) return;

    // Search across startups
    const startups = window.store.getStartups();
    const match = startups.find(s => s.name.toLowerCase().includes(query) || s.sector.toLowerCase().includes(query));
    if (match) {
      this.switchTab('onboarding');
      OnboardingModule.viewStartupDossier(match.id);
      return;
    }

    // Search across invoices
    const invoices = window.store.getInvoices();
    const invMatch = invoices.find(i => i.id.toLowerCase().includes(query));
    if (invMatch) {
      this.switchTab('billing');
      BillingModule.viewInvoice(invMatch.id);
      return;
    }

    // Search across spaces
    const spaces = window.store.getSpaces();
    const spMatch = spaces.find(s => s.id.toLowerCase().includes(query) || s.label.toLowerCase().includes(query));
    if (spMatch) {
      this.switchTab('workspace');
      WorkspaceModule.handleSeatClick(spMatch.id);
    }
  },

  openOnboardModal() {
    this.switchTab('onboarding');
    OnboardingModule.openNewStartupModal();
  },

  runMonthlyBillingBatch() {
    this.switchTab('billing');
    BillingModule.handleBatchGenerate();
  },

  confirmResetDemo() {
    if (confirm('Reset all demo data back to default initial seed? Your custom edits will be restored.')) {
      window.store.resetToDefault();
      this.showToast('🔄 Demo environment successfully reset to default state.', 'info');
      this.refreshCurrentView();
    }
  },

  // --- Auth Gate & Lock Screen Methods ---
  checkAuthGate() {
    if (window.AuthGate && window.AuthGate.checkAuthGate) {
      window.AuthGate.checkAuthGate();
    }
  },

  switchGateTab(tab) {
    if (window.AuthGate && window.AuthGate.switchGateTab) {
      window.AuthGate.switchGateTab(tab);
    }
  },

  quickFillGateStartup(phone, pass = 'password123') {
    if (window.AuthGate && window.AuthGate.quickFillGateStartup) {
      window.AuthGate.quickFillGateStartup(phone, pass);
    }
  },

  togglePasswordVisibility(inputId, btn) {
    if (window.AuthGate && window.AuthGate.togglePasswordVisibility) {
      window.AuthGate.togglePasswordVisibility(inputId, btn);
    }
  },

  handleGateStartupLogin(e) {
    if (window.AuthGate && window.AuthGate.handleGateStartupLogin) {
      window.AuthGate.handleGateStartupLogin(e);
    }
  },

  handleGateAdminLogin(e) {
    if (window.AuthGate && window.AuthGate.handleGateAdminLogin) {
      window.AuthGate.handleGateAdminLogin(e);
    }
  },

  quickLoginGateAdmin() {
    if (window.AuthGate && window.AuthGate.quickLoginGateAdmin) {
      window.AuthGate.quickLoginGateAdmin();
    }
  },

  lockSessionAndLogout() {
    if (window.AuthGate && window.AuthGate.lockSessionAndLogout) {
      window.AuthGate.lockSessionAndLogout();
    }
  },

  openRegistrationFromGate() {
    if (window.AuthGate && window.AuthGate.openRegistrationFromGate) {
      window.AuthGate.openRegistrationFromGate();
    } else {
      window.location.href = 'index.html#cta';
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'success') toast.style.borderLeftColor = 'var(--status-success)';
    if (type === 'warning') toast.style.borderLeftColor = 'var(--status-warning)';
    if (type === 'danger') toast.style.borderLeftColor = 'var(--status-danger)';

    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

// Global Print Management: Detect if a modal (e.g. invoice, pass, certificate) is open before printing
window.addEventListener('beforeprint', () => {
  const mount = document.getElementById('modal-mount');
  const hasModal = mount && mount.innerHTML.trim() !== '' && mount.querySelector('.modal-overlay, .modal-content, .invoice-view-box');
  if (hasModal) {
    document.body.classList.add('printing-modal');
  } else {
    document.body.classList.remove('printing-modal');
  }
});

window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-modal');
});


