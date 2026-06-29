import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-12 text-center space-y-4 flex flex-col items-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-[#14181E] rounded-full flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-bold text-sm text-gray-600 dark:text-gray-300">{title}</p>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
