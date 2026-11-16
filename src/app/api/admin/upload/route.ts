import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";
import { getClientIp, jsonError, rateLimit, verifySameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const formats: Record<string,{mime:string;signature:(b:Uint8Array)=>boolean}> = {
  jpg:{mime:"image/jpeg",signature:b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
  jpeg:{mime:"image/jpeg",signature:b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
  png:{mime:"image/png",signature:b=>b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47&&b[4]===0x0d&&b[5]===0x0a&&b[6]===0x1a&&b[7]===0x0a},
  webp:{mime:"image/webp",signature:b=>b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46&&b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50},
  gif:{mime:"image/gif",signature:b=>(new TextDecoder().decode(b.slice(0,6))==="GIF87a"||new TextDecoder().decode(b.slice(0,6))==="GIF89a")}
};

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid",403);
  if (!(await requireAdmin(request))) return jsonError("Tidak diizinkan",401);
  if (!(await rateLimit("upload:"+getClientIp(request),12,3600))) return jsonError("Batas upload tercapai. Coba lagi nanti.",429);
  if (!process.env.BLOB_READ_WRITE_TOKEN) return jsonError("Upload belum dikonfigurasi",503);
  const length=Number(request.headers.get("content-length")||0);
  if(length>5.5*1024*1024)return jsonError("Ukuran maksimal 5 MB",413);
  const form=await request.formData();
  const file=form.get("file");
  if(!(file instanceof File))return jsonError("File gambar tidak ditemukan",400);
  if(file.size<1||file.size>5*1024*1024)return jsonError("Ukuran maksimal 5 MB",400);
  const ext=file.name.split(".").pop()?.toLowerCase()||"";
  const format=formats[ext];
  if(!format||file.type!==format.mime)return jsonError("Format yang diizinkan: JPG, PNG, WEBP, GIF",400);
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(!format.signature(bytes))return jsonError("Isi file tidak cocok dengan format gambar",400);
  try{
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100);
    const blob=await put(`catalog-images/${crypto.randomUUID()}-${safeName}`,file,{
      access:"public",token:process.env.BLOB_READ_WRITE_TOKEN,addRandomSuffix:false,contentType:format.mime
    });
    return NextResponse.json({url:blob.downloadUrl,name:file.name});
  }catch{return jsonError("Upload gambar gagal",500)}
}
