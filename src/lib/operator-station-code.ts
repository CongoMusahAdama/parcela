/** Next sequential station code for an operator (e.g. DP-07 after DP-01…DP-06). */
export function nextOperatorStationCode(
  operatorCode: string,
  existingCodes: readonly string[],
): string {
  const prefix = `${operatorCode.trim().toUpperCase()}-`;
  let maxSeq = 0;

  for (const raw of existingCodes) {
    const code = raw.trim().toUpperCase();
    if (!code.startsWith(prefix)) continue;
    const suffix = code.slice(prefix.length);
    if (!/^\d+$/.test(suffix)) continue;
    const seq = Number.parseInt(suffix, 10);
    if (seq > maxSeq) maxSeq = seq;
  }

  return `${prefix}${String(maxSeq + 1).padStart(2, "0")}`;
}
