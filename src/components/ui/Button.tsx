import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

export function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'font-bold rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-[#CFFF0F] text-black hover:bg-[#CFFF0F]/90',
        variant === 'secondary' && 'bg-white dark:bg-[#13161A] border border-gray-200 dark:border-[#22272F] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#14181E]',
        variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-[#14181E]',
        className
      )}
    >
      {children}
    </button>
  );
}
