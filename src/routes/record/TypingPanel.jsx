// Panel 2 — The Same Sentence Four Times. Pinned scroll, capped ~8s.
// Retype 1 plays in full with a blinking cursor; retypes 2/3/4 land at
// accelerating compression; a fifth begins and freezes mid-word (panel 3's cue).
// DOM only.
import { useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { PANELS } from "../../copy.js";
import { Stratum, QuestionPill, useRecord } from "./shared.jsx";

const S = PANELS[1].text;
const FREEZE_AT = S.indexOf("notes") + 2; // stops mid-word: "…case no"
// [startProgress, endProgress, targetChars] — each retype faster than the last.
const SEGS = [
  [0.03, 0.4, S.length],
  [0.46, 0.62, S.length],
  [0.66, 0.76, S.length],
  [0.8, 0.845, S.length], // nearly stamps in
  [0.88, 0.955, FREEZE_AT],
];
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export default function TypingPanel({ depthLabel, secRef }) {
  const { reduced } = useRecord();
  const ownRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ownRef,
    offset: ["start start", "end end"],
  });
  const [counts, setCounts] = useState([0, 0, 0, 0, 0]);
  const [frozen, setFrozen] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = SEGS.map(([a, b, len]) =>
      Math.round(clamp01((v - a) / (b - a)) * len)
    );
    setCounts((prev) => (prev.some((c, i) => c !== next[i]) ? next : prev));
    setFrozen(v >= SEGS[4][1]);
  });

  return (
    <section
      id="rec-p2"
      ref={(el) => {
        ownRef.current = el;
        if (secRef) secRef(el);
      }}
      className="rec-sec rec-ink"
      style={{ height: reduced ? "auto" : "290vh" }}
      aria-label="Panel 2"
    >
      <Stratum label={depthLabel} />
      <div className={reduced ? "rec-static-block" : "rec-sticky"}>
        <div className="rec-type-wrap">
          <p className="rec-sr">{S}</p>
          <div aria-hidden="true">
            {SEGS.map((seg, i) => {
              const c = reduced ? seg[2] : counts[i];
              const isLast = i === SEGS.length - 1;
              const started = reduced || c > 0;
              const typing = !reduced && c > 0 && c < seg[2];
              const showCursor =
                !reduced && started && (typing || (isLast && c > 0));
              return (
                <div
                  key={i}
                  className={`rec-typeline${started ? "" : " pending"}`}
                >
                  <span className="rec-typenum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="rec-ghost">{S}</span>
                  <span className="rec-typed">
                    {S.slice(0, c)}
                    {showCursor && (
                      <span
                        className={`rec-cursor${
                          isLast && frozen ? " frozen" : ""
                        }`}
                      />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <QuestionPill question={PANELS[1].tooltip} nextId="rec-p3" float />
    </section>
  );
}
