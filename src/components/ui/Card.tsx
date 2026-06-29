import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-[#13161A] border border-gray-100 dark:border-[#22272F] rounded-[32px] transition-colors duration-200',
        onClick && 'cursor-pointer hover:opacity-90',
        className
      )}
    >
      {children}
    </div>
  );
}
