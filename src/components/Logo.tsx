import type { JSX } from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 44 }: LogoProps): JSX.Element {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 duration-300 group-hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background glowing canvas */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
      
      {/* High-quality squircle container */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 shadow-[0_4px_20px_rgba(99,102,241,0.15)] flex items-center justify-center overflow-hidden">
        {/* Subtle grid pattern inside */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:6px_6px]" />
        
        {/* Vector SVG Emblem */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-8 h-8 relative z-10" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="primaryGrad" x1="10%" y1="10%" x2="90%" y2="90%">
              <stop offset="0%" stopColor="#818CF8" /> {/* Tailwind Indigo 400 */}
              <stop offset="50%" stopColor="#6366F1" /> {/* Tailwind Indigo 500 */}
              <stop offset="100%" stopColor="#4F46E5" /> {/* Tailwind Indigo 600 */}
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F472B6" /> {/* Rose 400 */}
              <stop offset="100%" stopColor="#A78BFA" /> {/* Violet 400 */}
            </linearGradient>
            <linearGradient id="glowingBar" x1="20%" y1="0%" x2="80%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>
          </defs>

          {/* Left Document Column (Part of 'H') */}
          <path 
            d="M26 24C26 21.7909 27.7909 20 30 20H38C40.2091 20 42 21.7909 42 24V76C42 78.2091 40.2091 80 38 80H30C27.7909 80 26 78.2091 26 76V24Z" 
            fill="url(#primaryGrad)"
            opacity="0.9"
            className="transition-all duration-300 group-hover:translate-x-[-1px]"
          />

          {/* Right Document Column with Folded Corner (Perfect synthesis of H-leg and Doc folder) */}
          <path 
            d="M58 20H68C70.2091 20 72 21.7909 72 24V76C72 78.2091 70.2091 80 68 80H58C55.7909 80 54 78.2091 54 76V24C54 21.7909 55.7909 20 58 20Z" 
            fill="url(#primaryGrad)"
            opacity="0.75"
            className="transition-all duration-300 group-hover:translate-x-[1px]"
          />
          
          {/* Glowing Transliteration Arrow linking the two columns to form the 'H' and express file/translation conversion */}
          <path 
            d="M36 50H64M64 50L56 42M64 50L56 58" 
            stroke="url(#accentGrad)" 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transition-all duration-500 group-hover:stroke-[8px]"
          />

          {/* Floating script transition nodes (representing Cyrillic & Latin or document items) */}
          <circle cx="34" cy="32" r="3" fill="#FFFFFF" opacity="0.8" />
          <circle cx="34" cy="42" r="3" fill="#FFFFFF" opacity="0.5" />
          <circle cx="64" cy="68" r="3" fill="#FFFFFF" opacity="0.8" />
          <circle cx="64" cy="58" r="3" fill="#FFFFFF" opacity="0.5" />

          {/* Elegant Page fold shadow details */}
          <path d="M72 25 L64 20 L64 25 Z" fill="#4F46E5" opacity="0.3" block-size="xs" />
        </svg>
      </div>
    </div>
  );
}
