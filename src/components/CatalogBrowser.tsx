"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Item={id:string;title:string;description:string;content:string;documentUrl:string|null;documentName:string|null};
export default function CatalogBrowser(){
 const [items,setItems]=useState<Item[]>([]);const [query,setQuery]=useState("");const [error,setError]=useState("");
 useEffect(()=>{fetch("/api/catalog").then(r=>r.ok?r.json():Promise.reject()).then(d=>setItems(d.catalogs||[])).catch(()=>setError("Katalog belum dapat dimuat."));},[]);
 const filtered=useMemo(()=>items.filter(x=>(x.title+" "+x.description).toLowerCase().includes(query.toLowerCase())),[items,query]);
 return <><input className="search" placeholder="Cari katalog..." value={query} onChange={e=>setQuery(e.target.value)}/>{error&&<p className="muted">{error}</p>}<div className="grid" style={{marginTop:18}}>{filtered.map(item=><article className="catalog" key={item.id}><div className="tag">TEXT FILE / {item.id.slice(0,6).toUpperCase()}</div><h3>{item.title}</h3><p>{item.description||"No description available."}</p><div className="row"><Link className="btn" href={"/catalog/"+item.id}>Open text ↗</Link>{item.documentUrl&&<a className="btn" href={item.documentUrl} target="_blank" rel="noreferrer">Document ↓</a>}</div></article>)}</div>{!error&&!filtered.length&&<p className="muted" style={{marginTop:24}}>{items.length?"Tidak ada hasil yang cocok.":"Belum ada katalog. Koleksi akan muncul di sini."}</p>}</>;
}