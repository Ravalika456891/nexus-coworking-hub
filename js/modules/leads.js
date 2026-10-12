// Module: Leads, Applications & Live MongoDB Inbound Inquiries

const LeadsModule = {
  leads: [],
  inquiries: [],
  filterSource: 'all',
  filterStatus: 'all',
  searchQuery: '',
  isLoading: false,

  async init() {
    await this.fetchData();
  },

  async fetchData() {
    this.isLoading = true;
    try {
      const [leadsRes, inqRes] = await Promise.all([
        fetch('/api/leads').then(r => r.json()).catch(() => ({ leads: [] })),
        fetch('/api/inquiries').then(r => r.json()).catch(() => ({ inquiries: [] }))
      ]);

      this.leads = (leadsRes && leadsRes.leads) ? leadsRes.leads : [];
      this.inquiries = (inqRes && inqRes.inquiries) ? inqRes.inquiries : [];
    } catch (e) {
      console.warn("Failed fetching live leads from server:", e);
    } finally {
      this.isLoading = false;
    }
  },

  async render() {
    const container = document.getElementById('view-leads');
    if (!container) return;

    if (this.leads.length === 0 && this.inquiries.length === 0 && !this._hasFetched) {
      this._hasFetched = true;
      await this.fetchData();
    }

    const allSubmissions = this.getUnifiedSubmissions();
    const stats = this.computeStats(allSubmissions);
    const filtered = this.getFilteredSubmissions(allSubmissions);

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary);">
              📥 Inbound Leads & Applications
            </h2>
            <span class="badge" style="background: rgba(34, 197, 94, 0.15); color: #16a34a; font-weight: 700; font-size: 11.5px; padding: 4px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e;"></span> MongoDB Atlas Live
            </span>
          </div>
          <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 3px;">
            Real-time pipeline of founder applications, Weekly Dispatch subscribers, and campus tour requests.
          </p>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="LeadsModule.refresh()" title="Reload leads from MongoDB">
            🔄 Refresh
          </button>
          <button class="btn btn-outline btn-sm" onclick="LeadsModule.exportCSV()">
            📥 Export CSV
          </button>
          <button class="btn btn-primary btn-sm" onclick="LeadsModule.openAddLeadModal()">
            + Add Walk-In Lead
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 26px;">
        <div class="card" style="padding: 18px 20px; border-left: 4px solid var(--flame);">
          <div style="font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .06em;">Total Submissions</div>
          <div style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin-top: 6px;">${stats.total}</div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Live documents in MongoDB</div>
        </div>

        <div class="card" style="padding: 18px 20px; border-left: 4px solid #ED441B;">
          <div style="font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .06em;">Founder Applications</div>
          <div style="font-size: 28px; font-weight: 800; color: #ED441B; margin-top: 6px;">${stats.applications}</div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Cohort 07 candidate inquiries</div>
        </div>

        <div class="card" style="padding: 18px 20px; border-left: 4px solid #2563eb;">
          <div style="font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .06em;">Weekly Dispatch</div>
          <div style="font-size: 28px; font-weight: 800; color: #2563eb; margin-top: 6px;">${stats.newsletters}</div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Newsletter subscriber list</div>
        </div>

        <div class="card" style="padding: 18px 20px; border-left: 4px solid #16a34a;">
          <div style="font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .06em;">New & Unprocessed</div>
          <div style="font-size: 28px; font-weight: 800; color: #16a34a; margin-top: 6px;">${stats.unprocessed}</div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Awaiting team contact</div>
        </div>
      </div>

      <!-- Controls & Filter Strip -->
      <div class="card" style="padding: 16px 20px; margin-bottom: 20px;">
        <div style="display: flex; gap: 14px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <div style="display: flex; gap: 6px; background: var(--bg-surface); padding: 4px; border-radius: 10px; border: 1px solid var(--border-color);">
              <button class="btn btn-sm ${this.filterSource === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="LeadsModule.setSourceFilter('all')">All (${allSubmissions.length})</button>
              <button class="btn btn-sm ${this.filterSource === 'cta_application' ? 'btn-primary' : 'btn-ghost'}" onclick="LeadsModule.setSourceFilter('cta_application')">🚀 Applications (${stats.applications})</button>
              <button class="btn btn-sm ${this.filterSource === 'weekly_dispatch' ? 'btn-primary' : 'btn-ghost'}" onclick="LeadsModule.setSourceFilter('weekly_dispatch')">📰 Dispatch (${stats.newsletters})</button>
              <button class="btn btn-sm ${this.filterSource === 'inquiry' ? 'btn-primary' : 'btn-ghost'}" onclick="LeadsModule.setSourceFilter('inquiry')">📍 Inquiries (${stats.inquiries})</button>
            </div>

            <select class="input" style="width: auto; padding: 6px 12px; font-size: 13px;" onchange="LeadsModule.setStatusFilter(this.value)">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="New" ${this.filterStatus === 'New' ? 'selected' : ''}>🟡 New</option>
              <option value="In Review" ${this.filterStatus === 'In Review' ? 'selected' : ''}>🔵 In Review</option>
              <option value="Contacted" ${this.filterStatus === 'Contacted' ? 'selected' : ''}>🟣 Contacted</option>
              <option value="Converted" ${this.filterStatus === 'Converted' ? 'selected' : ''}>🟢 Converted</option>
              <option value="Archived" ${this.filterStatus === 'Archived' ? 'selected' : ''}>⚪ Archived</option>
            </select>
          </div>

          <div style="position: relative; min-width: 260px;">
            <input type="text" class="input" style="padding: 8px 14px 8px 34px; font-size: 13px; width: 100%;" placeholder="Search email, name, org..." value="${this.searchQuery}" oninput="LeadsModule.setSearch(this.value)">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: .5; font-size: 14px;">🔍</span>
          </div>
        </div>
      </div>

      <!-- Main Submissions Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="table" style="margin: 0;">
            <thead>
              <tr style="background: var(--bg-surface); font-size: 11.5px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted);">
                <th style="padding: 14px 18px;">Submitter</th>
                <th style="padding: 14px 18px;">Type & Source</th>
                <th style="padding: 14px 18px;">Submission Date</th>
                <th style="padding: 14px 18px;">Status</th>
                <th style="padding: 14px 18px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="5" style="padding: 60px 20px; text-align: center; color: var(--text-muted);">
                    <div style="font-size: 38px; margin-bottom: 12px;">📭</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--text-primary);">No submissions match your filters</div>
                    <p style="font-size: 13px; margin-top: 4px;">Leads submitted from the public landing page will appear here in real time.</p>
                  </td>
                </tr>
              ` : filtered.map(item => this.renderRow(item)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  getUnifiedSubmissions() {
    const list = [];

    this.leads.forEach(l => {
      list.push({
        id: l._id || l.id,
        email: l.email || 'No email',
        name: l.name || '',
        organization: l.organization || '',
        sourceType: l.source === 'cta_application' ? 'Founder Application' : 'Weekly Dispatch',
        rawSource: l.source || 'cta_application',
        notes: l.notes || '',
        status: l.status || 'New',
        createdAt: l.createdAt || new Date().toISOString(),
        isLead: true
      });
    });

    this.inquiries.forEach(i => {
      list.push({
        id: i._id || i.id,
        email: i.email || 'No email',
        name: i.name || '',
        organization: i.organization || '',
        sourceType: i.category ? `${i.category} Inquiry` : 'Campus Desk Ticket',
        rawSource: 'inquiry',
        notes: i.message || i.subject || '',
        status: i.status || 'New',
        createdAt: i.createdAt || new Date().toISOString(),
        isLead: false
      });
    });

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  computeStats(items) {
    const total = items.length;
    const applications = items.filter(i => i.rawSource === 'cta_application').length;
    const newsletters = items.filter(i => i.rawSource === 'weekly_dispatch').length;
    const inquiries = items.filter(i => i.rawSource === 'inquiry').length;
    const unprocessed = items.filter(i => i.status === 'New' || i.status === 'In Review').length;
    return { total, applications, newsletters, inquiries, unprocessed };
  },

  getFilteredSubmissions(items) {
    return items.filter(item => {
      if (this.filterSource !== 'all' && item.rawSource !== this.filterSource) {
        return false;
      }
      if (this.filterStatus !== 'all' && item.status !== this.filterStatus) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matches = (item.email && item.email.toLowerCase().includes(q)) ||
                        (item.name && item.name.toLowerCase().includes(q)) ||
                        (item.organization && item.organization.toLowerCase().includes(q)) ||
                        (item.notes && item.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  },

  renderRow(item) {
    const isApp = item.rawSource === 'cta_application';
    const isNews = item.rawSource === 'weekly_dispatch';

    const sourceBadge = isApp 
      ? `<span class="badge" style="background: rgba(237, 68, 27, 0.12); color: #ED441B; font-weight: 700; font-size: 11px;">🚀 Founder Application</span>`
      : isNews
      ? `<span class="badge" style="background: rgba(37, 99, 235, 0.12); color: #2563eb; font-weight: 700; font-size: 11px;">📰 Weekly Dispatch</span>`
      : `<span class="badge" style="background: rgba(107, 114, 128, 0.12); color: #4b5563; font-weight: 700; font-size: 11px;">📍 ${item.sourceType}</span>`;

    const statusColors = {
      'New': { bg: 'rgba(234, 179, 8, 0.14)', color: '#ca8a04' },
      'In Review': { bg: 'rgba(59, 130, 246, 0.14)', color: '#2563eb' },
      'Contacted': { bg: 'rgba(168, 85, 247, 0.14)', color: '#9333ea' },
      'Converted': { bg: 'rgba(34, 197, 94, 0.14)', color: '#16a34a' },
      'Archived': { bg: 'rgba(156, 163, 175, 0.14)', color: '#6b7280' }
    };
    const sc = statusColors[item.status] || statusColors['New'];

    const dateFormatted = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 14px 18px;">
          <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">
            ${item.email}
          </div>
          ${item.name || item.organization ? `
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              ${item.name ? `<b>${item.name}</b>` : ''} ${item.organization ? `· ${item.organization}` : ''}
            </div>
          ` : ''}
          ${item.notes ? `
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.notes}">
              💬 "${item.notes}"
            </div>
          ` : ''}
        </td>

        <td style="padding: 14px 18px;">
          ${sourceBadge}
        </td>

        <td style="padding: 14px 18px; font-size: 12.5px; color: var(--text-muted);">
          ${dateFormatted}
        </td>

        <td style="padding: 14px 18px;">
          <select 
            class="badge" 
            style="background: ${sc.bg}; color: ${sc.color}; font-weight: 700; border: 1px solid ${sc.color}44; padding: 4px 8px; border-radius: 999px; cursor: pointer; font-size: 11.5px;"
            onchange="LeadsModule.updateStatus('${item.id}', this.value, ${item.isLead})"
          >
            <option value="New" ${item.status === 'New' ? 'selected' : ''}>🟡 New</option>
            <option value="In Review" ${item.status === 'In Review' ? 'selected' : ''}>🔵 In Review</option>
            <option value="Contacted" ${item.status === 'Contacted' ? 'selected' : ''}>🟣 Contacted</option>
            <option value="Converted" ${item.status === 'Converted' ? 'selected' : ''}>🟢 Converted</option>
            <option value="Archived" ${item.status === 'Archived' ? 'selected' : ''}>⚪ Archived</option>
          </select>
        </td>

        <td style="padding: 14px 18px; text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <a href="mailto:${item.email}?subject=NEXUS%20HUB%20-%20Regarding%20your%20application" class="btn btn-ghost btn-sm" style="padding: 5px 8px;" title="Email Applicant">
              ✉️
            </a>
            ${isApp ? `
              <button class="btn btn-primary btn-sm" style="padding: 5px 10px; font-size: 11.5px;" onclick="LeadsModule.convertToStartup('${item.email}', '${item.name || ''}')" title="Fast-track to startup onboarding">
                🚀 Convert
              </button>
            ` : ''}
            <button class="btn btn-ghost btn-sm" style="padding: 5px 8px; color: #ef4444;" onclick="LeadsModule.deleteItem('${item.id}', ${item.isLead})" title="Delete document">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  async updateStatus(id, newStatus, isLead) {
    try {
      const endpoint = isLead ? '/api/leads/update' : '/api/inquiries/update';
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { status: newStatus } })
      });
      App.showToast(`Updated status to "${newStatus}"`, 'success');
      await this.fetchData();
      this.render();
    } catch (e) {
      App.showToast('Failed updating status', 'error');
    }
  },

  async deleteItem(id, isLead) {
    if (!confirm('Are you sure you want to delete this lead document from MongoDB?')) return;
    try {
      if (isLead) {
        await fetch('/api/leads/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
      } else {
        await fetch('/api/inquiries/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, updates: { status: 'Archived' } })
        });
      }
      App.showToast('Lead deleted from database', 'info');
      await this.fetchData();
      this.render();
    } catch (e) {
      App.showToast('Failed deleting lead', 'error');
    }
  },

  convertToStartup(email, name) {
    App.switchTab('onboarding');
    setTimeout(() => {
      const nameInput = document.getElementById('startup-name');
      const emailInput = document.getElementById('founder-email');
      const founderInput = document.getElementById('founder-name');
      if (emailInput) emailInput.value = email;
      if (name && founderInput) founderInput.value = name;
      if (nameInput) {
        const domain = email.split('@')[1] ? email.split('@')[1].split('.')[0] : '';
        nameInput.value = domain ? domain.charAt(0).toUpperCase() + domain.slice(1) + ' Labs' : '';
      }
      App.showToast(`Pre-filled onboarding form for ${email}`, 'success');
    }, 200);
  },

  openAddLeadModal() {
    const modal = document.getElementById('modal-mount');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="document.getElementById('modal-mount').innerHTML=''">
        <div class="modal-card" onclick="event.stopPropagation()" style="max-width: 480px;">
          <div class="modal-header">
            <h3>+ Add Walk-In or Inbound Lead</h3>
            <button class="modal-close" onclick="document.getElementById('modal-mount').innerHTML=''">×</button>
          </div>
          <form onsubmit="LeadsModule.handleManualLeadSubmit(event)" style="padding: 20px;">
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="label">Work Email *</label>
              <input type="email" id="manual-lead-email" class="input" required placeholder="founder@venture.io">
            </div>
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="label">Founder Name</label>
              <input type="text" id="manual-lead-name" class="input" placeholder="e.g. Rahul Sharma">
            </div>
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="label">Startup / Company Name</label>
              <input type="text" id="manual-lead-org" class="input" placeholder="e.g. NextWave Robotics">
            </div>
            <div class="form-group" style="margin-bottom: 18px;">
              <label class="label">Lead Type</label>
              <select id="manual-lead-source" class="input">
                <option value="cta_application">🚀 Founder Application</option>
                <option value="inquiry">📍 Campus Tour & Walk-In</option>
                <option value="weekly_dispatch">📰 Weekly Dispatch Subscriber</option>
              </select>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-mount').innerHTML=''">Cancel</button>
              <button type="submit" class="btn btn-primary">Save to MongoDB</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async handleManualLeadSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('manual-lead-email').value;
    const name = document.getElementById('manual-lead-name').value;
    const organization = document.getElementById('manual-lead-org').value;
    const source = document.getElementById('manual-lead-source').value;

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          organization,
          source,
          status: 'New',
          createdAt: new Date().toISOString()
        })
      });
      document.getElementById('modal-mount').innerHTML = '';
      App.showToast('Lead saved successfully to MongoDB Atlas!', 'success');
      await this.fetchData();
      this.render();
    } catch (err) {
      App.showToast('Failed saving lead to database', 'error');
    }
  },

  exportCSV() {
    const items = this.getUnifiedSubmissions();
    if (items.length === 0) {
      App.showToast('No leads available to export', 'info');
      return;
    }

    const headers = ['ID', 'Email', 'Name', 'Organization', 'Type', 'Status', 'Date', 'Notes'];
    const rows = items.map(i => [
      i.id,
      `"${(i.email || '').replace(/"/g, '""')}"`,
      `"${(i.name || '').replace(/"/g, '""')}"`,
      `"${(i.organization || '').replace(/"/g, '""')}"`,
      `"${(i.sourceType || '').replace(/"/g, '""')}"`,
      i.status,
      `"${new Date(i.createdAt).toISOString()}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    App.showToast('Exported leads to CSV', 'success');
  },

  setSourceFilter(src) {
    this.filterSource = src;
    this.render();
  },

  setStatusFilter(st) {
    this.filterStatus = st;
    this.render();
  },

  setSearch(q) {
    this.searchQuery = q;
    this.render();
  },

  async refresh() {
    App.showToast('Fetching latest leads from MongoDB...', 'info');
    await this.fetchData();
    this.render();
    App.showToast('Leads refreshed!', 'success');
  }
};
