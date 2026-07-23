// CONCEPT 5 — WORKLIGHT (hybrid light-led). See docs/concepts.md.
// You carry the light down the shaft; everything the beam has touched keeps glowing.
import { useEffect, useMemo } from "react";
import { useMotionValue } from "framer-motion";
import Lenis from "lenis";
import BeamCanvas from "./BeamCanvas.jsx";
import Panels from "./Panels.jsx";
import { TOTAL } from "./shader.js";
import "./worklight.css";

function useStaticMode() {
  // Reduced motion / WebGL failure: the whole story survives as lit vignettes
  // with fully grown roots, ending on the full-network still.
  return useMemo(() => {
    if (typeof window === "undefined") return true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let gl = false;
    try {
      const c = document.createElement("canvas");
      gl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (e) {
      gl = false;
    }
    return reduced || !gl;
  }, []);
}

export default function Worklight() {
  const staticMode = useStaticMode();

  // Scroll progress in 100vh units; in static mode everything resolves fully lit.
  const sv = useMotionValue(staticMode ? 1000 : 0);
  const maxSv = useMotionValue(staticMode ? 1000 : 0); // highest depth reached → afterglow
  const switchMV = useMotionValue(staticMode ? 1 : 0); // panel-8 switch-on

  useEffect(() => {
    window.scrollTo(0, 0);
    if (staticMode) return undefined;
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    const docEl = document.documentElement;
    let raf = 0;
    const loop = (time) => {
      lenis.raf(time);
      // Derive the vh unit from the real document so shader depths stay
      // aligned with the panels even when content stretches a section.
      const vhPx = Math.max(1, docEl.scrollHeight / TOTAL);
      const s = (window.scrollY || docEl.scrollTop || 0) / vhPx;
      sv.set(s);
      if (s > maxSv.get()) maxSv.set(s);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [staticMode, sv, maxSv]);

  return (
    <main className={"wl-root" + (staticMode ? " wl-static" : "")}>
      {!staticMode && <BeamCanvas sv={sv} maxSv={maxSv} switchMV={switchMV} />}
      <Panels sv={sv} maxSv={maxSv} switchMV={switchMV} staticMode={staticMode} />
    </main>
  );
}
