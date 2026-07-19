const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// Clean profile dir if exists to guarantee fresh load
const profileDir = '/tmp/kepler-chrome-headless-migration-test';
try {
  if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
} catch (e) {
  console.log("Could not clear profile dir:", e.message);
}

async function main() {
  const authFile = '/tmp/xauth-kepler-test';
  try {
    if (fs.existsSync(authFile)) fs.unlinkSync(authFile);
  } catch(e){}

  console.log("Starting Chrome in headless mode with fresh profile...");
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--remote-debugging-port=9224', // Use a different port to avoid conflicts
    `--user-data-dir=${profileDir}`,
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
    'http://127.0.0.1:8085/index.html?runMigrationTest=true&headless=true'
  ]);

  chrome.on('error', (err) => {
    console.error("Failed to start Chrome process:", err);
    process.exit(1);
  });

  chrome.stdout.on('data', (data) => console.log(`[Chrome STDOUT] ${data}`));
  chrome.stderr.on('data', (data) => console.error(`[Chrome STDERR] ${data}`));

  chrome.on('exit', (code, signal) => {
    console.log(`Chrome process exited with code ${code} and signal ${signal}`);
  });

  // Get debug targets with retry
  let targets;
  let retries = 5;
  while (retries > 0) {
    try {
      console.log("Fetching debug targets...");
      targets = await getDebugTargets();
      if (targets && targets.length > 0) {
        break;
      }
    } catch (e) {
      console.log(`Failed to fetch targets: ${e.message}. Retrying in 1s...`);
    }
    retries--;
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!targets || targets.length === 0) {
    console.error("Failed to fetch Chrome debug targets after retries.");
    chrome.kill();
    process.exit(1);
  }

  console.log("Targets found:", JSON.stringify(targets, null, 2));
  const target = targets.find(t => t.type === 'page');
  if (!target) {
    console.error("No target of type 'page' found!");
    chrome.kill();
    process.exit(1);
  }
  console.log("Connecting to target WebSocket:", target.webSocketDebuggerUrl);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let commandId = 1;

  function send(method, params = {}) {
    const payload = JSON.stringify({ id: commandId++, method, params });
    ws.send(payload);
  }

  let screenshotCmdId = -1;
  let screenshotPathToSave = '';

  let testTimeout = setTimeout(() => {
    console.error("❌ Test suite timed out after 30 seconds! Capturing CDP screenshot...");
    screenshotPathToSave = '/usr/local/google/home/crsjain/kepler-pokemon-chart/screenshot_migration_timeout.png';
    screenshotCmdId = commandId;
    send('Page.captureScreenshot');

    // Safety timeout: if screenshot doesn't return in 5s, kill and exit anyway
    setTimeout(() => {
      console.error("❌ CDP screenshot capture timed out. Force exiting.");
      try { ws.close(); } catch(e){}
      chrome.kill();
      process.exit(1);
    }, 5000);
  }, 30000);

  let initialized = false;
  let runtimeEnabled = false;
  let pageEnabled = false;
  let networkEnabled = false;

  ws.onopen = () => {
    console.log("WebSocket connected. Enabling events...");
    send('Runtime.enable'); 
    send('Page.enable');    
    send('Network.enable'); 
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    // Log important events
    if (msg.method) {
      console.log(`[CDP Event] ${msg.method}`);
      if (msg.method === 'Network.requestWillBeSent') {
        console.log(`[CDP Network Request] URL: ${msg.params.request.url}`);
      }
      if (msg.method === 'Network.loadingFailed') {
        console.error(`[CDP Network Failed] Request ID: ${msg.params.requestId}, Error: ${msg.params.errorText}, Canceled: ${msg.params.canceled}`);
      }
      if (msg.method === 'Network.responseReceived') {
        console.log(`[CDP Network Response] URL: ${msg.params.response.url}, Status: ${msg.params.response.status}`);
      }
    } else if (msg.id) {
      console.log(`[CDP Response] id=${msg.id}`, JSON.stringify(msg.result || msg.error || {}));
      
      if (msg.id === screenshotCmdId) {
        if (msg.result && msg.result.data) {
          try {
            const buffer = Buffer.from(msg.result.data, 'base64');
            fs.writeFileSync(screenshotPathToSave, buffer);
            console.log(`Screenshot saved to ${screenshotPathToSave}`);
          } catch (e) {
            console.error("Failed to save screenshot file:", e.message);
          }
        } else {
          console.error("Failed to capture screenshot via CDP:", msg.error);
        }
        ws.close();
        chrome.kill();
        process.exit(1);
      }

      if (msg.id === 1) runtimeEnabled = true;
      if (msg.id === 2) pageEnabled = true;
      if (msg.id === 3) networkEnabled = true;
      
      if (runtimeEnabled && pageEnabled && networkEnabled && !initialized) {
        initialized = true;
        console.log("CDP initialized. Navigating to test page...");
        send('Page.navigate', { url: 'http://127.0.0.1:8085/index.html?runMigrationTest=true&headless=true' }); 
      }
      
      // Capture screenshot if navigation fails
      if (msg.id === 4 && (msg.error || (msg.result && msg.result.errorText))) {
        console.log("Navigation failed. Capturing CDP screenshot...");
        screenshotPathToSave = '/usr/local/google/home/crsjain/kepler-pokemon-chart/screenshot_migration_nav_failed.png';
        screenshotCmdId = commandId;
        send('Page.captureScreenshot');
      }
    }

    // Check for console log events
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(arg => arg.value || JSON.stringify(arg)).join(' ');
      console.log("[Browser Console]", args);

      if (args.includes("Migration test passed successfully!")) {
        console.log("✅ Migration Test passed successfully!");
        clearTimeout(testTimeout);
        ws.close();
        chrome.kill();
        process.exit(0);
      }

      if (args.includes("Migration Test Failed") || args.includes("Assert Failed")) {
        console.error("❌ Migration Test failed!");
        clearTimeout(testTimeout);
        ws.close();
        chrome.kill();
        process.exit(1);
      }
    }

    // Capture browser JS crashes
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error("❌ Browser JS Crash occurred!");
      console.error(JSON.stringify(msg.params.exceptionDetails, null, 2));
      clearTimeout(testTimeout);
      ws.close();
      chrome.kill();
      process.exit(1);
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    clearTimeout(testTimeout);
    chrome.kill();
    process.exit(1);
  };
}

function getDebugTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9224/json/list', (res) => { // Use 9224
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
