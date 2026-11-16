import Link from "next/link";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <main className="wrap">
      <nav className="nav">
        <Link className="brand" href="/">COPY<span>VAULT</span></Link>
        <span className="eyebrow">SECURE CONSOLE</span>
      </nav>
      <AdminPanel />
    </main>
  );
}
