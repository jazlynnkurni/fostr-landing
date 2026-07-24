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
const WARM = new THREE.Color("#FFFFFF"); // panel-8 lift back toward daylight

// Vertical ramp keyed on camera depth: white daylight -> soft turquoise at depth.
// Deliberately restrained: the deepest stop is a muted #5DA1A1-family teal, not full sat.
const BG_STOPS = [
  [2.0, new THREE.Color("#FFFFFF")],
  [0.4, new THREE.Color("#FAFCFC")],
  [-0.8, new THREE.Color("#ECF4F3")],
  [-3.5, new THREE.Color("#DFECEB")],
  [-7.5, new THREE.Color("#CCE2E1")],
  [-11.5, new THREE.Color("#B8D7D6")],
  [-15.5, new THREE.Color("#A5CCCB")],
  [-19.5, new THREE.Color("#92C1C0")],
  [-23.5, new THREE.Color("#84B8B7")],
  [-27.0, new THREE.Color("#7DB2B1")],
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

// Dotted "ascii" material: the root renders as a screen-space grid of dots with a
// gentle per-cell flicker, so the line reads as live signal rather than solid pipe.
// Gaps use discard (no blending), which keeps edges crisp at any DPR.
// Dotted "ascii" material: the root renders as a screen-space grid of dots with a
// gentle shade shimmer. Gaps are static (no blinking); discard keeps edges crisp.
function makeDotMaterial(hex, dot = 0.34, dropout = 0.06, head = 0.0, clipTop = 100.0) {
  // Flowing-river ascii material. Dots live in a screen-space grid (crisp at any DPR),
  // but bright "water packets" travel DOWN the tube length over time (via the uv.x
  // length varying), so the root never sits still. `uHead` turns the very top into a
  // turbulent, spray-gapped waterfall mouth. `vRound` (uv.y around the tube) shades the
  // ribbon bright-center / dark-rim, giving the flat dots a rounded, 3D volume read.
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(hex) },
      uTime: { value: 0 },
      uCell: { value: 6.0 },
      uDot: { value: dot },
      uDrop: { value: dropout },
      uHead: { value: head },
      uClipTop: { value: clipTop },
    },
    vertexShader: `
      varying float vLen; varying float vRound; varying float vWY;
      void main(){
        vLen = uv.x; vRound = uv.y; vWY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uTime; uniform float uCell; uniform float uDot; uniform float uDrop; uniform float uHead; uniform float uClipTop;
      varying float vLen; varying float vRound; varying float vWY;
      const float TAU = 6.28318530718;
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){
        vec2 cell = floor(gl_FragCoord.xy / uCell);
        vec2 f = fract(gl_FragCoord.xy / uCell) - 0.5;
        if (length(f) > uDot) discard;

        // Above the horizon the physics waterfall owns the frame: the 3D root only
        // renders underground, dithering out through a soft band at the surface.
        float fade = smoothstep(uClipTop, uClipTop - 1.6, vWY);
        if (fade < 0.02 || hash(cell * 1.7 + 4.0) > fade) discard;

        float head = uHead * smoothstep(0.30, 0.16, vLen);       // faster flow up high
        float drop = uDrop + head * 0.10;                        // keep the crest dense/visible
        if (hash(cell * 0.61) < drop) discard;

        float jit = hash(cell);
        float spd = 1.2 + head * 2.0;                            // faster water at the head
        // two downward-travelling wave trains: every cell is ALWAYS moving
        float w1 = 0.5 + 0.5 * sin((vLen * 26.0 - uTime * spd + jit) * TAU);
        float w2 = 0.5 + 0.5 * sin((vLen * 11.0 - uTime * (spd * 0.55) + jit * 0.7) * TAU);
        float flow = w1 * 0.62 + w2 * 0.38;

        float round3d = 1.0 - pow(abs(vRound - 0.5) * 2.0, 1.5); // bright center, dark rim = 3D

        float t = clamp(0.12 + flow * 0.72 + round3d * 0.16
                        + head * 0.16 * hash(cell + floor(uTime * 12.0)), 0.0, 1.0);
        vec3 dark = uColor * 0.4;
        vec3 light = mix(uColor, vec3(0.90, 0.99, 0.96), 0.72);
        vec3 col = t < 0.5 ? mix(dark, uColor, t * 2.0) : mix(uColor, light, (t - 0.5) * 2.0);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// Variable-radius tube built to match TubeGeometry's index layout (so setDrawRange math
// is unchanged): a wide waterfall mouth at the top (u->0) narrowing into the river.
function taperTube(curve, tubularSegments, radialSegments, radiusFn) {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions = [], uvs = [], indices = [];
  const P = new THREE.Vector3();
  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    curve.getPointAt(u, P);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = radiusFn(u, P.y);
    for (let j = 0; j <= radialSegments; j++) {
      const ang = (j / radialSegments) * Math.PI * 2;
      const cos = -Math.cos(ang), sin = Math.sin(ang);
      positions.push(
        P.x + r * (cos * N.x + sin * B.x),
        P.y + r * (cos * N.y + sin * B.y),
        P.z + r * (cos * N.z + sin * B.z)
      );
      uvs.push(u, j / radialSegments);
    }
  }
  for (let i = 1; i <= tubularSegments; i++) {
    for (let j = 1; j <= radialSegments; j++) {
      const a = (radialSegments + 1) * (i - 1) + (j - 1);
      const bb = (radialSegments + 1) * i + (j - 1);
      const c = (radialSegments + 1) * i + j;
      const d = (radialSegments + 1) * (i - 1) + j;
      indices.push(a, bb, d, bb, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}


// The taproot: one slightly wandering curve from just above the horizon to the seed.
const MAIN_PTS = [
  [0.0, 8.0, 0.0],   // source is above the frame: only the converging funnel shows
  [0.0, 1.2, 0.0],
  [0.0, -1.0, 0.0],
  [-0.25, -2.8, 0.15], // only now does it start to wander
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
const NODE_INDEX = 6;
const LATERAL_INDEX = 9;

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

  const { mainCurve, lut, node, latNode, seed, gPause, gFloor } = useMemo(() => {
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
      gPause: fractionAtY(table, piecewise(CAM_KEYS, PB[2]) - 3.4),
      // the road is already on the page at load: from the top down past the horizon
      gFloor: fractionAtY(table, -1.4),
    };
  }, []);

  const rootGeom = useMemo(
    () =>
      taperTube(mainCurve, 360, 8, () => 0.1), // constant river; the physics waterfall is the hero
    [mainCurve]
  );

  // Dotted flicker materials (deep teal on the pale turquoise world).
  const mats = useMemo(
    () => ({
      root: makeDotMaterial("#2E6E6D", 0.36, 0.06, 1.0, 0.4), // clip above the surface; waterfall owns the sky
      branch: makeDotMaterial("#3D8584", 0.34, 0.06, 0.0),
      lateral: makeDotMaterial("#6FA5A4", 0.26, 0.12, 0.0),
      shoot: makeDotMaterial("#3D8584", 0.34, 0.06, 0.0),
    }),
    []
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

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
    scene.background = new THREE.Color("#FFFFFF");
    scene.fog = new THREE.Fog(new THREE.Color("#FFFFFF"), 7, 26); // pushed back: sharper root
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene]);

  useFrame(({ camera, scene: sc, size: sz, clock }) => {
    const tNow = clock.elapsedTime;
    mats.root.uniforms.uTime.value = tNow;
    mats.branch.uniforms.uTime.value = tNow;
    mats.lateral.uniforms.uTime.value = tNow;
    mats.shoot.uniforms.uTime.value = tNow;
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

    // ---- root growth: leads ahead of the camera so the road is always followable
    let g = Math.max(fractionAtY(lut, camY - 3.4), gFloor);
    if (p < PB[3]) g = Math.min(g, Math.max(gPause, gFloor));
    g = Math.max(b.maxG, Math.min(g, 1));
    b.maxG = g;
    if (rootRef.current) rootRef.current.geometry.setDrawRange(0, Math.floor(g * 360) * 48);

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
      if (PANELS[ai].tooltip && local > 0.4) {
        pillText = PANELS[ai].tooltip;
        pillO = clamp01((local - 0.4) / 0.1);
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

      {/* the taproot — the only saturated, emissive thing underground */}
      <mesh ref={rootRef} geometry={rootGeom} material={mats.root} />
      {/* growth-tip glow */}
      <mesh ref={tipRef} scale={0.001}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.65} depthWrite={false} />
      </mesh>
      {/* node spheres */}
      {nodes.map((n, i) => (
        <mesh key={`n${i}`} ref={(el) => (nodeRefs.current[i] = el)} position={n.pos} scale={0.001}>
          <sphereGeometry args={[n.r, 12, 12]} />
          <meshBasicMaterial color="#1F5A59" />
        </mesh>
      ))}

      {/* four bright filaments to the four documents */}
      {branchStuff.geoms.map((g2, i) => (
        <mesh key={`b${aBucket}-${i}`} ref={(el) => (branchRefs.current[i] = el)} geometry={g2} material={mats.branch} />
      ))}
      {branchStuff.endpoints.map((e, i) => (
        <mesh key={`e${aBucket}-${i}`} ref={(el) => (endSphereRefs.current[i] = el)} position={e} scale={0.001}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial color="#357B7A" />
        </mesh>
      ))}

      {/* dim lateral galleries — present, not yet lit */}
      {lateralGeoms.map((g2, i) => (
        <mesh key={`l${i}`} ref={(el) => (lateralRefs.current[i] = el)} geometry={g2} material={mats.lateral} />
      ))}

      {/* the trace light that runs back UP the root (panel 5) */}
      <group ref={traceRef} visible={false}>
        <mesh>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.3, 12, 12]} />
          <meshBasicMaterial color="#1F5A59" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>

      {/* the seed: the least rendered thing on the page. No glow, no jewel. */}
      <mesh position={seed}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshBasicMaterial color="#173D3C" />
      </mesh>
      {/* germination shoot */}
      <mesh ref={shootRef} geometry={shootGeom} material={mats.shoot} />
    </>
  );
}

export default function Scene({ progress, bridge }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 1.8, 7] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <World progress={progress} bridge={bridge} />
    </Canvas>
  );
}
