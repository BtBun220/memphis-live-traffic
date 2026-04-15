/* ================================================================
   Scanner Panel — scanner.js
   Renders talkgroup tables and handles tab switching
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   TAB NAVIGATION
   ---------------------------------------------------------------- */
document.querySelectorAll('.main-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.main-tab').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const panel = btn.dataset.panel;
    document.getElementById('panelCameras').hidden   = panel !== 'cameras';
    document.getElementById('panelScanner').hidden    = panel !== 'scanner';
    document.getElementById('panelSpeedcams').hidden  = panel !== 'speedcams';

    if (panel === 'cameras') {
      setTimeout(() => { if (typeof map !== 'undefined') map.invalidateSize(); }, 100);
    }
    if (panel === 'scanner') {
      // Auto-start audio on first tab click (user gesture = autoplay allowed)
      setTimeout(() => {
        if (typeof startPlayback === 'function' && typeof isPlaying !== 'undefined' && !isPlaying && audioEl && !audioEl.src) {
          startPlayback();
        }
      }, 200);
    }
  });
});

/* ----------------------------------------------------------------
   SYSTEM SITES
   ---------------------------------------------------------------- */
function renderSystemSites() {
  const container = document.getElementById('scannerSites');
  if (!container) return;
  container.innerHTML = SCANNER_SYSTEM.sites.map(s => `
    <div class="scanner-site">
      <span class="site-name">${escScan(s.name)}</span>
      <span class="site-freqs">${escScan(s.freqs)}</span>
    </div>
  `).join('');
}

/* ----------------------------------------------------------------
   GROUP FILTER CHIPS
   ---------------------------------------------------------------- */
let activeScannerGroup = 'ALL';
let scannerQuery = '';

function renderGroupFilters() {
  const container = document.getElementById('scannerGroupFilters');
  if (!container) return;
  const groups = ['ALL', ...GROUP_ORDER];
  container.innerHTML = groups.map(g => `
    <button class="chip${g === 'ALL' ? ' active' : ''}" data-group="${escScan(g)}">${g === 'ALL' ? 'All Agencies' : escScan(g)}</button>
  `).join('');
  container.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeScannerGroup = btn.dataset.group;
      renderTalkgroups();
    });
  });
  document.getElementById('scanStatGroups').textContent = GROUP_ORDER.length;
}

/* ----------------------------------------------------------------
   SCANNER SEARCH
   ---------------------------------------------------------------- */
document.getElementById('scannerSearch').addEventListener('input', e => {
  scannerQuery = e.target.value.trim().toLowerCase();
  renderTalkgroups();
});

/* ----------------------------------------------------------------
   FILTER + RENDER TALKGROUPS
   ---------------------------------------------------------------- */
function getFilteredTalkgroups() {
  return TALKGROUPS.filter(tg => {
    const matchGroup = activeScannerGroup === 'ALL' || tg.group === activeScannerGroup;
    const searchable = `${tg.tag} ${tg.desc} ${tg.dec || ''} ${tg.hex || ''} ${tg.agency} ${tg.group} ${tg.freq || ''}`.toLowerCase();
    const matchSearch = !scannerQuery || searchable.includes(scannerQuery);
    return matchGroup && matchSearch;
  });
}

function renderTalkgroups() {
  const filtered = getFilteredTalkgroups();
  document.getElementById('scanStatVisible').textContent = filtered.length;
  document.getElementById('scanStatTotal').textContent   = TALKGROUPS.length;

  // Group the filtered results
  const grouped = {};
  GROUP_ORDER.forEach(g => { grouped[g] = []; });
  filtered.forEach(tg => {
    if (!grouped[tg.group]) grouped[tg.group] = [];
    grouped[tg.group].push(tg);
  });

  const wrap = document.getElementById('scannerTableWrap');
  if (!wrap) return;

  if (!filtered.length) {
    wrap.innerHTML = '<div class="no-cams-msg">No talkgroups match your search.</div>';
    return;
  }

  // Groups that render as an informational notice instead of a talkgroup table
  const NOTICE_GROUPS = {
    'DeSoto Co MS': {
      icon: '🔒',
      title: 'DeSoto County, MS — Fully Encrypted',
      body: 'All DeSoto County public safety agencies (DCSO, Southaven PD, Olive Branch PD, Horn Lake PD, Hernando PD, all fire departments and EMS) operate on the <strong>MSWIN P25 Phase II</strong> trunked system with 100% encryption on every talkgroup. No live audio feeds exist or can exist — the radio traffic cannot be decoded without the encryption key.',
      link: 'https://www.radioreference.com/db/sid/4879',
      linkText: 'MSWIN on RadioReference'
    }
  };

  let html = '';
  GROUP_ORDER.forEach(group => {
    const rows = grouped[group];
    if (!rows || !rows.length) return;

    // Check if this group should render as a notice instead of a table
    if (NOTICE_GROUPS[group]) {
      const n = NOTICE_GROUPS[group];
      html += `
        <div class="tg-group">
          <div class="tg-group-header">
            <span class="tg-group-name">${escScan(group)}</span>
            <span class="tg-group-count tg-encrypted-badge">Encrypted</span>
          </div>
          <div class="tg-encrypted-notice">
            <div class="tg-encrypted-icon">${n.icon}</div>
            <div class="tg-encrypted-body">
              <strong>${n.title}</strong>
              <p>${n.body}</p>
              <a href="${n.link}" target="_blank" rel="noopener" class="tg-encrypted-link">${n.linkText} ↗</a>
            </div>
          </div>
        </div>`;
      return;
    }

    html += `
      <div class="tg-group">
        <div class="tg-group-header">
          <span class="tg-group-name">${escScan(group)}</span>
          <span class="tg-group-count">${rows.length} channels</span>
        </div>
        <table class="tg-table">
          <thead>
            <tr>
              <th>Agency</th>
              <th>DEC / HEX</th>
              <th>Alpha Tag</th>
              <th>Description</th>
              <th>Category</th>
              <th>Freq / Mode</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(tg => buildTgRow(tg)).join('')}
          </tbody>
        </table>
      </div>`;
  });
  wrap.innerHTML = html;
}

function buildTgRow(tg) {
  const ac = AGENCY_COLORS[tg.agency] || AGENCY_COLORS['EMRG'];
  const catColor = CAT_COLORS[tg.cat] || '#8b949e';
  const dec  = tg.dec  != null ? tg.dec  : '—';
  const hex  = tg.hex  != null ? tg.hex.toUpperCase()  : '—';
  const freq = tg.freq ? `${tg.freq} MHz` : '800 MHz P25';
  const mode = tg.mode ? tg.mode : 'P25';
  const pl   = tg.pl   ? `<span class="tg-pl">${escScan(tg.pl)}</span>` : '';
  const isDispatch = tg.cat === 'Law Dispatch' || tg.cat === 'Fire Dispatch' || tg.cat === 'EMS Dispatch';

  return `
    <tr class="tg-row${isDispatch ? ' tg-dispatch' : ''}">
      <td>
        <span class="agency-badge" style="background:${ac.bg};border-color:${ac.border};color:${ac.text};">${escScan(tg.agency)}</span>
      </td>
      <td class="tg-dec">
        <span class="mono-sm">${dec}</span>
        <span class="mono-sm hex">${hex}</span>
      </td>
      <td class="tg-alphatag"><strong>${escScan(tg.tag)}</strong></td>
      <td class="tg-desc">${escScan(tg.desc)}</td>
      <td>
        <span class="cat-badge" style="color:${catColor};border-color:${catColor}22;background:${catColor}12;">${escScan(tg.cat)}</span>
      </td>
      <td class="tg-freq">
        <span class="mono-sm">${escScan(freq)}</span>
        <span class="mode-badge">${escScan(mode)}</span>
        ${pl}
      </td>
    </tr>`;
}

/* ----------------------------------------------------------------
   CONVENTIONAL FREQUENCIES CARD GRID
   ---------------------------------------------------------------- */
const CONV_FREQS = [
  { freq: '155.895', agency: 'EMA',  desc: 'Memphis / SC Emergency Mgmt — Primary Dispatch', tone: '156.7 PL', mode: 'FMN', license: 'KZJ931' },
  { freq: '154.995', agency: 'EMA',  desc: 'Memphis / SC Emergency Mgmt — Secondary Dispatch', tone: '156.7 PL', mode: 'FMN', license: 'KZJ931' },
  { freq: '154.235', agency: 'SCFD', desc: 'Fire Primary Battalion / Ambulance Paging', tone: '192.8 PL', mode: 'FMN', license: 'WNQR390' },
  { freq: '852.300', agency: 'SCFD', desc: 'Fire Vocal Alarm / Station Alerting', tone: '723 DPL', mode: 'FMN', license: 'WPLR948' },
  { freq: '852.2125',agency: 'GTPD', desc: 'Germantown Police — Dispatch', tone: '293 NAC', mode: 'P25', license: 'WQOG812' },
  { freq: '853.4125',agency: 'GTPD', desc: 'Germantown Fire — Dispatch', tone: '293 NAC', mode: 'P25', license: 'WQOG812' },
  { freq: '854.4375',agency: 'BART', desc: 'Bartlett Police — Backup Repeater', tone: '205 DPL', mode: 'FMN', license: 'WQLC743' },
  { freq: '154.340', agency: 'BART', desc: 'Bartlett Fire Alert — Dispatch / Station Alerting', tone: '141.3 PL', mode: 'FMN', license: 'KWQ554' },
  { freq: '460.050', agency: 'COLL', desc: 'Collierville Police (Backup)', tone: '114.8 PL', mode: 'FMN', license: 'KKC879' },
  { freq: '154.415', agency: 'COLL', desc: 'Collierville Fire Dispatch — Station Alerting', tone: '156.7 PL', mode: 'FMN', license: 'WPYP827' },
  { freq: '154.875', agency: 'MILL', desc: 'Millington Police — Dispatch', tone: '167.9 PL', mode: 'FMN', license: 'KIG726' },
  { freq: '154.250', agency: 'MILL', desc: 'Millington Police Secondary / Fire Dispatch', tone: '167.9 PL', mode: 'FMN', license: 'WNXV679' },
  { freq: '453.225', agency: 'MATA', desc: 'MATA Transit — Dispatch', tone: '127.3 PL', mode: 'FMN', license: 'KLL720' },
  { freq: '855.2375',agency: 'MFD',  desc: 'Memphis Fire Dept — Vocal Alarm (P25)', tone: '179.9 PL', mode: 'FMN', license: 'WNRM943' },
];

function renderConvFreqs() {
  const grid = document.getElementById('convFreqGrid');
  if (!grid) return;
  grid.innerHTML = CONV_FREQS.map(f => {
    const ac = AGENCY_COLORS[f.agency] || AGENCY_COLORS['EMRG'];
    return `
      <div class="conv-card">
        <div class="conv-card-top">
          <span class="conv-freq">${escScan(f.freq)} <span class="conv-mhz">MHz</span></span>
          <span class="agency-badge" style="background:${ac.bg};border-color:${ac.border};color:${ac.text};">${escScan(f.agency)}</span>
        </div>
        <div class="conv-desc">${escScan(f.desc)}</div>
        <div class="conv-meta">
          <span class="mono-sm">${escScan(f.tone)}</span>
          <span class="mode-badge">${escScan(f.mode)}</span>
          <span class="conv-license">${escScan(f.license)}</span>
        </div>
      </div>`;
  }).join('');
}

/* ----------------------------------------------------------------
   UTIL
   ---------------------------------------------------------------- */
function escScan(str) {
  return String(str || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ================================================================
   INLINE AUDIO PLAYER
   ================================================================ */

const FEEDS = [
  // Shelby County, TN
  { id: '215',   name: 'MPD / Sheriff',      county: 'Shelby',     state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/215'   },
  { id: '43964', name: 'Memphis Fire',        county: 'Shelby',     state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/43964' },
  { id: '18694', name: 'Collierville PD',     county: 'Shelby',     state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/18694' },
  { id: '19498', name: 'Collierville Fire',   county: 'Shelby',     state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/19498' },
  { id: '217',   name: 'Germantown PD/Fire',  county: 'Shelby',     state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/217'   },
  { id: '44566', name: 'NOAA Weather',        county: 'Shelby',     state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/44566' },
  // Crittenden County, AR
  { id: '45309', name: 'W. Memphis / Marion', county: 'Crittenden', state: 'AR', offline: true, bcastUrl: 'https://www.broadcastify.com/listen/feed/45309' },
  { id: '45918', name: 'Pafford EMS',         county: 'Crittenden', state: 'AR', bcastUrl: 'https://www.broadcastify.com/listen/feed/45918' },
  // Fayette County, TN
  { id: '26222', name: 'Somerville Fire',     county: 'Fayette',    state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/26222' },
  { id: '41802', name: 'Oakland Fire',        county: 'Fayette',    state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/41802' },
  // Tipton County, TN
  { id: '21460', name: 'Covington Fire',      county: 'Tipton',     state: 'TN', bcastUrl: 'https://www.broadcastify.com/listen/feed/21460' },
];

const STREAM_BASE = 'https://broadcastify.cdnstream1.com/';

let currentFeedId   = '215';
let isPlaying       = false;
let listenerPollTimer = null;

const audioEl       = document.getElementById('scannerAudio');
const playBtn       = document.getElementById('audioPlayBtn');
const iconPlay      = document.getElementById('iconPlay');
const iconPause     = document.getElementById('iconPause');
const muteBtn       = document.getElementById('audioMuteBtn');
const iconVol       = document.getElementById('iconVol');
const iconMute      = document.getElementById('iconMute');
const volSlider     = document.getElementById('audioVolSlider');
const feedNameEl    = document.getElementById('audioFeedName');
const statusEl      = document.getElementById('audioStatus');
const liveBadge     = document.getElementById('audioLiveBadge');
const listenersEl   = document.getElementById('audioListeners');
const bcastLink     = document.querySelector('.audio-bcast-link');

/* ----------------------------------------------------------------
   Core play / stop / switch
   ---------------------------------------------------------------- */
function setFeed(feedId, autoPlay) {
  const feed = FEEDS.find(f => f.id === feedId);
  if (!feed) return;

  // Stop existing playback cleanly
  audioEl.pause();
  audioEl.removeAttribute('src');
  audioEl.load();
  setPlayingState(false);
  clearListenerPoll();

  currentFeedId = feedId;

  // Update feed name display
  feedNameEl.textContent = feed.name;

  // Update Broadcastify link
  if (bcastLink) bcastLink.href = feed.bcastUrl;

  // Highlight active chip
  document.querySelectorAll('.feed-chip').forEach(chip => {
    const active = chip.dataset.feedId === feedId;
    chip.classList.toggle('active', active && !feed.offline);
    chip.classList.remove('playing');
  });

  // Block playback for offline feeds
  if (feed.offline) {
    setStatus('Feed offline — volunteer scanner not broadcasting');
    liveBadge.style.opacity = '0.4';
    listenersEl.textContent = '0 listeners';
    return;
  }

  if (autoPlay) {
    startPlayback();
  } else {
    setStatus('Ready — press play');
  }
}

function startPlayback() {
  const url = STREAM_BASE + currentFeedId;
  audioEl.src = url;
  audioEl.volume = parseFloat(volSlider.value);
  audioEl.muted  = false;

  setStatus('Connecting…');
  liveBadge.style.opacity = '0.4';

  const playPromise = audioEl.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        setPlayingState(true);
        setStatus('Live — streaming');
        liveBadge.style.opacity = '1';
        startListenerPoll();
        markChipPlaying(currentFeedId);
      })
      .catch(err => {
        // Autoplay blocked or network error
        if (err.name === 'NotAllowedError') {
          setStatus('Tap play to start audio');
        } else {
          setStatus('Stream error — retrying…');
          setTimeout(startPlayback, 3000);
        }
        setPlayingState(false);
      });
  }
}

function stopPlayback() {
  audioEl.pause();
  audioEl.removeAttribute('src');
  audioEl.load();
  setPlayingState(false);
  clearListenerPoll();
  setStatus('Stopped');
  liveBadge.style.opacity = '0.4';
  listenersEl.textContent = '— listeners';
  document.querySelectorAll('.feed-chip').forEach(c => c.classList.remove('playing'));
}

function setPlayingState(playing) {
  isPlaying = playing;
  iconPlay.style.display  = playing ? 'none'  : 'block';
  iconPause.style.display = playing ? 'block' : 'none';
  playBtn.classList.toggle('playing', playing);
}

function markChipPlaying(feedId) {
  document.querySelectorAll('.feed-chip').forEach(chip => {
    chip.classList.toggle('playing', chip.dataset.feedId === feedId);
  });
}

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

/* ----------------------------------------------------------------
   Audio element events
   ---------------------------------------------------------------- */
audioEl.addEventListener('waiting',  () => setStatus('Buffering…'));
audioEl.addEventListener('playing',  () => {
  setStatus('Live — streaming');
  setPlayingState(true);
  liveBadge.style.opacity = '1';
});
audioEl.addEventListener('stalled',  () => setStatus('Stalled — reconnecting…'));
audioEl.addEventListener('error',    () => {
  setStatus('Connection error — retrying in 5s');
  setPlayingState(false);
  liveBadge.style.opacity = '0.4';
  if (isPlaying) setTimeout(startPlayback, 5000);
});
audioEl.addEventListener('ended',    () => {
  setStatus('Stream ended — reconnecting…');
  if (isPlaying) setTimeout(startPlayback, 2000);
});

/* ----------------------------------------------------------------
   Play / pause button
   ---------------------------------------------------------------- */
playBtn.addEventListener('click', () => {
  if (isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
});

/* ----------------------------------------------------------------
   Mute toggle
   ---------------------------------------------------------------- */
muteBtn.addEventListener('click', () => {
  audioEl.muted = !audioEl.muted;
  iconVol.style.display  = audioEl.muted ? 'none'  : 'block';
  iconMute.style.display = audioEl.muted ? 'block' : 'none';
});

/* ----------------------------------------------------------------
   Volume slider
   ---------------------------------------------------------------- */
volSlider.addEventListener('input', () => {
  audioEl.volume = parseFloat(volSlider.value);
  if (audioEl.muted && audioEl.volume > 0) {
    audioEl.muted = false;
    iconVol.style.display  = 'block';
    iconMute.style.display = 'none';
  }
});

/* ----------------------------------------------------------------
   Feed selector chips
   ---------------------------------------------------------------- */
document.getElementById('feedSelector').addEventListener('click', e => {
  const chip = e.target.closest('.feed-chip');
  if (!chip) return;
  const feedId = chip.dataset.feedId;
  if (!feedId) return;
  // Switch feed — auto-play if already playing
  setFeed(feedId, isPlaying);
});

/* ----------------------------------------------------------------
   Listener count poll
   Uses a CORS proxy to fetch Broadcastify listener count.
   Broadcastify's API requires an API key we don't have, so
   we try a no-cors fetch for the listener span data from the
   feed page. Falls back to showing no count gracefully.
   ---------------------------------------------------------------- */
function startListenerPoll() {
  fetchListenerCount();
  listenerPollTimer = setInterval(fetchListenerCount, 30000); // every 30s
}

function clearListenerPoll() {
  if (listenerPollTimer) {
    clearInterval(listenerPollTimer);
    listenerPollTimer = null;
  }
}

function fetchListenerCount() {
  // Use allorigins CORS proxy to read listener count from feed page
  const feedUrl = `https://www.broadcastify.com/listen/feed/${currentFeedId}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;

  fetch(proxyUrl, { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      if (!data || !data.contents) return;
      // Parse listener count from HTML: typically ><number> listeners<
      const match = data.contents.match(/(\d+)\s+listener/i);
      if (match && match[1]) {
        const count = parseInt(match[1], 10);
        listenersEl.textContent = `${count.toLocaleString()} listener${count !== 1 ? 's' : ''}`;
      }
    })
    .catch(() => {
      // Silently fail — listener count is a nice-to-have
    });
}

/* ----------------------------------------------------------------
   INIT
   ---------------------------------------------------------------- */
function initScanner() {
  renderSystemSites();
  renderGroupFilters();
  renderTalkgroups();
  renderConvFreqs();
  // Set initial state message
  setStatus('Select a tab to begin listening');
}

initScanner();
