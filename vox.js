/* ================================================================
   VOX Recorder Engine — vox.js
   Voice-activated recording from scanner audio stream.
   Uses Web Audio API AnalyserNode for silence detection,
   MediaRecorder for capture, IndexedDB for persistent storage.
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   IndexedDB Storage Layer
   Stores audio blobs that survive tab refresh / close.
   ---------------------------------------------------------------- */
const VOX_DB_NAME    = 'MemphisLiveVOX';
const VOX_DB_VERSION = 1;
const VOX_STORE      = 'clips';

let voxDb = null;

function openVoxDb() {
  return new Promise((resolve, reject) => {
    if (voxDb) { resolve(voxDb); return; }
    const req = indexedDB.open(VOX_DB_NAME, VOX_DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(VOX_STORE)) {
        const store = db.createObjectStore(VOX_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = e => { voxDb = e.target.result; resolve(voxDb); };
    req.onerror   = e => reject(e.target.error);
  });
}

async function saveClipToDb(clip) {
  const db = await openVoxDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VOX_STORE, 'readwrite');
    const store = tx.objectStore(VOX_STORE);
    const req   = store.add(clip);
    req.onsuccess = () => resolve(req.result); // returns the auto-incremented id
    req.onerror   = () => reject(req.error);
  });
}

async function getAllClipsFromDb() {
  const db = await openVoxDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VOX_STORE, 'readonly');
    const store = tx.objectStore(VOX_STORE);
    const req   = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
}

async function deleteClipFromDb(id) {
  const db = await openVoxDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VOX_STORE, 'readwrite');
    const store = tx.objectStore(VOX_STORE);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function clearAllClipsFromDb() {
  const db = await openVoxDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VOX_STORE, 'readwrite');
    const store = tx.objectStore(VOX_STORE);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}


/* ----------------------------------------------------------------
   VOX Engine State
   ---------------------------------------------------------------- */
let voxArmed      = false;
let voxRecording   = false;
let voxAudioCtx    = null;
let voxAnalyser    = null;
let voxSource      = null;
let voxMediaDest   = null;
let voxRecorder    = null;
let voxChunks      = [];
let voxAnimFrame   = null;
let voxHangTimer   = null;
let voxThreshold   = 12;     // sensitivity (lower = more sensitive)
let voxHangTime    = 2500;   // ms of silence before clip stops
let voxMinDuration = 500;    // ignore clips shorter than 500ms
let voxRecordStart = 0;
let voxClipCount   = 0;
let voxCurrentFeedName = '';  // set externally from scanner.js

// DOM refs
const voxToggleBtn    = document.getElementById('voxToggleBtn');
const voxDot          = document.getElementById('voxDot');
const voxBtnLabel     = document.getElementById('voxBtnLabel');
const voxSensSlider   = document.getElementById('voxSensSlider');
const voxSensVal      = document.getElementById('voxSensVal');
const voxMeterBar     = document.getElementById('voxMeterBar');
const voxMeterThresh  = document.getElementById('voxMeterThreshold');
const voxClipListEl   = document.getElementById('voxClipList');
const voxActionsEl    = document.getElementById('voxActions');
const voxDownloadAll  = document.getElementById('voxDownloadAll');
const voxClearAll     = document.getElementById('voxClearAll');


/* ----------------------------------------------------------------
   Audio Context + Analyser Setup
   ---------------------------------------------------------------- */
function initVoxAudioContext() {
  if (voxAudioCtx) return true;

  const audio = document.getElementById('scannerAudio');
  if (!audio) return false;

  try {
    voxAudioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    voxSource    = voxAudioCtx.createMediaElementSource(audio);
    voxAnalyser  = voxAudioCtx.createAnalyser();
    voxMediaDest = voxAudioCtx.createMediaStreamDestination();

    voxAnalyser.fftSize = 512;
    voxAnalyser.smoothingTimeConstant = 0.3;

    // Route: source → analyser → destination (speakers) + mediaStreamDest (recorder)
    voxSource.connect(voxAnalyser);
    voxAnalyser.connect(voxAudioCtx.destination);
    voxAnalyser.connect(voxMediaDest);

    return true;
  } catch (e) {
    console.warn('VOX: AudioContext init failed:', e.message);
    return false;
  }
}


/* ----------------------------------------------------------------
   Volume Metering + Silence Detection Loop
   ---------------------------------------------------------------- */
function getVolume() {
  if (!voxAnalyser) return 0;
  const data = new Uint8Array(voxAnalyser.frequencyBinCount);
  voxAnalyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  return sum / data.length; // 0–255 average
}

function voxMeterLoop() {
  if (!voxArmed) return;

  const vol = getVolume();
  const pct = Math.min(100, (vol / 80) * 100);

  // Update meter bar
  voxMeterBar.style.width = pct + '%';
  voxMeterBar.style.background = voxRecording ? '#f85149' : (vol > voxThreshold ? '#2EAB30' : 'var(--color-text-muted)');

  // Update threshold indicator position
  const threshPct = Math.min(100, (voxThreshold / 80) * 100);
  voxMeterThresh.style.left = threshPct + '%';

  if (vol > voxThreshold) {
    // Audio detected
    if (!voxRecording) {
      startVoxRecording();
    }
    // Reset hang timer — someone is still talking
    if (voxHangTimer) {
      clearTimeout(voxHangTimer);
      voxHangTimer = null;
    }
  } else if (voxRecording && !voxHangTimer) {
    // Silence detected while recording — start hang timer
    voxHangTimer = setTimeout(() => {
      stopVoxRecording();
      voxHangTimer = null;
    }, voxHangTime);
  }

  voxAnimFrame = requestAnimationFrame(voxMeterLoop);
}


/* ----------------------------------------------------------------
   MediaRecorder — Start / Stop Clip
   ---------------------------------------------------------------- */
function startVoxRecording() {
  if (voxRecording || !voxMediaDest) return;

  // Determine MIME type
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';

  try {
    voxRecorder = new MediaRecorder(voxMediaDest.stream, { mimeType });
  } catch (e) {
    console.warn('VOX: MediaRecorder init failed:', e.message);
    return;
  }

  voxChunks = [];
  voxRecordStart = Date.now();
  voxRecording = true;

  voxRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) voxChunks.push(e.data);
  };

  voxRecorder.onstop = async () => {
    const duration = Date.now() - voxRecordStart;
    voxRecording = false;

    // Ignore very short clips (noise blips)
    if (duration < voxMinDuration || voxChunks.length === 0) return;

    const blob = new Blob(voxChunks, { type: voxRecorder.mimeType || 'audio/webm' });
    voxChunks = [];

    // Get feed name from scanner.js
    const feedName = (typeof currentFeedId !== 'undefined')
      ? (FEEDS.find(f => f.id === currentFeedId) || {}).name || 'Unknown'
      : 'Unknown';

    const clip = {
      blob:       blob,
      feedName:   feedName,
      timestamp:  voxRecordStart,
      duration:   duration,
      mimeType:   voxRecorder.mimeType || 'audio/webm',
    };

    // Save to IndexedDB
    try {
      clip.id = await saveClipToDb(clip);
    } catch (e) {
      console.warn('VOX: Failed to save clip to DB:', e);
    }

    // Add to UI
    addClipToUI(clip);
    voxClipCount++;
    updateVoxActions();
  };

  voxRecorder.start(250); // collect data every 250ms

  // Update dot state
  voxDot.classList.add('recording');
}

function stopVoxRecording() {
  if (!voxRecording || !voxRecorder) return;
  try {
    voxRecorder.stop();
  } catch (e) { /* already stopped */ }
  voxDot.classList.remove('recording');
}


/* ----------------------------------------------------------------
   Clip List UI
   ---------------------------------------------------------------- */
function addClipToUI(clip) {
  // Remove the "no clips" message
  const empty = voxClipListEl.querySelector('.vox-empty');
  if (empty) empty.remove();

  const durationSec = (clip.duration / 1000).toFixed(1);
  const time = new Date(clip.timestamp).toLocaleTimeString();
  const url  = URL.createObjectURL(clip.blob);

  const row = document.createElement('div');
  row.className = 'vox-clip-row';
  row.dataset.clipId = clip.id;
  row.innerHTML = `
    <div class="vox-clip-info">
      <span class="vox-clip-feed">${escScan(clip.feedName)}</span>
      <span class="vox-clip-time">${escScan(time)}</span>
      <span class="vox-clip-dur">${durationSec}s</span>
    </div>
    <div class="vox-clip-controls">
      <audio class="vox-clip-audio" src="${url}" preload="metadata"></audio>
      <button class="vox-clip-btn vox-play-clip" title="Play clip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
      <button class="vox-clip-btn vox-dl-clip" title="Download clip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button class="vox-clip-btn vox-del-clip" title="Delete clip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;

  // Play button
  const playBtn  = row.querySelector('.vox-play-clip');
  const audioTag = row.querySelector('.vox-clip-audio');
  playBtn.addEventListener('click', () => {
    if (audioTag.paused) {
      // Pause any other playing clips
      document.querySelectorAll('.vox-clip-audio').forEach(a => { if (a !== audioTag) a.pause(); });
      audioTag.play();
      playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    } else {
      audioTag.pause();
      playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }
  });
  audioTag.addEventListener('ended', () => {
    playBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  });

  // Download button
  row.querySelector('.vox-dl-clip').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `vox_${clip.feedName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(clip.timestamp).toISOString().replace(/[:.]/g, '-')}.webm`;
    a.click();
  });

  // Delete button
  row.querySelector('.vox-del-clip').addEventListener('click', async () => {
    try { await deleteClipFromDb(clip.id); } catch (e) { /* ok */ }
    URL.revokeObjectURL(url);
    row.remove();
    voxClipCount--;
    updateVoxActions();
    if (voxClipCount <= 0) {
      voxClipListEl.innerHTML = '<div class="vox-empty">No clips yet \u2014 arm VOX and wait for transmissions</div>';
    }
  });

  // Insert at top (newest first)
  voxClipListEl.prepend(row);
}

function updateVoxActions() {
  voxActionsEl.style.display = voxClipCount > 0 ? 'flex' : 'none';
}


/* ----------------------------------------------------------------
   Restore Clips from IndexedDB on Load
   ---------------------------------------------------------------- */
async function restoreClips() {
  try {
    const clips = await getAllClipsFromDb();
    // Sort newest first
    clips.sort((a, b) => b.timestamp - a.timestamp);
    voxClipCount = clips.length;
    clips.forEach(clip => addClipToUI(clip));
    updateVoxActions();
  } catch (e) {
    console.warn('VOX: Could not restore clips from DB:', e);
  }
}


/* ----------------------------------------------------------------
   Toggle VOX On / Off
   ---------------------------------------------------------------- */
function toggleVox() {
  if (!voxArmed) {
    // Arm VOX
    if (!initVoxAudioContext()) {
      alert('VOX requires an active audio stream. Start playing a scanner feed first.');
      return;
    }
    if (voxAudioCtx.state === 'suspended') voxAudioCtx.resume();

    voxArmed = true;
    voxToggleBtn.classList.add('armed');
    voxBtnLabel.textContent = 'VOX ON';
    voxDot.classList.add('armed');
    voxMeterLoop();

  } else {
    // Disarm VOX
    voxArmed = false;
    if (voxRecording) stopVoxRecording();
    if (voxAnimFrame) cancelAnimationFrame(voxAnimFrame);
    if (voxHangTimer) { clearTimeout(voxHangTimer); voxHangTimer = null; }

    voxToggleBtn.classList.remove('armed');
    voxBtnLabel.textContent = 'VOX OFF';
    voxDot.classList.remove('armed', 'recording');
    voxMeterBar.style.width = '0%';
  }
}


/* ----------------------------------------------------------------
   Sensitivity Slider
   ---------------------------------------------------------------- */
voxSensSlider.addEventListener('input', () => {
  voxThreshold = parseInt(voxSensSlider.value, 10);
  voxSensVal.textContent = voxThreshold;
  const threshPct = Math.min(100, (voxThreshold / 80) * 100);
  voxMeterThresh.style.left = threshPct + '%';
});


/* ----------------------------------------------------------------
   Download All as Individual Files
   ---------------------------------------------------------------- */
voxDownloadAll.addEventListener('click', async () => {
  try {
    const clips = await getAllClipsFromDb();
    if (!clips.length) return;

    for (const clip of clips) {
      const url = URL.createObjectURL(clip.blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `vox_${(clip.feedName || 'clip').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(clip.timestamp).toISOString().replace(/[:.]/g, '-')}.webm`;
      a.click();
      // Small delay between downloads so the browser doesn't block them
      await new Promise(r => setTimeout(r, 300));
      URL.revokeObjectURL(url);
    }
  } catch (e) {
    console.warn('VOX: Download all failed:', e);
  }
});


/* ----------------------------------------------------------------
   Clear All
   ---------------------------------------------------------------- */
voxClearAll.addEventListener('click', async () => {
  if (!confirm('Delete all recorded clips? This cannot be undone.')) return;
  try {
    await clearAllClipsFromDb();
  } catch (e) { /* ok */ }
  voxClipListEl.innerHTML = '<div class="vox-empty">No clips yet \u2014 arm VOX and wait for transmissions</div>';
  voxClipCount = 0;
  updateVoxActions();
});


/* ----------------------------------------------------------------
   Event Wiring
   ---------------------------------------------------------------- */
voxToggleBtn.addEventListener('click', toggleVox);

// Set initial threshold marker position
const initThreshPct = Math.min(100, (voxThreshold / 80) * 100);
voxMeterThresh.style.left = initThreshPct + '%';

// Restore saved clips on load
openVoxDb().then(() => restoreClips()).catch(e => console.warn('VOX DB init:', e));
