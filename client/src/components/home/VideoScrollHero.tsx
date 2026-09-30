"use client";

import React, { useEffect, useRef } from "react";

const SCENES = [
  { t: 0, label: "Stillness" },
  { t: 4, label: "Pattern Emergence" },
  { t: 10, label: "Carousel" },
  { t: 14, label: "Selection" },
  { t: 17, label: "Transformation" },
  { t: 20, label: "Arihant" },
];

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, alpha: number) {
  return a + (b - a) * alpha;
}

export default function VideoScrollHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lblRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const dotsWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    const bar = barRef.current;
    const lbl = lblRef.current;
    const hint = hintRef.current;
    const dotsWrap = dotsWrapRef.current;
    if (!video || !root || !bar || !lbl || !hint || !dotsWrap) return;

    let targetTime = 0;   // where scroll says we should be
    let currentTime = 0;   // where we currently are (lerped)
    let rafId = 0;
    let running = false;

    /* ── 1. Read scroll position into targetTime ───────────────────── */
    function readScroll() {
      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      const scrollable = root.offsetHeight - window.innerHeight;
      const raw = Math.max(0, Math.min(1, (window.scrollY - rootTop) / scrollable));
      const eased = easeInOut(raw);
      targetTime = eased * (video.duration || 22);

      hint.style.opacity = raw < 0.03 ? "1" : "0";
      bar.style.width = `${raw * 100}%`;
    }

    /* ── 2. RAF loop: lerp currentTime → targetTime ────────────────── */
    function tick() {
      const LERP_SPEED = 0.12;        // 0.08 = very smooth, 0.18 = snappier
      const MIN_DELTA = 0.01;        // stop lerping below this (seconds)

      const diff = targetTime - currentTime;

      if (Math.abs(diff) < MIN_DELTA) {
        /* Close enough — snap and stop the loop */
        currentTime = targetTime;
        applyTime(currentTime);
        running = false;
        return;
      }

      currentTime = lerp(currentTime, targetTime, LERP_SPEED);
      applyTime(currentTime);
      rafId = requestAnimationFrame(tick);
    }

    /* ── 3. Write currentTime to video + UI ────────────────────────── */
    function applyTime(t: number) {
      /* Only seek when the gap is meaningful — prevents decode storms */
      if (Math.abs(video.currentTime - t) > 0.025) {
        video.currentTime = t;
      }

      /* Scene label + dots */
      let si = 0;
      SCENES.forEach((s, i) => { if (t >= s.t) si = i; });

      const raw = t / (video.duration || 22);
      lbl.textContent = SCENES[si].label;
      lbl.style.opacity = (raw > 0.01 && raw < 0.99) ? "1" : "0";

      const dots = Array.from(dotsWrap.children) as HTMLDivElement[];
      dots.forEach((d, i) => {
        d.style.backgroundColor = i === si ? "#8B2500" : "rgba(139,37,0,0.2)";
        d.style.transform = i === si ? "scale(1.5)" : "scale(1)";
      });
    }

    /* ── 4. Scroll handler — just updates targetTime, kicks RAF ────── */
    function onScroll() {
      readScroll();
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(tick);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    video.addEventListener("loadedmetadata", onScroll);

    // Call once to set initial state in case video is already loaded or page is refreshed halfway down
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      video.removeEventListener("loadedmetadata", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative h-[600vh] w-full bg-[#0a0a0a]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#F5EFE0] will-change-transform">

        {/* Video */}
        <video
          ref={videoRef}
          src="/hero-video.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover will-change-transform [transform:translateZ(0)]"
        />

        {/* Progress bar */}
        <div
          ref={barRef}
          className="absolute bottom-0 left-0 h-[2px] bg-[#8B2500] w-0 will-change-[width] [transform:translateZ(0)]"
        />

        {/* Scene label */}
        <div
          ref={lblRef}
          className="absolute top-8 left-1/2 -translate-x-1/2 font-serif text-[11px] tracking-[0.2em] text-[#8B2500] uppercase opacity-0 transition-opacity duration-300 whitespace-nowrap"
        >
          {SCENES[0].label}
        </div>

        {/* Scroll hint */}
        <div
          ref={hintRef}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-opacity duration-500"
        >
          <span className="font-serif text-[10px] tracking-[0.2em] text-[#8B2500] uppercase">
            Scroll to reveal
          </span>
          <svg className="animate-bounce" width="16" height="16" fill="none"
            stroke="#8B2500" strokeWidth="1.5" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Scene dots */}
        <div
          ref={dotsWrapRef}
          className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2"
        >
          {SCENES.map((_, i) => (
            <div
              key={i}
              className="w-[5px] h-[5px] rounded-full transition-all duration-300"
              style={{ backgroundColor: "rgba(139,37,0,0.2)" }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}