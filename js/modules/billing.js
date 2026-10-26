// Module: 4. Rent Management & Invoicing System

const BillingModule = {
  activeRentStatusFilter: 'all',
  invoiceFilter: 'all',
  paymentFilter: 'all',
  selectedStartupId: null,
  selectedStartupName: null,

  render() {
    const container = document.getElementById('view-billing');
    if (!container) return;

    const role = window.store.normalizeRole(window.store.currentRole);
    let allRentRecords = window.store.getRentRecords();
    let allInvoices = window.store.getAccessibleInvoices();
    const payments = window.store.getAccessiblePayments();
    if (role === 'startup') {
      allRentRecords = allRentRecords.filter(r => r.startupId === (window.store.activeFounderId || 'STP-XYZ'));
      allInvoices = allInvoices.filter(i => i.startupId === (window.store.activeFounderId || 'STP-XYZ'));
    }

    // Unified Single Source of Truth for KPIs from Active Invoices (Excluding Voided/Cancelled)
    const activeInvoices = allInvoices.filter(i => i.status !== 'Cancelled');
    const totalRentRoll = activeInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    
    // Collected & Paid: full invoice total for Paid, or amountPaid for partial
    const totalPaid = activeInvoices.reduce((sum, i) => {
      if (i.status === 'Paid') return sum + (Number(i.total) || 0);
      return sum + (Number(i.amountPaid) || 0);
    }, 0);

    // Overdue vs Pending: Dynamically calculated based on due date vs 26 Oct 2026
    const todayEnd = new Date('2026-10-26T23:59:59').getTime();
    const overdueInvoices = activeInvoices.filter(i => {
      if (i.status === 'Paid') return false;
      const d = new Date(i.dueDate || '2026-10-05').getTime();
      return d < todayEnd;
    });
    const totalOverdue = overdueInvoices.reduce((sum, i) => {
      const bal = i.balanceDue !== undefined ? i.balanceDue : (i.total - (i.amountPaid || 0));
      return sum + Math.max(0, bal);
    }, 0);

    const pendingInvoices = activeInvoices.filter(i => {
      if (i.status === 'Paid') return false;
      const d = new Date(i.dueDate || '2026-10-05').getTime();
      return d >= todayEnd;
    });
    const totalPending = pendingInvoices.reduce((sum, i) => {
      const bal = i.balanceDue !== undefined ? i.balanceDue : (i.total - (i.amountPaid || 0));
      return sum + Math.max(0, bal);
    }, 0);

    const paidInvoices = activeInvoices.filter(i => i.status === 'Paid');

    // Filter Rent Table records
    let rentRecords = [...allRentRecords];
    if (this.activeRentStatusFilter !== 'all') {
      rentRecords = rentRecords.filter(r => {
        const inv = allInvoices.find(i => i.id === r.invoiceId || i.startupId === r.startupId);
        const resolved = this.calculateRentRecordStatus(r, inv);
        if (this.activeRentStatusFilter === 'paid') return resolved.isPaid;
        if (this.activeRentStatusFilter === 'pending') return resolved.isPending;
        if (this.activeRentStatusFilter === 'overdue') return resolved.isOverdue;
        if (this.activeRentStatusFilter === 'cancelled') return resolved.isCancelled;
        return true;
      });
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
          <div class="kpi-value" style="font-size: 22px;">₹${totalRentRoll.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="kpi-footer">
            <span>Reconciled License Invoices</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Collected & Paid</span>
            <div class="kpi-icon-wrap" style="color: var(--status-success);">💰</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-success);">₹${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="kpi-footer">
            <span class="trend-pill up">${paidInvoices.length} Settled</span>
            <span>Via Verified Gateways</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Pending Due</span>
            <div class="kpi-icon-wrap" style="color: var(--status-warning);">⏳</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-warning);">₹${totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="kpi-footer">
            <span class="trend-pill warning">${pendingInvoices.length} Pending</span>
            <span>Awaiting Due Date</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Overdue Rent</span>
            <div class="kpi-icon-wrap" style="color: var(--status-danger);">⚠️</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-danger);">₹${totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="kpi-footer">
            <span class="trend-pill" style="background: var(--status-danger-bg); color: var(--status-danger);">
              ${overdueInvoices.length} Overdue Account${overdueInvoices.length === 1 ? '' : 's'}
            </span>
            <span>21d / 8d Past Due</span>
          </div>
        </div>
      </div>

      <!-- 3-Table Financial Lifecycle Navigator Quick Bar -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="btn btn-sm btn-outline" onclick="BillingModule.scrollToSection('rent-register-table-card')" style="font-size: 11.5px; font-weight: 700; background: var(--bg-surface);">
          🏢 Monthly Rent Register (${rentRecords.length})
        </button>
        <button class="btn btn-sm btn-outline" onclick="BillingModule.scrollToSection('tax-invoices-ledger-card')" style="font-size: 11.5px; font-weight: 700; background: var(--bg-surface);">
          🧾 Tax Invoices Ledger (${allInvoices.length})
        </button>
        <button class="btn btn-sm btn-outline" onclick="BillingModule.scrollToSection('payment-history-ledger-card')" style="font-size: 11.5px; font-weight: 700; background: var(--bg-surface);">
          💳 Payment History & Receipts (${payments.length})
        </button>
      </div>

      <!-- Prominent Rent Management Table (Exact Format as requested) -->
      <div class="card" id="rent-register-table-card" style="margin-bottom: 26px;">
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
              All (${allRentRecords.length})
            </button>
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('paid')">
              Paid (${paidInvoices.length})
            </button>
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('pending')">
              Pending (${pendingInvoices.length})
            </button>
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'overdue' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('overdue')">
              Overdue (${overdueInvoices.length})
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
                <th style="white-space: nowrap; min-width: 280px;">Startup</th>
                <th style="white-space: nowrap;">Workspace</th>
                <th style="white-space: nowrap;">Rent</th>
                <th style="white-space: nowrap;">Due Date</th>
                <th style="white-space: nowrap;">Status</th>
                <th style="white-space: nowrap; text-align: right;">Actions</th>
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
                  <td style="white-space: nowrap;"><strong style="font-family: var(--font-mono); color: var(--accent-primary);">${inv.id}</strong></td>
                  <td style="white-space: nowrap;"><strong>${inv.startupName}</strong></td>
                  <td style="white-space: nowrap;">${inv.billingPeriod}</td>
                  <td style="white-space: nowrap;">
                    <div style="font-family: var(--font-mono); font-weight: 600;">${inv.dueDate}</div>
                    ${inv.status === 'Cancelled' ? `
                      <span style="font-size: 10px; color: #64748b; font-weight: 600;">Voided</span>
                    ` : (new Date(inv.dueDate) < new Date('2026-10-26T23:59:59') && inv.status !== 'Paid') ? `
                      <span style="font-size: 10.5px; color: var(--status-danger); font-weight: 700;">
                        ⚠️ ${Math.max(0, Math.floor((new Date('2026-10-26T23:59:59') - new Date(inv.dueDate)) / 86400000))}d overdue
                      </span>
                    ` : `
                      <span style="font-size: 10px; color: var(--text-muted);">Net 5 Days</span>
                    `}
                  </td>
                  <td style="font-weight: 700; font-family: var(--font-mono);">₹${Number(inv.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>
                    <span class="badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Overdue' ? 'badge-danger' : inv.status === 'Cancelled' ? 'badge-subtle' : 'badge-warning'}" style="${inv.status === 'Cancelled' ? 'background: rgba(100, 116, 139, 0.12); color: #475569; border: 1px solid rgba(100, 116, 139, 0.25); font-weight: 700;' : ''}">
                      ${inv.status === 'Cancelled' ? 'Cancelled / Voided' : inv.status}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" onclick="BillingModule.viewInvoice('${inv.id}')">
                        View Invoice
                      </button>
                      ${inv.status === 'Cancelled' ? `
                        <span style="font-size: 11px; color: #64748b; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; padding: 4px 8px; background: rgba(100, 116, 139, 0.08); border-radius: 4px;">
                          🚫 Voided
                        </span>
                      ` : inv.status !== 'Paid' ? `
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

      <!-- 💳 Reconciled Payment History & Receipts Ledger Section -->
      <div class="card" id="payment-history-ledger-card" style="margin-top: 22px;">
        <div class="card-header">
          <div>
            <div class="card-title" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span>💳 Reconciled Payment History & Receipts</span>
              ${this.selectedStartupId ? `
                <span class="badge" style="background: rgba(11, 8, 38, 0.08); color: #0B0826; border: 1px solid rgba(11, 8, 38, 0.22); font-size: 11px; font-weight: 700;">
                  Filtered: ${this.selectedStartupName}
                </span>
              ` : ''}
            </div>
            <span style="font-size: 12px; color: var(--text-muted);">
              Immutable ledger of successful settlements, partial installments, and verified tax receipts.
            </span>
          </div>

          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            ${this.selectedStartupId ? `
              <button class="btn btn-sm btn-outline" onclick="BillingModule.clearStartupSelection()" style="font-size: 11px; font-weight: 700;">
                ✕ Show All Startups
              </button>
            ` : ''}
            <button class="btn btn-sm ${this.paymentFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setPaymentFilter('all')">
              All (${this.getStartupScopedPayments(payments).length})
            </button>
            <button class="btn btn-sm ${this.paymentFilter === 'full' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setPaymentFilter('full')">
              Full Settlements
            </button>
            <button class="btn btn-sm ${this.paymentFilter === 'partial' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setPaymentFilter('partial')">
              Partial Installments
            </button>
          </div>
        </div>

        ${this.selectedStartupId ? `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; margin: 0 18px 16px; background: rgba(11, 8, 38, 0.05); border: 1px solid rgba(11, 8, 38, 0.18); border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 16px;">💳</span>
              <span style="font-size: 13px; font-weight: 700; color: #0B0826;">
                Showing complete payment history for: <u>${this.selectedStartupName}</u>
              </span>
              <span class="badge" style="background: #0B0826; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px;">
                ${this.getFilteredPayments(payments).length} Payment${this.getFilteredPayments(payments).length === 1 ? '' : 's'}
              </span>
            </div>
            <button class="btn btn-sm btn-outline" onclick="BillingModule.clearStartupSelection()" style="font-size: 11px; font-weight: 700;">
              ✕ Reset (View All Startups)
            </button>
          </div>
        ` : ''}

        <div class="table-wrapper" style="overflow-x: auto;">
          <table class="nexus-table" style="width: 100%; table-layout: auto;">
            <thead>
              <tr>
                <th style="min-width: 130px;">Payment &amp; Receipt</th>
                <th style="min-width: 160px;">Startup</th>
                <th style="min-width: 125px;">Linked Invoice</th>
                <th style="min-width: 115px;">Amount Paid</th>
                <th style="min-width: 130px;">Gateway &amp; Ref</th>
                <th style="min-width: 120px;">Date &amp; Status</th>
                <th style="min-width: 160px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.getFilteredPayments(payments).length > 0 ? this.getFilteredPayments(payments).map(p => {
                const startup = window.store.getStartupById(p.startupId);
                const emoji = startup ? startup.logoEmoji : '🚀';
                const gwClass = p.gateway === 'Razorpay' ? 'badge-info' : p.gateway === 'Stripe' ? '' : 'badge-success';
                const gwStyle = p.gateway === 'Stripe' ? 'background: rgba(99,91,255,0.12); color: #635bff; border: 1px solid rgba(99,91,255,0.25);' : '';
                return `
                  <tr style="${this.selectedStartupId ? 'background: rgba(11, 8, 38, 0.02);' : ''}">
                    <!-- 1. Payment ID & Receipt Badge -->
                    <td>
                      <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary); font-size: 13px; line-height: 1.2;">
                        ${p.id}
                      </div>
                      <div style="margin-top: 4px;">
                        <span class="badge badge-success" style="font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; padding: 2px 8px; white-space: nowrap;">
                          🧾 ${p.receiptNo || 'REC-SETTLED'}
                        </span>
                      </div>
                    </td>

                    <!-- 2. Startup Name & Sector -->
                    <td style="white-space: nowrap;">
                      <div style="display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;">
                        <span style="font-size: 20px; line-height: 1; flex-shrink: 0;">${emoji}</span>
                        <div style="white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;">
                          <strong style="font-weight: 700; color: var(--text-primary); font-size: 13px; white-space: nowrap;">
                            ${p.startupName}
                          </strong>
                          <span style="font-size: 11px; color: var(--text-muted); white-space: nowrap;">
                            • ${startup ? startup.category : (p.notes || 'Incubation Member')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- 3. Linked Invoice Column -->
                    <td>
                      ${p.invoiceId ? `
                        <button class="btn btn-outline btn-sm" onclick="BillingModule.viewInvoice('${p.invoiceId}')" style="font-family: var(--font-mono); font-weight: 700; font-size: 11px; color: #4338ca; border-color: #c7d2fe; background: rgba(99, 102, 241, 0.08); padding: 4px 9px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; cursor: pointer;" title="View Itemized Invoice #${p.invoiceId}">
                          <span>🧾</span>
                          <span>#${p.invoiceId}</span>
                        </button>
                      ` : `
                        <span style="color: var(--text-muted); font-size: 11px; font-family: var(--font-mono);">—</span>
                      `}
                    </td>

                    <!-- 4. Amount Paid & Settlement Status -->
                    <td>
                      <div style="font-family: var(--font-mono); font-weight: 800; color: #16a34a; font-size: 14px;">
                        ₹${(p.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div style="margin-top: 2px;">
                        ${p.isPartial ? `
                          <span style="font-size: 10.5px; color: #7c3aed; font-weight: 700; white-space: nowrap;">
                            🔸 Partial (₹${(p.remainingBalance || 0).toLocaleString('en-IN')} due)
                          </span>
                        ` : `
                          <span style="font-size: 10.5px; color: #16a34a; font-weight: 600; white-space: nowrap;">
                            ✓ 100% Settled
                          </span>
                        `}
                      </div>
                    </td>

                    <!-- 5. Gateway & Reference UTR -->
                    <td>
                      <div>
                        <span class="badge ${gwClass}" style="${gwStyle} font-size: 11px; font-weight: 700; white-space: nowrap;">
                          ${p.gateway || p.method}
                        </span>
                      </div>
                      <div style="margin-top: 4px;">
                        <code style="font-size: 10.5px; font-family: var(--font-mono); color: var(--text-muted); background: var(--bg-surface-elevated); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-subtle); display: inline-block; max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${p.transactionRef || 'N/A'}">
                          ${p.transactionRef || '—'}
                        </code>
                      </div>
                    </td>

                    <!-- 6. Payment Date & Status -->
                    <td>
                      <div style="line-height: 1.3;">
                        ${this.formatPaymentDate(p.paymentDate)}
                      </div>
                      <div style="margin-top: 4px;">
                        <span class="badge ${p.status === 'Successful' ? 'badge-success' : 'badge-warning'}" style="font-size: 10px; padding: 2px 7px; white-space: nowrap;">
                          ● ${p.status || 'Successful'}
                        </span>
                      </div>
                    </td>

                    <!-- 7. Actions -->
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end;">
                        <button class="btn btn-outline btn-sm" style="color: #15803d; border-color: #86efac; background: rgba(34, 197, 94, 0.08); font-size: 11.5px; font-weight: 600; padding: 5px 9px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;" onclick="PaymentsModule.viewReceipt('${p.id}')" title="View Formal Tax Receipt Voucher">
                          <span>📄</span>
                          <span>Receipt</span>
                        </button>
                        ${p.invoiceId ? `
                          <button class="btn btn-secondary btn-sm" style="font-size: 11.5px; font-weight: 600; padding: 5px 9px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;" onclick="BillingModule.viewInvoice('${p.invoiceId}')" title="View Itemized Invoice #${p.invoiceId}">
                            <span>🧾</span>
                            <span>Invoice</span>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
                    <div style="font-size: 26px; margin-bottom: 8px;">💳</div>
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">
                      No payment transactions found ${this.selectedStartupName ? `for "${this.selectedStartupName}"` : ''} under filter "${this.paymentFilter}".
                    </div>
                    <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center;">
                      ${this.selectedStartupId ? `
                        <button class="btn btn-sm btn-outline" onclick="BillingModule.clearStartupSelection()">
                          Clear Startup Filter
                        </button>
                      ` : ''}
                      ${this.paymentFilter !== 'all' ? `
                        <button class="btn btn-sm btn-secondary" onclick="BillingModule.setPaymentFilter('all')">
                          Show All Payment Types
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

  formatPaymentDate(dateStr) {
    if (!dateStr || dateStr === '—') return '—';
    try {
      const clean = dateStr.replace(' ', 'T');
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const day = d.getDate().toString().padStart(2, '0');
        const m = months[d.getMonth()];
        const y = d.getFullYear();
        let hours = d.getHours();
        const mins = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `<span style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${day} ${m} ${y}</span><br><span style="font-size: 11px; color: var(--text-muted);">${hours}:${mins} ${ampm}</span>`;
      }
    } catch (e) {}
    return dateStr;
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

  selectStartup(startupId, startupName, targetTable = 'invoices') {
    if (this.selectedStartupId === startupId && !targetTable) {
      this.selectedStartupId = null;
      this.selectedStartupName = null;
    } else {
      this.selectedStartupId = startupId;
      this.selectedStartupName = startupName;
    }
    this.render();
    if (this.selectedStartupId) {
      setTimeout(() => {
        const targetId = targetTable === 'payments' ? 'payment-history-ledger-card' : 'tax-invoices-ledger-card';
        const card = document.getElementById(targetId);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  },

  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  setPaymentFilter(filter) {
    this.paymentFilter = filter;
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

  getStartupScopedPayments(payments) {
    if (!this.selectedStartupId) return payments;
    const cleanName = (this.selectedStartupName || '').replace(/Startup\s+[A-Z]\s*\((.*?)\)/i, '$1').trim().toLowerCase();
    return payments.filter(p => {
      if (p.startupId && p.startupId === this.selectedStartupId) return true;
      if (cleanName && p.startupName && p.startupName.toLowerCase().includes(cleanName)) return true;
      return false;
    });
  },

  getFilteredPayments(payments) {
    let list = this.getStartupScopedPayments(payments);
    if (this.paymentFilter === 'full') {
      list = list.filter(p => !p.isPartial);
    } else if (this.paymentFilter === 'partial') {
      list = list.filter(p => p.isPartial);
    }
    return list;
  },

  calculateRentRecordStatus(r, inv) {
    if (r.status === 'Cancelled' || (inv && inv.status === 'Cancelled')) {
      return {
        status: 'Cancelled',
        isCancelled: true,
        daysOverdue: 0,
        badgeText: 'Voided (Fee Waived)',
        badgeClass: 'badge-subtle'
      };
    }
    if (r.status === 'Paid' || (inv && inv.status === 'Paid') || (r.balanceDue === 0 && r.paidAmount > 0)) {
      return {
        status: 'Paid',
        isPaid: true,
        daysOverdue: 0,
        badgeText: '● Paid',
        badgeClass: 'badge-success'
      };
    }
    // Check due date against today (2026-10-26)
    const dueDateStr = (inv && inv.dueDate) || r.dueDate || '2026-10-05';
    const dueTime = new Date(dueDateStr).getTime();
    const todayTime = new Date('2026-10-26T23:59:59').getTime();
    const diffDays = Math.max(0, Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24)));
    const isPastDue = diffDays > 0;

    const isPartiallyPaid = (r.paidAmount > 0 && r.balanceDue > 0) || (inv && inv.amountPaid > 0 && inv.balanceDue > 0);

    if (isPastDue) {
      return {
        status: isPartiallyPaid ? 'Partially Paid' : 'Overdue',
        isOverdue: true,
        isPartiallyPaid: isPartiallyPaid,
        daysOverdue: diffDays,
        badgeText: isPartiallyPaid ? `● Partially Paid (${diffDays}d overdue)` : `● Overdue (${diffDays}d)`,
        badgeClass: isPartiallyPaid ? 'badge-warning' : 'badge-danger'
      };
    }

    return {
      status: isPartiallyPaid ? 'Partially Paid' : 'Pending',
      isPending: true,
      isPartiallyPaid: isPartiallyPaid,
      daysOverdue: 0,
      badgeText: isPartiallyPaid ? '● Partially Paid' : '● Pending',
      badgeClass: 'badge-warning'
    };
  },

  renderRentRow(r) {
    const isSelected = this.selectedStartupId === r.startupId;
    const allInvoices = window.store.getAccessibleInvoices();
    const cleanName = (r.startupName || '').replace(/Startup\s+[A-Z]\s*\((.*?)\)/i, '$1').trim().toLowerCase();
    
    const matchedInvoice = allInvoices.find(inv => {
      if (inv.id && r.invoiceId && inv.id === r.invoiceId) return true;
      if (inv.startupId && inv.startupId === r.startupId) return true;
      if (cleanName && inv.startupName && inv.startupName.toLowerCase().includes(cleanName)) return true;
      return false;
    });

    const statusObj = this.calculateRentRecordStatus(r, matchedInvoice);
    const isCancelled = statusObj.isCancelled;
    const isPaid = statusObj.isPaid;
    const isPartiallyPaid = statusObj.isPartiallyPaid;
    const isOverdue = statusObj.isOverdue;
    const daysOverdue = statusObj.daysOverdue;

    // Resolve accurate rent amount & breakdown
    const rentAmount = r.rent !== undefined ? r.rent : (matchedInvoice ? matchedInvoice.total : 0);
    const rentDisplayStr = isCancelled ? '₹0.00' : (r.rentDisplay || `₹${Number(rentAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    const breakdown = (r.baseRent !== undefined) ? {
      base: r.baseRent,
      addons: r.addOns || 0,
      subsidy: r.subsidyDeduction || 0,
      gst: r.taxGst || 0,
      total: r.rent
    } : (r.breakdown || (matchedInvoice ? {
      base: matchedInvoice.baseRent || matchedInvoice.subtotal,
      addons: matchedInvoice.amenitiesCharges || 0,
      subsidy: matchedInvoice.subsidyDeduction || 0,
      gst: matchedInvoice.taxGst || matchedInvoice.gstAmount || 0,
      total: matchedInvoice.total
    } : null));

    // Formatted due date
    const rawDueDate = (matchedInvoice && matchedInvoice.dueDate) || r.dueDate || '2026-10-05';

    return `
      <tr style="${isSelected ? 'background: rgba(11, 8, 38, 0.05); outline: 2px solid #0B0826;' : ''} transition: all 0.2s ease;">
        <td style="white-space: nowrap;">
          <div style="cursor: pointer; display: inline-flex; align-items: center; gap: 10px; white-space: nowrap;" onclick="BillingModule.selectStartup('${r.startupId}', '${(r.startupName || '').replace(/'/g, "\\'")}', 'invoices')" title="Click to view full invoice & payment history for ${r.startupName}">
            <span style="font-size: 19px; flex-shrink: 0; line-height: 1;">${r.logoEmoji || '🚀'}</span>
            <div style="display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;">
              <strong style="color: var(--text-primary); font-size: 13.5px; white-space: nowrap; ${isSelected ? 'color: #0B0826; font-weight: 800;' : ''}">${r.startupName}</strong>
              <span class="badge" style="font-size: 10.5px; padding: 2px 8px; font-weight: 600; white-space: nowrap; color: var(--accent-secondary); background: rgba(11, 8, 38, 0.06); border: 1px solid rgba(11, 8, 38, 0.14); border-radius: 999px;">${r.category || 'Tech Startup'}</span>
              ${isSelected ? `<span class="badge" style="background: #0B0826; color: #fff; font-size: 9.5px; font-weight: 700; padding: 2px 6px; white-space: nowrap;">● Active</span>` : ''}
            </div>
          </div>
        </td>

        <td style="white-space: nowrap;">
          <span class="badge badge-info" style="font-family: var(--font-mono); font-size: 12px; padding: 4px 10px;">
            ${r.workspace}
          </span>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${r.workspaceType || 'Dedicated Space'}</div>
        </td>

        <!-- Itemized Rent Breakdown reconciling with Invoices -->
        <td style="white-space: nowrap;">
          <div style="font-family: var(--font-mono); font-size: 14.5px; font-weight: 800; color: var(--text-primary);">
            ${rentDisplayStr}
          </div>
          ${isCancelled ? `
            <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">
              ✨ Fee Waived (MCA Grant)
            </div>
          ` : breakdown ? `
            <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 3px; font-family: var(--font-mono); line-height: 1.35;">
              <span>Base: ₹${Number(breakdown.base || 0).toLocaleString('en-IN')}</span>
              ${breakdown.addons ? `<br><span style="color: var(--accent-primary);" title="Add-on Amenities & Infrastructure">+ Add-ons: ₹${Number(breakdown.addons).toLocaleString('en-IN')}</span>` : ''}
              ${breakdown.subsidy ? `<br><span style="color: var(--status-success);" title="Incubation Subsidy">- Subsidy: ₹${Number(breakdown.subsidy).toLocaleString('en-IN')}</span>` : ''}
              <br><span style="color: #6366f1;" title="18% Goods & Services Tax">+ 18% GST: ₹${Number(breakdown.gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ` : `
            <span style="font-size: 10.5px; color: var(--text-muted); display: block;">/month (inc. GST)</span>
          `}
        </td>

        <!-- Due Date dynamically calculating Overdue days -->
        <td style="white-space: nowrap;">
          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary); font-size: 13px;">${rawDueDate}</div>
          ${isCancelled ? `
            <span style="font-size: 10.5px; color: #64748b; font-weight: 600;">Waived (No Due)</span>
          ` : isPaid ? `
            <span style="font-size: 10.5px; color: var(--status-success); font-weight: 600;">✓ Settled on time</span>
          ` : isOverdue ? `
            <div style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; color: #dc2626; margin-top: 2px;">
              <span>⚠️</span>
              <span>${daysOverdue} days overdue</span>
            </div>
          ` : `
            <span style="font-size: 10.5px; color: var(--text-muted);">Net 5 Days</span>
          `}
        </td>

        <td style="white-space: nowrap;">
          ${isCancelled ? `
            <span class="badge" style="background: rgba(100, 116, 139, 0.12); color: #475569; border: 1px solid rgba(100, 116, 139, 0.25); font-weight: 700; font-size: 11.5px;">
              Voided (Fee Waived)
            </span>
          ` : isPaid ? `
            <span class="badge badge-success" style="font-weight: 700; font-size: 11.5px;">
              ● Paid
            </span>
          ` : isPartiallyPaid ? `
            <div>
              <span class="badge badge-warning" style="font-weight: 700; font-size: 11.5px; background: rgba(245, 158, 11, 0.15); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.3);">
                ● Partially Paid
              </span>
              <div style="font-size: 10.5px; font-family: var(--font-mono); color: #dc2626; font-weight: 700; margin-top: 3px;">
                ₹${Number(r.balanceDue || (matchedInvoice ? matchedInvoice.balanceDue : 0)).toLocaleString('en-IN')} due
              </div>
            </div>
          ` : isOverdue ? `
            <span class="badge badge-danger" style="font-weight: 700; font-size: 11.5px;">
              ● Overdue (${daysOverdue}d)
            </span>
          ` : `
            <span class="badge badge-warning" style="font-weight: 700; font-size: 11.5px;">
              ● Pending
            </span>
          `}
        </td>

        <td style="white-space: nowrap; text-align: right;">
          <div style="display: inline-flex; gap: 6px; align-items: center; white-space: nowrap;">
            <!-- Primary Action: Settle / Receipt / Suppressed for Cancelled -->
            ${isCancelled ? `
              <span class="badge" style="background: rgba(100, 116, 139, 0.08); color: #64748b; font-size: 11px; padding: 4px 8px; border: 1px solid rgba(100, 116, 139, 0.2);">
                🚫 No Payment Due
              </span>
            ` : isPaid ? `
              <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; color: var(--status-success); border-color: rgba(34, 197, 94, 0.4); font-weight: 600; white-space: nowrap;" onclick="BillingModule.handleRentReceiptClick('${r.id}')" title="View Official Payment Receipt">
                📄 Receipt
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 12px; font-weight: 700; white-space: nowrap;" onclick="BillingModule.handleRentPayClick('${r.id}')" title="Process Rent Payment">
                💳 Pay Now
              </button>
            `}

            <!-- View Itemized Invoice -->
            <button class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 4px 10px; font-weight: 600; white-space: nowrap;" onclick="BillingModule.handleRentInvoiceClick('${r.id}')" title="View Itemized GST Invoice">
              🧾 Invoice
            </button>

            <!-- Complete History Dossier -->
            <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; color: #8b5cf6; border-color: rgba(139,92,246,0.35); font-weight: 600; white-space: nowrap;" onclick="BillingModule.openStartupPaymentHistoryModal('${r.startupId}')" title="View Complete Ledger Dossier for ${r.startupName}">
              📊 Dossier
            </button>

            <!-- 7-Stage Lifecycle Trace -->
            <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 9px; color: var(--text-muted); border-color: var(--border-medium); font-weight: 600; white-space: nowrap;" onclick="BillingModule.openRentLifecycleTrace('${r.id}')" title="Trace 7-Stage Rent Journey">
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

    if (rent.status === 'Cancelled' || rent.balanceDue === 0) {
      if (typeof App !== 'undefined') App.showToast('This rent agreement is cancelled or has no balance due.', 'info');
      return;
    }

    if (rent.invoiceId) {
      const inv = window.store.getInvoiceById(rent.invoiceId);
      if (inv && inv.status === 'Cancelled') {
        if (typeof App !== 'undefined') App.showToast('This invoice is cancelled / voided. No payment required.', 'warning');
        return;
      }
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

  openStartupPaymentHistoryModal(startupId) {
    if (typeof PaymentsModule !== 'undefined' && PaymentsModule.openStartupPaymentHistoryModal) {
      PaymentsModule.openStartupPaymentHistoryModal(startupId);
    } else {
      if (window.App && window.App.switchTab) {
        window.App.switchTab('payments');
      }
    }
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
