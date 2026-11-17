import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSql } from "@/lib/db";
import { destroySession, requireAdmin } from "@/lib/auth";
import { getClientIp, jsonError, rateLimit, verifySameOrigin } from "@/lib/security";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(256)
});

export async function PUT(request: NextRequest) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid", 403);
  if (!(await requireAdmin(request))) return jsonError("Sesi admin tidak valid", 401);
  if (!(await rateLimit("password-change:" + getClientIp(request), 5, 900)))
    return jsonError("Terlalu banyak percobaan. Coba lagi 15 menit.", 429);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Password baru minimal 8 karakter", 400);

  try {
    const sql = getSql();
    await sql`CREATE TABLE IF NOT EXISTS admin_credentials (
      id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
      password_hash TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    const rows = await sql`SELECT password_hash FROM admin_credentials WHERE id=TRUE LIMIT 1`;
    const currentHash = rows[0]?.password_hash || process.env.ADMIN_PASSWORD_HASH;
    if (!currentHash || !(await bcrypt.compare(parsed.data.currentPassword, currentHash)))
      return jsonError("Password saat ini salah", 400);

    const hash = await bcrypt.hash(parsed.data.newPassword, 12);
    await sql`INSERT INTO admin_credentials(id,password_hash,updated_at)
      VALUES(TRUE,${hash},now())
      ON CONFLICT(id) DO UPDATE SET password_hash=EXCLUDED.password_hash,updated_at=now()`;
    await destroySession();
    return NextResponse.json({ ok: true, reLogin: true });
  } catch {
    return jsonError("Gagal mengganti password. Coba lagi.", 500);
  }
}
