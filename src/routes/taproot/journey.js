// journey.js — scroll choreography constants shared by the DOM layer (Taproot.jsx)
// and the canvas layer (Scene.jsx). One scroll progress value (0..1) drives everything.

// Section heights in vh. Panels 4/5/7 get extra room for the branch, the trace scrub,
// and the quiet arrival at the seed. Total ~900vh.
export const SECTION_VHS = [100, 100, 100, 120, 160, 100, 120, 100];

const TOTAL = SECTION_VHS.reduce((a, b) => a + b, 0);
export const TOTAL_VH = TOTAL;

// Panel boundaries as fractions of total scroll: PB[i] = start of panel i (0-indexed), PB[8] = 1.
export const PB = SECTION_VHS.reduce(
  (acc, h) => {
    acc.push(acc[acc.length - 1] + h / TOTAL);
    return acc;
  },
  [0]
);
PB[PB.length - 1] = 1;

// Camera y keyframes over scroll progress. Descent slows almost to a stop for
// panel 3 (stillness) and panel 5 (the trace), and settles at the seed for 7/8.
export const CAM_KEYS = [
  [0, 7.0],
  [PB[1], 0.2],
  [PB[2], -5.2],
  [PB[3], -6.2],
  [PB[4], -11.0],
  [PB[5], -12.0],
  [PB[6], -19.0],
  [PB[7], -24.6],
  [1, -24.9],
];

export function piecewise(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      const u = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * u;
    }
  }
  return keys[keys.length - 1][1];
}

export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Record-label depth markers, one per panel ("" = none).
export const DEPTH_MARKS = ["", "−6 M · CASE NOTES", "−9 M", "−12 M", "−15 M", "−19 M", "−25 M", ""];
