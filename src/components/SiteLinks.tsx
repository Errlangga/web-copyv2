"use client";
import {useEffect,useState} from "react";
type Links={whatsappUrl:string|null;telegramUrl:string|null};
export default function SiteLinks({compact=false}:{compact?:boolean}){
 const [links,setLinks]=useState<Links>({whatsappUrl:null,telegramUrl:null});
 useEffect(()=>{fetch("/api/settings").then(r=>r.ok?r.json():null).then(d=>{if(d)setLinks(d)}).catch(()=>{});},[]);
 return <>{links.whatsappUrl&&<a className={compact?"":"btn"} href={links.whatsappUrl} target="_blank" rel="noopener noreferrer">{compact?"WhatsApp":"Saluran WhatsApp ↗"}</a>}{links.telegramUrl&&<a className={compact?"":"btn"} href={links.telegramUrl} target="_blank" rel="noopener noreferrer">{compact?"Telegram":"Saluran Telegram ↗"}</a>}</>;
}
