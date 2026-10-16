// Module: 5. Automatic Invoice Generation System
// Handles: Monthly Rent Invoices, Meeting Room Invoices, Combined Invoices, PDF Print

const InvoiceModule = {

  // ─── Public Entry Points ───────────────────────────────────────────────────

  /**
   * Open the invoice generator wizard for a startup
   * type: 'rent' | 'meeting' | 'combined'
   */
  openGenerator(startupId, type = 'combined') {
    const startup = window.store.getStartupById(startupId);
    if (!startup) { App.showToast('Startup not found.', 'danger'); return; }
    this._renderGeneratorModal(startup, type);
  },

  /**
   * View an already-existing invoice by ID (full PDF-quality view)
   */
  viewInvoice(invoiceId) {
    const inv = window.store.getInvoiceById(invoiceId);
    if (!inv) { App.showToast('Invoice not found.', 'danger'); return; }
    this._renderInvoiceViewModal(inv);
  },

  /**
   * Open generator directly from a rent record
   */
  generateFromRentRecord(rentRecordId) {
    const rent = window.store.getRentRecordById(rentRecordId);
    if (!rent) { App.showToast('Rent record not found.', 'danger'); return; }

    // If already has an invoice, just view it
    if (rent.invoiceId) {
      this.viewInvoice(rent.invoiceId);
      return;
    }

    const startup = window.store.getStartupById(rent.startupId);
    if (!startup) { App.showToast('Startup not found.', 'danger'); return; }
    this._renderGeneratorModal(startup, 'combined', rent);
  },

  // ─── Generator Modal ───────────────────────────────────────────────────────

  _renderGeneratorModal(startup, defaultType = 'combined', prefillRent = null) {
    const hub = window.store.state.hubInfo;
    const billingPeriod = 'October 2026';
    const billing = window.store.calculateStartupMonthlyBilling(startup.id);
    const maintenanceFee = 2000; // Standard maintenance charge

    const workspaceRent = billing ? billing.subtotal : (prefillRent ? prefillRent.rent : 0);
    const addOnsTotal = billing ? (billing.lineItems.filter(l => l.desc.toLowerCase().includes('maintenance') || l.desc.toLowerCase().includes('add')).reduce((s,l) => s + l.amount, 0)) : 0;
    const gstRatePercent = 18;

    // Meeting room charges for this startup this month
    const meetingRoomCharges = this._getMeetingRoomCharges(startup.id);

    const html = `
      <div class="modal-overlay active" id="modal-invoice-generator">
        <div class="modal-content modal-wide" style="max-width: 900px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #03003a, #0c076e); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🧾</div>
              <div>
                <h3 class="modal-title">Automatic Invoice Generator</h3>
                <span style="font-size: 12px; color: var(--text-muted);">Stage 5 of Lifecycle • GST Compliant • PDF Ready</span>
              </div>
            </div>
            <button class="modal-close-btn" onclick="InvoiceModule.closeModal('modal-invoice-generator')">×</button>
          </div>

          <div class="modal-body" style="padding: 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 480px;">

              <!-- LEFT: Configuration Panel -->
              <div style="padding: 26px 28px; border-right: 1px solid var(--border-subtle); background: var(--bg-surface);">

                <!-- Startup Info -->
                <div style="display: flex; gap: 14px; align-items: center; padding: 14px; background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-medium); margin-bottom: 22px;">
                  <span style="font-size: 32px;">${startup.logoEmoji || '🚀'}</span>
                  <div>
                    <div style="font-weight: 800; font-size: 15px; color: var(--text-primary);">${startup.name}</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">GSTIN: <strong style="color: var(--accent-primary); font-family: var(--font-mono);">${startup.gstin || 'Not Provided'}</strong></div>
                    <div style="font-size: 11px; color: var(--text-muted);">Reg: ${startup.registrationNumber || 'N/A'} • ${startup.category}</div>
                  </div>
                </div>

                <!-- Invoice Type Selector -->
                <div style="margin-bottom: 20px;">
                  <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Invoice Type</label>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                    <button id="invtype-combined" class="inv-type-btn ${defaultType==='combined'?'active':''}" onclick="InvoiceModule._switchType('combined')">
                      <span style="font-size: 16px;">🧾</span>
                      <span style="font-size: 11px; font-weight: 700; display: block; margin-top: 2px;">Full Invoice</span>
                      <span style="font-size: 10px; color: var(--text-muted);">Rent + Rooms</span>
                    </button>
                    <button id="invtype-rent" class="inv-type-btn ${defaultType==='rent'?'active':''}" onclick="InvoiceModule._switchType('rent')">
                      <span style="font-size: 16px;">🏢</span>
                      <span style="font-size: 11px; font-weight: 700; display: block; margin-top: 2px;">Rent Only</span>
                      <span style="font-size: 10px; color: var(--text-muted);">Monthly Workspace</span>
                    </button>
                    <button id="invtype-meeting" class="inv-type-btn ${defaultType==='meeting'?'active':''}" onclick="InvoiceModule._switchType('meeting')">
                      <span style="font-size: 16px;">📅</span>
                      <span style="font-size: 11px; font-weight: 700; display: block; margin-top: 2px;">Rooms Only</span>
                      <span style="font-size: 10px; color: var(--text-muted);">Meeting Charges</span>
                    </button>
                  </div>
                </div>

                <!-- Billing Period -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label" style="font-size: 11px;">Billing Period</label>
                  <select class="form-control" id="inv-billing-period" style="font-size: 13px;">
                    <option selected>October 2026</option>
                    <option>September 2026</option>
                    <option>November 2026</option>
                  </select>
                </div>

                <!-- Due Date -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label" style="font-size: 11px;">Payment Due Date</label>
                  <input type="date" id="inv-due-date" class="form-control" style="font-size: 13px;" value="2026-10-05">
                </div>

                <!-- Maintenance Toggle -->
                <div id="inv-section-rent" style="margin-bottom: 20px; ${defaultType==='meeting'?'display:none;':''}">
                  <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Rent Add-ons</label>
                  <div style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                    <input type="checkbox" id="inv-maintenance" checked style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent-primary);">
                    <label for="inv-maintenance" style="font-size: 13px; color: var(--text-primary); cursor: pointer; flex: 1;">
                      Include Maintenance Charges
                      <span style="font-size: 11px; color: var(--text-muted); display: block;">₹2,000/month (Common Area + Utilities)</span>
                    </label>
                    <input type="checkbox" id="inv-security" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent-primary);">
                    <label for="inv-security" style="font-size: 13px; color: var(--text-primary); cursor: pointer;">
                      Security
                      <span style="font-size: 11px; color: var(--text-muted); display: block;">₹1,500</span>
                    </label>
                  </div>
                </div>

                <!-- Meeting Room Summary -->
                <div id="inv-section-meeting" style="${defaultType==='rent'?'display:none;':''}">
                  <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Meeting Room Charges This Month</label>
                  ${meetingRoomCharges.length > 0 ? `
                    <div style="background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); overflow: hidden;">
                      ${meetingRoomCharges.map(c => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle);">
                          <div>
                            <div style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${c.roomName}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">${c.hours} hrs × ₹${c.rate}/hr</div>
                          </div>
                          <strong style="font-family: var(--font-mono); color: ${c.amount > 0 ? 'var(--text-primary)' : 'var(--status-success)'}; font-size: 13px;">
                            ${c.amount > 0 ? '₹' + c.amount.toLocaleString('en-IN') : '0 (Credit)'}
                          </strong>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div style="text-align: center; padding: 14px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-muted);">
                      No billable meeting room usage this month<br><span style="font-size: 10.5px;">All hours within included credit quota (${startup.includedMeetingHours || 12} hrs/mo)</span>
                    </div>
                  `}
                </div>
              </div>

              <!-- RIGHT: Live Invoice Preview -->
              <div style="padding: 26px 28px; background: #f8fafc;" id="inv-preview-panel">
                ${this._buildPreviewHTML(startup, billing, maintenanceFee, meetingRoomCharges, defaultType, hub)}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="InvoiceModule.closeModal('modal-invoice-generator')">Cancel</button>
            <button class="btn btn-outline" onclick="InvoiceModule._previewAndPrint('${startup.id}')">
              🖨️ Preview & Print PDF
            </button>
            <button class="btn btn-primary" onclick="InvoiceModule._confirmGenerate('${startup.id}')">
              ⚡ Generate & Save Invoice
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;

    // Store refs for live updates
    this._currentStartupId = startup.id;
    this._currentBilling = billing;
    this._currentMeetingCharges = meetingRoomCharges;
    this._currentHub = hub;
    this._currentMaintenanceFee = maintenanceFee;

    // Wire up change listeners for live preview
    setTimeout(() => {
      const maintCb = document.getElementById('inv-maintenance');
      const secCb = document.getElementById('inv-security');
      const periodSel = document.getElementById('inv-billing-period');
      if (maintCb) maintCb.addEventListener('change', () => this._updatePreview());
      if (secCb) secCb.addEventListener('change', () => this._updatePreview());
      if (periodSel) periodSel.addEventListener('change', () => this._updatePreview());
    }, 100);
  },

  _switchType(type) {
    this._currentType = type;
    const btns = ['combined', 'rent', 'meeting'];
    btns.forEach(t => {
      const btn = document.getElementById(`invtype-${t}`);
      if (btn) btn.classList.toggle('active', t === type);
    });

    const rentSec = document.getElementById('inv-section-rent');
    const meetSec = document.getElementById('inv-section-meeting');
    if (rentSec) rentSec.style.display = (type === 'meeting') ? 'none' : '';
    if (meetSec) meetSec.style.display = (type === 'rent') ? 'none' : '';

    this._updatePreview();
  },

  _updatePreview() {
    const panel = document.getElementById('inv-preview-panel');
    if (!panel) return;
    const startup = window.store.getStartupById(this._currentStartupId);
    if (!startup) return;
    panel.innerHTML = this._buildPreviewHTML(
      startup,
      this._currentBilling,
      this._currentMaintenanceFee,
      this._currentMeetingCharges,
      this._currentType || 'combined',
      this._currentHub
    );
  },

  _buildPreviewHTML(startup, billing, maintenanceFee, meetingRoomCharges, type, hub) {
    const inclMaint = document.getElementById('inv-maintenance') ? document.getElementById('inv-maintenance').checked : true;
    const inclSec = document.getElementById('inv-security') ? document.getElementById('inv-security').checked : false;
    const period = document.getElementById('inv-billing-period') ? document.getElementById('inv-billing-period').value : 'October 2026';
    const dueDate = document.getElementById('inv-due-date') ? document.getElementById('inv-due-date').value : '2026-10-05';

    const lineItems = [];

    // --- Workspace Rent Section ---
    if (type !== 'meeting' && billing && billing.lineItems.length > 0) {
      billing.lineItems.forEach(li => {
        lineItems.push({ section: 'Workspace Rent', ...li });
      });
    } else if (type !== 'meeting') {
      lineItems.push({ section: 'Workspace Rent', desc: 'Workspace Monthly License', qty: 1, rate: 25000, amount: 25000 });
    }

    // --- Maintenance ---
    if (type !== 'meeting' && inclMaint) {
      lineItems.push({ section: 'Facilities', desc: 'Common Area Maintenance & Utilities', qty: 1, rate: maintenanceFee, amount: maintenanceFee });
    }
    if (type !== 'meeting' && inclSec) {
      lineItems.push({ section: 'Facilities', desc: 'Building Security & CCTV Monitoring', qty: 1, rate: 1500, amount: 1500 });
    }

    // --- Meeting Room Charges ---
    if (type !== 'rent') {
      meetingRoomCharges.filter(c => c.amount > 0).forEach(c => {
        lineItems.push({
          section: 'Meeting Rooms',
          desc: `${c.roomName} — ${c.hours} hrs × ₹${c.rate}/hr`,
          qty: c.hours,
          rate: c.rate,
          amount: c.amount
        });
      });
    }

    const subtotal = lineItems.reduce((s, l) => s + l.amount, 0);
    const subsidyPct = billing ? (billing.subsidyPercent || 0) : 0;
    const subsidyDeduction = Math.round((subtotal * subsidyPct) / 100);
    const taxableAmount = Math.max(0, subtotal - subsidyDeduction);
    const cgst = Math.round((taxableAmount * 9) / 100);
    const sgst = Math.round((taxableAmount * 9) / 100);
    const totalGst = cgst + sgst;
    const grandTotal = taxableAmount + totalGst;

    const invNumber = `INV-2026-PRV`;
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const dueDateFmt = new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Group line items by section
    const sections = {};
    lineItems.forEach(li => {
      if (!sections[li.section]) sections[li.section] = [];
      sections[li.section].push(li);
    });

    return `
      <div style="background: #ffffff; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); overflow: hidden; font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #1e293b;">

        <!-- Invoice Header -->
        <div style="background: linear-gradient(135deg, #03003a, #0c076e); padding: 20px 24px; color: white;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 9px; font-weight: 700; letter-spacing: 2px; opacity: 0.8; text-transform: uppercase;">TAX INVOICE</div>
              <div style="font-size: 18px; font-weight: 900; margin-top: 2px;">${hub ? hub.name : 'Nexus Co-Working Hub'}</div>
              <div style="font-size: 10px; opacity: 0.85; margin-top: 3px;">${hub ? hub.address : ''}</div>
              <div style="font-size: 10px; opacity: 0.85; margin-top: 1px;">GSTIN: <strong>${hub ? hub.gstin : ''}</strong> | PAN: <strong>${hub ? hub.pan : ''}</strong></div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Invoice Number</div>
              <div style="font-size: 16px; font-weight: 800; font-family: var(--font-mono); margin-top: 1px;">#${invNumber}</div>
              <div style="font-size: 10px; opacity: 0.8; margin-top: 6px;">Issue: <strong>${today}</strong></div>
              <div style="font-size: 10px; opacity: 0.8;">Period: <strong>${period}</strong></div>
            </div>
          </div>
        </div>

        <!-- Billed To / Invoice Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #e2e8f0;">
          <div style="padding: 14px 20px; border-right: 1px solid #e2e8f0;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 6px;">Billed To</div>
            <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${startup.name}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">${startup.founders ? startup.founders.name : ''} (${startup.founders ? startup.founders.role : 'Founder'})</div>
            <div style="font-size: 11px; color: #475569; margin-top: 1px;">GSTIN: <strong style="font-family: var(--font-mono); font-size: 10.5px;">${startup.gstin || 'N/A'}</strong></div>
            <div style="font-size: 11px; color: #475569;">Reg: ${startup.registrationNumber || 'N/A'}</div>
          </div>
          <div style="padding: 14px 20px; background: #f8fafc;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 6px;">Invoice Details</div>
            <div style="font-size: 11px; color: #475569;"><span style="color: #94a3b8;">Invoice Date:</span> <strong>${today}</strong></div>
            <div style="font-size: 11px; color: #475569;"><span style="color: #94a3b8;">Due Date:</span> <strong style="color: #ef4444;">${dueDateFmt}</strong></div>
            <div style="font-size: 11px; color: #475569;"><span style="color: #94a3b8;">Terms:</span> <strong>Net 5 Days</strong></div>
            <div style="font-size: 11px; color: #475569;"><span style="color: #94a3b8;">Status:</span> <strong style="color: #f59e0b;">ISSUED — PAYMENT DUE</strong></div>
          </div>
        </div>

        <!-- Line Items -->
        <div style="padding: 16px 20px;">
          ${Object.entries(sections).map(([sectionName, items]) => `
            <!-- Section: ${sectionName} -->
            <div style="margin-bottom: 12px;">
              <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 4px; margin-bottom: 6px;">
                ${sectionName === 'Workspace Rent' ? '🏢' : sectionName === 'Facilities' ? '🔧' : '📅'} ${sectionName}
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="text-align: left; padding: 5px 8px; color: #64748b; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Description</th>
                    <th style="text-align: center; padding: 5px 8px; color: #64748b; font-weight: 600; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Qty/Hrs</th>
                    <th style="text-align: right; padding: 5px 8px; color: #64748b; font-weight: 600; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Rate (₹)</th>
                    <th style="text-align: right; padding: 5px 8px; color: #64748b; font-weight: 600; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((item, i) => `
                    <tr style="background: ${i % 2 === 1 ? '#f8fafc' : '#fff'};">
                      <td style="padding: 6px 8px; color: #334155; font-weight: 500;">${item.desc}</td>
                      <td style="padding: 6px 8px; text-align: center; color: #64748b;">${item.qty}</td>
                      <td style="padding: 6px 8px; text-align: right; font-family: var(--font-sans); font-variant-numeric: tabular-nums; color: #475569;">₹${Number(item.rate).toLocaleString('en-IN')}</td>
                      <td style="padding: 6px 8px; text-align: right; font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-weight: 700; color: #1e293b;">₹${Number(item.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>

        <!-- Totals Summary -->
        <div style="display: grid; grid-template-columns: 1fr 280px; gap: 0; border-top: 2px solid #e2e8f0;">
          <!-- Bank / UPI -->
          <div style="padding: 14px 20px; background: #f8fafc; border-right: 1px solid #e2e8f0;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 6px;">Payment Details</div>
            <div style="font-size: 10.5px; color: #475569; line-height: 1.6;">
              Bank: <strong style="color: #1e293b;">${hub ? hub.bankName : ''}</strong><br>
              A/c: <strong style="font-family: var(--font-mono);">${hub ? hub.accountNumber : ''}</strong> | IFSC: <strong style="font-family: var(--font-mono);">${hub ? hub.ifsc : ''}</strong><br>
              UPI: <strong style="color: #4338ca;">${hub ? hub.upiId : ''}</strong>
            </div>
          </div>

          <!-- GST Totals -->
          <div style="padding: 14px 20px;">
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #64748b;">
              <span>Subtotal</span><span style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-weight: 600; color: #1e293b;">₹${subtotal.toLocaleString('en-IN')}</span>
            </div>
            ${subsidyDeduction > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #16a34a;">
              <span>Grant Subsidy (${subsidyPct}%)</span><span style="font-family: var(--font-sans); font-variant-numeric: tabular-nums;">-₹${subsidyDeduction.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; margin-top: 4px; padding-top: 6px;">
              <span>Taxable Value</span><span style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; color: #1e293b;">₹${taxableAmount.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #64748b;">
              <span>CGST @ 9%</span><span style="font-family: var(--font-sans); font-variant-numeric: tabular-nums;">₹${cgst.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #64748b;">
              <span>SGST @ 9%</span><span style="font-family: var(--font-sans); font-variant-numeric: tabular-nums;">₹${sgst.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: linear-gradient(135deg, #03003a, #0c076e); border-radius: 8px; margin-top: 8px;">
              <span style="font-weight: 800; font-size: 13px; color: white;">TOTAL DUE</span>
              <span style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-weight: 800; font-size: 17px; color: white; letter-spacing: -0.02em;">₹${grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <div style="padding: 10px 20px; background: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #94a3b8; text-align: center;">
          This is a computer-generated Tax Invoice. No signature required. For queries: ${hub ? hub.email : ''} | ${hub ? hub.phone : ''}
        </div>
      </div>
    `;
  },

  // ─── Meeting Room Charges Helper ───────────────────────────────────────────

  _getMeetingRoomCharges(startupId) {
    const rooms = window.store.getMeetingRooms();
    const charges = [];
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    rooms.forEach(room => {
      (room.bookings || []).forEach(bkg => {
        if (bkg.startupId === startupId && bkg.status !== 'Cancelled' && bkg.date && bkg.date.startsWith(monthStr)) {
          const startH = parseFloat(bkg.startTime.split(':')[0]) + parseFloat(bkg.startTime.split(':')[1]) / 60;
          const endH = parseFloat(bkg.endTime.split(':')[0]) + parseFloat(bkg.endTime.split(':')[1]) / 60;
          const hours = Math.max(0.5, endH - startH);
          charges.push({
            roomName: room.name,
            hours,
            rate: room.hourlyRate,
            amount: bkg.cost || 0,
            bookingId: bkg.id
          });
        }
      });
    });

    // Fallback: include past bookings for the startup if no current month
    if (charges.length === 0) {
      rooms.forEach(room => {
        (room.bookings || []).filter(b => b.startupId === startupId && b.status !== 'Cancelled' && b.cost > 0).forEach(bkg => {
          const startH = parseFloat(bkg.startTime.split(':')[0]) + parseFloat(bkg.startTime.split(':')[1]) / 60;
          const endH = parseFloat(bkg.endTime.split(':')[0]) + parseFloat(bkg.endTime.split(':')[1]) / 60;
          const hours = Math.max(0.5, endH - startH);
          charges.push({
            roomName: room.name,
            hours,
            rate: room.hourlyRate,
            amount: bkg.cost,
            bookingId: bkg.id
          });
        });
      });
    }

    return charges;
  },

  // ─── PDF Print ─────────────────────────────────────────────────────────────

  _previewAndPrint(startupId) {
    const startup = window.store.getStartupById(startupId);
    if (!startup) return;

    const billing = window.store.calculateStartupMonthlyBilling(startupId);
    const hub = window.store.state.hubInfo;
    const meetingCharges = this._getMeetingRoomCharges(startupId);
    const type = this._currentType || 'combined';
    const inclMaint = document.getElementById('inv-maintenance')?.checked ?? true;
    const inclSec = document.getElementById('inv-security')?.checked ?? false;
    const period = document.getElementById('inv-billing-period')?.value || 'October 2026';
    const dueDate = document.getElementById('inv-due-date')?.value || '2026-10-05';

    const invoiceHTML = this._buildFullPrintHTML(startup, billing, hub, meetingCharges, type, inclMaint, inclSec, period, dueDate);
    const printWin = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    printWin.document.write(invoiceHTML);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  },

  _buildFullPrintHTML(startup, billing, hub, meetingCharges, type, inclMaint, inclSec, period, dueDateStr) {
    const lineItems = [];

    if (type !== 'meeting' && billing) {
      billing.lineItems.forEach(li => lineItems.push({ section: 'Workspace Rent', ...li }));
    }
    if (type !== 'meeting' && inclMaint) {
      lineItems.push({ section: 'Facilities', desc: 'Common Area Maintenance & Utilities', qty: 1, rate: 2000, amount: 2000 });
    }
    if (type !== 'meeting' && inclSec) {
      lineItems.push({ section: 'Facilities', desc: 'Building Security & CCTV Monitoring', qty: 1, rate: 1500, amount: 1500 });
    }
    if (type !== 'rent') {
      meetingCharges.filter(c => c.amount > 0).forEach(c => {
        lineItems.push({ section: 'Meeting Rooms', desc: `${c.roomName} — ${c.hours} hrs × ₹${c.rate}/hr`, qty: c.hours, rate: c.rate, amount: c.amount });
      });
    }

    const subtotal = lineItems.reduce((s, l) => s + l.amount, 0);
    const subsidyPct = billing ? (billing.subsidyPercent || 0) : 0;
    const subsidyDeduction = Math.round((subtotal * subsidyPct) / 100);
    const taxableAmount = Math.max(0, subtotal - subsidyDeduction);
    const cgst = Math.round((taxableAmount * 9) / 100);
    const sgst = Math.round((taxableAmount * 9) / 100);
    const grandTotal = taxableAmount + cgst + sgst;

    const invNumber = `INV-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const dueFormatted = new Date(dueDateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const sections = {};
    lineItems.forEach(li => {
      if (!sections[li.section]) sections[li.section] = [];
      sections[li.section].push(li);
    });

    const numberToWords = (num) => {
      const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (num === 0) return 'Zero';
      if (num < 20) return units[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + units[num % 10] : '');
      if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
      if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
      if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
      return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
    };

    const amountInWords = `${numberToWords(Math.floor(grandTotal))} Rupees Only`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice ${invNumber} — ${startup.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 20px; }
    .inv-header { background: linear-gradient(135deg, #03003a, #0c076e); color: white; padding: 24px 28px; display: flex; justify-content: space-between; align-items: flex-start; }
    .inv-header h1 { font-size: 20px; font-weight: 900; margin-top: 4px; }
    .inv-header .label { font-size: 8px; font-weight: 700; letter-spacing: 2px; opacity: 0.8; text-transform: uppercase; }
    .inv-header .inv-no { font-size: 18px; font-weight: 800; font-family: "JetBrains Mono", monospace; }
    .inv-header .meta { font-size: 10px; opacity: 0.85; margin-top: 2px; }
    .inv-meta { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #e2e8f0; }
    .inv-meta-block { padding: 16px 22px; }
    .inv-meta-block:first-child { border-right: 1px solid #e2e8f0; }
    .inv-meta-block:last-child { background: #f8fafc; }
    .section-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px; }
    .billed-name { font-size: 14px; font-weight: 800; color: #0f172a; }
    .billed-sub { font-size: 11px; color: #475569; line-height: 1.7; margin-top: 3px; }
    .detail-row { font-size: 11px; color: #475569; margin-bottom: 3px; }
    .detail-row span { color: #94a3b8; }
    .items-section { padding: 16px 22px; }
    .section-heading { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #03003a; border-bottom: 2px solid rgba(3, 0, 58, 0.15); padding-bottom: 5px; margin-bottom: 6px; margin-top: 14px; }
    .section-heading:first-child { margin-top: 0; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items thead tr { background: #f8fafc; }
    table.items th { text-align: left; padding: 6px 10px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    table.items th.r { text-align: right; }
    table.items th.c { text-align: center; }
    table.items td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155; vertical-align: top; }
    table.items td.r { text-align: right; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; font-variant-numeric: tabular-nums; }
    table.items td.c { text-align: center; }
    table.items tr:nth-child(even) td { background: #f8fafc; }
    table.items td.amt { text-align: right; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; font-variant-numeric: tabular-nums; font-weight: 700; color: #1e293b; }
    .totals-area { display: grid; grid-template-columns: 1fr 260px; border-top: 2px solid #e2e8f0; }
    .bank-block { padding: 16px 22px; background: #f8fafc; border-right: 1px solid #e2e8f0; }
    .totals-block { padding: 16px 22px; }
    .total-row { display: flex; justify-content: space-between; font-size: 11.5px; color: #64748b; padding: 3px 0; }
    .total-row strong { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; font-variant-numeric: tabular-nums; color: #1e293b; }
    .total-grand { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #03003a, #0c076e); border-radius: 8px; padding: 10px 14px; margin-top: 10px; }
    .total-grand span { font-weight: 800; font-size: 13px; color: white; }
    .total-grand strong { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; font-variant-numeric: tabular-nums; font-weight: 800; font-size: 18px; color: white; letter-spacing: -0.02em; }
    .words-row { font-size: 10px; color: #64748b; margin-top: 10px; padding: 6px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
    .words-row strong { color: #1e293b; }
    .footer-strip { background: #1e293b; color: #94a3b8; padding: 12px 22px; font-size: 9.5px; display: flex; justify-content: space-between; align-items: center; margin-top: 0; }
    .stamp-area { margin-top: 20px; display: flex; justify-content: flex-end; padding: 0 22px 16px; }
    .stamp-box { text-align: center; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 12px 24px; width: 180px; }
    .stamp-box .label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .stamp-box .name { font-weight: 800; font-size: 13px; color: #1e293b; margin-top: 4px; }
    .stamp-box .title { font-size: 10px; color: #64748b; }
    @media print {
      body { margin: 0; }
      .page { padding: 0; max-width: 100%; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="inv-header">
    <div>
      <div class="label">Tax Invoice</div>
      <h1>${hub ? hub.name : 'Nexus Co-Working Hub'}</h1>
      <div class="meta">${hub ? hub.address : ''}</div>
      <div class="meta">GSTIN: <strong>${hub ? hub.gstin : ''}</strong> &nbsp;|&nbsp; PAN: <strong>${hub ? hub.pan : ''}</strong></div>
      <div class="meta">✉ ${hub ? hub.email : ''} &nbsp;|&nbsp; ☎ ${hub ? hub.phone : ''}</div>
    </div>
    <div style="text-align: right;">
      <div class="label">Invoice Number</div>
      <div class="inv-no">#${invNumber}</div>
      <div class="meta" style="margin-top: 8px;">Issue Date: <strong>${today}</strong></div>
      <div class="meta">Billing Period: <strong>${period}</strong></div>
      <div class="meta">Due Date: <strong style="color: #fca5a5;">${dueFormatted}</strong></div>
    </div>
  </div>

  <!-- Meta -->
  <div class="inv-meta">
    <div class="inv-meta-block">
      <div class="section-label">Billed To</div>
      <div class="billed-name">${startup.name}</div>
      <div class="billed-sub">
        Attn: ${startup.founders ? startup.founders.name : 'Founder'} (${startup.founders ? startup.founders.role : ''})<br>
        Email: ${startup.founders ? startup.founders.email : ''}<br>
        GSTIN: <strong style="font-family: var(--font-mono); font-size: 10.5px;">${startup.gstin || 'N/A'}</strong><br>
        CIN: ${startup.registrationNumber || 'N/A'}<br>
        Category: ${startup.category}
      </div>
    </div>
    <div class="inv-meta-block">
      <div class="section-label">Payment Information</div>
      <div class="detail-row"><span>Invoice No: </span><strong>${invNumber}</strong></div>
      <div class="detail-row"><span>Invoice Date: </span><strong>${today}</strong></div>
      <div class="detail-row"><span>Billing Period: </span><strong>${period}</strong></div>
      <div class="detail-row"><span>Payment Due: </span><strong style="color: #dc2626;">${dueFormatted}</strong></div>
      <div class="detail-row"><span>Payment Terms: </span><strong>Net 5 Days</strong></div>
      <div class="detail-row"><span>Status: </span><strong style="color: #d97706;">ISSUED — UNPAID</strong></div>
      ${subsidyPct > 0 ? `<div class="detail-row"><span>Incubation Grant: </span><strong style="color: #16a34a;">${subsidyPct}% Subsidy Applied</strong></div>` : ''}
    </div>
  </div>

  <!-- Line Items -->
  <div class="items-section">
    ${Object.entries(sections).map(([sectionName, items]) => `
      <div class="section-heading">
        ${sectionName === 'Workspace Rent' ? '🏢 ' : sectionName === 'Facilities' ? '🔧 ' : '📅 '}${sectionName}
      </div>
      <table class="items">
        <thead>
          <tr>
            <th style="width: 52%;">Description</th>
            <th class="c" style="width: 10%;">Qty/Hrs</th>
            <th class="r" style="width: 18%;">Unit Rate (₹)</th>
            <th class="r" style="width: 20%;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td><strong>${item.desc}</strong></td>
              <td class="c">${item.qty}</td>
              <td class="r">₹${Number(item.rate).toLocaleString('en-IN')}</td>
              <td class="amt">₹${Number(item.amount).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `).join('')}
  </div>

  <!-- Totals -->
  <div class="totals-area">
    <div class="bank-block">
      <div class="section-label">Bank Transfer Details</div>
      <div class="detail-row">Bank: <strong>${hub ? hub.bankName : ''}</strong></div>
      <div class="detail-row">Account No: <strong style="font-family: var(--font-mono);">${hub ? hub.accountNumber : ''}</strong></div>
      <div class="detail-row">IFSC Code: <strong style="font-family: var(--font-mono);">${hub ? hub.ifsc : ''}</strong></div>
      <div class="detail-row">UPI VPA: <strong style="color: #4338ca;">${hub ? hub.upiId : ''}</strong></div>
      <div style="margin-top: 14px; padding: 10px; background: #fff; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center;">
        <div style="font-size: 36px; line-height: 1;">📱</div>
        <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Scan UPI QR to Pay</div>
      </div>
    </div>

    <div class="totals-block">
      <div class="total-row"><span>Gross Subtotal:</span><strong>₹${subtotal.toLocaleString('en-IN')}</strong></div>
      ${subsidyDeduction > 0 ? `<div class="total-row" style="color: #16a34a;"><span>Grant Subsidy (${subsidyPct}%):</span><strong style="color: #16a34a;">-₹${subsidyDeduction.toLocaleString('en-IN')}</strong></div>
      <div class="total-row"><span>Taxable Value:</span><strong>₹${taxableAmount.toLocaleString('en-IN')}</strong></div>` : ''}
      <div class="total-row"><span>CGST @ 9%:</span><strong>₹${cgst.toLocaleString('en-IN')}</strong></div>
      <div class="total-row"><span>SGST @ 9%:</span><strong>₹${sgst.toLocaleString('en-IN')}</strong></div>
      <div style="border-top: 1px solid #e2e8f0; margin: 8px 0;"></div>
      <div class="total-grand">
        <span>TOTAL DUE</span>
        <strong>₹${grandTotal.toLocaleString('en-IN')}</strong>
      </div>
      <div class="words-row">
        Amount in Words: <strong>${amountInWords}</strong>
      </div>
    </div>
  </div>

  <!-- Stamp / Authorisation -->
  <div class="stamp-area">
    <div class="stamp-box">
      <div class="label">Authorised Signatory</div>
      <div style="height: 36px; border-bottom: 1px dashed #cbd5e1; margin: 10px 0;"></div>
      <div class="name">${hub ? hub.name : ''}</div>
      <div class="title">Finance & Operations</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-strip">
    <div>This is a computer-generated Tax Invoice. No physical signature required.</div>
    <div>GST Rate: 18% (CGST 9% + SGST 9%) | Supply of Services under GST</div>
  </div>
</div>
</body>
</html>`;
  },

  // ─── Confirm Generate & Save ───────────────────────────────────────────────

  _confirmGenerate(startupId) {
    const type = this._currentType || 'combined';
    const inclMaint = document.getElementById('inv-maintenance')?.checked ?? true;
    const inclSec = document.getElementById('inv-security')?.checked ?? false;
    const period = document.getElementById('inv-billing-period')?.value || 'October 2026';
    const dueDate = document.getElementById('inv-due-date')?.value || '2026-10-05';

    const result = window.store.generateDetailedInvoice(startupId, { type, inclMaint, inclSec, period, dueDate });

    if (result.success) {
      this.closeModal('modal-invoice-generator');
      App.showToast(`✅ Invoice #${result.invoice.id} generated for ${result.invoice.startupName}!`, 'success');
      // Refresh billing view if active
      if (typeof BillingModule !== 'undefined') BillingModule.render();
      if (typeof DashboardModule !== 'undefined') DashboardModule.render();
      // Immediately show the generated invoice
      setTimeout(() => this.viewInvoice(result.invoice.id), 300);
    } else {
      App.showToast(`⚠️ ${result.message}`, 'danger');
    }
  },

  // ─── Full Invoice Viewer Modal ──────────────────────────────────────────────

  _renderInvoiceViewModal(inv) {
    const hub = window.store.state.hubInfo;
    const startup = window.store.getStartupById(inv.startupId);
    const sections = {};
    (inv.lineItems || []).forEach(li => {
      const sec = li.section || 'Workspace Rent';
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(li);
    });

    const today = new Date(inv.issueDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const dueFmt = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '5 Oct 2026';
    const invPayments = window.store.getPaymentsByInvoiceId ? window.store.getPaymentsByInvoiceId(inv.id) : [];
    const totalPaidSoFar = invPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balanceRemaining = Math.max(0, Number(inv.total || 0) - totalPaidSoFar);

    const html = `
      <div class="modal-overlay active" id="modal-invoice-full-view">
        <div class="modal-content modal-wide" style="max-width: 860px; background: #ffffff; color: #0f172a;">
          <div class="modal-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 16px 24px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 22px;">🧾</span>
              <div>
                <h3 style="font-weight: 800; font-size: 16px; color: #0f172a;">Tax Invoice: #${inv.id}</h3>
                <span style="font-size: 11px; color: #64748b;">${inv.startupName} • ${inv.billingPeriod}</span>
              </div>
              <span class="badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}" style="font-size: 12px;">${inv.status}</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="InvoiceModule._printExistingInvoice('${inv.id}')">🖨️ Print / PDF</button>
              <button class="modal-close-btn" onclick="InvoiceModule.closeModal('modal-invoice-full-view')">×</button>
            </div>
          </div>

          <div class="modal-body" style="padding: 28px 32px; background: #f8fafc;">
            <!-- Invoice Box -->
            <div style="background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); overflow: hidden;">

              <!-- Invoice Header Band -->
              <div style="background: linear-gradient(135deg, #03003a 0%, #0c076e 100%); padding: 24px 28px; display: flex; justify-content: space-between; align-items: flex-start; color: white;">
                <div>
                  <div style="font-size: 9px; font-weight: 700; letter-spacing: 2.5px; opacity: 0.8; text-transform: uppercase;">Tax Invoice</div>
                  <div style="font-size: 20px; font-weight: 900; margin-top: 4px;">${hub ? hub.name : 'Nexus Co-Working Hub'}</div>
                  <div style="font-size: 11px; opacity: 0.85; margin-top: 4px;">${hub ? hub.address : ''}</div>
                  <div style="font-size: 11px; opacity: 0.85;">GSTIN: <strong>${hub ? hub.gstin : ''}</strong> | PAN: <strong>${hub ? hub.pan : ''}</strong></div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 9px; opacity: 0.7; letter-spacing: 1px; text-transform: uppercase;">Invoice #</div>
                  <div style="font-size: 22px; font-weight: 800; font-family: var(--font-mono);">${inv.id}</div>
                  <div style="font-size: 11px; opacity: 0.85; margin-top: 8px;">Issue: <strong>${today}</strong></div>
                  <div style="font-size: 11px; opacity: 0.85;">Period: <strong>${inv.billingPeriod}</strong></div>
                  <div style="font-size: 11px; opacity: 0.85;">Due: <strong style="color: #fca5a5;">${dueFmt}</strong></div>
                </div>
              </div>

              <!-- Billed-to -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e2e8f0;">
                <div style="padding: 16px 22px; border-right: 1px solid #e2e8f0;">
                  <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px;">Billed To</div>
                  <div style="font-weight: 800; font-size: 15px; color: #0f172a;">${inv.startupName}</div>
                  ${startup ? `
                  <div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.7;">
                    ${startup.founders ? `Attn: ${startup.founders.name}<br>` : ''}
                    GSTIN: <strong style="font-family: var(--font-mono); color: #4338ca; font-size: 11px;">${startup.gstin || 'N/A'}</strong><br>
                    CIN: ${startup.registrationNumber || 'N/A'}<br>
                    Category: ${startup.category}
                  </div>` : ''}
                </div>
                <div style="padding: 16px 22px; background: #f8fafc;">
                  <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px;">Invoice Details</div>
                  <div style="font-size: 12px; color: #475569; line-height: 1.8;">
                    Invoice Date: <strong>${today}</strong><br>
                    Due Date: <strong style="color: #dc2626;">${dueFmt}</strong><br>
                    Terms: <strong>Net 5 Days</strong><br>
                    Status: <strong style="color: ${inv.status === 'Paid' ? '#16a34a' : '#d97706'};">${inv.status.toUpperCase()}</strong>
                    ${inv.grantSubsidyPercent > 0 ? `<br>Grant Subsidy: <strong style="color:#16a34a;">${inv.grantSubsidyPercent}%</strong>` : ''}
                  </div>
                </div>
              </div>

              <!-- Line Items per Section -->
              <div style="padding: 18px 22px;">
                ${Object.keys(sections).length > 0 ? Object.entries(sections).map(([secName, items]) => `
                  <div style="margin-bottom: 16px;">
                    <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 5px; margin-bottom: 8px;">
                      ${secName === 'Workspace Rent' ? '🏢' : secName === 'Facilities' ? '🔧' : secName === 'Meeting Rooms' ? '📅' : '📋'} ${secName}
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                      <thead>
                        <tr style="background: #f8fafc;">
                          <th style="text-align: left; padding: 7px 10px; color: #64748b; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Description</th>
                          <th style="text-align: center; padding: 7px 10px; color: #64748b; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Qty</th>
                          <th style="text-align: right; padding: 7px 10px; color: #64748b; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Rate (₹)</th>
                          <th style="text-align: right; padding: 7px 10px; color: #64748b; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${items.map((item, idx) => `
                          <tr style="background: ${idx % 2 === 1 ? '#f8fafc' : '#fff'};">
                            <td style="padding: 8px 10px; color: #334155; font-weight: 500;">${item.desc}</td>
                            <td style="padding: 8px 10px; text-align: center; color: #64748b;">${item.qty}</td>
                            <td style="padding: 8px 10px; text-align: right; font-family: var(--font-sans); font-variant-numeric: tabular-nums; color: #475569;">₹${Number(item.rate).toLocaleString('en-IN')}</td>
                            <td style="padding: 8px 10px; text-align: right; font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-weight: 700; color: #1e293b;">₹${Number(item.amount).toLocaleString('en-IN')}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                `).join('') : `
                  <!-- Fallback flat items display -->
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead><tr style="background: #f8fafc;">
                      <th style="text-align: left; padding: 7px 10px; color: #64748b; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Description</th>
                      <th style="text-align: center; padding: 7px 10px; color: #64748b; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Qty</th>
                      <th style="text-align: right; padding: 7px 10px; color: #64748b; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Rate</th>
                      <th style="text-align: right; padding: 7px 10px; color: #64748b; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Amount</th>
                    </tr></thead>
                    <tbody>
                      ${(inv.lineItems || []).map((item, idx) => `
                        <tr style="background: ${idx % 2 === 1 ? '#f8fafc' : '#fff'};">
                          <td style="padding: 8px 10px; color: #334155;">${item.desc}</td>
                          <td style="padding: 8px 10px; text-align: center;">${item.qty}</td>
                          <td style="padding: 8px 10px; text-align: right; font-family: var(--font-sans); font-variant-numeric: tabular-nums;">₹${Number(item.rate).toLocaleString('en-IN')}</td>
                          <td style="padding: 8px 10px; text-align: right; font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-weight: 700;">₹${Number(item.amount).toLocaleString('en-IN')}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `}
              </div>

              <!-- GST Summary -->
              <div style="display: grid; grid-template-columns: 1fr 280px; border-top: 2px solid #e2e8f0;">
                <div style="padding: 16px 22px; background: #f8fafc; border-right: 1px solid #e2e8f0;">
                  <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">Bank Details</div>
                  <div style="font-size: 11.5px; color: #475569; line-height: 1.8;">
                    Bank: <strong>${hub ? hub.bankName : ''}</strong><br>
                    A/c: <strong style="font-family: var(--font-mono);">${hub ? hub.accountNumber : ''}</strong> | IFSC: <strong style="font-family: var(--font-mono);">${hub ? hub.ifsc : ''}</strong><br>
                    UPI: <strong style="color: #4338ca;">${hub ? hub.upiId : ''}</strong>
                  </div>
                  ${inv.status === 'Paid' ? `
                    <div style="margin-top: 10px; padding: 8px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 11.5px; color: #065f46;">
                      ✅ <strong>Payment Received</strong> via ${inv.paymentMethod || 'Gateway'}<br>
                      Ref: <code style="font-family: var(--font-mono);">${inv.transactionRef || 'NEXUS-OK'}</code>
                    </div>
                  ` : ''}
                </div>
                <div style="padding: 16px 22px;">
                  <div style="font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; padding: 4px 0;">
                    <span>Subtotal:</span><strong style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; color: #1e293b;">₹${Number(inv.subtotal || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  ${Number(inv.subsidyDeduction) > 0 ? `
                  <div style="font-size: 11.5px; color: #16a34a; display: flex; justify-content: space-between; padding: 4px 0;">
                    <span>Grant (${inv.grantSubsidyPercent}%):</span><strong style="font-family: var(--font-sans); font-variant-numeric: tabular-nums;">-₹${Number(inv.subsidyDeduction).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style="font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; padding: 4px 0; border-top: 1px solid #e2e8f0; margin-top: 2px; padding-top: 6px;">
                    <span>Taxable Value:</span><strong style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; color: #1e293b;">₹${Number(inv.taxableAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>` : ''}
                  <div style="font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; padding: 4px 0;">
                    <span>CGST @ 9%:</span><strong style="font-family: var(--font-sans); font-variant-numeric: tabular-nums;">₹${Math.round(Number(inv.taxGst || 0)/2).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style="font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; padding: 4px 0;">
                    <span>SGST @ 9%:</span><strong style="font-family: var(--font-sans); font-variant-numeric: tabular-nums;">₹${Math.round(Number(inv.taxGst || 0)/2).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #03003a, #0c076e); padding: 10px 14px; border-radius: 8px; margin-top: 10px;">
                    <span style="font-weight: 800; color: white; font-size: 13px;">TOTAL DUE</span>
                    <strong style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-size: 18px; color: white; letter-spacing: -0.02em;">₹${Number(inv.total || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              <!-- Payment History & Settlements for this Invoice -->
              <div style="border-top: 2px solid #e2e8f0; padding: 18px 22px; background: #f8fafc;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">💳</span>
                    <strong style="font-size: 13px; color: #0f172a;">Payment History & Reconciled Settlements</strong>
                    <span class="badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Partially Paid' ? '' : 'badge-warning'}"
                      style="${inv.status === 'Partially Paid' ? 'background: rgba(139,92,246,0.15); color: #8b5cf6;' : ''} font-size: 10.5px;">
                      ${invPayments.length} Payment${invPayments.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  ${totalPaidSoFar > 0 ? `
                    <div style="font-size: 11.5px; font-family: var(--font-mono); font-weight: 700; color: #16a34a;">
                      Settled: ₹${totalPaidSoFar.toLocaleString('en-IN')} ${balanceRemaining > 0 ? `<span style="color: #dc2626;">(₹${balanceRemaining.toLocaleString('en-IN')} due)</span>` : '✓ Fully Cleared'}
                    </div>
                  ` : ''}
                </div>

                ${invPayments.length > 0 ? `
                  <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                      <thead>
                        <tr style="background: #f1f5f9; text-align: left; color: #64748b; font-size: 9.5px; text-transform: uppercase;">
                          <th style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Payment ID</th>
                          <th style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Receipt #</th>
                          <th style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Date & Time</th>
                          <th style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Amount Paid</th>
                          <th style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Gateway</th>
                          <th style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">UTR / Ref</th>
                          <th style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${invPayments.map((p, idx) => `
                          <tr style="background: ${idx % 2 === 1 ? '#f8fafc' : '#fff'}; border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 7px 10px; font-family: var(--font-mono); font-weight: 700; color: #4338ca;">${p.id}</td>
                            <td style="padding: 7px 10px;">
                              <span style="font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: #16a34a; background: #ecfdf5; padding: 2px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">
                                ${p.receiptNo || 'REC-OK'}
                              </span>
                            </td>
                            <td style="padding: 7px 10px; color: #475569; white-space: nowrap;">${p.paymentDate || '—'}</td>
                            <td style="padding: 7px 10px; font-family: var(--font-mono); font-weight: 700; color: #16a34a;">₹${Number(p.amount || 0).toLocaleString('en-IN')}</td>
                            <td style="padding: 7px 10px; color: #1e293b; font-weight: 600;">${p.gateway || p.method}</td>
                            <td style="padding: 7px 10px;"><code style="font-family: var(--font-mono); font-size: 10px; color: #64748b;">${p.transactionRef || '—'}</code></td>
                            <td style="padding: 7px 10px; text-align: right;">
                              <button class="btn btn-outline btn-sm" style="font-size: 10px; padding: 2px 8px; color: #16a34a; border-color: #16a34a;"
                                onclick="InvoiceModule.closeModal('modal-invoice-full-view'); if (typeof PaymentsModule !== 'undefined') PaymentsModule.viewReceipt('${p.id}');">
                                📄 Receipt
                              </button>
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : `
                  <div style="padding: 12px 14px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: #64748b;">
                    <span>⏳ Awaiting payment. No transaction records logged for this invoice yet.</span>
                    <button class="btn btn-primary btn-sm" style="font-size: 10.5px; padding: 3px 8px;"
                      onclick="InvoiceModule.closeModal('modal-invoice-full-view'); if (typeof PaymentsModule !== 'undefined') PaymentsModule.openCheckoutModal('${inv.id}');">
                      💳 Pay Now
                    </button>
                  </div>
                `}
              </div>
            </div>
          </div>

          <div class="modal-footer" style="background: #f8fafc; border-top: 1px solid #e2e8f0;">
            <button class="btn btn-secondary" onclick="InvoiceModule.closeModal('modal-invoice-full-view')">Close</button>
            <button class="btn btn-outline" onclick="InvoiceModule._printExistingInvoice('${inv.id}')">🖨️ Print / Save as PDF</button>
            ${inv.status !== 'Paid' ? `
              <button class="btn btn-primary" onclick="InvoiceModule.closeModal('modal-invoice-full-view'); PaymentsModule.openCheckoutModal('${inv.id}')">
                💳 Proceed to Payment — ₹${Number(inv.total || 0).toLocaleString('en-IN')}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  _printExistingInvoice(invoiceId) {
    const inv = window.store.getInvoiceById(invoiceId);
    if (!inv) return;
    const hub = window.store.state.hubInfo;
    const startup = window.store.getStartupById(inv.startupId);
    const billing = window.store.calculateStartupMonthlyBilling(inv.startupId);
    const type = inv.invoiceType || 'combined';
    const meetingCharges = this._getMeetingRoomCharges(inv.startupId);
    const html = this._buildFullPrintHTML(startup, billing, hub, meetingCharges, type, true, false, inv.billingPeriod || 'October 2026', inv.dueDate || '2026-10-05');
    const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
