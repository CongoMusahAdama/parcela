export type TrackingLinks = {
  web: string;
  app: string;
};

export function buildTrackingLinks(
  token: string,
  options: { webBaseUrl: string; mobileScheme: string },
): TrackingLinks {
  const webBase = options.webBaseUrl.replace(/\/$/, '');
  const scheme = options.mobileScheme.replace(/:\/\//, '').trim() || 'parcela';
  return {
    web: `${webBase}/track/t/${encodeURIComponent(token)}`,
    app: `${scheme}://track/t/${encodeURIComponent(token)}`,
  };
}

export function trackingLinksForSms(links: TrackingLinks): string {
  return `Track: ${links.web}`;
}
