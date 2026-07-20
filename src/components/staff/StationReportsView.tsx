"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  FileDown,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
} from "lucide-react";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import { StaffReportPrintSheet } from "@/components/staff/StaffReportPrintSheet";
import { StaffTablePagination } from "@/components/staff/StaffTablePagination";
import {
  exportStaffReportExcel,
  exportStaffReportPdf,
  printStaffReport,
} from "@/lib/staff-report-export";
import {
  STAFF_REPORT_TYPE_GROUPS,
  buildReportResult,
  buildStaffReportMeta,
  formatReportPeriod,
  getDefaultReportDateRange,
  getReportTypeConfig,
  getReportTypesByCategory,
  type StaffReportFilter,
  type StaffReportType,
} from "@/lib/staff-reports";
import { showInfoAlert, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { ensureOperatorBrandingLoaded } from "@/lib/operators";
import type { StaffAccount } from "@/types/staff";
import type { StaffParcelSummary } from "@/types/staff-parcel";

const PREVIEW_PAGE_SIZE = 8;

type StationReportsViewProps = {
  staff: StaffAccount;
  parcels: StaffParcelSummary[];
  loading?: boolean;
  title?: string;
  description?: string;
  badge?: string;
};

export function StationReportsView({
  staff,
  parcels: allParcels,
  loading = false,
  title = "Station records",
  description = "Generate management and operational reports. Preview first, then print or export for terminal record keeping.",
  badge = "Record keeping",
}: StationReportsViewProps) {
  const defaults = getDefaultReportDateRange();

  const [reportType, setReportType] = useState<StaffReportType>("daily_summary");
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const [previewReady, setPreviewReady] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<StaffReportFilter | null>(null);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const previewResult = useMemo(() => {
    if (!appliedFilter) {
      return { columns: [], rows: [], summary: [] };
    }
    return buildReportResult(allParcels, appliedFilter);
  }, [allParcels, appliedFilter]);

  const totalPages = Math.max(1, Math.ceil(previewResult.rows.length / PREVIEW_PAGE_SIZE));
  const paginatedRows = previewResult.rows.slice(
    (page - 1) * PREVIEW_PAGE_SIZE,
    page * PREVIEW_PAGE_SIZE
  );

  const periodInvalid = dateFrom > dateTo;
  const [brandingReady, setBrandingReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensureOperatorBrandingLoaded().then(() => {
      if (!cancelled) setBrandingReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [staff.operator]);

  const exportMeta = useMemo(() => {
    if (!appliedFilter) return null;
    const config = getReportTypeConfig(appliedFilter.reportType);
    return buildStaffReportMeta({
      stationName: staff.stationName,
      stationCode: staff.stationCode,
      operator: staff.operator,
      reportTitle: config.label,
      periodLabel: formatReportPeriod(appliedFilter.dateFrom, appliedFilter.dateTo),
      generatedBy: staff.displayName,
    });
  }, [appliedFilter, staff, brandingReady]);

  async function handleGeneratePreview() {
    if (periodInvalid) {
      void showValidationAlert({
        title: "Check the date range",
        text: "The start date must be before the end date.",
      });
      return;
    }

    const filter: StaffReportFilter = { reportType, dateFrom, dateTo };
    const config = getReportTypeConfig(reportType);
    const result = buildReportResult(allParcels, filter);
    const period = formatReportPeriod(dateFrom, dateTo);
    const recordCount = result.rows.length;

    setAppliedFilter(filter);
    setPreviewReady(true);
    setPage(1);

    const metricsHtml =
      result.summary.length > 0
        ? `<div class="parcela-swal-report-metrics">${result.summary
            .slice(0, 4)
            .map(
              (metric) =>
                `<div class="parcela-swal-report-metric"><span>${metric.label}</span><strong>${metric.value}</strong></div>`
            )
            .join("")}</div>`
        : "";

    const reportCardHtml = `
      <div class="parcela-swal-report-card">
        <p class="parcela-swal-report-title">${config.label}</p>
        <p class="parcela-swal-report-period">${period} · ${staff.stationName}</p>
        ${
          recordCount === 0
            ? `<p class="parcela-swal-report-empty">No records matched this period. Try widening the date range or choosing another report.</p>`
            : `<p class="parcela-swal-report-empty">${recordCount} record${recordCount === 1 ? "" : "s"} ready to preview, print, or export.</p>${metricsHtml}`
        }
      </div>
    `;

    if (recordCount === 0) {
      await showInfoAlert({
        title: "Preview generated",
        html: reportCardHtml,
        confirmText: "View preview",
      });
      return;
    }

    await showSuccessAlert({
      title: "Report preview ready",
      html: reportCardHtml,
      confirmText: "View preview",
    });
  }

  async function handleExport(format: "pdf" | "excel") {
    if (!previewReady || !exportMeta || previewResult.rows.length === 0) {
      void showValidationAlert({
        title: "Nothing to export",
        text: "Generate a preview with at least one record first.",
      });
      return;
    }

    setExporting(format);
    try {
      await ensureOperatorBrandingLoaded();
      const meta = buildStaffReportMeta({
        stationName: staff.stationName,
        stationCode: staff.stationCode,
        operator: staff.operator,
        reportTitle: exportMeta.reportTitle,
        periodLabel: exportMeta.periodLabel,
        generatedBy: staff.displayName,
        generatedAt: exportMeta.generatedAt,
      });
      if (format === "excel") {
        await exportStaffReportExcel(previewResult, meta);
      } else {
        await exportStaffReportPdf(previewResult, meta);
      }
      void showSuccessAlert({
        title: "Report downloaded",
        text: `${meta.reportTitle} exported as ${format === "excel" ? "Excel" : "PDF"}.`,
      });
    } catch {
      void showValidationAlert({
        title: "Unable to export report",
        text: "Could not create the report file. Please try again.",
      });
    } finally {
      setExporting(null);
    }
  }

  function handlePrint() {
    if (!previewReady || !exportMeta || previewResult.rows.length === 0) {
      void showValidationAlert({
        title: "Nothing to print",
        text: "Generate a preview with at least one record first.",
      });
      return;
    }
    printStaffReport();
  }

  return (
    <>
      <main className="operator-portal-main staff-reports-screen">
        <StaffPageHeader
          title={title}
          description={description}
          badge={badge}
          meta={staff.stationName}
        />

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-5">
            <div className="flex items-center gap-2">
              <CalendarRange className="size-4" style={{ color: "var(--staff-accent)" }} />
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Report filters
              </h2>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleGeneratePreview();
              }}
            >
              <fieldset>
                <legend className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">
                  Report type
                </legend>
                <div
                  className="mt-2 max-h-[min(42vh,320px)] space-y-4 overflow-y-auto rounded-xl border border-border bg-background p-2"
                  role="radiogroup"
                  aria-label="Report type"
                >
                  {STAFF_REPORT_TYPE_GROUPS.map((group) => (
                    <div key={group.category}>
                      <p className="font-display px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                        {group.label}
                      </p>
                      <ul className="space-y-1">
                        {getReportTypesByCategory(group.category).map((type) => {
                          const selected = reportType === type.id;
                          return (
                            <li key={type.id}>
                              <button
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => {
                                  setReportType(type.id);
                                  setPreviewReady(false);
                                }}
                                className={`font-body w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                  selected
                                    ? "font-semibold text-foreground shadow-sm"
                                    : "text-foreground/85 hover:bg-surface"
                                }`}
                                style={
                                  selected
                                    ? {
                                        background: "var(--staff-accent-muted)",
                                        boxShadow: "inset 0 0 0 1px var(--staff-accent)",
                                      }
                                    : undefined
                                }
                              >
                                {type.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="block">
                  <span className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">
                    From
                  </span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPreviewReady(false);
                    }}
                    className="font-body mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">
                    To
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPreviewReady(false);
                    }}
                    className="font-body mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
                  />
                </label>
              </div>

              {periodInvalid && (
                <p className="font-body text-xs text-red-600">Start date must be before end date.</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="font-display flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--staff-accent)" }}
              >
                <Search className="size-4" />
                {loading ? "Syncing parcels…" : "Generate preview"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="size-4" style={{ color: "var(--staff-accent)" }} />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                    Report preview
                  </h2>
                </div>
                <p className="font-body mt-2 text-sm text-muted">
                  {previewReady && appliedFilter
                    ? `${getReportTypeConfig(appliedFilter.reportType).label} · ${formatReportPeriod(appliedFilter.dateFrom, appliedFilter.dateTo)}`
                    : "Select filters and generate a preview before printing or exporting."}
                </p>
              </div>

              <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-2">
                <button
                  type="button"
                  disabled={!previewReady || previewResult.rows.length === 0 || exporting !== null}
                  onClick={handlePrint}
                  className="font-display inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-2 text-[10px] font-semibold text-foreground transition-colors enabled:hover:border-[var(--staff-accent)] enabled:hover:text-[var(--staff-accent)] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs"
                >
                  <Printer className="size-4" />
                  Print
                </button>
                <button
                  type="button"
                  disabled={!previewReady || previewResult.rows.length === 0 || exporting !== null}
                  onClick={() => void handleExport("pdf")}
                  className="font-display inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-2 text-[10px] font-semibold text-foreground transition-colors enabled:hover:border-[var(--staff-accent)] enabled:hover:text-[var(--staff-accent)] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs"
                >
                  <FileDown className="size-4" />
                  {exporting === "pdf" ? "Exporting…" : "Export PDF"}
                </button>
                <button
                  type="button"
                  disabled={!previewReady || previewResult.rows.length === 0 || exporting !== null}
                  onClick={() => void handleExport("excel")}
                  className="font-display inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold text-white transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs"
                  style={{ background: "var(--staff-accent)" }}
                >
                  <FileSpreadsheet className="size-4" />
                  {exporting === "excel" ? "Exporting…" : "Export Excel"}
                </button>
              </div>
            </div>

            {previewReady ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {previewResult.summary.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl border border-border bg-background px-4 py-3"
                      style={
                        metric.highlight
                          ? { borderColor: "var(--staff-accent)", borderWidth: 1 }
                          : undefined
                      }
                    >
                      <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
                        {metric.label}
                      </p>
                      <p className="font-display mt-1 text-xl font-bold text-foreground">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>

                {previewResult.rows.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center">
                    <p className="font-display text-sm font-bold text-foreground">
                      No records in this period
                    </p>
                    <p className="font-body mt-2 text-sm text-muted">
                      Try a wider date range or a different report type.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                    <div className="operator-portal-table-scroll max-h-[min(52vh,560px)] overflow-auto">
                      <table className="w-full min-w-[900px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border text-[11px] uppercase tracking-wider">
                            {previewResult.columns.map((column) => (
                              <th
                                key={column.key}
                                className="font-display sticky top-0 z-10 px-3 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                                style={{ background: "var(--staff-accent-muted)" }}
                              >
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRows.map((row, index) => (
                            <tr
                              key={`${String(row.reference ?? row.category ?? index)}-${index}`}
                              className="border-b border-border/80 last:border-0 hover:bg-surface/80"
                            >
                              {previewResult.columns.map((column) => (
                                <td
                                  key={column.key}
                                  className="font-body px-3 py-3 text-xs text-foreground"
                                >
                                  {row[column.key] ?? "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <StaffTablePagination
                      page={page}
                      totalPages={totalPages}
                      totalItems={previewResult.rows.length}
                      pageSize={PREVIEW_PAGE_SIZE}
                      itemLabel="records"
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-12 text-center">
                <div
                  className="mx-auto flex size-14 items-center justify-center rounded-2xl"
                  style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
                >
                  <FileText className="size-7" strokeWidth={2.25} />
                </div>
                <p className="font-display mt-5 text-lg font-bold text-foreground">
                  Preview not generated yet
                </p>
                <p className="font-body mt-2 text-sm text-muted">
                  Choose a report type and date range, then tap Generate preview.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {previewReady && exportMeta && previewResult.rows.length > 0 && (
        <StaffReportPrintSheet meta={exportMeta} result={previewResult} />
      )}
    </>
  );
}
