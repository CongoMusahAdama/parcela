"use client";

import { useEffect, useState } from "react";
import { Building2, X } from "lucide-react";
import { fetchPublicOperatorBrandingApi } from "@/lib/api";
import {
  clearStoredTransportName,
  getStoredTransportName,
  isValidTransportName,
  normalizeTransportName,
  setStoredTransportName,
} from "@/lib/api-server-config";
import {
  writeCachedLoginBrand,
  type LoginOperatorBrand,
} from "@/lib/login-brand";
import { refreshOperatorBranding } from "@/lib/operators";

type ServerConfigurationModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a valid transport name is saved — refresh logo/company in place. */
  onSaved?: (transportName: string, brand: LoginOperatorBrand | null) => void | Promise<void>;
};

export function ServerConfigurationModal({
  open,
  onClose,
  onSaved,
}: ServerConfigurationModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(getStoredTransportName() ?? "");
    setError("");
    setStatus("");
  }, [open]);

  if (!open) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeTransportName(value);
    if (!isValidTransportName(name)) {
      setError("Enter the transport service name / code (e.g. MMT)");
      return;
    }

    setSaving(true);
    setError("");
    setStatus("Looking up transport…");

    try {
      await refreshOperatorBranding();
      const rows = await fetchPublicOperatorBrandingApi();
      const match = rows.find(
        (row) =>
          row.code.trim().toUpperCase() === name ||
          row.name.trim().toUpperCase() === name ||
          row.name.trim().toUpperCase().includes(name),
      );

      if (!match || match.active === false) {
        setError(`No transport found for “${name}”. Check the name from platform admin.`);
        setStatus("");
        setSaving(false);
        return;
      }

      const brand: LoginOperatorBrand = {
        found: true,
        operatorCode: match.code,
        operatorName: match.name,
        brandColor: match.brandColor,
        logoDataUrl: match.logoDataUrl,
        stationName: null,
      };

      setStoredTransportName(match.code);
      writeCachedLoginBrand(brand);
      setStatus("Connected — updating company details…");
      await onSaved?.(match.code, brand);
      setSaving(false);
      setStatus("");
      onClose();
    } catch {
      setError("Could not reach Parcela. Is the API running?");
      setStatus("");
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    clearStoredTransportName();
    writeCachedLoginBrand(null);
    setValue("");
    await onSaved?.("", null);
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Transport database configuration"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#1e3a5f]/10 text-[#1e3a5f]">
              <Building2 className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Transport / database
              </h2>
              <p className="font-body text-[11px] text-slate-500">
                Add or edit the transport service name
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="space-y-4 px-5 py-5">
          <div>
            <label
              htmlFor="parcela-transport-name"
              className="font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              Transport name
            </label>
            <input
              id="parcela-transport-name"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder="e.g. MMT"
              className="font-body w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm uppercase text-slate-900 outline-none focus:border-[#1e3a5f] focus:bg-white"
              autoComplete="off"
              spellCheck={false}
              disabled={saving}
            />
            {error ? <p className="font-body mt-1.5 text-xs text-red-600">{error}</p> : null}
            {status ? <p className="font-body mt-1.5 text-xs text-[#1e3a5f]">{status}</p> : null}
            <p className="font-body mt-2 text-[11px] leading-relaxed text-slate-500">
              Use the operator code or name configured in platform admin (e.g.{" "}
              <span className="font-semibold text-slate-700">MMT</span>). We load that transport’s
              logo and company on this form — no page reload.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={saving}
              className="font-display rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-display rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(120deg, #1e3a5f 0%, #152238 100%)",
              }}
            >
              {saving ? "Checking…" : "Save transport"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
