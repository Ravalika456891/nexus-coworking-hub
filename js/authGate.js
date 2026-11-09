// Authentication Gate (Lock Screen & Login Guard)
// Intercepts access to Command Center until valid Mobile Number & Password are provided

const AuthGate = {
  init() {
    this.checkAuthGate();
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdminAccess = params.get('login') === 'admin' || params.get('admin') === 'true';
      if (isAdminAccess) {
        const btnAdmin = document.getElementById('gate-tab-btn-admin');
        if (btnAdmin) btnAdmin.style.display = 'inline-flex';
        const tabs = document.querySelector('.auth-gate-tabs');
        if (tabs) tabs.style.display = 'flex';
        this.switchGateTab('admin');
      } else {
        const btnAdmin = document.getElementById('gate-tab-btn-admin');
        if (btnAdmin) btnAdmin.style.display = 'none';
        const tabs = document.querySelector('.auth-gate-tabs');
        if (tabs) tabs.style.display = 'none';
        if (params.get('login') === 'startup') {
          this.switchGateTab('startup');
        }
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
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

  quickFillGateStartup(phone, password = 'password123') {
    const phoneInput = document.getElementById('gate-startup-phone');
    const passInput = document.getElementById('gate-startup-password');
    const errBox = document.getElementById('gate-startup-error');
    if (phoneInput) phoneInput.value = phone;
    if (passInput) passInput.value = password;
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
    sessionStorage.setItem('nexus_logged_out', '1');
    document.documentElement.classList.add('auth-locked');
    const gate = document.getElementById('auth-gate-overlay');
    if (gate) {
      gate.classList.remove('unlocking');
      gate.style.display = 'flex';
      const startupErr = document.getElementById('gate-startup-error');
      const adminErr = document.getElementById('gate-admin-error');
      if (startupErr) startupErr.style.display = 'none';
      if (adminErr) adminErr.style.display = 'none';
    }
    if (window.App && window.App.showToast) {
      window.App.showToast('🔒 Session locked. Please enter your mobile number and password to access.', 'info');
    }
  },

  openRegistrationFromGate() {
    window.location.href = 'index.html#cta';
  }
};

// Expose on window
window.AuthGate = AuthGate;

// Forward methods onto App for convenience and inline event bindings
if (!window.App) window.App = {};
Object.assign(window.App, {
  checkAuthGate: () => AuthGate.checkAuthGate(),
  switchGateTab: (tab) => AuthGate.switchGateTab(tab),
  quickFillGateStartup: (phone, pass) => AuthGate.quickFillGateStartup(phone, pass),
  togglePasswordVisibility: (id, btn) => AuthGate.togglePasswordVisibility(id, btn),
  handleGateStartupLogin: (e) => AuthGate.handleGateStartupLogin(e),
  handleGateAdminLogin: (e) => AuthGate.handleGateAdminLogin(e),
  quickLoginGateAdmin: () => AuthGate.quickLoginGateAdmin(),
  lockSessionAndLogout: () => AuthGate.lockSessionAndLogout(),
  openRegistrationFromGate: () => AuthGate.openRegistrationFromGate()
});

document.addEventListener('DOMContentLoaded', () => {
  AuthGate.init();
});
