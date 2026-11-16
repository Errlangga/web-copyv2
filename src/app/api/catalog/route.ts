import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Keep full text out of the listing response; it is fetched only on the detail page.
    const rows = await sql`
      SELECT id, title, description, document_url AS "documentUrl",
             document_name AS "documentName", created_at AS "createdAt"
      FROM catalogs ORDER BY created_at DESC
    `;
    return NextResponse.json({ catalogs: rows }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
    });
  } catch {
    return NextResponse.json({ error: "Katalog belum tersedia" }, { status: 503 });
  }
}