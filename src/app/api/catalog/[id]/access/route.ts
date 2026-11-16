import {NextRequest,NextResponse} from "next/server";
import {getSql} from "@/lib/db";
import {getClientIp,jsonError,rateLimit,verifySameOrigin} from "@/lib/security";

export const runtime="nodejs";
type Context={params:Promise<{id:string}>};
const validId=(id:string)=>/^[0-9a-f-]{36}$/i.test(id);

export async function POST(request:NextRequest,context:Context){
 if(!verifySameOrigin(request))return jsonError("Origin tidak valid",403);
 if(!(await rateLimit("catalog-access:"+getClientIp(request),30,900)))return jsonError("Terlalu banyak percobaan. Coba lagi nanti.",429);
 const {id}=await context.params;
 if(!validId(id))return jsonError("ID katalog tidak valid",400);
 const body=await request.json().catch(()=>null) as {action?:string;sessionId?:string}|null;
 if(!body||!["start","complete"].includes(body.action||""))return jsonError("Permintaan tidak valid",400);
 try{
  const catalog=await getSql()`SELECT access_type AS "accessType" FROM catalogs WHERE id=${id} LIMIT 1`;
  if(!catalog.length)return jsonError("Katalog tidak ditemukan",404);
  if(catalog[0].accessType!=="free")return jsonError("Prompt ini berbayar dan tidak bisa dibuka melalui akses gratis",403);

  if(body.action==="start"){
   const rows=await getSql()`INSERT INTO catalog_access_sessions(catalog_id,stage,whatsapp_started_at) VALUES(${id},0,now()) RETURNING id`;
   return NextResponse.json({ok:true,sessionId:rows[0].id,stage:"whatsapp",waitSeconds:30});
  }

  if(!body.sessionId||!/^[0-9a-f-]{36}$/i.test(body.sessionId))return jsonError("Sesi akses tidak valid",400);
  const sessions=await getSql()`SELECT id,stage,whatsapp_started_at,tiktok_started_at,created_at FROM catalog_access_sessions WHERE id=${body.sessionId} AND catalog_id=${id} LIMIT 1`;
  const session=sessions[0];
  if(!session)return jsonError("Sesi akses tidak ditemukan. Mulai lagi.",404);
  if(Date.now()-new Date(session.created_at).getTime()>20*60*1000)return jsonError("Sesi kedaluwarsa. Mulai lagi.",410);

  if(Number(session.stage)===0){
   const elapsed=(Date.now()-new Date(session.whatsapp_started_at).getTime())/1000;
   if(elapsed<30)return NextResponse.json({error:"Waktu mengikuti saluran WhatsApp belum selesai.",remainingSeconds:Math.ceil(30-elapsed)},{status:425});
   await getSql()`UPDATE catalog_access_sessions SET stage=1,tiktok_started_at=now() WHERE id=${body.sessionId} AND stage=0`;
   return NextResponse.json({ok:true,next:"tiktok",waitSeconds:30});
  }
  if(Number(session.stage)===1){
   const elapsed=(Date.now()-new Date(session.tiktok_started_at).getTime())/1000;
   if(elapsed<30)return NextResponse.json({error:"Waktu mengikuti TikTok belum selesai.",remainingSeconds:Math.ceil(30-elapsed)},{status:425});
   const rows=await getSql()`UPDATE catalog_access_sessions SET stage=2,completed_at=now() WHERE id=${body.sessionId} AND stage=1 RETURNING id`;
   if(!rows.length)return jsonError("Sesi sudah digunakan. Mulai lagi.",409);
   const content=await getSql()`SELECT content FROM catalogs WHERE id=${id} AND access_type='free' LIMIT 1`;
   if(!content.length)return jsonError("Teks tidak tersedia",404);
   return NextResponse.json({ok:true,content:content[0].content});
  }
  return jsonError("Akses ini sudah digunakan. Mulai lagi untuk membuka teks.",409);
 }catch{return jsonError("Terjadi kesalahan saat memproses akses",500)}
}
