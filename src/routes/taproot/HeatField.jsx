// HeatField — the hero's living pixel band, after craft.wild.as's thermal grid.
// Canvas-2D heat simulation on a coarse cell grid: the cursor injects heat, heat
// diffuses to neighbors and decays, and each cell renders as a hard-quantized
// square from a Fostr turquoise ramp (deep ink-teal at faint heat, brand teal in
// the middle, a pale mint core where it burns). Per-cell jitter gives the
// speckled dithered edges. Pre-seeded with diagonal streaks so it is alive at load.
import { useEffect, useRef } from "react";

const RAMP = ["#143A39", "#1D5150", "#2A6C6B", "#3D8584", "#5DA1A1", "#83BBBA", "#AFD7D5"];
const CORE = "#E2FBF6";      // the burning cursor core
const CELL = 16;             // css px per cell (1px white gap keeps the grid visible)
const DECAY = 0.994;
const DIFFUSE = 0.30;        // neighbor mixing per frame
const BRUSH_R = 3.4;         // cells
const VISIBLE_T = 0.06;      // below this heat a cell is bare paper

function hash(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function HeatField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0, rows = 0, heat = null, tmp = null, jit = null;
    let raf = 0, running = true, frame = 0;
    const ptr = { cx: -99, cy: -99, pcx: -99, pcy: -99, inside: false };

    // Diagonally-streaked value noise so the band loads already alive.
    function seed() {
      const g = 24;
      const n = new Float32Array((g + 2) * (g + 2));
      for (let i = 0; i < n.length; i++) n[i] = hash(i * 7.13);
      const at = (x, y) => {
        const xi = Math.floor(x) % g, yi = Math.floor(y) % g;
        const fx = x - Math.floor(x), fy = y - Math.floor(y);
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const i = yi * (g + 2) + xi;
        return (n[i] * (1 - sx) + n[i + 1] * sx) * (1 - sy) + (n[i + g + 2] * (1 - sx) + n[i + g + 3] * sx) * sy;
      };
      const W = (x, y) => at(((x % g) + g) % g, ((y % g) + g) % g);
      // Build the raw field first, then threshold at a fixed percentile so ~55% of the
      // band is alive on every load, whatever the noise decided to do.
      const vals = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const n1 = W(x * 0.17, y * 0.24);
          const n2 = W((x + y * 1.25) * 0.11, (y - x * 0.35) * 0.16 + 9.7);
          const n3 = W(x * 0.45 + 4.2, y * 0.5 + 17.3);
          vals[y * cols + x] = n1 * 0.48 + n2 * 0.37 + n3 * 0.15;
        }
      }
      const sorted = Array.from(vals).sort((a, b) => a - b);
      const t0 = sorted[Math.floor(sorted.length * 0.42)];
      const t1 = sorted[sorted.length - 1];
      const span = Math.max(1e-4, t1 - t0);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const fall = 0.3 + 0.7 * Math.max(0, 1 - y / (rows * 1.1));    // strongest at the top edge
          const norm = (vals[i] - t0) / span;
          // sqrt lifts the low end so just-alive cells hold mid heat instead of dying in seconds
          heat[i] = norm <= 0 ? 0 : Math.min(0.92, (0.18 + Math.sqrt(norm) * 0.74) * fall);
        }
      }
    }

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      cols = Math.max(8, Math.ceil(r.width / CELL));
      rows = Math.max(6, Math.ceil(r.height / CELL));
      heat = new Float32Array(cols * rows);
      tmp = new Float32Array(cols * rows);
      jit = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) jit[i] = (hash(i * 3.7) - 0.5) * 0.16;
      seed();
      if (reduced) render();
    }

    function inject(cx, cy, amt) {
      const r = BRUSH_R;
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(cols - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(rows - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          const g = Math.exp(-d2 / (r * 0.9));
          const i = y * cols + x;
          heat[i] = Math.min(1.25, heat[i] + amt * g);
        }
      }
    }

    function step() {
      // diffuse
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const l = heat[y * cols + Math.max(0, x - 1)];
          const rr = heat[y * cols + Math.min(cols - 1, x + 1)];
          const u = heat[Math.max(0, y - 1) * cols + x];
          const d = heat[Math.min(rows - 1, y + 1) * cols + x];
          tmp[i] = (heat[i] * (1 - DIFFUSE) + ((l + rr + u + d) / 4) * DIFFUSE) * DECAY;
        }
      }
      const swap = heat; heat = tmp; tmp = swap;

      // cursor: heat follows the pointer, more heat with more speed
      if (ptr.inside) {
        const dx = ptr.cx - ptr.pcx, dy = ptr.cy - ptr.pcy;
        const dist = Math.min(14, Math.hypot(dx, dy));
        const steps = Math.max(1, Math.ceil(dist));
        for (let s = 0; s <= steps; s++) {
          inject(ptr.pcx + (dx * s) / steps, ptr.pcy + (dy * s) / steps, (0.30 + dist * 0.06) / steps);
        }
      }
      ptr.pcx = ptr.cx; ptr.pcy = ptr.cy;

      // simmer: the band never fully dies
      if (frame % 3 === 0) {
        for (let k = 0; k < 3; k++) {
          const x = Math.floor(hash(frame * 13.7 + k * 101) * cols);
          const y = Math.floor(hash(frame * 7.3 + k * 53) * rows * 0.5);
          heat[y * cols + x] = Math.min(1, heat[y * cols + x] + 0.05);
        }
      }
    }

    function render() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const c = CELL * dpr, gap = Math.max(1, Math.round(dpr));
      // the ground is a faint grid: gap-colored wash, cells painted white on top
      ctx.fillStyle = "#E7ECEB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const h = heat[i];
          if (h < VISIBLE_T) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x * c, y * c, c - gap, c - gap);
            continue;
          }
          if (h > 0.98) ctx.fillStyle = CORE;
          else {
            const v = Math.min(0.999, Math.max(0, h + jit[i]));
            let idx = Math.floor(Math.sqrt(v) * RAMP.length);          // mid heat holds mid color
            const sp = hash(i * 9.1);
            if (sp < 0.05) idx -= 3;                                    // chunky dark speckle
            else if (sp > 0.96) idx += 2;                               // stray bright cells
            idx = Math.min(RAMP.length - 1, Math.max(0, idx));
            ctx.fillStyle = RAMP[idx];
          }
          ctx.fillRect(x * c, y * c, c - gap, c - gap);
        }
      }
    }

    function loop() {
      if (running) { frame++; step(); render(); }
      raf = requestAnimationFrame(loop);
    }

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / CELL;
      const y = (e.clientY - r.top) / CELL;
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside && !ptr.inside) { ptr.pcx = x; ptr.pcy = y; }
      ptr.inside = inside;
      ptr.cx = x; ptr.cy = y;
    };
    const onLeave = () => { ptr.inside = false; };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { running = en.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden style={{ width: "100%", height: "100%", display: "block" }} />;
}
