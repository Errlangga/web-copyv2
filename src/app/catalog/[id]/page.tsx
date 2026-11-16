import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSql } from "@/lib/db";
import CopyButton from "@/components/CopyButton";

export const runtime = "nodejs";

type CatalogRow = {
  id: string; title: string; description: string; content: string;
  documentUrl: string | null; documentName: string | null;
};

export default async function CatalogDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  let rows: CatalogRow[] = [];
  try {
    rows = (await getSql()`SELECT id,title,description,content,document_url AS "documentUrl",document_name AS "documentName" FROM catalogs WHERE id=${id} LIMIT 1`) as unknown as CatalogRow[];
  } catch {
    return <main className="wrap detail"><p>Database unavailable.</p><Link href="/">← Back</Link></main>;
  }
  const item = rows[0];
  if (!item) notFound();
  return <main className="wrap">
    <nav className="nav">
      <Link className="brand" href="/">NOCTURNE<span>999</span></Link>
      <Link className="btn" href="/">← Archive</Link>
    </nav>
    <article className="detail">
      <div className="eyebrow">ARCHIVE ENTRY / {item.id.slice(0,8).toUpperCase()}</div>
      <h1>{item.title}</h1>
      <p className="muted">{item.description}</p>
      <pre>{item.content}</pre>
      <div className="actions">
        <CopyButton text={item.content}/>
        {item.documentUrl&&<a className="btn" href={item.documentUrl} target="_blank" rel="noreferrer">Open image ↗</a>}
      </div>
      {item.documentUrl&&<div style={{marginTop:28,border:"1px solid #3b171e",padding:10,background:"#10090b"}}>
        <Image src={item.documentUrl} alt={item.documentName||"Lampiran gambar"} width={1200} height={800} unoptimized style={{width:"100%",height:"auto",maxHeight:700,objectFit:"contain"}}/>
        <p className="muted" style={{fontSize:12}}>{item.documentName}</p>
      </div>}
    </article>
  </main>;
}
