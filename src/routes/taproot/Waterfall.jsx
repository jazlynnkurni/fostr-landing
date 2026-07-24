// Waterfall.jsx — a real physics waterfall (matter-js) rendered as ascii pixels.
// Water particles rain from a source, fall under gravity, collide with two slanted
// funnel walls that channel them to a narrow outlet, then stream down a short chute
// and fall free. Each particle is quantized to a screen cell and drawn as a teal dot
// (brighter/mint the faster it moves). This is the hero waterfall; it flows because
// it is actually simulated, not shaped.
import { useEffect, useRef } from "react";
import Matter from "matter-js";

const { Engine, Composite, Bodies, Body } = Matter;

const RAMP = ["#2A6C6B", "#3D8584", "#5DA1A1", "#83BBBA", "#AFD7D5"];
const CORE = "#DFF9F3";
const CELL = 9;        // css px per ascii cell
const MAX = 1100;      // particle cap (wide full-width sheet needs more water)

export default function Waterfall() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const engine = Engine.create();
    engine.gravity.y = 1.05;
    const world = engine.world;

    let W = 0, H = 0, emitRate = 6;
    const parts = [];
    let walls = [];

    function wallSeg(x1, y1, x2, y2, thick) {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      return Bodies.rectangle(cx, cy, len, thick, { isStatic: true, angle: ang, friction: 0.0, restitution: 0.0 });
    }

    // The funnel geometry (in CSS px): wide mouth -> narrow outlet -> short vertical chute.
    let mouthY, outletY, chuteEndY, cx, mouthHalf, outletHalf, emitY, emitHalf;
    function layout() {
      cx = W * 0.5;
      mouthY = H * 0.42;          // safely below the top-anchored headline
      outletY = H * 0.70;
      chuteEndY = H * 0.88;
      mouthHalf = W * 0.46;       // spread nearly port-to-port, then converge to center
      outletHalf = Math.max(W * 0.02, 22);
      emitY = mouthY - 24;
      emitHalf = mouthHalf * 0.97; // rain across the whole width
      emitRate = Math.max(6, Math.round(emitHalf / 26)); // more emitters across a wider sheet
    }

    function buildWalls() {
      walls.forEach((w) => Composite.remove(world, w));
      layout();
      walls = [
        // funnel V
        wallSeg(cx - mouthHalf, mouthY, cx - outletHalf, outletY, 7),
        wallSeg(cx + mouthHalf, mouthY, cx + outletHalf, outletY, 7),
        // short vertical chute below the outlet
        wallSeg(cx - outletHalf, outletY, cx - outletHalf, chuteEndY, 6),
        wallSeg(cx + outletHalf, outletY, cx + outletHalf, chuteEndY, 6),
      ];
      Composite.add(world, walls);
    }

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      buildWalls();
    }

    function spawn(n) {
      for (let i = 0; i < n; i++) {
        if (parts.length >= MAX) break;
        const x = cx + (Math.random() - 0.5) * 2 * emitHalf;
        const p = Bodies.circle(x, emitY - Math.random() * 20, 2.6, {
          friction: 0.0,
          frictionAir: 0.004,
          restitution: 0.12,
          collisionFilter: { group: -1 }, // particles pass through each other (cheap, dense)
        });
        Body.setVelocity(p, { x: (Math.random() - 0.5) * 0.8, y: 2.4 + Math.random() * 2.2 });
        parts.push(p);
        Composite.add(world, p);
      }
    }

    // pre-fill so the waterfall is already pouring on first paint
    function prime(steps) {
      for (let s = 0; s < steps; s++) {
        spawn(emitRate);
        Engine.update(engine, 1000 / 60);
        recycle();
      }
    }

    function recycle() {
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].position.y > H + 24) {
          Composite.remove(world, parts[i]);
          parts.splice(i, 1);
        }
      }
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const c = CELL * dpr, gap = Math.max(1, Math.round(dpr));
      const best = new Map(); // cellKey -> brightness t
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const sx = p.position.x * dpr, sy = p.position.y * dpr;
        if (sx < 0 || sy < 0 || sx > canvas.width || sy > canvas.height) continue;
        const gx = Math.floor(sx / c), gy = Math.floor(sy / c);
        const spd = Math.hypot(p.velocity.x, p.velocity.y);
        const t = Math.min(1, 0.42 + spd * 0.05);
        const key = gy * 100000 + gx;
        const prev = best.get(key);
        if (prev === undefined || t > prev) best.set(key, t);
      }
      best.forEach((t, key) => {
        const gx = key % 100000, gy = Math.floor(key / 100000);
        ctx.fillStyle = t > 0.965 ? CORE : RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))];
        ctx.fillRect(gx * c, gy * c, c - gap, c - gap);
      });
    }

    let raf = 0, running = true, acc = 0;
    function loop() {
      if (running) {
        acc += 1;
        spawn(emitRate);
        Engine.update(engine, 1000 / 60);
        recycle();
        render();
      }
      raf = requestAnimationFrame(loop);
    }

    resize();
    prime(130);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    if (reduced) {
      render(); // one static frame of the primed pour
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      Composite.clear(world, false);
      Engine.clear(engine);
    };
  }, []);

  return <canvas ref={ref} aria-hidden style={{ width: "100%", height: "100%", display: "block" }} />;
}
