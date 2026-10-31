const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// Usage:
//   node run_headless_tests.js                 full suite (the gate before reporting done)
//   node run_headless_tests.js 128             only Test Case 128 (plus the always-run setup prefix)
//   node run_headless_tests.js 120-125,128     ranges and lists; --only=... also works
//   node run_headless_tests.js --verbose       log every passing assert, app console line and network request
//
// Quiet by default: prints test-case progress, warnings/errors, the summary, and on
// failure the last browser console lines for context.
const argv = process.argv.slice(2);
const VERBOSE = argv.includes('--verbose');
const onlyArg = argv
  .map(a => (a.startsWith('--only=') ? a.slice('--only='.length) : a))
  .filter(a => /^[\d,\s-]+$/.test(a))
  .join(',');
if (onlyArg && !/^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(onlyArg)) {
  console.error(`Invalid test filter "${onlyArg}". Use e.g. 128 or 120-125,128.`);
  process.exit(2);
}

// Watchdogs. A single 60 s cap for the whole suite started failing healthy runs as
// the suite grew and the cloudtop got busy, so the limit is now on *progress*: each
// test case must start within STALL_MS of the previous one (the slowest take ~2 s).
const BOOT_TIMEOUT_MS = 30000;   // harness start → first test case
const STALL_TIMEOUT_MS = 20000;  // between consecutive test cases
const HARD_TIMEOUT_MS = 180000;  // absolute cap for the whole run

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
  const startedAt = Date.now();
  const authFile = '/tmp/xauth-kepler-test';
  try {
    if (fs.existsSync(authFile)) fs.unlinkSync(authFile);
  } catch(e){}

  console.log(`Starting headless Chrome${onlyArg ? ` (only=${onlyArg})` : ''}...`);
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--ignore-certificate-errors',
    '--allow-insecure-localhost',
    '--disable-extensions',
    '--disable-features=HttpsUpgrades,NetworkChangeNotifier',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-proxy-server',
    'about:blank'
  ]);

  chrome.on('error', (err) => {
    console.error("Failed to start Chrome process:", err);
    process.exit(1);
  });

  if (VERBOSE) {
    chrome.stdout.on('data', (data) => console.log(`[Chrome STDOUT] ${data}`));
    chrome.stderr.on('data', (data) => console.error(`[Chrome STDERR] ${data}`));
    chrome.on('exit', (code, signal) => {
      console.log(`Chrome process exited with code ${code} and signal ${signal}`);
    });
  } else {
    // Drain the pipes so Chrome never blocks on a full buffer.
    chrome.stdout.resume();
    chrome.stderr.resume();
  }

  // Get debug targets with retry
  let targets;
  let retries = 100;
  while (retries > 0) {
    try {
      targets = await getDebugTargets();
      if (targets && targets.length > 0) {
        break;
      }
    } catch (e) {
      // Chrome has not bound the debug port yet; retry rapidly.
    }
    retries--;
    await new Promise(r => setTimeout(r, 100));
  }

  if (!targets || targets.length === 0) {
    console.error("Failed to fetch Chrome debug targets after retries.");
    chrome.kill();
    process.exit(1);
  }

  const target = targets.find(t => t.type === 'page');
  if (!target) {
    console.error("No target of type 'page' found!");
    chrome.kill();
    process.exit(1);
  }
  if (VERBOSE) console.log("Connecting to target WebSocket:", target.webSocketDebuggerUrl);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let commandId = 1;

  function send(method, params = {}) {
    const id = commandId++;
    ws.send(JSON.stringify({ id, method, params }));
    return id;
  }

  // Recent browser console lines, dumped on failure so quiet mode keeps its context.
  const recentLines = [];
  const RECENT_LIMIT = 40;
  function remember(line) {
    recentLines.push(line);
    if (recentLines.length > RECENT_LIMIT) recentLines.shift();
  }
  function dumpRecent() {
    if (VERBOSE || recentLines.length === 0) return;
    console.error(`--- last ${recentLines.length} browser console lines ---`);
    recentLines.forEach(l => console.error(l));
    console.error('--- end ---');
  }

  // Per-test timings (wall clock between "Running Test Case" markers).
  const timings = [];
  let currentTest = null;
  let currentTestStartedAt = 0;
  function markTest(label) {
    const now = Date.now();
    if (currentTest) timings.push([currentTest, now - currentTestStartedAt]);
    currentTest = label;
    currentTestStartedAt = now;
  }
  function printSummary(passed) {
    markTest(null);
    const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
    const slowest = [...timings].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([t, ms]) => `TC${t} ${(ms / 1000).toFixed(1)}s`).join(', ');
    console.log(`${passed ? '✅' : '❌'} ${passed ? 'Passed' : 'Failed'} in ${secs}s` +
      (slowest ? ` · slowest: ${slowest}` : ''));
  }

  let screenshotCmdId = -1;
  let screenshotPathToSave = '';

  function failWithScreenshot(reason) {
    console.error(`❌ ${reason} Capturing CDP screenshot...`);
    dumpRecent();
    screenshotPathToSave = '/usr/local/google/home/crsjain/kepler-pokemon-chart/screenshot_timeout.png';
    screenshotCmdId = send('Page.captureScreenshot');

    // Safety timeout: if screenshot doesn't return in 5s, kill and exit anyway
    setTimeout(() => {
      console.error("❌ CDP screenshot capture timed out. Force exiting.");
      try { ws.close(); } catch(e){}
      chrome.kill();
      process.exit(1);
    }, 5000);
  }

  let stallTimer = null;
  function armStallTimer(ms, what) {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      failWithScreenshot(`No progress for ${ms / 1000}s ${what}.`);
    }, ms);
  }
  armStallTimer(BOOT_TIMEOUT_MS, 'before the first test case started');
  const hardTimer = setTimeout(() => {
    failWithScreenshot(`Test suite exceeded the ${HARD_TIMEOUT_MS / 1000}s hard cap.`);
  }, HARD_TIMEOUT_MS);

  function finish(code) {
    clearTimeout(stallTimer);
    clearTimeout(hardTimer);
    try { ws.close(); } catch(e){}
    chrome.kill();
    process.exit(code);
  }

  let initialized = false;
  const pendingEnables = new Set();
  let navigateCmdId = -1;

  ws.onopen = () => {
    if (VERBOSE) console.log("WebSocket connected. Enabling events...");
    pendingEnables.add(send('Runtime.enable'));
    pendingEnables.add(send('Page.enable'));
    // The Network domain only feeds verbose logging. It used to stream thousands
    // of request/response events into every run, so it's off by default.
    if (VERBOSE) pendingEnables.add(send('Network.enable'));
    pendingEnables.add(send('Fetch.enable', { patterns: [{ urlPattern: '*raw.githubusercontent.com*' }] }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    // Intercept and mock raw.githubusercontent.com requests (PokeAPI sprites)
    if (msg.method === 'Fetch.requestPaused') {
      const requestId = msg.params.requestId;
      const base64Body = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent GIF
      send('Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: 'image/gif' },
          { name: 'Access-Control-Allow-Origin', value: '*' }
        ],
        body: base64Body
      });
      return;
    }

    if (msg.method && VERBOSE) {
      console.log(`[CDP Event] ${msg.method}`);
      if (msg.method === 'Network.requestWillBeSent') {
        console.log(`[CDP Network Request] URL: ${msg.params.request.url}`);
      }
      if (msg.method === 'Network.responseReceived') {
        console.log(`[CDP Network Response] URL: ${msg.params.response.url}, Status: ${msg.params.response.status}`);
      }
    }
    if (msg.method === 'Network.loadingFailed') {
      console.error(`[CDP Network Failed] Request ID: ${msg.params.requestId}, Error: ${msg.params.errorText}, Canceled: ${msg.params.canceled}`);
    }

    if (msg.id) {
      if (VERBOSE) console.log(`[CDP Response] id=${msg.id}`, JSON.stringify(msg.result || msg.error || {}).slice(0, 300));

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
        finish(1);
      }

      pendingEnables.delete(msg.id);
      if (pendingEnables.size === 0 && !initialized) {
        initialized = true;
        const query = `runTests=true&headless=true${onlyArg ? `&only=${onlyArg}` : ''}${VERBOSE ? '&verbose=true' : ''}`;
        if (VERBOSE) console.log("CDP initialized. Navigating to test page...");
        navigateCmdId = send('Page.navigate', { url: `http://127.0.0.1:8000/index.html?${query}` });
      }

      // Capture screenshot if navigation fails
      if (msg.id === navigateCmdId && (msg.error || (msg.result && msg.result.errorText))) {
        console.log("Navigation failed (is `python3 -m http.server 8000` running?). Capturing CDP screenshot...");
        screenshotPathToSave = '/usr/local/google/home/crsjain/kepler-pokemon-chart/screenshot.png';
        screenshotCmdId = send('Page.captureScreenshot');
      }
    }

    // Check for console log events
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(arg => arg.value || JSON.stringify(arg)).join(' ');
      const type = msg.params.type;
      const testMatch = args.match(/Running Test Case (\w+)/);

      if (testMatch) {
        markTest(testMatch[1]);
        armStallTimer(STALL_TIMEOUT_MS, `after Test Case ${testMatch[1]} started`);
      }

      if (VERBOSE) {
        console.log("[Browser Console]", args);
      } else {
        remember(`[${type}] ${args}`);
        if (testMatch) {
          console.log(`▶ ${args.length > 110 ? args.slice(0, 110) + '…' : args}`);
        } else if (type === 'error' || type === 'warning' || args.includes('📊')) {
          console.log(`[Browser ${type}]`, args);
        }
      }

      if (args.includes("All regression tests passed successfully!")) {
        printSummary(true);
        finish(0);
      }

      if (args.includes("Test Suite Failed") || args.includes("Assert Failed")) {
        console.error(`❌ Tests failed${currentTest ? ` in Test Case ${currentTest}` : ''}!`);
        dumpRecent();
        printSummary(false);
        finish(1);
      }
    }

    // Capture browser JS crashes
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error("❌ Browser JS Crash occurred!");
      console.error(JSON.stringify(msg.params.exceptionDetails, null, 2));
      dumpRecent();
      finish(1);
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    finish(1);
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
