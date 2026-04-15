# Memphis Live Traffic — Changelog

## Project Overview
Live TDOT traffic cameras, police scanner, speed cam alerts, real-time traffic flow, and incident overlay for the Memphis metro area (TN / MS / AR).

**GitHub:** [github.com/BtBun220/memphis-live-traffic](https://github.com/BtBun220/memphis-live-traffic)

---

## File Manifest (15 files)

| # | File | Purpose |
|---|------|---------|
| 1 | `index.html` | Main HTML — 3 tabs (Cameras, Scanner, Speed Cams), all UI structure |
| 2 | `style.css` | All CSS — dark theme, map controls, scanner panel, VOX recorder, responsive |
| 3 | `app.js` | Camera map — Leaflet map, TDOT/MDOT/ArDOT camera loading, HLS/JPEG modals, map mode toggle (Street/Dark/Satellite), traffic flow tile overlay (TomTom), incident overlay (TDOT ArcGIS) |
| 4 | `scanner.js` | Scanner panel — feed selector, inline audio player, talkgroup tables, group filters, listener count polling, conventional frequencies |
| 5 | `scanner_data.js` | P25 talkgroup database — 129+ entries across 4 counties (Shelby TN, Crittenden AR, Fayette TN, Tipton TN) |
| 6 | `vox.js` | VOX recorder — voice-activated recording via Web Audio API AnalyserNode, silence detection, MediaRecorder capture, IndexedDB auto-save, clip list UI with play/download/delete |
| 7 | `speedcams.js` | Speed cam map — 171 TN camera locations, GPS proximity alerts, driving mode, audio beep + banner warnings |
| 8 | `cameras.json` | 140 Tennessee TDOT camera records (Memphis metro) |
| 9 | `ms_cameras.json` | 87 Mississippi MDOT camera sites (DeSoto County) — HLS streams |
| 10 | `ar_cameras.json` | 27 Arkansas ArDOT camera sites (Crittenden County) — JPEG snapshots |
| 11 | `tn_speed_cams.json` | 171 Tennessee speed/red light camera location records |
| 12 | `manifest.json` | PWA manifest — "Memphis Live Traffic", standalone display, app icons |
| 13 | `sw.js` | Service worker — app shell caching, cache-first for tiles, network-first for live APIs |
| 14 | `icon-192.png` | PWA icon 192x192 (crosshair + live dot) |
| 15 | `icon-512.png` | PWA icon 512x512 (crosshair + live dot) |

---

## Version History

### v1.0.0 — Initial Launch
**Date:** April 2026

- 140 TDOT cameras on interactive Leaflet map (dark CARTO tiles)
- Live HLS video streams in popup modals
- Camera sidebar with search, route filters, thumbnail previews
- Stats bar: visible / active / route counts

### v1.1.0 — Police Scanner
- Inline HTML5 audio player with Broadcastify CDN streams
- 6 Shelby County feed chips (MPD/Sheriff, Memphis Fire, Collierville PD, Collierville Fire, Germantown PD/Fire, NOAA Weather)
- P25 talkgroup database with group filters and search
- Conventional frequencies card grid
- Listener count polling via CORS proxy
- Volume slider + mute toggle

### v1.2.0 — Speed Cameras
- Dedicated Speed Cams tab with second Leaflet map
- 171 Tennessee speed/red light camera locations
- GPS proximity alerts with audio beep + banner
- Driving mode toggle
- Color-coded markers: speed (red), red light (amber), school zone (blue)

### v1.3.0 — Tri-State Camera Expansion
- 87 Mississippi MDOT cameras (DeSoto County) — HLS streams
- 27 Arkansas ArDOT cameras (Crittenden County) — JPEG snapshots with 10s auto-refresh
- Region filter chips: All / TN / MS / AR
- Default zoom adjusted to 10 for wider tri-state view

### v1.4.0 — Scanner Expansion
- 5 new feed chips: Crittenden AR, Fayette TN (Somerville Fire, Oakland Fire), Tipton TN (Covington Fire), Pafford EMS
- 26 new talkgroups (Crittenden AWIN P25, Fayette conventional, Tipton analog)
- DeSoto County encrypted notice (MSWIN P25 — 100% encryption, no audio possible)
- West Memphis feed marked offline (volunteer scanner not broadcasting)

### v1.5.0 — Map Mode Toggle
- Street / Dark / Satellite tile switching on both maps
- Street: OpenStreetMap
- Dark: CARTO Dark Matter (default, fallback to OSM on tile error)
- Satellite: Esri World Imagery
- Synced across camera map and speed cam map
- Topright corner control with emoji labels

### v1.6.0 — Incident Overlay
- Live TDOT incidents from ArcGIS FeatureServer (no API key needed)
- Layer 0: point incidents (CircleMarkers)
- Layer 1: line closures (Polylines)
- Color-coded: red (accident), orange (closure), amber (congestion), purple (road work), cyan (hazard)
- Toggle button with live count badge
- Popup details: road, county, severity, description, reported time
- Auto-refresh every 5 minutes

### v1.7.0 — Traffic Flow Tiles
- TomTom raster flow tiles overlaid on both maps
- Green (free flow) / amber (moderate) / orange (slow) / red (stopped)
- Toggle button in map controls (on by default)
- Auto-switches style for dark vs satellite map modes
- Free tier: 2,500 tile requests/day
- API key: registered under baptistown@gmail.com via developer.tomtom.com

### v1.8.0 — PWA (Progressive Web App)
- `manifest.json` with "Memphis Live Traffic" name
- Service worker with app shell caching + tile caching
- Custom icons (192x192 + 512x512)
- Install to home screen on iOS (Safari) and Android (Chrome)
- Opens full-screen, standalone, with dark status bar

### v1.9.0 — VOX Scanner Recorder
- Voice-activated recording from scanner audio streams
- Web Audio API AnalyserNode monitors volume ~60 times/sec
- Starts recording when audio exceeds threshold, stops after 2.5s of silence
- Sensitivity slider (1–80) with live audio level meter
- Clips saved to IndexedDB — survive tab refresh and browser restart
- Clip list: feed name, timestamp, duration, play/download/delete per clip
- Download All + Clear All bulk actions
- Minimum clip duration filter (500ms) to ignore noise blips

---

## External APIs & Keys

| Service | Endpoint | Auth | Limit |
|---------|----------|------|-------|
| TDOT Cameras | `tdot.tn.gov/opendata/api/public/RoadwayCameras` | API key: `8d3b7a82635d476795c09b2c41facc60` | Unlimited |
| TDOT Incidents | `tspatial.tdot.tn.gov/arcgis/rest/services/Smartway/Smartway_Events/FeatureServer` | None | Unlimited |
| MDOT Cameras | `mdottraffic.com/default.aspx/LoadCameraData` | None (POST) | Unlimited |
| ArDOT Cameras | `layers.idrivearkansas.com/cameras.geojson` | None | Unlimited |
| TomTom Traffic Flow | `api.tomtom.com/traffic/map/4/tile/flow/` | API key: `xgEkdZ90tJT39oXkMU7pcFLEj1XOxO6q` | 2,500/day |
| Broadcastify Streams | `broadcastify.cdnstream1.com/{feedId}` | None | Unlimited |
| Map Tiles (OSM) | `tile.openstreetmap.org` | None | Fair use |
| Map Tiles (CARTO) | `basemaps.cartocdn.com` | None | Fair use |
| Map Tiles (Esri) | `server.arcgisonline.com` | None | Fair use |

---

## Maintenance Notes

- **CARTO tiles** may fail in some headless/cloud browsers — OSM fallback is built in
- **ArDOT HLS streams** return 403 without API key — snapshot JPEG viewer with 10s refresh is the workaround
- **Broadcastify feeds** depend on volunteer scanners — feeds can go offline at any time
- **DeSoto County (MS)** is fully encrypted on MSWIN P25 — no scanner audio possible
- **West Memphis feed (45309)** currently offline — volunteer not broadcasting
- **TomTom API key** registered to baptistown@gmail.com, password MemphisLive2026!
