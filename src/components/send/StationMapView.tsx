"use client";

import Link from "next/link";
import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { Station } from "@/types/parcel";
import { OPERATOR_ACCENT } from "@/lib/operators";
import { formatDistance } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

type StationWithDistance = Station & { distanceKm?: number };

type StationMapViewProps = {
  stations: StationWithDistance[];
  userCoords: { lat: number; lng: number } | null;
};

const GHANA_CENTER: [number, number] = [7.9465, -1.0232];

function operatorMarkerIcon(operator: Station["operator"]) {
  const color = OPERATOR_ACCENT[operator];
  return L.divIcon({
    className: "parcela-map-marker",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const userLocationIcon = L.divIcon({
  className: "parcela-user-marker",
  html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="width:32px;height:32px;border-radius:50%;background:#0d9488;border:3px solid #fff;box-shadow:0 2px 8px rgba(13,148,136,.45);display:flex;align-items:center;justify-content:center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
    </div>
    <span style="margin-top:4px;background:#0d9488;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 4px rgba(15,23,42,.2)">You are here</span>
  </div>`,
  iconSize: [110, 52],
  iconAnchor: [55, 44],
});

const NEARBY_LINE_COUNT = 3;

export function StationMapView({ stations, userCoords }: StationMapViewProps) {
  const center = useMemo<[number, number]>(() => {
    if (userCoords) return [userCoords.lat, userCoords.lng];
    if (stations.length > 0) return [stations[0].lat, stations[0].lng];
    return GHANA_CENTER;
  }, [userCoords, stations]);

  const nearestStations = useMemo(() => {
    if (!userCoords) return [] as StationWithDistance[];
    return [...stations]
      .filter((s) => s.distanceKm !== undefined)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, NEARBY_LINE_COUNT);
  }, [stations, userCoords]);

  const zoom = userCoords ? 11 : stations.length > 0 ? 8 : 7;

  return (
    <div className="h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: 280, background: "#e2e8f0" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userCoords &&
          nearestStations.map((station, index) => (
            <Polyline
              key={`route-${station.id}`}
              positions={[
                [userCoords.lat, userCoords.lng],
                [station.lat, station.lng],
              ]}
              pathOptions={{
                color: index === 0 ? "#0d9488" : "#0d948899",
                weight: index === 0 ? 4 : 3,
                dashArray: index === 0 ? undefined : "10 8",
              }}
            />
          ))}

        {userCoords && (
          <>
            <Circle
              center={[userCoords.lat, userCoords.lng]}
              radius={450}
              pathOptions={{
                color: "#0d948855",
                fillColor: "#0d948818",
                fillOpacity: 1,
                weight: 2,
              }}
            />
            <Marker
              position={[userCoords.lat, userCoords.lng]}
              icon={userLocationIcon}
              zIndexOffset={1000}
            />
          </>
        )}

        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} maxClusterRadius={48}>
          {stations.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={operatorMarkerIcon(station.operator)}
            >
              <Popup>
                <div className="min-w-[10rem] font-body text-sm">
                  <p className="font-display font-bold text-foreground">{station.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {station.city} · {station.operator}
                    {station.distanceKm !== undefined && (
                      <> · {formatDistance(station.distanceKm)}</>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted">{station.address}</p>
                  <Link
                    href={`/send/book?station=${station.id}`}
                    className="font-display mt-2 inline-block text-xs font-bold text-primary"
                  >
                    Select station →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
