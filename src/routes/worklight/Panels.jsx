// The eight panels. CARDINAL RULE: every headline is DOM text at AAA contrast the
// moment its panel enters the viewport — the beam reveals texture and roots, never copy.
import { useEffect, useRef } from "react";
import { motion, useTransform, animate } from "framer-motion";
import { PANELS, BUSINESS_LINE, DEMO_DOCS, TRACE_EXAMPLE } from "../../copy.js";
import Logo from "../../components/Logo.jsx";

// Panel heights (vh) must sum with the hero to shader.js TOTAL * 100.
const VH = [100, 140, 120, 140, 180, 120, 130, 130];

const SHEET_POS = [
  { left: "6%", top: "6%", rot: -5 },
  { left: "68%", top: "2%", rot: 4 },
  { left: "12%", top: "64%", rot: 3 },
  { left: "64%", top: "58%", rot: -4 },
];

// Form sheet embedded in the soil wall; the beam sweep lights it, then it
// settles to afterglow. maxSv only grows, so lit sheets never un-light.
function Sheet({ maxSv, i }) {
  const t = 1.0 + i * 0.18;
  const opacity = useTransform(maxSv, [t - 0.15, t, t + 0.7], [0.2, 0.95, 0.5]);
  const s = SHEET_POS[i];
  return (
    <motion.div className="wl-sheet" style={{ left: s.left, top: s.top, rotate: s.rot, opacity }}>
      <span>Name.</span>
      <span>DOB.</span>
      <span>Placement.</span>
    </motion.div>
  );
}

// Destination card: lights when its filament arrives, persists lit.
function DocCard({ maxSv, i, label }) {
  const t = 4.02 + i * 0.07;
  const opacity = useTransform(maxSv, [t - 0.06, t, t + 3], [0.3, 1, 0.85]);
  const boxShadow = useTransform(maxSv, (v) =>
    v > t ? "0 0 26px rgba(93,161,161,0.28)" : "0 0 0px rgba(0,0,0,0)"
  );
  return (
    <motion.div className="wl-doccard" style={{ opacity, boxShadow }}>
      <span className="wl-mono">{label}</span>
    </motion.div>
  );
}

function Question({ q }) {
  if (!q) return null;
  return <div className="wl-q">{q}</div>;
}

// Fully grown network for the reduced-motion / no-WebGL story.
function RootsStill({ className, style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 100 160"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="#5DA1A1" strokeWidth="0.7" strokeLinecap="round">
        <path d="M50 0 C48 18 52 34 50 52 C48 70 51 92 50 112 C49 128 50 140 50 150" />
        <path d="M50 52 C42 58 34 64 24 70" />
        <path d="M50 52 C46 58 43 64 41 70" />
        <path d="M50 52 C54 58 57 64 59 70" />
        <path d="M50 52 C58 58 66 64 76 70" />
        <path d="M49 26 L38 34" />
        <path d="M51 40 L61 47" />
        <path d="M49 84 L38 92" />
        <path d="M51 98 L62 105" />
        <path d="M0 118 C25 116 75 120 100 118" />
        <path d="M0 126 C25 128 75 124 100 126" />
        <circle cx="50" cy="150" r="2.2" fill="#C9A227" stroke="none" />
      </g>
    </svg>
  );
}

export default function Panels({ sv, maxSv, switchMV, staticMode }) {
  const p8Ref = useRef(null);
  const fired = useRef(false);

  // THE SWITCH-ON: panel entry via IntersectionObserver — never scroll velocity.
  // Fires identically on a lazy half-scroll, a scrollbar drag, or a jump.
  useEffect(() => {
    if (staticMode || !p8Ref.current) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !fired.current) {
            fired.current = true;
            animate(switchMV, 1, { duration: 2.8, ease: "easeInOut" });
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 }
    );
    io.observe(p8Ref.current);
    return () => io.disconnect();
  }, [staticMode, switchMV]);

  // Panel 5: underline scrubs with the live scroll; note lights when the thread arrives.
  const traceP = useTransform(sv, [5.35, 5.75], [0, 1]);
  const traceBg = useTransform(traceP, (v) => `${Math.round(v * 100)}% 2px`);
  const noteOpacity = useTransform(maxSv, [5.85, 6.15], [0.3, 1]);
  // Panel 6: the floodlit beat.
  const floodOpacity = useTransform(sv, [6.35, 6.7, 7.15, 7.6], [0.25, 1, 1, 0.55]);

  const still = (o) =>
    staticMode ? <RootsStill className="wl-roots-still" style={{ opacity: o }} /> : null;

  return (
    <>
      {/* 1 — HERO, above ground */}
      <section className="wl-hero" style={{ minHeight: `${VH[0]}vh` }}>
        {/* sprout centered over the cable: sprout sits 33px into a 34px-tall logo */}
        <div className="wl-mast" style={{ transform: "translateX(-33px)" }}>
          <Logo height={34} />
        </div>
        <div className="wl-cable" aria-hidden="true" />
        <span className="wl-badge">{PANELS[0].badge}</span>
        <h1 className="wl-h">{PANELS[0].text}</h1>
        <Question q={PANELS[0].tooltip} />
      </section>

      {/* 2 — forms in the soil wall */}
      <section className="wl-panel" style={{ minHeight: `${VH[1]}vh` }}>
        {still(0.16)}
        <div className="wl-stage">
          {SHEET_POS.map((_, i) => (
            <Sheet key={i} maxSv={maxSv} i={i} />
          ))}
          <h2 className="wl-h" style={{ position: "relative", zIndex: 2 }}>
            {PANELS[1].text}
          </h2>
        </div>
        <Question q={PANELS[1].tooltip} />
      </section>

      {/* 3 — the beam goes still */}
      <section className="wl-panel" style={{ minHeight: `${VH[2]}vh` }}>
        {still(0.12)}
        <h2 className="wl-h">{PANELS[2].text}</h2>
        <Question q={PANELS[2].tooltip} />
      </section>

      {/* 4 — the branch to four destinations */}
      <section className="wl-panel" style={{ minHeight: `${VH[3]}vh` }}>
        {still(0.2)}
        <h2 className="wl-h">{PANELS[3].text}</h2>
        <div className="wl-docs">
          {DEMO_DOCS.map((label, i) => (
            <DocCard key={label} maxSv={maxSv} i={i} label={label} />
          ))}
        </div>
        <Question q={PANELS[3].tooltip} />
      </section>

      {/* 5 — the trace */}
      <section
        className="wl-panel"
        style={{ minHeight: `${VH[4]}vh`, justifyContent: "flex-start", paddingTop: "12vh" }}
      >
        {still(0.16)}
        <h2 className="wl-h">{PANELS[4].text}</h2>
        <motion.div className="wl-note" style={{ opacity: noteOpacity, marginTop: "9vh" }}>
          <span className="wl-mono">{TRACE_EXAMPLE.provenance}</span>
          <p className="wl-body">{TRACE_EXAMPLE.sourceNote}</p>
        </motion.div>
        <div style={{ height: "36vh" }} aria-hidden="true" />
        <div className="wl-filing">
          <span className="wl-mono">Court filing</span>
          <p className="wl-body">
            <motion.span className="wl-filing-line" style={{ backgroundSize: traceBg }}>
              {TRACE_EXAMPLE.filingLine}
            </motion.span>
          </p>
        </div>
        <Question q={PANELS[4].tooltip} />
      </section>

      {/* 6 — floodlight beat, laterals off-screen */}
      <section className="wl-panel" style={{ minHeight: `${VH[5]}vh` }}>
        {still(0.2)}
        <h2 className="wl-h">{PANELS[5].text}</h2>
        <div className="wl-lats">
          <motion.span className="wl-lat wl-lat-left wl-mono" style={{ opacity: floodOpacity }}>
            group homes
          </motion.span>
          <motion.span className="wl-lat wl-lat-right wl-mono" style={{ opacity: floodOpacity }}>
            elder care
          </motion.span>
        </div>
        <motion.div className="wl-biz wl-mono" style={{ opacity: floodOpacity }}>
          {BUSINESS_LINE}
        </motion.div>
        <Question q={PANELS[5].tooltip} />
      </section>

      {/* 7 — the lamp at its lowest steady setting */}
      <section className="wl-panel wl-p7" style={{ minHeight: `${VH[6]}vh` }}>
        {still(0.08)}
        <blockquote className="wl-bq">
          <p className="wl-quote">{PANELS[6].text}</p>
          <footer className="wl-attr wl-mono">&mdash; {PANELS[6].attribution}</footer>
        </blockquote>
      </section>

      {/* 8 — THE SWITCH-ON */}
      <section ref={p8Ref} className="wl-panel wl-p8" style={{ minHeight: `${VH[7]}vh` }}>
        {still(0.85)}
        <motion.div className="wl-cta-glow" style={{ opacity: switchMV }} aria-hidden="true" />
        <div className="wl-logo-end">
          <Logo height={40} />
        </div>
        <div className="wl-ctas">
          <a className="wl-btn wl-btn-primary" href="#">
            {PANELS[7].text}
          </a>
          <a className="wl-btn wl-btn-ghost" href="#">
            {PANELS[7].secondary}
          </a>
        </div>
      </section>
    </>
  );
}
