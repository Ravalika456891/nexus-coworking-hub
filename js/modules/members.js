// Module: Members - Startup Team Directory, Invites & Role Management
// Modern, clean, responsive, role-based single source of truth

const MembersModule = {
  searchQuery: '',
  roleFilter: 'all',

  render() {
    const container = document.getElementById('view-members') || document.getElementById('view-startupTables');
    if (!container) return;

    const role = window.store.normalizeRole(window.store.currentRole);
    const isEmployee = role === 'startup_member';
    const activeStartup = (window.store && window.store.getActiveStartup) ? window.store.getActiveStartup() : { id: 'STP-XYZ', name: 'XYZ Technologies' };
    const members = (window.store && window.store.getStartupMembers) ? window.store.getStartupMembers(activeStartup.id) : [];

    // Filter
    let filtered = members;
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(m => (m.role || '').toLowerCase().includes(this.roleFilter.toLowerCase()));
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        (m.desk && m.desk.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <div style="padding: 24px 28px; max-width: 1400px; margin: 0 auto; box-sizing: border-box;">
        
        <!-- Header Banner -->
        <div class="card" style="padding: 22px 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border-subtle, #e2e8f0); background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span class="badge" style="background: rgba(79, 70, 229, 0.1); color: #4f46e5; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 999px;">
                  👥 Startup Venture Directory
                </span>
                <span class="badge badge-info" style="font-weight: 700; font-size: 11px;">${activeStartup.name} (${activeStartup.id})</span>
              </div>
              <h1 style="font-size: 24px; font-weight: 900; color: var(--text-primary, #0f172a); margin: 0 0 6px 0; letter-spacing: -0.02em;">
                Team Members &amp; Workspace Access
              </h1>
              <p style="font-size: 13.5px; color: var(--text-secondary, #475569); margin: 0; max-width: 780px; line-height: 1.5;">
                Manage authorized team seats, issue campus biometric credentials, assign dedicated desks, and invite new co-workers to <strong>${activeStartup.name}</strong>.
              </p>
            </div>

            <!-- Primary CTA (Hidden from ordinary employee members) -->
            ${!isEmployee ? `
              <button class="btn btn-primary" onclick="MembersModule.openInviteModal('${activeStartup.id}')" style="font-weight: 800; padding: 10px 20px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; background: #4f46e5; border-color: #4f46e5; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); border-radius: 9px; cursor: pointer;">
                <span>➕</span> Invite Team Member
              </button>
            ` : ''}
          </div>

          <!-- Summary Metric Pills -->
          <div style="display: flex; gap: 14px; margin-top: 18px; flex-wrap: wrap;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 10px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">👥</span>
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Active Team Size</div>
                <div style="font-size: 16px; font-weight: 900; color: #0f172a;" class="tabular-nums">${members.length} Members</div>
              </div>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 10px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🏢</span>
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Allocated Desks</div>
                <div style="font-size: 16px; font-weight: 900; color: #059669;" class="tabular-nums">${members.filter(m => m.desk && !m.desk.includes('Hot')).length} Dedicated</div>
              </div>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 10px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">⚡</span>
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Leadership</div>
                <div style="font-size: 16px; font-weight: 900; color: #4f46e5;" class="tabular-nums">${members.filter(m => m.isLeader).length} Founders / Admins</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="card" style="padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="position: relative; flex: 1; max-width: 320px; min-width: 200px;">
            <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #94a3b8; pointer-events: none;">🔍</span>
            <input 
              type="text" 
              placeholder="Search team members by name, role, email..." 
              value="${this.searchQuery}"
              oninput="MembersModule.setSearch(this.value)"
              style="width: 100%; padding: 7px 12px 7px 32px; font-size: 12.5px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none;"
            >
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-sm ${this.roleFilter === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="MembersModule.setFilter('all')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700;">
              All (${members.length})
            </button>
            <button class="btn btn-sm ${this.roleFilter === 'founder' ? 'btn-primary' : 'btn-outline'}" onclick="MembersModule.setFilter('founder')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700;">
              Founders &amp; Leads
            </button>
            <button class="btn btn-sm ${this.roleFilter === 'engineer' ? 'btn-primary' : 'btn-outline'}" onclick="MembersModule.setFilter('engineer')" style="font-size: 11.5px; padding: 5px 12px; border-radius: 6px; font-weight: 700;">
              Engineering
            </button>
          </div>
        </div>

        <!-- Members Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
          ${filtered.length === 0 ? `
            <div class="card" style="grid-column: 1 / -1; padding: 40px; text-align: center; border-radius: 12px; border: 1px dashed #cbd5e1; background: #ffffff;">
              <span style="font-size: 36px; display: block; margin-bottom: 8px;">👥</span>
              <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">No matching team members found</h3>
              <p style="font-size: 13px; color: #64748b; margin: 0;">Try adjusting your search query or role filter.</p>
            </div>
          ` : filtered.map(m => `
            <div class="card" style="padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: all 0.2s ease;">
              <div>
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: ${m.isLeader ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#f1f5f9'}; color: ${m.isLeader ? '#ffffff' : '#334155'}; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: ${m.isLeader ? '0 2px 8px rgba(79,70,229,0.25)' : 'none'};">
                      ${m.avatar || '👤'}
                    </div>
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${m.name}</div>
                      <div style="font-size: 12px; font-weight: 600; color: ${m.isLeader ? '#4f46e5' : '#64748b'};">${m.role}</div>
                    </div>
                  </div>

                  <span class="badge" style="font-size: 10px; font-weight: 700; background: ${m.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${m.status === 'Active' ? '#16a34a' : '#d97706'}; border-radius: 999px; padding: 2px 8px;">
                    ● ${m.status}
                  </span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #475569; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #94a3b8;">📧</span>
                    <a href="mailto:${m.email}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${m.email}</a>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #94a3b8;">📞</span>
                    <span>${m.phone || '—'}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #94a3b8;">🪑</span>
                    <span style="font-weight: 600; color: #0f172a;">Desk: ${m.desk || 'Hot Desk'}</span>
                  </div>
                </div>
              </div>

              ${!isEmployee ? `
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                  <button type="button" class="btn btn-sm btn-outline" onclick="MembersModule.openEditRoleModal('${activeStartup.id}', '${m.id}')" style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
                    ✏️ Edit Role
                  </button>
                  ${!m.isLeader ? `
                    <button type="button" class="btn btn-sm btn-outline" onclick="MembersModule.confirmRemoveMember('${activeStartup.id}', '${m.id}', '${m.name}')" style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; color: #ef4444; border-color: rgba(239,68,68,0.3);">
                      🗑️ Remove
                    </button>
                  ` : ''}
                </div>
              ` : `
                <div style="font-size: 11px; color: #94a3b8; font-weight: 600;">
                  Joined ${m.joinedDate || '2026'}
                </div>
              `}
            </div>
          `).join('')}
        </div>

      </div>
    `;
  },

  setSearch(q) {
    this.searchQuery = q || '';
    this.render();
  },

  setFilter(f) {
    this.roleFilter = f || 'all';
    this.render();
  },

  openInviteModal(startupId) {
    const modalId = 'modal-invite-member';
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
      <div class="modal-content" style="max-width: 480px; padding: 24px; border-radius: 16px;">
        <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">➕</span>
            <div>
              <h3 style="margin: 0; font-size: 16.5px; font-weight: 800; color: #0f172a;">Invite Team Member</h3>
              <span style="font-size: 11.5px; color: #64748b;">Issue smart card access and add to venture directory</span>
            </div>
          </div>
          <button class="modal-close-btn" onclick="MembersModule.closeModal('${modalId}')">&times;</button>
        </div>

        <form onsubmit="MembersModule.handleInviteSubmit(event, '${startupId}', '${modalId}')">
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Full Name <span style="color: #ef4444;">*</span></label>
            <input type="text" id="member-invite-name" required placeholder="e.g. Vikram Sethi" class="form-control" style="font-size: 13px; padding: 8px 12px;">
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Email Address <span style="color: #ef4444;">*</span></label>
            <input type="email" id="member-invite-email" required placeholder="e.g. vikram@startup.io" class="form-control" style="font-size: 13px; padding: 8px 12px;">
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Mobile Number</label>
            <input type="tel" id="member-invite-phone" placeholder="e.g. +91 98450 12345" class="form-control" style="font-size: 13px; padding: 8px 12px;">
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Venture Role</label>
            <select id="member-invite-role" class="form-control" style="font-size: 13px; padding: 8px 12px;">
              <option value="Senior AI Engineer">Senior AI Engineer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Product Designer">Product Designer</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Co-Founder">Co-Founder</option>
              <option value="Operations Associate">Operations Associate</option>
              <option value="Intern / Fellow">Intern / Fellow</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 18px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">Desk Preference</label>
            <input type="text" id="member-invite-desk" placeholder="e.g. Cabin 101, Desk E" class="form-control" style="font-size: 13px; padding: 8px 12px;">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary" onclick="MembersModule.closeModal('${modalId}')" style="font-size: 12px;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="font-size: 12px; background: #4f46e5; border-color: #4f46e5;">Send Invitation &amp; Register</button>
          </div>
        </form>
      </div>
    `;
  },

  handleInviteSubmit(e, startupId, modalId) {
    if (e) e.preventDefault();
    const name = document.getElementById('member-invite-name')?.value;
    const email = document.getElementById('member-invite-email')?.value;
    const phone = document.getElementById('member-invite-phone')?.value;
    const role = document.getElementById('member-invite-role')?.value;
    const desk = document.getElementById('member-invite-desk')?.value;

    const res = window.store.inviteStartupMember(startupId, { name, email, phone, role, desk });
    this.closeModal(modalId);
    if (res && res.success) {
      if (window.App && window.App.showToast) {
        window.App.showToast(`✅ Member invitation sent to ${name} (${email}).`, 'success');
      }
      this.render();
    }
  },

  openEditRoleModal(startupId, memberId) {
    const members = window.store.getStartupMembers(startupId);
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const modalId = 'modal-edit-role';
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
      <div class="modal-content" style="max-width: 420px; padding: 22px; border-radius: 16px;">
        <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Edit Role: ${member.name}</h3>
          <button class="modal-close-btn" onclick="MembersModule.closeModal('${modalId}')">&times;</button>
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; display: block;">Assign New Role</label>
          <select id="edit-member-role-select" class="form-control" style="font-size: 13px; padding: 8px 12px;">
            <option value="Founder & CEO" ${member.role === 'Founder & CEO' ? 'selected' : ''}>Founder & CEO</option>
            <option value="Co-Founder" ${member.role === 'Co-Founder' ? 'selected' : ''}>Co-Founder</option>
            <option value="Senior AI Engineer" ${member.role === 'Senior AI Engineer' ? 'selected' : ''}>Senior AI Engineer</option>
            <option value="Full Stack Developer" ${member.role === 'Full Stack Developer' ? 'selected' : ''}>Full Stack Developer</option>
            <option value="Product Designer" ${member.role === 'Product Designer' ? 'selected' : ''}>Product Designer</option>
            <option value="Product Manager" ${member.role === 'Product Manager' ? 'selected' : ''}>Product Manager</option>
            <option value="Team Member" ${member.role === 'Team Member' ? 'selected' : ''}>Team Member</option>
          </select>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="MembersModule.closeModal('${modalId}')" style="font-size: 12px;">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="MembersModule.saveEditedRole('${startupId}', '${memberId}', '${modalId}')" style="font-size: 12px; background: #4f46e5; border-color: #4f46e5;">Save Role</button>
        </div>
      </div>
    `;
  },

  saveEditedRole(startupId, memberId, modalId) {
    const sel = document.getElementById('edit-member-role-select');
    if (sel) {
      window.store.updateStartupMemberRole(startupId, memberId, sel.value);
      this.closeModal(modalId);
      if (window.App && window.App.showToast) {
        window.App.showToast(`✅ Member role updated successfully.`, 'success');
      }
      this.render();
    }
  },

  confirmRemoveMember(startupId, memberId, memberName) {
    if (confirm(`Are you sure you want to remove ${memberName} from this startup? Biometric campus access and desk assignments will be revoked.`)) {
      window.store.removeStartupMember(startupId, memberId);
      if (window.App && window.App.showToast) {
        window.App.showToast(`🗑️ ${memberName} removed from startup roster.`, 'info');
      }
      this.render();
    }
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
  }
};

window.MembersModule = MembersModule;
