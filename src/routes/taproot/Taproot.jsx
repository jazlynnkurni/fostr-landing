// Taproot.jsx — CONCEPT 1: one continuous WebGL borehole. The camera dollies down a
// single growing taproot as you scroll. All text is DOM, always; the fixed R3F canvas
// (Scene.jsx) renders root, soil and light only and positions the floating overlays
// (tooltip pill, document cards, trace cards) by projecting 3D anchors each frame.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import Lenis from "lenis";
import Snap from "lenis/snap";
import Logo from "../../components/Logo.jsx";
import { PANELS, BUSINESS_LINE, DEMO_DOCS, TRACE_EXAMPLE, CAL_URL, CONTACT_EMAIL, FAQS } from "../../copy.js";
import { SECTION_VHS, PB } from "./journey.js";
import StaticTaproot from "./StaticTaproot.jsx";

const Scene = lazy(() => import("./Scene.jsx"));

const mono = { fontFamily: "var(--font-inter)", fontWeight: 600 };

const overlayCard = {
  position: "absolute",
  left: 0,
  top: 0,
  visibility: "hidden",
  opacity: 0,
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(30,38,36,0.12)",
  borderLeft: "3px solid var(--teal)", // turquoise accent bar on every card
  borderRadius: 10,
  padding: "12px 14px",
  color: "var(--ink)",
  backdropFilter: "blur(5px)",
  boxShadow: "0 8px 28px rgba(23,58,57,0.16)",
  willChange: "transform, opacity",
};

function Bars({ n = 3 }) {
  const widths = ["92%", "74%", "58%"];
  return (
    <div aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ height: 6, width: widths[i % 3], background: "rgba(30,38,36,0.14)", borderRadius: 3, marginBottom: 6 }} />
      ))}
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = (e) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

// One scroll panel: a section of SECTION_VHS[i] vh with a sticky full-viewport inner
// frame. Headline opacity/y scrub off the single page progress value (no re-renders).
function Panel({ i, progress, place = "center", color = "var(--ink)", backdrop, after, children }) {
  const a = PB[i];
  const bEnd = PB[i + 1];
  const keys = i === 0 ? [0, 0.001, bEnd - 0.02, bEnd - 0.002] : [a + 0.004, a + 0.03, bEnd - 0.02, bEnd - 0.002];
  const vals = i === 0 ? [1, 1, 1, 0] : i === 7 ? [0, 1, 1, 1] : [0, 1, 1, 0];
  const opacity = useTransform(progress, keys, vals);
  const y = useTransform(progress, [a, a + 0.035], i === 0 ? [0, 0] : [26, 0]);
  return (
    <section style={{ position: "relative", height: `${SECTION_VHS[i]}vh`, zIndex: 2 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: place === "top" ? "flex-start" : "center",
          alignItems: "center",
          padding: place === "top" ? "13vh 6vw 0" : "0 6vw",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {backdrop && <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{backdrop}</div>}
        <motion.div style={{ opacity, y, color, width: "100%", maxWidth: 880, position: "relative" }}>{children}</motion.div>
      </div>
      {after}
    </section>
  );
}

const H = ({ children, size = "clamp(2rem, 5.2vw, 3.9rem)", style }) => (
  <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: size, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 auto", ...style }}>{children}</h2>
);

// Hero headline, kinetic. "Most of a caseworker's day" settles first; a beat later
// "never reaches a kid." sinks in heavy from above — landing a hair low and a touch
// under full weight, so the line arrives *not quite whole*, echoing the words. Plays
// once on load; the reduced-motion path (StaticTaproot) renders it plainly instead.
// A straight 2px turquoise line strung across the negative space between "reaches"
// and "a kid". It spans the live gap each frame, so as the rubber-band words pull
// apart the line grows, and as they close it shrinks and is engulfed when they meet.
function StringLink({ leftRef, rightRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    const teal = getComputedStyle(document.documentElement).getPropertyValue("--teal").trim() || "#5DA1A1";

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    resize();
    window.addEventListener("resize", resize);

    function loop() {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const L = leftRef.current?.getBoundingClientRect();
      const R = rightRef.current?.getBoundingClientRect();
      if (!L || !R) return;
      const ax = L.right, ay = L.top + L.height * 0.55, bx = R.left, by = R.top + R.height * 0.55;
      const gap = Math.hypot(bx - ax, by - ay);
      // Only draw once the words are spread past their resting gap; fades in with the
      // spread and is engulfed as they rubber-band back together.
      const a = Math.min(1, Math.max(0, (gap - 28) / 34));
      if (a <= 0.01) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = teal;
      ctx.globalAlpha = a;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [leftRef, rightRef]);

  // Portal to <body>: a position:fixed canvas inside the hero's transformed wrapper
  // would be offset by that transform. At the top level, fixed == viewport, so the
  // canvas's viewport-space anchor coords line up exactly with the words.
  return createPortal(
    <canvas ref={canvasRef} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 4, pointerEvents: "none" }} />,
    document.body
  );
}

// The "Reach" (rubber-band) — now HOVER-driven: hovering the line spreads "never
// reaches" and "a kid" apart until "never" sits under "Most" and "kid" under "day"
// (measured from line-1's rendered width), with a turquoise line drawn taut across
// the gap. On leave they spring back and rubber-band into place. Both words stay
// undistorted; only the space between them moves.
function ElasticReach({ left, right, p1Ref, active }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  // pull.l / pull.r = spread distance; pull.touch = how far each moves inward on recoil
  // so they just BUMP (a ~2px gap) instead of overlapping.
  const [pull, setPull] = useState({ l: -150, r: 150, touch: 4 });
  useEffect(() => {
    const measure = () => {
      const P = p1Ref.current?.getBoundingClientRect();
      const L = leftRef.current?.getBoundingClientRect();
      const R = rightRef.current?.getBoundingClientRect();
      if (!P || !L || !R || P.width < 4) return;
      const restGap = R.left - L.right;
      setPull({ l: P.left - L.left, r: P.right - R.right, touch: Math.max(0, (restGap - 2) / 2) });
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    const id = setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(id); window.removeEventListener("resize", measure); };
  }, [p1Ref]);

  // Only bounce once the user has actually hovered — otherwise the recoil keyframes
  // fire on mount and the line jitters on load.
  const touched = useRef(false);
  if (active) touched.current = true;

  // enter: smooth spring spread. leave: a small damped double-bounce that snaps the
  // words to just-touching then settles (bounded so they never overlap).
  const t = Math.max(3, pull.touch);
  const enter = { type: "spring", stiffness: 140, damping: 18, mass: 0.9 };
  const recoil = { duration: 0.62, times: [0, 0.42, 0.68, 0.86, 1], ease: "easeOut" };
  const trans = active ? enter : recoil;
  const leftX = active ? pull.l : touched.current ? [null, t, -t * 0.5, t * 0.2, 0] : 0;
  const rightX = active ? pull.r : touched.current ? [null, -t, t * 0.5, -t * 0.2, 0] : 0;
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <motion.span ref={leftRef} style={{ display: "inline-block" }} initial={{ x: 0 }} animate={{ x: leftX }} transition={trans}>
        {left}
      </motion.span>
      {" "}
      <motion.span ref={rightRef} style={{ display: "inline-block" }} initial={{ x: 0 }} animate={{ x: rightX }} transition={trans}>
        {right}
      </motion.span>
      <StringLink leftRef={leftRef} rightRef={rightRef} />
    </span>
  );
}

function HeroLine({ text }) {
  const i = text.indexOf("never reaches");
  const p1 = i > 0 ? text.slice(0, i).trim() : text;
  const p2 = i > 0 ? text.slice(i) : "";
  const cut = p2.indexOf("reaches") + "reaches".length;
  const leftChunk = cut > 0 ? p2.slice(0, cut) : p2;
  const rightChunk = cut > 0 ? p2.slice(cut).trimStart() : "";
  const p1Ref = useRef(null);
  const [active, setActive] = useState(false);
  const base = {
    fontFamily: "var(--font-sans)",
    fontWeight: 500, // both lines medium
    fontSize: "clamp(2.1rem, 5.4vw, 4.1rem)",
    lineHeight: 1.12,
    letterSpacing: "-0.02em",
  };
  return (
    <h2 style={{ ...base, maxWidth: 880, margin: "0 auto" }}>
      <div style={{ textAlign: "center" }}>
        <motion.span
          ref={p1Ref}
          style={{ display: "inline-block" }}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          {p1}
        </motion.span>
      </div>
      {p2 && (
        <motion.div
          style={{ textAlign: "center", cursor: "default" }}
          onPointerEnter={() => setActive(true)}
          onPointerLeave={() => setActive(false)}
          initial={{ opacity: 0, y: -44 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.34, 1], delay: 0.6 }}
        >
          <ElasticReach left={leftChunk} right={rightChunk} p1Ref={p1Ref} active={active} />
        </motion.div>
      )}
    </h2>
  );
}

// Inline icons beside their phrase in the copy — solid WHITE so they read prominently
// on the turquoise ground: a smiley for child welfare, a house for group homes, an
// elder for elder care.
const INK = "#1E2624";
const PHRASE_ICONS = {
  "child welfare": (
    <>
      <circle cx="12" cy="12" r="9" fill="#fff" />
      <circle cx="9.2" cy="10.3" r="1.05" fill={INK} />
      <circle cx="14.8" cy="10.3" r="1.05" fill={INK} />
      <path d="M8.2 13.9 Q12 17.3 15.8 13.9" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  "group homes": (
    <>
      <path d="M12 3.4 L21.4 11 L21.4 20.8 L2.6 20.8 L2.6 11 Z" fill="#fff" />
      <rect x="9.7" y="14.4" width="4.6" height="6.4" fill={INK} />
    </>
  ),
  "elder care": (
    <>
      <circle cx="10" cy="4.8" r="2.5" fill="#fff" />
      <path d="M10 7.4 V13 M10 13 l-1.8 7.2 M10 13 l1.4 7.2" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 9.4 l3.7 1.9" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M13.7 11 V20.8" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
    </>
  ),
};

function PhraseIcon({ paths }) {
  return (
    <svg viewBox="0 0 24 24" width="1.02em" height="1.02em" aria-hidden style={{ display: "inline-block", verticalAlign: "-0.13em", margin: "0 0.04em 0 0.3em", filter: "drop-shadow(0 1px 2px rgba(23,58,57,0.18))" }}>
      {paths}
    </svg>
  );
}

// Verbatim copy with an inline white icon dropped in right after each keyed phrase.
// The comma that would trail the icon is dropped so it doesn't float after the glyph.
function CopyWithIcons({ text }) {
  const parts = text.split(/(child welfare|group homes|elder care)/i);
  return parts.map((part, i) => {
    const icon = PHRASE_ICONS[part.toLowerCase()];
    if (icon) {
      return (
        <span key={i} style={{ whiteSpace: "nowrap" }}>
          {part}
          <PhraseIcon paths={icon} />
        </span>
      );
    }
    const prev = parts[i - 1];
    const txt = prev && PHRASE_ICONS[prev.toLowerCase()] ? part.replace(/^\s*,\s*/, " ") : part;
    return <span key={i}>{txt}</span>;
  });
}

// Form sheets fossilized in the soil wall (panel 2): the same fields on every one.
const FOSSILS = [
  { left: "6%", top: "14%", rot: -7, w: 200, speed: 60 },
  { left: "68%", top: "9%", rot: 5, w: 225, speed: 100 },
  { left: "12%", top: "60%", rot: 4, w: 180, speed: 140 },
  { left: "63%", top: "58%", rot: -4, w: 210, speed: 80 },
  { left: "38%", top: "72%", rot: 9, w: 160, speed: 120 },
  { left: "84%", top: "36%", rot: -8, w: 170, speed: 40 },
];

function FossilSheet({ f, progress }) {
  const y = useTransform(progress, [PB[1] - 0.02, PB[2] + 0.04], [f.speed, -f.speed]);
  return (
    <motion.div
      style={{
        position: "absolute",
        left: f.left,
        top: f.top,
        width: f.w,
        y,
        rotate: f.rot,
        background: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(30,38,36,0.14)",
        borderRadius: 6,
        padding: "12px 14px",
        color: "rgba(30,38,36,0.55)",
      }}
    >
      {["Name", "DOB", "Placement"].map((field) => (
        <div key={field} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 9 }}>
          <span style={{ ...mono, fontSize: 9, letterSpacing: "0.08em" }}>{field}</span>
          <span style={{ flex: 1, borderBottom: "1px dotted rgba(30,38,36,0.3)" }} />
        </div>
      ))}
    </motion.div>
  );
}

// Reactive pixel grid filling the hero's white space: a quiet turquoise dot grid
// where dots near the cursor brighten, swell and push away — the ascii-root aesthetic,
// made interactive. Fades out above the meadow and as the page scrolls underground.
function ReactiveGrid() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const hex = (getComputedStyle(document.documentElement).getPropertyValue("--teal").trim() || "#5DA1A1").match(/[0-9a-f]{2}/gi) || ["5d", "a1", "a1"];
    const m = hex.map((h) => parseInt(h, 16));
    let W = 0, H = 0, raf = 0, t = 0, last = performance.now(), scrollO = 1;
    const mouse = { x: -1e4, y: -1e4, has: false };
    const move = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; };
    const leave = () => { mouse.has = false; };
    const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px"; };
    const onScroll = () => { const f = window.scrollY / Math.max(1, window.innerHeight); scrollO = 1 - Math.min(1, Math.max(0, (f - 0.12) / 0.5)); };
    resize(); onScroll();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });

    function loop(now) {
      raf = requestAnimationFrame(loop);
      t += (now - last) / 1000; last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (scrollO <= 0.01) return;
      const step = 30, R = 195;
      for (let y = step; y < H; y += step) {
        const vy = 1 - Math.max(0, (y - H * 0.6) / (H * 0.28)); // fade out before the meadow
        if (vy <= 0) continue;
        for (let x = step; x < W; x += step) {
          const d = mouse.has ? Math.hypot(x - mouse.x, y - mouse.y) : 9e9;
          const k = Math.max(0, 1 - d / R);
          const wob = Math.sin(t * 1.1 + x * 0.02 + y * 0.02) * 0.5 + 0.5;
          const r = 1.5 + k * 4.0;
          const al = (0.13 + k * 0.62 + wob * 0.035) * vy * scrollO;
          const dx = k ? ((x - mouse.x) / d) * k * 6 : 0;
          const dy = k ? ((y - mouse.y) / d) * k * 6 : 0;
          ctx.fillStyle = `rgba(${m[0]},${m[1]},${m[2]},${al})`;
          ctx.fillRect(x + dx - r / 2, y + dy - r / 2, r, r);
        }
      }
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }} />;
}

// Dev-only live colour tuner (open /taproot?tune). Edits the R3F materials' uColor
// uniforms in place so you can dial the soil/root/meadow colours and read the hex.
function ColorTuner({ bridge }) {
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force((x) => x + 1), 400); return () => clearInterval(id); }, []);
  if (typeof window === "undefined" || !/(\?|&)tune/.test(window.location.search)) return null;
  const fields = [["seep", "Ground/soil"], ["root", "Main root"], ["branch", "Branches"], ["lateral", "Laterals"], ["shoot", "Shoot"], ["plant", "Meadow"]];
  const mats = bridge.current.mats;
  const get = (k) => (mats?.[k] ? "#" + mats[k].uniforms.uColor.value.getHexString() : "#2e6e6d");
  const set = (k, v) => { if (mats?.[k]) { mats[k].uniforms.uColor.value.set(v); force((x) => x + 1); } };
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 30, background: "rgba(255,255,255,.96)", border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, padding: "14px 16px", fontFamily: "var(--font-inter), sans-serif", fontSize: 12, color: "#1E2624", boxShadow: "0 10px 40px rgba(0,0,0,.16)", display: "grid", gap: 9, minWidth: 210 }}>
      <div style={{ fontWeight: 700, letterSpacing: ".02em" }}>Colour tuner</div>
      {!mats && <div style={{ color: "#999" }}>loading scene…</div>}
      {fields.map(([k, label]) => (
        <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
          <span>{label}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code style={{ fontSize: 11, color: "#666" }}>{get(k)}</code>
            <input type="color" value={get(k)} onChange={(e) => set(k, e.target.value)} style={{ width: 30, height: 24, border: "none", background: "none", padding: 0, cursor: "pointer" }} />
          </span>
        </label>
      ))}
      <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>edits live · copy the hex you like</div>
    </div>
  );
}

// Site-wide cursor mosaic: a pixelated turquoise trail that lights the grid cells the
// cursor passes and fades them out — the old thermal-pixel cursor, back.
function CursorMosaic({ hideRef }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // multi-colour palette: turquoise family + meadow gold, for depth + fusion
    const PAL = [
      [111, 206, 204, 0.7],  // #6FCECC turquoise
      [93, 161, 161, 0.72],  // #5DA1A1 teal
      [42, 122, 120, 0.62],  // #2A7A78 deep teal
      [169, 218, 216, 0.6],  // light turquoise
      [225, 199, 142, 0.72], // #E1C78E meadow gold
    ];
    const CELL = 15;
    const cells = new Map();
    let mx = -1e4, my = -1e4, has = false, raf = 0, sf = 1;
    const move = (e) => { mx = e.clientX; my = e.clientY; has = true; };
    const resize = () => { canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr; canvas.style.width = window.innerWidth + "px"; canvas.style.height = window.innerHeight + "px"; };
    // only lives in the hero: fade the whole trail out as you scroll past the first screen
    const onScroll = () => { const f = window.scrollY / Math.max(1, window.innerHeight); sf = 1 - Math.min(1, Math.max(0, (f - 0.25) / 0.5)); };
    resize(); onScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    let seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pick = () => { const r = rnd(); return r < 0.22 ? PAL[4] : r < 0.44 ? PAL[1] : r < 0.6 ? PAL[2] : r < 0.8 ? PAL[3] : PAL[0]; };
    function loop() {
      raf = requestAnimationFrame(loop);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (hideRef && hideRef.current) { cells.clear(); return; } // vanish while over the FAQ button
      if (has && sf > 0.01) {
        const gx = Math.floor(mx / CELL), gy = Math.floor(my / CELL);
        for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
          const d = Math.hypot(dx, dy);
          if (d > 2.4) continue;
          const key = (gx + dx) + "," + (gy + dy);
          const c = cells.get(key) || { x: gx + dx, y: gy + dy, v: 0, col: pick() };
          c.v = Math.min(1, c.v + (1 - d / 2.6) * (0.4 + rnd() * 0.6) * 0.6);
          cells.set(key, c);
        }
      }
      cells.forEach((c, key) => {
        c.v *= 0.9;
        if (c.v < 0.03) { cells.delete(key); return; }
        const col = c.col;
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(c.v * col[3] * sf).toFixed(3)})`;
        ctx.fillRect(c.x * CELL, c.y * CELL, CELL - 1, CELL - 1);
      });
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", move); window.removeEventListener("scroll", onScroll); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 8, pointerEvents: "none", mixBlendMode: "multiply" }} />;
}

// Panel-3 backdrop ("Not the worker's fault... no one chose this for love of
// paperwork"): an endless drift of PIXELATED form-cards falling behind the text. Each
// form is drawn as a dot grid (matching the ascii-pixel world); hover over one and it
// dissolves — its pixels scatter and dither away, then a fresh form falls in.
function pf(n) { n = Math.sin(n * 12.9898) * 43758.5453; return n - Math.floor(n); }
function Paperfall() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, sheets = [];
    const mouse = { x: -1e4, y: -1e4 };
    let s = 12345;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const spawn = (fromBottom) => {
      const w = 44 + rnd() * 42;
      return { x: rnd() * W, y: fromBottom ? H + w : rnd() * H, w, h: w * (0.68 + rnd() * 0.12), vy: 12 + rnd() * 26, rot: (rnd() - 0.5) * 0.44, vr: (rnd() - 0.5) * 0.18, a: 0.5 + rnd() * 0.35, seed: rnd() * 900, diss: 0 };
    };
    function build() { sheets = []; const n = Math.round((W * H) / 34000); for (let i = 0; i < n; i++) sheets.push(spawn(false)); }
    function resize() { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; build(); }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const move = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    window.addEventListener("pointermove", move, { passive: true });
    let last = performance.now();
    const C = 4.5; // pixel cell size
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (let si = 0; si < sheets.length; si++) {
        const p = sheets[si];
        p.y -= p.vy * dt; // paperwork rises upward
        p.rot += p.vr * dt;
        // hover -> dissolve; move away -> re-form
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        p.diss += (d < p.w * 0.85 ? 2.6 : -1.6) * dt;
        if (p.diss < 0) p.diss = 0;
        if (p.diss >= 1 || p.y + p.h < 0) { sheets[si] = spawn(true); continue; }

        const cols = Math.max(7, Math.round(p.w / C)), rows = Math.max(6, Math.round(p.h / C));
        const cw = p.w / cols, ch = p.h / rows;
        const lines = [Math.round(rows * 0.32), Math.round(rows * 0.52), Math.round(rows * 0.72)];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const scatter = p.diss * 9;
        for (let cy = 0; cy < rows; cy++) {
          for (let cx = 0; cx < cols; cx++) {
            const border = cx === 0 || cx === cols - 1 || cy === 0 || cy === rows - 1;
            const li = lines.indexOf(cy);
            const line = li >= 0 && cx > 0 && cx < cols - 1 - (li === 2 ? Math.round(cols * 0.3) : 0);
            const fill = !border && !line && pf(cx * 3.1 + cy * 7.3 + p.seed) < 0.05;
            if (!border && !line && !fill) continue;
            const key = pf(cx * 13.1 + cy * 6.7 + p.seed * 1.7);
            if (key < p.diss) continue; // this pixel has dissolved
            const w = border ? 1 : line ? 0.8 : 0.45;
            const jx = (pf(cx + cy * 2 + p.seed) - 0.5) * scatter;
            const jy = (pf(cx * 2 + cy + p.seed) - 0.5) * scatter;
            ctx.globalAlpha = p.a * w * (1 - p.diss * 0.4);
            ctx.fillStyle = "#3D8584";
            ctx.fillRect(-p.w / 2 + cx * cw + jx, -p.h / 2 + cy * ch + jy, cw * 0.82, ch * 0.82);
          }
        }
        ctx.restore();
      }
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", move); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

// Founder image that assembles pixel by pixel as you scroll to the end: each grid
// cell of the photo appears once the scroll reveal passes its per-cell threshold, so
// the picture materialises from scattered pixels into the whole thing.
function PixelImage({ src, progress, range, label, badge }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  // Track whether the photo is actually on screen (mid pixel-reveal) so the cursor-warp
  // badge is only offered while there's a picture to hover — from appear to disappear.
  const [visible, setVisible] = useState(false);
  const visRef = useRef(false);
  const warp = useCursorWarp(badge || "", !!badge && visible);
  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const img = new Image();
    let loaded = false, iw = 1, ih = 1, W = 0, H = 0, raf = 0, lastR = -2;
    function resize() {
      const r = wrap.getBoundingClientRect();
      W = r.width; H = loaded ? W * (ih / iw) : W * 0.528;
      wrap.style.height = H + "px";
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      lastR = -2;
    }
    img.onload = () => { loaded = true; iw = img.width; ih = img.height; resize(); };
    img.src = src;
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);
    function draw(reveal) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!loaded) return;
      if (reveal >= 0.999) { ctx.drawImage(img, 0, 0, W, H); return; }
      const cell = Math.max(8, W / 100);
      const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
      const sxc = iw / cols, syc = ih / rows;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          if (pf(cx * 12.3 + cy * 7.13 + 0.5) > reveal) continue;
          ctx.drawImage(img, cx * sxc, cy * syc, sxc, syc, cx * cell, cy * cell, cell + 0.7, cell + 0.7);
        }
      }
    }
    function loop() {
      raf = requestAnimationFrame(loop);
      const p = progress.get();
      // assemble on the way in (range[0..1]), disassemble back into pixels on the way
      // out (range[2..3]) so it lands AND leaves through the same pixel effect.
      const enter = (p - range[0]) / (range[1] - range[0]);
      const exit = (p - range[2]) / (range[3] - range[2]);
      const reveal = Math.min(1, Math.max(0, Math.min(enter, 1 - exit)));
      // available for the cursor-warp exactly across the visible window (appear→disappear)
      const vis = reveal > 0.1;
      if (vis !== visRef.current) { visRef.current = vis; setVisible(vis); }
      const crossFull = (reveal >= 0.999) !== (lastR >= 0.999);
      if (Math.abs(reveal - lastR) < 0.004 && !crossFull) return;
      lastR = reveal;
      draw(reveal);
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [src, progress, range]);
  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={label}
      {...(badge ? warp.bind : {})}
      style={{ position: "relative", width: "100%", cursor: warp.active ? "none" : "auto" }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", borderRadius: 16, boxShadow: "0 20px 64px rgba(23,58,57,0.20)" }} />
      {warp.overlay}
    </div>
  );
}

// Frosted-glass CTA: transparent (blurred) with a hairline border; fills turquoise
// with white text on hover.
// Cursor-warp badge: while hovering an enabled target, the native cursor is hidden and
// the credential pill warps in and rides the pointer (spring-trailed = the "warp").
// `enabled` gates it — e.g. only while Jaden's photo is actually on screen. Returns
// pointer handlers to spread, whether it's active, and the portal overlay to render.
function useCursorWarp(label, enabled = true) {
  const [h, setH] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 380, damping: 26, mass: 0.55 });
  const sy = useSpring(my, { stiffness: 380, damping: 26, mass: 0.55 });
  const seeded = useRef(false);
  const bind = {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => { setH(false); seeded.current = false; },
    onFocus: () => setH(true),
    onBlur: () => { setH(false); seeded.current = false; },
    onMouseMove: (e) => {
      if (!seeded.current) { sx.jump(e.clientX); sy.jump(e.clientY); seeded.current = true; }
      mx.set(e.clientX);
      my.set(e.clientY);
    },
  };
  const active = enabled && h;
  const overlay = active
    ? createPortal(
        <motion.div aria-hidden style={{ position: "fixed", top: 0, left: 0, x: sx, y: sy, zIndex: 60, pointerEvents: "none" }}>
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 22 }}
            style={{
              // offset from the cursor is live-tunable via CSS vars (see PillTuner, ?pilltune)
              transform: "translate(calc(-50% + var(--pill-dx, 0px)), calc(-50% + var(--pill-dy, 0px)))",
              background: "var(--ink)", color: "#FFFFFF", fontFamily: "var(--font-inter)",
              fontWeight: 700, fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase",
              padding: "6px 13px", borderRadius: 999, whiteSpace: "nowrap",
              boxShadow: "0 6px 20px rgba(30,38,36,0.32)",
            }}
          >
            {label}
          </motion.div>
        </motion.div>,
        document.body
      )
    : null;
  return { bind, active, overlay };
}

function GlassButton({ href, external, children, badge }) {
  const [h, setH] = useState(false);
  const warp = useCursorWarp(badge, !!badge);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onMouseEnter={(e) => { setH(true); warp.bind.onMouseEnter(e); }}
      onMouseLeave={(e) => { setH(false); warp.bind.onMouseLeave(e); }}
      onMouseMove={badge ? warp.bind.onMouseMove : undefined}
      onFocus={(e) => { setH(true); warp.bind.onFocus(e); }}
      onBlur={(e) => { setH(false); warp.bind.onBlur(e); }}
      style={{
        position: "relative", display: "inline-block", textDecoration: "none", fontSize: 15, fontWeight: 600,
        padding: "14px 26px", borderRadius: 999,
        background: h ? "var(--teal)" : "rgba(255,255,255,0.14)",
        border: `1px solid ${h ? "var(--teal)" : "rgba(30,38,36,0.28)"}`,
        color: h ? "#ffffff" : "var(--ink)",
        cursor: warp.active ? "none" : "pointer",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        transition: "background .18s ease, color .18s ease, border-color .18s ease",
      }}
    >
      {children}
      {warp.overlay}
    </a>
  );
}

// Recap accordion row — the FAQ, inline at the bottom so the premise is re-gatherable
// without re-scrolling the whole descent.
function RecapItem({ q, a, open, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(30,38,36,0.12)" }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18,
          padding: "18px 2px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
          color: "var(--ink)", fontFamily: "var(--font-sans)", fontWeight: 500,
          fontSize: "clamp(1rem, 2vw, 1.2rem)", letterSpacing: "-0.01em",
        }}
      >
        <span>{q}</span>
        <span aria-hidden style={{ flex: "0 0 auto", width: 24, height: 24, position: "relative", color: "var(--teal)" }}>
          <span style={{ position: "absolute", top: "50%", left: "50%", width: 14, height: 2, background: "currentColor", transform: "translate(-50%,-50%)" }} />
          <span style={{ position: "absolute", top: "50%", left: "50%", width: 2, height: 14, background: "currentColor", transform: `translate(-50%,-50%) rotate(${open ? 90 : 0}deg)`, transition: "transform .25s ease" }} />
        </span>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .3s ease" }}>
        <div style={{ overflow: "hidden" }}>
          <p style={{ margin: 0, padding: "0 2px 20px", maxWidth: "60ch", fontSize: "clamp(0.96rem, 1.5vw, 1.05rem)", lineHeight: 1.65, color: "rgba(30,38,36,0.76)" }}>{a}</p>
        </div>
      </div>
    </div>
  );
}

// The closing recap: the descent breaks the surface at the sprout, and everything you
// need sits in that daylight — premise, FAQ, book. Grown into the same dotted-earth
// world so it reads as the end of the journey, not a separate page. (Jaden + Abraham.)
function Recap() {
  const [open, setOpen] = useState(-1);
  const points = [
    { k: "The problem", v: "Most of a caseworker's day never reaches a kid. It goes into forms, the same facts typed over and over." },
    { k: "What Fostr does", v: "Capture it once, during the visit, and send it everywhere it's owed. Every line traces back to the record, so it holds up in court." },
    { k: "Who it's for", v: "Child welfare first, alongside the people already doing the work. Group homes and elder care come next." },
  ];
  const grow = { hidden: { pathLength: 0 }, show: { pathLength: 1 } };
  return (
    <section style={{ position: "relative", zIndex: 2, overflow: "hidden", color: "var(--ink)",
      // Transparent at the very top so the teal scene above bleeds straight through and
      // dissolves to white over a soft fixed fade — no hard turquoise/white seam.
      background: "linear-gradient(180deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 34px, rgba(255,255,255,0.85) 210px, #FFFFFF 320px)" }}>
      {/* dotted earth rising at the foot — the pixel-ground motif from the descent */}
      <div aria-hidden style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: "40%", pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(42,122,120,0.5) 1.25px, transparent 1.5px)",
        backgroundSize: "13px 13px",
        WebkitMaskImage: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.45) 40%, transparent 100%)",
        maskImage: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.45) 40%, transparent 100%)",
      }} />

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "clamp(260px, 38vh, 380px) clamp(20px, 6vw, 56px) clamp(84px, 16vh, 154px)" }}>
        {/* the two-leaf sprout, re-grown as the crown of the close */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <motion.svg viewBox="112 122 32 20" width="58" aria-hidden style={{ overflow: "visible", display: "inline-block" }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }}>
            <motion.path d="M128.571 140V131.952C127.175 129.999 121.029 125.903 116 127.619" stroke="var(--teal)" strokeWidth="4.19" strokeLinecap="round" fill="none" variants={grow} transition={{ duration: 0.7, ease: "easeOut" }} />
            <motion.path d="M128.571 131.952C130.899 129.222 137.79 125.698 141.143 127.485" stroke="var(--teal)" strokeWidth="4.19" strokeLinecap="round" fill="none" variants={grow} transition={{ duration: 0.7, ease: "easeOut", delay: 0.14 }} />
          </motion.svg>
        </div>

        <div style={{ textAlign: "center", ...mono, fontSize: 12, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 14 }}>
          The whole thing, in one place
        </div>
        <h2 style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(1.9rem, 5vw, 3.2rem)", lineHeight: 1.12, letterSpacing: "-0.02em", margin: "0 auto 42px", maxWidth: "17ch", textWrap: "balance" }}>
          Paperwork should never come before a kid.
        </h2>

        {/* premise, restated as three plain beats */}
        <div style={{ display: "grid", gap: 2, marginBottom: 50, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
          {points.map((p) => (
            <div key={p.k} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 0.28fr) 1fr", gap: "clamp(12px, 3vw, 34px)", alignItems: "baseline", padding: "16px 0", borderTop: "1px solid rgba(30,38,36,0.1)" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", color: "var(--teal)" }}>{p.k}</div>
              <div style={{ fontSize: "clamp(1rem, 1.7vw, 1.15rem)", lineHeight: 1.6, color: "rgba(30,38,36,0.86)" }}>{p.v}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ ...mono, fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(30,38,36,0.5)", margin: "0 0 6px" }}>
            Questions, answered
          </div>
          <div style={{ marginBottom: 46 }}>
            {FAQS.map((f, i) => (
              <RecapItem key={f.q} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            ))}
          </div>

          {/* book — resting on the dotted earth */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <GlassButton href={CAL_URL} external badge="founder & ceo">{PANELS[7].text}</GlassButton>
            <GlassButton href={`mailto:${CONTACT_EMAIL}`} badge="founder & ceo">{PANELS[7].secondary}</GlassButton>
          </div>
        </div>
      </div>
    </section>
  );
}

// FAQ: plain text that becomes a frosted-glass capsule on hover. While hovered it
// also tells the cursor mosaic to vanish (via hoverRef).
function FaqButton({ hoverRef }) {
  const [on, setOn] = useState(false);
  const set = (v) => { setOn(v); if (hoverRef) hoverRef.current = v; };
  return (
    <a
      href="/faq"
      onMouseEnter={() => set(true)}
      onMouseLeave={() => set(false)}
      onFocus={() => set(true)}
      onBlur={() => set(false)}
      style={{
        display: "inline-block", textDecoration: "none", fontSize: 15, fontWeight: 600,
        letterSpacing: "0.02em", padding: "9px 20px", borderRadius: 999,
        background: on ? "rgba(255,255,255,0.16)" : "transparent",
        border: `1px solid ${on ? "rgba(30,38,36,0.22)" : "transparent"}`,
        backdropFilter: on ? "blur(8px)" : "none", WebkitBackdropFilter: on ? "blur(8px)" : "none",
        color: "var(--ink)", transition: "background .18s ease, border-color .18s ease",
      }}
    >
      FAQ
    </a>
  );
}

// Live tuner for the cursor-warp pill's offset from the cursor. Visit ?pilltune to show
// it. Drives --pill-dx / --pill-dy so the change is instant on the real buttons + photo,
// with a mini preview (cursor dot + pill) so you can dial the exact distance precisely.
function PillTuner() {
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  useEffect(() => {
    document.documentElement.style.setProperty("--pill-dx", dx + "px");
    document.documentElement.style.setProperty("--pill-dy", dy + "px");
  }, [dx, dy]);
  if (typeof window === "undefined" || !/(\?|&)pilltune/.test(window.location.search)) return null;
  const row = { display: "grid", gridTemplateColumns: "18px 1fr 56px", gap: 10, alignItems: "center" };
  const num = { width: 56, fontFamily: "var(--font-inter)", fontSize: 12, padding: "4px 6px", border: "1px solid rgba(0,0,0,.15)", borderRadius: 6, textAlign: "right", boxSizing: "border-box" };
  return (
    <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 80, background: "rgba(255,255,255,.97)", border: "1px solid rgba(0,0,0,.12)", borderRadius: 14, padding: 16, width: 264, boxShadow: "0 12px 40px rgba(0,0,0,.18)", fontFamily: "var(--font-inter)", color: "#1E2624" }}>
      <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>Cursor → pill distance</div>

      {/* preview: dot = cursor, pill = where it lands at this offset */}
      <div style={{ position: "relative", height: 96, borderRadius: 10, background: "#EAF2F0", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 8, height: 8, borderRadius: 999, background: "#1E2624", transform: "translate(-50%,-50%)", boxShadow: "0 0 0 3px rgba(30,38,36,.15)" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, background: "var(--ink)", color: "#fff", fontWeight: 700, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(30,38,36,.3)" }}>founder & ceo</div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={row}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>X</span>
          <input type="range" min={-140} max={140} value={dx} onChange={(e) => setDx(+e.target.value)} />
          <input type="number" value={dx} onChange={(e) => setDx(+e.target.value)} style={num} />
        </div>
        <div style={row}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Y</span>
          <input type="range" min={-140} max={140} value={dy} onChange={(e) => setDy(+e.target.value)} />
          <input type="number" value={dy} onChange={(e) => setDy(+e.target.value)} style={num} />
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "rgba(30,38,36,.62)", lineHeight: 1.5 }}>
        Live on the real buttons + Jaden's photo. Landed on <b>x&nbsp;{dx}, y&nbsp;{dy}</b>? Tell me and I'll bake it in as the default.
      </div>
    </div>
  );
}

// Scroll affordances. Many first-time viewers don't realize the descent is
// scroll-driven (they try to click the interactive headline). A subtle bobbing chevron
// cues the first scroll and fades the moment you move; a slim right-edge rail then
// scrubs with progress like a timeline, so you can feel you're moving through a
// sequence rather than stuck. Handoff: arrow at the hero → rail during the descent.
function ScrollCue({ progress }) {
  const opacity = useTransform(progress, [0, 0.015, 0.045], [1, 1, 0]);
  return (
    <motion.div aria-hidden style={{ position: "fixed", left: "50%", bottom: 30, x: "-50%", zIndex: 6, pointerEvents: "none", opacity }}>
      <motion.svg width="17" height="26" viewBox="0 0 17 26" fill="none" animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M8.5 1 V 21" stroke="var(--teal)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M2.5 15 L8.5 21 L14.5 15" stroke="var(--teal)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </motion.div>
  );
}

function ProgressRail({ progress }) {
  const scaleY = useTransform(progress, [0, 1], [0, 1]);
  const opacity = useTransform(progress, [0, 0.015, 0.95, 1], [0, 0.85, 0.85, 0]);
  return (
    <motion.div aria-hidden style={{ position: "fixed", right: 20, top: "26vh", height: "48vh", width: 2, borderRadius: 2, background: "rgba(30,38,36,0.10)", zIndex: 6, pointerEvents: "none", opacity }}>
      <motion.div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: 2, background: "var(--teal)", transformOrigin: "top", scaleY }} />
    </motion.div>
  );
}

// Chapter scrubber — a bottom depth-gauge rail that lets a reader jump straight to any
// beat of the descent instead of scrolling the whole borehole. Clickable stops, a knob
// that tracks live scroll position, and an ink label pill (the same pill as the
// cursor-warp badge) that names the chapter under the cursor. Fades in once you leave
// the hero, handing off from the bobbing scroll chevron.
const CHAPTERS = [
  { label: "The problem", pb: 0 },
  { label: "The fix", pb: 3 },
  { label: "The proof", pb: 4 },
  { label: "Who it's for", pb: 5 },
  { label: "The founder", pb: 6 },
  { label: "Talk to Jaden", recap: true },
];

function ChapterNav({ lenisRef, panelsRef }) {
  const N = CHAPTERS.length;
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(-1);
  const [visible, setVisible] = useState(false);
  const knob = useMotionValue(0); // 0..1 along the rail
  const sknob = useSpring(knob, { stiffness: 260, damping: 34, mass: 0.7 });
  const tops = useRef([]);
  const wasVis = useRef(false);

  const measure = () => {
    const pol = panelsRef.current;
    if (!pol) return;
    const panelH = pol.offsetHeight;
    const panelMax = Math.max(1, panelH - window.innerHeight);
    const docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    tops.current = CHAPTERS.map((c) =>
      c.recap ? Math.min(panelH, docMax) : Math.min(docMax, Math.max(0, PB[c.pb] * panelMax))
    );
  };

  useEffect(() => {
    measure();
    const id = setTimeout(measure, 600);
    const onResize = () => measure();
    const onScroll = () => {
      const t = tops.current;
      if (!t.length) return;
      const y = window.scrollY;
      let frac = 0;
      if (y <= t[0]) frac = 0;
      else if (y >= t[N - 1]) frac = N - 1;
      else {
        for (let i = 0; i < N - 1; i++) {
          if (y >= t[i] && y <= t[i + 1]) {
            const span = t[i + 1] - t[i];
            frac = i + (span > 0 ? (y - t[i]) / span : 0);
            break;
          }
        }
      }
      knob.set(N > 1 ? frac / (N - 1) : 0);
      setActive(Math.round(frac));
      const vis = window.scrollY / Math.max(1, window.innerHeight) > 0.02;
      if (vis !== wasVis.current) { wasVis.current = vis; setVisible(vis); }
    };
    onScroll();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const jump = (i) => {
    measure();
    const top = (tops.current[i] || 0) + (CHAPTERS[i].recap ? 0 : 2);
    if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.15 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  const shown = hover >= 0 ? hover : active;
  const knobLeft = useTransform(sknob, (v) => `${v * 100}%`);
  const fillWidth = useTransform(sknob, (v) => `${v * 100}%`);

  return (
    <nav
      aria-label="Chapters"
      style={{
        position: "fixed", left: "50%", bottom: "clamp(16px, 3vh, 26px)", transform: "translateX(-50%)",
        zIndex: 9, opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
        transition: "opacity .45s ease", fontFamily: "var(--font-inter)",
      }}
    >
      <div
        style={{
          position: "relative", display: "flex", alignItems: "center",
          padding: "13px 26px", borderRadius: 999, overflow: "visible",
          background: "rgba(26,36,34,0.62)", border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 10px 34px rgba(16,32,31,0.32)",
        }}
      >
        {/* the rail */}
        <div style={{ position: "relative", width: "min(300px, 66vw)", height: 14 }}>
          {/* baseline */}
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, transform: "translateY(-50%)", borderRadius: 2, background: "rgba(255,255,255,0.20)" }} />
          {/* progress fill up to the knob */}
          <motion.div style={{ position: "absolute", top: "50%", left: 0, height: 2, transform: "translateY(-50%)", borderRadius: 2, background: "var(--teal)", width: fillWidth }} />

          {/* chapter stops */}
          {CHAPTERS.map((c, i) => {
            const on = i <= active;
            const last = i === N - 1;
            return (
              <button
                key={c.label}
                aria-label={`Jump to: ${c.label}`}
                onClick={() => jump(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(-1)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(-1)}
                style={{
                  position: "absolute", top: "50%", left: `${(i / (N - 1)) * 100}%`,
                  transform: "translate(-50%, -50%)", width: 22, height: 22, padding: 0,
                  border: "none", background: "none", cursor: "pointer", display: "grid", placeItems: "center",
                }}
              >
                <span
                  style={{
                    width: last ? 11 : 7, height: last ? 11 : 7, borderRadius: 999,
                    background: last ? "transparent" : on ? "var(--teal)" : "rgba(255,255,255,0.34)",
                    border: last ? `2px solid ${on ? "var(--teal)" : "rgba(255,255,255,0.4)"}` : "none",
                    transition: "background .2s ease, border-color .2s ease",
                  }}
                />
              </button>
            );
          })}

          {/* live-position knob */}
          <motion.div
            aria-hidden
            style={{
              position: "absolute", top: "50%", left: knobLeft, translateX: "-50%", translateY: "-50%",
              width: 15, height: 15, borderRadius: 999, background: "#FFFFFF",
              border: "2px solid var(--teal)", boxShadow: "0 2px 8px rgba(0,0,0,0.28)",
            }}
          />

          {/* label pill above the chapter under the cursor (or the active one) */}
          <div
            aria-hidden
            style={{
              position: "absolute", bottom: "calc(100% + 14px)", left: `${(shown / (N - 1)) * 100}%`,
              transform: "translateX(-50%)", whiteSpace: "nowrap", pointerEvents: "none",
            }}
          >
            <div style={{
              position: "relative", background: "var(--ink)", color: "#fff", fontWeight: 700, fontSize: 11,
              letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 999,
              boxShadow: "0 6px 18px rgba(16,32,31,0.34)",
            }}>
              {CHAPTERS[shown].label}
              <span style={{ position: "absolute", top: "100%", left: "50%", width: 8, height: 8, marginTop: -4, background: "var(--ink)", transform: "translateX(-50%) rotate(45deg)", borderRadius: 1 }} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ScrollTaproot() {
  const bridge = useRef({
    p: 0,
    maxG: 0,
    activePanel: 0,
    pillTarget: 1,
    els: { pill: null, cards: [null, null, null, null], filing: null, filingLine: null, source: null },
  });
  const lenisRef = useRef(null);
  const panelsRef = useRef(null); // wraps only the 8 choreographed panels
  const faqHover = useRef(false); // true while the FAQ button is hovered (hides the mosaic)
  // Progress is measured over the PANELS only (not the whole document) so the recap
  // section below can be appended without shifting the camera + panel choreography,
  // which is all keyed off PB fractions of this value.
  const { scrollYProgress } = useScroll({ target: panelsRef, offset: ["start start", "end end"] });

  useEffect(() => {
    window.scrollTo(0, 0);
    // A touch more weight (slightly slower wheel) so panels don't blow past on a flick.
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;

    // Proximity snap onto each panel: when the reader eases up near a section it settles
    // onto it instead of drifting through a fade. Gentle — never fights an active scroll.
    const snap = new Snap(lenis, { type: "proximity", duration: 0.9, distanceThreshold: "18%", debounce: 450 });
    const removers = [];
    if (panelsRef.current) {
      for (const el of Array.from(panelsRef.current.children)) {
        removers.push(snap.addElement(el, { align: ["start"], ignoreSticky: true }));
      }
    }

    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      removers.forEach((r) => typeof r === "function" && r());
      snap.destroy();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const onPill = () => {
    const next = Math.min(bridge.current.pillTarget, 7);
    // Panel region only: PB fractions map onto the panels' own scroll span.
    const panelMax = (panelsRef.current?.offsetHeight || document.documentElement.scrollHeight) - window.innerHeight;
    const top = PB[next] * panelMax + 2;
    if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.1 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  // Masthead flips from ink to paper as the horizon crosses.
  const mastheadColor = useTransform(scrollYProgress, [0, 1], ["#1E2624", "#1E2624"]);
  // Panel 8: daylight-adjacent warmth rising from the ground. The single sprout now
  // lives as the crown of the recap below (so it sits with the FAQ, not floating here).
  const warmO = useTransform(scrollYProgress, [PB[7] + 0.02, 0.98], [0, 1]);

  const setEl = (key) => (el) => {
    bridge.current.els[key] = el;
  };

  return (
    <main style={{ position: "relative", background: "#FFFFFF", fontFamily: "var(--font-inter)" }}>
      {/* fixed 3D borehole behind everything */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <Suspense fallback={null}>
          <Scene progress={scrollYProgress} bridge={bridge} />
        </Suspense>
      </div>

      <CursorMosaic hideRef={faqHover} />
      <ScrollCue progress={scrollYProgress} />
      <ProgressRail progress={scrollYProgress} />
      <ChapterNav lenisRef={lenisRef} panelsRef={panelsRef} />
      <ColorTuner bridge={bridge} />
      <PillTuner />

      {/* warm ground for germination */}
      <motion.div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          opacity: warmO,
          background:
            "radial-gradient(120% 90% at 50% 100%, rgba(255,255,255,0.9) 0%, rgba(236,244,243,0.55) 38%, rgba(255,255,255,0) 70%)",
        }}
      />

      {/* masthead — the sprout is the only green above ground */}
      <motion.header style={{ position: "fixed", top: 0, left: 0, zIndex: 6, padding: "20px 28px", color: mastheadColor, pointerEvents: "none" }}>
        <Logo height={26} />
      </motion.header>

      {/* persistent nav: FAQ capsule (outline -> fills turquoise on hover/press) */}
      <nav style={{ position: "fixed", top: 16, right: 20, zIndex: 7, fontFamily: "var(--font-inter)" }}>
        <FaqButton hoverRef={faqHover} />
      </nav>

      {/* the 8 choreographed panels — scroll progress is scoped to this wrapper */}
      <div ref={panelsRef}>
      {/* 1 — HERO, above ground */}
      <Panel
        i={0}
        progress={scrollYProgress}
        place="center"
        color="#000000"
      >
        <div style={{ textAlign: "center", transform: "translateY(-13vh)" }}>
          <HeroLine text={PANELS[0].text} />
        </div>
      </Panel>

      {/* 2 — crossing: forms fossilized in the soil wall */}
      <Panel
        i={1}
        progress={scrollYProgress}
        backdrop={FOSSILS.map((f, k) => (
          <FossilSheet key={k} f={f} progress={scrollYProgress} />
        ))}
      >
        <H style={{ maxWidth: "26ch", textAlign: "center" }}>{PANELS[1].text}</H>
      </Panel>

      {/* 3 — not the worker's fault: paperwork falls endlessly behind the words */}
      <Panel i={2} progress={scrollYProgress} backdrop={<Paperfall />}>
        <H style={{ maxWidth: "22ch", textAlign: "center" }}>{PANELS[2].text}</H>
      </Panel>

      {/* 4 — the branch: four bright filaments, four documents */}
      <Panel i={3} progress={scrollYProgress} place="top">
        <H style={{ maxWidth: "26ch", textAlign: "center" }}>{PANELS[3].text}</H>
      </Panel>

      {/* 5 — the trace: the interaction we protect above every visual */}
      <Panel i={4} progress={scrollYProgress} place="top">
        <H size="clamp(1.4rem, 3.2vw, 2.3rem)" style={{ maxWidth: "38ch", textAlign: "center" }}>
          {PANELS[4].text}
        </H>
      </Panel>

      {/* 6 — lateral galleries: the same spine serves other markets (icon pills) */}
      <Panel i={5} progress={scrollYProgress}>
        <div style={{ textAlign: "center" }}>
          <H style={{ maxWidth: "30ch" }}><CopyWithIcons text={PANELS[5].text} /></H>
        </div>
      </Panel>

      {/* 7 — the founder: Jaden, in his own words + portrait (assembles pixel by pixel) */}
      <Panel i={6} progress={scrollYProgress} color="var(--ink)">
        <div style={{ maxWidth: "min(1000px, 92vw)", margin: "0 auto" }}>
          <div style={{ ...mono, textAlign: "center", fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(30,38,36,0.6)", marginBottom: 22 }}>
            {BUSINESS_LINE}
          </div>
          <PixelImage
            src={`${import.meta.env.BASE_URL}jaden.png`}
            progress={scrollYProgress}
            // Assemble early and hold the fully-rendered face across most of the panel's
            // lock, disassembling only near the very end — so Jaden's face reads clearly
            // and long instead of only flashing whole for an instant. (Jaden's nit.)
            range={[PB[6] + 0.01, PB[6] + 0.045, PB[7] - 0.03, PB[7] - 0.008]}
            label={`${PANELS[6].attribution}: ${PANELS[6].text}`}
            badge="founder & ceo"
          />
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
            <GlassButton href={CAL_URL} external badge="founder & ceo">{PANELS[7].text}</GlassButton>
            <GlassButton href={`mailto:${CONTACT_EMAIL}`} badge="founder & ceo">{PANELS[7].secondary}</GlassButton>
          </div>
        </div>
      </Panel>

      {/* 8 — germination: a quiet close at the seed. The sprout now crowns the recap. */}
      <Panel i={7} progress={scrollYProgress}>
        <div aria-hidden />
      </Panel>
      </div>{/* /panels wrapper */}

      {/* closing recap: premise + FAQ + book, on solid ground below the descent */}
      <Recap />

      {/* ---- fixed overlays, positioned each frame by Scene.jsx ---- */}

      {/* four document cards at the filament endpoints (panel 4) */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        {DEMO_DOCS.map((title, i) => (
          <div
            key={title}
            ref={(el) => {
              bridge.current.els.cards[i] = el;
            }}
            style={{ ...overlayCard, width: "min(200px, 42vw)" }}
          >
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", color: "var(--teal)" }}>{`0${i + 1}`}</div>
            <div style={{ fontWeight: 700, fontSize: 14, margin: "6px 0 10px" }}>{title}</div>
            <Bars />
          </div>
        ))}
      </div>

      {/* panel 5: court filing + source note */}
      <div style={{ position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        <div ref={setEl("filing")} style={{ ...overlayCard, width: "min(440px, 45vw)", padding: "16px 18px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", color: "var(--teal)", marginBottom: 10 }}>
            {`${DEMO_DOCS[2].toUpperCase()} · DRAFT`}
          </div>
          <Bars n={2} />
          <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6 }}>
            <span ref={setEl("filingLine")} style={{ borderRadius: 3, padding: "1px 4px", background: "rgba(93,161,161,0.1)" }}>
              {TRACE_EXAMPLE.filingLine}
            </span>
          </p>
        </div>
        <div
          ref={setEl("source")}
          style={{
            ...overlayCard,
            width: "min(400px, 45vw)",
            background: "rgba(255,255,255,0.92)",
            padding: "12px 16px",
          }}
        >
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", color: "var(--teal)", marginBottom: 6 }}>{TRACE_EXAMPLE.provenance}</div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{TRACE_EXAMPLE.sourceNote}</p>
        </div>
      </div>

    </main>
  );
}

export default function Taproot() {
  const reduced = usePrefersReducedMotion();
  return reduced ? <StaticTaproot /> : <ScrollTaproot />;
}
