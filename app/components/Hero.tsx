"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import HeroModel from "./HeroModel";

// Palette lifted from the PAL reference design.
const INK = "#16181C";
const PAPER = "#E9E8E3";
const ACCENT = "#FF4A1C";
const MONO = "ui-monospace, monospace";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduce) {
        gsap.set([".pal-char", ".pal-label"], { yPercent: 0 });
        gsap.set(
          [
            ".pal-brand",
            ".pal-cta",
            ".pal-overline",
            ".pal-tagline",
            ".pal-right-vert",
            ".pal-bottomleft",
            ".pal-scroll",
          ],
          { opacity: 1, x: 0, y: 0 }
        );
        return;
      }

      // ---- initial hidden states ----
      gsap.set(".pal-char", { yPercent: 130 });
      gsap.set(".pal-brand", { y: -18, opacity: 0 });
      gsap.set(".pal-cta", { y: -18, opacity: 0 });
      gsap.set(".pal-overline", { x: -24, opacity: 0 });
      gsap.set(".pal-tagline", { y: 20, opacity: 0 });
      gsap.set(".pal-right-vert", { x: 24, opacity: 0 });
      gsap.set(".pal-bottomleft", { y: 18, opacity: 0 });
      gsap.set(".pal-scroll", { y: 18, opacity: 0 });

      // ---- intro timeline ----
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

    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="pal-stage relative min-h-dvh overflow-hidden"
      style={{
        background: PAPER,
        color: INK,
        fontFamily: "'Body Grotesque Fit', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* 3D hero model — full-screen background, drag to rotate */}
      <div className="absolute inset-0 z-0">
        <HeroModel />
      </div>

      {/* Text overlay — pointer-events pass through to the canvas except on links */}
      <div
        className="absolute inset-0 z-10"
        style={{ padding: "34px 48px 64px 48px", pointerEvents: "none" }}
      >
        {/* ===== TOP-LEFT: burger + brand mark ===== */}
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

        {/* ===== TOP-RIGHT: availability + contact CTA ===== */}
        <div
          className="pal-topright pal-cta"
          style={{
            position: "absolute",
            top: 34,
            right: 48,
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

        {/* ===== RIGHT EDGE: vertical services ===== */}
        <div
          className="pal-right-vert"
          style={{
            position: "absolute",
            right: 22,
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

        {/* ===== HERO BLOCK (left-anchored logotype) ===== */}
        <div
          className="pal-hero-block"
          style={{
            position: "absolute",
            left: 88,
            top: "50%",
            transform: "translateY(-50%)",
            maxWidth: "62vw",
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
              marginBottom: 26,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span
              style={{ display: "inline-block", width: 34, height: 1, background: ACCENT }}
            />
            Engineering &amp; Construction — Est. 1998
          </div>

          <h1
            className="pal-logotype"
            style={{
              margin: 0,
              fontWeight: 400,
              lineHeight: 0.82,
              fontSize: "clamp(96px, 16vw, 204px)",
              display: "flex",
              
            }}
          >
            {["P", "A", "L", "S","D"].map((c) => (
              <span
                key={c}
                className="pal-charwrap"
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  // top/right/bottom room so glyph ink (P bowl, A apex) isn't clipped;
                  // no left pad keeps "P" aligned to the 48px edge.
                  padding: "0.06em 0.05em 0.08em 0",
                  // tighten letters via margin instead of letter-spacing, which would
                  // narrow the overflow box and clip the glyphs again.
                  marginRight: "-0.05em",

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
              margin: "2px 0 0 0",
              maxWidth: 640,
              fontFamily: "var(--font-geist-sans), 'Helvetica Neue', Arial, sans-serif",
              fontSize: "clamp(18px, 1.8vw, 22px)",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: "rgba(22,24,28,0.82)",
            }}
          >
            We build the infrastructure the world runs on — bridges, highways, and the
            structures that hold it all up.
          </p>
        </div>

        {/* ===== BOTTOM-LEFT: location / coordinates ===== */}
        <div
          className="pal-bottomleft"
          style={{
            position: "absolute",
            left: 48,
            bottom: 46,
            fontFamily: MONO,
            fontSize: 16,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            lineHeight: 1.7,
            color: "rgba(22,24,28,0.6)",
            zIndex: 5,
          }}
        >
          Denver, Colorado
          <br />
          <span style={{ color: "rgba(22,24,28,0.4)" }}>
            39.7392° N&nbsp;&nbsp;104.9903° W
          </span>
        </div>

        {/* ===== BOTTOM-RIGHT: scroll indicator ===== */}
        <div
          className="pal-scroll"
          style={{
            position: "absolute",
            right: 48,
            bottom: 46,
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
    </section>
  );
}
