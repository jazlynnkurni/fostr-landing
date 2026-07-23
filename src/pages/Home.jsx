import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
const CONCEPTS = [
  { path: "/taproot", name: "Taproot", tag: "full 3D · ride the root tip down" },
  { path: "/record", name: "The Record", tag: "typography · the medium is the product" },
  { path: "/survey", name: "The Survey", tag: "line art · one continuous drawing" },
  { path: "/worklight", name: "Worklight", tag: "light · you carry the lamp down" },
];
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8" style={{ background: "var(--paper)" }}>
      <Logo height={34} />
      <p className="text-sm opacity-60 -mt-6">landing concepts, internal preview</p>
      <div className="grid gap-4 w-full max-w-md">
        {CONCEPTS.map(c => (
          <Link key={c.path} to={c.path}
            className="rounded-2xl border border-black/10 bg-white px-6 py-5 hover:border-[var(--teal)] transition-colors">
            <div className="font-extrabold text-lg">{c.name}</div>
            <div className="text-sm opacity-60">{c.tag}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
