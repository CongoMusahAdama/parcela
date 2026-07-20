"use client";

import { Bell } from "lucide-react";
import type { PortalUpdateItem } from "@/lib/portal-updates";

type PortalUpdateModalProps = {
  update: PortalUpdateItem;
  onDismiss: () => void;
};

export function PortalUpdateModal({ update, onDismiss }: PortalUpdateModalProps) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={update.title}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f]/10 text-[#1e3a5f]">
              <Bell className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Parcela update
              </p>
              <h2 className="font-display mt-1 text-lg font-bold text-slate-900">{update.title}</h2>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="font-body whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {update.body}
          </p>
          <p className="font-body mt-4 text-[11px] text-slate-400">
            {new Date(update.sentAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onDismiss}
            className="font-display w-full min-h-[48px] rounded-xl text-sm font-bold uppercase tracking-wide text-white"
            style={{
              background: "linear-gradient(120deg, #1e3a5f 0%, #152238 100%)",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
