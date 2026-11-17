import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { getClientIp, jsonError, rateLimit, verifySameOrigin } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid", 403);
  const ip = getClientIp(request);
  try {
    if (!(await rateLimit("login:" + ip, 8, 900))) return jsonError("Terlalu banyak percobaan. Coba lagi 15 menit.", 429);
    const body = loginSchema.safeParse(await request.json());
    if (!body.success) return jsonError("Format login tidak valid", 400);
    const username = process.env.ADMIN_USERNAME;
    if (!username) return jsonError("Konfigurasi admin belum lengkap", 503);
    const sql = (await import("@/lib/db")).getSql();
    await sql`CREATE TABLE IF NOT EXISTS admin_credentials (
      id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
      password_hash TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    const credentials = await sql`SELECT password_hash FROM admin_credentials WHERE id=TRUE LIMIT 1`;
    const hash = credentials[0]?.password_hash || process.env.ADMIN_PASSWORD_HASH;
    if (!hash) return jsonError("Konfigurasi admin belum lengkap", 503);
    const valid = body.data.username === username && await bcrypt.compare(body.data.password, hash);
    if (!valid) return jsonError("Username atau password salah", 401);
    await createSession();
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Gagal memproses login", 500);
  }
}