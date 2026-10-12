// Module: 4. Rent Management & Invoicing System

const BillingModule = {
  activeRentStatusFilter: 'all',
  invoiceFilter: 'all',
  selectedStartupId: null,
  selectedStartupName: null,

  render() {
    const container = document.getElementById('view-billing');
    if (!container) return;

    const role = window.store.normalizeRole(window.store.currentRole);
    let rentRecords = window.store.getRentRecords();
    const invoices = window.store.getAccessibleInvoices();
    if (role === 'startup') {
      rentRecords = rentRecords.filter(r => r.startupId === (window.store.activeFounderId || 'STP-XYZ'));
    }

    // Aggregate Rent Metrics
    const totalRentRoll = rentRecords.reduce((sum, r) => sum + (Number(r.rent) || 0), 0);
    const paidRecords = rentRecords.filter(r => r.status === 'Paid');
    const pendingRecords = rentRecords.filter(r => r.status === 'Pending');
    const overdueRecords = rentRecords.filter(r => r.status === 'Overdue');

    const totalPaid = paidRecords.reduce((sum, r) => sum + (Number(r.rent) || 0), 0);
    const totalPending = pendingRecords.reduce((sum, r) => sum + (Number(r.rent) || 0), 0);
    const totalOverdue = overdueRecords.reduce((sum, r) => sum + (Number(r.rent) || 0), 0);

    // Apply Filter to Rent Table
    if (this.activeRentStatusFilter !== 'all') {
      rentRecords = rentRecords.filter(r => r.status.toLowerCase() === this.activeRentStatusFilter.toLowerCase());
    }

    container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
            <span>💰 Rent Management & Invoicing</span>
            <span class="badge badge-info" style="font-size: 12px;">Stage 4 & 5 of Lifecycle</span>
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
            Automated rental operations tracking: Startup ➔ Workspace ➔ Monthly Rent ➔ Due Date ➔ Invoice ➔ Payment ➔ Receipt.
          </p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline" onclick="BillingModule.openBatchGeneratorForAll()">
            🧾 Generate All Invoices
          </button>
          <button class="btn btn-primary" onclick="BillingModule.handleBatchGenerate()">
            ⚡ Run October Invoicing Batch
          </button>
        </div>
      </div>

      <!-- 7-Stage Rent Lifecycle Journey Visualizer -->
      <div class="card" style="margin-bottom: 22px; padding: 18px 22px; background: var(--bg-surface);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
            The 7-Stage Rent & Billing Lifecycle
          </span>
          <span style="font-size: 12px; color: var(--accent-primary); font-weight: 600;">
            Zero-Leakage Financial Workflow
          </span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; overflow-x: auto; padding-bottom: 4px;">
          <div style="text-align: center; flex: 1; min-width: 90px; padding: 8px 6px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
            <div style="font-size: 16px;">👥</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">Startup</div>
            <div style="font-size: 10px; color: var(--text-muted);">Incubated Venture</div>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div style="text-align: center; flex: 1; min-width: 90px; padding: 8px 6px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
            <div style="font-size: 16px;">🏢</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">Workspace</div>
            <div style="font-size: 10px; color: var(--text-muted);">Cabin / Desk</div>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div style="text-align: center; flex: 1; min-width: 90px; padding: 8px 6px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
            <div style="font-size: 16px;">💵</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">Monthly Rent</div>
            <div style="font-size: 10px; color: var(--text-muted);">Base + Addons</div>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div style="text-align: center; flex: 1; min-width: 90px; padding: 8px 6px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
            <div style="font-size: 16px;">📅</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">Due Date</div>
            <div style="font-size: 10px; color: var(--text-muted);">5th of Month</div>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div style="text-align: center; flex: 1; min-width: 90px; padding: 8px 6px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
            <div style="font-size: 16px;">🧾</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">Invoice</div>
            <div style="font-size: 10px; color: var(--text-muted);">GST Itemized</div>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div style="text-align: center; flex: 1; min-width: 90px; padding: 8px 6px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
            <div style="font-size: 16px;">💳</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">Payment</div>
            <div style="font-size: 10px; color: var(--text-muted);">UPI / Card / Wire</div>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div style="text-align: center; flex: 1; min-width: 90px; padding: 8px 6px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
            <div style="font-size: 16px;">📄</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">Receipt</div>
            <div style="font-size: 10px; color: var(--status-success); font-weight: 600;">Reconciled ✓</div>
          </div>
        </div>
      </div>

      <!-- Financial Metrics Summary -->
      <div class="kpi-grid" style="margin-bottom: 22px;">
        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Total Monthly Rent Roll</span>
            <div class="kpi-icon-wrap" style="color: var(--accent-primary);">🏢</div>
          </div>
          <div class="kpi-value" style="font-size: 22px;">₹${totalRentRoll.toLocaleString('en-IN')}</div>
          <div class="kpi-footer">
            <span>Gross Monthly License Revenue</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Collected & Paid</span>
            <div class="kpi-icon-wrap" style="color: var(--status-success);">💰</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-success);">₹${totalPaid.toLocaleString('en-IN')}</div>
          <div class="kpi-footer">
            <span class="trend-pill up">${paidRecords.length} Settled</span>
            <span>Via Verified Gateways</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Pending Due</span>
            <div class="kpi-icon-wrap" style="color: var(--status-warning);">⏳</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-warning);">₹${totalPending.toLocaleString('en-IN')}</div>
          <div class="kpi-footer">
            <span class="trend-pill warning">${pendingRecords.length} Pending</span>
            <span>Awaiting Settlement</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Overdue Rent</span>
            <div class="kpi-icon-wrap" style="color: var(--status-danger);">⚠️</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-danger);">₹${totalOverdue.toLocaleString('en-IN')}</div>
          <div class="kpi-footer">
            <span class="trend-pill" style="background: var(--status-danger-bg); color: var(--status-danger);">
              ${overdueRecords.length} Overdue
            </span>
            <span>Follow-up Alert Active</span>
          </div>
        </div>
      </div>

      <!-- Prominent Rent Management Table (Exact Format as requested) -->
      <div class="card" style="margin-bottom: 26px;">
        <div class="card-header">
          <div>
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <span>💵 Monthly Rent Register</span>
            </div>
            <span style="font-size: 12px; color: var(--text-muted);">
              Track monthly rent status, due dates, invoices, and payments per startup.
            </span>
          </div>

        <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('all')">
              All (${window.store.getRentRecords().length})
            </button>
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('paid')">
              Paid (${paidRecords.length})
            </button>
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('pending')">
              Pending (${pendingRecords.length})
            </button>
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'overdue' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('overdue')">
              Overdue (${overdueRecords.length})
            </button>
            <button class="btn btn-sm btn-outline" onclick="BillingModule.openInvoiceGeneratorForStartup()" title="Generate invoice for a startup">
              ⚡ Generate Invoice
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="nexus-table">
            <thead>
              <tr>
                <th>Startup</th>
                <th>Workspace</th>
                <th>Rent</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rentRecords.map(r => this.renderRentRow(r)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tax Invoices Ledger Section -->
      <div class="card" id="tax-invoices-ledger-card">
        <div class="card-header">
          <div>
            <div class="card-title" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span>🧾 Formal Tax Invoices Ledger</span>
              ${this.selectedStartupId ? `
                <span class="badge" style="background: rgba(11, 8, 38, 0.08); color: #0B0826; border: 1px solid rgba(11, 8, 38, 0.22); font-size: 11px; font-weight: 700;">
                  Filtered: ${this.selectedStartupName}
                </span>
              ` : ''}
            </div>
            <span style="font-size: 12px; color: var(--text-muted);">
              Itemized GST invoices compliant with Ministry of Corporate Affairs standards.
            </span>
          </div>

          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            ${this.selectedStartupId ? `
              <button class="btn btn-sm btn-outline" onclick="BillingModule.clearStartupSelection()" style="font-size: 11px; font-weight: 700;">
                ✕ Show All Startups
              </button>
            ` : ''}
            <button class="btn btn-sm ${this.invoiceFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setInvoiceFilter('all')">
              All (${this.getStartupScopedInvoices(invoices).length})
            </button>
            <button class="btn btn-sm ${this.invoiceFilter === 'issued' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setInvoiceFilter('issued')">
              Issued
            </button>
            <button class="btn btn-sm ${this.invoiceFilter === 'overdue' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setInvoiceFilter('overdue')">
              Overdue
            </button>
            <button class="btn btn-sm ${this.invoiceFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setInvoiceFilter('paid')">
              Paid
            </button>
          </div>
        </div>

        ${this.selectedStartupId ? `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; margin: 0 18px 16px; background: rgba(11, 8, 38, 0.05); border: 1px solid rgba(11, 8, 38, 0.18); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 16px;">🔍</span>
              <span style="font-size: 13px; font-weight: 700; color: #0B0826;">
                Showing complete invoice history for: <u>${this.selectedStartupName}</u>
              </span>
              <span class="badge" style="background: #0B0826; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px;">
                ${this.getFilteredInvoices(invoices).length} Invoice${this.getFilteredInvoices(invoices).length === 1 ? '' : 's'}
              </span>
            </div>
            <button class="btn btn-sm btn-outline" onclick="BillingModule.clearStartupSelection()" style="font-size: 11px; font-weight: 700;">
              ✕ Reset (View All Startups)
            </button>
          </div>
        ` : ''}

        <div class="table-wrapper">
          <table class="nexus-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Startup Name</th>
                <th>Billing Period</th>
                <th>Due Date</th>
                <th>Total (w/ GST)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.getFilteredInvoices(invoices).length > 0 ? this.getFilteredInvoices(invoices).map(inv => `
                <tr style="${this.selectedStartupId ? 'background: rgba(11, 8, 38, 0.02);' : ''}">
                  <td><strong style="font-family: var(--font-mono); color: var(--accent-primary);">${inv.id}</strong></td>
                  <td><strong>${inv.startupName}</strong></td>
                  <td>${inv.billingPeriod}</td>
                  <td>${inv.dueDate}</td>
                  <td style="font-weight: 700; font-family: var(--font-mono);">₹${inv.total.toLocaleString('en-IN')}</td>
                  <td>
                    <span class="badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}">
                      ${inv.status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" onclick="BillingModule.viewInvoice('${inv.id}')">
                        View Invoice
                      </button>
                      ${inv.status !== 'Paid' ? `
                        <button class="btn btn-primary btn-sm" onclick="PaymentsModule.openCheckoutModal('${inv.id}')">
                          💳 Pay Now
                        </button>
                      ` : `
                        <span style="font-size: 11px; color: var(--status-success); font-weight: 600; display: inline-flex; align-items: center; gap: 3px;">
                          ✓ Settled
                        </span>
                      `}
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
                    <div style="font-size: 26px; margin-bottom: 8px;">📄</div>
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">
                      No invoices found ${this.selectedStartupName ? `for "${this.selectedStartupName}"` : ''} under status "${this.invoiceFilter}".
                    </div>
                    <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center;">
                      ${this.selectedStartupId ? `
                        <button class="btn btn-sm btn-outline" onclick="BillingModule.clearStartupSelection()">
                          Clear Startup Filter
                        </button>
                      ` : ''}
                      ${this.invoiceFilter !== 'all' ? `
                        <button class="btn btn-sm btn-secondary" onclick="BillingModule.setInvoiceFilter('all')">
                          Show All Statuses
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // Re-route to InvoiceModule for rich viewing
  viewInvoice(invoiceId) {
    if (typeof InvoiceModule !== 'undefined') {
      InvoiceModule.viewInvoice(invoiceId);
    } else {
      // Legacy fallback
      this._legacyViewInvoice(invoiceId);
    }
  },

  // Open invoice generator for a specific startup (picker)
  openInvoiceGeneratorForStartup(startupId) {
    if (startupId) {
      if (typeof InvoiceModule !== 'undefined') {
        InvoiceModule.openGenerator(startupId, 'combined');
      }
      return;
    }
    // No startupId: show startup picker
    const startups = window.store.getStartups().filter(s => s.status === 'Incubated');
    if (startups.length === 0) { App.showToast('No incubated startups to generate invoices for.', 'info'); return; }
    const html = `
      <div class="modal-overlay active" id="modal-invoice-picker">
        <div class="modal-content" style="max-width: 460px;">
          <div class="modal-header">
            <h3 class="modal-title">⚡ Generate Invoice For</h3>
            <button class="modal-close-btn" onclick="BillingModule.closeModal('modal-invoice-picker')">×</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Select the startup to generate a new detailed invoice for:</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${startups.map(s => `
                <button class="btn btn-secondary" style="justify-content: flex-start; gap: 12px; padding: 12px 16px; text-align: left;"
                  onclick="BillingModule.closeModal('modal-invoice-picker'); InvoiceModule.openGenerator('${s.id}', 'combined')">
                  <span style="font-size: 22px;">${s.logoEmoji}</span>
                  <div>
                    <div style="font-weight: 700; color: var(--text-primary);">${s.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${s.category} • ${s.allocatedSeats ? s.allocatedSeats.length : 0} seat(s)</div>
                  </div>
                </button>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="BillingModule.closeModal('modal-invoice-picker')">Cancel</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-mount').innerHTML = html;
  },

  // Open generator for all incubated startups (quick batch)
  openBatchGeneratorForAll() {
    const startups = window.store.getStartups().filter(s => s.status === 'Incubated');
    if (startups.length === 0) { App.showToast('No incubated startups found.', 'info'); return; }
    // Default to first one
    if (typeof InvoiceModule !== 'undefined') {
      InvoiceModule.openGenerator(startups[0].id, 'combined');
    }
  },

  selectStartup(startupId, startupName) {
    if (this.selectedStartupId === startupId) {
      this.selectedStartupId = null;
      this.selectedStartupName = null;
    } else {
      this.selectedStartupId = startupId;
      this.selectedStartupName = startupName;
    }
    this.render();
    if (this.selectedStartupId) {
      setTimeout(() => {
        const card = document.getElementById('tax-invoices-ledger-card');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  },

  clearStartupSelection() {
    this.selectedStartupId = null;
    this.selectedStartupName = null;
    this.render();
  },

  setRentFilter(filter) {
    this.activeRentStatusFilter = filter;
    this.render();
  },

  setInvoiceFilter(filter) {
    this.invoiceFilter = filter;
    this.render();
  },

  getStartupScopedInvoices(invoices) {
    if (!this.selectedStartupId) return invoices;
    const cleanName = (this.selectedStartupName || '').replace(/Startup\s+[A-Z]\s*\((.*?)\)/i, '$1').trim().toLowerCase();
    return invoices.filter(inv => {
      if (inv.startupId && inv.startupId === this.selectedStartupId) return true;
      if (cleanName && inv.startupName && inv.startupName.toLowerCase().includes(cleanName)) return true;
      return false;
    });
  },

  getFilteredInvoices(invoices) {
    let list = this.getStartupScopedInvoices(invoices);
    if (this.invoiceFilter && this.invoiceFilter !== 'all') {
      list = list.filter(inv => inv.status.toLowerCase() === this.invoiceFilter.toLowerCase());
    }
    return list;
  },

  renderRentRow(r) {
    const isSelected = this.selectedStartupId === r.startupId;
    const allInvoices = window.store.getAccessibleInvoices();
    const cleanName = (r.startupName || '').replace(/Startup\s+[A-Z]\s*\((.*?)\)/i, '$1').trim().toLowerCase();
    const startupInvoices = allInvoices.filter(inv => {
      if (inv.startupId && inv.startupId === r.startupId) return true;
      if (cleanName && inv.startupName && inv.startupName.toLowerCase().includes(cleanName)) return true;
      return false;
    });
    const invCount = startupInvoices.length;

    const statusBadgeClass = r.status === 'Paid' 
      ? 'badge-success' 
      : r.status === 'Overdue' 
      ? 'badge-danger' 
      : 'badge-warning';

    return `
      <tr style="${isSelected ? 'background: rgba(11, 8, 38, 0.05); outline: 2px solid #0B0826;' : ''} transition: all 0.2s ease;">
        <td>
          <div style="cursor: pointer; display: flex; align-items: center; gap: 10px;" onclick="BillingModule.selectStartup('${r.startupId}', '${(r.startupName || '').replace(/'/g, "\\'")}')" title="Click to view full invoice history for ${r.startupName}">
            <span style="font-size: 20px;">${r.logoEmoji || '🚀'}</span>
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="color: var(--text-primary); font-size: 13.5px; ${isSelected ? 'color: #0B0826; font-weight: 800;' : ''}">${r.startupName}</strong>
                ${isSelected ? `<span class="badge" style="background: #0B0826; color: #fff; font-size: 9.5px; font-weight: 700; padding: 2px 6px;">● Active</span>` : ''}
              </div>
              <div style="font-size: 11px; color: var(--accent-secondary); font-weight: 600;">${r.category || 'Tech Startup'}</div>
            </div>
          </div>
        </td>

        <td>
          <span class="badge badge-info" style="font-family: var(--font-mono); font-size: 12px; padding: 4px 10px;">
            ${r.workspace}
          </span>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${r.workspaceType || 'Dedicated Space'}</div>
        </td>

        <td>
          <strong style="font-family: var(--font-mono); font-size: 14px; color: var(--text-primary);">
            ${r.rentDisplay}
          </strong>
          <span style="font-size: 10.5px; color: var(--text-muted); display: block;">/month</span>
        </td>

        <td>
          <div style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">${r.dueDate}</div>
          <span style="font-size: 10.5px; color: var(--text-muted);">Net 5 Days</span>
        </td>

        <td>
          <span class="badge ${statusBadgeClass}" style="font-weight: 700; font-size: 12px;">
            ${r.status}
          </span>
        </td>

        <td>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <!-- Filter Invoice History -->
            <button class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 9px; font-weight: 700;" onclick="BillingModule.selectStartup('${r.startupId}', '${(r.startupName || '').replace(/'/g, "\\'")}')" title="Filter invoice ledger below for ${r.startupName}">
              📜 Invoices (${invCount})
            </button>

            <!-- View Invoice -->
            <button class="btn btn-secondary btn-sm" onclick="BillingModule.handleRentInvoiceClick('${r.id}')" title="View Itemized Invoice">
              🧾 Invoice
            </button>

            <!-- Pay Now / View Receipt -->
            ${r.status === 'Paid' ? `
              <button class="btn btn-outline btn-sm" style="color: var(--status-success); border-color: var(--status-success);" onclick="BillingModule.handleRentReceiptClick('${r.id}')">
                📄 Receipt
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="BillingModule.handleRentPayClick('${r.id}')">
                💳 Pay Now
              </button>
            `}

            <!-- 7-Stage Lifecycle Trace Modal Trigger -->
            <button class="btn btn-outline btn-sm" title="Trace 7-Stage Rent Journey" onclick="BillingModule.openRentLifecycleTrace('${r.id}')">
              🔍 Trace
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  handleRentInvoiceClick(rentId) {
    const rent = window.store.getRentRecordById(rentId);
    if (!rent) return;
    if (rent.invoiceId) {
      // Use the new InvoiceModule viewer
      if (typeof InvoiceModule !== 'undefined') {
        InvoiceModule.viewInvoice(rent.invoiceId);
      } else {
        this._legacyViewInvoice(rent.invoiceId);
      }
    } else {
      // Open the full invoice generator for this startup
      if (typeof InvoiceModule !== 'undefined') {
        InvoiceModule.generateFromRentRecord(rentId);
      } else {
        const res = window.store.generateInvoice(rent.startupId, 'October 2026');
        if (res.success) {
          rent.invoiceId = res.invoice.id;
          window.store.save();
          this._legacyViewInvoice(res.invoice.id);
        }
      }
    }
  },

  handleRentPayClick(rentId) {
    const rent = window.store.getRentRecordById(rentId);
    if (!rent) return;

    if (rent.invoiceId) {
      PaymentsModule.openCheckoutModal(rent.invoiceId);
    } else {
      const res = window.store.generateInvoice(rent.startupId, 'October 2026');
      if (res.success) {
        rent.invoiceId = res.invoice.id;
        window.store.save();
        PaymentsModule.openCheckoutModal(res.invoice.id);
      }
    }
  },

  handleRentReceiptClick(rentId) {
    const rent = window.store.getRentRecordById(rentId);
    if (!rent) return;

    const payments = window.store.getPayments();
    const pMatch = payments.find(p => p.receiptNo === rent.receiptNo || p.startupId === rent.startupId);
    if (pMatch) {
      PaymentsModule.viewReceipt(pMatch.id);
    } else {
      App.showToast(`Receipt #${rent.receiptNo || 'REC-2026-041'} settled on ${rent.paidAt || '5 Oct'}.`, 'success');
    }
  },

  // --- 7-Stage Rent Lifecycle Trace Modal ---
  openRentLifecycleTrace(rentId) {
    const r = window.store.getRentRecordById(rentId);
    if (!r) return;

    const startup = window.store.getStartupById(r.startupId);
    const invoice = r.invoiceId ? window.store.getInvoiceById(r.invoiceId) : null;

    const html = `
      <div class="modal-overlay active" id="modal-rent-trace">
        <div class="modal-content modal-wide">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">💰</span>
              <div>
                <h3 class="modal-title">Rent Management Lifecycle Trace</h3>
                <span style="font-size: 12px; color: var(--text-muted);">${r.startupName} • ${r.workspace}</span>
              </div>
            </div>
            <button class="modal-close-btn" onclick="BillingModule.closeModal('modal-rent-trace')">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Progression Stepper -->
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <!-- 1. Startup -->
              <div style="display: flex; gap: 14px; background: var(--bg-surface-elevated); padding: 14px 18px; border-radius: var(--radius-md); border-left: 4px solid var(--accent-primary);">
                <div style="font-size: 22px;">1️⃣</div>
                <div style="flex: 1;">
                  <strong style="color: var(--text-primary); font-size: 14px;">Startup Profile</strong>
                  <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 3px;">
                    <strong>${r.startupName}</strong> (${startup ? startup.category : r.category}) • Founder: <strong>${startup ? startup.founders.name : 'Founder'}</strong>
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                    Email: ${startup ? startup.founders.email : 'N/A'} • Status: <span class="badge badge-info" style="font-size: 10px;">${startup ? startup.status : 'Incubated'}</span>
                  </div>
                </div>
              </div>

              <!-- 2. Workspace -->
              <div style="display: flex; gap: 14px; background: var(--bg-surface-elevated); padding: 14px 18px; border-radius: var(--radius-md); border-left: 4px solid var(--accent-secondary);">
                <div style="font-size: 22px;">2️⃣</div>
                <div style="flex: 1;">
                  <strong style="color: var(--text-primary); font-size: 14px;">Allocated Workspace</strong>
                  <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 3px;">
                    Resource: <strong style="color: var(--accent-primary); font-family: var(--font-mono);">${r.workspace}</strong> (${r.workspaceType})
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                    Dedicated private occupancy with 24/7 keycard access & high-speed LAN.
                  </div>
                </div>
              </div>

              <!-- 3. Monthly Rent -->
              <div style="display: flex; gap: 14px; background: var(--bg-surface-elevated); padding: 14px 18px; border-radius: var(--radius-md); border-left: 4px solid var(--status-info);">
                <div style="font-size: 22px;">3️⃣</div>
                <div style="flex: 1;">
                  <strong style="color: var(--text-primary); font-size: 14px;">Monthly Rent Computation</strong>
                  <div style="font-size: 13.5px; font-weight: 800; color: var(--accent-primary); font-family: var(--font-mono); margin-top: 3px;">
                    ${r.rentDisplay} / month
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                    Calculated from base workspace tier, included utilities, and incubation subsidies.
                  </div>
                </div>
              </div>

              <!-- 4. Due Date -->
              <div style="display: flex; gap: 14px; background: var(--bg-surface-elevated); padding: 14px 18px; border-radius: var(--radius-md); border-left: 4px solid var(--status-warning);">
                <div style="font-size: 22px;">4️⃣</div>
                <div style="flex: 1;">
                  <strong style="color: var(--text-primary); font-size: 14px;">Payment Due Date</strong>
                  <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 3px;">
                    ${r.dueDate} 2026
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                    Billing cycle: 1st of every month • Payment grace terms: Net 5 days.
                  </div>
                </div>
              </div>

              <!-- 5. Invoice -->
              <div style="display: flex; gap: 14px; background: var(--bg-surface-elevated); padding: 14px 18px; border-radius: var(--radius-md); border-left: 4px solid var(--accent-primary);">
                <div style="font-size: 22px;">5️⃣</div>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: var(--text-primary); font-size: 14px;">Tax Invoice</strong>
                    <button class="btn btn-outline btn-sm" onclick="BillingModule.closeModal('modal-rent-trace'); BillingModule.handleRentInvoiceClick('${r.id}');">
                      View Formal Invoice 🧾
                    </button>
                  </div>
                  <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 3px;">
                    Invoice Ref: <code style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary);">${r.invoiceId || 'INV-2026-081'}</code>
                  </div>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                    Includes 18% GST (CGST 9% + SGST 9%) and Ministry compliance records.
                  </div>
                </div>
              </div>

              <!-- 6. Payment -->
              <div style="display: flex; gap: 14px; background: var(--bg-surface-elevated); padding: 14px 18px; border-radius: var(--radius-md); border-left: 4px solid ${r.status === 'Paid' ? 'var(--status-success)' : 'var(--status-warning)'};">
                <div style="font-size: 22px;">6️⃣</div>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: var(--text-primary); font-size: 14px;">Payment Settlement</strong>
                    <span class="badge ${r.status === 'Paid' ? 'badge-success' : r.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}">
                      ${r.status.toUpperCase()}
                    </span>
                  </div>
                  <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 3px;">
                    ${r.status === 'Paid' ? `Settled via Verified Payment Gateway on ${r.paidAt || '5 Oct 2026'}.` : `Awaiting payment collection of ${r.rentDisplay}.`}
                  </div>
                  ${r.status !== 'Paid' ? `
                    <div style="margin-top: 8px;">
                      <button class="btn btn-primary btn-sm" onclick="BillingModule.closeModal('modal-rent-trace'); BillingModule.handleRentPayClick('${r.id}');">
                        💳 Collect / Settle Payment Now
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- 7. Receipt -->
              <div style="display: flex; gap: 14px; background: var(--bg-surface-elevated); padding: 14px 18px; border-radius: var(--radius-md); border-left: 4px solid ${r.status === 'Paid' ? 'var(--status-success)' : 'var(--border-subtle)'};">
                <div style="font-size: 22px;">7️⃣</div>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: var(--text-primary); font-size: 14px;">Official Payment Receipt</strong>
                    ${r.status === 'Paid' ? `
                      <button class="btn btn-outline btn-sm" onclick="BillingModule.closeModal('modal-rent-trace'); BillingModule.handleRentReceiptClick('${r.id}');">
                        View Receipt 📄
                      </button>
                    ` : `
                      <span style="font-size: 11px; color: var(--text-muted); font-style: italic;">Generates upon payment</span>
                    `}
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">
                    Receipt No: <strong style="font-family: var(--font-mono); color: ${r.status === 'Paid' ? 'var(--status-success)' : 'var(--text-muted)'};">${r.receiptNo || 'Pending Clearance'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" onclick="BillingModule.closeModal('modal-rent-trace')">Close Trace</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  handleBatchGenerate() {
    const count = window.store.generateAllMonthlyInvoices('October 2026');
    if (count > 0) {
      App.showToast(`⚡ Generated ${count} monthly invoices for October!`, 'success');
      this.render();
      DashboardModule.render();
    } else {
      App.showToast('All active startups already have invoices generated for this cycle.', 'info');
    }
  },

  _legacyViewInvoice(invoiceId) {
    const inv = window.store.getInvoiceById(invoiceId);
    if (!inv) return;

    const hub = window.store.state.hubInfo;
    const startup = window.store.getStartupById(inv.startupId);

    const html = `
      <div class="modal-overlay active" id="modal-invoice-viewer">
        <div class="modal-content modal-wide" style="background: #ffffff; color: #0f172a; max-width: 840px;">
          <div class="modal-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🧾</span>
              <h3 style="font-size: 16px; font-weight: 800; color: #0f172a;">Official Tax Invoice: ${inv.id}</h3>
              <span class="badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}">${inv.status}</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print / Save PDF</button>
              <button class="modal-close-btn" onclick="BillingModule.closeModal('modal-invoice-viewer')">&times;</button>
            </div>
          </div>

          <div class="modal-body" style="padding: 32px;">
            <div class="invoice-view-box">
              <div class="inv-header">
                <div>
                  <div class="inv-brand-title">${hub.name}</div>
                  <div class="inv-subtext">
                    ${hub.address}<br>
                    GSTIN: <strong>${hub.gstin}</strong> | PAN: <strong>${hub.pan}</strong><br>
                    Email: ${hub.email} | Tel: ${hub.phone}
                  </div>
                </div>
                <div style="text-align: right;">
                  <h2 style="font-size: 26px; font-weight: 900; color: #4338ca; letter-spacing: -0.5px;">TAX INVOICE</h2>
                  <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 4px;">#${inv.id}</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Billing Cycle: ${inv.billingPeriod}</div>
                </div>
              </div>

              <div class="inv-meta-grid">
                <div class="inv-meta-block">
                  <h4>Billed To:</h4>
                  <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${inv.startupName}</div>
                  <div style="font-size: 12px; color: #475569; margin-top: 2px;">
                    Attn: ${startup ? startup.founders.name : 'Founder'}<br>
                    Email: ${startup ? startup.founders.email : 'billing@startup.io'}<br>
                    Category: ${startup ? startup.category || startup.sector : 'N/A'}
                  </div>
                </div>

                <div class="inv-meta-block" style="text-align: right;">
                  <h4>Invoice Details:</h4>
                  <div style="font-size: 12px; color: #475569;">
                    Invoice Date: <strong>${inv.issueDate}</strong><br>
                    Due Date: <strong>${inv.dueDate}</strong><br>
                    Payment Terms: <strong>Net 5 Days</strong><br>
                    Status: <strong style="color: ${inv.status === 'Paid' ? '#10b981' : '#f59e0b'};">${inv.status.toUpperCase()}</strong>
                  </div>
                </div>
              </div>

              <table class="inv-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Rate (₹)</th>
                    <th style="text-align: right;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${inv.lineItems.map(item => `
                    <tr>
                      <td><strong>${item.desc}</strong></td>
                      <td style="text-align: center;">${item.qty}</td>
                      <td style="text-align: right; font-family: var(--font-mono);">₹${item.rate.toLocaleString('en-IN')}</td>
                      <td style="text-align: right; font-family: var(--font-mono); font-weight: 600;">₹${item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="inv-summary-row">
                <div class="inv-totals-box">
                  <div class="inv-total-line">
                    <span style="color: #64748b;">Gross Subtotal:</span>
                    <span style="font-family: var(--font-mono); font-weight: 600;">₹${inv.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  ${inv.subsidyDeduction > 0 ? `
                    <div class="inv-total-line" style="color: #16a34a;">
                      <span>Incubation Grant Subsidy (${inv.grantSubsidyPercent}%):</span>
                      <span style="font-family: var(--font-mono);">-₹${inv.subsidyDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  ` : ''}

                  <div class="inv-total-line">
                    <span style="color: #64748b;">Taxable Value:</span>
                    <span style="font-family: var(--font-mono);">₹${inv.taxableAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div class="inv-total-line">
                    <span style="color: #64748b;">GST @ 18% (CGST 9% + SGST 9%):</span>
                    <span style="font-family: var(--font-mono);">₹${inv.taxGst.toLocaleString('en-IN')}</span>
                  </div>

                  <div class="inv-total-line grand">
                    <span>Total Amount Due:</span>
                    <span style="font-family: var(--font-mono); color: #4338ca;">₹${inv.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <!-- Payment Details & QR Code -->
              <div class="inv-qr-bank">
                <div>
                  <h4 style="font-size: 11px; text-transform: uppercase; color: #475569; margin-bottom: 4px; font-weight: 700;">
                    Bank Wire Transfer Details:
                  </h4>
                  <div>Bank: <strong>${hub.bankName}</strong></div>
                  <div>Account No: <strong>${hub.accountNumber}</strong></div>
                  <div>IFSC Code: <strong>${hub.ifsc}</strong></div>
                  <div>UPI VPA: <strong>${hub.upiId}</strong></div>
                </div>

                <div style="text-align: center;">
                  <div style="width: 100px; height: 100px; border: 2px solid #cbd5e1; border-radius: 8px; margin: 0 auto 4px; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-size: 10px; color: #64748b; font-weight: 600;">
                    [ UPI QR CODE ]
                  </div>
                  <span style="font-size: 10px; color: #94a3b8;">Scan with any UPI App</span>
                </div>
              </div>

              ${inv.status === 'Paid' ? `
                <div style="margin-top: 20px; padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 12px; color: #065f46; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong>Payment Received & Reconciled:</strong><br>
                    Ref: <code>${inv.transactionRef || 'NEXUS-RECON-OK'}</code> • Paid via ${inv.paymentMethod}
                  </div>
                  <span style="font-size: 18px;">✅</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="modal-footer" style="background: #f8fafc; border-top: 1px solid #e2e8f0;">
            <button class="btn btn-secondary" onclick="BillingModule.closeModal('modal-invoice-viewer')">Close</button>
            ${inv.status !== 'Paid' ? `
              <button class="btn btn-primary" onclick="BillingModule.closeModal('modal-invoice-viewer'); PaymentsModule.openCheckoutModal('${inv.id}')">
                Proceed to Payment (₹${inv.total.toLocaleString('en-IN')})
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
