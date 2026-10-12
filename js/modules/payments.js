// Module: 6. Payment Management — Invoice → Payment → Receipt
// Statuses Tracked: Pending | Paid | Partially Paid | Overdue | Cancelled
// Gateways: Razorpay | Stripe | UPI / BHIM | NEFT / RTGS Wire (Mock Simulator & Real Integration Hooks)

const PaymentsModule = {
  activePayMethod: 'razorpay', // 'razorpay' | 'stripe' | 'upi' | 'wire'
  activeFilter: 'all',          // 'all' | 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  searchQuery: '',

  // ─── Main View Renderer ───────────────────────────────────────────────────

  render() {
    const container = document.getElementById('view-payments');
    if (!container) return;
    
    const payments   = window.store.getAccessiblePayments();
    const invoices   = window.store.getAccessibleInvoices();
    const startups   = window.store.getAccessibleStartups();
    const gwConfig   = window.store.getGatewayConfig ? window.store.getGatewayConfig() : { activeMode: 'mock' };

    // ── Helper to resolve canonical status for each invoice ─────────────────
    const getStatus = (inv) => {
      if (inv.status === 'Cancelled') return 'Cancelled';
      if (inv.status === 'Paid') return 'Paid';
      if (inv.status === 'Partially Paid' || inv.status === 'Partial') return 'Partially Paid';
      if (inv.status === 'Overdue') return 'Overdue';
      if (inv.dueDate && new Date(inv.dueDate) < new Date('2026-10-06') && inv.status !== 'Paid') return 'Overdue';
      return 'Pending';
    };

    // ── 5 Payment Status Collections ────────────────────────────────────────
    const pendingInv   = invoices.filter(i => getStatus(i) === 'Pending');
    const paidInv      = invoices.filter(i => getStatus(i) === 'Paid');
    const partialInv   = invoices.filter(i => getStatus(i) === 'Partially Paid');
    const overdueInv   = invoices.filter(i => getStatus(i) === 'Overdue');
    const cancelledInv = invoices.filter(i => getStatus(i) === 'Cancelled');

    // ── Financial Aggregates ────────────────────────────────────────────────
    const totalCollected   = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalPendingAmt   = pendingInv.reduce((s, i) => s + (i.balanceDue !== undefined ? i.balanceDue : i.total), 0);
    const totalOverdueAmt   = overdueInv.reduce((s, i) => s + (i.balanceDue !== undefined ? i.balanceDue : i.total), 0);
    const totalPartialDue   = partialInv.reduce((s, i) => s + (i.balanceDue !== undefined ? i.balanceDue : Math.max(0, i.total - (i.amountPaid || 0))), 0);
    const totalOutstanding  = totalPendingAmt + totalOverdueAmt + totalPartialDue;

    // ── Filter invoices for ledger table ────────────────────────────────────
    let filteredInvoices = invoices.filter(inv => {
      const st = getStatus(inv);
      if (this.activeFilter === 'pending')   return st === 'Pending';
      if (this.activeFilter === 'paid')      return st === 'Paid';
      if (this.activeFilter === 'partial')   return st === 'Partially Paid';
      if (this.activeFilter === 'overdue')   return st === 'Overdue';
      if (this.activeFilter === 'cancelled') return st === 'Cancelled';
      return true; // 'all'
    });

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      filteredInvoices = filteredInvoices.filter(i =>
        i.id.toLowerCase().includes(q) ||
        (i.startupName && i.startupName.toLowerCase().includes(q)) ||
        (i.transactionRef && i.transactionRef.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <!-- ── PAGE HEADER ── -->
      <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 28px;">💳</span>
            <div>
              <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                Payment Management
                <span class="badge badge-info" style="font-size: 11px; font-weight: 700;">Stage 6 of Lifecycle</span>
                <span class="badge ${gwConfig.activeMode === 'live' ? 'badge-success' : 'badge-subtle'}" style="font-size: 10px;">
                  ${gwConfig.activeMode === 'live' ? '● Live Gateway' : '● Mock Sandbox Mode'}
                </span>
              </h2>
              <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 3px;">
                End-to-end financial settlement: <strong>Invoice → Payment → Receipt</strong> with Razorpay, Stripe, and UPI integrations.
              </p>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn btn-outline btn-sm" onclick="PaymentsModule.openGatewayConfig()">
            ⚙️ Gateway Config
          </button>
          <button class="btn btn-outline btn-sm" onclick="PaymentsModule.openQuickLifecycle()">
            🔄 Track Lifecycle
          </button>
          <button class="btn btn-primary btn-sm" onclick="PaymentsModule.openQuickPay()">
            💳 Quick Collect
          </button>
        </div>
      </div>

      <!-- ── 3-STAGE LIFECYCLE PIPELINE HERO BANNER (Invoice ↓ Payment ↓ Receipt) ── -->
      <div class="card" style="margin-bottom: 22px; padding: 18px 22px; background: var(--bg-surface); border: 1px solid var(--border-medium); box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px;">
              Core Financial Lifecycle Pipeline
            </span>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
              Invoice &nbsp;↓&nbsp; Payment &nbsp;↓&nbsp; Receipt
            </div>
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted);">
            Click any stage to filter ledger
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: 10px; align-items: center;">
          <!-- Stage 1: Invoice -->
          <div onclick="PaymentsModule.setFilter('all')"
            style="cursor: pointer; padding: 14px 16px; border-radius: var(--radius-md); background: rgba(99,102,241,0.08); border: 1.5px solid rgba(99,102,241,0.3); transition: transform 0.15s, box-shadow 0.15s;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 24px;">🧾</span>
              <span class="badge badge-info" style="font-size: 10px;">Step 1</span>
            </div>
            <div style="font-weight: 800; font-size: 14px; color: var(--text-primary); margin-top: 6px;">1. Invoice</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">GST Compliant & Itemized</div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;">
              <span style="font-size: 18px; font-weight: 900; font-family: var(--font-mono); color: #6366f1;">${invoices.length}</span>
              <span style="font-size: 11px; color: var(--text-muted);">Invoices Generated</span>
            </div>
          </div>

          <!-- Arrow 1 -->
          <div style="text-align: center; color: var(--accent-primary); font-size: 22px; font-weight: 900; user-select: none;">
            ↓
          </div>

          <!-- Stage 2: Payment -->
          <div onclick="PaymentsModule.setFilter('pending')"
            style="cursor: pointer; padding: 14px 16px; border-radius: var(--radius-md); background: rgba(14,165,233,0.08); border: 1.5px solid rgba(14,165,233,0.3); transition: transform 0.15s, box-shadow 0.15s;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 24px;">💳</span>
              <span class="badge" style="background: rgba(14,165,233,0.2); color: #0284c7; font-size: 10px;">Step 2</span>
            </div>
            <div style="font-weight: 800; font-size: 14px; color: var(--text-primary); margin-top: 6px;">2. Payment</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Razorpay • Stripe • UPI</div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;">
              <span style="font-size: 18px; font-weight: 900; font-family: var(--font-mono); color: #0284c7;">
                ${pendingInv.length + overdueInv.length + partialInv.length}
              </span>
              <span style="font-size: 11px; color: var(--text-muted);">Active Settlement Dues</span>
            </div>
          </div>

          <!-- Arrow 2 -->
          <div style="text-align: center; color: var(--status-success); font-size: 22px; font-weight: 900; user-select: none;">
            ↓
          </div>

          <!-- Stage 3: Receipt -->
          <div onclick="PaymentsModule.setFilter('paid')"
            style="cursor: pointer; padding: 14px 16px; border-radius: var(--radius-md); background: rgba(16,185,129,0.08); border: 1.5px solid rgba(16,185,129,0.3); transition: transform 0.15s, box-shadow 0.15s;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 24px;">📄</span>
              <span class="badge badge-success" style="font-size: 10px;">Step 3</span>
            </div>
            <div style="font-weight: 800; font-size: 14px; color: var(--text-primary); margin-top: 6px;">3. Receipt</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Tax Voucher & Reconciled</div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;">
              <span style="font-size: 18px; font-weight: 900; font-family: var(--font-mono); color: var(--status-success);">${payments.length}</span>
              <span style="font-size: 11px; color: var(--text-muted);">Receipts Issued</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── KPI METRICS CARDS ── -->
      <div class="kpi-grid" style="margin-bottom: 22px;">
        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Total Collected</span>
            <div class="kpi-icon-wrap" style="color: var(--status-success);">💰</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-success);">
            ₹${totalCollected.toLocaleString('en-IN')}
          </div>
          <div class="kpi-footer">
            <span class="trend-pill up">${paidInv.length} Fully Settled</span>
            <span>${payments.length} Payments</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Outstanding Dues</span>
            <div class="kpi-icon-wrap" style="color: var(--status-danger);">⏳</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: var(--status-danger);">
            ₹${totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div class="kpi-footer">
            <span class="trend-pill warning">${pendingInv.length} Pending</span>
            <span style="color: var(--status-danger); font-weight: 700;">${overdueInv.length} Overdue</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Partially Paid Balance</span>
            <div class="kpi-icon-wrap" style="color: #8b5cf6;">🔸</div>
          </div>
          <div class="kpi-value" style="font-size: 22px; color: #8b5cf6;">
            ₹${totalPartialDue.toLocaleString('en-IN')}
          </div>
          <div class="kpi-footer">
            <span class="trend-pill" style="background: rgba(139,92,246,0.15); color: #8b5cf6;">${partialInv.length} Installments Active</span>
            <span>Awaiting Remainder</span>
          </div>
        </div>

        <div class="kpi-card" style="padding: 16px;">
          <div class="kpi-header">
            <span class="kpi-title">Total Invoices</span>
            <div class="kpi-icon-wrap" style="color: var(--accent-primary);">🧾</div>
          </div>
          <div class="kpi-value" style="font-size: 22px;">${invoices.length}</div>
          <div class="kpi-footer">
            <span class="trend-pill up">${Math.round((paidInv.length / (invoices.length || 1)) * 100)}% Collection Rate</span>
            <span>${cancelledInv.length} Cancelled</span>
          </div>
        </div>
      </div>

      <!-- ── 5-STATUS PAYMENT OVERVIEW TILES ── -->
      <div class="card" style="margin-bottom: 22px;">
        <div class="card-header" style="padding: 14px 20px;">
          <div>
            <div class="card-title">📊 5 Payment Statuses Tracker</div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              Live tracking across: Pending • Paid • Partially Paid • Overdue • Cancelled
            </div>
          </div>
          <span class="badge badge-subtle">Click to Filter Ledger</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; padding: 16px 20px;">
          ${[
            { key: 'pending',   label: 'Pending',        icon: '⏳', count: pendingInv.length,   amt: totalPendingAmt, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.3)',   sub: 'Awaiting Settlement' },
            { key: 'paid',      label: 'Paid',           icon: '✅', count: paidInv.length,      amt: totalCollected,  color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.3)',  sub: '100% Reconciled' },
            { key: 'partial',   label: 'Partially Paid', icon: '🔸', count: partialInv.length,   amt: totalPartialDue, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.3)',  sub: 'Installments Active' },
            { key: 'overdue',   label: 'Overdue',        icon: '🔴', count: overdueInv.length,   amt: totalOverdueAmt, color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   sub: 'Action Required' },
            { key: 'cancelled', label: 'Cancelled',      icon: '❌', count: cancelledInv.length, amt: 0,               color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.3)', sub: 'Voided / Amended' }
          ].map(s => {
            const isSelected = this.activeFilter === s.key;
            return `
              <div onclick="PaymentsModule.setFilter('${s.key}')"
                style="cursor: pointer; text-align: center; padding: 14px 10px; border-radius: var(--radius-md); background: ${s.bg}; border: 2px solid ${isSelected ? s.color : s.border}; transform: ${isSelected ? 'translateY(-2px)' : 'none'}; box-shadow: ${isSelected ? `0 4px 14px ${s.border}` : 'none'}; transition: all 0.18s;">
                <div style="font-size: 22px;">${s.icon}</div>
                <div style="font-size: 20px; font-weight: 900; color: ${s.color}; font-family: var(--font-mono); margin-top: 4px;">
                  ${s.count}
                </div>
                <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 3px;">
                  ${s.label}
                </div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                  ${s.sub}
                </div>
                ${s.amt > 0 ? `
                  <div style="font-size: 10.5px; font-family: var(--font-mono); font-weight: 700; color: ${s.color}; margin-top: 6px;">
                    ₹${Math.round(s.amt).toLocaleString('en-IN')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- ── URGENT ACTION / SETTLEMENT DESK (Overdue, Pending, Partial) ── -->
      ${(pendingInv.length + overdueInv.length + partialInv.length) > 0 ? `
        <div class="card" style="margin-bottom: 22px; border-left: 4px solid var(--status-warning);">
          <div class="card-header" style="padding: 14px 20px;">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <span>⚡ Fast Settlement Desk — Outstanding Invoices</span>
              <span class="badge badge-warning">${pendingInv.length + overdueInv.length + partialInv.length} Actionable</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary btn-sm" onclick="PaymentsModule.openBulkSettle()">
                ⚡ Bulk Settle All Dues
              </button>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="nexus-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Startup</th>
                  <th>Due Date</th>
                  <th>Invoice Total</th>
                  <th>Paid So Far</th>
                  <th>Balance Due</th>
                  <th>Payment Status</th>
                  <th style="text-align: right;">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                ${[...overdueInv, ...partialInv, ...pendingInv].map(inv => {
                  const status = getStatus(inv);
                  const invPayments = payments.filter(p => p.invoiceId === inv.id);
                  const paidSoFar = invPayments.reduce((s, p) => s + (p.amount || 0), 0);
                  const balanceDue = Math.max(0, inv.total - paidSoFar);
                  const daysOverdue = inv.dueDate ? Math.floor((new Date('2026-10-06') - new Date(inv.dueDate)) / 86400000) : 0;
                  const pctPaid = Math.round((paidSoFar / inv.total) * 100);

                  return `
                    <tr>
                      <td>
                        <strong style="font-family: var(--font-mono); color: var(--accent-primary); cursor: pointer;"
                          onclick="PaymentsModule.openLifecycleModal('${inv.id}')" title="Click to track lifecycle">
                          ${inv.id} 🔍
                        </strong>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 18px;">${(window.store.getStartupById(inv.startupId) || {}).logoEmoji || '🚀'}</span>
                          <div>
                            <strong>${inv.startupName}</strong>
                            <div style="font-size: 11px; color: var(--text-muted);">${inv.billingPeriod || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style="font-weight: 600; color: ${status === 'Overdue' ? 'var(--status-danger)' : 'var(--text-primary)'};">
                          ${inv.dueDate || '—'}
                        </div>
                        ${daysOverdue > 0 && status === 'Overdue' ? `
                          <div style="font-size: 10px; color: var(--status-danger); font-weight: 700;">
                            ⚠️ ${daysOverdue} days overdue
                          </div>
                        ` : ''}
                      </td>
                      <td style="font-family: var(--font-mono); font-weight: 600;">
                        ₹${inv.total.toLocaleString('en-IN')}
                      </td>
                      <td style="font-family: var(--font-mono); color: var(--status-success);">
                        ${paidSoFar > 0 ? `₹${paidSoFar.toLocaleString('en-IN')} <span style="font-size: 10px; color: var(--text-muted);">(${pctPaid}%)</span>` : '—'}
                      </td>
                      <td>
                        <strong style="font-family: var(--font-mono); color: ${status === 'Overdue' ? 'var(--status-danger)' : 'var(--accent-primary)'};">
                          ₹${balanceDue.toLocaleString('en-IN')}
                        </strong>
                      </td>
                      <td>
                        ${this._renderStatusBadge(status)}
                      </td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 5px;">
                          <button class="btn btn-primary btn-sm" onclick="PaymentsModule.openCheckoutModal('${inv.id}')" title="Full payment">
                            💳 Pay Full
                          </button>
                          <button class="btn btn-outline btn-sm" onclick="PaymentsModule.openPartialPayment('${inv.id}')" title="Partial installment payment">
                            🔸 Partial
                          </button>
                          <button class="btn btn-secondary btn-sm" onclick="PaymentsModule.openLifecycleModal('${inv.id}')" title="View 3-stage lifecycle">
                            🔄 Track
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- ── PAYMENT & RECEIPT LEDGER TAB TABLE ── -->
      <div class="card" style="margin-bottom: 22px;">
        <div class="card-header" style="padding: 14px 20px; flex-wrap: wrap; gap: 10px;">
          <div>
            <div class="card-title">📒 Comprehensive Payment & Receipt Ledger</div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              Filter by status or track full 3-step lifecycle: Invoice → Payment → Receipt
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <!-- Live Search -->
            <input type="text" placeholder="🔍 Search startup or invoice..."
              value="${this.searchQuery}"
              oninput="PaymentsModule.handleSearch(this.value)"
              style="padding: 6px 12px; font-size: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); background: var(--bg-surface-elevated); color: var(--text-primary); width: 190px;">

            <!-- Status Filter Tabs -->
            <div style="display: flex; gap: 4px; background: var(--bg-surface-elevated); padding: 3px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              ${[
                { id: 'all',       label: 'All' },
                { id: 'pending',   label: 'Pending' },
                { id: 'paid',      label: 'Paid' },
                { id: 'partial',   label: 'Partial' },
                { id: 'overdue',   label: 'Overdue' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map(f => `
                <button class="btn btn-sm ${this.activeFilter === f.id ? 'btn-primary' : 'btn-secondary'}"
                  style="padding: 4px 10px; font-size: 11px; border: none;"
                  onclick="PaymentsModule.setFilter('${f.id}')">
                  ${f.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="nexus-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Startup Name</th>
                <th>Billing Period</th>
                <th>Grand Total</th>
                <th>Payment Status</th>
                <th>Gateway & Mode</th>
                <th>Transaction Ref / UTR</th>
                <th>Settlement Date</th>
                <th style="text-align: right;">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
                const status = getStatus(inv);
                const invPayments = payments.filter(p => p.invoiceId === inv.id);
                const matchPayment = invPayments[0] || null;
                const startup = window.store.getStartupById(inv.startupId);
                const paidSoFar = invPayments.reduce((s, p) => s + (p.amount || 0), 0);
                const balanceDue = Math.max(0, inv.total - paidSoFar);

                return `
                  <tr>
                    <td>
                      <strong style="font-family: var(--font-mono); color: var(--accent-primary); cursor: pointer;"
                        onclick="PaymentsModule.openLifecycleModal('${inv.id}')">
                        ${inv.id}
                      </strong>
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">${startup ? startup.logoEmoji : '🚀'}</span>
                        <div>
                          <strong style="font-size: 13px;">${inv.startupName}</strong>
                          <div style="font-size: 10.5px; color: var(--accent-secondary);">${startup ? startup.category : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted);">${inv.billingPeriod || '—'}</td>
                    <td>
                      <div style="font-family: var(--font-mono); font-weight: 700;">₹${inv.total.toLocaleString('en-IN')}</div>
                      ${paidSoFar > 0 && status !== 'Paid' ? `
                        <div style="font-size: 10px; color: var(--status-success); font-family: var(--font-mono);">
                          ₹${paidSoFar.toLocaleString('en-IN')} paid
                        </div>
                      ` : ''}
                    </td>
                    <td>
                      ${this._renderStatusBadge(status)}
                    </td>
                    <td>
                      ${matchPayment ? `
                        <span class="badge ${matchPayment.gateway === 'Razorpay' ? 'badge-info' : matchPayment.gateway === 'Stripe' ? '' : 'badge-success'}"
                          style="${matchPayment.gateway === 'Stripe' ? 'background: rgba(99,91,255,0.15); color: #635bff;' : ''} font-size: 10.5px;">
                          ${matchPayment.gateway || matchPayment.method}
                        </span>
                      ` : '<span style="color: var(--text-muted); font-size: 11px;">Awaiting</span>'}
                    </td>
                    <td>
                      ${matchPayment ? `
                        <code style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted);">
                          ${matchPayment.transactionRef}
                        </code>
                      ` : '<span style="color: var(--text-muted); font-size: 11px;">—</span>'}
                    </td>
                    <td style="font-size: 11.5px; color: var(--text-muted);">
                      ${matchPayment ? (matchPayment.paymentDate || '—') : '—'}
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 4px;">
                        <!-- Track Lifecycle button -->
                        <button class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 4px 8px;"
                          onclick="PaymentsModule.openLifecycleModal('${inv.id}')" title="Track 3-stage lifecycle">
                          🔄 Track
                        </button>

                        ${status === 'Paid' && matchPayment ? `
                          <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px; color: var(--status-success); border-color: var(--status-success);"
                            onclick="PaymentsModule.viewReceipt('${matchPayment.id}')" title="View Reconciled Receipt">
                            📄 Receipt
                          </button>
                        ` : ''}

                        ${status === 'Partially Paid' ? `
                          <button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 8px;"
                            onclick="PaymentsModule.openCheckoutModal('${inv.id}')" title="Settle remaining balance">
                            💳 Settle Balance
                          </button>
                          ${matchPayment ? `
                            <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px;"
                              onclick="PaymentsModule.viewReceipt('${matchPayment.id}')" title="View latest installment receipt">
                              📄 Receipt
                            </button>
                          ` : ''}
                        ` : ''}

                        ${(status === 'Pending' || status === 'Overdue') ? `
                          <button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 8px;"
                            onclick="PaymentsModule.openCheckoutModal('${inv.id}')">
                            💳 Pay
                          </button>
                          <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px;"
                            onclick="PaymentsModule.openPartialPayment('${inv.id}')">
                            🔸 Partial
                          </button>
                          <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 7px; color: var(--status-danger); border-color: var(--status-danger);"
                            onclick="PaymentsModule.promptCancelInvoice('${inv.id}')" title="Cancel Invoice">
                            ✕
                          </button>
                        ` : ''}

                        ${status === 'Cancelled' ? `
                          <button class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 4px 8px; opacity: 0.7;"
                            onclick="PaymentsModule.openLifecycleModal('${inv.id}')">
                            Audit Trail
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
                    No ${this.activeFilter !== 'all' ? this.activeFilter : ''} invoices found matching current criteria.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── GATEWAY INTEGRATION HUB & SDK PREVIEW ── -->
      <div class="card">
        <div class="card-header" style="padding: 14px 20px;">
          <div>
            <div class="card-title">🔌 Payment Gateway Integration Hub</div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              Production Gateway SDK Connectors • Webhook Handlers • Portfolio Mock Mode
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="PaymentsModule.openGatewayConfig()">
            ⚙️ Configure Gateway Keys
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 20px;">
          <!-- Gateway 1: Razorpay -->
          <div style="padding: 18px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #3395ff;"></div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 26px;">💙</span>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Razorpay</div>
                  <span class="badge badge-info" style="font-size: 10px;">India Primary Gateway</span>
                </div>
              </div>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 10px;">
              UPI Autopay, Corporate Credit Cards, NetBanking (60+ banks), Instant Webhooks & MCA GST Invoicing.
            </p>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;">
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #3395ff;">✓</span> Key ID: <code style="font-size: 10.5px;">rzp_test_NEXUS2026Oct</code>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #3395ff;">✓</span> Webhook: <code style="font-size: 10.5px;">/api/webhooks/razorpay</code>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #3395ff;">✓</span> Auto-reconciles UTR instantly
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width: 100%; border-color: #3395ff; color: #3395ff;"
              onclick="PaymentsModule.openGatewayConfig('Razorpay')">
              💙 Configure Razorpay Keys
            </button>
          </div>

          <!-- Gateway 2: Stripe -->
          <div style="padding: 18px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #635bff;"></div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 26px;">🟣</span>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Stripe</div>
                  <span class="badge" style="background: rgba(99,91,255,0.15); color: #635bff; font-size: 10px;">Global Cards & ACH</span>
                </div>
              </div>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 10px;">
              Multi-currency checkout for international venture clients (USD / EUR / INR), Stripe Elements & 3D Secure.
            </p>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;">
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #635bff;">✓</span> Publishable: <code style="font-size: 10.5px;">pk_test_51Nx...LIVE</code>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #635bff;">✓</span> Webhook: <code style="font-size: 10.5px;">/api/webhooks/stripe</code>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #635bff;">✓</span> Stripe PaymentIntent API Hook
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width: 100%; border-color: #635bff; color: #635bff;"
              onclick="PaymentsModule.openGatewayConfig('Stripe')">
              🟣 Configure Stripe Keys
            </button>
          </div>

          <!-- Gateway 3: UPI / BHIM -->
          <div style="padding: 18px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #f97316;"></div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 26px;">📱</span>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: var(--text-primary);">UPI / QR</div>
                  <span class="badge badge-success" style="font-size: 10px;">Instant Settlement</span>
                </div>
              </div>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 10px;">
              Native zero-MDR Indian payment infrastructure. Dynamic QR, GPay / PhonePe / Paytm deep-link intents.
            </p>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;">
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #f97316;">✓</span> VPA: <code style="font-size: 10.5px;">nexusincubation@icici</code>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #f97316;">✓</span> Merchant ID: <code style="font-size: 10.5px;">NEXUS_MID_20261042</code>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="color: #f97316;">✓</span> 15-Second Instant Settlement
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width: 100%; border-color: #f97316; color: #f97316;"
              onclick="PaymentsModule.openGatewayConfig('UPI / BHIM')">
              📱 Configure UPI VPA
            </button>
          </div>
        </div>
      </div>
    `;
  },

  setFilter(filter) {
    this.activeFilter = filter;
    this.render();
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render();
  },

  _renderStatusBadge(status) {
    switch (status) {
      case 'Paid':
        return `<span class="badge badge-success">✅ Paid</span>`;
      case 'Partially Paid':
        return `<span class="badge" style="background: rgba(139,92,246,0.15); color: #8b5cf6;">🔸 Partially Paid</span>`;
      case 'Overdue':
        return `<span class="badge badge-danger">🔴 Overdue</span>`;
      case 'Cancelled':
        return `<span class="badge" style="background: rgba(100,116,139,0.15); color: #64748b;">❌ Cancelled</span>`;
      case 'Pending':
      default:
        return `<span class="badge badge-warning">⏳ Pending</span>`;
    }
  },

  // ─── Interactive 3-Stage Lifecycle Inspector Modal (Invoice ↓ Payment ↓ Receipt) ──

  openLifecycleModal(invoiceId) {
    const lifecycle = window.store.getInvoiceLifecycle ? window.store.getInvoiceLifecycle(invoiceId) : null;
    if (!lifecycle || !lifecycle.invoice) {
      App.showToast('Invoice details not found.', 'danger');
      return;
    }

    const inv = lifecycle.invoice;
    const payments = lifecycle.payments || [];
    const totalPaid = lifecycle.totalPaid || 0;
    const balance = lifecycle.balance || 0;
    const currentStatus = lifecycle.status || inv.status;
    const pctPaid = Math.min(100, Math.round((totalPaid / inv.total) * 100));

    const html = `
      <div class="modal-overlay active" id="modal-lifecycle">
        <div class="modal-content modal-wide" style="max-width: 780px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #03003a, #0c076e); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                🔄
              </div>
              <div>
                <h3 class="modal-title">Financial Lifecycle Journey</h3>
                <span style="font-size: 12px; color: var(--text-muted);">
                  Invoice <strong>${inv.id}</strong> • ${inv.startupName} • Status: ${this._renderStatusBadge(currentStatus)}
                </span>
              </div>
            </div>
            <button class="modal-close-btn" onclick="PaymentsModule.closeModal('modal-lifecycle')">×</button>
          </div>

          <div class="modal-body" style="padding: 24px;">
            <!-- 3-STAGE STEPPER INDICATOR -->
            <div style="display: flex; align-items: center; justify-content: space-between; position: relative; margin-bottom: 28px; padding: 0 10px;">
              <div style="position: absolute; top: 20px; left: 60px; right: 60px; height: 3px; background: var(--border-medium); z-index: 1;"></div>
              <div style="position: absolute; top: 20px; left: 60px; width: ${lifecycle.stage === 3 ? '85%' : lifecycle.stage === 2 ? '42%' : '0%'}; height: 3px; background: var(--status-success); z-index: 2; transition: width 0.3s;"></div>

              <!-- Step 1: Invoice -->
              <div style="text-align: center; position: relative; z-index: 3;">
                <div style="width: 42px; height: 42px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; margin: 0 auto; box-shadow: 0 0 0 4px var(--bg-surface);">
                  🧾
                </div>
                <div style="font-weight: 800; font-size: 13px; color: var(--text-primary); margin-top: 6px;">1. Invoice</div>
                <span class="badge badge-success" style="font-size: 9.5px; margin-top: 2px;">Generated</span>
              </div>

              <!-- Step 2: Payment -->
              <div style="text-align: center; position: relative; z-index: 3;">
                <div style="width: 42px; height: 42px; border-radius: 50%; background: ${lifecycle.stage >= 2 ? (currentStatus === 'Paid' ? '#10b981' : '#f59e0b') : '#94a3b8'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; margin: 0 auto; box-shadow: 0 0 0 4px var(--bg-surface);">
                  💳
                </div>
                <div style="font-weight: 800; font-size: 13px; color: var(--text-primary); margin-top: 6px;">2. Payment</div>
                <span class="badge ${currentStatus === 'Paid' ? 'badge-success' : currentStatus === 'Partially Paid' ? '' : currentStatus === 'Overdue' ? 'badge-danger' : currentStatus === 'Cancelled' ? '' : 'badge-warning'}"
                  style="${currentStatus === 'Partially Paid' ? 'background: rgba(139,92,246,0.15); color: #8b5cf6;' : ''} font-size: 9.5px; margin-top: 2px;">
                  ${currentStatus}
                </span>
              </div>

              <!-- Step 3: Receipt -->
              <div style="text-align: center; position: relative; z-index: 3;">
                <div style="width: 42px; height: 42px; border-radius: 50%; background: ${lifecycle.stage === 3 ? '#10b981' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; margin: 0 auto; box-shadow: 0 0 0 4px var(--bg-surface);">
                  📄
                </div>
                <div style="font-weight: 800; font-size: 13px; color: var(--text-primary); margin-top: 6px;">3. Receipt</div>
                <span class="badge ${lifecycle.stage === 3 ? 'badge-success' : 'badge-subtle'}" style="font-size: 9.5px; margin-top: 2px;">
                  ${lifecycle.stage === 3 ? 'Reconciled' : 'Pending Payment'}
                </span>
              </div>
            </div>

            <!-- DETAILED LIFECYCLE SECTIONS (INVOICE ↓ PAYMENT ↓ RECEIPT) -->
            <div style="display: flex; flex-direction: column; gap: 14px;">

              <!-- STAGE 1: INVOICE SECTION -->
              <div style="padding: 16px 18px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); border-left: 4px solid #6366f1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">🧾</span>
                    <strong style="font-size: 13.5px; color: var(--text-primary);">Stage 1: Tax Invoice Issued</strong>
                  </div>
                  <span class="badge badge-info" style="font-size: 10px;">MCA & GST Compliant</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; margin-top: 10px;">
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Invoice #</div>
                    <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary); margin-top: 2px;">${inv.id}</div>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Issue Date</div>
                    <div style="font-weight: 600; margin-top: 2px;">${inv.issueDate || '2026-10-01'}</div>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Due Date</div>
                    <div style="font-weight: 600; margin-top: 2px;">${inv.dueDate || '2026-10-10'}</div>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Total with GST</div>
                    <div style="font-family: var(--font-mono); font-weight: 800; font-size: 14px; color: var(--text-primary); margin-top: 2px;">
                      ₹${inv.total.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 11px; color: var(--text-muted);">
                    ${inv.lineItems ? `${inv.lineItems.length} Billable Items (Workspace, Add-ons)` : 'Full Monthly License'}
                  </div>
                  <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 3px 8px;"
                    onclick="PaymentsModule.closeModal('modal-lifecycle'); if (typeof InvoiceModule !== 'undefined') InvoiceModule.viewInvoice('${inv.id}');">
                    📄 View Full Invoice
                  </button>
                </div>
              </div>

              <!-- DOWN ARROW -->
              <div style="text-align: center; color: var(--text-muted); font-size: 16px; margin: -6px 0;">↓</div>

              <!-- STAGE 2: PAYMENT SECTION -->
              <div style="padding: 16px 18px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); border-left: 4px solid #0ea5e9;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">💳</span>
                    <strong style="font-size: 13.5px; color: var(--text-primary);">Stage 2: Payment Settlement</strong>
                  </div>
                  ${this._renderStatusBadge(currentStatus)}
                </div>

                <!-- Progress Bar -->
                <div style="margin: 12px 0;">
                  <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
                    <span style="color: var(--text-muted);">Payment Settlement Progress</span>
                    <span style="font-weight: 700; color: ${pctPaid === 100 ? 'var(--status-success)' : 'var(--accent-primary)'};">
                      ₹${totalPaid.toLocaleString('en-IN')} / ₹${inv.total.toLocaleString('en-IN')} (${pctPaid}%)
                    </span>
                  </div>
                  <div style="height: 8px; background: rgba(0,0,0,0.08); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${pctPaid}%; height: 100%; background: ${pctPaid === 100 ? '#10b981' : pctPaid > 0 ? '#8b5cf6' : '#94a3b8'}; transition: width 0.3s;"></div>
                  </div>
                </div>

                <!-- Payment Details -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; margin-top: 8px;">
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Amount Settled</div>
                    <div style="font-family: var(--font-mono); font-weight: 700; color: var(--status-success); margin-top: 2px;">
                      ₹${totalPaid.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Remaining Balance</div>
                    <div style="font-family: var(--font-mono); font-weight: 800; color: ${balance > 0 ? 'var(--status-danger)' : 'var(--text-muted)'}; margin-top: 2px;">
                      ₹${balance.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Gateway Method</div>
                    <div style="font-weight: 600; margin-top: 2px;">
                      ${inv.gateway || inv.paymentMethod || (payments[0] ? payments[0].method : 'Pending Settlement')}
                    </div>
                  </div>
                </div>

                <!-- Action Buttons if Outstanding -->
                ${balance > 0 && currentStatus !== 'Cancelled' ? `
                  <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--border-subtle); display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-outline btn-sm" onclick="PaymentsModule.closeModal('modal-lifecycle'); PaymentsModule.openPartialPayment('${inv.id}')">
                      🔸 Record Partial Payment
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="PaymentsModule.closeModal('modal-lifecycle'); PaymentsModule.openCheckoutModal('${inv.id}')">
                      💳 Pay Full Balance (₹${balance.toLocaleString('en-IN')})
                    </button>
                  </div>
                ` : ''}

                ${currentStatus === 'Cancelled' ? `
                  <div style="margin-top: 10px; padding: 8px 12px; background: rgba(239,68,68,0.06); border-radius: var(--radius-sm); font-size: 11.5px; color: var(--status-danger);">
                    <strong>Cancellation Note:</strong> ${inv.cancellationReason || 'Voided by Administrator'}
                  </div>
                ` : ''}
              </div>

              <!-- DOWN ARROW -->
              <div style="text-align: center; color: var(--text-muted); font-size: 16px; margin: -6px 0;">↓</div>

              <!-- STAGE 3: RECEIPT SECTION -->
              <div style="padding: 16px 18px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); border-left: 4px solid #10b981;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">📄</span>
                    <strong style="font-size: 13.5px; color: var(--text-primary);">Stage 3: Payment Receipt & Audit Voucher</strong>
                  </div>
                  <span class="badge ${payments.length > 0 ? 'badge-success' : 'badge-subtle'}" style="font-size: 10px;">
                    ${payments.length > 0 ? 'Official Voucher Available' : 'Awaiting Settlement'}
                  </span>
                </div>

                ${payments.length > 0 ? `
                  <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                    ${payments.map(p => `
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(16,185,129,0.05); border-radius: var(--radius-sm); border: 1px solid rgba(16,185,129,0.2);">
                        <div>
                          <strong style="font-family: var(--font-mono); color: var(--status-success); font-size: 12.5px;">${p.receiptNo}</strong>
                          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                            ${p.method} • <code style="font-size: 10.5px;">${p.transactionRef}</code> • ${p.paymentDate}
                          </div>
                        </div>
                        <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
                          <div style="font-family: var(--font-mono); font-weight: 800; font-size: 14px; color: var(--status-success);">
                            ₹${p.amount.toLocaleString('en-IN')}
                          </div>
                          <button class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px;"
                            onclick="PaymentsModule.closeModal('modal-lifecycle'); PaymentsModule.viewReceipt('${p.id}')">
                            🖨️ View Voucher
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div style="padding: 12px; text-align: center; font-size: 12px; color: var(--text-muted);">
                    Receipt voucher will be automatically generated and reconciled immediately once payment is processed.
                  </div>
                `}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="PaymentsModule.closeModal('modal-lifecycle')">Close</button>
            ${balance > 0 && currentStatus !== 'Cancelled' ? `
              <button class="btn btn-primary" onclick="PaymentsModule.closeModal('modal-lifecycle'); PaymentsModule.openCheckoutModal('${inv.id}')">
                💳 Proceed to Gateway Payment
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  openQuickLifecycle() {
    const invoices = window.store.getInvoices();
    if (invoices.length === 0) {
      App.showToast('No invoices available to track.', 'info');
      return;
    }
    this.openLifecycleModal(invoices[0].id);
  },

  // ─── Multi-Gateway Checkout Modal (Razorpay / Stripe / UPI / Bank Wire) ────

  openCheckoutModal(invoiceId) {
    const inv = window.store.getInvoiceById(invoiceId);
    if (!inv) { App.showToast('Invoice not found.', 'danger'); return; }
    if (inv.status === 'Paid') { App.showToast('This invoice has already been fully paid.', 'info'); return; }
    if (inv.status === 'Cancelled') { App.showToast('This invoice has been cancelled.', 'warning'); return; }

    const payments = window.store.getPaymentsByInvoiceId ? window.store.getPaymentsByInvoiceId(inv.id) : [];
    const paidSoFar = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const balanceDue = Math.max(0, inv.total - paidSoFar);

    this.activePayMethod = 'razorpay'; // Default to India's primary gateway

    const html = `
      <div class="modal-overlay active" id="modal-checkout">
        <div class="modal-content modal-wide" style="max-width: 680px;">
          <!-- Custom Gateway Modal Header -->
          <div class="modal-header" style="background: linear-gradient(135deg, #03003a, #0c076e); color: white; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #0c076e, #03003a); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid rgba(255,255,255,0.2);">
                💳
              </div>
              <div>
                <h3 class="modal-title" style="color: white; font-size: 16px;">Multi-Gateway Checkout Simulator</h3>
                <span style="font-size: 11.5px; opacity: 0.8;">
                  Invoice <strong>${inv.id}</strong> • ${inv.startupName} • GST Tax Invoice Settlement
                </span>
              </div>
            </div>
            <button class="modal-close-btn" style="color: white;" onclick="PaymentsModule.closeModal('modal-checkout')">×</button>
          </div>

          <div class="modal-body" style="padding: 22px 24px;">
            <!-- Amount Due Banner -->
            <div style="background: linear-gradient(135deg, rgba(3,0,58,0.06), rgba(12,7,110,0.04)); border: 1px solid rgba(3,0,58,0.22); border-radius: var(--radius-md); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.6px;">Amount Due to Settle</div>
                <div style="font-size: 30px; font-weight: 900; font-family: var(--font-mono); color: var(--text-primary); margin-top: 2px;">
                  ₹${balanceDue.toLocaleString('en-IN')}
                </div>
                ${paidSoFar > 0 ? `
                  <div style="font-size: 11px; color: var(--status-success); margin-top: 3px;">
                    ₹${paidSoFar.toLocaleString('en-IN')} already settled • Balance payment
                  </div>
                ` : ''}
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; color: var(--text-muted);">Invoice Total: <strong style="font-family: var(--font-mono);">₹${inv.total.toLocaleString('en-IN')}</strong></div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">GST Included (18%)</div>
                <span class="badge badge-success" style="margin-top: 6px; font-size: 10px;">🔒 256-Bit SSL Encrypted</span>
              </div>
            </div>

            <!-- Gateway Selector Tabs -->
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.6px; margin-bottom: 10px;">
              Select Payment Gateway / Method
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px;">
              ${[
                { id: 'razorpay', icon: '💙', label: 'Razorpay',   sub: 'India Gateway', color: '#3395ff' },
                { id: 'stripe',   icon: '🟣', label: 'Stripe',     sub: 'Global Cards',  color: '#635bff' },
                { id: 'upi',      icon: '📱', label: 'UPI / QR',   sub: 'GPay, PhonePe', color: '#f97316' },
                { id: 'wire',     icon: '🏦', label: 'NEFT / RTGS',sub: 'Bank Transfer', color: '#10b981' }
              ].map(m => `
                <button id="gw-tab-${m.id}" onclick="PaymentsModule.switchCheckoutTab('${m.id}')"
                  style="cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 12px 6px; border-radius: var(--radius-md); border: 2px solid ${this.activePayMethod === m.id ? m.color : 'var(--border-subtle)'}; background: ${this.activePayMethod === m.id ? `rgba(${m.id === 'razorpay' ? '51,149,255' : m.id === 'stripe' ? '99,91,255' : m.id === 'upi' ? '249,115,22' : '16,185,129'},0.1)` : 'var(--bg-surface-elevated)'}; transition: all 0.15s;">
                  <span style="font-size: 20px;">${m.icon}</span>
                  <span style="font-size: 12px; font-weight: 800; color: var(--text-primary);">${m.label}</span>
                  <span style="font-size: 9.5px; color: var(--text-muted);">${m.sub}</span>
                </button>
              `).join('')}
            </div>

            <!-- Dynamic Gateway Experience Panel -->
            <div id="checkout-gateway-panel" style="min-height: 220px;">
              ${this._buildRazorpayPanel(inv, balanceDue)}
            </div>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11.5px; color: var(--text-muted);">
              Portfolio Mock Mode: Instant Simulation with Real Order ID
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary" onclick="PaymentsModule.closeModal('modal-checkout')">Cancel</button>
              <button class="btn btn-outline" style="color: var(--status-danger); border-color: var(--status-danger);"
                onclick="PaymentsModule.simulatePaymentFailure()">
                ⚠️ Simulate Failure
              </button>
              <button class="btn btn-primary" id="btn-submit-pay" style="min-width: 200px;"
                onclick="PaymentsModule.executeCheckoutPayment('${inv.id}', ${balanceDue})">
                🔒 Settle ₹${balanceDue.toLocaleString('en-IN')} Now
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  switchCheckoutTab(method) {
    this.activePayMethod = method;
    const inv = window.store.getInvoiceById(document.getElementById('checkout-invoice-id')?.value || '') || window.store.getInvoices()[0];
    const payments = window.store.getPaymentsByInvoiceId ? window.store.getPaymentsByInvoiceId(inv.id) : [];
    const paidSoFar = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const balanceDue = Math.max(0, inv.total - paidSoFar);

    const tabs = [
      { id: 'razorpay', color: '#3395ff', rgb: '51,149,255' },
      { id: 'stripe',   color: '#635bff', rgb: '99,91,255' },
      { id: 'upi',      color: '#f97316', rgb: '249,115,22' },
      { id: 'wire',     color: '#10b981', rgb: '16,185,129' }
    ];

    tabs.forEach(t => {
      const el = document.getElementById(`gw-tab-${t.id}`);
      if (el) {
        el.style.borderColor = t.id === method ? t.color : 'var(--border-subtle)';
        el.style.background  = t.id === method ? `rgba(${t.rgb},0.1)` : 'var(--bg-surface-elevated)';
      }
    });

    const panel = document.getElementById('checkout-gateway-panel');
    if (!panel) return;

    if (method === 'razorpay') {
      panel.innerHTML = this._buildRazorpayPanel(inv, balanceDue);
    } else if (method === 'stripe') {
      panel.innerHTML = this._buildStripePanel(inv, balanceDue);
    } else if (method === 'upi') {
      panel.innerHTML = this._buildUpiPanel(inv, balanceDue);
    } else if (method === 'wire') {
      panel.innerHTML = this._buildWirePanel(inv, balanceDue);
    }
  },

  _buildRazorpayPanel(inv, balanceDue) {
    const orderId = `order_NXZ2026_${Math.floor(100000 + Math.random() * 900000)}`;
    return `
      <input type="hidden" id="checkout-invoice-id" value="${inv.id}">
      <input type="hidden" id="checkout-order-id" value="${orderId}">
      <div style="background: var(--bg-surface-elevated); border: 1px solid #3395ff; border-radius: var(--radius-md); padding: 18px; position: relative;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">💙</span>
            <div>
              <strong style="font-size: 14px; color: #3395ff;">Razorpay Standard Checkout</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Trusted Business • Key: <code>rzp_test_NEXUS2026Oct</code></div>
            </div>
          </div>
          <span class="badge badge-info" style="font-size: 10px;">Order: ${orderId}</span>
        </div>

        <!-- Channel Selector -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 14px;">
          ${['📱 UPI QR', '💳 Cards', '🏦 NetBanking', '⚡ Wallets'].map((c, i) => `
            <div style="text-align: center; padding: 8px 4px; font-size: 11px; font-weight: 700; border-radius: var(--radius-sm); border: 1px solid ${i === 0 ? '#3395ff' : 'var(--border-subtle)'}; background: ${i === 0 ? 'rgba(51,149,255,0.1)' : 'var(--bg-surface)'}; cursor: pointer; color: var(--text-primary);">
              ${c}
            </div>
          `).join('')}
        </div>

        <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
          🔒 Razorpay will settle ₹${balanceDue.toLocaleString('en-IN')} directly into Nexus Incubation Hub ICICI Nodal Account. Instant webhook verification enabled.
        </div>

        <!-- Expandable Developer Hook Snippet for Portfolio -->
        <details style="font-size: 11px; background: rgba(0,0,0,0.04); border-radius: var(--radius-sm); padding: 8px 12px;">
          <summary style="cursor: pointer; font-weight: 700; color: #3395ff;">
            👨‍💻 Portfolio Developer Note: Real Razorpay SDK Hook
          </summary>
          <pre style="margin-top: 8px; font-family: var(--font-mono); font-size: 10.5px; overflow-x: auto; color: var(--text-secondary); line-height: 1.5;">
// Real production integration hook:
const rzp = new Razorpay({
  key: "rzp_live_YOUR_KEY",
  amount: ${balanceDue * 100}, // amount in paise
  currency: "INR",
  name: "Nexus Hub",
  order_id: "${orderId}",
  handler: (response) => {
    store.processPayment("${inv.id}", "Razorpay", response.razorpay_payment_id);
  }
});
rzp.open();</pre>
        </details>
      </div>
    `;
  },

  _buildStripePanel(inv, balanceDue) {
    const piId = `pi_3NXZ2026_${Math.floor(100000 + Math.random() * 900000)}`;
    return `
      <input type="hidden" id="checkout-invoice-id" value="${inv.id}">
      <input type="hidden" id="checkout-order-id" value="${piId}">
      <div style="background: var(--bg-surface-elevated); border: 1px solid #635bff; border-radius: var(--radius-md); padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">🟣</span>
            <div>
              <strong style="font-size: 14px; color: #635bff;">Stripe Elements Simulator</strong>
              <div style="font-size: 11px; color: var(--text-muted);">International Cards • 3D Secure Ready</div>
            </div>
          </div>
          <span class="badge" style="background: rgba(99,91,255,0.15); color: #635bff; font-size: 10px;">PaymentIntent: ${piId}</span>
        </div>

        <!-- Stripe Card Input Simulation -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 11px; display: flex; justify-content: space-between;">
              <span>Card Number</span>
              <span style="color: #635bff; cursor: pointer; text-decoration: underline;"
                onclick="document.getElementById('stripe-card-num').value = '4242 4242 4242 4242'">
                ⚡ Autofill Test Card (4242)
              </span>
            </label>
            <input type="text" id="stripe-card-num" class="form-control" value="4242 •••• •••• 4242" placeholder="4242 4242 4242 4242">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
            <div>
              <label class="form-label" style="font-size: 10.5px;">MM / YY</label>
              <input type="text" class="form-control" value="12/28" placeholder="MM/YY">
            </div>
            <div>
              <label class="form-label" style="font-size: 10.5px;">CVC</label>
              <input type="password" class="form-control" value="842" maxlength="4" placeholder="CVC">
            </div>
            <div>
              <label class="form-label" style="font-size: 10.5px;">ZIP / Postal</label>
              <input type="text" class="form-control" value="560103" placeholder="ZIP">
            </div>
          </div>
        </div>

        <details style="font-size: 11px; background: rgba(0,0,0,0.04); border-radius: var(--radius-sm); padding: 8px 12px;">
          <summary style="cursor: pointer; font-weight: 700; color: #635bff;">
            👨‍💻 Portfolio Developer Note: Real Stripe.js SDK Hook
          </summary>
          <pre style="margin-top: 8px; font-family: var(--font-mono); font-size: 10.5px; overflow-x: auto; color: var(--text-secondary); line-height: 1.5;">
// Real production integration hook:
const stripe = Stripe("pk_live_YOUR_KEY");
const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
if (paymentIntent.status === 'succeeded') {
  store.processPayment("${inv.id}", "Stripe", paymentIntent.id);
}</pre>
        </details>
      </div>
    `;
  },

  _buildUpiPanel(inv, balanceDue) {
    const upiRef = `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/ICICI`;
    return `
      <input type="hidden" id="checkout-invoice-id" value="${inv.id}">
      <input type="hidden" id="checkout-order-id" value="${upiRef}">
      <div style="background: var(--bg-surface-elevated); border: 1px solid #f97316; border-radius: var(--radius-md); padding: 18px; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">📱</span>
            <div style="text-align: left;">
              <strong style="font-size: 14px; color: #f97316;">UPI Dynamic QR & Intent</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Zero MDR • Instant Settlement</div>
            </div>
          </div>
          <span class="badge badge-warning" style="font-size: 10px;">Valid: 04:59 mins</span>
        </div>

        <div style="display: flex; justify-content: center; margin-bottom: 12px;">
          <div style="width: 140px; height: 140px; border: 3px solid #f97316; border-radius: 12px; padding: 10px; background: white; box-shadow: 0 4px 18px rgba(249,115,22,0.15); display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
            ${Array.from({length: 49}, (_, i) => `
              <div style="background: ${[0,1,2,6,7,8,13,14,18,20,21,24,27,28,31,34,35,40,41,42,46,47,48].includes(i) ? '#1e293b' : 'white'}; border-radius: 1px;"></div>
            `).join('')}
          </div>
        </div>

        <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">
          nexusincubation@icici
        </div>
        <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
          Scan with Google Pay, PhonePe, Paytm, BHIM, Cred or Navi
        </div>

        <div style="display: flex; gap: 6px; justify-content: center; margin-top: 12px; flex-wrap: wrap;">
          ${['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Cred'].map(app => `
            <span style="font-size: 10px; padding: 3px 8px; background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--border-subtle); color: var(--text-secondary);">
              ⚡ ${app}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  },

  _buildWirePanel(inv, balanceDue) {
    const wireRef = `CMS2026${Math.floor(100000000 + Math.random() * 900000000)}`;
    return `
      <input type="hidden" id="checkout-invoice-id" value="${inv.id}">
      <input type="hidden" id="checkout-order-id" value="NEFT/${wireRef}">
      <div style="background: var(--bg-surface-elevated); border: 1px solid #10b981; border-radius: var(--radius-md); padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">🏦</span>
            <div>
              <strong style="font-size: 14px; color: #10b981;">NEFT / RTGS Corporate Bank Transfer</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Direct Virtual Account CMS Settlement</div>
            </div>
          </div>
          <span class="badge badge-success" style="font-size: 10px;">HDFC Virtual CMS</span>
        </div>

        <div style="background: var(--bg-surface); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 12px; line-height: 1.7; margin-bottom: 12px;">
          Beneficiary: <strong>Nexus Innovation Hub Pvt Ltd</strong><br>
          Bank: <strong>HDFC Bank Ltd, Cyber City Branch</strong><br>
          Virtual Account: <strong style="font-family: var(--font-mono);">50200088921841</strong><br>
          IFSC: <strong style="font-family: var(--font-mono);">HDFC0001842</strong>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 11px;">Bank UTR / Transaction Reference *</label>
          <input type="text" id="wire-utr-input" class="form-control" value="${wireRef}" placeholder="Enter Bank UTR">
        </div>
      </div>
    `;
  },

  // ─── Execute Checkout Payment with Loading Simulator ──────────────────────

  executeCheckoutPayment(invoiceId, balanceDue) {
    const btn = document.getElementById('btn-submit-pay');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;"></span>
          Processing ${this.activePayMethod.toUpperCase()} Settlement...
        </span>
      `;
    }

    if (!document.getElementById('pay-spin-style')) {
      const s = document.createElement('style');
      s.id = 'pay-spin-style';
      s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }

    const orderId = document.getElementById('checkout-order-id')?.value;
    const wireInput = document.getElementById('wire-utr-input');
    const finalRef = (this.activePayMethod === 'wire' && wireInput) ? `NEFT/${wireInput.value}` : orderId;

    const gatewayName = this.activePayMethod === 'razorpay' ? 'Razorpay'
                      : this.activePayMethod === 'stripe' ? 'Stripe'
                      : this.activePayMethod === 'upi' ? 'UPI / BHIM'
                      : 'Bank Wire Transfer';

    setTimeout(() => {
      const res = window.store.processPayment(invoiceId, this.activePayMethod.toUpperCase(), finalRef, '', { gateway: gatewayName, orderId: finalRef });
      this.closeModal('modal-checkout');

      if (res.success) {
        this._showSuccessOverlay(res.payment, gatewayName);
        this.render();
        if (typeof BillingModule !== 'undefined') BillingModule.render();
        if (typeof DashboardModule !== 'undefined') DashboardModule.render();
        setTimeout(() => this.viewReceipt(res.payment.id), 1900);
      } else {
        App.showToast(`⚠️ ${res.message}`, 'danger');
      }
    }, 1100);
  },

  simulatePaymentFailure() {
    this.closeModal('modal-checkout');
    App.showToast('⚠️ Payment simulation cancelled or timed out by customer bank.', 'warning');
  },

  _showSuccessOverlay(payment, gatewayName) {
    const el = document.createElement('div');
    el.id = 'pay-success-overlay';
    el.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);`;
    el.innerHTML = `
      <div style="background: #ffffff; border-radius: 20px; padding: 36px 44px; text-align: center; box-shadow: 0 25px 70px rgba(0,0,0,0.3); max-width: 400px; animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <style>@keyframes popIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }</style>
        <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-size: 34px; color: white;">
          ✓
        </div>
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 900; margin: 0 0 6px;">Payment Settled! 🎉</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">
          ₹${payment.amount.toLocaleString('en-IN')} received via <strong>${gatewayName}</strong>
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; text-align: left; font-size: 12px; color: #334155; line-height: 1.8; margin-bottom: 18px;">
          <div>Receipt #: <strong style="font-family: var(--font-mono); color: #059669; font-size: 11.5px;">${payment.receiptNo}</strong></div>
          <div>Startup: <strong>${payment.startupName}</strong></div>
          <div>Ref: <code style="font-size: 10.5px;">${payment.transactionRef}</code></div>
        </div>
        <div style="font-size: 11.5px; color: #94a3b8;">
          Reconciled tax receipt opening automatically…
        </div>
      </div>
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  },

  // ─── Partial Payment Modal (Installment Settlement) ────────────────────────

  openPartialPayment(invoiceId) {
    const inv = window.store.getInvoiceById(invoiceId);
    if (!inv) return;

    const payments = window.store.getPaymentsByInvoiceId ? window.store.getPaymentsByInvoiceId(inv.id) : [];
    const paidSoFar = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const balanceDue = Math.max(0, inv.total - paidSoFar);

    const halfAmt = Math.floor(balanceDue / 2);

    const html = `
      <div class="modal-overlay active" id="modal-partial-pay">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">🔸 Record Partial Installment</h3>
              <span style="font-size: 12px; color: var(--text-muted);">${inv.id} • ${inv.startupName}</span>
            </div>
            <button class="modal-close-btn" onclick="PaymentsModule.closeModal('modal-partial-pay')">×</button>
          </div>

          <div class="modal-body">
            <!-- 3-box Summary -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 18px;">
              <div style="text-align: center; padding: 10px; background: var(--bg-surface-elevated); border-radius: var(--radius-md);">
                <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Total Invoice</div>
                <div style="font-family: var(--font-mono); font-weight: 800; font-size: 15px; margin-top: 3px;">
                  ₹${inv.total.toLocaleString('en-IN')}
                </div>
              </div>
              <div style="text-align: center; padding: 10px; background: rgba(16,185,129,0.08); border-radius: var(--radius-md);">
                <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Already Paid</div>
                <div style="font-family: var(--font-mono); font-weight: 800; font-size: 15px; color: var(--status-success); margin-top: 3px;">
                  ₹${paidSoFar.toLocaleString('en-IN')}
                </div>
              </div>
              <div style="text-align: center; padding: 10px; background: rgba(239,68,68,0.08); border-radius: var(--radius-md);">
                <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Balance Due</div>
                <div style="font-family: var(--font-mono); font-weight: 800; font-size: 15px; color: var(--status-danger); margin-top: 3px;">
                  ₹${balanceDue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <!-- Preset percentage buttons -->
            <div style="margin-bottom: 12px;">
              <label class="form-label" style="font-size: 11px;">Quick Percentage Fill:</label>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('partial-amount-input').value = Math.round(${balanceDue * 0.25})">25%</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('partial-amount-input').value = Math.round(${balanceDue * 0.50})">50%</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('partial-amount-input').value = Math.round(${balanceDue * 0.75})">75%</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('partial-amount-input').value = ${balanceDue}">100%</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Installment Amount to Pay Now (₹) *</label>
              <input type="number" id="partial-amount-input" class="form-control" min="1" max="${balanceDue}"
                value="${halfAmt}" placeholder="Enter amount">
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                Max: ₹${balanceDue.toLocaleString('en-IN')} • Min: ₹1
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Gateway / Mode</label>
              <select id="partial-method-select" class="form-control">
                <option value="Razorpay">💙 Razorpay (Gateway)</option>
                <option value="UPI" selected>📱 UPI (Instant)</option>
                <option value="Stripe">🟣 Stripe (Card)</option>
                <option value="RTGS">📄 NEFT / RTGS Wire</option>
                <option value="Cheque">📝 PDC Cheque</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Transaction Reference / UTR</label>
              <input type="text" id="partial-ref-input" class="form-control"
                value="UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/PARTIAL"
                placeholder="Bank reference number">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Installment Notes</label>
              <input type="text" id="partial-notes-input" class="form-control"
                value="Part installment payment (Awaiting remainder)" placeholder="e.g. Milestone 1 installment">
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="PaymentsModule.closeModal('modal-partial-pay')">Cancel</button>
            <button class="btn btn-primary" onclick="PaymentsModule.executePartialPayment('${inv.id}')">
              🔸 Record Installment
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  executePartialPayment(invoiceId) {
    const amountEl = document.getElementById('partial-amount-input');
    const methodEl = document.getElementById('partial-method-select');
    const refEl    = document.getElementById('partial-ref-input');
    const notesEl  = document.getElementById('partial-notes-input');

    const amount = parseFloat(amountEl?.value || 0);
    const method = methodEl?.value || 'UPI';
    const ref    = refEl?.value || '';
    const notes  = notesEl?.value || 'Partial payment';

    if (!amount || amount <= 0) {
      App.showToast('Please specify a valid payment amount.', 'danger');
      return;
    }

    const res = window.store.recordPartialPayment(invoiceId, {
      amount,
      method,
      ref,
      notes,
      gatewayMeta: { gateway: method }
    });

    this.closeModal('modal-partial-pay');

    if (res.success) {
      App.showToast(`🔸 Installment of ₹${amount.toLocaleString('en-IN')} recorded successfully.`, 'success');
      this.render();
      if (typeof BillingModule !== 'undefined') BillingModule.render();
      if (typeof DashboardModule !== 'undefined') DashboardModule.render();
    } else {
      App.showToast(`⚠️ ${res.message}`, 'danger');
    }
  },

  // ─── Cancel Invoice Action ─────────────────────────────────────────────────

  promptCancelInvoice(invoiceId) {
    const inv = window.store.getInvoiceById(invoiceId);
    if (!inv) return;

    const reason = prompt(`Enter reason for cancelling Invoice #${inv.id} for ${inv.startupName}:`, 'Administrative fee waiver amendment');
    if (!reason) return;

    const res = window.store.cancelInvoice(invoiceId, reason);
    if (res.success) {
      App.showToast(`Invoice #${inv.id} has been cancelled.`, 'warning');
      this.render();
      if (typeof BillingModule !== 'undefined') BillingModule.render();
    } else {
      App.showToast(`⚠️ ${res.message}`, 'danger');
    }
  },

  // ─── Bulk Settlement Action ────────────────────────────────────────────────

  openBulkSettle() {
    const invoices = window.store.getInvoices().filter(i => i.status !== 'Paid' && i.status !== 'Cancelled');
    if (invoices.length === 0) {
      App.showToast('No outstanding invoices available to settle.', 'info');
      return;
    }

    const total = invoices.reduce((s, i) => s + (i.balanceDue !== undefined ? i.balanceDue : i.total), 0);

    const html = `
      <div class="modal-overlay active" id="modal-bulk-settle">
        <div class="modal-content" style="max-width: 520px;">
          <div class="modal-header">
            <h3 class="modal-title">⚡ Bulk Settlement — ${invoices.length} Invoices</h3>
            <button class="modal-close-btn" onclick="PaymentsModule.closeModal('modal-bulk-settle')">×</button>
          </div>
          <div class="modal-body">
            <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 14px 18px; border-radius: var(--radius-md); margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700;">Grand Outstanding:</span>
              <span style="font-family: var(--font-mono); font-size: 20px; font-weight: 900; color: var(--status-success);">
                ₹${total.toLocaleString('en-IN')}
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; margin-bottom: 14px;">
              ${invoices.map(inv => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 12px;">
                  <div>
                    <strong>${inv.startupName}</strong>
                    <div style="font-size: 10.5px; color: var(--text-muted);">${inv.id} • ${inv.billingPeriod}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-family: var(--font-mono); font-weight: 700;">₹${inv.total.toLocaleString('en-IN')}</div>
                    <span class="badge ${inv.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}" style="font-size: 9.5px;">${inv.status}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Batch Settlement Gateway</label>
              <select id="bulk-gw-select" class="form-control">
                <option value="Razorpay">💙 Razorpay Batch Autopay</option>
                <option value="UPI">📱 UPI NACH Mandate</option>
                <option value="RTGS">📄 NEFT / RTGS Wire Transfer</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="PaymentsModule.closeModal('modal-bulk-settle')">Cancel</button>
            <button class="btn btn-primary" onclick="PaymentsModule.executeBulkSettle()">
              ⚡ Settle All ${invoices.length} Invoices
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  executeBulkSettle() {
    const gw = document.getElementById('bulk-gw-select')?.value || 'Razorpay';
    const invoices = window.store.getInvoices().filter(i => i.status !== 'Paid' && i.status !== 'Cancelled');

    let count = 0;
    invoices.forEach(inv => {
      const res = window.store.processPayment(inv.id, gw.toUpperCase(), null, 'Batch settlement', { gateway: gw });
      if (res.success) count++;
    });

    this.closeModal('modal-bulk-settle');
    App.showToast(`✅ ${count} invoices settled successfully via ${gw}!`, 'success');
    this.render();
    if (typeof BillingModule !== 'undefined') BillingModule.render();
    if (typeof DashboardModule !== 'undefined') DashboardModule.render();
  },

  openQuickPay() {
    const dues = window.store.getInvoices().filter(i => i.status !== 'Paid' && i.status !== 'Cancelled');
    if (dues.length === 0) {
      App.showToast('No outstanding invoices to collect.', 'info');
      return;
    }
    this.openCheckoutModal(dues[0].id);
  },

  // ─── Gateway Configuration Modal (Mock Simulator vs Live Keys) ────────────

  openGatewayConfig(highlightGw = null) {
    const config = window.store.getGatewayConfig ? window.store.getGatewayConfig() : { activeMode: 'mock' };

    const html = `
      <div class="modal-overlay active" id="modal-gateway-config">
        <div class="modal-content modal-wide" style="max-width: 760px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 26px;">🔌</span>
              <div>
                <h3 class="modal-title">Payment Gateway API Settings</h3>
                <span style="font-size: 12px; color: var(--text-muted);">
                  Razorpay • Stripe • UPI — Switch between Mock Sandbox & Live Keys
                </span>
              </div>
            </div>
            <button class="modal-close-btn" onclick="PaymentsModule.closeModal('modal-gateway-config')">×</button>
          </div>

          <div class="modal-body" style="padding: 22px;">
            <!-- Active Mode Toggle -->
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <strong style="font-size: 13px; color: var(--text-primary);">Execution Mode</strong>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                  Use Mock Mode for portfolio demonstrations without external API charges.
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
                  <input type="radio" name="gw-mode-radio" value="mock" ${config.activeMode !== 'live' ? 'checked' : ''}>
                  Mock Sandbox (Demo)
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; cursor: pointer; margin-left: 10px;">
                  <input type="radio" name="gw-mode-radio" value="live" ${config.activeMode === 'live' ? 'checked' : ''}>
                  Live Gateway Keys
                </label>
              </div>
            </div>

            <!-- Gateways Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px;">
              <!-- Razorpay -->
              <div style="padding: 16px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 2px solid ${highlightGw === 'Razorpay' ? '#3395ff' : 'var(--border-subtle)'};">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <span style="font-size: 20px;">💙</span>
                  <div>
                    <strong style="color: var(--text-primary); font-size: 13px;">Razorpay Settings</strong>
                    <div style="font-size: 10px; color: var(--text-muted);">India Gateway (INR)</div>
                  </div>
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                  <label class="form-label" style="font-size: 11px;">Key ID</label>
                  <input type="text" id="cfg-rzp-key" class="form-control" value="${config.razorpay?.keyId || 'rzp_test_NEXUS2026Oct'}">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                  <label class="form-label" style="font-size: 11px;">Key Secret</label>
                  <input type="password" id="cfg-rzp-sec" class="form-control" value="${config.razorpay?.keySecret || 'sec_test_99812480129'}">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 11px;">Webhook Secret</label>
                  <input type="text" id="cfg-rzp-wh" class="form-control" value="${config.razorpay?.webhookSecret || 'whsec_rzp_mock_live_881'}">
                </div>
              </div>

              <!-- Stripe -->
              <div style="padding: 16px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 2px solid ${highlightGw === 'Stripe' ? '#635bff' : 'var(--border-subtle)'};">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <span style="font-size: 20px;">🟣</span>
                  <div>
                    <strong style="color: var(--text-primary); font-size: 13px;">Stripe Settings</strong>
                    <div style="font-size: 10px; color: var(--text-muted);">Global & Multi-Currency</div>
                  </div>
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                  <label class="form-label" style="font-size: 11px;">Publishable Key</label>
                  <input type="text" id="cfg-str-pub" class="form-control" value="${config.stripe?.publishableKey || 'pk_test_51NxCOWORKING2026LIVE'}">
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                  <label class="form-label" style="font-size: 11px;">Secret Key</label>
                  <input type="password" id="cfg-str-sec" class="form-control" value="${config.stripe?.secretKey || 'sk_test_51NxCOWORKINGSECRET'}">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 11px;">Webhook Secret</label>
                  <input type="text" id="cfg-str-wh" class="form-control" value="${config.stripe?.webhookSecret || 'whsec_stripe_mock_2026'}">
                </div>
              </div>
            </div>

            <!-- UPI Config -->
            <div style="padding: 16px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 2px solid ${highlightGw === 'UPI / BHIM' ? '#f97316' : 'var(--border-subtle)'};">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <span style="font-size: 20px;">📱</span>
                <div>
                  <strong style="color: var(--text-primary); font-size: 13px;">UPI VPA & Merchant Credentials</strong>
                  <div style="font-size: 10px; color: var(--text-muted);">Direct Virtual Address Configuration</div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 11px;">Virtual VPA ID</label>
                  <input type="text" id="cfg-upi-vpa" class="form-control" value="${config.upi?.vpa || 'nexusincubation@icici'}">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 11px;">Merchant ID (MID)</label>
                  <input type="text" id="cfg-upi-mid" class="form-control" value="${config.upi?.merchantId || 'NEXUS_MID_20261042'}">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 11px;">Settlement Bank</label>
                  <input type="text" id="cfg-upi-bank" class="form-control" value="${config.upi?.settlementBank || 'ICICI Bank Cyber City'}">
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="PaymentsModule.closeModal('modal-gateway-config')">Close</button>
            <button class="btn btn-primary" onclick="PaymentsModule.saveGatewayConfig()">
              💾 Save Configuration
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  saveGatewayConfig() {
    const modeEl = document.querySelector('input[name="gw-mode-radio"]:checked');
    const mode = modeEl ? modeEl.value : 'mock';

    const newCfg = {
      activeMode: mode,
      razorpay: {
        keyId: document.getElementById('cfg-rzp-key')?.value || '',
        keySecret: document.getElementById('cfg-rzp-sec')?.value || '',
        webhookSecret: document.getElementById('cfg-rzp-wh')?.value || '',
        currency: 'INR'
      },
      stripe: {
        publishableKey: document.getElementById('cfg-str-pub')?.value || '',
        secretKey: document.getElementById('cfg-str-sec')?.value || '',
        webhookSecret: document.getElementById('cfg-str-wh')?.value || '',
        currency: 'INR / USD'
      },
      upi: {
        vpa: document.getElementById('cfg-upi-vpa')?.value || 'nexusincubation@icici',
        merchantId: document.getElementById('cfg-upi-mid')?.value || 'NEXUS_MID_20261042',
        settlementBank: document.getElementById('cfg-upi-bank')?.value || 'ICICI Bank'
      }
    };

    if (window.store.updateGatewayConfig) {
      window.store.updateGatewayConfig(newCfg);
    }

    this.closeModal('modal-gateway-config');
    App.showToast(`Gateway configuration saved (${mode === 'live' ? 'Live Keys' : 'Mock Sandbox Mode'}).`, 'success');
    this.render();
  },

  // ─── Official Reconciled Receipt Voucher ───────────────────────────────────

  viewReceipt(paymentId) {
    const payment = (window.store.getPayments() || []).find(p => p.id === paymentId);
    if (!payment) { App.showToast('Receipt voucher not found.', 'danger'); return; }

    const hub     = window.store.state.hubInfo;
    const invoice = window.store.getInvoiceById(payment.invoiceId);
    const startup = window.store.getStartupById(payment.startupId);

    const html = `
      <div class="modal-overlay active" id="modal-receipt">
        <div class="modal-content" style="background: #ffffff; color: #0f172a; max-width: 580px; box-shadow: 0 25px 60px rgba(0,0,0,0.3);">
          <div class="modal-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 22px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; background: linear-gradient(135deg,#10b981,#059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                📄
              </div>
              <div>
                <h3 style="font-weight: 800; font-size: 15px; color: #0f172a; margin: 0;">Official Payment Receipt Voucher</h3>
                <span style="font-size: 11px; color: #64748b;">${payment.receiptNo} • PAID & RECONCILED</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="PaymentsModule._printReceipt('${paymentId}')">🖨️ Print</button>
              <button class="modal-close-btn" onclick="PaymentsModule.closeModal('modal-receipt')">×</button>
            </div>
          </div>

          <div class="modal-body" style="padding: 24px; background: #f8fafc;">
            <div style="background: #fff; border-radius: 12px; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden;">
              <!-- Header Brand Banner -->
              <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 22px 24px; color: white; text-align: center;">
                <div style="font-size: 9px; font-weight: 800; letter-spacing: 2px; opacity: 0.85; text-transform: uppercase;">
                  Ministry of Corporate Affairs & GST Tax Receipt
                </div>
                <div style="font-size: 19px; font-weight: 900; margin-top: 4px;">${hub ? hub.name : 'Nexus Co-Working Hub'}</div>
                <div style="font-size: 10.5px; opacity: 0.9; margin-top: 3px;">${hub ? hub.address : ''}</div>
                <div style="font-size: 10px; opacity: 0.85; margin-top: 2px;">GSTIN: ${hub ? hub.gstin : ''} • PAN: ${hub ? hub.pan : ''}</div>
              </div>

              <!-- Reconciled Stamp -->
              <div style="text-align: center; padding: 18px 0 10px;">
                <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.1); border: 2px solid rgba(16,185,129,0.4); border-radius: 50px; padding: 6px 20px;">
                  <span style="font-size: 18px;">✅</span>
                  <span style="font-size: 13px; font-weight: 800; color: #059669; letter-spacing: 0.5px;">
                    PAYMENT RECEIVED & RECONCILED
                  </span>
                </div>
              </div>

              <!-- Amount Banner -->
              <div style="text-align: center; padding: 8px 20px 18px;">
                <div style="font-size: 10.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;">Amount Settled</div>
                <div style="font-size: 38px; font-weight: 800; font-family: var(--font-sans); letter-spacing: -0.03em; color: #059669; font-variant-numeric: tabular-nums; line-height: 1.1;">
                  ₹${payment.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <!-- Key Value Table Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                ${[
                  ['Receipt No.', payment.receiptNo],
                  ['Invoice Ref.', payment.invoiceId],
                  ['Payer / Startup', payment.startupName],
                  ['Settlement Date', payment.paymentDate],
                  ['Payment Method', `${payment.method} (${payment.gateway || 'Gateway'})`],
                  ['Transaction UTR / Ref', payment.transactionRef]
                ].map(([label, value], i) => `
                  <div style="padding: 10px 16px; ${i % 2 === 1 ? 'background: #f8fafc;' : ''} ${i >= 4 ? '' : 'border-bottom: 1px solid #f1f5f9;'}">
                    <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 2px;">${label}</div>
                    <div style="font-size: 12.5px; font-weight: 700; color: #1e293b; font-family: ${label.includes('Ref') || label.includes('No') ? 'var(--font-mono)' : 'var(--font-sans)'}; letter-spacing: ${label.includes('Ref') || label.includes('No') ? '0' : '-0.01em'};">${value}</div>
                  </div>
                `).join('')}
              </div>

              ${invoice ? `
                <div style="padding: 12px 18px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <div style="font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Invoice Breakdown</div>
                  <div style="font-size: 11.5px; color: #475569; line-height: 1.7; font-family: var(--font-sans);">
                    Period: <strong>${invoice.billingPeriod || '—'}</strong> &nbsp;|&nbsp;
                    Subtotal: <strong>₹${Number(invoice.subtotal || 0).toLocaleString('en-IN')}</strong> &nbsp;|&nbsp;
                    GST (18%): <strong>₹${Number(invoice.taxGst || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              ` : ''}

              <!-- QR & Signature Simulation -->
              <div style="padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 38px; height: 38px; border: 2px solid #059669; border-radius: 6px; padding: 3px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;">
                    ${Array.from({length: 16}, (_, i) => `<div style="background: ${i % 2 === 0 ? '#059669' : '#ffffff'};"></div>`).join('')}
                  </div>
                  <div style="font-size: 9.5px; color: #94a3b8; line-height: 1.4;">
                    Digital Verification Code<br>
                    <strong style="color: #059669; font-family: var(--font-mono); font-size: 11px;">QR-MCA-${payment.receiptNo}</strong>
                  </div>
                </div>
                <div style="text-align: right; font-size: 9px; color: #94a3b8;">
                  Digitally Authorized Signatory<br>
                  <strong style="color: #1e293b; font-size: 10.5px;">Nexus Finance & Treasury</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="background: #f8fafc; border-top: 1px solid #e2e8f0;">
            <button class="btn btn-secondary" onclick="PaymentsModule.closeModal('modal-receipt')">Close</button>
            <button class="btn btn-outline" onclick="PaymentsModule._printReceipt('${paymentId}')">🖨️ Print Receipt</button>
            <button class="btn btn-primary" onclick="PaymentsModule.closeModal('modal-receipt')">Done ✓</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  _printReceipt(paymentId) {
    const payment = (window.store.getPayments() || []).find(p => p.id === paymentId);
    if (!payment) return;
    const hub     = window.store.state.hubInfo;
    const invoice = window.store.getInvoiceById(payment.invoiceId);

    const html = `<!DOCTYPE html><html><head><title>Receipt ${payment.receiptNo}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; }
      .page { max-width: 520px; margin: 30px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
      .hdr { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 22px; text-align: center; }
      .hdr h1 { font-size: 17px; font-weight: 900; }
      .hdr p { font-size: 10px; opacity: 0.9; margin-top: 3px; }
      .stamp { text-align: center; padding: 14px; border-bottom: 1px solid #e2e8f0; }
      .stamp span { background: rgba(16,185,129,0.1); border: 2px solid rgba(16,185,129,0.4); border-radius: 50px; padding: 6px 18px; font-weight: 800; color: #059669; font-size: 12px; }
      .amount { text-align: center; padding: 12px; border-bottom: 1px solid #e2e8f0; }
      .amount .val { font-size: 36px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; letter-spacing: -0.02em; color: #059669; font-variant-numeric: tabular-nums; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e2e8f0; }
      .cell { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
      .cell:nth-child(even) { background: #f8fafc; }
      .cell .lbl { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 2px; }
      .cell .val2 { font-size: 12px; font-weight: 700; }
      .footer { text-align: center; padding: 10px; font-size: 9px; color: #94a3b8; background: #f8fafc; }
      @media print { @page { size: A5; margin: 1cm; } }
    </style></head><body>
    <div class="page">
      <div class="hdr">
        <div style="font-size:8px;font-weight:800;letter-spacing:2px;opacity:0.85;text-transform:uppercase;">Official Payment Receipt Voucher</div>
        <h1>${hub ? hub.name : 'Nexus Co-Working Hub'}</h1>
        <p>${hub ? hub.address : ''}</p>
        <p>GSTIN: ${hub ? hub.gstin : ''} • PAN: ${hub ? hub.pan : ''}</p>
      </div>
      <div class="stamp"><span>✅ PAYMENT RECEIVED & RECONCILED</span></div>
      <div class="amount">
        <div style="font-size:9.5px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:1px;margin-bottom:3px;">Amount Settled</div>
        <div class="val">₹${payment.amount.toLocaleString('en-IN')}</div>
      </div>
      <div class="grid">
        ${[
          ['Receipt No.', payment.receiptNo],
          ['Invoice Ref.', payment.invoiceId],
          ['Payer / Startup', payment.startupName],
          ['Settlement Date', payment.paymentDate],
          ['Payment Method', payment.method],
          ['Transaction UTR', payment.transactionRef]
        ].map(([l,v]) => `<div class="cell"><div class="lbl">${l}</div><div class="val2">${v}</div></div>`).join('')}
      </div>
      ${invoice ? `<div style="padding:10px 16px;font-size:11px;color:#475569;border-bottom:1px solid #e2e8f0;">Period: <strong>${invoice.billingPeriod}</strong> | Subtotal: ₹${Number(invoice.subtotal||0).toLocaleString('en-IN')} | GST: ₹${Number(invoice.taxGst||0).toLocaleString('en-IN')}</div>` : ''}
      <div class="footer">Computer-generated receipt. Reconciled under GST standards. No physical signature required.</div>
    </div>
    <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`;

    const win = window.open('', '_blank', 'width=620,height=720');
    win.document.write(html);
    win.document.close();
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
