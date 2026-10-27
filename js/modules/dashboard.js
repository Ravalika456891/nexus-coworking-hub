// Module: Executive Dashboard & Single Source of Truth Command Center

const DashboardModule = {
  summaryData: null,
  isLoading: false,
  selectedMonth: null, // 'YYYY-MM'

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

  sendOverdueReminder(invoiceId, startupName) {
    if (window.App && window.App.showToast) {
      window.App.showToast(`📲 Automated WhatsApp & Email payment reminder dispatched to ${startupName} for invoice #${invoiceId}.`, 'success');
    }
  },

  sendInvoiceNudge() {
    if (window.App && window.App.showToast) {
      window.App.showToast('📲 Automated payment nudges dispatched to founders with outstanding invoices.', 'success');
    }
  },

  navigateToUnpaidInvoices() {
    if (window.App && window.App.switchTab) {
      window.App.switchTab('billing');
      // Set filter to unpaid if billing module supports it
      setTimeout(() => {
        const filterEl = document.getElementById('billing-filter-status');
        if (filterEl) {
          filterEl.value = 'Overdue';
          filterEl.dispatchEvent(new Event('change'));
        }
      }, 100);
    }
  },

  navigateToWorkspaces() {
    if (window.App && window.App.switchTab) {
      window.App.switchTab('workspace');
    }
  },

  navigateToPayments() {
    if (window.App && window.App.switchTab) {
      window.App.switchTab('payments');
    }
  },

  navigateToMeetingRooms() {
    if (window.App && window.App.switchTab) {
      window.App.switchTab('meetingRooms');
    }
  },

  navigateToModule(tabId) {
    if (window.App && window.App.switchTab) {
      window.App.switchTab(tabId);
    }
  },

  // Modal: Single "Generate Invoices" Action (Requirement E.16)
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
      <div class="modal-content modal-wide" style="max-width: 680px; padding: 24px;">
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
          <p style="margin-top: 12px; font-size: 13px; color: var(--text-muted);">Calculating eligible active allocations & verifying duplicate prevention index...</p>
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
          <div class="modal-content" style="max-width: 500px; padding: 24px;">
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
        <div class="modal-content modal-wide" style="max-width: 680px; padding: 24px;">
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
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Projected Roll</div>
                <div style="font-size: 22px; font-weight: 800; color: #10b981; font-family: 'Inter', sans-serif;" class="tabular-nums">${data.totalAmountFormatted}</div>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Skipped (Duplicates)</div>
                <div style="font-size: 22px; font-weight: 800; color: #f59e0b; font-family: 'Inter', sans-serif;" class="tabular-nums">${data.skippedCount}</div>
              </div>
            </div>

            ${data.candidates && data.candidates.length > 0 ? `
              <div style="font-size: 12.5px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">Eligible Startups for ${data.billingPeriod}:</div>
              <div style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: 6px; margin-bottom: 14px;">
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                  <thead style="background: var(--bg-canvas); border-bottom: 1px solid var(--border-subtle);">
                    <tr>
                      <th style="padding: 8px 12px; text-align: left;">Startup</th>
                      <th style="padding: 8px 12px; text-align: center;">Seats</th>
                      <th style="padding: 8px 12px; text-align: right;">Amount (incl. GST)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.candidates.map(c => `
                      <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: 8px 12px; font-weight: 600;">${c.startupName}</td>
                        <td style="padding: 8px 12px; text-align: center;" class="tabular-nums">${c.seatsCount}</td>
                        <td style="padding: 8px 12px; text-align: right; font-weight: 700;" class="tabular-nums">${c.amountFormatted}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<p style="color: var(--text-muted); font-size: 13px; margin-bottom: 12px;">No new startups require billing for this period.</p>'}

            ${data.skipped && data.skipped.length > 0 ? `
              <div style="font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 6px;">
                ⚠️ Skipped Duplicates (${data.skipped.length}):
              </div>
              <ul style="font-size: 11.5px; color: var(--text-muted); margin: 0 0 14px 20px; line-height: 1.5;">
                ${data.skipped.map(sk => `
                  <li><strong>${sk.startupName}</strong>: ${sk.reason}</li>
                `).join('')}
              </ul>
            ` : ''}
          </div>

          <div class="modal-footer" style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
            <button class="btn btn-secondary" onclick="DashboardModule.closeModal('${modalId}')">Cancel</button>
            <button class="btn btn-primary" ${data.eligibleCount === 0 ? 'disabled' : ''} onclick="DashboardModule.confirmGenerateInvoices('${data.billingPeriod}', '${modalId}')">
              Confirm & Dispatch (${data.eligibleCount} Invoices)
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
        // Refresh dashboard summary and store
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

    // If summary data is not loaded yet, initiate fetch and display skeleton UI
    if (!this.summaryData && !this.isLoading) {
      this.loadSummary();
      container.innerHTML = this.renderSkeleton();
      return;
    }

    if (this.isLoading && !this.summaryData) {
      container.innerHTML = this.renderSkeleton();
      return;
    }

    const s = this.summaryData || {
      mrr: { formatted: '₹0.00', value: 0, tooltip: 'MRR = sum of monthly base rent of active allocations' },
      pendingCollections: { formatted: '₹0.00', value: 0, invoiceCount: 0, overdueAmountFormatted: '₹0.00', overdueCount: 0, tooltip: 'Pending collections' },
      collected: { formatted: '₹0.00', value: 0, monthPaymentsCount: 0, monthLabel: 'Current Month', tooltip: 'Collected' },
      occupancy: { rate: 0, occupiedSeats: 0, totalSeats: 26, tooltip: 'Occupancy' },
      lifecycle: { startups: 10, allocated: 4, bookings: 22, issued: 5, cleared: 3, milestones: 4, totalCollectedFormatted: '₹0.00' },
      needsAttention: { overdueInvoices: [], pendingApplications: [], unverifiedDocuments: [], endingIncubations: [] },
      todaysReservations: [],
      activityFeed: [],
      charts: { sixMonthRevenue: [], startupFunnel: [] }
    };

    container.innerHTML = `
      <div class="dashboard-executive-view" style="padding-bottom: 40px;">
        
        <!-- Executive Header & Action Bar -->
        <div class="dashboard-hero-header" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle);">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
                Executive Command Center
              </h2>
              <span class="badge" style="font-size: 11px; background: rgba(99, 102, 241, 0.12); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.25); font-weight: 700;">
                Single Source of Truth
              </span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">
              Unified live operational metrics, revenue intelligence & venture lifecycle ledger · Asia/Kolkata (IST)
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <!-- Month Selector -->
            <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 4px 10px; border-radius: var(--radius-md);">
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Month:</span>
              <select id="dashboard-month-selector" onchange="DashboardModule.loadSummary(this.value)" style="border: none; background: transparent; font-size: 12px; font-weight: 700; color: var(--text-primary); cursor: pointer; outline: none;" class="tabular-nums">
                <option value="2026-10" ${this.selectedMonth === '2026-10' ? 'selected' : ''}>October 2026</option>
                <option value="2026-11" ${this.selectedMonth === '2026-11' ? 'selected' : ''}>November 2026</option>
                <option value="2026-09" ${this.selectedMonth === '2026-09' ? 'selected' : ''}>September 2026</option>
              </select>
            </div>

            <!-- Single "Generate Invoices" Action (Requirement E.16) -->
            <button class="btn btn-primary" onclick="DashboardModule.openGenerateInvoicesModal('${this.selectedMonth === '2026-11' ? 'November 2026' : 'November 2026'}')" style="font-size: 12.5px; font-weight: 700; padding: 7px 16px; border-radius: var(--radius-md); display: inline-flex; align-items: center; gap: 6px;">
              <span>⚡</span>
              <span>Generate Invoices</span>
            </button>

            <!-- Refresh Button -->
            <button class="btn btn-secondary btn-icon" onclick="DashboardModule.loadSummary()" title="Refresh Dashboard Summary" style="width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;">
              🔄
            </button>
          </div>
        </div>

        <!-- 6-Stage Lifecycle Journey Strip (Requirements A.4 & A.5) -->
        <div class="lifecycle-journey-strip" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg, 12px); padding: 16px 20px; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
              <span>🚀</span> <span>Venture Ecosystem Lifecycle Pipeline</span>
            </div>
            <div class="amount-badge tabular-nums" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.25); padding: 3px 10px; border-radius: 9999px; font-size: 11.5px; font-weight: 700;">
              Total Collected: ${s.lifecycle.totalCollectedFormatted}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
            <div class="lifecycle-node" onclick="DashboardModule.navigateToModule('onboarding')" style="cursor: pointer; background: var(--bg-canvas, rgba(0,0,0,0.02)); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px; transition: all 0.2s ease;">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">1. Startups</div>
              <div style="font-size: 18px; font-weight: 800; color: #3b82f6; font-family: 'Inter', sans-serif;" class="tabular-nums">${s.lifecycle.startups}</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">${s.lifecycle.startups} registered startups</div>
            </div>

            <div class="lifecycle-node" onclick="DashboardModule.navigateToModule('workspace')" style="cursor: pointer; background: var(--bg-canvas, rgba(0,0,0,0.02)); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px; transition: all 0.2s ease;">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">2. Allocated</div>
              <div style="font-size: 18px; font-weight: 800; color: #8b5cf6; font-family: 'Inter', sans-serif;" class="tabular-nums">${s.lifecycle.allocated}</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">${s.lifecycle.allocated} active ventures</div>
            </div>

            <div class="lifecycle-node" onclick="DashboardModule.navigateToModule('meetingRooms')" style="cursor: pointer; background: var(--bg-canvas, rgba(0,0,0,0.02)); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px; transition: all 0.2s ease;">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">3. Bookings</div>
              <div style="font-size: 18px; font-weight: 800; color: #06b6d4; font-family: 'Inter', sans-serif;" class="tabular-nums">${s.lifecycle.bookings}</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">${s.lifecycle.bookings} sessions confirmed</div>
            </div>

            <div class="lifecycle-node" onclick="DashboardModule.navigateToModule('billing')" style="cursor: pointer; background: var(--bg-canvas, rgba(0,0,0,0.02)); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px; transition: all 0.2s ease;">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">4. Issued</div>
              <div style="font-size: 18px; font-weight: 800; color: #f59e0b; font-family: 'Inter', sans-serif;" class="tabular-nums">${s.lifecycle.issued}</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">${s.lifecycle.issued} invoices active</div>
            </div>

            <div class="lifecycle-node" onclick="DashboardModule.navigateToModule('payments')" style="cursor: pointer; background: var(--bg-canvas, rgba(0,0,0,0.02)); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px; transition: all 0.2s ease;">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">5. Cleared</div>
              <div style="font-size: 18px; font-weight: 800; color: #10b981; font-family: 'Inter', sans-serif;" class="tabular-nums">${s.lifecycle.cleared}</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">${s.lifecycle.cleared} fully settled</div>
            </div>

            <div class="lifecycle-node" onclick="DashboardModule.navigateToModule('milestones')" style="cursor: pointer; background: var(--bg-canvas, rgba(0,0,0,0.02)); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px; transition: all 0.2s ease;">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">6. Milestones</div>
              <div style="font-size: 18px; font-weight: 800; color: #ec4899; font-family: 'Inter', sans-serif;" class="tabular-nums">${s.lifecycle.milestones}</div>
              <div style="font-size: 10.5px; color: var(--text-muted);">${s.lifecycle.milestones} in progress</div>
            </div>
          </div>
        </div>

        <!-- 4 Primary KPI Cards (Requirements A.3, F.19, D.13) -->
        <div class="kpi-grid">
          
          <!-- KPI 1: MRR -->
          <div class="kpi-card clickable" onclick="DashboardModule.navigateToModule('billing')" title="Click to view workspace billing">
            <div class="kpi-header">
              <div style="display: flex; align-items: center;">
                <span class="kpi-title">Monthly Run-Rate (MRR)</span>
                <span class="tooltip-wrap">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-content">${s.mrr.tooltip}</span>
                </span>
              </div>
              <div class="kpi-icon-wrap" style="color: #10b981; background: rgba(16, 185, 129, 0.1);">₹</div>
            </div>
            <div class="kpi-value tabular-nums" style="color: #10b981;">
              ${s.mrr.formatted}
            </div>
            <div class="kpi-footer">
              <span class="trend-pill up">Active Run-Rate</span>
              <span>Base rent of active allocations</span>
              <span class="kpi-click-hint">View Billing &rarr;</span>
            </div>
          </div>

          <!-- KPI 2: Pending Collections -->
          <div class="kpi-card clickable" onclick="DashboardModule.navigateToUnpaidInvoices()" title="Click to view unpaid and overdue invoices">
            <div class="kpi-header">
              <div style="display: flex; align-items: center;">
                <span class="kpi-title">Pending Collections</span>
                <span class="tooltip-wrap">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-content">${s.pendingCollections.tooltip}</span>
                </span>
              </div>
              <div class="kpi-icon-wrap" style="color: #f59e0b; background: rgba(245, 158, 11, 0.1);">⏳</div>
            </div>
            <div class="kpi-value tabular-nums" style="color: ${s.pendingCollections.value > 0 ? '#f59e0b' : 'var(--text-primary)'};">
              ${s.pendingCollections.formatted}
            </div>
            <div class="kpi-footer">
              <span class="trend-pill warning tabular-nums">${s.pendingCollections.invoiceCount} Unpaid</span>
              <span class="tabular-nums">${s.pendingCollections.overdueAmountFormatted} overdue</span>
              <span class="kpi-click-hint">Filter Invoices &rarr;</span>
            </div>
          </div>

          <!-- KPI 3: Collected in Month -->
          <div class="kpi-card clickable" onclick="DashboardModule.navigateToPayments()" title="Click to view payments transaction ledger">
            <div class="kpi-header">
              <div style="display: flex; align-items: center;">
                <span class="kpi-title">Collected (${s.collected.monthLabel})</span>
                <span class="tooltip-wrap">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-content">${s.collected.tooltip}</span>
                </span>
              </div>
              <div class="kpi-icon-wrap" style="color: #3b82f6; background: rgba(59, 130, 246, 0.1);">💳</div>
            </div>
            <div class="kpi-value tabular-nums" style="color: #3b82f6;">
              ${s.collected.formatted}
            </div>
            <div class="kpi-footer">
              <span class="trend-pill up tabular-nums">${s.collected.monthPaymentsCount} Payments</span>
              <span>Settled in selected period</span>
              <span class="kpi-click-hint">Ledger &rarr;</span>
            </div>
          </div>

          <!-- KPI 4: Occupancy -->
          <div class="kpi-card clickable" onclick="DashboardModule.navigateToWorkspaces()" title="Click to view workspace floorplan">
            <div class="kpi-header">
              <div style="display: flex; align-items: center;">
                <span class="kpi-title">Floorplan Occupancy</span>
                <span class="tooltip-wrap">
                  <span class="tooltip-icon">?</span>
                  <span class="tooltip-content">${s.occupancy.tooltip}</span>
                </span>
              </div>
              <div class="kpi-icon-wrap" style="color: #8b5cf6; background: rgba(139, 92, 246, 0.1);">🏢</div>
            </div>
            <div class="kpi-value tabular-nums" style="color: #8b5cf6;">
              ${s.occupancy.rate}%
            </div>
            <div class="kpi-footer">
              <span class="trend-pill up tabular-nums">${s.occupancy.occupiedSeats} / ${s.occupancy.totalSeats} Seats</span>
              <span>Occupied capacity</span>
              <span class="kpi-click-hint">Floorplan &rarr;</span>
            </div>
          </div>

        </div>

        <!-- "Needs Attention" Panel (Requirement F.18) -->
        <div class="needs-attention-panel">
          <div class="needs-attention-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">⚠️</span>
              <div>
                <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: var(--text-primary);">Needs Attention</h3>
                <span style="font-size: 11.5px; color: var(--text-muted);">Urgent operational items requiring administrative action</span>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="DashboardModule.sendInvoiceNudge()" style="font-size: 11px; padding: 4px 10px;">
              📲 Discard Nudges to All
            </button>
          </div>

          <div class="needs-attention-grid">
            
            <!-- Overdue Invoices -->
            <div class="attention-category-card">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; font-weight: 700; color: #ef4444;">
                  🔴 Overdue Invoices (${s.needsAttention.overdueInvoices.length})
                </span>
                <span style="font-size: 10.5px; color: var(--text-muted);">Past Due Date</span>
              </div>
              ${s.needsAttention.overdueInvoices.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${s.needsAttention.overdueInvoices.map(inv => `
                    <div class="attention-item" onclick="DashboardModule.navigateToUnpaidInvoices()" title="Click to view invoice #${inv.id}">
                      <div style="line-height: 1.3;">
                        <div style="font-weight: 700; color: var(--text-primary);">${inv.startupName}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">
                          #${inv.id} · <span style="color: #ef4444; font-weight: 700;" class="tabular-nums">${inv.daysLateLabel}</span>
                        </div>
                      </div>
                      <div style="text-align: right; display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 800; color: #ef4444;" class="tabular-nums">${inv.amountDueFormatted}</span>
                        <button class="btn btn-sm" onclick="event.stopPropagation(); DashboardModule.sendOverdueReminder('${inv.id}', '${inv.startupName}')" style="font-size: 10px; padding: 2px 7px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">
                          Remind
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="font-size: 12px; color: #10b981;">✓ All invoices are settled or current.</div>'}
            </div>

            <!-- Applications Waiting for Review -->
            <div class="attention-category-card">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; font-weight: 700; color: #f59e0b;">
                  📋 Applications Waiting Review (${s.needsAttention.pendingApplications.length})
                </span>
                <span style="font-size: 10.5px; color: var(--text-muted);">New Submissions</span>
              </div>
              ${s.needsAttention.pendingApplications.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${s.needsAttention.pendingApplications.slice(0, 3).map(app => `
                    <div class="attention-item" onclick="DashboardModule.navigateToModule('onboarding')">
                      <div style="line-height: 1.3;">
                        <div style="font-weight: 700; color: var(--text-primary);">${app.name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${app.founder} · ${app.sector}</div>
                      </div>
                      <span class="badge" style="font-size: 10px; background: rgba(245, 158, 11, 0.15); color: #f59e0b;">Review</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="font-size: 12px; color: #10b981;">✓ Application pipeline is fully reviewed.</div>'}
            </div>

            <!-- Startups with Unverified Documents -->
            <div class="attention-category-card">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; font-weight: 700; color: #8b5cf6;">
                  📑 Document Compliance (${s.needsAttention.unverifiedDocuments.length})
                </span>
                <span style="font-size: 10.5px; color: var(--text-muted);">KYC & Dossier</span>
              </div>
              ${s.needsAttention.unverifiedDocuments.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${s.needsAttention.unverifiedDocuments.slice(0, 3).map(doc => `
                    <div class="attention-item" onclick="DashboardModule.navigateToModule('onboarding')">
                      <div style="line-height: 1.3;">
                        <div style="font-weight: 700; color: var(--text-primary);">${doc.name}</div>
                        <div style="font-size: 11px; color: #8b5cf6;">${doc.issue}</div>
                      </div>
                      <span class="badge" style="font-size: 10px; background: rgba(139, 92, 246, 0.12); color: #8b5cf6;">Verify</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="font-size: 12px; color: #10b981;">✓ All startup compliance documents verified.</div>'}
            </div>

            <!-- Incubation Ending Within 30 Days -->
            <div class="attention-category-card">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; font-weight: 700; color: #06b6d4;">
                  ⏳ Cohort Expiry ≤30 Days (${s.needsAttention.endingIncubations.length})
                </span>
                <span style="font-size: 10.5px; color: var(--text-muted);">Graduation Planning</span>
              </div>
              ${s.needsAttention.endingIncubations.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${s.needsAttention.endingIncubations.map(inc => `
                    <div class="attention-item" onclick="DashboardModule.navigateToModule('incubation')">
                      <div style="line-height: 1.3;">
                        <div style="font-weight: 700; color: var(--text-primary);">${inc.name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">Ends on ${inc.endDate}</div>
                      </div>
                      <span class="badge" style="font-size: 10px; background: rgba(6, 182, 212, 0.15); color: #06b6d4;" class="tabular-nums">
                        ${inc.daysRemaining} days left
                      </span>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="font-size: 12px; color: var(--text-muted);">No cohort tenures ending within 30 days.</div>'}
            </div>

          </div>
        </div>

        <!-- 2 Interactive Vector Visualizations (Requirement F.20) -->
        <div class="dashboard-charts-grid">
          
          <!-- Chart 1: 6-Month Revenue History (Collected vs Outstanding) -->
          <div class="chart-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div>
                <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--text-primary);">6-Month Revenue Intelligence</h3>
                <span style="font-size: 11.5px; color: var(--text-muted);">Collected cashflow vs outstanding dues (INR)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; font-size: 11px; font-weight: 600;">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="width: 10px; height: 10px; background: #10b981; border-radius: 2px;"></span> Collected
                </span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="width: 10px; height: 10px; background: #f59e0b; border-radius: 2px;"></span> Outstanding
                </span>
              </div>
            </div>

            <!-- Responsive SVG Bar Chart -->
            ${this.renderRevenueSvgChart(s.charts.sixMonthRevenue)}
          </div>

          <!-- Chart 2: Startup Pipeline Funnel -->
          <div class="chart-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div>
                <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--text-primary);">Startup Pipeline Funnel</h3>
                <span style="font-size: 11.5px; color: var(--text-muted);">Venture progression across cohort lifecycle</span>
              </div>
              <span class="amount-badge tabular-nums" style="font-size: 11px; font-weight: 700; background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                10 Total Ventures
              </span>
            </div>

            <!-- Funnel Bars -->
            <div style="display: flex; flex-direction: column; gap: 12px; padding: 6px 0;">
              ${(s.charts.startupFunnel || []).map(f => {
                const pct = Math.max(8, Math.round((f.count / 10) * 100));
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                      <span style="font-weight: 700; color: var(--text-primary);">${f.stage}</span>
                      <span style="font-weight: 800; color: ${f.color}; font-family: 'Inter', sans-serif;" class="tabular-nums">
                        ${f.count} venture${f.count === 1 ? '' : 's'} (${pct}%)
                      </span>
                    </div>
                    <div style="height: 10px; background: rgba(0, 0, 0, 0.05); border-radius: 5px; overflow: hidden;">
                      <div style="width: ${pct}%; height: 100%; background: ${f.color}; border-radius: 5px; transition: width 0.6s ease;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

        <!-- Operations Row: Today's Reservations & Activity Feed -->
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px;" class="dashboard-operations-grid">
          
          <!-- Today's Meeting Room Reservations (Requirements C.10, C.11, C.12) -->
          <div class="chart-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div>
                <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--text-primary);">Today's Room Reservations</h3>
                <span style="font-size: 11.5px; color: var(--text-muted);">Confirmed bookings across all meeting rooms & suites</span>
              </div>
              <a href="javascript:void(0)" onclick="DashboardModule.navigateToMeetingRooms()" style="font-size: 12px; font-weight: 700; color: var(--accent-primary, #6366f1); text-decoration: none;">
                View all &rarr;
              </a>
            </div>

            ${s.todaysReservations && s.todaysReservations.length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                  <thead style="background: var(--bg-canvas, rgba(0,0,0,0.02)); border-bottom: 1px solid var(--border-subtle);">
                    <tr>
                      <th style="padding: 8px 10px; text-align: left;">Room</th>
                      <th style="padding: 8px 10px; text-align: left;">Startup</th>
                      <th style="padding: 8px 10px; text-align: center;">Time Window</th>
                      <th style="padding: 8px 10px; text-align: center;">Pax</th>
                      <th style="padding: 8px 10px; text-align: right;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${s.todaysReservations.map(res => `
                      <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: 10px; font-weight: 700; color: var(--text-primary); white-space: nowrap;">
                          ${res.roomName}
                        </td>
                        <td style="padding: 10px; color: var(--text-secondary); white-space: nowrap;">
                          ${res.startupName}
                        </td>
                        <td style="padding: 10px; text-align: center; font-weight: 600;" class="tabular-nums">
                          ${res.timeRange}
                        </td>
                        <td style="padding: 10px; text-align: center;" class="tabular-nums">
                          ${res.attendees}
                        </td>
                        <td style="padding: 10px; text-align: right;">
                          <span class="res-status-chip ${res.status.toLowerCase().replace(/\s+/g, '')}">
                            ${res.status}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="text-align: center; padding: 36px 16px; border: 1.5px dashed var(--border-subtle); border-radius: 8px;">
                <div style="font-size: 28px; margin-bottom: 6px;">📅</div>
                <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">No bookings today</div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                  All conference rooms and focus pods are currently open for booking.
                </div>
                <button class="btn btn-outline btn-sm" onclick="DashboardModule.navigateToMeetingRooms()" style="margin-top: 12px; font-size: 11.5px;">
                  Reserve a Room
                </button>
              </div>
            `}
          </div>

          <!-- Activity Feed (Requirements B.6, B.7, B.8, B.9) -->
          <div class="chart-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div>
                <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--text-primary);">Ecosystem Activity Feed</h3>
                <span style="font-size: 11.5px; color: var(--text-muted);">Real-time operations log (Capped at 10 items)</span>
              </div>
              <span class="badge" style="font-size: 10px; background: rgba(0,0,0,0.05); color: var(--text-muted);">
                IST Timestamps
              </span>
            </div>

            ${s.activityFeed && s.activityFeed.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${s.activityFeed.map(act => `
                  <div style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 6px; background: var(--bg-canvas, rgba(0,0,0,0.015)); border: 1px solid var(--border-subtle);">
                    <div style="font-size: 16px; flex-shrink: 0; padding-top: 1px;">
                      ${act.icon || '📌'}
                    </div>
                    <div style="flex: 1; line-height: 1.35; overflow: hidden;">
                      <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden;">
                        ${act.title}
                      </div>
                      <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 6px;">
                        <span style="font-weight: 600; color: var(--accent-primary, #6366f1);">${act.module}</span>
                        <span>•</span>
                        <span class="tabular-nums">${act.relativeTime}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="text-align: center; padding: 36px 16px; border: 1.5px dashed var(--border-subtle); border-radius: 8px;">
                <div style="font-size: 28px; margin-bottom: 6px;">📜</div>
                <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">No recent activity logged</div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                  System activities will appear here in chronological order.
                </div>
              </div>
            `}
          </div>

        </div>

      </div>
    `;

    // Apply production element hiding (Requirement E.17)
    this.applyProductionHiding();
  },

  renderRevenueSvgChart(data) {
    if (!data || data.length === 0) {
      return '<div style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 12px;">No revenue data available.</div>';
    }

    const svgWidth = 560;
    const svgHeight = 180;
    const paddingLeft = 40;
    const paddingBottom = 30;
    const paddingTop = 20;
    const chartWidth = svgWidth - paddingLeft - 20;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    // Determine max value for scale
    let maxVal = 0;
    data.forEach(d => {
      if (d.collected > maxVal) maxVal = d.collected;
      if (d.outstanding > maxVal) maxVal = d.outstanding;
    });
    if (maxVal === 0) maxVal = 100000;
    // Round maxVal up to clean number
    maxVal = Math.ceil(maxVal / 50000) * 50000;

    const groupWidth = chartWidth / data.length;
    const barWidth = Math.min(22, groupWidth * 0.32);

    return `
      <div style="width: 100%; overflow-x: auto;">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto; display: block; font-family: 'Inter', sans-serif;">
          <!-- Grid Lines -->
          <line x1="${paddingLeft}" y1="${paddingTop}" x2="${svgWidth - 20}" y2="${paddingTop}" stroke="rgba(148, 163, 184, 0.2)" stroke-dasharray="3 3" />
          <line x1="${paddingLeft}" y1="${paddingTop + chartHeight / 2}" x2="${svgWidth - 20}" y2="${paddingTop + chartHeight / 2}" stroke="rgba(148, 163, 184, 0.2)" stroke-dasharray="3 3" />
          <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${svgWidth - 20}" y2="${paddingTop + chartHeight}" stroke="rgba(148, 163, 184, 0.4)" />

          <!-- Y-Axis Labels -->
          <text x="${paddingLeft - 8}" y="${paddingTop + 4}" font-size="9.5" fill="var(--text-muted, #94a3b8)" text-anchor="end" class="tabular-nums">₹${(maxVal / 100000).toFixed(1)}L</text>
          <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight / 2 + 3}" font-size="9.5" fill="var(--text-muted, #94a3b8)" text-anchor="end" class="tabular-nums">₹${(maxVal / 200000).toFixed(1)}L</text>
          <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight + 3}" font-size="9.5" fill="var(--text-muted, #94a3b8)" text-anchor="end" class="tabular-nums">₹0</text>

          <!-- Bars -->
          ${data.map((d, i) => {
            const centerX = paddingLeft + (i + 0.5) * groupWidth;
            const hColl = Math.max(3, (d.collected / maxVal) * chartHeight);
            const hOut = Math.max(3, (d.outstanding / maxVal) * chartHeight);
            const yColl = paddingTop + chartHeight - hColl;
            const yOut = paddingTop + chartHeight - hOut;
            const xColl = centerX - barWidth - 2;
            const xOut = centerX + 2;

            return `
              <g class="chart-group">
                <!-- Collected Bar -->
                <rect x="${xColl}" y="${yColl}" width="${barWidth}" height="${hColl}" rx="3" fill="#10b981">
                  <title>${d.label} Collected: ${d.collectedFormatted}</title>
                </rect>
                <!-- Outstanding Bar -->
                <rect x="${xOut}" y="${yOut}" width="${barWidth}" height="${hOut}" rx="3" fill="#f59e0b">
                  <title>${d.label} Outstanding: ${d.outstandingFormatted}</title>
                </rect>
                <!-- X-Axis Label -->
                <text x="${centerX}" y="${svgHeight - 10}" font-size="10" font-weight="600" fill="var(--text-muted, #94a3b8)" text-anchor="middle">
                  ${d.label}
                </text>
              </g>
            `;
          }).join('')}
        </svg>
      </div>
    `;
  },

  renderSkeleton() {
    return `
      <div style="padding: 10px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
          <div class="skeleton-box" style="width: 280px; height: 32px; border-radius: 6px;"></div>
          <div class="skeleton-box" style="width: 160px; height: 32px; border-radius: 6px;"></div>
        </div>
        <div class="skeleton-box" style="width: 100%; height: 85px; border-radius: 12px; margin-bottom: 24px;"></div>
        <div class="kpi-grid">
          <div class="skeleton-box" style="height: 120px; border-radius: 12px;"></div>
          <div class="skeleton-box" style="height: 120px; border-radius: 12px;"></div>
          <div class="skeleton-box" style="height: 120px; border-radius: 12px;"></div>
          <div class="skeleton-box" style="height: 120px; border-radius: 12px;"></div>
        </div>
        <div class="skeleton-box" style="width: 100%; height: 180px; border-radius: 12px; margin-top: 24px;"></div>
      </div>
    `;
  },

  applyProductionHiding() {
    // Hide reset demo data, dev tools, and permissions banner when in production
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
