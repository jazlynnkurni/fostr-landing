// Panel 4 — The Split. The sentence appears once, ExtraBold, center; on scrub
// four teal rules branch downward into four columns that typeset themselves
// simultaneously (greeked lines: typographic, not decorative).
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { PANELS, DEMO_DOCS } from "../../copy.js";
import { Stratum, QuestionPill, useRecord } from "./shared.jsx";

const BAR_WIDTHS = [
  [92, 74, 86, 58],
  [84, 90, 66, 78],
  [88, 62, 80, 70],
  [76, 86, 58, 90],
];

function Grow({ mv, at, span = 0.08, axis = "y", className }) {
  const { reduced } = useRecord();
  const scale = useTransform(mv, [at, at + span], [0, 1]);
  const opacity = useTransform(mv, [at, at + span * 0.5], [0, 1]);
  if (reduced) return <div className={className} />;
  const key = axis === "y" ? "scaleY" : "scaleX";
  return <motion.div className={className} style={{ [key]: scale, opacity }} />;
}

function Bar({ mv, at, width }) {
  const { reduced } = useRecord();
  const scaleX = useTransform(mv, [at, at + 0.05], [0, 1]);
  const opacity = useTransform(mv, [at, at + 0.03], [0, 1]);
  if (reduced) return <div className="rec-greek" style={{ width: `${width}%` }} />;
  return (
    <motion.div
      className="rec-greek"
      style={{ width: `${width}%`, scaleX, opacity }}
    />
  );
}

function DocColumn({ mv, name, widths }) {
  const { reduced } = useRecord();
  const opacity = useTransform(mv, [0.36, 0.44], [0, 1]);
  return (
    <div className="rec-doc-col">
      <Grow mv={mv} at={0.27} span={0.09} axis="y" className="rec-drop" />
      {reduced ? (
        <span className="rec-doc-name">{name}</span>
      ) : (
        <motion.span className="rec-doc-name" style={{ opacity }}>
          {name}
        </motion.span>
      )}
      {widths.map((w, j) => (
        <Bar key={j} mv={mv} at={0.42 + j * 0.09} width={w} />
      ))}
    </div>
  );
}

export default function SplitPanel({ depthLabel, secRef }) {
  const { reduced } = useRecord();
  const ownRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ownRef,
    offset: ["start start", "end end"],
  });
  return (
    <section
      id="rec-p4"
      ref={(el) => {
        ownRef.current = el;
        if (secRef) secRef(el);
      }}
      className="rec-sec rec-paper"
      style={{ height: reduced ? "auto" : "230vh" }}
      aria-label="Panel 4"
    >
      <Stratum label={depthLabel} />
      <div className={reduced ? "rec-static-block" : "rec-sticky"}>
        <div className="rec-split-wrap">
          <h2 className="rec-split-h">{PANELS[3].text}</h2>
          <Grow mv={scrollYProgress} at={0.06} span={0.08} axis="y" className="rec-stem" />
          <Grow mv={scrollYProgress} at={0.15} span={0.1} axis="x" className="rec-crossbar" />
          <div className="rec-doc-grid">
            {DEMO_DOCS.map((name, i) => (
              <DocColumn
                key={name}
                mv={scrollYProgress}
                name={name}
                widths={BAR_WIDTHS[i]}
              />
            ))}
          </div>
        </div>
      </div>
      <QuestionPill question={PANELS[3].tooltip} nextId="rec-p5" float />
    </section>
  );
}
