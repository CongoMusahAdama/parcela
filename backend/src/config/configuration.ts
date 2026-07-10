export default () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/parcela',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3001,http://localhost:8081,http://localhost:8082,http://localhost:8083')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  mnotify: {
    apiKey: process.env.MNOTIFY_API_KEY ?? '',
    senderId: process.env.MNOTIFY_SENDER_ID ?? 'Parcela',
    enabled: process.env.MNOTIFY_ENABLED === 'true',
    baseUrl: process.env.MNOTIFY_BASE_URL ?? 'https://api.mnotify.com/api',
  },
  seed: {
    onStartup: process.env.SEED_ON_STARTUP !== 'false',
    reset: process.env.SEED_RESET === 'true',
  },
  app: {
    publicWebUrl: process.env.PUBLIC_WEB_URL ?? 'http://localhost:3001',
    mobileDeepLinkScheme: process.env.MOBILE_DEEP_LINK_SCHEME ?? 'parcela',
  },
  staff: {
    // Never fall back to a shared default — set STAFF_TOKEN_SECRET in .env.local
    tokenSecret: process.env.STAFF_TOKEN_SECRET ?? '',
    tokenTtlMs: parseInt(process.env.STAFF_TOKEN_TTL_MS ?? String(8 * 60 * 60 * 1000), 10),
  },
  platform: {
    seedEmail: process.env.PLATFORM_ADMIN_EMAIL ?? 'platform@parcela.app',
    seedPassword: process.env.SEED_PLATFORM_PASSWORD ?? '',
    adminPhone: process.env.PLATFORM_ADMIN_PHONE ?? '',
  },
});
