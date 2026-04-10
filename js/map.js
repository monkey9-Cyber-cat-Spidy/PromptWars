// StadiumSmart – Google Maps JavaScript API Integration
// Interactive venue map with custom markers and styles

import { VENUE, GATES } from './data.js';
import { getCrowdData, getCrowdLevelLabel } from './crowd.js';

let map;
let markers = [];

export async function initMap(containerId, apiKey, mapsId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!apiKey) {
    container.innerHTML = `<div class="map-error">⚠️ Maps API Key missing. Please set MAPS_API_KEY in environment.</div>`;
    return;
  }

  try {
    // 1. Load libraries
    const { Map, InfoWindow } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    // 2. Initialize Map
    map = new Map(container, {
      center: VENUE.coords,
      zoom: 17,
      mapId: mapsId || "STADIUM_SMART_TRIAL", // For Advanced Markers
      mapTypeId: 'hybrid',
      tilt: 45,
      heading: 0,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });

    // 3. Add Gate Markers
    const crowdData = getCrowdData();
    
    // Gate offsets (approximate for demo)
    const gateLocations = [
      { id: 'gate-A', pos: { lat: 19.0465, lng: 72.8558 }, color: '#3b82f6' }, // North
      { id: 'gate-B', pos: { lat: 19.0439, lng: 72.8558 }, color: '#10b981' }, // South
      { id: 'gate-C', pos: { lat: 19.0452, lng: 72.8571 }, color: '#f59e0b' }, // East
      { id: 'gate-D', pos: { lat: 19.0452, lng: 72.8545 }, color: '#ef4444' }, // West
    ];

    const infoWindow = new InfoWindow();

    gateLocations.forEach(loc => {
      const gateInfo = GATES.find(g => `gate-${g.id}` === loc.id) || { name: loc.id };
      const crowdInfo = crowdData[loc.id] || { crowdLevel: 0, waitMinutes: 0 };
      const status = getCrowdLevelLabel(crowdInfo.crowdLevel);

      const pin = new PinElement({
        background: status.color,
        borderColor: "#ffffff",
        glyph: gateInfo.id || '?',
        glyphColor: "#ffffff",
      });

      const marker = new AdvancedMarkerElement({
        map,
        position: loc.pos,
        title: gateInfo.name,
        content: pin.element,
      });

      marker.addListener("click", () => {
        // Firebase Analytics: Log marker selection
        if (window.stadiumSmart?.logEvent && window.stadiumSmart?.analytics) {
          window.stadiumSmart.logEvent(window.stadiumSmart.analytics, 'select_content', {
            content_type: 'map_marker',
            item_id: loc.id
          });
        }

        infoWindow.setContent(`
          <div class="map-info-window">
            <div class="iw-title">${gateInfo.name}</div>
            <div class="iw-status" style="color:${status.color}">${status.text} Crowd</div>
            <div class="iw-wait">≈ ${crowdInfo.waitMinutes} mins wait</div>
            <div class="iw-meta">${gateInfo.section}</div>
          </div>
        `);
        infoWindow.open(map, marker);
      });

      markers.push(marker);
    });

  } catch (err) {
    console.error("Maps JS API Error:", err);
    container.innerHTML = `<div class="map-error">❌ Error loading Maps. Check console for details.</div>`;
  }
}

export function getTransitInfo() {
  return [
    { icon: '🚇', label: 'Metro', detail: 'Station A (Gate A side) · Station B (Gate C/VIP side) · Runs every 8–12 min on match days' },
    { icon: '🚌', label: 'Bus', detail: 'Routes 12, 18 serve Gate D (West) · Route 54 serves Gate B (South)' },
    { icon: '🚗', label: 'Parking', detail: 'P1–P6 around the stadium · VIP parking P4 requires VIP pass · Arrive 90 min early' },
    { icon: '🛵', label: 'Two-Wheeler', detail: 'Dedicated 2-wheeler zone at P2 & P5 · Free of charge' },
    { icon: '🚕', label: 'Rideshare', detail: 'Designated drop/pickup zones at Gate A (North) and Gate D (West)' },
  ];
}
