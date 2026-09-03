import React from 'react';

interface AnimatedHumanAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSpeaking?: boolean;
  className?: string;
}

export const AnimatedHumanAvatar: React.FC<AnimatedHumanAvatarProps> = ({
  size = 'md',
  isSpeaking = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      {/* Outer ambient glowing ring */}
      <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping opacity-75 pointer-events-none" />
      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-md">
        <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden relative flex items-center justify-center">
          {/* Animated Human Concierge SVG */}
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full transform translate-y-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Studio Light Glow */}
            <circle cx="60" cy="60" r="50" fill="url(#bg-gradient)" />

            {/* Human Shoulders & Uniform Coat */}
            <path
              d="M20 110 C20 85, 38 72, 60 72 C82 72, 100 85, 100 110 Z"
              fill="#064e3b"
            />
            {/* Shirt Collar */}
            <path d="M48 72 L60 88 L72 72 L60 82 Z" fill="#ffffff" />
            <path d="M56 82 L60 105 L64 82 Z" fill="#022c22" />

            {/* Human Neck */}
            <rect x="52" y="58" width="16" height="18" rx="4" fill="#fbcfe8" opacity="0.1" />
            <rect x="52" y="58" width="16" height="18" rx="4" fill="#f3d2be" />

            {/* Human Head & Face */}
            <ellipse cx="60" cy="46" rx="22" ry="24" fill="#f3d2be" />

            {/* Hair Style */}
            <path
              d="M38 42 C38 24, 48 20, 60 20 C72 20, 82 24, 82 42 C82 32, 75 22, 60 22 C45 22, 38 32, 38 42 Z"
              fill="#1e293b"
            />
            <path
              d="M38 42 C36 30, 48 18, 60 18 C72 18, 84 30, 82 42 C78 30, 70 24, 60 24 C50 24, 42 30, 38 42 Z"
              fill="#0f172a"
            />

            {/* Eyes with Animated Blinking */}
            <g className="animate-[pulse_3s_infinite]">
              <ellipse cx="49" cy="44" rx="3" ry="4" fill="#0f172a" />
              <ellipse cx="71" cy="44" rx="3" ry="4" fill="#0f172a" />
              {/* Eye Catchlights */}
              <circle cx="50" cy="42" r="1" fill="#ffffff" />
              <circle cx="72" cy="42" r="1" fill="#ffffff" />
            </g>

            {/* Eyebrows */}
            <path d="M44 37 Q49 35 54 38" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M66 38 Q71 35 76 37" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />

            {/* Nose */}
            <path d="M60 45 L58 51 L62 51" stroke="#e2a88c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Smiling Mouth with Animated Speaking state */}
            {isSpeaking ? (
              <path
                d="M50 56 Q60 66 70 56 Q60 62 50 56 Z"
                fill="#e11d48"
                className="animate-[bounce_0.6s_infinite]"
              />
            ) : (
              <path
                d="M51 56 Q60 63 69 56"
                stroke="#be123c"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Concierge Headset with Microphone */}
            <path
              d="M37 40 C36 28, 48 20, 60 20 C72 20, 84 28, 83 40"
              stroke="#64748b"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Earpiece */}
            <rect x="34" y="38" width="6" height="12" rx="3" fill="#334155" />
            {/* Mic Arm */}
            <path d="M37 46 L54 58" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            {/* Mic Head */}
            <circle cx="55" cy="58" r="3.5" fill="#10b981" className="animate-pulse" />

            {/* Gradients */}
            <defs>
              <linearGradient id="bg-gradient" x1="0" y1="0" x2="120" y2="120">
                <stop offset="0%" stopColor="#022c22" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Online Status Badge */}
      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75" />
      </div>
    </div>
  );
};
