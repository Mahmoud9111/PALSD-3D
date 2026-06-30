"use client";

/*
BUILDING — "Headline Top · Road Below".

A left-aligned headline on top, and below it a one-point perspective ROAD that
recedes straight back to a CENTRED vanishing point ("the future"). The headline
reveals letter-by-letter (same blur-in as Section 2's title) and breathes.

To resize anything, use the SIZE CONTROLS block right below — nothing else needs
touching. The road's coordinate space IS its pixel size, so the numbers you set
are the numbers you get (no hidden scaling / distortion on desktop).
*/

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

//  SIZE CONTROLS  —  the only knobs. Change these.
const SECTION_HEIGHT = "100vh"; // height of the whole section ("100vh", "900px", …)
const ROAD_HEIGHT = 700; // road height, px  (how tall the road is)
const VP_HEIGHT = 0.14; // future-point height: 0 = very top of road, 1 = bottom


//  STROKE CONTROLS  —  the road lines' SPREAD + THICKNESS (px)
// These tune how wide the road's lines fan out from the centred future-point:
const EDGE_SPREAD = 0.8; // outer road edges: 0 = at the centre, 1 = out on the rails
const LANE_SPREAD = 0.42; // inner lane lines: 0 = at the centre, 1 = out on the rails
const EDGE_STROKE = 1.6; // px thickness of the outer road-edge strokes
const LANE_STROKE = 1; //   px thickness of the inner lane strokes
const CENTER_STROKE = 3; // px thickness of the orange centre lane
const HORIZON_STROKE = 2; // px thickness of the horizon line

// ─── Derived geometry (don't touch — built from the knobs above) ─────────────
const VBW = 2000;
const H = ROAD_HEIGHT;
const VP_X = VBW / 2; // ← the "future" vanishing point is CENTRED between the rails
const VP_Y = H * VP_HEIGHT;
const EDGE_X = VP_X * EDGE_SPREAD; // outer road-edge offset from the centre
const LANE_X = VP_X * LANE_SPREAD; // inner lane offset from the centre

// ─── Palette (same reference design as the hero / Section 2) ─────────────────
const INK = "#16181C";
const ACCENT = "#346BFF";
const BG = "#F0F0F0"; // shared with WhyUs + Section 2 → no seam
const ROAD_NEAR = "#F0F0F0"; // road surface near the viewer (a clear, visible asphalt)
const ROAD_FAR = "#F0F0F0"; // road surface near the horizon (lightens into the fog)
const MONO = "ui-monospace, 'Space Mono', monospace";
const INTER = "var(--font-inter), 'Helvetica Neue', Arial, sans-serif";

// Same dashed rail as WhyUs / Section 2 — one colour, our own dash size.
const GRID_LINE = "rgba(22,24,28,.18)";
const GRID_V = `repeating-linear-gradient(to bottom, ${GRID_LINE} 0 3px, transparent 3px 6px)`;
const GRID_H = `repeating-linear-gradient(to right, ${GRID_LINE} 0 3px, transparent 3px 6px)`;

// One string → revealed letter-by-letter (the accent word inks orange).
const HEADLINE = "Building infrastructure that moves communities forward.";

// Perspective rails: [bottomX, opacity, drawDelay, strokeWidth]. Outer pair = the
// road edges (at EDGE_SPREAD); inner pair = lane divisions (at LANE_SPREAD, fainter,
// drawn a touch later). All x-positions come straight from the SPREAD knobs above.
const RAILS: [number, number, number, number][] = [
  [VP_X - EDGE_X, 0.4, 0.1, EDGE_STROKE], //  left road edge (EDGE_SPREAD=1 → LEFT rail)
  [VP_X + EDGE_X, 0.4, 0.1, EDGE_STROKE], // right road edge (EDGE_SPREAD=1 → RIGHT rail)
  [VP_X - LANE_X, 0.18, 0.28, LANE_STROKE], // inner lane (left)
  [VP_X + LANE_X, 0.18, 0.28, LANE_STROKE], // inner lane (right)
];

// Loop animations. The reduced-motion block freezes every `.bld-anim` element on
// its resting frame (the inline attrs already hold that finished state).
const KEYFRAMES = `
@keyframes bld-breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes bld-drawIn  { 0% { stroke-dashoffset: 1; } 22%,82% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 1; } }
@keyframes bld-dashFlow { to { stroke-dashoffset: -240; } }
@keyframes bld-pulseRing { 0% { transform: scale(.5); opacity: .6; } 70% { transform: scale(2.6); opacity: 0; } 100% { opacity: 0; } }
@keyframes bld-fadeUp { 0% { opacity: 0; transform: translateY(14px); } 24%,80% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(14px); } }
@media (prefers-reduced-motion: reduce) {
  .bld-anim { animation: none !important; }
}
`;

export default function Building() {
  const scope = useRef<HTMLDivElement>(null); // GSAP selector scope + IO target
  const roadRef = useRef<HTMLDivElement>(null); // ScrollTrigger target for the rail draw-in

  // ── Self-revealing headline — the SAME blur-in cascade as Section 2's title ──
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scope.current;
    if (!root) return;
    const titleEl = root.querySelector(".bld-title");
    const chars = root.querySelectorAll<HTMLElement>(".bld-title-char");
    if (!titleEl || chars.length === 0) return;

    // hidden start — each glyph blurred, faded and lifted just above its line
    gsap.set(chars, { filter: "blur(12px)", autoAlpha: 0, y: -40 });
    const reveal = gsap.timeline({ paused: true });
    reveal.to(chars, {
      filter: "blur(0px)",
      autoAlpha: 1,
      y: 0,
      duration: 0.8, // per-letter reveal length
      ease: "power3.out",
      stagger: 0.02, // 20ms between letters — the cascade delay
      delay: 0.4, // hold a beat after it scrolls into view before the cascade starts
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal.play();
        else reveal.pause(0); // out of view → rewind so it replays on re-entry
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

  // ── Rail draw-in keeps its ORIGINAL looping animation — it just STARTS when
  // the road scrolls into view (frozen on its first frame until then). ──
  useEffect(() => {
    const road = roadRef.current;
    if (!road) return;
    const rails = road.querySelectorAll<SVGLineElement>(".bld-rail");
    if (rails.length === 0) return;

    // Reduced motion → no loop; just show the road fully drawn.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rails.forEach((r) => {
        r.style.animation = "none";
        r.style.strokeDashoffset = "0";
      });
      return;
    }

    const st = ScrollTrigger.create({
      trigger: road,
      start: "top 70%", // the scroll point where the draw-in kicks off
      once: true, // start it once, then let it loop on its own
      onEnter: () => {
        rails.forEach((r) => (r.style.animationPlayState = "running"));
      },
    });

    return () => st.kill();
  }, []);

  return (
    <section
      aria-label="Building the future"
      style={{
        position: "relative",
        width: "100%",
        minHeight: SECTION_HEIGHT,
        background: BG,
        color: INK,
        // page.tsx's smooth-scroll wrapper is click-through; re-enable here.
        pointerEvents: "auto",
        overflow: "hidden",
        fontFamily: INTER,
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* ── SECTION FRAME — full-bleed top rule + the shared centred-2000px rails ── */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 1, background: GRID_H }} />
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
          minHeight: SECTION_HEIGHT,
          width: "100%",
          maxWidth: 1800,
          margin: "0 auto",
          padding: "132px 64px 0",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── TOP META ROW — drawing-label flavour ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(22,24,28,0.5)",
            marginBottom: 40,
          }}
        >
          <span>
            <span style={{ color: INK, fontWeight: 700 }}>003</span> &nbsp;·&nbsp; Statement
          </span>
          <span>Bearing 000° &nbsp; 0 → ∞</span>
        </div>

        {/* ── HEADLINE (left-aligned, breathes, reveals letter-by-letter) ── */}
        <header
          className="bld-anim"
          style={{
            maxWidth: 820,
            willChange: "transform",
            animation: "bld-breathe 8s ease-in-out infinite",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: ACCENT,
              marginBottom: 24,
            }}
          >
            <span style={{ display: "inline-block", width: 30, height: 1, background: ACCENT }} />
            Moving communities forward
          </div>

          {/* overflow:visible (paddings/margins cancel to keep layout unchanged) so
              the lifted, blurred glyphs aren't clipped during the reveal. */}
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
              className="bld-title"
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: "clamp(40px, 6vw, 80px)",
                lineHeight: 0.98,
                letterSpacing: "-0.03em",
              }}
            >
              {HEADLINE.split(" ").map((word, wi, words) => {
                const accent = wi === words.length - 1; // "forward."
                return (
                  <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                    {word.split("").map((char, ci) => (
                      <span
                        key={ci}
                        className="bld-title-char"
                        style={{
                          display: "inline-block",
                          color: accent ? ACCENT : undefined,
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

          <p
            style={{
              margin: "22px 0 0",
              maxWidth: 540,
              fontSize: "clamp(15px, 1.4vw, 18px)",
              lineHeight: 1.55,
              color: "rgba(22,24,28,0.62)",
            }}
          >
            Every project points the same direction — toward regions that move faster,
            connect further, and stand longer.
          </p>
        </header>


        <div
          ref={roadRef}
          style={{
            position: "relative",
            flexGrow: 1, // fill the leftover height so the road reaches the section bottom (no gap)
            minHeight: H, // never collapse below the intended road size
            marginTop: 40, // gap between the headline and the road
            marginLeft: -16, //  reach out from the 64px content padding …
            marginRight: -16, // … to the 48px grid rails on each side
          }}
        >
          <svg
            viewBox={`0 0 ${VBW} ${H}`}
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            style={{ display: "block", position: "absolute", inset: 0 }}
          >
            <defs>
              <linearGradient id="bld-road" x1="0" y1={VP_Y} x2="0" y2={H} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={ROAD_FAR} />
                <stop offset="1" stopColor={ROAD_NEAR} />
              </linearGradient>
            </defs>

            {/* road surface — base spans the outer edges, up to the centred VP */}
            <polygon points={`${VP_X - EDGE_X},${H} ${VP_X + EDGE_X},${H} ${VP_X},${VP_Y}`} fill="url(#bld-road)" />

            {/* horizon — rail to rail */}
            <line
              x1="0"
              y1={VP_Y}
              x2={VBW}
              y2={VP_Y}
              stroke={INK}
              strokeOpacity="0.18"
              strokeWidth={HORIZON_STROKE}
              vectorEffect="non-scaling-stroke"
            />

            {/* perspective rails — outer pair lands on the grid rails; each draws in.
                strokeWidth is real px (non-scaling-stroke), so the size knobs are exact. */}
            {RAILS.map(([bx, op, delay, sw], i) => (
              <line
                key={i}
                className="bld-rail"
                x1={bx}
                y1={H}
                x2={VP_X}
                y2={VP_Y + 6}
                pathLength="1"
                stroke={INK}
                strokeOpacity={op}
                strokeWidth={sw}
                vectorEffect="non-scaling-stroke"
                strokeDasharray="1"
                strokeDashoffset="1"
                style={{
                  animation: "bld-drawIn 9s cubic-bezier(.22,1,.36,1) infinite",
                  animationDelay: `${delay}s`,
                  // start frozen — the scroll trigger below flips this to "running"
                  animationPlayState: "paused",
                }}
              />
            ))}

            {/* streaming centre lane — straight up the middle into the node */}
            <line
              className="bld-anim"
              x1={VP_X}
              y1={H}
              x2={VP_X}
              y2={VP_Y + 12}
              stroke={ACCENT}
              strokeWidth={CENTER_STROKE}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="22 28"
              strokeDashoffset="0"
              style={{ animation: "bld-dashFlow 1.1s linear infinite" }}
            />
          </svg>

          {/* vanishing node + label — a CSS overlay pinned to the centred VP so the
              ring stays a perfect circle (the SVG above is X-stretched). */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              // percentage (not px) so the node stays on the rails' convergence
              // point when the road stretches to fill the section.
              top: `${VP_HEIGHT * 100}%`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            {/* pulsing ring */}
            <span
              className="bld-anim"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 44,
                height: 44,
                marginLeft: -22,
                marginTop: -22,
                border: `1.5px solid ${ACCENT}`,
                borderRadius: "50%",
                transformOrigin: "center",
                animation: "bld-pulseRing 2.4s ease-out infinite",
              }}
            />
            {/* solid core */}
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 10,
                height: 10,
                marginLeft: -5,
                marginTop: -5,
                background: ACCENT,
                borderRadius: "50%",
              }}
            />
            {/* label — wrapper holds the position, inner span carries the fadeUp */}
            <div style={{ position: "absolute", left: 0, top: 0, transform: "translate(-50%, calc(-100% - 22px))" }}>
              <span
                className="bld-anim"
                style={{
                  display: "block",
                  whiteSpace: "nowrap",
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: ACCENT,
                  animation: "bld-fadeUp 9s ease infinite",
                }}
              >
                THE FUTURE →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
