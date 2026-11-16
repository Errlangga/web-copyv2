import {NextRequest,NextResponse} from "next/server";
import {getSql} from "@/lib/db";
import {requireAdmin} from "@/lib/auth";
import {getClientIp,jsonError,rateLimit,verifySameOrigin} from "@/lib/security";
import {z} from "zod";
export const runtime="nodejs";
const schema=z.object({
 whatsappUrl:z.union([z.string().url().max(2048),z.literal("")]),
 telegramUrl:z.union([z.string().url().max(2048),z.literal("")]),
 tiktokUrl:z.union([z.string().url().max(2048),z.literal("")]),
 purchaseUrl:z.union([z.string().url().max(2048),z.literal("")])
}).refine(d=>
 (!d.whatsappUrl||/^https:\/\/(?:www\.)?(?:whatsapp\.com|wa\.me)\//i.test(d.whatsappUrl)) &&
 (!d.telegramUrl||/^https:\/\/(?:www\.)?t\.me\//i.test(d.telegramUrl)) &&
 (!d.tiktokUrl||/^https:\/\/(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com)\//i.test(d.tiktokUrl)) &&
 (!d.purchaseUrl||/^https:\/\/(?:www\.)?(?:wa\.me|api\.whatsapp\.com|whatsapp\.com)\//i.test(d.purchaseUrl)),
 {message:"Periksa format link WhatsApp, Telegram, TikTok, atau pembelian"});
export async function GET(request:NextRequest){
 if(!(await requireAdmin(request)))return jsonError("Tidak diizinkan",401);
 try{
  const rows=await getSql()`SELECT whatsapp_url AS "whatsappUrl",telegram_url AS "telegramUrl",tiktok_url AS "tiktokUrl",purchase_url AS "purchaseUrl" FROM site_settings WHERE id=TRUE LIMIT 1`;
  return NextResponse.json(rows[0]||{whatsappUrl:"",telegramUrl:"",tiktokUrl:"",purchaseUrl:""});
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
  await getSql()`INSERT INTO site_settings(id,whatsapp_url,telegram_url,tiktok_url,purchase_url,updated_at)
  VALUES(TRUE,${d.whatsappUrl||null},${d.telegramUrl||null},${d.tiktokUrl||null},${d.purchaseUrl||null},now())
  ON CONFLICT(id) DO UPDATE SET whatsapp_url=EXCLUDED.whatsapp_url,telegram_url=EXCLUDED.telegram_url,
  tiktok_url=EXCLUDED.tiktok_url,purchase_url=EXCLUDED.purchase_url,updated_at=now()`;
  return NextResponse.json({ok:true});
 }catch{return jsonError("Gagal menyimpan pengaturan",500)}
}
