import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getClientIp, jsonError, rateLimit, verifySameOrigin } from "@/lib/security";
import { catalogSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
const validId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

export async function PUT(request: NextRequest, context: Context) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid", 403);
  if (!(await requireAdmin(request))) return jsonError("Tidak diizinkan", 401);
  if (!(await rateLimit("catalog-write:" + getClientIp(request), 60, 900))) return jsonError("Terlalu banyak permintaan", 429);
  const { id } = await context.params;
  if (!validId(id)) return jsonError("ID tidak valid", 400);
  const parsed = catalogSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message||"Data katalog tidak valid", 400);
  const d = parsed.data;
  try {
    const rows = await getSql()`
      UPDATE catalogs SET title=${d.title}, description=${d.description}, content=${d.content},
      document_url=${d.documentUrl ?? null}, document_name=${d.documentName ?? null},
      access_type=${d.accessType}, price=${d.accessType==="paid"?d.price:null}, updated_at=now()
      WHERE id=${id} RETURNING id
    `;
    if (!rows.length) return jsonError("Katalog tidak ditemukan", 404);
    return NextResponse.json({ ok: true });
  } catch { return jsonError("Gagal memperbarui katalog", 500); }
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid", 403);
  if (!(await requireAdmin(request))) return jsonError("Tidak diizinkan", 401);
  const { id } = await context.params;
  if (!validId(id)) return jsonError("ID tidak valid", 400);
  try {
    const rows = await getSql()`DELETE FROM catalogs WHERE id=${id} RETURNING id`;
    if (!rows.length) return jsonError("Katalog tidak ditemukan", 404);
    return NextResponse.json({ ok: true });
  } catch { return jsonError("Gagal menghapus katalog", 500); }
}
