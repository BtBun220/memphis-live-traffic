/* ================================================================
   Speed & Red Light Camera Map — speedcams.js
   171 cameras across Tennessee with GPS proximity alerts
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   STATE
   ---------------------------------------------------------------- */
let scAllCameras    = [];
let scFiltered      = [];
let scMarkers       = {};
let scMap           = null;
let scTileLayer     = null;
let scActiveType    = 'ALL';     // speed, red_light, ALL
let scActiveStatus  = 'ALL';     // active, removed, disputed, ALL
let scActiveCity    = 'ALL';
let scSearchQuery   = '';
let drivingMode     = false;
let watchId         = null;
let userMarker      = null;
let userCircle      = null;
let alertedCameras  = new Set(); // track which cameras have been alerted
let lastAlertTime   = 0;
let audioCtx        = null;
const METERS_PER_MILE = 1609.34;

/* ----------------------------------------------------------------
   ALERT DISTANCE (meters)
   ---------------------------------------------------------------- */
let alertDistance = 1500;

const alertSlider = document.getElementById('alertRange');
const alertDistVal = document.getElementById('alertDistVal');
if (alertSlider) {
  alertSlider.addEventListener('input', (e) => {
    alertDistance = parseInt(e.target.value);
    alertDistVal.textContent = (alertDistance / METERS_PER_MILE).toFixed(1) + ' mi';
    if (userCircle) userCircle.setRadius(alertDistance);
  });
}

/* ----------------------------------------------------------------
   MARKER STYLING
   ---------------------------------------------------------------- */
const SC_COLORS = {
  speed_active:    '#ef4444',
  red_light_active:'#f59e0b',
  removed:         '#6b7280',
  disputed:        '#a78bfa',
};

function scMarkerColor(cam) {
  if (cam.status === 'removed')  return SC_COLORS.removed;
  if (cam.status === 'disputed') return SC_COLORS.disputed;
  if (cam.type === 'speed')      return SC_COLORS.speed_active;
  return SC_COLORS.red_light_active;
}

function scMarkerSize(cam) {
  return cam.status === 'active' ? 12 : 9;
}

function createScIcon(cam) {
  const color = scMarkerColor(cam);
  const size = scMarkerSize(cam);
  const isActive = cam.status === 'active';
  const glow = isActive ? `<circle cx="${size}" cy="${size}" r="${size-1}" fill="${color}" opacity="0.25"><animate attributeName="r" values="${size-1};${size+4};${size-1}" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite"/></circle>` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size*2}" height="${size*2}" viewBox="0 0 ${size*2} ${size*2}">${glow}<circle cx="${size}" cy="${size}" r="${size-2}" fill="${color}" stroke="white" stroke-width="1.5" opacity="${isActive ? 1 : 0.65}"/>${cam.type === 'speed' ? `<text x="${size}" y="${size+1}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="${size-3}" font-weight="bold" font-family="sans-serif">S</text>` : ''}</svg>`;

  return L.divIcon({
    html: svg,
    className: 'sc-marker-div',
    iconSize: [size*2, size*2],
    iconAnchor: [size, size],
    popupAnchor: [0, -size],
  });
}

/* ----------------------------------------------------------------
   POPUP
   ---------------------------------------------------------------- */
function scPopup(cam) {
  const color = scMarkerColor(cam);
  const typeLabel = cam.type === 'speed' ? 'Speed Camera' : 'Red Light Camera';
  const statusBadge = cam.status === 'active'
    ? '<span style="color:#ef4444;font-weight:700;">● ACTIVE</span>'
    : cam.status === 'removed'
      ? '<span style="color:#6b7280;">● Removed</span>'
      : '<span style="color:#a78bfa;">● Disputed</span>';

  return `
    <div class="cam-popup" style="min-width:200px;">
      <div class="cam-popup-name">${esc(cam.location)}</div>
      <div class="cam-popup-meta" style="margin-top:6px;">
        <div class="cam-popup-row"><span class="cam-popup-key">Type</span><span class="cam-popup-val" style="color:${color};font-weight:600;">${typeLabel}</span></div>
        <div class="cam-popup-row"><span class="cam-popup-key">Status</span><span class="cam-popup-val">${statusBadge}</span></div>
        <div class="cam-popup-row"><span class="cam-popup-key">City</span><span class="cam-popup-val">${esc(cam.city)}, ${esc(cam.county)} Co.</span></div>
        ${cam.speed_limit ? `<div class="cam-popup-row"><span class="cam-popup-key">Limit</span><span class="cam-popup-val" style="font-weight:700;">${cam.speed_limit} mph</span></div>` : ''}
        ${cam.direction ? `<div class="cam-popup-row"><span class="cam-popup-key">Direction</span><span class="cam-popup-val">${esc(cam.direction)}</span></div>` : ''}
        <div class="cam-popup-row"><span class="cam-popup-key">Operator</span><span class="cam-popup-val">${esc(cam.operator || 'Unknown')}</span></div>
        <div class="cam-popup-row"><span class="cam-popup-key">Coords</span><span class="cam-popup-val" style="font-family:monospace;font-size:10px;">${cam.lat.toFixed(5)}, ${cam.lng.toFixed(5)}</span></div>
        ${cam.notes ? `<div class="cam-popup-row" style="margin-top:6px;"><span class="cam-popup-val" style="font-style:italic;font-size:11px;color:var(--color-text-faint);width:100%;">${esc(cam.notes)}</span></div>` : ''}
      </div>
    </div>`;
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ----------------------------------------------------------------
   MAP INIT
   ---------------------------------------------------------------- */
const TN_CENTER = [35.7, -86.3];
const TN_ZOOM   = 7;

function initScMap() {
  if (scMap) return;

  scMap = L.map('scMap', {
    center: TN_CENTER,
    zoom: TN_ZOOM,
    zoomControl: true,
    fadeAnimation: false,
    markerZoomAnimation: false,
  });

  scMap.zoomControl.setPosition('bottomleft');

  // Use current mapMode from app.js (shared global)
  const mode = (typeof mapMode !== 'undefined') ? mapMode : 'dark';
  const src = (typeof TILE_SOURCES !== 'undefined' && TILE_SOURCES[mode]) || {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { attribution: '&copy; OSM', maxZoom: 19 }
  };
  scTileLayer = L.tileLayer(src.url, src.opts).addTo(scMap);

  // Add traffic flow overlay (on by default, synced with camera map toggle)
  if (typeof addTrafficFlowLayer === 'function' && typeof trafficFlowVisible !== 'undefined' && trafficFlowVisible) {
    scTrafficFlowLayer = addTrafficFlowLayer(scMap);
  }

  // Add map mode control to speed cams map too
  if (typeof addMapModeControl === 'function') addMapModeControl(scMap, 'sc');

  // Force size recalculation once the browser has painted
  scMap.whenReady(() => {
    requestAnimationFrame(() => {
      scMap.invalidateSize({ animate: false });
    });
  });
}

function updateScTileLayer() {
  // Called on theme toggle — use current mapMode
  if (!scMap || !scTileLayer) return;
  const mode = (typeof mapMode !== 'undefined') ? mapMode : 'dark';
  updateScTileForMode(mode);
}

// Speed cam traffic flow layer reference (managed by app.js toggleTrafficFlow)
var scTrafficFlowLayer = null;

/** Called from app.js map-mode-control to sync speed cams map */
function updateScTileForMode(mode) {
  if (!scMap) return;
  if (scTileLayer) scMap.removeLayer(scTileLayer);
  const src = (typeof TILE_SOURCES !== 'undefined' && TILE_SOURCES[mode]) || {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { attribution: '&copy; OSM', maxZoom: 19 }
  };
  scTileLayer = L.tileLayer(src.url, src.opts);
  if (src.fallback) {
    const fb = (typeof TILE_SOURCES !== 'undefined') ? TILE_SOURCES[src.fallback] : src;
    scTileLayer.on('tileerror', () => {
      if (scTileLayer) scMap.removeLayer(scTileLayer);
      scTileLayer = L.tileLayer(fb.url, fb.opts).addTo(scMap);
    });
  }
  scTileLayer.addTo(scMap);
}

// Hook into theme toggle to update speed cam tiles too
const origThemeBtn = document.querySelector('[data-theme-toggle]');
if (origThemeBtn) {
  origThemeBtn.addEventListener('click', () => {
    setTimeout(() => { if (scMap) updateScTileLayer(); }, 50);
  });
}

/* ----------------------------------------------------------------
   DATA LOAD
   ---------------------------------------------------------------- */
async function loadScData() {
  try {
    const res = await fetch('./tn_speed_cams.json');
    scAllCameras = await res.json();
    console.log(`Speed cams: loaded ${scAllCameras.length} records`);
  } catch(e) {
    console.error('Failed to load speed cam data', e);
    scAllCameras = [];
  }
}

/* ----------------------------------------------------------------
   RENDER MARKERS
   ---------------------------------------------------------------- */
function renderScMarkers(cameras) {
  Object.values(scMarkers).forEach(m => scMap.removeLayer(m));
  scMarkers = {};

  cameras.forEach((cam, i) => {
    if (!cam.lat || !cam.lng) return;
    const icon = createScIcon(cam);
    const marker = L.marker([cam.lat, cam.lng], { icon });
    marker.bindPopup(scPopup(cam), { maxWidth: 280, minWidth: 220 });
    marker.addTo(scMap);
    scMarkers[i] = marker;
    marker._camData = cam;
  });

  // Update stats
  document.getElementById('scStatShown').textContent = cameras.length;
}

/* ----------------------------------------------------------------
   SIDEBAR: FILTERS
   ---------------------------------------------------------------- */
function buildScFilters() {
  // Type filters
  const typeContainer = document.getElementById('scTypeFilters');
  ['ALL', 'speed', 'red_light'].forEach(t => {
    const label = t === 'ALL' ? 'All' : t === 'speed' ? 'Speed' : 'Red Light';
    const btn = document.createElement('button');
    btn.className = `chip${t === 'ALL' ? ' active' : ''}`;
    btn.dataset.type = t;
    btn.textContent = label;
    btn.onclick = () => {
      typeContainer.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scActiveType = t;
      applyScFilters();
    };
    typeContainer.appendChild(btn);
  });

  // Status filters
  const statusContainer = document.getElementById('scStatusFilters');
  ['ALL', 'active', 'disputed', 'removed'].forEach(s => {
    const label = s === 'ALL' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1);
    const btn = document.createElement('button');
    btn.className = `chip${s === 'ALL' ? ' active' : ''}`;
    btn.dataset.status = s;
    btn.textContent = label;
    btn.onclick = () => {
      statusContainer.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scActiveStatus = s;
      applyScFilters();
    };
    statusContainer.appendChild(btn);
  });

  // City list
  const cities = [...new Set(scAllCameras.map(c => c.city))].sort();
  const cityList = document.getElementById('scCityList');
  const allBtn = document.createElement('div');
  allBtn.className = 'sc-city-item active';
  allBtn.textContent = `All Cities (${scAllCameras.length})`;
  allBtn.dataset.city = 'ALL';
  allBtn.onclick = () => handleCityClick('ALL');
  cityList.appendChild(allBtn);

  cities.forEach(city => {
    const count = scAllCameras.filter(c => c.city === city).length;
    const active = scAllCameras.filter(c => c.city === city && c.status === 'active').length;
    const el = document.createElement('div');
    el.className = 'sc-city-item';
    el.dataset.city = city;
    el.innerHTML = `<span>${esc(city)}</span><span class="sc-city-count">${active > 0 ? `<strong style="color:var(--color-error)">${active} active</strong> / ` : ''}${count}</span>`;
    el.onclick = () => handleCityClick(city);
    cityList.appendChild(el);
  });

  // Stats
  document.getElementById('scStatTotal').textContent = scAllCameras.length;
  document.getElementById('scStatActive').textContent = scAllCameras.filter(c => c.status === 'active').length;
  document.getElementById('scStatCities').textContent = cities.length;
}

function handleCityClick(city) {
  scActiveCity = city;
  document.querySelectorAll('.sc-city-item').forEach(el => {
    el.classList.toggle('active', el.dataset.city === city);
  });
  applyScFilters();
  if (city !== 'ALL') {
    const cityCams = scAllCameras.filter(c => c.city === city);
    if (cityCams.length) {
      const group = L.featureGroup(cityCams.map(c => L.marker([c.lat, c.lng])));
      scMap.fitBounds(group.getBounds().pad(0.3), { animate: true });
    }
  }
}

/* ----------------------------------------------------------------
   SEARCH
   ---------------------------------------------------------------- */
document.getElementById('scSearchInput').addEventListener('input', e => {
  scSearchQuery = e.target.value.trim().toLowerCase();
  applyScFilters();
});

/* ----------------------------------------------------------------
   APPLY FILTERS
   ---------------------------------------------------------------- */
function applyScFilters() {
  scFiltered = scAllCameras.filter(cam => {
    const matchType   = scActiveType === 'ALL'   || cam.type === scActiveType;
    const matchStatus = scActiveStatus === 'ALL' || cam.status === scActiveStatus;
    const matchCity   = scActiveCity === 'ALL'   || cam.city === scActiveCity;
    const searchStr   = `${cam.location} ${cam.city} ${cam.county} ${cam.operator || ''} ${cam.notes || ''} ${cam.type}`.toLowerCase();
    const matchSearch = !scSearchQuery || searchStr.includes(scSearchQuery);
    return matchType && matchStatus && matchCity && matchSearch;
  });
  renderScMarkers(scFiltered);
}

/* ----------------------------------------------------------------
   DRIVING MODE: GPS + PROXIMITY ALERTS
   ---------------------------------------------------------------- */
function toggleDrivingMode() {
  drivingMode = !drivingMode;
  const btn = document.getElementById('btnDrivingMode');
  const status = document.getElementById('dmStatus');
  const gpsBar = document.getElementById('gpsBar');

  if (drivingMode) {
    btn.classList.add('active');
    status.textContent = 'ON';
    status.style.color = 'var(--color-success)';
    gpsBar.removeAttribute('hidden');
    startGPS();
  } else {
    btn.classList.remove('active');
    status.textContent = 'OFF';
    status.style.color = '';
    gpsBar.setAttribute('hidden', '');
    stopGPS();
  }
}

document.getElementById('btnDrivingMode').addEventListener('click', toggleDrivingMode);

function startGPS() {
  if (!navigator.geolocation) {
    document.getElementById('gpsText').textContent = 'GPS: Not supported';
    return;
  }
  const gpsDot = document.getElementById('gpsDot');
  const gpsText = document.getElementById('gpsText');
  gpsDot.className = 'gps-dot acquiring';
  gpsText.textContent = 'GPS: Acquiring…';

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      gpsDot.className = 'gps-dot locked';
      gpsText.textContent = `GPS: Locked (±${Math.round(accuracy)}m)`;

      updateUserPosition(latitude, longitude, accuracy);
      checkProximity(latitude, longitude);
    },
    (err) => {
      gpsDot.className = 'gps-dot error';
      gpsText.textContent = `GPS: ${err.message}`;
    },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
  );
}

function stopGPS() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (userMarker) { scMap.removeLayer(userMarker); userMarker = null; }
  if (userCircle) { scMap.removeLayer(userCircle); userCircle = null; }
  alertedCameras.clear();
  hideAlert();
}

function updateUserPosition(lat, lng, accuracy) {
  const latlng = [lat, lng];

  if (!userMarker) {
    userMarker = L.circleMarker(latlng, {
      radius: 7, fillColor: '#388bfd', fillOpacity: 1,
      color: 'white', weight: 2,
    }).addTo(scMap);

    userCircle = L.circle(latlng, {
      radius: alertDistance,
      color: '#388bfd', fillColor: '#388bfd',
      fillOpacity: 0.08, weight: 1, dashArray: '6 4',
    }).addTo(scMap);

    scMap.setView(latlng, 14, { animate: true });
  } else {
    userMarker.setLatLng(latlng);
    userCircle.setLatLng(latlng);
    userCircle.setRadius(alertDistance);
  }
}

/* ----------------------------------------------------------------
   PROXIMITY CHECK — Audio + Banner alert
   ---------------------------------------------------------------- */
function checkProximity(userLat, userLng) {
  const activeCams = scAllCameras.filter(c => c.status === 'active');
  let nearest = null;
  let nearestDist = Infinity;

  activeCams.forEach(cam => {
    const dist = haversine(userLat, userLng, cam.lat, cam.lng);
    if (dist < alertDistance && dist < nearestDist) {
      nearest = cam;
      nearestDist = dist;
    }
  });

  if (nearest && !alertedCameras.has(`${nearest.lat},${nearest.lng}`)) {
    const now = Date.now();
    // Throttle alerts to max once every 10 seconds
    if (now - lastAlertTime > 10000) {
      lastAlertTime = now;
      alertedCameras.add(`${nearest.lat},${nearest.lng}`);
      showAlert(nearest, nearestDist);
      playBeep();
    }
  }

  // Clear alerts for cameras we've passed (> 2x alert distance)
  alertedCameras.forEach(key => {
    const [clat, clng] = key.split(',').map(Number);
    if (haversine(userLat, userLng, clat, clng) > alertDistance * 2) {
      alertedCameras.delete(key);
    }
  });
}

function showAlert(cam, distMeters) {
  const banner = document.getElementById('alertBanner');
  const title = document.getElementById('alertTitle');
  const detail = document.getElementById('alertDetail');

  const typeLabel = cam.type === 'speed' ? 'Speed Camera' : 'Red Light Camera';
  const distMi = (distMeters / METERS_PER_MILE).toFixed(1);
  const limitStr = cam.speed_limit ? ` — ${cam.speed_limit} mph zone` : '';

  title.textContent = `⚠ ${typeLabel} Ahead`;
  detail.textContent = `${cam.location}${limitStr} — ${distMi} mi ahead`;

  banner.removeAttribute('hidden');
  banner.classList.add('flash');
  setTimeout(() => banner.classList.remove('flash'), 600);

  // Auto-hide after 12 seconds
  clearTimeout(banner._hideTimer);
  banner._hideTimer = setTimeout(hideAlert, 12000);
}

function hideAlert() {
  document.getElementById('alertBanner').setAttribute('hidden', '');
}

document.getElementById('alertDismiss').addEventListener('click', hideAlert);

/* ----------------------------------------------------------------
   AUDIO BEEP — Web Audio API
   ---------------------------------------------------------------- */
function playBeep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Double beep pattern
    [0, 0.2].forEach(offset => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + offset + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + offset);
      osc.stop(audioCtx.currentTime + offset + 0.15);
    });
  } catch(e) {
    console.warn('Audio beep failed:', e);
  }
}

/* ----------------------------------------------------------------
   HAVERSINE DISTANCE (meters)
   ---------------------------------------------------------------- */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ----------------------------------------------------------------
   MAP CONTROLS
   ---------------------------------------------------------------- */
document.getElementById('scBtnResetView').addEventListener('click', () => {
  if (scMap) scMap.setView(TN_CENTER, TN_ZOOM, { animate: true });
});
document.getElementById('scBtnMyLocation').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      scMap.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
    });
  }
});

/* ----------------------------------------------------------------
   TAB HOOK — Init map when first shown
   ---------------------------------------------------------------- */
let scInitialized = false;
let scDataReady   = false;

async function ensureScData() {
  if (!scDataReady) {
    await loadScData();
    scDataReady = true;
  }
}

async function initSpeedCamsPanel() {
  if (scInitialized) return;
  scInitialized = true;

  // Wait one frame to ensure panel is fully visible before Leaflet measures the container
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 80)));

  initScMap();
  await ensureScData();
  buildScFilters();
  scFiltered = [...scAllCameras];
  renderScMarkers(scFiltered);

  // Invalidate map size after render to account for any layout shifts
  setTimeout(() => { if (scMap) scMap.invalidateSize(); }, 200);
}

document.querySelectorAll('.main-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.panel === 'speedcams') {
      setTimeout(async () => {
        await initSpeedCamsPanel();
        // Re-invalidate on every visit (handles sidebar collapse/expand edge cases)
        setTimeout(() => { if (scMap) scMap.invalidateSize(); }, 100);
      }, 30);
    }
  });
});

// Pre-load data in background
ensureScData();

/* ----------------------------------------------------------------
   SPEED CAMS REGION FILTER — UI only (TN-only data for now)
   The regionFilterSc chips are wired up here. Currently only
   "Tennessee" has data; this is prepared for future MS/AR expansion.
   ---------------------------------------------------------------- */
(function initScRegionFilter() {
  const container = document.getElementById('regionFilterSc');
  if (!container) return;
  container.querySelectorAll('.region-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.region-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Currently all data is TN; filter is a no-op but wired for future expansion
      // When MS/AR speed cam data is added, filter scAllCameras by state here
    });
  });
})();
