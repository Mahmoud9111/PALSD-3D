"use client";

/*
REVIEWS — "Success Stories".

A standalone section in the page flow (rendered in page.tsx as a sibling below the
others). It shares the SAME frame as Section 2 / ProjectsGrid / WhyUs / Building so
it reads as one page: a centred 2000px track, 64px side padding, the dashed
blueprint rails (top rule at 96, side rails at 48), on the #F0F0F0 fog field.

Layout: a numbered overline + two-tone headline on the left, a quiet lead
paragraph on the right, then a 3×2 grid of testimonial cards inside the same darker
"tray" frame the other sections use. Each card carries a rating, an oversized ghost
quote mark, the quote itself, and a floating footer bar (avatar + name + role) with
a small social glyph. A row of headline stats sits below the grid.

The reveal mirrors the rest of the page: a paused GSAP timeline that an
IntersectionObserver plays when the section scrolls into view (rewinds on leave so
it replays), plus the same letter-by-letter blur-in on the headline. Honours
prefers-reduced-motion (nothing is hidden — everything just renders).
*/

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// ─── Palette (same reference design as the hero / Section 2 / ProjectsGrid) ──
const INK = "#16181C";
const ACCENT = "#346BFF";
const STAR = "#346BFF"; // the blue rating star
const BG = "#F0F0F0"; // shared with the other sections → no seam
// The "tray": a darker grey frame the whole grid sits inside — same device as
// Section 2's services frame. The padding forms the frame; the gaps between cards
// show this same darker colour. One step darker than BG so the cards float.
const FRAME_BG = "#DEDEDE";
const CARD_BG = "#F4F4F4";
const INTER = "var(--font-inter), 'Helvetica Neue', Arial, sans-serif";

// Same dashed rail as the other sections — one colour, our own dash size.
const GRID_LINE = "rgba(22,24,28,.18)";
const GRID_V = `repeating-linear-gradient(to bottom, ${GRID_LINE} 0 3px, transparent 3px 6px)`;
const GRID_H = `repeating-linear-gradient(to right, ${GRID_LINE} 0 3px, transparent 3px 6px)`;

const CARD_RADIUS = 18;

// Two-tone title: first word inks dark, the rest is the lighter grey.
const TITLE = "Success Stories.";

type Social = "x" | "in";

type Review = {
  rating: string;
  quote: string;
  name: string;
  role: string;
  // gradient fallback for the avatar disc (used when no photo is set)
  avatar: string;
  // reviewer headshot — sits in /public, drawn as a cover background on the disc
  photo?: string;
  social: Social;
};

const AV_WARM =
  "radial-gradient(120% 120% at 30% 20%, #E8A06A 0%, #B25C2E 55%, #6B3315 100%)";
const AV_COOL =
  "radial-gradient(120% 120% at 30% 20%, #8FA3C4 0%, #4D5E80 55%, #232C3D 100%)";
const AV_NEUTRAL =
  "radial-gradient(120% 120% at 30% 20%, #DADADA 0%, #9A9A9A 55%, #5C5C5C 100%)";

const REVIEWS: Review[] = [
  {
    rating: "4.9",
    quote:
      "Proactive, precise, and easy to work with — no hand-holding needed, just smooth collaboration from start to finish.",
    name: "Jared Kim",
    role: "Marketing Director",
    avatar: AV_WARM,
    photo: "/rev1.avif",
    social: "x",
  },
  {
    rating: "5.0",
    quote:
      "Felt like an embedded team with zero friction; communication was clear, and revisions landed perfectly on the first go.",
    name: "Maya Collins",
    role: "Head of Product",
    avatar: AV_COOL,
    photo: "/rev2.avif",
    social: "in",
  },
  {
    rating: "4.9",
    quote:
      "The quality was unmatched. We submitted our request on Monday and had polished designs by Wednesday.",
    name: "Jesse Leigh",
    role: "CEO & Founder",
    avatar: AV_WARM,
    photo: "/rev3.avif",
    social: "x",
  },
  {
    rating: "4.9",
    quote:
      "We've tried other design subscriptions — none compare to Formix. Professional, reliable, and seriously creative.",
    name: "Benjamin Daul",
    role: "Head of Engineering",
    avatar: AV_WARM,
    photo: "/rev1.avif",
    social: "in",
  },
  {
    rating: "5.0",
    quote:
      "Formix completely transformed the way we approach design. The turnaround time is insane and the output's always on-brand.",
    name: "Michael Joseph",
    role: "Head of Content",
    avatar: AV_NEUTRAL,
    photo: "/rev2.avif",
    social: "x",
  },
  {
    rating: "5.0",
    quote:
      "It felt like an in-house design team. Communication was seamless, and revisions were spot on from the first pass.",
    name: "Amy Louise",
    role: "Customer Success Manager",
    avatar: AV_COOL,
    photo: "/rev3.avif",
    social: "in",
  },
];

function StarIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={STAR} aria-hidden>
      <path d="M12 2l2.9 6.26L21.6 9l-5 4.6 1.34 6.9L12 17.27 6.06 20.5 7.4 13.6l-5-4.6 6.7-.74L12 2z" />
    </svg>
  );
}

function SocialGlyph({ kind }: { kind: Social }) {
  if (kind === "x") {
    return (
      <svg width={19} height={19} viewBox="0 0 24 24" fill={INK} aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    );
  }
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill={INK} aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 8.98h3.96V21H3V8.98zM9.34 8.98h3.8v1.64h.05c.53-1 1.82-2.06 3.75-2.06 4.01 0 4.75 2.64 4.75 6.07V21h-3.96v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.86V21H9.34V8.98z" />
    </svg>
  );
}

// Oversized ghost quote mark that flares in the card corner.
function QuoteMark() {
  return (
    <svg
      width={60}
      height={48}
      viewBox="0 0 60 48"
      fill="rgba(22,24,28,.10)"
      aria-hidden
      style={{ position: "absolute", top: 26, right: 28 }}
    >
      <path d="M0 48V28C0 12.5 9.5 2.5 24 0l3 7C18 9.5 13 14.5 12.5 22H24v26H0zm33 0V28C33 12.5 42.5 2.5 57 0l3 7c-9 2.5-14 7.5-14.5 15H57v26H33z" />
    </svg>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [hover, setHover] = useState(false);

  return (
    <article
      className="rv-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        background: CARD_BG,
        borderRadius: CARD_RADIUS,
        border: `1px solid ${hover ? "rgba(22,24,28,.16)" : "rgba(22,24,28,.05)"}`,
        boxShadow: hover
          ? "0 22px 48px -22px rgba(22,24,28,.40)"
          : "0 1px 2px rgba(22,24,28,.04), 0 16px 34px -22px rgba(22,24,28,.18)",
        transition: "box-shadow .5s ease, border-color .4s ease",
        aspectRatio: "1 / 0.74", // a touch wider than tall — shorter than square
        padding: 14,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <QuoteMark />

      {/* rating */}
      <div
        className="rv-card-rating"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 18px 0",
          fontSize: 18,
          fontWeight: 600,
          color: INK,
        }}
      >
        <span>{review.rating}</span>
        <StarIcon size={18} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(22,24,28,.5)",
          }}
        >
          Rating
        </span>
      </div>

      {/* quote */}
      <p
        className="rv-card-quote"
        style={{
          margin: "auto 0 26px",
          padding: "0 18px",
          maxWidth: "75%",
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1.32,
          letterSpacing: "-0.015em",
          color: INK,
        }}
      >
        &ldquo;{review.quote}&rdquo;
      </p>

      {/* footer bar — avatar + name + role on the left, social glyph right */}
      <div
        className="rv-card-foot"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          background: FRAME_BG,
          border: "1px dashed rgba(22,24,28,.14)",
          borderRadius: 18,
          padding: "20px 20px 20px 22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              width: 62,
              height: 62,
              borderRadius: "50%",
              // photo on top, gradient underneath as a fallback while it loads
              background: review.photo
                ? `url(${review.photo}) center/cover no-repeat, ${review.avatar}`
                : review.avatar,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                lineHeight: 1.1,
                color: INK,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {review.name}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#2563eb",
              }}
            >
              {review.role}
            </div>
          </div>
        </div>

        <span
          aria-hidden
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 62,
            height: 62,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid rgba(22,24,28,.08)",
          }}
        >
          <SocialGlyph kind={review.social} />
        </span>
      </div>
    </article>
  );
}

export default function Reviews() {
  const scope = useRef<HTMLDivElement>(null); // GSAP selector scope + IO target

  // ── Reveal: overline / lead / cards / stats develop when scrolled into view ──
  // A paused timeline an IntersectionObserver plays on entry (rewinds on leave so
  // it replays). The headline plays its OWN blur-in below. Reduced motion: bail so
  // nothing is ever hidden.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scope.current;
    if (!root) return;
    const q = gsap.utils.selector(scope);

    gsap.set(q(".rv-overline"), { opacity: 0, x: -20 });
    gsap.set(q(".rv-lead"), { opacity: 0, y: 16 });

    const t = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    t.to(q(".rv-overline"), { opacity: 1, x: 0, duration: 0.6 })
      .to(q(".rv-lead"), { opacity: 1, y: 0, duration: 0.7 }, "-=0.4");
      // the cards render in place — no reveal animation

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) t.play();
        else t.pause(0);
      },
      { threshold: 0.15 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      t.kill();
      gsap.set(q(".rv-overline, .rv-lead"), { clearProps: "all" });
    };
  }, []);

  // ── Self-revealing headline — the SAME blur-in cascade as the other sections ──
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scope.current;
    if (!root) return;
    const titleEl = root.querySelector(".rv-title");
    const chars = root.querySelectorAll<HTMLElement>(".rv-title-char");
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
      aria-label="Success stories"
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
              className="rv-overline"
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
              <span style={{ color: INK, fontWeight: 600 }}>07</span>
              <span style={{ display: "inline-block", width: 2, height: 14, background: ACCENT }} />
              <span style={{ color: INK }}>Reviews</span>
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
                className="rv-title"
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
                          className="rv-title-char"
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
            className="rv-lead"
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
            Discover how our design subscription helps innovative brands grow
            smarter and faster.
          </p>
        </div>

        {/* ── REVIEWS FRAME + GRID ──
            The frame is a darker "tray" the whole grid sits inside (same device
            as Section 2's services frame): the 8px padding forms the frame, and
            the gaps between cards show this same darker colour. */}
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
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {REVIEWS.map((review) => (
              <ReviewCard key={review.name} review={review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
