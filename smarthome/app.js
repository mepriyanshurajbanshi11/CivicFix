/* =====================================================
   SMARTHOME – app.js
   Full Smart Home Automation with MQTT simulation
   ===================================================== */

'use strict';

// ─────────────────────────────────────────
// 1. DATA STORE
// ─────────────────────────────────────────
const USERS = [
  { username: 'admin', password: 'admin123', role: 'Admin' },
  { username: 'user',  password: 'user123',  role: 'User'  }
];

const ROOMS = [
  { id: 'living',   name: 'Living Room',  icon: '🛋️' },
  { id: 'bedroom',  name: 'Bedroom',      icon: '🛏️' },
  { id: 'kitchen',  name: 'Kitchen',      icon: '🍳' },
  { id: 'bathroom', name: 'Bathroom',     icon: '🚿' },
  { id: 'garage',   name: 'Garage',       icon: '🚗' },
  { id: 'garden',   name: 'Garden',       icon: '🌿' }
];

const DEVICES = [
  // Living Room
  { id: 'd1',  name: 'Main Light',    room: 'living',   type: 'light', icon: '💡', on: false, brightness: 80, watt: 15 },
  { id: 'd2',  name: 'Ceiling Fan',   room: 'living',   type: 'fan',   icon: '🌀', on: false, speed: 3,       watt: 60 },
  { id: 'd3',  name: 'Smart TV',      room: 'living',   type: 'tv',    icon: '📺', on: false, watt: 120 },
  { id: 'd4',  name: 'AC Unit',       room: 'living',   type: 'ac',    icon: '❄️', on: false, temp: 24,       watt: 1500 },

  // Bedroom
  { id: 'd5',  name: 'Bed Light',     room: 'bedroom',  type: 'light', icon: '💡', on: false, brightness: 50, watt: 10 },
  { id: 'd6',  name: 'Bedroom Fan',   room: 'bedroom',  type: 'fan',   icon: '🌀', on: false, speed: 2,       watt: 45 },
  { id: 'd7',  name: 'Bedroom AC',    room: 'bedroom',  type: 'ac',    icon: '❄️', on: false, temp: 22,       watt: 1200 },

  // Kitchen
  { id: 'd8',  name: 'Kitchen Light', room: 'kitchen',  type: 'light', icon: '💡', on: false, brightness: 100, watt: 20 },
  { id: 'd9',  name: 'Exhaust Fan',   room: 'kitchen',  type: 'fan',   icon: '🌀', on: false, speed: 1,        watt: 30 },
  { id: 'd10', name: 'Smart Plug',    room: 'kitchen',  type: 'plug',  icon: '🔌', on: false, watt: 200 },

  // Bathroom
  { id: 'd11', name: 'Bath Light',    room: 'bathroom', type: 'light', icon: '💡', on: false, brightness: 90, watt: 12 },
  { id: 'd12', name: 'Geyser',        room: 'bathroom', type: 'plug',  icon: '🔌', on: false, watt: 2000 },

  // Garage
  { id: 'd13', name: 'Garage Light',  room: 'garage',   type: 'light', icon: '💡', on: false, brightness: 100, watt: 25 },
  { id: 'd14', name: 'Garage Door',   room: 'garage',   type: 'lock',  icon: '🚪', on: false, watt: 10 },

  // Garden
  { id: 'd15', name: 'Garden Light',  room: 'garden',   type: 'light', icon: '🔆', on: false, brightness: 70, watt: 18 },
  { id: 'd16', name: 'Sprinkler',     room: 'garden',   type: 'plug',  icon: '💧', on: false, watt: 80 },
];

const SENSORS = [
  { id: 's1', name: 'Living Temp',    room: 'living',   type: 'temp',     icon: '🌡️', value: 26,  unit: '°C',  min: 15, max: 45 },
  { id: 's2', name: 'Living Humid',   room: 'living',   type: 'humidity', icon: '💧', value: 58,  unit: '%',   min: 0,  max: 100 },
  { id: 's3', name: 'Bedroom Temp',   room: 'bedroom',  type: 'temp',     icon: '🌡️', value: 24,  unit: '°C',  min: 15, max: 45 },
  { id: 's4', name: 'Kitchen Temp',   room: 'kitchen',  type: 'temp',     icon: '🌡️', value: 30,  unit: '°C',  min: 15, max: 45 },
  { id: 's5', name: 'Light Level',    room: 'living',   type: 'lux',      icon: '☀️', value: 420, unit: ' lx', min: 0,  max: 1000 },
  { id: 's6', name: 'Motion Sensor',  room: 'garden',   type: 'motion',   icon: '🚶', value: 0,   unit: '',    min: 0,  max: 1 },
  { id: 's7', name: 'CO₂ Level',      room: 'living',   type: 'co2',      icon: '🌿', value: 450, unit: ' ppm',min: 300,max: 2000 },
  { id: 's8', name: 'Door Sensor',    room: 'garage',   type: 'door',     icon: '🚪', value: 0,   unit: '',    min: 0,  max: 1 },
];

let AUTOMATION_RULES = [
  { id: 'r1', name: 'Morning Lights',  trigger: 'time',   triggerVal: '07:00', condition: '', action: 'all_lights_on',  status: 'active' },
  { id: 'r2', name: 'Night Mode',      trigger: 'time',   triggerVal: '23:00', condition: '', action: 'all_lights_off', status: 'active' },
  { id: 'r3', name: 'Auto AC Cool',    trigger: 'sensor', triggerVal: '',      condition: 'temp_high', action: 'ac_on', status: 'active' },
  { id: 'r4', name: 'Garden Lights',   trigger: 'time',   triggerVal: '18:30', condition: '', action: 'all_lights_on',  status: 'inactive' },
];

let LOGS = [];
let currentUser = null;
let mqttConnected = false;
let mqttClient = null;

// ─────────────────────────────────────────
// 2. UTILITIES
// ─────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  $('toastContainer').prepend(t);
  setTimeout(() => t.remove(), 3500);
}

function addLog(msg, icon = '📡', type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  LOGS.unshift({ msg, icon, type, time });
  if (LOGS.length > 200) LOGS.pop();
  renderLogsIfActive();
}

function formatTime(d = new Date()) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────
// 3. AUTH
// ─────────────────────────────────────────
$('loginBtn').addEventListener('click', () => {
  const u = $('loginUser').value.trim();
  const p = $('loginPass').value.trim();
  const found = USERS.find(x => x.username === u && x.password === p);
  const msg = $('loginMsg');
  if (!found) {
    msg.textContent = '❌ Invalid username or password!';
    msg.className = 'msg-box error';
    msg.style.display = 'block';
    return;
  }
  currentUser = found;
  msg.style.display = 'none';
  $('loginScreen').classList.add('hidden');
  $('appScreen').classList.remove('hidden');
  $('greetingName').textContent = found.role === 'Admin' ? 'Admin' : found.username;
  $('userAvatar').textContent = found.username[0].toUpperCase();
  initApp();
});

// Allow Enter key to login
['loginUser','loginPass'].forEach(id => {
  $(id).addEventListener('keydown', e => { if(e.key === 'Enter') $('loginBtn').click(); });
});

$('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  if (mqttClient) { try { mqttClient.end(); } catch(e){} }
  $('appScreen').classList.add('hidden');
  $('loginScreen').classList.remove('hidden');
  $('loginUser').value = '';
  $('loginPass').value = '';
});

// ─────────────────────────────────────────
// 4. NAVIGATION
// ─────────────────────────────────────────
document.querySelectorAll('.nav-item[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    navigateTo(page);
    // Close sidebar on mobile
    $('sidebar').classList.remove('open');
  });
});

$('hamburger').addEventListener('click', () => {
  $('sidebar').classList.toggle('open');
});

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const p = $(`page-${page}`);
  if (p) p.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  const titles = { dashboard:'Dashboard', rooms:'Rooms', devices:'All Devices', automation:'Automation', energy:'Energy Monitor', security:'Security', logs:'Activity Logs' };
  $('pageTitle').textContent = titles[page] || page;

  if (page === 'dashboard') renderDashboard();
  if (page === 'rooms') renderRooms();
  if (page === 'devices') renderAllDevices();
  if (page === 'automation') renderAutomation();
  if (page === 'energy') renderEnergy();
  if (page === 'security') renderSecurity();
  if (page === 'logs') renderLogs();
}

// ─────────────────────────────────────────
// 5. CLOCK & WEATHER
// ─────────────────────────────────────────
function updateClock() {
  const now = new Date();
  $('clockWidget').textContent = formatTime(now);
  const h = now.getHours();
  let greeting = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  $('greetingTime').textContent = greeting;
}

const WEATHER = ['🌤️ 28°C', '☀️ 32°C', '🌧️ 24°C', '⛅ 26°C'];
let wIdx = 0;
function updateWeather() {
  const w = WEATHER[wIdx % WEATHER.length];
  const parts = w.split(' ');
  $('weatherIcon').textContent = parts[0];
  $('weatherTemp').textContent = parts[1];
}

// ─────────────────────────────────────────
// 6. MQTT SIMULATION
// ─────────────────────────────────────────
function initMQTT() {
  setMqttStatus('connecting');
  // Try connecting to public broker; if fails → simulate
  try {
    mqttClient = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
      clientId: `smarthome_${Math.random().toString(16).slice(2)}`,
      connectTimeout: 5000,
      reconnectPeriod: 0,
    });

    mqttClient.on('connect', () => {
      mqttConnected = true;
      setMqttStatus('connected', 'HiveMQ Connected');
      mqttClient.subscribe('smarthome/#');
      addLog('MQTT connected to HiveMQ broker', '📡', 'info');
      showToast('🟢 MQTT Connected to HiveMQ!', 'success');
    });

    mqttClient.on('error', () => simulateMQTT());
    mqttClient.on('offline', () => simulateMQTT());

    mqttClient.on('message', (topic, payload) => {
      addLog(`MQTT ← [${topic}] ${payload.toString()}`, '📨', 'info');
    });

    // Timeout fallback
    setTimeout(() => {
      if (!mqttConnected) simulateMQTT();
    }, 6000);
  } catch(e) {
    simulateMQTT();
  }
}

function simulateMQTT() {
  if (mqttConnected) return;
  setMqttStatus('connected', 'Simulated MQTT');
  mqttConnected = true;
  addLog('MQTT running in simulation mode (no broker needed)', '🔄', 'info');
  showToast('🟡 MQTT Simulated (offline mode)', 'warning');
}

function setMqttStatus(state, label) {
  const dot = document.querySelector('.dot');
  const lbl = $('mqttLabel');
  dot.className = 'dot ' + state;
  lbl.textContent = label || { connecting:'Connecting…', connected:'Connected', disconnected:'Disconnected' }[state];
}

function publishMQTT(topic, payload) {
  const msg = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
  if (mqttClient && mqttConnected && mqttClient.publish) {
    try { mqttClient.publish(`smarthome/${topic}`, msg); } catch(e) {}
  }
  addLog(`MQTT → [smarthome/${topic}] ${msg}`, '📤', 'info');
}

// ─────────────────────────────────────────
// 7. DEVICE CONTROL
// ─────────────────────────────────────────
function toggleDevice(deviceId, forceState) {
  const dev = DEVICES.find(d => d.id === deviceId);
  if (!dev) return;
  dev.on = forceState !== undefined ? forceState : !dev.on;

  const type = dev.on ? 'on' : 'off';
  addLog(`${dev.name} turned ${type.toUpperCase()}`, dev.icon, type);
  showToast(`${dev.icon} ${dev.name} → ${type.toUpperCase()}`, dev.on ? 'success' : 'info');
  publishMQTT(`device/${dev.id}/state`, { device: dev.id, state: dev.on ? 'ON' : 'OFF' });

  updateStats();
  // Re-render the active page
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const id = activePage.id.replace('page-', '');
    if (id === 'dashboard') renderDashboard();
    else if (id === 'rooms') renderRooms();
    else if (id === 'devices') renderAllDevices();
  }
}

function updateStats() {
  const on = DEVICES.filter(d => d.on);
  $('activeDevicesCount').textContent = on.length;
  const watts = on.reduce((a,d) => a + d.watt, 0);
  $('powerUsage').textContent = watts >= 1000 ? (watts/1000).toFixed(1)+'kW' : watts+'W';
}

// ─────────────────────────────────────────
// 8. SENSOR SIMULATION
// ─────────────────────────────────────────
function simulateSensors() {
  SENSORS.forEach(s => {
    const delta = (Math.random() - 0.5) * (s.type === 'lux' ? 30 : s.type === 'co2' ? 20 : 1.5);
    if (s.type === 'motion') {
      s.value = Math.random() < 0.05 ? 1 : 0;
      if (s.value) {
        addLog('Motion detected in Garden!', '🚶', 'warn');
        showToast('🚨 Motion detected in Garden!', 'warning');
        addSecurityAlert('Motion detected in Garden');
      }
    } else if (s.type === 'door') {
      s.value = Math.random() < 0.02 ? 1 : 0;
    } else {
      s.value = Math.min(s.max, Math.max(s.min, s.value + delta));
      s.value = Math.round(s.value * 10) / 10;
    }
  });

  // Update avg temp & humidity
  const temps = SENSORS.filter(s => s.type === 'temp').map(s => s.value);
  $('avgTemp').textContent = (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) + '°C';
  const hum = SENSORS.filter(s => s.type === 'humidity').map(s => s.value);
  if (hum.length) $('avgHumidity').textContent = hum[0].toFixed(0) + '%';

  // Check automation rules triggered by sensors
  checkSensorAutomation();

  // Re-render sensor panel if on dashboard
  const activePage = document.querySelector('.page.active');
  if (activePage && activePage.id === 'page-dashboard') {
    renderSensors();
  }
}

let securityAlerts = [];
function addSecurityAlert(msg) {
  securityAlerts.unshift({ msg, time: new Date().toLocaleTimeString() });
  if (securityAlerts.length > 20) securityAlerts.pop();
}

// ─────────────────────────────────────────
// 9. RENDER: DASHBOARD
// ─────────────────────────────────────────
function renderDashboard() {
  renderQuickGrid();
  renderSensors();
  updateStats();
}

function renderQuickGrid() {
  const grid = $('quickGrid');
  if (!grid) return;
  grid.innerHTML = DEVICES.slice(0, 8).map(dev => `
    <div class="device-card ${dev.on ? 'on' : ''}" id="card-${dev.id}">
      <div class="device-toggle">
        <label class="toggle">
          <input type="checkbox" ${dev.on ? 'checked' : ''} onchange="toggleDevice('${dev.id}')">
          <span class="slider"></span>
        </label>
      </div>
      <div class="device-icon">${dev.icon}</div>
      <div class="device-name">${dev.name}</div>
      <div class="device-room">${ROOMS.find(r=>r.id===dev.room)?.name}</div>
      <div class="device-status-badge ${dev.on ? 'badge-on' : 'badge-off'}">${dev.on ? 'ON' : 'OFF'}</div>
      ${dev.type === 'light' && dev.brightness !== undefined ? `
        <div class="range-row">
          🔆 <input type="range" min="10" max="100" value="${dev.brightness}"
            oninput="setBrightness('${dev.id}', this.value)"
            onclick="event.stopPropagation()">
          <span>${dev.brightness}%</span>
        </div>` : ''}
      ${dev.type === 'ac' && dev.temp !== undefined ? `
        <div class="range-row">
          🌡️ <input type="range" min="16" max="30" value="${dev.temp}"
            oninput="setACTemp('${dev.id}', this.value)"
            onclick="event.stopPropagation()">
          <span>${dev.temp}°C</span>
        </div>` : ''}
    </div>
  `).join('');
}

window.setBrightness = (id, val) => {
  const dev = DEVICES.find(d => d.id === id);
  if (dev) { dev.brightness = +val; publishMQTT(`device/${id}/brightness`, +val); }
};
window.setACTemp = (id, val) => {
  const dev = DEVICES.find(d => d.id === id);
  if (dev) { dev.temp = +val; publishMQTT(`device/${id}/temp`, +val); }
};
window.toggleDevice = toggleDevice;

function renderSensors() {
  const row = $('sensorRow');
  if (!row) return;
  row.innerHTML = SENSORS.map(s => {
    const pct = ((s.value - s.min) / (s.max - s.min) * 100).toFixed(0);
    const barColor = s.type === 'temp' ? (s.value > 30 ? '#ef4444' : '#6366f1')
                   : s.type === 'co2'  ? (s.value > 1000 ? '#f97316' : '#22c55e')
                   : '#6366f1';
    const display = s.type === 'motion' ? (s.value ? '🟢 Detected' : '⚫ Clear')
                  : s.type === 'door'   ? (s.value ? '🔓 Open' : '🔒 Closed')
                  : s.value + s.unit;
    return `
    <div class="sensor-card">
      <div class="sensor-header">
        <div class="sensor-icon">${s.icon}</div>
        <div>
          <div class="sensor-title">${s.name}</div>
          <div class="sensor-room">${ROOMS.find(r=>r.id===s.room)?.name}</div>
        </div>
      </div>
      <div class="sensor-value">${display}</div>
      <div class="sensor-bar-wrap">
        <div class="sensor-bar" style="width:${pct}%;background:${barColor}"></div>
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────
// 10. RENDER: ROOMS
// ─────────────────────────────────────────
function renderRooms() {
  const grid = $('roomsGrid');
  if (!grid) return;
  grid.innerHTML = ROOMS.map(room => {
    const devs = DEVICES.filter(d => d.room === room.id);
    const onCount = devs.filter(d => d.on).length;
    return `
    <div class="room-card">
      <div class="room-header">
        <div class="room-icon-name">
          <div class="room-icon">${room.icon}</div>
          <div>
            <div class="room-name">${room.name}</div>
            <div class="room-device-count">${onCount}/${devs.length} devices on</div>
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${onCount > 0 ? 'checked' : ''}
            onchange="toggleRoom('${room.id}', this.checked)">
          <span class="slider"></span>
        </label>
      </div>
      <div class="room-devices-mini">
        ${devs.map(d => `
          <div class="mini-device">
            <span>${d.icon} ${d.name}</span>
            <label class="toggle">
              <input type="checkbox" ${d.on ? 'checked' : ''} onchange="toggleDevice('${d.id}')">
              <span class="slider"></span>
            </label>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

window.toggleRoom = (roomId, state) => {
  DEVICES.filter(d => d.room === roomId).forEach(d => {
    d.on = state;
    addLog(`${d.name} → ${state ? 'ON' : 'OFF'} (Room scene)`, d.icon, state ? 'on' : 'off');
  });
  publishMQTT(`room/${roomId}`, state ? 'ON' : 'OFF');
  showToast(`${ROOMS.find(r=>r.id===roomId)?.icon} ${ROOMS.find(r=>r.id===roomId)?.name} → ${state ? 'ALL ON' : 'ALL OFF'}`, state ? 'success' : 'info');
  updateStats();
  renderRooms();
};

// ─────────────────────────────────────────
// 11. RENDER: ALL DEVICES
// ─────────────────────────────────────────
function renderAllDevices() {
  // Populate filters
  const roomFilter = $('roomFilter');
  const typeFilter = $('typeFilter');
  // Build room options
  if (roomFilter.options.length <= 1) {
    ROOMS.forEach(r => {
      const o = new Option(`${r.icon} ${r.name}`, r.id);
      roomFilter.add(o);
    });
  }

  const roomVal = roomFilter.value;
  const typeVal = typeFilter.value;

  let filtered = DEVICES;
  if (roomVal) filtered = filtered.filter(d => d.room === roomVal);
  if (typeVal) filtered = filtered.filter(d => d.type === typeVal);

  const grid = $('devicesGrid');
  grid.innerHTML = filtered.map(dev => `
    <div class="device-card ${dev.on ? 'on' : ''}">
      <div class="device-toggle">
        <label class="toggle">
          <input type="checkbox" ${dev.on ? 'checked' : ''} onchange="toggleDevice('${dev.id}')">
          <span class="slider"></span>
        </label>
      </div>
      <div class="device-icon">${dev.icon}</div>
      <div class="device-name">${dev.name}</div>
      <div class="device-room">${ROOMS.find(r=>r.id===dev.room)?.name} · ${dev.watt}W</div>
      <div class="device-status-badge ${dev.on ? 'badge-on' : 'badge-off'}">${dev.on ? 'ON' : 'OFF'}</div>
      ${dev.type === 'light' && dev.brightness !== undefined ? `
        <div class="range-row">🔆
          <input type="range" min="10" max="100" value="${dev.brightness}"
            oninput="setBrightness('${dev.id}', this.value); this.nextElementSibling.textContent=this.value+'%'">
          <span>${dev.brightness}%</span>
        </div>` : ''}
      ${dev.type === 'ac' && dev.temp !== undefined ? `
        <div class="range-row">❄️
          <input type="range" min="16" max="30" value="${dev.temp}"
            oninput="setACTemp('${dev.id}', this.value); this.nextElementSibling.textContent=this.value+'°C'">
          <span>${dev.temp}°C</span>
        </div>` : ''}
      ${dev.type === 'fan' && dev.speed !== undefined ? `
        <div class="range-row">🌀
          <input type="range" min="1" max="5" value="${dev.speed}"
            oninput="setFanSpeed('${dev.id}', this.value); this.nextElementSibling.textContent='Spd '+this.value">
          <span>Spd ${dev.speed}</span>
        </div>` : ''}
    </div>
  `).join('');
}

window.setFanSpeed = (id, val) => {
  const dev = DEVICES.find(d => d.id === id);
  if (dev) { dev.speed = +val; publishMQTT(`device/${id}/speed`, +val); }
};

$('roomFilter').addEventListener('change', renderAllDevices);
$('typeFilter').addEventListener('change', renderAllDevices);

// ─────────────────────────────────────────
// 12. SCENES
// ─────────────────────────────────────────
document.querySelectorAll('.scene-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyScene(btn.dataset.scene);
  });
});

function applyScene(scene) {
  const scenes = {
    away:  { lights: false, fans: false, ac: false, msg: '🌙 Away Mode – Everything OFF' },
    home:  { lights: true,  fans: true,  ac: false, msg: '🏡 Home Mode – Lights & Fans ON' },
    sleep: { lights: false, fans: true,  ac: true,  msg: '😴 Sleep Mode – AC & Fan ON' },
    party: { lights: true,  fans: true,  ac: true,  msg: '🎉 Party Mode – Everything ON' },
  };
  const s = scenes[scene]; if (!s) return;
  DEVICES.forEach(d => {
    if (d.type === 'light') d.on = s.lights;
    if (d.type === 'fan')   d.on = s.fans;
    if (d.type === 'ac')    d.on = s.ac;
  });
  addLog(s.msg, '🎬', 'info');
  showToast(s.msg, 'success');
  publishMQTT('scene', scene);
  updateStats();
  renderDashboard();
}

// ─────────────────────────────────────────
// 13. AUTOMATION RULES
// ─────────────────────────────────────────
function renderAutomation() {
  const c = $('rulesContainer');
  if (!c) return;
  if (AUTOMATION_RULES.length === 0) {
    c.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px">No automation rules yet. Click "+ Add Rule" to create one.</p>';
    return;
  }
  c.innerHTML = AUTOMATION_RULES.map(r => {
    const triggerDesc = r.trigger === 'time'
      ? `⏰ Every day at ${r.triggerVal}`
      : `📡 When: ${r.condition}`;
    const actionMap = {
      all_lights_on:'💡 All Lights ON', all_lights_off:'💡 All Lights OFF',
      ac_on:'❄️ AC ON', ac_off:'❄️ AC OFF',
      fan_on:'🌀 Fans ON', all_off:'🔴 Everything OFF'
    };
    return `
    <div class="rule-card">
      <div class="rule-info">
        <div class="rule-name">${r.name}</div>
        <div class="rule-desc">${triggerDesc} → ${actionMap[r.action] || r.action}</div>
      </div>
      <div class="rule-actions">
        <span class="rule-badge ${r.status}">${r.status.toUpperCase()}</span>
        <label class="toggle">
          <input type="checkbox" ${r.status === 'active' ? 'checked' : ''}
            onchange="toggleRule('${r.id}', this.checked)">
          <span class="slider"></span>
        </label>
        <button class="rule-del-btn" onclick="deleteRule('${r.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

window.toggleRule = (id, state) => {
  const r = AUTOMATION_RULES.find(x => x.id === id);
  if (r) { r.status = state ? 'active' : 'inactive'; renderAutomation(); }
};
window.deleteRule = (id) => {
  AUTOMATION_RULES = AUTOMATION_RULES.filter(r => r.id !== id);
  renderAutomation();
  showToast('Rule deleted', 'info');
};

// Add Rule Modal
$('addRuleBtn').addEventListener('click', () => {
  $('ruleModal').classList.remove('hidden');
});
$('cancelRuleBtn').addEventListener('click', () => {
  $('ruleModal').classList.add('hidden');
});
$('triggerType').addEventListener('change', () => {
  const isTime = $('triggerType').value === 'time';
  $('timeTriggerGroup').style.display = isTime ? '' : 'none';
  $('sensorTriggerGroup').style.display = isTime ? 'none' : '';
});
$('saveRuleBtn').addEventListener('click', () => {
  const name = $('ruleName').value.trim();
  if (!name) { showToast('Enter a rule name!', 'error'); return; }
  const trigger = $('triggerType').value;
  const newRule = {
    id: 'r' + Date.now(),
    name,
    trigger,
    triggerVal: trigger === 'time' ? $('triggerTime').value : '',
    condition: trigger === 'sensor' ? $('sensorCondition').value : '',
    action: $('ruleAction').value,
    status: $('ruleStatus').value
  };
  AUTOMATION_RULES.push(newRule);
  $('ruleModal').classList.add('hidden');
  $('ruleName').value = '';
  renderAutomation();
  addLog(`New rule created: "${name}"`, '⚙️', 'info');
  showToast(`✅ Rule "${name}" added!`, 'success');
});

function checkSensorAutomation() {
  AUTOMATION_RULES.filter(r => r.trigger === 'sensor' && r.status === 'active').forEach(r => {
    const tempSensors = SENSORS.filter(s => s.type === 'temp');
    const avgT = tempSensors.reduce((a,s)=>a+s.value,0)/tempSensors.length;
    const motion = SENSORS.find(s => s.type === 'motion')?.value;
    let triggered = false;
    if (r.condition === 'temp_high' && avgT > 28) triggered = true;
    if (r.condition === 'temp_low'  && avgT < 20) triggered = true;
    if (r.condition === 'motion' && motion) triggered = true;
    if (triggered) { executeRuleAction(r.action); }
  });
}

function checkTimeAutomation() {
  const now = new Date();
  const curr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  AUTOMATION_RULES.filter(r => r.trigger === 'time' && r.status === 'active' && r.triggerVal === curr)
    .forEach(r => {
      executeRuleAction(r.action);
      addLog(`Automation triggered: "${r.name}"`, '⚙️', 'info');
      showToast(`⚙️ Auto: "${r.name}" executed!`, 'success');
    });
}

function executeRuleAction(action) {
  if (action === 'all_lights_on')  DEVICES.filter(d=>d.type==='light').forEach(d=>d.on=true);
  if (action === 'all_lights_off') DEVICES.filter(d=>d.type==='light').forEach(d=>d.on=false);
  if (action === 'ac_on')  DEVICES.filter(d=>d.type==='ac').forEach(d=>d.on=true);
  if (action === 'ac_off') DEVICES.filter(d=>d.type==='ac').forEach(d=>d.on=false);
  if (action === 'fan_on') DEVICES.filter(d=>d.type==='fan').forEach(d=>d.on=true);
  if (action === 'all_off') DEVICES.forEach(d=>d.on=false);
  updateStats();
}

// ─────────────────────────────────────────
// 14. ENERGY
// ─────────────────────────────────────────
let energyHourly = Array.from({length:24}, (_,i) => ({ h: i, kw: (Math.random()*2+0.5).toFixed(2) }));

function renderEnergy() {
  const on = DEVICES.filter(d => d.on);
  const watts = on.reduce((a,d)=>a+d.watt,0);
  const dailyKwh = (watts / 1000 * 24 * 0.4).toFixed(2);
  const monthlyKwh = (dailyKwh * 30).toFixed(1);
  const bill = (monthlyKwh * 8).toFixed(0);
  const co2 = (monthlyKwh * 0.71).toFixed(1);

  $('dailyKwh').textContent = dailyKwh;
  $('monthlyKwh').textContent = monthlyKwh;
  $('monthlyCost').textContent = '₹' + bill;
  $('co2Saved').textContent = co2;

  renderEnergyChart();
  renderDeviceConsumption();
}

function renderEnergyChart() {
  const canvas = $('energyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 600;
  const H = canvas.offsetHeight || 240;
  canvas.width = W; canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const vals = energyHourly.map(e => +e.kw);
  const maxV = Math.max(...vals);
  const pad = { t:20, r:20, b:40, l:50 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const bW = cW / vals.length * 0.7;
  const gap = cW / vals.length;

  // Grid
  ctx.strokeStyle = '#2e334d'; ctx.lineWidth = 1;
  for (let i=0; i<=4; i++) {
    const y = pad.t + cH - (i/4)*cH;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+cW, y); ctx.stroke();
    ctx.fillStyle = '#8b92a9'; ctx.font = '11px system-ui';
    ctx.fillText((maxV * i/4).toFixed(1), 0, y+4);
  }

  // Bars
  const current = new Date().getHours();
  vals.forEach((v, i) => {
    const x = pad.l + i * gap + (gap-bW)/2;
    const bH = (v / maxV) * cH;
    const y = pad.t + cH - bH;
    const grd = ctx.createLinearGradient(0, y, 0, y+bH);
    grd.addColorStop(0, i === current ? '#f97316' : '#6366f1');
    grd.addColorStop(1, i === current ? '#ef444440' : '#6366f140');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.roundRect(x, y, bW, bH, 3); ctx.fill();

    if (i % 4 === 0) {
      ctx.fillStyle = '#8b92a9'; ctx.font = '10px system-ui'; ctx.textAlign='center';
      ctx.fillText(i+'h', x + bW/2, H - 10);
    }
  });
}

function renderDeviceConsumption() {
  const el = $('deviceConsumption');
  if (!el) return;
  const sorted = [...DEVICES].sort((a,b)=>b.watt-a.watt).slice(0,8);
  const maxW = sorted[0].watt;
  el.innerHTML = sorted.map(d => `
    <div class="energy-row">
      <div class="e-icon">${d.icon}</div>
      <div class="e-name">${d.name}<br><small style="color:var(--muted)">${ROOMS.find(r=>r.id===d.room)?.name}</small></div>
      <div class="e-watt">${d.watt}W</div>
      <div class="e-bar-wrap"><div class="e-bar" style="width:${(d.watt/maxW*100).toFixed(0)}%;background:${d.on?'var(--green)':'var(--border)'}"></div></div>
      <span class="device-status-badge ${d.on?'badge-on':'badge-off'}">${d.on?'ON':'OFF'}</span>
    </div>`).join('');
}

// ─────────────────────────────────────────
// 15. SECURITY
// ─────────────────────────────────────────
function renderSecurity() {
  const locks = DEVICES.filter(d => d.type === 'lock');
  $('doorLocksList').innerHTML = locks.map(d => `
    <div class="door-item">
      <span>${d.icon} ${d.name}</span>
      <label class="toggle">
        <input type="checkbox" ${d.on ? 'checked' : ''} onchange="toggleDevice('${d.id}')">
        <span class="slider"></span>
      </label>
    </div>`).join('') || '<p style="color:var(--muted);font-size:13px">No smart locks installed</p>';

  $('securityAlerts').innerHTML = securityAlerts.length
    ? securityAlerts.slice(0,5).map(a => `
        <div class="alert-item">
          <div>🚨 ${a.msg}</div>
          <div class="alert-time">${a.time}</div>
        </div>`).join('')
    : '<p style="color:var(--muted);font-size:12px">No alerts</p>';
}

$('alarmToggle').addEventListener('change', function() {
  const armed = this.checked;
  $('alarmStatus').textContent = armed ? 'ARMED' : 'DISARMED';
  $('alarmStatus').className = 'alarm-status' + (armed ? ' armed' : '');
  addLog(`Alarm system ${armed ? 'ARMED' : 'DISARMED'}`, '🚨', armed ? 'warn' : 'info');
  showToast(armed ? '🚨 Alarm System ARMED!' : '✅ Alarm System Disarmed', armed ? 'warning' : 'success');
  publishMQTT('security/alarm', armed ? 'ARMED' : 'DISARMED');
});

// Camera motion simulation
setInterval(() => {
  const motions = ['None detected','Person at door','Vehicle movement','Shadow detected'];
  $('cameraMotion').textContent = motions[Math.floor(Math.random()*motions.length)];
}, 8000);

// ─────────────────────────────────────────
// 16. LOGS
// ─────────────────────────────────────────
function renderLogs() {
  const c = $('logsContainer');
  if (!c) return;
  if (LOGS.length === 0) {
    c.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px">No logs yet.</p>';
    return;
  }
  c.innerHTML = LOGS.map(l => `
    <div class="log-row">
      <span class="log-time">${l.time}</span>
      <span class="log-icon">${l.icon}</span>
      <span class="log-msg">${l.msg}</span>
      <span class="log-type ${l.type}">${l.type.toUpperCase()}</span>
    </div>`).join('');
}

function renderLogsIfActive() {
  if (document.querySelector('#page-logs.active')) renderLogs();
}

$('clearLogsBtn').addEventListener('click', () => {
  LOGS = [];
  renderLogs();
  showToast('Logs cleared', 'info');
});

// ─────────────────────────────────────────
// 17. INIT
// ─────────────────────────────────────────
function initApp() {
  updateClock();
  updateWeather();
  renderDashboard();
  initMQTT();

  // Initial log entries
  addLog('SmartHome system started', '🏠', 'info');
  addLog('Sensor monitoring active', '📡', 'info');

  // Clock every second
  setInterval(() => { updateClock(); checkTimeAutomation(); }, 1000);

  // Sensor simulation every 5s
  setInterval(simulateSensors, 5000);

  // Weather change every 30s
  setInterval(() => { wIdx++; updateWeather(); }, 30000);

  // Simulate some initial energy chart variance
  setInterval(() => {
    const h = new Date().getHours();
    energyHourly[h].kw = (+(energyHourly[h].kw) + (Math.random()-0.3)*0.1).toFixed(2);
    if (document.querySelector('#page-energy.active')) renderEnergyChart();
  }, 10000);
}
