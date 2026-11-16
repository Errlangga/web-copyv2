import Link from "next/link";
import Image from "next/image";
import {notFound} from "next/navigation";
import {getSql} from "@/lib/db";
import FreeAccessGate from "@/components/FreeAccessGate";
export const runtime="nodejs";
type CatalogRow={id:string;title:string;description:string;documentUrl:string|null;documentName:string|null;accessType:"free"|"paid";price:number|null};
export default async function PromptPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 let rows:CatalogRow[]=[];
 try{rows=await getSql()`SELECT id,title,description,document_url AS "documentUrl",document_name AS "documentName",access_type AS "accessType",price FROM catalogs WHERE id=${id} LIMIT 1` as unknown as CatalogRow[]}
 catch{return <main className="wrap detail"><p>Database unavailable.</p><Link href="/">← Back</Link></main>}
 const item=rows[0];if(!item)notFound();
 let settings:{whatsappUrl:string|null;purchaseUrl:string|null}={whatsappUrl:null,purchaseUrl:null};
 if(item.accessType==="paid"){try{const s=await getSql()`SELECT whatsapp_url AS "whatsappUrl",purchase_url AS "purchaseUrl" FROM site_settings WHERE id=TRUE LIMIT 1`;settings=s[0]||settings}catch{}}
 const buyUrl=settings.purchaseUrl||settings.whatsappUrl;
 const money=new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(item.price||0));
 return <main className="wrap"><nav className="nav"><Link className="brand" href="/">NOCTURNE<span>999</span></Link><Link className="btn" href="/">← Archive</Link></nav>
 <article className="detail"><div className="eyebrow">ARCHIVE ENTRY / {item.id.slice(0,8).toUpperCase()}</div><h1>{item.title}</h1><p className="muted">{item.description}</p>
 {item.documentUrl&&<div className="prompt-cover"><Image src={item.documentUrl} alt={item.documentName||"Gambar dokumen prompt"} width={1200} height={800} unoptimized style={{width:"100%",height:"auto",maxHeight:650,objectFit:"contain"}}/><p className="muted">{item.documentName}</p></div>}
 {item.accessType==="paid"?<section className="access-panel"><div className="eyebrow">PREMIUM PROMPT</div><div className="paid-price">{money}</div><p className="muted">Isi prompt disimpan secara privat dan hanya dapat dilihat admin. Hubungi admin untuk membeli prompt ini.</p>{buyUrl?<a className="btn primary" href={buyUrl} target="_blank" rel="noopener noreferrer">Beli Prompt via WhatsApp ↗</a>:<p className="notice">Admin belum mengatur link WhatsApp pembelian.</p>}</section>:<FreeAccessGate catalogId={item.id}/>}
 </article></main>;
}
