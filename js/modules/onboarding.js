// Module: Startup Onboarding & Full Lifecycle Management

const OnboardingModule = {
  activeStatusFilter: 'all',
  activeCategoryFilter: 'all',

  render() {
    const container = document.getElementById('view-onboarding');
    if (!container) return;

    const counts = window.store.getOnboardingCounts();
    let startups = window.store.getAccessibleStartups();

    if (this.activeStatusFilter !== 'all') {
      startups = startups.filter(s => s.status.toLowerCase() === this.activeStatusFilter.toLowerCase());
    }
    if (this.activeCategoryFilter !== 'all') {
      if (this.activeCategoryFilter === 'Others') {
        const standardCats = ['AI & DeepTech', 'BioTech / HealthTech', 'FinTech & Web3', 'ClimateTech / EV', 'Supply Chain & Logistics', 'Quantum Computing & HPC', 'AgriTech & Robotics', 'SaaS & Enterprise Tools'];
        startups = startups.filter(s => {
          const cat = s.category || s.sector;
          return cat === 'Others' || cat === 'Other' || !standardCats.includes(cat);
        });
      } else {
        startups = startups.filter(s => (s.category || s.sector) === this.activeCategoryFilter);
      }
    }

    container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
            <span>👥 Startup Onboarding & Lifecycle</span>
            <span class="badge badge-info" style="font-size: 12px;">Stage 1 of Lifecycle</span>
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
            End-to-end incubator onboarding: Registration ➔ Company ➔ Founder ➔ Documents ➔ Verification ➔ Approval ➔ Workspace.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="OnboardingModule.openRegistrationWizard()">
            + Register New Startup
          </button>
        </div>
      </div>

      <!-- Lifecycle Workflow Visual Funnel -->
      <div class="card" style="margin-bottom: 22px; padding: 18px 24px; background: var(--bg-surface);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
            Onboarding Lifecycle Pipeline
          </span>
          <span style="font-size: 12px; color: var(--accent-primary); font-weight: 600;">
            ${counts.all} Total Registered Startups
          </span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; overflow-x: auto; padding-bottom: 4px;">
          <div class="onboarding-flow-step" onclick="OnboardingModule.setStatusFilter('Applied')" style="cursor: pointer; text-align: center; flex: 1; padding: 10px 8px; border-radius: var(--radius-md); background: ${this.activeStatusFilter === 'Applied' ? 'var(--accent-gradient-subtle)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${this.activeStatusFilter === 'Applied' ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted);">STEP 1</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 2px 0;">Applied</div>
            <span class="badge badge-warning" style="font-size: 11px;">${counts.applied} Startups</span>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div class="onboarding-flow-step" onclick="OnboardingModule.setStatusFilter('Under Review')" style="cursor: pointer; text-align: center; flex: 1; padding: 10px 8px; border-radius: var(--radius-md); background: ${this.activeStatusFilter === 'Under Review' ? 'var(--accent-gradient-subtle)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${this.activeStatusFilter === 'Under Review' ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted);">STEP 2</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 2px 0;">Under Review</div>
            <span class="badge badge-info" style="font-size: 11px;">${counts.underReview} Startups</span>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div class="onboarding-flow-step" onclick="OnboardingModule.setStatusFilter('Approved')" style="cursor: pointer; text-align: center; flex: 1; padding: 10px 8px; border-radius: var(--radius-md); background: ${this.activeStatusFilter === 'Approved' ? 'var(--accent-gradient-subtle)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${this.activeStatusFilter === 'Approved' ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted);">STEP 3</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 2px 0;">Approved</div>
            <span class="badge badge-success" style="font-size: 11px;">${counts.approved} Ready</span>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div class="onboarding-flow-step" onclick="OnboardingModule.setStatusFilter('Incubated')" style="cursor: pointer; text-align: center; flex: 1; padding: 10px 8px; border-radius: var(--radius-md); background: ${this.activeStatusFilter === 'Incubated' ? 'var(--accent-gradient-subtle)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${this.activeStatusFilter === 'Incubated' ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted);">STEP 4</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 2px 0;">Incubated</div>
            <span class="badge badge-info" style="font-size: 11px;">${counts.incubated} Active</span>
          </div>
          <span style="color: var(--text-muted); font-size: 12px;">➔</span>

          <div class="onboarding-flow-step" onclick="OnboardingModule.setStatusFilter('Completed')" style="cursor: pointer; text-align: center; flex: 1; padding: 10px 8px; border-radius: var(--radius-md); background: ${this.activeStatusFilter === 'Completed' ? 'var(--accent-gradient-subtle)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${this.activeStatusFilter === 'Completed' ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted);">STEP 5</div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 2px 0;">Completed</div>
            <span class="badge badge-subtle" style="font-size: 11px;">${counts.completed} Alumni</span>
          </div>
        </div>
      </div>

      <!-- Status Filters Tabs -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); padding: 12px 18px; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-sm ${this.activeStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="OnboardingModule.setStatusFilter('all')">
            All (${counts.all})
          </button>
          <button class="btn btn-sm ${this.activeStatusFilter === 'Applied' ? 'btn-primary' : 'btn-secondary'}" onclick="OnboardingModule.setStatusFilter('Applied')">
            Applied (${counts.applied})
          </button>
          <button class="btn btn-sm ${this.activeStatusFilter === 'Under Review' ? 'btn-primary' : 'btn-secondary'}" onclick="OnboardingModule.setStatusFilter('Under Review')">
            Under Review (${counts.underReview})
          </button>
          <button class="btn btn-sm ${this.activeStatusFilter === 'Approved' ? 'btn-primary' : 'btn-secondary'}" onclick="OnboardingModule.setStatusFilter('Approved')">
            Approved (${counts.approved})
          </button>
          <button class="btn btn-sm ${this.activeStatusFilter === 'Incubated' ? 'btn-primary' : 'btn-secondary'}" onclick="OnboardingModule.setStatusFilter('Incubated')">
            Incubated (${counts.incubated})
          </button>
          <button class="btn btn-sm ${this.activeStatusFilter === 'Completed' ? 'btn-primary' : 'btn-secondary'}" onclick="OnboardingModule.setStatusFilter('Completed')">
            Completed (${counts.completed})
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Category:</span>
          <select class="form-control" style="width: auto; padding: 5px 10px; font-size: 12px;" onchange="OnboardingModule.setCategoryFilter(this.value)">
            <option value="all">All Categories</option>
            <option value="AI & DeepTech" ${this.activeCategoryFilter === 'AI & DeepTech' ? 'selected' : ''}>AI & DeepTech</option>
            <option value="BioTech / HealthTech" ${this.activeCategoryFilter === 'BioTech / HealthTech' ? 'selected' : ''}>BioTech / HealthTech</option>
            <option value="FinTech & Web3" ${this.activeCategoryFilter === 'FinTech & Web3' ? 'selected' : ''}>FinTech & Web3</option>
            <option value="ClimateTech / EV" ${this.activeCategoryFilter === 'ClimateTech / EV' ? 'selected' : ''}>ClimateTech / EV</option>
            <option value="Supply Chain & Logistics" ${this.activeCategoryFilter === 'Supply Chain & Logistics' ? 'selected' : ''}>Supply Chain & Logistics</option>
            <option value="Quantum Computing & HPC" ${this.activeCategoryFilter === 'Quantum Computing & HPC' ? 'selected' : ''}>Quantum Computing & HPC</option>
            <option value="AgriTech & Robotics" ${this.activeCategoryFilter === 'AgriTech & Robotics' ? 'selected' : ''}>AgriTech & Robotics</option>
            <option value="SaaS & Enterprise Tools" ${this.activeCategoryFilter === 'SaaS & Enterprise Tools' ? 'selected' : ''}>SaaS & Enterprise Tools</option>
            <option value="Others" ${this.activeCategoryFilter === 'Others' ? 'selected' : ''}>Others</option>
          </select>
        </div>
      </div>

      <!-- Startups Grid -->
      <div class="grid-3col">
        ${startups.map(s => this.renderStartupCard(s)).join('')}
      </div>
    `;
  },

  setStatusFilter(status) {
    this.activeStatusFilter = status;
    this.render();
  },

  setCategoryFilter(cat) {
    this.activeCategoryFilter = cat;
    this.render();
  },

  getStatusBadgeClass(status) {
    switch (status) {
      case 'Applied': return 'badge-warning';
      case 'Under Review': return 'badge-info';
      case 'Approved': return 'badge-success';
      case 'Incubated': return 'badge-primary' || 'badge-info';
      case 'Completed': return 'badge-subtle';
      default: return 'badge-subtle';
    }
  },

  renderStartupCard(s) {
    const statusBadgeClass = this.getStatusBadgeClass(s.status);
    const docs = s.documents || [];
    const verifiedDocsCount = docs.filter(d => d.status === 'Verified').length;
    const totalDocsCount = docs.length;

    const spaces = window.store.getSpaces();
    const allocatedLabels = (s.allocatedSeats || []).map(id => {
      const sp = spaces.find(x => x.id === id);
      return sp ? sp.label : id;
    });

    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 14px; position: relative;">
        <div>
          <!-- Card Header -->
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; font-size: 22px;">
                ${s.logoEmoji || '🚀'}
              </div>
              <div>
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary);">${s.name}</h3>
                <span style="font-size: 11.5px; color: var(--accent-secondary); font-weight: 600;">
                  ${s.category || s.sector}
                </span>
              </div>
            </div>
            <span class="badge ${statusBadgeClass}" style="font-weight: 700;">
              ${s.status}
            </span>
          </div>

          <!-- Pitch Summary -->
          <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45; margin-bottom: 14px; min-height: 36px;">
            ${s.pitchSummary}
          </p>

          <!-- Stored Registration & Corporate Details Grid -->
          <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 11.5px; display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Registration No:</span>
              <strong style="color: var(--text-primary); font-family: var(--font-mono);">${s.registrationNumber || 'Pending'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">GST Details:</span>
              <strong style="color: var(--text-primary); font-family: var(--font-mono);">${s.gstin || 'Exempt / Applied'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Employees & Period:</span>
              <span><strong>${s.numberOfEmployees || s.teamSize} Employees</strong> • <strong>${s.incubationPeriod || '12 Months'}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Joining Date:</span>
              <strong style="color: var(--text-primary);">${s.joiningDate || s.moveInDate}</strong>
            </div>
          </div>

          <!-- Founder & Contact Details -->
          <div style="background: rgba(255,255,255,0.02); padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 11.5px; margin-bottom: 12px;">
            <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 3px; display: flex; align-items: center; justify-content: space-between;">
              <span>👤 ${s.founders.name} <span style="font-weight: 400; color: var(--text-muted);">(${s.founders.role})</span></span>
              ${s.founders.linkedIn ? `<a href="${s.founders.linkedIn.startsWith('http') ? s.founders.linkedIn : 'https://' + s.founders.linkedIn}" target="_blank" rel="noopener" style="color: #0284c7; font-weight: 600; text-decoration: none; font-size: 11px; display: inline-flex; align-items: center; gap: 3px;" title="LinkedIn Profile">🌐 LinkedIn ↗</a>` : ''}
            </div>
            <div style="color: var(--text-secondary); font-size: 11px;">
              📧 ${s.founders.email} • 📱 ${s.founders.phone || s.founders.mobile}
            </div>
          </div>

          <!-- Documents Status Pill -->
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; padding: 6px 10px; background: ${verifiedDocsCount === totalDocsCount && totalDocsCount > 0 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)'}; border-radius: var(--radius-sm); margin-bottom: 10px;">
            <span style="color: ${verifiedDocsCount === totalDocsCount && totalDocsCount > 0 ? 'var(--status-success)' : 'var(--status-warning)'}; font-weight: 600;">
              📄 Documents: ${verifiedDocsCount}/${totalDocsCount} Verified
            </span>
            <span style="font-size: 10.5px; color: var(--text-muted); cursor: pointer; text-decoration: underline;" onclick="OnboardingModule.openVerificationModal('${s.id}')">
              Inspect Docs
            </span>
          </div>

          <!-- Workspace Allocation Status -->
          <div style="margin-bottom: 4px;">
            <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
              Workspace Allocation:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
              ${allocatedLabels.length > 0 
                ? allocatedLabels.map(l => `<span class="badge badge-info" style="font-family: var(--font-mono); font-size: 10.5px;">${l}</span>`).join('') 
                : `<span style="font-size: 11.5px; color: var(--text-muted); font-style: italic;">None (${s.spacePreference || 'Desk Needed'})</span>`
              }
            </div>
          </div>
        </div>

        <!-- Dynamic Contextual Action Buttons depending on Lifecycle Status -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; display: flex; flex-direction: column; gap: 6px;">
          ${s.status === 'Applied' ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="OnboardingModule.openVerificationModal('${s.id}')">
                Inspect Docs
              </button>
              <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="OnboardingModule.moveStatus('${s.id}', 'Under Review')">
                🔍 Start Review
              </button>
            </div>
          ` : s.status === 'Under Review' ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="OnboardingModule.openVerificationModal('${s.id}')">
                📋 Verify Docs
              </button>
              <button class="btn btn-primary btn-sm" style="flex: 1; background: var(--status-success);" onclick="OnboardingModule.moveStatus('${s.id}', 'Approved')">
                ✓ Grant Approval
              </button>
            </div>
          ` : s.status === 'Approved' ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="OnboardingModule.viewStartupDossier('${s.id}')">
                Dossier
              </button>
              <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="App.switchTab('workspace'); WorkspaceModule.highlightForStartup('${s.id}')">
                🏢 Allocate Workspace
              </button>
            </div>
          ` : s.status === 'Incubated' ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="OnboardingModule.viewStartupDossier('${s.id}')">
                View Dossier
              </button>
              <button class="btn btn-outline btn-sm" onclick="OnboardingModule.moveStatus('${s.id}', 'Completed')">
                🎓 Graduate
              </button>
            </div>
          ` : `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="OnboardingModule.viewStartupDossier('${s.id}')">
                View Alumni Dossier
              </button>
            </div>
          `}

          <!-- Quick Founder Portal Login -->
          <button class="btn btn-outline btn-sm" onclick="App.loginAsStartup('${s.id}')" style="width: 100%; justify-content: center; font-size: 11px; padding: 5px; gap: 5px; margin-top: 2px;" title="Login to ${s.name} Founder Portal">
            🔑 Login to ${s.name}
          </button>
        </div>
      </div>
    `;
  },

  // --- Multi-Step Registration Wizard (1/6 to 6/6) ---
  wizardStep: 1,

  openRegistrationWizard() {
    this.wizardStep = 1;
    const today = new Date().toISOString().split('T')[0];

    const html = `
      <div class="modal-overlay active" id="modal-reg-wizard">
        <div class="modal-content modal-wide" style="max-width: 760px;">
          <div class="modal-header" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
            <div>
              <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
                <span>🚀 Startup Incubation Application</span>
                <span class="badge badge-primary" style="font-size: 11px;">Stage 1: Registration</span>
              </h3>
              <span style="font-size: 12px; color: var(--text-muted);">Comprehensive application dossier for incubator screening and lifecycle onboarding</span>
            </div>
            <button class="modal-close-btn" onclick="OnboardingModule.closeModal('modal-reg-wizard')">&times;</button>
          </div>

          <!-- Wizard 7-Step Stepper Header -->
          <div class="wizard-stepper-nav" id="wizard-stepper-nav">
            <div class="wizard-step-node active" id="wizard-nav-1" onclick="OnboardingModule.goToStep(1)">
              <div class="wizard-step-badge">1</div>
              <div class="wizard-step-title">Founder Details</div>
            </div>
            <div class="wizard-step-divider"></div>
            <div class="wizard-step-node" id="wizard-nav-2" onclick="OnboardingModule.goToStep(2)">
              <div class="wizard-step-badge">2</div>
              <div class="wizard-step-title">Startup Details</div>
            </div>
            <div class="wizard-step-divider"></div>
            <div class="wizard-step-node" id="wizard-nav-3" onclick="OnboardingModule.goToStep(3)">
              <div class="wizard-step-badge">3</div>
              <div class="wizard-step-title">Product Details</div>
            </div>
            <div class="wizard-step-divider"></div>
            <div class="wizard-step-node" id="wizard-nav-4" onclick="OnboardingModule.goToStep(4)">
              <div class="wizard-step-badge">4</div>
              <div class="wizard-step-title">Team Details</div>
            </div>
            <div class="wizard-step-divider"></div>
            <div class="wizard-step-node" id="wizard-nav-5" onclick="OnboardingModule.goToStep(5)">
              <div class="wizard-step-badge">5</div>
              <div class="wizard-step-title">Documents</div>
            </div>
            <div class="wizard-step-divider"></div>
            <div class="wizard-step-node" id="wizard-nav-6" onclick="OnboardingModule.goToStep(6)">
              <div class="wizard-step-badge">6</div>
              <div class="wizard-step-title">Market Details</div>
            </div>
            <div class="wizard-step-divider"></div>
            <div class="wizard-step-node" id="wizard-nav-7" onclick="OnboardingModule.goToStep(7)">
              <div class="wizard-step-badge">7</div>
              <div class="wizard-step-title">Funding Details</div>
            </div>
          </div>

          <div class="modal-body" style="padding-top: 6px;">
            <form id="form-onboard-wizard" novalidate onsubmit="OnboardingModule.handleRegistrationSubmit(event)">

              <!-- STEP 1: FOUNDER DETAILS (1/7) -->
              <div class="wizard-step-panel" id="wizard-step-1" style="display: block;">
                <div style="margin-bottom: 18px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    👤 1. Primary Founder Credentials & Contact
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
                    Official founder credentials required for incubator communications, mentor allocation, and legal records.
                  </p>
                </div>

                <div class="form-row-2" style="margin-bottom: 14px;">
                  <div class="form-group">
                    <label class="form-label">Primary Founder Full Name <span class="required-star">*</span></label>
                    <input type="text" name="founderName" id="reg-founder-name" class="form-control" placeholder="e.g. Ramesh Kulkarni" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Founder Role <span class="required-star">*</span></label>
                    <input type="text" name="founderRole" id="reg-founder-role" class="form-control" value="Founder & CEO" required>
                  </div>
                </div>

                <!-- Founder Email with Icon -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Founder Email <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </span>
                    <input type="email" name="founderEmail" id="reg-founder-email" class="form-control" placeholder="founder@startup.io" required>
                  </div>
                </div>

                <!-- Founder Phone with Icon -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Founder Phone <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                        <path d="M12 18h.01"></path>
                      </svg>
                    </span>
                    <input type="tel" name="founderPhone" id="reg-founder-phone" class="form-control" placeholder="+91 98451 22334" required>
                  </div>
                </div>

                <!-- Founder LinkedIn with Icon -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Founder LinkedIn <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                        <path d="M2 12h20"></path>
                      </svg>
                    </span>
                    <input type="url" name="founderLinkedIn" id="reg-founder-linkedin" class="form-control" placeholder="https://www.linkedin.com/in/founder-name" required>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Founder Background / Bio</label>
                  <input type="text" name="founderBio" id="reg-founder-bio" class="form-control" placeholder="e.g. Ex-Lead Engineer at ISRO, BTech IIT Madras">
                </div>

                <!-- Wizard Footer Bar (Step 1) -->
                <div class="wizard-footer-bar">
                  <div class="wizard-footer-actions">
                    <button type="button" class="btn-save-pill" onclick="OnboardingModule.saveDraft()">Save</button>
                    <button type="button" class="btn-next-step" onclick="OnboardingModule.goToNextStep(1)">Next</button>
                  </div>
                  <div class="wizard-step-counter">1/7</div>
                </div>
              </div>

              <!-- STEP 2: COMPANY INFORMATION (2/7) -->
              <div class="wizard-step-panel" id="wizard-step-2" style="display: none;">
                <div style="margin-bottom: 18px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    🏢 2. Company Information
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
                    Official venture particulars, digital presence, operational headquarters, and pitch deck.
                  </p>
                </div>

                <!-- Startup Name * with Icon -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Startup Name <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                        <path d="M9 22v-4h6v4"></path>
                        <path d="M8 6h.01"></path>
                        <path d="M16 6h.01"></path>
                        <path d="M8 10h.01"></path>
                        <path d="M16 10h.01"></path>
                        <path d="M8 14h.01"></path>
                        <path d="M16 14h.01"></path>
                      </svg>
                    </span>
                    <input type="text" name="name" id="reg-startup-name" class="form-control" placeholder="e.g. TerraWatt Fusion" required>
                  </div>
                </div>

                <!-- Startup Website * with Icon -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Startup Website <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                        <path d="M2 12h20"></path>
                      </svg>
                    </span>
                    <input type="url" name="startupWebsite" id="reg-startup-website" class="form-control" placeholder="https://www.startup.io" required>
                  </div>
                </div>

                <!-- Startup Category * (with Others) -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Startup Category <span class="required-star">*</span></label>
                  <select name="category" id="onboard-category-select" class="form-control" onchange="OnboardingModule.handleCategoryChange(this.value)" required>
                    <option value="" disabled selected>Select category...</option>
                    <option value="AI & DeepTech">AI & DeepTech</option>
                    <option value="BioTech / HealthTech">BioTech / HealthTech</option>
                    <option value="FinTech & Web3">FinTech & Web3</option>
                    <option value="ClimateTech / EV">ClimateTech / Clean Energy</option>
                    <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                    <option value="Quantum Computing & HPC">Quantum Computing & HPC</option>
                    <option value="AgriTech & Robotics">AgriTech & Robotics</option>
                    <option value="SaaS & Enterprise Tools">SaaS & Enterprise Tools</option>
                    <option value="Others">Others</option>
                  </select>
                  <!-- Dynamic Other Category Input -->
                  <div id="onboard-other-category-wrap" style="display: none; margin-top: 8px;">
                    <label class="form-label" style="font-size: 11.5px; color: var(--accent-secondary); margin-bottom: 4px;">
                      Specify Custom Startup Category <span class="required-star">*</span>
                    </label>
                    <input type="text" name="otherCategory" id="input-other-category" class="form-control" placeholder="e.g. Aerospace & Drone Defense, EdTech, Gaming...">
                  </div>
                </div>

                <!-- Description of Startup * Textarea -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Description of Startup <span class="required-star">*</span></label>
                  <textarea name="description" id="reg-startup-description" class="form-control" rows="3" placeholder="Describe the mission, problem solved, technology stack and core value proposition..." required></textarea>
                </div>

                <!-- Headquarters / Operational City * with Icon -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Headquarters / Operational City <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 21h18"></path>
                        <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"></path>
                        <path d="M15 9h4a2 2 0 0 1 2 2v10"></path>
                        <path d="M9 9h.01"></path>
                        <path d="M9 13h.01"></path>
                        <path d="M9 17h.01"></path>
                      </svg>
                    </span>
                    <input type="text" name="operationalCity" id="reg-operational-city" class="form-control" placeholder="Mention the City" required>
                  </div>
                </div>

                <!-- Is your company incorporated ? * Radio -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Is your company incorporated ? <span class="required-star">*</span></label>
                  <div class="radio-group-row">
                    <label class="radio-item-label">
                      <input type="radio" name="isIncorporated" value="yes" required onchange="OnboardingModule.handleIncorporationChange(this.value)">
                      <span>Yes</span>
                    </label>
                    <label class="radio-item-label">
                      <input type="radio" name="isIncorporated" value="no" required onchange="OnboardingModule.handleIncorporationChange(this.value)">
                      <span>No</span>
                    </label>
                  </div>

                  <!-- CIN & GSTIN conditional fields (revealed if Yes) -->
                  <div id="incorp-details-wrap" style="display: none; margin-top: 12px;">
                    <div class="form-row-2">
                      <div class="form-group">
                        <label class="form-label" style="font-size: 12px;">Company Registration Number (CIN / LLPIN)</label>
                        <input type="text" name="registrationNumber" id="reg-cin" class="form-control" placeholder="e.g. U72900TG2026PTC198421">
                      </div>
                      <div class="form-group">
                        <label class="form-label" style="font-size: 12px;">GST Details (GSTIN)</label>
                        <input type="text" name="gstin" id="reg-gstin" class="form-control" placeholder="e.g. 36ABCDE1234F1Z5 or Exempt">
                      </div>
                    </div>
                  </div>
                  <div id="no-incorp-note" style="display: none; margin-top: 8px; font-size: 11.5px; color: var(--text-muted); background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                    ℹ️ Pre-incorporation venture. Incubator will assist with MCA company registration and legal compliance.
                  </div>
                </div>

                <!-- Pitch Deck * Upload Box -->
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Pitch Deck <span class="required-star">*</span></label>
                  <div class="pitch-deck-upload-box" onclick="document.getElementById('reg-pitch-deck-file').click()">
                    <span id="pitch-deck-filename-display" style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                      <span>Choose File</span>
                    </span>
                    <span style="color: #64748b; display: flex; align-items: center;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </span>
                  </div>
                  <input type="file" id="reg-pitch-deck-file" name="pitchDeckFile" accept=".pdf,.ppt,.pptx" style="display: none;" onchange="OnboardingModule.handlePitchDeckSelected(this)">
                  <input type="hidden" name="pitchDeckName" id="reg-pitch-deck-name" value="pitch_deck_presentation.pdf">
                </div>

                <!-- Wizard Footer Bar (Step 2: Back, Save, Next, 2/6) -->
                <div class="wizard-footer-bar">
                  <div class="wizard-footer-actions">
                    <button type="button" class="btn-back-step" onclick="OnboardingModule.goToPrevStep(2)">Back</button>
                    <button type="button" class="btn-save-pill" onclick="OnboardingModule.saveDraft()">Save</button>
                    <button type="button" class="btn-next-step" onclick="OnboardingModule.goToNextStep(2)">Next</button>
                  </div>
                  <div class="wizard-step-counter">2/7</div>
                </div>
              </div>

              <!-- STEP 3: PRODUCT DETAILS (3/7) -->
              <div class="wizard-step-panel" id="wizard-step-3" style="display: none;">
                <div style="margin-bottom: 18px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    💡 3. Product Details
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
                    Define product architecture, technology innovation, and intellectual property status.
                  </p>
                </div>

                <!-- Product Name * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Product Name <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                        <path d="M9 4v16"></path>
                      </svg>
                    </span>
                    <input type="text" name="productName" id="reg-product-name" class="form-control" placeholder="" required>
                  </div>
                </div>

                <!-- Describe the Product * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Describe the Product <span class="required-star">*</span></label>
                  <textarea name="describeProduct" id="reg-describe-product" class="form-control" rows="3" placeholder="" required></textarea>
                </div>

                <!-- Core Technology * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Core Technology <span class="required-star">*</span></label>
                  <div class="radio-group-row" style="margin-top: 6px;">
                    <label class="radio-item-label">
                      <input type="radio" name="coreTechnology" value="Deep-Tech" required>
                      <span>Deep-Tech</span>
                    </label>
                    <label class="radio-item-label">
                      <input type="radio" name="coreTechnology" value="Non Deep-Tech" required>
                      <span>Non Deep-Tech</span>
                    </label>
                  </div>
                </div>

                <!-- Do you have any IP/Patents? * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Do you have any IP/Patents? <span class="required-star">*</span></label>
                  <div class="radio-group-row" style="margin-top: 6px;">
                    <label class="radio-item-label">
                      <input type="radio" name="hasPatents" value="Yes" required>
                      <span>Yes</span>
                    </label>
                    <label class="radio-item-label">
                      <input type="radio" name="hasPatents" value="No" required>
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <!-- Wizard Footer Bar (Step 3: Back, Save, Next, 3/6) -->
                <div class="wizard-footer-bar">
                  <div class="wizard-footer-actions">
                    <button type="button" class="btn-back-step" onclick="OnboardingModule.goToPrevStep(3)">Back</button>
                    <button type="button" class="btn-save-pill" onclick="OnboardingModule.saveDraft()">Save</button>
                    <button type="button" class="btn-next-step" onclick="OnboardingModule.goToNextStep(3)">Next</button>
                  </div>
                  <div class="wizard-step-counter">3/7</div>
                </div>
              </div>

              <!-- STEP 4: TEAM DETAILS (4/7) -->
              <div class="wizard-step-panel" id="wizard-step-4" style="display: none;">
                <div style="margin-bottom: 18px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    👥 4. Team Details
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
                    Founding experience, team scale, and accomplishments related to company building.
                  </p>
                </div>

                <!-- Are you a first-time Founder? * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Are you a first-time Founder? <span class="required-star">*</span></label>
                  <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                    <label class="radio-item-label">
                      <input type="radio" name="isFirstTimeFounder" value="yes" required>
                      <span>Yes</span>
                    </label>
                    <label class="radio-item-label">
                      <input type="radio" name="isFirstTimeFounder" value="no" required>
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <!-- Share significant accomplishments related to company building / relevant domain expertise * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Share significant accomplishments related to company building / relevant domain expertise <span class="required-star">*</span></label>
                  <textarea name="founderAccomplishments" id="reg-founder-accomplishments" class="form-control" rows="3" placeholder="" required></textarea>
                </div>

                <!-- No of Founders * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">No of Founders <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                        <path d="M8 8v8"></path>
                        <path d="M12 11c0-1.5 1-2.5 2.5-2.5s2 1 2 2c0 2-3.5 3-3.5 4.5h4"></path>
                      </svg>
                    </span>
                    <input type="number" name="numberOfFounders" id="reg-num-founders" class="form-control" min="1" max="20" placeholder="" required>
                  </div>
                </div>

                <!-- Team Size * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Team Size <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                        <path d="M8 8v8"></path>
                        <path d="M12 11c0-1.5 1-2.5 2.5-2.5s2 1 2 2c0 2-3.5 3-3.5 4.5h4"></path>
                      </svg>
                    </span>
                    <input type="number" name="teamSize" id="reg-team-size" class="form-control" min="1" max="100" placeholder="" required>
                  </div>
                </div>

                <!-- Wizard Footer Bar (Step 4: Back, Save, Next, 4/6) -->
                <div class="wizard-footer-bar">
                  <div class="wizard-footer-actions">
                    <button type="button" class="btn-back-step" onclick="OnboardingModule.goToPrevStep(4)">Back</button>
                    <button type="button" class="btn-save-pill" onclick="OnboardingModule.saveDraft()">Save</button>
                    <button type="button" class="btn-next-step" onclick="OnboardingModule.goToNextStep(4)">Next</button>
                  </div>
                  <div class="wizard-step-counter">4/7</div>
                </div>
              </div>

              <!-- STEP 5: DOCUMENTS UPLOAD (5/7) -->
              <div class="wizard-step-panel" id="wizard-step-5" style="display: none;">
                <div style="margin-bottom: 18px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    📄 5. Compliance Verification Documents Upload
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
                    Upload certified corporate documents for formal evaluation by the incubator compliance committee.
                  </p>
                </div>

                <div class="grid-2col" style="gap: 12px; margin-bottom: 12px;">
                  <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-medium);">
                    <label class="form-label" style="margin-bottom: 4px;">1. Certificate of Incorporation</label>
                    <input type="file" class="form-control" style="font-size: 11px; padding: 5px;">
                    <span style="font-size: 10.5px; color: var(--text-muted);">PDF / Scan copy (Max 5MB)</span>
                  </div>

                  <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-medium);">
                    <label class="form-label" style="margin-bottom: 4px;">2. GST Registration Certificate</label>
                    <input type="file" class="form-control" style="font-size: 11px; padding: 5px;">
                    <span style="font-size: 10.5px; color: var(--text-muted);">Form REG-06 or Acknowledgment</span>
                  </div>

                  <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-medium);">
                    <label class="form-label" style="margin-bottom: 4px;">3. Additional Compliance / IP Filings</label>
                    <input type="file" class="form-control" style="font-size: 11px; padding: 5px;">
                    <span style="font-size: 10.5px; color: var(--text-muted);">Patents / Trademark receipts</span>
                  </div>

                  <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-medium);">
                    <label class="form-label" style="margin-bottom: 4px;">4. Founder KYC & ID Proof</label>
                    <input type="file" class="form-control" style="font-size: 11px; padding: 5px;">
                    <span style="font-size: 10.5px; color: var(--text-muted);">Aadhaar / PAN / Passport</span>
                  </div>
                </div>

                <!-- Wizard Footer Bar (Step 5) -->
                <div class="wizard-footer-bar">
                  <div class="wizard-footer-actions">
                    <button type="button" class="btn-back-step" onclick="OnboardingModule.goToPrevStep(5)">Back</button>
                    <button type="button" class="btn-save-pill" onclick="OnboardingModule.saveDraft()">Save</button>
                    <button type="button" class="btn-next-step" onclick="OnboardingModule.goToNextStep(5)">Next</button>
                  </div>
                  <div class="wizard-step-counter">5/7</div>
                </div>
              </div>

              <!-- STEP 6: MARKET DETAILS (6/7) -->
              <div class="wizard-step-panel" id="wizard-step-6" style="display: none;">
                <div style="margin-bottom: 18px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    📊 6. Market Details
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
                    Define sector classification, target customer persona, business models, and current commercial traction.
                  </p>
                </div>

                <!-- Sector * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Sector <span class="required-star">*</span></label>
                  <select name="marketSector" id="reg-market-sector" class="form-control" required>
                    <option value="" disabled selected>Select Sector...</option>
                    <option value="AI & DeepTech">AI & DeepTech</option>
                    <option value="BioTech / HealthTech">BioTech / HealthTech</option>
                    <option value="FinTech & Web3">FinTech & Web3</option>
                    <option value="ClimateTech / Clean Energy">ClimateTech / Clean Energy</option>
                    <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                    <option value="Quantum Computing & HPC">Quantum Computing & HPC</option>
                    <option value="AgriTech & Robotics">AgriTech & Robotics</option>
                    <option value="SaaS & Enterprise Tools">SaaS & Enterprise Tools</option>
                    <option value="ConsumerTech & D2C">ConsumerTech & D2C</option>
                    <option value="EdTech & Smart Learning">EdTech & Smart Learning</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <!-- Who is your ideal customer? What is his/her persona? * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Who is your ideal customer? What is his/her persona? <span class="required-star">*</span></label>
                  <textarea name="customerPersona" id="reg-customer-persona" class="form-control" rows="3" placeholder="" required></textarea>
                </div>

                <!-- Use Case/s * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Use Case/s <span class="required-star">*</span></label>
                  <textarea name="useCases" id="reg-use-cases" class="form-control" rows="3" placeholder="" required></textarea>
                </div>

                <!-- Business Model * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Business Model <span class="required-star">*</span></label>
                  <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                    <label class="checkbox-item-label" style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                      <input type="checkbox" name="businessModel" value="B2B">
                      <span>B2B</span>
                    </label>
                    <label class="checkbox-item-label" style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                      <input type="checkbox" name="businessModel" value="B2C">
                      <span>B2C</span>
                    </label>
                    <label class="checkbox-item-label" style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                      <input type="checkbox" name="businessModel" value="D2C">
                      <span>D2C</span>
                    </label>
                    <label class="checkbox-item-label" style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                      <input type="checkbox" name="businessModel" value="B2B2C">
                      <span>B2B2C</span>
                    </label>
                    <label class="checkbox-item-label" style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                      <input type="checkbox" name="businessModel" value="B2G">
                      <span>B2G</span>
                    </label>
                  </div>
                </div>

                <!-- Number of Customers -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Number of Customers</label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                        <path d="M8 8v8"></path>
                        <path d="M12 11c0-1.5 1-2.5 2.5-2.5s2 1 2 2c0 2-3.5 3-3.5 4.5h4"></path>
                      </svg>
                    </span>
                    <input type="number" name="numberOfCustomers" id="reg-num-customers" class="form-control" placeholder="">
                  </div>
                </div>

                <!-- Marquee Customer Details -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Marquee Customer Details</label>
                  <textarea name="marqueeCustomers" id="reg-marquee-customers" class="form-control" rows="3" placeholder=""></textarea>
                </div>

                <!-- Monthly Recurring Revenue (MRR) * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Monthly Recurring Revenue (MRR) <span class="required-star">*</span></label>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" name="mrr" id="reg-mrr" class="form-control" style="max-width: 220px;" placeholder="" required>
                    <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">INR</span>
                  </div>
                </div>

                <!-- Annual Revenue of Last Year * -->
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Annual Revenue of Last Year <span class="required-star">*</span></label>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" name="annualRevenue" id="reg-annual-revenue" class="form-control" style="max-width: 220px;" placeholder="" required>
                    <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">INR</span>
                  </div>
                </div>

                <!-- Wizard Footer Bar (Step 6) -->
                <div class="wizard-footer-bar">
                  <div class="wizard-footer-actions">
                    <button type="button" class="btn-back-step" onclick="OnboardingModule.goToPrevStep(6)">Back</button>
                    <button type="button" class="btn-save-pill" onclick="OnboardingModule.saveDraft()">Save</button>
                    <button type="button" class="btn-next-step" onclick="OnboardingModule.goToNextStep(6)">Next</button>
                  </div>
                  <div class="wizard-step-counter">6/7</div>
                </div>
              </div>

              <!-- STEP 7: FUNDING DETAILS (7/7) -->
              <div class="wizard-step-panel" id="wizard-step-7" style="display: none;">
                <div style="margin-bottom: 18px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                    💰 7. Funding Details & Application Review
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
                    Capital structure, runway, target ask, and final application submission.
                  </p>
                </div>

                <div class="form-row-2" style="margin-bottom: 16px;">
                  <div class="form-group">
                    <label class="form-label">Funding Stage <span class="required-star">*</span></label>
                    <select name="fundingStage" id="reg-funding-stage" class="form-control" required>
                      <option value="Bootstrapped">Bootstrapped / Self-Funded</option>
                      <option value="Pre-Seed">Pre-Seed Round</option>
                      <option value="Seed">Seed Round</option>
                      <option value="Pre-Series A">Pre-Series A</option>
                      <option value="Series A+">Series A / Growth</option>
                      <option value="Grant Funded">Govt / Non-Dilutive Grant</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Instrument Type</label>
                    <select name="instrumentType" id="reg-instrument-type" class="form-control">
                      <option value="Equity">Equity Shares</option>
                      <option value="CCPS / CCD">CCPS / Convertible Debentures</option>
                      <option value="SAFE / i-SAFE">SAFE / i-SAFE Agreement</option>
                      <option value="Grant">Govt Grant (Non-Dilutive)</option>
                      <option value="Debt">Venture Debt / Revenue Loan</option>
                    </select>
                  </div>
                </div>

                <div class="form-row-2" style="margin-bottom: 16px;">
                  <div class="form-group">
                    <label class="form-label">Total Funding Raised till Date <span class="required-star">*</span></label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <input type="number" name="fundingRaised" id="reg-funding-raised" class="form-control" value="0" min="0" required>
                      <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">INR</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Current Target Ask / Round Size <span class="required-star">*</span></label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <input type="number" name="targetFundingAsk" id="reg-target-ask" class="form-control" placeholder="e.g. 5000000" min="0" required>
                      <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">INR</span>
                    </div>
                  </div>
                </div>

                <div class="form-row-2" style="margin-bottom: 16px;">
                  <div class="form-group">
                    <label class="form-label">Current Runway (in Months) <span class="required-star">*</span></label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <input type="number" name="runwayMonths" id="reg-runway-months" class="form-control" value="12" min="1" max="60" required>
                      <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Months</span>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Monthly Burn Rate <span class="required-star">*</span></label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <input type="number" name="burnRate" id="reg-burn-rate" class="form-control" value="50000" min="0" required>
                      <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">INR</span>
                    </div>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label">Existing Investors / Cap Table Summary (Optional)</label>
                  <textarea name="investorsSummary" id="reg-investors-summary" class="form-control" rows="2" placeholder="e.g. Angel investors (10%), Founders (90%), ESOP pool..."></textarea>
                </div>

                <!-- Dynamic Review Summary Mount -->
                <div id="wizard-review-summary" style="margin-top: 14px; margin-bottom: 16px;"></div>

                <div style="background: var(--bg-surface-elevated); padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 16px;">
                  <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--text-secondary); cursor: pointer;">
                    <input type="checkbox" id="reg-consent-check" required style="margin-top: 3px;">
                    <span>
                      I hereby certify that all founder identity details, product architecture, market metrics, and funding representations provided above are authentic and accurate under the Incubation Policy.
                    </span>
                  </label>
                </div>

                <!-- Wizard Footer Bar (Step 7: Submit) -->
                <div class="wizard-footer-bar">
                  <div class="wizard-footer-actions">
                    <button type="button" class="btn-back-step" onclick="OnboardingModule.goToPrevStep(7)">Back</button>
                    <button type="button" class="btn-save-pill" onclick="OnboardingModule.saveDraft()">Save</button>
                    <button type="submit" class="btn-next-step" style="background: var(--status-success); color: #ffffff; padding: 9px 28px;">
                      Submit Application (Status: Applied) 🚀
                    </button>
                  </div>
                  <div class="wizard-step-counter">7/7</div>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
    this.restoreDraftIfExists();
  },

  handleCategoryChange(val) {
    const wrap = document.getElementById('onboard-other-category-wrap');
    const input = document.getElementById('input-other-category');
    if (!wrap) return;
    if (val === 'Others') {
      wrap.style.display = 'block';
      if (input) input.required = true;
    } else {
      wrap.style.display = 'none';
      if (input) input.required = false;
    }
  },

  handleIncorporationChange(val) {
    const incorpWrap = document.getElementById('incorp-details-wrap');
    const noteWrap = document.getElementById('no-incorp-note');
    if (val === 'yes') {
      if (incorpWrap) incorpWrap.style.display = 'block';
      if (noteWrap) noteWrap.style.display = 'none';
    } else {
      if (incorpWrap) incorpWrap.style.display = 'none';
      if (noteWrap) noteWrap.style.display = 'block';
    }
  },

  handlePitchDeckSelected(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const display = document.getElementById('pitch-deck-filename-display');
      const hidden = document.getElementById('reg-pitch-deck-name');
      if (display) {
        display.innerHTML = `📄 <strong style="color: var(--accent-primary);">${file.name}</strong> <span style="font-size: 11px; color: var(--status-success); font-weight: 600;">(${(file.size/1024/1024).toFixed(1)} MB - Attached)</span>`;
      }
      if (hidden) {
        hidden.value = file.name;
      }
      App.showToast(`📎 Pitch deck attached: ${file.name}`, 'info');
    }
  },

  goToNextStep(currentStep) {
    if (currentStep < 7) {
      this.goToStep(currentStep + 1);
    }
  },

  goToPrevStep(currentStep) {
    if (currentStep > 1) {
      this.goToStep(currentStep - 1);
    }
  },

  goToStep(step) {
    if (step < 1 || step > 7) return;
    this.wizardStep = step;
    this.updateWizardStepView();
    // Scroll modal content to top on step change
    const modalBody = document.querySelector('#modal-reg-wizard .modal-body');
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
  },

  updateWizardStepView() {
    for (let i = 1; i <= 7; i++) {
      const panel = document.getElementById(`wizard-step-${i}`);
      const navNode = document.getElementById(`wizard-nav-${i}`);
      if (panel) {
        panel.style.display = (i === this.wizardStep) ? 'block' : 'none';
      }
      if (navNode) {
        navNode.classList.remove('active', 'completed');
        if (i === this.wizardStep) {
          navNode.classList.add('active');
        } else if (i < this.wizardStep) {
          navNode.classList.add('completed');
        }
      }
    }

    if (this.wizardStep === 7) {
      this.updateReviewSummary();
    }
  },

  updateReviewSummary() {
    const summaryContainer = document.getElementById('wizard-review-summary');
    if (!summaryContainer) return;

    const form = document.getElementById('form-onboard-wizard');
    if (!form) return;

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const selectedBusinessModels = fd.getAll('businessModel');

    const category = (data.category === 'Others' && data.otherCategory && data.otherCategory.trim()) 
      ? `${data.otherCategory.trim()} (Custom/Others)` 
      : (data.category || 'Technology & Innovation');

    const bModelStr = selectedBusinessModels.length > 0 ? selectedBusinessModels.join(', ') : (data.businessModel || 'N/A');
    const mrrFormatted = Number(data.mrr || 0).toLocaleString('en-IN');
    const annualRevFormatted = Number(data.annualRevenue || 0).toLocaleString('en-IN');
    const fundingRaisedFormatted = Number(data.fundingRaised || 0).toLocaleString('en-IN');
    const targetAskFormatted = Number(data.targetFundingAsk || 0).toLocaleString('en-IN');
    const burnRateFormatted = Number(data.burnRate || 0).toLocaleString('en-IN');

    summaryContainer.innerHTML = `
      <div class="grid-2col" style="gap: 12px; font-size: 12px;">
        <!-- Founder Profile -->
        <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <h5 style="font-size: 11.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">👤 Founder Profile</h5>
          <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">${data.founderName || 'Founder Name'}</div>
          <div style="color: var(--accent-secondary); font-size: 11.5px; margin-bottom: 6px;">${data.founderRole || 'Founder & CEO'}</div>
          <div>📧 <strong>${data.founderEmail || 'N/A'}</strong></div>
          <div>📱 <strong>${data.founderPhone || 'N/A'}</strong></div>
          <div>🌐 <a href="${data.founderLinkedIn || '#'}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline;">${data.founderLinkedIn || 'N/A'}</a></div>
          ${data.founderBio ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; font-style: italic;">"${data.founderBio}"</div>` : ''}
        </div>

        <!-- Startup Particulars -->
        <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <h5 style="font-size: 11.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">🏢 Startup Particulars</h5>
          <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">${data.logoEmoji || '🚀'} ${data.name || 'Startup Name'}</div>
          <div style="color: var(--accent-secondary); font-size: 11.5px; margin-bottom: 6px;">Category: <strong>${category}</strong></div>
          <div>🌐 Website: <a href="${data.startupWebsite || '#'}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline;">${data.startupWebsite || 'N/A'}</a></div>
          <div>📍 Operational City: <strong>${data.operationalCity || 'N/A'}</strong></div>
          <div>🏢 Incorporated: <strong>${data.isIncorporated === 'yes' ? 'Yes (' + (data.registrationNumber || 'CIN Pending') + ')' : 'No (Pre-incorporation)'}</strong></div>
          ${data.productName ? `<div>💡 Product: <strong>${data.productName}</strong> (${data.coreTechnology || 'Tech'} • IP: <strong>${data.hasPatents || 'None'}</strong>)</div>` : ''}
          <div>👥 Team: <strong>${data.numberOfFounders || 1} Founders</strong> • <strong>${data.teamSize || 2} Pax</strong></div>
          <div>📎 Pitch Deck: <strong>${data.pitchDeckName || 'pitch_deck_presentation.pdf'}</strong></div>
        </div>

        <!-- Market & Commercial Traction -->
        <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <h5 style="font-size: 11.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">📊 Market & Customer Traction</h5>
          <div>🏷️ Sector: <strong>${data.marketSector || category}</strong></div>
          <div>💼 Business Model: <strong>${bModelStr}</strong></div>
          <div>👥 Customers: <strong>${data.numberOfCustomers || '0'}</strong></div>
          <div>💰 MRR: <strong>₹${mrrFormatted}</strong></div>
          <div>📈 Annual Revenue: <strong>₹${annualRevFormatted}</strong></div>
          ${data.customerPersona ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; font-style: italic;">Persona: "${data.customerPersona}"</div>` : ''}
          ${data.marqueeCustomers ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; font-style: italic;">Marquee: "${data.marqueeCustomers}"</div>` : ''}
        </div>

        <!-- Funding & Capital Ask -->
        <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <h5 style="font-size: 11.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">💰 Funding & Capital Structure</h5>
          <div>🌱 Stage: <strong>${data.fundingStage || 'Bootstrapped'}</strong></div>
          <div>📜 Instrument: <strong>${data.instrumentType || 'Equity'}</strong></div>
          <div>💵 Raised till Date: <strong>₹${fundingRaisedFormatted}</strong></div>
          <div>🎯 Target Ask: <strong>₹${targetAskFormatted}</strong></div>
          <div>⏳ Runway: <strong>${data.runwayMonths || 12} Months</strong> • Burn: <strong>₹${burnRateFormatted}/mo</strong></div>
          ${data.investorsSummary ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; font-style: italic;">Cap Table: "${data.investorsSummary}"</div>` : ''}
        </div>
      </div>
    `;
  },

  saveDraft() {
    const form = document.getElementById('form-onboard-wizard');
    if (!form) return;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.businessModel = fd.getAll('businessModel');
    localStorage.setItem('nexus_startup_onboard_draft', JSON.stringify({
      ...data,
      savedAt: new Date().toISOString()
    }));
    App.showToast('💾 Application draft saved successfully! You can resume anytime.', 'success');
  },

  restoreDraftIfExists() {
    try {
      const saved = localStorage.getItem('nexus_startup_onboard_draft');
      if (!saved) return;
      const data = JSON.parse(saved);
      const form = document.getElementById('form-onboard-wizard');
      if (!form) return;

      Object.entries(data).forEach(([key, val]) => {
        if (key === 'businessModel') {
          const selectedModels = Array.isArray(val) ? val : [val];
          const checkboxes = form.querySelectorAll('input[name="businessModel"]');
          checkboxes.forEach(cb => {
            cb.checked = selectedModels.includes(cb.value);
          });
          return;
        }
        const radio = form.querySelector(`input[name="${key}"][value="${val}"]`);
        if (radio) {
          radio.checked = true;
        } else {
          const input = form.elements[key];
          if (input && val !== undefined) {
            input.value = val;
          }
        }
      });

      if (data.category === 'Others') {
        this.handleCategoryChange('Others');
      }
      if (data.isIncorporated) {
        this.handleIncorporationChange(data.isIncorporated);
      }
      if (data.pitchDeckName && data.pitchDeckName !== 'pitch_deck_presentation.pdf') {
        const display = document.getElementById('pitch-deck-filename-display');
        if (display) {
          display.innerHTML = `📄 <strong style="color: var(--accent-primary);">${data.pitchDeckName}</strong>`;
        }
      }
    } catch (e) {
      console.warn("Could not restore draft:", e);
    }
  },

  handleRegistrationSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const selectedBusinessModels = fd.getAll('businessModel');

    const consent = document.getElementById('reg-consent-check');
    if (consent && !consent.checked) {
      App.showToast('Please certify the application declaration before submitting.', 'warning');
      consent.focus();
      return;
    }

    if (!data.name || !data.name.trim()) {
      App.showToast('Please provide your Startup Name in Step 2.', 'warning');
      this.goToStep(2);
      const nameInput = document.getElementById('reg-startup-name');
      if (nameInput) nameInput.focus();
      return;
    }

    // Resolve category if Others
    const resolvedCategory = (data.category === 'Others' && data.otherCategory && data.otherCategory.trim())
      ? data.otherCategory.trim()
      : (data.category || 'Others');

    const newStartup = window.store.addStartup({
      ...data,
      businessModel: selectedBusinessModels.length > 0 ? selectedBusinessModels.join(', ') : (data.businessModel || 'B2B'),
      category: resolvedCategory,
      sector: resolvedCategory,
      status: 'Applied' // Stored status starts at Applied
    });

    localStorage.removeItem('nexus_startup_onboard_draft');
    this.closeModal('modal-reg-wizard');
    App.showToast(`🎉 Application submitted for ${newStartup.name}! Signing into Founder Portal...`, 'success');
    App.loginAsStartup(newStartup.id);
  },

  // --- Document Verification & Approval Drawer ---
  openVerificationModal(startupId) {
    const s = window.store.getStartupById(startupId);
    if (!s) return;

    const docs = s.documents || [];

    const html = `
      <div class="modal-overlay active" id="modal-verification">
        <div class="modal-content modal-wide">
          <div class="modal-header">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 22px;">${s.logoEmoji || '📋'}</span>
                <h3 class="modal-title">Document Verification & Incubation Approval</h3>
              </div>
              <span style="font-size: 12px; color: var(--text-muted);">${s.name} • ${s.category || s.sector}</span>
            </div>
            <button class="modal-close-btn" onclick="OnboardingModule.closeModal('modal-verification')">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Current Status Progression Bar -->
            <div style="background: var(--bg-surface-elevated); padding: 12px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <span style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Current Lifecycle Status:</span>
                <div style="font-size: 16px; font-weight: 800; color: var(--accent-primary); margin-top: 2px;">
                  ${s.status}
                </div>
              </div>

              <div style="display: flex; gap: 8px;">
                ${s.status === 'Applied' ? `
                  <button class="btn btn-primary btn-sm" onclick="OnboardingModule.moveStatus('${s.id}', 'Under Review'); OnboardingModule.closeModal('modal-verification');">
                    Move to Under Review
                  </button>
                ` : s.status === 'Under Review' ? `
                  <button class="btn btn-primary btn-sm" style="background: var(--status-success);" onclick="OnboardingModule.moveStatus('${s.id}', 'Approved'); OnboardingModule.closeModal('modal-verification');">
                    ✓ Grant Incubation Approval
                  </button>
                ` : s.status === 'Approved' ? `
                  <button class="btn btn-primary btn-sm" onclick="OnboardingModule.closeModal('modal-verification'); App.switchTab('workspace'); WorkspaceModule.highlightForStartup('${s.id}');">
                    🏢 Proceed to Workspace Allocation
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Stored Data Summary -->
            <div class="grid-2col" style="gap: 12px; margin-bottom: 18px; font-size: 12px;">
              <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <h4 style="font-size: 11.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Company Particulars</h4>
                <div>Registration No: <strong>${s.registrationNumber || 'N/A'}</strong></div>
                <div>GSTIN: <strong>${s.gstin || 'N/A'}</strong></div>
                <div>Headcount: <strong>${s.numberOfEmployees || s.teamSize} Employees</strong></div>
                <div>Incubation Period: <strong>${s.incubationPeriod || '12 Months'}</strong></div>
                <div>Joining Date: <strong>${s.joiningDate || s.moveInDate}</strong></div>
              </div>

              <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <h4 style="font-size: 11.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Founder & Contact</h4>
                <div>Name: <strong>${s.founders.name}</strong> (${s.founders.role})</div>
                <div>Email: <strong>${s.founders.email}</strong></div>
                <div>Phone: <strong>${s.founders.phone || s.founders.mobile}</strong></div>
                ${s.founders.linkedIn ? `<div>LinkedIn: <a href="${s.founders.linkedIn.startsWith('http') ? s.founders.linkedIn : 'https://' + s.founders.linkedIn}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600;">${s.founders.linkedIn}</a></div>` : ''}
                <div>Grant Subsidy: <strong>${s.monthlyGrantSubsidyPercent}%</strong></div>
              </div>
            </div>

            <!-- Document Verification Table -->
            <h4 style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px;">
              Uploaded Documents Checklist (${docs.length})
            </h4>

            <div class="table-wrapper" style="margin-bottom: 16px;">
              <table class="nexus-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>File Name</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${docs.map(doc => `
                    <tr>
                      <td><strong>${doc.type}</strong></td>
                      <td><code style="font-family: var(--font-mono); font-size: 11px;">${doc.fileName}</code> (${doc.fileSize})</td>
                      <td>${doc.uploadDate}</td>
                      <td>
                        <span class="badge ${doc.status === 'Verified' ? 'badge-success' : doc.status === 'Under Review' ? 'badge-info' : 'badge-warning'}">
                          ${doc.status}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 4px;">
                          ${doc.status !== 'Verified' ? `
                            <button class="btn btn-sm btn-primary" style="padding: 3px 8px; font-size: 11px;" onclick="OnboardingModule.markDocStatus('${s.id}', '${doc.id}', 'Verified')">
                              Verify ✓
                            </button>
                          ` : `
                            <span style="font-size: 11px; color: var(--status-success); font-weight: 600;">Verified by ${doc.verifiedBy || 'Admin'}</span>
                          `}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Verification Notes -->
            <div class="form-group">
              <label class="form-label">Administrative Verification Notes & Remarks</label>
              <textarea id="verification-notes-input" class="form-control" rows="2" placeholder="Record verification remarks, board review comments...">${s.verification ? s.verification.notes || '' : ''}</textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="OnboardingModule.closeModal('modal-verification')">Close</button>
            <button class="btn btn-primary" onclick="OnboardingModule.saveVerificationNotes('${s.id}')">Save Notes</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  markDocStatus(startupId, docId, status) {
    window.store.verifyDocument(startupId, docId, status, 'Admin');
    App.showToast(`Document updated to ${status}!`, 'success');
    this.openVerificationModal(startupId);
    this.render();
  },

  saveVerificationNotes(startupId) {
    const input = document.getElementById('verification-notes-input');
    if (input) {
      const s = window.store.getStartupById(startupId);
      if (s) {
        if (!s.verification) s.verification = {};
        s.verification.notes = input.value;
        window.store.save();
        App.showToast('Verification notes updated.', 'info');
      }
    }
    this.closeModal('modal-verification');
  },

  moveStatus(startupId, newStatus) {
    const res = window.store.progressStartupStatus(startupId, newStatus);
    if (res.success) {
      App.showToast(`🚀 ${res.message}`, 'success');
      this.render();
      DashboardModule.render();
    }
  },

  viewStartupDossier(id) {
    const s = window.store.getStartupById(id);
    if (!s) return;

    const spaces = window.store.getSpaces();
    const allocatedSpaces = spaces.filter(sp => (s.allocatedSeats || []).includes(sp.id));
    const billingCalc = window.store.calculateStartupMonthlyBilling(s.id);
    const mentor = s.mentorId ? window.store.getMentors().find(m => m.id === s.mentorId) : null;
    const docs = s.documents || [];

    const html = `
      <div class="modal-overlay active" id="modal-dossier">
        <div class="modal-content modal-wide">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 28px;">${s.logoEmoji || '🚀'}</span>
              <div>
                <h3 class="modal-title">${s.name}</h3>
                <span style="font-size: 12px; color: var(--accent-secondary); font-weight: 600;">
                  ${s.category || s.sector} • ${s.cohort}
                </span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${this.getStatusBadgeClass(s.status)}">${s.status}</span>
              <button class="modal-close-btn" onclick="OnboardingModule.closeModal('modal-dossier')">&times;</button>
            </div>
          </div>

          <div class="modal-body">
            <!-- Executive Pitch -->
            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 18px;">
              ${s.pitchSummary}
            </p>

            <!-- Company Particulars & Registration -->
            <div class="grid-2col" style="margin-bottom: 16px;">
              <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <h4 style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">1. Company Registration & Compliance</h4>
                <div style="font-size: 12.5px; line-height: 1.6;">
                  <div>Registration No (CIN): <strong style="font-family: var(--font-mono);">${s.registrationNumber || 'Pending'}</strong></div>
                  <div>GSTIN: <strong style="font-family: var(--font-mono);">${s.gstin || 'Exempt / In Process'}</strong></div>
                  <div>Employees: <strong>${s.numberOfEmployees || s.teamSize} Team Members</strong></div>
                  <div>Joining Date: <strong>${s.joiningDate || s.moveInDate}</strong></div>
                  <div>Incubation Period: <strong>${s.incubationPeriod || '12 Months'}</strong></div>
                </div>
              </div>

              <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <h4 style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">2. Founder & Contact Profile</h4>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">${s.founders.name}</div>
                <div style="font-size: 11.5px; color: var(--accent-secondary); margin-bottom: 4px;">${s.founders.role}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">📧 ${s.founders.email}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">📱 ${s.founders.phone || s.founders.mobile}</div>
                ${s.founders.linkedIn ? `<div style="font-size: 12px; color: #0284c7; margin-top: 3px;"><a href="${s.founders.linkedIn.startsWith('http') ? s.founders.linkedIn : 'https://' + s.founders.linkedIn}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">🌐 ${s.founders.linkedIn}</a></div>` : ''}
                ${s.founders.bio ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; font-style: italic;">"${s.founders.bio}"</div>` : ''}
              </div>
            </div>

            <!-- Documents Summary -->
            <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">
                  Documents & Verification Record (${docs.length})
                </h4>
                <button class="btn btn-outline btn-sm" onclick="OnboardingModule.closeModal('modal-dossier'); OnboardingModule.openVerificationModal('${s.id}')">
                  Manage Verification
                </button>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${docs.map(d => `
                  <span class="badge ${d.status === 'Verified' ? 'badge-success' : 'badge-warning'}" style="font-size: 11px;">
                    ${d.type}: ${d.status}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Workspace Allocation & Billing -->
            <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">
                  Workspace Allocation (${allocatedSpaces.length})
                </h4>
                <button class="btn btn-outline btn-sm" onclick="OnboardingModule.closeModal('modal-dossier'); App.switchTab('workspace'); WorkspaceModule.highlightForStartup('${s.id}')">
                  Open Floor Plan
                </button>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${allocatedSpaces.length > 0 
                  ? allocatedSpaces.map(sp => `
                      <span class="badge badge-info" style="font-size: 12px; padding: 4px 10px;">
                        ${sp.label} • ₹${sp.monthlyRate.toLocaleString('en-IN')}/mo
                      </span>
                    `).join('')
                  : `<span style="font-size: 12px; color: var(--text-muted); font-style: italic;">No workspace allocated yet (Status: ${s.status}).</span>`
                }
              </div>
              ${billingCalc ? `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 12px;">
                  <span>Gross: ₹${billingCalc.subtotal.toLocaleString('en-IN')}</span>
                  <span style="color: var(--status-success);">Grant Subsidy: -₹${billingCalc.subsidyDeduction.toLocaleString('en-IN')} (${billingCalc.subsidyPercent}%)</span>
                  <strong>Net Due: ₹${billingCalc.total.toLocaleString('en-IN')}/mo</strong>
                </div>
              ` : ''}
            </div>

            <!-- Assigned Mentor -->
            ${mentor ? `
              <div style="padding: 12px; background: rgba(99, 102, 241, 0.08); border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-size: 12px; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 22px;">${mentor.avatarEmoji}</span>
                <div>
                  <strong>Assigned Mentor: ${mentor.name}</strong>
                  <div style="color: var(--text-secondary); font-size: 11px;">${mentor.role} • ${mentor.expertise}</div>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" onclick="OnboardingModule.closeModal('modal-dossier')">Close Dossier</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-mount').innerHTML = html;
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
  }
};
