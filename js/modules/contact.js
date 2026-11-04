// Nexus Hub - Visitor Management & Security Gate Pass Module

const ContactModule = {
  activeTab: 'all', // 'all', 'today', 'checkedIn', 'completed'
  searchQuery: '',

  render() {
    const container = document.getElementById('view-contact');
    if (!container) return;

    const hubSettings = (window.store && window.store.getHubSettings)
      ? window.store.getHubSettings()
      : {
          name: 'Nexus Innovation & Co-Working Hub',
          address: 'Survey No. 42, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
          phone: '+91 80 4567 8900',
          email: 'support@nexushub.co',
          hours: {
            memberAccess: '24/7 Access (Smart Card & Biometric)',
            visitingHours: 'Mon – Sat: 09:00 AM – 06:00 PM IST',
            staffedSupport: 'Mon – Sat: 08:00 AM – 08:00 PM IST'
          }
        };

    const isOperator = window.store && window.store.isOperatorUser ? window.store.isOperatorUser() : false;
    const activeStartup = window.store && window.store.getActiveStartup ? window.store.getActiveStartup() : { id: 'STP-XYZ', name: 'XYZ Technologies' };
    const myStartupId = activeStartup ? activeStartup.id : 'STP-XYZ';
    const myStartupName = activeStartup ? activeStartup.name : 'XYZ Technologies';

    // Scoped visitors
    const allVisitors = (window.store && window.store.getVisitors) ? window.store.getVisitors(isOperator ? null : myStartupId) : [];
    const todayStr = (window.MeetingRoomsModule && window.MeetingRoomsModule.getISTNow)
      ? window.MeetingRoomsModule.getISTNow().todayStr
      : new Date().toISOString().slice(0, 10);

    // KPI Counters
    const totalCount = allVisitors.length;
    const expectedToday = allVisitors.filter(v => v.date === todayStr && v.status === 'Pass Issued').length;
    const currentlyCheckedIn = allVisitors.filter(v => v.status === 'Checked In').length;
    const completedCount = allVisitors.filter(v => v.status === 'Completed').length;

    // Filter by tab & search query
    let filteredVisitors = allVisitors;
    if (this.activeTab === 'today') {
      filteredVisitors = filteredVisitors.filter(v => v.date === todayStr);
    } else if (this.activeTab === 'checkedIn') {
      filteredVisitors = filteredVisitors.filter(v => v.status === 'Checked In');
    } else if (this.activeTab === 'completed') {
      filteredVisitors = filteredVisitors.filter(v => v.status === 'Completed');
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filteredVisitors = filteredVisitors.filter(v => 
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.company && v.company.toLowerCase().includes(q)) ||
        (v.passNumber && v.passNumber.toLowerCase().includes(q)) ||
        (v.hostName && v.hostName.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <div style="padding: 24px 28px; max-width: 1400px; margin: 0 auto; box-sizing: border-box;">
        
        <!-- Header Banner with Single Settings Source -->
        <div class="card" style="padding: 22px 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border-subtle, #e2e8f0); background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 999px;">
                  🔒 Campus Security &amp; Access Protocol
                </span>
                ${isOperator ? `
                  <span class="badge badge-info" style="font-weight: 700; font-size: 11px;">Operator Master Console (All Startups)</span>
                ` : `
                  <span class="badge" style="background: #f1f5f9; color: #475569; font-weight: 700; font-size: 11px;">Company: ${myStartupName}</span>
                `}
              </div>
              <h1 style="font-size: 24px; font-weight: 900; color: var(--text-primary, #0f172a); margin: 0 0 6px 0; letter-spacing: -0.02em;">
                Visitor Gate Passes &amp; Guest Management
              </h1>
              <p style="font-size: 13.5px; color: var(--text-secondary, #475569); margin: 0 0 10px 0; max-width: 780px; line-height: 1.5;">
                Pre-register external visitors, issue digital QR entry passes, verify government IDs at the security gate, and track real-time host check-ins for <strong>${myStartupName}</strong>.
              </p>
              <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--text-muted, #64748b); flex-wrap: wrap;">
                <span>📍 <strong>Location:</strong> ${hubSettings.address || 'Survey No. 42, Outer Ring Road, Bellandur, Bengaluru'}</span>
                <span>⏰ <strong>Visitor Hours:</strong> ${(hubSettings.hours && hubSettings.hours.visitingHours) || 'Mon – Sat: 09:00 AM – 06:00 PM IST'}</span>
                <span>📞 <strong>Security Desk:</strong> <a href="tel:+918045678999" style="color: #4f46e5; text-decoration: none; font-weight: 700;">+91 80 4567 8999</a></span>
              </div>
            </div>

            <!-- Primary CTAs -->
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn btn-outline" onclick="ContactModule.openPreRegisterModal()" style="font-weight: 700; padding: 9px 16px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; border-color: #cbd5e1; border-radius: 9px;">
                <span>📅</span> Schedule Visit
              </button>
              <button class="btn btn-primary" onclick="ContactModule.openPreRegisterModal()" style="font-weight: 800; padding: 9px 18px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; background: #4f46e5; border-color: #4f46e5; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); border-radius: 9px;">
                <span>🪪</span> + Pre-Register Guest
              </button>
            </div>
          </div>
        </div>

        <!-- 4 KPI Stat Counters -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 24px;">
          <div class="card" style="padding: 16px 18px; border-radius: 12px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.3px;">Total Passes Issued</div>
            <div style="font-size: 26px; font-weight: 900; color: #0f172a; margin-top: 4px;">${totalCount}</div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">Active in system</div>
          </div>
          <div class="card" style="padding: 16px 18px; border-radius: 12px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.3px;">Expected Today</div>
            <div style="font-size: 26px; font-weight: 900; color: #2563eb; margin-top: 4px;">${expectedToday}</div>
            <div style="font-size: 11.5px; color: #2563eb; margin-top: 2px;">Pending gate arrival</div>
          </div>
          <div class="card" style="padding: 16px 18px; border-radius: 12px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.3px;">Currently Checked In</div>
            <div style="font-size: 26px; font-weight: 900; color: #16a34a; margin-top: 4px;">${currentlyCheckedIn}</div>
            <div style="font-size: 11.5px; color: #16a34a; margin-top: 2px;">On-campus right now</div>
          </div>
          <div class="card" style="padding: 16px 18px; border-radius: 12px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.3px;">Completed / Checked Out</div>
            <div style="font-size: 26px; font-weight: 900; color: #64748b; margin-top: 4px;">${completedCount}</div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">Past visitor sessions</div>
          </div>
        </div>

        <!-- Controls Bar: Filter Tabs & Search -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <!-- Tabs -->
          <div style="display: inline-flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 4px;">
            <button type="button" onclick="ContactModule.setTab('all')" style="border: none; padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; ${this.activeTab === 'all' ? 'background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08);' : 'background: transparent; color: #64748b;'}">
              All Passes (${totalCount})
            </button>
            <button type="button" onclick="ContactModule.setTab('today')" style="border: none; padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; ${this.activeTab === 'today' ? 'background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08);' : 'background: transparent; color: #64748b;'}">
              Expected Today (${expectedToday})
            </button>
            <button type="button" onclick="ContactModule.setTab('checkedIn')" style="border: none; padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; ${this.activeTab === 'checkedIn' ? 'background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08);' : 'background: transparent; color: #64748b;'}">
              Checked In (${currentlyCheckedIn})
            </button>
            <button type="button" onclick="ContactModule.setTab('completed')" style="border: none; padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; ${this.activeTab === 'completed' ? 'background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08);' : 'background: transparent; color: #64748b;'}">
              Completed (${completedCount})
            </button>
          </div>

          <!-- Search Input -->
          <div style="position: relative; min-width: 280px;">
            <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #94a3b8;">🔍</span>
            <input 
              type="text" 
              placeholder="Search by guest name, company, pass ID..." 
              value="${this.searchQuery}"
              oninput="ContactModule.handleSearch(this.value)"
              style="width: 100%; box-sizing: border-box; padding: 7px 12px 7px 32px; font-size: 12.5px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; background: #ffffff;"
            />
          </div>
        </div>

        <!-- Visitors Table -->
        <div class="card" style="padding: 0; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); overflow: hidden; background: #ffffff;">
          <div class="table-responsive">
            <table class="nexus-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;">
                  <th style="padding: 12px 14px;">Gate Pass #</th>
                  <th style="padding: 12px 14px;">Guest Details</th>
                  <th style="padding: 12px 14px;">Host &amp; Location</th>
                  <th style="padding: 12px 14px;">Scheduled Time</th>
                  <th style="padding: 12px 14px;">ID Verification</th>
                  <th style="padding: 12px 14px;">Status</th>
                  <th style="padding: 12px 14px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredVisitors.length === 0 ? `
                  <tr>
                    <td colspan="7" style="padding: 40px 20px; text-align: center; color: #8a90a2;">
                      <div style="font-size: 32px; margin-bottom: 8px;">🪪</div>
                      <div style="font-size: 14px; font-weight: 700; color: #1e293b;">No visitors matching this view</div>
                      <div style="font-size: 12px; margin-top: 4px;">Pre-register a new guest using the button above to generate a QR pass.</div>
                    </td>
                  </tr>
                ` : filteredVisitors.map(v => {
                  const isCheckedIn = v.status === 'Checked In';
                  const isCompleted = v.status === 'Completed';
                  const isPassIssued = v.status === 'Pass Issued';

                  return `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;">
                      <td style="padding: 12px 14px;">
                        <span style="font-family: var(--font-mono, monospace); font-weight: 800; color: #4f46e5; font-size: 12px;">
                          ${v.passNumber || v.id}
                        </span>
                      </td>
                      <td style="padding: 12px 14px;">
                        <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${v.name}</div>
                        <div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">
                          ${v.company} • ${v.phone || 'No phone'}
                        </div>
                      </td>
                      <td style="padding: 12px 14px;">
                        <div style="font-weight: 700; color: #0f172a;">Host: ${v.hostName}</div>
                        <div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">
                          ${v.room} • <span style="color: #4f46e5;">${v.purpose}</span>
                        </div>
                      </td>
                      <td style="padding: 12px 14px;">
                        <div style="font-weight: 700; color: #0f172a;">${v.date}</div>
                        <div style="font-size: 11px; color: #64748b;">${v.time}</div>
                      </td>
                      <td style="padding: 12px 14px;">
                        <span class="badge" style="background: rgba(100, 116, 139, 0.1); color: #475569; font-size: 11px; font-weight: 700;">
                          🛡️ ${v.idType || 'Aadhaar Card'}
                        </span>
                      </td>
                      <td style="padding: 12px 14px;">
                        ${isCheckedIn ? `
                          <span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #16a34a; font-weight: 800; padding: 3px 9px; border-radius: 999px;">
                            ● Checked In
                          </span>
                        ` : isCompleted ? `
                          <span class="badge" style="background: #f1f5f9; color: #64748b; font-weight: 700; padding: 3px 9px; border-radius: 999px;">
                            ✓ Completed
                          </span>
                        ` : `
                          <span class="badge" style="background: rgba(37, 99, 235, 0.1); color: #2563eb; font-weight: 800; padding: 3px 9px; border-radius: 999px;">
                            🎫 Pass Issued
                          </span>
                        `}
                      </td>
                      <td style="padding: 12px 14px; text-align: right;">
                        <div style="display: inline-flex; gap: 6px; align-items: center;">
                          <button class="btn btn-outline btn-sm" onclick="ContactModule.openQrPassModal('${v.id}')" style="font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 6px; border-color: #cbd5e1;" title="View & Print Digital QR Pass">
                            <span>📲</span> QR Pass
                          </button>
                          ${isPassIssued ? `
                            <button class="btn btn-primary btn-sm" onclick="ContactModule.handleCheckIn('${v.id}')" style="font-size: 11px; font-weight: 800; padding: 4px 10px; background: #16a34a; border-color: #16a34a; border-radius: 6px;" title="Confirm Gate Security Arrival">
                              Check In
                            </button>
                          ` : isCheckedIn ? `
                            <button class="btn btn-outline btn-sm" onclick="ContactModule.handleCheckOut('${v.id}')" style="font-size: 11px; font-weight: 800; padding: 4px 10px; color: #64748b; border-color: #cbd5e1; border-radius: 6px;" title="Record Visitor Departure">
                              Check Out
                            </button>
                          ` : ''}
                          <button class="btn btn-outline btn-sm" onclick="ContactModule.notifyHost('${v.id}')" style="font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; border-color: #cbd5e1;" title="Send in-app & WhatsApp notification to host">
                            🔔 Notify
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

        <!-- Security & Policy Notice Box -->
        <div style="margin-top: 20px; padding: 14px 18px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #64748b;">
          <div>
            <strong>🛡️ Campus Access Protocol:</strong> All external guests must present a valid government-issued photo ID (Aadhaar, Passport, PAN, or DL) matching their digital QR pass at Gate 1 Reception.
          </div>
          <div style="font-weight: 700; color: #4f46e5;">
            Need help? Visit <a href="javascript:void(0)" onclick="App.switchTab('help')" style="color: #4f46e5; text-decoration: underline;">Help &amp; Support</a>
          </div>
        </div>

      </div>
    `;
  },

  setTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  handleSearch(val) {
    this.searchQuery = val.trim();
    this.render();
  },

  handleCheckIn(id) {
    if (window.store && window.store.updateVisitorStatus) {
      window.store.updateVisitorStatus(id, 'Checked In');
      if (window.App && window.App.showToast) {
        window.App.showToast('✅ Guest marked as Checked In. Security access granted.', 'success');
      }
      this.render();
    }
  },

  handleCheckOut(id) {
    if (window.store && window.store.updateVisitorStatus) {
      window.store.updateVisitorStatus(id, 'Completed');
      if (window.App && window.App.showToast) {
        window.App.showToast('✓ Visitor Checked Out. Gate pass marked completed.', 'info');
      }
      this.render();
    }
  },

  notifyHost(id) {
    const list = window.store.getVisitors ? window.store.getVisitors() : [];
    const v = list.find(item => item.id === id);
    const host = v ? v.hostName : 'Host';
    if (window.App && window.App.showToast) {
      window.App.showToast(`🔔 Host ${host} notified via In-App Alert and WhatsApp notification.`, 'success');
    }
  },

  openPreRegisterModal() {
    const mount = document.getElementById('modal-mount');
    if (!mount) return;

    const todayStr = (window.MeetingRoomsModule && window.MeetingRoomsModule.getISTNow)
      ? window.MeetingRoomsModule.getISTNow().todayStr
      : new Date().toISOString().slice(0, 10);

    const activeStartup = window.store && window.store.getActiveStartup ? window.store.getActiveStartup() : { name: 'XYZ Technologies' };

    mount.innerHTML = `
      <div class="modal-backdrop" onclick="ContactModule.closeModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;">
        <div class="modal-card" style="background: #ffffff; width: 100%; max-width: 580px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; animation: fadeIn 0.15s ease;" onclick="event.stopPropagation()">
          
          <div style="padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">🪪</span>
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0;">Pre-Register Visitor &amp; Generate Gate Pass</h3>
                <div style="font-size: 11px; color: #64748b;">Issue verified digital entrance pass for your upcoming guest</div>
              </div>
            </div>
            <button type="button" onclick="ContactModule.closeModal()" style="border: none; background: transparent; font-size: 18px; cursor: pointer; color: #94a3b8;">×</button>
          </div>

          <form id="pre-register-visitor-form" onsubmit="ContactModule.handlePreRegisterSubmit(event)" style="padding: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Guest Full Name <span style="color: #ef4444;">*</span></label>
                <input type="text" id="vis-name" placeholder="e.g. Vikram Malhotra" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Phone Number (+91, 10 Digits) <span style="color: #ef4444;">*</span></label>
                <input type="tel" id="vis-phone" placeholder="e.g. 9876543210" pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Email Address <span style="color: #ef4444;">*</span></label>
                <input type="email" id="vis-email" placeholder="name@company.com" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Guest Organization / Company <span style="color: #ef4444;">*</span></label>
                <input type="text" id="vis-company" placeholder="e.g. Sequoia Capital" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Host Name <span style="color: #ef4444;">*</span></label>
                <input type="text" id="vis-host" value="Alex Morgan (${activeStartup.name})" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #f8fafc;" />
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Purpose of Visit <span style="color: #ef4444;">*</span></label>
                <select id="vis-purpose" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #ffffff;">
                  <option value="Client Meeting">Client / Commercial Meeting</option>
                  <option value="Investor Pitch">Investor Pitch &amp; Due Diligence</option>
                  <option value="Candidate Interview">Hiring &amp; Candidate Interview</option>
                  <option value="Vendor / Maintenance">Vendor &amp; Technical Support</option>
                  <option value="Campus Tour">Campus Delegation &amp; Tour</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Visit Date <span style="color: #ef4444;">*</span></label>
                <input type="date" id="vis-date" value="${todayStr}" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Expected Time <span style="color: #ef4444;">*</span></label>
                <input type="time" id="vis-time" value="10:30" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Destination Space / Room</label>
                <select id="vis-room" style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #ffffff;">
                  <option value="Boardroom Alpha">Boardroom Alpha (Floor 2)</option>
                  <option value="Cabin 103 (Pod 4)">Cabin 103 (Pod 4)</option>
                  <option value="Pitch Arena Nexus">Pitch Arena Nexus (Floor 1)</option>
                  <option value="Focus Room">Focus Room (Floor 3)</option>
                  <option value="Hot Desk Zone">Hot Desk Zone (Floor 2)</option>
                  <option value="Executive Lounge">Executive Lounge (Floor 1)</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Government ID Type Required</label>
                <select id="vis-id-type" style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #ffffff;">
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
            </div>

            <div style="padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 11.5px; color: #166534; margin-bottom: 16px;">
              ✓ Generating this pass will instantly notify the security reception and email a digital QR badge to the guest.
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn btn-outline" onclick="ContactModule.closeModal()" style="font-weight: 700; padding: 8px 16px; border-radius: 8px;">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" style="font-weight: 800; padding: 8px 20px; background: #4f46e5; border-color: #4f46e5; border-radius: 8px;">
                Generate Digital Pass ➔
              </button>
            </div>
          </form>

        </div>
      </div>
    `;
  },

  handlePreRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('vis-name').value.trim();
    let phone = document.getElementById('vis-phone').value.trim();
    if (!phone.startsWith('+91')) {
      phone = `+91 ${phone}`;
    }
    const email = document.getElementById('vis-email').value.trim();
    const company = document.getElementById('vis-company').value.trim();
    const host = document.getElementById('vis-host').value.trim();
    const purpose = document.getElementById('vis-purpose').value;
    const date = document.getElementById('vis-date').value;
    const timeVal = document.getElementById('vis-time').value;
    const room = document.getElementById('vis-room').value;
    const idType = document.getElementById('vis-id-type').value;

    let timeFormatted = timeVal;
    try {
      const parts = timeVal.split(':');
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      timeFormatted = `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    } catch (err) {}

    const newVis = window.store.addVisitor({
      name,
      phone,
      email,
      company,
      hostName: host,
      purpose,
      date,
      time: timeFormatted,
      room,
      idType
    });

    this.closeModal();
    if (window.App && window.App.showToast) {
      window.App.showToast(`✅ Gate Pass ${newVis.passNumber} generated for ${name}! Host notified.`, 'success');
    }
    this.render();

    // Show generated QR pass immediately
    setTimeout(() => {
      this.openQrPassModal(newVis.id);
    }, 200);
  },

  openQrPassModal(visitorId) {
    const list = window.store.getVisitors ? window.store.getVisitors() : [];
    const v = list.find(item => item.id === visitorId);
    if (!v) return;

    const mount = document.getElementById('modal-mount');
    if (!mount) return;

    mount.innerHTML = `
      <div class="modal-backdrop" onclick="ContactModule.closeModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;">
        <div class="modal-card" style="background: #ffffff; width: 100%; max-width: 440px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); overflow: hidden; animation: fadeIn 0.15s ease;" onclick="event.stopPropagation()">
          
          <!-- Pass Header -->
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 20px; color: #ffffff; text-align: center; position: relative;">
            <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 1px; color: #a5b4fc; text-transform: uppercase;">
              NEXUS HUB SECURITY PASS
            </div>
            <h2 style="font-size: 18px; font-weight: 900; margin: 4px 0 2px; color: #ffffff;">
              Digital Visitor Gate Pass
            </h2>
            <div style="font-family: var(--font-mono, monospace); font-size: 13px; font-weight: 800; color: #fbbf24; letter-spacing: 0.5px;">
              ${v.passNumber}
            </div>
            <button type="button" onclick="ContactModule.closeModal()" style="position: absolute; right: 14px; top: 14px; border: none; background: rgba(255,255,255,0.1); color: #ffffff; width: 28px; height: 28px; border-radius: 50%; font-size: 16px; cursor: pointer;">×</button>
          </div>

          <div style="padding: 24px 20px; text-align: center;">
            <!-- Vector QR Code (SVG) -->
            <div style="width: 170px; height: 170px; margin: 0 auto 16px; background: #ffffff; padding: 10px; border: 2px dashed #cbd5e1; border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;" fill="#1e1b4b">
                <!-- QR Finder Pattern Top-Left -->
                <rect x="5" y="5" width="28" height="28" fill="#1e1b4b" rx="4"/>
                <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2"/>
                <rect x="13" y="13" width="12" height="12" fill="#1e1b4b" rx="2"/>

                <!-- QR Finder Pattern Top-Right -->
                <rect x="67" y="5" width="28" height="28" fill="#1e1b4b" rx="4"/>
                <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2"/>
                <rect x="75" y="13" width="12" height="12" fill="#1e1b4b" rx="2"/>

                <!-- QR Finder Pattern Bottom-Left -->
                <rect x="5" y="67" width="28" height="28" fill="#1e1b4b" rx="4"/>
                <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2"/>
                <rect x="13" y="75" width="12" height="12" fill="#1e1b4b" rx="2"/>

                <!-- Data Matrix Dots -->
                <rect x="40" y="8" width="6" height="6" rx="1"/>
                <rect x="52" y="8" width="6" height="6" rx="1"/>
                <rect x="40" y="20" width="6" height="6" rx="1"/>
                <rect x="46" y="26" width="6" height="6" rx="1"/>
                <rect x="54" y="20" width="6" height="6" rx="1"/>
                <rect x="8" y="40" width="6" height="6" rx="1"/>
                <rect x="20" y="40" width="6" height="6" rx="1"/>
                <rect x="26" y="46" width="6" height="6" rx="1"/>
                <rect x="40" y="40" width="8" height="8" rx="2" fill="#4f46e5"/>
                <rect x="52" y="40" width="6" height="6" rx="1"/>
                <rect x="68" y="40" width="6" height="6" rx="1"/>
                <rect x="80" y="40" width="6" height="6" rx="1"/>
                <rect x="40" y="54" width="6" height="6" rx="1"/>
                <rect x="54" y="54" width="6" height="6" rx="1"/>
                <rect x="68" y="54" width="6" height="6" rx="1"/>
                <rect x="82" y="54" width="6" height="6" rx="1"/>
                <rect x="40" y="68" width="6" height="6" rx="1"/>
                <rect x="52" y="68" width="6" height="6" rx="1"/>
                <rect x="68" y="68" width="6" height="6" rx="1"/>
                <rect x="80" y="68" width="6" height="6" rx="1"/>
                <rect x="40" y="82" width="6" height="6" rx="1"/>
                <rect x="54" y="82" width="6" height="6" rx="1"/>
                <rect x="68" y="82" width="6" height="6" rx="1"/>
                <rect x="82" y="82" width="6" height="6" rx="1"/>
              </svg>
            </div>

            <!-- Guest & Access Info -->
            <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">
              ${v.name}
            </div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 14px;">
              ${v.company}
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; text-align: left; font-size: 12px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #64748b;">Host:</span>
                <strong style="color: #0f172a;">${v.hostName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #64748b;">Destination:</span>
                <strong style="color: #0f172a;">${v.room}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #64748b;">Scheduled Window:</span>
                <strong style="color: #4f46e5;">${v.date} • ${v.time}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">ID Check Required:</span>
                <span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-weight: 700; font-size: 11px;">
                  🛡️ ${v.idType || 'Aadhaar Card'}
                </span>
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn btn-outline" onclick="window.print()" style="flex: 1; font-weight: 700; padding: 9px; font-size: 12px; border-radius: 9px; border-color: #cbd5e1;">
                🖨️ Print Pass
              </button>
              <button type="button" class="btn btn-primary" onclick="ContactModule.closeModal()" style="flex: 1; font-weight: 800; padding: 9px; font-size: 12px; background: #4f46e5; border-color: #4f46e5; border-radius: 9px;">
                Done
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  closeModal() {
    const mount = document.getElementById('modal-mount');
    if (mount) mount.innerHTML = '';
  }
};

window.ContactModule = ContactModule;
