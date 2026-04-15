/* ================================================================
   Memphis Live Camera Map — app.js
   Data sources:
     TN: TDOT SmartWay Open Data API (public) / cameras.json fallback
     MS: ms_cameras.json (MDOT DeSoto County HLS cameras)
     AR: ar_cameras.json (ArDOT Crittenden County snapshot cameras)
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   CONSTANTS
   ---------------------------------------------------------------- */
const MEMPHIS_CENTER = [35.1495, -90.049];
const MEMPHIS_ZOOM   = 10;
const TDOT_BASE      = 'https://www.tdot.tn.gov/opendata/api/public/';
const TDOT_API_KEY   = '8d3b7a82635d476795c09b2c41facc60';

/* Route display names & colors */
const ROUTE_COLORS = {
  'I-40':       '#388bfd',
  'I-240':      '#f59e0b',
  'I-55':       '#3fb950',
  'SR 385':     '#a78bfa',
  '385':        '#a78bfa',
  'Sam Cooper': '#fb923c',
  '51':         '#22d3ee',
  'MS-302':     '#f472b6',
  'MS-78':      '#e879f9',
  'MS-196':     '#c084fc',
  'US-51':      '#22d3ee',
  'US-72':      '#34d399',
  'I-555':      '#60a5fa',
  '':           '#8b949e',
};
function routeColor(route) {
  return ROUTE_COLORS[route] || '#8b949e';
}

/* ----------------------------------------------------------------
   STATE
   ---------------------------------------------------------------- */
let allCameras     = [];   // TN cameras (TDOT format)
let msCameras      = [];   // MS cameras (MDOT format)
let arCameras      = [];   // AR cameras (ArDOT snapshot format)
let filteredCameras = [];
let markers        = {};   // keyed by unique cam key
let activeRoute    = 'ALL';
let activeRegion   = 'all';
let searchQuery    = '';
let map;
let currentHls     = null;
let activeCamId    = null;

// AR snapshot auto-refresh
let arRefreshTimer = null;

// Map mode: 'street' | 'dark' | 'satellite'
let mapMode = 'dark';

/* ----------------------------------------------------------------
   THEME TOGGLE
   ---------------------------------------------------------------- */
(function initTheme() {
  const btn = document.querySelector('[data-theme-toggle]');
  const html = document.documentElement;
  let dark = true;
  html.setAttribute('data-theme', 'dark');
  if (btn) {
    btn.addEventListener('click', () => {
      dark = !dark;
      html.setAttribute('data-theme', dark ? 'dark' : 'light');
      btn.innerHTML = dark
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
      updateTileLayer();
    });
  }
})();

/* ----------------------------------------------------------------
   MAP INITIALIZATION
   ---------------------------------------------------------------- */
/* ----------------------------------------------------------------
   MAP TILE LAYERS & MODE TOGGLE
   ---------------------------------------------------------------- */
const TILE_SOURCES = {
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>', maxZoom: 19 },
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    opts: { attribution: '&copy; <a href="https://carto.com/">CARTO</a>', subdomains: 'abcd', maxZoom: 19 },
    fallback: 'street',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: { attribution: '&copy; Esri', maxZoom: 19 },
  },
};

let tileLayer;

/* ----------------------------------------------------------------
   TRAFFIC FLOW TILE OVERLAY (TomTom Raster Flow Tiles)
   Free tier: 2,500 requests/day. Transparent PNG overlay.
   ---------------------------------------------------------------- */
const TOMTOM_KEY = 'xgEkdZ90tJT39oXkMU7pcFLEj1XOxO6q';
let trafficFlowLayer = null;
let trafficFlowVisible = true;

function getTrafficFlowStyle() {
  return mapMode === 'satellite' ? 'relative0' : 'relative0-dark';
}

function addTrafficFlowLayer(targetMap) {
  if (!targetMap) return null;
  const style = getTrafficFlowStyle();
  const layer = L.tileLayer(
    'https://{s}.api.tomtom.com/traffic/map/4/tile/flow/' + style + '/{z}/{x}/{y}.png?tileSize=256&key=' + TOMTOM_KEY,
    { subdomains: 'abcd', opacity: 0.75, maxZoom: 18, zIndex: 400 }
  );
  layer.addTo(targetMap);
  return layer;
}

function removeTrafficFlowLayer(targetMap, layer) {
  if (layer && targetMap) targetMap.removeLayer(layer);
  return null;
}

function toggleTrafficFlow() {
  trafficFlowVisible = !trafficFlowVisible;
  const btn = document.getElementById('btnToggleTraffic');
  if (trafficFlowVisible) {
    trafficFlowLayer = addTrafficFlowLayer(map);
    if (typeof scMap !== 'undefined' && scMap) {
      scTrafficFlowLayer = addTrafficFlowLayer(scMap);
    }
    if (btn) { btn.classList.add('active'); btn.title = 'Hide traffic flow'; }
  } else {
    trafficFlowLayer = removeTrafficFlowLayer(map, trafficFlowLayer);
    if (typeof scMap !== 'undefined' && scMap) {
      scTrafficFlowLayer = removeTrafficFlowLayer(scMap, scTrafficFlowLayer);
    }
    if (btn) { btn.classList.remove('active'); btn.title = 'Show traffic flow'; }
  }
}

/** Refresh traffic flow style when map mode changes (dark vs satellite) */
function refreshTrafficFlowStyle() {
  if (!trafficFlowVisible) return;
  if (trafficFlowLayer && map) {
    trafficFlowLayer = removeTrafficFlowLayer(map, trafficFlowLayer);
    trafficFlowLayer = addTrafficFlowLayer(map);
  }
  if (typeof scMap !== 'undefined' && scMap && typeof scTrafficFlowLayer !== 'undefined' && scTrafficFlowLayer) {
    scTrafficFlowLayer = removeTrafficFlowLayer(scMap, scTrafficFlowLayer);
    scTrafficFlowLayer = addTrafficFlowLayer(scMap);
  }
}

function initMap() {
  map = L.map('map', {
    center: MEMPHIS_CENTER,
    zoom: MEMPHIS_ZOOM,
    zoomControl: true,
    attributionControl: true,
  });
  map.zoomControl.setPosition('bottomleft');
  updateTileLayer();
  // Add traffic flow on top of base tiles (on by default)
  trafficFlowLayer = addTrafficFlowLayer(map);
  addMapModeControl(map, 'cam');
}

function updateTileLayer() {
  if (tileLayer) map.removeLayer(tileLayer);
  const src = TILE_SOURCES[mapMode] || TILE_SOURCES.dark;
  tileLayer = L.tileLayer(src.url, src.opts);
  if (src.fallback) {
    tileLayer.on('tileerror', () => {
      if (tileLayer) map.removeLayer(tileLayer);
      const fb = TILE_SOURCES[src.fallback];
      tileLayer = L.tileLayer(fb.url, fb.opts).addTo(map);
    });
  }
  tileLayer.addTo(map);
}

/** Shared map-mode control — works for both camera map and speedcam map */
function addMapModeControl(targetMap, prefix) {
  const MapModeControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const container = L.DomUtil.create('div', 'map-mode-control leaflet-bar');
      L.DomEvent.disableClickPropagation(container);
      const modes = [
        { id: 'street',    label: 'Street',    icon: '🗺️' },
        { id: 'dark',      label: 'Dark',      icon: '🌙' },
        { id: 'satellite', label: 'Satellite',  icon: '🛰️' },
      ];
      modes.forEach(m => {
        const btn = L.DomUtil.create('button', 'map-mode-btn' + (m.id === mapMode ? ' active' : ''), container);
        btn.innerHTML = `<span class="map-mode-icon">${m.icon}</span><span class="map-mode-label">${m.label}</span>`;
        btn.title = m.label;
        btn.dataset.mode = m.id;
        btn.addEventListener('click', () => {
          mapMode = m.id;
          // Update this control's active state
          container.querySelectorAll('.map-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m.id));
          // Update tile layer on camera map
          updateTileLayer();
          // Refresh traffic flow style for new map mode
          refreshTrafficFlowStyle();
          // Sync speed cams map if it exists
          if (typeof updateScTileForMode === 'function') updateScTileForMode(m.id);
          // Sync other map-mode controls on the page
          document.querySelectorAll('.map-mode-control').forEach(ctrl => {
            ctrl.querySelectorAll('.map-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m.id));
          });
        });
      });
      return container;
    },
  });
  new MapModeControl().addTo(targetMap);
}

/* ----------------------------------------------------------------
   DATA LOADING — TN (TDOT)
   ---------------------------------------------------------------- */
async function loadTnCameras() {
  try {
    const res = await fetch(`${TDOT_BASE}RoadwayCameras`, {
      headers: { 'x-api-key': TDOT_API_KEY },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const data = await res.json();
      const memphisBbox = { minLat: 34.9, maxLat: 35.45, minLng: -90.35, maxLng: -89.55 };
      allCameras = data.filter(c =>
        c.jurisdiction === 'Memphis' ||
        (c.lat >= memphisBbox.minLat && c.lat <= memphisBbox.maxLat &&
         c.lng >= memphisBbox.minLng && c.lng <= memphisBbox.maxLng)
      ).map(c => ({ ...c, state: 'TN' }));
      console.log(`Live API: loaded ${allCameras.length} TN cameras`);
    } else {
      throw new Error('API response not ok');
    }
  } catch(e) {
    console.log('Using local TN camera data:', e.message);
    try {
      const res = await fetch('./cameras.json');
      allCameras = await res.json();
    } catch(e2) {
      console.error('Failed to load TN camera data', e2);
      allCameras = [];
    }
  }
  return allCameras;
}

/* ----------------------------------------------------------------
   DATA LOADING — MS (MDOT)
   ---------------------------------------------------------------- */
async function loadMsCameras() {
  try {
    const res = await fetch('./ms_cameras.json');
    if (!res.ok) throw new Error('ms_cameras.json not found');
    const data = await res.json();
    // Normalize to internal format — assign a unique id based on index+offset
    msCameras = data.map((site, idx) => ({
      _msIdx: idx,
      id: `ms_${idx}`,
      title: site.name,
      description: site.name,
      name: site.name,
      lat: site.lat,
      lng: site.lon,
      route: site.route || 'Other',
      mileMarker: '0',
      state: 'MS',
      active: 'true',
      jurisdiction: 'MS-DeSoto',
      cam_views: site.cam_views,
      // Use first view's thumbnail as primary thumbnail
      thumbnailUrl: site.cam_views && site.cam_views.length > 0 ? site.cam_views[0].thumbnail_url : '',
      httpsVideoUrl: site.cam_views && site.cam_views.length > 0 ? site.cam_views[0].hls_url : '',
    }));
    console.log(`Loaded ${msCameras.length} MS camera sites`);
  } catch(e) {
    console.warn('Failed to load MS cameras:', e.message);
    msCameras = [];
  }
  return msCameras;
}

/* ----------------------------------------------------------------
   DATA LOADING — AR (ArDOT)
   ---------------------------------------------------------------- */
async function loadArCameras() {
  try {
    const res = await fetch('./ar_cameras.json');
    if (!res.ok) throw new Error('ar_cameras.json not found');
    const data = await res.json();
    // Normalize to internal format
    arCameras = data.map(cam => ({
      id: `ar_${cam.id}`,
      _arId: cam.id,
      title: cam.name,
      description: cam.name,
      name: cam.name,
      lat: cam.lat,
      lng: cam.lon,
      route: cam.route || 'Other',
      mileMarker: '0',
      state: 'AR',
      active: cam.status === 'online' ? 'true' : 'false',
      jurisdiction: 'AR-Crittenden',
      snapshot_url: cam.snapshot_url,
      thumbnailUrl: cam.snapshot_url,
      httpsVideoUrl: null,
    }));
    console.log(`Loaded ${arCameras.length} AR cameras`);
  } catch(e) {
    console.warn('Failed to load AR cameras:', e.message);
    arCameras = [];
  }
  return arCameras;
}

/* ----------------------------------------------------------------
   COMBINED CAMERA ARRAY
   ---------------------------------------------------------------- */
function getCombinedCameras() {
  return [...allCameras, ...msCameras, ...arCameras];
}

/* ----------------------------------------------------------------
   MARKER CREATION
   ---------------------------------------------------------------- */
function createMarkerIcon(cam) {
  const color = routeColor(cam.route);
  // AR cameras get a slightly different style (no HLS, snapshot only)
  const isAr = cam.state === 'AR';
  const svgInner = isAr
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" fill="${color}22" stroke="${color}" stroke-width="1.8" stroke-dasharray="3 2"/>
        <circle cx="11" cy="11" r="4.5" fill="${color}99"/>
        <circle cx="11" cy="11" r="2" fill="white" opacity="0.8"/>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" fill="${color}22" stroke="${color}" stroke-width="1.8"/>
        <circle cx="11" cy="11" r="4.5" fill="${color}"/>
        <circle cx="11" cy="11" r="2" fill="white"/>
      </svg>`;
  return L.divIcon({
    html: svgInner,
    className: 'custom-cam-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
}

function buildPopupContent(cam) {
  const color = routeColor(cam.route);
  const isAr = cam.state === 'AR';
  const isMs = cam.state === 'MS';
  const thumbSrc = cam.thumbnailUrl || '';
  const thumbHtml = thumbSrc
    ? `<img class="cam-popup-thumb" src="${thumbSrc}" alt="${cam.title}" loading="lazy" onerror="this.style.display='none'" />`
    : `<div style="height:8px;"></div>`;

  const mmText = cam.mileMarker && cam.mileMarker !== '0' ? `MM ${cam.mileMarker}` : '';
  const routeText = cam.route || 'Unknown Route';
  const coords = `${cam.lat.toFixed(5)}, ${cam.lng.toFixed(5)}`;
  const stateLabel = cam.state === 'TN' ? 'Tennessee' : cam.state === 'MS' ? 'Mississippi' : 'Arkansas';

  const streamBadge = isAr
    ? `<span class="cam-popup-val" style="color:var(--color-warning);">📷 Snapshot</span>`
    : `<span class="cam-popup-val" style="color:var(--color-success);">● HLS Live</span>`;

  const viewCount = isMs && cam.cam_views ? `<div class="cam-popup-row"><span class="cam-popup-key">Views</span><span class="cam-popup-val">${cam.cam_views.length}</span></div>` : '';

  const watchBtn = isAr
    ? `<button class="cam-popup-watch" onclick="openSnapshot('${cam.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        View Snapshot
      </button>`
    : `<button class="cam-popup-watch" onclick="openStream('${cam.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Watch Live Stream
      </button>`;

  return `
    <div class="cam-popup">
      ${thumbHtml}
      <div class="cam-popup-name">${escHtml(cam.title)}</div>
      <div class="cam-popup-meta">
        <div class="cam-popup-row">
          <span class="cam-popup-key">State</span>
          <span class="cam-popup-val">${escHtml(stateLabel)}</span>
        </div>
        <div class="cam-popup-row">
          <span class="cam-popup-key">Route</span>
          <span class="cam-popup-val" style="color:${color};font-weight:600;">${escHtml(routeText)} ${escHtml(mmText)}</span>
        </div>
        ${viewCount}
        <div class="cam-popup-row">
          <span class="cam-popup-key">Stream</span>
          ${streamBadge}
        </div>
      </div>
      ${watchBtn}
    </div>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ----------------------------------------------------------------
   RENDER MARKERS
   ---------------------------------------------------------------- */
function renderMarkers(cameras) {
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};

  cameras.forEach(cam => {
    if (!cam.lat || !cam.lng) return;
    const icon = createMarkerIcon(cam);
    const marker = L.marker([cam.lat, cam.lng], { icon, title: cam.title });
    marker.bindPopup(buildPopupContent(cam), {
      maxWidth: 260,
      minWidth: 240,
      className: 'cam-popup-wrapper',
    });
    marker.on('click', () => {
      highlightListItem(cam.id);
    });
    marker.addTo(map);
    markers[cam.id] = marker;
  });

  const total = cameras.length;
  const active = cameras.filter(c => c.active === 'true').length;
  document.getElementById('statVisible').textContent = total;
  document.getElementById('statActive').textContent = active;
  document.getElementById('camCount').textContent = `${total} Cameras`;
}

/* ----------------------------------------------------------------
   SIDEBAR CAMERA LIST
   ---------------------------------------------------------------- */
function renderCamList(cameras) {
  const list = document.getElementById('camList');
  if (!cameras.length) {
    list.innerHTML = '<div class="no-cams-msg">No cameras match your filters.</div>';
    return;
  }
  const html = cameras.map(cam => {
    const color = routeColor(cam.route);
    const isAr = cam.state === 'AR';
    const thumb = cam.thumbnailUrl
      ? `<img class="cam-thumb" src="${cam.thumbnailUrl}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="cam-thumb-placeholder" style="display:none"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div>`
      : `<div class="cam-thumb-placeholder"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div>`;
    const stateBadge = cam.state !== 'TN'
      ? `<span style="font-size:9px;background:${color}22;border:1px solid ${color}55;color:${color};border-radius:3px;padding:1px 4px;margin-left:4px;">${cam.state}</span>`
      : '';
    const snapBadge = isAr
      ? `<span style="font-size:9px;background:rgba(217,119,6,0.15);border:1px solid #d9770655;color:#d97706;border-radius:3px;padding:1px 4px;margin-left:4px;">SNAP</span>`
      : '';
    const idStr = String(cam.id).replace(/['"\\]/g, '');
    return `
      <div class="cam-item" id="list-item-${idStr}" data-cam-id="${idStr}" onclick="handleListClick('${idStr}')">
        ${thumb}
        <div class="cam-item-info">
          <div class="cam-item-name">${escHtml(cam.title)}${stateBadge}${snapBadge}</div>
          <div class="cam-item-route" style="color:${color}">${escHtml(cam.route || 'Unknown')} ${cam.mileMarker && cam.mileMarker !== '0' ? '· MM ' + cam.mileMarker : ''}</div>
        </div>
        <span class="cam-status-dot"></span>
      </div>`;
  }).join('');
  list.innerHTML = html;
}

function highlightListItem(id) {
  document.querySelectorAll('.cam-item.active-cam').forEach(el => el.classList.remove('active-cam'));
  const el = document.getElementById(`list-item-${id}`);
  if (el) {
    el.classList.add('active-cam');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function handleListClick(id) {
  const combined = getCombinedCameras();
  const cam = combined.find(c => String(c.id) === String(id));
  if (!cam) return;
  highlightListItem(id);
  if (markers[id]) {
    map.setView([cam.lat, cam.lng], 14, { animate: true });
    markers[id].openPopup();
  }
}

/* ----------------------------------------------------------------
   ROUTE FILTER CHIPS
   ---------------------------------------------------------------- */
function buildRouteFilters(cameras) {
  const routes = ['ALL', ...Array.from(new Set(cameras.map(c => c.route || 'Other'))).sort()];
  document.getElementById('statRoutes').textContent = routes.length - 1;
  const container = document.getElementById('routeFilters');
  container.innerHTML = routes.map(r => `
    <button class="chip${r === 'ALL' ? ' active' : ''}" data-route="${escHtml(r)}">${r === '' ? 'Other' : escHtml(r)}</button>
  `).join('');
  container.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRoute = btn.dataset.route;
      applyFilters();
    });
  });
}

/* ----------------------------------------------------------------
   REGION FILTER CHIPS
   ---------------------------------------------------------------- */
function initRegionFilters() {
  const container = document.getElementById('regionFilterCams');
  if (!container) return;
  container.querySelectorAll('.region-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.region-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRegion = btn.dataset.region;
      applyFilters();
    });
  });
}

/* ----------------------------------------------------------------
   SEARCH
   ---------------------------------------------------------------- */
document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  applyFilters();
});

/* ----------------------------------------------------------------
   FILTER LOGIC
   ---------------------------------------------------------------- */
function applyFilters() {
  const combined = getCombinedCameras();
  filteredCameras = combined.filter(cam => {
    const matchRegion = activeRegion === 'all' || cam.state === activeRegion;
    const matchRoute = activeRoute === 'ALL' || (cam.route || 'Other') === activeRoute;
    const searchStr = `${cam.title} ${cam.route} ${cam.mileMarker || ''} ${cam.id} ${cam.state}`.toLowerCase();
    const matchSearch = !searchQuery || searchStr.includes(searchQuery);
    return matchRegion && matchRoute && matchSearch;
  });
  renderMarkers(filteredCameras);
  renderCamList(filteredCameras);
}

/* ----------------------------------------------------------------
   LIVE STREAM MODAL — TN & MS cameras (HLS)
   ---------------------------------------------------------------- */
window.openStream = function(id) {
  const combined = getCombinedCameras();
  const cam = combined.find(c => String(c.id) === String(id));
  if (!cam) return;
  activeCamId = id;

  document.getElementById('modalTitle').textContent = cam.title;

  const color = routeColor(cam.route);
  const mmText = cam.mileMarker && cam.mileMarker !== '0' ? `MM ${cam.mileMarker}` : '';
  const stateLabel = cam.state === 'TN' ? 'TN' : cam.state === 'MS' ? 'MS' : 'AR';

  document.getElementById('modalMeta').innerHTML = `
    <span class="tag route" style="background:${color}22;border-color:${color};color:${color};">${escHtml(cam.route || 'Unknown')}</span>
    ${mmText ? `<span class="tag">${escHtml(mmText)}</span>` : ''}
    <span class="tag">${escHtml(stateLabel)}</span>
    <span class="tag" style="color:var(--color-success)">● Active</span>
  `;

  const coords = `${cam.lat.toFixed(6)}, ${cam.lng.toFixed(6)}`;

  // MS cameras may have multiple views — build a view selector
  const isMs = cam.state === 'MS' && cam.cam_views && cam.cam_views.length > 1;
  let viewSelector = '';
  if (isMs) {
    viewSelector = `
      <div class="info-group">
        <div class="info-group-label">Camera Views (${cam.cam_views.length})</div>
        ${cam.cam_views.map((v, i) => `
          <div class="info-row" style="cursor:pointer;" onclick="switchMsView('${escHtml(cam.id)}', ${i})">
            <span class="info-key" style="font-size:11px;">${escHtml(v.title)}</span>
            <span class="info-val" style="color:var(--color-primary);font-size:11px;">▶ Play</span>
          </div>`).join('')}
      </div>`;
  }

  document.getElementById('modalInfo').innerHTML = `
    <div class="info-group">
      <div class="info-group-label">Location</div>
      <div class="info-row"><span class="info-key">Name</span><span class="info-val">${escHtml(cam.title)}</span></div>
      <div class="info-row"><span class="info-key">State</span><span class="info-val">${cam.state === 'TN' ? 'Tennessee' : cam.state === 'MS' ? 'Mississippi' : 'Arkansas'}</span></div>
      <div class="info-row"><span class="info-key">Route</span><span class="info-val" style="color:${color}">${escHtml(cam.route || 'N/A')}</span></div>
      <div class="info-row"><span class="info-key">Coordinates</span><span class="info-val">${coords}</span></div>
    </div>
    ${viewSelector}
    <div class="info-group">
      <div class="info-group-label">Thumbnail</div>
      <div class="info-row">
        <img src="${escHtml(cam.thumbnailUrl || '')}" alt="Camera preview" style="width:100%;border-radius:4px;border:1px solid var(--color-border);" onerror="this.style.display='none'" loading="lazy" />
      </div>
    </div>
  `;

  // TDOT/SmartWay link — only for TN cameras
  const tdotLink = document.getElementById('tdotLink');
  if (cam.state === 'TN') {
    tdotLink.href = `https://smartway.tn.gov/traffic/text/region/4/cameras/route/${encodeURIComponent(cam.route || 'I-40')}/id/${cam._arId || cam.id}`;
    tdotLink.style.display = '';
    tdotLink.textContent = 'Open on TDOT SmartWay';
  } else if (cam.state === 'MS') {
    tdotLink.href = 'https://www.mdottraffic.com/';
    tdotLink.style.display = '';
    tdotLink.textContent = 'Open MDOT Traffic ↗';
  } else {
    tdotLink.href = 'https://idrivearkansas.com/';
    tdotLink.style.display = '';
    tdotLink.textContent = 'Open iDrive Arkansas ↗';
  }

  // Show modal with video player
  const videoWrap = document.getElementById('videoWrap');
  videoWrap.style.display = '';
  const overlay = document.getElementById('modalOverlay');
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  loadHlsStream(cam.httpsVideoUrl || cam.httpVideoUrl);
};

/* Switch MS camera view */
window.switchMsView = function(camId, viewIdx) {
  const cam = msCameras.find(c => String(c.id) === String(camId));
  if (!cam || !cam.cam_views || !cam.cam_views[viewIdx]) return;
  const view = cam.cam_views[viewIdx];
  document.getElementById('modalTitle').textContent = view.title;
  loadHlsStream(view.hls_url);
};

function loadHlsStream(streamUrl) {
  const video = document.getElementById('liveVideo');
  const overlay = document.getElementById('videoOverlay');

  overlay.classList.remove('hidden');
  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }
  video.src = '';

  if (!streamUrl) {
    overlay.innerHTML = '<span style="color:var(--color-text-muted)">Stream URL unavailable</span>';
    return;
  }

  if (Hls.isSupported()) {
    currentHls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
    });
    currentHls.loadSource(streamUrl);
    currentHls.attachMedia(video);
    currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
      overlay.classList.add('hidden');
    });
    currentHls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.warn('HLS fatal error:', data);
        overlay.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style="color:var(--color-text-muted);text-align:center;padding:0 16px;max-width:220px;">Live stream unavailable right now.<br><small style="color:var(--color-text-faint)">Camera may be offline or stream is geo-restricted.</small></span>
          <a href="${streamUrl}" target="_blank" style="color:var(--color-primary);font-size:13px;margin-top:8px;">Try direct link ↗</a>
        `;
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = streamUrl;
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(() => {});
      overlay.classList.add('hidden');
    }, { once: true });
    video.addEventListener('error', () => {
      overlay.innerHTML = '<span style="color:var(--color-text-muted)">Stream unavailable on this browser.</span>';
    }, { once: true });
  } else {
    overlay.innerHTML = '<span style="color:var(--color-text-muted)">HLS not supported in this browser.</span>';
  }
}

/* ----------------------------------------------------------------
   SNAPSHOT MODAL — AR cameras (JPEG, no HLS)
   ---------------------------------------------------------------- */
window.openSnapshot = function(id) {
  const cam = arCameras.find(c => String(c.id) === String(id));
  if (!cam) return;
  activeCamId = id;

  document.getElementById('modalTitle').textContent = cam.title;

  const color = routeColor(cam.route);
  document.getElementById('modalMeta').innerHTML = `
    <span class="tag route" style="background:${color}22;border-color:${color};color:${color};">${escHtml(cam.route || 'Unknown')}</span>
    <span class="tag">AR</span>
    <span class="tag" style="color:var(--color-warning)">📷 Snapshot</span>
  `;

  const coords = `${cam.lat.toFixed(6)}, ${cam.lng.toFixed(6)}`;

  document.getElementById('modalInfo').innerHTML = `
    <div class="info-group">
      <div class="info-group-label">Location</div>
      <div class="info-row"><span class="info-key">Name</span><span class="info-val">${escHtml(cam.title)}</span></div>
      <div class="info-row"><span class="info-key">State</span><span class="info-val">Arkansas</span></div>
      <div class="info-row"><span class="info-key">Route</span><span class="info-val" style="color:${color}">${escHtml(cam.route || 'N/A')}</span></div>
      <div class="info-row"><span class="info-key">Coordinates</span><span class="info-val">${coords}</span></div>
      <div class="info-row"><span class="info-key">Source</span><span class="info-val">ArDOT / iDrive Arkansas</span></div>
    </div>
    <div class="info-group">
      <div class="info-group-label">Snapshot Controls</div>
      <div class="info-row" style="flex-direction:column;gap:6px;">
        <button class="cam-popup-watch" onclick="refreshArSnapshot('${id}')" style="width:100%;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          Refresh Now
        </button>
        <div style="font-size:11px;color:var(--color-text-muted);text-align:center;">Auto-refreshes every 10 seconds</div>
      </div>
    </div>
  `;

  // Replace video with snapshot image
  const videoWrap = document.getElementById('videoWrap');
  videoWrap.innerHTML = `
    <div style="position:relative;width:100%;background:#000;border-radius:8px;overflow:hidden;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;">
      <img id="arSnapshotImg" src="${escHtml(cam.snapshot_url)}?t=${Date.now()}" alt="${escHtml(cam.title)}"
        style="width:100%;height:100%;object-fit:contain;"
        onerror="document.getElementById('arSnapError').style.display='flex';this.style.display='none'" />
      <div id="arSnapError" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--color-text-muted);">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><line x1="4" y1="4" x2="20" y2="20" stroke="var(--color-error)"/></svg>
        <span style="font-size:13px;">Snapshot unavailable</span>
      </div>
      <div id="arSnapRefreshBadge" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.65);border-radius:4px;padding:2px 6px;font-size:10px;color:var(--color-warning);">📷 SNAPSHOT</div>
    </div>`;

  // Link
  const tdotLink = document.getElementById('tdotLink');
  tdotLink.href = `https://idrivearkansas.com/`;
  tdotLink.textContent = 'Open iDrive Arkansas ↗';

  // Show modal
  const overlay = document.getElementById('modalOverlay');
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  // Auto-refresh every 10 seconds
  if (arRefreshTimer) clearInterval(arRefreshTimer);
  arRefreshTimer = setInterval(() => {
    const img = document.getElementById('arSnapshotImg');
    if (img) {
      const errDiv = document.getElementById('arSnapError');
      if (errDiv) errDiv.style.display = 'none';
      img.style.display = '';
      img.src = `${cam.snapshot_url}?t=${Date.now()}`;
    } else {
      clearInterval(arRefreshTimer);
      arRefreshTimer = null;
    }
  }, 10000);
};

window.refreshArSnapshot = function(id) {
  const cam = arCameras.find(c => String(c.id) === String(id));
  if (!cam) return;
  const img = document.getElementById('arSnapshotImg');
  if (img) {
    const errDiv = document.getElementById('arSnapError');
    if (errDiv) errDiv.style.display = 'none';
    img.style.display = '';
    img.src = `${cam.snapshot_url}?t=${Date.now()}`;
  }
};

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.setAttribute('hidden', '');
  document.body.style.overflow = '';

  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }

  // Restore video element in videoWrap (may have been replaced by AR snapshot)
  const videoWrap = document.getElementById('videoWrap');
  if (!document.getElementById('liveVideo')) {
    videoWrap.innerHTML = `
      <video id="liveVideo" controls muted autoplay playsinline></video>
      <div class="video-overlay" id="videoOverlay">
        <div class="spinner"></div>
        <span>Connecting to live stream…</span>
      </div>`;
  } else {
    const video = document.getElementById('liveVideo');
    video.pause();
    video.src = '';
  }

  // Clear AR refresh timer
  if (arRefreshTimer) {
    clearInterval(arRefreshTimer);
    arRefreshTimer = null;
  }

  activeCamId = null;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeCamId) closeModal();
});

/* ----------------------------------------------------------------
   SIDEBAR & CONTROL BUTTONS
   ---------------------------------------------------------------- */
document.getElementById('btnResetView').addEventListener('click', () => {
  map.setView(MEMPHIS_CENTER, MEMPHIS_ZOOM, { animate: true });
});

document.getElementById('btnToggleSidebar').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
    setTimeout(() => map.invalidateSize(), 250);
  }
});

/* ----------------------------------------------------------------
   BOOTSTRAP
   ---------------------------------------------------------------- */
async function main() {
  initMap();

  // Load all three states in parallel
  await Promise.all([
    loadTnCameras(),
    loadMsCameras(),
    loadArCameras(),
  ]);

  const combined = getCombinedCameras();
  if (!combined.length) {
    console.error('No camera data available');
    return;
  }

  filteredCameras = [...combined];
  initRegionFilters();
  buildRouteFilters(combined);
  renderMarkers(filteredCameras);
  renderCamList(filteredCameras);

  const uniqueRoutes = Array.from(new Set(combined.map(c => c.route))).filter(Boolean);
  document.getElementById('statRoutes').textContent = uniqueRoutes.length;
  document.getElementById('camCount').textContent = `${combined.length} Cameras`;
}

main();

/* ================================================================
   INCIDENT OVERLAY — TDOT ArcGIS FeatureServer (no auth needed)
   Layer 0 = point incidents, Layer 1 = line closures
   Refreshes every 5 minutes automatically
   ================================================================ */

const INCIDENT_BASE = 'https://tspatial.tdot.tn.gov/arcgis/rest/services/Smartway/Smartway_Events/FeatureServer';

// Memphis metro bounding box
const INC_BBOX = { xmin: -90.5, ymin: 34.8, xmax: -89.5, ymax: 35.5 };

const INC_COLORS = {
  accident:   '#f85149',   // red
  closure:    '#ff7b00',   // orange
  congestion: '#f59e0b',   // amber
  roadwork:   '#a78bfa',   // purple
  hazard:     '#22d3ee',   // cyan
  other:      '#8b949e',   // gray
};

const INC_ICONS = {
  accident:   '🚨',
  closure:    '🚧',
  congestion: '🐢',
  roadwork:   '⚠️',
  hazard:     '⚡',
  other:      '📍',
};

let incidentMarkers = [];   // L.CircleMarker / L.Polyline
let incidentLayer   = null; // L.LayerGroup
let incidentVisible = true;
let incidentRefreshTimer = null;

/** Classify an incident record into a color category */
function incidentCategory(props) {
  const t = (props.EventType || props.event_type || props.TYPE || '').toLowerCase();
  const d = (props.Description || props.DESCRIPTION || '').toLowerCase();
  if (/accident|crash|collision|wreck/.test(t + d)) return 'accident';
  if (/clos|block/.test(t + d))                     return 'closure';
  if (/congest|slow|jam|backup/.test(t + d))         return 'congestion';
  if (/work|construct|maint/.test(t + d))            return 'roadwork';
  if (/hazard|debris|spill|ice|fog/.test(t + d))     return 'hazard';
  return 'other';
}

function buildIncidentPopup(props, cat) {
  const color  = INC_COLORS[cat];
  const icon   = INC_ICONS[cat];
  const type   = props.EventType || props.TYPE || cat;
  const desc   = props.Description || props.DESCRIPTION || 'No description available';
  const road   = props.RoadName  || props.ROAD_NAME  || props.Route || '';
  const county = props.County    || props.COUNTY     || '';
  const sev    = props.Severity  || props.SEVERITY   || '';
  const start  = props.StartDate || props.START_DATE || '';
  const startFmt = start ? new Date(start).toLocaleString() : '';

  return `
    <div class="cam-popup" style="min-width:210px;">
      <div class="cam-popup-name">${icon} ${escHtml(type)}</div>
      <div class="cam-popup-meta" style="margin-top:6px;">
        ${road    ? `<div class="cam-popup-row"><span class="cam-popup-key">Road</span><span class="cam-popup-val" style="color:${color};font-weight:600;">${escHtml(road)}</span></div>` : ''}
        ${county  ? `<div class="cam-popup-row"><span class="cam-popup-key">County</span><span class="cam-popup-val">${escHtml(county)}</span></div>` : ''}
        ${sev     ? `<div class="cam-popup-row"><span class="cam-popup-key">Severity</span><span class="cam-popup-val">${escHtml(String(sev))}</span></div>` : ''}
        <div class="cam-popup-row"><span class="cam-popup-key">Details</span><span class="cam-popup-val" style="font-size:11px;">${escHtml(desc)}</span></div>
        ${startFmt ? `<div class="cam-popup-row"><span class="cam-popup-key">Reported</span><span class="cam-popup-val" style="font-size:10px;color:var(--color-text-muted);">${escHtml(startFmt)}</span></div>` : ''}
      </div>
    </div>`;
}

async function fetchIncidentLayer(layerIndex) {
  const geom = encodeURIComponent(JSON.stringify(INC_BBOX));
  const url  = `${INCIDENT_BASE}/${layerIndex}/query` +
    `?geometry=${geom}` +
    `&geometryType=esriGeometryEnvelope` +
    `&inSR=4326` +
    `&spatialRel=esriSpatialRelIntersects` +
    `&outFields=*` +
    `&f=geojson`;
  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`TDOT incidents HTTP ${res.status}`);
  return res.json();
}

async function loadIncidents() {
  if (!incidentLayer) {
    incidentLayer = L.layerGroup().addTo(map);
  } else {
    incidentLayer.clearLayers();
  }

  const badge = document.getElementById('incidentCountBadge');
  let total = 0;

  try {
    const [pts, lines] = await Promise.allSettled([
      fetchIncidentLayer(0),
      fetchIncidentLayer(1),
    ]);

    // --- Point incidents (Layer 0) ---
    if (pts.status === 'fulfilled' && pts.value.features) {
      pts.value.features.forEach(feat => {
        const props = feat.properties || {};
        const cat   = incidentCategory(props);
        const color = INC_COLORS[cat];
        const [lng, lat] = feat.geometry.coordinates;
        if (!lat || !lng) return;

        const circle = L.circleMarker([lat, lng], {
          radius:      9,
          fillColor:   color,
          fillOpacity: 0.9,
          color:       'white',
          weight:      1.5,
          pane:        'markerPane',
        });
        circle.bindPopup(buildIncidentPopup(props, cat), { maxWidth: 280 });
        circle.addTo(incidentLayer);
        total++;
      });
    }

    // --- Line closures (Layer 1) ---
    if (lines.status === 'fulfilled' && lines.value.features) {
      lines.value.features.forEach(feat => {
        const props = feat.properties || {};
        const cat   = incidentCategory(props);
        const color = INC_COLORS[cat];
        if (!feat.geometry) return;

        const latlngs = feat.geometry.type === 'LineString'
          ? feat.geometry.coordinates.map(([ln, lt]) => [lt, ln])
          : feat.geometry.coordinates.map(ring => ring.map(([ln, lt]) => [lt, ln]));

        const polyline = L.polyline(latlngs, {
          color:     color,
          weight:    5,
          opacity:   0.8,
          lineCap:   'round',
        });
        polyline.bindPopup(buildIncidentPopup(props, cat), { maxWidth: 280 });
        polyline.addTo(incidentLayer);
        total++;
      });
    }

    if (badge) {
      badge.textContent = total;
      badge.style.display = total > 0 ? '' : 'none';
    }
    console.log(`Incidents loaded: ${total} active events`);

  } catch (e) {
    console.warn('Incident load failed:', e.message);
    if (badge) badge.style.display = 'none';
  }
}

function toggleIncidents() {
  incidentVisible = !incidentVisible;
  const btn = document.getElementById('btnToggleIncidents');
  if (incidentVisible) {
    if (incidentLayer) map.addLayer(incidentLayer);
    if (btn) { btn.classList.add('active'); btn.title = 'Hide incidents'; }
  } else {
    if (incidentLayer) map.removeLayer(incidentLayer);
    if (btn) { btn.classList.remove('active'); btn.title = 'Show incidents'; }
  }
}

// Kick off initial load and set 5-minute refresh
(function startIncidentPolling() {
  // Wait for map to exist before loading
  const tryLoad = () => {
    if (map) {
      loadIncidents();
      incidentRefreshTimer = setInterval(loadIncidents, 5 * 60 * 1000);
    } else {
      setTimeout(tryLoad, 500);
    }
  };
  tryLoad();
})();

