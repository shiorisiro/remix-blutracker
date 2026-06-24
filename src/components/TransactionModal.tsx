import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Mic, Loader2, Check, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';

interface TransactionModalProps {
  setIsModalOpen: (open: boolean) => void;
  editingTransaction: any;
  setEditingTransaction: (tx: any) => void;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newAmount: string;
  setNewAmount: (val: string) => void;
  newDate: string;
  setNewDate: (val: string) => void;
  newTime: string;
  setNewTime: (val: string) => void;
  newType: 'income' | 'expense' | 'debt';
  setNewType: (val: 'income' | 'expense' | 'debt') => void;
  newCategory: string;
  setNewCategory: (val: string) => void;
  newClassification: 'personal' | 'business';
  setNewClassification: (val: 'personal' | 'business') => void;
  newDebtType: 'borrow' | 'lend';
  setNewDebtType: (val: 'borrow' | 'lend') => void;
  setNewIsSettled: (val: boolean) => void;
  isSuggesting: boolean;
  handleSaveTransaction: (e: React.FormEvent) => void;
  setIsScannerOpen: (open: boolean) => void;
  formatInputNumber: (val: string) => string;
  categoriesByType: Record<'income' | 'expense' | 'debt', string[]>;
  isListening: boolean;
  onVoiceInput: () => void;
}


export function TransactionModal({
  setIsModalOpen,
  editingTransaction,
  setEditingTransaction,
  newTitle,
  setNewTitle,
  newAmount,
  setNewAmount,
  newDate,
  setNewDate,
  newTime,
  setNewTime,
  newType,
  setNewType,
  newCategory,
  setNewCategory,
  newClassification,
  setNewClassification,
  newDebtType,
  setNewDebtType,
  setNewIsSettled,
  isSuggesting,
  handleSaveTransaction,
  setIsScannerOpen,
  formatInputNumber,
  categoriesByType,
  isListening,
  onVoiceInput,
}: TransactionModalProps) {

  const categories = categoriesByType[newType] || [];

  // Kalau ganti tipe transaksi dan kategori yang lagi kepilih nggak valid buat tipe baru,
  // otomatis pindah ke pilihan pertama yang valid.
  React.useEffect(() => {
    if (!categories.includes(newCategory)) {
      setNewCategory(categories[0] || 'Lainnya');
    }
  }, [newType]);

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setNewTitle('');
    setNewAmount('');
    setNewDate('');
    setNewTime('');
    setNewType('expense');
    setNewCategory('Lainnya');
    setNewClassification('personal');
    setNewDebtType('borrow');
    setNewIsSettled(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputNumber(e.target.value);
    setNewAmount(formatted);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal Card - Centered Floating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#FFFFFF] dark:bg-[#13161A] rounded-[32px] shadow-2xl border border-gray-100 dark:border-[#22272F] overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-[#22272F] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center",
                newType === 'income' ? "bg-[#CFFF0F]/10 text-[#CFFF0F]" :
                newType === 'expense' ? "bg-[#FF5E5E]/10 text-[#FF5E5E]" :
                "bg-orange-500/10 text-orange-500"
              )}>
                {newType === 'income' ? <ArrowDownLeft size={20} /> :
                 newType === 'expense' ? <ArrowUpRight size={20} /> :
                 <Wallet size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {newType === 'income' ? 'Pemasukan' : newType === 'expense' ? 'Pengeluaran' : 'Hutang/Piutang'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-gray-100 dark:bg-[#14181E] text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-[#1a1f28] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Type Selector */}
            <div className="flex p-1 bg-gray-100 dark:bg-[#14181E] rounded-xl">
              {(['expense', 'income', 'debt'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={cn(
                    "flex-1 py-2 text-[11px] font-bold rounded-lg transition-all capitalize",
                    newType === type 
                      ? "bg-white dark:bg-[#0D0F12] text-gray-950 dark:text-[#CFFF0F] shadow-sm" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  )}
                >
                  {type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Hutang'}
                </button>
              ))}
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Judul Transaksi
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Makan siang, Bensin, Gaji..."
                  className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-[#08090B] border border-gray-100 dark:border-[#22272F] rounded-2xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CFFF0F]/30 transition-all"
                  autoFocus
                />
                {isSuggesting && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={14} className="animate-spin text-[#CFFF0F]" />
                  </div>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Jumlah (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                <input
                  type="text"
                  value={newAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] dark:bg-[#08090B] border border-gray-100 dark:border-[#22272F] rounded-2xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CFFF0F]/30 transition-all font-bold"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-[#08090B] border border-gray-100 dark:border-[#22272F] rounded-2xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF0F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Waktu
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-[#08090B] border border-gray-100 dark:border-[#22272F] rounded-2xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CFFF0F]/30 transition-all"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Kategori
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[11px] font-bold transition-all",
                      newCategory === cat
                        ? "bg-[#CFFF0F] text-gray-950 shadow-md shadow-[#CFFF0F]/20"
                        : "bg-[#F8FAFC] dark:bg-[#08090B] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-[#22272F] hover:border-[#CFFF0F]/30"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Klasifikasi
              </label>
              <div className="flex p-1 bg-gray-100 dark:bg-[#14181E] rounded-xl">
                {(['personal', 'business'] as const).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setNewClassification(cls)}
                    className={cn(
                      "flex-1 py-2 text-[11px] font-bold rounded-lg transition-all capitalize",
                      newClassification === cls
                        ? "bg-white dark:bg-[#0D0F12] text-gray-950 dark:text-[#CFFF0F] shadow-sm"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {cls === 'personal' ? 'Pribadi' : 'Bisnis'}
                  </button>
                ))}
              </div>
            </div>

            {/* Debt Type (only for debt) */}
            {newType === 'debt' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Tipe Hutang
                </label>
                <div className="flex p-1 bg-gray-100 dark:bg-[#14181E] rounded-xl">
                  {(['borrow', 'lend'] as const).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setNewDebtType(dt)}
                      className={cn(
                        "flex-1 py-2 text-[11px] font-bold rounded-lg transition-all",
                        newDebtType === dt
                          ? "bg-white dark:bg-[#0D0F12] text-gray-950 dark:text-[#CFFF0F] shadow-sm"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {dt === 'borrow' ? 'Pinjam (Piutang)' : 'Meminjami (Utang)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={onVoiceInput}
              className={cn(
                "w-full py-3 border border-dashed rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all",
                isListening
                  ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900/50 text-red-500 dark:text-red-400 animate-pulse"
                  : "bg-[#F8FAFC] dark:bg-[#08090B] border-gray-200 dark:border-[#22272F] text-gray-600 dark:text-gray-300 hover:border-[#CFFF0F]/50"
              )}
            >
              <Mic size={16} className={isListening ? "" : "text-[#CFFF0F]"} />
              <span>{isListening ? 'Mendengarkan... (tap untuk berhenti)' : 'Catat dengan Suara'}</span>
            </button>

            {/* Scan Receipt Button */}
            <button
              type="button"
              onClick={() => {
                setIsScannerOpen(true);
                handleClose();
              }}
              className="w-full py-3 bg-[#F8FAFC] dark:bg-[#08090B] border border-dashed border-gray-200 dark:border-[#22272F] rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-[#CFFF0F]/50 transition-all"
            >
              <Camera size={16} className="text-[#CFFF0F]" />
              <span>Pindai Struk dengan AI</span>
            </button>
          </div>

          {/* Footer - Save Button */}
          <div className="p-6 border-t border-gray-100 dark:border-[#22272F] shrink-0">
            <button
              type="button"
              onClick={handleSaveTransaction}
              disabled={!newTitle || !newAmount}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]",
                !newTitle || !newAmount
                  ? "bg-gray-100 dark:bg-[#14181E] text-gray-400 cursor-not-allowed"
                  : "bg-[#CFFF0F] text-gray-950 hover:bg-[#CFFF0F]/90 shadow-lg shadow-[#CFFF0F]/20"
              )}
            >
              {editingTransaction ? 'Simpan Perubahan' : 'Tambah Transaksi'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
