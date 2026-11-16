import Link from "next/link";
import CatalogBrowser from "@/components/CatalogBrowser";

export default function Home() {
  return <main className="wrap">
    <nav className="nav"><Link className="brand" href="/">COPY<span>VAULT</span></Link><div className="navlinks"><a href="#archive">Archive</a><a href={process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/"} target="_blank" rel="noreferrer">WhatsApp</a><a href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/"} target="_blank" rel="noreferrer">Telegram</a></div></nav>
    <section className="hero"><div className="eyebrow">[ DIGITAL TEXT ARCHIVE / 001 ]</div><h1>Words worth<br/><em>keeping.</em></h1><p className="lead">Satu ruang untuk menyimpan template, teks pilihan, dan berbagai tulisan digital. Temukan yang kamu cari, salin dalam satu klik, lalu gunakan sesuai kebutuhan.</p><div className="actions"><a className="btn primary" href="#archive">Explore archive ↗</a><a className="btn" href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/"} target="_blank" rel="noreferrer">Join channel ↗</a></div></section>
    <section className="section" id="archive"><div className="sectionhead"><div><div className="eyebrow">THE COLLECTION</div><h2>Browse the archive</h2><div className="muted" style={{fontSize:13}}>Pilih teks, lihat detail, dan copy langsung.</div></div></div><CatalogBrowser/></section>
    <footer className="footer"><span>COPYVAULT © {new Date().getFullYear()}</span><span>PRIVATE THOUGHTS. PUBLIC WORDS.</span><Link href="/admin">ADMIN ACCESS ↗</Link></footer>
  </main>;
}