const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9335',
    '--user-data-dir=C:\\temp\\chrome-test-profile-shot2',
    '--disable-gpu',
    '--window-size=1440,1080',
    'http://localhost:5173/app.html'
  ]);

  await new Promise(r => setTimeout(r, 3000));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9335/json', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173'));
    if (!pageTarget) {
      console.error('Target not found');
      chrome.kill();
      return;
    }

    const WSClass = globalThis.WebSocket || require('ws');
    const ws = new WSClass(pageTarget.webSocketDebuggerUrl);
    ws.onopen = async () => {
      let reqId = 1;
      const listeners = new Map();
      function send(method, params = {}) {
        return new Promise(res => {
          const id = reqId++;
          listeners.set(id, res);
          ws.send(JSON.stringify({ id, method, params }));
        });
      }
      ws.onmessage = (event) => {
        const d = JSON.parse(event.data);
        if (d.id && listeners.has(d.id)) {
          const cb = listeners.get(d.id);
          listeners.delete(d.id);
          cb(d.result);
        }
      };

      await send('Runtime.enable');
      await send('Page.enable');

      // Set auth session and switch tab
      console.log('Logging in and switching tab...');
      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (function() {
            sessionStorage.setItem('nexus_auth_session', JSON.stringify({
              userId: 'USR-FOUNDER-1',
              name: 'Alex Morgan',
              phone: '9880012345',
              role: 'startup',
              startupId: 'STP-XYZ'
            }));
            if (window.AuthGate) window.AuthGate.checkAuthGate();
            if (window.store) window.store.setRole('startup', 'STP-XYZ');
            window.App.switchTab('billingCredits');
            const v = document.getElementById('view-meetingRooms');
            return {
              tab: window.App.currentTab,
              active: v.classList.contains('active'),
              display: window.getComputedStyle(v).display,
              htmlLen: v.innerHTML.length,
              children: v.children.length
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Eval result:', evalRes);

      await new Promise(r => setTimeout(r, 1500));

      console.log('Capturing screenshot...');
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('scripts/rendered-billing-credits.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved screenshot to scripts/rendered-billing-credits.png, byte count:', shot.data.length);

      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
  }
}
main();
