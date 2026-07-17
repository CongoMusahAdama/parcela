"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarRange,
  FileDown,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
} from "lucide-react";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import { useAdminData } from "@/components/admin/AdminDataContext";
import { fetchAdminReport } from "@/lib/admin-api";
import { getAdminOperator } from "@/lib/admin-operator";
import {
  buildAdminReportMeta,
  formatAdminReportPeriod,
  getAdminReportModule,
  getDefaultAdminReportDateRange,
  type AdminReportFilter,
  type AdminReportMeta,
  type AdminReportModuleId,
  type AdminReportResult,
} from "@/lib/admin-reports";
import { showInfoAlert, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";

const PREVIEW_PAGE_SIZE = 8;

type AdminReportModuleViewProps = {
  /** Serializable module id — icon is resolved on the client. */
  moduleId: AdminReportModuleId;
};

export function AdminReportModuleView({ moduleId }: AdminReportModuleViewProps) {
  const reportModule = getAdminReportModule(moduleId);
  const { admin } = useAdminSession();
  const operator = getAdminOperator(admin);
  const { overview } = useAdminData();
  const defaults = getDefaultAdminReportDateRange();

  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const [city, setCity] = useState("all");
  const [branchId, setBranchId] = useState("all");
  const [previewReady, setPreviewReady] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<AdminReportFilter | null>(null);
  const [previewResult, setPreviewResult] = useState<AdminReportResult>({
    columns: [],
    rows: [],
    summary: [],
  });
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [generating, setGenerating] = useState(false);

  const cities = useMemo(
    () => [...new Set(overview.branches.map((b) => b.city))].sort((a, b) => a.localeCompare(b)),
    [overview.branches],
  );

  const branchOptions = useMemo(() => {
    return overview.branches.filter((branch) => city === "all" || branch.city === city);
  }, [overview.branches, city]);

  const totalPages = Math.max(1, Math.ceil(previewResult.rows.length / PREVIEW_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PREVIEW_PAGE_SIZE;
  const paginatedRows = previewResult.rows.slice(pageStart, pageStart + PREVIEW_PAGE_SIZE);

  const periodInvalid = dateFrom > dateTo;

  const exportMeta = useMemo(() => {
    if (!operator || !appliedFilter || !reportModule) return null;
    const scopeParts = [
      city === "all" ? "All cities" : city,
      branchId === "all"
        ? "All branches"
        : overview.branches.find((b) => b.id === branchId)?.name ?? "Branch",
    ];
    return buildAdminReportMeta({
      operator,
      reportTitle: reportModule.label,
      periodLabel: formatAdminReportPeriod(appliedFilter.dateFrom, appliedFilter.dateTo),
      generatedBy: admin.displayName,
      scopeLabel: scopeParts.join(" · "),
    });
  }, [
    appliedFilter,
    operator,
    reportModule,
    admin.displayName,
    city,
    branchId,
    overview.branches,
  ]);

  if (!operator) {
    return (
      <main className="operator-portal-main">
        <p className="font-body text-sm text-muted">
          Complete Admin setup first so reports only include your transport network.
        </p>
        <Link
          href="/admin/setup"
          className="font-display mt-4 inline-flex rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
          style={{ background: "var(--staff-accent)" }}
        >
          Go to Admin setup
        </Link>
      </main>
    );
  }

  if (!reportModule) {
    return (
      <main className="operator-portal-main">
        <p className="font-body text-sm text-muted">Report module not found.</p>
      </main>
    );
  }

  async function handleGeneratePreview() {
    if (periodInvalid) {
      void showValidationAlert({
        title: "Check the date range",
        text: "The start date must be before the end date.",
      });
      return;
    }

    const filter: AdminReportFilter = {
      moduleId,
      dateFrom,
      dateTo,
      city,
      branchId,
    };

    setGenerating(true);
    try {
      const result = await fetchAdminReport(moduleId, filter);
      const period = formatAdminReportPeriod(dateFrom, dateTo);
      const recordCount = result.rows.length;

      setAppliedFilter(filter);
      setPreviewResult(result);
      setPreviewReady(true);
      setPage(1);

      const metricsHtml =
        result.summary.length > 0
          ? `<div class="parcela-swal-report-metrics">${result.summary
              .slice(0, 4)
              .map(
                (metric) =>
                  `<div class="parcela-swal-report-metric"><span>${metric.label}</span><strong>${metric.value}</strong></div>`,
              )
              .join("")}</div>`
          : "";

      const reportCardHtml = `
      <div class="parcela-swal-report-card">
        <p class="parcela-swal-report-title">${reportModule!.label}</p>
        <p class="parcela-swal-report-period">${period} · HQ network</p>
        ${
          recordCount === 0
            ? `<p class="parcela-swal-report-empty">No records matched this period. Try widening the date range or filters.</p>`
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
        title: "Preview ready",
        html: reportCardHtml,
        confirmText: "View preview",
      });
    } catch (error) {
      await showValidationAlert({
        title: "Unable to generate report",
        text: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setGenerating(false);
    }
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
      if (format === "excel") {
        await exportAdminReportExcel(previewResult, exportMeta);
      } else {
        await exportAdminReportPdf(previewResult, exportMeta);
      }
      void showSuccessAlert({
        title: "Report downloaded",
        text: `${exportMeta.reportTitle} exported as ${format === "excel" ? "Excel" : "PDF"}.`,
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
    window.print();
  }

  const Icon = reportModule.icon;

  return (
    <>
      <main className="admin-reports-screen operator-portal-main print:hidden">
        <Link
          href="/admin/reports"
          className="font-display inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All reports
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="flex size-9 items-center justify-center rounded-xl"
                style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
              >
                <Icon className="size-4" strokeWidth={2.25} />
              </span>
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-muted">
                HQ report
              </p>
            </div>
            <h1 className="font-display mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {reportModule.label}
            </h1>
            <p className="font-body mt-1 max-w-2xl text-sm text-muted">{reportModule.description}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
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
              <div>
                <p className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">
                  Report
                </p>
                <div
                  className="mt-2 rounded-xl border border-border px-3 py-3"
                  style={{
                    background: "var(--staff-accent-muted)",
                    boxShadow: "inset 0 0 0 1px var(--staff-accent)",
                  }}
                >
                  <p className="font-display text-sm font-bold text-foreground">{reportModule.label}</p>
                  <p className="font-body mt-1 text-xs text-muted">{reportModule.summary}</p>
                </div>
              </div>

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

              <label className="block">
                <span className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">
                  City
                </span>
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setBranchId("all");
                    setPreviewReady(false);
                  }}
                  className="font-body mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
                >
                  <option value="all">All cities</option>
                  {cities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-display text-[11px] font-bold uppercase tracking-wide text-muted">
                  Branch
                </span>
                <select
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value);
                    setPreviewReady(false);
                  }}
                  className="font-body mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
                >
                  <option value="all">All branches</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              {periodInvalid && (
                <p className="font-body text-xs text-red-600">Start date must be before end date.</p>
              )}

              <button
                type="submit"
                disabled={generating || periodInvalid}
                className="font-display flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--staff-accent)" }}
              >
                <Search className="size-4" />
                {generating ? "Generating…" : "Generate preview"}
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
                    ? `${reportModule.label} · ${formatAdminReportPeriod(appliedFilter.dateFrom, appliedFilter.dateTo)}`
                    : "Set filters and generate a preview before printing or exporting."}
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
                      Try a wider date range or different city / branch filters.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                    <div className="operator-portal-table-scroll max-h-[min(52vh,560px)] overflow-auto">
                      <table className="w-full min-w-[720px] border-collapse text-left">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-white">
                            {previewResult.columns.map((column) => (
                              <th
                                key={column.key}
                                className="font-display sticky top-0 z-10 bg-[#0b1220] px-3 py-3 font-semibold"
                              >
                                {column.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRows.map((row, index) => (
                            <tr
                              key={`${String(row.reference ?? row.branch ?? index)}-${index}`}
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
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                      <p className="font-body text-xs text-muted">
                        Showing{" "}
                        <span className="font-semibold text-foreground">
                          {previewResult.rows.length === 0 ? 0 : pageStart + 1}
                        </span>
                        –
                        <span className="font-semibold text-foreground">
                          {Math.min(pageStart + PREVIEW_PAGE_SIZE, previewResult.rows.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-foreground">
                          {previewResult.rows.length}
                        </span>
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="font-display rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span className="font-body px-2 text-xs text-muted">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="font-display rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
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
                  Choose a date range and filters, then tap Generate preview.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {previewReady && exportMeta && previewResult.rows.length > 0 ? (
        <AdminReportPrintSheet meta={exportMeta} result={previewResult} />
      ) : null}
    </>
  );
}

function AdminReportPrintSheet({
  meta,
  result,
}: {
  meta: AdminReportMeta;
  result: AdminReportResult;
}) {
  return (
    <div
      id="admin-report-print"
      className="admin-report-print hidden print:block"
      style={{ ["--report-accent" as string]: meta.accentColor }}
      data-operator={meta.operator}
    >
      <header className="admin-report-print-header">
        <div className="flex items-center gap-4">
          {meta.logoSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={meta.logoSrc}
              alt={meta.companyName}
              className="h-14 w-auto max-w-[8rem] object-contain"
            />
          ) : null}
          <div>
            <p className="admin-report-print-company">{meta.companyName}</p>
            <p className="text-sm text-slate-600">{meta.companyTagline}</p>
          </div>
        </div>
        <div className="text-right text-sm text-slate-700">
          <p className="font-bold text-slate-900">HQ network</p>
          <p>{meta.scopeLabel}</p>
        </div>
      </header>

      <section className="admin-report-print-title">
        <h1>{meta.reportTitle}</h1>
        <p>
          Period: {meta.periodLabel} · Generated by {meta.generatedBy} · {meta.generatedAt}
        </p>
      </section>

      {result.rows.length === 0 ? (
        <p className="admin-report-print-empty">No records matched the selected filters.</p>
      ) : (
        <table className="admin-report-print-table">
          <thead>
            <tr>
              {result.columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, index) => (
              <tr key={`${String(row.reference ?? row.branch ?? index)}-${index}`}>
                {result.columns.map((column) => (
                  <td key={column.key}>{row[column.key] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer className="admin-report-print-footer">
        <p>
          {meta.companyName} HQ report · {result.rows.length} record
          {result.rows.length === 1 ? "" : "s"}
        </p>
        <p>Printed from the {meta.operator} admin portal</p>
      </footer>
    </div>
  );
}

async function loadLogoDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function logoFormat(src: string): "PNG" | "JPEG" {
  return src.toLowerCase().endsWith(".png") ? "PNG" : "JPEG";
}

async function exportAdminReportExcel(result: AdminReportResult, meta: AdminReportMeta) {
  const XLSX = await import("xlsx");
  const headers = result.columns.map((column) => column.label);
  const body = result.rows.map((row) =>
    result.columns.map((column) => {
      const value = row[column.key];
      return typeof value === "number" ? value : String(value ?? "");
    }),
  );

  const coverSheet = XLSX.utils.aoa_to_sheet([
    [meta.companyName],
    [meta.companyTagline],
    [],
    ["Report", meta.reportTitle],
    ["Period", meta.periodLabel],
    ["Scope", meta.scopeLabel],
    ["Generated by", meta.generatedBy],
    ["Generated at", meta.generatedAt],
    ["Total records", result.rows.length],
  ]);
  const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, coverSheet, "Cover");
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Data");
  XLSX.writeFile(
    workbook,
    `${meta.operator.toLowerCase()}_${meta.reportTitle.toLowerCase().replace(/\s+/g, "-")}.xlsx`,
  );
}

async function exportAdminReportPdf(result: AdminReportResult, meta: AdminReportMeta) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  if (meta.logoSrc) {
    try {
      const logo = await loadLogoDataUrl(meta.logoSrc);
      doc.addImage(logo, logoFormat(meta.logoSrc), 40, 28, 48, 36);
    } catch {
      // Logo optional — report still exports without it.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(meta.accentRgb[0], meta.accentRgb[1], meta.accentRgb[2]);
  doc.text(meta.companyName, 98, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(meta.companyTagline, 98, 58);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(meta.reportTitle, 40, 88);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Scope: ${meta.scopeLabel}`, 40, 104);
  doc.text(`Period: ${meta.periodLabel}`, 40, 118);
  doc.text(`Generated by: ${meta.generatedBy} · ${meta.generatedAt}`, 40, 132);

  if (result.rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("No records matched the selected filters.", 40, 160);
  } else {
    autoTable(doc, {
      startY: 150,
      head: [result.columns.map((column) => column.label)],
      body: result.rows.map((row) =>
        result.columns.map((column) => {
          const value = row[column.key];
          return typeof value === "number" ? String(value) : String(value ?? "");
        }),
      ),
      styles: { fontSize: 7, cellPadding: 4 },
      headStyles: {
        fillColor: meta.accentRgb,
        textColor: 255,
      },
      margin: { left: 40, right: 40 },
      tableWidth: pageWidth - 80,
    });
  }

  doc.save(
    `${meta.operator.toLowerCase()}_${meta.reportTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`,
  );
}
