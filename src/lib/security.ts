import { NextRequest, NextResponse } from "next/server";

export function verifySameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function getClientIp(request: NextRequest) {
  return request.headers.get("x-real-ip")?.slice(0, 64) || "unknown";
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const rows = await (await import("@/lib/db")).sql`
    INSERT INTO rate_limits (key, count, window_started_at)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_started_at < now() - (${windowSeconds} * interval '1 second') THEN 1
        ELSE rate_limits.count + 1
      END,
      window_started_at = CASE
        WHEN rate_limits.window_started_at < now() - (${windowSeconds} * interval '1 second') THEN now()
        ELSE rate_limits.window_started_at
      END
    RETURNING count
  `;
  return Number(rows[0]?.count ?? limit + 1) <= limit;
}