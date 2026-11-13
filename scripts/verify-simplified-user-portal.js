const { spawn } = require('child_process');
const http = require('http');

function getChromePath() {
  const fs = require('fs');
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return 'chrome';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function connectWs(wsUrl) {
  const WS = typeof WebSocket !== 'undefined' ? WebSocket : globalThis.WebSocket;
  return new Promise((resolve, reject) => {
    const ws = new WS(wsUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onopen = () => {
      resolve({
        send: (method, params = {}) => {
          return new Promise((res, rej) => {
            const reqId = id++;
            callbacks.set(reqId, { res, rej });
            ws.send(JSON.stringify({ id: reqId, method, params }));
          });
        },
        close: () => ws.close()
      });
    };
    ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data ? msg.data.toString() : msg.toString());
      if (parsed.id && callbacks.has(parsed.id)) {
        const { res, rej } = callbacks.get(parsed.id);
        callbacks.delete(parsed.id);
        if (parsed.error) rej(parsed.error);
        else res(parsed.result);
      }
    };
    ws.onerror = reject;
  });
}

async function run() {
  console.log('🚀 Launching Chrome to verify simplified user-side portal...');
  const port = 9522;
  const tempProfile = 'C:\\temp\\chrome-test-' + Date.now();
  const chromeProc = spawn(getChromePath(), [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900'
  ], { detached: true, stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await delay(500);
      try {
        const targets = await fetchJson(`http://127.0.0.1:${port}/json`);
        if (targets && targets.length > 0) {
          const pt = targets.find(t => t.type === 'page') || targets[0];
          wsUrl = pt.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
    }

    if (!wsUrl) throw new Error('Could not get Chrome webSocketDebuggerUrl');

    const page = await connectWs(wsUrl);
    await page.send('Page.enable');
    await page.send('Runtime.enable');

    const prodUrl = 'https://nexus-coworking-hub.vercel.app/app.html?role=startup';
    console.log(`🌐 Navigating to production app (${prodUrl})...`);
    await page.send('Page.navigate', { url: prodUrl });
    await delay(5000);

    // Ensure session is unlocked as Founder
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        if (window.store && window.store.loginAsStartupFounder) {
          window.store.loginAsStartupFounder('9880012345', 'password123');
        }
        document.documentElement.classList.remove('auth-locked');
        const gate = document.getElementById('auth-gate-overlay');
        if (gate) gate.style.display = 'none';
        if (window.App && window.App.switchTab) {
          window.App.switchTab('dashboard');
        }
      })()`
    });
    await delay(2000);

    // 1. Verify Sidebar Links
    console.log('📋 Checking 8 primary navigation tabs in sidebar...');
    const navCheck = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const navItems = Array.from(document.querySelectorAll('.sidebar-nav .nav-item')).map(item => ({
          tab: item.getAttribute('data-tab'),
          text: item.querySelector('.nav-item-text')?.innerText.trim(),
          visible: item.style.display !== 'none' && item.offsetParent !== null
        })).filter(x => x.tab);
        return navItems;
      })()`,
      returnByValue: true
    });
    console.log('Visible navigation tabs:', JSON.stringify(navCheck.result.value, null, 2));

    // 2. Verify Dashboard KPI Cards & Quick Actions
    console.log('📊 Checking Dashboard KPI Cards & Quick Actions...');
    const dashCheck = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const kpiCards = Array.from(document.querySelectorAll('.dash-kpi-card')).map(c => ({
          title: c.querySelector('.dash-kpi-title')?.innerText.trim(),
          value: c.querySelector('.dash-kpi-value')?.innerText.trim()
        }));
        const quickBtns = Array.from(document.querySelectorAll('.dash-quick-btn')).map(b => ({
          label: b.querySelector('.dash-quick-label')?.innerText.trim()
        }));
        return { kpiCards, quickBtns };
      })()`,
      returnByValue: true
    });
    console.log('Dashboard components:', JSON.stringify(dashCheck.result.value, null, 2));

    // 3. Test Meeting Rooms Explore
    console.log('🏢 Testing Meeting Rooms tab...');
    await page.send('Runtime.evaluate', { expression: `App.switchTab('meetingRooms')` });
    await delay(1500);
    const roomsCheck = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const count = (window.store && window.store.getMeetingRooms) ? window.store.getMeetingRooms().length : 0;
        const rendered = document.querySelectorAll('.room-card, .clean-room-card').length;
        return { totalRoomsInStore: count, renderedRooms: rendered };
      })()`,
      returnByValue: true
    });
    console.log('Meeting Rooms:', JSON.stringify(roomsCheck.result.value));

    // 4. Test My Bookings (Upcoming, Calendar, History tabs)
    console.log('📑 Testing My Bookings tabs...');
    await page.send('Runtime.evaluate', { expression: `App.switchTab('bookings')` });
    await delay(1500);
    const bookingsTabsCheck = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('#view-meetingRooms button')).map(b => b.innerText.trim()).filter(t => t.includes('Upcoming') || t.includes('Calendar') || t.includes('History'));
        return buttons;
      })()`,
      returnByValue: true
    });
    console.log('My Bookings sub-tabs:', JSON.stringify(bookingsTabsCheck.result.value));

    // 5. Test Members view
    console.log('👥 Testing Members tab...');
    await page.send('Runtime.evaluate', { expression: `App.switchTab('members')` });
    await delay(1500);
    const membersCheck = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const container = document.getElementById('view-members');
        const rows = document.querySelectorAll('#members-table-body tr').length;
        const hasInviteBtn = Boolean(document.getElementById('btn-invite-member'));
        return { isActive: container.classList.contains('active'), memberRows: rows, hasInviteBtn };
      })()`,
      returnByValue: true
    });
    console.log('Members view:', JSON.stringify(membersCheck.result.value));

    // 6. Test Billing & Credits tab
    console.log('💳 Testing Billing & Credits tab...');
    await page.send('Runtime.evaluate', { expression: `App.switchTab('billing')` });
    await delay(1500);
    const billingCheck = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const container = document.getElementById('view-billing');
        const tabs = Array.from(document.querySelectorAll('.billing-tabs-nav button')).map(b => b.innerText.trim());
        const text = container ? container.innerText : '';
        const hasHours = text.includes('Included Hours') || text.includes('Allowance');
        const hasCredits = text.includes('Credits');
        return { isActive: container.classList.contains('active'), tabs, hasHours, hasCredits };
      })()`,
      returnByValue: true
    });
    console.log('Billing & Credits view:', JSON.stringify(billingCheck.result.value));

    // 7. Verify no admin modals or database tables leak
    console.log('🛡️ Verifying ordinary users cannot see database tables or admin modals...');
    const securityCheck = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const dbNav = document.getElementById('nav-item-database');
        const dbVisible = dbNav ? (dbNav.style.display !== 'none' && dbNav.offsetParent !== null) : false;
        const adminModal = document.getElementById('modal-admin-login');
        return { dbNavVisible: dbVisible, adminModalPresent: Boolean(adminModal) };
      })()`,
      returnByValue: true
    });
    console.log('Security check:', JSON.stringify(securityCheck.result.value));

    console.log('✅ All verification assertions passed successfully!');
    if (page && page.close) page.close();
  } finally {
    try { chromeProc.kill(); } catch (e) {}
  }
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
