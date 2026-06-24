"use client";

/*
SECTION 2 — Services panel ("WHAT WE BUILD").

A standalone section in the page flow, rendered in page.tsx as a sibling right
below the hero (<Animate />). Its background is #F0F0F0 — the exact fog colour the
hero ends on — so as you scroll past the truck's fog whiteout, this section rises
up out of that same field with no visible seam; one simply becomes the other.

It owns only its layout, look, and its OWN reveal: the reveal is a paused GSAP
timeline that an IntersectionObserver plays when the section scrolls into view
(and rewinds when it leaves, so it replays on re-entry). No external scroll
listener drives it any more — it is fully self-contained.

Type: an engineering-drawing services grid — corner registration marks, a faint
48px gridline field, a title block with a drawing reference, and six discipline
tiles. Each tile sweeps to ink on hover (the ghost number flares orange, the
copy inverts to paper). Everything is set in Inter; only the page title is set
in caps.
*/

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";

// ─── Palette (same reference design as the hero) ─────────────────────────────
const INK = "#16181C";
const ACCENT = "#FF4A1C";
const BG = "#F0F0F0"; // panel background (note: no longer matches FOG_COLOR #E4E4E4 in animate.tsx)
const PAPER = "#E4E4E4"; // the copy colour once a tile sweeps to ink
// Card surface: now matches the panel background exactly, so each tile reads as
// an inset card floating in the darker frame tray below — the shadow still lifts
// it off, and the gaps between tiles show the tray's darker grey.
const CARD_BG = BG;
const CARD_BORDER = "1px solid rgba(22,24,28,.05)";
const CARD_RADIUS = 18;
// The services "tray": a darker grey frame the whole grid sits inside. A little
// padding all round forms the frame; the smaller gaps between tiles show this
// same darker colour. One step darker than BG so the BG-coloured tiles float.
const FRAME_BG = "#DEDEDE";
// A faint dashed "stroke" that outlines the section. One line colour, built into
// two repeating gradients (V runs down the side rails, H runs along the top/bottom
// rules) so the dash size is ours to set, not the browser's `border: dashed`.
// Small, fine dashes: 3px on / 3px off.
const GRID_LINE = "rgba(22,24,28,.18)";
const GRID_V = `repeating-linear-gradient(to bottom, ${GRID_LINE} 0 3px, transparent 3px 6px)`;
const GRID_H = `repeating-linear-gradient(to right, ${GRID_LINE} 0 3px, transparent 3px 6px)`;
// Inter is the only face on this panel (registered in layout.tsx). The whole
// subtree inherits it from the root; the small "drawing label" feel is carried
// by caps + tracking rather than a monospace face.
const INTER = "var(--font-inter), 'Helvetica Neue', Arial, sans-serif";

type Card = {
  n: string;
  title: ReactNode;
  desc: string;
  cat: string;
  // the inner SVG paths; the <svg> wrapper (and its hover-driven stroke) is
  // built in ServiceCard. Accent strokes carry their own colour so they stay
  // orange through the hover invert.
  icon: ReactNode;
};

const CARDS: Card[] = [
  {
    n: "01",
    title: (
      <>
        Bridges &amp;
        <br />
        Viaducts
      </>
    ),
    desc: "Long-span steel and segmental concrete crossings.",
    cat: "Civil · Structural",
    icon: (
      <>
        <line x1="2" y1="38" x2="46" y2="38" />
        <line x1="12" y1="38" x2="12" y2="12" />
        <line x1="36" y1="38" x2="36" y2="12" />
        <path d="M2 30 C 12 12, 36 12, 46 30" stroke={ACCENT} />
        <line x1="6" y1="33" x2="6" y2="38" />
        <line x1="19" y1="22" x2="19" y2="38" />
        <line x1="29" y1="22" x2="29" y2="38" />
        <line x1="42" y1="33" x2="42" y2="38" />
      </>
    ),
  },
  {
    n: "02",
    title: (
      <>
        Highways &amp;
        <br />
        Roads
      </>
    ),
    desc: "Interchanges, grading, paving and drainage.",
    cat: "Infrastructure",
    icon: (
      <>
        <path d="M16 4 L4 44" />
        <path d="M32 4 L44 44" />
        <line x1="24" y1="6" x2="24" y2="12" stroke={ACCENT} />
        <line x1="24" y1="18" x2="24" y2="26" stroke={ACCENT} />
        <line x1="24" y1="32" x2="24" y2="42" stroke={ACCENT} />
      </>
    ),
  },
  {
    n: "03",
    title: (
      <>
        Structural
        <br />
        Steel
      </>
    ),
    desc: "Fabrication, erection and connection design.",
    cat: "Fabrication",
    icon: (
      <>
        <line x1="6" y1="42" x2="42" y2="42" />
        <line x1="6" y1="6" x2="42" y2="6" />
        <path d="M6 42 L24 6 L42 42" stroke={ACCENT} />
        <path d="M6 42 L15 6" />
        <path d="M42 42 L33 6" />
        <path d="M24 6 L24 42" />
      </>
    ),
  },
  {
    n: "04",
    title: <>Earthworks</>,
    desc: "Excavation, mass grading and site preparation.",
    cat: "Civil · Grading",
    icon: (
      <>
        <path d="M2 40 L18 24 L30 32 L46 14" stroke={ACCENT} />
        <line x1="2" y1="40" x2="46" y2="40" />
        <line x1="2" y1="46" x2="46" y2="46" strokeDasharray="3 3" />
        <line x1="10" y1="40" x2="10" y2="46" />
        <line x1="24" y1="40" x2="24" y2="46" />
        <line x1="38" y1="40" x2="38" y2="46" />
      </>
    ),
  },
  {
    n: "05",
    title: (
      <>
        Heavy
        <br />
        Civil
      </>
    ),
    desc: "Dams, tunnels and large-scale public works.",
    cat: "Public Works",
    icon: (
      <>
        <path d="M8 44 L8 16 A16 16 0 0 1 40 16 L40 44" stroke={ACCENT} />
        <line x1="4" y1="44" x2="44" y2="44" />
        <line x1="16" y1="44" x2="16" y2="20" />
        <line x1="24" y1="44" x2="24" y2="14" />
        <line x1="32" y1="44" x2="32" y2="20" />
      </>
    ),
  },
  {
    n: "06",
    title: (
      <>
        Rail &amp;
        <br />
        Transit
      </>
    ),
    desc: "Track, stations and grade-separation works.",
    cat: "Transit",
    icon: (
      <>
        <path d="M18 4 L10 44" />
        <path d="M30 4 L38 44" />
        <line x1="6" y1="14" x2="42" y2="14" stroke={ACCENT} />
        <line x1="5" y1="24" x2="43" y2="24" />
        <line x1="4" y1="34" x2="44" y2="34" />
      </>
    ),
  },
];

// A single discipline tile. Owns its own hover state so the ink sweep, the
// orange ghost flare and the copy invert all run off one boolean. (CSS :hover
// can't override inline styles without !important, and this file is fully
// inline-styled — so the hover lives in state.)
function ServiceCard({ card }: { card: Card }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="s2-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: hover
          ? "0 22px 48px -20px rgba(22,24,28,.40)"
          : "0 1px 2px rgba(22,24,28,.04), 0 16px 34px -22px rgba(22,24,28,.20)",
        transition: "box-shadow .5s ease",
        padding: "36px 32px",
        minHeight: 300,
        display: "flex",
        cursor: "pointer",
      }}
    >
      {/* ink sweep — rises from the bottom edge on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: INK,
          clipPath: hover ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
          transition: "clip-path .6s cubic-bezier(.16,1,.3,1)",
          zIndex: 0,
        }}
      />

      {/* oversized ghost index — flares orange as the sweep covers it */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 8,
          right: 18,
          fontWeight: 600,
          fontSize: 120,
          lineHeight: 1,
          letterSpacing: "-0.05em",
          color: hover ? "rgba(255,74,28,.85)" : "rgba(22,24,28,.06)",
          transition: "color .5s ease",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {card.n}
      </span>

      <div
        className="s2-card-body"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <svg
          className="s2-card-icon"
          width={54}
          height={54}
          viewBox="0 0 48 48"
          fill="none"
          stroke={hover ? PAPER : INK}
          strokeWidth={1.4}
          strokeLinecap="square"
          strokeLinejoin="miter"
          style={{ transition: "stroke .5s ease", willChange: "transform, opacity" }}
        >
          {card.icon}
        </svg>

        {/* title — rises up from behind this mask on reveal. The padding +
            negative margins give the glyphs room (so ascenders/descenders aren't
            clipped at rest) without shifting the surrounding layout. */}
        <div
          style={{
            overflow: "hidden",
            marginTop: "calc(24px - 0.14em)",
            marginBottom: "-0.14em",
            paddingTop: "0.14em",
            paddingBottom: "0.14em",
          }}
        >
          <h3
            className="s2-card-title"
            style={{
              margin: 0,
              fontWeight: 500,
              fontSize: 30,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: hover ? PAPER : INK,
              transition: "color .5s ease",
              willChange: "transform",
            }}
          >
            {card.title}
          </h3>
        </div>

        {/* description — pushed to the bottom (auto top margin), rises from behind
            its own mask just after the title. */}
        <div
          style={{
            margin: "auto 0 -0.14em",
            overflow: "hidden",
            paddingTop: "0.14em",
            paddingBottom: "0.14em",
          }}
        >
          <p
            className="s2-card-desc"
            style={{
              margin: 0,
              maxWidth: 230,
              fontSize: 14,
              lineHeight: 1.45,
              color: hover ? "rgba(228,228,228,.75)" : "rgba(22,24,28,.6)",
              transition: "color .5s ease",
              willChange: "transform",
            }}
          >
            {card.desc}
          </p>
        </div>

        <div
          className="s2-card-meta"
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: hover ? "rgba(228,228,228,.6)" : "rgba(22,24,28,.5)",
            transition: "color .5s ease",
            willChange: "transform, opacity",
          }}
        >
          <span>{card.cat}</span>
          {/* arrow keeps its own orange through the invert */}
          <span style={{ color: ACCENT }}>→</span>
        </div>
      </div>
    </div>
  );
}

export default function Section2() {
  // Section 2 is now its own normal section in the page flow (rendered in
  // page.tsx, below the hero). The reveal is a PAUSED GSAP timeline that plays
  // itself the moment the section scrolls into view, and rewinds when it leaves
  // so it replays on re-entry — it no longer owns, nor is scrubbed by, any
  // external scroll. Honours prefers-reduced-motion (no hidden states set).
  const scope = useRef<HTMLDivElement>(null); // GSAP selector scope

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scope.current;
    if (!root) return;
    const q = gsap.utils.selector(scope);

    // ── hidden starting states ──
    gsap.set(q(".s2-overline"), { opacity: 0, x: -20 });
    gsap.set(q(".s2-sub"), { opacity: 0, y: 24 });
    gsap.set(q(".s2-meta"), { opacity: 0, y: 16 });
    // tile COPY hidden — the boxes themselves stay visible the whole time. The
    // title and description sit BELOW their masks (yPercent 120); the icon and
    // meta line start faded + dropped. (Nothing is set on .s2-card, so the boxes
    // never animate on reveal.)
    gsap.set(q(".s2-card-icon"), { autoAlpha: 0, y: 22 });
    gsap.set(q(".s2-card-title"), { yPercent: 120 });
    gsap.set(q(".s2-card-desc"), { yPercent: 120 });
    gsap.set(q(".s2-card-meta"), { autoAlpha: 0, y: 16 });

    // The supporting header copy + the six discipline tiles. The HEADLINE is NOT
    // here — it plays its OWN one-shot reveal when it scrolls into view (see the
    // self-revealing headline effect below), so it runs at its own pace.
    const t = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    t.to(q(".s2-overline"), { opacity: 1, x: 0, duration: 0.6 })
      // info line trails the overline by a touch more now (less overlap) so it
      // reveals with a little extra delay behind the headline.
      .to(q(".s2-sub"), { opacity: 1, y: 0, duration: 0.7 }, "-=0.05")
      .to(q(".s2-meta"), { opacity: 1, y: 0, duration: 0.7 }, "-=0.55");

    // ── the tile COPY develops (the boxes themselves never animate) ──
    // Only the copy reveals, and slowly: the icon fades up, then the title and
    // then the description each RISE out from behind their own mask, then the
    // meta line settles. Every layer staggers diagonally across the 2×3 grid
    // (from the top-left), so the whole field unfolds line-by-line — no blunt
    // box-wipe. Wider per-tile stagger = a slower, more deliberate wave across
    // the grid (each tile gets its own moment, not the whole field popping at once).
    const CARD_STAGGER = {
      each: 0.16,
      grid: [2, 3] as [number, number],
      from: "start" as const,
    };
    t.add("cards", "-=0.1")
      .to(
        q(".s2-card-icon"),
        { autoAlpha: 1, y: 0, duration: 1.1, ease: "power2.out", stagger: CARD_STAGGER },
        "cards"
      )
      .to(
        q(".s2-card-title"),
        { yPercent: 0, duration: 1.4, ease: "power2.out", stagger: CARD_STAGGER },
        "cards+=0.22"
      )
      .to(
        q(".s2-card-desc"),
        { yPercent: 0, duration: 1.4, ease: "power2.out", stagger: CARD_STAGGER },
        "cards+=0.44"
      )
      .to(
        q(".s2-card-meta"),
        { autoAlpha: 1, y: 0, duration: 1.1, ease: "power2.out", stagger: CARD_STAGGER },
        "cards+=0.66"
      );

    // Play the reveal once the section scrolls into view; rewind when it leaves
    // so it replays each time you come back to it.
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
      gsap.set(
        q(
          ".s2-overline, .s2-sub, .s2-meta, .s2-card-icon, .s2-card-title, .s2-card-desc, .s2-card-meta"
        ),
        { clearProps: "all" }
      );
    };
  }, []);

  // ── Self-revealing headline (Framer-style "text reveal", but GSAP) ──────────
  // Runs independently of the reveal timeline above: the headline plays its OWN
  // one-shot blur-in the moment it scrolls into view, at its own pace. An
  // IntersectionObserver arms it; when the headline leaves the viewport the
  // timeline rewinds, so it replays each time the section scrolls back into view.
  // Honours prefers-reduced-motion: with it on, nothing is hidden and the
  // headline just renders normally.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scope.current;
    if (!root) return;
    const titleEl = root.querySelector(".s2-title");
    const chars = root.querySelectorAll<HTMLElement>(".s2-title-char");
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
      { threshold: 0.5 } // fire once the headline is comfortably (50%) in view
    );
    io.observe(titleEl);

    return () => {
      io.disconnect();
      reveal.kill();
      gsap.set(chars, { clearProps: "filter,opacity,visibility,transform" });
    };
  }, []);

  return (
    <div
      aria-label="What we build"
      style={{
        position: "relative", // its own section in the page flow, below the hero
        width: "100%",
        minHeight: "100vh",
        background: BG,
        color: INK,
        // page.tsx's smooth-scroll wrapper is click-through (pointerEvents:none)
        // so it never eats hover over the fixed scene; re-enable it here so this
        // section's cards/links stay interactive.
        pointerEvents: "auto",
        overflow: "hidden",
        fontFamily: INTER, // Inter for the whole panel
      }}
    >
      {/* ── SECTION FRAME ──
          Dashed "stroke" framing the section: the two horizontal rules run full
          bleed, fitted to the page edges; the two vertical rails sit in a centred
          track so they hug close to the cards. They cross at the corners.
          Decorative: click-through, pinned BEHIND the content (scope = zIndex 1). */}
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
      >
        {/* horizontal rules — full bleed, fitted to the page edges */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 1, background: GRID_H }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 32, height: 1, background: GRID_H }} />
        {/* vertical rails — in the centred content track, close to the cards */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: 2000,
            margin: "0 auto",
          }}
        >
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 48, width: 1, background: GRID_V }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 48, width: 1, background: GRID_V }} />
        </div>
      </div>

      <div
        ref={scope}
        style={{
          position: "relative",
          zIndex: 1, // content sits above the blueprint grid
          // 100vh (not 100%) so this flex column has a real, resolved height:
          // its parent (#smooth-content) is auto-height, so a percentage min-height
          // collapses to nothing and the frame below can't flex-grow — that's what
          // left the dead space under the cards. With a viewport height the frame
          // (flex:1) absorbs the leftover and the 1fr card rows stretch to fill it.
          minHeight: "100vh",
          // cap the content width and centre it so the page reads narrower
          width: "100%",
          maxWidth: 2000,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          // extra top padding clears the persistent top bar (burger + CTA) that
          // floats above this panel — see the PERSISTENT TOP BAR in animate.tsx
          padding: "132px 64px 56px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* ── HEADER ──
            Restyled to the "case study" type: a numbered overline with a red
            registration tick, a big mixed-case headline, and a quiet corner link
            on the right — airy, no heavy rule. */}
        <div
          style={{
            position: "relative",
            zIndex: 1, // above the blueprint frame
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 40,
            marginBottom: 48,
          }}
        >
          <div>
            <div
              className="s2-overline"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 13,
                letterSpacing: "0.01em",
                color: "rgba(22,24,28,.55)",
                marginBottom: 22,
              }}
            >
              <span style={{ color: INK, fontWeight: 600 }}>01</span>
              <span
                style={{ display: "inline-block", width: 2, height: 14, background: ACCENT }}
              />
              <span style={{ color: INK }}>Services</span>
              <span style={{ marginLeft: 4 }}>2026</span>
            </div>
            {/* headline — revealed letter-by-letter with a blur-in (filter
                blur 10→0, fade, and a drop from above), 20ms apart. Each glyph is
                its own inline-block span so the GSAP reveal can stagger across
                them; words are wrapped in a nowrap span so they never break
                mid-word. overflow:visible (paddings/margins still cancel to keep
                layout unchanged) so the lifted, blurred glyphs aren't clipped. */}
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
                className="s2-title"
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: "clamp(42px, 6vw, 84px)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.03em",
                  color: INK,
                }}
              >
                {"What we build.".split(" ").map((word, wi, words) => (
                  <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                    {word.split("").map((char, ci) => (
                      <span
                        key={ci}
                        className="s2-title-char"
                        style={{
                          display: "inline-block",
                          willChange: "transform, filter, opacity",
                        }}
                      >
                        {char}
                      </span>
                    ))}
                    {wi < words.length - 1 ? " " : null}
                  </span>
                ))}
              </h2>
            </div>
            {/* subtitle — quiet muted line under the headline */}
            <p
              className="s2-sub"
              style={{
                margin: "20px 0 0",
                maxWidth: 560,
                fontSize: "clamp(14px, 1.4vw, 17px)",
                lineHeight: 1.5,
                color: "rgba(22,24,28,.6)",
              }}
            >
              From foundation to finish — six disciplines, one accountable team.
            </p>
          </div>

          {/* corner link, echoing "Full case study ↗" */}
          <span
            className="s2-meta"
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              fontSize: 14,
              fontWeight: 500,
              color: INK,
              borderBottom: `1px solid ${INK}`,
              paddingBottom: 4,
              cursor: "pointer",
            }}
          >
            All services
            <span aria-hidden style={{ color: INK }}>
              ↗
            </span>
          </span>
        </div>

        {/* ── SERVICES FRAME + GRID ──
            The frame is a darker "tray" the whole grid sits inside: a little
            padding all round forms the frame, and the tightened gaps between
            tiles show this same darker colour. It flex-grows to absorb the
            panel's leftover height so the cards fill the page — no dead space on
            tall screens. The inner grid stretches to fill the frame; the 1fr rows
            stretch the cards and minHeight on the card keeps them honest on short
            screens (the panel scrolls instead). */}
        <div
          style={{
            position: "relative",
            zIndex: 1, // above the blueprint frame
            flex: "1 1 auto",
            minHeight: 0,
            display: "flex",
            background: FRAME_BG,
            borderRadius: CARD_RADIUS + 8,
            padding: 8,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gridAutoRows: "1fr",
              gap: 10,
            }}
          >
            {CARDS.map((card) => (
              <ServiceCard key={card.n} card={card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
