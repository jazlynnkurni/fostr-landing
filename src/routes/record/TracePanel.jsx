// Panel 5 — The Trace. A finished court-filing paragraph; on scroll-scrub each
// phrase of the produced line highlights and a teal SVG thread draws upward to
// a floating source snippet with a mono provenance tag. Hover drives it on desktop.
import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { PANELS, TRACE_EXAMPLE } from "../../copy.js";
import { Stratum, QuestionPill, useRecord } from "./shared.jsx";

const L = TRACE_EXAMPLE.filingLine;
// Split the verbatim line into three phrases by slicing (never retyped).
const CUT_1 = L.indexOf(" on March 14");
const CUT_2 = L.indexOf(" and reported");
const PHRASES = [L.slice(0, CUT_1), L.slice(CUT_1, CUT_2), L.slice(CUT_2)];
// Thread anchor x (viewBox %) per phrase, along the produced line.
const ANCHOR_X = [26, 54, 72];
const SEGS = [
  [0.18, 0.42],
  [0.42, 0.66],
  [0.66, 0.9],
];
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export default function TracePanel({ depthLabel, secRef }) {
  const { reduced } = useRecord();
  const ownRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ownRef,
    offset: ["start start", "end end"],
  });
  const [scrub, setScrub] = useState({ idx: -1, drawn: 0 });
  const [hoverIdx, setHoverIdx] = useState(null);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let idx = -1;
    let drawn = 0;
    SEGS.forEach(([a, b], i) => {
      if (v >= a) {
        idx = i;
        drawn = clamp01((v - a) / ((b - a) * 0.45));
      }
    });
    drawn = Math.round(drawn * 50) / 50;
    setScrub((prev) =>
      prev.idx === idx && prev.drawn === drawn ? prev : { idx, drawn }
    );
  });

  const active = reduced ? 0 : hoverIdx != null ? hoverIdx : scrub.idx;
  const pathLength = reduced ? 1 : hoverIdx != null ? 1 : scrub.drawn;
  const x = ANCHOR_X[Math.max(0, active)];
  const d = `M ${x} 72 C ${x} 54, 74 52, 74 40`;

  return (
    <section
      id="rec-p5"
      ref={(el) => {
        ownRef.current = el;
        if (secRef) secRef(el);
      }}
      className="rec-sec rec-paper"
      style={{ height: reduced ? "auto" : "270vh" }}
      aria-label="Panel 5"
    >
      <Stratum label={depthLabel} />
      <div className={reduced ? "rec-static-block" : "rec-sticky"}>
        <div className="rec-trace-wrap">
          <h2 className="rec-trace-h">{PANELS[4].text}</h2>
          <div className="rec-trace-stage">
            {active >= 0 && (
              <svg
                className="rec-thread-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d={d}
                  fill="none"
                  stroke="var(--teal)"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  style={{ pathLength }}
                />
              </svg>
            )}
            <motion.aside
              className="rec-source-card"
              style={reduced ? undefined : { opacity: active >= 0 ? 1 : 0.25 }}
              aria-label="Source note"
            >
              <span className="rec-prov">{TRACE_EXAMPLE.provenance}</span>
              <p>{TRACE_EXAMPLE.sourceNote}</p>
            </motion.aside>
            <figure className="rec-filing">
              <span className="rec-filing-head">
                Family Court · Placement Review · Draft Filing
              </span>
              <p className="dim">
                The Department completed its scheduled visit and reviewed the
                placement record in full.
              </p>
              <p>
                {PHRASES.map((ph, i) => (
                  <span
                    key={i}
                    className={`rec-phrase${active === i ? " active" : ""}`}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    onFocus={() => setHoverIdx(i)}
                    onBlur={() => setHoverIdx(null)}
                    tabIndex={0}
                  >
                    {ph}
                  </span>
                ))}
              </p>
              <p className="dim">
                The Department recommends that the current placement continue as
                ordered.
              </p>
            </figure>
          </div>
        </div>
      </div>
      <QuestionPill question={PANELS[4].tooltip} nextId="rec-p6" float />
    </section>
  );
}
