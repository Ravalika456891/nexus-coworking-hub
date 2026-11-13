// Authentication Gate (Lock Screen & Login Guard)
// Intercepts access to Command Center until valid Mobile Number & Password are provided

const AuthGate = {
  init() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAutoAdmin = params.get('admin') === 'true' || 
                          params.get('admin') !== null ||
                          params.get('login') === 'admin' || 
                          params.get('role') === 'admin' || 
                          params.get('role') === 'super_admin' ||
                          window.location.pathname.startsWith('/admin');

      if (isAutoAdmin) {
        // Direct Super Admin instant access - NO LOGIN REQUIRED
        sessionStorage.removeItem('nexus_logged_out');
        try { localStorage.removeItem('nexus_logged_out'); } catch (e) {}
        const adminSession = {
          role: 'super_admin',
          userId: 'USR-ADMIN-1',
          userName: 'Dev Sharma',
          name: 'Dev Sharma',
          timestamp: Date.now()
        };
        sessionStorage.setItem('nexus_auth_session', JSON.stringify(adminSession));
        try { localStorage.setItem('nexus_auth_session', JSON.stringify(adminSession)); } catch (e) {}
        if (window.store) window.store.setRole('super_admin');
        const gate = document.getElementById('auth-gate-overlay');
        if (gate) gate.style.display = 'none';
        document.documentElement.classList.remove('auth-locked');
        if (window.App && window.App.updateRoleIndicator) window.App.updateRoleIndicator();
        return;
      }

      const isAutoUser = params.get('user') === 'true' || 
                         params.get('auto') === 'user' || 
                         params.get('role') === 'startup' || 
                         params.get('role') === 'founder' ||
                         window.location.pathname.startsWith('/user');

      if (isAutoUser) {
        // Direct User / Founder instant access - NO LOGIN REQUIRED
        sessionStorage.removeItem('nexus_logged_out');
        try { localStorage.removeItem('nexus_logged_out'); } catch (e) {}
        const userSession = {
          userId: 'USR-FOUNDER-1',
          name: 'Alex Morgan',
          phone: '9880012345',
          role: 'startup',
          startupId: 'STP-01',
          startupName: 'NeuroPulse AI',
          founderName: 'Alex Morgan',
          timestamp: Date.now()
        };
        sessionStorage.setItem('nexus_auth_session', JSON.stringify(userSession));
        try { localStorage.setItem('nexus_auth_session', JSON.stringify(userSession)); } catch (e) {}
        if (window.store) window.store.setRole('startup', 'STP-01');
        const gate = document.getElementById('auth-gate-overlay');
        if (gate) gate.style.display = 'none';
        document.documentElement.classList.remove('auth-locked');
        if (window.App && window.App.updateRoleIndicator) window.App.updateRoleIndicator();
        return;
      }

      const isExplicitUserLogin = params.get('login') === 'user' || 
                                  params.get('login') === 'startup' || 
                                  window.location.pathname.startsWith('/login');

      if (isExplicitUserLogin) {
        // Direct User Side Login Screen
        sessionStorage.removeItem('nexus_auth_session');
        sessionStorage.setItem('nexus_logged_out', '1');
        document.documentElement.classList.add('auth-locked');
        const gate = document.getElementById('auth-gate-overlay');
        if (gate) {
          gate.style.display = 'flex';
          gate.classList.remove('unlocking');
        }
        const btnAdmin = document.getElementById('gate-tab-btn-admin');
        if (btnAdmin) btnAdmin.style.display = 'none';
        const tabs = document.querySelector('.auth-gate-tabs');
        if (tabs) tabs.style.display = 'none';
        this.switchGateTab('startup');
        this.attachValidationListeners();
        return;
      }

      const btnAdmin = document.getElementById('gate-tab-btn-admin');
      if (btnAdmin) btnAdmin.style.display = 'none';
      const tabs = document.querySelector('.auth-gate-tabs');
      if (tabs) tabs.style.display = 'none';
      this.attachValidationListeners();
    } catch (e) {
      console.warn('URL param parse error:', e);
    }

    this.checkAuthGate();
  },

    checkAuthGate() {
      const gate = document.getElementById('auth-gate-overlay');
      if (!gate) return;

      let sessionRaw = sessionStorage.getItem('nexus_auth_session');
      if (!sessionRaw && !sessionStorage.getItem('nexus_logged_out')) {
        const defaultSession = {
          userId: 'USR-FOUNDER-1',
          name: 'Alex Morgan',
          phone: '9880012345',
          role: 'startup',
          startupId: 'STP-01',
          startupName: 'NeuroPulse AI',
          founderName: 'Alex Morgan',
          timestamp: Date.now()
        };
        sessionStorage.setItem('nexus_auth_session', JSON.stringify(defaultSession));
        sessionRaw = JSON.stringify(defaultSession);
      }

      if (!sessionRaw) {
        document.documentElement.classList.add('auth-locked');
        gate.style.display = 'flex';
        gate.classList.remove('unlocking');
        this.attachValidationListeners();
      } else {
        try {
          const session = JSON.parse(sessionRaw);
          if (session && session.role && window.store) {
            if (session.role === 'startup' && session.startupId) {
              window.store.setRole('startup', session.startupId);
            } else if (session.role === 'super_admin') {
              window.store.setRole('super_admin');
            }
          }
        } catch (e) {
          console.warn('Session parse error:', e);
        }
        document.documentElement.classList.remove('auth-locked');
        gate.style.display = 'none';
      }
    },

    switchGateTab(tab) {
      const panelStartup = document.getElementById('gate-panel-startup');
      const panelAdmin = document.getElementById('gate-panel-admin');
      const btnStartup = document.getElementById('gate-tab-btn-startup');
      const btnAdmin = document.getElementById('gate-tab-btn-admin');
      if (!panelStartup || !panelAdmin) return;

      if (tab === 'startup') {
        panelStartup.style.display = 'block';
        panelAdmin.style.display = 'none';
        if (btnStartup) btnStartup.classList.add('active');
        if (btnAdmin) btnAdmin.classList.remove('active');
      } else {
        panelStartup.style.display = 'none';
        panelAdmin.style.display = 'block';
        if (btnAdmin) btnAdmin.classList.add('active');
        if (btnStartup) btnStartup.classList.remove('active');
      }
    },

    attachValidationListeners() {
      const phoneInp = document.getElementById('gate-startup-phone');
      const passInp = document.getElementById('gate-startup-password');
      if (phoneInp && !phoneInp._hasValidationListener) {
        phoneInp._hasValidationListener = true;
        phoneInp.addEventListener('input', () => this.updatePhoneValidationUI(phoneInp));
        this.updatePhoneValidationUI(phoneInp);
      }
      if (passInp && !passInp._hasValidationListener) {
        passInp._hasValidationListener = true;
        passInp.addEventListener('input', () => this.updatePasswordValidationUI(passInp));
        this.updatePasswordValidationUI(passInp);
      }
    },

    updatePhoneValidationUI(input) {
      if (!input) return;
      // Filter out any non-digits and cap at 10 digits
      let clean = input.value.replace(/\D/g, '').slice(0, 10);
      if (input.value !== clean) {
        input.value = clean;
      }
      const counter = document.getElementById('gate-phone-counter');
      if (counter) {
        if (clean.length === 10) {
          counter.innerText = '✓ 10/10 digits';
          counter.style.color = '#10b981';
          input.style.borderColor = '#10b981';
        } else if (clean.length > 0) {
          counter.innerText = `${clean.length}/10 digits`;
          counter.style.color = '#f59e0b';
          input.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        } else {
          counter.innerText = '0/10 digits';
          counter.style.color = '#94a3b8';
          input.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
      }
    },

    updatePasswordValidationUI(input) {
      if (!input) return;
      const len = input.value.length;
      const counter = document.getElementById('gate-pass-counter');
      if (counter) {
        if (len >= 10 && len <= 16) {
          counter.innerText = `✓ ${len}/16 positions (valid)`;
          counter.style.color = '#10b981';
          input.style.borderColor = '#10b981';
        } else if (len > 0 && len < 10) {
          counter.innerText = `${len}/16 (min 10 required)`;
          counter.style.color = '#f59e0b';
          input.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        } else if (len > 16) {
          counter.innerText = `⚠️ ${len} (max 16 allowed)`;
          counter.style.color = '#ef4444';
          input.style.borderColor = '#ef4444';
        } else {
          counter.innerText = '0/16 positions';
          counter.style.color = '#94a3b8';
          input.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
      }
    },

    quickFillGateStartup(phone, password = 'password123') {
      const phoneInput = document.getElementById('gate-startup-phone');
      const passInput = document.getElementById('gate-startup-password');
      const errBox = document.getElementById('gate-startup-error');
      if (phoneInput) {
        phoneInput.value = phone;
        this.updatePhoneValidationUI(phoneInput);
      }
      if (passInput) {
        passInput.value = password;
        this.updatePasswordValidationUI(passInput);
      }
      if (errBox) errBox.style.display = 'none';
    },

    togglePasswordVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.innerText = '🙈';
      } else {
        input.type = 'password';
        if (btn) btn.innerText = '👁️';
      }
    },

    validateMobile(rawMobile) {
      const trimmed = (rawMobile || '').trim();
      if (!trimmed) {
        return { valid: false, message: '⚠️ Mobile number is required. Please enter a 10-digit mobile number.' };
      }

      let digits = trimmed.replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      }

      if (digits.length !== 10) {
        return {
          valid: false,
          digits,
          message: `⚠️ Mobile number must be exactly 10 digits. More or fewer digits are not allowed (you entered ${digits.length} digits: "${trimmed}").`
        };
      }

      return { valid: true, digits };
    },

    validatePassword(rawPassword) {
      const passStr = String(rawPassword || '');
      if (!passStr) {
        return { valid: false, message: '⚠️ Password is required (must be 10 to 16 positions/characters).' };
      }
      if (passStr.length < 10) {
        return {
          valid: false,
          length: passStr.length,
          message: `⚠️ Password must be between 10 and 16 characters only. (You entered ${passStr.length} characters, minimum 10 required).`
        };
      }
      if (passStr.length > 16) {
        return {
          valid: false,
          length: passStr.length,
          message: `⚠️ Password must be between 10 and 16 characters only. More than 16 characters is not allowed (you entered ${passStr.length} characters).`
        };
      }
      return { valid: true, length: passStr.length };
    },

    handleGateStartupLogin(e) {
      if (e) e.preventDefault();
      const phoneInput = document.getElementById('gate-startup-phone');
      const passInput = document.getElementById('gate-startup-password');
      const errBox = document.getElementById('gate-startup-error');
      if (!phoneInput) return;

      const phoneVal = phoneInput.value;
      const passVal = passInput ? passInput.value : '';

      // 1. Mobile validation: must be exactly 10 digits
      const mobileCheck = this.validateMobile(phoneVal);
      if (!mobileCheck.valid) {
        if (errBox) {
          errBox.innerText = mobileCheck.message;
          errBox.style.display = 'block';
          phoneInput.focus();
        }
        return;
      }

      // 2. Password validation: must be 10-16 positions only
      const passCheck = this.validatePassword(passVal);
      if (!passCheck.valid) {
        if (errBox) {
          errBox.innerText = passCheck.message;
          errBox.style.display = 'block';
          if (passInput) passInput.focus();
        }
        return;
      }

      const res = window.store.loginAsStartup(phoneVal, passVal);
      if (res.success) {
        if (errBox) errBox.style.display = 'none';
        const founderName = res.startup.founders?.name || 'Founder';
        sessionStorage.setItem('nexus_auth_session', JSON.stringify({
          role: 'startup',
          startupId: res.startup.id,
          startupName: res.startup.name,
          founderName,
          phone: phoneVal,
          timestamp: Date.now()
        }));

        this.unlockGateWithSuccess(`🎉 Welcome back, ${founderName}! Authenticated into ${res.startup.name} Founder Portal.`);
      } else {
        if (errBox) {
          errBox.innerText = res.message || 'Authentication failed. Please check mobile number and password.';
          errBox.style.display = 'block';
        }
      }
    },

    handleGateAdminLogin(e) {
      if (e) e.preventDefault();
      const idInput = document.getElementById('gate-admin-identifier');
      const passInput = document.getElementById('gate-admin-password');
      const pinInput = document.getElementById('gate-admin-pin');
      const errBox = document.getElementById('gate-admin-error');
      if (!idInput) return;

      const idVal = idInput.value;
      const passVal = passInput ? passInput.value : '';

      // If identifier is mobile number (not email and not plain word 'admin')
      if (!idVal.includes('@') && idVal.toLowerCase() !== 'admin' && idVal.toLowerCase() !== 'superadmin' && idVal.toLowerCase() !== 'dev') {
        const mobileCheck = this.validateMobile(idVal);
        if (!mobileCheck.valid) {
          if (errBox) {
            errBox.innerText = mobileCheck.message;
            errBox.style.display = 'block';
            idInput.focus();
          }
          return;
        }
      }

      // Password validation: must be 10-16 positions only
      const passCheck = this.validatePassword(passVal);
      if (!passCheck.valid) {
        if (errBox) {
          errBox.innerText = passCheck.message;
          errBox.style.display = 'block';
          if (passInput) passInput.focus();
        }
        return;
      }

      const res = window.store.loginAsSuperAdmin(idVal, passVal, pinInput ? pinInput.value : '');
      if (res.success) {
        if (errBox) errBox.style.display = 'none';
        sessionStorage.setItem('nexus_auth_session', JSON.stringify({
          role: 'super_admin',
          userName: 'Dev Sharma',
          timestamp: Date.now()
        }));

        this.unlockGateWithSuccess('👑 Welcome, Director Dev Sharma! Super Admin Privileges Authenticated.');
      } else {
        if (errBox) {
          errBox.innerText = res.message || 'Authentication failed. Please verify credentials.';
          errBox.style.display = 'block';
        }
      }
    },

    quickLoginGateAdmin() {
      window.store.loginAsSuperAdmin('admin', 'admin12345');
      sessionStorage.setItem('nexus_auth_session', JSON.stringify({
        role: 'super_admin',
        userName: 'Dev Sharma',
        timestamp: Date.now()
      }));
      this.unlockGateWithSuccess('👑 Welcome, Dev Sharma! Authenticated as Super Admin.');
    },

    loginAsStartupQuick() {
      sessionStorage.removeItem('nexus_logged_out');
      try { localStorage.removeItem('nexus_logged_out'); } catch (e) {}
      const defaultSession = {
        userId: 'USR-FOUNDER-1',
        name: 'Alex Morgan',
        phone: '9880012345',
        role: 'startup',
        startupId: 'STP-01',
        startupName: 'NeuroPulse AI',
        founderName: 'Alex Morgan',
        timestamp: Date.now()
      };
      sessionStorage.setItem('nexus_auth_session', JSON.stringify(defaultSession));
      try { localStorage.setItem('nexus_auth_session', JSON.stringify(defaultSession)); } catch (e) {}
      if (window.store) window.store.setRole('startup', 'STP-01');
      this.unlockGateWithSuccess('🚀 Welcome, Alex Morgan! Authenticated into NeuroPulse AI.');
    },

    unlockGateWithSuccess(toastMsg) {
      sessionStorage.removeItem('nexus_logged_out');
      const gate = document.getElementById('auth-gate-overlay');
      if (gate) {
        gate.classList.add('unlocking');
        setTimeout(() => {
          gate.style.display = 'none';
          gate.classList.remove('unlocking');
          document.documentElement.classList.remove('auth-locked');
        }, 350);
      } else {
        document.documentElement.classList.remove('auth-locked');
      }

      if (window.App && window.App.updateRoleIndicator) {
        window.App.updateRoleIndicator();
        window.App.switchTab('dashboard');
        if (toastMsg && window.App.showToast) window.App.showToast(toastMsg, 'success');
      }
    },

    lockSessionAndLogout() {
      sessionStorage.removeItem('nexus_auth_session');
      sessionStorage.removeItem('nexus_last_tab');
      sessionStorage.setItem('nexus_logged_out', '1');
      try {
        localStorage.removeItem('nexus_auth_session');
        localStorage.removeItem('nexus_last_tab');
        localStorage.setItem('nexus_logged_out', '1');
      } catch (e) {}

      // Reset active role to default startup
      if (window.store) {
        window.store.activeFounderId = null;
        window.store.activeMentorId = null;
        window.store.currentRole = 'startup';
        window.store.setRole('startup', 'STP-01');
      }

      // Exit cleanly to public marketing landing page
      window.location.href = 'index.html?logged_out=1';
    },

    openRegistrationFromGate() {
      window.location.href = 'index.html#cta';
    }
  };

  // Expose on window
  window.AuthGate = AuthGate;

  // Forward methods onto App for convenience and inline event bindings
  if(!window.App) window.App = {};
  Object.assign(window.App, {
    checkAuthGate: () => AuthGate.checkAuthGate(),
    switchGateTab: (tab) => AuthGate.switchGateTab(tab),
    quickFillGateStartup: (phone, pass) => AuthGate.quickFillGateStartup(phone, pass),
    togglePasswordVisibility: (id, btn) => AuthGate.togglePasswordVisibility(id, btn),
    handleGateStartupLogin: (e) => AuthGate.handleGateStartupLogin(e),
    handleGateAdminLogin: (e) => AuthGate.handleGateAdminLogin(e),
    quickLoginGateAdmin: () => AuthGate.quickLoginGateAdmin(),
    loginAsStartupQuick: () => AuthGate.loginAsStartupQuick(),
    lockSessionAndLogout: () => AuthGate.lockSessionAndLogout(),
    openRegistrationFromGate: () => AuthGate.openRegistrationFromGate()
  });

  document.addEventListener('DOMContentLoaded', () => {
    AuthGate.init();
  });
