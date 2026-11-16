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
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 5.5 * 1024 * 1024) return jsonError("Ukuran maksimal 5 MB", 413);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("File tidak ditemukan", 400);
  if (file.size < 1 || file.size > 5 * 1024 * 1024) return jsonError("Ukuran maksimal 5 MB", 400);
  if (!allowed.has(file.type)) return jsonError("Format yang diizinkan: PDF, TXT, DOCX", 400);
  const ext = file.name.split(".").pop()?.toLowerCase();
  const expected = { pdf: "application/pdf", txt: "text/plain", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } as Record<string,string>;
  if (!ext || expected[ext] !== file.type) return jsonError("Ekstensi dan tipe file tidak cocok", 400);

  // MIME headers are user-controlled; verify basic file signatures before storing.
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (ext === "pdf" && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return jsonError("File PDF tidak valid", 400);
  if (ext === "docx" && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) return jsonError("File DOCX tidak valid", 400);
  if (ext === "txt" && bytes.includes(0)) return jsonError("File teks tidak valid", 400);

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const blob = await put(`catalog-docs/${crypto.randomUUID()}-${safeName}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType: file.type,
      contentDisposition: "attachment"
    });
    return NextResponse.json({ url: blob.url, name: file.name });
  } catch {
    return jsonError("Upload dokumen gagal", 500);
  }
}