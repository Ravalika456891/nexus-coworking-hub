// Module: Database Tables Explorer & MongoDB Atlas Collections Manager

const DatabaseModule = {
  tables: [],
  activeTable: 'startups',
  records: [],
  totalRecords: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  schemaFields: [],
  searchQuery: '',
  isLoading: false,
  mongoStatus: null,
  activeCategoryFilter: 'all', // 'all' | 'startup' | 'facility'
  startupTableNames: ['startups', 'milestones', 'mentors', 'leads', 'inquiries'],
  facilityTableNames: ['workspaces', 'meeting_rooms', 'invoices', 'payments', 'activity_logs'],
  activeDocumentModal: null,

  async init() {
    if (!this._listenerBound) {
      this._listenerBound = true;
      window.addEventListener('nexus:state_updated', () => {
        this.fetchTables();
        this.fetchRecords(this.activeTable, this.page);
      });
      setInterval(() => {
        if (window.App && window.App.currentTab === 'database' && !document.hidden) {
          this.fetchTables();
          this.fetchRecords(this.activeTable, this.page);
        }
      }, 8000);
    }
    await this.fetchTables();
    if (this.tables.length > 0) {
      await this.fetchRecords(this.activeTable);
    }
  },

  async fetchTables() {
    this.isLoading = true;
    try {
      const res = await fetch('/api/database/tables').then(r => r.json());
      if (res && res.ok) {
        this.tables = res.tables || [];
        this.mongoStatus = res.mongo || null;
      }
    } catch (err) {
      console.warn('Failed to load database tables info:', err);
    } finally {
      this.isLoading = false;
    }
  },

  async fetchRecords(tableName = this.activeTable, page = 1) {
    this.activeTable = tableName;
    this.page = page;
    this.isLoading = true;
    try {
      const q = encodeURIComponent(this.searchQuery);
      const url = `/api/database/table?name=${tableName}&page=${page}&limit=${this.limit}&search=${q}`;
      const res = await fetch(url).then(r => r.json());
      if (res && res.ok) {
        this.records = res.records || [];
        this.totalRecords = res.total || 0;
        this.totalPages = res.totalPages || 1;
        this.schemaFields = res.fields || [];
      } else {
        this.records = [];
        this.totalRecords = 0;
      }
    } catch (err) {
      console.error('Error fetching table records:', err);
      this.records = [];
    } finally {
      this.isLoading = false;
      this.render();
    }
  },

  async render() {
    const container = document.getElementById('view-database');
    if (!container) return;

    if (this.tables.length === 0 && !this._initialized) {
      this._initialized = true;
      await this.fetchTables();
      await this.fetchRecords(this.activeTable);
      return;
    }

    const curTableDef = this.tables.find(t => t.name === this.activeTable) || this.tables[0] || {
      name: this.activeTable,
      label: this.activeTable,
      icon: '🗄️',
      description: 'Database table',
      count: this.records.length
    };

    const totalSystemDocs = this.tables.reduce((acc, t) => acc + (t.count || 0), 0);

    // Filter display columns to top 7 most informative fields
    const displayFields = (this.schemaFields.length > 0 ? this.schemaFields : ['_id', 'id', 'name', 'status', 'createdAt'])
      .filter(f => f !== '_id' && f !== '_syncedAt' && f !== '_createdAt' && f !== '_updatedAt')
      .slice(0, 7);

    container.innerHTML = `
      <!-- Header Banner & Cluster Telemetry -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 22px 26px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 26px;">🗄️</span>
              <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px;">
                Database Tables & Collections Explorer
              </h2>
              <span class="badge badge-success" style="font-size: 11px; padding: 4px 10px; display: inline-flex; align-items: center; gap: 6px;">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px #22c55e;"></span>
                MongoDB Atlas Live
              </span>
            </div>
            <p style="font-size: 13.5px; color: var(--text-secondary); max-width: 820px; line-height: 1.5; margin: 0;">
              Production schema manager for <strong>10 Live Collections</strong> hosted on MongoDB Atlas Cluster <code>H-HUB (AWS Mumbai)</code>. Real-time document querying, schema discovery, data seeding, and instant CRUD operations.
            </p>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <button class="btn btn-outline btn-sm" onclick="DatabaseModule.refreshAll()" title="Reload all database tables and statistics">
              🔄 Refresh Tables
            </button>
            <button class="btn btn-outline btn-sm" onclick="DatabaseModule.seedTables(false)" title="Ensure all empty tables have seed data populated">
              🌱 Sync Seed Data
            </button>
            <button class="btn btn-primary btn-sm" onclick="DatabaseModule.openInsertModal('${this.activeTable}')">
              + Insert Row / Document
            </button>
          </div>
        </div>

        <!-- Telemetry Stats Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-top: 20px;">
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 16px; border-left: 3.5px solid #22c55e;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Connection Status</div>
            <div style="font-size: 15px; font-weight: 800; color: #16a34a; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
              <span>● Connected</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">DB: <strong>${this.mongoStatus?.database || 'nexus_hub'}</strong></div>
          </div>

          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 16px; border-left: 3.5px solid var(--flame);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Tables</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">${this.tables.length} Collections</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Fully indexed in Atlas</div>
          </div>

          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 16px; border-left: 3.5px solid #3b82f6;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Documents</div>
            <div style="font-size: 20px; font-weight: 800; color: #2563eb; margin-top: 2px;">${totalSystemDocs} Records</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Across all collections</div>
          </div>

          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 16px; border-left: 3.5px solid #8b5cf6;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Selected Table</div>
            <div style="font-size: 15px; font-weight: 800; color: #7c3aed; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${curTableDef.icon} ${curTableDef.label}
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;"><strong>${this.totalRecords}</strong> documents queried</div>
          </div>
        </div>
      </div>

      <!-- Table Category Tabs & Startup Tables Filter -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
            Select Database Table / Collection:
          </div>
          <div style="display: flex; gap: 6px; background: var(--bg-surface-elevated); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <button class="btn btn-sm ${this.activeCategoryFilter === 'all' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 10px;" onclick="DatabaseModule.setCategoryFilter('all')">
              All Tables (${this.tables.length})
            </button>
            <button class="btn btn-sm ${this.activeCategoryFilter === 'startup' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 10px;" onclick="DatabaseModule.setCategoryFilter('startup')">
              🚀 Startup Tables (${this.tables.filter(t => this.startupTableNames.includes(t.name)).length})
            </button>
            <button class="btn btn-sm ${this.activeCategoryFilter === 'facility' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 10px;" onclick="DatabaseModule.setCategoryFilter('facility')">
              🏢 Facilities & Billing (${this.tables.filter(t => this.facilityTableNames.includes(t.name)).length})
            </button>
          </div>
        </div>

        <!-- Table Selection Badges / Tabs Row -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${this.tables
            .filter(t => {
              if (this.activeCategoryFilter === 'startup') return this.startupTableNames.includes(t.name);
              if (this.activeCategoryFilter === 'facility') return this.facilityTableNames.includes(t.name);
              return true;
            })
            .map(t => {
            const isSelected = t.name === this.activeTable;
            return `
              <button 
                type="button" 
                onclick="DatabaseModule.selectTable('${t.name}')"
                class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}"
                style="padding: 7px 14px; font-size: 12px; font-weight: ${isSelected ? '700' : '500'}; display: inline-flex; align-items: center; gap: 8px; border-radius: 999px;"
              >
                <span>${t.icon}</span>
                <span>${t.label}</span>
                <span class="badge ${isSelected ? 'badge-light' : 'badge-subtle'}" style="font-size: 10px; padding: 2px 6px; font-family: var(--font-mono); background: ${isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface)'};">
                  ${t.count}
                </span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Main Table View Card -->
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); background: var(--bg-surface);">
        <!-- Table Action Header -->
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; background: var(--bg-surface-elevated);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">${curTableDef.icon}</span>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary);">
                ${curTableDef.label} 
                <code style="font-size: 12.5px; background: var(--bg-surface); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border-subtle); color: var(--accent-primary); font-weight: 600;">collection: "${curTableDef.name}"</code>
              </h3>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
              ${curTableDef.description} • Schema includes <strong>${displayFields.length} visible columns</strong>
            </div>
          </div>

          <!-- Search & Controls -->
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="position: relative; min-width: 240px;">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Search ${curTableDef.label}..." 
                value="${this.searchQuery}"
                oninput="DatabaseModule.handleSearch(this.value)"
                style="padding-left: 32px; font-size: 12.5px; height: 36px;"
              >
              <span style="position: absolute; left: 10px; top: 9px; font-size: 13px; color: var(--text-muted);">🔍</span>
            </div>

            <button class="btn btn-outline btn-sm" onclick="DatabaseModule.exportCurrentTable('json')" title="Export table as JSON">
              📥 JSON
            </button>
            <button class="btn btn-outline btn-sm" onclick="DatabaseModule.exportCurrentTable('csv')" title="Export table as CSV">
              📊 CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="DatabaseModule.openInsertModal('${this.activeTable}')">
              + Add Record
            </button>
          </div>
        </div>

        <!-- Table Grid View -->
        <div style="overflow-x: auto; min-height: 280px;">
          ${this.records.length === 0 ? `
            <div style="padding: 60px 20px; text-align: center; color: var(--text-muted);">
              <div style="font-size: 44px; margin-bottom: 12px;">📭</div>
              <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">No Documents Found</h4>
              <p style="font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                ${this.searchQuery ? `No matching records for "${this.searchQuery}". Try clearing your search.` : `This collection is currently empty in MongoDB Atlas.`}
              </p>
              ${this.searchQuery ? `
                <button class="btn btn-outline btn-sm" onclick="DatabaseModule.handleSearch('')">Clear Search</button>
              ` : `
                <button class="btn btn-primary btn-sm" onclick="DatabaseModule.seedTables(false)">Populate Default Data</button>
              `}
            </div>
          ` : `
            <table class="table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
              <thead>
                <tr style="background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                  <th style="padding: 10px 16px; font-weight: 700; text-transform: uppercase; font-size: 11px; width: 60px;">#</th>
                  <th style="padding: 10px 16px; font-weight: 700; text-transform: uppercase; font-size: 11px;">Primary Key / ID</th>
                  ${displayFields.map(f => `
                    <th style="padding: 10px 16px; font-weight: 700; text-transform: uppercase; font-size: 11px; white-space: nowrap;">
                      ${this.formatColumnHeader(f)}
                    </th>
                  `).join('')}
                  <th style="padding: 10px 16px; font-weight: 700; text-transform: uppercase; font-size: 11px; text-align: right; width: 130px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.records.map((doc, idx) => {
                  const pk = doc.id || doc._id || `ROW-${idx + 1}`;
                  return `
                    <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s ease;" onmouseover="this.style.background='var(--bg-surface-elevated)'" onmouseout="this.style.background='transparent'">
                      <td style="padding: 12px 16px; color: var(--text-muted); font-family: var(--font-mono); font-size: 11px;">
                        ${(this.page - 1) * this.limit + idx + 1}
                      </td>
                      <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; color: var(--accent-primary); white-space: nowrap;">
                        ${pk}
                      </td>
                      ${displayFields.map(f => `
                        <td style="padding: 12px 16px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${this.formatCellValue(doc[f], f)}
                        </td>
                      `).join('')}
                      <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
                        <button 
                          class="btn btn-outline btn-sm" 
                          style="padding: 3px 8px; font-size: 11px; margin-right: 4px;" 
                          onclick="DatabaseModule.viewDocument(${idx})"
                          title="View raw JSON"
                        >
                          👁️ JSON
                        </button>
                        <button 
                          class="btn btn-outline btn-sm" 
                          style="padding: 3px 8px; font-size: 11px; margin-right: 4px;" 
                          onclick="DatabaseModule.openEditModal(${idx})"
                          title="Edit Document"
                        >
                          ✏️
                        </button>
                        <button 
                          class="btn btn-outline btn-sm" 
                          style="padding: 3px 8px; font-size: 11px; color: #ef4444;" 
                          onclick="DatabaseModule.deleteDocument('${pk}')"
                          title="Delete from MongoDB"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- Table Pagination Footer -->
        <div style="padding: 12px 20px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; background: var(--bg-surface-elevated); font-size: 12px; color: var(--text-secondary);">
          <div>
            Showing <strong>${this.records.length}</strong> of <strong>${this.totalRecords}</strong> documents in <code>${this.activeTable}</code>
          </div>

          <div style="display: flex; gap: 6px; align-items: center;">
            <button 
              class="btn btn-outline btn-sm" 
              style="padding: 3px 9px;"
              ${this.page <= 1 ? 'disabled' : ''}
              onclick="DatabaseModule.fetchRecords('${this.activeTable}', ${this.page - 1})"
            >
              ◀ Previous
            </button>
            <span style="font-family: var(--font-mono); padding: 0 6px;">
              Page ${this.page} of ${this.totalPages}
            </span>
            <button 
              class="btn btn-outline btn-sm" 
              style="padding: 3px 9px;"
              ${this.page >= this.totalPages ? 'disabled' : ''}
              onclick="DatabaseModule.fetchRecords('${this.activeTable}', ${this.page + 1})"
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>
    `;
  },

  formatColumnHeader(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  },

  formatCellValue(val, field) {
    if (val === null || val === undefined) {
      return `<span style="color: var(--text-muted); font-style: italic;">null</span>`;
    }

    if (typeof val === 'boolean') {
      return val 
        ? `<span class="badge badge-success" style="font-size: 10.5px;">true</span>` 
        : `<span class="badge badge-subtle" style="font-size: 10.5px;">false</span>`;
    }

    if (field === 'status' || field === 'currentStage') {
      const isDone = ['Completed', 'Approved', 'Active', 'Paid', 'Operational'].includes(val);
      const isPending = ['In Progress', 'Pending', 'Under Review', 'New'].includes(val);
      const badgeCls = isDone ? 'badge-success' : (isPending ? 'badge-info' : 'badge-subtle');
      return `<span class="badge ${badgeCls}" style="font-size: 11px;">${val}</span>`;
    }

    if (typeof val === 'number') {
      if (field.toLowerCase().includes('amount') || field.toLowerCase().includes('mrr') || field.toLowerCase().includes('rent') || field.toLowerCase().includes('rate')) {
        return `<strong>₹${val.toLocaleString('en-IN')}</strong>`;
      }
      return `<span style="font-family: var(--font-mono);">${val.toLocaleString()}</span>`;
    }

    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return `<span class="badge badge-subtle" style="font-size: 10px; font-family: var(--font-mono);">${val.length} items [ ]</span>`;
      }
      return `<span class="badge badge-subtle" style="font-size: 10px; font-family: var(--font-mono);">{ object }</span>`;
    }

    const str = String(val);
    if (str.length > 32) {
      return `<span title="${str}">${str.slice(0, 32)}…</span>`;
    }
    return str;
  },

  setCategoryFilter(cat) {
    this.activeCategoryFilter = cat;
    if (cat === 'startup' && !this.startupTableNames.includes(this.activeTable)) {
      this.selectTable('startups');
    } else if (cat === 'facility' && !this.facilityTableNames.includes(this.activeTable)) {
      this.selectTable('workspaces');
    } else {
      this.render();
    }
  },

  selectTable(tableName) {
    this.searchQuery = '';
    this.page = 1;
    this.fetchRecords(tableName, 1);
  },

  handleSearch(query) {
    this.searchQuery = query;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.fetchRecords(this.activeTable, 1);
    }, 280);
  },

  async refreshAll() {
    App.showToast('🔄 Synchronizing database tables with MongoDB Atlas...', 'info');
    await this.fetchTables();
    await this.fetchRecords(this.activeTable, this.page);
    App.showToast('✅ Tables up-to-date!', 'success');
  },

  async seedTables(force = false) {
    if (force && !confirm('Are you sure you want to re-seed all tables? This will reset data to defaults.')) {
      return;
    }
    App.showToast('🌱 Syncing default seed collections into MongoDB Atlas...', 'info');
    try {
      const res = await fetch('/api/database/table/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      }).then(r => r.json());

      if (res && res.ok) {
        App.showToast('✅ All 10 tables synchronized into MongoDB Atlas!', 'success');
        await this.fetchTables();
        await this.fetchRecords(this.activeTable, 1);
      } else {
        App.showToast('⚠️ Seeding returned: ' + (res.error || 'Unknown error'), 'warning');
      }
    } catch (err) {
      App.showToast('❌ Failed seeding database: ' + err.message, 'error');
    }
  },

  viewDocument(idx) {
    const doc = this.records[idx];
    if (!doc) return;
    const jsonStr = JSON.stringify(doc, null, 2);

    const html = `
      <div class="modal-overlay active" id="modal-db-doc-view">
        <div class="modal-content" style="max-width: 680px;">
          <div class="modal-header">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent-primary);">MongoDB Document Inspector</div>
              <h3 class="modal-title">${this.activeTable}: <code>${doc.id || doc._id}</code></h3>
            </div>
            <button class="modal-close-btn" onclick="DatabaseModule.closeModal('modal-db-doc-view')">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 12px; color: var(--text-muted);">Format: Standard JSON Document</span>
              <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('db-raw-json-block').innerText); App.showToast('📋 Copied JSON to clipboard!', 'success');">
                📋 Copy JSON
              </button>
            </div>
            <pre id="db-raw-json-block" style="background: #0f172a; color: #38bdf8; padding: 16px; border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 12px; line-height: 1.5; max-height: 440px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);">${this.escapeHtml(jsonStr)}</pre>
            <div class="modal-footer" style="padding: 14px 0 0 0;">
              <button type="button" class="btn btn-secondary" onclick="DatabaseModule.closeModal('modal-db-doc-view')">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-mount').innerHTML = html;
  },

  openInsertModal(tableName = this.activeTable) {
    const curTable = this.tables.find(t => t.name === tableName);
    const sampleRecord = this.records[0] ? { ...this.records[0] } : { id: tableName.slice(0, 3).toUpperCase() + '-NEW' };
    delete sampleRecord._id;
    delete sampleRecord._syncedAt;

    const templateJson = JSON.stringify(sampleRecord, null, 2);

    const html = `
      <div class="modal-overlay active" id="modal-db-insert">
        <div class="modal-content" style="max-width: 680px;">
          <div class="modal-header">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #22c55e;">MongoDB Atlas Insert</div>
              <h3 class="modal-title">+ Insert New Document into <code>${tableName}</code></h3>
            </div>
            <button class="modal-close-btn" onclick="DatabaseModule.closeModal('modal-db-insert')">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 12px;">
              Provide the document fields in valid JSON format. A unique ID will be generated if not specified.
            </p>
            <form onsubmit="DatabaseModule.handleInsertSubmit(event, '${tableName}')">
              <div class="form-group">
                <label class="form-label">Document JSON Payload <span class="required-star">*</span></label>
                <textarea id="db-insert-payload" class="form-control" rows="12" style="font-family: var(--font-mono); font-size: 12px; background: var(--bg-surface-elevated);" required>${this.escapeHtml(templateJson)}</textarea>
              </div>
              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="DatabaseModule.closeModal('modal-db-insert')">Cancel</button>
                <button type="submit" class="btn btn-primary">Insert into MongoDB</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-mount').innerHTML = html;
  },

  async handleInsertSubmit(e, tableName) {
    e.preventDefault();
    const payloadText = document.getElementById('db-insert-payload').value;
    let docObj;
    try {
      docObj = JSON.parse(payloadText);
    } catch (err) {
      App.showToast('❌ Invalid JSON format: ' + err.message, 'error');
      return;
    }

    try {
      const res = await fetch('/api/database/table/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, document: docObj })
      }).then(r => r.json());

      if (res && res.ok) {
        this.closeModal('modal-db-insert');
        App.showToast(`✅ Document inserted into ${tableName}!`, 'success');
        await this.fetchTables();
        await this.fetchRecords(tableName, 1);
      } else {
        App.showToast('❌ Insert failed: ' + (res.error || 'Server error'), 'error');
      }
    } catch (err) {
      App.showToast('❌ Request error: ' + err.message, 'error');
    }
  },

  openEditModal(idx) {
    const doc = this.records[idx];
    if (!doc) return;
    const pk = doc.id || doc._id;
    const editableDoc = { ...doc };
    delete editableDoc._id;

    const html = `
      <div class="modal-overlay active" id="modal-db-edit">
        <div class="modal-content" style="max-width: 680px;">
          <div class="modal-header">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent-primary);">Update Document</div>
              <h3 class="modal-title">Edit Record: <code>${pk}</code></h3>
            </div>
            <button class="modal-close-btn" onclick="DatabaseModule.closeModal('modal-db-edit')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="DatabaseModule.handleEditSubmit(event, '${this.activeTable}', '${pk}')">
              <div class="form-group">
                <label class="form-label">Document JSON Updates <span class="required-star">*</span></label>
                <textarea id="db-edit-payload" class="form-control" rows="12" style="font-family: var(--font-mono); font-size: 12px; background: var(--bg-surface-elevated);" required>${this.escapeHtml(JSON.stringify(editableDoc, null, 2))}</textarea>
              </div>
              <div class="modal-footer" style="padding-right: 0; padding-bottom: 0;">
                <button type="button" class="btn btn-secondary" onclick="DatabaseModule.closeModal('modal-db-edit')">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Document Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-mount').innerHTML = html;
  },

  async handleEditSubmit(e, tableName, id) {
    e.preventDefault();
    const payloadText = document.getElementById('db-edit-payload').value;
    let updates;
    try {
      updates = JSON.parse(payloadText);
    } catch (err) {
      App.showToast('❌ Invalid JSON: ' + err.message, 'error');
      return;
    }

    try {
      const res = await fetch('/api/database/table/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, id, updates })
      }).then(r => r.json());

      if (res && res.ok) {
        this.closeModal('modal-db-edit');
        App.showToast(`✅ Record ${id} updated in MongoDB!`, 'success');
        await this.fetchRecords(tableName, this.page);
      } else {
        App.showToast('❌ Update failed: ' + (res.error || 'Server error'), 'error');
      }
    } catch (err) {
      App.showToast('❌ Request error: ' + err.message, 'error');
    }
  },

  async deleteDocument(id) {
    if (!confirm(`Are you sure you want to permanently delete document "${id}" from MongoDB collection "${this.activeTable}"?`)) {
      return;
    }

    try {
      const res = await fetch('/api/database/table/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: this.activeTable, id })
      }).then(r => r.json());

      if (res && res.ok) {
        App.showToast(`🗑️ Document "${id}" deleted from ${this.activeTable}`, 'info');
        await this.fetchTables();
        await this.fetchRecords(this.activeTable, this.page);
      } else {
        App.showToast('❌ Deletion failed: ' + (res.error || 'Server error'), 'error');
      }
    } catch (err) {
      App.showToast('❌ Request error: ' + err.message, 'error');
    }
  },

  exportCurrentTable(format = 'json') {
    if (this.records.length === 0) {
      App.showToast('No records to export.', 'warning');
      return;
    }

    let blob, filename;
    if (format === 'json') {
      const jsonStr = JSON.stringify(this.records, null, 2);
      blob = new Blob([jsonStr], { type: 'application/json' });
      filename = `${this.activeTable}_mongodb_export.json`;
    } else {
      // CSV format
      const fields = this.schemaFields.filter(f => f !== '_id' && f !== '_syncedAt');
      const header = fields.join(',');
      const rows = this.records.map(row => {
        return fields.map(f => {
          let val = row[f];
          if (val === undefined || val === null) return '""';
          if (typeof val === 'object') val = JSON.stringify(val);
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
      });
      const csvStr = [header, ...rows].join('\n');
      blob = new Blob([csvStr], { type: 'text/csv' });
      filename = `${this.activeTable}_mongodb_export.csv`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast(`📥 Exported ${this.records.length} records as ${format.toUpperCase()}!`, 'success');
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
