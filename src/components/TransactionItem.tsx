import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Clock, Tag, RefreshCcw, HandCoins, ArrowRightLeft, Upload, CheckCircle2, ChevronRight, Check, Trash2, Edit2, RotateCcw, ArrowDownLeft, ArrowUpRight, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction } from '../types';
import { cn } from '../lib/utils';

export interface TransactionItemProps {
  transaction: Transaction;
  onDelete: () => void;
  onEdit: () => void;
  onToggleSettled: () => void;
  formatCurrency: (amount: number) => string;
  isRevealed: boolean;
  onReveal: (isRevealed: boolean) => void;
}

export const TransactionItem = React.memo<TransactionItemProps>(({ 
  transaction: t, 
  onDelete, 
  onEdit,
  onToggleSettled,
  formatCurrency,
  isRevealed,
  onReveal
}) => {
  const handleDragEnd = (_: any, info: any) => {
    // Threshold for revealing
    const threshold = t.isDebt ? -240 : -160;
    if (info.offset.x < threshold / 2) {
      onReveal(true);
    } else if (info.offset.x > 40) {
      onReveal(false);
    } else {
      onReveal(isRevealed);
    }
  };

  const getDebtLabel = () => {
    if (t.debtType === 'borrow') return 'Piutang (Pinjam)';
    if (t.debtType === 'lend') return 'Utang (Meminjami)';
    return 'Hutang';
  };

  return (
    <div className="relative mb-3 rounded-2xl overflow-hidden isolate shadow-sm hover:shadow-md transition-shadow">
      {/* Background Layer - Actions */}
      <div className="absolute inset-[3px] bg-gray-150 dark:bg-[#0D0F12] flex justify-end items-center rounded-xl overflow-hidden">
        <div className="flex h-full">
          {t.isDebt && (
            <div 
              className={cn(
                "w-[85px] h-full flex flex-col items-center justify-center transition-colors cursor-pointer",
                t.isSettled ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSettled();
                onReveal(false);
              }}
            >
              <RotateCcw size={18} />
              <span className="text-[8px] font-bold uppercase mt-1">{t.isSettled ? 'Belum' : 'Lunas'}</span>
            </div>
          )}
          <div 
            className="w-[85px] h-full flex flex-col items-center justify-center bg-gray-800 text-white hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              onReveal(false);
            }}
          >
            <Edit2 size={18} />
            <span className="text-[8px] font-bold uppercase mt-1">Edit</span>
          </div>
          <div 
            className="w-[85px] h-full flex flex-col items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              onReveal(false);
            }}
          >
            <Trash2 size={18} />
            <span className="text-[8px] font-bold uppercase mt-1">Hapus</span>
          </div>
        </div>
      </div>

      {/* Foreground Content */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: t.isDebt ? -255 : -170, right: 0 }}
        dragElastic={0.15}
        whileTap={{ cursor: 'grabbing' }}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 35 }}
        animate={{ x: isRevealed ? (t.isDebt ? -255 : -170) : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.6 }}
        onDragStart={() => {
          if (!isRevealed) {
            onReveal(false);
          }
        }}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (isRevealed) onReveal(false);
        }}
        className={cn(
          "p-4 flex items-center justify-between bg-white dark:bg-[#13161A] relative z-10 cursor-grab active:cursor-grabbing transition-colors",
          isRevealed ? "shadow-inner" : "",
          t.isSettled && "opacity-50"
        )}
      >
        <div className="flex items-center gap-3.5">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_14px_rgba(255,255,255,0.08)]",
            t.type === 'income' ? "bg-emerald-500/10 text-emerald-600 dark:text-[#CFFF0F] dark:bg-[#CFFF0F]/10 shadow-emerald-500/15 dark:shadow-[#CFFF0F]/20" : 
            t.type === 'expense' ? "bg-rose-500/10 text-rose-600 dark:text-[#FF5E5E] dark:bg-[#FF5E5E]/10 shadow-rose-500/15 dark:shadow-rose-500/15" :
            "bg-sky-500/10 text-sky-600 dark:text-[#00F5FF] dark:bg-[#00F5FF]/10 shadow-sky-500/15 dark:shadow-sky-500/15"
          )}>
            {t.type === 'income' ? <ArrowDownLeft size={18} /> : 
             t.type === 'expense' ? <ArrowUpRight size={18} /> :
             <CreditCard size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={cn(
                "font-bold text-sm text-gray-800 dark:text-white tracking-tight",
                t.isSettled && "line-through text-gray-400 dark:text-gray-500"
              )}>{t.title}</p>
              {t.type === 'debt' && (
                <span className={cn(
                  "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight",
                  t.isSettled ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                )}>
                  {t.isSettled ? 'Lunas' : getDebtLabel()}
                </span>
              )}
              <span className={cn(
                "text-[7.5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                t.classification === 'business' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 text-purple-600 dark:text-[#D1C4E9]"
              )}>
                {t.classification === 'business' ? 'Bisnis' : 'Pribadi'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{t.category} • {format(parseISO(t.date), 'dd MMM')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className={cn(
            "font-extrabold text-sm tracking-tight font-display",
            t.isSettled ? "text-gray-400 dark:text-gray-500 line-through" : 
            t.type === 'income' ? "text-emerald-600 dark:text-[#CFFF0F]" : 
            t.type === 'expense' ? "text-rose-600 dark:text-[#FF5E5E]" :
            "text-amber-600 dark:text-amber-400"
          )}>
            {t.isSettled ? '' : (t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '')}{formatCurrency(t.amount)}
          </p>
        </div>
      </motion.div>
    </div>
  );
});
