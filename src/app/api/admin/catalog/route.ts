import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getClientIp, jsonError, rateLimit, verifySameOrigin } from "@/lib/security";
import { catalogSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request:NextRequest) {
  if (!(await requireAdmin(request))) return jsonError("Tidak diizinkan",401);
  try {
    const catalogs=await getSql()`
      SELECT id,title,description,content,document_url AS "documentUrl",
      document_name AS "documentName",access_type AS "accessType",price
      FROM catalogs ORDER BY created_at DESC
    `;
    return NextResponse.json({catalogs},{headers:{"Cache-Control":"no-store"}});
  } catch { return jsonError("Gagal memuat katalog admin",500); }
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid", 403);
  if (!(await requireAdmin(request))) return jsonError("Tidak diizinkan", 401);
  if (!(await rateLimit("catalog-write:" + getClientIp(request), 60, 900))) return jsonError("Terlalu banyak permintaan", 429);
  const parsed = catalogSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message||"Data katalog tidak valid", 400);
  const d = parsed.data;
  try {
    const rows = await getSql()`
      INSERT INTO catalogs (title, description, content, document_url, document_name, access_type, price)
      VALUES (${d.title}, ${d.description}, ${d.content}, ${d.documentUrl ?? null}, ${d.documentName ?? null}, ${d.accessType}, ${d.accessType==="paid"?d.price:null})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch { return jsonError("Gagal menyimpan katalog", 500); }
}
