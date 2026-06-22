/*
Procedural elevated-highway viaduct, built from primitives (no GLB) so it owns
its own tunable geometry — matching the flat-shaded, low-poly concrete look of
the rest of the scene.

It runs along its LOCAL X axis and is centred on its local origin, with the pier
footings sitting on local y = 0 (the ground). Placement in the world (how far
back it sits behind the houses, etc.) is left entirely to the <group> props you
pass in from HeroModel — see BRIDGE_* there — so this component never hard-codes
where it lives in the scene.

Anatomy (all dimensions are tunable below):
  • a continuous DECK slab spanning the whole length
  • a dark ASPHALT strip + 4-LANE markings on top (solid edges + centre divider
    + dashed lane lines)
  • a dark FASCIA band down each deck edge (the asphalt-coloured side beam)
  • two PARAPET barriers down the deck's long edges
  • evenly spaced PIERS, each = a wide footing + TWO vertical poles (columns) +
    a cap beam they carry under the deck (a twin-column bent)
*/

"use client";

import * as THREE from "three";
import { useMemo } from "react";

// ─── Deck (the road platform that spans the whole viaduct) ───────────────────
const DECK_LENGTH = 1005.33; // span along local X = 3× the original 335.11 — matched to the street's world length, which now fills the whole ground (see Palhero.tsx)
const DECK_WIDTH = 23; // span along local Z (wide enough to read as 4 lanes)
const DECK_THICKNESS = 1.8; // slab depth
const DECK_HEIGHT = 15; // height of the deck's TOP face above the ground

// ─── Lane markings (4 lanes: solid edges + centre divider + dashed lane lines)─
const LANE_COUNT = 4; // number of traffic lanes painted on the deck
const STRIPE_W = 0.14; // painted-line width (in Z)
const DASH_COUNT = 246; // dashes per dashed lane line, along the length (scaled with the 3× longer deck)

// ─── Fascia (the dark asphalt-coloured side band along each deck edge) ────────
const FASCIA_DROP = 0.8; // how far the dark band hangs below the slab bottom
const FASCIA_WIDTH = 0.35; // thickness (in Z) of the side band

// ─── Parapets (the raised barriers running down both deck edges) ─────────────
const PARAPET_WIDTH = 0.5; // thickness (in Z) of each barrier
const PARAPET_HEIGHT = 0.9; // how tall they stand above the deck

// ─── Piers (footing + TWO poles/columns + a cap beam, repeated along span) ───
const PIER_SPACING = 22; // target gap (along X) between pier centres
const POLE_WIDTH = 3.4; // each pole size along X
const POLE_DEPTH = 3.4; // each pole size along Z
const POLE_OFFSET = 3.2; // distance of each pole from the pier centre (±Z)
const CAP_HEIGHT = 1.3; // the transverse beam under the deck the poles carry
const CAP_OVERHANG = 1.2; // how far the cap reaches beyond the outer poles (Z)
const CAP_SIZE_X = 3.6; // cap size along X (a bit wider than a pole)
const FOOTING_HEIGHT = 0.9; // squat base block under the poles
const FOOTING_MARGIN = 1.6; // footing wider/deeper than the pole footprint

// ─── Finish (concrete + asphalt, kept flat-shaded for the low-poly facets) ───
const CONCRETE = "#D8D8D2"; // deck, poles, footings
const CONCRETE_CAP = "#CACAC4"; // cap beam, a touch darker so it reads separately
const PARAPET_COLOR = "#383A3D"; // barriers
const ASPHALT = "#CACAC4"; // road surface AND the dark edge fascia
const LANE_LINE = "#F4F7FB"; // painted lane markings
const ROUGHNESS = 0.9;

export function Bridge(props: React.JSX.IntrinsicElements["group"]) {
  // Shared materials — built once. Flat shading keeps crisp facets like Sign.tsx.
  const mats = useMemo(() => {
    const concrete = new THREE.MeshStandardMaterial({
      color: CONCRETE,
      roughness: ROUGHNESS,
      metalness: 0,
      flatShading: true,
    });
    const cap = new THREE.MeshStandardMaterial({
      color: CONCRETE_CAP,
      roughness: ROUGHNESS,
      metalness: 0,
      flatShading: true,
    });
    const parapet = new THREE.MeshStandardMaterial({
      color: PARAPET_COLOR,
      roughness: ROUGHNESS,
      metalness: 0,
      flatShading: true,
    });
    const asphalt = new THREE.MeshStandardMaterial({
      color: ASPHALT,
      roughness: 0.95,
      metalness: 0,
    });
    const line = new THREE.MeshStandardMaterial({
      color: LANE_LINE,
      roughness: 0.85,
      emissive: new THREE.Color("#e8eef6"),
      emissiveIntensity: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    return { concrete, cap, parapet, asphalt, line };
  }, []);

  // Derived heights.
  const deckCenterY = DECK_HEIGHT - DECK_THICKNESS / 2; // centre of the slab
  const deckBottomY = DECK_HEIGHT - DECK_THICKNESS; // where the cap meets it
  const roadTopY = DECK_HEIGHT + 0.02; // road sits just above the slab
  const parapetCenterY = DECK_HEIGHT + PARAPET_HEIGHT / 2;
  const parapetZ = DECK_WIDTH / 2 - PARAPET_WIDTH / 2;

  // Dark side fascia — covers the slab edge and hangs a little below it.
  const fasciaHeight = DECK_THICKNESS + FASCIA_DROP;
  const fasciaCenterY = DECK_HEIGHT - fasciaHeight / 2;
  const fasciaZ = DECK_WIDTH / 2;

  // ── Twin-pole pier geometry ────────────────────────────────────────────────
  // Two vertical poles rise from a shared footing to a transverse cap beam that
  // sits under the deck. The deck rests across the cap.
  const capBottomY = deckBottomY - CAP_HEIGHT;
  const poleHeight = capBottomY - FOOTING_HEIGHT;
  const benWidthZ = POLE_OFFSET * 2 + POLE_DEPTH; // outer footprint of the pole pair
  const footingDepthZ = benWidthZ + FOOTING_MARGIN;
  const capDepthZ = benWidthZ + CAP_OVERHANG * 2;

  // Evenly spread the piers along the span, kept inside the deck ends.
  const pierXs = useMemo(() => {
    const usable = DECK_LENGTH - POLE_WIDTH * 2;
    const count = Math.max(2, Math.round(usable / PIER_SPACING) + 1);
    const step = usable / (count - 1);
    return Array.from({ length: count }, (_, i) => -usable / 2 + step * i);
  }, []);

  // ── 4-lane markings ─────────────────────────────────────────────────────────
  // The roadway (between the parapets) is split into LANE_COUNT lanes. Interior
  // boundaries get lines: the centre one is solid (the median divider), the rest
  // dashed. Solid edge lines run just inside the parapets.
  const roadWidth = DECK_WIDTH - PARAPET_WIDTH * 2;
  const laneW = roadWidth / LANE_COUNT;
  const solidZs = useMemo(() => {
    const edges = [roadWidth / 2 - STRIPE_W, -(roadWidth / 2 - STRIPE_W)];
    return [0, ...edges]; // centre divider + both edges
  }, [roadWidth]);
  const dashedZs = useMemo(() => {
    // interior boundaries that aren't the centre line (i.e. ±laneW, ±2laneW…)
    const zs: number[] = [];
    for (let k = 1; k < LANE_COUNT; k++) {
      const z = -roadWidth / 2 + laneW * k;
      if (Math.abs(z) > 1e-3) zs.push(z); // skip the centre (handled as solid)
    }
    return zs;
  }, [roadWidth, laneW]);

  // Dash centres along the length, reused by every dashed lane line.
  const dashes = useMemo(() => {
    const span = DECK_LENGTH * 0.94;
    const step = span / DASH_COUNT;
    return Array.from(
      { length: DASH_COUNT },
      (_, i) => -span / 2 + step * (i + 0.5)
    );
  }, []);
  const dashLen = ((DECK_LENGTH * 0.94) / DASH_COUNT) * 0.4;

  return (
    <group {...props} dispose={null}>
      {/* Deck slab — the continuous road platform */}
      <mesh
        castShadow
        receiveShadow
        material={mats.concrete}
        position={[0, deckCenterY, 0]}
      >
        <boxGeometry args={[DECK_LENGTH, DECK_THICKNESS, DECK_WIDTH]} />
      </mesh>

      {/* Dark fascia — the asphalt-coloured side band down each long edge */}
      {[fasciaZ, -fasciaZ].map((z, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          material={mats.asphalt}
          position={[0, fasciaCenterY, z]}
        >
          <boxGeometry args={[DECK_LENGTH, fasciaHeight, FASCIA_WIDTH]} />
        </mesh>
      ))}

      {/* Asphalt strip on top of the deck, inset between the parapets */}
      <mesh
        receiveShadow
        material={mats.asphalt}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, roadTopY, 0]}
      >
        <planeGeometry args={[DECK_LENGTH, roadWidth]} />
      </mesh>

      {/* Solid lane lines — centre divider + both edges */}
      {solidZs.map((z, i) => (
        <mesh
          key={i}
          material={mats.line}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, roadTopY + 0.01, z]}
        >
          <planeGeometry args={[DECK_LENGTH * 0.98, STRIPE_W]} />
        </mesh>
      ))}

      {/* Dashed lane lines — the interior boundaries between lanes */}
      {dashedZs.map((z, li) =>
        dashes.map((x, di) => (
          <mesh
            key={`${li}-${di}`}
            material={mats.line}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, roadTopY + 0.01, z]}
          >
            <planeGeometry args={[dashLen, STRIPE_W]} />
          </mesh>
        ))
      )}

      {/* Parapets — a raised barrier down each long edge */}
      {[parapetZ, -parapetZ].map((z, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          material={mats.parapet}
          position={[0, parapetCenterY, z]}
        >
          <boxGeometry args={[DECK_LENGTH, PARAPET_HEIGHT, PARAPET_WIDTH]} />
        </mesh>
      ))}

      {/* Piers — wide footing + TWO vertical poles + a cap beam under the deck */}
      {pierXs.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* footing — one slab spanning both poles */}
          <mesh
            castShadow
            receiveShadow
            material={mats.concrete}
            position={[0, FOOTING_HEIGHT / 2, 0]}
          >
            <boxGeometry
              args={[POLE_WIDTH + FOOTING_MARGIN, FOOTING_HEIGHT, footingDepthZ]}
            />
          </mesh>
          {/* two vertical poles at ±POLE_OFFSET in Z */}
          {[POLE_OFFSET, -POLE_OFFSET].map((z, j) => (
            <mesh
              key={j}
              castShadow
              receiveShadow
              material={mats.concrete}
              position={[0, FOOTING_HEIGHT + poleHeight / 2, z]}
            >
              <boxGeometry args={[POLE_WIDTH, poleHeight, POLE_DEPTH]} />
            </mesh>
          ))}
          {/* cap beam — spans across the poles, carries the deck */}
          <mesh
            castShadow
            receiveShadow
            material={mats.cap}
            position={[0, capBottomY + CAP_HEIGHT / 2, 0]}
          >
            <boxGeometry args={[CAP_SIZE_X, CAP_HEIGHT, capDepthZ]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
