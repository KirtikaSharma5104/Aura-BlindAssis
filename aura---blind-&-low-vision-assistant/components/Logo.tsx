
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isAnimated?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', isAnimated = true }) => {
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  return (
    <div className={`relative ${dimensions[size]} flex items-center justify-center select-none`}>
      {/* Background Glows */}
      <div className={`absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl ${isAnimated ? 'animate-pulse' : ''}`} />
      <div className={`absolute inset-4 bg-violet-400/20 rounded-full blur-xl ${isAnimated ? 'animate-ping duration-[4000ms]' : ''}`} />
      
      {/* The Main Shape */}
      <div className="relative w-full h-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(99,102,241,0.5)] overflow-hidden">
        {/* Subtle Internal Optics */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]" />
        
        {/* Aura Hybrid Symbol (A-frame + Stylized Eye) */}
        <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          {/* Main A-Frame Structure */}
          <path 
            d="M50 12 L88 88 M50 12 L12 88" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />
          
          {/* Stylized Eye (Almond shape) as the crossbar */}
          <path 
            d="M25 68 Q50 35 75 68 Q50 100 25 68 Z" 
            fill="rgba(255,255,255,0.15)"
            stroke="currentColor"
            strokeWidth="4"
            className="backdrop-blur-sm"
          />
          
          {/* The Pupil (Living core) */}
          <circle 
            cx="50" 
            cy="68" 
            r="10" 
            fill="currentColor" 
            className={isAnimated ? 'animate-pulse' : ''} 
          />
          
          {/* Catchlight on the eye pupil */}
          <circle 
            cx="54" 
            cy="64" 
            r="3" 
            fill="white" 
            fillOpacity="0.8"
          />
        </svg>
        
        {/* Orbital shimmer ring */}
        <div className={`absolute inset-2 border border-white/10 rounded-full ${isAnimated ? 'animate-[spin_15s_linear_infinite]' : ''}`} />
      </div>
    </div>
  );
};

export default Logo;
