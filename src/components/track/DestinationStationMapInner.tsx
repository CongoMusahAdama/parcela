"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type DestinationStationMapInnerProps = {
  lat: number;
  lng: number;
  name: string;
  accent: string;
};

function pinIcon(accent: string) {
  return L.divIcon({
    className: "parcela-dest-marker",
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${accent};border:3px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function DestinationStationMapInner({
  lat,
  lng,
  name,
  accent,
}: DestinationStationMapInnerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-[180px] w-full md:h-[220px]"
        style={{ background: "#e2e8f0" }}
        aria-label={`Map showing ${name}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pinIcon(accent)} />
      </MapContainer>
    </div>
  );
}
