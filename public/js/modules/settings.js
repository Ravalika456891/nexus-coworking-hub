// Nexus Hub - Settings & System Preferences Module

const SettingsModule = {
  activeSection: 'profile', // 'profile', 'security', 'sessions', 'notifications', 'timezone', 'team', 'calendars', 'privacy', 'billing'

  render() {
    const container = document.getElementById('view-settings');
    if (!container) return;

    const userRole = (window.store && window.store.currentUserRole) || 'company_admin';
    const isCompanyAdmin = userRole === 'company_admin' || userRole === 'operator' || userRole === 'super_admin';
    const isOperator = userRole === 'operator' || userRole === 'super_admin';

    const activeStartup = (window.store && window.store.getActiveStartup) ? window.store.getActiveStartup() : { name: 'XYZ Technologies' };

    container.innerHTML = `
      <div style="padding: 24px 28px; max-width: 1400px; margin: 0 auto; box-sizing: border-box;">
        
        <!-- Header -->
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.02em;">
            Settings &amp; System Preferences
          </h1>
          <p style="font-size: 13.5px; color: #64748b; margin: 0;">
            Manage your personal profile, 2FA credentials, active sessions, notification rules, team roles, and privacy settings.
          </p>
        </div>

        <!-- 2-Column Layout: Sidebar Nav + Content -->
        <div style="display: grid; grid-template-columns: 240px 1fr; gap: 24px; align-items: start;">
          
          <!-- Left Navigation Menu -->
          <div class="card" style="padding: 8px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              ${this.renderNavItem('profile', '👤', 'Profile Details')}
              ${this.renderNavItem('security', '🔐', 'Password & 2FA')}
              ${this.renderNavItem('sessions', '💻', 'Active Sessions')}
              ${this.renderNavItem('notifications', '🔔', 'Notification Rules')}
              ${this.renderNavItem('timezone', '🌍', 'Timezone & Region')}
              ${this.renderNavItem('team', '👥', 'Team & Roles', !isCompanyAdmin ? 'Admin' : null)}
              ${this.renderNavItem('calendars', '📅', 'Connected Calendars')}
              ${this.renderNavItem('privacy', '🛡️', 'Privacy & Consent')}
              ${this.renderNavItem('billing', '💳', 'Billing Profile')}
            </div>
          </div>

          <!-- Right Content Area -->
          <div class="card" style="padding: 24px; border-radius: 14px; border: 1px solid var(--border-subtle, #e2e8f0); background: #ffffff; min-height: 480px;">
            ${this.renderActiveSection(isCompanyAdmin, isOperator, activeStartup)}
          </div>

        </div>

      </div>
    `;
  },

  renderNavItem(key, icon, label, badge = null) {
    const isActive = this.activeSection === key;
    return `
      <button 
        type="button" 
        onclick="SettingsModule.switchSection('${key}')"
        style="width: 100%; border: none; background: ${isActive ? '#f1f5f9' : 'transparent'}; color: ${isActive ? '#4f46e5' : '#475569'}; font-weight: ${isActive ? '800' : '600'}; font-size: 13px; text-align: left; padding: 10px 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.15s ease;"
      >
        <span style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 15px;">${icon}</span>
          <span>${label}</span>
        </span>
        ${badge ? `
          <span class="badge" style="font-size: 10px; background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-weight: 700; padding: 1px 6px; border-radius: 999px;">
            ${badge}
          </span>
        ` : ''}
      </button>
    `;
  },

  switchSection(section) {
    this.activeSection = section;
    this.render();
  },

  renderActiveSection(isCompanyAdmin, isOperator, activeStartup) {
    switch (this.activeSection) {
      case 'profile':
        return this.renderProfileSection(activeStartup);
      case 'security':
        return this.renderSecuritySection();
      case 'sessions':
        return this.renderSessionsSection();
      case 'notifications':
        return this.renderNotificationsSection();
      case 'timezone':
        return this.renderTimezoneSection();
      case 'team':
        return this.renderTeamSection(isCompanyAdmin, isOperator);
      case 'calendars':
        return this.renderCalendarsSection();
      case 'privacy':
        return this.renderPrivacySection();
      case 'billing':
        return this.renderBillingSection(activeStartup);
      default:
        return this.renderProfileSection(activeStartup);
    }
  },

  // --- 1. Profile ---
  renderProfileSection(activeStartup) {
    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Profile Details</h2>
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">Update your founder credentials, contact numbers, and member biography.</p>
        </div>

        <form onsubmit="event.preventDefault(); window.App.showToast('✅ Profile changes saved successfully.', 'success');">
          <div style="display: flex; align-items: center; gap: 18px; margin-bottom: 22px;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
              AM
            </div>
            <div>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a;">Alex Morgan</div>
              <div style="font-size: 12px; color: #64748b;">Co-Founder &amp; CEO • ${activeStartup.name || 'XYZ Technologies'}</div>
              <button type="button" class="btn btn-outline btn-sm" onclick="alert('Photo upload dialog ready. Max size 2 MB.');" style="font-size: 11px; padding: 3px 10px; margin-top: 6px; border-radius: 6px;">
                Change Photo
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Full Name</label>
              <input type="text" value="Alex Morgan" required style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;" />
            </div>
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Primary Email</label>
              <input type="email" value="alex.m@xyztech.io" required style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #f8fafc;" readonly />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Mobile Phone</label>
              <input type="tel" value="+91 98765 43210" required style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;" />
            </div>
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Company Name</label>
              <input type="text" value="${activeStartup.name || 'XYZ Technologies'}" readonly style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #f8fafc;" />
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Founder Bio</label>
            <textarea rows="3" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;">Leading XYZ Technologies: Enterprise AI orchestration &amp; distributed edge inference for high-concurrency enterprise applications.</textarea>
          </div>

          <button type="submit" class="btn btn-primary" style="font-weight: 800; padding: 9px 22px; background: #4f46e5; border-color: #4f46e5; border-radius: 8px;">
            Save Profile Changes
          </button>
        </form>
      </div>
    `;
  },

  // --- 2. Password & 2FA (Never reveal raw tokens) ---
  renderSecuritySection() {
    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Password &amp; Two-Factor Authentication (2FA)</h2>
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">Keep your account secure with a strong password and multi-factor authenticator app verification.</p>
        </div>

        <!-- Password Change -->
        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 12px;">Change Password</h3>
          <form onsubmit="event.preventDefault(); window.App.showToast('✅ Password updated successfully.', 'success'); document.getElementById('pw-current').value=''; document.getElementById('pw-new').value=''; document.getElementById('pw-confirm').value='';" style="max-width: 480px;">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Current Password</label>
              <input type="password" id="pw-current" required placeholder="••••••••••••" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;" />
            </div>
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">New Password (Min 10 characters)</label>
              <input type="password" id="pw-new" minlength="10" required placeholder="••••••••••••" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;" />
            </div>
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Confirm New Password</label>
              <input type="password" id="pw-confirm" minlength="10" required placeholder="••••••••••••" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;" />
            </div>
            <button type="submit" class="btn btn-outline" style="font-weight: 700; padding: 8px 18px; border-radius: 8px;">
              Update Password
            </button>
          </form>
        </div>

        <!-- 2FA Section -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div>
              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 2px;">Authenticator App (TOTP)</h3>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Require a 6-digit verification code from Google Authenticator, Authy, or 1Password on sign-in.</p>
            </div>
            <span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #16a34a; font-weight: 800; padding: 4px 10px; border-radius: 999px;">
              ✓ 2FA Active
            </span>
          </div>

          <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <div style="font-size: 12px; color: #475569;">
              Connected to <strong>Google Authenticator</strong> • Key ending in <code>...9X4R</code>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="alert('Two-factor authentication reconfiguration dialog launched.');" style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
              Reconfigure 2FA
            </button>
          </div>
        </div>

      </div>
    `;
  },

  // --- 3. Active Sessions (Never expose raw tokens) ---
  renderSessionsSection() {
    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Active Sessions &amp; Device Logins</h2>
            <p style="font-size: 12.5px; color: #64748b; margin: 0;">Manage devices currently authenticated into the Nexus Hub operating system.</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.App.showToast('✓ Revoked all other active sessions.', 'info');" style="color: #dc2626; border-color: #fca5a5; font-weight: 700; padding: 6px 12px; font-size: 11.5px; border-radius: 8px;">
            Revoke All Other Sessions
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          
          <!-- Current Session -->
          <div style="padding: 14px 16px; border: 1.5px solid #c7d2fe; border-radius: 12px; background: #f8faff; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">💻</span>
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #0f172a;">Chrome on Windows 11</div>
                <div style="font-size: 11.5px; color: #64748b;">Bengaluru, Karnataka, India • IP 106.51.x.x</div>
              </div>
            </div>
            <span class="badge" style="background: rgba(34, 197, 94, 0.15); color: #16a34a; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 999px;">
              ● This Device (Active Now)
            </span>
          </div>

          <!-- Other Session 1 -->
          <div style="padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">📱</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a;">Nexus iOS App • iPhone 15 Pro</div>
                <div style="font-size: 11.5px; color: #64748b;">Bengaluru, India • IP 106.51.x.x • Last active 2 hours ago</div>
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('div').remove(); window.App.showToast('Session revoked.', 'info');" style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-color: #cbd5e1; border-radius: 6px;">
              Revoke
            </button>
          </div>

          <!-- Other Session 2 -->
          <div style="padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">💻</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a;">Safari on macOS Sequoia</div>
                <div style="font-size: 11.5px; color: #64748b;">Mumbai, India • IP 49.36.x.x • Yesterday, 06:15 PM</div>
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('div').remove(); window.App.showToast('Session revoked.', 'info');" style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-color: #cbd5e1; border-radius: 6px;">
              Revoke
            </button>
          </div>

        </div>
      </div>
    `;
  },

  // --- 4. Notification Channels ---
  renderNotificationsSection() {
    const events = [
      { id: 'bkg', label: 'Meeting Room Booking & Rescheduling Confirmed', email: true, whatsapp: true, inapp: true },
      { id: 'rem', label: 'Meeting Reminder (15 Minutes Before Start)', email: true, whatsapp: true, inapp: true },
      { id: 'vis', label: 'External Visitor / Guest Arrived at Gate 1', email: true, whatsapp: true, inapp: true },
      { id: 'quo', label: 'Credit Quota Exhaustion & Low Balance (<20%)', email: true, whatsapp: true, inapp: true },
      { id: 'inv', label: 'Monthly GST Tax Invoice Issued & Payment Receipt', email: true, whatsapp: false, inapp: true },
      { id: 'mil', label: 'Incubation Milestone Due & Committee Reviews', email: true, whatsapp: false, inapp: true }
    ];

    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Notification Channels per Event</h2>
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">Configure how your team receives alerts via In-App Feed, Email, or WhatsApp.</p>
        </div>

        <div class="table-responsive">
          <table class="nexus-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; color: #64748b; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 10px 14px;">Event Trigger</th>
                <th style="padding: 10px 14px; text-align: center;">In-App Center</th>
                <th style="padding: 10px 14px; text-align: center;">Email Digest</th>
                <th style="padding: 10px 14px; text-align: center;">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              ${events.map(ev => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 14px; font-weight: 700; color: #0f172a;">
                    ${ev.label}
                  </td>
                  <td style="padding: 12px 14px; text-align: center;">
                    <input type="checkbox" ${ev.inapp ? 'checked' : ''} onchange="window.App.showToast('Notification preference updated.', 'info');" style="cursor: pointer; width: 16px; height: 16px;" />
                  </td>
                  <td style="padding: 12px 14px; text-align: center;">
                    <input type="checkbox" ${ev.email ? 'checked' : ''} onchange="window.App.showToast('Notification preference updated.', 'info');" style="cursor: pointer; width: 16px; height: 16px;" />
                  </td>
                  <td style="padding: 12px 14px; text-align: center;">
                    <input type="checkbox" ${ev.whatsapp ? 'checked' : ''} onchange="window.App.showToast('Notification preference updated.', 'info');" style="cursor: pointer; width: 16px; height: 16px;" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --- 5. Timezone & Language ---
  renderTimezoneSection() {
    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Timezone, Region &amp; Formatting</h2>
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">Configure calendar synchronization timestamps and localized date displays.</p>
        </div>

        <form onsubmit="event.preventDefault(); window.App.showToast('✅ Regional preferences saved.', 'success');" style="max-width: 480px;">
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Default Operating Timezone</label>
            <select style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #ffffff;">
              <option value="Asia/Kolkata" selected>Asia/Kolkata (IST, UTC+05:30) • Indian Standard Time</option>
              <option value="Asia/Dubai">Asia/Dubai (GST, UTC+04:00)</option>
              <option value="Europe/London">Europe/London (GMT/BST, UTC+00:00)</option>
              <option value="America/New_York">America/New_York (EST/EDT, UTC-05:00)</option>
            </select>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">System Language</label>
            <select style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #ffffff;">
              <option value="en-IN" selected>English (India) • Default</option>
              <option value="hi-IN">Hindi (भारत)</option>
            </select>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Date Format</label>
            <input type="text" value="DD MMM YYYY (e.g. 04 Nov 2026)" readonly style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #f8fafc;" />
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px;">Time Format</label>
            <input type="text" value="12-Hour AM/PM (e.g. 10:30 AM)" readonly style="width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #f8fafc;" />
          </div>

          <button type="submit" class="btn btn-primary" style="font-weight: 800; padding: 9px 20px; background: #4f46e5; border-color: #4f46e5; border-radius: 8px;">
            Save Preferences
          </button>
        </form>
      </div>
    `;
  },

  // --- 6. Team & Roles ---
  renderTeamSection(isCompanyAdmin, isOperator) {
    const teamMembers = [
      { id: 'tm-1', name: 'Alex Morgan', email: 'alex.m@xyztech.io', role: 'company_admin', roleLabel: 'Company Admin' },
      { id: 'tm-2', name: 'Sarah Chen', email: 'sarah.c@xyztech.io', role: 'company_admin', roleLabel: 'Company Admin' },
      { id: 'tm-3', name: 'David Kim', email: 'david.k@xyztech.io', role: 'member', roleLabel: 'Member' },
      { id: 'tm-4', name: 'Priya Patel', email: 'priya.p@xyztech.io', role: 'member', roleLabel: 'Member' },
      { id: 'tm-5', name: 'Arjun Reddy', email: 'arjun.r@xyztech.io', role: 'member', roleLabel: 'Member' },
      { id: 'tm-6', name: 'Sneha Joshi', email: 'sneha.j@xyztech.io', role: 'member', roleLabel: 'Member' }
    ];

    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Company Team &amp; Roles</h2>
            <p style="font-size: 12.5px; color: #64748b; margin: 0;">Manage member access for XYZ Technologies (Allocated: 6 team members).</p>
          </div>
          ${isCompanyAdmin ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="alert('Invite Team Member modal launched. Enter email and assign member or company_admin role.');" style="font-weight: 800; padding: 6px 14px; background: #4f46e5; border-color: #4f46e5; border-radius: 8px; font-size: 12px;">
              + Invite Team Member
            </button>
          ` : ''}
        </div>

        <div class="table-responsive">
          <table class="nexus-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 0;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; color: #64748b; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 10px 14px;">Member</th>
                <th style="padding: 10px 14px;">Email</th>
                <th style="padding: 10px 14px;">Role</th>
                <th style="padding: 10px 14px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${teamMembers.map(m => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 14px; font-weight: 700; color: #0f172a;">
                    ${m.name}
                  </td>
                  <td style="padding: 12px 14px; color: #64748b;">
                    ${m.email}
                  </td>
                  <td style="padding: 12px 14px;">
                    <span class="badge" style="background: ${m.role === 'company_admin' ? 'rgba(79, 70, 229, 0.1)' : '#f1f5f9'}; color: ${m.role === 'company_admin' ? '#4f46e5' : '#475569'}; font-weight: 700; font-size: 11px;">
                      ${m.roleLabel}
                    </span>
                  </td>
                  <td style="padding: 12px 14px; text-align: right;">
                    ${isCompanyAdmin && m.email !== 'alex.m@xyztech.io' ? `
                      <button type="button" class="btn btn-outline btn-sm" onclick="window.App.showToast('Role updated for ${m.name}.', 'info');" style="font-size: 11px; padding: 3px 8px; border-color: #cbd5e1; border-radius: 6px;">
                        Change Role
                      </button>
                      <button type="button" class="btn btn-outline btn-sm" onclick="if(confirm('Remove ${m.name} from company?')) { this.closest('tr').remove(); window.App.showToast('Member removed.', 'info'); }" style="font-size: 11px; padding: 3px 8px; color: #dc2626; border-color: #fca5a5; border-radius: 6px; margin-left: 4px;">
                        Remove
                      </button>
                    ` : `
                      <span style="font-size: 11px; color: #94a3b8;">Primary Owner</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --- 7. Connected Calendars ---
  renderCalendarsSection() {
    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Connected Calendars &amp; Two-Way Sync</h2>
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">Automatically push meeting room reservations to your external calendar and receive conflict alerts.</p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; max-width: 680px;">
          
          <!-- Google Calendar -->
          <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; background: #ffffff;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <span style="font-size: 28px;">📅</span>
              <div>
                <div style="font-size: 13.5px; font-weight: 800; color: #0f172a;">Google Calendar</div>
                <div style="font-size: 12px; color: #16a34a; font-weight: 700;">● Connected as alex.m@xyztech.io</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Two-way auto sync active • Last synced 2 minutes ago</div>
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="if(confirm('Disconnect Google Calendar?')) window.App.showToast('Google Calendar disconnected.', 'info');" style="font-size: 11.5px; font-weight: 700; border-color: #cbd5e1; border-radius: 8px;">
              Disconnect
            </button>
          </div>

          <!-- Microsoft Outlook 365 -->
          <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; background: #ffffff;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <span style="font-size: 28px;">📫</span>
              <div>
                <div style="font-size: 13.5px; font-weight: 800; color: #0f172a;">Microsoft 365 / Outlook</div>
                <div style="font-size: 12px; color: #64748b;">Not connected</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Sync bookings with Exchange or corporate Outlook</div>
              </div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="alert('Redirecting to Microsoft OAuth single sign-on...');" style="font-size: 11.5px; font-weight: 800; background: #4f46e5; border-color: #4f46e5; border-radius: 8px;">
              Connect Outlook
            </button>
          </div>

          <!-- iCal Feed URL -->
          <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Universal Apple Calendar / iCal Feed</div>
            <div style="font-size: 11.5px; color: #64748b; margin-bottom: 10px;">Subscribe to your company's live meeting room feed in Apple Calendar or Thunderbird.</div>
            <div style="display: flex; gap: 8px;">
              <input type="text" value="webcal://nexushub.co/api/ical/feed/STP-XYZ" readonly style="flex: 1; font-size: 12px; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; background: #ffffff;" />
              <button type="button" class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('webcal://nexushub.co/api/ical/feed/STP-XYZ'); window.App.showToast('Copied feed URL!', 'success');" style="font-size: 11.5px; font-weight: 700; border-radius: 6px;">
                Copy URL
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  // --- 8. Privacy & Data ---
  renderPrivacySection() {
    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Privacy, DPDP Act 2023 &amp; Data Governance</h2>
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">Manage consent preferences, export company data archives, or submit deletion requests.</p>
        </div>

        <div style="max-width: 680px; display: flex; flex-direction: column; gap: 16px;">
          
          <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Public Community Directory Opt-In</div>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 10px 0;">Allow your startup profile, website, and sector to appear in the public hub member directory.</p>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #334155; cursor: pointer;">
              <input type="checkbox" checked onchange="window.App.showToast('Directory consent updated.', 'info');" style="width: 16px; height: 16px;" />
              <span>Visible in Public Community Directory</span>
            </label>
          </div>

          <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Data Portability (Export Company Records)</div>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">Download an encrypted JSON file containing your company profile, booking history, ledger transactions, and visitor logs.</p>
            <button type="button" class="btn btn-outline btn-sm" onclick="SettingsModule.exportDataArchive()" style="font-weight: 700; padding: 7px 14px; border-radius: 8px; border-color: #cbd5e1;">
              📥 Export Company Data (.JSON)
            </button>
          </div>

          <div style="padding: 16px; border: 1px solid #fee2e2; border-radius: 12px; background: #fffdfd;">
            <div style="font-size: 13.5px; font-weight: 800; color: #dc2626; margin-bottom: 4px;">Account Deletion &amp; Right to Be Forgotten</div>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">Permanently purge personal identifiers, visitor records, and member profiles upon contract completion.</p>
            <button type="button" class="btn btn-outline btn-sm" onclick="if(confirm('Submit formal data deletion request to Incubation Committee?')) window.App.showToast('Deletion request logged. Operations team will contact company admin.', 'info');" style="color: #dc2626; border-color: #fca5a5; font-weight: 700; padding: 7px 14px; border-radius: 8px;">
              Request Account Deletion
            </button>
          </div>

        </div>
      </div>
    `;
  },

  exportDataArchive() {
    const data = {
      exportedAt: new Date().toISOString(),
      company: 'XYZ Technologies',
      startupId: 'STP-XYZ',
      visitors: window.store.getVisitors ? window.store.getVisitors('STP-XYZ') : [],
      tickets: window.store.getSupportTickets ? window.store.getSupportTickets('STP-XYZ') : [],
      inquiries: window.store.getContactInquiries ? window.store.getContactInquiries('STP-XYZ') : []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_hub_export_XYZ_Technologies_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.App && window.App.showToast) {
      window.App.showToast('✅ Company data archive downloaded.', 'success');
    }
  },

  // --- 9. Billing Profile (Link to single source of truth in Billing) ---
  renderBillingSection(activeStartup) {
    return `
      <div>
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Billing Entity &amp; Invoicing Profile</h2>
          <p style="font-size: 12.5px; color: #64748b; margin: 0;">Centralized legal company identity used on GST-compliant tax invoices and TDS statements.</p>
        </div>

        <div style="max-width: 640px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
              <div>
                <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Legal Entity</span>
                <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">XYZ Technologies Pvt Ltd</div>
              </div>
              <div>
                <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">GSTIN (Karnataka)</span>
                <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">29AABCX1234F1Z5</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
              <div>
                <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Corporate PAN</span>
                <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">AABCX1234F</div>
              </div>
              <div>
                <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">TDS Rate Category</span>
                <div style="font-size: 13.5px; font-weight: 800; color: #16a34a; margin-top: 2px;">Section 194-I (Rent - 10%)</div>
              </div>
            </div>

            <div>
              <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Registered Billing Address</span>
              <div style="font-size: 12.5px; color: #334155; margin-top: 2px;">
                Cabin 103, Pod #4, Nexus Innovation Hub, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103
              </div>
            </div>
          </div>

          <div style="padding: 16px; border: 1.5px solid #c7d2fe; border-radius: 12px; background: #f8faff; margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; color: #1e1b4b; margin-bottom: 4px;">Single Source of Truth: Credits &amp; Invoices</div>
            <p style="font-size: 12px; color: #475569; margin: 0 0 12px 0; line-height: 1.5;">
              All monthly quota hours, credit packages, auto-renewal debit schedules, and downloadable GST invoices are managed directly within the Billing view.
            </p>
            <button type="button" class="btn btn-primary" onclick="App.switchTab('billingCredits')" style="font-weight: 800; padding: 9px 18px; font-size: 12.5px; background: #4f46e5; border-color: #4f46e5; border-radius: 8px;">
              Manage Invoices &amp; Top-Up Credits in Billing ➔
            </button>
          </div>
        </div>
      </div>
    `;
  }
};

window.SettingsModule = SettingsModule;
