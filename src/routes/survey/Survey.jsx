// CONCEPT 3 — THE SURVEY (illustration / line-art-led).
// One continuous schematic line drawing — half botanical plate, half data-lineage
// diagram — draws itself tip-first down the page as the user scrolls.
// Warm paper the entire descent. Two stroke voices only: ink for the world,
// teal for the living root line and every provenance trace. The line never un-draws.
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import Lenis from "lenis";
import { PANELS, BUSINESS_LINE, DEMO_DOCS, TRACE_EXAMPLE } from "../../copy.js";
import Logo from "../../components/Logo.jsx";
import "./survey.css";

const INK = "#1E2624";
const TEAL = "#5DA1A1";

// Plate coordinate system. 8 panels x 760 units.
const W = 520;
const H = 6080;
const pctX = (v) => `${(v / W) * 100}%`;
const pctY = (v) => `${(v / H) * 100}%`;

// ————— The master teal spine: strictly downward, asymmetric, never cute.
// Small M-gaps are pen-through-node moments (dashing accumulates across subpaths).
const SPINE_D = [
  "M250 600",
  "C252 652 240 690 244 740",
  "C248 792 262 848 262 902",
  "C262 952 250 1006 256 1058",
  "C262 1110 272 1148 272 1188",
  "C272 1252 262 1296 262 1350",
  "C262 1392 252 1424 250 1460",
  "C247 1512 248 1560 248 1610",
  "L248 2140", // panel 3: the plainest stroke on the page — dead straight
  "C248 2226 232 2320 238 2414",
  "M238 2426",
  "C240 2472 254 2522 262 2588",
  "C270 2654 264 2760 258 2836",
  "C252 2912 244 2966 240 3020",
  "C236 3072 210 3106 168 3130",
  "C120 3158 62 3196 48 3268",
  "C40 3310 42 3380 42 3450",
  "L42 3660",
  "C42 3742 64 3810 104 3872",
  "C136 3922 174 3988 184 4054",
  "M184 4066",
  "C190 4140 192 4240 190 4348",
  "C188 4452 196 4530 200 4630",
  "C204 4770 206 4910 198 5050",
  "C192 5160 194 5230 198 5308",
  "C202 5380 234 5406 250 5450",
  "C262 5484 268 5510 260 5532",
  "C254 5546 244 5548 242 5538", // the final stroke curls into the seed
].join(" ");

// Sprout drawn upward from the seed — the last thing drawn on the page is the brand.
const SPROUT_STEM = "M247 5532 C249 5496 247 5458 247 5420";
const SPROUT_LEAF_L = "M247 5420 C239 5390 218 5372 186 5366";
const SPROUT_LEAF_R = "M247 5420 C257 5386 282 5368 314 5364";

// Provenance trace: authored filing-first so it visibly re-draws BACKWARD up the page.
const TRACE_D =
  "M82 3562 C56 3530 52 3446 60 3366 C68 3292 150 3272 246 3300";

// Question zones: [tipY start, tipY end, PANELS index] — one alive at a time,
// living in the last stretch of each panel before the next headline blooms.
const ZONES = [
  [608, 900, 0],
  [1250, 1790, 1],
  [2050, 2300, 2],
  [2880, 3050, 3],
  [3620, 3830, 4],
  [4460, 4740, 5],
];

// Strata boundaries: ruled survey lines with small mono depth labels.
const RULES = [
  { y: 760, label: "−4 FT" },
  { y: 1520, label: "−9 FT" },
  { y: 2280, label: "−15 FT" },
  { y: 3040, label: "−22 FT" },
  { y: 3800, label: "−30 FT" },
  { y: 4560, label: "−39 FT" },
];

// Hatching patches: fine ink hatching that densifies with depth. Panels 7–8 stay bare.
const PATCHES = [
  { d: "M0 766 L148 782 L118 992 L52 1108 L0 1092 Z", p: "sv-h1" },
  { d: "M520 880 L484 910 L496 1160 L520 1180 Z", p: "sv-h1" },
  { d: "M0 2290 L120 2310 L96 2500 L0 2520 Z", p: "sv-h2" },
  { d: "M520 2300 L420 2330 L452 2560 L520 2590 Z", p: "sv-h2" },
  { d: "M0 2900 L180 2930 L140 3030 L0 3030 Z", p: "sv-h2" },
  { d: "M0 3060 L36 3080 L28 3240 L0 3260 Z", p: "sv-h2" },
  { d: "M70 3700 L370 3710 L340 3770 L96 3766 Z", p: "sv-h3" },
  { d: "M520 3400 L498 3420 L504 3700 L520 3720 Z", p: "sv-h3" },
  { d: "M0 3860 L120 3900 L84 4160 L0 4200 Z", p: "sv-h3" },
  { d: "M520 3960 L436 4010 L462 4300 L520 4350 Z", p: "sv-h3" },
  { d: "M0 4470 L240 4452 L520 4478 L520 4548 L0 4548 Z", p: "sv-h4" },
];

// Panel 3: half-finished hatching that just stops — each row is one path of ticks.
const RAGGED_ROWS = [
  [1544, 24, 320],
  [1557, 24, 306],
  [1570, 24, 296],
  [1583, 24, 240],
  [1596, 24, 172],
  [1609, 24, 88],
];
function rowD(y, x0, x1) {
  let d = "";
  for (let x = x0; x + 7 <= x1; x += 11) d += `M${x} ${y + 8} L${x + 7} ${y} `;
  return d.trim();
}

// Shared variants. `custom` carries the delay.
const draw = {
  hidden: { pathLength: 0 },
  show: (d) => ({
    pathLength: 1,
    transition: { duration: 0.5, delay: d, ease: "easeInOut" },
  }),
};
const drawSlow = {
  hidden: { pathLength: 0 },
  show: (d) => ({
    pathLength: 1,
    transition: { duration: 0.7, delay: d, ease: "easeInOut" },
  }),
};
const fade = {
  hidden: { opacity: 0 },
  show: (d) => ({ opacity: 1, transition: { duration: 0.3, delay: d } }),
};
const vp = { once: true, amount: 0.3 };

// ————— Ink furniture components —————

function FormSheet({ x, y, w, h, first, delay = 0, rotate, twigD, node, rm }) {
  const fields = ["NAME", "DOB", "PLACEMENT"];
  const body = (
    <>
      {twigD && (
        <motion.path
          d={twigD}
          stroke={TEAL}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          variants={first ? draw : undefined}
          custom={0}
        />
      )}
      {node && (
        <motion.circle
          cx={node[0]}
          cy={node[1]}
          r="2.5"
          fill="none"
          stroke={TEAL}
          strokeWidth="1.5"
          variants={first ? fade : undefined}
          custom={0.2}
        />
      )}
      <motion.path
        d={`M${x} ${y} H${x + w} V${y + h} H${x} Z`}
        stroke={INK}
        strokeWidth="1.4"
        fill="none"
        variants={first ? drawSlow : undefined}
        custom={0.1}
      />
      {fields.map((f, i) => (
        <g key={f}>
          <motion.text
            x={x + 12}
            y={y + 36 + i * 32}
            fontSize="7"
            fill={INK}
            opacity="0.7"
            className="survey-mono"
            variants={first ? fade : undefined}
            custom={0.8 + i * 0.2}
          >
            {f}
          </motion.text>
          <motion.line
            x1={x + 72}
            y1={y + 38 + i * 32}
            x2={x + w - 14}
            y2={y + 38 + i * 32}
            stroke={INK}
            strokeWidth="0.9"
            opacity="0.55"
            variants={first ? draw : undefined}
            custom={0.75 + i * 0.2}
          />
        </g>
      ))}
    </>
  );
  return (
    <motion.g
      initial={rm ? false : "hidden"}
      whileInView="show"
      viewport={vp}
      variants={first ? undefined : fade}
      custom={delay}
      transform={rotate}
    >
      {body}
    </motion.g>
  );
}

function DocFrame({ x, y, title, branchD, branchEnd, i, rm }) {
  const d = i * 0.14;
  const lines = [
    [x + 14, y + 56, x + 186, y + 56],
    [x + 14, y + 84, x + 140, y + 84],
    [x + 14, y + 112, x + 168, y + 112],
  ];
  return (
    <motion.g initial={rm ? false : "hidden"} whileInView="show" viewport={vp}>
      <motion.path
        d={branchD}
        stroke={TEAL}
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
        variants={draw}
        custom={d}
      />
      <motion.circle
        cx={branchEnd[0]}
        cy={branchEnd[1]}
        r="3"
        fill="none"
        stroke={TEAL}
        strokeWidth="1.5"
        variants={fade}
        custom={0.35 + d}
      />
      <motion.path
        d={`M${x} ${y} h200 v150 h-200 Z`}
        stroke={INK}
        strokeWidth="1.4"
        fill="none"
        variants={draw}
        custom={0.35 + d}
      />
      <motion.text
        x={x + 14}
        y={y + 28}
        fontSize="9.5"
        fill={INK}
        opacity="0.85"
        className="survey-mono"
        variants={fade}
        custom={0.55 + d}
      >
        {title}
      </motion.text>
      {lines.map((l, j) => (
        <motion.line
          key={j}
          x1={l[0]}
          y1={l[1]}
          x2={l[2]}
          y2={l[3]}
          stroke={INK}
          strokeWidth="0.9"
          opacity="0.55"
          variants={draw}
          custom={0.6 + d + j * 0.12}
        />
      ))}
    </motion.g>
  );
}

// HTML annotation block, positioned in plate coordinates.
function Annot({ x, y, w, align, q, rm, children, style }) {
  return (
    <div
      className="survey-abs"
      style={{ left: pctX(x), top: pctY(y), width: pctX(w), textAlign: align, ...style }}
    >
      {rm && q ? <p className="survey-qprint survey-mono">{q}</p> : null}
      {children}
    </div>
  );
}

function Head({ x, y, w, text, q, rm, center }) {
  return (
    <Annot x={x} y={y} w={w} q={q} rm={rm} align={center ? "center" : "left"}>
      <motion.h2
        className="survey-h"
        initial={rm ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {text}
      </motion.h2>
    </Annot>
  );
}

export default function Survey() {
  const rm = useReducedMotion();
  const plateRef = useRef(null);
  const masterRef = useRef(null);
  const geomRef = useRef(null);
  const maxP = useRef(0);
  const lastQ = useRef(0);
  const [ready, setReady] = useState(false);
  const [spineLen, setSpineLen] = useState(0);
  const [activeQ, setActiveQ] = useState(-1);
  const [traced, setTraced] = useState(false);
  const effTraced = rm || traced;

  // Lenis smooth scroll (scroll-linked only; skipped under reduced motion).
  useEffect(() => {
    if (rm) return;
    const lenis = new Lenis();
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [rm]);

  // Precompute the master path length + a monotone y→length lookup table.
  useEffect(() => {
    const el = masterRef.current;
    if (!el) return;
    const L = el.getTotalLength();
    const N = 800;
    const samples = [];
    let my = 0;
    for (let i = 0; i <= N; i++) {
      const len = (L * i) / N;
      const p = el.getPointAtLength(len);
      my = Math.max(my, p.y);
      samples.push([len, my]);
    }
    geomRef.current = { L, samples, el };
    setSpineLen(L);
    setReady(true);
  }, []);

  const lookupLen = (targetY) => {
    const g = geomRef.current;
    if (!g) return 0;
    const s = g.samples;
    if (targetY <= s[0][1]) return 0;
    let lo = 0;
    let hi = s.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (s[mid][1] <= targetY) lo = mid;
      else hi = mid - 1;
    }
    return s[lo][0];
  };

  // Scroll: progress of the ~70% viewport line through the plate.
  const { scrollYProgress } = useScroll({
    target: plateRef,
    offset: ["start 0.7", "end 0.7"],
  });

  // THE LINE NEVER UN-DRAWS: clamp to the max progress reached.
  const prog = useTransform(scrollYProgress, (v) => {
    const c = Math.min(Math.max(v, 0), 1);
    maxP.current = Math.max(maxP.current, c);
    return maxP.current;
  });
  const drawnLen = useTransform(prog, (m) => lookupLen(m * H));
  const dashOff = useTransform(drawnLen, (l) =>
    geomRef.current ? Math.max(geomRef.current.L - l, 0) : 0
  );

  // The gold question label rides the pen tip of the master path.
  const penLeft = useTransform(drawnLen, (l) => {
    const g = geomRef.current;
    if (!g) return "50%";
    return `${(g.el.getPointAtLength(l).x / W) * 100}%`;
  });
  const penTop = useTransform(drawnLen, (l) => {
    const g = geomRef.current;
    if (!g) return "0%";
    return `${(g.el.getPointAtLength(l).y / H) * 100}%`;
  });

  useMotionValueEvent(prog, "change", (m) => {
    const ty = m * H;
    const z = ZONES.find((z) => ty >= z[0] && ty < z[1]);
    const q = z ? z[2] : -1;
    setActiveQ((prev) => {
      if (q >= 0) lastQ.current = q;
      return prev === q ? prev : q;
    });
  });

  // Panel 8: seed + sprout, drawn strictly after the spine completes.
  const seedOp = useTransform(prog, [0.928, 0.94], [0, 1]);
  const stemLen = useTransform(prog, [0.945, 0.964], [0, 1]);
  const leafLLen = useTransform(prog, [0.964, 0.981], [0, 1]);
  const leafRLen = useTransform(prog, [0.981, 0.997], [0, 1]);
  const wordOp = useTransform(prog, [0.965, 0.99], [0, 1]);

  const sproutStyle = (mv) => (rm ? undefined : { pathLength: mv });

  return (
    <main className="survey-root">
      <header className="survey-header">
        <Logo height={26} />
      </header>

      <div className="survey-plate" ref={plateRef}>
        <svg
          className="survey-svg"
          viewBox={`0 0 ${W} ${H}`}
          fill="none"
          role="img"
          aria-label="A single continuous survey drawing of the Fostr root system, from ground line to seed to sprout"
        >
          <defs>
            <pattern id="sv-h1" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="11" stroke={INK} strokeWidth="0.55" opacity="0.5" />
            </pattern>
            <pattern id="sv-h2" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke={INK} strokeWidth="0.6" opacity="0.5" />
            </pattern>
            <pattern id="sv-h3" width="5.5" height="5.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5.5" stroke={INK} strokeWidth="0.6" opacity="0.5" />
            </pattern>
            <pattern id="sv-h4" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4.5" stroke={INK} strokeWidth="0.6" opacity="0.55" />
            </pattern>
          </defs>

          {/* — soil: hatching patches, densifying with depth — */}
          {PATCHES.map((p, i) => (
            <motion.path
              key={i}
              d={p.d}
              fill={`url(#${p.p})`}
              stroke="none"
              initial={rm ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={vp}
              transition={{ duration: 0.9 }}
            />
          ))}

          {/* — panel 3: the pen lifts; half-finished hatching just stops — */}
          <motion.g initial={rm ? false : "hidden"} whileInView="show" viewport={vp}>
            {RAGGED_ROWS.map(([y, x0, x1], i) => (
              <motion.path
                key={y}
                d={rowD(y, x0, x1)}
                stroke={INK}
                strokeWidth="0.6"
                opacity="0.5"
                variants={draw}
                custom={i * 0.12}
              />
            ))}
          </motion.g>

          {/* — the ground line + survey furniture (the pre-printed sheet) — */}
          <line x1="0" y1="600" x2="520" y2="600" stroke={INK} strokeWidth="1.5" />
          <text x="506" y="591" textAnchor="end" fontSize="8.5" fill={INK} opacity="0.6" className="survey-mono">
            0 FT · GRADE
          </text>
          {/* sprout strokes above the ground line */}
          {[
            [96, 600, 90, 588],
            [150, 600, 146, 590],
            [322, 600, 326, 589],
            [410, 600, 404, 590],
            [452, 600, 456, 592],
          ].map((t, i) => (
            <line key={i} x1={t[0]} y1={t[1]} x2={t[2]} y2={t[3]} stroke={INK} strokeWidth="1.2" opacity="0.6" />
          ))}

          {RULES.map((r) => (
            <g key={r.y}>
              <line x1="12" y1={r.y} x2="508" y2={r.y} stroke={INK} strokeWidth="0.75" opacity="0.3" />
              {[102, 192, 282, 372, 462].map((x) => (
                <line key={x} x1={x} y1={r.y} x2={x} y2={r.y + 6} stroke={INK} strokeWidth="0.75" opacity="0.3" />
              ))}
              <text x="506" y={r.y - 6} textAnchor="end" fontSize="8.5" fill={INK} opacity="0.55" className="survey-mono">
                {r.label}
              </text>
            </g>
          ))}

          {/* — panel 2: first form sheet draws stroke-by-stroke; the rest stamp in — */}
          <FormSheet rm={rm} first x={60} y={830} w={180} h={130}
            twigD="M252 820 C248 824 244 828 241 831" node={[240, 832]} />
          <FormSheet rm={rm} delay={0.1} x={300} y={960} w={170} h={120}
            rotate="rotate(-1.6 385 1020)" twigD="M262 942 C272 948 288 954 299 961" node={[300, 962]} />
          <FormSheet rm={rm} delay={0.12} x={80} y={1130} w={175} h={120}
            rotate="rotate(1.2 167 1190)" twigD="M272 1150 C266 1146 260 1140 256 1133" node={[255, 1132]} />
          <FormSheet rm={rm} delay={0.14} x={300} y={1290} w={170} h={120}
            rotate="rotate(-1 385 1350)" twigD="M266 1288 C276 1288 290 1289 299 1291" node={[300, 1292]} />

          {/* — panel 4: the root reaches a node and branches into four paths — */}
          <motion.circle
            cx="238" cy="2420" r="4.5" fill="none" stroke={TEAL} strokeWidth="1.75"
            initial={rm ? false : { opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={vp} transition={{ duration: 0.3 }}
          />
          <DocFrame rm={rm} i={0} x={40} y={2520} title={DEMO_DOCS[0]}
            branchD="M238 2420 C196 2448 148 2472 132 2516" branchEnd={[131, 2519]} />
          <DocFrame rm={rm} i={1} x={290} y={2520} title={DEMO_DOCS[1]}
            branchD="M238 2420 C284 2450 366 2472 384 2516" branchEnd={[385, 2519]} />
          <DocFrame rm={rm} i={2} x={40} y={2720} title={DEMO_DOCS[2]}
            branchD="M238 2420 C214 2540 158 2646 137 2716" branchEnd={[136, 2719]} />
          <DocFrame rm={rm} i={3} x={290} y={2720} title={DEMO_DOCS[3]}
            branchD="M238 2420 C268 2548 356 2652 379 2716" branchEnd={[380, 2719]} />

          {/* — panel 5: the drawn court filing — */}
          <motion.g initial={rm ? false : "hidden"} whileInView="show" viewport={vp}>
            <motion.path d="M70 3420 H370 V3680 H70 Z" stroke={INK} strokeWidth="1.4" fill="none"
              variants={draw} custom={0.05} />
            <motion.text x="84" y="3450" fontSize="9.5" fill={INK} opacity="0.85" className="survey-mono"
              variants={fade} custom={0.3}>
              {DEMO_DOCS[2]}
            </motion.text>
            <motion.line x1="84" y1="3462" x2="356" y2="3462" stroke={INK} strokeWidth="0.9" opacity="0.55"
              variants={draw} custom={0.45} />
            {[3492, 3516, 3620].map((y, j) => (
              <motion.line key={y} x1="84" y1={y} x2="356" y2={y} stroke={INK} strokeWidth="0.9" opacity="0.45"
                variants={draw} custom={0.57 + j * 0.12} />
            ))}
            <motion.line x1="84" y1="3646" x2="300" y2="3646" stroke={INK} strokeWidth="0.9" opacity="0.45"
              variants={draw} custom={0.95} />
            <motion.text x="380" y="3556" fontSize="8" fill={TEAL} className="survey-mono"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: effTraced ? 0.35 : 1, transition: { duration: 0.3, delay: 1.1 } },
              }}>
              TAP TO TRACE
            </motion.text>
          </motion.g>

          {/* the trace: the same stroke seen in reverse, re-drawn backward up the page */}
          <motion.path d={TRACE_D} stroke={TEAL} strokeWidth="1.75" fill="none" strokeLinecap="round"
            initial={false}
            animate={effTraced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }} />
          <motion.circle cx="249" cy="3301" r="3" fill="none" stroke={TEAL} strokeWidth="1.5"
            initial={false} animate={{ opacity: effTraced ? 1 : 0 }}
            transition={{ duration: 0.3, delay: effTraced ? 1.0 : 0 }} />
          <motion.path d="M250 3230 H496 V3380 H250 Z" stroke={INK} strokeWidth="1.2" fill="none"
            initial={false}
            animate={effTraced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 0.6, delay: effTraced ? 0.9 : 0, ease: "easeOut" }} />
          <motion.text x="252" y="3222" fontSize="8.5" fill={TEAL} className="survey-mono"
            initial={false} animate={{ opacity: effTraced ? 1 : 0 }}
            transition={{ duration: 0.4, delay: effTraced ? 1.4 : 0 }}>
            {TRACE_EXAMPLE.provenance}
          </motion.text>

          {/* — panel 6: lateral roots in lighter ink to the margins, annotated NEXT — */}
          <motion.g initial={rm ? false : "hidden"} whileInView="show" viewport={vp}>
            <motion.circle cx="184" cy="4060" r="4" fill="none" stroke={TEAL} strokeWidth="1.75"
              variants={fade} custom={0} />
            <motion.path d="M182 4060 C130 4088 70 4102 22 4132" stroke={INK} strokeWidth="1.5" opacity="0.5"
              fill="none" strokeLinecap="round" variants={drawSlow} custom={0.1} />
            <motion.path d="M186 4060 C252 4108 380 4150 492 4186" stroke={INK} strokeWidth="1.5" opacity="0.5"
              fill="none" strokeLinecap="round" variants={drawSlow} custom={0.25} />
            <motion.path d="M188 4200 C150 4218 120 4230 96 4246" stroke={INK} strokeWidth="1.2" opacity="0.35"
              fill="none" strokeLinecap="round" variants={draw} custom={0.4} />
            <motion.path d="M190 4300 C230 4318 268 4332 300 4344" stroke={INK} strokeWidth="1.2" opacity="0.35"
              fill="none" strokeLinecap="round" variants={draw} custom={0.5} />
            <motion.circle cx="20" cy="4134" r="3" fill="none" stroke={INK} strokeWidth="1.4" opacity="0.5"
              variants={fade} custom={0.7} />
            <motion.circle cx="494" cy="4188" r="3" fill="none" stroke={INK} strokeWidth="1.4" opacity="0.5"
              variants={fade} custom={0.75} />
            <motion.text x="14" y="4158" fontSize="9" fill={INK} opacity="0.7" className="survey-mono"
              variants={fade} custom={0.8}>GROUP HOMES</motion.text>
            <motion.text x="14" y="4174" fontSize="7.5" fill={INK} opacity="0.5" className="survey-mono"
              variants={fade} custom={0.85}>NEXT</motion.text>
            <motion.text x="506" y="4212" textAnchor="end" fontSize="9" fill={INK} opacity="0.7" className="survey-mono"
              variants={fade} custom={0.85}>ELDER CARE</motion.text>
            <motion.text x="506" y="4228" textAnchor="end" fontSize="7.5" fill={INK} opacity="0.5" className="survey-mono"
              variants={fade} custom={0.9}>NEXT</motion.text>
            {/* the one truthful business line, as a mono survey annotation */}
            <motion.line x1="193" y1="4399" x2="199" y2="4399" stroke={INK} strokeWidth="1" opacity="0.5"
              variants={draw} custom={0.9} />
            <motion.text x="204" y="4402" fontSize="9" fill={INK} opacity="0.75" className="survey-mono"
              variants={fade} custom={0.95}>{BUSINESS_LINE}</motion.text>
          </motion.g>

          {/* — panel 7: bare paper; the small drawn stack of forms, alone — */}
          <motion.g initial={rm ? false : { opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.9, ease: "easeOut" }}>
            <path d="M64 4760 h116 v84 h-116 Z" stroke={INK} strokeWidth="1.3" fill="none"
              transform="rotate(-2 122 4802)" />
            <path d="M56 4772 h116 v84 h-116 Z" stroke={INK} strokeWidth="1.3" fill="none"
              transform="rotate(1.4 114 4814)" />
            <path d="M48 4784 h116 v84 h-116 Z" stroke={INK} strokeWidth="1.4" fill="none" />
            <line x1="60" y1="4806" x2="148" y2="4806" stroke={INK} strokeWidth="0.9" opacity="0.55" />
            <line x1="60" y1="4824" x2="140" y2="4824" stroke={INK} strokeWidth="0.9" opacity="0.55" />
            <line x1="60" y1="4842" x2="126" y2="4842" stroke={INK} strokeWidth="0.9" opacity="0.55" />
          </motion.g>

          {/* — hero sprout: the masthead plant, same stroke voice, above ground — */}
          <g stroke={TEAL} strokeWidth="2" strokeLinecap="round">
            <path d="M250 600 C250 589 250 579 250 568" />
            <path d="M250 568 C244 555 232 547 220 545" />
            <path d="M250 568 C256 553 268 546 280 545" />
          </g>

          {/* — THE MASTER LINE: the living root, scrubbed by scroll, never un-drawn — */}
          <motion.path
            ref={masterRef}
            d={SPINE_D}
            stroke={TEAL}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            style={
              rm
                ? undefined
                : {
                    strokeDasharray: spineLen || 1,
                    strokeDashoffset: dashOff,
                    opacity: ready ? 1 : 0,
                  }
            }
          />

          {/* — panel 8: seed node, then the sprout drawn upward at full size — */}
          <motion.circle cx="247" cy="5541" r="6" fill="none" stroke={TEAL} strokeWidth="2"
            style={rm ? undefined : { opacity: seedOp }} />
          <g stroke={TEAL} strokeWidth="3" strokeLinecap="round" fill="none">
            <motion.path d={SPROUT_STEM} style={sproutStyle(stemLen)} />
            <motion.path d={SPROUT_LEAF_L} style={sproutStyle(leafLLen)} />
            <motion.path d={SPROUT_LEAF_R} style={sproutStyle(leafRLen)} />
          </g>
        </svg>

        {/* ————— HTML annotations, seated beside the drawing like plate captions ————— */}

        <Annot x={0} y={70} w={520} align="center">
          <span className="survey-badge survey-mono">{PANELS[0].badge}</span>
        </Annot>
        <Annot x={42} y={240} w={436} align="center">
          <motion.h1
            className="survey-h survey-h--hero"
            initial={rm ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {PANELS[0].text}
          </motion.h1>
        </Annot>

        <Head rm={rm} q={PANELS[0].tooltip} x={36} y={632} w={448} text={PANELS[1].text} />
        <Head rm={rm} q={PANELS[1].tooltip} x={104} y={1828} w={330} text={PANELS[2].text} />
        <Head rm={rm} q={PANELS[2].tooltip} x={36} y={2296} w={448} text={PANELS[3].text} />
        <Head rm={rm} q={PANELS[3].tooltip} x={36} y={3046} w={448} text={PANELS[4].text} />
        <Head rm={rm} q={PANELS[4].tooltip} x={36} y={3838} w={448} text={PANELS[5].text} />

        {/* panel 5: the tappable filing line + the source note it traces to */}
        <Annot x={84} y={3530} w={276}>
          <button
            type="button"
            className={`survey-filing${effTraced ? " is-traced" : ""}`}
            onClick={() => setTraced(true)}
            aria-pressed={effTraced}
          >
            <span className="survey-filing-line">{TRACE_EXAMPLE.filingLine}</span>
          </button>
        </Annot>
        <motion.div
          className="survey-abs survey-note"
          style={{
            left: pctX(262),
            top: pctY(3250),
            width: pctX(222),
            pointerEvents: effTraced ? "auto" : "none",
          }}
          initial={false}
          animate={{ opacity: effTraced ? 1 : 0 }}
          transition={{ duration: 0.5, delay: effTraced ? 1.2 : 0 }}
        >
          {TRACE_EXAMPLE.sourceNote}
        </motion.div>

        {/* panel 7: Jaden's words beside the drawn stack — nothing else */}
        <Annot x={240} y={4756} w={252} q={PANELS[5].tooltip} rm={rm}>
          <motion.p
            className="survey-p7"
            initial={rm ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {PANELS[6].text}
          </motion.p>
          <motion.p
            className="survey-p7attr survey-mono"
            initial={rm ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {PANELS[6].attribution}
          </motion.p>
        </Annot>

        {/* panel 8: the brand completes, then the CTA */}
        <motion.div
          className="survey-abs survey-wordmark"
          style={{ left: pctX(0), top: pctY(5596), width: pctX(520), opacity: rm ? 1 : wordOp }}
        >
          <Logo height={36} />
        </motion.div>
        <Annot x={30} y={5690} w={460} align="center">
          <motion.div
            className="survey-cta"
            initial={rm ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6 }}
          >
            <a className="survey-btn survey-btn--primary" href="#">
              {PANELS[7].text}
            </a>
            <a className="survey-btn survey-btn--secondary" href="mailto:">
              {PANELS[7].secondary}
            </a>
          </motion.div>
        </Annot>

        {/* the gold question label riding the pen tip — one alive at a time */}
        {!rm && ready && (
          <motion.div
            className="survey-tip survey-mono"
            style={{ left: penLeft, top: penTop }}
            initial={false}
            animate={{ opacity: activeQ >= 0 ? 1 : 0 }}
            transition={{ duration: 0.35 }}
            aria-hidden="true"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={activeQ >= 0 ? activeQ : lastQ.current}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {PANELS[activeQ >= 0 ? activeQ : lastQ.current].tooltip}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}
