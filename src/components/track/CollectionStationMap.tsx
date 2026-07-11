"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { Locate, MapPin, Navigation } from "lucide-react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import type { TrackedParcel } from "@/types/parcel";
import { operatorAccentColor } from "@/lib/operators";
import { stationDirectionsUrl } from "@/lib/maps";
import { getSendLocation, requestSendLocation } from "@/lib/sendLocation";
import "leaflet/dist/leaflet.css";

type CollectionStationMapProps = {
  parcel: TrackedParcel;
  lat: number;
  lng: number;
  hideDirectionsButton?: boolean;
  bottomInset?: number;
  topInset?: number;
};

function stationIcon(accent: string) {
  return L.divIcon({
    className: "parcela-collect-marker",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:${accent};border:3px solid #fff;box-shadow:0 4px 12px rgba(15,23,42,.3);font-size:16px">🚌</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function userIcon() {
  return L.divIcon({
    className: "parcela-user-marker",
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#0d9488;border:3px solid #fff;box-shadow:0 2px 8px rgba(13,148,136,.45)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function FitBounds({
  station,
  user,
  bottomInset,
}: {
  station: { lat: number; lng: number };
  user: { lat: number; lng: number } | null;
  bottomInset: number;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [[station.lat, station.lng]];
    if (user) points.push([user.lat, user.lng]);
    map.fitBounds(L.latLngBounds(points), {
      paddingTopLeft: [48, 88],
      paddingBottomRight: [48, bottomInset + 32],
      maxZoom: 15,
    });
  }, [map, station.lat, station.lng, user, bottomInset]);

  return null;
}

function RecenterControl({
  station,
  user,
  bottomInset,
}: {
  station: { lat: number; lng: number };
  user: { lat: number; lng: number } | null;
  bottomInset: number;
}) {
  const map = useMap();

  function recenter() {
    const points: [number, number][] = [[station.lat, station.lng]];
    if (user) points.push([user.lat, user.lng]);
    map.fitBounds(L.latLngBounds(points), {
      paddingTopLeft: [48, 88],
      paddingBottomRight: [48, bottomInset + 32],
      maxZoom: 15,
    });
  }

  return (
    <button
      type="button"
      onClick={recenter}
      className="absolute right-4 z-[500] flex size-11 items-center justify-center rounded-full border border-border bg-surface text-primary shadow-lg transition-transform hover:scale-105 active:scale-95"
      style={{ bottom: bottomInset + 16 }}
      aria-label="Recenter map"
    >
      <Locate className="size-5" />
    </button>
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function CollectionStationMap({
  parcel,
  lat,
  lng,
  hideDirectionsButton = false,
  bottomInset = 48,
  topInset = 16,
}: CollectionStationMapProps) {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const accent = parcel.destinationOperator
    ? operatorAccentColor(parcel.destinationOperator)
    : "#0d9488";

  useEffect(() => {
    const cached = getSendLocation();
    if (cached) {
      setUserCoords(cached);
      return;
    }
    requestSendLocation().then((coords) => {
      if (coords) setUserCoords(coords);
    });
  }, []);

  const directionsHref = useMemo(
    () => stationDirectionsUrl(lat, lng, parcel.destinationStationName),
    [lat, lng, parcel.destinationStationName]
  );

  const distanceKm = userCoords
    ? haversineKm(userCoords.lat, userCoords.lng, lat, lng)
    : null;

  async function requestLocation() {
    setLocating(true);
    const coords = await requestSendLocation();
    if (coords) setUserCoords(coords);
    setLocating(false);
  }

  return (
    <div className="relative h-full min-h-[320px] w-full flex-1">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom
        className="absolute inset-0 h-full w-full"
        style={{ background: "#e8eef4" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds station={{ lat, lng }} user={userCoords} bottomInset={bottomInset} />
        <RecenterControl station={{ lat, lng }} user={userCoords} bottomInset={bottomInset} />
        {userCoords ? (
          <>
            <Polyline
              positions={[
                [userCoords.lat, userCoords.lng],
                [lat, lng],
              ]}
              pathOptions={{ color: "#0d9488", weight: 4, opacity: 0.85 }}
            />
            <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon()} />
          </>
        ) : null}
        <Marker position={[lat, lng]} icon={stationIcon(accent)} zIndexOffset={1000} />
      </MapContainer>

      {!userCoords ? (
        <button
          type="button"
          onClick={requestLocation}
          disabled={locating}
          className="font-body absolute left-4 right-4 z-[500] flex items-center justify-center gap-2 rounded-full border border-primary/25 bg-surface/95 px-4 py-2.5 text-xs font-medium text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-surface disabled:opacity-70"
          style={{ top: topInset }}
        >
          <Locate className="size-4 text-primary" />
          {locating ? "Getting your location…" : "Tap to show your location and route"}
        </button>
      ) : distanceKm != null ? (
        <div
          className="font-display pointer-events-none absolute left-4 z-[500] inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-surface/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-md backdrop-blur-sm"
          style={{ top: topInset }}
        >
          <MapPin className="size-3.5" />
          {formatDistance(distanceKm)} away
        </div>
      ) : null}

      {!hideDirectionsButton ? (
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display absolute right-4 z-[500] inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg"
          style={{ bottom: bottomInset + 16 }}
        >
          <Navigation className="size-3.5" />
          Open directions
        </a>
      ) : null}
    </div>
  );
}
