import {NextResponse} from "next/server";
import {getSql} from "@/lib/db";
export const runtime="nodejs";
export async function GET(){
 try{
  const rows=await getSql()`SELECT whatsapp_url AS "whatsappUrl",telegram_url AS "telegramUrl",tiktok_url AS "tiktokUrl",purchase_url AS "purchaseUrl" FROM site_settings WHERE id=TRUE LIMIT 1`;
  return NextResponse.json(rows[0]||{whatsappUrl:null,telegramUrl:null,tiktokUrl:null,purchaseUrl:null},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({whatsappUrl:null,telegramUrl:null,tiktokUrl:null,purchaseUrl:null},{headers:{"Cache-Control":"no-store"}})}
}
