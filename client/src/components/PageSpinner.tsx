"use client";

import { useEffect, useRef } from "react";

interface PageSpinnerProps {
  message?: string;
}

export default function PageSpinner({ message = "Loading..." }: PageSpinnerProps) {
  const particlesRef = useRef<HTMLDivElement>(null);

  const activeMessages = [
    message !== "Loading..." ? message : "Preparing your store",
    "Loading collections",
    "Almost ready",
  ];

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      p.className = "loader-particle";
      const sz = (Math.random() * 3 + 1.5).toFixed(1);
      p.style.cssText = `
        width:${sz}px; height:${sz}px;
        left:${(Math.random() * 100).toFixed(1)}%;
        animation-duration:${(Math.random() * 3 + 3).toFixed(1)}s;
        animation-delay:${(Math.random() * 4).toFixed(1)}s;
      `;
      container.appendChild(p);
    }
    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <>
      <style>{`
        .loader-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--color-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 0;
        }

        .loader-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .loader-particle {
          position: absolute;
          border-radius: 50%;
          background: var(--color-teal);
          bottom: -8px;
          animation: loaderFloatUp linear infinite;
        }

        @keyframes loaderFloatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }

        .loader-scene {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 1;
        }

        .loader-logo-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          margin-bottom: 32px;
        }

        .loader-letter-ghost {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 56px;
          font-weight: 700;
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(47,65,86,0.08);
          user-select: none;
        }

        .loader-letter-fill {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 56px;
          font-weight: 700;
          color: var(--color-ink);
          user-select: none;
          clip-path: inset(100% 0 0 0);
          animation: loaderLetterReveal 2.4s cubic-bezier(.76,0,.24,1) infinite;
        }

        @keyframes loaderLetterReveal {
          0%   { clip-path: inset(100% 0 0 0); }
          40%  { clip-path: inset(0% 0 0 0); }
          60%  { clip-path: inset(0% 0 0 0); }
          100% { clip-path: inset(0% 0 100% 0); }
        }

        .loader-orbit {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          animation: loaderOrbit 2.4s linear infinite;
        }

        @keyframes loaderOrbit { to { transform: rotate(360deg); } }

        .loader-orbit-dot {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--color-teal);
        }

        .loader-brand {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--color-ink);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .loader-sub {
          font-family: var(--font-sans);
          font-size: 11px;
          color: rgba(47,65,86,0.5);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 36px;
        }

        .loader-track {
          width: 180px;
          height: 1.5px;
          background: rgba(47,65,86,0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .loader-bar {
          height: 100%;
          width: 0;
          background: var(--color-teal);
          border-radius: 2px;
          animation: loaderProgress 2.4s cubic-bezier(.76,0,.24,1) infinite;
        }

        @keyframes loaderProgress {
          0%   { width: 0%;   opacity: 1; }
          70%  { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }

        .loader-status {
          font-family: var(--font-sans);
          font-size: 11px;
          color: rgba(47,65,86,0.5);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          height: 16px;
          overflow: hidden;
        }

        .loader-status-inner {
          display: flex;
          flex-direction: column;
          animation: loaderStatusCycle 7.2s steps(1) infinite;
        }

        .loader-status-inner span {
          height: 16px;
          line-height: 16px;
          white-space: nowrap;
        }

        @keyframes loaderStatusCycle {
          0%    { transform: translateY(0); }
          33.3% { transform: translateY(-16px); }
          66.6% { transform: translateY(-32px); }
          100%  { transform: translateY(0); }
        }
      `}</style>

      <div className="loader-root">
        <div className="loader-particles" ref={particlesRef} />

        <div className="loader-scene">
          <div className="loader-logo-wrap">
            <span className="loader-letter-ghost">A</span>
            <span className="loader-letter-fill">A</span>
            <div className="loader-orbit">
              <div className="loader-orbit-dot" />
            </div>
          </div>

          <div className="loader-brand">Arihant</div>
          <div className="loader-sub">School Uniforms</div>

          <div className="loader-track">
            <div className="loader-bar" />
          </div>

          <div className="loader-status">
            <div className="loader-status-inner">
              {activeMessages.map((msg) => (
                <span key={msg}>{msg}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Inline spinner — use inside a card/section, not full page */
export function InlineSpinner({ message = "Loading..." }: PageSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="absolute inset-0 border border-gray-200" />
        <div className="absolute inset-0 border border-[var(--color-teal)] border-t-transparent animate-spin duration-1000" />
      </div>
      <p className="text-gray-400 font-heading uppercase tracking-wider text-[10px] animate-pulse">
        {message}
      </p>
    </div>
  );
}
