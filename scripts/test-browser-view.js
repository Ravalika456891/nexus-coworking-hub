const http = require('http');
const { spawn } = require('child_process');

async function main() {
  console.log('Launching Chrome headless...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--user-data-dir=C:\\temp\\chrome-test-profile',
    '--disable-gpu',
    'http://localhost:5173/app.html'
  ]);

  // Wait 3 seconds for Chrome to start
  await new Promise(r => setTimeout(r, 3000));

  try {
    // Get list of targets
    const targets = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9333/json', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    console.log('Targets:', targets.map(t => ({ title: t.title, url: t.url })));
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173'));
    if (!pageTarget) {
      console.error('Page target not found!');
      chrome.kill();
      return;
    }

    console.log('Connecting to WebSocket:', pageTarget.webSocketDebuggerUrl);
    // Use ws or simple HTTP protocol
    // Chrome has /json/protocol or HTTP endpoints, but WebSocket is standard.
    // If ws module not available, we can check node_modules for ws
    const WSClass = globalThis.WebSocket || require('ws');
    if (WSClass) {
      const ws = new WSClass(pageTarget.webSocketDebuggerUrl);
      ws.onopen = () => {
        console.log('Connected to CDP!');
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
          if (d.method === 'Runtime.consoleAPICalled') {
            console.log('BROWSER CONSOLE:', d.params.type, d.params.args.map(a => a.value || a.description));
          }
          if (d.method === 'Runtime.exceptionThrown') {
            console.error('BROWSER EXCEPTION:', JSON.stringify(d.params.exceptionDetails));
          }
        };

        (async () => {
          await send('Runtime.enable');
          await send('Log.enable');
          console.log('Listening for browser logs...');

          // Switch tab to billingCredits
          console.log('Switching tab to billingCredits in browser...');
          const evalResult = await send('Runtime.evaluate', {
            expression: `
              try {
                window.App.switchTab('billingCredits');
                const v = document.getElementById('view-meetingRooms');
                JSON.stringify({
                  activeTab: window.App.currentTab,
                  viewActive: v.classList.contains('active'),
                  innerLength: v.innerHTML.length,
                  firstChars: v.innerHTML.slice(0, 300)
                });
              } catch(e) {
                JSON.stringify({ error: e.message, stack: e.stack });
              }
            `,
            returnByValue: true
          });
          console.log('Evaluate result:', evalResult);

          ws.close();
          chrome.kill();
          process.exit(0);
        })();
      };
    }
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
  }
}

main();
