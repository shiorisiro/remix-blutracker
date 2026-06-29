import React from 'react';
import { cn } from '../../lib/utils';

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ segments, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div className={cn('flex bg-gray-100 dark:bg-[#14181E] rounded-2xl p-1 gap-1', className)}>
      {segments.map((seg) => (
        <button
          key={seg.value}
          onClick={() => onChange(seg.value)}
          className={cn(
            'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer',
            value === seg.value
              ? 'bg-white dark:bg-[#22272F] text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
          )}
        >
          {seg.label}
        </button>
      ))}
    </div>
  );
}
