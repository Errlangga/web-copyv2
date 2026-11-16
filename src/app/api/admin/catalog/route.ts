import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, verifySameOrigin } from "@/lib/security";
import { catalogSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid", 403);
  if (!(await requireAdmin(request))) return jsonError("Tidak diizinkan", 401);
  const parsed = catalogSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Data katalog tidak valid", 400);
  const d = parsed.data;
  try {
    const rows = await getSql()`
      INSERT INTO catalogs (title, description, content, document_url, document_name)
      VALUES (${d.title}, ${d.description}, ${d.content}, ${d.documentUrl ?? null}, ${d.documentName ?? null})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch {
    return jsonError("Gagal menyimpan katalog", 500);
  }
}