// Shared typographic pieces for THE RECORD.
import { createContext, useContext, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export const RecordCtx = createContext({ scrollToId: () => {}, reduced: false });
export const useRecord = () => useContext(RecordCtx);

/* Full-width ruled stratum boundary with a small mono depth label. */
export function Stratum({ label }) {
  return (
    <div className="rec-stratum" aria-hidden="true">
      <span className="rec-label">{label}</span>
    </div>
  );
}

/* The Falling Question, purest form: one gold pill alive at a time.
   It sits at panel N's baseline, then falls with scroll on a scroll-linked
   transform only (no re-layout) and fades out as panel N+1's first line arrives. */
export function QuestionPill({ question, nextId, float = false }) {
  const { scrollToId, reduced } = useRecord();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.06"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "62vh"]);
  const opacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 1, 0]);

  if (reduced) {
    // Reduced motion: the question prints as a small gold caption.
    return <p className="rec-q-static">{question}</p>;
  }
  return (
    <div ref={ref} className={`rec-pill-slot${float ? " float" : ""}`}>
      <motion.button
        type="button"
        className="rec-pill"
        style={{ y, opacity }}
        onClick={() => scrollToId(nextId)}
        aria-label={`${question} — continue`}
      >
        {question}
        <span className="rec-pill-arrow" aria-hidden="true">
          ↓
        </span>
      </motion.button>
    </div>
  );
}

/* The two sprout strokes from the wordmark, at reading scale, drawn on view. */
export function Sprout({ width = 80 }) {
  const { reduced } = useRecord();
  const common = {
    fill: "none",
    stroke: "var(--teal)",
    strokeWidth: 2.2,
    strokeLinecap: "round",
  };
  const d1 = "M128.571 140V131.952C127.175 129.999 121.029 125.903 116 127.619";
  const d2 = "M128.571 131.952C130.899 129.222 137.79 125.698 141.143 127.485";
  return (
    <svg
      viewBox="113 123 31 19"
      width={width}
      role="img"
      aria-label="Fostr sprout"
      style={{ overflow: "visible", display: "block" }}
    >
      {reduced ? (
        <>
          <path d={d1} {...common} />
          <path d={d2} {...common} />
        </>
      ) : (
        <>
          <motion.path
            d={d1}
            {...common}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <motion.path
            d={d2}
            {...common}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          />
        </>
      )}
    </svg>
  );
}
