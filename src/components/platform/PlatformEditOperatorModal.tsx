"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { PlatformModalShell } from "@/components/platform/PlatformModalShell";
import { PlatformOperatorMark } from "@/components/platform/PlatformOperatorMark";
import { usePlatformData } from "@/components/platform/PlatformDataContext";
import { ApiError } from "@/lib/api-client";
import { isValidEmail } from "@/lib/email-validation";
import { readOperatorLogoFile } from "@/lib/operator-logo-upload";
import { PLATFORM_BRAND_COLORS } from "@/lib/platform-brand-colors";
import type { PlatformOperatorRow } from "@/lib/platform-demo";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { cn } from "@/lib/utils";

type PlatformEditOperatorModalProps = {
  operator: PlatformOperatorRow;
  onClose: () => void;
};

type EditDraft = {
  name: string;
  region: string;
  contactEmail: string;
  contactPhone: string;
  brandColor: string;
  logoDataUrl: string | null;
  logoFileName: string;
  notes: string;
  logoChanged: boolean;
};

const inputClass =
  "font-body w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-[var(--platform-orange)] focus:ring-2 focus:ring-[var(--platform-orange-muted)]";

const labelClass =
  "font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-500";

function draftFromOperator(operator: PlatformOperatorRow): EditDraft {
  return {
    name: operator.name,
    region: operator.region,
    contactEmail: operator.contactEmail ?? "",
    contactPhone: operator.contactPhone ?? "",
    brandColor: operator.brandColor,
    logoDataUrl: operator.logoDataUrl,
    logoFileName: operator.logoDataUrl ? "Current logo" : "",
    notes: operator.notes ?? "",
    logoChanged: false,
  };
}

export function PlatformEditOperatorModal({ operator, onClose }: PlatformEditOperatorModalProps) {
  const { updateOperator } = usePlatformData();
  const [draft, setDraft] = useState<EditDraft>(() => draftFromOperator(operator));
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [colorDropOpen, setColorDropOpen] = useState(false);
  const colorDropRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(draftFromOperator(operator));
  }, [operator]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorDropRef.current && !colorDropRef.current.contains(event.target as Node)) {
        setColorDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogoPick(file: File | null) {
    if (!file) return;
    setLogoUploading(true);
    try {
      const result = await readOperatorLogoFile(file);
      setDraft((d) => ({
        ...d,
        logoDataUrl: result.dataUrl,
        logoFileName: result.fileName,
        logoChanged: true,
      }));
    } catch (error) {
      await showValidationAlert({
        title: "Logo not accepted",
        text: error instanceof Error ? error.message : "Could not use that image.",
      });
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function handleSave() {
    const name = draft.name.trim();
    if (name.length < 2) {
      await showValidationAlert({
        title: "Company name required",
        text: "Enter the transport company name.",
      });
      return;
    }

    const email = draft.contactEmail.trim();
    if (email && !isValidEmail(email)) {
      await showValidationAlert({
        title: "Invalid email",
        text: "Enter a valid contact email or leave it blank.",
      });
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(draft.brandColor)) {
      await showValidationAlert({
        title: "Invalid brand colour",
        text: "Use a hex colour like #fd7e14.",
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateOperator(operator.id, {
        name,
        region: draft.region.trim() || "Ghana",
        contactEmail: email || null,
        contactPhone: draft.contactPhone.trim() || null,
        brandColor: draft.brandColor,
        notes: draft.notes.trim() || undefined,
        ...(draft.logoChanged ? { logoDataUrl: draft.logoDataUrl } : {}),
      });
      await showSuccessAlert({
        title: "Transport updated",
        text: `${updated.name} branding and contact details were saved.`,
        confirmButtonColor: "#fd7e14",
      });
      onClose();
    } catch (error) {
      await showValidationAlert({
        title: "Could not save changes",
        text:
          error instanceof ApiError
            ? error.status === 413
              ? "The logo is too large. Use an image under 400 KB."
              : error.message
            : "Something went wrong. Try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PlatformModalShell
      onClose={onClose}
      eyebrow="Transport"
      title="Edit branding & details"
      subtitle={`${operator.code} — updates apply across platform and HQ portals.`}
      maxWidthClass="max-w-2xl"
      leading={
        <PlatformOperatorMark
          code={operator.code}
          name={draft.name || operator.name}
          brandColor={draft.brandColor}
          logoDataUrl={draft.logoDataUrl}
          size="md"
        />
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="font-display rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="font-display inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-70"
            style={{ background: "var(--platform-orange)" }}
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="edit-op-name" className={labelClass}>
            Company / transport name
          </label>
          <input
            id="edit-op-name"
            className={inputClass}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-op-code" className={labelClass}>
              Short code
            </label>
            <input
              id="edit-op-code"
              className={cn(inputClass, "font-mono uppercase opacity-70")}
              value={operator.code}
              readOnly
              aria-readonly
            />
          </div>
          <div>
            <label htmlFor="edit-op-region" className={labelClass}>
              Operating region
            </label>
            <input
              id="edit-op-region"
              className={inputClass}
              value={draft.region}
              onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value }))}
              placeholder="Nationwide, Ashanti, Greater Accra…"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-op-email" className={labelClass}>
              Contact email
            </label>
            <input
              id="edit-op-email"
              type="email"
              className={inputClass}
              value={draft.contactEmail}
              onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
              placeholder="ops@transport.com"
            />
          </div>
          <div>
            <label htmlFor="edit-op-phone" className={labelClass}>
              Contact phone
            </label>
            <input
              id="edit-op-phone"
              className={inputClass}
              value={draft.contactPhone}
              onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))}
              placeholder="+233…"
            />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex flex-col items-center gap-2">
              <PlatformOperatorMark
                code={operator.code}
                name={draft.name || operator.name}
                brandColor={draft.brandColor}
                logoDataUrl={draft.logoDataUrl}
                size="lg"
              />
              <span
                className="font-mono rounded-lg px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
                style={{ background: draft.brandColor }}
              >
                {draft.brandColor}
              </span>
            </div>

            <div className="min-w-[220px] flex-1 space-y-2">
              <label htmlFor="edit-op-color-drop" className={labelClass}>
                Brand colour
              </label>
              <div ref={colorDropRef} className="relative">
                <button
                  id="edit-op-color-drop"
                  type="button"
                  onClick={() => setColorDropOpen((o) => !o)}
                  className="font-body flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm transition-colors hover:border-stone-300 focus:border-[var(--platform-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--platform-orange-muted)]"
                >
                  <span
                    className="inline-block size-5 flex-shrink-0 rounded-md shadow-sm ring-1 ring-black/10"
                    style={{ background: draft.brandColor }}
                  />
                  <span className="flex-1 text-left">
                    {PLATFORM_BRAND_COLORS.find(
                      (c) => c.hex.toLowerCase() === draft.brandColor.toLowerCase(),
                    )?.name ?? "Custom colour"}
                  </span>
                  <span className="font-mono text-[11px] text-stone-400">{draft.brandColor}</span>
                </button>

                {colorDropOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl">
                    <div className="p-1">
                      {PLATFORM_BRAND_COLORS.map((color) => {
                        const isSelected =
                          draft.brandColor.toLowerCase() === color.hex.toLowerCase();
                        return (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() => {
                              setDraft((d) => ({ ...d, brandColor: color.hex }));
                              setColorDropOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              isSelected
                                ? "bg-[var(--platform-orange-soft)] text-stone-900"
                                : "text-stone-700 hover:bg-stone-50",
                            )}
                          >
                            <span
                              className="inline-block size-5 flex-shrink-0 rounded-md shadow-sm ring-1 ring-black/10"
                              style={{ background: color.hex }}
                            />
                            <span className="flex-1 text-left font-medium">{color.name}</span>
                            <span className="font-mono text-[11px] text-stone-400">{color.hex}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-op-color"
                  type="color"
                  value={draft.brandColor}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, brandColor: e.target.value }));
                    setColorDropOpen(false);
                  }}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-stone-200 bg-white p-1"
                  title="Pick a custom colour"
                />
                <input
                  className={cn(inputClass, "font-mono")}
                  value={draft.brandColor}
                  onChange={(e) => setDraft((d) => ({ ...d, brandColor: e.target.value }))}
                  placeholder="#fd7e14"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-stone-700">Operator logo</p>
                <p className="font-body mt-1 text-xs text-stone-500">
                  {draft.logoFileName
                    ? `Selected: ${draft.logoFileName}`
                    : "Optional — shown on platform views and HQ branding."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleLogoPick(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="font-display inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-stone-700 shadow-sm transition-colors hover:border-stone-300 disabled:opacity-60"
                >
                  <Upload className="size-3.5" />
                  {logoUploading ? "Reading…" : draft.logoDataUrl ? "Replace logo" : "Upload logo"}
                </button>
                {draft.logoDataUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        logoDataUrl: null,
                        logoFileName: "",
                        logoChanged: true,
                      }))
                    }
                    className="font-display inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide text-stone-500 hover:text-red-600"
                  >
                    <X className="size-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="edit-op-notes" className={labelClass}>
            Internal notes
          </label>
          <textarea
            id="edit-op-notes"
            className={cn(inputClass, "min-h-[88px] resize-y")}
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            placeholder="Agreement context, renewal notes, or handover reminders…"
          />
        </div>
      </div>
    </PlatformModalShell>
  );
}
