import { toPng } from "html-to-image";

const RECEIPT_COLORS = {
  background: "#ffffff",
  foreground: "#0f172a",
  muted: "#64748b",
  primary: "#0d9488",
  primaryTint: "#f0fdfa",
  primaryBorder: "#99f6e4",
  border: "#e2e8f0",
} as const;

/** Wait for fonts and images so exported receipt text stays sharp and complete. */
async function waitForReceiptAssets(root: HTMLElement): Promise<void> {
  await document.fonts.ready;

  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );

  // Allow layout to settle after fonts load.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

/** Apply explicit colors on clone — html-to-image can miss CSS variables. */
function applyExportStyles(clone: HTMLElement, width: number): void {
  clone.style.width = `${width}px`;
  clone.style.maxWidth = `${width}px`;
  clone.style.backgroundColor = RECEIPT_COLORS.background;
  clone.style.color = RECEIPT_COLORS.foreground;
  clone.style.overflow = "visible";
  clone.style.fontFamily =
    'var(--font-poppins), var(--font-inter), ui-sans-serif, system-ui, sans-serif';
  clone.style.setProperty("-webkit-font-smoothing", "antialiased");
  clone.style.textRendering = "optimizeLegibility";

  clone.querySelectorAll<HTMLElement>("[data-receipt-muted]").forEach((el) => {
    el.style.color = RECEIPT_COLORS.muted;
  });
  clone.querySelectorAll<HTMLElement>("[data-receipt-primary]").forEach((el) => {
    el.style.color = RECEIPT_COLORS.primary;
  });
  clone.querySelectorAll<HTMLElement>("[data-receipt-value]").forEach((el) => {
    el.style.color = RECEIPT_COLORS.foreground;
  });
  clone.querySelectorAll<HTMLElement>("[data-receipt-tint]").forEach((el) => {
    el.style.backgroundColor = RECEIPT_COLORS.primaryTint;
    el.style.borderColor = RECEIPT_COLORS.primaryBorder;
  });
  clone.querySelectorAll<HTMLElement>("[data-receipt-footer]").forEach((el) => {
    el.style.backgroundColor = RECEIPT_COLORS.primary;
    el.style.color = "#ffffff";
  });
  clone.querySelectorAll<HTMLElement>("[data-receipt-divider]").forEach((el) => {
    el.style.borderTopColor = RECEIPT_COLORS.border;
  });
}

export async function captureReceiptAsPng(element: HTMLElement): Promise<string> {
  await waitForReceiptAssets(element);

  const width = element.getBoundingClientRect().width;
  const height = element.scrollHeight;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = "booking-receipt-export";
  applyExportStyles(clone, width);

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${width}px`;
  host.style.zIndex = "-1";
  host.style.pointerEvents = "none";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await waitForReceiptAssets(clone);

    const exportHeight = clone.scrollHeight || height;

    return await toPng(clone, {
      pixelRatio: 3,
      backgroundColor: RECEIPT_COLORS.background,
      cacheBust: true,
      width,
      height: exportHeight,
      canvasWidth: Math.round(width * 3),
      canvasHeight: Math.round(exportHeight * 3),
      skipAutoScale: false,
    });
  } finally {
    document.body.removeChild(host);
  }
}
