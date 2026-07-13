const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// Clean profile dir if exists to guarantee fresh load
const profileDir = '/tmp/kepler-chrome-headless-test';
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

  console.log("Starting Chrome in virtual Xvfb display with fresh profile...");
  const chrome = spawn('xvfb-run', [
    '--auth-file=' + authFile,
    '--server-num=99',
    '--server-args=-screen 0 1024x768x24',
    'google-chrome',
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-sandbox',
    '--ignore-certificate-errors',
    '--allow-insecure-localhost',
    '--disable-extensions',
    '--disable-features=HttpsUpgrades',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
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

  let testTimeout = setTimeout(() => {
    console.error("❌ Test suite timed out after 30 seconds!");
    ws.close();
    chrome.kill();
    process.exit(1);
  }, 30000);

  let initialized = false;
  let runtimeEnabled = false;
  let pageEnabled = false;

  ws.onopen = () => {
    console.log("WebSocket connected. Enabling events...");
    send('Runtime.enable'); // Will have ID 1
    send('Page.enable');    // Will have ID 2
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    // Log important events
    if (msg.method) {
      console.log(`[CDP Event] ${msg.method}`);
    } else if (msg.id) {
      console.log(`[CDP Response] id=${msg.id}`, JSON.stringify(msg.result || msg.error || {}));
      
      if (msg.id === 1) runtimeEnabled = true;
      if (msg.id === 2) pageEnabled = true;
      
      if (runtimeEnabled && pageEnabled && !initialized) {
        initialized = true;
        console.log("CDP initialized. Navigating to test page...");
        send('Page.navigate', { url: 'http://127.0.0.1:8080/index.html?runTests=true&headless=true' });
      }
      
      // Capture screenshot if navigation fails
      if (msg.id === 3 && (msg.error || (msg.result && msg.result.errorText))) {
        console.log("Navigation failed. Capturing screenshot in 2s...");
        setTimeout(() => {
          try {
            console.log("Capturing screenshot of virtual display :99...");
            const screenshotPath = '/usr/local/google/home/crsjain/kepler-pokemon-chart/screenshot.png';
            const capturer = spawn('import', ['-display', ':99', '-window', 'root', screenshotPath], {
              env: { ...process.env, XAUTHORITY: authFile, DISPLAY: ':99' }
            });
            capturer.stdout.on('data', (d) => console.log(`[Import STDOUT] ${d}`));
            capturer.stderr.on('data', (d) => console.error(`[Import STDERR] ${d}`));
            capturer.on('close', (code) => {
              console.log(`Screenshot capture completed with exit code ${code}. Saved to ${screenshotPath}`);
              ws.close();
              chrome.kill();
              process.exit(1);
            });
          } catch (e) {
            console.error("Failed to capture screenshot:", e.message);
            ws.close();
            chrome.kill();
            process.exit(1);
          }
        }, 2000);
      }
    }

    // Check for console log events
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(arg => arg.value || JSON.stringify(arg)).join(' ');
      console.log("[Browser Console]", args);

      if (args.includes("All regression tests passed successfully!")) {
        console.log("✅ Tests passed successfully!");
        clearTimeout(testTimeout);
        ws.close();
        chrome.kill();
        process.exit(0);
      }

      if (args.includes("Test Suite Failed") || args.includes("Assert Failed")) {
        console.error("❌ Tests failed!");
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
    http.get('http://127.0.0.1:9223/json/list', (res) => {
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
