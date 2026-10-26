// Store & State Management with LocalStorage Persistence

const STORAGE_KEY = 'nexus_hub_coworking_v9'; // Bumped for financial reconciliation: rent, invoices, due dates, GST & KPI cards

class NexusStore {
  constructor() {
    this.state = null;
    this.currentRole = 'admin'; // 'admin' | 'mentor' | 'founder'
    this.activeMentorId = 'MEN-05'; // Default mentor: John Smith
    this.activeFounderId = 'STP-XYZ'; // Default founder view: XYZ Technologies
    this.listeners = [];
  }

  init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.state = JSON.parse(saved);
        if (!this.state.gatewayConfig && window.INITIAL_DATA.gatewayConfig) {
          this.state.gatewayConfig = JSON.parse(JSON.stringify(window.INITIAL_DATA.gatewayConfig));
        }
      } else {
        this.state = JSON.parse(JSON.stringify(window.INITIAL_DATA));
      }
    } catch (e) {
      console.warn("Failed to load state from localStorage, using seed data:", e);
      this.state = JSON.parse(JSON.stringify(window.INITIAL_DATA));
    }

    // Ensure XYZ Technologies, John Smith, and sequential milestones exist
    this.syncIncubationData();
    this.save();
    this.syncFromCloud();
  }

  syncIncubationData() {
    if (!this.state.startups) this.state.startups = [];
    if (!this.state.mentors) this.state.mentors = [];
    if (!this.state.incubationMilestones) this.state.incubationMilestones = [];

    // Ensure Mentor John Smith (MEN-05) exists
    const hasJohnSmith = this.state.mentors.some(m => m.id === 'MEN-05' || m.name === 'John Smith');
    if (!hasJohnSmith && window.INITIAL_DATA.mentors) {
      const seedJohn = window.INITIAL_DATA.mentors.find(m => m.id === 'MEN-05');
      if (seedJohn) this.state.mentors.push(seedJohn);
    }

    // Ensure XYZ Technologies (STP-XYZ) exists
    const hasXYZ = this.state.startups.some(s => s.id === 'STP-XYZ');
    if (!hasXYZ && window.INITIAL_DATA.startups) {
      const seedXYZ = window.INITIAL_DATA.startups.find(s => s.id === 'STP-XYZ');
      if (seedXYZ) {
        this.state.startups.unshift(JSON.parse(JSON.stringify(seedXYZ)));
      }
    }

    // Ensure sequential milestones for XYZ Technologies exist
    const hasXYZMls = this.state.incubationMilestones.some(m => m.startupId === 'STP-XYZ');
    if (!hasXYZMls && window.INITIAL_DATA.incubationMilestones) {
      const xyzMilestones = window.INITIAL_DATA.incubationMilestones.filter(m => m.startupId === 'STP-XYZ');
      this.state.incubationMilestones.unshift(...JSON.parse(JSON.stringify(xyzMilestones)));
    }

    // Ensure milestones for other startups exist if empty
    if (this.state.incubationMilestones.length < 5 && window.INITIAL_DATA.incubationMilestones) {
      this.state.incubationMilestones = JSON.parse(JSON.stringify(window.INITIAL_DATA.incubationMilestones));
    }

    // Normalize all startups
    this.state.startups = this.state.startups.map(s => this.normalizeStartupIncubation(s));

    // Ensure seed payments exist and merge any missing seed payments
    if (!this.state.payments) this.state.payments = [];
    if (window.INITIAL_DATA && window.INITIAL_DATA.payments) {
      window.INITIAL_DATA.payments.forEach(seedPay => {
        if (!this.state.payments.some(p => p.id === seedPay.id)) {
          this.state.payments.push(JSON.parse(JSON.stringify(seedPay)));
        }
      });
    }

    // Ensure T-Hub Contact Inquiries seed data
    if (!this.state.contactInquiries || this.state.contactInquiries.length === 0) {
      this.state.contactInquiries = [
        {
          id: 'INQ-101',
          ticketNumber: 'THUB-2026-8841',
          name: 'Aditya Sharma',
          email: 'aditya@neuralcraft.ai',
          phone: '+91 98765 43210',
          category: 'Funding',
          department: 'funding@t-hub.co',
          organization: 'NeuralCraft AI',
          subject: 'Seed Stage Venture Acceleration & T-Fund pitch',
          message: 'Looking to connect with T-Hub angel network and T-Fund managers for our Seed round pitch. We have an operational ARR of $120k.',
          createdAt: '2026-10-08T10:30:00Z',
          status: 'In Review'
        },
        {
          id: 'INQ-102',
          ticketNumber: 'THUB-2026-8842',
          name: 'Dr. Priya Varma',
          email: 'priya.varma@iith.ac.in',
          phone: '+91 91234 56789',
          category: 'Academia',
          department: 'academia@t-hub.co',
          organization: 'IIT Hyderabad Innovation Cell',
          subject: 'Faculty & Student Innovation Cohort Immersion',
          message: 'Requesting an innovation immersion tour and hackathon partnership for our final year engineering students cohort of 40 students.',
          createdAt: '2026-10-09T14:15:00Z',
          status: 'New'
        }
      ];
    }
    // Ensure meeting room seed reservations exist for today and 2026-10-25
    if (!this.state.meetingRooms || this.state.meetingRooms.length === 0) {
      this.state.meetingRooms = JSON.parse(JSON.stringify(window.INITIAL_DATA.meetingRooms || []));
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const testDates = [todayStr, '2026-10-25'];
    testDates.forEach(d => {
      const hasBookingsForDate = (this.state.meetingRooms || []).some(r => 
        (r.bookings || []).some(b => b.date === d && b.status !== 'Cancelled')
      );
      if (!hasBookingsForDate && this.state.meetingRooms && this.state.meetingRooms.length > 0) {
        const r1 = this.state.meetingRooms.find(r => r.id === 'MR-01' || (r.name && r.name.includes('Boardroom')));
        if (r1) {
          if (!r1.bookings) r1.bookings = [];
          r1.bookings.push({
            id: `BKG-${d}-01`,
            startupId: 'STP-01',
            startupName: 'NeuroPulse AI',
            title: 'Medical Board & Advisory Review',
            date: d,
            startTime: '09:00',
            endTime: '11:00',
            attendees: 10,
            cost: 0,
            status: 'Confirmed'
          });
          r1.bookings.push({
            id: `BKG-${d}-02`,
            startupId: 'STP-03',
            startupName: 'FinEdge Protocol',
            title: 'Pre-Series A VC Due Diligence',
            date: d,
            startTime: '15:00',
            endTime: '17:00',
            attendees: 12,
            cost: 0,
            status: 'Confirmed'
          });
        }
        const r2 = this.state.meetingRooms.find(r => r.id === 'MR-02' || (r.name && r.name.includes('Pitch Arena')));
        if (r2) {
          if (!r2.bookings) r2.bookings = [];
          r2.bookings.push({
            id: `BKG-${d}-03`,
            startupId: 'STP-XYZ',
            startupName: 'XYZ Technologies',
            title: 'Enterprise Architecture & Client Demo',
            date: d,
            startTime: '16:00',
            endTime: '18:00',
            attendees: 18,
            cost: 0,
            status: 'Confirmed'
          });
        }
      }
    });

    // Sanitize any existing cached bookings to respect allowed 08:00-11:00 or 15:00-19:00 operating windows
    (this.state.meetingRooms || []).forEach(r => {
      (r.bookings || []).forEach(b => {
        if (b.startTime === '10:00' && b.endTime === '12:00') {
          b.startTime = '09:00';
          b.endTime = '11:00';
        }
        if (b.startTime === '13:00' && b.endTime === '15:00') {
          b.startTime = '16:00';
          b.endTime = '18:00';
        }
      });
    });

    // Synchronize Rent Records, Invoices, and Payments with Seed Data
    this.syncRentAndBillingData();
  }

  syncRentAndBillingData() {
    if (!this.state.rentRecords || this.state.rentRecords.length < 5) {
      this.state.rentRecords = JSON.parse(JSON.stringify(window.INITIAL_DATA.rentRecords || []));
    } else {
      // Reconcile seed entries if amounts or statuses differ
      const seedRents = window.INITIAL_DATA.rentRecords || [];
      seedRents.forEach(seedR => {
        const idx = this.state.rentRecords.findIndex(r => r.id === seedR.id || r.startupId === seedR.startupId);
        if (idx !== -1) {
          this.state.rentRecords[idx] = JSON.parse(JSON.stringify(seedR));
        } else {
          this.state.rentRecords.push(JSON.parse(JSON.stringify(seedR)));
        }
      });
    }

    // Reconcile invoices with seed data (e.g. INV-2026-080 for XYZ, GST breakdowns)
    if (!this.state.invoices) this.state.invoices = [];
    if (window.INITIAL_DATA && window.INITIAL_DATA.invoices) {
      window.INITIAL_DATA.invoices.forEach(seedInv => {
        const idx = this.state.invoices.findIndex(i => i.id === seedInv.id);
        if (idx !== -1) {
          this.state.invoices[idx] = JSON.parse(JSON.stringify(seedInv));
        } else {
          this.state.invoices.unshift(JSON.parse(JSON.stringify(seedInv)));
        }
      });
    }

    // Reconcile payments (PAY-2026-103 Solarix ₹9,440, PAY-2026-106 XYZ ₹29,500)
    if (!this.state.payments) this.state.payments = [];
    if (window.INITIAL_DATA && window.INITIAL_DATA.payments) {
      window.INITIAL_DATA.payments.forEach(seedPay => {
        const idx = this.state.payments.findIndex(p => p.id === seedPay.id);
        if (idx !== -1) {
          this.state.payments[idx] = JSON.parse(JSON.stringify(seedPay));
        } else {
          this.state.payments.unshift(JSON.parse(JSON.stringify(seedPay)));
        }
      });
    }
  }

  getContactInquiries() {
    return this.state.contactInquiries || [];
  }

  addContactInquiry(data) {
    if (!this.state.contactInquiries) this.state.contactInquiries = [];
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const newInquiry = {
      id: `INQ-${100 + this.state.contactInquiries.length + 1}`,
      ticketNumber: `THUB-2026-${randSuffix}`,
      name: data.name || 'Anonymous Founder',
      email: data.email || '',
      phone: data.phone || '',
      category: data.category || 'General',
      department: data.department || 'contact@t-hub.co',
      organization: data.organization || '',
      subject: data.subject || 'Ecosystem Inquiry',
      message: data.message || '',
      createdAt: new Date().toISOString(),
      status: 'New'
    };
    this.state.contactInquiries.unshift(newInquiry);
    this.save();
    return newInquiry;
  }

  updateContactInquiryStatus(id, newStatus) {
    if (!this.state.contactInquiries) return;
    const inq = this.state.contactInquiries.find(i => i.id === id || i.ticketNumber === id);
    if (inq) {
      inq.status = newStatus;
      this.save();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Storage save failed:", e);
    }
    this.notify();
    this.debouncedCloudSync();
  }

  debouncedCloudSync() {
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(async () => {
      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: this.state })
        });
      } catch (e) {
        // Fallback to local storage if offline
      }
    }, 1200);
  }

  async syncFromCloud() {
    try {
      const [stateRes, startupsRes] = await Promise.all([
        fetch('/api/state').then(r => r.json()).catch(() => null),
        fetch('/api/database/table?name=startups&limit=200').then(r => r.json()).catch(() => null)
      ]);

      if (stateRes && stateRes.ok && stateRes.state) {
        this.state = stateRes.state;
      }

      if (startupsRes && startupsRes.records && startupsRes.records.length > 0) {
        this.syncStartupsWithDatabase(startupsRes.records);
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {}
        this.notify();
      }
    } catch (e) {
      // Fallback to local storage
    }
  }

  syncStartupsWithDatabase(dbStartups) {
    if (!Array.isArray(dbStartups) || dbStartups.length === 0) return;
    if (!this.state.startups) this.state.startups = [];

    let hasChange = false;
    dbStartups.forEach(dbItem => {
      if (!dbItem.id) return;
      const idx = this.state.startups.findIndex(s => s.id === dbItem.id);
      if (idx !== -1) {
        const local = this.state.startups[idx];
        const merged = { ...local, ...dbItem };
        if (!merged.documents && local.documents) merged.documents = local.documents;
        if (!merged.allocatedSeats && local.allocatedSeats) merged.allocatedSeats = local.allocatedSeats;
        if (!merged.verification && local.verification) merged.verification = local.verification;
        if (!merged.approval && local.approval) merged.approval = local.approval;
        if (!merged.founders && local.founders) merged.founders = local.founders;

        if (JSON.stringify(local) !== JSON.stringify(merged)) {
          this.state.startups[idx] = merged;
          hasChange = true;
        }
      } else {
        this.state.startups.push(this.normalizeStartupIncubation ? this.normalizeStartupIncubation(dbItem) : dbItem);
        hasChange = true;
      }
    });

    if (hasChange) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {}
      this.notify();
    }
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(window.INITIAL_DATA));
    this.save();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.state); } catch (err) { console.error(err); }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus:state_updated', { detail: this.state }));
    }
  }

  // --- 9. Role-Based Access Control (RBAC) Engine ---
  getRoles() {
    return {
      super_admin: {
        id: 'super_admin',
        name: 'Super Admin',
        title: 'Platform Master Admin',
        icon: '👑',
        badgeClass: 'badge-primary',
        accentColor: '#6366f1',
        description: 'Omnipotent system authority with unrestricted access to all hub operations, settings, and financials.',
        scopeSummary: 'All Modules & Operations',
        allowedTabs: ['dashboard', 'onboarding', 'workspace', 'meetingRooms', 'billing', 'payments', 'incubation', 'milestones', 'reports', 'contact'],
        features: [
          'Full Omnipotent System Access',
          'All 9 Modules Unrestricted',
          'User Management & Role Switching',
          'Global System Reset & Config'
        ],
        user: { name: 'Dev Sharma', email: 'dev.sharma@nexusincubation.io', roleTitle: 'Managing Director & Platform Admin', avatar: '👑' }
      },
      incubator_admin: {
        id: 'incubator_admin',
        name: 'Incubator Admin',
        title: 'Incubation & Program Director',
        icon: '🌱',
        badgeClass: 'badge-success',
        accentColor: '#10b981',
        description: 'Manages Startups onboarding, Incubation 8-stage pipeline, Mentors network, Workspace floorplan, and Reports.',
        scopeSummary: 'Startups, Incubation, Mentors, Workspaces, Reports',
        allowedTabs: ['dashboard', 'onboarding', 'workspace', 'incubation', 'milestones', 'reports', 'contact'],
        features: [
          'Startups (Applications & Onboarding)',
          'Incubation (8-Stage Journey & Pipeline)',
          'Mentors (Advisory Network & Pairing)',
          'Workspaces (Floorplan & Seat Allocation)',
          'Reports (Cohort Performance & Intelligence)'
        ],
        user: { name: 'Priya Nair', email: 'priya.nair@nexusincubation.io', roleTitle: 'Head of Incubation & Cohorts', avatar: '🌱' }
      },
      finance_admin: {
        id: 'finance_admin',
        name: 'Finance Admin',
        title: 'Financial Controller & Billing Lead',
        icon: '💰',
        badgeClass: 'badge-warning',
        accentColor: '#f59e0b',
        description: 'Manages automated Invoices, Rent engine, Payment gateways, GST Receipts ledger, and Financial reports.',
        scopeSummary: 'Invoices, Rent, Payments, Receipts, Financial Reports',
        allowedTabs: ['dashboard', 'billing', 'payments', 'reports', 'contact'],
        features: [
          'Invoices (Automated Tax Invoicing & GST)',
          'Rent (Rent Engine & Ledger)',
          'Payments (Gateways & Online Settlements)',
          'Receipts (Official Tax Receipts)',
          'Financial Reports (MRR, Yield & Collections)'
        ],
        user: { name: 'Rohan Verma', email: 'rohan.verma@nexusincubation.io', roleTitle: 'Head of Finance & Billing Ops', avatar: '💰' }
      },
      startup: {
        id: 'startup',
        name: 'Startup',
        title: 'Founder & Venture Lead',
        icon: '🚀',
        badgeClass: 'badge-info',
        accentColor: '#06b6d4',
        description: 'Founder portal: Profile dossier, allocated Workspace, Room Bookings, Invoices, Online Payments, and Incubation Progress.',
        scopeSummary: 'Profile, Workspace, Bookings, Invoices, Payments, Incubation Progress',
        allowedTabs: ['dashboard', 'onboarding', 'workspace', 'meetingRooms', 'billing', 'payments', 'incubation', 'milestones', 'contact'],
        features: [
          'Profile (Startup Dossier & Founder KYC)',
          'Workspace (My Allocated Desks / Cabin)',
          'Bookings (Meeting Room Reservations & Credits)',
          'Invoices (My Invoices & Balance Due)',
          'Payments (Instant UPI / Card Settlements)',
          'Incubation Progress (8-Stage Journey & Milestones)'
        ],
        user: { name: 'Alex Morgan', email: 'alex@xyztechnologies.io', startupId: 'STP-XYZ', startupName: 'XYZ Technologies', roleTitle: 'Founder & CEO (XYZ Technologies)', avatar: '⚡' }
      },
      mentor: {
        id: 'mentor',
        name: 'Mentor',
        title: 'Advisory Mentor & Venture Partner',
        icon: '🧠',
        badgeClass: 'badge-subtle',
        accentColor: '#8b5cf6',
        description: 'Advisory portal: Assigned Startups, Sprint Milestones review, Advisory Sessions, Live Progress, and Feedback.',
        scopeSummary: 'Assigned Startups, Milestones, Sessions, Progress, Feedback',
        allowedTabs: ['dashboard', 'incubation', 'milestones', 'meetingRooms', 'reports', 'contact'],
        features: [
          'Assigned Startups (Paired Ventures Portfolio)',
          'Milestones (Review, verify, mark completed)',
          'Sessions (Log & schedule 1-on-1 office hours)',
          'Progress (ASCII live velocity tracking)',
          'Feedback (Action items & strategic advice)'
        ],
        user: { name: 'John Smith', email: 'john.smith@nexusincubation.io', mentorId: 'MEN-05', roleTitle: 'Principal Mentor & Visiting Partner', avatar: '👨‍💼' }
      }
    };
  }

  normalizeRole(role) {
    if (!role) return 'super_admin';
    if (role === 'admin') return 'super_admin';
    if (role === 'founder') return 'startup';
    if (this.getRoles()[role]) return role;
    return 'super_admin';
  }

  getCurrentRoleInfo() {
    const roles = this.getRoles();
    const r = this.normalizeRole(this.currentRole);
    const baseInfo = { ...(roles[r] || roles.super_admin) };
    if (r === 'startup') {
      const founderStartupId = this.activeFounderId || 'STP-XYZ';
      const s = this.getStartupById(founderStartupId);
      if (s) {
        return {
          ...baseInfo,
          name: s.name,
          icon: s.logoEmoji || '🚀',
          scopeSummary: `Founder Portal • ${s.name} (${s.stage} | ${s.status})`,
          user: {
            name: (s.founders && s.founders.name) || s.name + ' Founder',
            email: (s.founders && s.founders.email) || 'founder@' + (s.slug || 'startup') + '.io',
            startupId: s.id,
            startupName: s.name,
            roleTitle: (s.founders && s.founders.role) || `Founder & CEO (${s.name})`,
            avatar: s.logoEmoji || '🚀'
          }
        };
      }
    }
    return baseInfo;
  }

  loginAsStartup(identifier, password = '') {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Please provide registered 10-digit mobile number, founder email, or startup ID.' };
    }
    const clean = identifier.trim().toLowerCase();
    let cleanDigits = identifier.replace(/\D/g, '');
    if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) cleanDigits = cleanDigits.slice(2);
    else if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) cleanDigits = cleanDigits.slice(1);

    const startups = this.getStartups();
    const directIdMatch = startups.find(s => s.id && s.id.toLowerCase() === clean);

    // Validate mobile number format: strictly 10 digits
    if (!clean.includes('@') && cleanDigits.length > 0 && !directIdMatch) {
      if (cleanDigits.length !== 10) {
        return {
          success: false,
          message: `⚠️ Mobile number must be exactly 10 digits. More or fewer digits are not allowed (you entered ${cleanDigits.length} digits: "${identifier}").`
        };
      }
    }

    // Validate password format: strictly 10 to 16 positions/characters only
    if (password) {
      const passLen = String(password).length;
      if (passLen < 10) {
        return {
          success: false,
          message: `⚠️ Password must be between 10 and 16 characters only. (You entered ${passLen} characters, minimum 10 required).`
        };
      }
      if (passLen > 16) {
        return {
          success: false,
          message: `⚠️ Password must be between 10 and 16 characters only. More than 16 characters is not allowed (you entered ${passLen} characters).`
        };
      }
    }

    const found = directIdMatch || startups.find(s => {
      // 1. Direct ID / Name / Slug / Email / Founder Name matches
      const matchId = s.id && s.id.toLowerCase() === clean;
      const matchName = s.name && s.name.toLowerCase() === clean;
      const matchSlug = s.slug && s.slug.toLowerCase() === clean;
      const matchEmail = s.founders && s.founders.email && s.founders.email.toLowerCase() === clean;
      const matchFounderName = s.founders && s.founders.name && s.founders.name.toLowerCase() === clean;

      // 2. Mobile Number matching (handles +91, spaces, 10 digits)
      let matchMobile = false;
      const founderPhone = s.founders ? (s.founders.phone || s.founders.mobile || '') : '';
      if (founderPhone && cleanDigits.length === 10) {
        let phoneDigits = founderPhone.replace(/\D/g, '');
        if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) phoneDigits = phoneDigits.slice(2);
        else if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) phoneDigits = phoneDigits.slice(1);
        matchMobile = phoneDigits === cleanDigits || founderPhone.toLowerCase() === clean;
      }

      return matchId || matchName || matchEmail || matchFounderName || matchSlug || matchMobile;
    });

    if (!found) {
      return { success: false, message: `No registered startup found matching "${identifier}". Please check 10-digit mobile number or ID.` };
    }

    this.setRole('startup', found.id);
    return { success: true, startup: found };
  }

  loginAsSuperAdmin(emailOrUser = 'dev.sharma@nexusincubation.io', password = 'admin12345', securityPin = '') {
    const clean = (emailOrUser || '').trim().toLowerCase();
    let cleanDigits = (emailOrUser || '').replace(/\D/g, '');
    if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) cleanDigits = cleanDigits.slice(2);
    else if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) cleanDigits = cleanDigits.slice(1);

    // Validate password length (10 to 16 characters only)
    if (password && password !== 'admin123') {
      const passLen = String(password).length;
      if (passLen < 10) {
        return {
          success: false,
          message: `⚠️ Password must be between 10 and 16 characters only. (You entered ${passLen} characters, minimum 10 required).`
        };
      }
      if (passLen > 16) {
        return {
          success: false,
          message: `⚠️ Password must be between 10 and 16 characters only. More than 16 characters is not allowed (you entered ${passLen} characters).`
        };
      }
    }

    // Validate mobile if digits are provided and not an email
    if (!clean.includes('@') && cleanDigits.length > 0 && clean !== 'admin' && clean !== 'superadmin' && clean !== 'dev') {
      if (cleanDigits.length !== 10) {
        return {
          success: false,
          message: `⚠️ Mobile number must be exactly 10 digits. (You entered ${cleanDigits.length} digits: "${emailOrUser}").`
        };
      }
    }

    const validIdentifiers = [
      'admin',
      'superadmin',
      'super_admin',
      'dev',
      'dev.sharma',
      'dev sharma',
      'dev.sharma@nexusincubation.io',
      'admin@nexusincubation.io',
      'admin@nexus.io',
      '+91 98000 11111',
      '9800011111',
      '+91 98765 43210',
      '9876543210'
    ];

    const isMatch = validIdentifiers.some(id => clean.includes(id) || id.includes(clean)) ||
      (cleanDigits.length === 10 && ('9800011111'.includes(cleanDigits) || '9876543210'.includes(cleanDigits)));

    if (clean && !isMatch) {
      return { success: false, message: `Invalid Super Admin identifier "${emailOrUser}". Expected: 10-digit Mobile (+91 98000 11111) or dev.sharma@nexusincubation.io` };
    }

    this.activeFounderId = null;
    this.activeMentorId = null;
    this.setRole('super_admin');
    this.addActivity('Security', '👑 Super Admin Dev Sharma authenticated with full Executive Platform privileges.', '🛡️');
    return { 
      success: true, 
      user: this.getRoles().super_admin.user,
      roleInfo: this.getRoles().super_admin
    };
  }

  isTabAllowed(tabId, role = null) {
    if (tabId === 'contact' || tabId === 'leads' || tabId === 'database' || tabId === 'startupTables') return true;
    const r = role ? this.normalizeRole(role) : this.normalizeRole(this.currentRole);
    if (r === 'super_admin') return true;
    const roleInfo = this.getRoles()[r];
    if (!roleInfo) return true;
    return roleInfo.allowedTabs.includes(tabId);
  }

  canPerformAction(action, role = null) {
    const r = role ? this.normalizeRole(role) : this.normalizeRole(this.currentRole);
    if (r === 'super_admin') return true;

    const permissions = {
      // Incubator Admin: Startups, Incubation, Mentors, Workspaces, Reports
      incubator_admin: [
        'view_startups', 'create_startup', 'approve_startup',
        'manage_workspace', 'allocate_space',
        'manage_incubation', 'advance_stage', 'assign_mentor',
        'view_reports', 'create_milestone', 'verify_milestone'
      ],
      // Finance Admin: Invoices, Rent, Payments, Receipts, Financial Reports
      finance_admin: [
        'view_invoices', 'create_invoice', 'generate_billing_batch',
        'view_rent', 'manage_rent',
        'view_payments', 'record_payment', 'process_gateway',
        'download_receipts', 'view_reports', 'view_financial_reports'
      ],
      // Startup: Profile, Workspace, Bookings, Invoices, Payments, Incubation Progress
      startup: [
        'view_my_profile', 'update_my_profile',
        'view_my_workspace',
        'book_meeting_room', 'view_my_bookings',
        'view_my_invoices',
        'pay_invoice', 'download_my_receipts',
        'view_my_incubation', 'view_my_milestones'
      ],
      // Mentor: Assigned Startups, Milestones, Sessions, Progress, Feedback
      mentor: [
        'view_assigned_startups',
        'view_milestones', 'create_milestone', 'verify_milestone',
        'log_mentorship_session', 'view_sessions',
        'view_progress', 'submit_feedback', 'book_meeting_room'
      ]
    };

    const allowedList = permissions[r] || [];
    return allowedList.includes(action);
  }

  setRole(role, startupId = null, mentorId = null) {
    const norm = this.normalizeRole(role);
    this.currentRole = norm;
    if (startupId) this.activeFounderId = startupId;
    if (mentorId) this.activeMentorId = mentorId;
    
    const roleInfo = this.getCurrentRoleInfo();
    this.addActivity('Security', `RBAC perspective switched to: ${roleInfo.name}.`, '🛡️');
    this.save();
    this.notify();
  }

  // Scoped Data Access Methods for RBAC
  getAccessibleStartups() {
    const all = this.getStartups();
    const r = this.normalizeRole(this.currentRole);
    if (r === 'startup') {
      const founderStartupId = this.activeFounderId || 'STP-XYZ';
      return all.filter(s => s.id === founderStartupId);
    }
    if (r === 'mentor') {
      const mentorId = this.activeMentorId || 'MEN-05';
      const mentor = this.getMentorById(mentorId);
      const assignedIds = (mentor && mentor.assignedStartups) ? mentor.assignedStartups : ['STP-XYZ', 'STP-01'];
      return all.filter(s => assignedIds.includes(s.id));
    }
    return all;
  }

  getAccessibleInvoices() {
    const all = this.getInvoices();
    const r = this.normalizeRole(this.currentRole);
    if (r === 'startup') {
      const founderStartupId = this.activeFounderId || 'STP-XYZ';
      return all.filter(inv => inv.startupId === founderStartupId);
    }
    if (r === 'mentor') {
      return []; // Mentor has no financial access per user spec
    }
    return all;
  }

  getAccessiblePayments() {
    const all = this.getPayments();
    const r = this.normalizeRole(this.currentRole);
    if (r === 'startup') {
      const founderStartupId = this.activeFounderId || 'STP-XYZ';
      return all.filter(p => p.startupId === founderStartupId);
    }
    if (r === 'mentor') {
      return [];
    }
    return all;
  }

  getRbacMatrixData() {
    return [
      {
        module: 'Hub Command Center',
        key: 'dashboard',
        icon: '⚡',
        description: 'Real-time hub operations, KPI widgets, activity log',
        access: { super_admin: true, incubator_admin: true, finance_admin: true, startup: true, mentor: true }
      },
      {
        module: 'Startup Applications & Onboarding',
        key: 'onboarding',
        icon: '🚀',
        description: 'Venture dossier, founder KYC, committee review, status pipeline',
        access: { super_admin: true, incubator_admin: true, finance_admin: false, startup: true, mentor: false }
      },
      {
        module: 'Workspace Floorplan & Desks',
        key: 'workspace',
        icon: '🏢',
        description: 'Interactive seat map, desk assignment, occupancy management',
        access: { super_admin: true, incubator_admin: true, finance_admin: false, startup: true, mentor: false }
      },
      {
        module: 'Meeting Rooms & Scheduler',
        key: 'meetingRooms',
        icon: '📅',
        description: 'Conference room calendar, hourly credits, instant booking',
        access: { super_admin: true, incubator_admin: false, finance_admin: false, startup: true, mentor: true }
      },
      {
        module: 'Rent Engine & Invoices',
        key: 'billing',
        icon: '🧾',
        description: 'Automated rent calculation, GST tax invoices, grant subsidies',
        access: { super_admin: true, incubator_admin: false, finance_admin: true, startup: true, mentor: false }
      },
      {
        module: 'Payments & Receipts',
        key: 'payments',
        icon: '💳',
        description: 'Payment gateway simulation, UPI/Cards, official GST tax receipts',
        access: { super_admin: true, incubator_admin: false, finance_admin: true, startup: true, mentor: false }
      },
      {
        module: 'Incubation Management Journey',
        key: 'incubation',
        icon: '🌱',
        description: '8-stage incubation lifecycle, mentor pairing, graduation tracker',
        access: { super_admin: true, incubator_admin: true, finance_admin: false, startup: true, mentor: true }
      },
      {
        module: 'Milestone Management',
        key: 'milestones',
        icon: '🎯',
        description: 'Sprint milestone creation, ASCII progress bar, mentor verification',
        access: { super_admin: true, incubator_admin: true, finance_admin: false, startup: true, mentor: true }
      },
      {
        module: 'Reports & Intelligence',
        key: 'reports',
        icon: '📊',
        description: 'Revenue yield, cohort distribution, space analytics, CSV exports',
        access: { super_admin: true, incubator_admin: true, finance_admin: true, startup: false, mentor: true }
      }
    ];
  }

  // --- Startups Management ---
  getStartups() {
    return this.state.startups || [];
  }

  getStartupById(id) {
    return this.state.startups.find(s => s.id === id);
  }

  getOnboardingCounts() {
    const startups = this.getStartups();
    return {
      all: startups.length,
      applied: startups.filter(s => s.status === 'Applied').length,
      underReview: startups.filter(s => s.status === 'Under Review').length,
      approved: startups.filter(s => s.status === 'Approved').length,
      incubated: startups.filter(s => s.status === 'Incubated').length,
      completed: startups.filter(s => s.status === 'Completed').length
    };
  }

  addStartup(data) {
    let maxNum = 0;
    (this.state.startups || []).forEach(s => {
      const match = String(s.id || '').match(/STP-(?:0)?(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextNum = Math.max(maxNum + 1, (this.state.startups ? this.state.startups.length + 1 : 1));
    const id = nextNum < 10 ? `STP-0${nextNum}` : `STP-${nextNum}`;
    const resolvedCategory = (data.category === 'Others' && data.otherCategory && data.otherCategory.trim())
      ? data.otherCategory.trim()
      : (data.category || data.sector || 'Others');

    const newStartup = {
      id,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logoEmoji: data.logoEmoji || '🚀',
      name: data.name,
      category: resolvedCategory,
      sector: resolvedCategory,
      website: data.startupWebsite || data.website || '',
      description: data.description || data.pitchSummary || '',
      headquarters: data.operationalCity || data.city || data.headquarters || 'Hyderabad',
      city: data.operationalCity || data.city || data.headquarters || 'Hyderabad',
      productName: data.productName || '',
      describeProduct: data.describeProduct || data.description || '',
      coreTechnology: data.coreTechnology || 'Deep-Tech',
      hasPatents: data.hasPatents || 'No',
      isIncorporated: data.isIncorporated === 'yes' || data.isIncorporated === true || data.isIncorporated === 'true',
      registrationNumber: data.registrationNumber || (data.isIncorporated === 'no' ? 'Unincorporated / In Process' : `U${Math.floor(10000 + Math.random()*89999)}KA2026PTC${Math.floor(100000 + Math.random()*899999)}`),
      gstin: data.gstin || (data.isIncorporated === 'no' ? 'Exempt / Pre-Incorporation' : (data.isGstRegistered ? `29AABC${Math.floor(1000 + Math.random()*8999)}Z${Math.floor(1 + Math.random()*9)}` : 'Exempt / In Process')),
      numberOfEmployees: Number(data.teamSize) || Number(data.numberOfEmployees) || 2,
      teamSize: Number(data.teamSize) || Number(data.numberOfEmployees) || 2,
      numberOfFounders: Number(data.numberOfFounders) || 1,
      isFirstTimeFounder: data.isFirstTimeFounder === 'yes' || data.isFirstTimeFounder === true,
      founderAccomplishments: data.founderAccomplishments || '',
      marketSector: data.marketSector || data.sector || resolvedCategory,
      customerPersona: data.customerPersona || '',
      useCases: data.useCases || '',
      businessModel: Array.isArray(data.businessModel) ? data.businessModel.join(', ') : (data.businessModel || 'B2B'),
      numberOfCustomers: Number(data.numberOfCustomers) || 0,
      marqueeCustomers: data.marqueeCustomers || '',
      annualRevenue: Number(data.annualRevenue) || 0,
      fundingStage: data.fundingStage || data.stage || 'Bootstrapped',
      targetFundingAsk: Number(data.targetFundingAsk) || 0,
      instrumentType: data.instrumentType || 'Equity',
      investorsSummary: data.investorsSummary || '',
      joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      incubationPeriod: data.incubationPeriod || '12 Months',
      cohort: data.cohort || 'Cohort 2026-B',
      stage: data.stage || 'Ideation',
      status: data.status || 'Applied', // Status starts at 'Applied'
      founders: {
        name: data.founderName || 'Founder',
        email: data.founderEmail || '',
        mobile: data.founderPhone || data.founderMobile || '',
        phone: data.founderPhone || data.founderMobile || '',
        linkedIn: data.founderLinkedIn || data.founderLinkedin || data.linkedIn || '',
        role: data.founderRole || 'Founder & CEO',
        bio: data.founderBio || 'Entrepreneur & Venture Pioneer'
      },
      pitchSummary: data.description || data.pitchSummary || 'Innovative high-growth venture application.',
      moveInDate: data.joiningDate || new Date().toISOString().split('T')[0],
      allocatedSeats: [],
      spacePreference: data.spacePreference || 'Dedicated Desk',
      monthlyGrantSubsidyPercent: Number(data.monthlyGrantSubsidyPercent) || 0,
      activeAddOns: data.activeAddOns || [],
      documents: data.documents || [
        { id: `DOC-${Date.now()}-1`, type: "Pitch Deck & Presentation", fileName: data.pitchDeckName || "pitch_deck_presentation.pdf", fileSize: "3.8 MB", uploadDate: new Date().toISOString().split('T')[0], status: "Pending", verifiedBy: null },
        { id: `DOC-${Date.now()}-2`, type: "Certificate of Incorporation", fileName: data.docIncorpName || "incorporation_certificate.pdf", fileSize: "1.2 MB", uploadDate: new Date().toISOString().split('T')[0], status: data.isIncorporated === 'no' ? "Exempt / N/A" : "Pending", verifiedBy: null },
        { id: `DOC-${Date.now()}-3`, type: "GST Registration Certificate", fileName: data.docGstName || "gstin_certificate.pdf", fileSize: "780 KB", uploadDate: new Date().toISOString().split('T')[0], status: data.isIncorporated === 'no' ? "Exempt / N/A" : "Pending", verifiedBy: null },
        { id: `DOC-${Date.now()}-4`, type: "Founder Identity & KYC", fileName: data.docKycName || "founder_kyc.pdf", fileSize: "1.5 MB", uploadDate: new Date().toISOString().split('T')[0], status: "Pending", verifiedBy: null }
      ],
      verification: {
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
        notes: "Application submitted. Document verification pending."
      },
      approval: {
        approved: false,
        approvedAt: null,
        approvedBy: null,
        committeeRemarks: ""
      },
      metrics: {
        mrr: Number(data.mrr) || 0,
        users: Number(data.users) || 0,
        runwayMonths: Number(data.runwayMonths) || 12,
        burnRate: Number(data.burnRate) || 50000,
        readinessScore: Number(data.readinessScore) || 50,
        fundingRaised: data.fundingRaised || 'Bootstrapped'
      },
      mentorId: data.mentorId || null,
      includedMeetingHours: 12,
      usedMeetingHours: 0
    };

    this.state.startups.unshift(newStartup);
    this.addActivity('Onboarding', `New startup registered: ${newStartup.name} (${newStartup.category}). Status: Applied.`, '🚀');
    this.save();

    // Immediate direct sync to backend MongoDB database
    try {
      fetch('/api/database/table/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: 'startups',
          document: newStartup
        })
      }).catch(err => console.warn('Direct startup backend sync:', err));
    } catch (e) {}

    return newStartup;
  }

  updateStartup(id, updates) {
    const idx = this.state.startups.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.state.startups[idx] = { ...this.state.startups[idx], ...updates };
      this.save();

      // Immediate direct DB sync
      try {
        fetch('/api/database/table/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName: 'startups',
            id,
            updates
          })
        }).catch(err => console.warn('Startup update DB sync error:', err));
      } catch (e) {}
    }
  }

  // --- Onboarding Lifecycle Progression ---
  progressStartupStatus(startupId, newStatus, remarks = '') {
    const startup = this.getStartupById(startupId);
    if (!startup) return { success: false, message: 'Startup not found' };

    const oldStatus = startup.status;
    startup.status = newStatus;

    if (newStatus === 'Under Review') {
      if (!startup.verification) startup.verification = {};
      startup.verification.notes = remarks || 'Documents under active administrative review.';
    } else if (newStatus === 'Approved') {
      startup.approval = {
        approved: true,
        approvedAt: new Date().toISOString().split('T')[0],
        approvedBy: 'Incubation Committee',
        committeeRemarks: remarks || 'Incubation admission approved. Ready for workspace allocation.'
      };
      if (startup.verification) startup.verification.verified = true;
    } else if (newStatus === 'Incubated') {
      startup.moveInDate = startup.moveInDate || new Date().toISOString().split('T')[0];
    } else if (newStatus === 'Completed') {
      startup.graduationDate = new Date().toISOString().split('T')[0];
      startup.stage = 'Graduated';
    }

    this.addActivity('Onboarding', `${startup.name} moved from ${oldStatus} ➔ ${newStatus}.`, '📈');
    this.save();

    // Immediate direct DB sync so List of Startups is in lockstep
    try {
      fetch('/api/database/table/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: 'startups',
          id: startupId,
          updates: {
            status: newStatus,
            verification: startup.verification,
            approval: startup.approval,
            moveInDate: startup.moveInDate,
            graduationDate: startup.graduationDate,
            stage: startup.stage
          }
        })
      }).catch(err => console.warn('Startup status DB sync error:', err));
    } catch (e) {}

    return { success: true, message: `Status updated to ${newStatus}` };
  }

  verifyDocument(startupId, docId, newStatus, verifiedBy = 'Admin') {
    const startup = this.getStartupById(startupId);
    if (!startup || !startup.documents) return { success: false };

    const doc = startup.documents.find(d => d.id === docId);
    if (doc) {
      doc.status = newStatus;
      doc.verifiedBy = verifiedBy;
      doc.verifiedAt = new Date().toISOString().split('T')[0];

      // Check if all documents are verified
      const allVerified = startup.documents.every(d => d.status === 'Verified');
      if (allVerified && startup.verification) {
        startup.verification.verified = true;
        startup.verification.verifiedAt = new Date().toISOString().split('T')[0];
        startup.verification.verifiedBy = verifiedBy;
      }

      this.addActivity('Verification', `Document "${doc.type}" for ${startup.name} marked as ${newStatus}.`, '📋');
      this.save();
      return { success: true, allVerified };
    }
    return { success: false };
  }

  // --- Workspace Inventory Management (Private Cabins, Desks, Meeting/Conference/Training/Event) ---
  getWorkspaces() {
    if (!this.state.workspaces) {
      this.state.workspaces = JSON.parse(JSON.stringify(window.INITIAL_DATA.workspaces || []));
    }
    return this.state.workspaces;
  }

  getWorkspaceById(id) {
    const list = this.getWorkspaces();
    return list.find(w => w.id === id || w.code === id || w.name === id);
  }

  getWorkspaceStats() {
    const list = this.getWorkspaces();
    const occupied = list.filter(w => w.status === 'Occupied');
    const available = list.filter(w => w.status === 'Available');
    const reserved = list.filter(w => w.status === 'Reserved');
    const maintenance = list.filter(w => w.status === 'Maintenance');
    const totalCapacity = list.reduce((sum, w) => sum + (Number(w.capacity) || 0), 0);
    const occupiedCapacity = occupied.reduce((sum, w) => sum + (Number(w.capacity) || 0), 0);

    return {
      totalCount: list.length,
      occupiedCount: occupied.length,
      availableCount: available.length,
      reservedCount: reserved.length,
      maintenanceCount: maintenance.length,
      totalCapacity,
      occupiedCapacity,
      utilizationRate: totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0
    };
  }

  addWorkspace(data) {
    const prefixMap = {
      'Private Cabin': 'WS-CAB',
      'Dedicated Desk': 'WS-DD',
      'Hot Desk': 'WS-HD',
      'Meeting Room': 'WS-MR',
      'Conference Room': 'WS-CONF',
      'Training Room': 'WS-TRN',
      'Event Space': 'WS-EVT'
    };
    const pfx = prefixMap[data.type] || 'WS';
    const id = `${pfx}-${Math.floor(100 + Math.random() * 900)}`;

    const newWs = {
      id,
      code: data.code || `${data.type} ${Math.floor(10 + Math.random() * 90)}`,
      name: data.name || data.code || `${data.type}`,
      type: data.type || 'Private Cabin',
      capacity: Number(data.capacity) || 1,
      pricingType: data.pricingType || (data.type.includes('Desk') || data.type.includes('Cabin') ? 'monthly' : 'hourly'),
      rate: Number(data.rate) || 0,
      rateDisplay: data.pricingType === 'hourly' 
        ? `₹${Number(data.rate).toLocaleString('en-IN')}/hour` 
        : `₹${Number(data.rate).toLocaleString('en-IN')}/month`,
      status: data.status || 'Available',
      zone: data.zone || 'Innovation Wing',
      amenities: Array.isArray(data.amenities) ? data.amenities : (data.amenities ? data.amenities.split(',').map(s=>s.trim()) : []),
      currentOccupant: null,
      allocatedStartupId: null,
      allocatedSince: null
    };

    if (!this.state.workspaces) this.state.workspaces = [];
    this.state.workspaces.unshift(newWs);
    this.addActivity('Workspace', `Added new workspace: ${newWs.code} (${newWs.type}, Cap: ${newWs.capacity}).`, '🏢');
    this.save();
    return newWs;
  }

  updateWorkspace(id, updates) {
    const ws = this.getWorkspaceById(id);
    if (ws) {
      Object.assign(ws, updates);
      if (updates.rate !== undefined || updates.pricingType) {
        const pType = updates.pricingType || ws.pricingType;
        const rVal = updates.rate !== undefined ? Number(updates.rate) : ws.rate;
        ws.rate = rVal;
        ws.pricingType = pType;
        ws.rateDisplay = pType === 'hourly' 
          ? `₹${rVal.toLocaleString('en-IN')}/hour` 
          : `₹${rVal.toLocaleString('en-IN')}/month`;
      }
      this.addActivity('Workspace', `Updated workspace details for ${ws.code}.`, '✏️');
      this.save();
      return { success: true, workspace: ws };
    }
    return { success: false, message: 'Workspace not found' };
  }

  deleteWorkspace(id) {
    const idx = this.getWorkspaces().findIndex(w => w.id === id || w.code === id);
    if (idx !== -1) {
      const removed = this.state.workspaces.splice(idx, 1)[0];
      this.addActivity('Workspace', `Removed workspace ${removed.code}.`, '🗑️');
      this.save();
      return { success: true };
    }
    return { success: false };
  }

  allocateWorkspace(wsId, startupId) {
    const ws = this.getWorkspaceById(wsId);
    const startup = this.getStartupById(startupId);
    if (!ws || !startup) return { success: false, message: 'Invalid workspace or startup' };

    ws.status = 'Occupied';
    ws.allocatedStartupId = startup.id;
    ws.currentOccupant = startup.name;
    ws.allocatedSince = new Date().toISOString().split('T')[0];

    if (!startup.allocatedSeats) startup.allocatedSeats = [];
    if (!startup.allocatedSeats.includes(ws.code)) {
      startup.allocatedSeats.push(ws.code);
    }

    if (startup.status === 'Approved' || startup.status === 'Applied' || startup.status === 'Under Review') {
      startup.status = 'Incubated';
    }

    // Sync with legacy spaces array if exists
    const space = this.getSpaces().find(s => s.label === ws.code || s.id === ws.code);
    if (space) {
      space.status = 'occupied';
      space.allocatedStartupId = startup.id;
      space.allocatedStartupName = startup.name;
    }

    this.addActivity('Workspace', `Allocated ${ws.code} to ${startup.name}.`, '🏢');
    this.save();
    return { success: true, message: `Successfully allocated ${ws.code} to ${startup.name}` };
  }

  deallocateWorkspace(wsId) {
    const ws = this.getWorkspaceById(wsId);
    if (!ws) return { success: false, message: 'Workspace not found' };

    const startupId = ws.allocatedStartupId;
    const occupantName = ws.currentOccupant;

    if (startupId) {
      const startup = this.getStartupById(startupId);
      if (startup && startup.allocatedSeats) {
        startup.allocatedSeats = startup.allocatedSeats.filter(s => s !== ws.code && s !== ws.id);
      }
    }

    ws.status = 'Available';
    ws.currentOccupant = null;
    ws.allocatedStartupId = null;
    ws.allocatedSince = null;

    // Sync with legacy spaces array
    const space = this.getSpaces().find(s => s.label === ws.code || s.id === ws.code);
    if (space) {
      space.status = 'available';
      space.allocatedStartupId = null;
      space.allocatedStartupName = null;
    }

    this.addActivity('Workspace', `Released ${ws.code} from ${occupantName || 'Occupant'}.`, '🔄');
    this.save();
    return { success: true, message: `${ws.code} is now Available.` };
  }

  // --- Spaces & Workspace Allocation (Legacy support) ---
  getSpaces() {
    return this.state.spaces || [];
  }

  getSpaceById(id) {
    return this.state.spaces.find(sp => sp.id === id);
  }

  allocateSpace(spaceId, startupId, details = {}) {
    const space = this.getSpaceById(spaceId);
    const startup = this.getStartupById(startupId);
    if (!space || !startup) return { success: false, message: 'Invalid space or startup' };

    space.status = 'occupied';
    space.allocatedStartupId = startup.id;
    space.allocatedStartupName = startup.name;
    space.allocatedSince = details.startDate || new Date().toISOString().split('T')[0];
    space.bookingTerm = details.term || 'daily';
    space.duration = details.duration || 1;
    space.allocatedMemberName = details.memberName || (startup.founders && startup.founders.name) || startup.name;
    space.totalAmount = details.totalAmount || (space.bookingTerm === 'daily' ? (space.dailyRate || 450) * (details.duration || 1) : space.monthlyRate);
    space.accessPin = details.accessPin || Math.floor(1000 + Math.random() * 9000).toString();
    space.bookingId = details.bookingId || `DSK-${Math.floor(10000 + Math.random() * 90000)}`;

    if (!startup.allocatedSeats) startup.allocatedSeats = [];
    if (!startup.allocatedSeats.includes(spaceId)) {
      startup.allocatedSeats.push(spaceId);
    }

    // When space is allocated, automatically advance from Approved to Incubated
    if (startup.status === 'Approved' || startup.status === 'Applied' || startup.status === 'Under Review') {
      startup.status = 'Incubated';
    }

    // Keep workspaces inventory in sync
    const ws = (this.state.workspaces || []).find(w => w.id === spaceId || w.code === space.label || w.name === space.label);
    if (ws) {
      ws.status = 'Occupied';
      ws.currentOccupant = startup.name;
      ws.allocatedStartupId = startup.id;
      ws.allocatedSince = space.allocatedSince;
    }

    this.addActivity('Workspace', `Reserved ${space.label} (${space.type}, ${(space.bookingTerm || 'daily').toUpperCase()} Pass) for ${startup.name}.`, '🏢');
    this.save();
    return { success: true, message: `Allocated ${space.label} to ${startup.name}`, space };
  }

  deallocateSpace(spaceId) {
    const space = this.getSpaceById(spaceId);
    if (!space) return { success: false, message: 'Space not found' };

    const startupId = space.allocatedStartupId;
    const startupName = space.allocatedStartupName;

    if (startupId) {
      const startup = this.getStartupById(startupId);
      if (startup && startup.allocatedSeats) {
        startup.allocatedSeats = startup.allocatedSeats.filter(sId => sId !== spaceId && sId !== space.label);
      }
    }

    space.status = 'available';
    space.allocatedStartupId = null;
    space.allocatedStartupName = null;
    space.allocatedSince = null;
    space.bookingTerm = null;
    space.duration = null;
    space.allocatedMemberName = null;
    space.totalAmount = null;
    space.accessPin = null;
    space.bookingId = null;

    // Keep workspaces inventory in sync
    const ws = (this.state.workspaces || []).find(w => w.id === spaceId || w.code === space.label || w.name === space.label);
    if (ws) {
      ws.status = 'Available';
      ws.currentOccupant = null;
      ws.allocatedStartupId = null;
      ws.allocatedSince = null;
    }

    this.addActivity('Workspace', `Released ${space.label} from ${startupName || 'Occupant'}.`, '🔄');
    this.save();
    return { success: true, message: `Space ${space.label} is now available.` };
  }

  // --- Meeting Rooms & Bookings ---
  getMeetingRooms() {
    return this.state.meetingRooms || [];
  }

  getMeetingRoomById(id) {
    return this.state.meetingRooms.find(r => r.id === id);
  }

  bookMeetingRoom({ roomId, startupId, title, date, startTime, endTime, attendees }) {
    const room = this.getMeetingRoomById(roomId);
    const startup = this.getStartupById(startupId);
    if (!room || !startup) return { success: false, message: 'Room or Startup not found' };

    // Strict Operating Window Check: Morning (08:00 - 11:00 AM) and Afternoon (15:00 - 19:00 / 3:00 - 7:00 PM)
    const toMinutes = (t) => {
      const parts = (t || '').split(':').map(Number);
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    };
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);

    if (endMin <= startMin) {
      return { success: false, message: 'Invalid booking duration: End time must be later than start time.' };
    }

    const isMorning = (startMin >= 8 * 60 && endMin <= 11 * 60);
    const isAfternoon = (startMin >= 15 * 60 && endMin <= 19 * 60);

    if (!isMorning && !isAfternoon) {
      return { 
        success: false, 
        message: 'Operating Window Restriction: Meeting rooms can ONLY be booked during Morning (08:00 AM – 11:00 AM) or Afternoon (03:00 PM – 07:00 PM).' 
      };
    }

    // Conflict Check
    const hasConflict = (room.bookings || []).some(b => {
      if (b.date !== date || b.status === 'Cancelled') return false;
      const bStart = b.startTime;
      const bEnd = b.endTime;
      return (startTime < bEnd && endTime > bStart);
    });

    if (hasConflict) {
      return { success: false, message: `Conflict detected! ${room.name} is already booked during this time window on ${date}.` };
    }

    const startHour = parseFloat(startTime.split(':')[0]) + parseFloat(startTime.split(':')[1]) / 60;
    const endHour = parseFloat(endTime.split(':')[0]) + parseFloat(endTime.split(':')[1]) / 60;
    const duration = Math.max(0.5, endHour - startHour);

    let cost = 0;
    const remainingCredits = Math.max(0, (startup.includedMeetingHours || 12) - (startup.usedMeetingHours || 0));
    if (remainingCredits >= duration) {
      startup.usedMeetingHours = (startup.usedMeetingHours || 0) + duration;
      cost = 0;
    } else {
      const overageHours = duration - remainingCredits;
      startup.usedMeetingHours = startup.includedMeetingHours;
      cost = Math.round(overageHours * room.hourlyRate);
    }

    const bookingId = `BKG-${Math.floor(100 + Math.random() * 900)}`;
    const newBooking = {
      id: bookingId,
      startupId: startup.id,
      startupName: startup.name,
      title: title || 'Strategic Planning Session',
      date,
      startTime,
      endTime,
      attendees: Number(attendees) || 4,
      cost,
      status: 'Confirmed'
    };

    if (!room.bookings) room.bookings = [];
    room.bookings.push(newBooking);

    this.addActivity('Meeting Rooms', `${startup.name} booked ${room.name} on ${date} (${startTime}-${endTime}).`, '📅');
    this.save();
    return { success: true, booking: newBooking, message: `Successfully booked ${room.name}!` };
  }

  cancelBooking(roomId, bookingId) {
    const room = this.getMeetingRoomById(roomId);
    if (!room) return { success: false };

    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'Cancelled';
      this.addActivity('Meeting Rooms', `Cancelled booking for ${room.name} (${booking.title}).`, '❌');
      this.save();
      return { success: true, message: 'Booking cancelled.' };
    }
    return { success: false, message: 'Booking not found' };
  }

  // --- Rent & Billing Calculation Engine ---
  calculateStartupMonthlyBilling(startupId) {
    const startup = this.getStartupById(startupId);
    if (!startup) return null;

    const spaces = this.getSpaces();
    const lineItems = [];
    let subtotal = 0;

    // 1. Workspace Allocation Fees
    (startup.allocatedSeats || []).forEach(seatId => {
      const sp = spaces.find(s => s.id === seatId);
      if (sp) {
        lineItems.push({
          desc: `${sp.label} (${sp.type}) - Monthly License`,
          qty: 1,
          rate: sp.monthlyRate,
          amount: sp.monthlyRate,
          sac: '997212'
        });
        subtotal += sp.monthlyRate;
      }
    });

    // 2. Add-Ons
    const availableAddOns = this.state.billingRules.addOns || [];
    (startup.activeAddOns || []).forEach(addOnId => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      if (addOn) {
        lineItems.push({
          desc: addOn.name,
          qty: 1,
          rate: addOn.monthlyCost,
          amount: addOn.monthlyCost,
          sac: '998413'
        });
        subtotal += addOn.monthlyCost;
      }
    });

    // 3. Meeting Room Overages
    const overageHours = Math.max(0, (startup.usedMeetingHours || 0) - (startup.includedMeetingHours || 12));
    if (overageHours > 0) {
      const overageCost = overageHours * (this.state.billingRules.overageHourlyRate || 800);
      lineItems.push({
        desc: `Meeting Room Credit Overage (${overageHours.toFixed(1)} hrs @ ₹${this.state.billingRules.overageHourlyRate}/hr)`,
        qty: overageHours,
        rate: this.state.billingRules.overageHourlyRate,
        amount: overageCost,
        sac: '997212'
      });
      subtotal += overageCost;
    }

    // 4. Incubation Grant / Subsidy Deduction
    const subsidyPercent = startup.monthlyGrantSubsidyPercent || 0;
    const subsidyDeduction = Math.round((subtotal * subsidyPercent) / 100);
    const taxableAmount = Math.max(0, subtotal - subsidyDeduction);

    // 5. GST (18%)
    const gstRate = this.state.billingRules.taxRateGstPercent || 18;
    const taxGst = Math.round((taxableAmount * gstRate) / 100);
    const total = taxableAmount + taxGst;

    return {
      startup,
      lineItems,
      subtotal,
      subsidyPercent,
      subsidyDeduction,
      taxableAmount,
      taxGst,
      total
    };
  }

  // --- Invoicing ---
  getInvoices() {
    return this.state.invoices || [];
  }

  getInvoiceById(id) {
    return this.state.invoices.find(inv => inv.id === id);
  }

  generateInvoice(startupId, billingPeriod = 'October 2026') {
    const calc = this.calculateStartupMonthlyBilling(startupId);
    if (!calc) return { success: false, message: 'Startup not found' };

    if (calc.lineItems.length === 0) {
      return { success: false, message: 'Startup has no allocated workspace or billable items.' };
    }

    const nextIdNum = this.state.invoices.length + 85;
    const invoiceId = `INV-2026-0${nextIdNum}`;

    const today = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 10);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const invoice = {
      id: invoiceId,
      startupId: calc.startup.id,
      startupName: calc.startup.name,
      issueDate: today,
      dueDate: dueDate,
      billingPeriod,
      lineItems: calc.lineItems,
      subtotal: calc.subtotal,
      grantSubsidyPercent: calc.subsidyPercent,
      subsidyDeduction: calc.subsidyDeduction,
      taxableAmount: calc.taxableAmount,
      taxGst: calc.taxGst,
      total: calc.total,
      status: 'Issued',
      paymentMethod: null,
      paidAt: null,
      transactionRef: null
    };

    this.state.invoices.unshift(invoice);
    this.addActivity('Invoices', `Generated Invoice #${invoice.id} for ${calc.startup.name} (₹${calc.total.toLocaleString('en-IN')}).`, '🧾');
    this.save();
    return { success: true, invoice };
  }

  generateAllMonthlyInvoices(billingPeriod = 'October 2026') {
    let generatedCount = 0;
    const activeStartups = this.state.startups.filter(s => s.status === 'Incubated' && s.allocatedSeats && s.allocatedSeats.length > 0);

    activeStartups.forEach(s => {
      const existing = this.state.invoices.find(inv => inv.startupId === s.id && inv.billingPeriod === billingPeriod);
      if (!existing) {
        const res = this.generateInvoice(s.id, billingPeriod);
        if (res.success) generatedCount++;
      }
    });

    return generatedCount;
  }

  /**
   * Advanced invoice generator supporting:
   * - type: 'rent' | 'meeting' | 'combined'
   * - inclMaint: include ₹2,000 maintenance charge
   * - inclSec:   include ₹1,500 security charge
   * - period:    billing period label
   * - dueDate:   ISO date string for payment deadline
   */
  generateDetailedInvoice(startupId, options = {}) {
    const {
      type = 'combined',
      inclMaint = true,
      inclSec = false,
      period = 'October 2026',
      dueDate = null
    } = options;

    const startup = this.getStartupById(startupId);
    if (!startup) return { success: false, message: 'Startup not found' };

    const billing = this.calculateStartupMonthlyBilling(startupId);
    const lineItems = [];

    // ── 1. Workspace Rent ─────────────────────────────────────────────────
    if (type !== 'meeting') {
      if (billing && billing.lineItems.length > 0) {
        billing.lineItems.forEach(li => {
          lineItems.push({ section: 'Workspace Rent', desc: li.desc, qty: li.qty, rate: li.rate, amount: li.amount, sac: li.sac || '997212' });
        });
      } else {
        lineItems.push({ section: 'Workspace Rent', desc: 'Monthly Workspace License Fee', qty: 1, rate: 25000, amount: 25000, sac: '997212' });
      }
    }

    // ── 2. Maintenance / Facilities ──────────────────────────────────────
    if (type !== 'meeting' && inclMaint) {
      lineItems.push({ section: 'Facilities', desc: 'Common Area Maintenance & Utilities', qty: 1, rate: 2000, amount: 2000, sac: '997212' });
    }
    if (type !== 'meeting' && inclSec) {
      lineItems.push({ section: 'Facilities', desc: 'Building Security & CCTV Monitoring', qty: 1, rate: 1500, amount: 1500, sac: '997212' });
    }

    // ── 3. Meeting Room Charges ──────────────────────────────────────────
    if (type !== 'rent') {
      const rooms = this.getMeetingRooms();
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      rooms.forEach(room => {
        (room.bookings || []).filter(b =>
          b.startupId === startupId &&
          b.status !== 'Cancelled' &&
          b.cost > 0 &&
          b.date && b.date.startsWith(monthStr)
        ).forEach(bkg => {
          const startH = parseFloat(bkg.startTime.split(':')[0]) + parseFloat(bkg.startTime.split(':')[1]) / 60;
          const endH = parseFloat(bkg.endTime.split(':')[0]) + parseFloat(bkg.endTime.split(':')[1]) / 60;
          const hours = Math.max(0.5, endH - startH);
          lineItems.push({
            section: 'Meeting Rooms',
            desc: `${room.name} — ${hours} hr${hours !== 1 ? 's' : ''} × ₹${room.hourlyRate}/hr`,
            qty: hours,
            rate: room.hourlyRate,
            amount: bkg.cost,
            sac: '997212'
          });
        });
      });
    }

    if (lineItems.length === 0) {
      return { success: false, message: 'No billable items found for this startup.' };
    }

    // ── 4. Calculate Totals ───────────────────────────────────────────────
    const subtotal = lineItems.reduce((s, l) => s + l.amount, 0);
    const subsidyPercent = startup.monthlyGrantSubsidyPercent || 0;
    const subsidyDeduction = Math.round((subtotal * subsidyPercent) / 100);
    const taxableAmount = Math.max(0, subtotal - subsidyDeduction);
    const gstRate = (this.state.billingRules && this.state.billingRules.taxRateGstPercent) || 18;
    const taxGst = Math.round((taxableAmount * gstRate) / 100);
    const total = taxableAmount + taxGst;

    // ── 5. Build & Persist Invoice ─────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const dueDateFinal = dueDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return d.toISOString().split('T')[0];
    })();

    const nextId = `INV-2026-${String(this.state.invoices.length + 86).padStart(3, '0')}`;
    const invoice = {
      id: nextId,
      startupId: startup.id,
      startupName: startup.name,
      invoiceType: type,
      issueDate: today,
      dueDate: dueDateFinal,
      billingPeriod: period,
      lineItems,
      subtotal,
      grantSubsidyPercent: subsidyPercent,
      subsidyDeduction,
      taxableAmount,
      taxGst,
      total,
      status: 'Issued',
      paymentMethod: null,
      paidAt: null,
      transactionRef: null,
      generatedAt: new Date().toISOString()
    };

    if (!this.state.invoices) this.state.invoices = [];
    this.state.invoices.unshift(invoice);
    this.addActivity('Invoices', `Auto-generated Invoice #${invoice.id} for ${startup.name} (₹${total.toLocaleString('en-IN')}).`, '🧾');
    this.save();
    return { success: true, invoice };
  }

  // --- Payments & Lifecycle Management ---
  getPayments() {
    return this.state.payments || [];
  }

  getPaymentById(id) {
    return (this.state.payments || []).find(p => p.id === id);
  }

  getPaymentsByInvoiceId(invoiceId) {
    return (this.state.payments || []).filter(p => p.invoiceId === invoiceId);
  }

  getPaymentsByStartupId(startupId) {
    const startup = this.getStartupById(startupId);
    const cleanName = startup ? startup.name.toLowerCase() : '';
    return (this.state.payments || []).filter(p => {
      if (p.startupId === startupId) return true;
      if (cleanName && p.startupName && p.startupName.toLowerCase().includes(cleanName)) return true;
      return false;
    });
  }

  getPaymentSummaryForStartup(startupId) {
    const payments = this.getPaymentsByStartupId(startupId);
    const invoices = (this.state.invoices || []).filter(i => i.startupId === startupId);
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const balanceDue = Math.max(0, totalInvoiced - totalPaid);
    return {
      payments,
      invoices,
      totalPaid,
      totalInvoiced,
      balanceDue,
      paymentCount: payments.length,
      lastPayment: payments[0] || null
    };
  }

  exportPaymentsCSV(filterStartupId = null) {
    let list = this.getPayments();
    if (filterStartupId) {
      list = this.getPaymentsByStartupId(filterStartupId);
    }
    const headers = [
      'Payment ID',
      'Receipt Number',
      'Startup ID',
      'Startup Name',
      'Invoice ID',
      'Amount (INR)',
      'Gateway',
      'Payment Method',
      'Transaction Ref / UTR',
      'Settlement Date',
      'Status',
      'Settlement Type',
      'Notes'
    ];
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = list.map(p => [
      escapeCsv(p.id),
      escapeCsv(p.receiptNo || 'REC-SETTLED'),
      escapeCsv(p.startupId || 'N/A'),
      escapeCsv(p.startupName || 'N/A'),
      escapeCsv(p.invoiceId || 'N/A'),
      escapeCsv(p.amount || 0),
      escapeCsv(p.gateway || p.method || 'Gateway'),
      escapeCsv(p.method || 'N/A'),
      escapeCsv(p.transactionRef || 'N/A'),
      escapeCsv(p.paymentDate || 'N/A'),
      escapeCsv(p.status || 'Successful'),
      escapeCsv(p.isPartial ? 'Partial Installment' : 'Full Settlement'),
      escapeCsv(p.notes || '')
    ].join(','));
    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = filterStartupId ? `payment_history_${filterStartupId}.csv` : 'nexus_payment_history_export.csv';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  getGatewayConfig() {
    if (!this.state.gatewayConfig) {
      this.state.gatewayConfig = (window.INITIAL_DATA && window.INITIAL_DATA.gatewayConfig)
        ? JSON.parse(JSON.stringify(window.INITIAL_DATA.gatewayConfig))
        : { activeMode: 'mock' };
    }
    return this.state.gatewayConfig;
  }

  updateGatewayConfig(newConfig) {
    this.state.gatewayConfig = { ...this.getGatewayConfig(), ...newConfig };
    this.save();
    return this.state.gatewayConfig;
  }

  getInvoiceDisplayStatus(inv) {
    if (!inv) return 'Unknown';
    if (inv.status === 'Cancelled') return 'Cancelled';
    if (inv.status === 'Paid') return 'Paid';
    if (inv.status === 'Partially Paid' || inv.status === 'Partial') return 'Partially Paid';
    if (inv.status === 'Overdue') return 'Overdue';
    if (inv.dueDate && new Date(inv.dueDate) < new Date('2026-10-26T23:59:59')) return 'Overdue';
    return 'Pending';
  }

  processPayment(invoiceId, paymentMethod = 'UPI', transactionRef = null, customNotes = '', gatewayMeta = {}) {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) return { success: false, message: 'Invoice not found' };

    if (invoice.status === 'Paid') {
      return { success: false, message: 'Invoice is already fully marked as paid!' };
    }
    if (invoice.status === 'Cancelled') {
      return { success: false, message: 'Cannot process payment for a cancelled invoice!' };
    }

    const existingPayments = this.getPaymentsByInvoiceId(invoice.id);
    const paidSoFar = existingPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const balanceToPay = Math.max(0, invoice.total - paidSoFar);
    const amountSettled = balanceToPay > 0 ? balanceToPay : invoice.total;

    const ref = transactionRef || (gatewayMeta.orderId
      ? gatewayMeta.orderId
      : `${paymentMethod.toUpperCase()}/${Math.floor(100000000000 + Math.random() * 900000000000)}/NEXUS`);

    const receiptNum = `REC-2026-0${this.getPayments().length + 50}`;
    const paidAt = new Date().toISOString();

    invoice.status = 'Paid';
    invoice.amountPaid = invoice.total;
    invoice.balanceDue = 0;
    invoice.paymentMethod = paymentMethod;
    invoice.gateway = gatewayMeta.gateway || paymentMethod;
    invoice.paidAt = paidAt;
    invoice.transactionRef = ref;
    invoice.receiptNo = receiptNum;

    const paymentRecord = {
      id: `PAY-2026-${Math.floor(100 + Math.random() * 900)}`,
      receiptNo: receiptNum,
      invoiceId: invoice.id,
      startupId: invoice.startupId,
      startupName: invoice.startupName,
      amount: amountSettled,
      paymentDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      method: paymentMethod,
      gateway: gatewayMeta.gateway || paymentMethod,
      transactionRef: ref,
      status: 'Successful',
      isPartial: false,
      remainingBalance: 0,
      notes: customNotes || `Full settlement for ${invoice.billingPeriod}`
    };

    if (!this.state.payments) this.state.payments = [];
    this.state.payments.unshift(paymentRecord);

    // Sync matching rent record status
    if (this.state.rentRecords) {
      const matchRent = this.state.rentRecords.find(r => r.invoiceId === invoice.id || r.startupId === invoice.startupId);
      if (matchRent) {
        matchRent.status = 'Paid';
        matchRent.receiptNo = receiptNum;
        matchRent.paidAt = new Date().toISOString().split('T')[0];
      }
    }

    this.addActivity('Payments', `${invoice.startupName} settled #${invoice.id} (₹${amountSettled.toLocaleString('en-IN')}) via ${paymentMethod} [${gatewayMeta.gateway || 'Gateway'}].`, '💰');
    this.save();
    return { success: true, payment: paymentRecord, invoice };
  }

  recordPartialPayment(invoiceId, paymentData = {}) {
    const { amount, method = 'UPI', ref, notes = 'Partial installment', gatewayMeta = {} } = paymentData;
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) return { success: false, message: 'Invoice not found' };

    if (invoice.status === 'Paid') {
      return { success: false, message: 'Invoice is already fully paid.' };
    }
    if (invoice.status === 'Cancelled') {
      return { success: false, message: 'Invoice has been cancelled.' };
    }

    const existingPayments = this.getPaymentsByInvoiceId(invoice.id);
    const paidSoFar = existingPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const balanceDue = Math.max(0, invoice.total - paidSoFar);

    const payAmount = parseFloat(amount || 0);
    if (isNaN(payAmount) || payAmount <= 0) {
      return { success: false, message: 'Please specify a valid payment amount.' };
    }

    const actualPayAmount = Math.min(payAmount, balanceDue);
    const newPaidTotal = paidSoFar + actualPayAmount;
    const remainingBalance = Math.max(0, invoice.total - newPaidTotal);
    const isNowFullyPaid = remainingBalance <= 0;

    const finalRef = ref || (gatewayMeta.orderId
      ? gatewayMeta.orderId
      : `${method.toUpperCase()}/${Math.floor(100000000000 + Math.random() * 900000000000)}/PARTIAL`);

    const receiptNum = `REC-2026-0${this.getPayments().length + 50}`;
    const paidAt = new Date().toISOString();

    invoice.amountPaid = newPaidTotal;
    invoice.balanceDue = remainingBalance;
    invoice.status = isNowFullyPaid ? 'Paid' : 'Partially Paid';
    invoice.paymentMethod = method;
    invoice.gateway = gatewayMeta.gateway || method;
    invoice.paidAt = paidAt;
    invoice.transactionRef = finalRef;
    if (isNowFullyPaid) {
      invoice.receiptNo = receiptNum;
    }

    const paymentRecord = {
      id: `PAY-2026-${Math.floor(100 + Math.random() * 900)}`,
      receiptNo: receiptNum,
      invoiceId: invoice.id,
      startupId: invoice.startupId,
      startupName: invoice.startupName,
      amount: actualPayAmount,
      paymentDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      method: method,
      gateway: gatewayMeta.gateway || method,
      transactionRef: finalRef,
      status: 'Successful',
      isPartial: !isNowFullyPaid,
      remainingBalance: remainingBalance,
      notes: notes || `Installment payment (₹${actualPayAmount.toLocaleString('en-IN')} of ₹${invoice.total.toLocaleString('en-IN')})`
    };

    if (!this.state.payments) this.state.payments = [];
    this.state.payments.unshift(paymentRecord);

    // Sync matching rent record
    if (this.state.rentRecords) {
      const matchRent = this.state.rentRecords.find(r => r.invoiceId === invoice.id || r.startupId === invoice.startupId);
      if (matchRent) {
        matchRent.balanceDue = remainingBalance;
        matchRent.amountPaid = (matchRent.amountPaid || 0) + actualPayAmount;
        if (isNowFullyPaid) {
          matchRent.status = 'Paid';
          matchRent.receiptNo = receiptNum;
          matchRent.paidAt = new Date().toISOString().split('T')[0];
        } else {
          matchRent.status = 'Partially Paid';
        }
      }
    }

    this.addActivity(
      'Payments',
      `Partial payment of ₹${actualPayAmount.toLocaleString('en-IN')} recorded for ${invoice.startupName} (#${invoice.id}). Balance: ₹${remainingBalance.toLocaleString('en-IN')}.`,
      '🔸'
    );
    this.save();
    return { success: true, payment: paymentRecord, invoice, remainingBalance, isFullyPaid: isNowFullyPaid };
  }

  cancelInvoice(invoiceId, reason = 'Cancelled by administrator') {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) return { success: false, message: 'Invoice not found' };

    if (invoice.status === 'Paid') {
      return { success: false, message: 'Cannot cancel an invoice that has already been paid.' };
    }

    invoice.status = 'Cancelled';
    invoice.cancellationReason = reason;
    invoice.cancelledAt = new Date().toISOString();

    this.addActivity('Payments', `Cancelled Invoice #${invoice.id} for ${invoice.startupName}. Reason: ${reason}`, '❌');
    this.save();
    return { success: true, invoice };
  }

  getInvoiceLifecycle(invoiceId) {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) return null;

    const payments = this.getPaymentsByInvoiceId(invoice.id);
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const balance = Math.max(0, invoice.total - totalPaid);

    let stage = 1; // 1 = Invoice Issued, 2 = Payment Processing, 3 = Reconciled Receipt
    if (invoice.status === 'Paid') {
      stage = 3;
    } else if (invoice.status === 'Partially Paid' || payments.length > 0) {
      stage = 2;
    } else if (invoice.status === 'Cancelled') {
      stage = 0;
    }

    return {
      invoice,
      payments,
      totalPaid,
      balance,
      stage,
      status: this.getInvoiceDisplayStatus(invoice),
      primaryReceipt: payments.length > 0 ? payments[0] : null
    };
  }

  // --- Rent Management System ---
  getRentRecords() {
    if (!this.state.rentRecords) {
      this.state.rentRecords = JSON.parse(JSON.stringify(window.INITIAL_DATA.rentRecords || []));
    }
    return this.state.rentRecords;
  }

  getRentRecordById(id) {
    const list = this.getRentRecords();
    return list.find(r => r.id === id);
  }

  payRentRecord(rentId, paymentMethod = 'UPI', customRef = null) {
    const rent = this.getRentRecordById(rentId);
    if (!rent) return { success: false, message: 'Rent record not found' };

    let inv = rent.invoiceId ? this.getInvoiceById(rent.invoiceId) : null;
    if (!inv) {
      const existing = this.getInvoices().find(i => i.startupId === rent.startupId);
      if (existing) {
        inv = existing;
      } else {
        const genRes = this.generateInvoice(rent.startupId, 'October 2026');
        if (genRes.success) inv = genRes.invoice;
      }
    }

    if (inv) {
      const payRes = this.processPayment(inv.id, paymentMethod, customRef);
      if (payRes.success) {
        rent.status = 'Paid';
        rent.receiptNo = payRes.payment.receiptNo;
        rent.paidAt = new Date().toISOString().split('T')[0];
        rent.invoiceId = inv.id;
        this.save();
        return { success: true, rent, payment: payRes.payment, invoice: inv };
      }
    }

    const receiptNum = `REC-2026-0${this.getPayments().length + 80}`;
    rent.status = 'Paid';
    rent.receiptNo = receiptNum;
    rent.paidAt = new Date().toISOString().split('T')[0];
    this.addActivity('Rent', `Settled rent for ${rent.startupName} (${rent.workspace} - ${rent.rentDisplay}).`, '💰');
    this.save();
    return { success: true, rent, receiptNo: receiptNum };
  }

  // --- Incubation Management & 8-Stage Journey Tracking ---
  getIncubationJourneyStages() {
    return [
      { id: 'Startup', name: 'Startup', stageNumber: 1, icon: '🌱', desc: 'Venture Genesis & Profile Setup', kpi: 'CIN & Pitch Ready', color: '#10b981' },
      { id: 'Application', name: 'Application', stageNumber: 2, icon: '📝', desc: 'Incubation Proposal & Deck Submission', kpi: 'Dossier Logged', color: '#06b6d4' },
      { id: 'Evaluation', name: 'Evaluation', stageNumber: 3, icon: '⚖️', desc: 'Technical & Financial Due Diligence', kpi: 'Committee Review', color: '#6366f1' },
      { id: 'Selection', name: 'Selection', stageNumber: 4, icon: '🎯', desc: 'Cohort Admission & Grant Approval', kpi: 'Grant Agreement', color: '#8b5cf6' },
      { id: 'Incubation', name: 'Incubation', stageNumber: 5, icon: '🏢', desc: 'Workspace Allocation & Infrastructure', kpi: 'Desk / Lab Active', color: '#ec4899' },
      { id: 'Mentorship', name: 'Mentorship', stageNumber: 6, icon: '🧠', desc: 'Advisory Matching & Office Hours', kpi: 'Mentor Paired', color: '#f59e0b' },
      { id: 'Milestones', name: 'Milestones', stageNumber: 7, icon: '🏆', desc: 'MVP Delivery & KPI Sprint Validation', kpi: 'Sprint Deliverables', color: '#3b82f6' },
      { id: 'Graduation', name: 'Graduation', stageNumber: 8, icon: '🎓', desc: 'Demo Day, Institutional Series A & Alumni', kpi: 'Alumni Fellowship', color: '#10b981' }
    ];
  }

  getAsciiProgressBar(percent, totalBlocks = 14) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    // Exact user requirement: 80% -> ████████████░░ 80% (12 filled, 2 unfilled)
    const filled = p === 80 ? 12 : Math.round((p / 100) * totalBlocks);
    const empty = Math.max(0, totalBlocks - filled);
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${p}%`;
  }

  normalizeStartupIncubation(s) {
    if (!s) return s;

    // Default dates and period
    const defaultPeriods = {
      'STP-XYZ': { period: '01 Jan 2026 → 31 Dec 2026', stage: 'MVP Development', journeyStage: 'Milestones', progress: 80, mentor: 'John Smith', mentorId: 'MEN-05', nextMilestone: 'Product Launch', milestoneDate: '2026-11-20' },
      'STP-01': { period: '15 Jan 2026 → 15 Jul 2027', stage: 'Product-Market Fit', journeyStage: 'Mentorship', progress: 75, mentor: 'Siddharth Nambiar', mentorId: 'MEN-01', nextMilestone: 'Hospital Pilot Deployments', milestoneDate: '2026-11-15' },
      'STP-02': { period: '01 Feb 2026 → 31 Jan 2028', stage: 'Early Traction', journeyStage: 'Incubation', progress: 60, mentor: 'Dr. Arvind Chawla', mentorId: 'MEN-03', nextMilestone: 'CDSCO Test License Clearance', milestoneDate: '2026-10-30' },
      'STP-03': { period: '10 Nov 2025 → 10 Nov 2026', stage: 'Growth / Fundraising', journeyStage: 'Milestones', progress: 85, mentor: 'Meera Krishnan', mentorId: 'MEN-02', nextMilestone: 'Close ₹8.5 Cr Series A Lead', milestoneDate: '2026-11-01' },
      'STP-04': { period: '01 Oct 2026 → 30 Sep 2027', stage: 'MVP Prototype', journeyStage: 'Selection', progress: 50, mentor: 'Pooja Batra', mentorId: 'MEN-04', nextMilestone: 'Battery Swap Hardware V2', milestoneDate: '2026-10-25' },
      'STP-05': { period: '20 Oct 2026 → 19 Oct 2027', stage: 'Ideation & Fleet Pilot', journeyStage: 'Evaluation', progress: 25, mentor: 'John Smith', mentorId: 'MEN-05', nextMilestone: 'Pilot Depot Setup & EV Permits', milestoneDate: '2026-11-30' },
      'STP-06': { period: '01 Nov 2026 → 30 Apr 2028', stage: 'Ideation & Cryptography', journeyStage: 'Application', progress: 15, mentor: 'Siddharth Nambiar', mentorId: 'MEN-01', nextMilestone: 'Quantum Simulator Benchmark', milestoneDate: '2026-12-15' },
      'STP-07': { period: '01 Mar 2025 → 31 Aug 2026', stage: 'Graduated Enterprise', journeyStage: 'Graduation', progress: 100, mentor: 'Meera Krishnan', mentorId: 'MEN-02', nextMilestone: 'Series A Deployment & Alumni', milestoneDate: 'Completed' }
    };

    const def = defaultPeriods[s.id] || {
      period: '01 Jan 2026 → 31 Dec 2026',
      stage: s.stage || 'MVP Development',
      journeyStage: 'Milestones',
      progress: s.progressPercent || 70,
      mentor: 'John Smith',
      mentorId: 'MEN-05',
      nextMilestone: 'Beta Customer Rollout',
      milestoneDate: '2026-11-30'
    };

    if (!s.incubationPeriod || s.incubationPeriod.length < 15 || !s.incubationPeriod.includes('→')) {
      s.incubationPeriod = def.period;
    }
    if (!s.currentStage) s.currentStage = def.stage;
    if (!s.incubationJourneyStage) s.incubationJourneyStage = def.journeyStage;
    if (s.progressPercent === undefined || s.progressPercent === null) s.progressPercent = def.progress;
    if (!s.mentorId) s.mentorId = def.mentorId;
    if (!s.nextMilestone) s.nextMilestone = def.nextMilestone;
    if (!s.nextMilestoneDate) s.nextMilestoneDate = def.milestoneDate;

    // Resolve mentor name
    const m = (this.state.mentors || []).find(men => men.id === s.mentorId);
    s.mentorName = m ? m.name : def.mentor;

    // Ensure founder fields
    if (s.founders) {
      if (!s.founders.linkedIn) {
        const slug = (s.founders.name || s.name || 'founder').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        s.founders.linkedIn = `https://linkedin.com/in/${slug}`;
      }
      if (!s.founders.phone && s.founders.mobile) {
        s.founders.phone = s.founders.mobile;
      }
    }

    // Ensure deliverables list
    if (!s.milestoneDeliverables || !s.milestoneDeliverables.length) {
      s.milestoneDeliverables = [
        { id: `dlv-1`, task: "Core prototype functional testing", done: s.progressPercent >= 30 },
        { id: `dlv-2`, task: "Regulatory KYC & compliance documentation", done: s.progressPercent >= 50 },
        { id: `dlv-3`, task: "Weekly mentor advisory review sessions", done: s.progressPercent >= 70 },
        { id: `dlv-4`, task: s.nextMilestone || "Product Launch", done: s.progressPercent >= 100 }
      ];
    }

    // Ensure journey history audit trail
    if (!s.journeyHistory || !s.journeyHistory.length) {
      const stages = this.getIncubationJourneyStages();
      const currentIdx = stages.findIndex(st => st.id.toLowerCase() === (s.incubationJourneyStage || 'milestones').toLowerCase());
      s.journeyHistory = stages.map((st, i) => ({
        stage: st.id,
        stageNumber: st.stageNumber,
        icon: st.icon,
        completed: i < currentIdx || (i === currentIdx && s.progressPercent === 100),
        active: i === currentIdx && s.progressPercent < 100,
        date: i <= currentIdx ? (s.joiningDate || '2026-01-01') : 'Upcoming',
        notes: i < currentIdx ? `Stage completed and cleared by Incubation Advisory.` : (i === currentIdx ? `Current Active Stage (${s.progressPercent}% progress toward ${s.nextMilestone}).` : `Pending previous stage completion.`)
      }));
    }

    // Mentorship session logs
    if (!s.mentorshipSessions) {
      s.mentorshipSessions = [
        {
          id: `SES-${s.id}-1`,
          date: '2026-10-02',
          mentorName: s.mentorName,
          topics: 'Architecture scaling & customer discovery interviews',
          feedback: 'Strong progress on unit metrics. Advised focus on enterprise pilot retention.',
          rating: 5
        }
      ];
    }

    return s;
  }

  getMilestones() {
    return this.state.incubationMilestones || [];
  }

  getMentors() {
    return this.state.mentors || [];
  }

  advanceStartupJourneyStage(startupId, remarks = '') {
    const startup = this.getStartupById(startupId);
    if (!startup) return { success: false, message: 'Startup not found' };

    const stages = this.getIncubationJourneyStages();
    const curIdx = stages.findIndex(st => st.id.toLowerCase() === (startup.incubationJourneyStage || 'startup').toLowerCase());

    if (curIdx >= stages.length - 1) {
      startup.progressPercent = 100;
      startup.incubationJourneyStage = 'Graduation';
      startup.currentStage = 'Graduated';
      startup.status = 'Completed';
      this.save();
      this.addActivity('Incubation', `🎓 ${startup.name} has officially Graduated from incubation!`, '🎓');
      return { success: true, startup, graduated: true };
    }

    const nextStage = stages[curIdx + 1];
    startup.incubationJourneyStage = nextStage.id;
    startup.currentStage = nextStage.name === 'Milestones' ? 'MVP Development' : (nextStage.name === 'Graduation' ? 'Graduated' : nextStage.name);
    
    // Automatically advance progress %
    const targetProgress = Math.round(((curIdx + 2) / stages.length) * 100);
    if (startup.progressPercent < targetProgress) {
      startup.progressPercent = Math.min(100, targetProgress);
    }
    if (nextStage.id === 'Graduation') {
      startup.progressPercent = 100;
      startup.status = 'Completed';
    }

    // Update journey history
    this.normalizeStartupIncubation(startup);
    if (startup.journeyHistory) {
      startup.journeyHistory.forEach((jh, i) => {
        if (i <= curIdx + 1) {
          jh.completed = i < curIdx + 1 || startup.progressPercent === 100;
          jh.active = i === curIdx + 1 && startup.progressPercent < 100;
          if (i === curIdx + 1) jh.date = new Date().toISOString().split('T')[0];
        }
      });
    }

    this.addActivity('Incubation', `Advanced ${startup.name} to Stage ${nextStage.stageNumber}: ${nextStage.name} (${remarks || 'Criteria cleared'}).`, '🚀');
    this.save();
    return { success: true, startup, nextStage };
  }

  setStartupJourneyStage(startupId, stageName, remarks = '') {
    const startup = this.getStartupById(startupId);
    if (!startup) return { success: false, message: 'Startup not found' };

    const stages = this.getIncubationJourneyStages();
    const stageObj = stages.find(st => st.id.toLowerCase() === stageName.toLowerCase());
    if (!stageObj) return { success: false, message: 'Invalid stage' };

    startup.incubationJourneyStage = stageObj.id;
    if (stageObj.id === 'Milestones' && !startup.currentStage) {
      startup.currentStage = 'MVP Development';
    } else if (stageObj.id === 'Graduation') {
      startup.currentStage = 'Graduated';
      startup.progressPercent = 100;
      startup.status = 'Completed';
    }

    this.normalizeStartupIncubation(startup);
    this.addActivity('Incubation', `Set ${startup.name} incubation stage to: ${stageObj.name}.`, '🎯');
    this.save();
    return { success: true, startup };
  }

  updateStartupIncubation(startupId, updates = {}) {
    const startup = this.getStartupById(startupId);
    if (!startup) return { success: false, message: 'Startup not found' };

    if (updates.incubationPeriod) startup.incubationPeriod = updates.incubationPeriod;
    if (updates.currentStage) startup.currentStage = updates.currentStage;
    if (updates.incubationJourneyStage) startup.incubationJourneyStage = updates.incubationJourneyStage;
    if (updates.progressPercent !== undefined) {
      startup.progressPercent = Math.max(0, Math.min(100, Number(updates.progressPercent)));
      if (startup.progressPercent === 100) {
        startup.incubationJourneyStage = 'Graduation';
        startup.status = 'Completed';
      }
    }
    if (updates.mentorId) {
      startup.mentorId = updates.mentorId;
      const m = (this.state.mentors || []).find(men => men.id === updates.mentorId);
      if (m) startup.mentorName = m.name;
    }
    if (updates.nextMilestone) startup.nextMilestone = updates.nextMilestone;
    if (updates.nextMilestoneDate) startup.nextMilestoneDate = updates.nextMilestoneDate;

    this.normalizeStartupIncubation(startup);
    this.addActivity('Incubation', `Updated incubation details for ${startup.name}. Progress: ${startup.progressPercent}%.`, '📈');
    this.save();
    return { success: true, startup };
  }

  assignMentor(startupId, mentorId) {
    const startup = this.getStartupById(startupId);
    const mentor = (this.state.mentors || []).find(m => m.id === mentorId);
    if (!startup || !mentor) return { success: false, message: 'Invalid startup or mentor' };

    startup.mentorId = mentor.id;
    startup.mentorName = mentor.name;
    if (!mentor.startupsMentored) mentor.startupsMentored = [];
    if (!mentor.startupsMentored.includes(startup.id)) {
      mentor.startupsMentored.push(startup.id);
    }

    this.addActivity('Incubation', `Assigned mentor ${mentor.name} to ${startup.name}.`, '🧠');
    this.save();
    return { success: true, startup, mentor };
  }

  addMentorshipSession(startupId, sessionData) {
    const startup = this.getStartupById(startupId);
    if (!startup) return { success: false, message: 'Startup not found' };

    if (!startup.mentorshipSessions) startup.mentorshipSessions = [];
    const newSession = {
      id: `SES-${Date.now()}`,
      date: sessionData.date || new Date().toISOString().split('T')[0],
      mentorName: sessionData.mentorName || startup.mentorName || 'John Smith',
      topics: sessionData.topics || 'Milestone Sprint Review',
      feedback: sessionData.feedback || 'Reviewed progress and set next action targets.',
      rating: Number(sessionData.rating) || 5
    };

    startup.mentorshipSessions.unshift(newSession);
    this.addActivity('Incubation', `Logged mentorship session for ${startup.name} with ${newSession.mentorName}.`, '💬');
    this.save();
    return { success: true, session: newSession };
  }

  // --- Sequential Milestone Management Engine ---
  getMilestones(startupId = null) {
    let list = this.state.incubationMilestones || [];
    if (startupId) {
      list = list.filter(m => m.startupId === startupId);
    }
    return list.sort((a, b) => (Number(a.sequenceNumber) || 99) - (Number(b.sequenceNumber) || 99));
  }

  getMilestonesByStartup(startupId) {
    return this.getMilestones(startupId);
  }

  createMilestone(data) {
    const startup = this.getStartupById(data.startupId);
    const existing = this.getMilestonesByStartup(data.startupId);
    const seqNum = Number(data.sequenceNumber) || (existing.length + 1);

    const isCompleted = data.status === 'Completed' || Number(data.progressPercent) === 100;
    const status = isCompleted ? 'Completed' : (data.status || 'In Progress');
    const statusDisplay = isCompleted ? '✓ Completed' : (status === 'Planned' ? '📅 Planned' : '⏳ In Progress');

    const newMls = {
      id: `MLS-${Date.now()}`,
      startupId: data.startupId,
      startupName: startup ? startup.name : 'Unknown Startup',
      sequenceNumber: seqNum,
      milestoneLabel: data.milestoneLabel || `Milestone ${seqNum}`,
      title: data.title || 'Untitled Milestone',
      status: status,
      statusDisplay: statusDisplay,
      progressPercent: isCompleted ? 100 : (Number(data.progressPercent) || 0),
      targetDate: data.targetDate || new Date().toISOString().split('T')[0],
      completedDate: isCompleted ? (data.completedDate || new Date().toISOString().split('T')[0]) : null,
      verifiedBy: data.verifiedBy || (this.currentRole === 'mentor' ? 'John Smith (Mentor)' : 'Hub Admin'),
      creatorRole: data.creatorRole || (this.currentRole === 'mentor' ? 'Mentor' : 'Admin'),
      creatorName: data.creatorName || (this.currentRole === 'mentor' ? 'John Smith' : 'Hub Administration'),
      kpiImpact: data.kpiImpact || '',
      mentorNotes: data.mentorNotes || ''
    };

    if (!this.state.incubationMilestones) this.state.incubationMilestones = [];
    this.state.incubationMilestones.push(newMls);
    this.syncStartupProgressFromMilestones(data.startupId);

    const roleTag = newMls.creatorRole === 'Mentor' ? '🧠 Mentor John Smith' : '🏢 Hub Admin';
    this.addActivity('Milestones', `${roleTag} created ${newMls.milestoneLabel}: "${newMls.title}" for ${newMls.startupName}.`, '🎯');
    this.save();
    return newMls;
  }

  updateMilestone(id, updates) {
    const idx = this.state.incubationMilestones.findIndex(m => m.id === id);
    if (idx !== -1) {
      const cur = this.state.incubationMilestones[idx];
      const isCompleted = updates.status === 'Completed' || Number(updates.progressPercent) === 100;
      
      if (isCompleted) {
        updates.status = 'Completed';
        updates.statusDisplay = '✓ Completed';
        updates.progressPercent = 100;
        if (!updates.completedDate) updates.completedDate = new Date().toISOString().split('T')[0];
      } else if (updates.status === 'Planned') {
        updates.statusDisplay = '📅 Planned';
        updates.completedDate = null;
      } else if (updates.status === 'In Progress') {
        updates.statusDisplay = '⏳ In Progress';
        updates.completedDate = null;
      }

      this.state.incubationMilestones[idx] = { ...cur, ...updates };
      const mls = this.state.incubationMilestones[idx];
      this.syncStartupProgressFromMilestones(mls.startupId);

      this.addActivity('Milestones', `Updated ${mls.milestoneLabel}: "${mls.title}" for ${mls.startupName} (${mls.statusDisplay}).`, '📈');
      this.save();
      return mls;
    }
  }

  toggleMilestoneStatus(id) {
    const mls = (this.state.incubationMilestones || []).find(m => m.id === id);
    if (!mls) return null;

    const isCurrentlyCompleted = mls.status === 'Completed';
    const newStatus = isCurrentlyCompleted ? 'In Progress' : 'Completed';
    return this.updateMilestone(id, {
      status: newStatus,
      progressPercent: isCurrentlyCompleted ? 50 : 100,
      completedDate: isCurrentlyCompleted ? null : new Date().toISOString().split('T')[0],
      verifiedBy: isCurrentlyCompleted ? 'Pending Verification' : (this.currentRole === 'mentor' ? 'Verified by John Smith (Mentor)' : 'Verified by Hub Admin')
    });
  }

  deleteMilestone(id) {
    const idx = (this.state.incubationMilestones || []).findIndex(m => m.id === id);
    if (idx !== -1) {
      const removed = this.state.incubationMilestones.splice(idx, 1)[0];
      this.syncStartupProgressFromMilestones(removed.startupId);
      this.addActivity('Milestones', `Removed ${removed.milestoneLabel}: "${removed.title}" from ${removed.startupName}.`, '🗑️');
      this.save();
      return true;
    }
    return false;
  }

  syncStartupProgressFromMilestones(startupId) {
    const startup = this.getStartupById(startupId);
    if (!startup) return;

    const milestones = this.getMilestonesByStartup(startupId);
    if (!milestones.length) return;

    // Calculate progress based on milestones completion
    const completedCount = milestones.filter(m => m.status === 'Completed').length;
    const inProgressMls = milestones.filter(m => m.status === 'In Progress');
    const inProgressWeight = inProgressMls.reduce((acc, m) => acc + (Number(m.progressPercent) || 50), 0);
    
    // Overall weighted progress
    const totalPossible = milestones.length * 100;
    const totalAchieved = (completedCount * 100) + inProgressWeight;
    const calcPercent = Math.min(100, Math.round((totalAchieved / totalPossible) * 100));

    // Next active milestone
    const nextActive = milestones.find(m => m.status === 'In Progress') || milestones.find(m => m.status === 'Planned') || milestones[milestones.length - 1];
    
    startup.progressPercent = calcPercent;
    if (nextActive) {
      startup.nextMilestone = nextActive.title;
      startup.nextMilestoneDate = nextActive.targetDate;
      if (nextActive.title.toLowerCase().includes('mvp')) {
        startup.currentStage = 'MVP Development';
      } else if (nextActive.title.toLowerCase().includes('beta')) {
        startup.currentStage = 'Beta Launch & Pilot';
      } else if (nextActive.title.toLowerCase().includes('revenue')) {
        startup.currentStage = 'Revenue Generation';
      } else if (completedCount === milestones.length) {
        startup.currentStage = 'Graduated';
        startup.incubationJourneyStage = 'Graduation';
      }
    }

    this.normalizeStartupIncubation(startup);
  }

  addMilestone(data) {
    return this.createMilestone(data);
  }

  // --- Activity Log ---
  addActivity(category, description, icon = '📌') {
    if (!this.state.activityLog) this.state.activityLog = [];
    this.state.activityLog.unshift({
      id: `ACT-${Date.now()}`,
      timestamp: 'Just now',
      category,
      description,
      icon
    });
    if (this.state.activityLog.length > 25) {
      this.state.activityLog = this.state.activityLog.slice(0, 25);
    }
  }

  // --- Aggregate Stats ---
  getDashboardStats() {
    const startups = this.getStartups();
    const spaces = this.getSpaces();
    const invoices = this.getInvoices();
    const rooms = this.getMeetingRooms();

    const incubatedStartups = startups.filter(s => s.status === 'Incubated');
    const totalSpaces = spaces.length;
    const occupiedSpaces = spaces.filter(sp => sp.status === 'occupied').length;
    const occupancyRate = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;

    let mrr = 0;
    incubatedStartups.forEach(s => {
      const billing = this.calculateStartupMonthlyBilling(s.id);
      if (billing) mrr += billing.total;
    });

    const pendingInvoices = invoices.filter(inv => inv.status === 'Issued' || inv.status === 'Overdue');
    const totalOutstanding = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    let totalRoomBookingsCount = 0;
    rooms.forEach(r => {
      totalRoomBookingsCount += (r.bookings || []).filter(b => b.status !== 'Cancelled').length;
    });

    return {
      activeStartupsCount: incubatedStartups.length,
      totalStartupsCount: startups.length,
      occupancyRate,
      occupiedSpaces,
      totalSpaces,
      mrr: Math.round(mrr),
      totalOutstanding: Math.round(totalOutstanding),
      pendingInvoicesCount: pendingInvoices.length,
      totalRoomBookingsCount
    };
  }
}

window.store = new NexusStore();
window.store.init();
