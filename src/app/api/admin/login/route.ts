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
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!username || !hash) return jsonError("Konfigurasi admin belum lengkap", 503);
    const valid = body.data.username === username && await bcrypt.compare(body.data.password, hash);
    if (!valid) return jsonError("Username atau password salah", 401);
    await createSession();
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Gagal memproses login", 500);
  }
}