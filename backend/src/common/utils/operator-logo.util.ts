import { BadRequestException } from '@nestjs/common';

const MAX_LOGO_DATA_URL_LENGTH = 600_000;
const LOGO_DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function normalizeOperatorLogoDataUrl(
  value: string | undefined | null,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_LOGO_DATA_URL_LENGTH) {
    throw new BadRequestException('Logo file is too large. Use an image under 400 KB.');
  }
  if (!LOGO_DATA_URL_PATTERN.test(trimmed)) {
    throw new BadRequestException('Logo must be a PNG, JPEG, or WebP image.');
  }
  return trimmed;
}
