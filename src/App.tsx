import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, ArrowUpRight, ArrowDownLeft, Wallet, History, Search, ChevronRight,
  TrendingUp, CreditCard, X, Camera, RotateCcw, Check, Loader2, ScanLine,
  Trash2, AlertCircle, Edit2, Utensils, ShoppingBag, Fuel, Wrench, Play,
  LayoutGrid, Download, Upload, Sparkles, Bot, Sun, Moon, Mail, Lock,
  User as UserIcon, BarChart3, UserCircle
} from 'lucide-react';
import { format, parseISO, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  BarChart, Bar, Line, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell, Sector, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, TransactionType, DebtType } from './types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { auth, AppUser, onAuthStateChange, signInWithEmail, signUpWithEmail, updateUserProfile, signInWithGoogle } from './auth';
import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase-client';
import { useTheme } from './ThemeContext';
import { LoginPage } from './components/LoginPage';
import { cn } from './lib/utils';
import { INITIAL_TRANSACTIONS } from './constants';
import { TransactionItem } from './components/TransactionItem';
import { ScannerModal } from './components/ScannerModal';
import { StatsDetailModal } from './components/StatsDetailModal';
import { TransactionModal } from './components/TransactionModal';
import { AuthModal } from './components/AuthModal';

// NEW: Page Components
import { DashboardPage } from './components/DashboardPage';
import { StatisticsPage } from './components/StatisticsPage';
import { HistoryPage } from './components/HistoryPage';
import { ProfilePage } from './components/ProfilePage';

import { StatusBar, Style } from '@capacitor/status-bar';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const CATEGORY_CONFIG: Record<string, { color: string; icon: any }> = {
  'Food': { color: '#FF6B6B', icon: Utensils },
  'Shopping': { color: '#4ECDC4', icon: ShoppingBag },
  'Bensin': { color: '#FFD93D', icon: Fuel },
  'Perbaikan': { color: '#A29BFE', icon: Wrench },
  'Entertainment': { color: '#6C5CE7', icon: Play },
  'General': { color: '#95afc0', icon: LayoutGrid },
};

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Status Bar
  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        if (theme === 'dark') {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#08090B' });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#F8FAFC' });
        }
      } catch (e) { console.log('Status bar not available'); }
    };
    updateStatusBar();
  }, [theme]);

  // Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const isDev = window.location.hostname.includes('localhost') || 
                    window.location.hostname.includes('.run.app') || 
                    window.location.hostname.includes('ais-') || 
                    window.location.hostname.includes('web-');
      if (isDev) {
        navigator.serviceWorker.getRegistrations().then(regs => { for (let reg of regs) reg.unregister(); });
      } else {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(r => console.log('SW registered:', r))
            .catch(e => console.log('SW registration failed:', e));
        });
      }
    }
  }, []);

  // ─── AUTH STATE ───
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) {
        const localSaved = localStorage.getItem('blutracker_transactions');
        if (localSaved) {
          try {
            const localTransactions = JSON.parse(localSaved);
            localTransactions.forEach(async (t: Transaction) => { await db.addTransaction(currentUser.uid, t); });
            localStorage.removeItem('blutracker_transactions');
          } catch (e) { console.error('Sync error:', e); }
        }
      } else {
        const saved = localStorage.getItem('blutracker_transactions');
        if (saved) { try { setTransactions(JSON.parse(saved)); } catch (e) { setTransactions([]); } }
        else { setTransactions([]); }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    db.getTransactions(user.uid).then(setTransactions);
    const unsubscribe = db.subscribeToTransactions(user.uid, (newTransactions) => { setTransactions(newTransactions); });
    return unsubscribe;
  }, [user]);

  // ─── TRANSACTIONS ───
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('blutracker_transactions');
    if (saved) { try { return JSON.parse(saved); } catch (e) { return []; } }
    const hasVisited = localStorage.getItem('blutracker_visited');
    if (!hasVisited) { localStorage.setItem('blutracker_visited', 'true'); return INITIAL_TRANSACTIONS; }
    return [];
  });

  useEffect(() => {
    if (authReady && !user) {
      localStorage.setItem('blutracker_transactions', JSON.stringify(transactions));
    }
  }, [transactions, user, authReady]);

  // ─── TABS ───
  const [activeTab, setActiveTab] = useState<'home' | 'statistics' | 'history' | 'profile'>('home');

  // ─── MONTH SELECTOR ───
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const handlePrevMonth = () => { setSelectedMonth(prev => subMonths(prev, 1)); };
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));
  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  // ─── NAME EDITING ───
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    try {
      setIsSavingName(true);
      await updateUserProfile({ displayName: tempName.trim() });
      setUser(prev => prev ? { ...prev, displayName: tempName.trim() } : null);
      setIsEditingName(false);
    } catch (e) {
      console.error("Gagal memperbarui nama:", e);
      alert('Gagal memperbarui nama.');
    } finally { setIsSavingName(false); }
  };

  // ─── AUTH MODAL ───
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loginWithGoogle = async () => {
    try { setAuthError(null); await signInWithGoogle(); }
    catch (e: any) { setAuthError(`Gagal login dengan Google: ${e.message || 'Silakan coba lagi.'}`); }
  };

  const logout = async () => {
    try { await auth.signOut(); setTransactions([]); } catch (e) { console.log(e); }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'register') {
        if (!authEmail.trim() || !authPassword.trim() || !authDisplayName.trim()) throw new Error("Mohon isi semua data registrasi.");
        if (authPassword.trim().length < 6) throw new Error("Kata sandi minimal 6 karakter.");
        await signUpWithEmail(authEmail.trim(), authPassword.trim(), authDisplayName.trim());
      } else {
        if (!authEmail.trim() || !authPassword.trim()) throw new Error("Mohon isi email dan kata sandi.");
        await signInWithEmail(authEmail.trim(), authPassword.trim());
      }
      setIsAuthModalOpen(false);
      setAuthEmail(''); setAuthPassword(''); setAuthDisplayName('');
    } catch (err: any) {
      let errMsg = err.message || '';
      if (errMsg.includes('already registered') || errMsg.includes('already in use')) errMsg = "Email sudah digunakan oleh akun lain.";
      else if (errMsg.includes('should be at least') || errMsg.includes('Password should be')) errMsg = "Kata sandi terlalu lemah. Minimal 6 karakter.";
      else if (errMsg.includes('invalid email') || errMsg.includes('Invalid email')) errMsg = "Format email tidak valid.";
      else if (errMsg.includes('Invalid login credentials') || errMsg.includes('invalid credentials')) errMsg = "Email atau kata sandi salah.";
      else if (errMsg.includes('not confirmed') || errMsg.includes('belum dikonfirmasi')) errMsg = "Email Anda belum dikonfirmasi.";
      setAuthError(errMsg);
    } finally { setIsAuthLoading(false); }
  };

  // ─── MODALS ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isStatsDetailOpen, setIsStatsDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statsView, setStatsView] = useState<'weekly' | 'daily'>('weekly');
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void } | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  // ─── FORM STATE ───
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newCategory, setNewCategory] = useState('General');
  const [newClassification, setNewClassification] = useState<'personal' | 'business'>('personal');
  const [newDebtType, setNewDebtType] = useState<DebtType>('borrow');
  const [newIsSettled, setNewIsSettled] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // ─── PWA SHORTCUTS ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'scan') setIsScannerOpen(true);
    else if (action === 'add') { setNewTime(format(new Date(), 'HH:mm')); setIsModalOpen(true); }
    if (action) window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  // ─── REVEAL HANDLER ───
  useEffect(() => { setRevealedId(null); }, [activeTab]);
  const handleReveal = useCallback((id: string, isRevealed: boolean) => { setRevealedId(isRevealed ? id : null); }, []);

  // ─── COMPUTED DATA ───
  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      if (t.type === 'debt') {
        if (t.isSettled) return acc;
        return t.debtType === 'borrow' ? acc + t.amount : acc - t.amount;
      }
      return acc;
    }, 0);
  }, [transactions]);

  const debtStats = useMemo(() => {
    const activeDebts = transactions.filter(t => t.type === 'debt' && !t.isSettled);
    const borrow = activeDebts.filter(t => t.debtType === 'borrow').reduce((acc, t) => acc + t.amount, 0);
    const lend = activeDebts.filter(t => t.debtType === 'lend').reduce((acc, t) => acc + t.amount, 0);
    return { borrow, lend };
  }, [transactions]);

  const monthlyIncome = useMemo(() => 
    transactions.filter(t => t.type === 'income' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((acc, t) => acc + t.amount, 0)
  , [transactions, selectedMonth]);

  const monthlyExpense = useMemo(() => 
    transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((acc, t) => acc + t.amount, 0)
  , [transactions, selectedMonth]);

  const categoryPieData = useMemo(() => {
    const categories = ['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'];
    return categories.map(cat => ({
      name: cat,
      value: transactions.filter(t => t.type === 'expense' && t.category === cat && isSameMonth(parseISO(t.date), selectedMonth)).reduce((acc, t) => acc + t.amount, 0)
    })).filter(item => item.value > 0);
  }, [transactions, selectedMonth]);

  // ─── CHART DATA ───
  const chartData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = isCurrentMonth ? new Date() : endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    let runningBalance = transactions.filter(t => parseISO(t.date) < start).reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      return acc;
    }, 0);
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const inc = transactions.filter(t => t.type === 'income' && t.date === dateStr).reduce((acc, t) => acc + t.amount, 0);
      const exp = transactions.filter(t => t.type === 'expense' && t.date === dateStr).reduce((acc, t) => acc + t.amount, 0);
      runningBalance += (inc - exp);
      return { name: format(day, 'd'), balance: runningBalance, income: inc, expense: exp };
    });
  }, [transactions, selectedMonth, isCurrentMonth]);

  const hourlyData = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0') + ':00';
      const amount = transactions
        .filter(t => t.date === today && t.time && t.time.startsWith(hour.split(':')[0]))
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: hour, amount };
    });
  }, [transactions]);

  const monthlyChartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    return months.map(m => {
      const inc = transactions.filter(t => t.type === 'income' && isSameMonth(parseISO(t.date), m)).reduce((acc, t) => acc + t.amount, 0);
      const exp = transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), m)).reduce((acc, t) => acc + t.amount, 0);
      return { name: format(m, 'MMM'), income: inc, expense: exp };
    });
  }, [transactions]);

  const categoryChartData = useMemo(() => {
    return categoryPieData.map(cat => ({
      name: cat.name,
      value: cat.value,
      color: CATEGORY_CONFIG[cat.name]?.color || '#95afc0'
    }));
  }, [categoryPieData]);

  // ─── HANDLERS ───
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const formatInputNumber = (value: string) => {
    const rawValue = value.replace(/\D/g, '');
    if (!rawValue) return '';
    const num = parseInt(rawValue);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = newAmount.replace(/\D/g, '');
    if (!newTitle || !rawAmount) return;
    const now = new Date();
    const finalTime = newTime || format(now, 'HH:mm');
    const txData = {
      title: newTitle,
      amount: parseFloat(rawAmount),
      type: newType,
      category: newCategory,
      date: newDate || format(now, 'yyyy-MM-dd'),
      time: finalTime,
      classification: newClassification,
      isDebt: newType === 'debt',
      debtType: newType === 'debt' ? newDebtType : undefined,
      isSettled: newType === 'debt' ? newIsSettled : undefined,
    };
    if (!user) {
      const savedTx: Transaction = { ...txData, id: editingTransaction ? editingTransaction.id : crypto.randomUUID(), ownerId: 'local' } as Transaction;
      if (editingTransaction) {
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? savedTx : t));
      } else {
        setTransactions(prev => [...prev, savedTx]);
      }
      localStorage.setItem('blutracker_transactions', JSON.stringify(
        editingTransaction ? transactions.map(t => t.id === editingTransaction.id ? savedTx : t) : [...transactions, savedTx]
      ));
    } else {
      try {
        if (editingTransaction) { await db.updateTransaction(user.uid, editingTransaction.id, txData); }
        else { await db.addTransaction(user.uid, txData as any); }
      } catch (error) { console.error('Error saving transaction:', error); alert('Gagal menyimpan transaksi.'); }
    }
    setIsModalOpen(false);
    setEditingTransaction(null);
    setNewTitle(''); setNewAmount(''); setNewDate(''); setNewTime(''); setNewType('expense');
    setNewCategory('General'); setNewClassification('personal'); setNewDebtType('borrow'); setNewIsSettled(false);
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewTitle(transaction.title);
    setNewAmount(formatInputNumber(transaction.amount.toString()));
    setNewDate(transaction.date);
    setNewTime(transaction.time || format(new Date(), 'HH:mm'));
    setNewType(transaction.type);
    setNewCategory(transaction.category || 'General');
    setNewClassification(transaction.classification || 'personal');
    if (transaction.type === 'debt') {
      setNewDebtType(transaction.debtType || 'borrow');
      setNewIsSettled(transaction.isSettled || false);
    }
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setIsDeleting(true);
    try {
      if (!user) {
        setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
        localStorage.setItem('blutracker_transactions', JSON.stringify(transactions.filter(t => t.id !== transactionToDelete.id)));
      } else {
        await db.deleteTransaction(user.uid, transactionToDelete.id);
      }
      setTransactionToDelete(null);
    } catch (e) { console.error('Delete error:', e); alert('Gagal menghapus transaksi.'); }
    finally { setIsDeleting(false); }
  };

  const handleToggleSettled = async (transaction: Transaction) => {
    if (transaction.type !== 'debt') return;
    const newSettled = !transaction.isSettled;
    if (!user) {
      setTransactions(prev => prev.map(t => t.id === transaction.id ? { ...t, isSettled: newSettled } : t));
    } else {
      try { await db.updateTransaction(user.uid, transaction.id, { isSettled: newSettled }); }
      catch (e) { console.error('Toggle settled error:', e); }
    }
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const unique = transactions.filter(t => {
      const key = `${t.title}-${t.amount}-${t.date}-${t.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const removed = transactions.length - unique.length;
    if (removed > 0) {
      setTransactions(unique);
      if (!user) localStorage.setItem('blutracker_transactions', JSON.stringify(unique));
      alert(`${removed} transaksi duplikat telah dihapus.`);
    } else {
      alert('Tidak ada transaksi duplikat ditemukan.');
    }
  };

  const handleClearCurrentMonth = () => {
    const remaining = transactions.filter(t => !isSameMonth(parseISO(t.date), new Date()));
    const removed = transactions.length - remaining.length;
    if (removed > 0) {
      setTransactions(remaining);
      if (!user) localStorage.setItem('blutracker_transactions', JSON.stringify(remaining));
      alert(`${removed} transaksi bulan ini telah dihapus.`);
    }
  };

  const handleScanReceipt = async (base64Image: string) => {
    if (!base64Image) return;
    setIsScanning(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const token = data.session?.access_token || '';
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          contents: [{
            inlineData: { mimeType: "image/jpeg", data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image }
          }, {
            text: "Extract transaction details from this receipt. Return JSON with fields: title, amount (number), type (income or expense), category (Food, Salary, Entertainment, Shopping, Bensin, Perbaikan, Bonus, General), and classification (personal or business)."
          }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" }, amount: { type: "NUMBER" },
                type: { type: "STRING", enum: ["income", "expense"] },
                category: { type: "STRING" },
                classification: { type: "STRING", enum: ["personal", "business"] }
              },
              required: ["title", "amount", "type", "category", "classification"]
            }
          }
        })
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Gagal AI Scan");
      const extracted = JSON.parse(responseData.text || '{}');
      setNewTitle(extracted.title || '');
      setNewAmount(formatInputNumber(extracted.amount?.toString() || ''));
      setNewType(extracted.type || 'expense');
      setNewCategory(extracted.category || 'General');
      setNewClassification(extracted.classification || 'personal');
      setNewTime(format(new Date(), 'HH:mm'));
      setIsScannerOpen(false);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error("Scanning failed:", error);
      if (error?.message?.toLowerCase().includes('api key')) {
        alert("Fitur AI: Harap pastikan Anda telah memasukkan API Key Gemini yang valid.");
      } else { alert("Gagal memindai struk. Pastikan struk terlihat jelas dan lurus."); }
    } finally { setIsScanning(false); }
  };

  const analyzeBusinessWithAI = async () => {
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) { alert('Fitur AI belum tersedia di GitHub Pages.'); return; }
    const businessTransactions = transactions.filter(t => t.classification === 'business' && isSameMonth(parseISO(t.date), selectedMonth));
    if (businessTransactions.length === 0) { alert("Tidak ada transaksi bisnis untuk bulan ini."); return; }
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const prompt = `Saya memiliki data transaksi bisnis berikut untuk bulan ${format(selectedMonth, 'MMMM yyyy', { locale: id })}:
${businessTransactions.map(t => `- ${t.date} ${t.time}: ${t.title} (${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}) - ${formatCurrency(t.amount)}`).join('\n')}

Tolong berikan analisis singkat dan saran yang membangun untuk bisnis saya. Fokus pada kesehatan arus kas, kategori pengeluaran terbesar, dan tren pendapatan. Berikan dalam format yang mudah dibaca dengan emoji.`;
      let token = '';
      if (user && isSupabaseConfigured) {
        try { token = await auth.getIdToken(); } catch (e) { console.error('Auth error:', e); }
      }
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: JSON.stringify({ contents: prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghubungi AI");
      setAiAnalysisResult(data.text);
      setIsAiAnalysisModalOpen(true);
    } catch (error: any) {
      console.error(error);
      if (error?.message?.toLowerCase().includes('api key')) {
        setAiAnalysisResult("Fitur AI: Harap pastikan Anda telah memasukkan API Key Gemini yang valid.");
      } else { setAiAnalysisResult("Maaf, terjadi kesalahan saat menganalisis data."); }
      setIsAiAnalysisModalOpen(true);
    } finally { setIsAiAnalyzing(false); }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
          {payload.map((entry: any, index: number) => {
            const isIncome = entry.dataKey === 'income';
            const isExpense = entry.dataKey === 'expense' || entry.dataKey === 'amount';
            let Icon = Wallet; let color = entry.color || entry.fill || "#00AEEF";
            if (isIncome) Icon = ArrowDownLeft; if (isExpense) Icon = ArrowUpRight;
            return (
              <div key={index} className="flex items-center gap-1">
                <Icon size={8} style={{ color }} />
                <span className="text-[8px] font-extrabold text-gray-700 leading-none">{formatCurrency(entry.value)}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const renderInsideLabels = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, value } = props;
    const RADIAN = Math.PI / 180;
    const maxVal = Math.max(...categoryPieData.map(d => d.value)) || 1;
    const extraRadius = (value / maxVal) * 50;
    const radius = innerRadius + (outerRadius + extraRadius - innerRadius) / 2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const Icon = CATEGORY_CONFIG[name]?.icon || LayoutGrid;
    return (
      <g><foreignObject x={x - 15} y={y - 15} width={30} height={30}>
        <div className="flex items-center justify-center w-full h-full pointer-events-none"><Icon size={20} className="text-white drop-shadow-md" /></div>
      </foreignObject></g>
    );
  };

  const VariableRadiusSector = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const maxVal = Math.max(...categoryPieData.map(d => d.value)) || 1;
    const extraRadius = (payload.value / maxVal) * 50;
    return (
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + extraRadius}
        startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="#fff" strokeWidth={2}
        className="outline-none cursor-pointer hover:brightness-110 transition-all" style={{ outline: 'none' }} />
    );
  };

  // ─── RENDER ───
  if (!authReady) {
    return (
      <div className="min-h-[calc(100dvh-env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#171717]" size={24} />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="max-w-md mx-auto bg-[#F8FAFC] dark:bg-[#08090B] text-gray-900 dark:text-white min-h-screen relative shadow-2xl overflow-hidden transition-colors duration-200 border-x border-gray-100 dark:border-[#14181E] flex flex-col">
      {/* Safe Area Top Spacer */}
      <div className="h-[env(safe-area-inset-top)] sticky top-0 z-[110] border-b transition-colors duration-200"
        style={{ backgroundColor: theme === 'dark' ? '#0D0F12' : '#FFFFFF', borderColor: theme === 'dark' ? '#22272F' : '#F1F5F9' }} />

      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'home' && (
          <DashboardPage
            user={user} transactions={transactions} selectedMonth={selectedMonth}
            totalBalance={totalBalance} monthlyIncome={monthlyIncome} monthlyExpense={monthlyExpense}
            theme={theme} toggleTheme={toggleTheme} formatCurrency={formatCurrency}
            getGreeting={getGreeting} handlePrevMonth={handlePrevMonth} handleNextMonth={handleNextMonth}
            isCurrentMonth={isCurrentMonth}
          />
        )}
        {activeTab === 'statistics' && (
          <StatisticsPage
            transactions={transactions} selectedMonth={selectedMonth} isCurrentMonth={isCurrentMonth}
            handlePrevMonth={handlePrevMonth} handleNextMonth={handleNextMonth}
            formatCurrency={formatCurrency} theme={theme}
          />
        )}
        {activeTab === 'history' && (
          <HistoryPage
            transactions={transactions} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
            isCurrentMonth={isCurrentMonth} handlePrevMonth={handlePrevMonth} handleNextMonth={handleNextMonth}
            formatCurrency={formatCurrency} theme={theme} user={user} setTransactions={setTransactions}
            setTransactionToDelete={setTransactionToDelete} handleEditClick={handleEditClick}
            handleToggleSettled={handleToggleSettled} revealedId={revealedId} handleReveal={handleReveal} db={db}
          />
        )}
        {activeTab === 'profile' && (
          <ProfilePage
            user={user} theme={theme} toggleTheme={toggleTheme} logout={logout}
            handleRemoveDuplicates={handleRemoveDuplicates} handleClearCurrentMonth={handleClearCurrentMonth}
            isEditingName={isEditingName} setIsEditingName={setIsEditingName}
            tempName={tempName} setTempName={setTempName}
            handleSaveName={handleSaveName} isSavingName={isSavingName} appVersion="1.0.0"
          />
        )}
      </div>

      {/* Stats Detail Overlay */}
      <AnimatePresence>
        {isStatsDetailOpen && (
          <StatsDetailModal 
            setIsStatsDetailOpen={setIsStatsDetailOpen} selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory} CATEGORY_CONFIG={CATEGORY_CONFIG}
            categoryPieData={categoryPieData} transactions={transactions} selectedMonth={selectedMonth}
            formatCurrency={formatCurrency} CustomTooltip={CustomTooltip} monthlyExpense={monthlyExpense}
            setTransactionToDelete={setTransactionToDelete} handleEditClick={handleEditClick}
            handleToggleSettled={handleToggleSettled} revealedId={revealedId} handleReveal={handleReveal}
            statsView={statsView} setStatsView={setStatsView} isCurrentMonth={isCurrentMonth}
            handlePrevMonth={handlePrevMonth} handleNextMonth={handleNextMonth}
            hourlyData={hourlyData} chartData={chartData} monthlyChartData={monthlyChartData}
            categoryChartData={categoryChartData} VariableRadiusSector={VariableRadiusSector}
            renderInsideLabels={renderInsideLabels}
          />
        )}
      </AnimatePresence>

      {/* FAB Menu Backdrop */}
      <AnimatePresence>
        {isAddMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsAddMenuOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90]" />
        )}
      </AnimatePresence>

      {/* FAB */}
      <div className="fixed bottom-[104px] right-6 flex flex-col items-end gap-4 z-[100]">
        <AnimatePresence>
          {isAddMenuOpen && (
            <div className="flex flex-col items-end gap-3 mb-2">
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.3 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.3 }}
                transition={{ type: "spring", stiffness: 600, damping: 25 }}>
                <button onClick={() => { setIsScannerOpen(true); setIsAddMenuOpen(false); }}
                  className="w-12 h-12 bg-gray-900 border border-white/10 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <Camera size={20} className="text-[#00F5FF]" />
                </button>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.3 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.3 }}
                transition={{ type: "spring", stiffness: 600, damping: 25, delay: 0.05 }}>
                <button onClick={() => { setNewTime(format(new Date(), 'HH:mm')); setIsModalOpen(true); setIsAddMenuOpen(false); }}
                  className="w-12 h-12 bg-[#0D0F12] border border-[#CFFF0F]/30 text-[#CFFF0F] rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer">
                  <Plus size={24} strokeWidth={3} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className={cn("w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer",
            isAddMenuOpen ? "bg-gray-800 text-white rotate-45 border border-white/5" : "bg-[#CFFF0F] text-black shadow-lg shadow-[#CFFF0F]/15")}>
          <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Navigation - 4 Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-[#0D0F12]/90 backdrop-blur-md border-t border-gray-100 dark:border-[#22272F]/80 px-2 py-3 flex justify-around items-center z-50 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {[
          { id: 'home', icon: <Wallet size={20} />, label: 'Beranda' },
          { id: 'statistics', icon: <BarChart3 size={20} />, label: 'Statistik' },
          { id: 'history', icon: <History size={20} />, label: 'Riwayat' },
          { id: 'profile', icon: <UserCircle size={20} />, label: 'Profil' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={cn("flex flex-col items-center gap-1 p-1.5 transition-all flex-1 cursor-pointer",
              activeTab === tab.id ? "text-gray-950 dark:text-[#CFFF0F]" : "text-gray-400 dark:text-gray-500")}>
            <div className={cn("px-4 py-2 rounded-2xl transition-all",
              activeTab === tab.id ? "bg-[#CFFF0F]/20 dark:bg-[#CFFF0F]/10 text-gray-950 dark:text-[#CFFF0F]" : "hover:bg-gray-50 dark:hover:bg-[#14181E]")}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest mt-1">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Debt Detail Overlay */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-[150] flex flex-col">
            <header className="p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100/50 rounded-xl text-orange-600"><CreditCard size={20} /></div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Hutang & Piutang</h2>
                </div>
                <button onClick={() => setIsDebtModalOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-2 -top-2 opacity-10"><ArrowDownLeft size={64} className="text-orange-600" /></div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter mb-1 relative z-10">Piutang (Pinjam)</p>
                  <p className="text-xl font-black text-orange-900 relative z-10">{formatCurrency(debtStats.borrow)}</p>
                  <p className="text-[9px] text-orange-600/60 mt-1">Uang yang kamu pinjam</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-2 -top-2 opacity-10"><ArrowUpRight size={64} className="text-blue-600" /></div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mb-1 relative z-10">Utang (Meminjami)</p>
                  <p className="text-xl font-black text-blue-900 relative z-10">{formatCurrency(debtStats.lend)}</p>
                  <p className="text-[9px] text-blue-600/60 mt-1">Uang yang kamu pinjamkan</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Daftar Tagihan</h3>
                  {transactions.filter(t => t.type === 'debt').length > 0 && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                      {transactions.filter(t => t.type === 'debt').length} Transaksi
                    </span>
                  )}
                </div>
                {transactions.filter(t => t.type === 'debt').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-950 rounded-full flex items-center justify-center mb-4"><CreditCard size={32} className="text-gray-300" /></div>
                    <p className="text-gray-400 font-bold text-sm">Tidak ada hutang aktif</p>
                    <p className="text-gray-300 text-xs mt-1">Gunakan tombol + untuk menambah</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {transactions.filter(t => t.type === 'debt').map(t => (
                        <TransactionItem key={t.id} transaction={t} onDelete={() => setTransactionToDelete(t)}
                          onEdit={() => handleEditClick(t)} onToggleSettled={() => handleToggleSettled(t)}
                          formatCurrency={formatCurrency} isRevealed={revealedId === t.id}
                          onReveal={(isRevealed) => handleReveal(t.id, isRevealed)} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScan={handleScanReceipt} isScanning={isScanning} />}

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionModal 
          setIsModalOpen={setIsModalOpen} editingTransaction={editingTransaction} setEditingTransaction={setEditingTransaction}
          newTitle={newTitle} setNewTitle={setNewTitle} newAmount={newAmount} setNewAmount={setNewAmount}
          newDate={newDate} setNewDate={setNewDate} newTime={newTime} setNewTime={setNewTime}
          newType={newType} setNewType={setNewType} newCategory={newCategory} setNewCategory={setNewCategory}
          newClassification={newClassification} setNewClassification={setNewClassification}
          newDebtType={newDebtType} setNewDebtType={setNewDebtType} setNewIsSettled={setNewIsSettled}
          isSuggesting={isSuggesting} handleSaveTransaction={handleAddTransaction}
          setIsScannerOpen={setIsScannerOpen} formatInputNumber={formatInputNumber}
        />
      )}

      {/* Import Status Modal */}
      {importStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center",
                importStatus.type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                {importStatus.type === 'success' ? <Check size={32} /> : <AlertCircle size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{importStatus.type === 'success' ? 'Berhasil' : 'Kesalahan'}</h3>
                <p className="text-sm text-gray-500">{importStatus.message}</p>
              </div>
            </div>
            <button onClick={() => setImportStatus(null)}
              className="w-full py-4 bg-blu-primary text-white font-bold rounded-2xl hover:bg-blu-dark transition-colors">Tutup</button>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><AlertCircle size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Hapus Transaksi?</h3>
                <p className="text-sm text-gray-500">Apakah kamu yakin ingin menghapus transaksi <span className="font-bold text-gray-700">"{transactionToDelete.title}"</span>? Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteTransaction} disabled={isDeleting}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button onClick={() => setTransactionToDelete(null)}
                className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors">Batal</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            setIsAuthModalOpen={setIsAuthModalOpen} authEmail={authEmail} setAuthEmail={setAuthEmail}
            authPassword={authPassword} setAuthPassword={setAuthPassword} authDisplayName={authDisplayName}
            setAuthDisplayName={setAuthDisplayName} authError={authError} setAuthError={setAuthError}
            authMode={authMode} setAuthMode={setAuthMode} isAuthLoading={isAuthLoading}
            setIsAuthLoading={setIsAuthLoading} handleEmailAuth={handleEmailAuth} loginWithGoogle={loginWithGoogle}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
