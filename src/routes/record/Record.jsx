// CONCEPT 2 — THE RECORD (typography-led).
// One continuous typeset document descending from paper into ink.
// The medium is the product: text, routed, with provenance. No Three.js.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Logo from "../../components/Logo.jsx";
import { BUSINESS_LINE, PANELS } from "../../copy.js";
import { QuestionPill, RecordCtx, Sprout, Stratum } from "./shared.jsx";
import DepthRuler from "./DepthRuler.jsx";
import TypingPanel from "./TypingPanel.jsx";
import SplitPanel from "./SplitPanel.jsx";
import TracePanel from "./TracePanel.jsx";
import "./record.css";

const DEPTHS = [
  "0 M · SURFACE",
  "−1 M · THE FORMS",
  "−3 M · TOPSOIL",
  "−6 M · THE SPLIT",
  "−10 M · THE RECORD",
  "−14 M · LATERALS",
  "−20 M · BEDROCK",
  "−20 M · GERMINATION",
];

// Depth palette: paper -> warm (panel 3) -> soil -> bedrock, lifting warm at panel 8.
const PAPER = "#F7F5F1";
const WARM = "#EFE4D2";
const DUSK = "#8F7355";
const DARK = "#4A3A2E";
const SOIL = "#3E322A";
const BEDROCK = "#191412";
const LIFT = "#463629";
const DEFAULT_FR = [0, 0.07, 0.28, 0.42, 0.55, 0.72, 0.82, 0.93];

function buildRamp(metrics) {
  let pts;
  let flip;
  if (!metrics) {
    pts = [
      [0, PAPER], [0.24, PAPER], [0.3, WARM], [0.36, WARM], [0.4, DUSK],
      [0.44, DARK], [0.58, SOIL], [0.8, BEDROCK], [0.92, BEDROCK], [1, LIFT],
    ];
    flip = [0.4, 0.44];
  } else {
    const f = metrics.fr;
    const v = metrics.vhFrac;
    pts = [
      [0, PAPER],
      [f[2] - 0.45 * v, PAPER], // paper holds through the typing
      [f[2], WARM], // panel 3: background warms one step
      [f[3] - 1.15 * v, WARM],
      [f[3] - 0.78 * v, DUSK], // the dive happens in the breath before panel 4
      [f[3] - 0.45 * v, DARK],
      [f[4], SOIL],
      [f[6] - 0.55 * v, BEDROCK], // bedrock before panel 7's words arrive
      [f[7] - 0.12 * v, BEDROCK],
      [1, LIFT], // panel 8 lifts two steps toward warmth
    ];
    flip = [f[3] - 0.78 * v, f[3] - 0.45 * v];
  }
  const stops = [];
  const colors = [];
  let prev = -Infinity;
  for (const [xRaw, c] of pts) {
    const x = Math.max(prev + 0.004, Math.min(1, xRaw));
    stops.push(x);
    colors.push(c);
    prev = x;
  }
  const a = Math.max(0.01, flip[0]);
  return { stops, colors, flip: [a, Math.max(a + 0.01, flip[1])] };
}

export default function Record() {
  const reduced = !!useReducedMotion();
  const secRefs = useRef([]);
  const heroRef = useRef(null);
  const lenisRef = useRef(null);
  const [metrics, setMetrics] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const { scrollYProgress } = useScroll();

  // Lenis drives native scroll; framer-motion reads it directly.
  useEffect(() => {
    if (reduced) return undefined;
    const lenis = new Lenis({ duration: 1.05 });
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
  }, [reduced]);

  // Measure panel offsets so the ramp, ruler ticks, and text inversion are
  // seated on real strata positions. Re-measured on resize + font load.
  useEffect(() => {
    const measure = () => {
      const denom = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const fr = DEFAULT_FR.map((fallback, i) => {
        const el = secRefs.current[i];
        return el ? el.offsetTop / denom : fallback;
      });
      setMetrics({ fr, vhFrac: window.innerHeight / denom });
    };
    measure();
    const t = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [reduced]);

  const { stops, colors, flip } = useMemo(() => buildRamp(metrics), [metrics]);
  const bg = useTransform(scrollYProgress, stops, colors);
  const railColor = useTransform(scrollYProgress, flip, [
    "rgba(30, 38, 36, 0.8)",
    "rgba(247, 245, 241, 0.7)",
  ]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!metrics) return;
    let idx = 0;
    metrics.fr.forEach((f, i) => {
      if (v >= f - metrics.vhFrac * 0.45) idx = i;
    });
    setActiveIdx((prev) => (prev === idx ? prev : idx));
  });

  const scrollToId = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.4 });
      else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    },
    [reduced]
  );

  const ctx = useMemo(() => ({ scrollToId, reduced }), [scrollToId, reduced]);

  const setSec = (i) => (el) => {
    secRefs.current[i] = el;
    if (i === 0) heroRef.current = el;
  };

  // Panel 1: the teal underline grows a descender as you scroll — the first
  // root is an underline escaping the sentence, diving through the stratum rule.
  const { scrollYProgress: heroP } = useScroll({
    target: heroRef,
    offset: ["start start", "end 0.3"],
  });
  const descScale = useTransform(heroP, [0.04, 0.85], [0, 1]);

  return (
    <RecordCtx.Provider value={ctx}>
      <motion.main className="record-root" style={{ backgroundColor: bg }}>
        <header className="rec-masthead">
          <Logo height={26} />
        </header>

        <DepthRuler
          progress={scrollYProgress}
          fractions={metrics ? metrics.fr : DEFAULT_FR}
          activeIdx={activeIdx}
          railColor={railColor}
        />

        {/* PANEL 1 — above ground */}
        <section
          id="rec-p1"
          ref={setSec(0)}
          className="rec-sec rec-ink rec-hero"
          aria-label="Panel 1"
        >
          <div className="rec-hero-inner">
            <span className="rec-badge rec-label">{PANELS[0].badge}</span>
            <h1 className="rec-h1 rec-seat">
              {"Most of a caseworker's day "}
              <span className="rec-underline">
                never reaches a kid
                <motion.span
                  className="rec-descender"
                  style={{ scaleY: reduced ? 1 : descScale }}
                  aria-hidden="true"
                />
              </span>
              .
              <span className="rec-label rec-seat-label" aria-hidden="true">
                {DEPTHS[0]}
              </span>
            </h1>
            <QuestionPill question={PANELS[0].tooltip} nextId="rec-p2" />
          </div>
        </section>

        {/* PANEL 2 — the same sentence four times (pinned) */}
        <TypingPanel depthLabel={DEPTHS[1]} secRef={setSec(1)} />

        {/* PANEL 3 — stillness */}
        <section
          id="rec-p3"
          ref={setSec(2)}
          className="rec-sec rec-ink rec-p3"
          aria-label="Panel 3"
        >
          <Stratum label={DEPTHS[2]} />
          <div className="rec-p3-inner">
            <p className="rec-p3-line rec-seat">
              <strong>{"Not the worker's."}</strong>
              <span className="rec-p3-rest">
                {" No one chose this career for their love of paperwork."}
              </span>
            </p>
          </div>
          <QuestionPill question={PANELS[2].tooltip} nextId="rec-p4" />
        </section>

        {/* PANEL 4 — the split (pinned) */}
        <SplitPanel depthLabel={DEPTHS[3]} secRef={setSec(3)} />

        {/* PANEL 5 — the trace (pinned) */}
        <TracePanel depthLabel={DEPTHS[4]} secRef={setSec(4)} />

        {/* PANEL 6 — laterals + the business line */}
        <section
          id="rec-p6"
          ref={setSec(5)}
          className="rec-sec rec-paper rec-p6"
          aria-label="Panel 6"
        >
          <Stratum label={DEPTHS[5]} />
          <div className="rec-p6-inner">
            <aside className="rec-margin-left" aria-hidden="true">
              <span>Group homes</span>
              <span>Elder care</span>
            </aside>
            <p className="rec-p6-text">{PANELS[5].text}</p>
            <aside className="rec-footnote">
              <span className="rec-label">{BUSINESS_LINE}</span>
            </aside>
            <QuestionPill question={PANELS[5].tooltip} nextId="rec-p7" />
          </div>
        </section>

        {/* PANEL 7 — the founder, by subtraction */}
        <section
          id="rec-p7"
          ref={setSec(6)}
          className="rec-sec rec-gold rec-p7"
          aria-label="Panel 7"
        >
          <Stratum label={DEPTHS[6]} />
          <motion.figure
            initial={reduced ? false : { opacity: 0, y: 24 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            <blockquote className="rec-quote">{PANELS[6].text}</blockquote>
            <figcaption className="rec-attr">
              JADEN · FOUNDER · MASSACHUSETTS
            </figcaption>
          </motion.figure>
        </section>

        {/* PANEL 8 — germination + CTA */}
        <section
          id="rec-p8"
          ref={setSec(7)}
          className="rec-sec rec-paper rec-p8"
          aria-label="Panel 8"
        >
          <Stratum label={DEPTHS[7]} />
          <div className="rec-p8-inner">
            <Sprout width={84} />
            <div className="rec-cta-row">
              <button type="button" className="rec-btn rec-btn-primary">
                {PANELS[7].text}
              </button>
              <button type="button" className="rec-btn rec-btn-ghost">
                {PANELS[7].secondary}
              </button>
            </div>
          </div>
        </section>
      </motion.main>
    </RecordCtx.Provider>
  );
}
