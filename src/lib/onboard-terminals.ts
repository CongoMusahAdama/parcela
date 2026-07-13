import { resolveGhanaCityName } from "@/lib/ghana-cities";

export type ParsedTerminalRow = { name: string; city: string };

export type BulkTerminalParseResult = {
  rows: ParsedTerminalRow[];
  skipped: string[];
};

/** Parse bulk terminal lines: "Name, City" or "Name - City" (one per line). */
export function parseBulkTerminalLines(text: string): BulkTerminalParseResult {
  const rows: ParsedTerminalRow[] = [];
  const skipped: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const separated = line.match(/^(.+?)\s*[,|\-–—]\s*(.+)$/);
    if (!separated) {
      skipped.push(line);
      continue;
    }

    const name = separated[1].trim();
    const city = resolveGhanaCityName(separated[2].trim());
    if (!name || !city) {
      skipped.push(line);
      continue;
    }

    rows.push({ name, city });
  }

  return { rows, skipped };
}

/** Parse terminal names (one per line) for a single selected city. */
export function parseTerminalNamesForCity(
  text: string,
  cityValue: string,
): BulkTerminalParseResult {
  const city = resolveGhanaCityName(cityValue);
  if (!city) {
    return { rows: [], skipped: text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) };
  }

  const rows: ParsedTerminalRow[] = [];
  const skipped: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const name = rawLine.trim();
    if (!name) continue;
    rows.push({ name, city });
  }

  return { rows, skipped };
}
