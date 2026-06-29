import React from 'react';
import { cn } from '../../lib/utils';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

/**
 * Shared header pattern.
 * Rules: one title, optional subtitle, max 2 actions on right.
 */
export function ScreenHeader({ title, subtitle, left, right, className }: ScreenHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {left}
        <div className="min-w-0">
          <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {right && (
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {right}
        </div>
      )}
    </div>
  );
}
