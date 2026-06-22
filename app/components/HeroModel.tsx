"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  Sky,
} from "@react-three/drei";
import * as THREE from "three";
import { Model } from "./Palhero";
import { TruckV2 } from "./TruckV2";
import { Sign } from "./Sign";
import { Bridge } from "./Bridge";

// ─── Model transform (move / turn / resize the whole scene) ──────────────────
const MODEL_POSITION: [number, number, number] = [7, 0, 0]; // slide the model [x, y, z]
const MODEL_ROTATION: [number, number, number] = [0.0, -0.3, 0]; // turn the model in radians [x, y, z]
const MODEL_SCALE = 1; // overall size multiplier

// ─── Truck transform (move / turn / resize the truck) ────────────────────────
// Values are relative to the scene: the truck sits in a wrapper group that
// shares MODEL_* below, so it rides with the street and these stay tweakable.
const TRUCK_POSITION: [number, number, number] = [-4, 0.55, 0]; // slide the truck [x, y, z]
const TRUCK_ROTATION: [number, number, number] = [0, 3.16, 0]; // turn the truck in radians [x, y, z]
const TRUCK_SCALE = 1; // overall size multiplier

// ─── Signs (one in the gap between each pair of buildings) ───────────────────
// The four buildings sit in a row along X at z = -20.257 (see Palhero.tsx), so
// the three signs drop into the midpoints between them, parked in the front strip
// (z) ahead of the solar arrays. Each sign has its OWN full transform here, so
// you can move / turn / resize all three completely independently. They ride in
// the shared MODEL_* wrapper below so they stay aligned with the street as the
// whole scene moves.
//   position: [x, y, z]  ·  y = height off the ground  ·  z = depth (less negative = closer to the street)
//   rotation: [x, y, z] in radians  ·  scale: overall size multiplier
type SignConfig = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};
const SIGNS: SignConfig[] = [
  { position: [-11.945, 0.435, -3.929], rotation: [0, 0, 0], scale: 1.3 }, // between buildings 1 & 2
  { position: [-45.951, 0.435, -3.929], rotation: [0, 0, 0], scale: 1.3 }, // between buildings 2 & 3
  { position: [-85.041, 0.435, -3.929], rotation: [0, 0, 0], scale: 1.3 }, // between buildings 3 & 4
];

// ─── Bridge (elevated viaduct, set back BEHIND the row of houses) ─────────────
// The houses sit at z = -20.257; pushing the bridge further back to z = -48
// leaves a clear strip of ground between them and the viaduct — the same gap as
// the reference image. Centred on X = -55 so it runs the length of the row.
// Rides in the shared MODEL_* wrapper below, so it stays locked to the scene.
const BRIDGE_POSITION: [number, number, number] = [-49.449, 0, -48]; // [x, y, z] — X centred on the road (= ground centre) so both run end-to-end at equal length; push z more negative to sit further back
const BRIDGE_ROTATION: [number, number, number] = [0, 0, 0]; // turn in radians [x, y, z]
const BRIDGE_SCALE = 1; // overall size multiplier

// ─── Full camera controller (edit everything here) ───────────────────────────
const FOCUS: [number, number, number] = [-1, 5.8, -5]; // point the camera orbits / looks at
const CAMERA: [number, number, number] = [9.8, 7, 14]; // starting camera position [x, y, z]
const FOV = 65; // lens field of view — lower = more zoomed in / flatter

// ─── Distance fog (far end of the street fades into white, clears up close) ──
// Measured as distance FROM THE CAMERA, so it covers whatever is far away and
// melts off as you dolly / orbit closer — exactly the "approach to reveal" look.
const FOG_COLOR = "#E4E4E4"; // pale sky-blue haze so the far street melts into the horizon (was "#E4E4E4" grey for the paper background).
const FOG_NEAR = 10; // closer than this = crystal clear (the truck / foreground stay sharp)
const FOG_FAR = 85; // at/beyond this = fully hazed into the sky (the far buildings vanish)

// ─── Sky dome (Preetham atmospheric scattering) ──────────────────────────────
// The sky shader ignores scene fog, so it stays vivid while the street still
// hazes into FOG_COLOR at the horizon. Keep the sun DIRECTION aligned with the
// key light (see directionalLight at [16,16,9]) so the sky glow, the shadows and
// the lit faces all agree. Higher sun = paler, softer sky (kinder to the dark
// text overlay); higher rayleigh = deeper blue; higher turbidity = hazier.
const SKY_SUN: [number, number, number] = [16, 22, 9]; // sun direction (magnitude ignored — it's normalised)
const SKY_TURBIDITY = 6;
const SKY_RAYLEIGH = 1.4;
const SKY_MIE_COEFFICIENT = 0.006;
const SKY_MIE_G = 0.85;

const CONTROLS = {
  // What the user can do
  enableRotate: true, // drag to orbit
  enableZoom: true, // wheel / pinch to dolly in-out
  enablePan: true, // right-drag / two-finger to slide the target

  // Inertia (smooth glide after release)
  enableDamping: true,
  dampingFactor: 0.05,

  // Speeds
  rotateSpeed: 1,
  zoomSpeed: 1,
  panSpeed: 1,

  // Zoom distance limits (how close / far you can dolly)
  minDistance: 2,
  maxDistance: 60,

  // Vertical tilt limits — 0 = straight overhead, PI/2 = horizon, PI = underneath
  minPolarAngle: 0,
  maxPolarAngle: Math.PI / 2,

  // Horizontal swing limits — use ±Infinity for unlimited spin
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,

  // Idle auto-spin (off)
  autoRotate: false,
  autoRotateSpeed: 1,
} as const;

export default function HeroModel() {
  return (
    <Canvas
      // PCFShadowMap (= "percentage"): three r0.184 deprecated PCFSoftShadowMap,
      // which the bare `shadows` / `shadows="soft"` default maps to. It silently
      // falls back to PCF anyway, so select it explicitly to kill the warning.
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: CAMERA, fov: FOV }}
      gl={{
        antialias: true,
        alpha: true,
        // Neutral (Khronos PBR) tone mapping keeps colors bright & saturated
        // instead of the desaturated, filmic roll-off of ACES — that punchy,
        // candy-colored output is the heart of the "3D cartoon game" look.
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1.05,
      }}
      className="!absolute inset-0"
    >
      {/* Distance fog — camera-relative, so the far end of the street fades
          into the sky haze and clears as you dolly / orbit closer. */}
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />

      {/* Atmospheric sky dome — see SKY_* above. Renders behind everything and
          ignores the fog, so it stays vivid while the street hazes off. */}
      <Sky
        sunPosition={SKY_SUN}
        turbidity={SKY_TURBIDITY}
        rayleigh={SKY_RAYLEIGH}
        mieCoefficient={SKY_MIE_COEFFICIENT}
        mieDirectionalG={SKY_MIE_G}
      />

      {/* --- Lights: clean neutral-daylight "low-poly city" rig ---
          Matches the reference render: pure white sun, soft grey shadows, very
          even bright fill and NO colour cast. The look comes from saturated
          model colours under flat, neutral light — not from coloured lights. */}

      {/* Soft contact shadows are handled by the renderer's built-in PCF shadow
          map (see `shadows` on the Canvas). Do NOT reintroduce drei's
          <SoftShadows>: its PCSS shader calls unpackRGBAToDepth, which three
          r0.184 removed, so it fails to compile EVERY lit material (Standard /
          Physical / Toon) — that was the "Fragment shader is not compiled" flood. */}

      {/* Image-based lighting — a neutral white studio dome. Even, slightly
          cool-white bounce on every surface with a faint warm/cool split so it
          isn't dead flat. Kept desaturated so model colours stay true. */}
      <Environment resolution={256} frames={1}>
        {/* Big bright sky bounce overhead — the dominant, even light source */}
        <Lightformer
          intensity={1.6}
          color="#f4f8ff"
          rotation-x={Math.PI / 2}
          position={[0, 14, 0]}
          scale={[40, 40, 1]}
        />
        {/* Barely-warm card on the sunny side */}
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#fff4ec"
          position={[14, 6, 6]}
          scale={[14, 10, 1]}
        />
        {/* Barely-cool card on the shaded side */}
        <Lightformer
          form="rect"
          intensity={1.0}
          color="#e6efff"
          position={[-14, 6, -8]}
          scale={[14, 10, 1]}
        />
        {/* Neutral light bounce from the ground */}
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#e8ebf0"
          rotation-x={-Math.PI / 2}
          position={[0, -2, 0]}
          scale={[30, 30, 1]}
        />
      </Environment>

      {/* Sky / ground ambient — near-neutral daylight. Bright enough to keep
          the whole scene evenly lit and the shadows a soft grey, not black. */}
      <hemisphereLight args={["#eef4ff", "#d6dade", 0.85]} />

      {/* Bright neutral base lift — the main shadow-softener. */}
      <ambientLight intensity={0.5} color="#eef3fb" />

      {/* KEY — pure white "sun" and the only shadow caster. Moderate intensity
          (the bright ambient already lifts everything) so shadows read as soft
          grey. Frustum sized to the whole street to keep the map sharp. */}
      <directionalLight
        castShadow
        position={[16, 16, 9]}
        intensity={2.3}
        color="#ffffff"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-near={0.5}
        shadow-camera-far={140}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
      />

      {/* FILL — soft, near-neutral skylight from the opposite side, no shadows.
          Just enough to open up the shade sides without tinting them. */}
      <directionalLight
        position={[-14, 9, -4]}
        intensity={0.55}
        color="#dde8f5"
      />


      {/* --- Model --- */}
      <Suspense fallback={null}>
        <Model
          position={MODEL_POSITION}
          rotation={MODEL_ROTATION}
          scale={MODEL_SCALE}
        />
        {/* Truck — wrapped in the model's transform so it rides on the street,
            while its placement stays controllable here via TRUCK_* above. */}
        <group
          position={MODEL_POSITION}
          rotation={MODEL_ROTATION}
          scale={MODEL_SCALE}
        >
          <TruckV2
            position={TRUCK_POSITION}
            rotation={TRUCK_ROTATION}
            scale={TRUCK_SCALE}
          />
          {/* Signs — one in the gap between each pair of buildings, parked in
              the front strip ahead of the solar arrays. Each one is fully
              independent (see SIGNS above). */}
          {SIGNS.map((s, i) => (
            <Sign
              key={i}
              position={s.position}
              rotation={s.rotation}
              scale={s.scale}
            />
          ))}
          {/* Bridge — elevated viaduct set back behind the houses (see BRIDGE_*
              above). Rides in this wrapper so it stays locked to the street. */}
          <Bridge
            position={BRIDGE_POSITION}
            rotation={BRIDGE_ROTATION}
            scale={BRIDGE_SCALE}
          />
        </group>
      </Suspense>

      {/* Full camera controller — every setting comes from CONTROLS above */}
      <OrbitControls makeDefault target={FOCUS} {...CONTROLS} />
    </Canvas>
  );
}



