const fs = require('fs');

let code = fs.readFileSync('js/main.js', 'utf8');

const startTag = '  switchTab(tabId) {';
const endTag = '  renderRbacGate(tabId) {';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.error('Tags not found in js/main.js', { startIndex, endIndex });
  process.exit(1);
}

const replacement = `  switchTab(tabId) {
    this.currentTab = tabId;
    this.toggleMobileSidebar(false);

    // 1. Update Nav bar active states - highlight the EXACT tab clicked
    document.querySelectorAll('.nav-item').forEach(item => {
      const itemTab = item.getAttribute('data-tab');
      item.classList.toggle('active', itemTab === tabId);
      if (item.id === 'nav-item-meetingRooms') {
        item.style.background = '';
        item.style.color = '';
      }
    });

    // 2. Hide all view containers, show target container
    document.querySelectorAll('.view-container').forEach(view => {
      view.classList.remove('active');
    });

    let containerTab = tabId;
    if (['meetingRooms', 'bookings', 'myReservations', 'calendar', 'billingCredits', 'roomAnalytics', 'adminRooms'].includes(tabId)) {
      containerTab = 'meetingRooms';
    }

    const activeView = document.getElementById('view-' + containerTab);
    if (activeView) {
      activeView.classList.add('active');
    }

    // 3. Update Header Title
    const titleEl = document.getElementById('header-page-title');
    const titles = {
      dashboard: '⚡ Command Center',
      meetingRooms: '📅 Meeting Rooms',
      bookings: '📑 My Bookings & Reservations',
      myReservations: '📑 My Bookings & Reservations',
      calendar: '📆 Meeting Schedule Calendar',
      billingCredits: '💳 Credits & Meeting Room Billing',
      roomAnalytics: '📈 Meeting Room Analytics',
      adminRooms: '🛡️ Room Administration',
      workspace: '🏢 Workspaces & Desks',
      contact: '👥 Visitor Gate Passes',
      startupTables: '👥 Community Members & Startups',
      database: '🗄️ Database Tables (10 Collections)',
      onboarding: '🚀 Startup Onboarding',
      billing: '🧾 Invoices & Rent',
      payments: '💳 Payments Ledger',
      incubation: '🌱 Incubation Journey',
      milestones: '🎯 Milestones',
      reports: '📊 Analytics',
      leads: '📥 Inbound Leads & Applications'
    };
    if (titleEl) titleEl.innerText = titles[tabId] || 'Command Center';

    // Update Lifecycle Pill in sidebar
    this.updateSidebarLifecyclePill(tabId);

    // 4. RBAC Permission Guard
    if (!window.store.isTabAllowed(tabId)) {
      if (activeView) {
        activeView.innerHTML = this.renderRbacGate(tabId);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 5. Dispatch sub-tab views to MeetingRoomsModule
    if (tabId === 'meetingRooms') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('explore');
      } else {
        this.renderModule('meetingRooms');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'bookings' || tabId === 'myReservations') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('myBookings');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'calendar') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('calendar');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'billingCredits') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('creditsBilling');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'roomAnalytics') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('analytics');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'adminRooms') {
      if (window.MeetingRoomsModule) {
        window.MeetingRoomsModule.switchTab('admin');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 6. Render main module
    this.renderModule(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  `;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('js/main.js', code, 'utf8');
console.log('✅ js/main.js switchTab updated successfully!');

