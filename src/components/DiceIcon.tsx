import React from 'react';
import { DiceType } from '../types';

interface DiceIconProps {
  type: DiceType;
  className?: string;
  size?: number;
}

export const DiceIcon: React.FC<DiceIconProps> = ({ type, className = 'w-6 h-6', size = 24 }) => {
  switch (type) {
    case 'd4':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 3L2 20h20L12 3z" />
          <path d="M12 3v17" />
          <path d="M7 11.5l10 0" />
        </svg>
      );
    case 'd6':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
          <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'd8':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2L3 12l9 10 9-10L12 2z" />
          <path d="M3 12h18" />
          <path d="M12 2v20" />
        </svg>
      );
    case 'd10':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2L3 9l9 13 9-13-9-7z" />
          <path d="M12 2v20" />
          <path d="M3 9l9 5 9-5" />
        </svg>
      );
    case 'd20':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          <polygon points="12,2 17,12 12,22 7,12" />
          <line x1="2" y1="8.5" x2="22" y2="8.5" />
          <line x1="2" y1="15.5" x2="22" y2="15.5" />
        </svg>
      );
    case 'd100':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
          <text x="12" y="14" fontSize="8" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none">100</text>
        </svg>
      );
  }
};
