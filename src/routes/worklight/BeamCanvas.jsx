// Fixed fullscreen R3F canvas rendering the single shader quad.
// All uniforms are driven in useFrame from scroll MotionValues — no React state per frame.
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { vert, frag } from "./shader.js";

const sstep = (x, a, b) => THREE.MathUtils.smoothstep(x, a, b);
const bell = (x, a, b, c, d) => sstep(x, a, b) * (1 - sstep(x, c, d));

function BeamQuad({ sv, maxSv, switchMV }) {
  const traceMax = useRef(0); // latched: a trace, once made, persists
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uScroll: { value: 0 },
      uMax: { value: 0 },
      uBeamR: { value: 0.42 },
      uBeamI: { value: 0 },
      uWarm: { value: 0 },
      uTrace: { value: 0 },
      uSwitch: { value: 0 },
      uSway: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const u = uniforms;
    const t = state.clock.elapsedTime;
    const s = sv.get();        // scroll depth of viewport top, 100vh units
    const bd = s + 0.5;        // depth at the beam's center (mid-viewport)
    const sw = switchMV.get();

    u.uTime.value = t;
    u.uScroll.value = s;
    u.uMax.value = maxSv.get();
    u.uSwitch.value = sw;
    u.uAspect.value = state.size.width / state.size.height;
    u.uRes.value.set(state.gl.domElement.width, state.gl.domElement.height);

    // ---- beam choreography per panel (depths in 100vh units, bd = beam center)
    const p3 = bell(bd, 2.55, 2.95, 3.2, 3.55);    // still + slightly warm around "Not the worker's."
    const p4 = bell(bd, 3.75, 4.05, 4.6, 4.95);    // follows the branch
    const flood = bell(bd, 6.95, 7.3, 7.55, 7.95); // one floodlit beat, then narrows
    const p7 = bell(bd, 8.2, 8.6, 9.0, 9.35);      // dimmest steady pool, toward gold
    const p8 = sstep(bd, 9.45, 9.85);              // the finale

    let R = 0.42 + p4 * 0.1 + flood * 0.95;
    R = THREE.MathUtils.lerp(R, 0.21, p7);
    R = THREE.MathUtils.lerp(R, 0.55 + sw * 0.75, p8);

    let I = sstep(s, 0.45, 0.8); // kicks on with a soft bloom at the crossing
    I = Math.min(1, I + flood * 0.12);
    I = THREE.MathUtils.lerp(I, 0.72, p7);
    I = THREE.MathUtils.lerp(I, 0.9 + sw * 0.1, p8);

    let warm = Math.max(p3 * 0.14, p7); // panel 7 is the only place it fully turns gold
    warm *= 1 - p8;

    // tiny idle sway; goes utterly still for panels 3 and 7
    const sway = Math.sin(t * 0.55) * 0.012 * (1 - p3) * (1 - p7);

    u.uBeamR.value = THREE.MathUtils.damp(u.uBeamR.value, R, 4.5, dt);
    u.uBeamI.value = THREE.MathUtils.damp(u.uBeamI.value, I, 5, dt);
    u.uWarm.value = THREE.MathUtils.damp(u.uWarm.value, warm, 4, dt);
    u.uSway.value = THREE.MathUtils.damp(u.uSway.value, sway, 3, dt);

    // panel-5 trace: scroll-scrubbed, latched so the proof persists
    traceMax.current = Math.max(traceMax.current, sstep(bd, 5.95, 6.6));
    u.uTrace.value = THREE.MathUtils.damp(u.uTrace.value, traceMax.current, 7, dt);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function BeamCanvas({ sv, maxSv, switchMV }) {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return (
    <div className="wl-canvas" aria-hidden="true">
      <Canvas
        dpr={coarse ? 1 : [1, 1.5]}
        frameloop="always"
        gl={{
          antialias: false,
          alpha: false,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
      >
        <BeamQuad sv={sv} maxSv={maxSv} switchMV={switchMV} />
      </Canvas>
    </div>
  );
}
