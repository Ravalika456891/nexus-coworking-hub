// T-Hub Contact Us & Ecosystem Support Module (Inspired by https://www.t-hub.co/contact-us)

const ContactModule = {
  departments: [
    {
      id: 'academia',
      title: 'Academia',
      email: 'academia@t-hub.co',
      icon: '🎓',
      desc: 'For curated Students, Faculty and Researchers group engagements and immersive learning experiences.'
    },
    {
      id: 'funding',
      title: 'Funding',
      email: 'contact@t-hub.co',
      icon: '💰',
      desc: 'Access strategic funding opportunities to accelerate your startup’s long-term growth journey.'
    },
    {
      id: 'coworking',
      title: 'Co-Working Spaces',
      email: 'coworking@t-hub.co',
      icon: '🏢',
      desc: 'T-Hub is a Fully Managed Workspace With Best-in-class Infrastructure and Facilities of Global Standards.'
    },
    {
      id: 'events',
      title: 'Host an Event',
      email: 'events@t-hub.co',
      icon: '🎤',
      desc: 'Host an event of any size, with the best in class infrastructure supported by well trained in-house team.'
    },
    {
      id: 'studentvisit',
      title: 'Student Visits',
      email: 'studentvisit@t-hub.co',
      icon: '🎒',
      desc: 'Step into the future of innovation with an immersive, hands-on campus visit experience.'
    },
    {
      id: 'corporates',
      title: 'Corporates',
      email: 'ci@t-hub.co',
      icon: '🌐',
      desc: 'We drive open innovation and digital transformation for global corporations through cutting-edge startups.'
    },
    {
      id: 'international',
      title: 'International',
      email: 'thubip@t-hub.co',
      icon: '✈️',
      desc: 'Partnering with international corporations and government institutions to advance innovation and digital transformation.'
    },
    {
      id: 'valuepartners',
      title: 'Value Partners',
      email: 'valuepartners@t-hub.co',
      icon: '🤝',
      desc: 'Join our Value Partner network to offer exclusive services and benefits to startups.'
    },
    {
      id: 'ceo_requests',
      title: 'Guest Requests for CEO',
      email: 'leadership.office@t-hub.co',
      icon: '👔',
      desc: 'Request CEO participation for high-impact global events and engagements.'
    }
  ],

  render() {
    const container = document.getElementById('view-contact');
    if (!container) return;

    const inquiries = window.store.getContactInquiries ? window.store.getContactInquiries() : [];

    container.innerHTML = `
      <div class="thub-container">
        <!-- Hero Header -->
        <div class="thub-hero-card">
          <div class="thub-hero-badge">
            <span>🏛️</span>
            <span>Telangana Innovation Ecosystem • Hyderabad Knowledge City</span>
          </div>
          <h1 class="thub-hero-title">Contact Us</h1>
          <p class="thub-hero-subtitle">
            Step into T-Hub: The World’s Largest Innovation Campus and Incubation Ecosystem. Whether you are a founder looking for incubation, an investor, a corporate partner, or an academic institution, we’d love to connect.
          </p>

          <div class="thub-stats-row">
            <div class="thub-stat-pill">
              <div class="thub-stat-icon">🏢</div>
              <div>
                <div class="thub-stat-num">580,000+ sq.ft</div>
                <div class="thub-stat-lbl">World's Largest Campus</div>
              </div>
            </div>
            <div class="thub-stat-pill">
              <div class="thub-stat-icon">🚀</div>
              <div>
                <div class="thub-stat-num">2,000+ Startups</div>
                <div class="thub-stat-lbl">Incubated & Accelerated</div>
              </div>
            </div>
            <div class="thub-stat-pill">
              <div class="thub-stat-icon">💰</div>
              <div>
                <div class="thub-stat-num">₹22,000+ Cr</div>
                <div class="thub-stat-lbl">Cumulative Funds Raised</div>
              </div>
            </div>
            <div class="thub-stat-pill">
              <div class="thub-stat-icon">🌐</div>
              <div>
                <div class="thub-stat-num">600+ Partners</div>
                <div class="thub-stat-lbl">Corporates & Investors</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 9 Ecosystem Verticals Grid (As on t-hub.co/contact-us) -->
        <div>
          <div class="thub-section-title-wrap">
            <div>
              <h2 class="thub-section-title">
                <span>⚡</span>
                <span>Ecosystem Departments & Direct Contacts</span>
              </h2>
              <p class="thub-section-desc">
                Click any vertical to instantly pre-fill your inquiry form or email the domain desk directly.
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <a href="#fillform" class="btn btn-primary btn-sm" style="background: #ed441b; border-color: #ed441b;">
                ✍️ Fill Quick Form
              </a>
            </div>
          </div>

          <div class="thub-departments-grid">
            ${this.departments.map(dept => `
              <div class="thub-dept-card">
                <div class="thub-dept-header">
                  <div class="thub-dept-icon">${dept.icon}</div>
                  <div class="thub-dept-title">${dept.title}</div>
                </div>
                <div class="thub-dept-desc">${dept.desc}</div>
                <div class="thub-dept-footer">
                  <a href="mailto:${dept.email}" class="thub-email-link" title="Send direct email to ${dept.email}">
                    <span>✉️</span> ${dept.email}
                  </a>
                  <button class="thub-dept-btn" onclick="ContactModule.prefillAndScroll('${dept.title}', '${dept.email}')">
                    Enquire →
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Split Section: Interactive Form + Campus Location & Map -->
        <div class="thub-split-layout" id="fillform">
          <!-- Get In Touch Form -->
          <div class="thub-form-box">
            <div style="margin-bottom: 20px;">
              <span class="badge" style="background: rgba(237, 68, 27, 0.1); color: #ed441b; border: 1px solid rgba(237, 68, 27, 0.2); font-weight: 700; margin-bottom: 8px;">
                Direct Inquiry
              </span>
              <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.02em;">
                Get In Touch
              </h2>
              <p style="font-size: 13.5px; color: var(--text-secondary); margin: 0;">
                We’d love to Hear from You. If you have any questions, fill the form and our incubation team will get back to you.
              </p>
            </div>

            <form id="thub-contact-form" onsubmit="ContactModule.handleSubmit(event)">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div class="form-group">
                  <label class="form-label" for="thub-input-name">Full Name <span style="color: #ed441b;">*</span></label>
                  <input type="text" id="thub-input-name" class="form-control" placeholder="e.g. Rahul Sharma" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="thub-input-email">Email Address <span style="color: #ed441b;">*</span></label>
                  <input type="email" id="thub-input-email" class="form-control" placeholder="name@company.com" required />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div class="form-group">
                  <label class="form-label" for="thub-input-phone">Phone Number <span style="color: #ed441b;">*</span></label>
                  <input type="tel" id="thub-input-phone" class="form-control" placeholder="+91 98765 43210" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="thub-input-org">Startup / Organization</label>
                  <input type="text" id="thub-input-org" class="form-control" placeholder="e.g. NextGen Robotics Ltd" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div class="form-group">
                  <label class="form-label" for="thub-input-category">Inquiry Department <span style="color: #ed441b;">*</span></label>
                  <select id="thub-input-category" class="form-control" onchange="ContactModule.onCategoryChange(this.value)" required>
                    <option value="">Select Department...</option>
                    ${this.departments.map(d => `<option value="${d.title}" data-email="${d.email}">${d.icon} ${d.title} (${d.email})</option>`).join('')}
                    <option value="General Incubation">🚀 General Incubation & Cohorts</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="thub-input-subject">Subject <span style="color: #ed441b;">*</span></label>
                  <input type="text" id="thub-input-subject" class="form-control" placeholder="e.g. Co-Working Seating for 12 Founders" required />
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 18px;">
                <label class="form-label" for="thub-input-message">Message & Specific Requirements <span style="color: #ed441b;">*</span></label>
                <textarea id="thub-input-message" class="form-control" rows="4" placeholder="Tell us more about your venture stage, requirements, team size or query..." required></textarea>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
                <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  <span>🔒</span> Confidential incubation inquiry. Encrypted transmission.
                </div>
                <button type="submit" class="btn btn-primary" style="background: #ed441b; border-color: #ed441b; padding: 10px 24px; font-weight: 700; box-shadow: 0 4px 14px rgba(237, 68, 27, 0.35);">
                  Submit Inquiry 🚀
                </button>
              </div>
            </form>
          </div>

          <!-- Step into T-Hub Campus Info -->
          <div class="thub-campus-box">
            <div>
              <span class="badge" style="background: rgba(237, 68, 27, 0.1); color: #ed441b; border: 1px solid rgba(237, 68, 27, 0.2); font-weight: 700; margin-bottom: 8px;">
                Global Innovation Campus
              </span>
              <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.02em;">
                Step into T-Hub: The Epicenter of Innovation
              </h2>
              <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">
                Visit the world's largest incubator hub located in the heart of Hyderabad Knowledge City.
              </p>
            </div>

            <!-- Interactive Map Embed -->
            <div class="thub-map-container">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.523881613474!2d78.3778022892303!3d17.434622235107103!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93e37831f177%3A0x32d4499d34baaa78!2sT-Hub%20Phase%202!5e0!3m2!1sen!2sin!4v1767168494806!5m2!1sen!2sin" 
                title="T-Hub Phase 2 Campus Map" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade">
              </iframe>
            </div>

            <div class="thub-info-card">
              <div class="thub-info-card-icon">📍</div>
              <div>
                <div class="thub-info-card-label">Office & Campus Location</div>
                <div class="thub-info-card-val">
                  Plot No 1/C, Sy No 83/1, Raidurgam Panmaktha, Hyderabad Knowledge City, Serilingampally, Hyderabad, Telangana 500081.
                </div>
              </div>
            </div>

            <div class="thub-info-card">
              <div class="thub-info-card-icon">⏰</div>
              <div>
                <div class="thub-info-card-label">Campus Visiting Hours</div>
                <div class="thub-info-card-val">
                  Monday to Friday: 9:00 AM to 6:00 PM IST<br>
                  <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">(Prior appointment recommended for security check-in)</span>
                </div>
              </div>
            </div>

            <div class="thub-info-card">
              <div class="thub-info-card-icon">📞</div>
              <div>
                <div class="thub-info-card-label">Central Hub Contacts</div>
                <div class="thub-info-card-val">
                  Email: <a href="mailto:contact@t-hub.co" style="color: #ed441b; text-decoration: none; font-weight: 700;">contact@t-hub.co</a><br>
                  Helpline: <a href="tel:+914066345555" style="color: var(--text-primary); text-decoration: none;">+91 40 6634 5555</a>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 4px;">
              <a href="https://maps.google.com/?q=T-Hub+Phase+2+Hyderabad" target="_blank" class="btn btn-outline btn-sm" style="flex: 1; justify-content: center; border-color: rgba(237, 68, 27, 0.4); color: #ed441b;">
                🗺️ Google Maps
              </a>
              <button class="btn btn-secondary btn-sm" onclick="ContactModule.openScheduleVisitModal()" style="flex: 1; justify-content: center;">
                📅 Schedule Visit
              </button>
            </div>
          </div>
        </div>

        <!-- Inquiries Tracker (Recent Ecosystem Inquiries) -->
        <div class="thub-inquiries-box">
          <div class="thub-section-title-wrap">
            <div>
              <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px;">
                📋 Hub Inquiry Log & Tracking
              </h3>
              <p style="font-size: 12.5px; color: var(--text-muted); margin: 0;">
                Recent communications received across T-Hub verticals with real-time lifecycle resolution.
              </p>
            </div>
            <div>
              <span class="badge" style="background: rgba(52, 199, 89, 0.12); color: #248a3d; font-weight: 700;">
                ● ${inquiries.length} Inquiries Logged
              </span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-medium); text-align: left; font-size: 11.5px; color: var(--text-muted); text-transform: uppercase;">
                  <th style="padding: 10px;">Ticket #</th>
                  <th style="padding: 10px;">Sender</th>
                  <th style="padding: 10px;">Department</th>
                  <th style="padding: 10px;">Subject & Requirements</th>
                  <th style="padding: 10px;">Received</th>
                  <th style="padding: 10px;">Status</th>
                  <th style="padding: 10px; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${inquiries.length === 0 ? `
                  <tr>
                    <td colspan="7" style="padding: 30px; text-align: center; color: var(--text-muted);">
                      No inquiries recorded yet. Use the form above to submit your first query.
                    </td>
                  </tr>
                ` : inquiries.map(inq => `
                  <tr style="border-bottom: 1px solid var(--border-subtle); font-size: 12.5px;">
                    <td style="padding: 12px 10px; font-family: var(--font-mono); font-weight: 700; color: #ed441b;">
                      ${inq.ticketNumber || inq.id}
                    </td>
                    <td style="padding: 12px 10px;">
                      <div style="font-weight: 700; color: var(--text-primary);">${inq.name}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${inq.email} • ${inq.phone}</div>
                    </td>
                    <td style="padding: 12px 10px;">
                      <span class="badge" style="background: rgba(237, 68, 27, 0.08); color: #ed441b; border: 1px solid rgba(237, 68, 27, 0.2); font-weight: 600;">
                        ${inq.category}
                      </span>
                    </td>
                    <td style="padding: 12px 10px; max-width: 320px;">
                      <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${inq.subject}</div>
                      <div style="font-size: 11.5px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${inq.message}
                      </div>
                    </td>
                    <td style="padding: 12px 10px; color: var(--text-muted); font-size: 11.5px;">
                      ${new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td style="padding: 12px 10px;">
                      <span class="badge ${inq.status === 'Resolved' ? 'badge-success' : (inq.status === 'In Review' ? 'badge-warning' : 'badge-primary')}" style="font-weight: 700;">
                        ${inq.status}
                      </span>
                    </td>
                    <td style="padding: 12px 10px; text-align: right;">
                      <button class="btn btn-outline btn-sm" onclick="ContactModule.viewInquiryDetails('${inq.id}')" style="padding: 4px 10px; font-size: 11px;">
                        View 🔍
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  prefillAndScroll(categoryTitle, email) {
    const select = document.getElementById('thub-input-category');
    if (select) {
      select.value = categoryTitle;
    }
    const formBox = document.getElementById('fillform');
    if (formBox) {
      formBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const subject = document.getElementById('thub-input-subject');
    if (subject && !subject.value) {
      subject.value = `Inquiry regarding ${categoryTitle} at T-Hub`;
      subject.focus();
    }
  },

  onCategoryChange(val) {
    const subject = document.getElementById('thub-input-subject');
    if (subject && (!subject.value || subject.value.startsWith('Inquiry regarding'))) {
      subject.value = val ? `Inquiry regarding ${val} at T-Hub` : '';
    }
  },

  handleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('thub-input-name').value.trim();
    const email = document.getElementById('thub-input-email').value.trim();
    const phone = document.getElementById('thub-input-phone').value.trim();
    const org = document.getElementById('thub-input-org').value.trim();
    const category = document.getElementById('thub-input-category').value;
    const subject = document.getElementById('thub-input-subject').value.trim();
    const message = document.getElementById('thub-input-message').value.trim();

    if (!name || !email || !category || !message) {
      alert("Please fill all required fields marked with *");
      return;
    }

    const deptObj = this.departments.find(d => d.title === category);
    const departmentEmail = deptObj ? deptObj.email : 'contact@t-hub.co';

    const newInq = window.store.addContactInquiry({
      name,
      email,
      phone,
      organization: org,
      category,
      department: departmentEmail,
      subject,
      message
    });

    // Reset form
    document.getElementById('thub-contact-form').reset();

    // Show Confirmation Modal
    this.showConfirmationModal(newInq);

    // Refresh view
    this.render();
  },

  showConfirmationModal(inquiry) {
    const mount = document.getElementById('modal-mount');
    if (!mount) return;

    mount.innerHTML = `
      <div class="modal-backdrop" onclick="ContactModule.closeModal()">
        <div class="modal-card" style="max-width: 520px; text-align: center; border-top: 4px solid #ed441b;" onclick="event.stopPropagation()">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(237, 68, 27, 0.12); color: #ed441b; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 16px;">
            🚀
          </div>
          <h3 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
            Inquiry Submitted Successfully!
          </h3>
          <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px;">
            Thank you, <strong>${inquiry.name}</strong>. Your message has been routed to the <strong>${inquiry.category}</strong> desk (<a href="mailto:${inquiry.department}" style="color: #ed441b;">${inquiry.department}</a>).
          </p>

          <div style="background: var(--bg-surface-elevated); border: 1px dashed rgba(237, 68, 27, 0.35); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 22px; text-align: left;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <span style="color: var(--text-muted); font-weight: 600;">Reference Ticket:</span>
              <strong style="color: #ed441b; font-family: var(--font-mono);">${inquiry.ticketNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <span style="color: var(--text-muted); font-weight: 600;">Department:</span>
              <span style="color: var(--text-primary); font-weight: 600;">${inquiry.category}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: var(--text-muted); font-weight: 600;">Response SLA:</span>
              <span style="color: #248a3d; font-weight: 700;">Within 24 Business Hours</span>
            </div>
          </div>

          <button class="btn btn-primary" onclick="ContactModule.closeModal()" style="width: 100%; justify-content: center; background: #ed441b; border-color: #ed441b;">
            Done & Return to Campus Hub
          </button>
        </div>
      </div>
    `;
  },

  viewInquiryDetails(inquiryId) {
    const inquiries = window.store.getContactInquiries();
    const inq = inquiries.find(i => i.id === inquiryId);
    if (!inq) return;

    const mount = document.getElementById('modal-mount');
    if (!mount) return;

    mount.innerHTML = `
      <div class="modal-backdrop" onclick="ContactModule.closeModal()">
        <div class="modal-card" style="max-width: 580px;" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #ed441b; text-transform: uppercase;">Ticket Dossier</div>
              <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary);">${inq.ticketNumber}</h3>
            </div>
            <button class="modal-close-btn" onclick="ContactModule.closeModal()">×</button>
          </div>

          <div class="modal-body" style="padding: 16px 24px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div style="background: var(--bg-surface-elevated); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">SENDER</div>
                <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">${inq.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${inq.email}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${inq.phone}</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">DEPARTMENT</div>
                <div style="font-size: 13.5px; font-weight: 700; color: #ed441b;">${inq.category}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${inq.department}</div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Recv: ${new Date(inq.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">SUBJECT</div>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${inq.subject}</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">MESSAGE</div>
              <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
                ${inq.message}
              </div>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button class="btn btn-outline btn-sm" onclick="ContactModule.markStatus('${inq.id}', 'In Review')">
                Set In Review
              </button>
              <button class="btn btn-primary btn-sm" onclick="ContactModule.markStatus('${inq.id}', 'Resolved')" style="background: #248a3d; border-color: #248a3d;">
                Mark Resolved ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  markStatus(id, status) {
    window.store.updateContactInquiryStatus(id, status);
    this.closeModal();
    this.render();
  },

  openScheduleVisitModal() {
    const mount = document.getElementById('modal-mount');
    if (!mount) return;

    mount.innerHTML = `
      <div class="modal-backdrop" onclick="ContactModule.closeModal()">
        <div class="modal-card" style="max-width: 500px;" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #ed441b; text-transform: uppercase;">Campus Experience</div>
              <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary);">Schedule a Campus Tour</h3>
            </div>
            <button class="modal-close-btn" onclick="ContactModule.closeModal()">×</button>
          </div>
          <div class="modal-body" style="padding: 16px 24px;">
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
              Guided delegation and student visits are conducted every Wednesday and Friday at 11:00 AM IST.
            </p>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Preferred Date</label>
              <input type="date" class="form-control" id="tour-date" value="2026-10-15" />
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Group Type</label>
              <select class="form-control" id="tour-type">
                <option>Startup Founder Delegation (1-5 pax)</option>
                <option>Corporate Innovation Team (5-15 pax)</option>
                <option>Academic / University Students (20-50 pax)</option>
                <option>Investor / VC Delegation (1-8 pax)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 18px;">
              <label class="form-label">Lead Contact Phone</label>
              <input type="tel" class="form-control" placeholder="+91 98765 43210" />
            </div>
            <button class="btn btn-primary" onclick="alert('Campus tour request registered! Our reception team will email confirmation passes.'); ContactModule.closeModal();" style="width: 100%; justify-content: center; background: #ed441b; border-color: #ed441b;">
              Confirm Tour Request 🏛️
            </button>
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
