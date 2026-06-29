import React from 'react';
import { cn } from '../../lib/utils';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export function FilterChip({ label, active, onClick, className }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
        active
          ? 'bg-[#CFFF0F] text-gray-950 shadow-md shadow-[#CFFF0F]/20'
          : 'bg-white dark:bg-[#13161A] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#14181E] border border-gray-100 dark:border-[#22272F]',
        className
      )}
    >
      {label}
    </button>
  );
}
