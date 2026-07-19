"use client";

import { useState } from "react";

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

const CONFETTI_COLORS = ["#00f0ff", "#ff2ee6", "#ffd84a", "#eaf6ff", "#4dffb8"];

function ConfettiBurst() {
  const [pieces] = useState<ConfettiPiece[]>(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.6 + Math.random() * 0.8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti-fall absolute top-0 h-2 w-2"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function LightningStrike() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-lightning-flash absolute inset-0 bg-[#bdf4ff]" />
      <svg
        className="animate-lightning-bolt absolute left-1/2 top-0 h-full w-24 -translate-x-1/2"
        viewBox="0 0 40 200"
        fill="none"
        style={{ filter: "drop-shadow(0 0 10px #00f0ff) drop-shadow(0 0 22px #00f0ff)" }}
      >
        <path d="M22 0 L4 90 L18 90 L10 200 L36 80 L20 80 Z" fill="#eaf6ff" />
      </svg>
      <svg
        className="animate-lightning-bolt absolute left-1/2 top-0 h-full w-16 translate-x-6"
        viewBox="0 0 40 200"
        fill="none"
        style={{ filter: "drop-shadow(0 0 8px #ff2ee6)", animationDelay: "80ms" }}
      >
        <path d="M20 0 L6 80 L16 80 L8 200 L32 70 L18 70 Z" fill="#ff2ee6" opacity="0.85" />
      </svg>
    </div>
  );
}

function Shockwave() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <span className="animate-shockwave-ring absolute h-10 w-10 rounded-full border-4 border-[#00f0ff]" />
      <span className="animate-shockwave-ring absolute h-10 w-10 rounded-full border-4 border-[#ff2ee6]" style={{ animationDelay: "120ms" }} />
    </div>
  );
}

function GlitchBurst() {
  const bars = [12, 26, 41, 53];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-glitch-flicker absolute inset-0 bg-[#0b1220]" />
      {bars.map((top, i) => (
        <span
          key={top}
          className="animate-glitch-bar absolute left-0 block h-2 w-full"
          style={{
            top: `${top}%`,
            background: i % 2 === 0 ? "#ff2ee6" : "#00f0ff",
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

function Supernova() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <span className="animate-supernova-core absolute h-6 w-6 rounded-full bg-white" />
      <span className="animate-supernova-flash absolute inset-0 bg-white" />
    </div>
  );
}

interface VictoryAnimationProps {
  animation: string;
}

export function VictoryAnimation({ animation }: VictoryAnimationProps) {
  if (animation === "animation:confetti") return <ConfettiBurst />;
  if (animation === "animation:lightning") return <LightningStrike />;
  if (animation === "animation:shockwave") return <Shockwave />;
  if (animation === "animation:glitchBurst") return <GlitchBurst />;
  if (animation === "animation:supernova") return <Supernova />;
  return null;
}
