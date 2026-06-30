"use client";

/*
PROJECTS GRID — "Selected Work".

A standalone section in the page flow (rendered in page.tsx as a sibling below the
others). It shares the SAME frame as Section 2 / WhyUs / Building so it reads as
one page: a centred 2000px track, 64px side padding, the dashed blueprint rails
(top rule at 96, side rails at 48), 100vh tall, on the #F0F0F0 fog field.

Layout: a numbered overline + two-tone headline on the left, a quiet lead
paragraph on the right, then a 2×2 grid of project cards that flex-grows to fill
the section height (no dead space on tall screens, same as Section 2's tray). Each
card is a media tile with a floating white footer bar (name + category) and a dark
arrow button; it lifts and inks its border on hover. A "View all projects" pill
sits centred below the grid.

The reveal mirrors the rest of the page: a paused GSAP timeline that an
IntersectionObserver plays when the section scrolls into view (rewinds on leave so
it replays), plus the same letter-by-letter blur-in on the headline. Honours
prefers-reduced-motion (nothing is hidden — everything just renders).

PROJECTS below carries the content. Drop a real photo URL into a card's `image`
and it replaces the gradient placeholder; otherwise the gradient `tone` is used.
*/

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// ─── Palette (same reference design as the hero / Section 2 / Building) ──────
const INK = "#16181C";
const ACCENT = "#346BFF";
const BG = "#F0F0F0"; // shared with WhyUs + Section 2 + Building → no seam
// The "tray": a darker grey frame the whole grid sits inside — same device as
// Section 2's services frame. The 8px padding forms the frame; the gaps between
// cards show this same darker colour. One step darker than BG so the cards float.
const FRAME_BG = "#DEDEDE";
const INTER = "var(--font-inter), 'Helvetica Neue', Arial, sans-serif";

// Same dashed rail as WhyUs / Section 2 / Building — one colour, our own dash size.
const GRID_LINE = "rgba(22,24,28,.18)";
const GRID_V = `repeating-linear-gradient(to bottom, ${GRID_LINE} 0 3px, transparent 3px 6px)`;
const GRID_H = `repeating-linear-gradient(to right, ${GRID_LINE} 0 3px, transparent 3px 6px)`;

const CARD_RADIUS = 18;

// Two-tone title: first word inks dark, the rest is the lighter grey.
const TITLE = "Selected Work.";

type Project = {
  name: string;
  cat: string; // "<discipline> / <year>"
  // CSS background for the media tile (used when `image` is absent). Light/dark
  // alternate down the grid to echo the reference's checkerboard of renders.
  tone: string;
  image?: string; // optional real photo URL — replaces the gradient when set
};

// Light/dark gradient placeholders that read like premium product renders, so the
// section looks finished before real photography lands. Swap in `image` per card.
const TONE_LIGHT =
  "radial-gradient(130% 120% at 28% 22%, rgba(255,255,255,.85) 0%, rgba(255,255,255,0) 55%), linear-gradient(150deg, #EAE8E3 0%, #D2D0CA 70%, #C4C2BC 100%)";
const TONE_DARK =
  "radial-gradient(130% 120% at 72% 18%, rgba(150,160,170,.40) 0%, rgba(150,160,170,0) 55%), linear-gradient(150deg, #23262B 0%, #131519 70%, #0A0B0D 100%)";

const PROJECTS: Project[] = [
  { name: "Sundt Crossing", cat: "Bridges & Viaducts / 2026", tone: TONE_LIGHT, image: "/3.jpg" },
  { name: "Vista Interchange", cat: "Highways & Roads / 2026", tone: TONE_DARK, image: "/4.jpg" },
  { name: "Mesa Transit Hub", cat: "Rail & Transit / 2025", tone: TONE_LIGHT, image: "/5.jpg" },
  { name: "Crest Viaduct", cat: "Heavy Civil / 2025", tone: TONE_DARK, image: "/3.jpg" },
];

// Up-right arrow used by the card buttons and the "View all" pill.
function ArrowUpRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

// A single project tile. Owns its hover state so the media zoom, the border ink
// and the lifted shadow all run off one boolean (CSS :hover can't override the
// inline styles this file uses without !important).
function ProjectCard({ project }: { project: Project }) {
  const [hover, setHover] = useState(false);

  return (
    <article
      className="pg-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: CARD_RADIUS,
        border: `1px solid ${hover ? "rgba(22,24,28,.85)" : "rgba(22,24,28,.08)"}`,
        boxShadow: hover
          ? "0 26px 52px -22px rgba(22,24,28,.45)"
          : "0 1px 2px rgba(22,24,28,.04), 0 16px 34px -22px rgba(22,24,28,.22)",
        transition: "box-shadow .5s ease, border-color .4s ease",
        aspectRatio: "4 / 3", // landscape — shorter than square but a bit taller than 16/10
        cursor: "pointer",
        willChange: "transform, opacity",
      }}
    >
      {/* media — gradient placeholder, or the real photo when `image` is set */}
      <div
        className="pg-card-media"
        style={{
          position: "absolute",
          inset: 0,
          background: project.image ? `#0A0B0D url(${project.image})` : project.tone,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: hover ? "scale(1.045)" : "scale(1)",
          transition: "transform .7s cubic-bezier(.16,1,.3,1)",
        }}
      />

      {/* legibility wash under the footer bar */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(10,11,13,.22) 0%, rgba(10,11,13,0) 38%)",
          pointerEvents: "none",
        }}
      />

      {/* floating footer bar — name + category on the left, arrow button right */}
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          background: "#fff",
          borderRadius: 14,
          padding: "12px 12px 12px 22px",
          boxShadow: "0 8px 22px -10px rgba(22,24,28,.40)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: INK,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {project.name}
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 12,
              letterSpacing: "0.04em",
              color: "rgba(22,24,28,.5)",
            }}
          >
            {project.cat}
          </div>
        </div>

        <span
          aria-hidden
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 46,
            height: 46,
            borderRadius: 12,
            background: hover ? ACCENT : INK,
            color: "#fff",
            transition: "background .35s ease",
          }}
        >
          <ArrowUpRight size={18} />
        </span>
      </div>
    </article>
  );
}

export default function ProjectsGrid() {
  const scope = useRef<HTMLDivElement>(null); // GSAP selector scope + IO target

  // ── Reveal: overline / lead / cards develop when the section scrolls in ──────
  // A paused timeline an IntersectionObserver plays on entry (rewinds on leave so
  // it replays). The headline plays its OWN blur-in below. Reduced motion: bail so
  // nothing is ever hidden.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scope.current;
    if (!root) return;
    const q = gsap.utils.selector(scope);

    gsap.set(q(".pg-overline"), { opacity: 0, x: -20 });
    gsap.set(q(".pg-lead"), { opacity: 0, y: 16 });
    gsap.set(q(".pg-cta"), { opacity: 0, y: 16 });

    const t = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    t.to(q(".pg-overline"), { opacity: 1, x: 0, duration: 0.6 })
      .to(q(".pg-lead"), { opacity: 1, y: 0, duration: 0.7 }, "-=0.4")
      // the cards render in place — no reveal animation
      .to(q(".pg-cta"), { opacity: 1, y: 0, duration: 0.7 }, "-=0.3");

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) t.play();
        else t.pause(0);
      },
      { threshold: 0.2 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      t.kill();
      gsap.set(q(".pg-overline, .pg-lead, .pg-cta"), { clearProps: "all" });
    };
  }, []);

  // ── Self-revealing headline — the SAME blur-in cascade as Section 2 / Building ─
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scope.current;
    if (!root) return;
    const titleEl = root.querySelector(".pg-title");
    const chars = root.querySelectorAll<HTMLElement>(".pg-title-char");
    if (!titleEl || chars.length === 0) return;

    gsap.set(chars, { filter: "blur(12px)", autoAlpha: 0, y: -40 });
    const reveal = gsap.timeline({ paused: true });
    reveal.to(chars, {
      filter: "blur(0px)",
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.02,
      delay: 0.4,
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal.play();
        else reveal.pause(0);
      },
      { threshold: 0.5 }
    );
    io.observe(titleEl);

    return () => {
      io.disconnect();
      reveal.kill();
      gsap.set(chars, { clearProps: "filter,opacity,visibility,transform" });
    };
  }, []);

  return (
    <section
      aria-label="Selected work"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: BG,
        color: INK,
        // page.tsx's smooth-scroll wrapper is click-through; re-enable here.
        pointerEvents: "auto",
        overflow: "hidden",
        fontFamily: INTER,
      }}
    >
      {/* ── SECTION FRAME — full-bleed top/bottom rules + the centred 2000px rails ── */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 1, background: GRID_H }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 32, height: 1, background: GRID_H }} />
        <div style={{ position: "absolute", inset: 0, maxWidth: 1800, margin: "0 auto" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 48, width: 1, background: GRID_V }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 48, width: 1, background: GRID_V }} />
        </div>
      </div>

      {/* ── CONTENT TRACK — centred 2000px, 132px top pad (clears the top bar) ── */}
      <div
        ref={scope}
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          width: "100%",
          maxWidth: 1800,
          margin: "0 auto",
          padding: "132px 64px 56px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── HEADER — overline + two-tone headline (left), lead paragraph (right) ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 40,
            marginBottom: 44,
          }}
        >
          <div>
            <div
              className="pg-overline"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 13,
                letterSpacing: "0.01em",
                color: "rgba(22,24,28,.55)",
                marginBottom: 26,
              }}
            >
              <span style={{ color: INK, fontWeight: 600 }}>05</span>
              <span style={{ display: "inline-block", width: 2, height: 14, background: ACCENT }} />
              <span style={{ color: INK }}>Our work</span>
              <span style={{ marginLeft: 4 }}>2026</span>
            </div>

            {/* headline — letter-by-letter blur-in; overflow:visible (margins cancel)
                so the lifted, blurred glyphs aren't clipped during the reveal */}
            <div
              style={{
                overflow: "visible",
                paddingTop: "0.14em",
                paddingBottom: "0.14em",
                marginTop: "-0.14em",
                marginBottom: "-0.14em",
              }}
            >
              <h2
                className="pg-title"
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "clamp(40px, 6vw, 80px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                }}
              >
                {TITLE.split(" ").map((word, wi, words) => {
                  const muted = wi > 0; // first word inks dark, the rest is accent blue
                  return (
                    <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                      {word.split("").map((char, ci) => (
                        <span
                          key={ci}
                          className="pg-title-char"
                          style={{
                            display: "inline-block",
                            color: muted ? ACCENT : INK,
                            willChange: "transform, filter, opacity",
                          }}
                        >
                          {char}
                        </span>
                      ))}
                      {wi < words.length - 1 ? " " : null}
                    </span>
                  );
                })}
              </h2>
            </div>
          </div>

          {/* lead paragraph — right-aligned, sits at the headline's baseline */}
          <p
            className="pg-lead"
            style={{
              flexShrink: 0,
              maxWidth: 340,
              margin: "0 0 10px",
              fontSize: "clamp(14px, 1.2vw, 16px)",
              lineHeight: 1.55,
              textAlign: "right",
              color: "rgba(22,24,28,.6)",
            }}
          >
            A look at some of the infrastructure we&apos;ve delivered — and the
            communities it carries forward.
          </p>
        </div>

        {/* ── PROJECT FRAME + GRID ──
            The frame is a darker "tray" the whole grid sits inside (same device
            as Section 2's services frame): the 8px padding all round forms the
            frame, and the gaps between cards show this same darker colour. The
            inner 2×2 is SQUARE cards (rows size to the card height, so the section
            grows past 100vh rather than stretching the cards). */}
        <div
          style={{
            background: FRAME_BG,
            borderRadius: CARD_RADIUS + 8,
            padding: 8,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
          >
            {PROJECTS.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </div>

        {/* ── VIEW ALL — centred pill below the grid ── */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <button
            type="button"
            className="pg-cta"
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
            View all projects
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
              <ArrowUpRight size={16} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
