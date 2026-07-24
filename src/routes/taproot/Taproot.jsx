// Taproot.jsx — CONCEPT 1: one continuous WebGL borehole. The camera dollies down a
// single growing taproot as you scroll. All text is DOM, always; the fixed R3F canvas
// (Scene.jsx) renders root, soil and light only and positions the floating overlays
// (tooltip pill, document cards, trace cards) by projecting 3D anchors each frame.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import Logo from "../../components/Logo.jsx";
import { PANELS, BUSINESS_LINE, DEMO_DOCS, TRACE_EXAMPLE } from "../../copy.js";
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
  <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 auto", ...style }}>{children}</h2>
);

// Hero headline, kinetic. "Most of a caseworker's day" settles first; a beat later
// "never reaches a kid." sinks in heavy from above — landing a hair low and a touch
// under full weight, so the line arrives *not quite whole*, echoing the words. Plays
// once on load; the reduced-motion path (StaticTaproot) renders it plainly instead.
// The "Reach" (rubber-band): once the line has landed, "never reaches" and "a kid"
// — both undistorted — get pulled apart, the space between them stretching like a
// tensioned rubber band, then snap back together and overshoot into a damped
// bounce before settling. The gap itself enacts the sentence: strained toward each
// other, never at rest. Loops slowly.
function ElasticReach({ left, right }) {
  // keyframes: rest -> pulled apart -> snap past centre (compress) -> rebound -> settle
  const times = [0, 0.4, 0.62, 0.78, 0.9];
  const t = {
    duration: 3.0,
    times,
    ease: ["easeOut", "easeIn", "easeOut", "easeInOut"],
    repeat: Infinity,
    repeatDelay: 0.5,
    delay: 2.0,
  };
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <motion.span style={{ display: "inline-block" }} initial={{ x: 0 }} animate={{ x: [0, -12, 3, -1.4, 0] }} transition={t}>
        {left}
      </motion.span>
      {" "}
      <motion.span style={{ display: "inline-block" }} initial={{ x: 0 }} animate={{ x: [0, 12, -3, 1.4, 0] }} transition={t}>
        {right}
      </motion.span>
    </span>
  );
}

// Split "never reaches a kid." into the two chunks the rubber band pulls apart.
function reachLine(text) {
  const cut = text.indexOf("reaches") + "reaches".length;
  if (cut < "reaches".length) return text;
  return <ElasticReach left={text.slice(0, cut)} right={text.slice(cut).trimStart()} />;
}

function HeroLine({ text }) {
  const i = text.indexOf("never reaches");
  const p1 = i > 0 ? text.slice(0, i).trim() : text;
  const p2 = i > 0 ? text.slice(i) : "";
  const base = {
    fontFamily: "var(--font-sans)",
    fontWeight: 800,
    fontSize: "clamp(2.1rem, 5.4vw, 4.1rem)",
    lineHeight: 1.12,
    letterSpacing: "-0.02em",
  };
  return (
    <h2 style={{ ...base, maxWidth: 880, margin: "0 auto", textWrap: "balance" }}>
      <motion.span
        style={{ display: "block" }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
      >
        {p1}
      </motion.span>
      {p2 && (
        <motion.span
          style={{ display: "block" }}
          initial={{ opacity: 0, y: -44 }}
          animate={{ opacity: 0.9, y: 3 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.34, 1], delay: 0.95 }}
        >
          {reachLine(p2)}
        </motion.span>
      )}
    </h2>
  );
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

function ScrollTaproot() {
  const bridge = useRef({
    p: 0,
    maxG: 0,
    activePanel: 0,
    pillTarget: 1,
    els: { pill: null, cards: [null, null, null, null], filing: null, filingLine: null, source: null },
  });
  const lenisRef = useRef(null);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    window.scrollTo(0, 0);
    const lenis = new Lenis({ lerp: 0.11 });
    lenisRef.current = lenis;
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const onPill = () => {
    const next = Math.min(bridge.current.pillTarget, 7);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const top = PB[next] * max + 2;
    if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.1 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  // Masthead flips from ink to paper as the horizon crosses.
  const mastheadColor = useTransform(scrollYProgress, [0, 1], ["#1E2624", "#1E2624"]);
  // Panel 8: daylight-adjacent warmth rising from the ground.
  const warmO = useTransform(scrollYProgress, [PB[7] + 0.02, 0.98], [0, 1]);
  // The shoot resolves into the two-leaf sprout glyph, drawn stroke by stroke.
  const leaf1 = useTransform(scrollYProgress, [PB[7] + 0.035, PB[7] + 0.075], [0, 1]);
  const leaf2 = useTransform(scrollYProgress, [PB[7] + 0.055, PB[7] + 0.095], [0, 1]);
  const ctaO = useTransform(scrollYProgress, [PB[7] + 0.06, PB[7] + 0.1], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [PB[7] + 0.06, PB[7] + 0.1], [18, 0]);

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

      {/* 1 — HERO, above ground */}
      <Panel
        i={0}
        progress={scrollYProgress}
        place="center"
        color="var(--ink)"
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

      {/* 3 — stillness. The root pauses mid-growth. */}
      <Panel i={2} progress={scrollYProgress}>
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

      {/* 6 — lateral galleries, present but not yet lit + the business line */}
      <Panel
        i={5}
        progress={scrollYProgress}
        backdrop={
          <>
            <div style={{ position: "absolute", left: "4%", top: "52%", ...mono, fontSize: 11, letterSpacing: "0.2em", color: "rgba(93,161,161,0.5)" }}>
              group homes
            </div>
            <div style={{ position: "absolute", right: "4%", top: "60%", ...mono, fontSize: 11, letterSpacing: "0.2em", color: "rgba(93,161,161,0.5)" }}>
              elder care
            </div>
          </>
        }
      >
        <div style={{ textAlign: "center" }}>
          <H style={{ maxWidth: "30ch" }}>{PANELS[5].text}</H>
          <div style={{ marginTop: 48 }}>
            <div aria-hidden style={{ width: 1, height: 34, background: "rgba(30,38,36,0.3)", margin: "0 auto 14px" }} />
            <div style={{ ...mono, fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(30,38,36,0.65)" }}>
              {BUSINESS_LINE}
            </div>
          </div>
        </div>
      </Panel>

      {/* 7 — the seed. The least rendered thing on the page. Near-silence. */}
      <Panel i={6} progress={scrollYProgress} color="var(--ink)">
        <div style={{ maxWidth: "34ch", margin: "0 auto" }}>
          <p style={{ fontWeight: 400, fontSize: 17, lineHeight: 1.7, margin: 0 }}>{PANELS[6].text}</p>
          <p style={{ color: "#8F7119", fontSize: 13, marginTop: 22 }}>{`— ${PANELS[6].attribution}`}</p>
        </div>
      </Panel>

      {/* 8 — germination: the shoot resolves into the sprout, CTA on warm ground */}
      <Panel i={7} progress={scrollYProgress}>
        <div style={{ textAlign: "center" }}>
          <svg viewBox="112 122 32 20" width="64" aria-hidden style={{ overflow: "visible", display: "inline-block", marginBottom: 30 }}>
            <motion.path
              d="M128.571 140V131.952C127.175 129.999 121.029 125.903 116 127.619"
              stroke="var(--teal)"
              strokeWidth="4.19"
              fill="none"
              style={{ pathLength: leaf1 }}
            />
            <motion.path
              d="M128.571 131.952C130.899 129.222 137.79 125.698 141.143 127.485"
              stroke="var(--teal)"
              strokeWidth="4.19"
              fill="none"
              style={{ pathLength: leaf2 }}
            />
          </svg>
          <motion.div style={{ opacity: ctaO, y: ctaY, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{ background: "var(--teal)", color: "#0F1B1A", fontWeight: 700, padding: "14px 26px", borderRadius: 999, textDecoration: "none", fontSize: 15 }}
            >
              {PANELS[7].text}
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{ border: "1px solid rgba(30,38,36,0.35)", color: "var(--ink)", fontWeight: 600, padding: "14px 26px", borderRadius: 999, textDecoration: "none", fontSize: 15 }}
            >
              {PANELS[7].secondary}
            </a>
          </motion.div>
        </div>
      </Panel>

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
        <div ref={setEl("filing")} style={{ ...overlayCard, width: "min(540px, 90vw)", padding: "16px 18px" }}>
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
            width: "min(400px, 84vw)",
            background: "rgba(255,255,255,0.92)",
            borderLeft: "2px solid var(--teal)",
            borderRadius: "6px 10px 10px 6px",
            padding: "12px 16px",
          }}
        >
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", color: "var(--teal)", marginBottom: 6 }}>{TRACE_EXAMPLE.provenance}</div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{TRACE_EXAMPLE.sourceNote}</p>
        </div>
      </div>

      {/* the gold question pill — one alive at a time, tethered to the growth tip */}
      <button
        ref={setEl("pill")}
        onClick={onPill}
        aria-label="continue to the answer"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 5,
          opacity: 0,
          pointerEvents: "none",
          background: "var(--gold)",
          color: "#191412",
          border: "none",
          borderRadius: 999,
          padding: "9px 16px",
          fontFamily: "var(--font-sans)",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          whiteSpace: "nowrap",
          boxShadow: "0 6px 24px rgba(201,162,39,0.35)",
          willChange: "transform, opacity",
        }}
      />
    </main>
  );
}

export default function Taproot() {
  const reduced = usePrefersReducedMotion();
  return reduced ? <StaticTaproot /> : <ScrollTaproot />;
}
