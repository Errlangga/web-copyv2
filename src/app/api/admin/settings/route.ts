import {NextRequest,NextResponse} from "next/server";
import {getSql} from "@/lib/db";
import {requireAdmin} from "@/lib/auth";
import {getClientIp,jsonError,rateLimit,verifySameOrigin} from "@/lib/security";
import {z} from "zod";
export const runtime="nodejs";
const schema=z.object({
 whatsappUrl:z.union([z.string().url().max(2048),z.literal("")]),
 telegramUrl:z.union([z.string().url().max(2048),z.literal("")])
}).refine(d=>[d.whatsappUrl,d.telegramUrl].every(v=>!v||/^https:\/\/(?:www\.)?(?:whatsapp\.com|wa\.me|t\.me)\//i.test(v)),{message:"Gunakan tautan WhatsApp atau Telegram yang valid"});
export async function GET(request:NextRequest){
 if(!(await requireAdmin(request)))return jsonError("Tidak diizinkan",401);
 try{
  const rows=await getSql()`SELECT whatsapp_url AS "whatsappUrl",telegram_url AS "telegramUrl" FROM site_settings WHERE id=TRUE LIMIT 1`;
  return NextResponse.json(rows[0]||{whatsappUrl:"",telegramUrl:""});
 }catch{return jsonError("Gagal mengambil pengaturan",500)}
}
export async function PUT(request:NextRequest){
 if(!verifySameOrigin(request))return jsonError("Origin tidak valid",403);
 if(!(await requireAdmin(request)))return jsonError("Tidak diizinkan",401);
 if(!(await rateLimit("settings-write:"+getClientIp(request),20,900)))return jsonError("Terlalu banyak permintaan",429);
 const parsed=schema.safeParse(await request.json());
 if(!parsed.success)return jsonError(parsed.error.issues[0]?.message||"Tautan tidak valid",400);
 try{
  const d=parsed.data;
  await getSql()`INSERT INTO site_settings(id,whatsapp_url,telegram_url,updated_at) VALUES(TRUE,${d.whatsappUrl||null},${d.telegramUrl||null},now()) ON CONFLICT(id) DO UPDATE SET whatsapp_url=EXCLUDED.whatsapp_url,telegram_url=EXCLUDED.telegram_url,updated_at=now()`;
  return NextResponse.json({ok:true});
 }catch{return jsonError("Gagal menyimpan pengaturan",500)}
}
