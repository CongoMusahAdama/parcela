"use client";

import { Headphones, LayoutDashboard, Mail, Package, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import {
  PARCELA_SUPPORT_EMAIL,
  type PortalWelcomeKind,
} from "@/lib/operator-portal-welcome";
import { cn } from "@/lib/utils";

type OperatorPortalWelcomeModalProps = {
  portal: PortalWelcomeKind;
  displayName: string;
  subtitle: string;
  operatorLabel?: string;
  onDismiss: () => void;
};

type WelcomeBlock = {
  icon: LucideIcon;
  title: string;
  body: string;
};

function getWelcomeContent(
  portal: PortalWelcomeKind,
  displayName: string,
  operatorLabel?: string,
): { eyebrow: string; title: string; intro: string; blocks: WelcomeBlock[]; supportNote: string } {
  const firstName = displayName.split(" ")[0] || displayName;
  const operator = operatorLabel?.trim() || "your transport";

  if (portal === "admin") {
    return {
      eyebrow: "HQ command center",
      title: `Welcome, ${firstName}`,
      intro:
        "Parcela is your network-wide parcel platform. This HQ portal is where you configure branches, leads, and oversight for every station on your network.",
      blocks: [
        {
          icon: LayoutDashboard,
          title: "Your dashboard",
          body: "See live totals across branches, spot stations that need attention, and open reports without calling each terminal.",
        },
        {
          icon: Users,
          title: "People & branches",
          body: "Assign branch leads, review counter staff, and keep every station linked to the right team.",
        },
        {
          icon: Package,
          title: "Parcel visibility",
          body: "Track bookings, in-transit parcels, and collections network-wide from one place.",
        },
      ],
      supportNote: `Need help from Parcela? Email ${PARCELA_SUPPORT_EMAIL}. Branch teams should contact your HQ first.`,
    };
  }

  if (portal === "lead") {
    return {
      eyebrow: "Branch lead portal",
      title: `Welcome, ${firstName}`,
      intro:
        "Parcela connects your branch to customers booking online and counters receiving parcels. You manage staff and monitor branch activity here.",
      blocks: [
        {
          icon: LayoutDashboard,
          title: "Your dashboard",
          body: "View branch totals, parcels in progress, and daily activity at a glance.",
        },
        {
          icon: Users,
          title: "Your team",
          body: "Add counter staff, resend logins, and keep the right people on your station roster.",
        },
        {
          icon: Package,
          title: "Branch parcels",
          body: "Search tracking codes and follow parcels moving through your station.",
        },
      ],
      supportNote: `Questions? Email ${PARCELA_SUPPORT_EMAIL} or contact ${operator} HQ.`,
    };
  }

  return {
    eyebrow: "Counter portal",
    title: `Welcome, ${firstName}`,
    intro:
      "Parcela lets customers book parcels online and drop them at your station. You verify, release, and hand over parcels from this counter portal.",
    blocks: [
      {
        icon: LayoutDashboard,
        title: "Your dashboard",
        body: "See pending drop-offs, in-transit parcels, collections, and quick counts for your shift.",
      },
      {
        icon: Package,
        title: "Daily tasks",
        body: "Verify incoming parcels, log releases, and search any tracking code without paper registers.",
      },
      {
        icon: Sparkles,
        title: "Stay in sync",
        body: "Every action updates the customer tracker automatically — less phone calls, fewer lost parcels.",
      },
    ],
    supportNote: `Need help? Email ${PARCELA_SUPPORT_EMAIL} or speak to your branch lead.`,
  };
}

export function OperatorPortalWelcomeModal({
  portal,
  displayName,
  subtitle,
  operatorLabel,
  onDismiss,
}: OperatorPortalWelcomeModalProps) {
  const content = getWelcomeContent(portal, displayName, operatorLabel);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-welcome-title"
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="relative overflow-hidden bg-[var(--staff-accent,#334155)] px-5 py-5 text-white">
          <div
            className="pointer-events-none absolute -right-6 -top-8 size-32 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-start gap-3">
            <Logo size="sm" className="shrink-0 brightness-0 invert" />
            <div className="min-w-0">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
                {content.eyebrow}
              </p>
              <h2 id="portal-welcome-title" className="font-display mt-1 text-xl font-bold tracking-tight">
                {content.title}
              </h2>
              <p className="font-body mt-1 text-sm text-white/85">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <p className="font-body text-sm leading-relaxed text-muted">{content.intro}</p>

          <ul className="mt-4 space-y-3">
            {content.blocks.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-3 rounded-xl border border-border bg-white px-3.5 py-3 shadow-sm"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    portal === "admin" ? "bg-slate-100 text-slate-700" : "bg-[var(--staff-accent-soft,#eef2f6)] text-[var(--staff-accent,#334155)]",
                  )}
                >
                  <Icon className="size-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-foreground">{title}</p>
                  <p className="font-body mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-slate-50 px-3.5 py-3">
            <Headphones className="mt-0.5 size-4 shrink-0 text-[var(--staff-accent,#334155)]" />
            <p className="font-body text-xs leading-relaxed text-muted">{content.supportNote}</p>
          </div>

          <a
            href={`mailto:${PARCELA_SUPPORT_EMAIL}`}
            className="font-display mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--staff-accent,#334155)] hover:underline"
          >
            <Mail className="size-3.5" />
            {PARCELA_SUPPORT_EMAIL}
          </a>
        </div>

        <div className="border-t border-border bg-surface px-5 py-4">
          <button
            type="button"
            onClick={onDismiss}
            className="font-display w-full rounded-xl bg-[var(--staff-accent,#334155)] px-4 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-opacity hover:opacity-95"
          >
            Open my dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
