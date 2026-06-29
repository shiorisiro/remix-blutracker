import React, { useState } from 'react';
import {
  Search, X, SlidersHorizontal, ArrowDownLeft, ArrowUpRight,
  TrendingUp, Sparkles, Loader2, Download, Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction } from '../types';
import { TransactionItem } from './TransactionItem';
import { FilterChip } from './ui/FilterChip';
import { EmptyState } from './ui/EmptyState';
import { CATEGORIES_BY_TYPE } from '../constants';
import { cn } from '../lib/utils';

interface HistoryScreenProps {
  theme: string;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isCurrentMonth: boolean;
  filterClassification: 'all' | 'personal' | 'business';
  setFilterClassification: (v: 'all' | 'personal' | 'business') => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  sortBy: 'date' | 'amount' | 'category';
  setSortBy: (v: 'date' | 'amount' | 'category') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (v: 'asc' | 'desc') => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredMonthlyIncome: number;
  filteredMonthlyExpense: number;
  revealedId: string | null;
  handleReveal: (id: string, isRevealed: boolean) => void;
  setTransactionToDelete: (t: Transaction | null) => void;
  handleEditClick: (t: Transaction) => void;
  handleToggleSettled: (t: Transaction) => void;
  formatCurrency: (n: number) => string;
  isAiAnalyzing: boolean;
  analyzeBusinessWithAI: () => void;
  handleExportCSV: () => void;
  handleExportExcel: () => void;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function HistoryScreen({
  theme,
  filteredTransactions,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
  filterClassification,
  setFilterClassification,
  filterCategory,
  setFilterCategory,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery,
  filteredMonthlyIncome,
  filteredMonthlyExpense,
  revealedId,
  handleReveal,
  setTransactionToDelete,
  handleEditClick,
  handleToggleSettled,
  formatCurrency,
  isAiAnalyzing,
  analyzeBusinessWithAI,
  handleExportCSV,
  handleExportExcel,
  handleUpload,
}: HistoryScreenProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeDataTool, setActiveDataTool] = useState<'none' | 'upload' | 'download'>('none');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasActiveFilters = filterClassification !== 'all' || filterCategory !== 'All' || searchQuery;

  return (
    <section className="space-y-4">
      {/* Month selector */}
      <div className="flex items-center justify-between bg-white dark:bg-[#13161A] rounded-full px-4 py-2 border border-gray-100 dark:border-[#22272F] shadow-sm">
        <button onClick={onPrevMonth} className="p-1 text-gray-500 hover:text-[#CFFF0F] rounded-full transition-colors cursor-pointer">
          <ArrowDownLeft size={18} className="rotate-45" />
        </button>
        <div className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-widest uppercase">
          {format(selectedMonth, 'MMMM yyyy', { locale: id })}
        </div>
        <button
          onClick={onNextMonth}
          disabled={isCurrentMonth}
          className={cn('p-1 rounded-full transition-colors cursor-pointer', isCurrentMonth ? 'opacity-30 text-gray-400' : 'text-gray-500 hover:text-[#CFFF0F]')}
        >
          <ArrowUpRight size={18} className="rotate-45" />
        </button>
      </div>

      {/* Search bar - always visible */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari transaksi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-[#13161A] rounded-2xl border border-gray-100 dark:border-[#22272F] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CFFF0F]/30 transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter chips + advanced filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(['all', 'personal', 'business'] as const).map((c) => (
          <FilterChip
            key={c}
            label={c === 'all' ? 'Semua' : c === 'personal' ? 'Pribadi' : 'Bisnis'}
            active={filterClassification === c}
            onClick={() => setFilterClassification(c)}
          />
        ))}

        <div className="relative ml-auto flex-shrink-0">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              'p-2.5 rounded-2xl border transition-all cursor-pointer',
              (filterCategory !== 'All' || sortBy !== 'date')
                ? 'bg-[#CFFF0F] text-black border-[#CFFF0F]'
                : 'bg-white dark:bg-[#13161A] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-[#22272F] hover:text-[#CFFF0F]'
            )}
          >
            <SlidersHorizontal size={16} />
          </button>
          <AnimatePresence>
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-[#13161A] rounded-2xl border border-gray-100 dark:border-[#22272F] shadow-xl p-4 space-y-4"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategori</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {['All', ...Array.from(new Set([...CATEGORIES_BY_TYPE.income, ...CATEGORIES_BY_TYPE.expense]))].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer',
                            filterCategory === cat
                              ? 'bg-[#CFFF0F] text-gray-950'
                              : 'bg-gray-50 dark:bg-[#14181E] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#22272F]'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urutkan</p>
                    <div className="flex gap-2">
                      {(['date', 'amount', 'category'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSortBy(s)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                            sortBy === s
                              ? 'bg-[#CFFF0F] text-gray-950'
                              : 'bg-gray-50 dark:bg-[#14181E] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#22272F]'
                          )}
                        >
                          {s === 'date' ? 'Tanggal' : s === 'amount' ? 'Jumlah' : 'Kategori'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-[#CFFF0F] transition-colors"
                  >
                    <TrendingUp size={14} className={cn(sortOrder === 'asc' ? 'rotate-180' : '')} />
                    {sortOrder === 'asc' ? 'Terlama dulu' : 'Terbaru dulu'}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filtered summary - only when filters active */}
      {hasActiveFilters && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Ringkasan {filterClassification === 'personal' ? 'Pribadi' : filterClassification === 'business' ? 'Bisnis' : ''} • {format(selectedMonth, 'MMMM yyyy', { locale: id })}
            </p>
            {filterClassification === 'business' && (
              <button
                onClick={analyzeBusinessWithAI}
                disabled={isAiAnalyzing}
                className="text-xs font-bold text-black flex items-center gap-1.5 bg-[#CFFF0F] hover:bg-[#CFFF0F]/90 px-3 py-1.5 rounded-full transition-all active:scale-95"
              >
                {isAiAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Analisis AI
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/40">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Pemasukan</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(filteredMonthlyIncome)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-950/40">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">Pengeluaran</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(filteredMonthlyExpense)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction list */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-gray-800 dark:text-white">Riwayat Transaksi</h2>
        <AnimatePresence>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onDelete={() => setTransactionToDelete(t)}
                onEdit={() => handleEditClick(t)}
                onToggleSettled={() => handleToggleSettled(t)}
                formatCurrency={formatCurrency}
                isRevealed={revealedId === t.id}
                onReveal={(isRevealed) => handleReveal(t.id, isRevealed)}
              />
            ))
          ) : (
            <EmptyState
              icon={<Search size={32} />}
              title="Tidak ada transaksi"
              description={searchQuery || filterCategory !== 'All' ? 'Tidak ada hasil untuk filter aktif' : 'Belum ada transaksi di bulan ini'}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Data Tools - moved to bottom, separate from list */}
      <div className="bg-white dark:bg-[#13161A] border border-gray-100 dark:border-[#22272F] rounded-3xl p-4 space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Data Tools</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveDataTool(activeDataTool === 'upload' ? 'none' : 'upload')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer',
              activeDataTool === 'upload'
                ? 'bg-[#CFFF0F]/10 border-[#CFFF0F]/30 text-[#8aaa00]'
                : 'bg-gray-50 dark:bg-[#14181E] border-gray-100 dark:border-[#22272F] text-gray-500 hover:border-[#CFFF0F]/30'
            )}
          >
            <Upload size={14} />
            <span>Impor</span>
          </button>
          <button
            onClick={() => setActiveDataTool(activeDataTool === 'download' ? 'none' : 'download')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer',
              activeDataTool === 'download'
                ? 'bg-[#CFFF0F]/10 border-[#CFFF0F]/30 text-[#8aaa00]'
                : 'bg-gray-50 dark:bg-[#14181E] border-gray-100 dark:border-[#22272F] text-gray-500 hover:border-[#CFFF0F]/30'
            )}
          >
            <Download size={14} />
            <span>Ekspor</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeDataTool === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="pt-2 space-y-2">
                <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".csv,.xlsx,.xls" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-gray-50 dark:bg-[#14181E] border border-dashed border-gray-200 dark:border-[#22272F] rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-[#CFFF0F]/50 transition-all cursor-pointer"
                >
                  <Upload size={16} className="text-[#CFFF0F]" />
                  <span>Pilih File CSV / Excel</span>
                </button>
                <p className="text-[10px] text-gray-400 text-center">Kolom: Tanggal, Waktu, Judul, Jumlah, Tipe, Kategori, Klasifikasi</p>
              </div>
            </motion.div>
          )}
          {activeDataTool === 'download' && (
            <motion.div key="download" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button onClick={handleExportCSV} className="py-2.5 px-3 bg-gray-50 dark:bg-[#14181E] border border-gray-100 dark:border-[#22272F] rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                  <Download size={14} className="text-emerald-500" />
                  <span>CSV</span>
                </button>
                <button onClick={handleExportExcel} className="py-2.5 px-3 bg-gray-50 dark:bg-[#14181E] border border-gray-100 dark:border-[#22272F] rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                  <Download size={14} className="text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
