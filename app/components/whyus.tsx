"use client";

/*
WHY US — a centred statement section that sits BETWEEN the hero and Section 2.

The headline does the "Framer scroll-fill": every word starts in light grey and
inks in, word by word, as you scroll THROUGH the section. It's not a one-shot — a
scrubbed GSAP ScrollTrigger maps the scroll position straight onto the fill, so it
fills on the way down and un-fills on the way back up (just like the reference).

This is a normal in-flow section (rendered in page.tsx, inside #smooth-content), so
it rides the same ScrollSmoother as everything else. Its background is the same
#F0F0F0 as the hero's fog whiteout and Section 2, so the three flow seamlessly.

Swap HEADLINE below for any copy — it's split on spaces and each word is inked
independently, so the effect just works at any length.
*/

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const INK = "#16181C";
const ACCENT = "#346BFF"; // the small accent tick in the section label
const MUTED = "rgba(22,24,28,0.22)"; // the un-inked (light grey) word colour
const BG = "#F0F0F0"; // matches the fog whiteout + Section 2 — no seam
// Same dashed "stroke" frame as Section 2: one line colour built into two
// repeating gradients (3px on / 3px off) so the dash size is ours, not the browser's.
const GRID_LINE = "rgba(22,24,28,.18)";
const GRID_V = `repeating-linear-gradient(to bottom, ${GRID_LINE} 0 3px, transparent 3px 6px)`;
const GRID_H = `repeating-linear-gradient(to right, ${GRID_LINE} 0 3px, transparent 3px 6px)`;
const INTER = "var(--font-inter), 'Helvetica Neue', Arial, sans-serif";

// One string — split on spaces, each word inks in independently.
const HEADLINE =
  "Megaprojects stall in committees. Estimates drift. Crews come and go. PAL is engineering you can stand on — one senior team, fixed scope, delivered on schedule. No delays, no overruns, no surprises.";

export default function WhyUs() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const words = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".wu-word"));
    if (words.length === 0) return;

    // Reduced motion: no scrub, just show the finished (inked) headline.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(words, { color: INK });
      return;
    }

    // The fill: each word tweens grey → ink, staggered, with the per-word tweens
    // overlapping (stagger < duration) so two or three words are mid-ink at once —
    // a soft wave rather than a hard wipe. The whole timeline is SCRUBBED by the
    // ScrollTrigger, so its progress == your scroll position through the section.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top 78%", // fill begins as the headline climbs into view
        end: "center 42%", // fully inked just as it settles past centre
        scrub: true,
      },
    });
    tl.to(words, {
      color: INK,
      ease: "power1.out",
      duration: 0.6,
      stagger: 0.4,
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Why us"
      style={{
        position: "relative", // its own section in the page flow
        width: "100%",
        minHeight: "100vh",
        background: BG,
        color: INK,
        // page.tsx's smooth-scroll wrapper is click-through (pointerEvents:none);
        // re-enable it so the CTA stays clickable.
        pointerEvents: "auto",
        overflow: "hidden",
        fontFamily: INTER,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 0",
        boxSizing: "border-box",
      }}
    >
      {/* SECTION FRAME — identical to Section 2: full-bleed dashed horizontal rules
          fitted to the page edges, and dashed vertical rails inside a centred 2000px
          track close to the content. Decorative: click-through, pinned behind. */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* a single top rule (full bleed), like Section 2's — and NO bottom rule, so
            it doesn't double up with Section 2's top rule right at the seam below. */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 1, background: GRID_H }} />
        {/* vertical rails — at the same left:48 / right:48 of the centred 2000px track
            as Section 2. They START at the cross point with the top rule (top:96) since
            this is the START of the grid, and run to bottom:0 so they flow continuously
            down into Section 2's rails. */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 1800, margin: "0 auto" }}>
          <div style={{ position: "absolute", top: 96, bottom: 0, left: 48, width: 1, background: GRID_V }} />
          <div style={{ position: "absolute", top: 96, bottom: 0, right: 48, width: 1, background: GRID_V }} />
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1800,
          margin: "0 auto",
          padding: "0 64px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        {/* pill badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            fontSize: 13,
            letterSpacing: "0.01em",
            color: "rgba(22,24,28,.55)",
            marginBottom: 40,
          }}
        >
          <span style={{ color: INK, fontWeight: 600 }}>02</span>
          <span style={{ display: "inline-block", width: 2, height: 14, background: ACCENT }} />
          <span style={{ color: INK }}>Why us</span>
          <span style={{ marginLeft: 4 }}>2026</span>
        </div>

        {/* the scroll-filled headline */}
        <h2
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "clamp(30px, 4.6vw, 64px)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          {HEADLINE.split(" ").map((word, i, arr) => (
            <span
              key={i}
              className="wu-word"
              style={{ color: MUTED, willChange: "color" }}
            >
              {word}
              {i < arr.length - 1 ? " " : ""}
            </span>
          ))}
        </h2>

        {/* CTA — pill button with a dark circular down-arrow */}
        <div style={{ marginTop: 44 }}>
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "9px 9px 9px 26px",
              borderRadius: 999,
              border: "1px solid rgba(22,24,28,.14)",
              background: "#fff",
              cursor: "pointer",
              fontFamily: INTER,
              fontSize: 16,
              fontWeight: 600,
              color: INK,
              boxShadow: "0 1px 2px rgba(22,24,28,.06)",
            }}
          >
            See how it works
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: INK,
                color: "#fff",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
