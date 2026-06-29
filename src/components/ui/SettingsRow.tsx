import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsRowProps {
  icon?: React.ReactNode;
  title: string;
  helper?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  className?: string;
}

export function SettingsRow({ icon, title, helper, trailing, onClick, destructive, className }: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full py-3 px-4 rounded-2xl flex items-center justify-between gap-3 transition-all text-left',
        destructive
          ? 'bg-gray-50 dark:bg-[#14181E] hover:bg-red-50/50 dark:hover:bg-red-950/25 border border-red-100 dark:border-red-950/80'
          : 'bg-gray-50 dark:bg-[#14181E] hover:bg-gray-100 dark:hover:bg-[#1a1f26] border border-gray-100 dark:border-[#22272F]',
        onClick && 'cursor-pointer',
        !onClick && 'cursor-default',
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
            destructive ? 'bg-red-100 dark:bg-red-950/30 text-red-500' : 'bg-gray-100 dark:bg-[#22272F] text-gray-500 dark:text-gray-400'
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-bold truncate',
            destructive ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-white'
          )}>
            {title}
          </p>
          {helper && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{helper}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {trailing || (onClick && <ChevronRight size={16} className={destructive ? 'text-red-400' : 'text-gray-400'} />)}
      </div>
    </button>
  );
}
