import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";
import {
  getOperatorSubscriptionSnapshot,
  isKnownBrandOperator,
  type PlatformOperatorRow,
} from "@/lib/platform-demo";
import { OPERATOR_LOGOS } from "@/lib/operators";

export const PARCELA_PLATFORM_CONTACT = {
  phone: "0531878243",
  email: "amusahcongo@gmail.com",
  teamName: "Parcela Platform Team",
} as const;

/** Included in every configuration letter — shared copy for preview, PDF, and email. */
export const CONFIGURATION_LETTER_MONTHLY_MAINTENANCE = [
  "Platform health checks, uptime monitoring, and performance tuning",
  "Security updates, patch management, and data protection",
  "Scheduled backups and system integrity reviews",
  "Subscription tracking, renewal reminders, and licence compliance",
  "Bug fixes, minor improvements, and platform stability work",
] as const;

export const CONFIGURATION_LETTER_ONGOING_SUPPORT = [
  "HQ and branch lead onboarding assistance",
  "Staff login resets, access issues, and account recovery",
  "Operator configuration updates and network changes",
  "Helpdesk support for day-to-day parcel operations on Parcela",
] as const;

export function configurationLetterThankYou(operatorName: string) {
  return `On behalf of the entire ${BRAND_NAME} team, we sincerely thank ${operatorName} for choosing to partner with us. We are honoured to support your parcel operations and committed to serving you with care, responsiveness, and professionalism throughout our partnership.`;
}

export type ConfigurationLetterData = {
  operatorName: string;
  operatorCode: string;
  region: string;
  agreementDateLabel: string;
  configuredDateLabel: string;
  letterDateLabel: string;
  stationCount: number;
  cityCount: number;
  hqAdminName: string | null;
  hqAdminEmail: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  subscriptionSummary: string | null;
  brandColor: string;
  operatorLogoSrc: string | null;
};

function formatLetterDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function operatorLogoSrc(operator: PlatformOperatorRow): string | null {
  if (operator.logoDataUrl) return operator.logoDataUrl;
  if (isKnownBrandOperator(operator.code)) return OPERATOR_LOGOS[operator.code];
  return null;
}

function subscriptionSummary(operator: PlatformOperatorRow): string | null {
  const snapshot = getOperatorSubscriptionSnapshot(operator);
  if (snapshot.status === "unpaid") return null;
  return `${snapshot.planLabel} · paid ${snapshot.paidLabel} · expires ${snapshot.expiresLabel}`;
}

export function buildConfigurationLetterData(
  operator: PlatformOperatorRow,
  agreementDate: string,
  configuredAt = new Date(),
): ConfigurationLetterData {
  return {
    operatorName: operator.name,
    operatorCode: operator.code,
    region: operator.region,
    agreementDateLabel: formatLetterDate(agreementDate),
    configuredDateLabel: formatLetterDate(configuredAt),
    letterDateLabel: formatLetterDate(configuredAt),
    stationCount: operator.stationCount,
    cityCount: operator.cityCount,
    hqAdminName: operator.primaryAdminName,
    hqAdminEmail: operator.primaryAdminEmail,
    contactEmail: operator.contactEmail,
    contactPhone: operator.contactPhone,
    subscriptionSummary: subscriptionSummary(operator),
    brandColor: operator.brandColor,
    operatorLogoSrc: operatorLogoSrc(operator),
  };
}

export function configurationLetterPlainText(data: ConfigurationLetterData) {
  const lines = [
    `${BRAND_NAME} — Configuration Completion Letter`,
    `Date: ${data.letterDateLabel}`,
    "",
    `Dear ${data.operatorName},`,
    "",
    `This letter confirms that your transport service has been SUCCESSFULLY CONFIGURED on the ${BRAND_NAME} platform, in accordance with the PLATFORM AGREEMENT signed on ${data.agreementDateLabel}.`,
    "",
    "Configuration summary:",
    `• Operator code: ${data.operatorCode}`,
    `• Operating region: ${data.region}`,
    `• Network: ${data.stationCount} stations across ${data.cityCount} cities / corridors`,
    `• Configuration completed: ${data.configuredDateLabel}`,
    `• Primary HQ contact: ${data.hqAdminName ?? "—"} (${data.hqAdminEmail ?? "—"})`,
  ];

  if (data.subscriptionSummary) {
    lines.push(`• Platform licence: ${data.subscriptionSummary}`);
  }

  lines.push(
    "",
    "MONTHLY MAINTENANCE — Our commitment to you:",
    ...CONFIGURATION_LETTER_MONTHLY_MAINTENANCE.map((item) => `• ${item}`),
    "",
    "DEDICATED SUPPORT — We are here for everything you need:",
    ...CONFIGURATION_LETTER_ONGOING_SUPPORT.map((item) => `• ${item}`),
    "",
    "Your HQ administrator may now sign in to complete terminal setup and create branch leads. For any assistance, contact the Parcela platform team using the details below.",
    "",
    configurationLetterThankYou(data.operatorName),
    "",
    "We look forward to a long and successful partnership.",
    "",
    PARCELA_PLATFORM_CONTACT.teamName,
    `Phone: ${PARCELA_PLATFORM_CONTACT.phone}`,
    `Email: ${PARCELA_PLATFORM_CONTACT.email}`,
  );

  return lines.join("\n");
}

function letterFilename(code: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${code.toLowerCase()}-configuration-letter-${stamp}.pdf`;
}

async function loadImageDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function imageFormat(src: string): "PNG" | "JPEG" {
  const lower = src.toLowerCase();
  if (lower.endsWith(".png")) return "PNG";
  return "JPEG";
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return [253, 126, 20];
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function operatorInitials(name: string, code: string) {
  const fromName = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return fromName || code.slice(0, 2).toUpperCase();
}

/** Typography & layout tokens for the configuration letter PDF. */
const PDF_LAYOUT = {
  margin: 56,
  headerGap: 28,
  sectionGap: 22,
  paragraphGap: 14,
  bulletGap: 6,
  lineHeight: 1.55,
} as const;

const PDF_FONT = {
  title: { family: "helvetica" as const, style: "bold" as const, size: 20 },
  subtitle: { family: "helvetica" as const, style: "normal" as const, size: 10.5 },
  section: { family: "helvetica" as const, style: "bold" as const, size: 12 },
  body: { family: "times" as const, style: "normal" as const, size: 11.5 },
  bodyBold: { family: "times" as const, style: "bold" as const, size: 11.5 },
  bodyItalic: { family: "times" as const, style: "italic" as const, size: 11.5 },
  footer: { family: "helvetica" as const, style: "normal" as const, size: 10.5 },
  footerBold: { family: "helvetica" as const, style: "bold" as const, size: 11 },
};

const PDF_COLOR = {
  title: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  body: [30, 41, 59] as [number, number, number],
  navy: [16, 54, 125] as [number, number, number],
  amber: [180, 83, 9] as [number, number, number],
  thankYou: [55, 65, 81] as [number, number, number],
  rule: [226, 232, 240] as [number, number, number],
};

type LetterPdf = import("jspdf").jsPDF;

function applyPdfFont(
  doc: LetterPdf,
  font: { family: "helvetica" | "times"; style: "normal" | "bold" | "italic"; size: number },
) {
  doc.setFont(font.family, font.style);
  doc.setFontSize(font.size);
}

function lineHeightFor(size: number) {
  return size * PDF_LAYOUT.lineHeight;
}

function pageMetrics(doc: LetterPdf) {
  return {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
    contentWidth: doc.internal.pageSize.getWidth() - PDF_LAYOUT.margin * 2,
    bottomLimit: doc.internal.pageSize.getHeight() - PDF_LAYOUT.margin,
  };
}

let activeLetterWatermark: (() => void) | null = null;

function ensureSpace(doc: LetterPdf, y: number, needed: number) {
  const { bottomLimit } = pageMetrics(doc);
  if (y + needed <= bottomLimit) return y;
  doc.addPage();
  activeLetterWatermark?.();
  return PDF_LAYOUT.margin;
}

function addWrappedBlock(
  doc: LetterPdf,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: { family: "helvetica" | "times"; style: "normal" | "bold" | "italic"; size: number },
  color: [number, number, number],
) {
  applyPdfFont(doc, font);
  doc.setTextColor(...color);
  const lh = lineHeightFor(font.size);
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  const blockHeight = lines.length * lh;
  y = ensureSpace(doc, y, blockHeight);
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lh + font.size * 0.85);
  });
  return y + blockHeight + PDF_LAYOUT.paragraphGap;
}

function addSectionHeading(
  doc: LetterPdf,
  title: string,
  y: number,
  color: [number, number, number],
) {
  y = ensureSpace(doc, y, lineHeightFor(PDF_FONT.section.size) + PDF_LAYOUT.sectionGap);
  applyPdfFont(doc, PDF_FONT.section);
  doc.setTextColor(...color);
  doc.text(title, PDF_LAYOUT.margin, y + PDF_FONT.section.size * 0.85);
  return y + lineHeightFor(PDF_FONT.section.size) + PDF_LAYOUT.bulletGap;
}

function addBulletList(
  doc: LetterPdf,
  items: readonly string[],
  y: number,
  indent: number = 14,
  startX: number = PDF_LAYOUT.margin,
  maxWidth?: number,
) {
  const { contentWidth } = pageMetrics(doc);
  const bulletX = startX + indent;
  const textWidth = (maxWidth ?? contentWidth) - indent - 8;
  const lh = lineHeightFor(PDF_FONT.body.size);

  items.forEach((item) => {
    applyPdfFont(doc, PDF_FONT.body);
    doc.setTextColor(...PDF_COLOR.body);
    const lines = doc.splitTextToSize(`• ${item}`, textWidth) as string[];
    const blockHeight = lines.length * lh;
    y = ensureSpace(doc, y, blockHeight + PDF_LAYOUT.bulletGap);
    lines.forEach((line, index) => {
      doc.text(line, bulletX, y + index * lh + PDF_FONT.body.size * 0.85);
    });
    y += blockHeight + PDF_LAYOUT.bulletGap;
  });

  return y + PDF_LAYOUT.paragraphGap;
}

function addTintedPanel(
  doc: LetterPdf,
  y: number,
  title: string,
  items: readonly string[],
  fill: [number, number, number],
  titleColor: [number, number, number],
) {
  const { contentWidth } = pageMetrics(doc);
  const panelX = PDF_LAYOUT.margin;
  const panelWidth = contentWidth;
  const titleHeight = lineHeightFor(PDF_FONT.section.size) + PDF_LAYOUT.bulletGap;
  const itemLineHeight = lineHeightFor(PDF_FONT.body.size);
  let itemsHeight = 0;
  items.forEach((item) => {
    applyPdfFont(doc, PDF_FONT.body);
    const lines = doc.splitTextToSize(`• ${item}`, panelWidth - 36) as string[];
    itemsHeight += lines.length * itemLineHeight + PDF_LAYOUT.bulletGap;
  });
  const panelHeight = titleHeight + itemsHeight + 20;
  y = ensureSpace(doc, y, panelHeight + PDF_LAYOUT.sectionGap);

  doc.setFillColor(...fill);
  doc.setDrawColor(...PDF_COLOR.rule);
  doc.setLineWidth(0.75);
  doc.roundedRect(panelX, y, panelWidth, panelHeight, 10, 10, "FD");

  let innerY = y + 14;
  applyPdfFont(doc, PDF_FONT.section);
  doc.setTextColor(...titleColor);
  doc.text(title, panelX + 16, innerY + PDF_FONT.section.size * 0.85);
  innerY += titleHeight;

  innerY = addBulletList(doc, items, innerY, 14, panelX + 2, panelWidth - 4);
  return innerY + PDF_LAYOUT.bulletGap;
}

function paintParcelaWatermark(doc: LetterPdf, parcelaLogo: string, format: "PNG" | "JPEG") {
  const { width, height } = pageMetrics(doc);
  const wmW = width * 0.62;
  const wmH = wmW * 0.72;
  const x = (width - wmW) / 2;
  const y = (height - wmH) / 2 - 12;

  try {
    const GStateCtor = (doc as LetterPdf & { GState?: new (opts: { opacity: number }) => unknown })
      .GState;
    if (GStateCtor) {
      doc.saveGraphicsState();
      doc.setGState(new GStateCtor({ opacity: 0.07 }));
      doc.addImage(parcelaLogo, format, x, y, wmW, wmH);
      doc.restoreGraphicsState();
      return;
    }
  } catch {
    // fall through to plain image
  }

  doc.addImage(parcelaLogo, format, x, y, wmW, wmH);
}

async function drawDualBrandHeader(
  doc: LetterPdf,
  data: ConfigurationLetterData,
  y: number,
  pageWidth: number,
  parcelaLogo: string | null,
) {
  const logoW = 128;
  const logoH = 82;
  const leftX = PDF_LAYOUT.margin;
  const rightX = pageWidth - PDF_LAYOUT.margin - logoW;

  if (parcelaLogo) {
    try {
      doc.addImage(parcelaLogo, imageFormat(BRAND_LOGO_SRC), leftX, y, logoW, logoH);
    } catch {
      // skip parcela mark
    }
  } else {
    applyPdfFont(doc, { family: "helvetica", style: "bold", size: 18 });
    doc.setTextColor(...PDF_COLOR.navy);
    doc.text(BRAND_NAME, leftX, y + 28);
  }

  applyPdfFont(doc, PDF_FONT.subtitle);
  doc.setTextColor(...PDF_COLOR.muted);
  doc.text(`${BRAND_NAME} platform`, leftX, y + logoH + 14);

  let operatorMarkDrawn = false;
  if (data.operatorLogoSrc) {
    try {
      const operatorLogo = await loadImageDataUrl(data.operatorLogoSrc);
      doc.addImage(operatorLogo, imageFormat(data.operatorLogoSrc), rightX, y, logoW, logoH);
      operatorMarkDrawn = true;
    } catch {
      operatorMarkDrawn = false;
    }
  }

  if (!operatorMarkDrawn) {
    const [r, g, b] = hexToRgb(data.brandColor);
    doc.setFillColor(r, g, b);
    doc.roundedRect(rightX, y, logoW, logoH, 12, 12, "F");
    applyPdfFont(doc, { family: "helvetica", style: "bold", size: 24 });
    doc.setTextColor(255, 255, 255);
    doc.text(operatorInitials(data.operatorName, data.operatorCode), rightX + logoW / 2, y + logoH / 2 + 8, {
      align: "center",
    });
  }

  applyPdfFont(doc, PDF_FONT.subtitle);
  doc.setTextColor(...PDF_COLOR.muted);
  doc.text(
    `${data.operatorCode} · ${data.region}`,
    rightX + logoW,
    y + logoH + 14,
    { align: "right" },
  );

  y += logoH + 28;

  applyPdfFont(doc, PDF_FONT.footerBold);
  doc.setFontSize(15);
  doc.setTextColor(...PDF_COLOR.title);
  doc.text(data.operatorName.toUpperCase(), pageWidth / 2, y + 12, { align: "center" });
  y += 22;

  applyPdfFont(doc, PDF_FONT.subtitle);
  doc.setTextColor(...PDF_COLOR.muted);
  const contactLine = [data.contactEmail, data.contactPhone].filter(Boolean).join(" · ");
  if (contactLine) {
    doc.text(contactLine, pageWidth / 2, y + PDF_FONT.subtitle.size * 0.85, { align: "center" });
    y += lineHeightFor(PDF_FONT.subtitle.size) + 10;
  }

  doc.setDrawColor(...PDF_COLOR.rule);
  doc.setLineWidth(1);
  doc.line(PDF_LAYOUT.margin, y, pageWidth - PDF_LAYOUT.margin, y);
  return y + 18;
}

export async function downloadConfigurationLetterPdf(data: ConfigurationLetterData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const { width: pageWidth, contentWidth } = pageMetrics(doc);
  let y: number = PDF_LAYOUT.margin;

  const [brandR, brandG, brandB] = hexToRgb(data.brandColor);
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(0, 0, pageWidth, 6, "F");
  doc.setFillColor(253, 126, 20);
  doc.rect(0, 6, pageWidth, 3, "F");
  y += 10;

  let parcelaLogo: string | null = null;
  try {
    parcelaLogo = await loadImageDataUrl(BRAND_LOGO_SRC);
    activeLetterWatermark = () => paintParcelaWatermark(doc, parcelaLogo!, imageFormat(BRAND_LOGO_SRC));
    activeLetterWatermark();
  } catch {
    activeLetterWatermark = null;
  }

  y = await drawDualBrandHeader(doc, data, y, pageWidth, parcelaLogo);

  applyPdfFont(doc, PDF_FONT.subtitle);
  doc.setTextColor(...PDF_COLOR.muted);
  doc.text(
    `Ref: ${data.operatorCode} · Configuration completion`,
    PDF_LAYOUT.margin,
    y + PDF_FONT.subtitle.size * 0.85,
  );
  y += lineHeightFor(PDF_FONT.subtitle.size) + 8;

  applyPdfFont(doc, PDF_FONT.title);
  doc.setTextColor(...PDF_COLOR.title);
  doc.text("CONFIGURATION COMPLETION LETTER", pageWidth / 2, y + PDF_FONT.title.size * 0.85, {
    align: "center",
  });
  y += lineHeightFor(PDF_FONT.title.size) + 4;

  doc.setDrawColor(...PDF_COLOR.title);
  doc.setLineWidth(0.75);
  const titleW = doc.getTextWidth("CONFIGURATION COMPLETION LETTER");
  doc.line(pageWidth / 2 - titleW / 2, y, pageWidth / 2 + titleW / 2, y);
  y += 10;

  applyPdfFont(doc, PDF_FONT.subtitle);
  doc.setTextColor(...PDF_COLOR.muted);
  doc.text(data.letterDateLabel, pageWidth / 2, y + PDF_FONT.subtitle.size * 0.85, {
    align: "center",
  });
  y += lineHeightFor(PDF_FONT.subtitle.size) + PDF_LAYOUT.sectionGap;

  y = addWrappedBlock(
    doc,
    `Dear ${data.operatorName},`,
    PDF_LAYOUT.margin,
    y,
    contentWidth,
    PDF_FONT.bodyBold,
    PDF_COLOR.body,
  );

  y = addWrappedBlock(
    doc,
    `This letter confirms that your transport service has been successfully configured on the ${BRAND_NAME} platform, in accordance with the platform agreement signed on ${data.agreementDateLabel}.`,
    PDF_LAYOUT.margin,
    y,
    contentWidth,
    PDF_FONT.body,
    PDF_COLOR.body,
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...PDF_COLOR.rule);
  const summaryItems = [
    `Operator code: ${data.operatorCode}`,
    `Operating region: ${data.region}`,
    `Network: ${data.stationCount} stations across ${data.cityCount} cities / corridors`,
    `Configuration completed: ${data.configuredDateLabel}`,
    `Primary HQ contact: ${data.hqAdminName ?? "—"} (${data.hqAdminEmail ?? "—"})`,
    ...(data.subscriptionSummary ? [`Platform licence: ${data.subscriptionSummary}`] : []),
  ];
  const summaryTitleHeight = lineHeightFor(PDF_FONT.section.size) + PDF_LAYOUT.bulletGap;
  const summaryItemsHeight = summaryItems.reduce((total, item) => {
    applyPdfFont(doc, PDF_FONT.body);
    const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 36) as string[];
    return total + lines.length * lineHeightFor(PDF_FONT.body.size) + PDF_LAYOUT.bulletGap;
  }, 0);
  const summaryHeight = summaryTitleHeight + summaryItemsHeight + 28;
  y = ensureSpace(doc, y, summaryHeight + PDF_LAYOUT.sectionGap);
  doc.roundedRect(PDF_LAYOUT.margin, y, contentWidth, summaryHeight, 10, 10, "FD");

  applyPdfFont(doc, PDF_FONT.section);
  doc.setTextColor(...PDF_COLOR.navy);
  doc.text("Configuration summary", PDF_LAYOUT.margin + 16, y + 22);

  y = addBulletList(doc, summaryItems, y + summaryTitleHeight + 8, 14);
  y += PDF_LAYOUT.bulletGap;

  y = addTintedPanel(
    doc,
    y,
    "Monthly maintenance — our commitment to you",
    CONFIGURATION_LETTER_MONTHLY_MAINTENANCE,
    [255, 251, 235],
    PDF_COLOR.amber,
  );

  y = addTintedPanel(
    doc,
    y,
    "Dedicated support — we are here for everything you need",
    CONFIGURATION_LETTER_ONGOING_SUPPORT,
    [239, 246, 255],
    PDF_COLOR.navy,
  );

  y = addWrappedBlock(
    doc,
    "Your HQ administrator may now sign in to complete terminal setup and create branch leads. For any assistance, contact the Parcela platform team using the details below.",
    PDF_LAYOUT.margin,
    y,
    contentWidth,
    PDF_FONT.body,
    PDF_COLOR.body,
  );

  const thankYouText = configurationLetterThankYou(data.operatorName);
  applyPdfFont(doc, PDF_FONT.bodyItalic);
  const thankYouLines = doc.splitTextToSize(thankYouText, contentWidth - 32) as string[];
  const thankYouHeight = thankYouLines.length * lineHeightFor(PDF_FONT.bodyItalic.size) + 28;
  y = ensureSpace(doc, y, thankYouHeight + PDF_LAYOUT.paragraphGap);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...PDF_COLOR.rule);
  doc.roundedRect(PDF_LAYOUT.margin, y, contentWidth, thankYouHeight, 10, 10, "FD");
  doc.setTextColor(...PDF_COLOR.thankYou);
  thankYouLines.forEach((line, index) => {
    doc.text(line, PDF_LAYOUT.margin + 16, y + 18 + index * lineHeightFor(PDF_FONT.bodyItalic.size));
  });
  y += thankYouHeight + PDF_LAYOUT.paragraphGap;

  y = addWrappedBlock(
    doc,
    "We look forward to a long and successful partnership.",
    PDF_LAYOUT.margin,
    y,
    contentWidth,
    PDF_FONT.bodyBold,
    PDF_COLOR.body,
  );

  y = ensureSpace(doc, y, 80);
  y += PDF_LAYOUT.sectionGap;
  doc.setDrawColor(brandR, brandG, brandB);
  doc.setLineWidth(2);
  doc.line(PDF_LAYOUT.margin, y, PDF_LAYOUT.margin + 72, y);
  y += 16;

  applyPdfFont(doc, PDF_FONT.footerBold);
  doc.setTextColor(...PDF_COLOR.title);
  doc.text(PARCELA_PLATFORM_CONTACT.teamName, PDF_LAYOUT.margin, y + PDF_FONT.footerBold.size * 0.85);
  y += lineHeightFor(PDF_FONT.footerBold.size) + 2;

  applyPdfFont(doc, PDF_FONT.footer);
  doc.setTextColor(...PDF_COLOR.muted);
  doc.text("Authorised platform correspondence", PDF_LAYOUT.margin, y + PDF_FONT.footer.size * 0.85);
  y += lineHeightFor(PDF_FONT.footer.size);

  applyPdfFont(doc, PDF_FONT.footer);
  doc.setTextColor(...PDF_COLOR.muted);
  doc.text(`Phone: ${PARCELA_PLATFORM_CONTACT.phone}`, PDF_LAYOUT.margin, y + PDF_FONT.footer.size * 0.85);
  y += lineHeightFor(PDF_FONT.footer.size);
  doc.text(`Email: ${PARCELA_PLATFORM_CONTACT.email}`, PDF_LAYOUT.margin, y + PDF_FONT.footer.size * 0.85);

  activeLetterWatermark = null;
  doc.save(letterFilename(data.operatorCode));
}

export function configurationLetterRecipients(operator: PlatformOperatorRow) {
  const emails = [operator.contactEmail, operator.primaryAdminEmail]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().toLowerCase());
  return [...new Set(emails)];
}

export async function emailConfigurationLetter(
  data: ConfigurationLetterData,
  recipients: string[],
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (recipients.length === 0) {
    return { ok: false, reason: "Add a company email or HQ admin email before sending." };
  }

  await downloadConfigurationLetterPdf(data);
  await new Promise((resolve) => window.setTimeout(resolve, 350));

  const subject = encodeURIComponent(
    `${BRAND_NAME} — Configuration complete for ${data.operatorName}`,
  );
  const body = encodeURIComponent(configurationLetterPlainText(data));
  const mailto = `mailto:${recipients.join(",")}?subject=${subject}&body=${body}`;

  try {
    window.location.href = mailto;
  } catch {
    // mailto may be blocked; simulated send still counts for UI preview
  }

  return { ok: true };
}
