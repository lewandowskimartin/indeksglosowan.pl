import { cookies } from "next/headers";

/**
 * The Explorer has no user accounts, so the curation panel is gated by a
 * single shared secret instead of Supabase Auth. Set ADMIN_SECRET (32+ chars)
 * in the environment; /admin exchanges it for an httpOnly cookie.
 */
export const ADMIN_COOKIE = "sve_admin";

function secret() {
  const s = process.env.ADMIN_SECRET;
  return s && s.length >= 16 ? s : null;
}

export async function isAdmin(): Promise<boolean> {
  const s = secret();
  if (!s) return false;
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === s;
}

/** For API routes: accepts the cookie OR an x-admin-secret header (for curl/cron). */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const s = secret();
  if (!s) return false;
  if (request.headers.get("x-admin-secret") === s) return true;
  return isAdmin();
}

export function adminSecretMatches(candidate: string) {
  const s = secret();
  return !!s && candidate === s;
}
