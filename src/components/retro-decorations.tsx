import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * 70s Style Wavy / Scalloped Section Divider
 */
export function RetroWave({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-none ${className} ${flip ? "rotate-180" : ""}`}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="relative block w-full h-8 md:h-12 text-orange-200/50 fill-current"
      >
        <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,-20 1200,40 L1200,120 L0,120 Z" />
      </svg>
    </div>
  );
}

/**
 * Playful 70s Daisy / Flower Doodle with subtle idle floating/rotation
 */
export function RetroFlower({
  className = "",
  size = 24,
  color = "#F97316",
  centerColor = "#FBBF24",
  animate = true,
}: {
  className?: string;
  size?: number;
  color?: string;
  centerColor?: string;
  animate?: boolean;
}) {
  const flowerSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
    >
      {/* 6 round petals */}
      <circle cx="12" cy="5" r="3.5" fill={color} />
      <circle cx="18" cy="8.5" r="3.5" fill={color} />
      <circle cx="18" cy="15.5" r="3.5" fill={color} />
      <circle cx="12" cy="19" r="3.5" fill={color} />
      <circle cx="6" cy="15.5" r="3.5" fill={color} />
      <circle cx="6" cy="8.5" r="3.5" fill={color} />
      {/* Center disk */}
      <circle cx="12" cy="12" r="3.5" fill={centerColor} stroke="#fff" strokeWidth="1" />
    </svg>
  );

  if (!animate) return <div className={`inline-block ${className}`}>{flowerSvg}</div>;

  return (
    <motion.div
      className={`inline-block ${className}`}
      animate={{
        rotate: [0, 8, -6, 0],
        scale: [1, 1.05, 0.98, 1],
      }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {flowerSvg}
    </motion.div>
  );
}

/**
 * 4-Point Retro Sparkle with gentle pulse animation
 */
export function RetroSparkle({
  className = "",
  size = 20,
  color = "#F59E0B",
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`shrink-0 inline-block drop-shadow-xs ${className}`}
      animate={{
        scale: [1, 1.25, 1],
        opacity: [0.8, 1, 0.8],
        rotate: [0, 30, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" />
    </motion.svg>
  );
}

/**
 * Cartoon Illustrated Avatar seeded by name for consistent, delightful profile faces
 */
export function CartoonAvatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const seed = encodeURIComponent(name || "ProjectMatch");
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede,b6e3f4&radius=50`;

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-amber-100 border-2 border-orange-300 shadow-sm shrink-0 flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      {!error ? (
        <img
          src={avatarUrl}
          alt={`${name}'s avatar`}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
          loading="lazy"
        />
      ) : (
        <span className="font-bold text-orange-800 text-sm">
          {name ? name.slice(0, 2).toUpperCase() : "PM"}
        </span>
      )}
    </div>
  );
}

/**
 * Animated Number Counter (counting smoothly from 0 to value)
 */
export function AnimatedCounter({ value, duration = 0.8 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = 0;
    const endVal = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.round(startVal + (endVal - startVal) * ease));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}
