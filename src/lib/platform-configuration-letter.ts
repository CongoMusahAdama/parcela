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

function ensureSpace(doc: LetterPdf, y: number, needed: number) {
  const { bottomLimit } = pageMetrics(doc);
  if (y + needed <= bottomLimit) return y;
  doc.addPage();
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
  indent = 14,
) {
  const { contentWidth } = pageMetrics(doc);
  const bulletX = PDF_LAYOUT.margin + indent;
  const textWidth = contentWidth - indent - 8;
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

export async function downloadConfigurationLetterPdf(data: ConfigurationLetterData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const { width: pageWidth, contentWidth } = pageMetrics(doc);
  let y: number = PDF_LAYOUT.margin;

  try {
    const parcelaLogo = await loadImageDataUrl(BRAND_LOGO_SRC);
    doc.addImage(parcelaLogo, imageFormat(BRAND_LOGO_SRC), PDF_LAYOUT.margin, y, 64, 48);
  } catch {
    applyPdfFont(doc, PDF_FONT.footerBold);
    doc.setTextColor(...PDF_COLOR.navy);
    doc.text(BRAND_NAME, PDF_LAYOUT.margin, y + 28);
  }

  const operatorBoxX = pageWidth - PDF_LAYOUT.margin - 64;
  if (data.operatorLogoSrc) {
    try {
      const operatorLogo = await loadImageDataUrl(data.operatorLogoSrc);
      doc.addImage(operatorLogo, imageFormat(data.operatorLogoSrc), operatorBoxX, y + 4, 64, 40);
    } catch {
      // fall through to initials mark
    }
  }

  if (!data.operatorLogoSrc) {
    const [r, g, b] = hexToRgb(data.brandColor);
    doc.setFillColor(r, g, b);
    doc.roundedRect(operatorBoxX, y + 4, 64, 40, 8, 8, "F");
    applyPdfFont(doc, PDF_FONT.footerBold);
    doc.setTextColor(255, 255, 255);
    doc.text(operatorInitials(data.operatorName, data.operatorCode), operatorBoxX + 32, y + 30, {
      align: "center",
    });
  }

  y += 58;
  doc.setDrawColor(...PDF_COLOR.rule);
  doc.setLineWidth(0.75);
  doc.line(PDF_LAYOUT.margin, y, pageWidth - PDF_LAYOUT.margin, y);
  y += PDF_LAYOUT.headerGap;

  applyPdfFont(doc, PDF_FONT.title);
  doc.setTextColor(...PDF_COLOR.title);
  doc.text("Configuration Completion Letter", pageWidth / 2, y + PDF_FONT.title.size * 0.85, {
    align: "center",
  });
  y += lineHeightFor(PDF_FONT.title.size) + 4;

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

  y = addSectionHeading(doc, "Configuration summary", y, PDF_COLOR.navy);
  y = addBulletList(
    doc,
    [
      `Operator code: ${data.operatorCode}`,
      `Operating region: ${data.region}`,
      `Network: ${data.stationCount} stations across ${data.cityCount} cities / corridors`,
      `Configuration completed: ${data.configuredDateLabel}`,
      `Primary HQ contact: ${data.hqAdminName ?? "—"} (${data.hqAdminEmail ?? "—"})`,
      ...(data.subscriptionSummary ? [`Platform licence: ${data.subscriptionSummary}`] : []),
    ],
    y,
  );

  y += PDF_LAYOUT.bulletGap;
  y = addSectionHeading(
    doc,
    "Monthly maintenance — our commitment to you",
    y,
    PDF_COLOR.amber,
  );
  y = addBulletList(doc, CONFIGURATION_LETTER_MONTHLY_MAINTENANCE, y);

  y = addSectionHeading(
    doc,
    "Dedicated support — we are here for everything you need",
    y,
    PDF_COLOR.navy,
  );
  y = addBulletList(doc, CONFIGURATION_LETTER_ONGOING_SUPPORT, y);

  y = addWrappedBlock(
    doc,
    "Your HQ administrator may now sign in to complete terminal setup and create branch leads. For any assistance, contact the Parcela platform team using the details below.",
    PDF_LAYOUT.margin,
    y,
    contentWidth,
    PDF_FONT.body,
    PDF_COLOR.body,
  );

  y = addWrappedBlock(
    doc,
    configurationLetterThankYou(data.operatorName),
    PDF_LAYOUT.margin,
    y,
    contentWidth,
    PDF_FONT.bodyItalic,
    PDF_COLOR.thankYou,
  );

  y = addWrappedBlock(
    doc,
    "We look forward to a long and successful partnership.",
    PDF_LAYOUT.margin,
    y,
    contentWidth,
    PDF_FONT.bodyBold,
    PDF_COLOR.body,
  );

  y = ensureSpace(doc, y, 60);
  y += PDF_LAYOUT.sectionGap;
  doc.setDrawColor(...PDF_COLOR.rule);
  doc.setLineWidth(0.5);
  doc.line(PDF_LAYOUT.margin, y, pageWidth - PDF_LAYOUT.margin, y);
  y += 18;

  applyPdfFont(doc, PDF_FONT.footerBold);
  doc.setTextColor(...PDF_COLOR.title);
  doc.text(PARCELA_PLATFORM_CONTACT.teamName, PDF_LAYOUT.margin, y + PDF_FONT.footerBold.size * 0.85);
  y += lineHeightFor(PDF_FONT.footerBold.size);

  applyPdfFont(doc, PDF_FONT.footer);
  doc.setTextColor(...PDF_COLOR.muted);
  doc.text(`Phone: ${PARCELA_PLATFORM_CONTACT.phone}`, PDF_LAYOUT.margin, y + PDF_FONT.footer.size * 0.85);
  y += lineHeightFor(PDF_FONT.footer.size);
  doc.text(`Email: ${PARCELA_PLATFORM_CONTACT.email}`, PDF_LAYOUT.margin, y + PDF_FONT.footer.size * 0.85);

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
