import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, className }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[110]',
              'bg-white dark:bg-[#13161A] rounded-t-[32px] border-t border-gray-100 dark:border-[#22272F]',
              'shadow-2xl',
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between p-6 pb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#22272F] text-gray-500 hover:bg-gray-200 dark:hover:bg-[#2a2f38] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="px-6 pb-8 pt-2">
              {children}
            </div>
            {/* Safe area spacer */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
