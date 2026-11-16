import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";
import { jsonError, verifySameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const allowed = new Set(["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid", 403);
  if (!(await requireAdmin(request))) return jsonError("Tidak diizinkan", 401);
  if (!process.env.BLOB_READ_WRITE_TOKEN) return jsonError("Upload belum dikonfigurasi", 503);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("File tidak ditemukan", 400);
  if (file.size < 1 || file.size > 5 * 1024 * 1024) return jsonError("Ukuran maksimal 5 MB", 400);
  if (!allowed.has(file.type)) return jsonError("Format yang diizinkan: PDF, TXT, DOCX", 400);
  const ext = file.name.split(".").pop()?.toLowerCase();
  const expected = { pdf: "application/pdf", txt: "text/plain", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } as Record<string,string>;
  if (!ext || expected[ext] !== file.type) return jsonError("Ekstensi dan tipe file tidak cocok", 400);
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const blob = await put(`catalog-docs/${crypto.randomUUID()}-${safeName}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType: file.type
    });
    return NextResponse.json({ url: blob.url, name: file.name });
  } catch {
    return jsonError("Upload dokumen gagal", 500);
  }
}