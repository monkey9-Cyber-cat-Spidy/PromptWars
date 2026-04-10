// StadiumSmart – Google Maps Integration
// Embeds venue map and manages POI overlay

export function initMap(containerId, apiKey) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Use Google Maps Embed API (no JS SDK needed — just an iframe)
  const lat = 19.0452;
  const lng = 72.8558;
  const zoom = 16;

  const src = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=Wankhede+Stadium,Mumbai&zoom=${zoom}&maptype=satellite`
    : `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

  container.innerHTML = `
    <iframe
      id="stadium-map-iframe"
      src="${src}"
      width="100%"
      height="100%"
      style="border:0; border-radius: 16px;"
      allowfullscreen=""
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      title="MetroArena Stadium Location Map"
      aria-label="Interactive map showing MetroArena Stadium location"
    ></iframe>
  `;
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
