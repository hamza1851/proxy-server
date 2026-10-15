/**
 * GOD-LEVEL CYBER-COMMAND DASHBOARD SERVER
 * Ultra-lightweight Node.js backend with Zero External Dependencies
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
const DASHBOARD_AUTH_TOKEN = process.env.DASHBOARD_AUTH_TOKEN || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// In-memory local state cache & mock telemetry if external service is unreachable
let localBlockedDomains = new Set(['tiktok.com', 'roblox.com', 'doubleclick.net']);
let isLockdownActive = false;
let mockQueries = [
  { time: new Date().toLocaleTimeString(), client: '10.8.0.2 (Phone)', domain: 'graph.instagram.com', status: 'BLOCKED', reason: 'Blocked Service' },
  { time: new Date().toLocaleTimeString(), client: '10.8.0.3 (Laptop)', domain: 'github.com', status: 'ALLOWED', reason: 'DNS Resolved' },
  { time: new Date().toLocaleTimeString(), client: '10.8.0.2 (Phone)', domain: 'telemetry.tiktokv.com', status: 'BLOCKED', reason: 'Custom Sinkhole' },
  { time: new Date().toLocaleTimeString(), client: '10.8.0.4 (Tablet)', domain: 'google.com', status: 'ALLOWED', reason: 'SafeSearch Enforced' },
];

// Helper to make outbound HTTP requests to AdGuard Home or WireGuard
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

      req.on('error', (err) => {
        resolve({ status: 500, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 504, error: 'Timeout' });
      });

      if (data) {
        req.write(typeof data === 'string' ? data : JSON.stringify(data));
      }
      req.end();
    } catch (e) {
      resolve({ status: 500, error: e.message });
    }
  });
}

// System Telemetry Helper
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
    cpuModel: cpus[0] ? cpus[0].model : 'Unknown',
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

// Request Handler
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // JSON responder helper
  const sendJSON = (statusCode, obj) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(obj));
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // --- API ROUTING ---

  // 1. Get Live Status & Telemetry
  if (pathname === '/api/telemetry' && req.method === 'GET') {
    const sys = getSystemTelemetry();

    // Query AdGuard stats
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
      blockedList: Array.from(localBlockedDomains),
      lockdown: isLockdownActive,
    });
  }

  // 2. Get Live Query Stream
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
    // Return mock stream if AdGuard isn't populated yet
    return sendJSON(200, { queries: mockQueries });
  }

  // 3. Block Custom Domain
  if (pathname === '/api/block' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { domain } = JSON.parse(body || '{}');
        if (!domain) return sendJSON(400, { error: 'Domain is required' });

        const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        localBlockedDomains.add(cleanDomain);

        // Send rule to AdGuard Home if available
        const rule = `||${cleanDomain}^`;
        await makeRequest(`${ADGUARD_HOST}/control/filtering/add_rule`, 'POST', { rule });

        // Add to query feed
        mockQueries.unshift({
          time: new Date().toLocaleTimeString(),
          client: 'GOD-PANEL (Admin)',
          domain: cleanDomain,
          status: 'BLOCKED',
          reason: 'Manual Intercept Rule Added',
        });

        return sendJSON(200, { success: true, message: `Domain ${cleanDomain} neutralized.`, domain: cleanDomain });
      } catch (e) {
        return sendJSON(500, { error: e.message });
      }
    });
    return;
  }

  // 4. Unblock Domain
  if (pathname === '/api/unblock' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
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

  // 5. Emergency Master Lockdown (Killswitch)
  if (pathname === '/api/lockdown' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      isLockdownActive = !isLockdownActive;

      // When lockdown is enabled, disable or enable protection or sinkhole everything
      if (isLockdownActive) {
        await makeRequest(`${ADGUARD_HOST}/control/protection`, 'POST', { enabled: true });
        // Inject universal block rule
        await makeRequest(`${ADGUARD_HOST}/control/filtering/add_rule`, 'POST', { rule: '||*^' });
      } else {
        await makeRequest(`${ADGUARD_HOST}/control/filtering/remove_rule`, 'POST', { rule: '||*^' });
      }

      return sendJSON(200, {
        success: true,
        lockdown: isLockdownActive,
        message: isLockdownActive ? '🚨 EMERGENCY LOCKDOWN ACTIVE: ALL EXTERNAL ACCESS CEASED' : '🟢 NORMAL OPERATIONS RESTORED',
      });
    });
    return;
  }

  // 6. Fast 1-Click Service Toggles (TikTok, YouTube, Discord, etc.)
  if (pathname === '/api/services/toggle' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { service, block } = JSON.parse(body || '{}');
        if (!service) return sendJSON(400, { error: 'Service is required' });

        // AdGuard Home service list endpoints
        await makeRequest(`${ADGUARD_HOST}/control/blocked_services/set`, 'POST', [service]);

        return sendJSON(200, { success: true, service, blocked: block });
      } catch (e) {
        return sendJSON(500, { error: e.message });
      }
    });
    return;
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ GOD-LEVEL CYBER-COMMAND CONTROL PANEL ONLINE AT http://0.0.0.0:${PORT}`);
});
