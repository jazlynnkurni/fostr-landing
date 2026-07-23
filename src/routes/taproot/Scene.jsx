// Scene.jsx — the Taproot borehole. Hard rule from the concept: the canvas renders
// root, soil and light ONLY. All text and all documents are DOM; this file projects
// 3D anchor points to screen space each frame and positions/fades the DOM overlays
// (tooltip pill, four document cards, filing + source cards) via refs. No React
// state is touched on scroll.
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PB, CAM_KEYS, piecewise, clamp01 } from "./journey.js";
import { PANELS } from "../../copy.js";

const V = new THREE.Vector3();
const WARM = new THREE.Color("#2E2418"); // panel-8 daylight-adjacent warmth

// Vertical fog ramp keyed on camera depth: paper -> umber -> soil -> bedrock.
// Mirrors the CSS tokens --paper --umber --soil --bedrock in src/index.css.
const BG_STOPS = [
  [2.0, new THREE.Color("#F7F5F1")],
  [0.4, new THREE.Color("#F2EEE6")],
  [-0.8, new THREE.Color("#96795C")],
  [-3.5, new THREE.Color("#8A6F55")],
  [-7.5, new THREE.Color("#5E4A38")],
  [-11.5, new THREE.Color("#463829")],
  [-15.5, new THREE.Color("#3E322A")],
  [-19.5, new THREE.Color("#2A211C")],
  [-23.5, new THREE.Color("#191412")],
  [-27.0, new THREE.Color("#191412")],
];

function rampColor(y, out) {
  if (y >= BG_STOPS[0][0]) return out.copy(BG_STOPS[0][1]);
  for (let i = 1; i < BG_STOPS.length; i++) {
    if (y >= BG_STOPS[i][0]) {
      const [y0, c0] = BG_STOPS[i - 1];
      const [y1, c1] = BG_STOPS[i];
      return out.copy(c0).lerp(c1, (y0 - y) / (y0 - y1));
    }
  }
  return out.copy(BG_STOPS[BG_STOPS.length - 1][1]);
}

// The taproot: one slightly wandering curve from just above the horizon to the seed.
const MAIN_PTS = [
  [0.0, 0.5, 0.0],
  [-0.25, -2.2, 0.15],
  [0.35, -4.6, -0.2],
  [-0.3, -7.2, 0.25],
  [0.3, -10.0, 0.0], // branch node (panel 4)
  [-0.35, -12.8, -0.2],
  [0.25, -15.4, 0.2],
  [-0.3, -18.5, -0.15], // lateral node (panel 6)
  [0.2, -21.0, 0.15],
  [-0.15, -23.2, -0.1],
  [0.05, -25.2, 0.0], // the seed (panel 7)
];
const NODE_INDEX = 4;
const LATERAL_INDEX = 7;

// Inverse lookup: world y -> fraction along the curve (y decreases monotonically).
function fractionAtY(lut, y) {
  const N = lut.length;
  if (y >= lut[0]) return 0;
  for (let i = 1; i < N; i++) {
    if (lut[i] <= y) {
      const y0 = lut[i - 1];
      const y1 = lut[i];
      const u = y0 === y1 ? 0 : (y0 - y) / (y0 - y1);
      return (i - 1 + u) / (N - 1);
    }
  }
  return 1;
}

const BANDS = [-2.3, -7.9, -13.7, -18.9, -23.3]; // faint sediment boundaries

function World({ progress, bridge }) {
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);

  const rootRef = useRef();
  const tipRef = useRef();
  const traceRef = useRef();
  const shootRef = useRef();
  const branchRefs = useRef([]);
  const endSphereRefs = useRef([]);
  const nodeRefs = useRef([]);
  const lateralRefs = useRef([]);
  const maxBranch = useRef([0, 0, 0, 0]); // branches never un-grow
  const maxLat = useRef(0);
  const maxShoot = useRef(0);
  const lastPill = useRef("");

  const { mainCurve, lut, node, latNode, seed, gPause } = useMemo(() => {
    const pts = MAIN_PTS.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    const N = 512;
    const table = new Float32Array(N);
    for (let i = 0; i < N; i++) table[i] = curve.getPointAt(i / (N - 1)).y;
    return {
      mainCurve: curve,
      lut: table,
      node: pts[NODE_INDEX],
      latNode: pts[LATERAL_INDEX],
      seed: pts[pts.length - 1],
      // growth freezes at this fraction through panel 3 (stillness)
      gPause: fractionAtY(table, piecewise(CAM_KEYS, PB[2]) - 1.6),
    };
  }, []);

  const rootGeom = useMemo(() => new THREE.TubeGeometry(mainCurve, 280, 0.12, 8, false), [mainCurve]);

  // Branch endpoints depend on viewport aspect so the four cards stay on screen
  // (2x2 on narrow phones, 4 across on desktop). Bucketed to avoid rebuild churn.
  const aBucket = Math.round(Math.min(Math.max(size.width / size.height, 0.4), 2.4) * 4) / 4;
  const branchStuff = useMemo(() => {
    const halfH = Math.tan((25 * Math.PI) / 180) * (7 - 0.6); // camera z=7, endpoints z=0.6
    const halfW = halfH * aBucket;
    const narrow = aBucket < 0.9;
    const xs = narrow ? [-0.48, 0.48, -0.48, 0.48] : [-0.78, -0.3, 0.3, 0.78];
    const dy = narrow ? [-1.7, -1.7, -3.15, -3.15] : [-2.4, -2.9, -2.9, -2.4];
    const endpoints = xs.map((fx, i) => new THREE.Vector3(fx * halfW * 0.9, node.y + dy[i], 0.6));
    const curves = endpoints.map(
      (e) =>
        new THREE.CatmullRomCurve3([
          node.clone(),
          new THREE.Vector3(node.x + (e.x - node.x) * 0.35, node.y - 1.1, 0.3),
          e,
        ])
    );
    const geoms = curves.map((c) => new THREE.TubeGeometry(c, 48, 0.065, 6, false));
    // The panel-5 trace path: court-prep endpoint -> back up its filament -> up the taproot.
    const fNode = fractionAtY(lut, node.y + 0.02);
    const fSrc = fractionAtY(lut, -9.0);
    const tracePts = [];
    for (let i = 20; i >= 0; i--) tracePts.push(curves[2].getPoint(i / 20));
    for (let i = 1; i <= 16; i++) tracePts.push(mainCurve.getPointAt(fNode + (fSrc - fNode) * (i / 16)));
    const traceCurve = new THREE.CatmullRomCurve3(tracePts);
    return { endpoints, geoms, traceCurve, sourcePoint: mainCurve.getPointAt(fSrc) };
  }, [aBucket, lut, mainCurve, node]);

  useEffect(() => {
    const { geoms } = branchStuff;
    return () => geoms.forEach((g) => g.dispose());
  }, [branchStuff]);

  const lateralGeoms = useMemo(
    () =>
      [-1, 1].map((s) => {
        const c = new THREE.CatmullRomCurve3([
          latNode.clone(),
          new THREE.Vector3(s * 2.2, latNode.y - 0.5, -0.4),
          new THREE.Vector3(s * 6.5, latNode.y - 1.3, -0.9),
        ]);
        return new THREE.TubeGeometry(c, 40, 0.055, 6, false);
      }),
    [latNode]
  );

  const shootGeom = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      seed.clone(),
      new THREE.Vector3(seed.x - 0.18, seed.y + 1.1, 0.1),
      new THREE.Vector3(seed.x + 0.05, seed.y + 2.4, 0.0),
    ]);
    return new THREE.TubeGeometry(c, 40, 0.05, 6, false);
  }, [seed]);

  // Soil: one big vertex-colored gradient wall behind the root.
  const planeGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, 34, 1, 40);
    g.translate(0, -17, 0); // top edge at the horizon (y=0)
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      rampColor(pos.getY(i) + 0.6, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  // Small node spheres that pop in as the growth tip passes them.
  const nodes = useMemo(() => {
    const list = [
      [0.2, 0.09],
      [fractionAtY(lut, node.y + 0.02), 0.18],
      [0.6, 0.09],
      [fractionAtY(lut, latNode.y + 0.02), 0.13],
      [0.85, 0.08],
    ];
    return list.map(([f, r]) => ({ f, r, pos: mainCurve.getPointAt(f) }));
  }, [lut, mainCurve, node, latNode]);

  useEffect(() => {
    scene.background = new THREE.Color("#F7F5F1");
    scene.fog = new THREE.Fog(new THREE.Color("#F7F5F1"), 5.5, 17);
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene]);

  useFrame(({ camera, scene: sc, size: sz }) => {
    const b = bridge.current;
    const p = clamp01(progress.get());
    b.p = p;

    let ai = 0;
    for (let i = 0; i < 8; i++) if (p >= PB[i]) ai = i;
    b.activePanel = ai;
    const local = (p - PB[ai]) / (PB[ai + 1] - PB[ai]);

    // ---- camera dolly down the borehole
    const camY = piecewise(CAM_KEYS, p);
    camera.position.set(Math.sin(camY * 0.22) * 0.22, camY, 7);
    camera.updateMatrixWorld();

    // ---- vertical fog / background ramp (+ warm hint through panel 8)
    if (sc.background && sc.fog) {
      rampColor(camY, sc.background);
      if (p > PB[7]) sc.background.lerp(WARM, ((p - PB[7]) / (1 - PB[7])) * 0.55);
      sc.fog.color.copy(sc.background);
    }

    // ---- root growth: tracks the camera, pauses for panel 3, never un-grows
    let g = fractionAtY(lut, camY - 1.6);
    if (p < PB[3]) g = Math.min(g, gPause);
    g = Math.max(b.maxG, Math.min(g, 1));
    b.maxG = g;
    if (rootRef.current) rootRef.current.geometry.setDrawRange(0, Math.floor(g * 280) * 48);

    const tip = mainCurve.getPointAt(Math.max(g, 0.001));
    if (tipRef.current) {
      tipRef.current.position.copy(tip);
      const s = 1 - clamp01((g - 0.97) / 0.03); // no glow at the seed
      tipRef.current.scale.setScalar(Math.max(0.001, s * clamp01(g * 30)));
    }

    for (let i = 0; i < nodes.length; i++) {
      const el = nodeRefs.current[i];
      if (el) el.scale.setScalar(Math.max(0.001, clamp01((g - nodes[i].f) / 0.015)));
    }

    // ---- four bright filaments (panel 4), staggered, clamped to max reached
    for (let i = 0; i < 4; i++) {
      const raw = clamp01((p - (PB[3] + 0.015)) / ((PB[4] - PB[3]) * 0.62) - i * 0.1);
      const v = Math.max(maxBranch.current[i], raw);
      maxBranch.current[i] = v;
      const m = branchRefs.current[i];
      if (m) m.geometry.setDrawRange(0, Math.floor(v * 48) * 36);
      const es = endSphereRefs.current[i];
      if (es) es.scale.setScalar(Math.max(0.001, clamp01((v - 0.9) / 0.1)));
    }

    // ---- dim lateral galleries (panel 6)
    const lv = Math.max(maxLat.current, clamp01((p - PB[5]) / ((PB[6] - PB[5]) * 0.6)));
    maxLat.current = lv;
    for (let i = 0; i < 2; i++) {
      const m = lateralRefs.current[i];
      if (m) m.geometry.setDrawRange(0, Math.floor(lv * 40) * 36);
    }

    // ---- germination shoot (panel 8)
    const sv = Math.max(maxShoot.current, clamp01((p - (PB[7] + 0.015)) / ((1 - PB[7]) * 0.55)));
    maxShoot.current = sv;
    if (shootRef.current) shootRef.current.geometry.setDrawRange(0, Math.floor(sv * 40) * 36);

    // ---- panel 5: scrubbed trace, filing line -> light runs UP the root -> source note
    const t = clamp01((p - (PB[4] + 0.02)) / ((PB[5] - PB[4]) * 0.82));
    const inP5 = p > PB[4] - 0.02 && p < PB[5] + 0.02;
    if (traceRef.current) {
      traceRef.current.visible = inP5 && t > 0.001;
      if (traceRef.current.visible) traceRef.current.position.copy(branchStuff.traceCurve.getPointAt(t));
    }

    // ================= DOM sync layer =================
    const w = sz.width;
    const h = sz.height;
    const proj = (pt) => {
      V.copy(pt).project(camera);
      return [(V.x * 0.5 + 0.5) * w, (-V.y * 0.5 + 0.5) * h];
    };
    const els = b.els;

    // Gold tooltip pill: one alive at a time, tethered to the growth tip,
    // appears in the last stretch of each panel, dissolves into the next headline.
    if (els.pill) {
      let pillText = "";
      let pillO = 0;
      if (PANELS[ai].tooltip && local > 0.72) {
        pillText = PANELS[ai].tooltip;
        pillO = clamp01((local - 0.72) / 0.12);
        b.pillTarget = ai + 1;
      } else if (ai > 0 && PANELS[ai - 1].tooltip && local < 0.1) {
        pillText = PANELS[ai - 1].tooltip;
        pillO = 1 - local / 0.1;
        b.pillTarget = ai;
      }
      if (pillText && lastPill.current !== pillText) {
        els.pill.textContent = pillText;
        lastPill.current = pillText;
      }
      const [tx, ty] = proj(tip);
      const px = Math.min(Math.max(tx + 26, 90), w - 90);
      const py = Math.min(Math.max(ty - 20, h * 0.14), h * 0.84);
      els.pill.style.opacity = pillO.toFixed(3);
      els.pill.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -100%)`;
      els.pill.style.pointerEvents = pillO > 0.4 ? "auto" : "none";
    }

    // Four document cards fill in as their filaments arrive (panel 4).
    const docFadeOut = 1 - clamp01((p - (PB[4] + 0.005)) / 0.025);
    for (let i = 0; i < 4; i++) {
      const el = els.cards[i];
      if (!el) continue;
      const arrive = clamp01((maxBranch.current[i] - 0.86) / 0.14);
      const vis = p > PB[3] && p < PB[4] + 0.05 ? arrive * docFadeOut : 0;
      el.style.opacity = vis.toFixed(3);
      el.style.visibility = vis > 0.01 ? "visible" : "hidden";
      const [cx, cy] = proj(branchStuff.endpoints[i]);
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${(cy + 10).toFixed(1)}px, 0) translate(-50%, 0)`;
    }

    // Panel 5 overlays: court filing card (low), source note card (up near the root).
    const p5vis =
      p > PB[4] && p < PB[5] + 0.02
        ? clamp01((p - (PB[4] + 0.004)) / 0.018) * (1 - clamp01((p - (PB[5] - 0.018)) / 0.018))
        : 0;
    if (els.filing) {
      const [fx] = proj(branchStuff.endpoints[2]);
      const cx = Math.min(Math.max(fx, w * 0.5 - 120), w * 0.5 + 120);
      els.filing.style.opacity = p5vis.toFixed(3);
      els.filing.style.visibility = p5vis > 0.01 ? "visible" : "hidden";
      els.filing.style.transform = `translate3d(${cx.toFixed(1)}px, ${(h * 0.58).toFixed(1)}px, 0) translate(-50%, 0)`;
    }
    if (els.filingLine) {
      const hl = 0.1 + 0.26 * clamp01(t / 0.15);
      els.filingLine.style.background = `rgba(93,161,161,${hl.toFixed(3)})`;
    }
    if (els.source) {
      const [sx, sy] = proj(branchStuff.sourcePoint);
      const so = p5vis * clamp01((t - 0.68) / 0.2);
      els.source.style.opacity = so.toFixed(3);
      els.source.style.visibility = so > 0.01 ? "visible" : "hidden";
      const cw = els.source.offsetWidth || 320;
      const px = Math.min(Math.max(sx + 20, 12), w - cw - 12);
      const py = Math.min(Math.max(sy, h * 0.12), h * 0.42);
      els.source.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
    }
  });

  return (
    <>
      {/* soil gradient wall */}
      <mesh geometry={planeGeom} position={[0, 0, -4]}>
        <meshBasicMaterial vertexColors />
      </mesh>
      {/* thin dark horizon line */}
      <mesh position={[0, 0.02, -3.9]}>
        <planeGeometry args={[90, 0.08]} />
        <meshBasicMaterial color="#1E2624" />
      </mesh>
      {/* faint sediment bands doubling as panel markers */}
      {BANDS.map((y, i) => (
        <mesh key={i} position={[0, y, -3.92]}>
          <planeGeometry args={[90, 0.07]} />
          <meshBasicMaterial color="#B99B74" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      ))}

      {/* the taproot — the only saturated, emissive thing underground */}
      <mesh ref={rootRef} geometry={rootGeom}>
        <meshBasicMaterial color="#5DA1A1" />
      </mesh>
      {/* growth-tip glow */}
      <mesh ref={tipRef} scale={0.001}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#A8D8D3" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* node spheres */}
      {nodes.map((n, i) => (
        <mesh key={`n${i}`} ref={(el) => (nodeRefs.current[i] = el)} position={n.pos} scale={0.001}>
          <sphereGeometry args={[n.r, 12, 12]} />
          <meshBasicMaterial color="#5DA1A1" />
        </mesh>
      ))}

      {/* four bright filaments to the four documents */}
      {branchStuff.geoms.map((g2, i) => (
        <mesh key={`b${aBucket}-${i}`} ref={(el) => (branchRefs.current[i] = el)} geometry={g2}>
          <meshBasicMaterial color="#7CC4BF" />
        </mesh>
      ))}
      {branchStuff.endpoints.map((e, i) => (
        <mesh key={`e${aBucket}-${i}`} ref={(el) => (endSphereRefs.current[i] = el)} position={e} scale={0.001}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial color="#7CC4BF" />
        </mesh>
      ))}

      {/* dim lateral galleries — present, not yet lit */}
      {lateralGeoms.map((g2, i) => (
        <mesh key={`l${i}`} ref={(el) => (lateralRefs.current[i] = el)} geometry={g2}>
          <meshBasicMaterial color="#3E5A57" transparent opacity={0.65} />
        </mesh>
      ))}

      {/* the trace light that runs back UP the root (panel 5) */}
      <group ref={traceRef} visible={false}>
        <mesh>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshBasicMaterial color="#EAF6F3" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.3, 12, 12]} />
          <meshBasicMaterial color="#9FD4CF" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      </group>

      {/* the seed: the least rendered thing on the page. No glow, no jewel. */}
      <mesh position={seed}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshBasicMaterial color="#2E241C" />
      </mesh>
      {/* germination shoot */}
      <mesh ref={shootRef} geometry={shootGeom}>
        <meshBasicMaterial color="#7CC4BF" />
      </mesh>
    </>
  );
}

export default function Scene({ progress, bridge }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 1.8, 7] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <World progress={progress} bridge={bridge} />
    </Canvas>
  );
}
