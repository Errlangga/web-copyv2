import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, title, description, content, document_url AS "documentUrl",
             document_name AS "documentName", created_at AS "createdAt"
      FROM catalogs ORDER BY created_at DESC
    `;
    return NextResponse.json({ catalogs: rows });
  } catch {
    return NextResponse.json({ error: "Katalog belum tersedia" }, { status: 503 });
  }
}