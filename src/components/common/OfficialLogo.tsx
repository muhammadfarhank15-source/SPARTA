import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface OfficialLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({ className = '', size = 'md' }) => {
  const { uptSettings } = useApp();
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9 rounded-lg',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-28 h-28 sm:w-36 sm:h-36 rounded-3xl',
  };

  const logoSrc = uptSettings.logoUrl || '/assets/logo.png';

  if (!hasError && logoSrc) {
    return (
      <div
        className={`relative inline-flex items-center justify-center overflow-hidden bg-slate-950/80 border-2 border-amber-400/70 shadow-xl shrink-0 select-none p-1 ${sizeClasses[size]} ${className}`}
        title="Logo Resmi SPARTA RUJENTO Rutan Kelas IIB Jeneponto"
      >
        <img
          src={logoSrc}
          alt="Logo Resmi SPARTA RUJENTO"
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Official SPARTA RUJENTO Styled Vector Emblem
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-md border border-amber-300 text-white font-bold select-none shrink-0 ${sizeClasses[size]} ${className}`}
      title="Logo Resmi SPARTA RUJENTO"
    >
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className="w-4/5 h-4/5 drop-shadow"
      >
        {/* Outer Shield */}
        <path
          d="M50 5 L88 22 C88 55 72 82 50 95 C28 82 12 55 12 22 Z"
          fill="#0B192C"
          stroke="#FACC15"
          strokeWidth="3.5"
        />
        {/* Inner Golden Wings / Scale Symbol */}
        <circle cx="50" cy="40" r="13" fill="#FACC15" />
        <path
          d="M50 25 L50 62 M34 40 L66 40"
          stroke="#0B192C"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Bottom Laurel Branches */}
        <path
          d="M30 63 C40 73 60 73 70 63"
          fill="none"
          stroke="#FACC15"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="30" cy="63" r="2.5" fill="#FACC15" />
        <circle cx="70" cy="63" r="2.5" fill="#FACC15" />
        {/* Star Top */}
        <polygon
          points="50,11 53,17 60,17 55,22 57,28 50,24 43,28 45,22 40,17 47,17"
          fill="#FACC15"
        />
        {/* Emblem Text "SPARTA" Ribbon */}
        <rect x="24" y="73" width="52" height="13" rx="3" fill="#FACC15" />
        <text
          x="50"
          y="82.5"
          fill="#0B192C"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="Montserrat, sans-serif"
          textAnchor="middle"
          letterSpacing="0.8"
        >
          SPARTA
        </text>
      </svg>
    </div>
  );
};
