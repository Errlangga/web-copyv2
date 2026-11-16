import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await getSql()`
      SELECT id, title, description, document_url AS "documentUrl",
             document_name AS "documentName", access_type AS "accessType",
             price, created_at AS "createdAt"
      FROM catalogs ORDER BY created_at DESC
    `;
    return NextResponse.json({ catalogs: rows }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
    });
  } catch {
    return NextResponse.json({ error: "Katalog belum tersedia" }, { status: 503 });
  }
}
