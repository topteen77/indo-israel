import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography } from '@mui/material';

const DEFAULT_CENTER = [32.0853, 34.7818];
const DEFAULT_ZOOM_EMPTY = 7;

function statusColor(status) {
  if (status === 'critical') return '#d32f2f';
  if (status === 'warning') return '#ed6c02';
  return '#2e7d32';
}

/** Slight offset so markers at the same coordinates do not stack invisibly. */
function spreadDuplicatePins(points) {
  const counts = new Map();
  return points.map((p) => {
    const k = `${Number(p.lat).toFixed(5)}|${Number(p.lng).toFixed(5)}`;
    const idx = counts.get(k) ?? 0;
    counts.set(k, idx + 1);
    if (idx === 0) return p;
    const step = 0.00032 * idx;
    const angle = (idx * 2.399963) % (2 * Math.PI);
    return {
      ...p,
      lat: p.lat + step * Math.cos(angle),
      lng: p.lng + step * Math.sin(angle),
    };
  });
}

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM_EMPTY);
      return;
    }
    const latLngs = points.map((p) => [p.lat, p.lng]);
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 13);
      return;
    }
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [map, points]);

  return null;
}

/**
 * Interactive map with OpenStreetMap tiles — works without API keys.
 * (Google Maps / Mapbox can be wired separately via env for other views, e.g. LocationMapView embed.)
 */
function statusLabel(status) {
  if (status === 'critical') return 'SOS';
  if (status === 'warning') return 'Offline / delayed';
  return 'GPS OK';
}

export default function EmployerWorkersMap({ workers }) {
  const points = useMemo(() => {
    const raw = (workers || [])
      .filter((w) => w.location?.latitude != null && w.location?.longitude != null)
      .map((w) => ({
        id: String(w.id),
        lat: Number(w.location.latitude),
        lng: Number(w.location.longitude),
        name: w.name || 'Worker',
        status: w.status?.current,
        jobTitle: w.jobTitle || '',
        lastSeen: w.lastSeenLabel || '—',
      }));
    return spreadDuplicatePins(raw);
  }, [workers]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 360 }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM_EMPTY}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={11}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor: statusColor(p.status),
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              <span style={{ fontSize: 12, color: '#555' }}>{statusLabel(p.status)}</span>
              <br />
              {p.jobTitle}
              <br />
              <span style={{ fontSize: 12 }}>Last seen: {p.lastSeen}</span>
            </Popup>
          </CircleMarker>
        ))}
        <FitBounds points={points} />
      </MapContainer>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          py: 0.75,
          px: 1.5,
          bgcolor: 'rgba(255,255,255,0.94)',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 500,
        }}
      >
        Pins include all workers with coordinates (current or latest history). Optional: add{' '}
        <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </Box>{' '}
        for Google embeds on worker detail screens.
      </Typography>
    </Box>
  );
}
