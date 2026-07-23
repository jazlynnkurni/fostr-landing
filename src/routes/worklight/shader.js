// WORKLIGHT — one fullscreen fragment-shader quad.
// Strata gradient + film-grain dither (dark gradients band on OLED without it)
// + teal SDF root lines revealed only under the beam
// + afterglow (uMax uniform = highest scroll reached; passed segments hold 20%)
// + panel-5 trace thread + panel-8 switch-on pulse.
//
// Depth space: 1.0 unit = 100vh of page height. The page is TOTAL units tall.
// x is in viewport-height units too ((uv.x - 0.5) * aspect) so distances are isotropic.

export const TOTAL = 10.6; // 1060vh: hero 100 + 140 + 120 + 140 + 180 + 120 + 130 + 130

export const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const frag = /* glsl */ `
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform float uAspect;
uniform float uScroll;  // scroll depth of viewport top, in 100vh units
uniform float uMax;     // highest uScroll reached (afterglow)
uniform float uBeamR;   // beam radius (viewport-height units)
uniform float uBeamI;   // beam intensity 0..1
uniform float uWarm;    // 0 paper-white .. 1 gold (panel 7 only place it fully turns)
uniform float uTrace;   // panel-5 trace scrub 0..1 (latched)
uniform float uSwitch;  // panel-8 switch-on 0..1 (IntersectionObserver-driven)
uniform float uSway;    // tiny idle sway; zeroed when the beam "goes still"

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float tapX(float d) {
  return 0.035 * sin(d * 3.1) + 0.02 * sin(d * 6.7 + 1.7);
}

void main() {
  vec2 uv = vUv;
  float d = uScroll + (1.0 - uv.y);           // shaft depth of this pixel
  vec2 p = vec2((uv.x - 0.5) * uAspect, d);   // shaft space

  vec3 paper   = vec3(0.969, 0.961, 0.945);   // #F7F5F1
  vec3 soilTop = vec3(0.165, 0.129, 0.110);   // #2A211C
  vec3 bedrock = vec3(0.098, 0.078, 0.071);   // #191412
  vec3 teal    = vec3(0.365, 0.631, 0.631);   // #5DA1A1
  vec3 gold    = vec3(0.788, 0.635, 0.153);   // #C9A227
  vec3 beamCol = mix(vec3(1.0, 0.97, 0.90), gold, uWarm);

  // ---- soil strata
  float under = smoothstep(1.0, 1.14, d);
  vec3 soil = mix(soilTop, bedrock, smoothstep(1.2, 3.4, d));
  float tex = vnoise(p * 60.0) * 0.45 + vnoise(p * 170.0) * 0.35 + vnoise(p * 420.0) * 0.2;
  soil += (tex - 0.5) * 0.02;
  soil += (vnoise(vec2(d * 4.0, 0.5)) - 0.5) * 0.03;
  vec3 col = mix(paper, soil, under);

  // ---- beam (viewport space; follows scroll by construction)
  vec2 q = vec2((uv.x - 0.5) * uAspect - uSway, uv.y - 0.5);
  float bl = length(q);
  float core = smoothstep(uBeamR, uBeamR * 0.22, bl);
  float halo = smoothstep(uBeamR * 2.1, uBeamR * 0.4, bl) * 0.4;
  float beam = clamp(core + halo, 0.0, 1.0) * uBeamI * under;

  // the beam reveals soil texture — never gates the copy (that's DOM)
  col += beamCol * beam * (0.11 + 0.24 * tex);

  // ---- lamp cable: thin line from viewport top down to the beam
  float cpx = abs(uv.x - 0.5) * uRes.x;
  float cable = smoothstep(1.8, 0.4, cpx) * smoothstep(0.48, 0.66, uv.y) * under * uBeamI;
  col += vec3(1.0, 0.94, 0.84) * cable * 0.12;

  // ---- roots (SDF, shaft space)
  float w = 2.4 / uRes.y;
  float rd = 1e3;

  // taproot: ground line down to the seed
  float dc = clamp(d, 1.05, 10.15);
  rd = min(rd, length(vec2(p.x - tapX(dc), d - dc)));

  // panel-4 branch: four filaments to the four destinations
  float tapStart = tapX(3.9);
  float bt = clamp((d - 3.9) / 0.65, 0.0, 1.0);
  float bs = bt * bt * (3.0 - 2.0 * bt);
  for (int i = 0; i < 4; i++) {
    float xe = (i == 0) ? -0.33 : (i == 1) ? -0.11 : (i == 2) ? 0.11 : 0.33;
    float x = mix(tapStart, xe * uAspect, bs);
    rd = min(rd, length(vec2(p.x - x, d - clamp(d, 3.9, 4.55))));
  }

  // branchlets down the shaft (the network the finale lights all at once)
  for (int k = 0; k < 10; k++) {
    float fk = float(k);
    float sk = 1.4 + fk * 0.92;
    float side = mod(fk, 2.0) * 2.0 - 1.0;
    vec2 a = vec2(tapX(sk), sk);
    vec2 b = a + vec2(side * (0.08 + 0.05 * hash(vec2(fk, 3.7))), 0.14 + 0.06 * hash(vec2(fk, 9.1)));
    rd = min(rd, sdSeg(vec2(p.x, d), a, b));
  }

  // panel-6 laterals running off both edges (group homes, elder care)
  float wig = 0.02 * sin(p.x * 6.0);
  rd = min(rd, abs(d - (7.22 + wig)));
  rd = min(rd, abs(d - (7.48 - wig)));

  // ---- visibility: beam reveal + 20% afterglow + switch-on pulse
  float after = 0.2 * (1.0 - smoothstep(uMax + 0.55, uMax + 0.68, d));
  float se = uSwitch * uSwitch * (3.0 - 2.0 * uSwitch);
  float front = mix(10.15, 0.85, se);          // pulse runs from the seed upward
  float on = step(0.001, uSwitch);
  float swLit = smoothstep(front - 0.05, front + 0.25, d) * on;
  float band = exp(-abs(d - front) * 14.0) * on;
  float vis = clamp(beam + after + swLit * 0.85 + band, 0.0, 1.0);

  float line = smoothstep(w * 2.2, w * 0.7, rd);
  float glow = smoothstep(w * 12.0, 0.0, rd) * 0.35;
  col += teal * (line + glow) * vis * under;

  // ---- panel-5 trace thread: filing line back up the shaft to its source note
  float tx = 0.06 * uAspect;
  float tRev = 5.9 - uTrace * 0.65;
  float td = length(vec2(p.x - tx, d - clamp(d, tRev, 5.9)));
  float tline = smoothstep(w * 2.2, w * 0.6, td);
  float tglow = smoothstep(w * 14.0, 0.0, td) * 0.4;
  col += mix(vec3(1.0, 0.97, 0.9), teal, 0.35) * (tline + tglow) * step(0.001, uTrace) * (0.55 + 0.45 * beam) * under;

  // ---- the seed
  float sd2 = length(vec2(p.x, d - 10.15));
  float seedCore = 1.0 - smoothstep(0.008, 0.018, sd2);
  col += gold * (seedCore * (0.25 + 0.75 * uSwitch) + exp(-sd2 * 22.0) * 0.4 * uSwitch) * under;

  // switch-on lifts the whole scene a step
  col += vec3(0.05, 0.045, 0.034) * uSwitch * under;

  // ---- film grain dither (required)
  float gn = hash(gl_FragCoord.xy + fract(uTime) * vec2(17.0, 113.0));
  col += (gn - 0.5) * (3.0 / 255.0);

  gl_FragColor = vec4(col, 1.0);
}
`;
