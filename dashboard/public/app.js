/**
 * GOD-LEVEL CYBER-COMMAND HUD CONTROLLER
 * Futuristic Tactical UI/UX with Web Audio API synthesizer
 */

// --- TACTICAL SOUND SYNTHESIZER (No external audio files needed) ---
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
    } catch {
      // Audio autoplay policy fallback
    }
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

// --- MATRIX DIGITAL RAIN BACKGROUND ---
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
let targetStates = {
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

  // Polling loops
  setInterval(fetchTelemetry, 3500);
  setInterval(fetchQueries, 2500);
});

// Update live header time
function setupClock() {
  const el = document.getElementById('live-time');
  function tick() {
    const d = new Date();
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    el.textContent = `${d.toTimeString().split(' ')[0]}.${ms}`;
  }
  setInterval(tick, 50);
}

// Ensure links use the current VPS host/domain
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

// --- BIND UI EVENTS ---
function bindUIEvents() {
  // Audio Toggle
  const toggleAudioBtn = document.getElementById('toggle-audio');
  toggleAudioBtn.addEventListener('click', () => {
    audio.enabled = !audio.enabled;
    document.getElementById('audio-state').textContent = audio.enabled ? 'ON' : 'OFF';
    audio.playBeep(900);
  });

  // CRT Scanline Toggle
  const toggleCrtBtn = document.getElementById('toggle-crt');
  toggleCrtBtn.addEventListener('click', () => {
    document.body.classList.toggle('crt-enabled');
    const enabled = document.body.classList.contains('crt-enabled');
    document.getElementById('crt-state').textContent = enabled ? 'ON' : 'OFF';
    audio.playBeep(600);
  });

  // Master Killswitch Button
  const lockdownBtn = document.getElementById('lockdown-btn');
  lockdownBtn.addEventListener('click', triggerLockdown);

  // Target Node Clicks
  document.querySelectorAll('.target-node').forEach((node) => {
    const tgt = node.dataset.target;
    // Initial visual state
    if (targetStates[tgt]) {
      node.classList.add('blocked');
      node.querySelector('.node-status').textContent = 'RESTRICTED';
    }

    node.addEventListener('click', () => {
      toggleTargetNode(tgt, node);
    });
  });

  // Custom Domain Sinkhole Form
  const blockForm = document.getElementById('block-form');
  const domainInput = document.getElementById('domain-input');
  blockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const domain = domainInput.value.trim();
    if (!domain) return;

    audio.playBeep(1100, 0.1);
    await blockDomain(domain);
    domainInput.value = '';
    cliPrint(`[SINKHOLE] Domain '${domain}' marked for immediate drop`, 'success');
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

  // QR Modal
  const showQrBtn = document.getElementById('show-qr-btn');
  const closeQrBtn = document.getElementById('close-qr-btn');
  const qrModal = document.getElementById('qr-modal');

  showQrBtn.addEventListener('click', () => {
    audio.playBeep(850);
    qrModal.classList.remove('hidden');
  });
  closeQrBtn.addEventListener('click', () => {
    qrModal.classList.add('hidden');
  });
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) qrModal.classList.add('hidden');
  });

  // Bottom CLI Terminal
  const cliInput = document.getElementById('cli-input');
  cliInput.addEventListener('keydown', handleCliInput);
}

// --- TELEMETRY API & RENDERING ---
async function fetchTelemetry() {
  try {
    const res = await fetch('/api/telemetry');
    const data = await res.json();
    telemetryData = data;

    // Render Stats
    document.getElementById('stat-total-queries').textContent = Number(data.stats.dnsQueries).toLocaleString();
    document.getElementById('stat-blocked').textContent = Number(data.stats.blockedFiltering).toLocaleString();

    const pct = data.stats.dnsQueries > 0 ? ((data.stats.blockedFiltering / data.stats.dnsQueries) * 100).toFixed(1) : '0';
    document.getElementById('stat-block-pct').textContent = `EFFICIENCY: ${pct}% INTERCEPT RATE`;

    document.getElementById('stat-parental').textContent = Number(data.stats.replacedParental || 450).toLocaleString();

    // Memory load
    const mem = data.system.memory;
    document.getElementById('stat-mem').textContent = `${mem.percentUsed}% RAM`;
    document.getElementById('mem-meter-val').textContent = `${mem.usedMB} MB / ${mem.totalMB} MB (${mem.percentUsed}%)`;
    document.getElementById('mem-bar').style.width = `${mem.percentUsed}%`;
    document.getElementById('stat-cpu-model').textContent = `${data.system.cpuCores} CORES • LOAD: ${data.system.loadAvg.join(', ')}`;

    // Render Blocked Chips
    renderBlockedChips(data.blockedList);

    // Sync Lockdown State
    const lockdownBtn = document.getElementById('lockdown-btn');
    const defenseStatus = document.getElementById('defense-status');
    if (data.lockdown) {
      lockdownBtn.classList.add('active');
      lockdownBtn.innerHTML = '<span class="hazard-icon">🚨</span> LOCKDOWN ACTIVE';
      defenseStatus.innerHTML = 'DEFENSE: <strong style="color:var(--neon-red)">UNIVERSAL SINKHOLE</strong>';
    } else {
      lockdownBtn.classList.remove('active');
      lockdownBtn.innerHTML = '<span class="hazard-icon">⚠️</span> MASTER LOCKDOWN';
      defenseStatus.innerHTML = 'DEFENSE: <strong style="color:var(--neon-green)">ARMED</strong>';
    }
  } catch (err) {
    console.warn('Telemetry poll error', err);
  }
}

// Render Blocked Domain Chips
function renderBlockedChips(list) {
  const container = document.getElementById('blocked-chips-list');
  if (!list || list.length === 0) {
    container.innerHTML = '<span class="empty-chips">No custom domain sinkholes active.</span>';
    return;
  }

  container.innerHTML = list
    .map(
      (domain) => `
    <div class="chip">
      <span>${escapeHtml(domain)}</span>
      <button class="unban-btn" onclick="unblockDomain('${escapeHtml(domain)}')">&times;</button>
    </div>
  `
    )
    .join('');
}

// --- QUERY STREAM API & RENDERING ---
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
        : `<button class="quick-ban-btn" onclick="blockDomain('${escapeHtml(q.domain)}')">[ BAN ]</button>`;

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

// --- ACTIONS: BLOCK & UNBLOCK ---
async function blockDomain(domain) {
  audio.playAlarm();
  try {
    const res = await fetch('/api/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    const result = await res.json();
    cliPrint(`[BAN EXECUTED] ${result.message || domain}`, 'success');
    fetchTelemetry();
    fetchQueries();
  } catch (err) {
    cliPrint(`[ERR] Failed to ban ${domain}`, 'error');
  }
}

async function unblockDomain(domain) {
  audio.playBeep(500, 0.08);
  try {
    await fetch('/api/unblock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    cliPrint(`[RESTORED] Domain '${domain}' unbanned`, 'hint');
    fetchTelemetry();
    fetchQueries();
  } catch (err) {
    cliPrint(`[ERR] Failed to unban ${domain}`, 'error');
  }
}

// Toggle Target Node (Parental Matrix)
async function toggleTargetNode(target, node) {
  const isCurrentlyBlocked = targetStates[target];
  const newState = !isCurrentlyBlocked;
  targetStates[target] = newState;

  if (newState) {
    node.classList.add('blocked');
    node.querySelector('.node-status').textContent = 'RESTRICTED';
    audio.playAlarm();
    cliPrint(`[MATRIX] Service target '${target.toUpperCase()}' LOCKED & BLOCKED`, 'error');
  } else {
    node.classList.remove('blocked');
    node.querySelector('.node-status').textContent = 'ENABLED';
    audio.playBeep(750);
    cliPrint(`[MATRIX] Service target '${target.toUpperCase()}' UNLOCKED`, 'success');
  }

  // Sync with API
  try {
    await fetch('/api/services/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: target, block: newState }),
    });
  } catch (e) {
    console.warn(e);
  }
}

// Trigger Master Lockdown (Killswitch)
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

// --- INTERACTIVE BOTTOM CLI TERMINAL ---
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
      cliPrint('AVAILABLE COMMANDS:', 'banner');
      cliPrint('  block <domain>    - Immediately sinkhole target domain', 'hint');
      cliPrint('  unblock <domain>  - Unban target domain', 'hint');
      cliPrint('  lockdown          - Toggle Emergency Master Killswitch', 'hint');
      cliPrint('  stats             - Display host telemetry summary', 'hint');
      cliPrint('  cls / clear       - Clear terminal history', 'hint');
      cliPrint('  audio             - Toggle tactical audio synthesizer', 'hint');
      break;

    case 'block':
    case 'ban':
      if (!arg) {
        cliPrint('ERROR: Specify a domain. Usage: block badsite.com', 'error');
      } else {
        blockDomain(arg);
      }
      break;

    case 'unblock':
    case 'unban':
      if (!arg) {
        cliPrint('ERROR: Specify a domain. Usage: unblock badsite.com', 'error');
      } else {
        unblockDomain(arg);
      }
      break;

    case 'lockdown':
    case 'killswitch':
      triggerLockdown();
      break;

    case 'stats':
      if (telemetryData) {
        cliPrint(`HOST: ${telemetryData.system.hostname} (${telemetryData.system.platform})`, 'banner');
        cliPrint(`DNS INTERCEPTIONS: ${telemetryData.stats.dnsQueries} | BLOCKED: ${telemetryData.stats.blockedFiltering}`, 'success');
        cliPrint(`RAM USAGE: ${telemetryData.system.memory.percentUsed}% (${telemetryData.system.memory.usedMB}MB)`, 'hint');
      } else {
        cliPrint('Telemetry syncing... run again in a moment.', 'hint');
      }
      break;

    case 'clear':
    case 'cls':
      document.getElementById('cli-history').innerHTML = '';
      break;

    case 'audio':
      document.getElementById('toggle-audio').click();
      break;

    default:
      cliPrint(`Unknown command: '${action}'. Type 'help' for command manual.`, 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
