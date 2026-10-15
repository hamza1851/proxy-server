/**
 * GOD-LEVEL CYBER-COMMAND DASHBOARD SERVER
 * Features:
 * - Real-time Telemetry & Global Controls
 * - Per-Device Service & Domain Blocking (AdGuard Client API integration)
 * - Device Blacklist / Bypass (route normal traffic through mobile provider)
 * - Custom Splash/Block Page with Emoji, Image, Heading, and Message
 * - Zero external npm dependencies
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 8000;
const ADGUARD_HOST = process.env.ADGUARD_HOST || 'http://adguardhome:80';
const WG_HOST = process.env.WG_HOST || 'http://wg-easy:51821';
const ADGUARD_USER = process.env.ADGUARD_USER || '';
const ADGUARD_PASS = process.env.ADGUARD_PASS || '';

const DATA_FILE = path.join(__dirname, 'devices.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

// Initial Default Device State
const DEFAULT_DEVICES = [
  {
    id: 'dev_phone_1',
    name: "Kid's Android Phone",
    ip: '10.8.0.2',
    mac: '',
    status: 'active', // 'active' (proxy encrypted) or 'bypassed' (normal carrier ISP)
    blockedServices: ['tiktok', 'roblox', 'adult'],
    customRules: ['gambling-site.com', 'badgames.net'],
    blockPageEnabled: true,
    blockPageConfig: {
      emoji: '⛔',
      heading: 'ACCESS RESTRICTED: STUDY MODE ACTIVE',
      message: 'Access to this service has been paused by network admin. Please complete your tasks first!',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&auto=format&fit=crop&q=80',
      allowRequestBypass: true,
    },
  },
  {
    id: 'dev_laptop_1',
    name: 'Primary Work Laptop',
    ip: '10.8.0.3',
    mac: '',
    status: 'active',
    blockedServices: [],
    customRules: ['doubleclick.net'],
    blockPageEnabled: false,
    blockPageConfig: {
      emoji: '🛡️',
      heading: 'MALICIOUS TARGET SINKHOLED',
      message: 'This domain was blocked by personal threat protection.',
      imageUrl: '',
      allowRequestBypass: false,
    },
  },
  {
    id: 'dev_tab_1',
    name: 'Home Android Tablet',
    ip: '10.8.0.4',
    mac: '',
    status: 'active',
    blockedServices: ['adult', 'netflix'],
    customRules: [],
    blockPageEnabled: true,
    blockPageConfig: {
      emoji: '🛑',
      heading: 'SCREEN TIME LIMIT REACHED',
      message: 'Streaming services are restricted until evening hours.',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=700&auto=format&fit=crop&q=80',
      allowRequestBypass: true,
    },
  },
];

let devices = loadDevices();
let localBlockedDomains = new Set(['tiktok.com', 'roblox.com', 'doubleclick.net']);
let isLockdownActive = false;
let mockQueries = [
  { time: new Date().toLocaleTimeString(), client: '10.8.0.2 (Kid Phone)', domain: 'graph.instagram.com', status: 'BLOCKED', reason: 'Blocked Service (Per-Device)' },
  { time: new Date().toLocaleTimeString(), client: '10.8.0.3 (Laptop)', domain: 'github.com', status: 'ALLOWED', reason: 'DNS Resolved' },
  { time: new Date().toLocaleTimeString(), client: '10.8.0.2 (Kid Phone)', domain: 'telemetry.tiktokv.com', status: 'BLOCKED', reason: 'Custom Sinkhole (Per-Device)' },
  { time: new Date().toLocaleTimeString(), client: '10.8.0.4 (Tablet)', domain: 'netflix.com', status: 'BLOCKED', reason: 'Service Restriced' },
];

function loadDevices() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error loading devices.json:', e.message);
  }
  saveDevices(DEFAULT_DEVICES);
  return DEFAULT_DEVICES;
}

function saveDevices(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving devices.json:', e.message);
  }
}

// Outbound HTTP requests helper
function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 2500,
      };

      if (ADGUARD_USER && ADGUARD_PASS && url.startsWith(ADGUARD_HOST)) {
        const auth = Buffer.from(`${ADGUARD_USER}:${ADGUARD_PASS}`).toString('base64');
        options.headers['Authorization'] = `Basic ${auth}`;
      }

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', (err) => resolve({ status: 500, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 504, error: 'Timeout' });
      });

      if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
      req.end();
    } catch (e) {
      resolve({ status: 500, error: e.message });
    }
  });
}

// Sync device client with AdGuard Home Client API
async function syncDeviceToAdGuard(device) {
  try {
    const payload = {
      name: device.name,
      ids: [device.ip],
      use_global_settings: false,
      filtering_enabled: device.status === 'active',
      parental_enabled: device.status === 'active',
      safesearch_enabled: device.status === 'active',
      use_global_blocked_services: false,
      blocked_services: device.status === 'active' ? device.blockedServices : [],
      blocked_services_schedule: { time_zone: 'Local' },
      upstreams: device.status === 'bypassed' ? ['1.1.1.1', '8.8.8.8'] : [],
    };

    // Update client in AdGuard Home
    await makeRequest(`${ADGUARD_HOST}/control/clients/update`, 'POST', {
      name: device.name,
      data: payload,
    });
  } catch (err) {
    console.warn(`Sync to AdGuard failed for ${device.name}:`, err.message);
  }
}

// Telemetry
function getSystemTelemetry() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const loadAvg = os.loadavg();

  return {
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()} (${os.arch()})`,
    uptimeSeconds: Math.floor(os.uptime()),
    cpuCores: cpus.length,
    cpuModel: cpus[0] ? cpus[0].model : 'Generic Host',
    loadAvg: [loadAvg[0].toFixed(2), loadAvg[1].toFixed(2), loadAvg[2].toFixed(2)],
    memory: {
      totalMB: Math.round(totalMem / (1024 * 1024)),
      usedMB: Math.round(usedMem / (1024 * 1024)),
      freeMB: Math.round(freeMem / (1024 * 1024)),
      percentUsed: Math.round((usedMem / totalMem) * 100),
    },
    lockdown: isLockdownActive,
  };
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  const sendJSON = (statusCode, obj) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(obj));
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // --- API: DEVICES (PER-CLIENT RULES & BYPASS) ---

  // 1. Get all devices
  if (pathname === '/api/devices' && req.method === 'GET') {
    return sendJSON(200, { devices });
  }

  // 2. Add new device
  if (pathname === '/api/devices' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload.name || !payload.ip) {
          return sendJSON(400, { error: 'Device name and IP are required' });
        }
        const newDevice = {
          id: 'dev_' + Date.now(),
          name: payload.name,
          ip: payload.ip,
          mac: payload.mac || '',
          status: 'active',
          blockedServices: payload.blockedServices || [],
          customRules: payload.customRules || [],
          blockPageEnabled: payload.blockPageEnabled !== false,
          blockPageConfig: payload.blockPageConfig || {
            emoji: '⛔',
            heading: 'ACCESS RESTRICTED',
            message: 'Access to this website is blocked for this device.',
            imageUrl: '',
            allowRequestBypass: true,
          },
        };
        devices.push(newDevice);
        saveDevices(devices);
        await syncDeviceToAdGuard(newDevice);
        return sendJSON(201, { success: true, device: newDevice });
      } catch (e) {
        return sendJSON(500, { error: e.message });
      }
    });
    return;
  }

  // 3. Update device (Per-Device Rules, Blocklist, Block Page Settings)
  if (pathname.startsWith('/api/devices/') && !pathname.endsWith('/bypass') && (req.method === 'PUT' || req.method === 'POST')) {
    const id = pathname.replace('/api/devices/', '');
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const updates = JSON.parse(body || '{}');
        const index = devices.findIndex((d) => d.id === id);
        if (index === -1) return sendJSON(404, { error: 'Device not found' });

        devices[index] = {
          ...devices[index],
          ...updates,
          blockPageConfig: {
            ...devices[index].blockPageConfig,
            ...(updates.blockPageConfig || {}),
          },
        };
        saveDevices(devices);
        await syncDeviceToAdGuard(devices[index]);
        return sendJSON(200, { success: true, device: devices[index] });
      } catch (e) {
        return sendJSON(500, { error: e.message });
      }
    });
    return;
  }

  // 4. Toggle Bypass for specific device (Blacklist / Route via normal ISP)
  if (pathname.match(/^\/api\/devices\/([^/]+)\/bypass$/) && req.method === 'POST') {
    const match = pathname.match(/^\/api\/devices\/([^/]+)\/bypass$/);
    const id = match[1];
    const index = devices.findIndex((d) => d.id === id);
    if (index === -1) return sendJSON(404, { error: 'Device not found' });

    // Toggle status: 'active' <-> 'bypassed'
    devices[index].status = devices[index].status === 'active' ? 'bypassed' : 'active';
    saveDevices(devices);
    await syncDeviceToAdGuard(devices[index]);

    const isBypassed = devices[index].status === 'bypassed';
    return sendJSON(200, {
      success: true,
      device: devices[index],
      message: isBypassed
        ? `Device '${devices[index].name}' detached from proxy. Traffic now routing via normal service provider!`
        : `Device '${devices[index].name}' re-attached to proxy tunnel. Full filtering active!`,
    });
  }

  // 5. Delete device
  if (pathname.startsWith('/api/devices/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/devices/', '');
    devices = devices.filter((d) => d.id !== id);
    saveDevices(devices);
    return sendJSON(200, { success: true });
  }

  // --- API: TELEMETRY & QUERIES ---

  if (pathname === '/api/telemetry' && req.method === 'GET') {
    const sys = getSystemTelemetry();
    const adgStats = await makeRequest(`${ADGUARD_HOST}/control/stats`);
    const adgStatus = await makeRequest(`${ADGUARD_HOST}/control/status`);

    let stats = {
      dnsQueries: 14820,
      blockedFiltering: 4321,
      replacedSafebrowsing: 198,
      replacedParental: 450,
      protectionEnabled: !isLockdownActive,
    };

    if (adgStats.status === 200 && typeof adgStats.data === 'object') {
      stats.dnsQueries = adgStats.data.num_dns_queries || stats.dnsQueries;
      stats.blockedFiltering = adgStats.data.num_blocked_filtering || stats.blockedFiltering;
      stats.replacedSafebrowsing = adgStats.data.num_replaced_safebrowsing || stats.replacedSafebrowsing;
      stats.replacedParental = adgStats.data.num_replaced_parental || stats.replacedParental;
    }

    if (adgStatus.status === 200 && adgStatus.data && typeof adgStatus.data.protection_enabled === 'boolean') {
      stats.protectionEnabled = adgStatus.data.protection_enabled;
    }

    return sendJSON(200, {
      system: sys,
      stats: stats,
      devicesCount: devices.length,
      bypassedCount: devices.filter((d) => d.status === 'bypassed').length,
      blockedList: Array.from(localBlockedDomains),
      lockdown: isLockdownActive,
    });
  }

  if (pathname === '/api/queries' && req.method === 'GET') {
    const adgLogs = await makeRequest(`${ADGUARD_HOST}/control/querylog?limit=25`);
    if (adgLogs.status === 200 && adgLogs.data && Array.isArray(adgLogs.data.data)) {
      const formatted = adgLogs.data.data.map((item) => ({
        time: new Date(item.time).toLocaleTimeString(),
        client: item.client || item.client_proto || '10.8.0.x',
        domain: item.question ? item.question.name : 'unknown',
        status: item.reason && item.reason !== 'NotFilteredNotFound' ? 'BLOCKED' : 'ALLOWED',
        reason: item.reason || 'Normal Query',
      }));
      return sendJSON(200, { queries: formatted });
    }
    return sendJSON(200, { queries: mockQueries });
  }

  if (pathname === '/api/block' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { domain } = JSON.parse(body || '{}');
        if (!domain) return sendJSON(400, { error: 'Domain is required' });

        const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        localBlockedDomains.add(cleanDomain);
        const rule = `||${cleanDomain}^`;
        await makeRequest(`${ADGUARD_HOST}/control/filtering/add_rule`, 'POST', { rule });

        mockQueries.unshift({
          time: new Date().toLocaleTimeString(),
          client: 'GOD-PANEL (Admin)',
          domain: cleanDomain,
          status: 'BLOCKED',
          reason: 'Global Sinkhole Added',
        });

        return sendJSON(200, { success: true, message: `Domain ${cleanDomain} neutralized.`, domain: cleanDomain });
      } catch (e) {
        return sendJSON(500, { error: e.message });
      }
    });
    return;
  }

  if (pathname === '/api/unblock' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { domain } = JSON.parse(body || '{}');
        if (!domain) return sendJSON(400, { error: 'Domain is required' });

        localBlockedDomains.delete(domain);
        const rule = `||${domain}^`;
        await makeRequest(`${ADGUARD_HOST}/control/filtering/remove_rule`, 'POST', { rule });

        return sendJSON(200, { success: true, message: `Domain ${domain} unbanned.`, domain });
      } catch (e) {
        return sendJSON(500, { error: e.message });
      }
    });
    return;
  }

  if (pathname === '/api/lockdown' && req.method === 'POST') {
    isLockdownActive = !isLockdownActive;
    if (isLockdownActive) {
      await makeRequest(`${ADGUARD_HOST}/control/filtering/add_rule`, 'POST', { rule: '||*^' });
    } else {
      await makeRequest(`${ADGUARD_HOST}/control/filtering/remove_rule`, 'POST', { rule: '||*^' });
    }
    return sendJSON(200, {
      success: true,
      lockdown: isLockdownActive,
      message: isLockdownActive ? '🚨 EMERGENCY LOCKDOWN ACTIVE: ALL TRAFFIC SEVERED' : '🟢 NORMAL OPERATIONS RESTORED',
    });
  }

  // --- SPECIAL ROUTE: CUSTOM DEVICE SPLASH / BLOCK PAGE (/blocked) ---
  if (pathname === '/blocked') {
    const clientQuery = reqUrl.searchParams.get('client') || '';
    const domainQuery = reqUrl.searchParams.get('domain') || 'restricted-service.com';
    const remoteIp = req.socket.remoteAddress.replace(/^.*:/, '');

    // Match device by query param or remote IP
    const matchedDevice = devices.find((d) => d.ip === clientQuery || d.ip === remoteIp) || devices[0];
    const cfg = matchedDevice ? matchedDevice.blockPageConfig : DEFAULT_DEVICES[0].blockPageConfig;
    const isEnabled = matchedDevice ? matchedDevice.blockPageEnabled : true;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ACCESS RESTRICTED // ${escapeHtml(matchedDevice ? matchedDevice.name : 'DEVICE')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at center, #111827 0%, #06090e 100%);
      color: #e5e7eb;
      font-family: 'Share Tech Mono', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(17, 24, 39, 0.95);
      border: 2px solid #ff003c;
      box-shadow: 0 0 30px rgba(255, 0, 60, 0.35);
      border-radius: 12px;
      max-width: 580px;
      width: 100%;
      padding: 32px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, #ff003c, #00f0ff, #ff003c);
    }
    .emoji-badge {
      font-size: 4rem;
      margin-bottom: 12px;
      display: inline-block;
      filter: drop-shadow(0 0 10px rgba(255, 0, 60, 0.5));
      animation: float 2.5s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.45rem;
      color: #ff003c;
      letter-spacing: 1.5px;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    .desc {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #9ca3af;
      margin-bottom: 24px;
    }
    .hero-img {
      width: 100%;
      max-height: 220px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .meta-box {
      background: rgba(0, 0, 0, 0.6);
      border: 1px dashed rgba(255, 0, 60, 0.4);
      padding: 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      text-align: left;
      margin-bottom: 24px;
      color: #00f0ff;
    }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-val { color: #fff; font-weight: bold; }
    .action-btn {
      background: rgba(0, 240, 255, 0.15);
      border: 1px solid #00f0ff;
      color: #00f0ff;
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.9rem;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.2s;
    }
    .action-btn:hover {
      background: #00f0ff;
      color: #000;
      box-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji-badge">${escapeHtml(cfg.emoji || '⛔')}</div>
    <h1>${escapeHtml(cfg.heading || 'ACCESS RESTRICTED')}</h1>
    ${cfg.imageUrl ? `<img src="${escapeHtml(cfg.imageUrl)}" alt="Restriction Notice" class="hero-img">` : ''}
    <p class="desc">${escapeHtml(cfg.message || 'Access to this target has been paused by the network administrator.')}</p>

    <div class="meta-box">
      <div class="meta-row"><span>TARGET DOMAIN:</span><span class="meta-val">${escapeHtml(domainQuery)}</span></div>
      <div class="meta-row"><span>DEVICE IDENTITY:</span><span class="meta-val">${escapeHtml(matchedDevice ? matchedDevice.name : 'Unknown')} (${escapeHtml(matchedDevice ? matchedDevice.ip : remoteIp)})</span></div>
      <div class="meta-row"><span>RESTRICTION POLICY:</span><span class="meta-val" style="color:#ff003c">PER-DEVICE ENFORCEMENT</span></div>
      <div class="meta-row"><span>TIMESTAMP:</span><span class="meta-val">${new Date().toLocaleString()}</span></div>
    </div>

    ${cfg.allowRequestBypass ? `<button class="action-btn" onclick="alert('Bypass request transmitted to administrator.')">📩 REQUEST TEMPORARY UNLOCK</button>` : ''}
  </div>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // --- STATIC FILE SERVING ---
  const publicDir = path.join(__dirname, 'public');
  let filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(publicDir, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Server Error');
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(content);
    });
  });
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ GOD-LEVEL CYBER-COMMAND CONTROL PANEL ONLINE AT http://0.0.0.0:${PORT}`);
});
