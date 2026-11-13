// Module: 4. Rent Management & Invoicing System

const BillingModule = {
  activeTab: 'rentRegister', // 'rentRegister' | 'taxInvoices' | 'paymentHistory'
  showWorkflowGuide: false,
  activeRentStatusFilter: 'all',
  invoiceFilter: 'all',
  paymentFilter: 'all',
  selectedStartupId: null,
  selectedStartupName: null,

  render() {
    const container = document.getElementById('view-billing');
    if (!container) return;

    const role = window.store.normalizeRole(window.store.currentRole);
    const isAdmin = ['super_admin', 'incubator_admin', 'finance_admin'].includes(role);
    if (!this.activeTab || (!isAdmin && this.activeTab === 'rentRegister')) {
      this.activeTab = 'planCredits';
    }

    const myStartup = (window.store && window.store.getActiveStartup) ? window.store.getActiveStartup() : null;
    const startupId = myStartup ? myStartup.id : (window.store.activeFounderId || 'STP-XYZ');
    const allowance = (window.store && window.store.getMonthlyAllowance)
      ? window.store.getMonthlyAllowance(startupId)
      : { includedHours: 15, usedHours: 0, remainingHours: 15, remainingPlanCredits: 150, totalTopUpCredits: 0 };
    const includedHours = allowance.includedHours || 15;
    const usedHours = allowance.usedHours || 0;
    const remainingHours = Math.max(0, allowance.remainingHours !== undefined ? allowance.remainingHours : (includedHours - usedHours));
    const creditUnits = (allowance.remainingPlanCredits !== undefined ? allowance.remainingPlanCredits : Math.round(remainingHours * 10)) + (allowance.totalTopUpCredits || 0);
    const planName = (myStartup && myStartup.plan) || 'Growth Cohort';
    const planFee = (myStartup && (myStartup.monthlyRent || myStartup.planFee)) || 45000;

    let allRentRecords = window.store.getRentRecords();
    let allInvoices = window.store.getAccessibleInvoices();
    const payments = window.store.getAccessiblePayments();
    if (role === 'startup') {
      allRentRecords = allRentRecords.filter(r => r.startupId === startupId);
      allInvoices = allInvoices.filter(i => i.startupId === startupId);
    }
    const invoices = allInvoices;

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

    // Resolve each rent row against its exact linked invoice (fallback: same startup)
    const findRowInvoice = (r) => (r.invoiceId && allInvoices.find(i => i.id === r.invoiceId))
      || allInvoices.find(i => i.startupId === r.startupId);
    const rentStatusOf = (r) => this.calculateRentRecordStatus(r, findRowInvoice(r));
    const rentFilterCounts = { paid: 0, pending: 0, overdue: 0 };
    allRentRecords.forEach(r => {
      const s = rentStatusOf(r);
      if (s.isPaid) rentFilterCounts.paid++;
      else if (s.isPending) rentFilterCounts.pending++;
      else if (s.isOverdue) rentFilterCounts.overdue++;
    });

    // Filter Rent Table records
    let rentRecords = [...allRentRecords];
    if (this.activeRentStatusFilter !== 'all') {
      rentRecords = rentRecords.filter(r => {
        const resolved = rentStatusOf(r);
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
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px; margin: 0;">
            <span>💳 Billing &amp; Credits</span>
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 3px 0 0 0;">
            Manage membership plan, meeting room hours, flex credits, invoices, and payment receipts.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn btn-outline btn-sm" onclick="BillingModule.openTopUpModal('${startupId}')" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-radius: 8px;">
            <span>+</span> <span>Top Up Credits</span>
          </button>
          ${isAdmin ? `
          <button class="btn btn-primary btn-sm" onclick="BillingModule.openGenerateInvoicesModal()" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; border-radius: 8px;">
            <span>⚡</span> <span>Generate Invoices</span>
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Financial Lifecycle Real Tabs Navigator -->
      <div class="billing-tabs-nav" style="display: flex; gap: 8px; margin-bottom: 22px; border-bottom: 2px solid var(--border-subtle); padding-bottom: 10px; flex-wrap: wrap;">
        <button class="btn btn-sm ${this.activeTab === 'planCredits' ? 'btn-primary' : 'btn-outline'}" onclick="BillingModule.setActiveTab('planCredits')" style="font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 8px;">
          💳 Plan &amp; Credits
        </button>
        <button class="btn btn-sm ${this.activeTab === 'taxInvoices' ? 'btn-primary' : 'btn-outline'}" onclick="BillingModule.setActiveTab('taxInvoices')" style="font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 8px;">
          🧾 Invoices (${allInvoices.length})
        </button>
        <button class="btn btn-sm ${this.activeTab === 'paymentHistory' ? 'btn-primary' : 'btn-outline'}" onclick="BillingModule.setActiveTab('paymentHistory')" style="font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 8px;">
          💳 Payments &amp; Receipts (${payments.length})
        </button>
        ${isAdmin ? `
        <button class="btn btn-sm ${this.activeTab === 'rentRegister' ? 'btn-primary' : 'btn-outline'}" onclick="BillingModule.setActiveTab('rentRegister')" style="font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 8px;">
          🏢 Monthly Rent Register (${rentRecords.length})
        </button>
        ` : ''}
      </div>

      ${this.activeTab === 'planCredits' ? this.renderPlanCreditsTab({ myStartup, allowance, includedHours, usedHours, remainingHours, creditUnits, planName, planFee, startupId }) : ''}

      ${this.activeTab === 'rentRegister' ? `
      <!-- Prominent Rent Management Table -->
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
              Paid (${rentFilterCounts.paid})
            </button>
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('pending')">
              Pending (${rentFilterCounts.pending})
            </button>
            <button class="btn btn-sm ${this.activeRentStatusFilter === 'overdue' ? 'btn-primary' : 'btn-secondary'}" onclick="BillingModule.setRentFilter('overdue')">
              Overdue (${rentFilterCounts.overdue})
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
              ${rentRecords.length > 0 ? rentRecords.map(r => this.renderRentRow(r)).join('') : `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 32px 20px; color: var(--text-muted);">
                    <div style="font-size: 24px; margin-bottom: 6px;">🗂️</div>
                    <div style="font-weight: 700; font-size: 13.5px; color: var(--text-primary);">
                      No ${this.activeRentStatusFilter === 'all' ? '' : this.activeRentStatusFilter + ' '}rent records found.
                    </div>
                    ${this.activeRentStatusFilter !== 'all' ? `
                      <button class="btn btn-sm btn-secondary" style="margin-top: 10px;" onclick="BillingModule.setRentFilter('all')">Show All</button>
                    ` : ''}
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      ${this.activeTab === 'taxInvoices' ? `
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
              Itemized GST-ready invoices with full tax breakdown and SAC codes.
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

        <div class="table-wrapper" style="overflow-x: auto;">
          <table class="nexus-table" style="width: 100%; table-layout: auto;">
            <thead>
              <tr>
                <th style="min-width: 130px; white-space: nowrap;">Invoice #</th>
                <th style="min-width: 160px; white-space: nowrap;">Startup</th>
                <th style="min-width: 110px; white-space: nowrap;">Period</th>
                <th style="min-width: 120px; white-space: nowrap;">Due Date</th>
                <th style="min-width: 140px; white-space: nowrap;">GST Breakdown</th>
                <th style="min-width: 110px; white-space: nowrap;">Total (w/ GST)</th>
                <th style="min-width: 110px; white-space: nowrap;">Status</th>
                <th style="min-width: 160px; text-align: right; white-space: nowrap;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.getFilteredInvoices(invoices).length > 0 ? this.getFilteredInvoices(invoices).map(inv => {
                const isFounder = (window.store && (window.store.currentRole === 'founder' || window.store.currentRole === 'startup'));
                const isPaid = inv.status === 'Paid';
                const isCancelled = inv.status === 'Cancelled';
                const isOverdue = inv.status === 'Overdue' || (new Date(inv.dueDate) < new Date('2026-10-26T23:59:59') && !isPaid && !isCancelled);
                const daysOverdue = Math.max(0, Math.floor((new Date('2026-10-26T23:59:59') - new Date(inv.dueDate)) / 86400000));
                
                return `
                <tr style="${this.selectedStartupId ? 'background: rgba(11, 8, 38, 0.02);' : ''}">
                  <td style="white-space: nowrap;">
                    <strong style="font-family: var(--font-mono); color: var(--accent-primary); font-size: 13px;">${inv.id}</strong>
                    <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">SAC: 997212</div>
                  </td>
                  <td style="white-space: nowrap;">
                    <div style="font-weight: 700; color: var(--text-primary); font-size: 13px;">${inv.startupName}</div>
                    <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">${inv.clientGstin ? `GSTIN: ${inv.clientGstin}` : 'GST-Ready'}</div>
                  </td>
                  <td style="white-space: nowrap; font-size: 12px; color: var(--text-secondary);">${inv.billingPeriod}</td>
                  <td style="white-space: nowrap;">
                    <div style="font-family: var(--font-mono); font-weight: 600; font-size: 12.5px;">${inv.dueDate}</div>
                    ${isCancelled ? `
                      <span style="font-size: 10px; color: #64748b; font-weight: 600;">Voided</span>
                    ` : isOverdue ? `
                      <span style="font-size: 10.5px; color: var(--status-danger); font-weight: 700;">
                        ⚠️ ${daysOverdue}d overdue
                      </span>
                    ` : `
                      <span style="font-size: 10px; color: var(--text-muted);">Net 5 Days</span>
                    `}
                  </td>
                  <!-- Taxable & GST breakdown -->
                  <td style="white-space: nowrap;">
                    <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary);">
                      Taxable: ₹${Number(inv.taxableAmount || inv.subtotal || 0).toLocaleString('en-IN')}
                    </div>
                    <div style="font-family: var(--font-mono); font-size: 10.5px; color: #6366f1;">
                      + 18% GST: ₹${Number(inv.taxGst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <!-- Total Amount -->
                  <td style="white-space: nowrap;">
                    <div style="font-weight: 800; font-family: var(--font-mono); font-size: 13.5px; color: var(--text-primary);">
                      ₹${Number(inv.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td style="white-space: nowrap;">
                    <span class="badge ${isPaid ? 'badge-success' : isOverdue ? 'badge-danger' : isCancelled ? 'badge-subtle' : 'badge-warning'}" style="${isCancelled ? 'background: rgba(100, 116, 139, 0.12); color: #475569; border: 1px solid rgba(100, 116, 139, 0.25); font-weight: 700;' : ''}">
                      ${isCancelled ? 'Cancelled / Voided' : inv.status}
                    </span>
                  </td>
                  <!-- Single Primary Action + ⋯ Menu -->
                  <td style="white-space: nowrap; text-align: right;">
                    <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end; white-space: nowrap;">
                      ${isCancelled ? `
                        <span class="badge" style="background: rgba(100, 116, 139, 0.08); color: #64748b; font-size: 11px; padding: 4px 8px; border: 1px solid rgba(100, 116, 139, 0.2); white-space: nowrap;">
                          🚫 Voided
                        </span>
                      ` : isPaid ? `
                        <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; color: var(--accent-primary); border-color: rgba(99, 102, 241, 0.4); font-weight: 600; white-space: nowrap;" onclick="BillingModule.viewInvoice('${inv.id}')" title="View Full Tax Invoice">
                          📄 View Invoice
                        </button>
                      ` : isFounder ? `
                        <button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 12px; font-weight: 700; white-space: nowrap;" onclick="PaymentsModule.openCheckoutModal('${inv.id}')" title="Pay Full Balance Online">
                          💳 Pay Now
                        </button>
                      ` : `
                        <button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 10px; font-weight: 700; white-space: nowrap; background: #059669; border-color: #047857;" onclick="PaymentsModule.openRecordPaymentModal('${inv.id}')" title="Record Bank/Offline Payment">
                          💵 Record payment
                        </button>
                      `}

                      <!-- Compact "⋯" Action Menu -->
                      <div class="row-menu-wrapper" style="position: relative; display: inline-block;">
                        <button class="btn btn-outline btn-sm row-menu-trigger" onclick="BillingModule.toggleRowMenu(event, '${inv.id}')" style="font-size: 14px; padding: 3px 8px; line-height: 1; border-color: var(--border-medium); color: var(--text-secondary); min-width: 28px;" title="More options for Invoice #${inv.id}">
                          ⋯
                        </button>
                        <div id="row-menu-${inv.id}" class="rent-row-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; z-index: 1000; min-width: 175px; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.18); padding: 5px; text-align: left;">
                          <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.viewInvoice('${inv.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                            <span>🧾</span> <span>View Invoice</span>
                          </button>
                          <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); InvoiceModule._printExistingInvoice('${inv.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                            <span>🖨️</span> <span>Print / PDF</span>
                          </button>
                          ${!isPaid && !isCancelled ? `
                            <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); PaymentsModule.openRecordPaymentModal('${inv.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: #059669; border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                              <span>💵</span> <span>Record payment</span>
                            </button>
                            <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); PaymentsModule.openCheckoutModal('${inv.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: #4338ca; border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                              <span>💳</span> <span>Pay via Gateway</span>
                            </button>
                          ` : ''}
                          <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.openStartupPaymentHistoryModal('${inv.startupId}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                            <span>👤</span> <span>Startup profile</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              `}).join('') : `
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
      ` : ''}

      ${this.activeTab === 'paymentHistory' ? `
      <!-- 💳 Reconciled Payment History & Receipts Ledger Section -->
      <div class="card" id="payment-history-ledger-card">
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
                    <td style="white-space: nowrap; text-align: right;">
                      <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end; white-space: nowrap;">
                        <button class="btn btn-outline btn-sm" style="color: #15803d; border-color: #86efac; background: rgba(34, 197, 94, 0.08); font-size: 11px; font-weight: 600; padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;" onclick="PaymentsModule.viewReceipt('${p.id}')" title="View Formal Tax Receipt Voucher">
                          <span>📄</span>
                          <span>Receipt</span>
                        </button>

                        <!-- Compact "⋯" Action Menu -->
                        <div class="row-menu-wrapper" style="position: relative; display: inline-block;">
                          <button class="btn btn-outline btn-sm row-menu-trigger" onclick="BillingModule.toggleRowMenu(event, 'pay-${p.id}')" style="font-size: 14px; padding: 3px 8px; line-height: 1; border-color: var(--border-medium); color: var(--text-secondary); min-width: 28px;" title="More options for payment #${p.id}">
                            ⋯
                          </button>
                          <div id="row-menu-pay-${p.id}" class="rent-row-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; z-index: 1000; min-width: 175px; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.18); padding: 5px; text-align: left;">
                            <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); PaymentsModule.viewReceipt('${p.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--status-success); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                              <span>📄</span> <span>View Receipt</span>
                            </button>
                            ${p.invoiceId ? `
                              <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.viewInvoice('${p.invoiceId}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                                <span>🧾</span> <span>View Invoice</span>
                              </button>
                            ` : ''}
                            <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.openStartupPaymentHistoryModal('${p.startupId}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                              <span>👤</span> <span>Startup profile</span>
                            </button>
                          </div>
                        </div>
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
      ` : ''}
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

  setActiveTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  toggleWorkflowGuide() {
    this.showWorkflowGuide = !this.showWorkflowGuide;
    this.render();
  },

  toggleRowMenu(e, rentId) {
    if (e) e.stopPropagation();
    const menu = document.getElementById(`row-menu-${rentId}`);
    if (!menu) return;
    const isCurrentlyOpen = menu.style.display === 'block';
    this.closeAllRowMenus();
    if (!isCurrentlyOpen) {
      menu.style.display = 'block';
      const rect = menu.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 30) {
        menu.style.top = 'auto';
        menu.style.bottom = '100%';
        menu.style.marginTop = '0';
        menu.style.marginBottom = '4px';
      } else {
        menu.style.top = '100%';
        menu.style.bottom = 'auto';
        menu.style.marginTop = '4px';
        menu.style.marginBottom = '0';
      }
    }
  },

  closeAllRowMenus() {
    document.querySelectorAll('.rent-row-menu').forEach(el => {
      el.style.display = 'none';
    });
  },

  openGenerateInvoicesModal(selectedPeriod = 'November 2026') {
    const allStartups = window.store.getStartups();
    const eligibleStartups = allStartups.filter(s => s.status === 'Incubated' && s.allocatedSeats && s.allocatedSeats.length > 0);
    const existingInvoices = window.store.getInvoices().filter(inv => inv.billingPeriod === selectedPeriod && inv.status !== 'Cancelled');
    
    let totalRoll = 0;
    const candidates = eligibleStartups.map(s => {
      const calc = window.store.calculateStartupMonthlyBilling(s.id);
      const existing = existingInvoices.find(inv => inv.startupId === s.id);
      const amount = calc ? calc.total : 0;
      totalRoll += amount;
      return {
        startup: s,
        calc,
        amount,
        alreadyGenerated: existing
      };
    });

    const newCandidates = candidates.filter(c => !c.alreadyGenerated);
    const newCount = newCandidates.length;
    const totalCount = candidates.length;
    
    const parts = selectedPeriod.split(' ');
    const shortMonth = parts[0] ? parts[0].substring(0, 3) : 'Nov';
    const year = parts[1] || '2026';
    const shortPeriod = `${shortMonth} ${year}`;
    const totalLakhs = (totalRoll / 100000).toFixed(1);
    const summaryBadgeText = `${totalCount} invoices · ₹${totalLakhs}L · ${shortPeriod}`;

    const html = `
      <div class="modal-overlay active" id="modal-generate-invoices-preview">
        <div class="modal-content modal-wide" style="max-width: 780px;">
          <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">⚡</span>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 17px; font-weight: 800;">Generate Invoices Batch</h3>
                <span style="font-size: 12px; color: var(--text-muted);">Preview automated monthly billing run before confirmation</span>
              </div>
            </div>
            <button class="modal-close-btn" onclick="BillingModule.closeModal('modal-generate-invoices-preview')">&times;</button>
          </div>

          <div class="modal-body" style="padding: 20px;">
            <!-- Summary Banner with Preview Chip -->
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.22); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 18px;">
              <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent-primary); letter-spacing: 0.5px;">Batch Preview Summary</div>
                <div style="margin-top: 5px;">
                  <span class="badge" id="invoices-batch-summary-chip" style="background: #4338ca; color: #ffffff; font-size: 13.5px; font-weight: 800; padding: 6px 14px; border-radius: 999px; letter-spacing: 0.2px;">
                    ${summaryBadgeText}
                  </span>
                </div>
              </div>

              <!-- Cycle Selector -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Cycle:</label>
                <select id="generate-period-selector" onchange="BillingModule.openGenerateInvoicesModal(this.value)" style="padding: 6px 10px; font-size: 12px; font-weight: 700; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); background: var(--bg-surface); color: var(--text-primary); cursor: pointer;">
                  <option value="November 2026" ${selectedPeriod === 'November 2026' ? 'selected' : ''}>November 2026</option>
                  <option value="December 2026" ${selectedPeriod === 'December 2026' ? 'selected' : ''}>December 2026</option>
                  <option value="October 2026" ${selectedPeriod === 'October 2026' ? 'selected' : ''}>October 2026</option>
                </select>
              </div>
            </div>

            <!-- Idempotency & Duplicate Protection Callout -->
            <div style="display: flex; align-items: flex-start; gap: 10px; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 18px; font-size: 12px; color: #166534;">
              <span style="font-size: 16px; flex-shrink: 0;">🛡️</span>
              <div>
                <strong>Safe &amp; Idempotent Execution:</strong>
                Startups that already have an invoice for <u>${selectedPeriod}</u> are detected and safely skipped. Running this batch twice will never create duplicate invoices.
              </div>
            </div>

            <!-- Invoices Candidates List Table -->
            <div class="table-wrapper" style="max-height: 280px; overflow-y: auto;">
              <table class="nexus-table" style="font-size: 12.5px;">
                <thead>
                  <tr>
                    <th>Startup</th>
                    <th>Workspace</th>
                    <th>Calculated Rent</th>
                    <th style="text-align: right;">Batch Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${candidates.map(c => `
                    <tr>
                      <td style="white-space: nowrap;">
                        <div style="display: inline-flex; align-items: center; gap: 8px;">
                          <span style="font-size: 18px;">${c.startup.logoEmoji || '🚀'}</span>
                          <div>
                            <strong>${c.startup.name}</strong>
                            <div style="font-size: 11px; color: var(--text-muted);">${c.startup.category || 'Tech'}</div>
                          </div>
                        </div>
                      </td>
                      <td style="white-space: nowrap;">
                        <span class="badge badge-info" style="font-size: 11px; font-family: var(--font-mono);">
                          ${c.startup.allocatedSeats ? (c.startup.allocatedSeats[0] || 'Cabin') : 'Desk'}
                        </span>
                      </td>
                      <td style="white-space: nowrap; font-family: var(--font-mono); font-weight: 700;">
                        ₹${Number(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style="white-space: nowrap; text-align: right;">
                        ${c.alreadyGenerated ? `
                          <span class="badge badge-success" style="font-size: 11px; font-weight: 700; padding: 3px 8px;" title="Invoice ${c.alreadyGenerated.id} already exists for this cycle">
                            ✓ Already Generated (${c.alreadyGenerated.id}) · Safe Skip
                          </span>
                        ` : `
                          <span class="badge badge-info" style="font-size: 11px; font-weight: 700; padding: 3px 8px;">
                            🟢 Ready to Generate
                          </span>
                        `}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: var(--text-muted);">
              ${newCount > 0 ? `<strong>${newCount}</strong> new invoice(s) will be created.` : `All ${totalCount} invoices are already generated for this period.`}
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary" onclick="BillingModule.closeModal('modal-generate-invoices-preview')">Cancel</button>
              <button class="btn btn-primary" onclick="BillingModule.confirmGenerateInvoices('${selectedPeriod}')" ${newCount === 0 ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                ${newCount > 0 ? `⚡ Confirm & Generate (${newCount} Invoices)` : `✓ All Invoices Generated`}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = html;
  },

  confirmGenerateInvoices(period) {
    const generatedCount = window.store.generateAllMonthlyInvoices(period);
    this.closeModal('modal-generate-invoices-preview');
    if (generatedCount > 0) {
      if (typeof App !== 'undefined') {
        App.showToast(`⚡ Successfully generated ${generatedCount} invoice(s) for ${period}!`, 'success');
      }
    } else {
      if (typeof App !== 'undefined') {
        App.showToast(`All startups already have invoices for ${period}. Safely skipped (0 duplicates).`, 'info');
      }
    }
    this.activeTab = 'taxInvoices';
    this.render();
    if (typeof DashboardModule !== 'undefined' && DashboardModule.render) {
      DashboardModule.render();
    }
  },

  // Backward-compatible triggers
  openBatchGeneratorForAll() {
    this.openGenerateInvoicesModal('November 2026');
  },

  handleBatchGenerate() {
    this.openGenerateInvoicesModal('October 2026');
  },

  selectStartup(startupId, startupName, targetTable = 'invoices') {
    if (this.selectedStartupId === startupId && !targetTable) {
      this.selectedStartupId = null;
      this.selectedStartupName = null;
    } else {
      this.selectedStartupId = startupId;
      this.selectedStartupName = startupName;
    }
    this.activeTab = targetTable === 'payments' ? 'paymentHistory' : 'taxInvoices';
    this.render();
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
    const isFounder = (window.store && (window.store.currentRole === 'founder' || window.store.currentRole === 'startup'));
    const allInvoices = window.store.getAccessibleInvoices();
    const cleanName = (r.startupName || '').replace(/Startup\s+[A-Z]\s*\((.*?)\)/i, '$1').trim().toLowerCase();
    
    const matchedInvoice = (r.invoiceId && allInvoices.find(inv => inv.id === r.invoiceId)) || allInvoices.find(inv => {
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
              ✨ Fee Waived (Incubation Grant)
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
          <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end; white-space: nowrap;">
            <!-- Primary Action per row -->
            ${isCancelled ? `
              <span class="badge" style="background: rgba(100, 116, 139, 0.08); color: #64748b; font-size: 11px; padding: 4px 8px; border: 1px solid rgba(100, 116, 139, 0.2); white-space: nowrap;">
                🚫 Voided
              </span>
            ` : isPaid ? `
              <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; color: var(--status-success); border-color: rgba(34, 197, 94, 0.4); font-weight: 600; white-space: nowrap;" onclick="BillingModule.handleRentReceiptClick('${r.id}')" title="View Official Payment Receipt">
                📄 Receipt
              </button>
            ` : isFounder ? `
              <button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 12px; font-weight: 700; white-space: nowrap;" onclick="BillingModule.handleRentPayClick('${r.id}')" title="Pay Full Rent Online">
                💳 Pay Now
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 10px; font-weight: 700; white-space: nowrap; background: #059669; border-color: #047857;" onclick="BillingModule.handleRentRecordPaymentClick('${r.id}')" title="Record Bank/Offline Payment">
                💵 Record payment
              </button>
            `}

            <!-- Compact "⋯" Action Menu -->
            <div class="row-menu-wrapper" style="position: relative; display: inline-block;">
              <button class="btn btn-outline btn-sm row-menu-trigger" onclick="BillingModule.toggleRowMenu(event, 'rent-${r.id}')" style="font-size: 14px; padding: 3px 8px; line-height: 1; border-color: var(--border-medium); color: var(--text-secondary); min-width: 28px;" title="More options for ${r.startupName}">
                ⋯
              </button>
              <div id="row-menu-rent-${r.id}" class="rent-row-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; z-index: 1000; min-width: 175px; background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.18); padding: 5px; text-align: left;">
                <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.handleRentInvoiceClick('${r.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                  <span>🧾</span> <span>View Invoice</span>
                </button>
                ${!isPaid && !isCancelled ? `
                  <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.handleRentRecordPaymentClick('${r.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: #059669; border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                    <span>💵</span> <span>Record payment</span>
                  </button>
                  <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.handleRentPayClick('${r.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: #4338ca; border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                    <span>💳</span> <span>Pay via Gateway</span>
                  </button>
                ` : ''}
                <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.openStartupPaymentHistoryModal('${r.startupId}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                  <span>👤</span> <span>Startup profile</span>
                </button>
                <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.openRentLifecycleTrace('${r.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--text-primary); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                  <span>📋</span> <span>Activity log</span>
                </button>
                ${isPaid ? `
                  <button class="row-menu-item" onclick="BillingModule.closeAllRowMenus(); BillingModule.handleRentReceiptClick('${r.id}')" style="width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 12px; font-weight: 600; color: var(--status-success); border: none; background: transparent; cursor: pointer; border-radius: 6px; text-align: left; transition: all 0.15s ease;">
                    <span>📄</span> <span>Receipt Voucher</span>
                  </button>
                ` : ''}
              </div>
            </div>
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
      if (res && res.success) {
        rent.invoiceId = res.invoice.id;
        window.store.save();
        PaymentsModule.openCheckoutModal(res.invoice.id);
      }
    }
  },

  handleRentRecordPaymentClick(rentId) {
    const rent = window.store.getRentRecordById(rentId);
    if (!rent) return;

    if (rent.status === 'Cancelled' || rent.balanceDue === 0) {
      if (typeof App !== 'undefined') App.showToast('This rent agreement is cancelled or already settled.', 'info');
      return;
    }

    if (rent.invoiceId) {
      const inv = window.store.getInvoiceById(rent.invoiceId);
      if (inv && inv.status === 'Cancelled') {
        if (typeof App !== 'undefined') App.showToast('This invoice is cancelled / voided. No payment required.', 'warning');
        return;
      }
      PaymentsModule.openRecordPaymentModal(rent.invoiceId);
    } else {
      const res = window.store.generateInvoice(rent.startupId, 'October 2026');
      if (res && res.success) {
        rent.invoiceId = res.invoice.id;
        window.store.save();
        PaymentsModule.openRecordPaymentModal(res.invoice.id);
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

  toggleRowMenu(event, menuKey) {
    if (event) {
      event.stopPropagation();
    }
    const targetMenu = document.getElementById(`row-menu-${menuKey}`);
    const isCurrentlyOpen = targetMenu && targetMenu.style.display === 'block';
    this.closeAllRowMenus();
    if (targetMenu && !isCurrentlyOpen) {
      targetMenu.style.display = 'block';
    }
  },

  closeAllRowMenus() {
    document.querySelectorAll('.rent-row-menu').forEach(menu => {
      menu.style.display = 'none';
    });
  },

  renderPlanCreditsTab({ myStartup, allowance, includedHours, usedHours, remainingHours, creditUnits, planName, planFee, startupId }) {
    const pctUsed = Math.min(100, Math.round((usedHours / Math.max(1, includedHours)) * 100));
    const allBookings = window.store.getMeetingRooms ? window.store.getMeetingRooms().flatMap(r => r.bookings || []) : [];
    const myBookings = allBookings.filter(b => b && (b.startupId === startupId || b.startupName === 'XYZ Technologies')).slice(0, 5);

    return `
      <!-- Top 3 Resource & Plan Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 22px;">
        
        <!-- 1. Included Booking Hours -->
        <div class="card" style="padding: 20px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Monthly Included Hours</span>
              <h3 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">${remainingHours.toFixed(1)} hrs left</h3>
            </div>
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              ⏱️
            </div>
          </div>
          <div style="background: #f1f5f9; border-radius: 999px; height: 8px; width: 100%; overflow: hidden; margin-bottom: 10px;">
            <div style="background: linear-gradient(90deg, #6366f1, #a855f7); width: ${pctUsed}%; height: 100%; border-radius: 999px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
            <span>Used: <strong>${usedHours.toFixed(1)} hrs</strong></span>
            <span>Monthly quota: <strong>${includedHours} hrs</strong></span>
          </div>
        </div>

        <!-- 2. Flexible Credit-Unit Balance -->
        <div class="card" style="padding: 20px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Flexible Credit Balance</span>
              <h3 style="font-size: 24px; font-weight: 800; color: #16a34a; margin: 4px 0 0 0;">${creditUnits} Credits</h3>
            </div>
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(34, 197, 94, 0.1); color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              💳
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">
            1 Room Hour = 10 Credits. Auto-applied for extra hours, guest amenities, or extended sessions.
          </p>
          <button class="btn btn-primary btn-sm" onclick="BillingModule.openTopUpModal('${startupId}')" style="font-size: 11.5px; font-weight: 700; padding: 6px 14px; border-radius: 6px;">
            + Top Up Credits
          </button>
        </div>

        <!-- 3. Current Membership Plan -->
        <div class="card" style="padding: 20px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Incubation Plan</span>
              <h3 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">${planName}</h3>
            </div>
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(245, 158, 11, 0.1); color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              🚀
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">
            ₹${Number(planFee).toLocaleString('en-IN')}/mo • Full incubation campus access &amp; mentor network.
          </p>
          <button class="btn btn-outline btn-sm" onclick="BillingModule.openUpgradePlanModal()" style="font-size: 11.5px; font-weight: 700; padding: 6px 14px; border-radius: 6px; color: #6366f1; border-color: rgba(99,102,241,0.4);">
            Change / Upgrade Plan ➔
          </button>
        </div>
      </div>

      <!-- Distinction Explainer Callout -->
      <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; display: flex; gap: 12px; align-items: flex-start;">
        <span style="font-size: 20px;">💡</span>
        <div style="font-size: 12.5px; color: #334155; line-height: 1.5;">
          <strong>Understanding Meeting Hours vs. Credit Units:</strong>
          <span style="display: block; margin-top: 4px;">
            • <strong>Included Meeting Hours (${includedHours} hrs)</strong>: Reset monthly on the 1st. 1 hour entitles your team to 60 minutes in any standard conference or huddle room with zero extra billing.
          </span>
          <span style="display: block; margin-top: 2px;">
            • <strong>Credit Units (${creditUnits} Credits)</strong>: Stored balance where 10 Credits = 1 additional room hour. Credits never expire and cover overages, weekend bookings, and VIP boardroom hospitality.
          </span>
        </div>
      </div>

      <!-- Recent Usage & Deductions History -->
      <div class="card" style="padding: 20px; border-radius: 14px; border: 1px solid var(--border-subtle); background: var(--bg-surface); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">Recent Meeting Hours &amp; Credits Consumption</h4>
          <button class="btn btn-sm btn-outline" onclick="App.switchTab('bookings')" style="font-size: 11.5px; font-weight: 700;">
            View All Reservations ➔
          </button>
        </div>
        ${myBookings.length === 0 ? `
          <div style="text-align: center; padding: 24px; color: #64748b; font-size: 13px;">No recent room deductions recorded this month.</div>
        ` : `
          <div style="overflow-x: auto;">
            <table class="nexus-table" style="width: 100%; font-size: 12.5px;">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date &amp; Time</th>
                  <th>Room</th>
                  <th>Duration</th>
                  <th>Credits Debited</th>
                </tr>
              </thead>
              <tbody>
                ${myBookings.map(b => {
                  const dur = (window.MeetingRoomsModule && window.MeetingRoomsModule.calculateBookingDuration)
                    ? window.MeetingRoomsModule.calculateBookingDuration(b.startTime, b.endTime)
                    : 1;
                  return `
                    <tr>
                      <td style="font-weight: 700; color: #0f172a;">${b.title || b.purpose || 'Session'}</td>
                      <td>${b.date} • ${b.startTime}–${b.endTime}</td>
                      <td>${b.roomName || 'Meeting Room'}</td>
                      <td>${dur.toFixed(1)} hrs</td>
                      <td><span class="badge" style="background: rgba(99,102,241,0.1); color: #6366f1; font-weight: 700;">${Math.round(dur * 10)} credits</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  openTopUpModal(startupId) {
    if (window.MeetingRoomsModule && window.MeetingRoomsModule.openTopUpModal) {
      window.MeetingRoomsModule.openTopUpModal();
    } else {
      App.showToast('Select a credit top-up pack to continue.', 'info');
    }
  },

  openUpgradePlanModal() {
    const modalMount = document.getElementById('modal-mount');
    if (!modalMount) return;
    modalMount.innerHTML = `
      <div class="modal-overlay active" id="modal-upgrade-plan">
        <div class="modal-content" style="max-width: 600px; padding: 24px; border-radius: 16px;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">Upgrade Incubation Plan</h3>
            <button class="modal-close-btn" onclick="BillingModule.closeModal('modal-upgrade-plan')" style="border: none; background: transparent; font-size: 20px; cursor: pointer;">×</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Select the membership tier that suits your growth pace:</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px;">
              <div style="border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center;">
                <div style="font-weight: 800; font-size: 14px; color: #0f172a;">Starter Incubate</div>
                <div style="font-size: 18px; font-weight: 800; color: #6366f1; margin: 6px 0;">₹25,000<span style="font-size: 11px; color: #64748b;">/mo</span></div>
                <div style="font-size: 11px; color: #64748b;">8 meeting hours • 4 flex desks</div>
              </div>
              <div style="border: 2px solid #6366f1; border-radius: 10px; padding: 14px; text-align: center; background: rgba(99,102,241,0.04);">
                <span class="badge badge-primary" style="font-size: 9px; padding: 2px 6px;">CURRENT PLAN</span>
                <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-top: 4px;">Growth Cohort</div>
                <div style="font-size: 18px; font-weight: 800; color: #6366f1; margin: 6px 0;">₹45,000<span style="font-size: 11px; color: #64748b;">/mo</span></div>
                <div style="font-size: 11px; color: #64748b;">15 meeting hours • Dedicated cabin</div>
              </div>
              <div style="border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center;">
                <div style="font-weight: 800; font-size: 14px; color: #0f172a;">Scale Accelerator</div>
                <div style="font-size: 18px; font-weight: 800; color: #6366f1; margin: 6px 0;">₹80,000<span style="font-size: 11px; color: #64748b;">/mo</span></div>
                <div style="font-size: 11px; color: #64748b;">30 meeting hours • Executive wing</div>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-secondary" onclick="BillingModule.closeModal('modal-upgrade-plan')">Close</button>
            <button class="btn btn-primary" onclick="BillingModule.closeModal('modal-upgrade-plan'); App.showToast('Upgrade request submitted to Incubation Director!', 'success')">Request Upgrade ➔</button>
          </div>
        </div>
      </div>
    `;
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};

// Global click listener to close popover row menus
if (typeof window !== 'undefined' && !window.__billingMenuListenerAttached) {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.row-menu-wrapper')) {
      if (window.BillingModule && window.BillingModule.closeAllRowMenus) {
        window.BillingModule.closeAllRowMenus();
      }
    }
  });
  window.__billingMenuListenerAttached = true;
}

window.BillingModule = BillingModule;

