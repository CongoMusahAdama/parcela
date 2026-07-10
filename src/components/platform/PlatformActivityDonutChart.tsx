"use client";

import { useMemo, useState } from "react";
import {
  getPlatformAuditKind,
  platformAuditKindLabel,
  type PlatformAuditKind,
  type PlatformAuditRow,
} from "@/lib/platform-demo";
import { cn } from "@/lib/utils";

const SEGMENT_CONFIG: Record<
  PlatformAuditKind,
  { color: string; pattern: string; label: string }
> = {
  onboard: { color: "#dc2626", pattern: "audit-stripes-red", label: "Onboarding" },
  configure: { color: "#0f766e", pattern: "audit-dots-teal", label: "Configuration" },
  credentials: { color: "#ca8a04", pattern: "audit-grid-yellow", label: "Credentials" },
  access: { color: "#ea580c", pattern: "audit-diamond-orange", label: "Access" },
  other: { color: "#84cc16", pattern: "audit-cross-green", label: "Other" },
};

const KIND_ORDER: PlatformAuditKind[] = [
  "onboard",
  "configure",
  "credentials",
  "access",
  "other",
];

type Segment = {
  kind: PlatformAuditKind;
  count: number;
  percent: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeDonutSegment(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function buildSegments(rows: PlatformAuditRow[]): Segment[] {
  const counts: Record<PlatformAuditKind, number> = {
    onboard: 0,
    configure: 0,
    credentials: 0,
    access: 0,
    other: 0,
  };

  for (const row of rows) {
    counts[getPlatformAuditKind(row.action)] += 1;
  }

  const total = rows.length;
  if (total === 0) return [];

  const gap = 2.5;
  let cursor = 0;
  const segments: Segment[] = [];

  for (const kind of KIND_ORDER) {
    const count = counts[kind];
    if (count === 0) continue;

    const sweep = (count / total) * 360;
    const startAngle = cursor + gap / 2;
    const endAngle = cursor + sweep - gap / 2;
    cursor += sweep;

    segments.push({
      kind,
      count,
      percent: Math.round((count / total) * 100),
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2,
    });
  }

  return segments;
}

type PlatformActivityDonutChartProps = {
  rows: PlatformAuditRow[];
  className?: string;
};

export function PlatformActivityDonutChart({ rows, className }: PlatformActivityDonutChartProps) {
  const [activeKind, setActiveKind] = useState<PlatformAuditKind | null>(null);
  const segments = useMemo(() => buildSegments(rows), [rows]);
  const total = rows.length;
  const cx = 160;
  const cy = 160;
  const outerR = 118;
  const innerR = 68;

  if (total === 0) {
    return (
      <div className={cn("flex min-h-[280px] items-center justify-center px-5 py-10", className)}>
        <p className="font-body text-sm text-stone-500">No activity matches your search.</p>
      </div>
    );
  }

  return (
    <div className={cn("px-4 py-6 sm:px-6", className)}>
      <svg
        viewBox="0 0 320 320"
        className="mx-auto h-auto w-full max-w-[320px]"
        role="img"
        aria-label="Platform activity breakdown chart"
      >
        <defs>
          <pattern id="audit-stripes-red" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#fecaca" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#dc2626" strokeWidth="3" />
          </pattern>
          <pattern id="audit-dots-teal" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="#ccfbf1" />
            <circle cx="2" cy="2" r="1.5" fill="#0f766e" />
          </pattern>
          <pattern id="audit-grid-yellow" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#fef9c3" />
            <path d="M0 5 H10 M5 0 V10" stroke="#ca8a04" strokeWidth="1" />
          </pattern>
          <pattern id="audit-diamond-orange" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#ffedd5" />
            <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="none" stroke="#ea580c" strokeWidth="1" />
          </pattern>
          <pattern id="audit-cross-green" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="#ecfccb" />
            <path d="M0 0 L8 8 M8 0 L0 8" stroke="#84cc16" strokeWidth="1" />
          </pattern>
        </defs>

        {segments.map((segment) => {
          const config = SEGMENT_CONFIG[segment.kind];
          const dimmed = activeKind !== null && activeKind !== segment.kind;
          const labelPoint = polarToCartesian(cx, cy, outerR + 22, segment.midAngle);
          const lineStart = polarToCartesian(cx, cy, outerR + 4, segment.midAngle);
          const isLeft = labelPoint.x < cx;

          return (
            <g key={segment.kind} opacity={dimmed ? 0.35 : 1}>
              <path
                d={describeDonutSegment(cx, cy, outerR, innerR, segment.startAngle, segment.endAngle)}
                fill={`url(#${config.pattern})`}
                stroke={config.color}
                strokeWidth={2}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setActiveKind(segment.kind)}
                onMouseLeave={() => setActiveKind(null)}
                onFocus={() => setActiveKind(segment.kind)}
                onBlur={() => setActiveKind(null)}
              />
              <line
                x1={lineStart.x}
                y1={lineStart.y}
                x2={labelPoint.x}
                y2={labelPoint.y}
                stroke={config.color}
                strokeWidth={1.5}
              />
              <text
                x={labelPoint.x + (isLeft ? -6 : 6)}
                y={labelPoint.y - 2}
                textAnchor={isLeft ? "end" : "start"}
                className="fill-stone-800 text-[11px] font-bold"
                style={{ fontFamily: "inherit" }}
              >
                {config.label}
              </text>
              <text
                x={labelPoint.x + (isLeft ? -6 : 6)}
                y={labelPoint.y + 12}
                textAnchor={isLeft ? "end" : "start"}
                className="fill-stone-500 text-[10px]"
                style={{ fontFamily: "inherit" }}
              >
                {segment.percent}%
              </text>
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={innerR - 2} fill="white" />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-stone-900 text-[28px] font-bold"
          style={{ fontFamily: "inherit" }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-stone-500 text-[11px] font-semibold uppercase tracking-wide"
          style={{ fontFamily: "inherit" }}
        >
          Events
        </text>
      </svg>

      <div className="mx-auto mt-4 grid max-w-md gap-2 sm:grid-cols-2">
        {segments.map((segment) => {
          const config = SEGMENT_CONFIG[segment.kind];
          return (
            <div
              key={segment.kind}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm",
                activeKind === segment.kind && "ring-2 ring-[var(--platform-orange)]/30",
              )}
              onMouseEnter={() => setActiveKind(segment.kind)}
              onMouseLeave={() => setActiveKind(null)}
            >
              <span
                className="size-3 shrink-0 rounded-full ring-2 ring-white"
                style={{ backgroundColor: config.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-xs font-bold text-stone-800">
                  {platformAuditKindLabel(segment.kind)}
                </p>
                <p className="font-body text-[11px] text-stone-500">
                  {segment.count} events · {segment.percent}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
