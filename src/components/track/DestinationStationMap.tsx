"use client";

import dynamic from "next/dynamic";
import { OPERATOR_ACCENT } from "@/lib/operators";
import type { Operator } from "@/types/parcel";

const MapInner = dynamic(
  () => import("@/components/track/DestinationStationMapInner").then((m) => m.DestinationStationMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[180px] w-full animate-pulse rounded-2xl bg-muted/20 md:h-[220px]" />
    ),
  }
);

type DestinationStationMapProps = {
  lat: number;
  lng: number;
  name: string;
  operator?: Operator;
  className?: string;
};

export function DestinationStationMap({
  lat,
  lng,
  name,
  operator,
  className,
}: DestinationStationMapProps) {
  const accent = operator ? OPERATOR_ACCENT[operator] : "#0d9488";

  return (
    <div className={className}>
      <MapInner lat={lat} lng={lng} name={name} accent={accent} />
    </div>
  );
}
