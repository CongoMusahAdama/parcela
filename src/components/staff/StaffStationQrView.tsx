"use client";

import { useEffect, useState } from "react";
import { Copy, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { ensureOperatorBrandingLoaded, getOperatorLabel, operatorAccentColor } from "@/lib/operators";
import { buildStationBookingUrl } from "@/lib/public-web-url";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { Button } from "@/components/ui/Button";

export function StaffStationQrView() {
  const { staff } = useStaffSession();
  const bookingUrl = buildStationBookingUrl(staff.stationId);
  const accent = operatorAccentColor(staff.operator);
  const operatorLabel = getOperatorLabel(staff.operator);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    void ensureOperatorBrandingLoaded();
  }, [staff.operator]);

  useEffect(() => {
    let cancelled = false;
    setQrError(false);
    void QRCode.toDataURL(bookingUrl, {
      width: 480,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
          setQrError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bookingUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      await showSuccessAlert({
        title: "Link copied",
        text: "Share this with senders or paste it into posters and WhatsApp.",
      });
    } catch {
      await showValidationAlert({
        title: "Could not copy",
        text: "Copy the link manually from the poster below.",
      });
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="operator-portal-main">
      <div className="staff-station-qr-screen">
        <StaffPageHeader
          title="Station booking QR"
          description="Print this poster for the counter and drop-off area. Senders scan it and land on booking with your station already selected."
          badge="Poster"
          meta={staff.stationName}
        />

        <div className="mb-5 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handlePrint}
            className="!min-h-11 !rounded-xl !px-5 !text-sm"
            style={{ background: accent }}
          >
            <Printer className="size-4" />
            Print / Save PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCopy}
            className="!min-h-11 !rounded-xl !px-5 !text-sm"
          >
            <Copy className="size-4" />
            Copy booking link
          </Button>
        </div>
      </div>

      <div
        id="staff-station-qr-print"
        className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-border bg-white shadow-sm"
      >
        <div
          className="px-6 py-5 text-white sm:px-8 sm:py-6"
          style={{ background: accent }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                Parcela · Book a parcel
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Scan to book
              </h2>
              <p className="font-body mt-2 text-sm text-white/90">
                Drop off at this counter after you get your reference.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/95 px-3 py-2">
              <OperatorLogo operator={staff.operator} className="h-8 w-auto max-w-[120px] object-contain" />
            </div>
          </div>
        </div>

        <div className="px-6 py-8 text-center sm:px-8">
          <p className="font-display text-lg font-bold text-slate-900">{operatorLabel}</p>
          <p className="font-display mt-1 text-base font-semibold text-slate-700">
            {staff.stationName}
          </p>
          {staff.stationCode ? (
            <p className="font-body mt-1 text-xs uppercase tracking-wider text-slate-500">
              {staff.stationCode}
            </p>
          ) : null}

          <div className="mx-auto mt-6 flex size-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:size-[280px]">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR code to book a parcel at ${staff.stationName}`}
                className="size-full object-contain"
              />
            ) : qrError ? (
              <div className="px-4 text-center">
                <QrCode className="mx-auto size-10 text-slate-400" />
                <p className="font-body mt-3 text-xs text-slate-500">
                  Could not generate QR. Use the link below.
                </p>
              </div>
            ) : (
              <div className="size-24 animate-pulse rounded-xl bg-slate-200" />
            )}
          </div>

          <p className="font-display mt-6 text-sm font-bold text-slate-900">
            Scan to book your parcel
          </p>
          <p className="font-body mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
            Opens the Parcela booking page with {staff.stationName} already selected as your
            drop-off station.
          </p>

          <p className="font-mono mt-5 break-all rounded-xl bg-slate-100 px-3 py-2.5 text-[11px] leading-relaxed text-slate-700">
            {bookingUrl}
          </p>
        </div>
      </div>
    </main>
  );
}
