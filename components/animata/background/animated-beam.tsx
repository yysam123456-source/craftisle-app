import { cn } from "@/lib/utils";

import "./animated-beam.css";

// Deterministic 0–1 pseudo-random from an integer — same on server and client,
// so each beam gets its own length/speed/etc. without a hydration mismatch.
const prand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const lerp = (min: number, max: number, t: number) => min + (max - min) * t;

// Enough 40px lanes to cover wide screens; extras are clipped by overflow-hidden,
// so the line count stays responsive without measuring the container.
const LANES = 64;

function Beam({ index }: { index: number }) {
  // Every dimension is varied per beam and exposed as a CSS variable.
  // ~30% are quick zips (1.2–3.2s); the rest drift slowly (6–14s).
  const fast = prand(index + 91) < 0.3;
  const duration = fast ? lerp(1.2, 3.2, prand(index)) : lerp(6, 14, prand(index));
  const delay = lerp(0, 9, prand(index + 13));
  const length = Math.round(lerp(24, 84, prand(index + 29))); // streak length
  const width = Math.round(lerp(3, 7, prand(index + 53)));
  // fast streaks read brighter, like real meteors
  const opacity = fast ? lerp(0.8, 1, prand(index + 71)) : lerp(0.35, 0.9, prand(index + 71));

  return (
    <div
      className="ab-beam h-full"
      style={
        {
          "--duration": `${duration.toFixed(2)}s`,
          "--delay": `${delay.toFixed(2)}s`,
          "--length": `${length}px`,
          "--opacity": opacity.toFixed(2),
          width: `${width}px`,
          transform: "translateY(-20%)",
          // `backwards` shows the 0% keyframe (opacity 0) during the delay, so a
          // beam never peeks at its resting position before its run begins.
          animation: "meteor var(--duration) var(--delay) ease-in-out infinite backwards",
        } as React.CSSProperties
      }
    >
      <div
        className="w-full"
        style={{
          height: "var(--length)",
          clipPath: "polygon(54% 0, 54% 0, 60% 100%, 40% 100%)",
        }}
      >
        <div className="h-full w-full bg-linear-to-b from-blue-400/80 via-violet-400/70 via-75% to-blue-500/80" />
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="relative w-full flex flex-row justify-center overflow-hidden">
      {/* fixed-width lanes → constant 40px spacing, clipped to whatever fits */}
      {Array.from({ length: LANES }, (_, i) => (
        <div key={i} className="flex h-full w-10 shrink-0 justify-center">
          <div className="relative h-full w-px rotate-12 bg-blue-400/10">
            {/* beam rides this diagonal line; ~30% of lanes get one */}
            {prand(i + 7) < 0.3 && <Beam index={i + 1} />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnimatedBeam({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("full-content relative w-full overflow-hidden", className)} style={style}>
      <Background />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}
