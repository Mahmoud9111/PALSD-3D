"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";
import Animate, {
  SCROLL_VH,
  SMOOTH,
  SMOOTH_TOUCH,
  TEXT_FADE_A,
  TEXT_FADE_B,
  P_MOVE_END,
  P_DRIVE_END,
  WHITEOUT_A,
  WHITEOUT_B,
} from "./components/animate";
import WhyUs from "./components/whyus";
import Building from "./components/building";
import Section2 from "./components/Section2";
import ProjectsGrid from "./components/projectsGrid";
import Reviews from "./components/reviews";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// Matches THREE.MathUtils.smoothstep, kept local so this file needn't pull in three.
function smoothstep(x: number, min: number, max: number) {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * (3 - 2 * t);
}

export default function Home() {
  // <Animate /> and <Section2 /> are siblings here. The hero's 3D scene is fixed
  // and must stay OUTSIDE #smooth-content (ScrollSmoother transforms the content,
  // which would break position:fixed), so <Animate /> sits before the smooth
  // wrapper and Section 2 lives inside it as the page's scrolling content.
  //
  // The ScrollSmoother + master scroll timeline are created HERE, not in <Animate />:
  // this component is the PARENT, so its effect runs AFTER every child ref below is
  // attached — that's what makes reading wrapper/content/scroller/overlay/fogVeil
  // reliable (the bug when this lived in <Animate /> was an earlier sibling's effect
  // running before the later siblings' refs existed).
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const fogVeil = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!wrapper.current || !content.current || !scroller.current) return;

    // ── Smooth scrolling (the official GSAP plugin) ─────────────────────────────
    // Eases the whole page scroll. The master ScrollTrigger created after it picks
    // up the smoothed scroll automatically, so the rig + text fade ride it too.
    ScrollSmoother.get()?.kill(); // avoid duplicates on hot-reload / StrictMode
    ScrollSmoother.create({
      wrapper: wrapper.current,
      content: content.current,
      smooth: SMOOTH, // ← the knob: seconds of "catch up". Higher = more glide.
      smoothTouch: SMOOTH_TOUCH, // smoothing on touch devices (0 = native phone scroll)
      // Touch-only (phones) ONLY: it tames the mobile address bar there. On any
      // device WITH a pointer it must stay off — normalizeScroll attaches a
      // capture-phase Observer with preventDefault on wheel/pointer, which kills
      // text selection AND hover across the whole app (isTouch: 0 = mouse,
      // 1 = touch-only, 2 = touch + mouse).
      normalizeScroll: ScrollTrigger.isTouch === 1,
      effects: false,
    });

    // ── The master scroll → drives the 3D rig AND the overlay/fog fade ──────────
    ScrollTrigger.create({
      trigger: scroller.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        progress.current = p; // read each frame by the rig inside <Animate />

        // PHASE 1: fade the hero text out (and lift it slightly) as we scroll.
        const fade = smoothstep(p, TEXT_FADE_A, TEXT_FADE_B);
        const el = overlay.current;
        if (el) {
          el.style.opacity = String(1 - fade);
          el.style.transform = `translateY(${fade * -28}px)`;
          el.style.pointerEvents = fade > 0.98 ? "none" : "";
        }

        // END OF SECTION: as the stage-3 rush peaks the truck dissolves into fog;
        // this veil (fog colour) finishes the whiteout across the whole frame, then
        // holds through the short outro. Measured in the same `pave` units as the
        // drive so it lands exactly at the truck's end — and Section 2 (same colour)
        // scrolls up out of it with no seam.
        const paveP = (p - P_MOVE_END) / (P_DRIVE_END - P_MOVE_END);
        const veil = smoothstep(paveP, WHITEOUT_A, WHITEOUT_B);
        if (fogVeil.current) fogVeil.current.style.opacity = String(veil);
      },
    });
  }, []);

  return (
    <>
      <Animate overlayRef={overlay} fogVeilRef={fogVeil} progressRef={progress} />

      {/* The only thing that actually scrolls. pointerEvents:none keeps this
          full-viewport wrapper click-through over the fixed scene during the
          cinematic; Section 2 re-enables pointer events on itself. */}
      <div ref={wrapper} id="smooth-wrapper" style={{ pointerEvents: "none" }}>
        <div ref={content} id="smooth-content">
          {/* tall spacer = how long the cinematic runs */}
          <div ref={scroller} style={{ height: `${SCROLL_VH}vh` }} />
          <Building />
          <Section2 />
          <ProjectsGrid />
          <Reviews />



                    <WhyUs />

        </div>
      </div>
    </>
  );
}
