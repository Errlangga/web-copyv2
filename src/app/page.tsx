import Link from "next/link";
import CatalogBrowserV2 from "@/components/CatalogBrowserV2";
import SiteLinks from "@/components/SiteLinks";

export default function Home() {
  return <main className="wrap">
    <nav className="nav">
      <Link className="brand" href="/">NOCTURNE<span>999</span></Link>
      <div className="navlinks"><a href="#archive">Archive</a><SiteLinks compact /></div>
    </nav>
    <section className="hero">
      <div className="eyebrow">[ UNKNOWN ARCHIVE / ACCESS 999 ]</div>
      <h1>Temukan prompt<br/><em>gratis disini</em></h1>
      <div className="hero-mark" aria-hidden="true">999</div>
      <div className="actions"><a className="btn primary" href="#archive">Buka arsip ↗</a><SiteLinks /></div>
    </section>
    <section className="section" id="archive">
      <div className="sectionhead"><div><div className="eyebrow">THE FORBIDDEN COLLECTION</div><h2>Arsip pilihan</h2><p className="muted">Koleksi prompt gratis dan premium.</p></div></div>
      <CatalogBrowserV2/>
    </section>
    <footer className="footer"><span>NOCTURNE999 © {new Date().getFullYear()}</span><span>NOTHING IS LOST. NOTHING IS SAFE.</span><Link href="/admin">ADMIN ACCESS ↗</Link></footer>
  </main>;
}
