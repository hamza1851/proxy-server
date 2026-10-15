/**
 * GOD-LEVEL CYBER-COMMAND HUD CONTROLLER (v3.0)
 * Real-time Telemetry, Per-Device Restrictions, Device Blacklist/Bypass, and Live Splash Page WYSIWYG
 */

// --- TACTICAL SOUND SYNTHESIZER ---
class CyberAudio {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playBeep(freq = 800, duration = 0.06, type = 'sine') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {}
  }
}

const audio = new CyberAudio();

// --- MATRIX DIGITAL RAIN CANVAS ---
function initMatrixCanvas() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const letters = '010101ABCDEFXYZ$%#@*&+-/<>';
  const fontSize = 14;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array(columns).fill(1);

  function draw() {
    ctx.fillStyle = 'rgba(7, 9, 14, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00f0ff';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = letters.charAt(Math.floor(Math.random() * letters.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  setInterval(draw, 45);
}

// --- STATE MANAGEMENT ---
let telemetryData = null;
let activeFilter = 'all';
let allQueries = [];
let devices = [];
let activeDeviceId = null;

// Global service toggles
let globalTargetStates = {
  tiktok: true,
  youtube: false,
  instagram: false,
  discord: false,
  roblox: true,
  steam: false,
  reddit: false,
  netflix: false,
  adult: true,
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initMatrixCanvas();
  setupClock();
  setupDynamicLinks();
  bindUIEvents();
  fetchTelemetry();
  fetchQueries();
  fetchDevices();

  setInterval(fetchTelemetry, 3500);
  setInterval(fetchQueries, 2500);
});

function setupClock() {
  const el = document.getElementById('live-time');
  function tick() {
    const d = new Date();
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    if (el) el.textContent = `${d.toTimeString().split(' ')[0]}.${ms}`;
  }
  setInterval(tick, 50);
}

function setupDynamicLinks() {
  const host = window.location.hostname;
  const linkWg = document.getElementById('link-wg');
  const linkAdg = document.getElementById('link-adg');
  const modalWg = document.getElementById('modal-wg-url');
  const modalOpenWg = document.getElementById('modal-open-wg');

  if (linkWg) linkWg.href = `http://${host}:51821`;
  if (linkAdg) linkAdg.href = `http://${host}:8080`;
  if (modalWg) modalWg.textContent = `http://${host}:51821`;
  if (modalOpenWg) modalOpenWg.href = `http://${host}:51821`;
}

// --- EVENT BINDINGS ---
function bindUIEvents() {
  // Navigation Tabs (Global Radar vs Device Manager)
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      audio.playBeep(700);
      document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Audio Toggle
  document.getElementById('toggle-audio').addEventListener('click', () => {
    audio.enabled = !audio.enabled;
    document.getElementById('audio-state').textContent = audio.enabled ? 'ON' : 'OFF';
    audio.playBeep(900);
  });

  // CRT Scanline Toggle
  document.getElementById('toggle-crt').addEventListener('click', () => {
    document.body.classList.toggle('crt-enabled');
    const enabled = document.body.classList.contains('crt-enabled');
    document.getElementById('crt-state').textContent = enabled ? 'ON' : 'OFF';
    audio.playBeep(600);
  });

  // Master Killswitch
  document.getElementById('lockdown-btn').addEventListener('click', triggerLockdown);

  // Global Target Matrix Nodes
  document.querySelectorAll('.target-panel .target-node').forEach((node) => {
    const tgt = node.dataset.target;
    if (globalTargetStates[tgt]) {
      node.classList.add('blocked');
      node.querySelector('.node-status').textContent = 'RESTRICTED';
    }
    node.addEventListener('click', () => toggleGlobalTarget(tgt, node));
  });

  // Global Sinkhole Form
  const blockForm = document.getElementById('block-form');
  const domainInput = document.getElementById('domain-input');
  blockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const domain = domainInput.value.trim();
    if (!domain) return;
    audio.playBeep(1100, 0.1);
    await blockGlobalDomain(domain);
    domainInput.value = '';
  });

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.playBeep(700);
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderQueries();
    });
  });

  // Device Subtabs (Rules vs Splash Designer)
  document.querySelectorAll('.subtab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.playBeep(650);
      document.querySelectorAll('.subtab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.subtab-content').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.subtab);
      if (target) target.classList.add('active');
    });
  });

  // Device Bypass / Detach Button
  const bypassBtn = document.getElementById('bypass-toggle-btn');
  bypassBtn.addEventListener('click', toggleDeviceBypass);

  // Curfew / Freeze Buttons
  document.querySelectorAll('.freeze-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const minutes = parseInt(btn.dataset.minutes, 10);
      const reason = btn.dataset.reason;
      freezeDevice(minutes, reason);
    });
  });

  const unfreezeBtn = document.getElementById('unfreeze-btn');
  if (unfreezeBtn) {
    unfreezeBtn.addEventListener('click', () => freezeDevice(0, ''));
  }

  // Global Device Stream Filter Dropdown
  const globalDevFilter = document.getElementById('global-device-filter');
  if (globalDevFilter) {
    globalDevFilter.addEventListener('change', (e) => {
      audio.playBeep(650);
      fetchQueries(e.target.value);
    });
  }

  // Per-Device Service Nodes
  document.querySelectorAll('.dev-target').forEach((node) => {
    node.addEventListener('click', () => toggleDeviceService(node.dataset.target, node));
  });

  // Per-Device Custom Domain Form
  const devBlockForm = document.getElementById('device-block-form');
  const devDomainInput = document.getElementById('device-domain-input');
  devBlockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const domain = devDomainInput.value.trim();
    if (!domain) return;
    addDeviceCustomRule(domain);
    devDomainInput.value = '';
  });

  // Splash Page Live Inputs -> Sync Mockup in Real Time
  ['splash-emoji-input', 'splash-heading-input', 'splash-msg-input', 'splash-img-input'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateMockupLive);
  });

  // Save Splash Settings Button
  document.getElementById('save-splash-btn').addEventListener('click', saveSplashSettings);

  // Add Device Modal
  const addDevBtn = document.getElementById('add-device-btn');
  const newDevModal = document.getElementById('new-device-modal');
  const closeNewDevBtn = document.getElementById('close-new-dev-btn');
  const newDevForm = document.getElementById('new-device-form');

  addDevBtn.addEventListener('click', () => {
    audio.playBeep(800);
    newDevModal.classList.remove('hidden');
  });
  closeNewDevBtn.addEventListener('click', () => newDevModal.classList.add('hidden'));
  newDevForm.addEventListener('submit', handleAddDeviceSubmit);

  // QR Modal
  document.getElementById('show-qr-btn').addEventListener('click', () => {
    audio.playBeep(850);
    document.getElementById('qr-modal').classList.remove('hidden');
  });
  document.getElementById('close-qr-btn').addEventListener('click', () => {
    document.getElementById('qr-modal').classList.add('hidden');
  });

  // Bottom CLI Input
  document.getElementById('cli-input').addEventListener('keydown', handleCliInput);
}

// --- DEVICE MANAGEMENT API & CONTROLLERS ---
async function fetchDevices() {
  try {
    const res = await fetch('/api/devices');
    const data = await res.json();
    devices = data.devices || [];

    if (!activeDeviceId && devices.length > 0) {
      activeDeviceId = devices[0].id;
    }
    renderDeviceRoster();
    renderActiveDeviceView();
  } catch (err) {
    console.warn('Error fetching devices', err);
  }
}

function renderDeviceRoster() {
  const roster = document.getElementById('device-roster-list');
  if (!roster) return;

  roster.innerHTML = devices
    .map((dev) => {
      const isSelected = dev.id === activeDeviceId;
      const isBypassed = dev.status === 'bypassed';
      const statusClass = isBypassed ? 'bypassed' : 'active';
      const statusText = isBypassed ? 'BYPASSED (ISP)' : 'PROXY ACTIVE';

      return `
      <div class="device-item ${isSelected ? 'active' : ''}" onclick="selectDevice('${dev.id}')">
        <div class="dev-info-col">
          <h4>${escapeHtml(dev.name)}</h4>
          <span>${escapeHtml(dev.ip)}</span>
        </div>
        <span class="dev-status-tag ${statusClass}">${statusText}</span>
      </div>
    `;
    })
    .join('');
}

function selectDevice(id) {
  audio.playBeep(750);
  activeDeviceId = id;
  renderDeviceRoster();
  renderActiveDeviceView();
}

function getActiveDevice() {
  return devices.find((d) => d.id === activeDeviceId) || devices[0];
}

function renderActiveDeviceView() {
  const dev = getActiveDevice();
  if (!dev) return;

  // Title and IP
  document.getElementById('active-device-name').textContent = dev.name;
  document.getElementById('active-device-ip').textContent = `IP: ${dev.ip}`;

  // Bypass Button State
  const bypassBtn = document.getElementById('bypass-toggle-btn');
  const bypassText = document.getElementById('bypass-btn-text');
  if (dev.status === 'bypassed') {
    bypassBtn.classList.add('is-bypassed');
    bypassText.textContent = '🟢 RE-ATTACH TO PROXY TUNNEL';
  } else {
    bypassBtn.classList.remove('is-bypassed');
    bypassText.textContent = '⚡ BYPASS PROXY (USE NORMAL CARRIER)';
  }

  // Populate Global Device Filter Dropdown if not populated
  const globalFilterSelect = document.getElementById('global-device-filter');
  if (globalFilterSelect && globalFilterSelect.options.length <= 1) {
    devices.forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d.ip;
      opt.textContent = `${d.name} [${d.ip}]`;
      globalFilterSelect.appendChild(opt);
    });
  }

  // Render User Monitoring Stats
  const stats = dev.stats || { totalQueries: 0, blockedQueries: 0, blockRate: '0%' };
  document.getElementById('user-stat-queries').textContent = Number(stats.totalQueries).toLocaleString();
  document.getElementById('user-stat-blocked').textContent = Number(stats.blockedQueries).toLocaleString();
  document.getElementById('user-stat-rate').textContent = `EFFICIENCY: ${stats.blockRate}`;

  const statusEl = document.getElementById('user-stat-status');
  const statusSubEl = document.getElementById('user-stat-status-sub');
  if (dev.status === 'paused') {
    statusEl.textContent = '⏸️ FROZEN (CURFEW)';
    statusEl.style.color = 'var(--neon-red)';
    statusSubEl.textContent = dev.curfew?.reason || 'CURFEW ACTIVE';
  } else if (dev.status === 'bypassed') {
    statusEl.textContent = '⚡ BYPASSED';
    statusEl.style.color = 'var(--neon-amber)';
    statusSubEl.textContent = 'ROUTING DIRECT VIA CARRIER';
  } else {
    statusEl.textContent = 'ONLINE';
    statusEl.style.color = 'var(--neon-green)';
    statusSubEl.textContent = 'ENCRYPTED & PROTECTED';
  }

  document.getElementById('user-stat-safesearch').textContent = dev.safeSearch !== false ? 'ENFORCED' : 'OFF';

  // Render Top Domains for this user
  renderUserTopDomains(dev.topDomains || []);

  // Render User Specific Query Stream
  renderUserQueries(dev);

  // Per-Device Service Targets
  const blockedServices = dev.blockedServices || [];
  document.querySelectorAll('.dev-target').forEach((node) => {
    const tgt = node.dataset.target;
    const isBlocked = blockedServices.includes(tgt);
    const statusEl = node.querySelector('.node-status');
    if (isBlocked) {
      node.classList.add('blocked');
      statusEl.textContent = 'RESTRICTED';
    } else {
      node.classList.remove('blocked');
      statusEl.textContent = 'ALLOWED';
    }
  });

  // Per-Device Custom Domain Chips
  renderDeviceCustomChips(dev.customRules || []);

  // Splash Settings Fields
  const cfg = dev.blockPageConfig || {};
  document.getElementById('splash-enabled-toggle').checked = dev.blockPageEnabled !== false;
  document.getElementById('splash-emoji-input').value = cfg.emoji || '⛔';
  document.getElementById('splash-heading-input').value = cfg.heading || 'ACCESS RESTRICTED';
  document.getElementById('splash-msg-input').value = cfg.message || '';
  document.getElementById('splash-img-input').value = cfg.imageUrl || '';

  // Update Live Preview Mockup
  updateMockupLive();

  // Update Live Preview Tab Link
  document.getElementById('preview-tab-btn').href = `/blocked?client=${dev.ip}`;
}

// Render Top Domains
function renderUserTopDomains(domains) {
  const container = document.getElementById('user-top-domains');
  if (!container) return;

  if (!domains || domains.length === 0) {
    container.innerHTML = '<span style="color:var(--text-muted); font-size:0.75rem;">No recent domain telemetry for this user.</span>';
    return;
  }

  container.innerHTML = domains
    .map((d) => {
      const isBlocked = d.status === 'BLOCKED';
      const badge = isBlocked
        ? `<span class="status-badge blocked">BLOCKED</span>`
        : `<span class="status-badge allowed">ALLOWED</span>`;
      return `
      <div class="domain-row">
        <span class="domain-name">${escapeHtml(d.domain)}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="domain-hits">${d.count} hits</span>
          ${badge}
        </div>
      </div>
    `;
    })
    .join('');
}

// Render User Queries Stream
function renderUserQueries(dev) {
  const tbody = document.getElementById('user-stream-tbody');
  if (!tbody) return;

  const userQueries = allQueries.filter((q) => q.client.includes(dev.ip) || q.client.includes(dev.name));
  if (userQueries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="loading-row">NO RECENT QUERIES LOGGED FOR ${escapeHtml(dev.name)}</td></tr>`;
    return;
  }

  tbody.innerHTML = userQueries.slice(0, 8).map((q) => {
    const isBlocked = q.status === 'BLOCKED';
    const badgeClass = isBlocked ? 'blocked' : 'allowed';
    const actionBtn = isBlocked
      ? `<span style="color:var(--text-dim)">DROPPED</span>`
      : `<button class="quick-ban-btn" onclick="addDeviceCustomRule('${escapeHtml(q.domain)}')">[ BLOCK ]</button>`;

    return `
      <tr>
        <td style="color:var(--text-muted)">${escapeHtml(q.time)}</td>
        <td style="color:#fff; font-weight:bold">${escapeHtml(q.domain)}</td>
        <td><span class="status-badge ${badgeClass}">${q.status}</span></td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }).join('');
}

// Timed Curfew / Freeze Control
async function freezeDevice(durationMinutes, reason) {
  const dev = getActiveDevice();
  if (!dev) return;

  if (durationMinutes > 0) {
    audio.playAlarm();
  } else {
    audio.playBeep(700);
  }

  try {
    const res = await fetch(`/api/devices/${dev.id}/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes, reason }),
    });
    const data = await res.json();
    cliPrint(`[CURFEW] ${data.message}`, durationMinutes > 0 ? 'error' : 'success');
    await fetchDevices();
    await fetchTelemetry();
  } catch {
    cliPrint('[ERR] Failed to execute curfew action', 'error');
  }
}

// Toggle Bypass for Active Device
async function toggleDeviceBypass() {
  const dev = getActiveDevice();
  if (!dev) return;

  audio.playAlarm();
  try {
    const res = await fetch(`/api/devices/${dev.id}/bypass`, { method: 'POST' });
    const data = await res.json();
    cliPrint(`[BYPASS TOGGLE] ${data.message}`, dev.status === 'active' ? 'error' : 'success');
    await fetchDevices();
    await fetchTelemetry();
  } catch {
    cliPrint('[ERR] Failed to toggle bypass status', 'error');
  }
}

// Toggle Per-Device Service
async function toggleDeviceService(service, node) {
  const dev = getActiveDevice();
  if (!dev) return;

  let list = dev.blockedServices || [];
  if (list.includes(service)) {
    list = list.filter((s) => s !== service);
    audio.playBeep(700);
    cliPrint(`[DEV MATRIX] '${service.toUpperCase()}' unblocked for ${dev.name}`, 'hint');
  } else {
    list.push(service);
    audio.playAlarm();
    cliPrint(`[DEV MATRIX] '${service.toUpperCase()}' RESTRICTED for ${dev.name}`, 'error');
  }
  dev.blockedServices = list;

  // Optimistic UI
  renderActiveDeviceView();

  // Save to backend
  await fetch(`/api/devices/${dev.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockedServices: list }),
  });
}

// Add Custom Domain for Device
async function addDeviceCustomRule(domain) {
  const dev = getActiveDevice();
  if (!dev) return;

  const clean = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  let list = dev.customRules || [];
  if (!list.includes(clean)) {
    list.push(clean);
    dev.customRules = list;
    audio.playAlarm();
    cliPrint(`[DEV DOMAIN] '${clean}' blocked strictly on ${dev.name}`, 'error');
    renderDeviceCustomChips(list);

    await fetch(`/api/devices/${dev.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customRules: list }),
    });
  }
}

// Remove Custom Domain for Device
async function removeDeviceCustomRule(domain) {
  const dev = getActiveDevice();
  if (!dev) return;

  dev.customRules = (dev.customRules || []).filter((d) => d !== domain);
  audio.playBeep(500);
  cliPrint(`[DEV DOMAIN] '${domain}' unblocked on ${dev.name}`, 'hint');
  renderDeviceCustomChips(dev.customRules);

  await fetch(`/api/devices/${dev.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customRules: dev.customRules }),
  });
}

function renderDeviceCustomChips(list) {
  const container = document.getElementById('device-custom-chips');
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML = '<span class="empty-chips" style="font-size:0.75rem; color:var(--text-muted)">No custom domains blocked for this device.</span>';
    return;
  }
  container.innerHTML = list
    .map(
      (d) => `
    <div class="chip">
      <span>${escapeHtml(d)}</span>
      <button class="unban-btn" onclick="removeDeviceCustomRule('${escapeHtml(d)}')">&times;</button>
    </div>
  `
    )
    .join('');
}

// Live Mockup Synchronizer
function updateMockupLive() {
  const emoji = document.getElementById('splash-emoji-input').value || '⛔';
  const heading = document.getElementById('splash-heading-input').value || 'ACCESS RESTRICTED';
  const msg = document.getElementById('splash-msg-input').value || 'Access to this service has been restricted.';
  const imgUrl = document.getElementById('splash-img-input').value.trim();

  document.getElementById('mock-emoji').textContent = emoji;
  document.getElementById('mock-heading').textContent = heading;
  document.getElementById('mock-desc').textContent = msg;

  const mockImg = document.getElementById('mock-img');
  if (imgUrl) {
    mockImg.src = imgUrl;
    mockImg.classList.remove('hidden');
  } else {
    mockImg.classList.add('hidden');
  }
}

// Save Splash Settings
async function saveSplashSettings() {
  const dev = getActiveDevice();
  if (!dev) return;

  const enabled = document.getElementById('splash-enabled-toggle').checked;
  const config = {
    emoji: document.getElementById('splash-emoji-input').value.trim(),
    heading: document.getElementById('splash-heading-input').value.trim(),
    message: document.getElementById('splash-msg-input').value.trim(),
    imageUrl: document.getElementById('splash-img-input').value.trim(),
    allowRequestBypass: true,
  };

  audio.playBeep(1000, 0.1);
  try {
    await fetch(`/api/devices/${dev.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockPageEnabled: enabled, blockPageConfig: config }),
    });
    cliPrint(`[SPLASH CONFIG] Saved custom block page for ${dev.name}`, 'success');
    alert(`✅ Custom block page configuration saved for ${dev.name}!`);
  } catch (err) {
    cliPrint(`[ERR] Failed to save splash settings`, 'error');
  }
}

// Add New Device Submit
async function handleAddDeviceSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('new-dev-name').value.trim();
  const ip = document.getElementById('new-dev-ip').value.trim();

  if (!name || !ip) return;
  audio.playBeep(900);

  try {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ip }),
    });
    const result = await res.json();
    document.getElementById('new-device-modal').classList.add('hidden');
    document.getElementById('new-device-form').reset();
    activeDeviceId = result.device.id;
    await fetchDevices();
    cliPrint(`[REGISTRY] New target device '${name}' (${ip}) registered successfully`, 'success');
  } catch {
    cliPrint('[ERR] Failed to register device', 'error');
  }
}

// --- GLOBAL TELEMETRY & QUERIES ---
async function fetchTelemetry() {
  try {
    const res = await fetch('/api/telemetry');
    const data = await res.json();
    telemetryData = data;

    document.getElementById('stat-total-queries').textContent = Number(data.stats.dnsQueries).toLocaleString();
    document.getElementById('stat-blocked').textContent = Number(data.stats.blockedFiltering).toLocaleString();

    const pct = data.stats.dnsQueries > 0 ? ((data.stats.blockedFiltering / data.stats.dnsQueries) * 100).toFixed(1) : '0';
    document.getElementById('stat-block-pct').textContent = `EFFICIENCY: ${pct}% INTERCEPT RATE`;

    document.getElementById('stat-devices-count').textContent = data.devicesCount || 3;
    document.getElementById('stat-bypassed-sub').textContent = `${data.bypassedCount || 0} BYPASSED TO NORMAL ISP`;

    const mem = data.system.memory;
    document.getElementById('stat-mem').textContent = `${mem.percentUsed}% RAM`;
    document.getElementById('mem-meter-val').textContent = `${mem.usedMB} MB / ${mem.totalMB} MB (${mem.percentUsed}%)`;
    document.getElementById('mem-bar').style.width = `${mem.percentUsed}%`;
    document.getElementById('stat-cpu-model').textContent = `${data.system.cpuCores} CORES • LOAD: ${data.system.loadAvg.join(', ')}`;

    renderBlockedChips(data.blockedList);

    const lockdownBtn = document.getElementById('lockdown-btn');
    if (data.lockdown) {
      lockdownBtn.classList.add('active');
      lockdownBtn.innerHTML = '<span class="hazard-icon">🚨</span> LOCKDOWN ACTIVE';
    } else {
      lockdownBtn.classList.remove('active');
      lockdownBtn.innerHTML = '<span class="hazard-icon">⚠️</span> MASTER LOCKDOWN';
    }
  } catch (err) {
    console.warn('Telemetry poll error', err);
  }
}

function renderBlockedChips(list) {
  const container = document.getElementById('blocked-chips-list');
  if (!list || list.length === 0) {
    container.innerHTML = '<span class="empty-chips">No global domain sinkholes active.</span>';
    return;
  }
  container.innerHTML = list
    .map(
      (domain) => `
    <div class="chip">
      <span>${escapeHtml(domain)}</span>
      <button class="unban-btn" onclick="unblockGlobalDomain('${escapeHtml(domain)}')">&times;</button>
    </div>
  `
    )
    .join('');
}

async function fetchQueries() {
  try {
    const res = await fetch('/api/queries');
    const data = await res.json();
    if (data && Array.isArray(data.queries)) {
      allQueries = data.queries;
      renderQueries();
    }
  } catch (err) {
    console.warn('Query poll error', err);
  }
}

function renderQueries() {
  const tbody = document.getElementById('stream-tbody');
  if (!allQueries || allQueries.length === 0) return;

  const filtered = allQueries.filter((q) => {
    if (activeFilter === 'all') return true;
    return q.status === activeFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="loading-row">NO QUERIES MATCHING FILTER: ${activeFilter}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .slice(0, 15)
    .map((q) => {
      const isBlocked = q.status === 'BLOCKED';
      const badgeClass = isBlocked ? 'blocked' : 'allowed';
      const actionBtn = isBlocked
        ? `<span style="color:var(--text-dim)">DROP</span>`
        : `<button class="quick-ban-btn" onclick="blockGlobalDomain('${escapeHtml(q.domain)}')">[ BAN ]</button>`;

      return `
      <tr>
        <td style="color:var(--text-muted)">${escapeHtml(q.time)}</td>
        <td style="color:var(--neon-cyan)">${escapeHtml(q.client)}</td>
        <td style="color:#fff; font-weight:bold">${escapeHtml(q.domain)}</td>
        <td><span class="status-badge ${badgeClass}">${q.status}</span></td>
        <td>${actionBtn}</td>
      </tr>
    `;
    })
    .join('');
}

async function blockGlobalDomain(domain) {
  audio.playAlarm();
  try {
    const res = await fetch('/api/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    const result = await res.json();
    cliPrint(`[GLOBAL BAN] ${result.message || domain}`, 'success');
    fetchTelemetry();
    fetchQueries();
  } catch {
    cliPrint(`[ERR] Failed to ban ${domain}`, 'error');
  }
}

async function unblockGlobalDomain(domain) {
  audio.playBeep(500, 0.08);
  try {
    await fetch('/api/unblock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    cliPrint(`[RESTORED] Global domain '${domain}' unbanned`, 'hint');
    fetchTelemetry();
    fetchQueries();
  } catch {
    cliPrint(`[ERR] Failed to unban ${domain}`, 'error');
  }
}

async function toggleGlobalTarget(target, node) {
  const isBlocked = globalTargetStates[target];
  const newState = !isBlocked;
  globalTargetStates[target] = newState;

  if (newState) {
    node.classList.add('blocked');
    node.querySelector('.node-status').textContent = 'RESTRICTED';
    audio.playAlarm();
    cliPrint(`[GLOBAL MATRIX] Target '${target.toUpperCase()}' RESTRICTED`, 'error');
  } else {
    node.classList.remove('blocked');
    node.querySelector('.node-status').textContent = 'ENABLED';
    audio.playBeep(750);
    cliPrint(`[GLOBAL MATRIX] Target '${target.toUpperCase()}' ALLOWED`, 'success');
  }
}

async function triggerLockdown() {
  audio.playAlarm();
  try {
    const res = await fetch('/api/lockdown', { method: 'POST' });
    const data = await res.json();
    cliPrint(`[CRITICAL] ${data.message}`, data.lockdown ? 'error' : 'success');
    fetchTelemetry();
  } catch {
    cliPrint('[ERR] Failed to toggle lockdown', 'error');
  }
}

// --- CLI TERMINAL ---
function handleCliInput(e) {
  if (e.key === 'Enter') {
    const raw = e.target.value.trim();
    if (!raw) return;
    audio.playBeep(950, 0.04);
    e.target.value = '';
    executeCliCommand(raw);
  } else if (e.key === 'Escape') {
    e.target.value = '';
  }
}

function cliPrint(text, type = 'cmd') {
  const history = document.getElementById('cli-history');
  if (!history) return;
  const line = document.createElement('div');
  line.className = `cli-line ${type}`;
  line.textContent = text;
  history.appendChild(line);
  history.scrollTop = history.scrollHeight;
}

function executeCliCommand(cmd) {
  cliPrint(`root@god-panel:~# ${cmd}`, 'cmd');
  const parts = cmd.split(' ');
  const action = parts[0].toLowerCase();
  const arg = parts[1];

  switch (action) {
    case 'help':
      cliPrint('CYBER COMMAND MANUAL:', 'banner');
      cliPrint('  devices           - List all registered devices & status', 'hint');
      cliPrint('  bypass <id/ip>    - Detach device from proxy (routes via ISP)', 'hint');
      cliPrint('  block <domain>    - Global domain drop', 'hint');
      cliPrint('  unblock <domain>  - Remove global domain ban', 'hint');
      cliPrint('  lockdown          - Emergency master killswitch', 'hint');
      cliPrint('  stats             - Host system telemetry', 'hint');
      cliPrint('  cls / clear       - Clear terminal output', 'hint');
      break;

    case 'devices':
      cliPrint('CURRENT DEVICE ROSTER:', 'banner');
      devices.forEach((d) => {
        cliPrint(`  [${d.id}] ${d.name} (${d.ip}) -> STATUS: ${d.status.toUpperCase()}`, d.status === 'bypassed' ? 'error' : 'success');
      });
      break;

    case 'bypass':
      if (!arg) {
        cliPrint('ERROR: Specify device ID or IP. Usage: bypass dev_phone_1', 'error');
      } else {
        const found = devices.find((d) => d.id === arg || d.ip === arg);
        if (found) {
          activeDeviceId = found.id;
          toggleDeviceBypass();
        } else {
          cliPrint(`Device not found: ${arg}`, 'error');
        }
      }
      break;

    case 'block':
    case 'ban':
      if (!arg) cliPrint('Usage: block domain.com', 'error');
      else blockGlobalDomain(arg);
      break;

    case 'unblock':
    case 'unban':
      if (!arg) cliPrint('Usage: unblock domain.com', 'error');
      else unblockGlobalDomain(arg);
      break;

    case 'lockdown':
      triggerLockdown();
      break;

    case 'stats':
      if (telemetryData) {
        cliPrint(`HOST: ${telemetryData.system.hostname} | RAM: ${telemetryData.system.memory.percentUsed}%`, 'banner');
        cliPrint(`DEVICES: ${devices.length} total (${telemetryData.bypassedCount} bypassed)`, 'hint');
      }
      break;

    case 'clear':
    case 'cls':
      document.getElementById('cli-history').innerHTML = '';
      break;

    default:
      cliPrint(`Unknown command: '${action}'. Type 'help' for manual.`, 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
