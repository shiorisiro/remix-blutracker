import React from 'react';
import { motion } from 'framer-motion';
import { X, Search, CheckCircle2, ChevronRight, Check, Loader2, ScanLine } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { TransactionType, DebtType } from '../types';

export function TransactionModal(props: any) {
  const {
    setIsModalOpen, editingTransaction, setEditingTransaction,
    newTitle, setNewTitle, newAmount, setNewAmount, newDate, setNewDate,
    newTime, setNewTime, newType, setNewType, newCategory, setNewCategory,
    newClassification, setNewClassification, newDebtType, setNewDebtType,
    setNewIsSettled, isSuggesting, handleSaveTransaction, authError, setIsScannerOpen, formatInputNumber
  } = props;

  // Let's ensure categories is available or defined locally since it's just a constant list.
  const categories = ['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center p-4">
          <div className="bg-white dark:bg-[#0D0F12] border border-gray-150/45 dark:border-[#22272F] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
                {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                  setNewTitle('');
                  setNewAmount('');
                  setNewDate('');
                  setNewTime('');
                  setNewType('expense');
                  setNewCategory('General');
                  setNewClassification('personal');
                  setNewDebtType('borrow');
                  setNewIsSettled(false);
                }} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#14181E] text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="flex p-1 bg-gray-50 dark:bg-[#14181E] border border-gray-150/30 dark:border-[#22272F]/50 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                    newType === 'expense' ? "bg-white dark:bg-[#202530] text-rose-500 dark:text-[#FF5E5E] shadow-sm font-black" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  Pengeluaran
                </button>
                <button 
                  type="button"
                  onClick={() => setNewType('income')}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                    newType === 'income' ? "bg-white dark:bg-[#202530] text-emerald-600 dark:text-[#CFFF0F] shadow-sm font-black" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  Pemasukan
                </button>
                <button 
                  type="button"
                  onClick={() => setNewType('debt')}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                    newType === 'debt' ? "bg-white dark:bg-[#202530] text-amber-600 dark:text-[#00F5FF] shadow-sm font-black" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  Hutang
                </button>
              </div>

              {newType === 'debt' && (
                <div className="flex p-1 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/10">
                  <button 
                    type="button"
                    onClick={() => setNewDebtType('borrow')}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                      newDebtType === 'borrow' ? "bg-white dark:bg-[#0D0F12] text-amber-600 dark:text-amber-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    Piutang (Pinjam)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewDebtType('lend')}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                      newDebtType === 'lend' ? "bg-white dark:bg-[#0D0F12] text-amber-600 dark:text-amber-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    Utang (Meminjami)
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">Judul Transaksi</label>
                  {isSuggesting && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#CFFF0F]"
                    >
                      <Loader2 size={10} className="animate-spin" />
                      <span>AI Menganalisis...</span>
                    </motion.div>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Makan Siang" 
                    className={cn(
                      "blu-input pr-10",
                      isSuggesting && "border-[#CFFF0F]/30"
                    )}
                    required
                  />
                  {newTitle.length >= 3 && !isSuggesting && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <ScanLine size={16} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 font-display">Jumlah (IDR)</label>
                <div className="blu-input flex items-center gap-3 focus-within:ring-2 focus-within:ring-[#CFFF0F]/20 focus-within:border-[#CFFF0F] transition-all dark:bg-[#0D0F12]">
                  <span className="text-gray-400 dark:text-gray-500 font-extrabold text-lg shrink-0">Rp</span>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={newAmount}
                    onChange={(e) => setNewAmount(formatInputNumber(e.target.value))}
                    placeholder="0" 
                    className="w-full bg-transparent text-2xl font-extrabold text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-200 dark:placeholder:text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 font-display">Kategori</label>
                  <div className="relative">
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="blu-input appearance-none cursor-pointer text-gray-800 dark:text-white"
                    >
                      <option className="bg-white dark:bg-[#14181E] text-gray-800 dark:text-white">Food</option>
                      <option className="bg-white dark:bg-[#14181E] text-gray-800 dark:text-white">Salary</option>
                      <option className="bg-white dark:bg-[#14181E] text-gray-800 dark:text-white">Entertainment</option>
                      <option className="bg-white dark:bg-[#14181E] text-gray-800 dark:text-white">Shopping</option>
                      <option className="bg-white dark:bg-[#14181E] text-gray-800 dark:text-white">Bensin</option>
                      <option className="bg-white dark:bg-[#14181E] text-gray-800 dark:text-white">Perbaikan</option>
                      <option className="bg-white dark:bg-[#14181E] text-gray-800 dark:text-white">Bonus</option>
                      <option className="bg-white dark:bg-[#14181E] text-gray-800 dark:text-white">General</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 font-display">Klasifikasi</label>
                  <div className="flex p-1 bg-gray-50 dark:bg-[#14181E] border border-gray-150/30 dark:border-[#22272F]/50 rounded-2xl">
                    <button 
                      type="button"
                      onClick={() => setNewClassification('personal')}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-extrabold uppercase rounded-xl transition-all cursor-pointer",
                        newClassification === 'personal' ? "bg-white dark:bg-[#202530] text-purple-600 dark:text-[#D1C4E9] shadow-sm" : "text-gray-400"
                      )}
                    >
                      Pribadi
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewClassification('business')}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-extrabold uppercase rounded-xl transition-all cursor-pointer",
                        newClassification === 'business' ? "bg-white dark:bg-[#202530] text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-400"
                      )}
                    >
                      Bisnis
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 font-display">Tanggal</label>
                  <input 
                    type="date" 
                    value={newDate || format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="blu-input bg-gray-50 dark:bg-[#0D0F12]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 font-display">Waktu</label>
                  <input 
                    type="time" 
                    value={newTime || format(new Date(), 'HH:mm')}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="blu-input bg-gray-50 dark:bg-[#0D0F12]"
                  />
                </div>
              </div>

              <button type="submit" className="blu-button w-full mt-4 cursor-pointer text-sm font-black uppercase tracking-wider">
                {editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
              </button>
            </form>
          </div>
        </div>
  );
}
