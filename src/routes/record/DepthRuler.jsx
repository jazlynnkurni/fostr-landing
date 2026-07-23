// Fixed left-rail depth ruler: reads as a core sample, doubles as skip-nav.
// Answered questions tick teal. Hidden on small screens (CSS).
import { motion, useTransform } from "framer-motion";
import { useRecord } from "./shared.jsx";

const NUMS = ["01", "02", "03", "04", "05", "06", "07", "08"];

export default function DepthRuler({ progress, fractions, activeIdx, railColor }) {
  const { scrollToId } = useRecord();
  const markerTop = useTransform(progress, (v) => `${(v * 100).toFixed(2)}%`);
  return (
    <motion.nav
      className="rec-ruler"
      aria-label="Depth navigation"
      style={{ color: railColor }}
    >
      <div className="rec-ruler-rail">
        <motion.div
          className="rec-ruler-marker"
          style={{ top: markerTop }}
          aria-hidden="true"
        />
        {fractions.map((f, i) => {
          // The question of panel i is answered once panel i+1 is reached.
          const answered = i < 6 && activeIdx > i;
          const current = activeIdx === i;
          return (
            <button
              key={NUMS[i]}
              type="button"
              className={`rec-tick${answered ? " answered" : ""}${current ? " current" : ""}`}
              style={{ top: `${(Math.min(1, Math.max(0, f)) * 100).toFixed(2)}%` }}
              onClick={() => scrollToId(`rec-p${i + 1}`)}
              aria-label={`Skip to panel ${i + 1}`}
              aria-current={current ? "true" : undefined}
            >
              <span className="rec-tick-line" aria-hidden="true" />
              <span className="rec-tick-num">{NUMS[i]}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
