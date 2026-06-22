import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDownLeft, ArrowUpRight, Search, X, TrendingUp,
  Trash2, Upload, Download, Check, AlertCircle
} from 'lucide-react';
import { format, parseISO, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction } from '../types';
import { TransactionItem } from './TransactionItem';
import { cn } from '../lib/utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface HistoryPageProps {
  transactions: Transaction[];
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  isCurrentMonth: boolean;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  formatCurrency: (amount: number) => string;
  theme: string;
  user: any;
  setTransactions: (txs: Transaction[]) => void;
  setTransactionToDelete: (tx: Transaction | null) => void;
  handleEditClick: (tx: Transaction) => void;
  handleToggleSettled: (tx: Transaction) => void;
  revealedId: string | null;
  handleReveal: (id: string, isRevealed: boolean) => void;
  db: any;
}

export function HistoryPage({
  transactions, selectedMonth, setSelectedMonth, isCurrentMonth, handlePrevMonth, handleNextMonth,
  formatCurrency, theme, user, setTransactions, setTransactionToDelete, handleEditClick,
  handleToggleSettled, revealedId, handleReveal, db
}: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterClassification, setFilterClassification] = useState<'all' | 'personal' | 'business'>('all');
  const [activeHistoryTool, setActiveHistoryTool] = useState<'upload' | 'download' | 'delete' | 'none'>('none');
  const [importStatus, setImportStatus] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => isSameMonth(parseISO(t.date), selectedMonth));
    result = result.filter(t => t.type !== 'debt');
    if (searchQuery) result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterCategory !== 'All') result = result.filter(t => t.category === filterCategory);
    if (filterClassification !== 'all') result = result.filter(t => t.classification === filterClassification);
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') { comparison = (a.date || '').localeCompare(b.date || ''); if (comparison === 0) comparison = (a.time || '00:00').localeCompare(b.time || '00:00'); }
      else if (sortBy === 'amount') comparison = a.amount - b.amount;
      else if (sortBy === 'category') comparison = a.category.localeCompare(b.category);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [transactions, searchQuery, filterCategory, filterClassification, sortBy, sortOrder, selectedMonth]);

  const filteredMonthlyIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
  const filteredMonthlyExpense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);

  const handleExportCSV = () => {
    const mapped = transactions.map(t => ({
      'Tanggal': t.date, 'Waktu': t.time, 'Judul Transaksi': t.title, 'Jumlah': t.amount,
      'Tipe': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori': t.category, 'Klasifikasi': t.classification === 'business' ? 'Bisnis' : 'Pribadi'
    }));
    const csv = Papa.unparse(mapped);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `riwayat_transaksi_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click(); URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const mapped = transactions.map(t => ({
      'Tanggal': t.date, 'Waktu': t.time, 'Judul Transaksi': t.title, 'Jumlah': t.amount,
      'Tipe': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori': t.category, 'Klasifikasi': t.classification === 'business' ? 'Bisnis' : 'Pribadi'
    }));
    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `riwayat_transaksi_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    link.click(); URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) { setImportStatus({ message: 'Invalid file type. Only CSV and Excel files are allowed.', type: 'error' }); return; }
    if (file.size > 5 * 1024 * 1024) { setImportStatus({ message: 'File too large. Maximum size is 5MB.', type: 'error' }); return; }

    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let importedData: any[] = [];
        if (isExcel) {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          importedData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
        } else {
          const content = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
          const parsed = Papa.parse(content, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
          importedData = parsed.data;
        }
        if (!Array.isArray(importedData) || importedData.length === 0) { setImportStatus({ message: 'File kosong atau tidak valid.', type: 'error' }); return; }

        const validTransactions: Transaction[] = [];
        importedData.forEach((t: any) => {
          const findValue = (keys: string[]) => {
            const entry = Object.entries(t).find(([key]) => keys.some(k => key.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')));
            return entry ? entry[1] : undefined;
          };
          const title = String(findValue(['judul', 'judultransaksi', 'title', 'name', 'nama', 'description', 'deskripsi', 'label', 'keterangan']) || 'Tanpa Judul');
          const rawAmount = findValue(['amount', 'nominal', 'value', 'nilai', 'harga', 'jumlah', 'total']);
          let amount = 0;
          if (typeof rawAmount === 'number') amount = rawAmount;
          else if (rawAmount !== undefined && rawAmount !== null) {
            let str = String(rawAmount).trim().replace(/[^\d.,-]/g, '');
            const lastDot = str.lastIndexOf('.');
            const lastComma = str.lastIndexOf(',');
            if (lastDot > lastComma) str = str.replace(/,/g, '');
            else if (lastComma > lastDot) str = str.replace(/\./g, '').replace(/,/g, '.');
            else if (lastDot !== -1) { const parts = str.split('.'); if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) str = str.replace(/\./g, ''); }
            else if (lastComma !== -1) { const parts = str.split(','); if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) str = str.replace(/,/g, ''); else str = str.replace(/,/g, '.'); }
            const parsed = parseFloat(str);
            amount = isNaN(parsed) ? 0 : parsed;
          }
          let type = String(findValue(['type', 'tipe', 'kind', 'status', 'kategori_transaksi']) || 'expense').toLowerCase();
          const finalType: 'income' | 'expense' = (type.includes('in') || type.includes('masuk') || type.includes('pemasukan')) ? 'income' : 'expense';
          const category = String(findValue(['category', 'kategori', 'group', 'kelompok']) || 'General');
          const date = String(findValue(['date', 'tanggal', 'timestamp']) || format(new Date(), 'yyyy-MM-dd'));
          const time = String(findValue(['time', 'jam', 'waktu', 'waktu_transaksi']) || (String(date).includes('T') ? format(new Date(String(date)), 'HH:mm') : '00:00'));
          const classificationRaw = String(findValue(['classification', 'klasifikasi', 'type_pribadi', 'bisnis_pribadi']) || 'personal').toLowerCase();
          const classification: 'personal' | 'business' = (classificationRaw.includes('business') || classificationRaw.includes('bisnis')) ? 'business' : 'personal';
          if (!isNaN(amount) && amount > 0) {
            validTransactions.push({ id: String(findValue(['id', 'uuid', 'key']) || crypto.randomUUID()), title, amount, type: finalType, category, date: String(date).includes('T') ? String(date).split('T')[0] : String(date), time: String(time).includes(':') ? String(time) : '00:00', classification });
          }
        });

        if (validTransactions.length > 0) {
          const performImport = async () => {
            if (!user) {
              setTransactions(prev => { const prevFiltered = prev.filter(p => !validTransactions.some(v => v.id === p.id)); return [...validTransactions, ...prevFiltered]; });
              setImportStatus({ message: `Berhasil mengimpor ${validTransactions.length} transaksi (lokal).`, type: 'success' });
              return;
            }
            try { for (const t of validTransactions) await db.addTransaction(user.uid, t); setImportStatus({ message: `Berhasil mengimpor ${validTransactions.length} transaksi ke Cloud.`, type: 'success' }); }
            catch (error: any) { setImportStatus({ message: `Gagal: ${error?.message || String(error)}`, type: 'error' }); }
          };
          performImport();
        } else { setImportStatus({ message: 'Tidak ada data transaksi yang valid.', type: 'error' }); }
      } catch (err) { setImportStatus({ message: 'Gagal membaca file.', type: 'error' }); }
      if (event.target) event.target.value = '';
    };
    if (isExcel) reader.readAsArrayBuffer(file); else reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090B] p-6 space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-full px-4 py-2 border border-gray-100 dark:border-gray-800 shadow-sm">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-50 dark:hover:bg-gray-950 text-gray-500 hover:text-blu-primary rounded-full transition-colors">
          <ArrowDownLeft size={18} className="rotate-45" />
        </button>
        <div className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-widest uppercase">{format(selectedMonth, 'MMMM yyyy', { locale: id })}</div>
        <button onClick={handleNextMonth} disabled={isCurrentMonth} className={cn("p-1 rounded-full transition-colors", isCurrentMonth ? "opacity-30 text-gray-400" : "hover:bg-gray-50 dark:hover:bg-gray-950 text-gray-500 hover:text-blu-primary")}>
          <ArrowUpRight size={18} className="rotate-45" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setActiveHistoryTool(activeHistoryTool === 'upload' ? 'none' : 'upload')}
            className={cn("flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-xs font-semibold gap-1.5 transition-all select-none cursor-pointer", activeHistoryTool === 'upload' ? "bg-blu-primary/10 border-blu-primary/35 text-blu-primary dark:bg-purple-950/30 dark:border-purple-500/55 dark:text-purple-400 font-bold" : "bg-gray-50 dark:bg-gray-950/50 hover:bg-gray-50 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400")}>
            <Upload size={18} /><span>Unggah</span>
          </button>
          <button onClick={() => setActiveHistoryTool(activeHistoryTool === 'download' ? 'none' : 'download')}
            className={cn("flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-xs font-semibold gap-1.5 transition-all select-none cursor-pointer", activeHistoryTool === 'download' ? "bg-blu-primary/10 border-blu-primary/35 text-blu-primary dark:bg-purple-950/30 dark:border-purple-500/55 dark:text-purple-400 font-bold" : "bg-gray-50 dark:bg-gray-950/50 hover:bg-gray-50 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400")}>
            <Download size={18} /><span>Unduh</span>
          </button>
          <button onClick={() => setActiveHistoryTool(activeHistoryTool === 'delete' ? 'none' : 'delete')}
            className={cn("flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-xs font-semibold gap-1.5 transition-all select-none cursor-pointer", activeHistoryTool === 'delete' ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 font-bold" : "bg-gray-50 dark:bg-gray-950/50 hover:bg-gray-50 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400")}>
            <Trash2 size={18} /><span>Hapus</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeHistoryTool === 'upload' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".csv,.xlsx,.xls" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-750 dark:text-gray-250">
                <Upload size={16} className="text-blu-primary" /><span>Pilih File Excel / CSV</span>
              </button>
            </motion.div>
          )}
          {activeHistoryTool === 'download' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleExportCSV} className="py-2.5 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold">CSV</button>
                <button onClick={handleExportExcel} className="py-2.5 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold">Excel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Catatan Riwayat</h2>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 160, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="relative">
                <input type="text" autoFocus placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-sm focus:outline-none dark:text-white" />
                <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>
          {!isSearchOpen && <button onClick={() => setIsSearchOpen(true)} className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-gray-500 dark:text-gray-400"><Search size={18} /></button>}
          <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-gray-500 dark:text-gray-400">
            <TrendingUp size={18} className={cn(sortOrder === 'asc' ? "rotate-180" : "")} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'personal', 'business'].map(c => (
            <button key={c} onClick={() => setFilterClassification(c as any)}
              className={cn("px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all", filterClassification === c ? "bg-blu-primary text-gray-950 shadow-md" : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100")}>
              {c === 'all' ? 'Semua' : c === 'personal' ? 'Pribadi' : 'Bisnis'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Food', 'Salary', 'Entertainment', 'Shopping', 'Bensin', 'Perbaikan', 'Bonus', 'General'].map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={cn("px-4 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-all", filterCategory === cat ? "bg-blu-primary text-gray-950 shadow-md" : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100")}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {(filterClassification !== 'all' || filterCategory !== 'All' || searchQuery) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <p className="text-[10px] font-bold text-green-600 uppercase">Pemasukan</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(filteredMonthlyIncome)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-[10px] font-bold text-red-600 uppercase">Pengeluaran</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(filteredMonthlyExpense)}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
            <TransactionItem key={t.id} transaction={t} onDelete={() => setTransactionToDelete(t)} onEdit={() => handleEditClick(t)}
              onToggleSettled={() => handleToggleSettled(t)} formatCurrency={formatCurrency} isRevealed={revealedId === t.id} onReveal={(isRevealed) => handleReveal(t.id, isRevealed)} />
          )) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400"><Search size={32} /></div>
              <p className="text-gray-500 text-sm mt-4">Tidak ada transaksi yang ditemukan</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Import Status Modal */}
      {importStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", importStatus.type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                {importStatus.type === 'success' ? <Check size={32} /> : <AlertCircle size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{importStatus.type === 'success' ? 'Berhasil' : 'Kesalahan'}</h3>
                <p className="text-sm text-gray-500">{importStatus.message}</p>
              </div>
            </div>
            <button onClick={() => setImportStatus(null)} className="w-full py-4 bg-blu-primary text-white font-bold rounded-2xl hover:bg-blu-dark transition-colors">Tutup</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
