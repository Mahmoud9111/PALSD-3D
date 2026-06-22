"use client";

/*
Cinematic scroll sequence — a single scrubbed timeline, played by scrolling:

  PHASE 1  (progress 0 … TEXT_END)   Hero framing + PAL text overlay, held still.
                                     The text fades out across this phase.
  PHASE 2  (TEXT_END … MOVE_END)     The camera flies from the hero framing to the
                                     chase framing (just behind/above the truck).
  PHASE 3  (MOVE_END … 1)            The paving run: the truck drives down the
                                     street and the camera chases it.

There is NO OrbitControls, so the mouse can't move the camera — the whole shot is
owned by the scroll position. GSAP ScrollTrigger turns scroll distance into a 0→1
progress value; a per-frame rig reads it and places the truck + camera, while the
text overlay's opacity is faded from the same progress so everything stays in sync.
*/

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Sky } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";
import { Model } from "./Palhero";
import { TruckV2 } from "./TruckV2";
import { Sign } from "./Sign";
import { Bridge } from "./Bridge";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// ─── Palette (from the PAL reference design) ─────────────────────────────────
const INK = "#16181C";
const PAPER = "#E9E8E3";
const ACCENT = "#FF4A1C";
const MONO = "ui-monospace, monospace";

// ─── Shared scene transform (street + truck + signs + bridge all ride this) ──
const MODEL_POSITION: [number, number, number] = [7, 0, 0];
const MODEL_ROTATION: [number, number, number] = [0.0, -0.3, 0];
const MODEL_SCALE = 1;

// ─── Hero framing (the opening shot — copied from HeroModel's CAMERA/FOCUS) ──
const HERO_CAM: [number, number, number] = [9.8, 7, 14]; // opening camera position (world)
const HERO_LOOK: [number, number, number] = [-1, 5.8, -5]; // opening aim point (world)
const HERO_FOV = 65; // lens during the hero framing (lower = more zoomed in / flatter)

// ─── Truck (its X is driven by scroll; Y/Z + facing stay fixed) ──────────────
const TRUCK_Y = 0.55;
const TRUCK_Z = 0;
const TRUCK_ROTATION: [number, number, number] = [0, 3.16, 0]; // faces down -X (the travel direction)
const TRUCK_SCALE = 1;
const TRUCK_START_X = -4; // beside the first building
const TRUCK_END_X = -514; // just shy of the far structures


const TRUCK_DRIVE: { dist: number; speed: number; note: string }[] = [
  { dist: 6, speed: 1, note: "STAGE 1 — launch: eases off the line from a dead stop (LAUNCH_EASE)" },
  { dist: 34, speed: 5, note: "STAGE 2 — quick cruise: already moving, not crawling" },
  // stage 3 ramps smoothly off stage 2 into light speed, then stays flat-out
  { dist: 44, speed: 26, note: "STAGE 3" },
  { dist: 48, speed: 34, note: "STAGE 4" },
  { dist: 40, speed: 42, note: "STAGE 5" },
];

function buildTruckPath(): [number, number][] {
  const totalDist = TRUCK_START_X - TRUCK_END_X; // +210 (the truck travels down −X)
  const wSum = TRUCK_DRIVE.reduce((a, s) => a + s.dist, 0);
  const segs = TRUCK_DRIVE.map((s) => {
    const d = (s.dist / wSum) * totalDist; // world units this segment actually covers
    return { d, time: d / s.speed }; // scroll time = distance / speed
  });
  const tSum = segs.reduce((a, s) => a + s.time, 0);
  const path: [number, number][] = [[0, TRUCK_START_X]];
  let scroll = 0;
  let x = TRUCK_START_X;
  for (const s of segs) {
    scroll += s.time / tSum; // normalise so the whole drive spans scroll 0→1
    x -= s.d; // drive forward, down −X
    path.push([scroll, x]);
  }
  path[path.length - 1] = [1, TRUCK_END_X]; // pin the end exactly (kill float drift)
  return path;
}
const TRUCK_PATH: [number, number][] = buildTruckPath();

// ── THE LAUNCH KNOB ──────────────────────────────────────────────────────────

const LAUNCH_EASE = 1;

const TRUCK_EASE = 1;


function buildTruckTangents(): number[] {
  const path = TRUCK_PATH;
  const n = path.length;
  const h: number[] = []; // scroll-span of each segment
  const m: number[] = []; // secant speed dX/dp of each segment
  for (let i = 0; i < n - 1; i++) {
    h[i] = path[i + 1][0] - path[i][0];
    m[i] = (path[i + 1][1] - path[i][1]) / h[i];
  }
  const d: number[] = new Array(n);
  d[0] = m[0] * (1 - LAUNCH_EASE); // 0 ⇒ dead-stop launch, 1·m[0] ⇒ already at speed
  d[n - 1] = m[n - 2]; // finish flat-out (no deceleration)
  for (let i = 1; i < n - 1; i++) {
    // interior speed = average of the neighbouring secants, then clamped to the
    // Fritsch–Carlson bound so the curve stays monotone (never overshoots/reverses).
    const avg = (m[i - 1] + m[i]) / 2;
    const lim = 3 * Math.min(Math.abs(m[i - 1]), Math.abs(m[i]));
    d[i] = Math.sign(avg) * Math.min(Math.abs(avg), lim);
  }
  return d;
}
const TRUCK_TAN: number[] = buildTruckTangents();


function truckXAt(p: number): number {
  const path = TRUCK_PATH;
  if (p <= path[0][0]) return path[0][1];
  const last = path[path.length - 1];
  if (p >= last[0]) return last[1];
  for (let i = 0; i < path.length - 1; i++) {
    const [p0, x0] = path[i];
    const [p1, x1] = path[i + 1];
    if (p <= p1) {
      const hSeg = p1 - p0;
      const t = (p - p0) / hSeg;
      // Cubic Hermite basis → smooth speed through the checkpoints (uses TRUCK_TAN).
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      const cubic =
        h00 * x0 +
        h10 * hSeg * TRUCK_TAN[i] +
        h01 * x1 +
        h11 * hSeg * TRUCK_TAN[i + 1];
      const linear = x0 + (x1 - x0) * t; // hard, constant-speed fallback
      return linear + (cubic - linear) * TRUCK_EASE; // blend hard ↔ smooth
    }
  }
  return last[1];
}

// ─── Chase camera (offsets in the street's LOCAL frame → mapped to world) ────
const CAM_BACK = 11; // behind the truck (+X, since it drives -X)
const CAM_HEIGHT = 7.5; // height above the street
const CAM_SIDE = 15; // sideways offset (+Z) for a 3/4 follow angle
const LOOK_AHEAD = -6; // aim ahead of the truck, down the road (-X)
const LOOK_HEIGHT = 2.4; // height of the aim point
const CHASE_FOV = 50; // lens once chasing the truck (lower = tighter / more compressed)
// (The camera's smoothness lives in the ⭐ SMOOTHNESS ⭐ block below — one feel knob.)

// ─── ⭐ THE SPEED ZONES — slow ONLY while the truck drives ⭐ ──────────────────
// The scroll page is split into THREE parts, each with its own scroll length (in
// screen-heights). The truck's pace = its whole road spread across DRIVE_VH, so make
// THAT big to crawl, while the intro before it and the tail after it stay NORMAL.
// These three are the only numbers you touch:
const INTRO_VH = 100; //  BEFORE  — PAL text + camera flying in to the truck. NORMAL speed.
const DRIVE_VH = 900; // 🐌 TRUCK DRIVING — big = very slow. Raise to crawl more, lower to speed up.
const OUTRO_VH = 200; //  AFTER   — normal-speed scroll once the truck has parked (0 = none).

// Everything below is derived from the three numbers above — no need to touch it.
const SCROLL_VH = INTRO_VH + DRIVE_VH + OUTRO_VH; // total scroll-page height
const P_MOVE_END = INTRO_VH / SCROLL_VH; // PHASE 2 ends / the drive begins (camera has arrived)
const P_DRIVE_END = (INTRO_VH + DRIVE_VH) / SCROLL_VH; // the drive ends — truck parked after this
// Intro choreography — kept at the SAME relative timing inside the (normal-speed) intro.
const P_TEXT_END = P_MOVE_END * 0.42; // PHASE 1 ends — hero framing held until here
const TEXT_FADE_A = P_MOVE_END * 0.08; // overlay starts fading here
const TEXT_FADE_B = P_MOVE_END * 0.33; // overlay fully gone here


const SMOOTH = 4.2;

// Same idea, but for touch devices (phones / tablets). 0 = native phone scrolling.
const SMOOTH_TOUCH = 0.9;

// Optional EXTRA glide for the CAMERA only, layered on top of SMOOTH. Seconds.
//   • 0   → camera is LOCKED to the smoothed scroll — SMOOTH alone owns the feel.
//   • >0  → camera trails the scroll a little more, for a looser cinematic drift.
const CAM_GLIDE = 0;

// ─── Signs (one in each gap between buildings — from HeroModel) ──────────────
type SignConfig = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};
const SIGNS: SignConfig[] = [
  { position: [-11.945, 0.435, -3.929], rotation: [0, 0, 0], scale: 1.3 },
  { position: [-45.951, 0.435, -3.929], rotation: [0, 0, 0], scale: 1.3 },
  { position: [-85.041, 0.435, -3.929], rotation: [0, 0, 0], scale: 1.3 },
];

// ─── Bridge (elevated viaduct set back behind the houses) ────────────────────
const BRIDGE_POSITION: [number, number, number] = [-49.449, 0, -48]; // X centred on the road (= ground centre) so both run parallel, end-to-end, at equal length
const BRIDGE_ROTATION: [number, number, number] = [0, 0, 0];
const BRIDGE_SCALE = 1;

// ─── Distance fog + sky (lifted from HeroModel so the look matches) ──────────
const FOG_COLOR = "#E4E4E4";
const FOG_NEAR = 10;
const FOG_FAR = 85;
const SKY_SUN: [number, number, number] = [16, 22, 9];
const SKY_TURBIDITY = 6;
const SKY_RAYLEIGH = 1.4;
const SKY_MIE_COEFFICIENT = 0.006;
const SKY_MIE_G = 0.85;


function CinematicRig({
  truckRef,
  sceneRef,
  progressRef,
}: {
  truckRef: React.RefObject<THREE.Group | null>;
  sceneRef: React.RefObject<THREE.Group | null>;
  progressRef: React.RefObject<number>;
}) {
  const heroPos = useRef(new THREE.Vector3(...HERO_CAM));
  const heroLook = useRef(new THREE.Vector3(...HERO_LOOK));
  const chasePos = useRef(new THREE.Vector3());
  const chaseLook = useRef(new THREE.Vector3());
  const camGoal = useRef(new THREE.Vector3());
  const lookGoal = useRef(new THREE.Vector3());
  const fovGoal = useRef(HERO_FOV);
  const first = useRef(true);

  useFrame((state, delta) => {
    const scene = sceneRef.current;
    const truck = truckRef.current;
    if (!scene || !truck) return;
    // Read the camera from the frame state (not the render-scope hook value) so
    // we can mutate its .fov each frame without tripping the React Compiler.
    const cam = state.camera as THREE.PerspectiveCamera;
    scene.updateWorldMatrix(true, false);

    const t = progressRef.current;

    // PHASE 3 amount — how far into the paving run (0 before it begins, 1 once the
    // truck has driven the whole DRIVE_VH zone; it then stays parked through any outro).
    const pave = THREE.MathUtils.clamp(
      (t - P_MOVE_END) / (P_DRIVE_END - P_MOVE_END),
      0,
      1
    );
    // Place the truck straight from the checkpoint table — what you typed in
    // TRUCK_PATH is exactly where it goes. See truckXAt + the table above.
    const truckX = truckXAt(pave);
    truck.position.x = truckX;

    // Chase framing for the truck's CURRENT position (local offset → world).
    chasePos.current.set(truckX + CAM_BACK, CAM_HEIGHT, CAM_SIDE);
    scene.localToWorld(chasePos.current);
    chaseLook.current.set(truckX + LOOK_AHEAD, LOOK_HEIGHT, 0);
    scene.localToWorld(chaseLook.current);

    if (t <= P_TEXT_END) {
      // PHASE 1 — hold the hero framing while the text fades (DOM, handled below).
      camGoal.current.copy(heroPos.current);
      lookGoal.current.copy(heroLook.current);
      fovGoal.current = HERO_FOV;
    } else if (t <= P_MOVE_END) {
      // PHASE 2 — ease from the hero framing to the chase framing (lens too).
      const k = (t - P_TEXT_END) / (P_MOVE_END - P_TEXT_END);
      const e = k * k * (3 - 2 * k); // smoothstep
      camGoal.current.copy(heroPos.current).lerp(chasePos.current, e);
      lookGoal.current.copy(heroLook.current).lerp(chaseLook.current, e);
      fovGoal.current = THREE.MathUtils.lerp(HERO_FOV, CHASE_FOV, e);
    } else {
      // PHASE 3 — chase the paving truck.
      camGoal.current.copy(chasePos.current);
      lookGoal.current.copy(chaseLook.current);
      fovGoal.current = CHASE_FOV;
    }

    // The camera rides the SAME smoothed scroll as everything else. By default
    // (CAM_GLIDE = 0) it snaps to its scroll-derived goal each frame, so the lone
    // SMOOTH knob owns the camera's feel too. CAM_GLIDE > 0 adds optional extra
    // camera-only drift. The first frame always snaps so the opening shot matches
    // the hero framing. Frame-rate independent either way.
    const a =
      first.current || CAM_GLIDE <= 0 ? 1 : 1 - Math.exp(-delta / CAM_GLIDE);
    first.current = false;
    cam.position.lerp(camGoal.current, a);
    cam.fov = THREE.MathUtils.lerp(cam.fov, fovGoal.current, a);
    cam.updateProjectionMatrix();
    cam.lookAt(lookGoal.current);
  });

  return null;
}

export default function Animate() {
  const root = useRef<HTMLDivElement>(null); // scopes the GSAP selectors below
  const wrapper = useRef<HTMLDivElement>(null); // ScrollSmoother viewport
  const content = useRef<HTMLDivElement>(null); // ScrollSmoother scrolled content
  const scroller = useRef<HTMLDivElement>(null); // tall spacer = the scroll length
  const overlay = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Group>(null);
  const truckRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduce) {
        // No motion: show everything in its opening state and bail.
        gsap.set(
          [
            ".pal-char",
            ".pal-brand",
            ".pal-cta",
            ".pal-overline",
            ".pal-tagline",
            ".pal-right-vert",
            ".pal-bottomleft",
            ".pal-scroll",
          ],
          { opacity: 1, x: 0, y: 0, yPercent: 0 }
        );
        progressRef.current = 0;
        return;
      }

      // ── Hero intro (plays once on load, same as the original Hero) ──────────
      gsap.set(".pal-char", { yPercent: 130 });
      gsap.set(".pal-brand", { y: -18, opacity: 0 });
      gsap.set(".pal-cta", { y: -18, opacity: 0 });
      gsap.set(".pal-overline", { x: -24, opacity: 0 });
      gsap.set(".pal-tagline", { y: 20, opacity: 0 });
      gsap.set(".pal-right-vert", { x: 24, opacity: 0 });
      gsap.set(".pal-bottomleft", { y: 18, opacity: 0 });
      gsap.set(".pal-scroll", { y: 18, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.to(".pal-brand", { y: 0, opacity: 1, duration: 0.9 }, 0.1)
        .to(".pal-cta", { y: 0, opacity: 1, duration: 0.9 }, 0.2)
        .to(
          ".pal-char",
          { yPercent: 0, duration: 1.25, stagger: 0.09, ease: "expo.out" },
          0.25
        )
        .to(".pal-overline", { x: 0, opacity: 1, duration: 0.9 }, 0.4)
        .to(".pal-tagline", { y: 0, opacity: 1, duration: 0.9 }, 0.85)
        .to(".pal-right-vert", { x: 0, opacity: 1, duration: 0.9 }, 0.95)
        .to(
          [".pal-bottomleft", ".pal-scroll"],
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 },
          1.0
        );

      // ── Smooth scrolling (the official GSAP plugin) ─────────────────────────
      // Eases the whole page scroll. Any ScrollTrigger created AFTER this picks
      // up the smoothed scroll automatically, so the rig + text fade ride it too.
      ScrollSmoother.get()?.kill(); // avoid duplicates on hot-reload / StrictMode
      ScrollSmoother.create({
        wrapper: wrapper.current!,
        content: content.current!,
        smooth: SMOOTH, // ← the knob: seconds of "catch up". Higher = more glide.
        smoothTouch: SMOOTH_TOUCH, // smoothing on touch devices (0 = native phone scroll)
        normalizeScroll: true, // unifies wheel/touch + tames mobile address bar
        effects: false,
      });

      // ── The master scroll → drives the 3D rig AND the overlay fade ──────────
      ScrollTrigger.create({
        trigger: scroller.current!,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;

          // PHASE 1: fade the hero text out (and lift it slightly) as we scroll.
          const fade = THREE.MathUtils.smoothstep(p, TEXT_FADE_A, TEXT_FADE_B);
          const el = overlay.current;
          if (el) {
            el.style.opacity = String(1 - fade);
            el.style.transform = `translateY(${fade * -28}px)`;
            el.style.pointerEvents = fade > 0.98 ? "none" : "";
          }
        },
      });
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      {/* The scene is a FIXED full-screen layer that lives OUTSIDE #smooth-content,
          so ScrollSmoother never translates it away — it stays pinned while the
          spacer below scrolls. (This replaces the old position:sticky pin, which
          can't survive ScrollSmoother's content transform.) */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          background: PAPER,
          color: INK,
          fontFamily:
            "'Body Grotesque Fit', 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <Canvas
          shadows="percentage"
          dpr={[1, 2]}
          camera={{ position: HERO_CAM, fov: HERO_FOV }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.NeutralToneMapping,
            toneMappingExposure: 1.05,
          }}
          className="!absolute inset-0"
        >
          <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />

          <Sky
            sunPosition={SKY_SUN}
            turbidity={SKY_TURBIDITY}
            rayleigh={SKY_RAYLEIGH}
            mieCoefficient={SKY_MIE_COEFFICIENT}
            mieDirectionalG={SKY_MIE_G}
          />

          <Environment resolution={256} frames={1}>
            <Lightformer
              intensity={1.6}
              color="#f4f8ff"
              rotation-x={Math.PI / 2}
              position={[0, 14, 0]}
              scale={[40, 40, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.1}
              color="#fff4ec"
              position={[14, 6, 6]}
              scale={[14, 10, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.0}
              color="#e6efff"
              position={[-14, 6, -8]}
              scale={[14, 10, 1]}
            />
            <Lightformer
              form="rect"
              intensity={0.5}
              color="#e8ebf0"
              rotation-x={-Math.PI / 2}
              position={[0, -2, 0]}
              scale={[30, 30, 1]}
            />
          </Environment>

          <hemisphereLight args={["#eef4ff", "#d6dade", 0.85]} />
          <ambientLight intensity={0.5} color="#eef3fb" />
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
          <directionalLight
            position={[-14, 9, -4]}
            intensity={0.55}
            color="#dde8f5"
          />

          <Suspense fallback={null}>
            <group
              ref={sceneRef}
              position={MODEL_POSITION}
              rotation={MODEL_ROTATION}
              scale={MODEL_SCALE}
            >
              <Model />

              <group ref={truckRef} position={[TRUCK_START_X, TRUCK_Y, TRUCK_Z]}>
                <TruckV2 rotation={TRUCK_ROTATION} scale={TRUCK_SCALE} />
              </group>

              {SIGNS.map((s, i) => (
                <Sign
                  key={i}
                  position={s.position}
                  rotation={s.rotation}
                  scale={s.scale}
                />
              ))}

              <Bridge
                position={BRIDGE_POSITION}
                rotation={BRIDGE_ROTATION}
                scale={BRIDGE_SCALE}
              />
            </group>
          </Suspense>

          {/* No OrbitControls → the mouse can't move the camera. */}
          <CinematicRig
            truckRef={truckRef}
            sceneRef={sceneRef}
            progressRef={progressRef}
          />
        </Canvas>

        {/* ===== HERO TEXT OVERLAY (fades out in phase 1) ===== */}
        <div
          ref={overlay}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            padding: "56px 80px 72px 80px",
            pointerEvents: "none",
            willChange: "opacity, transform",
          }}
        >
          {/* TOP-LEFT: burger + brand mark */}
          <div
            className="pal-brand"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              position: "relative",
              zIndex: 5,
              pointerEvents: "auto",
            }}
          >
            <button
              type="button"
              className="pal-burger"
              aria-label="Open menu"
              style={{
                display: "inline-flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 8,
                width: 40,
                height: 38,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "block", width: 38, height: 3, background: INK }} />
              <span style={{ display: "block", width: 38, height: 3, background: INK }} />
              <span style={{ display: "block", width: 38, height: 3, background: INK }} />
            </button>
          </div>

          {/* TOP-RIGHT: availability CTA */}
          <div
            className="pal-topright pal-cta"
            style={{
              position: "absolute",
              top: 56,
              right: 80,
              display: "flex",
              alignItems: "center",
              gap: 18,
              zIndex: 6,
              pointerEvents: "auto",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                fontFamily: MONO,
                fontSize: 16,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(22,24,28,0.55)",
              }}
            >
              <span
                className="pal-cta-dot"
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: ACCENT,
                  animation: "pal-cta-pulse 2.4s ease-in-out infinite",
                }}
              />
              Available for new projects
            </span>
          </div>

          {/* RIGHT EDGE: vertical services */}
          <div
            className="pal-right-vert"
            style={{
              position: "absolute",
              right: 40,
              top: "50%",
              transform: "translateY(-50%)",
              writingMode: "vertical-rl",
              fontFamily: MONO,
              fontSize: 13,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(22,24,28,0.55)",
              zIndex: 5,
            }}
          >
            Civil&nbsp;—&nbsp;Structural&nbsp;—&nbsp;Infrastructure&nbsp;—&nbsp;Earthworks
          </div>

          {/* HERO BLOCK (logotype) */}
          <div
            className="pal-hero-block"
            style={{
              position: "absolute",
              left: "50%",
              top: 104,
              transform: "translateX(-50%)",
              maxWidth: "92vw",
              textAlign: "center",
              zIndex: 4,
            }}
          >
            <div
              className="pal-overline"
              style={{
                fontFamily: MONO,
                fontSize: 15,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "rgba(22,24,28,0.6)",
                marginBottom: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <span style={{ display: "inline-block", width: 34, height: 1, background: ACCENT }} />
              Engineering &amp; Construction — Est. 1998
              <span style={{ display: "inline-block", width: 34, height: 1, background: ACCENT }} />
            </div>

            <h1
              className="pal-logotype"
              style={{
                margin: 0,
                fontWeight: 400,
                lineHeight: 0.82,
                fontSize: "clamp(80px, 13vw, 176px)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {["P", "A", "L", "S", "D"].map((c) => (
                <span
                  key={c}
                  className="pal-charwrap"
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    padding: "0.06em 0.05em 0.08em 0.05em",
                    marginLeft: "-0.025em",
                    marginRight: "-0.025em",
                  }}
                >
                  <span className="pal-char" style={{ display: "inline-block" }}>
                    {c}
                  </span>
                </span>
              ))}
            </h1>

            <p
              className="pal-tagline"
              style={{
                margin: "10px auto 0 auto",
                maxWidth: 620,
                fontFamily:
                  "var(--font-geist-sans), 'Helvetica Neue', Arial, sans-serif",
                fontSize: "clamp(18px, 1.8vw, 22px)",
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                textAlign: "center",
                color: "rgba(22,24,28,0.82)",
              }}
            >
              We build the infrastructure the world runs on — bridges, highways, and
              the structures that hold it all up.
            </p>
          </div>

          {/* BOTTOM-LEFT: location */}
          <div
            className="pal-bottomleft"
            style={{
              position: "absolute",
              left: 80,
              bottom: 64,
              fontFamily: MONO,
              fontSize: 16,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              lineHeight: 1.7,
              color: "rgba(22,24,28,0.6)",
              zIndex: 5,
              maxWidth: "11vw",
            }}
          >
            9939 Hibert St. Ste 201, San Diego, CA 92131
            <br />
            <span style={{ color: "rgba(22,24,28,0.4)" }}>
              32.9085° N&nbsp;&nbsp;117.1095° W
            </span>
          </div>

          {/* BOTTOM-RIGHT: scroll indicator */}
          <div
            className="pal-scroll"
            style={{
              position: "absolute",
              right: 80,
              bottom: 64,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: MONO,
              fontSize: 18,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(22,24,28,0.6)",
              zIndex: 5,
            }}
          >
            Scroll
            <span
              className="pal-scroll-line"
              style={{
                display: "inline-block",
                width: 186,
                height: 5,
                background: "rgba(22,24,28,0.5)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  background: ACCENT,
                  transform: "translateX(-100%)",
                  animation: "pal-scroll-line 1.8s linear infinite",
                }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* The ONLY thing that actually scrolls. ScrollSmoother fixes the wrapper to
          the viewport and eases the content's transform; the 600vh spacer just
          sets how long the cinematic runs. The scene above reads the smoothed
          scroll through its ScrollTrigger. */}
      <div ref={wrapper} id="smooth-wrapper">
        <div ref={content} id="smooth-content">
          <div ref={scroller} style={{ height: `${SCROLL_VH}vh` }} />
        </div>
      </div>
    </div>
  );
}
