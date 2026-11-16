"use client";
import {useEffect,useState} from "react";

type Settings={whatsappUrl:string|null;tiktokUrl:string|null};
type Stage="idle"|"whatsapp"|"tiktok"|"ready"|"unlocked";
export default function FreeAccessGate({catalogId}:{catalogId:string}){
 const [settings,setSettings]=useState<Settings>({whatsappUrl:null,tiktokUrl:null});
 const [stage,setStage]=useState<Stage>("idle");
 const [sessionId,setSessionId]=useState("");
 const [deadline,setDeadline]=useState(0);
 const [seconds,setSeconds]=useState(0);
 const [confirmed,setConfirmed]=useState(false);
 const [content,setContent]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  fetch("/api/settings").then(r=>r.ok?r.json():null).then(d=>{if(d)setSettings(d)}).catch(()=>{});
  const saved=sessionStorage.getItem("nocturne-free-access-"+catalogId);
  if(saved){try{const d=JSON.parse(saved);if(d.sessionId&&d.stage&&d.deadline){setSessionId(d.sessionId);setStage(d.stage);setDeadline(d.deadline)}}catch{}}
 },[catalogId]);
 useEffect(()=>{
  if(!deadline||stage==="unlocked")return;
  const tick=()=>setSeconds(Math.max(0,Math.ceil((deadline-Date.now())/1000)));
  tick();const timer=window.setInterval(tick,250);return()=>window.clearInterval(timer);
 },[deadline,stage]);
 useEffect(()=>{
  const onVisibility=()=>{if(document.visibilityState==="visible"&&deadline>Date.now()&&(stage==="whatsapp"||stage==="tiktok"))setMessage("Kamu kembali sebelum 30 detik selesai. Tunggu sampai hitung mundur selesai sebelum melanjutkan.")};
  document.addEventListener("visibilitychange",onVisibility);return()=>document.removeEventListener("visibilitychange",onVisibility);
 },[deadline,stage]);

 async function begin(){
  if(!settings.whatsappUrl||!settings.tiktokUrl){setMessage("Admin belum mengatur link saluran WhatsApp dan TikTok.");return}
  window.open(settings.whatsappUrl,"_blank","noopener,noreferrer");
  setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/catalog/"+catalogId+"/access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start"})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal memulai akses");
   setSessionId(d.sessionId);setStage("whatsapp");setDeadline(Date.now()+30000);
   sessionStorage.setItem("nocturne-free-access-"+catalogId,JSON.stringify({sessionId:d.sessionId,stage:"whatsapp",deadline:Date.now()+30000}));
  }catch(e){setMessage(e instanceof Error?e.message:"Gagal memulai akses")}finally{setBusy(false)}
 }
 async function nextToTikTok(){
  if(seconds>0||!sessionId)return;
  window.open(settings.tiktokUrl||"about:blank","_blank","noopener,noreferrer");
  setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/catalog/"+catalogId+"/access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"complete",sessionId})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Waktu WhatsApp belum selesai");
   const nextDeadline=Date.now()+30000;setStage("tiktok");setDeadline(nextDeadline);setConfirmed(false);
   sessionStorage.setItem("nocturne-free-access-"+catalogId,JSON.stringify({sessionId,stage:"tiktok",deadline:nextDeadline}));
  }catch(e){setMessage(e instanceof Error?e.message:"Gagal melanjutkan")}finally{setBusy(false)}
 }
 async function unlock(){
  if(seconds>0||!confirmed||!sessionId)return;
  setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/catalog/"+catalogId+"/access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"complete",sessionId})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Waktu TikTok belum selesai");
   setContent(d.content||"");setStage("unlocked");sessionStorage.removeItem("nocturne-free-access-"+catalogId);
  }catch(e){setMessage(e instanceof Error?e.message:"Gagal membuka teks")}finally{setBusy(false)}
 }
 async function copy(){try{await navigator.clipboard.writeText(content);setMessage("Teks berhasil disalin.")}catch{setMessage("Gagal menyalin. Pilih teks secara manual.")}}
 return <section className="access-panel">
  <div className="eyebrow">FREE ACCESS / TWO-STEP CHECK</div>
  <h2>{stage==="unlocked"?"Prompt berhasil dibuka":"Buka prompt gratis"}</h2>
  {stage==="idle"&&<><p className="muted">Ikuti dua tahap akses gratis. Setiap tahap membutuhkan waktu 30 detik.</p><button className="btn primary" disabled={busy} onClick={begin}>{busy?"Memproses...":"1. Buka saluran WhatsApp ↗"}</button></>}
  {stage==="whatsapp"&&<><p className="muted">Tahap 1/2 — buka saluran WhatsApp di tab baru dan ikuti salurannya.</p><div className="countdown">{seconds.toString().padStart(2,"0")}<small>DETIK</small></div><p className="muted">{seconds>0?"Tunggu hingga waktu selesai. Jika kembali lebih awal, peringatan akan muncul.":"Waktu selesai. Lanjut ke tahap TikTok."}</p><button className="btn primary" disabled={busy||seconds>0} onClick={nextToTikTok}>2. Lanjut ke TikTok ↗</button></>}
  {stage==="tiktok"&&<><p className="muted">Tahap 2/2 — buka akun TikTok dan follow akun tersebut.</p><div className="countdown">{seconds.toString().padStart(2,"0")}<small>DETIK</small></div><p className="muted">{seconds>0?"Tunggu hingga waktu selesai.":"Waktu selesai. Konfirmasi untuk membuka prompt."}</p><label className="confirm-line"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Saya sudah mengikuti saluran WhatsApp dan follow TikTok.</label><button className="btn primary" disabled={busy||seconds>0||!confirmed} onClick={unlock}>Buka teks gratis</button></>}
  {stage==="unlocked"&&<><pre className="prompt-content">{content}</pre><button className="btn primary" onClick={copy}>Salin prompt</button></>}
  {message&&<p className="notice">{message}</p>}
  <p className="access-disclaimer">Catatan: timer memeriksa waktu tunggu, bukan status follow/join dari server WhatsApp atau TikTok. Konfirmasi follow dilakukan secara mandiri.</p>
 </section>;
}
