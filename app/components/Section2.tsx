"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Palette (same reference design as the hero) ─────────────────────────────
const INK = "#16181C";
const ACCENT = "#346BFF";
const BG = "#F0F0F0"; // panel background (note: no longer matches FOG_COLOR #E4E4E4 in animate.tsx)

const CARD_BG = BG;
const CARD_BORDER = "1px solid rgba(22,24,28,.05)";
const CARD_RADIUS = 18;

const FRAME_BG = "#DEDEDE";

const GRID_LINE = "rgba(22,24,28,.18)";
const GRID_V = `repeating-linear-gradient(to bottom, ${GRID_LINE} 0 3px, transparent 3px 6px)`;
const GRID_H = `repeating-linear-gradient(to right, ${GRID_LINE} 0 3px, transparent 3px 6px)`;

const INTER = "var(--font-inter), 'Helvetica Neue', Arial, sans-serif";

// ───  THE REVEAL SCROLL LENGTH  ───────────────────────────────────────────

const REVEAL_SCROLL = "150%";

type Card = {
  n: string;
  title: ReactNode;
  desc: string;
  cat: string;

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
      {/* oversized ghost index — turns accent blue on hover */}
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
          color: hover ? ACCENT : "rgba(22,24,28,.06)",
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
          stroke={INK}
          strokeWidth={1.4}
          strokeLinecap="square"
          strokeLinejoin="miter"
          style={{ transition: "stroke .5s ease", willChange: "transform, opacity" }}
        >
          {card.icon}
        </svg>

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
              color: INK,
              transition: "color .5s ease",
              willChange: "transform",
            }}
          >
            {card.title}
          </h3>
        </div>

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
              color: "rgba(22,24,28,.6)",
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
            color: "rgba(22,24,28,.5)",
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
  // Section 2 PINS the page while it reveals: when its top reaches the top of the

  const sectionRef = useRef<HTMLDivElement>(null); // the pinned section element
  const scope = useRef<HTMLDivElement>(null); // GSAP selector scope

  // ── HEADER reveal — the NORMAL way (NOT pinned/scrubbed) ────────────────────

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scope.current;
    if (!root) return;
    const q = gsap.utils.selector(scope);
    const chars = root.querySelectorAll<HTMLElement>(".s2-title-char");

    // ── hidden starting states (header only) ──
    // headline glyphs — blurred, faded and lifted just above their line
    gsap.set(chars, { filter: "blur(12px)", autoAlpha: 0, y: -40 });
    gsap.set(q(".s2-overline"), { opacity: 0, x: -20 });
    gsap.set(q(".s2-sub"), { opacity: 0, y: 24 });
    gsap.set(q(".s2-meta"), { opacity: 0, y: 16 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    // headline leads, blurring in glyph by glyph; the rest trails it
    tl.to(chars, { filter: "blur(0px)", autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.02 }, 0)
      .to(q(".s2-overline"), { opacity: 1, x: 0, duration: 0.6 }, 0.2)
      .to(q(".s2-sub"), { opacity: 1, y: 0, duration: 0.7 }, "-=0.05")
      .to(q(".s2-meta"), { opacity: 1, y: 0, duration: 0.7 }, "-=0.55");

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tl.play();
        else tl.pause(0); // out of view → rewind so it replays on re-entry
      },
      { threshold: 0.2 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      tl.kill();
      gsap.set([...chars, ...q(".s2-overline, .s2-sub, .s2-meta")], {
        clearProps: "all",
      });
    };
  }, []);

  // ── SERVICE CARDS reveal — PINNED + scrubbed by the scroll ──────────────────

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current;
    if (!section) return;
    const q = gsap.utils.selector(scope);

    // ── hidden starting states (tile COPY only) ──

    gsap.set(q(".s2-card-icon"), { autoAlpha: 0, y: 22 });
    gsap.set(q(".s2-card-title"), { yPercent: 120 });
    gsap.set(q(".s2-card-desc"), { yPercent: 120 });
    gsap.set(q(".s2-card-meta"), { autoAlpha: 0, y: 16 });


    const CARD_STAGGER = {
      each: 0.16,
      grid: [2, 3] as [number, number],
      from: "start" as const,
    };

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${REVEAL_SCROLL}`,
        pin: true,
        pinType: "transform", // section sits inside ScrollSmoother's transformed content
        scrub: true,
        invalidateOnRefresh: true,
      },
    });


    tl.add("cards")
      .to(
        q(".s2-card-icon"),
        { autoAlpha: 1, y: 0, duration: 1.1, stagger: CARD_STAGGER },
        "cards"
      )
      .to(
        q(".s2-card-title"),
        { yPercent: 0, duration: 1.4, stagger: CARD_STAGGER },
        "cards+=0.22"
      )
      .to(
        q(".s2-card-desc"),
        { yPercent: 0, duration: 1.4, stagger: CARD_STAGGER },
        "cards+=0.44"
      )
      .to(
        q(".s2-card-meta"),
        { autoAlpha: 1, y: 0, duration: 1.1, stagger: CARD_STAGGER },
        "cards+=0.66"
      );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set(q(".s2-card-icon, .s2-card-title, .s2-card-desc, .s2-card-meta"), {
        clearProps: "all",
      });
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      aria-label="What we build"
      style={{
        position: "relative", // its own section in the page flow, below the hero
        width: "100%",
        minHeight: "100vh",
        background: BG,
        color: INK,

        pointerEvents: "auto",
        overflow: "hidden",
        fontFamily: INTER, // Inter for the whole panel
      }}
    >
      {/* ── SECTION FRAME ── */}
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
      >
        {/* horizontal rules — full bleed, fitted to the page edges */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: GRID_H }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 32, height: 1, background: GRID_H }} />
        {/* vertical rails — start at the very top of the section */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: 1800,
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

          minHeight: "100vh",
          // cap the content width and centre it so the page reads narrower
          width: "100%",
          maxWidth: 1800,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",

          padding: "56px 64px 56px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* ── HEADER ── */}
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
            {/* headline — */}
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
                          color: word.startsWith("build") ? ACCENT : INK,
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


        </div>

        {/* ── SERVICES FRAME + GRID ── */}
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
