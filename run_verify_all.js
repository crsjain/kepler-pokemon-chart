const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const profileDir = '/tmp/kepler-chrome-headless-verify-all';
try {
  if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
} catch (e) {}

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--remote-debugging-port=9228',
    `--user-data-dir=${profileDir}`,
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-gpu',
    '--no-sandbox',
    '--ignore-certificate-errors',
    '--allow-insecure-localhost',
    '--disable-extensions',
    '--incognito',
    '--disable-features=HttpsUpgrades,NetworkChangeNotifier',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-proxy-server',
    'http://127.0.0.1:8000/verify_all.html?useProd=true'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  let targets;
  try {
    targets = await getDebugTargets();
  } catch (e) {
    console.error("Failed to fetch targets", e);
    chrome.kill();
    process.exit(1);
  }

  const target = targets.find(t => t.type === 'page');
  if (!target) {
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let commandId = 1;

  function send(method, params = {}) {
    ws.send(JSON.stringify({ id: commandId++, method, params }));
  }

  let testTimeout = setTimeout(() => {
    ws.close();
    chrome.kill();
    process.exit(1);
  }, 15000);

  ws.onopen = () => {
    send('Runtime.enable');
    send('Page.enable');
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    if (msg.id === 1) send('Page.navigate', { url: 'http://127.0.0.1:8000/verify_all.html?useProd=true' });

    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(arg => arg.value || JSON.stringify(arg)).join(' ');
      if (args.includes("RESULT_ALL:")) {
        console.log(args);
        clearTimeout(testTimeout);
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    }
  };
}

function getDebugTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9228/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

main();
