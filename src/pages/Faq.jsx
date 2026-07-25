// FAQ + contact page. Hardcoded Q&A for now (later dynamic), a fun interactive
// header to "learn more about us", and the Book-with-Jaden CTA (Cal.com).
import { useEffect, useRef, useState } from "react";
import Logo from "../components/Logo.jsx";
import { FAQS, CAL_URL, CONTACT_EMAIL } from "../copy.js";

// A small interactive halftone header: dots swell toward the cursor. On-brand with
// the taproot's dotted world, and a light "fun" moment before the questions.
function InteractiveHeader() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const teal = getComputedStyle(document.documentElement).getPropertyValue("--teal").trim() || "#5DA1A1";
    const mm = (teal.match(/[0-9a-f]{2}/gi) || ["5d", "a1", "a1"]).map((h) => parseInt(h, 16));
    let W = 0, HGT = 0, raf = 0;
    const mouse = { x: -1e4, y: -1e4 };
    const rect = () => canvas.getBoundingClientRect();
    const move = (e) => { const r = rect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const leave = () => { mouse.x = -1e4; mouse.y = -1e4; };
    const resize = () => { const r = rect(); W = r.width; HGT = r.height; canvas.width = W * dpr; canvas.height = HGT * dpr; };
    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    function loop() {
      raf = requestAnimationFrame(loop);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, HGT);
      const step = 17, R = 200;
      for (let y = step / 2; y < HGT; y += step) {
        for (let x = step / 2; x < W; x += step) {
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          const k = Math.max(0, 1 - d / R);
          const r = 1 + k * k * (step * 0.6);
          if (r < 0.6) continue;
          ctx.fillStyle = `rgba(${mm[0]},${mm[1]},${mm[2]},${(0.16 + k * 0.5).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 6.2832);
          ctx.fill();
        }
      }
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", leave); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />;
}

function Item({ q, a, open, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(30,38,36,0.12)" }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "22px 4px", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "var(--ink)", fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)", letterSpacing: "-0.01em" }}
      >
        <span>{q}</span>
        <span aria-hidden style={{ flex: "0 0 auto", width: 26, height: 26, position: "relative", color: "var(--teal)" }}>
          <span style={{ position: "absolute", top: "50%", left: "50%", width: 15, height: 2, background: "currentColor", transform: "translate(-50%,-50%)" }} />
          <span style={{ position: "absolute", top: "50%", left: "50%", width: 2, height: 15, background: "currentColor", transform: `translate(-50%,-50%) rotate(${open ? 90 : 0}deg)`, transition: "transform .25s ease" }} />
        </span>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .3s ease" }}>
        <div style={{ overflow: "hidden" }}>
          <p style={{ margin: 0, padding: "0 4px 24px", maxWidth: "62ch", fontSize: "clamp(0.98rem, 1.6vw, 1.08rem)", lineHeight: 1.65, color: "rgba(30,38,36,0.78)" }}>{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [open, setOpen] = useState(0);
  const btn = { display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", borderRadius: 999, fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 15, padding: "13px 24px" };
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink)", fontFamily: "var(--font-inter)" }}>
      {/* top nav */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px clamp(20px, 5vw, 56px)", background: "rgba(247,245,241,0.82)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(30,38,36,0.08)" }}>
        <a href="/taproot" aria-label="Fostr home" style={{ color: "var(--ink)", textDecoration: "none" }}><Logo height={24} /></a>
        <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/taproot" style={{ ...btn, padding: "10px 16px", color: "var(--ink)" }}>The story</a>
          <a href={CAL_URL} target="_blank" rel="noopener noreferrer" style={{ ...btn, padding: "10px 18px", background: "var(--teal)", color: "#08201f", fontWeight: 700 }}>Book with Jaden</a>
        </nav>
      </header>

      {/* interactive header */}
      <section style={{ position: "relative", overflow: "hidden", padding: "clamp(64px, 12vh, 130px) clamp(20px, 5vw, 56px)", textAlign: "center" }}>
        <InteractiveHeader />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", pointerEvents: "none" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 16 }}>Learn more about us</div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0 }}>Questions, answered.</h1>
          <p style={{ maxWidth: "46ch", margin: "18px auto 0", fontSize: "clamp(1rem, 1.8vw, 1.15rem)", lineHeight: 1.6, color: "rgba(30,38,36,0.7)" }}>
            The short version of what Fostr is, who it's for, and how to see it for yourself. Move your cursor around up here while you're at it.
          </p>
        </div>
      </section>

      {/* accordion */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "8px clamp(20px, 5vw, 40px) 40px" }}>
        {FAQS.map((f, i) => (
          <Item key={f.q} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
        ))}
      </section>

      {/* contact / booking */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "20px clamp(20px, 5vw, 40px) clamp(60px, 12vh, 120px)", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(180deg, rgba(93,161,161,0.10), rgba(93,161,161,0.04))", border: "1px solid rgba(93,161,161,0.28)", borderRadius: 20, padding: "clamp(32px, 6vw, 56px)" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(1.5rem, 3.4vw, 2.2rem)", letterSpacing: "-0.02em", margin: "0 0 10px" }}>Still have a question?</h2>
          <p style={{ maxWidth: "42ch", margin: "0 auto 26px", fontSize: 16, lineHeight: 1.6, color: "rgba(30,38,36,0.72)" }}>
            Book 20 minutes with Jaden for a walkthrough, or send a note. Real conversations, no sales script.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={CAL_URL} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: "var(--teal)", color: "#08201f", fontWeight: 700 }}>Book with Jaden</a>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ ...btn, border: "1px solid rgba(30,38,36,0.35)", color: "var(--ink)" }}>Email us</a>
          </div>
        </div>
      </section>
    </main>
  );
}
