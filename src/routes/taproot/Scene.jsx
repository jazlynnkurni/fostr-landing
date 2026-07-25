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

// The hero "soil block": a full-width dotted band sitting just below the headline.
// The root pipeline hangs from its underside — soil on top, roots beneath.
const SOIL_Y = 2.1;   // world-y of the band centre — sits at the white/gray horizon
const SOIL_H = 0.9;   // band thickness in world units
const SOIL_W = 17;    // wider than the frame at z=0, so it spans edge to edge

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

        // The root only exists below the soil block: clip anything above the surface,
        // dithering out over a short band so it emerges from the block's underside.
        float fade = smoothstep(uClipTop, uClipTop - 0.5, vWY);
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

// A miniature garden on top of the soil: dithered pixel silhouettes of little plants
// and trees that sway in the breeze. Same screen-space dot grid as the root, but the
// silhouette is stippled by an ordered (Bayer) dither, and each plant bends in the wind
// via a per-vertex sway weighted to its height (base planted, tips move most).
function makePlantMaterial(hex) {
  // Same dotted teal material as the soil/root: identical dot grid, brightness ramp
  // (dark -> base -> mint) and travelling flow shimmer, so the meadow reads as the
  // SAME substance as the soil it grows from — plus a per-vertex wind sway.
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, // hand-built triangles have mixed winding; draw both faces
    uniforms: {
      uColor: { value: new THREE.Color(hex) },
      uTime: { value: 0 },
      uCell: { value: 6.0 },   // match the soil's dot grid exactly
      uDot: { value: 0.46 },   // match the soil's dot size
      uSwayAmp: { value: 0.17 },
      uSwaySpeed: { value: 1.28 },
    },
    vertexShader: `
      attribute float aWeight; attribute float aPhase;
      uniform float uTime; uniform float uSwayAmp; uniform float uSwaySpeed;
      varying float vFlow;
      void main(){
        vFlow = position.y;                                // shimmer travels up the stems
        vec3 p = position;
        float w = aWeight * aWeight;                       // tips bend far more than the base
        float wind = sin(uTime * uSwaySpeed + aPhase) * 0.72
                   + sin(uTime * uSwaySpeed * 2.1 + aPhase * 1.7) * 0.28;
        p.x += wind * uSwayAmp * w;
        p.y -= abs(wind) * uSwayAmp * 0.25 * w;            // slight nod as it leans
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uTime; uniform float uCell; uniform float uDot;
      varying float vFlow;
      const float TAU = 6.28318530718;
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){
        vec2 cell = floor(gl_FragCoord.xy / uCell);
        vec2 f = fract(gl_FragCoord.xy / uCell) - 0.5;
        if (length(f) > uDot) discard;
        float jit = hash(cell);
        // two travelling wave-trains (same feel as the soil/root), running up the plant
        float w1 = 0.5 + 0.5 * sin((vFlow * 7.0 - uTime * 1.2 + jit) * TAU);
        float w2 = 0.5 + 0.5 * sin((vFlow * 3.0 - uTime * 0.66 + jit * 0.7) * TAU);
        float flow = w1 * 0.62 + w2 * 0.38;
        float t = clamp(0.18 + flow * 0.72 + 0.12, 0.0, 1.0);
        vec3 dark = uColor * 0.4;
        vec3 light = mix(uColor, vec3(0.90, 0.99, 0.96), 0.72);
        vec3 col = t < 0.5 ? mix(dark, uColor, t * 2.0) : mix(uColor, light, (t - 0.5) * 2.0);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// Full-background vertical gradient: pure white up top, easing smoothly into a soft
// turquoise with depth — one continuous ramp, no horizon edge or banding.
function makeBgMaterial() {
  return new THREE.ShaderMaterial({
    depthWrite: false,
    vertexShader: `
      varying float vWY;
      void main(){ vWY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying float vWY;
      void main(){
        float k = clamp((2.0 - vWY) / 27.0, 0.0, 1.0);   // 0 at the surface, 1 deep
        vec3 col = mix(vec3(1.0), vec3(0.549, 0.792, 0.784), pow(k, 1.2)); // white -> soft turquoise
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// The ground: ONE continuous dotted field. It's fully dense for a solid surface band
// just under the horizon, then smoothly dither-dissolves with depth until it's gone —
// so there's no hard "block then sparse" seam, just soil fading into the earth.
function makeSeepMaterial(hex, top, span) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(hex) },
      uTime: { value: 0 },
      uCell: { value: 6.0 },
      uDot: { value: 0.46 },
      uTop: { value: top },
      uSpan: { value: span },
    },
    vertexShader: `
      varying float vWY;
      void main(){ vWY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uTime; uniform float uCell; uniform float uDot; uniform float uTop; uniform float uSpan;
      varying float vWY;
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){
        vec2 cell = floor(gl_FragCoord.xy / uCell);
        vec2 f = fract(gl_FragCoord.xy / uCell) - 0.5;
        if (length(f) > uDot) discard;
        float d = uTop - vWY;                              // depth below the surface top
        if (d < -0.05) discard;                            // nothing above ground
        // solid for the top band, then one smooth continuous dissolve to nothing
        float keep = 1.0 - smoothstep(0.85, uSpan, d);
        if (hash(cell * 0.7) > keep) discard;
        float jit = hash(cell);
        float t = 0.4 + 0.34 * jit + 0.06 * sin(uTime * 1.2 + jit * 6.283); // gentle sparkle only
        vec3 col = mix(uColor * 0.45, uColor, t);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// ---- procedural wild-meadow silhouettes -------------------------------------
// Plants are built from tiny filled triangles (stems as thin quads, flower heads
// as blobs, seed-spikes/petals/leaflets as little segments) so they read like a
// tangled wildflower meadow rather than clean geometric icons.
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function triTo(o, ax, ay, bx, by, cx, cy) { o.push(ax, ay, 0, bx, by, 0, cx, cy, 0); }
function segTo(o, ax, ay, bx, by, wa, wb) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-4;
  const nx = -dy / L * wa, ny = dx / L * wa, mx = -dy / L * wb, my = dx / L * wb;
  o.push(ax + nx, ay + ny, 0, bx + mx, by + my, 0, ax - nx, ay - ny, 0);
  o.push(ax - nx, ay - ny, 0, bx + mx, by + my, 0, bx - mx, by - my, 0);
}
function blobTo(o, cx, cy, r, n) {
  n = n || 8;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832;
    triTo(o, cx, cy, cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
  }
}
function stemTo(o, pts, w0, w1) {
  for (let i = 0; i < pts.length - 1; i++) {
    const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1);
    segTo(o, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w0 + (w1 - w0) * t0, w0 + (w1 - w0) * t1);
  }
}
function arcPts(arch, h, n) {
  const p = [];
  for (let i = 0; i <= n; i++) { const t = i / n; p.push([arch * t * t, h * t]); }
  return p;
}

// Build one plant's triangle soup (rooted at y=0, growing up). kind picks the species.
function buildPlant(kind, seed) {
  const o = [];
  const R = mulberry(seed);
  const rnd = (a, b) => a + (b - a) * R();
  if (kind === "umbel") {
    // cow parsley / Queen Anne's lace: tall stem, radiating spokes, floret clusters
    const h = rnd(1.3, 2.0), sway = rnd(-0.06, 0.06);
    stemTo(o, [[0, 0], [sway * 0.3, h * 0.5], [sway, h]], 0.05, 0.022);
    if (R() < 0.7) { const bh = h * rnd(0.45, 0.65); stemTo(o, [[sway * 0.3, bh], [sway + rnd(-0.18, 0.18), bh + rnd(0.18, 0.34)]], 0.03, 0.016); }
    const spokes = Math.round(rnd(8, 12)), tx = sway, ty = h;
    for (let i = 0; i < spokes; i++) {
      const ang = Math.PI * 0.5 + (i / (spokes - 1) - 0.5) * Math.PI * 1.15;
      const len = rnd(0.16, 0.3), ex = tx + Math.cos(ang) * len, ey = ty + Math.sin(ang) * len;
      segTo(o, tx, ty, ex, ey, 0.02, 0.01);
      blobTo(o, ex, ey, rnd(0.03, 0.055), 7);
    }
  } else if (kind === "spike") {
    // grass seed-head (wheat): arching stem with alternating angled seeds up top
    const h = rnd(1.1, 1.75), arch = rnd(0.06, 0.24) * (R() < 0.5 ? -1 : 1);
    const pts = arcPts(arch, h, 6);
    stemTo(o, pts, 0.032, 0.016);
    const seeds = Math.round(rnd(10, 16));
    for (let i = 0; i < seeds; i++) {
      const t = 0.5 + 0.5 * (i / seeds), bx = arch * t * t, by = h * t, side = i % 2 ? 1 : -1, sl = rnd(0.06, 0.1);
      segTo(o, bx, by, bx + side * sl, by + sl * 1.1, 0.03, 0.006);
    }
  } else if (kind === "daisy") {
    // wildflower: stem with a petalled flower head
    const h = rnd(0.7, 1.35), sway = rnd(-0.05, 0.05);
    stemTo(o, [[0, 0], [sway * 0.5, h * 0.6], [sway, h]], 0.038, 0.02);
    if (R() < 0.7) { const lh = h * rnd(0.3, 0.5), lx = sway * 0.4; segTo(o, lx, lh, lx + rnd(0.08, 0.16) * (R() < 0.5 ? -1 : 1), lh + 0.1, 0.05, 0.004); }
    const cx = sway, cy = h, pet = Math.round(rnd(8, 12)), pr = rnd(0.1, 0.16);
    for (let i = 0; i < pet; i++) { const a = (i / pet) * 6.2832; segTo(o, cx, cy, cx + Math.cos(a) * pr, cy + Math.sin(a) * pr, 0.04, 0.012); }
    blobTo(o, cx, cy, pr * 0.45, 8);
  } else if (kind === "fern") {
    // feathery frond: arching stem with paired leaflets shrinking toward the tip
    const h = rnd(0.9, 1.5), arch = rnd(0.12, 0.34) * (R() < 0.5 ? -1 : 1);
    const pts = arcPts(arch, h, 8);
    stemTo(o, pts, 0.03, 0.01);
    const leaf = 12;
    for (let i = 1; i < leaf; i++) {
      const t = i / leaf, bx = arch * t * t, by = h * t, ln = (1 - t) * rnd(0.16, 0.24);
      for (const s of [-1, 1]) segTo(o, bx, by, bx + s * ln, by + ln * 0.55, 0.03 * (1 - t) + 0.004, 0.002);
    }
  } else if (kind === "clover") {
    // low bloom: short stem, small round head
    const h = rnd(0.35, 0.7), sway = rnd(-0.04, 0.04);
    stemTo(o, [[0, 0], [sway, h]], 0.03, 0.018);
    blobTo(o, sway, h, rnd(0.06, 0.1), 9);
  } else {
    // grass blade tuft: several arching blades of varied height
    const n = Math.round(rnd(6, 10));
    for (let b = 0; b < n; b++) {
      const bx = rnd(-0.2, 0.2), h = rnd(0.5, 1.1), sway = rnd(-0.22, 0.22);
      stemTo(o, arcPts(sway, h, 5).map(([px, py]) => [bx + px, py]), 0.036, 0.003);
    }
  }
  return new Float32Array(o);
}

// Wrap the triangle soup in a BufferGeometry, baking per-vertex sway weight (height
// fraction) and a constant wind phase so many plants can share one material.
function makePlantGeom(kind, phase, seed) {
  const positions = buildPlant(kind, seed);
  const count = positions.length / 3;
  let maxY = 0.001;
  for (let i = 0; i < count; i++) maxY = Math.max(maxY, positions[i * 3 + 1]);
  const weight = new Float32Array(count), ph = new Float32Array(count);
  for (let i = 0; i < count; i++) { weight[i] = Math.min(1, positions[i * 3 + 1] / maxY); ph[i] = phase; }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("aWeight", new THREE.BufferAttribute(weight, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
  return g;
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
      // constant river that tapers to a SHARP point at its deep end (the seed)
      taperTube(mainCurve, 360, 8, (u) => (u < 0.9 ? 0.1 : 0.1 * (1 - (u - 0.9) / 0.1))),
    [mainCurve]
  );

  // The miniature meadow: a dense, tangled row of wild plants along the soil top —
  // tall wildflowers rising over a low understory of grass and small blooms.
  const garden = useMemo(() => {
    const topY = SOIL_Y + SOIL_H * 0.5 - 0.04; // rooted just into the block's top edge
    const R = mulberry(20240724);
    const tall = ["umbel", "spike", "daisy", "fern", "spike", "umbel"];
    const low = ["blades", "clover", "blades", "blades"];
    const items = [];
    let x = -5.6, i = 0;
    while (x < 5.6) {
      const isTall = R() < 0.5;
      const kind = isTall ? tall[(R() * tall.length) | 0] : low[(R() * low.length) | 0];
      const scale = isTall ? 0.7 + R() * 0.5 : 0.5 + R() * 0.45;
      items.push({
        geom: makePlantGeom(kind, (i * 1.3) % 6.283, (Math.imul(i + 1, 2654435761) >>> 0)),
        x, y: topY, scale, z: 0.02 + R() * 0.1,
      });
      x += 0.26 + R() * 0.34;
      i++;
    }
    return items;
  }, []);
  useEffect(() => () => garden.forEach((p) => p.geom.dispose()), [garden]);

  // Below the soil block the pixels SEEP downward — a dotted field that starts dense
  // at the underside and dithers out with depth (with a gentle downward-drifting
  // density wave), so the soil dissolves naturally into the earth and leaves room for
  // the next-section transition. Not roots — just soil bleeding through.
  // One ground field: dense surface band at the top, dissolving down. Spans from the
  // surface (soil-top) down far enough to fade before the panel-2 cards.
  const SEEP_TOP = SOIL_Y + SOIL_H * 0.5;
  const SEEP_H = 3.3;
  const seepGeom = useMemo(() => new THREE.PlaneGeometry(SOIL_W, SEEP_H), []);

  // Dotted flicker materials (deep teal on the pale turquoise world).
  const mats = useMemo(
    () => ({
      // root only renders below the soil block: clipTop is set so the 0.5-unit fade
      // band lands INSIDE the block, and the root is already full density at the block's
      // underside — no sparse gap, no white space between soil and root.
      root: makeDotMaterial("#6FCECC", 0.36, 0.06, 1.0, SOIL_Y - SOIL_H * 0.5 + 0.6),
      branch: makeDotMaterial("#6FCECC", 0.34, 0.06, 0.0),
      lateral: makeDotMaterial("#2A7A78", 0.26, 0.12, 0.0),
      shoot: makeDotMaterial("#E1C78E", 0.34, 0.06, 0.0),
      // the whole ground: solid surface band dissolving down into the earth
      seep: makeSeepMaterial("#6FCECC", SEEP_TOP, SEEP_H),
      // dithered, wind-swayed pixel plants on top of the soil
      plant: makePlantMaterial("#E1C78E"),
    }),
    []
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  // expose materials so the ?tune color panel can edit uColor live
  useEffect(() => { bridge.current.mats = mats; return () => { if (bridge.current) bridge.current.mats = null; }; }, [mats, bridge]);

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
    // taper each filament to a sharp point at its tip (thick at the node -> ~0 at the end)
    const geoms = curves.map((c) => taperTube(c, 48, 6, (u) => 0.08 * Math.pow(1 - u, 1.5) + 0.003));
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
        return taperTube(c, 40, 6, (u) => 0.07 * Math.pow(1 - u, 1.5) + 0.003);
      }),
    [latNode]
  );

  const shootGeom = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      seed.clone(),
      new THREE.Vector3(seed.x - 0.18, seed.y + 1.1, 0.1),
      new THREE.Vector3(seed.x + 0.05, seed.y + 2.4, 0.0),
    ]);
    return taperTube(c, 40, 6, (u) => 0.055 * Math.pow(1 - u, 1.4) + 0.003);
  }, [seed]);

  // Soil: one big vertex-colored gradient wall behind the root.
  // Big background quad, extends well past the frame so the shader gradient fills the
  // whole view with no visible edge at any camera depth.
  const planeGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(120, 70);
    g.translate(0, -12, 0); // spans y=+23 .. -47
    return g;
  }, []);
  const bgMat = useMemo(() => makeBgMaterial(), []);
  useEffect(() => () => bgMat.dispose(), [bgMat]);

  // Small node spheres that pop in as the growth tip passes them.
  const nodes = useMemo(() => {
    const list = [
      [0.2, 0.09],
      [fractionAtY(lut, node.y + 0.02), 0.18],
      [0.6, 0.09],
      [fractionAtY(lut, latNode.y + 0.02), 0.13],
      [0.85, 0.08],
    ];
    // Drop any node that would sit in/above the soil block — it reads as a stray ball
    // floating in the soil->root handoff.
    return list.map(([f, r]) => ({ f, r, pos: mainCurve.getPointAt(f) })).filter((n) => n.pos.y < SOIL_Y - SOIL_H);
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
    mats.seep.uniforms.uTime.value = tNow;
    mats.plant.uniforms.uTime.value = tNow;
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

    // Four document cards fill in as their filaments arrive (panel 4); they rise into
    // place, then drift up and fade as the section exits.
    const docExit = clamp01((p - (PB[4] + 0.005)) / 0.025);
    const docFadeOut = 1 - docExit;
    for (let i = 0; i < 4; i++) {
      const el = els.cards[i];
      if (!el) continue;
      const arrive = clamp01((maxBranch.current[i] - 0.86) / 0.14);
      const vis = p > PB[3] && p < PB[4] + 0.05 ? arrive * docFadeOut : 0;
      el.style.opacity = vis.toFixed(3);
      el.style.visibility = vis > 0.01 ? "visible" : "hidden";
      const [cx, cy] = proj(branchStuff.endpoints[i]);
      const drift = (1 - arrive) * 16 - docExit * 54; // rise in, then rise away
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${(cy + 10 + drift).toFixed(1)}px, 0) translate(-50%, 0)`;
    }

    // Panel 5 overlays: court filing (left) + source note (right), side by side,
    // revealed together — rising in on enter, drifting up + fading on exit.
    const p5enter = p > PB[4] ? clamp01((p - (PB[4] + 0.004)) / 0.02) : 0;
    const p5exit = clamp01((p - (PB[5] - 0.02)) / 0.02);
    const p5vis = p > PB[4] && p < PB[5] + 0.03 ? p5enter * (1 - p5exit) : 0;
    const p5drift = (1 - p5enter) * 24 - p5exit * 60; // rise into place, then rise away
    const cardY = h * 0.34 + p5drift;
    if (els.filing) {
      els.filing.style.opacity = p5vis.toFixed(3);
      els.filing.style.visibility = p5vis > 0.01 ? "visible" : "hidden";
      els.filing.style.transform = `translate3d(${(w * 0.5 - 14).toFixed(1)}px, ${cardY.toFixed(1)}px, 0) translate(-100%, 0)`;
    }
    if (els.filingLine) {
      const hl = 0.1 + 0.26 * clamp01(t / 0.15);
      els.filingLine.style.background = `rgba(93,161,161,${hl.toFixed(3)})`;
    }
    if (els.source) {
      els.source.style.opacity = p5vis.toFixed(3);
      els.source.style.visibility = p5vis > 0.01 ? "visible" : "hidden";
      els.source.style.transform = `translate3d(${(w * 0.5 + 14).toFixed(1)}px, ${cardY.toFixed(1)}px, 0)`;
    }
  });

  return (
    <>
      {/* full-view background gradient: white -> soft turquoise, no horizon edge */}
      <mesh geometry={planeGeom} material={bgMat} position={[0, 0, -6]} />

      {/* the ground: dense surface band that dissolves down into the earth (one field) */}
      <mesh geometry={seepGeom} material={mats.seep} position={[0, SEEP_TOP - SEEP_H * 0.5, -0.05]} />

      {/* a miniature garden of dithered pixel plants swaying on top of the soil */}
      {garden.map((p, i) => (
        <mesh key={`plant${i}`} geometry={p.geom} material={mats.plant} position={[p.x, p.y, p.z]} scale={p.scale} />
      ))}

      {/* the taproot — the only saturated, emissive thing underground.
          No spheres anywhere: the root is JUST the dotted tube (jaz will add
          pixelized balls travelling *within* the root as a separate effect). */}
      <mesh ref={rootRef} geometry={rootGeom} material={mats.root} />

      {/* four dotted filaments to the four documents */}
      {branchStuff.geoms.map((g2, i) => (
        <mesh key={`b${aBucket}-${i}`} ref={(el) => (branchRefs.current[i] = el)} geometry={g2} material={mats.branch} />
      ))}

      {/* dim lateral galleries — present, not yet lit */}
      {lateralGeoms.map((g2, i) => (
        <mesh key={`l${i}`} ref={(el) => (lateralRefs.current[i] = el)} geometry={g2} material={mats.lateral} />
      ))}

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
