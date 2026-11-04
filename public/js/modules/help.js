// Nexus Hub - Help & Support Center, Ticket Desk, Inquiry Portal, FAQ & Safety Guides

const HelpModule = {
  activeSubTab: 'tickets', // 'tickets', 'inquiries', 'faq', 'guides', 'emergency'
  faqSearchQuery: '',
  inquiryRateLimitKey: 'nexus_last_inquiry_submit',

  render() {
    const container = document.getElementById('view-help');
    if (!container) return;

    const hubSettings = (window.store && window.store.getHubSettings)
      ? window.store.getHubSettings()
      : {
          name: 'Nexus Innovation & Co-Working Hub',
          address: 'Survey No. 42, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
          phone: '+91 80 4567 8900',
          emergencyPhone: '+91 80 4567 8999',
          email: 'support@nexushub.co',
          hours: {
            memberAccess: '24/7 Access (Smart Card & Biometric)',
            staffedSupport: 'Mon – Sat: 08:00 AM – 08:00 PM IST',
            visitingHours: 'Mon – Sat: 09:00 AM – 06:00 PM IST',
            meetingRooms: 'Mon – Sun: 07:00 AM – 11:00 PM IST'
          }
        };

    const isOperator = window.store && window.store.isOperatorUser ? window.store.isOperatorUser() : false;
    const activeStartup = window.store && window.store.getActiveStartup ? window.store.getActiveStartup() : { id: 'STP-XYZ', name: 'XYZ Technologies' };
    const myStartupId = activeStartup ? activeStartup.id : 'STP-XYZ';
    const myStartupName = activeStartup ? activeStartup.name : 'XYZ Technologies';

    // Scoped tickets and inquiries
    const tickets = (window.store && window.store.getSupportTickets) ? window.store.getSupportTickets(isOperator ? null : myStartupId) : [];
    const inquiries = (window.store && window.store.getContactInquiries) ? window.store.getContactInquiries(isOperator ? null : myStartupId) : [];

    const openTicketsCount = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const pendingInquiriesCount = inquiries.filter(i => i.status === 'New' || i.status === 'In progress').length;

    container.innerHTML = `
      <div style="padding: 24px 28px; max-width: 1400px; margin: 0 auto; box-sizing: border-box;">

        <!-- Support Hero Header with Single Source of Truth Config -->
        <div class="card" style="padding: 22px 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border-subtle, #e2e8f0); background: linear-gradient(135deg, #ffffff 0%, #f4f6ff 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 999px;">
                  🎧 24/7 Member Care &amp; Operations Desk
                </span>
                <span class="badge" style="background: #f1f5f9; color: #475569; font-weight: 700; font-size: 11px;">
                  ${myStartupName}
                </span>
              </div>
              <h1 style="font-size: 24px; font-weight: 900; color: var(--text-primary, #0f172a); margin: 0 0 6px 0; letter-spacing: -0.02em;">
                Help &amp; Support Center
              </h1>
              <p style="font-size: 13.5px; color: var(--text-secondary, #475569); margin: 0 0 10px 0; max-width: 780px; line-height: 1.5;">
                Submit facility and IT tickets, check live resolution SLA status, reach staffed reception desks, or consult the campus connectivity guides.
              </p>
              
              <!-- Canonical Hours & Contact Strip -->
              <div style="display: flex; align-items: center; gap: 18px; font-size: 12px; color: var(--text-muted, #64748b); flex-wrap: wrap;">
                <span>⏰ <strong>Staffed Desk:</strong> ${(hubSettings.hours && hubSettings.hours.staffedSupport) || 'Mon – Sat: 08:00 AM – 08:00 PM IST'}</span>
                <span>🚪 <strong>Member Access:</strong> ${(hubSettings.hours && hubSettings.hours.memberAccess) || '24/7 Smart Card Access'}</span>
                <span>📞 <strong>Call Us:</strong> <a href="tel:${hubSettings.phone || '+918045678900'}" style="color: #4f46e5; text-decoration: none; font-weight: 700;">${hubSettings.phone || '+91 80 4567 8900'}</a></span>
                <span>✉️ <strong>Email:</strong> <a href="mailto:${hubSettings.email || 'support@nexushub.co'}" style="color: #4f46e5; text-decoration: none; font-weight: 700;">${hubSettings.email || 'support@nexushub.co'}</a></span>
              </div>
            </div>

            <!-- Quick CTAs -->
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn btn-outline" onclick="HelpModule.switchSubTab('inquiries')" style="font-weight: 700; padding: 9px 15px; font-size: 12.5px; border-color: #cbd5e1; border-radius: 9px;">
                <span>✍️</span> Get in Touch
              </button>
              <button class="btn btn-primary" onclick="HelpModule.switchSubTab('tickets')" style="font-weight: 800; padding: 9px 18px; font-size: 12.5px; background: #4f46e5; border-color: #4f46e5; border-radius: 9px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);">
                <span>🎫</span> + Raise Ticket
              </button>
            </div>
          </div>
        </div>

        <!-- Sub-Navigation Navigation Tabs -->
        <div style="display: flex; gap: 6px; border-bottom: 1px solid #e2e8f0; margin-bottom: 22px; overflow-x: auto; padding-bottom: 2px;">
          <button type="button" onclick="HelpModule.switchSubTab('tickets')" style="border: none; background: transparent; padding: 10px 16px; font-size: 13px; font-weight: 800; cursor: pointer; border-bottom: 2.5px solid ${this.activeSubTab === 'tickets' ? '#4f46e5' : 'transparent'}; color: ${this.activeSubTab === 'tickets' ? '#4f46e5' : '#64748b'}; transition: all 0.15s ease;">
            🎫 Support Tickets ${openTicketsCount > 0 ? `<span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-size: 10.5px; margin-left: 4px;">${openTicketsCount} Open</span>` : ''}
          </button>
          <button type="button" onclick="HelpModule.switchSubTab('inquiries')" style="border: none; background: transparent; padding: 10px 16px; font-size: 13px; font-weight: 800; cursor: pointer; border-bottom: 2.5px solid ${this.activeSubTab === 'inquiries' ? '#4f46e5' : 'transparent'}; color: ${this.activeSubTab === 'inquiries' ? '#4f46e5' : '#64748b'}; transition: all 0.15s ease;">
            📋 Ecosystem Inquiries ${pendingInquiriesCount > 0 ? `<span class="badge" style="background: rgba(245, 158, 11, 0.12); color: #d97706; font-size: 10.5px; margin-left: 4px;">${pendingInquiriesCount} Pending</span>` : ''}
          </button>
          <button type="button" onclick="HelpModule.switchSubTab('faq')" style="border: none; background: transparent; padding: 10px 16px; font-size: 13px; font-weight: 800; cursor: pointer; border-bottom: 2.5px solid ${this.activeSubTab === 'faq' ? '#4f46e5' : 'transparent'}; color: ${this.activeSubTab === 'faq' ? '#4f46e5' : '#64748b'}; transition: all 0.15s ease;">
            ❓ Searchable FAQ
          </button>
          <button type="button" onclick="HelpModule.switchSubTab('guides')" style="border: none; background: transparent; padding: 10px 16px; font-size: 13px; font-weight: 800; cursor: pointer; border-bottom: 2.5px solid ${this.activeSubTab === 'guides' ? '#4f46e5' : 'transparent'}; color: ${this.activeSubTab === 'guides' ? '#4f46e5' : '#64748b'}; transition: all 0.15s ease;">
            📖 Campus Guides &amp; Wi-Fi
          </button>
          <button type="button" onclick="HelpModule.switchSubTab('emergency')" style="border: none; background: transparent; padding: 10px 16px; font-size: 13px; font-weight: 800; cursor: pointer; border-bottom: 2.5px solid ${this.activeSubTab === 'emergency' ? '#dc2626' : 'transparent'}; color: ${this.activeSubTab === 'emergency' ? '#dc2626' : '#64748b'}; transition: all 0.15s ease;">
            🚨 Emergency &amp; Safety
          </button>
        </div>

        <!-- Render Current SubTab Content -->
        <div id="help-subtab-container">
          ${this.renderSubTabContent(tickets, inquiries, hubSettings, activeStartup)}
        </div>

      </div>
    `;
  },

  switchSubTab(tab) {
    this.activeSubTab = tab;
    this.render();
  },

  renderSubTabContent(tickets, inquiries, hubSettings, activeStartup) {
    switch (this.activeSubTab) {
      case 'tickets':
        return this.renderTicketsTab(tickets, activeStartup);
      case 'inquiries':
        return this.renderInquiriesTab(inquiries, activeStartup);
      case 'faq':
        return this.renderFaqTab();
      case 'guides':
        return this.renderGuidesTab();
      case 'emergency':
        return this.renderEmergencyTab(hubSettings);
      default:
        return this.renderTicketsTab(tickets, activeStartup);
    }
  },

  // --- SubTab 1: Tickets ---
  renderTicketsTab(tickets, activeStartup) {
    return `
      <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 24px; align-items: start;">
        
        <!-- Ticket Creation Form -->
        <div class="card" style="padding: 22px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;">Priority Dispatch</div>
            <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 2px 0 4px;">Raise Support or Facility Ticket</h3>
            <p style="font-size: 12.5px; color: #64748b; margin: 0;">Report Wi-Fi issues, air-conditioning, meeting room AV, or desk maintenance.</p>
          </div>

          <form id="create-support-ticket-form" onsubmit="HelpModule.handleTicketSubmit(event)">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Issue Category <span style="color: #ef4444;">*</span></label>
              <select id="t-category" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #ffffff;">
                <option value="IT & High-Speed Wi-Fi">IT &amp; High-Speed Wi-Fi</option>
                <option value="Facility & Maintenance">Facility, HVAC &amp; Maintenance</option>
                <option value="Meeting Room AV & Tech">Meeting Room AV &amp; Projector</option>
                <option value="Billing & Credit Quota">Billing, Invoices &amp; Credit Quota</option>
                <option value="Visitor & Gate Access">Visitor Passes &amp; Turnstile Access</option>
                <option value="Housekeeping & Pantry">Housekeeping &amp; Pantry</option>
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Priority Level <span style="color: #ef4444;">*</span></label>
                <select id="t-priority" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #ffffff;">
                  <option value="Medium">Medium (SLA: 8 Business Hours)</option>
                  <option value="High">High (SLA: 4 Hours)</option>
                  <option value="Urgent">Urgent (SLA: 2 Hours - Critical Outage)</option>
                  <option value="Low">Low (SLA: 24 Hours)</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Room / Location <span style="color: #ef4444;">*</span></label>
                <select id="t-location" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #ffffff;">
                  <option value="Cabin 103 (Pod 4)">Cabin 103 (Pod 4 - Allocated Space)</option>
                  <option value="Boardroom Alpha">Boardroom Alpha (Floor 2)</option>
                  <option value="Pitch Arena Nexus">Pitch Arena Nexus (Floor 1)</option>
                  <option value="Focus Room">Focus Room (Floor 3)</option>
                  <option value="Hot Desk Zone">Hot Desk Zone (Floor 2)</option>
                  <option value="Cafeteria & Lounge">Cafeteria &amp; Lounge</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Subject / Issue Summary <span style="color: #ef4444;">*</span></label>
              <input type="text" id="t-subject" placeholder="e.g. Wi-Fi packet drop in Cabin 103" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: 11.5px; font-weight: 700; color: #334155;">Description &amp; Observations <span style="color: #ef4444;">*</span></label>
                <span id="ticket-char-counter" style="font-size: 11px; color: #94a3b8;">0 / 20 chars min</span>
              </div>
              <textarea 
                id="t-description" 
                rows="4" 
                placeholder="Provide details about the issue, affected devices, or error codes..." 
                required 
                oninput="HelpModule.updateTicketCounter(this.value)"
                style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; resize: vertical;"
              ></textarea>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Photo Attachment (Optional)</label>
              <input type="file" id="t-photo" accept="image/*" style="font-size: 12px; color: #64748b;" />
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; font-weight: 800; padding: 10px; background: #4f46e5; border-color: #4f46e5; border-radius: 8px;">
              Submit Support Ticket ➔
            </button>
          </form>
        </div>

        <!-- My Tickets List with SLA Indicator -->
        <div class="card" style="padding: 22px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 2px;">Company Support Tickets</h3>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Track ticket progress, staff comments, and resolution times.</p>
            </div>
            <span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-weight: 800; font-size: 11px;">
              ${tickets.length} Total
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; max-height: 520px; overflow-y: auto;">
            ${tickets.length === 0 ? `
              <div style="padding: 40px 20px; text-align: center; color: #8a90a2;">
                <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
                <div style="font-size: 13.5px; font-weight: 700; color: #0f172a;">No open tickets!</div>
                <div style="font-size: 12px; margin-top: 4px;">All facilities and systems are running normally.</div>
              </div>
            ` : tickets.map(t => {
              const isOpen = t.status === 'Open';
              const isInProgress = t.status === 'In Progress';
              const isResolved = t.status === 'Resolved';
              const isUrgent = t.priority === 'Urgent';

              return `
                <div style="padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: ${isOpen ? '#fffdf7' : '#ffffff'}; transition: all 0.15s ease;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 6px;">
                    <div>
                      <span style="font-family: var(--font-mono, monospace); font-size: 11.5px; font-weight: 800; color: #4f46e5;">
                        ${t.ticketNumber || t.id}
                      </span>
                      <strong style="font-size: 13px; color: #0f172a; margin-left: 6px;">${t.subject}</strong>
                    </div>
                    <span class="badge" style="background: ${isResolved ? 'rgba(34, 197, 94, 0.12)' : isInProgress ? 'rgba(37, 99, 235, 0.1)' : 'rgba(245, 158, 11, 0.12)'}; color: ${isResolved ? '#16a34a' : isInProgress ? '#2563eb' : '#d97706'}; font-weight: 800; font-size: 11px;">
                      ${t.status}
                    </span>
                  </div>

                  <p style="font-size: 12px; color: #475569; margin: 0 0 10px 0; line-height: 1.4;">
                    ${t.description}
                  </p>

                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #64748b; border-top: 1px dashed #f1f5f9; padding-top: 8px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                      <span>📍 ${t.location}</span>
                      <span class="badge" style="background: ${isUrgent ? 'rgba(239, 68, 68, 0.1)' : '#f1f5f9'}; color: ${isUrgent ? '#dc2626' : '#64748b'}; font-weight: 700; font-size: 10.5px;">
                        ${t.priority}
                      </span>
                      <span>⏱️ SLA: ${t.slaHours}h</span>
                    </div>
                    <div>
                      ${isResolved ? `
                        <span style="color: #16a34a; font-weight: 700;">✓ Resolved</span>
                      ` : `
                        <button type="button" class="btn btn-outline btn-sm" onclick="HelpModule.markTicketResolved('${t.id}')" style="font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-color: #cbd5e1;">
                          Mark Resolved
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  },

  updateTicketCounter(val) {
    const el = document.getElementById('ticket-char-counter');
    if (!el) return;
    const len = val.trim().length;
    el.innerText = `${len} / 20 chars min`;
    el.style.color = len >= 20 ? '#16a34a' : '#ef4444';
  },

  handleTicketSubmit(e) {
    e.preventDefault();
    const cat = document.getElementById('t-category').value;
    const priority = document.getElementById('t-priority').value;
    const loc = document.getElementById('t-location').value;
    const subject = document.getElementById('t-subject').value.trim();
    const desc = document.getElementById('t-description').value.trim();

    if (desc.length < 20) {
      alert("Please provide a descriptive explanation of at least 20 characters.");
      return;
    }

    const newTicket = window.store.addSupportTicket({
      category: cat,
      priority,
      location: loc,
      subject,
      description: desc
    });

    if (window.App && window.App.showToast) {
      window.App.showToast(`✅ Ticket ${newTicket.ticketNumber} submitted! Assigned to Facilities Desk.`, 'success');
    }
    this.render();
  },

  markTicketResolved(id) {
    if (window.store && window.store.updateTicketStatus) {
      window.store.updateTicketStatus(id, 'Resolved');
      if (window.App && window.App.showToast) {
        window.App.showToast('✓ Support ticket marked as Resolved.', 'info');
      }
      this.render();
    }
  },

  // --- SubTab 2: Inquiries ("Get in Touch") ---
  renderInquiriesTab(inquiries, activeStartup) {
    return `
      <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 24px; align-items: start;">
        
        <!-- Get in Touch Form with Live Validation & Honeypot Protection -->
        <div class="card" style="padding: 22px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;">Ecosystem Support</div>
            <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 2px 0 4px;">Get in Touch / Submit Inquiry</h3>
            <p style="font-size: 12.5px; color: #64748b; margin: 0;">Have a strategic query regarding cohorts, mentorship, or campus facilities? Send a confidential inquiry.</p>
          </div>

          <form id="nexus-inquiry-form" onsubmit="HelpModule.handleInquirySubmit(event)">
            <!-- Anti-spam Honeypot (hidden from real users) -->
            <input type="text" id="inq-website-hp" style="display: none !important;" tabindex="-1" autocomplete="off" />

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Full Name <span style="color: #ef4444;">*</span></label>
                <input type="text" id="inq-name" value="Alex Morgan" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Phone Number (+91, 10 Digits) <span style="color: #ef4444;">*</span></label>
                <input type="tel" id="inq-phone" value="+91 98765 43210" pattern="^(\\+91[\\-\\s]?)?[0-9]{10}$" title="Enter a valid 10-digit Indian phone number" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Email Address <span style="color: #ef4444;">*</span></label>
                <input type="email" id="inq-email" value="alex.m@xyztech.io" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Organization / Startup <span style="color: #ef4444;">*</span></label>
                <input type="text" id="inq-org" value="${activeStartup.name || 'XYZ Technologies'}" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #f8fafc;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Department Desk <span style="color: #ef4444;">*</span></label>
                <select id="inq-category" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; background: #ffffff;">
                  <option value="General Incubation">🚀 General Incubation &amp; Cohorts</option>
                  <option value="IT & Network Infrastructure">💻 IT &amp; Dedicated Network VLAN</option>
                  <option value="Co-Working & Workspace">🏢 Co-Working Seating &amp; Private Cabins</option>
                  <option value="Funding & Investor Relations">💰 Funding &amp; Investor Network</option>
                  <option value="Mentorship & Enterprise Partnerships">🤝 Mentorship &amp; Corporate Pilots</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Subject <span style="color: #ef4444;">*</span></label>
                <input type="text" id="inq-subject" placeholder="e.g. Dedicated VLAN Subnet Request" required style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;" />
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: 11.5px; font-weight: 700; color: #334155;">Detailed Message <span style="color: #ef4444;">*</span></label>
                <span id="inquiry-char-counter" style="font-size: 11px; color: #94a3b8;">0 / 30 chars min</span>
              </div>
              <textarea 
                id="inq-message" 
                rows="4" 
                placeholder="State your venture requirements or operational request..." 
                required 
                oninput="HelpModule.updateInquiryCounter(this.value)"
                style="width: 100%; box-sizing: border-box; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px; resize: vertical;"
              ></textarea>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 11.5px; color: #475569; cursor: pointer;">
                <input type="checkbox" id="inq-consent" required style="margin-top: 2px;" />
                <span>I consent to Nexus Hub processing this inquiry in compliance with the Incubation Data Privacy Policy.</span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; font-weight: 800; padding: 10px; background: #4f46e5; border-color: #4f46e5; border-radius: 8px;">
              Submit Inquiry ➔
            </button>
          </form>
        </div>

        <!-- My Inquiries Log (Scoped strictly to member's company) -->
        <div class="card" style="padding: 22px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 2px;">Inquiry History &amp; SLA Status</h3>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Inquiries submitted by ${activeStartup.name || 'your company'}.</p>
            </div>
            <span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-weight: 800; font-size: 11px;">
              ${inquiries.length} Inquiries
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; max-height: 520px; overflow-y: auto;">
            ${inquiries.length === 0 ? `
              <div style="padding: 40px 20px; text-align: center; color: #8a90a2;">
                <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
                <div style="font-size: 13.5px; font-weight: 700; color: #0f172a;">No inquiries recorded yet</div>
                <div style="font-size: 12px; margin-top: 4px;">Use the form to submit an official inquiry to the desk.</div>
              </div>
            ` : inquiries.map(inq => {
              const createdDate = new Date(inq.createdAt || '2026-10-12');
              const dayDiff = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
              
              // Date formatted cleanly as "12 Oct 2026"
              const dateFormatted = createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

              const isNew = inq.status === 'New';
              const isInProgress = inq.status === 'In progress' || inq.status === 'In Review';
              const isReplied = inq.status === 'Replied' || inq.status === 'Resolved';

              return `
                <div style="padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px;">
                    <div>
                      <span style="font-family: var(--font-mono, monospace); font-size: 11.5px; font-weight: 800; color: #4f46e5;">
                        ${inq.ticketNumber || inq.id}
                      </span>
                      <strong style="font-size: 13px; color: #0f172a; margin-left: 6px;">${inq.subject}</strong>
                    </div>
                    <span class="badge" style="background: ${isReplied ? 'rgba(34, 197, 94, 0.12)' : isInProgress ? 'rgba(37, 99, 235, 0.1)' : 'rgba(245, 158, 11, 0.12)'}; color: ${isReplied ? '#16a34a' : isInProgress ? '#2563eb' : '#d97706'}; font-weight: 800; font-size: 11px;">
                      ${inq.status}
                    </span>
                  </div>

                  <p style="font-size: 12px; color: #475569; margin: 0 0 10px 0; line-height: 1.4;">
                    ${inq.message}
                  </p>

                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #64748b; border-top: 1px dashed #f1f5f9; padding-top: 8px;">
                    <div>
                      <span>📁 <strong>Dept:</strong> ${inq.category}</span> • 
                      <span>📅 <strong>Date:</strong> ${dateFormatted}</span>
                    </div>
                    <div>
                      <span class="badge" style="background: ${dayDiff > 14 ? 'rgba(239, 68, 68, 0.1)' : '#f1f5f9'}; color: ${dayDiff > 14 ? '#dc2626' : '#64748b'}; font-weight: 700; font-size: 10.5px;">
                        Age: ${dayDiff}d • ${dayDiff > 2 ? 'SLA Alert' : 'On Track'}
                      </span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  },

  updateInquiryCounter(val) {
    const el = document.getElementById('inquiry-char-counter');
    if (!el) return;
    const len = val.trim().length;
    el.innerText = `${len} / 30 chars min`;
    el.style.color = len >= 30 ? '#16a34a' : '#ef4444';
  },

  handleInquirySubmit(e) {
    e.preventDefault();
    
    // Honeypot check
    const hp = document.getElementById('inq-website-hp');
    if (hp && hp.value) {
      console.warn("Spam honeypot triggered");
      return;
    }

    // Rate limiting: 1 submission per 20 seconds
    const lastSubmit = parseInt(localStorage.getItem(this.inquiryRateLimitKey) || '0', 10);
    const now = Date.now();
    if (now - lastSubmit < 20000) {
      alert("Please wait a few seconds before submitting another inquiry.");
      return;
    }

    const name = document.getElementById('inq-name').value.trim();
    let phone = document.getElementById('inq-phone').value.trim();
    const email = document.getElementById('inq-email').value.trim();
    const org = document.getElementById('inq-org').value.trim();
    const cat = document.getElementById('inq-category').value;
    const subject = document.getElementById('inq-subject').value.trim();
    const msg = document.getElementById('inq-message').value.trim();

    if (msg.length < 30) {
      alert("Please enter at least 30 characters in your inquiry message.");
      return;
    }

    const newInq = window.store.addContactInquiry({
      name,
      phone,
      email,
      organization: org,
      category: cat,
      subject,
      message: msg
    });

    localStorage.setItem(this.inquiryRateLimitKey, String(now));

    if (window.App && window.App.showToast) {
      window.App.showToast(`✅ Inquiry ${newInq.ticketNumber} submitted! Assigned to ${cat} desk.`, 'success');
    }

    this.render();
  },

  // --- SubTab 3: Searchable FAQ ---
  renderFaqTab() {
    const faqs = [
      {
        q: "What are the bookable hours for meeting rooms?",
        a: "Meeting rooms can be reserved daily from 07:00 AM to 11:00 PM IST via the Meeting Rooms tab. Bookings debit from your company's monthly credit quota (10 credits = 1 hour).",
        cat: "Meeting Rooms"
      },
      {
        q: "How does the monthly credit quota renewal and top-up work?",
        a: "Plan hours reset on the 1st of every month with a strict month-end expiry. Top-up packs (Starter, Growth, Scale) are valid for 90 days from the purchase date and consume after plan credits.",
        cat: "Billing & Credits"
      },
      {
        q: "How do I pre-register a client or external investor?",
        a: "Navigate to the Visitors tab, click '+ Pre-Register Guest', enter their phone number and government ID type. The visitor receives a digital QR entrance pass valid at Gate 1 Reception.",
        cat: "Visitors & Access"
      },
      {
        q: "How do I connect to Enterprise Wi-Fi across floors?",
        a: "Select the 'NexusHub-Enterprise' SSID on your device. Authenticate with your member credentials or use 802.1X PEAP with MSCHAPv2.",
        cat: "Wi-Fi & IT"
      },
      {
        q: "What is the policy for meeting room late cancellations?",
        a: "Cancellations made at least 2 hours before the start time receive an immediate 100% credit refund. Late cancellations inside the 2-hour window forfeit credits.",
        cat: "Meeting Rooms"
      },
      {
        q: "Who has access to download GST invoices and TDS certificates?",
        a: "Company Admins and Operators can view and download all GST-compliant tax invoices, credit notes, and GSTR-1 summaries in the Billing tab.",
        cat: "Billing & Credits"
      }
    ];

    const qLower = this.faqSearchQuery.toLowerCase();
    const filtered = this.faqSearchQuery
      ? faqs.filter(f => f.q.toLowerCase().includes(qLower) || f.a.toLowerCase().includes(qLower) || f.cat.toLowerCase().includes(qLower))
      : faqs;

    return `
      <div style="max-width: 900px; margin: 0 auto;">
        <!-- Search Bar -->
        <div style="position: relative; margin-bottom: 24px;">
          <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; color: #94a3b8;">🔍</span>
          <input 
            type="text" 
            placeholder="Search questions about Wi-Fi, meeting room credits, visitor passes, or billing..." 
            value="${this.faqSearchQuery}"
            oninput="HelpModule.handleFaqSearch(this.value)"
            style="width: 100%; box-sizing: border-box; padding: 12px 14px 12px 42px; font-size: 14px; border-radius: 12px; border: 1.5px solid #cbd5e1; outline: none; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.03);"
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${filtered.length === 0 ? `
            <div style="padding: 40px 20px; text-align: center; color: #8a90a2;">
              <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a;">No matching answers found</div>
              <div style="font-size: 12px; margin-top: 4px;">Raise a support ticket using the Tickets tab above to contact our desk.</div>
            </div>
          ` : filtered.map((f, idx) => `
            <div class="card" style="padding: 18px 20px; border-radius: 12px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
                  ${f.q}
                </h4>
                <span class="badge" style="background: rgba(79, 70, 229, 0.08); color: #4f46e5; font-size: 10.5px; font-weight: 700; flex-shrink: 0;">
                  ${f.cat}
                </span>
              </div>
              <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.55;">
                ${f.a}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  handleFaqSearch(val) {
    this.faqSearchQuery = val.trim();
    const cont = document.getElementById('help-subtab-container');
    if (cont) {
      cont.innerHTML = this.renderFaqTab();
    }
  },

  // --- SubTab 4: Guides & Wi-Fi ---
  renderGuidesTab() {
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px;">
        
        <!-- Guide 1: Wi-Fi Setup -->
        <div class="card" style="padding: 20px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(37, 99, 235, 0.1); color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              📶
            </div>
            <div>
              <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0;">Enterprise Wi-Fi Setup</h3>
              <div style="font-size: 11.5px; color: #64748b;">High-Speed 1 Gbps Dual-Band WPA3</div>
            </div>
          </div>
          <ol style="font-size: 12.5px; color: #475569; padding-left: 18px; margin: 0 0 16px 0; line-height: 1.6;">
            <li>Select <strong>NexusHub-Enterprise</strong> on your laptop/phone.</li>
            <li>Security type: <strong>WPA3 / 802.1X EAP-PEAP</strong>.</li>
            <li>Enter your registered company founder email &amp; portal password.</li>
            <li>CA Certificate: <strong>Trust System Default</strong>.</li>
          </ol>
          <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; font-size: 11.5px; color: #64748b; margin-bottom: 12px;">
            🔑 <strong>Guest Network:</strong> <code>NexusHub-Guest</code> (SMS OTP login, 50 Mbps bandwidth).
          </div>
        </div>

        <!-- Guide 2: Meeting Room Projection -->
        <div class="card" style="padding: 20px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              📽️
            </div>
            <div>
              <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0;">Wireless Screen Projection</h3>
              <div style="font-size: 11.5px; color: #64748b;">ClickShare, AirPlay &amp; Miracast</div>
            </div>
          </div>
          <ol style="font-size: 12.5px; color: #475569; padding-left: 18px; margin: 0 0 16px 0; line-height: 1.6;">
            <li>Power on the room display using the centralized touch tablet.</li>
            <li>Plug in the <strong>ClickShare USB-C dongle</strong> or use Apple AirPlay to <code>Room-Display-4K</code>.</li>
            <li>For Zoom/Teams meetings, select <strong>Room Camera &amp; Mic Array</strong> in audio settings.</li>
            <li>Press the dongle button once to present screen.</li>
          </ol>
          <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; font-size: 11.5px; color: #64748b; margin-bottom: 12px;">
            💡 Need an adapter? USB-C to HDMI cables are available in the room credenza.
          </div>
        </div>

        <!-- Guide 3: Digital Visitor Gate Passes -->
        <div class="card" style="padding: 20px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(168, 85, 247, 0.1); color: #a855f7; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              🪪
            </div>
            <div>
              <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0;">Visitor Check-in Process</h3>
              <div style="font-size: 11.5px; color: #64748b;">Gate 1 Turnstile &amp; Reception</div>
            </div>
          </div>
          <ol style="font-size: 12.5px; color: #475569; padding-left: 18px; margin: 0 0 16px 0; line-height: 1.6;">
            <li>Pre-register your visitor in the <strong>Visitors</strong> tab.</li>
            <li>The guest shows their QR code pass at the Gate 1 scanner.</li>
            <li>Security verifies Government Photo ID (Aadhaar / DL / Passport).</li>
            <li>You receive an automated in-app &amp; WhatsApp arrival alert.</li>
          </ol>
          <button type="button" class="btn btn-outline btn-sm" onclick="App.switchTab('contact')" style="font-size: 11.5px; font-weight: 700; width: 100%; justify-content: center;">
            Open Visitors Manager →
          </button>
        </div>

      </div>
    `;
  },

  // --- SubTab 5: Emergency & Safety Contacts (Exclusively Emergency Numbers) ---
  renderEmergencyTab(hubSettings) {
    return `
      <div style="max-width: 900px; margin: 0 auto;">
        
        <!-- Urgent Alert Banner -->
        <div style="padding: 16px 20px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 14px; display: flex; align-items: center; gap: 14px; margin-bottom: 24px;">
          <span style="font-size: 28px;">🚨</span>
          <div>
            <h3 style="font-size: 15px; font-weight: 900; color: #991b1b; margin: 0 0 2px;">Campus Emergency Response Team (24/7)</h3>
            <p style="font-size: 12.5px; color: #b91c1c; margin: 0;">In case of fire, medical distress, or security incidents, call the direct lines below immediately.</p>
          </div>
        </div>

        <!-- 4 Emergency Contacts Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px;">
          
          <div class="card" style="padding: 18px; border-radius: 12px; border: 1px solid #fee2e2; background: #ffffff;">
            <div style="font-size: 24px; margin-bottom: 8px;">🛡️</div>
            <div style="font-size: 11.5px; font-weight: 700; color: #dc2626; text-transform: uppercase;">Campus Security Desk</div>
            <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 4px 0;">Ext. 100</div>
            <div style="font-size: 13px; font-weight: 700;">
              <a href="tel:+918045678999" style="color: #dc2626; text-decoration: none;">+91 80 4567 8999</a>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Available 24 hours daily at Gate 1 Main Control.</div>
          </div>

          <div class="card" style="padding: 18px; border-radius: 12px; border: 1px solid #fee2e2; background: #ffffff;">
            <div style="font-size: 24px; margin-bottom: 8px;">🚒</div>
            <div style="font-size: 11.5px; font-weight: 700; color: #dc2626; text-transform: uppercase;">Fire Safety &amp; Control</div>
            <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 4px 0;">Ext. 101 / Dial 101</div>
            <div style="font-size: 13px; font-weight: 700;">
              <a href="tel:101" style="color: #dc2626; text-decoration: none;">National Emergency: 101</a>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Smoke alarms &amp; sprinkler risers on all 4 floors.</div>
          </div>

          <div class="card" style="padding: 18px; border-radius: 12px; border: 1px solid #fee2e2; background: #ffffff;">
            <div style="font-size: 24px; margin-bottom: 8px;">🚑</div>
            <div style="font-size: 11.5px; font-weight: 700; color: #dc2626; text-transform: uppercase;">Medical Desk &amp; Ambulance</div>
            <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 4px 0;">Ext. 102 / Dial 108</div>
            <div style="font-size: 13px; font-weight: 700;">
              <a href="tel:108" style="color: #dc2626; text-decoration: none;">Ambulance: 108</a>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">First Aid kits located at every floor reception.</div>
          </div>

          <div class="card" style="padding: 18px; border-radius: 12px; border: 1px solid #fee2e2; background: #ffffff;">
            <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
            <div style="font-size: 11.5px; font-weight: 700; color: #dc2626; text-transform: uppercase;">Evacuation Assembly Area</div>
            <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 4px 0;">East Campus Lawn</div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">
              Follow the green illuminated exit signs. Do NOT use elevators during emergency alarms.
            </div>
          </div>

        </div>

        <div style="padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 12px; color: #64748b; text-align: center;">
          Looking for Wi-Fi or technical configuration? Visit the <a href="javascript:void(0)" onclick="HelpModule.switchSubTab('guides')" style="color: #4f46e5; font-weight: 700; text-decoration: underline;">Campus Guides &amp; Wi-Fi</a> section.
        </div>

      </div>
    `;
  }
};

window.HelpModule = HelpModule;
