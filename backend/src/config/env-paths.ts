import { existsSync } from 'fs';
import { join } from 'path';

/** Repo root (parcela/) — three levels up from backend/src/config or backend/dist/config */
function repoRoot() {
  return join(__dirname, '..', '..', '..');
}

/** backend/ — two levels up from config folder */
function backendRoot() {
  return join(__dirname, '..', '..');
}

/**
 * Single source of truth: prefer repo-root .env.local, then .env, then backend/.env.
 * Sender, rider/track, and staff all use this API → same MongoDB `parcela` database.
 */
export function getEnvFilePaths(): string[] {
  const candidates = [
    join(backendRoot(), '.env'),
    join(repoRoot(), '.env'),
    join(repoRoot(), '.env.local'),
  ];
  return candidates.filter((path) => existsSync(path));
}
