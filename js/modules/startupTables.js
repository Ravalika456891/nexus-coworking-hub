// Module: Startup Tables - Centralized Management of All Startup-Related Database Collections

const StartupTablesModule = {
  activeSubTab: 'startups', // 'startups' | 'milestones' | 'mentors' | 'leads' | 'inquiries'
  searchQuery: '',
  categoryFilter: 'all',
  statusFilter: 'all',
  liveData: {
    startups: [],
    milestones: [],
    mentors: [],
    leads: [],
    inquiries: []
  },
  isLoading: false,

  async init() {
    if (!this._listenerBound) {
      this._listenerBound = true;
      window.addEventListener('nexus:state_updated', () => {
        this.fetchData();
      });
      setInterval(() => {
        if (window.App && window.App.currentTab === 'startupTables' && !document.hidden) {
          this.fetchData();
        }
      }, 8000);
    }
    await this.fetchData();
  },

  async fetchData() {
    this.isLoading = true;
    try {
      const [startupsRes, mlsRes, mentorsRes, leadsRes, inqRes] = await Promise.all([
        fetch('/api/database/table?name=startups&limit=100').then(r => r.json()).catch(() => ({ records: [] })),
        fetch('/api/database/table?name=milestones&limit=100').then(r => r.json()).catch(() => ({ records: [] })),
        fetch('/api/database/table?name=mentors&limit=100').then(r => r.json()).catch(() => ({ records: [] })),
        fetch('/api/database/table?name=leads&limit=100').then(r => r.json()).catch(() => ({ records: [] })),
        fetch('/api/database/table?name=inquiries&limit=100').then(r => r.json()).catch(() => ({ records: [] }))
      ]);

      if (startupsRes && startupsRes.records && startupsRes.records.length > 0) {
        this.liveData.startups = startupsRes.records;
        if (window.store && window.store.syncStartupsWithDatabase) {
          window.store.syncStartupsWithDatabase(startupsRes.records);
        }
      } else {
        this.liveData.startups = window.store.getStartups();
      }

      this.liveData.milestones = (mlsRes && mlsRes.records && mlsRes.records.length > 0)
        ? mlsRes.records
        : window.store.getMilestones();

      this.liveData.mentors = (mentorsRes && mentorsRes.records && mentorsRes.records.length > 0)
        ? mentorsRes.records
        : window.store.getMentors();

      this.liveData.leads = (leadsRes && leadsRes.records && leadsRes.records.length > 0)
        ? leadsRes.records
        : [];

      this.liveData.inquiries = (inqRes && inqRes.records && inqRes.records.length > 0)
        ? inqRes.records
        : (window.store.state.contactInquiries || []);
    } catch (e) {
      console.warn('Error fetching live data for Startup Tables:', e);
      this.liveData.startups = window.store.getStartups();
      this.liveData.milestones = window.store.getMilestones();
      this.liveData.mentors = window.store.getMentors();
    } finally {
      this.isLoading = false;
      this.render();
    }
  },

  async render() {
    const container = document.getElementById('view-startupTables');
    if (!container) return;

    // Immediately populate from local store if empty so data is never missing
    if (!this.liveData.startups || this.liveData.startups.length === 0) {
      if (window.store) {
        this.liveData.startups = window.store.getStartups() || [];
        this.liveData.milestones = window.store.getMilestones() || [];
        this.liveData.mentors = window.store.getMentors() || [];
        this.liveData.leads = (window.store.state && window.store.state.leads) ? window.store.state.leads : [];
        this.liveData.inquiries = (window.store.getContactInquiries) ? window.store.getContactInquiries() : [];
      }
    }

    if (!this._hasFetched) {
      this._hasFetched = true;
      this.fetchData(); // Fetch live database in background
    }

    const { startups, milestones, mentors, leads, inquiries } = this.liveData;
    const totalDocs = startups.length + milestones.length + mentors.length + leads.length + inquiries.length;

    container.innerHTML = `
      <style>
        @keyframes st-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .st-hero-banner {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.94) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: 18px;
          padding: 24px 28px;
          margin-bottom: 22px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02);
          position: relative;
          overflow: hidden;
        }
        [data-theme="navy"] .st-hero-banner,
        [data-theme="dark"] .st-hero-banner {
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.92) 100%);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 36px -10px rgba(0, 0, 0, 0.35);
        }
        .st-tile-card {
          background: var(--bg-surface-elevated);
          border: 1.5px solid var(--border-subtle);
          border-radius: 16px;
          padding: 16px 18px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 114px;
        }
        .st-tile-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.08);
          border-color: var(--border-medium);
        }
        .st-tile-card.active-startups {
          border-color: #ed441b;
          box-shadow: 0 10px 24px -4px rgba(237, 68, 27, 0.22), 0 0 0 1px #ed441b;
          background: linear-gradient(145deg, var(--bg-surface-elevated) 0%, rgba(237, 68, 27, 0.04) 100%);
        }
        .st-tile-card.active-milestones {
          border-color: #2563eb;
          box-shadow: 0 10px 24px -4px rgba(37, 99, 235, 0.22), 0 0 0 1px #2563eb;
          background: linear-gradient(145deg, var(--bg-surface-elevated) 0%, rgba(37, 99, 235, 0.04) 100%);
        }
        .st-tile-card.active-mentors {
          border-color: #7c3aed;
          box-shadow: 0 10px 24px -4px rgba(124, 58, 237, 0.22), 0 0 0 1px #7c3aed;
          background: linear-gradient(145deg, var(--bg-surface-elevated) 0%, rgba(124, 58, 237, 0.04) 100%);
        }
        .st-tile-card.active-leads {
          border-color: #059669;
          box-shadow: 0 10px 24px -4px rgba(5, 150, 105, 0.22), 0 0 0 1px #059669;
          background: linear-gradient(145deg, var(--bg-surface-elevated) 0%, rgba(5, 150, 105, 0.04) 100%);
        }
        .st-tile-card.active-inquiries {
          border-color: #d97706;
          box-shadow: 0 10px 24px -4px rgba(217, 119, 6, 0.22), 0 0 0 1px #d97706;
          background: linear-gradient(145deg, var(--bg-surface-elevated) 0%, rgba(217, 119, 6, 0.04) 100%);
        }
        .st-icon-bubble {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .st-register-btn {
          background: #001f54;
          background: linear-gradient(135deg, #0b2545 0%, #001f54 55%, #183e70 100%);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.22);
          font-weight: 700;
          padding: 8px 20px;
          border-radius: 999px;
          box-shadow: 0 4px 14px rgba(0, 31, 84, 0.38);
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .st-register-btn:hover {
          background: linear-gradient(135deg, #123661 0%, #002b75 55%, #1f5091 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 31, 84, 0.55);
        }
        .st-register-btn:active {
          transform: translateY(0);
        }
        .st-company-title {
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .st-company-title:hover {
          color: #2563eb !important;
          text-decoration: underline;
        }
        .st-dossier-card {
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 16px 18px;
        }
        .st-dossier-card h4 {
          font-size: 12px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      </style>

      <!-- Attractive Hero Banner -->
      <div class="st-hero-banner">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 18px;">
          <div style="flex: 1; min-width: 280px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, rgba(237, 68, 27, 0.12) 0%, rgba(255, 107, 74, 0.2) 100%); display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid rgba(237, 68, 27, 0.25); box-shadow: 0 4px 12px rgba(237, 68, 27, 0.15);">
                📋
              </div>
              <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.6px; margin: 0;">
                List of Startup
              </h2>
              <div style="display: inline-flex; align-items: center; gap: 7px; padding: 4px 13px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 9999px; font-size: 11.5px; font-weight: 700; color: #16a34a;">
                <span style="position: relative; display: flex; width: 8px; height: 8px;">
                  <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #22c55e; opacity: 0.75; animation: st-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a;"></span>
                </span>
                <span>MongoDB Atlas Synced</span>
              </div>
            </div>
            <p style="font-size: 13.5px; color: var(--text-secondary); max-width: 820px; line-height: 1.5; margin: 0;">
              Production database repository for <strong>${totalDocs} records</strong> across incubated ventures, sprint deliverables, advisory mentors, and candidate applications.
            </p>
          </div>
        </div>

        <!-- Action Row: Left Table Tools & Right Navy Blue Register Startup -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 18px; flex-wrap: wrap;">
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" onclick="StartupTablesModule.fetchData()" style="border-radius: 999px; font-weight: 600; padding: 7px 15px; display: inline-flex; align-items: center; gap: 6px;" title="Reload data from database">
              <span>🔄</span> Refresh Tables
            </button>
            <button class="btn btn-outline btn-sm" onclick="StartupTablesModule.exportCurrentCSV()" style="border-radius: 999px; font-weight: 600; padding: 7px 15px; display: inline-flex; align-items: center; gap: 6px;" title="Export current table to CSV">
              <span>📥</span> Export CSV
            </button>
            <button class="btn btn-outline btn-sm" onclick="App.switchTab('onboarding')" style="border-radius: 999px; font-weight: 600; padding: 7px 15px; display: inline-flex; align-items: center; gap: 6px;" title="Switch to 5-Stage Onboarding Pipeline">
              <span>🚀</span> Onboarding Pipeline (${startups.length})
            </button>
          </div>
          <div style="margin-left: auto;">
            <button class="btn btn-sm st-register-btn" onclick="OnboardingModule.openRegistrationWizard()" style="background: linear-gradient(135deg, #0b2545 0%, #001f54 55%, #183e70 100%); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.22); font-weight: 700; padding: 8px 20px; border-radius: 999px; box-shadow: 0 4px 14px rgba(0, 31, 84, 0.38); display: inline-flex; align-items: center; gap: 7px; cursor: pointer;" title="Open Startup Registration Wizard">
              <span>✨</span> + Register Startup
            </button>
          </div>
        </div>

        <!-- 5 Highly Attractive Interactive Metric Tiles -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 22px;">
          <!-- 1. Startups -->
          <div class="st-tile-card ${this.activeSubTab === 'startups' ? 'active-startups' : ''}" onclick="StartupTablesModule.switchSubTab('startups')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #ed441b;">1. Startups</span>
              <div class="st-icon-bubble" style="background: rgba(237, 68, 27, 0.12); color: #ed441b;">🏢</div>
            </div>
            <div style="margin: 8px 0 4px 0;">
              <div style="font-size: 24px; font-weight: 800; color: #ed441b; letter-spacing: -0.5px;">${startups.length} <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">Ventures</span></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
              <span>Profiles & Cap Tables</span>
              ${this.activeSubTab === 'startups' ? '<span style="font-size: 10px; font-weight: 700; color: #ed441b;">● ACTIVE</span>' : ''}
            </div>
          </div>

          <!-- 2. Milestones -->
          <div class="st-tile-card ${this.activeSubTab === 'milestones' ? 'active-milestones' : ''}" onclick="StartupTablesModule.switchSubTab('milestones')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #2563eb;">2. Milestones</span>
              <div class="st-icon-bubble" style="background: rgba(37, 99, 235, 0.12); color: #2563eb;">🎯</div>
            </div>
            <div style="margin: 8px 0 4px 0;">
              <div style="font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px;">${milestones.length} <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">Targets</span></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
              <span>Sprint deliverables</span>
              ${this.activeSubTab === 'milestones' ? '<span style="font-size: 10px; font-weight: 700; color: #2563eb;">● ACTIVE</span>' : ''}
            </div>
          </div>

          <!-- 3. Mentors -->
          <div class="st-tile-card ${this.activeSubTab === 'mentors' ? 'active-mentors' : ''}" onclick="StartupTablesModule.switchSubTab('mentors')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #7c3aed;">3. Mentors</span>
              <div class="st-icon-bubble" style="background: rgba(124, 58, 237, 0.12); color: #7c3aed;">🧠</div>
            </div>
            <div style="margin: 8px 0 4px 0;">
              <div style="font-size: 24px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px;">${mentors.length} <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">Leaders</span></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
              <span>Advisory Directory</span>
              ${this.activeSubTab === 'mentors' ? '<span style="font-size: 10px; font-weight: 700; color: #7c3aed;">● ACTIVE</span>' : ''}
            </div>
          </div>

          <!-- 4. Leads -->
          <div class="st-tile-card ${this.activeSubTab === 'leads' ? 'active-leads' : ''}" onclick="StartupTablesModule.switchSubTab('leads')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #059669;">4. Inbound Leads</span>
              <div class="st-icon-bubble" style="background: rgba(5, 150, 105, 0.12); color: #059669;">📥</div>
            </div>
            <div style="margin: 8px 0 4px 0;">
              <div style="font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px;">${leads.length} <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">Candidates</span></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
              <span>Cohort applications</span>
              ${this.activeSubTab === 'leads' ? '<span style="font-size: 10px; font-weight: 700; color: #059669;">● ACTIVE</span>' : ''}
            </div>
          </div>

          <!-- 5. Inquiries -->
          <div class="st-tile-card ${this.activeSubTab === 'inquiries' ? 'active-inquiries' : ''}" onclick="StartupTablesModule.switchSubTab('inquiries')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #d97706;">5. Inquiries</span>
              <div class="st-icon-bubble" style="background: rgba(217, 119, 6, 0.12); color: #d97706;">💬</div>
            </div>
            <div style="margin: 8px 0 4px 0;">
              <div style="font-size: 24px; font-weight: 800; color: #d97706; letter-spacing: -0.5px;">${inquiries.length} <span style="font-size: 14px; font-weight: 600; color: var(--text-secondary);">Tickets</span></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
              <span>Ecosystem requests</span>
              ${this.activeSubTab === 'inquiries' ? '<span style="font-size: 10px; font-weight: 700; color: #d97706;">● ACTIVE</span>' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Segmented Pill Switcher & Glass Search Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; gap: 6px; background: var(--bg-surface-elevated); padding: 5px; border-radius: 999px; border: 1px solid var(--border-subtle); box-shadow: 0 2px 8px rgba(0,0,0,0.03); flex-wrap: wrap;">
          <button class="btn btn-sm ${this.activeSubTab === 'startups' ? 'btn-primary' : 'btn-outline'}" onclick="StartupTablesModule.switchSubTab('startups')" style="font-size: 12px; padding: 6px 16px; border-radius: 999px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            <span>🏢</span> Startups Table <span class="badge ${this.activeSubTab === 'startups' ? 'badge-light' : 'badge-subtle'}" style="font-size: 10.5px; border-radius: 999px;">${startups.length}</span>
          </button>
          <button class="btn btn-sm ${this.activeSubTab === 'milestones' ? 'btn-primary' : 'btn-outline'}" onclick="StartupTablesModule.switchSubTab('milestones')" style="font-size: 12px; padding: 6px 16px; border-radius: 999px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            <span>🎯</span> Milestones Table <span class="badge ${this.activeSubTab === 'milestones' ? 'badge-light' : 'badge-subtle'}" style="font-size: 10.5px; border-radius: 999px;">${milestones.length}</span>
          </button>
          <button class="btn btn-sm ${this.activeSubTab === 'mentors' ? 'btn-primary' : 'btn-outline'}" onclick="StartupTablesModule.switchSubTab('mentors')" style="font-size: 12px; padding: 6px 16px; border-radius: 999px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            <span>🧠</span> Mentors Table <span class="badge ${this.activeSubTab === 'mentors' ? 'badge-light' : 'badge-subtle'}" style="font-size: 10.5px; border-radius: 999px;">${mentors.length}</span>
          </button>
          <button class="btn btn-sm ${this.activeSubTab === 'leads' ? 'btn-primary' : 'btn-outline'}" onclick="StartupTablesModule.switchSubTab('leads')" style="font-size: 12px; padding: 6px 16px; border-radius: 999px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            <span>📥</span> Leads Table <span class="badge ${this.activeSubTab === 'leads' ? 'badge-light' : 'badge-subtle'}" style="font-size: 10.5px; border-radius: 999px;">${leads.length}</span>
          </button>
          <button class="btn btn-sm ${this.activeSubTab === 'inquiries' ? 'btn-primary' : 'btn-outline'}" onclick="StartupTablesModule.switchSubTab('inquiries')" style="font-size: 12px; padding: 6px 16px; border-radius: 999px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            <span>💬</span> Inquiries Table <span class="badge ${this.activeSubTab === 'inquiries' ? 'badge-light' : 'badge-subtle'}" style="font-size: 10.5px; border-radius: 999px;">${inquiries.length}</span>
          </button>
        </div>

        <!-- Sleek Search Input -->
        <div style="position: relative; min-width: 270px;">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search in ${this.activeSubTab}..." 
            value="${this.searchQuery}"
            oninput="StartupTablesModule.handleSearch(this.value)"
            style="padding-left: 36px; font-size: 12.5px; height: 38px; border-radius: 999px; background: var(--bg-surface); border: 1.5px solid var(--border-subtle); box-shadow: 0 2px 6px rgba(0,0,0,0.02);"
          >
          <span style="position: absolute; left: 13px; top: 10px; font-size: 13px; color: var(--text-muted);">🔍</span>
        </div>
      </div>

      <!-- Main Rendered Table Container -->
      <div id="startup-tables-content">
        ${this.renderActiveTable()}
      </div>
    `;
  },

  switchSubTab(tab) {
    this.activeSubTab = tab;
    this.searchQuery = '';
    this.render();
  },

  handleSearch(q) {
    this.searchQuery = q.toLowerCase().trim();
    const contentEl = document.getElementById('startup-tables-content');
    if (contentEl) {
      contentEl.innerHTML = this.renderActiveTable();
    }
  },

  renderActiveTable() {
    switch (this.activeSubTab) {
      case 'startups': return this.renderStartupsTable();
      case 'milestones': return this.renderMilestonesTable();
      case 'mentors': return this.renderMentorsTable();
      case 'leads': return this.renderLeadsTable();
      case 'inquiries': return this.renderInquiriesTable();
      default: return this.renderStartupsTable();
    }
  },

  renderStartupsTable() {
    let list = [...this.liveData.startups];
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(s => 
        (s.name || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q) ||
        (s.category || s.sector || '').toLowerCase().includes(q) ||
        (s.founders && s.founders.name ? s.founders.name.toLowerCase().includes(q) : false)
      );
    }

    const spaces = window.store.getSpaces();

    return `
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
            <thead>
              <tr style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Startup Name & ID</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Founder & Team</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Sector / Category</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Stage & Progress</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Allocated Desks</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Financials / Ask</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Status</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `
                <tr><td colspan="8" style="padding: 40px; text-align: center; color: var(--text-muted);">No startups matching search</td></tr>
              ` : list.map(s => {
                const statusBadge = this.getStatusBadge(s.status);
                const allocated = (s.allocatedSeats || []).map(id => {
                  const sp = spaces.find(x => x.id === id);
                  return sp ? sp.label : id;
                });

                return `
                  <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s ease;" onmouseover="this.style.background='var(--bg-surface-elevated)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); cursor: pointer;" onclick="StartupTablesModule.openCompanyDossier('${s.id}')">${s.logoEmoji || '🚀'}</span>
                        <div style="cursor: pointer;" onclick="StartupTablesModule.openCompanyDossier('${s.id}')">
                          <div class="st-company-title" style="font-weight: 700; color: var(--text-primary); font-size: 13px;">${s.name}</div>
                          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-primary);">${s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 12px;">👤 ${s.founders?.name || 'Lead Founder'}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${s.founders?.email || 'N/A'} • ${s.teamSize || 2} Pax</div>
                    </td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <span class="badge badge-subtle" style="font-size: 11px;">${s.category || s.sector || 'DeepTech'}</span>
                    </td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <div style="font-weight: 600; font-size: 11.5px; color: var(--text-primary);">${s.currentStage || s.incubationJourneyStage || 'MVP Dev'}</div>
                      <div style="font-size: 10.5px; color: #38bdf8; font-family: var(--font-mono);">${s.progressPercent || 25}% Progress</div>
                    </td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      ${allocated.length > 0 
                        ? allocated.map(l => `<span class="badge badge-info" style="font-family: var(--font-mono); font-size: 10px; margin-right: 3px;">${l}</span>`).join('') 
                        : `<span style="font-size: 11px; color: var(--text-muted); font-style: italic;">None (Desk Needed)</span>`
                      }
                    </td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      <div style="font-weight: 700; font-size: 12px; color: var(--text-primary);">₹${(s.targetFundingAsk || 2500000).toLocaleString('en-IN')}</div>
                      <div style="font-size: 10.5px; color: var(--text-muted);">MRR: ₹${(s.monthlyRecurringRevenue || 150000).toLocaleString('en-IN')}</div>
                    </td>
                    <td style="padding: 12px 16px; white-space: nowrap;">
                      ${statusBadge}
                    </td>
                    <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
                      <button class="btn btn-sm" style="padding: 4px 10px; font-size: 11px; margin-right: 4px; font-weight: 700; background: #001f54; color: #ffffff; border: 1px solid #1e3a8a; border-radius: 6px; cursor: pointer;" onclick="StartupTablesModule.openCompanyDossier('${s.id}')">
                        👁️ View Details
                      </button>
                      <button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 11px; margin-right: 4px;" onclick="OnboardingModule.openVerificationModal('${s.id}')">
                        View
                      </button>
                      <button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="IncubationModule.viewStartupJourneyModal('${s.id}')">
                        Journey
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="padding: 12px 18px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-elevated); font-size: 12px; color: var(--text-muted);">
          <span>Showing <strong>${list.length}</strong> of <strong>${this.liveData.startups.length}</strong> startup records</span>
          <button class="btn btn-outline btn-sm" style="font-size: 11px;" onclick="StartupTablesModule.exportCurrentCSV()">
            📥 Export Startups CSV
          </button>
        </div>
      </div>
    `;
  },

  renderMilestonesTable() {
    let list = [...this.liveData.milestones];
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(m => 
        (m.title || '').toLowerCase().includes(q) ||
        (m.startupName || '').toLowerCase().includes(q) ||
        (m.verifiedBy || '').toLowerCase().includes(q)
      );
    }

    return `
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
            <thead>
              <tr style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Milestone Label & ID</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Milestone Title</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Startup Name</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Target Date</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Progress %</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Mentor Verifier</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Status</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `
                <tr><td colspan="8" style="padding: 40px; text-align: center; color: var(--text-muted);">No milestones found</td></tr>
              ` : list.map(m => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 12px 16px; font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary);">
                    ${m.milestoneLabel || m.id}
                  </td>
                  <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary); max-width: 240px;">
                    ${m.title}
                  </td>
                  <td style="padding: 12px 16px; white-space: nowrap;">
                    <span style="cursor: pointer; font-weight: 600; color: var(--text-primary);" class="st-company-title" onclick="StartupTablesModule.openCompanyDossier('${m.startupId || 'STP-01'}')">
                      ${m.startupName || m.startupId || 'XYZ Technologies'}
                    </span>
                  </td>
                  <td style="padding: 12px 16px; white-space: nowrap; font-family: var(--font-mono); font-size: 11.5px;">
                    📅 ${m.targetDate || '2026-11-20'}
                  </td>
                  <td style="padding: 12px 16px; white-space: nowrap;">
                    <div style="font-family: var(--font-mono); font-size: 11.5px; color: #38bdf8;">${m.progressPercent || 0}%</div>
                  </td>
                  <td style="padding: 12px 16px; white-space: nowrap;">
                    🧠 ${m.verifiedBy || 'John Smith (Mentor)'}
                  </td>
                  <td style="padding: 12px 16px; white-space: nowrap;">
                    <span class="badge ${m.status === 'Completed' ? 'badge-success' : (m.status === 'In Progress' ? 'badge-info' : 'badge-subtle')}">
                      ${m.status}
                    </span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
                    <button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="MilestonesModule.openEditMilestoneModal('${m.id}')">
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderMentorsTable() {
    let list = [...this.liveData.mentors];
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(m => 
        (m.name || '').toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q) ||
        (m.expertise || '').toLowerCase().includes(q)
      );
    }

    return `
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
            <thead>
              <tr style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Mentor ID</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Name & Title</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Domain Specialization</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Assigned Startups</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Advisory Hours</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Contact Email</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(m => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 12px 16px; font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary);">${m.id}</td>
                  <td style="padding: 12px 16px; font-weight: 700; color: var(--text-primary); white-space: nowrap;">
                    🧠 ${m.name} <span style="font-weight: 400; color: var(--text-muted); font-size: 11.5px;">(${m.role})</span>
                  </td>
                  <td style="padding: 12px 16px; white-space: nowrap;">
                    <span class="badge badge-info">${m.expertise || m.domain || 'DeepTech & Strategy'}</span>
                  </td>
                  <td style="padding: 12px 16px; white-space: nowrap;">
                    ${(m.assignedStartups || ['STP-XYZ']).join(', ')}
                  </td>
                  <td style="padding: 12px 16px; font-family: var(--font-mono);">
                    ${m.advisoryHoursTotal || 36} hrs / month
                  </td>
                  <td style="padding: 12px 16px; color: var(--text-muted); font-size: 12px;">
                    ${m.email || (m.name.toLowerCase().replace(/\s+/g, '.') + '@thub.org')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderLeadsTable() {
    let list = [...this.liveData.leads];
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(l => 
        (l.fullName || l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.startupName || '').toLowerCase().includes(q)
      );
    }

    return `
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
            <thead>
              <tr style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Lead ID</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Applicant Name</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Venture Name</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Sector / Stage</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Contact Email</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Source</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `
                <tr><td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted);">No inbound leads in collection</td></tr>
              ` : list.map(l => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 12px 16px; font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary);">${l.id || l._id}</td>
                  <td style="padding: 12px 16px; font-weight: 700; color: var(--text-primary); white-space: nowrap;">${l.fullName || l.name || 'Anonymous Lead'}</td>
                  <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary); white-space: nowrap;">${l.startupName || 'Stealth AI'}</td>
                  <td style="padding: 12px 16px; white-space: nowrap;">
                    <span class="badge badge-subtle">${l.sector || 'DeepTech'}</span> • ${l.stage || 'MVP Ready'}
                  </td>
                  <td style="padding: 12px 16px; color: var(--text-muted);">${l.email || 'N/A'}</td>
                  <td style="padding: 12px 16px; white-space: nowrap;"><span class="badge badge-info">${l.source || 'Website'}</span></td>
                  <td style="padding: 12px 16px; white-space: nowrap;"><span class="badge badge-success">${l.status || 'Under Review'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderInquiriesTable() {
    let list = [...this.liveData.inquiries];
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(i => 
        (i.name || '').toLowerCase().includes(q) ||
        (i.subject || '').toLowerCase().includes(q) ||
        (i.email || '').toLowerCase().includes(q)
      );
    }

    return `
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
            <thead>
              <tr style="background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Ticket #</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Name & Email</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Subject</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Category</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Priority</th>
                <th style="padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `
                <tr><td colspan="6" style="padding: 40px; text-align: center; color: var(--text-muted);">No inquiries in collection</td></tr>
              ` : list.map(i => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 12px 16px; font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary);">${i.ticketNumber || i.id || 'INQ-101'}</td>
                  <td style="padding: 12px 16px; white-space: nowrap;">
                    <div style="font-weight: 700; color: var(--text-primary);">${i.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${i.email}</div>
                  </td>
                  <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary); max-width: 260px;">${i.subject || i.message || 'Support Request'}</td>
                  <td style="padding: 12px 16px; white-space: nowrap;"><span class="badge badge-subtle">${i.category || 'General'}</span></td>
                  <td style="padding: 12px 16px; white-space: nowrap;"><span class="badge ${i.priority === 'High' ? 'badge-warning' : 'badge-subtle'}">${i.priority || 'Normal'}</span></td>
                  <td style="padding: 12px 16px; white-space: nowrap;"><span class="badge badge-info">${i.status || 'New'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  getStatusBadge(status) {
    switch (status) {
      case 'Applied': return '<span class="badge badge-warning">Applied</span>';
      case 'Under Review': return '<span class="badge badge-info">Under Review</span>';
      case 'Approved': return '<span class="badge badge-success">Approved</span>';
      case 'Incubated': return '<span class="badge badge-primary">Incubated</span>';
      case 'Completed': return '<span class="badge badge-subtle">Completed</span>';
      default: return `<span class="badge badge-subtle">${status || 'Active'}</span>`;
    }
  },

  exportCurrentCSV() {
    const list = this.liveData[this.activeSubTab] || [];
    if (list.length === 0) {
      App.showToast('No records to export.', 'warning');
      return;
    }
    const keys = Object.keys(list[0]).filter(k => k !== '_id' && k !== '_syncedAt');
    const header = keys.join(',');
    const rows = list.map(item => {
      return keys.map(k => {
        let v = item[k];
        if (v === undefined || v === null) return '""';
        if (typeof v === 'object') v = JSON.stringify(v);
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_${this.activeSubTab}_table.csv`;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast(`📥 Exported ${this.activeSubTab} table to CSV!`, 'success');
  },

  openCompanyDossier(id) {
    let s = (this.liveData.startups || []).find(x => x.id === id || x._id === id || x.slug === id);
    if (!s && window.store) {
      s = window.store.getStartupById(id);
    }
    if (!s && window.store) {
      const all = window.store.getStartups() || [];
      s = all.find(x => x.id === id || x.name === id || (x.name && x.name.toLowerCase() === String(id).toLowerCase()));
    }
    if (!s) {
      App.showToast(`Company details not found for ID: ${id}`, 'warning');
      return;
    }

    const allSpaces = (window.store && window.store.getSpaces) ? window.store.getSpaces() : [];
    const allocatedSpaces = allSpaces.filter(sp => (s.allocatedSeats || []).includes(sp.id));
    const billingCalc = (window.store && window.store.calculateStartupMonthlyBilling) ? window.store.calculateStartupMonthlyBilling(s.id) : null;
    
    // Milestones linked
    const milestones = (this.liveData.milestones || []).filter(m => m.startupId === s.id || (m.startupName && m.startupName.toLowerCase() === (s.name || '').toLowerCase())) || [];
    
    // Mentor linked
    const mentors = this.liveData.mentors || ((window.store && window.store.getMentors) ? window.store.getMentors() : []);
    const mentor = s.mentorId 
      ? mentors.find(m => m.id === s.mentorId) 
      : (mentors.find(m => (m.assignedStartups || []).includes(s.id)) || null);

    // Payments & Invoices
    const payments = (window.store && window.store.getPaymentsByStartupId) ? window.store.getPaymentsByStartupId(s.id) : [];
    const paySummary = (window.store && window.store.getPaymentSummaryForStartup) 
      ? window.store.getPaymentSummaryForStartup(s.id) 
      : { totalPaid: 0, totalInvoiced: 0, balanceDue: 0, payments: [] };

    // Documents
    const docs = (s.documents && s.documents.length > 0) ? s.documents : [
      { id: "DOC-101", type: "Certificate of Incorporation (CIN)", fileName: `${s.slug || 'company'}_cin_cert.pdf`, fileSize: "1.4 MB", uploadDate: s.joiningDate || "2026-01-10", status: "Verified", verifiedBy: "MCA Compliance Ops" },
      { id: "DOC-102", type: "GST Registration Certificate", fileName: `${s.slug || 'company'}_gstin.pdf`, fileSize: "820 KB", uploadDate: s.joiningDate || "2026-01-10", status: "Verified", verifiedBy: "Finance Ops" },
      { id: "DOC-103", type: "Pitch Deck & Financial Model", fileName: `${s.slug || 'company'}_investor_deck.pdf`, fileSize: "5.1 MB", uploadDate: s.joiningDate || "2026-01-12", status: "Verified", verifiedBy: "Investment Committee" },
      { id: "DOC-104", type: "Founder Identity & KYC (Aadhaar/PAN)", fileName: `${s.slug || 'company'}_kyc_bundle.pdf`, fileSize: "2.3 MB", uploadDate: s.joiningDate || "2026-01-12", status: "Verified", verifiedBy: "Legal Head" }
    ];

    // Verification & Approval
    const verification = s.verification || {
      verified: true,
      verifiedAt: s.joiningDate || "2026-01-12",
      verifiedBy: "Dr. Siddharth (Incubation Lead)",
      notes: "MCA incorporation credentials, compliance protocols, and founder identity verified."
    };

    const approval = s.approval || {
      approved: true,
      approvedAt: s.joiningDate || "2026-01-14",
      approvedBy: "Advisory Steering Board",
      committeeRemarks: `Approved under ${s.cohort || 'Cohort 2026-A'} with designated incubation support grant.`
    };

    const founder = s.founders || {
      name: "Founder Lead",
      role: "CEO & Co-founder",
      email: `${(s.slug || 'founder')}@nexusventures.in`,
      phone: "+91 98450 11234",
      linkedIn: "https://linkedin.com",
      bio: "Tech entrepreneur with deep sector focus."
    };

    const statusBadge = this.getStatusBadge(s.status);
    const mrrVal = s.monthlyRecurringRevenue || (s.metrics ? s.metrics.mrr : 150000);
    const askVal = s.targetFundingAsk || (s.metrics ? s.metrics.fundingRaised : 2500000);
    const burnVal = s.metrics ? s.metrics.burnRate : 280000;
    const runwayVal = s.metrics ? s.metrics.runwayMonths : 14;
    const usersVal = s.metrics ? s.metrics.users : 1240;
    const readinessVal = s.progressPercent || (s.metrics ? s.metrics.readinessScore : 80);
    const meetingUsed = s.usedMeetingHours || 8;
    const meetingTotal = s.includedMeetingHours || 15;
    const meetingPct = Math.min(100, Math.round((meetingUsed / meetingTotal) * 100));

    const html = `
      <div class="modal-overlay active" id="modal-company-atoz-dossier" onclick="if(event.target === this) StartupTablesModule.closeModal('modal-company-atoz-dossier')" style="z-index: 1050; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); padding: 20px;">
        <div class="modal-content modal-wide" style="max-width: 1040px; width: 95vw; max-height: 90vh; overflow-y: auto; border-radius: 18px; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5); border: 1px solid var(--border-subtle); background: var(--bg-surface); padding: 0;">
          
          <!-- Modal Top Header -->
          <div style="padding: 24px 28px 18px 28px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <span style="font-size: 34px; width: 56px; height: 56px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-surface); border-radius: 14px; border: 1px solid var(--border-subtle); box-shadow: 0 4px 12px rgba(0,0,0,0.04);">${s.logoEmoji || '🚀'}</span>
              <div>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.4px;">${s.name}</h2>
                  <span style="font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; color: var(--accent-primary); background: rgba(237, 68, 27, 0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(237, 68, 27, 0.2);">${s.id}</span>
                  ${statusBadge}
                </div>
                <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span>🏷️ <strong>${s.category || s.sector || 'DeepTech'}</strong></span>
                  <span>•</span>
                  <span>🎓 <strong>${s.cohort || 'Cohort 2026-A'}</strong></span>
                  <span>•</span>
                  <span>🚀 Stage: <strong>${s.currentStage || s.stage || 'MVP Dev'}</strong></span>
                </div>
              </div>
            </div>

            <!-- Header Quick Actions -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="btn btn-outline btn-sm" onclick="StartupTablesModule.copyCompanySummary('${s.id}')" title="Copy full company summary text">
                📋 Copy Summary
              </button>
              <button class="btn btn-outline btn-sm" onclick="StartupTablesModule.printCompanyDossier()" title="Print or save as PDF">
                🖨️ Print / PDF
              </button>
              <button class="modal-close-btn" onclick="StartupTablesModule.closeModal('modal-company-atoz-dossier')" style="margin-left: 6px;" title="Close Dossier">&times;</button>
            </div>
          </div>

          <!-- Body Container -->
          <div style="padding: 24px 28px;">

            <!-- 7-Metric KPI Banner -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 22px;">
              <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">👥 Team / Pax</div>
                <div style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-top: 3px;">${s.teamSize || s.numberOfEmployees || 2} Pax</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">📅 Joining Date</div>
                <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin-top: 3px;">${s.joiningDate || s.moveInDate || '2026-01-15'}</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">⏳ Term / Period</div>
                <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin-top: 3px;">${s.incubationPeriod || '18 Months'}</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">💰 Target Ask</div>
                <div style="font-size: 14px; font-weight: 800; color: #16a34a; margin-top: 3px;">₹${(Number(askVal) / 100000).toFixed(1)}L</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">📈 Current MRR</div>
                <div style="font-size: 14px; font-weight: 800; color: #0284c7; margin-top: 3px;">₹${(Number(mrrVal) / 1000).toFixed(0)}k/mo</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">🏢 Allocated Desks</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); margin-top: 3px;">${allocatedSpaces.length > 0 ? allocatedSpaces.length + ' Seats' : 'Desk Needed'}</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">🎯 Readiness Score</div>
                <div style="font-size: 15px; font-weight: 800; color: #38bdf8; margin-top: 3px;">${readinessVal}%</div>
              </div>
            </div>

            <!-- Two-Column A to Z Dossier Cards Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 16px;">

              <!-- CARD A: Legal Particulars & Registration -->
              <div class="st-dossier-card">
                <h4><span>🏛️</span> A. Legal Particulars & MCA Registration</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px;">
                  <div>
                    <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Legal Registered Name</div>
                    <div style="font-weight: 700; color: var(--text-primary); margin-top: 2px;">${s.name} Private Limited</div>
                  </div>
                  <div>
                    <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Corporate ID No. (CIN)</div>
                    <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary); margin-top: 2px;">${s.registrationNumber || 'U72900KA2026PTC184912'}</div>
                  </div>
                  <div>
                    <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">GSTIN Tax Code</div>
                    <div style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary); margin-top: 2px;">${s.gstin || '29AABCN1234F1Z5'}</div>
                  </div>
                  <div>
                    <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Incubation Cohort</div>
                    <div style="font-weight: 700; color: var(--text-primary); margin-top: 2px;">${s.cohort || 'Cohort 2026-A'}</div>
                  </div>
                  <div>
                    <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Agreement Duration</div>
                    <div style="font-weight: 600; color: var(--text-primary); margin-top: 2px;">${s.incubationPeriod || '18 Months'}</div>
                  </div>
                  <div>
                    <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Physical Move-in Date</div>
                    <div style="font-weight: 600; color: var(--text-primary); margin-top: 2px;">📅 ${s.moveInDate || s.joiningDate || '2026-01-15'}</div>
                  </div>
                </div>
              </div>

              <!-- CARD B: Founders & Leadership Profile -->
              <div class="st-dossier-card">
                <h4><span>👤</span> B. Founder & Leadership Profile</h4>
                <div style="font-size: 12.5px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">${founder.name}</div>
                      <div style="font-size: 11.5px; color: var(--accent-primary); font-weight: 700;">${founder.role || 'CEO & Co-founder'}</div>
                    </div>
                    <span class="badge badge-info" style="font-size: 10.5px;">${s.teamSize || s.numberOfEmployees || 2} Pax Team</span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; font-size: 12px;">
                    <div>📧 <a href="mailto:${founder.email}" style="color: var(--text-primary); text-decoration: underline;">${founder.email}</a></div>
                    <div>📱 <strong>${founder.phone || founder.mobile || '+91 98450 11234'}</strong></div>
                  </div>
                  ${founder.linkedIn ? `
                    <div style="margin: 6px 0; font-size: 12px;">
                      <a href="${founder.linkedIn.startsWith('http') ? founder.linkedIn : 'https://' + founder.linkedIn}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                        🌐 ${founder.linkedIn}
                      </a>
                    </div>
                  ` : ''}
                  ${founder.bio ? `
                    <div style="font-size: 11.5px; color: var(--text-secondary); background: var(--bg-surface); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-subtle); margin-top: 6px; font-style: italic;">
                      "${founder.bio}"
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- CARD C: Pitch & Core Value Proposition -->
              <div class="st-dossier-card">
                <h4><span>🚀</span> C. Executive Pitch & Core Value Proposition</h4>
                <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.55; margin: 0 0 10px 0;">
                  ${s.pitchSummary || 'Pioneering technology innovation optimizing industry workflows through automated intelligence and modern architecture.'}
                </p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <span class="badge badge-subtle" style="font-size: 11px;">Domain: ${s.category || s.sector || 'DeepTech'}</span>
                  <span class="badge badge-info" style="font-size: 11px;">Stage: ${s.currentStage || s.stage || 'MVP'}</span>
                  <span class="badge badge-success" style="font-size: 11px;">Traction: ${usersVal.toLocaleString('en-IN')} Users</span>
                </div>
              </div>

              <!-- CARD D: Workspace & Facility Resources -->
              <div class="st-dossier-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <h4 style="margin: 0;"><span>🏢</span> D. Workspace & Facility Allocation</h4>
                  <button class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="StartupTablesModule.closeModal('modal-company-atoz-dossier'); App.switchTab('workspace'); WorkspaceModule.highlightForStartup('${s.id}')">
                    Floor Plan ➔
                  </button>
                </div>
                <div style="margin-bottom: 8px;">
                  <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Allocated Cabins & Desks (${allocatedSpaces.length})</div>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    ${allocatedSpaces.length > 0 
                      ? allocatedSpaces.map(sp => `<span class="badge badge-info" style="font-size: 11px; padding: 4px 8px;">${sp.label} • ₹${sp.monthlyRate.toLocaleString('en-IN')}/mo</span>`).join('')
                      : `<span style="font-size: 12px; color: var(--text-muted); font-style: italic;">No permanent seats assigned yet (Status: ${s.status}).</span>`
                    }
                  </div>
                </div>
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-subtle);">
                  <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
                    <span>Meeting Room Quota: <strong>${meetingUsed} / ${meetingTotal} hrs</strong></span>
                    <span style="font-weight: 700; color: #2563eb;">${meetingPct}% Used</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.06); border-radius: 999px; overflow: hidden;">
                    <div style="width: ${meetingPct}%; height: 100%; background: #2563eb; border-radius: 999px;"></div>
                  </div>
                </div>
              </div>

              <!-- CARD E: Financial Economics & Subsidies -->
              <div class="st-dossier-card">
                <h4><span>💰</span> E. Financial Economics & Incubation Subsidies</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; text-align: center;">
                  <div style="background: var(--bg-surface); padding: 8px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Gross Rent</div>
                    <div style="font-weight: 800; font-size: 13px; color: var(--text-primary); margin-top: 2px;">₹${billingCalc ? billingCalc.subtotal.toLocaleString('en-IN') : 'N/A'}</div>
                  </div>
                  <div style="background: var(--bg-surface); padding: 8px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Grant Subsidy</div>
                    <div style="font-weight: 800; font-size: 13px; color: #16a34a; margin-top: 2px;">${s.monthlyGrantSubsidyPercent || 25}%</div>
                  </div>
                  <div style="background: var(--bg-surface); padding: 8px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Net Monthly</div>
                    <div style="font-weight: 800; font-size: 13px; color: var(--accent-primary); margin-top: 2px;">₹${billingCalc ? billingCalc.total.toLocaleString('en-IN') : 'N/A'}</div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); padding-top: 6px; border-top: 1px solid var(--border-subtle);">
                  <span>Lifetime Invoiced: <strong>₹${paySummary.totalInvoiced.toLocaleString('en-IN')}</strong></span>
                  <span>Lifetime Paid: <strong style="color: #16a34a;">₹${paySummary.totalPaid.toLocaleString('en-IN')}</strong></span>
                  <span>Balance: <strong style="color: ${paySummary.balanceDue > 0 ? '#dc2626' : '#16a34a'};">₹${paySummary.balanceDue.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              <!-- CARD F: Sprint Milestones Roadmap -->
              <div class="st-dossier-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <h4 style="margin: 0;"><span>🎯</span> F. Sprint Milestones Roadmap (${milestones.length})</h4>
                  <button class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="StartupTablesModule.closeModal('modal-company-atoz-dossier'); IncubationModule.viewStartupJourneyModal('${s.id}')">
                    Full Journey ➔
                  </button>
                </div>
                ${milestones.length > 0 ? `
                  <div style="display: flex; flex-direction: column; gap: 6px; max-height: 140px; overflow-y: auto;">
                    ${milestones.map(m => `
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 11.5px;">
                        <div>
                          <strong style="color: var(--text-primary);">${m.title}</strong>
                          <span style="font-size: 10px; color: var(--text-muted); margin-left: 6px;">📅 ${m.targetDate || '2026-11-20'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 11px; font-weight: 700; color: #38bdf8;">${m.progressPercent || 0}%</span>
                          <span class="badge ${m.status === 'Completed' ? 'badge-success' : (m.status === 'In Progress' ? 'badge-info' : 'badge-subtle')}" style="font-size: 10px;">${m.status}</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div style="font-size: 12px; color: var(--text-muted); font-style: italic; padding: 12px; text-align: center;">
                    No sprint milestones currently logged for this startup.
                  </div>
                `}
              </div>

              <!-- CARD G: Compliance Documents & KYC Dossier -->
              <div class="st-dossier-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <h4 style="margin: 0;"><span>📁</span> G. Compliance Documents & KYC (${docs.length})</h4>
                  <button class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="StartupTablesModule.closeModal('modal-company-atoz-dossier'); OnboardingModule.openVerificationModal('${s.id}')">
                    View Documents ➔
                  </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${docs.map(d => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; font-size: 11.5px; gap: 10px; flex-wrap: wrap;">
                      <div style="flex: 1; min-width: 170px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <strong>📄 ${d.type}</strong>
                          <span class="badge ${d.status === 'Verified' ? 'badge-success' : 'badge-warning'}" style="font-size: 9.5px; padding: 2px 6px;">${d.status}</span>
                        </div>
                        <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">
                          ${d.fileName || 'document.pdf'} • ${d.fileSize || '1.2 MB'} • ${d.uploadDate || '2026-01-10'}
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 9px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;" onclick="StartupTablesModule.viewCertification('${s.id}', '${d.id || d.type}')" title="View ${d.type}">
                          <span>👁️</span> View
                        </button>
                        <button class="btn btn-sm" style="font-size: 11px; padding: 3px 9px; border-radius: 6px; font-weight: 600; background: #001f54; color: #ffffff; border: 1px solid #1e3a8a; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;" onclick="StartupTablesModule.downloadCertification('${s.id}', '${d.id || d.type}')" title="Download ${d.type}">
                          <span>⬇️</span> Download
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- CARD H: Governance & Board Approval Trail -->
              <div class="st-dossier-card">
                <h4><span>🛡️</span> H. Governance & Board Approval Trail</h4>
                <div style="font-size: 12px; line-height: 1.55;">
                  <div style="margin-bottom: 6px;">
                    <strong style="color: var(--text-primary);">Verification:</strong>
                    <span style="color: #16a34a; font-weight: 700;">✅ Certified</span>
                    <span style="color: var(--text-muted); font-size: 11px;"> by ${verification.verifiedBy || 'Dr. Siddharth'} on ${verification.verifiedAt || '2026-01-12'}</span>
                    <div style="font-size: 11px; color: var(--text-secondary); font-style: italic; margin-top: 2px;">"${verification.notes || 'Full verification approved.'}"</div>
                  </div>
                  <div style="padding-top: 6px; border-top: 1px solid var(--border-subtle);">
                    <strong style="color: var(--text-primary);">Board Steering:</strong>
                    <span style="color: #2563eb; font-weight: 700;">🏛️ ${approval.approved ? 'Approved' : 'Pending'}</span>
                    <span style="color: var(--text-muted); font-size: 11px;"> by ${approval.approvedBy || 'Advisory Board'} on ${approval.approvedAt || '2026-01-14'}</span>
                    <div style="font-size: 11px; color: var(--text-secondary); font-style: italic; margin-top: 2px;">"${approval.committeeRemarks || 'Unanimously approved.'}"</div>
                  </div>
                </div>
              </div>

              <!-- CARD I: Assigned Advisory Mentorship -->
              <div class="st-dossier-card">
                <h4><span>🧠</span> I. Assigned Advisory Mentorship</h4>
                ${mentor ? `
                  <div style="display: flex; align-items: center; gap: 12px; font-size: 12.5px;">
                    <span style="font-size: 28px; width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-surface); border-radius: 10px; border: 1px solid var(--border-subtle);">${mentor.avatarEmoji || '🧠'}</span>
                    <div>
                      <div style="font-weight: 800; color: var(--text-primary); font-size: 13.5px;">${mentor.name}</div>
                      <div style="color: var(--text-secondary); font-size: 11.5px;">${mentor.role} • <strong>${mentor.expertise || mentor.domain}</strong></div>
                      <div style="color: var(--accent-primary); font-size: 11px; margin-top: 2px;">📧 ${mentor.email || 'mentor@nexushub.io'}</div>
                    </div>
                  </div>
                ` : `
                  <div style="font-size: 12px; color: var(--text-muted); font-style: italic; padding: 10px; text-align: center;">
                    No lead mentor assigned yet for this startup.
                  </div>
                `}
              </div>

              <!-- CARD J: Payment & Billing Ledger -->
              <div class="st-dossier-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <h4 style="margin: 0;"><span>💳</span> J. Recent Payments & Billing Ledger</h4>
                  <button class="btn btn-outline btn-sm" style="font-size: 10.5px; padding: 2px 7px;" onclick="StartupTablesModule.closeModal('modal-company-atoz-dossier'); if (typeof PaymentsModule !== 'undefined') PaymentsModule.openStartupPaymentHistoryModal('${s.id}')">
                    Full Ledger ➔
                  </button>
                </div>
                ${payments.length > 0 ? `
                  <div style="display: flex; flex-direction: column; gap: 5px;">
                    ${payments.slice(0, 3).map(p => `
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 11px;">
                        <div>
                          <strong>${p.receiptNo || p.id}</strong>
                          <span style="color: var(--text-muted); font-size: 10px; margin-left: 4px;">${p.paymentDate} via ${p.gateway || p.method}</span>
                        </div>
                        <strong style="color: #16a34a;">₹${Number(p.amount || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div style="font-size: 12px; color: var(--text-muted); font-style: italic; padding: 10px; text-align: center;">
                    No payment transactions logged yet.
                  </div>
                `}
              </div>

            </div>

          </div>

          <!-- Modal Footer -->
          <div style="padding: 16px 28px; border-top: 1px solid var(--border-subtle); background: var(--bg-surface-elevated); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="font-size: 12px; color: var(--text-muted);">
              NEXUS Innovation Operating System • Live Database Dossier
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="btn btn-outline" onclick="StartupTablesModule.closeModal('modal-company-atoz-dossier')">
                Close Dossier
              </button>
              <button class="btn btn-primary" onclick="StartupTablesModule.closeModal('modal-company-atoz-dossier'); OnboardingModule.openVerificationModal('${s.id}')" style="background: #001f54; border-color: #1e3a8a;">
                View Verification
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;

    const onEsc = (e) => {
      if (e.key === 'Escape') {
        StartupTablesModule.closeModal('modal-company-atoz-dossier');
        window.removeEventListener('keydown', onEsc);
      }
    };
    window.addEventListener('keydown', onEsc);
  },

  copyCompanySummary(id) {
    let s = (this.liveData.startups || []).find(x => x.id === id || x._id === id || x.slug === id);
    if (!s && window.store) s = window.store.getStartupById(id);
    if (!s) return;
    const summary = `NEXUS HUB - COMPANY DOSSIER (A-TO-Z)
==============================================
Company Name: ${s.name} (${s.id})
Category / Sector: ${s.category || s.sector || 'DeepTech'}
Cohort: ${s.cohort || 'Cohort 2026-A'}
Stage: ${s.currentStage || s.stage || 'MVP Dev'} | Status: ${s.status || 'Incubated'}
CIN Reg No: ${s.registrationNumber || 'Pending'}
GSTIN: ${s.gstin || 'Pending'}
Founder Lead: ${s.founders ? s.founders.name : 'N/A'} (${s.founders ? s.founders.email : 'N/A'})
Mobile: ${s.founders ? (s.founders.phone || s.founders.mobile) : 'N/A'}
Team Size: ${s.teamSize || s.numberOfEmployees || 2} Pax
Executive Pitch: ${s.pitchSummary || 'N/A'}
Allocated Desks: ${(s.allocatedSeats || []).join(', ') || 'None'}
Funding Ask: ₹${Number(s.targetFundingAsk || 2500000).toLocaleString('en-IN')}
Current MRR: ₹${Number(s.monthlyRecurringRevenue || 150000).toLocaleString('en-IN')}`;

    navigator.clipboard.writeText(summary).then(() => {
      App.showToast(`📋 Copied full A-to-Z summary for ${s.name} to clipboard!`, 'success');
    }).catch(() => {
      App.showToast(`📋 Summary ready for ${s.name}`, 'info');
    });
  },

  printCompanyDossier() {
    window.print();
  },

  viewCertification(startupId, docIdOrType) {
    let s = (this.liveData.startups || []).find(x => x.id === startupId || x._id === startupId || x.slug === startupId);
    if (!s && window.store) s = window.store.getStartupById(startupId);
    if (!s) return;

    const docs = s.documents || [];
    const doc = docs.find(d => d.id === docIdOrType || d.type === docIdOrType) || {
      id: docIdOrType,
      type: docIdOrType,
      fileName: `${s.slug || 'company'}_document.pdf`,
      fileSize: "1.4 MB",
      uploadDate: s.joiningDate || "2026-01-15",
      status: "Verified",
      verifiedBy: "Compliance & Legal Ops"
    };

    const certSerial = `NEXUS-CERT-${s.id}-${Math.abs(doc.type.split('').reduce((a,c) => a + c.charCodeAt(0), 1000))}`;

    const html = `
      <div class="modal-overlay active" id="modal-certificate-viewer" onclick="if(event.target === this) StartupTablesModule.closeModal('modal-certificate-viewer')" style="z-index: 1100; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 20px;">
        <div class="modal-content" style="max-width: 720px; width: 95vw; border-radius: 18px; overflow: hidden; background: #ffffff; color: #0f172a; box-shadow: 0 30px 70px -15px rgba(0,0,0,0.6); border: 2px solid #e2e8f0;">
          
          <!-- Header Bar -->
          <div style="padding: 16px 24px; background: #001f54; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">📜</span>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">Certificate Document Preview</h3>
                <span style="font-size: 11px; color: #93c5fd;">${doc.type} • Official Verification Record</span>
              </div>
            </div>
            <button class="modal-close-btn" onclick="StartupTablesModule.closeModal('modal-certificate-viewer')" style="background: rgba(255,255,255,0.15); color: #ffffff; border: none; font-size: 18px; cursor: pointer;">&times;</button>
          </div>

          <!-- Certificate Parchment Canvas -->
          <div style="padding: 30px 34px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%); position: relative; border-bottom: 1px solid #e2e8f0;">
            <!-- Decorative Border Frame -->
            <div style="border: 3px double #cbd5e1; border-radius: 12px; padding: 26px 22px; text-align: center; position: relative; background: #ffffff; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
              
              <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 30px;">🏛️</span>
              </div>
              <div style="font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: #64748b; font-weight: 800;">
                GOVERNMENT OF INDIA & NEXUS ACCREDITATION COUNCIL
              </div>
              <div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px; font-weight: 600;">
                MINISTRY OF CORPORATE AFFAIRS / STARTUP RECOGNITION REGISTRY
              </div>

              <div style="margin: 18px 0 12px 0;">
                <h2 style="font-size: 22px; font-weight: 900; color: #001f54; margin: 0; letter-spacing: -0.5px; text-transform: uppercase;">
                  ${doc.type}
                </h2>
                <div style="font-size: 11.5px; color: #64748b; margin-top: 5px;">
                  This is to certify and authenticate that the incorporated enterprise
                </div>
              </div>

              <!-- Startup Name & CIN -->
              <div style="background: rgba(0, 31, 84, 0.04); border: 1px solid rgba(0, 31, 84, 0.12); border-radius: 10px; padding: 12px; margin: 14px 0;">
                <div style="font-size: 20px; font-weight: 900; color: #001f54; letter-spacing: -0.4px;">
                  ${s.name} Private Limited
                </div>
                <div style="font-size: 11.5px; color: #475569; margin-top: 4px; font-family: var(--font-mono);">
                  Registration (CIN): <strong>${s.registrationNumber || 'U72900KA2026PTC184912'}</strong> | GSTIN: <strong>${s.gstin || '29AABCN1234F1Z5'}</strong>
                </div>
              </div>

              <p style="font-size: 12px; color: #475569; line-height: 1.6; max-width: 520px; margin: 0 auto 18px;">
                has fulfilled all statutory accreditation standards under <strong>${s.cohort || 'Cohort 2026-A'}</strong> of the Incubation and Enterprise Development Program, with legal and compliance validity verified on <strong>${doc.uploadDate || s.joiningDate || '2026-01-10'}</strong>.
              </p>

              <!-- Footer Signatures & QR Seal -->
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; border-top: 1px dashed #cbd5e1; padding-top: 16px; align-items: center; text-align: center;">
                <div>
                  <div style="font-size: 11.5px; font-weight: 800; color: #0f172a;">${doc.verifiedBy || 'Dr. Siddharth N.'}</div>
                  <div style="font-size: 9.5px; color: #64748b;">Authorized Registrar</div>
                </div>
                <div>
                  <div style="font-size: 28px; line-height: 1;">🛡️</div>
                  <div style="font-size: 9px; font-weight: 700; color: #16a34a; margin-top: 2px;">DIGITALLY VERIFIED</div>
                </div>
                <div>
                  <div style="font-size: 11.5px; font-weight: 800; color: #0f172a;">Compliance Audit Lead</div>
                  <div style="font-size: 9.5px; color: #64748b;">MCA & Legal Council</div>
                </div>
              </div>

              <div style="margin-top: 14px; font-size: 9.5px; font-family: var(--font-mono); color: #94a3b8;">
                DOCUMENT HASH: ${certSerial} • STATUS: ${doc.status || 'VERIFIED'}
              </div>
            </div>
          </div>

          <!-- Modal Action Bar: Separate Download and Print options -->
          <div style="padding: 14px 24px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="font-size: 12px; color: #64748b;">
              File: <strong>${doc.fileName || 'certificate.pdf'}</strong> (${doc.fileSize || '1.4 MB'})
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="StartupTablesModule.closeModal('modal-certificate-viewer')">
                Close
              </button>
              <button class="btn btn-outline btn-sm" onclick="window.print()" style="font-weight: 600;">
                🖨️ Print
              </button>
              <button class="btn btn-sm" onclick="StartupTablesModule.downloadCertification('${s.id}', '${doc.id || doc.type}')" style="background: #001f54; color: #ffffff; border: 1px solid #1e3a8a; font-weight: 700; cursor: pointer;">
                ⬇️ Download Certificate
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    // Append modal container to body so it layers cleanly
    let container = document.getElementById('modal-cert-viewer-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-cert-viewer-container';
      document.body.appendChild(container);
    }
    container.innerHTML = html;
  },

  downloadCertification(startupId, docIdOrType) {
    let s = (this.liveData.startups || []).find(x => x.id === startupId || x._id === startupId || x.slug === startupId);
    if (!s && window.store) s = window.store.getStartupById(startupId);
    if (!s) return;

    const docs = s.documents || [];
    const doc = docs.find(d => d.id === docIdOrType || d.type === docIdOrType) || {
      type: docIdOrType,
      fileName: `${s.slug || 'company'}_certificate.pdf`,
      uploadDate: s.joiningDate || "2026-01-15",
      verifiedBy: "Compliance & Legal Ops"
    };

    const certSerial = `NEXUS-CERT-${s.id}-${Math.abs(doc.type.split('').reduce((a,c) => a + c.charCodeAt(0), 1000))}`;

    const certHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${doc.type} - ${s.name}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; padding: 40px; color: #0f172a; margin: 0; }
    .cert { max-width: 760px; margin: 0 auto; background: #fff; border: 4px double #001f54; border-radius: 14px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    h1 { font-size: 26px; color: #001f54; margin: 12px 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 11px; letter-spacing: 2px; color: #64748b; font-weight: bold; text-transform: uppercase; }
    .company { font-size: 24px; font-weight: 800; color: #001f54; background: #f1f5f9; padding: 14px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1; }
    .details { font-size: 13px; line-height: 1.7; color: #334155; margin: 20px 0; }
    .signatures { display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 24px; margin-top: 30px; font-size: 12px; }
    .seal { font-size: 32px; }
    .hash { font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="seal">🏛️</div>
    <div class="subtitle">GOVERNMENT OF INDIA & NEXUS INCUBATION COUNCIL</div>
    <h1>${doc.type}</h1>
    <div style="font-size: 12px; color: #64748b;">OFFICIAL LEGAL COMPLIANCE & ACCREDITATION RECORD</div>
    
    <div class="company">
      ${s.name} Private Limited
      <div style="font-size: 12px; font-weight: 600; color: #475569; font-family: monospace; margin-top: 4px;">
        CIN: ${s.registrationNumber || 'U72900KA2026PTC184912'} | GSTIN: ${s.gstin || '29AABCN1234F1Z5'}
      </div>
    </div>

    <div class="details">
      This certifies that the enterprise <strong>${s.name}</strong> under Founder <strong>${s.founders ? s.founders.name : 'Founder Lead'}</strong> has passed full legal incorporation, statutory KYC, and compliance evaluation under Cohort <strong>${s.cohort || 'Cohort 2026-A'}</strong>.
    </div>

    <div class="signatures">
      <div>
        <strong>${doc.verifiedBy || 'Dr. Siddharth N.'}</strong><br/>
        <span style="color: #64748b;">Authorized Registrar</span>
      </div>
      <div>
        <span style="font-size: 24px;">🛡️</span><br/>
        <strong style="color: #16a34a;">STATUS: VERIFIED</strong>
      </div>
      <div>
        <strong>Advisory Governing Council</strong><br/>
        <span style="color: #64748b;">Nexus Hub Bengaluru</span>
      </div>
    </div>

    <div class="hash">
      SERIAL ID: ${certSerial} • ISSUED: ${doc.uploadDate || s.joiningDate || '2026-01-10'}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([certHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeDocName = (doc.type || 'certificate').toLowerCase().replace(/[^a-z0-9]/g, '_');
    a.download = `${s.slug || 'startup'}_${safeDocName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    App.showToast(`⬇️ Downloaded official ${doc.type} for ${s.name}!`, 'success');
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
    const certWrap = document.getElementById('modal-cert-viewer-container');
    if (certWrap) certWrap.remove();
    if (modalId === 'modal-company-atoz-dossier') {
      const mount = document.getElementById('modal-mount');
      if (mount) mount.innerHTML = '';
    }
  }
};
