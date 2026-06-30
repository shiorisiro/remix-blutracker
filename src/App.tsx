import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Wallet, History, TrendingUp, User as UserIcon, Mic, Camera,
  Check, Loader2, X, AlertCircle, Sparkles, Bot, CreditCard,
  ArrowDownLeft, ArrowUpRight, Trash2, Download,
  Search, Edit2, Sun, Moon,
  Utensils, ShoppingBag, Bus, Fuel, HeartPulse, GraduationCap,
  MonitorSmartphone, Play, Wrench, Scissors, Package, Briefcase,
  Store, Award, Code2, Landmark, Gift, ArrowDownToLine, Coins,
  CalendarClock, LayoutGrid,
} from 'lucide-react';
import { format, parseISO, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, subDays, addDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Sector } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, TransactionType, DebtType } from './types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { auth, AppUser, onAuthStateChange, signInWithEmail, signUpWithEmail, updateUserProfile, signInWithGoogle } from './auth';
import { flushQueue } from './offlineDb';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { useSyncStatus } from './useSyncStatus';
import { supabase } from './supabase-client';
import { useTheme } from './ThemeContext';
import { LoginScreen } from './components/LoginScreen';
import { cn } from './lib/utils';
import { INITIAL_TRANSACTIONS, CATEGORIES_BY_TYPE, CATEGORY_MIGRATION_MAP } from './constants';
import { TransactionItem } from './components/TransactionItem';
import { ScannerModal } from './components/ScannerModal';
import { StatsDetailModal } from './components/StatsDetailModal';
import { TransactionModal } from './components/TransactionModal';
import { AuthModal } from './components/AuthModal';
import { StatusBar, Style } from '@capacitor/status-bar';

// Screen components
import { HomeScreen } from './components/HomeScreen';
import { StatsScreen } from './components/StatsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';

// Hooks
import { useTransactions } from './hooks/useTransactions';

// UI Primitives
import { BottomSheet } from './components/ui/BottomSheet';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Selamat Pagi';
  if (h >= 11 && h < 15) return 'Selamat Siang';
  if (h >= 15 && h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const DEFAULT_AVATAR_ID = 'avatar-1';

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Status bar
  useEffect(() => {
    const update = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        if (theme === 'dark') {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#08090B' });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#F8FAFC' });
        }
      } catch { /* not available on web */ }
    };
    update();
  }, [theme]);

  // PWA service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const isDev = ['localhost', '.run.app', 'ais-', 'web-'].some((s) => window.location.hostname.includes(s));
      if (isDev) {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      } else {
        window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
      }
    }
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const { status: syncStatus, pendingCount: syncPendingCount } = useSyncStatus(user?.uid);

  useEffect(() => {
    return onAuthStateChange((u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  // ── Transactions ──────────────────────────────────────────────────────────
  const {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
  } = useTransactions(user, authReady);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'history' | 'profile'>('home');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void } | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // AI settings
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('blutracker_gemini_key') || '');
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey);
  const [isAiSettingsModalOpen, setIsAiSettingsModalOpen] = useState(false);
  useEffect(() => { localStorage.setItem('blutracker_gemini_key', geminiApiKey); }, [geminiApiKey]);

  // Profile
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR_ID);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const isPhotoUrl = (v?: string | null) => !!v && (v.startsWith('http://') || v.startsWith('https://'));
  useEffect(() => {
    if (user?.photoURL) setSelectedAvatar(user.photoURL);
    else if (!user) setSelectedAvatar(DEFAULT_AVATAR_ID);
  }, [user?.photoURL, user]);

  // Month nav
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const isCurrentMonth = isSameMonth(selectedMonth, new Date());
  const handlePrevMonth = () => { setSelectedMonth((p) => subMonths(p, 1)); setStatsView('weekly'); };
  const handleNextMonth = () => setSelectedMonth((p) => addMonths(p, 1));

  // Filter/sort
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterClassification, setFilterClassification] = useState<'all' | 'personal' | 'business'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Stats
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statsView, setStatsView] = useState<'weekly' | 'daily'>('weekly');

  // Form
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newCategory, setNewCategory] = useState('General');
  const [newClassification, setNewClassification] = useState<'personal' | 'business'>('personal');
  const [newDebtType, setNewDebtType] = useState<DebtType>('borrow');
  const [newIsSettled, setNewIsSettled] = useState(false);

  // Weather
  const [weatherStatus, setWeatherStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading');
  const [weatherData, setWeatherData] = useState<{ temp: number; code: number; isDay: boolean } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  useEffect(() => {
    if (!('geolocation' in navigator)) { setWeatherStatus('error'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`);
          const data = await res.json();
          setWeatherData({ temp: Math.round(data?.current?.temperature_2m), code: data?.current?.weather_code, isDay: data?.current?.is_day === 1 });
          setWeatherStatus('success');
        } catch { setWeatherStatus('error'); }
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
          if (geoRes.ok) { const gd = await geoRes.json(); setLocationName(gd?.city || gd?.locality || null); }
        } catch { /* non-fatal */ }
      },
      () => setWeatherStatus('denied'),
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => { setRevealedId(null); }, [activeTab]);
  const handleReveal = useCallback((id: string, isRevealed: boolean) => setRevealedId(isRevealed ? id : null), []);

  // ── Computed ──────────────────────────────────────────────────────────────
  const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  const formatInputNumber = (v: string) => {
    const raw = v.replace(/\D/g, '');
    if (!raw) return '';
    const n = parseInt(raw);
    return isNaN(n) ? '' : new Intl.NumberFormat('id-ID').format(n);
  };

  const totalBalance = useMemo(() => transactions.reduce((acc, t) => {
    if (t.type === 'income') return acc + t.amount;
    if (t.type === 'expense') return acc - t.amount;
    if (t.type === 'debt' && !t.isSettled) return t.debtType === 'borrow' ? acc + t.amount : acc - t.amount;
    return acc;
  }, 0), [transactions]);

  const monthlyIncome = useMemo(() => transactions.filter((t) => t.type === 'income' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((a, t) => a + t.amount, 0), [transactions, selectedMonth]);
  const monthlyExpense = useMemo(() => transactions.filter((t) => t.type === 'expense' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((a, t) => a + t.amount, 0), [transactions, selectedMonth]);

  const startBalance = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    return transactions.filter((t) => new Date(t.date) < start).reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      if (t.type === 'debt' && !t.isSettled) return t.debtType === 'borrow' ? acc + t.amount : acc - t.amount;
      return acc;
    }, 0);
  }, [transactions, selectedMonth]);

  const endBalance = useMemo(() => startBalance + monthlyIncome - monthlyExpense, [startBalance, monthlyIncome, monthlyExpense]);
  const totalBalanceToDisplay = isCurrentMonth ? totalBalance : endBalance;

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const date = format(d, 'yyyy-MM-dd');
      return {
        name: format(d, 'EEE'),
        income: transactions.filter((t) => t.type === 'income' && t.date === date).reduce((a, t) => a + t.amount, 0),
        expense: transactions.filter((t) => t.type === 'expense' && t.date === date).reduce((a, t) => a + t.amount, 0),
      };
    });
  }, [transactions]);

  const weeklyTrend = useMemo(() => {
    const todayS = startOfDay(new Date()); const todayE = endOfDay(new Date());
    const ystS = startOfDay(subDays(new Date(), 1)); const ystE = endOfDay(subDays(new Date(), 1));
    const sum = (type: 'income' | 'expense', s: Date, e: Date) =>
      transactions.filter((t) => t.type === type && parseISO(t.date) >= s && parseISO(t.date) <= e).reduce((a, t) => a + t.amount, 0);
    const pct = (c: number, p: number) => p === 0 ? null : ((c - p) / p) * 100;
    const ci = sum('income', todayS, todayE); const pi = sum('income', ystS, ystE);
    const ce = sum('expense', todayS, todayE); const pe = sum('expense', ystS, ystE);
    return {
      income: { percent: pct(ci, pi), isGood: ci >= pi, sparkline: chartData.map((d) => d.income) },
      expense: { percent: pct(ce, pe), isGood: ce <= pe, sparkline: chartData.map((d) => d.expense) },
    };
  }, [transactions, chartData]);

  const monthlyChartData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = isCurrentMonth ? new Date() : endOfMonth(selectedMonth);
    let running = transactions.filter((t) => new Date(t.date) < start).reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      return acc;
    }, 0);
    return eachDayOfInterval({ start, end }).map((day) => {
      const ds = format(day, 'yyyy-MM-dd');
      const inc = transactions.filter((t) => t.type === 'income' && t.date === ds).reduce((a, t) => a + t.amount, 0);
      const exp = transactions.filter((t) => t.type === 'expense' && t.date === ds).reduce((a, t) => a + t.amount, 0);
      running += inc - exp;
      return { name: format(day, 'd'), balance: running, income: inc, expense: exp };
    });
  }, [transactions, selectedMonth, isCurrentMonth]);

  const categoryPieData = useMemo(() => CATEGORIES_BY_TYPE.expense.map((cat) => ({
    name: cat,
    value: transactions.filter((t) => t.type === 'expense' && t.category === cat && isSameMonth(parseISO(t.date), selectedMonth)).reduce((a, t) => a + t.amount, 0),
  })).filter((d) => d.value > 0), [transactions, selectedMonth]);

  const categoryChartData = useMemo(() => {
    if (!selectedCategory) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const date = format(d, 'yyyy-MM-dd');
      return {
        name: format(d, 'EEE'),
        amount: transactions.filter((t) => t.type === 'expense' && t.category === selectedCategory && t.date === date).reduce((a, t) => a + t.amount, 0),
      };
    });
  }, [transactions, selectedCategory]);

  const hourlyData = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return Array.from({ length: 24 }, (_, h) => ({
      name: `${h.toString().padStart(2, '0')}:00`,
      amount: transactions.filter((t) => t.type === 'expense' && t.date === today && t.time && parseInt(t.time.split(':')[0]) === h && (!selectedCategory || t.category === selectedCategory)).reduce((a, t) => a + t.amount, 0),
    }));
  }, [transactions, selectedCategory]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (activeTab === 'history') { result = result.filter((t) => isSameMonth(parseISO(t.date), selectedMonth) && t.type !== 'debt'); }
    if (searchQuery) result = result.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterCategory !== 'All') result = result.filter((t) => t.category === filterCategory);
    if (filterClassification !== 'all') result = result.filter((t) => t.classification === filterClassification);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') { cmp = (a.date || '').localeCompare(b.date || ''); if (cmp === 0) cmp = (a.time || '').localeCompare(b.time || ''); }
      else if (sortBy === 'amount') cmp = a.amount - b.amount;
      else cmp = a.category.localeCompare(b.category);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [transactions, searchQuery, filterCategory, filterClassification, sortBy, sortOrder, activeTab, selectedMonth]);

  const filteredMonthlyIncome = useMemo(() => filteredTransactions.filter((t) => t.type === 'income' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((a, t) => a + t.amount, 0), [filteredTransactions, selectedMonth]);
  const filteredMonthlyExpense = useMemo(() => filteredTransactions.filter((t) => t.type === 'expense' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((a, t) => a + t.amount, 0), [filteredTransactions, selectedMonth]);

  const debtStats = useMemo(() => {
    const active = transactions.filter((t) => t.type === 'debt' && !t.isSettled);
    return {
      borrow: active.filter((t) => t.debtType === 'borrow').reduce((a, t) => a + t.amount, 0),
      lend: active.filter((t) => t.debtType === 'lend').reduce((a, t) => a + t.amount, 0),
    };
  }, [transactions]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    try {
      setIsSavingName(true);
      await updateUserProfile({ displayName: tempName.trim() });
      setUser((p) => p ? { ...p, displayName: tempName.trim() } : null);
      setIsEditingName(false);
    } catch { alert('Gagal memperbarui nama.'); } finally { setIsSavingName(false); }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    if (avatarId === selectedAvatar || isSavingAvatar) return;
    const prev = selectedAvatar; setSelectedAvatar(avatarId);
    try { setIsSavingAvatar(true); await updateUserProfile({ photoURL: avatarId }); }
    catch { setSelectedAvatar(prev); alert('Gagal menyimpan avatar.'); } finally { setIsSavingAvatar(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    if (!file.type.startsWith('image/')) { alert('File harus berupa gambar.'); return; }
    setIsUploadingPhoto(true);
    try {
      const blob: Blob = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const max = 512; let { width: w, height: h } = img;
          if (w > h) { if (w > max) { h = Math.round(h * max / w); w = max; } } else { if (h > max) { w = Math.round(w * max / h); h = max; } }
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d')?.drawImage(img, 0, 0, w, h);
          c.toBlob((b) => b ? res(b) : rej(new Error('fail')), 'image/jpeg', 0.85);
          URL.revokeObjectURL(img.src);
        };
        img.onerror = () => rej(new Error('fail'));
        img.src = URL.createObjectURL(file);
      });
      const path = `${user.uid}/avatar.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await updateUserProfile({ photoURL: url }); setSelectedAvatar(url); setIsAvatarPickerOpen(false);
    } catch (err: any) { alert(`Gagal upload foto: ${err?.message || 'Unknown error'}`); } finally { setIsUploadingPhoto(false); e.target.value = ''; }
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t); setNewTitle(t.title); setNewAmount(formatInputNumber(t.amount.toString()));
    setNewType(t.type); setNewCategory(t.category); setNewDate(t.date); setNewTime(t.time || '');
    setNewClassification(t.classification); setNewDebtType(t.debtType || 'borrow'); setNewIsSettled(t.isSettled || false);
    setIsModalOpen(true);
  };

  const handleToggleSettled = async (t: Transaction) => {
    await updateTransaction(t.id, { isSettled: !t.isSettled }); setRevealedId(null);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete || isDeleting) return;
    setIsDeleting(true);
    try { await deleteTransaction(transactionToDelete.id); setTransactionToDelete(null); }
    catch (e: any) { alert(e.message || 'Gagal menghapus transaksi.'); } finally { setIsDeleting(false); }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = newAmount.replace(/\D/g, '');
    if (!newTitle || !rawAmount) return;
    const now = new Date();
    const txData = {
      title: newTitle, amount: parseFloat(rawAmount), type: newType, category: newCategory,
      date: newDate || format(now, 'yyyy-MM-dd'), time: newTime || format(now, 'HH:mm'),
      classification: newClassification, isDebt: newType === 'debt',
      debtType: newType === 'debt' ? newDebtType : undefined,
      isSettled: newType === 'debt' ? newIsSettled : undefined,
    };
    if (editingTransaction) { await updateTransaction(editingTransaction.id, txData); }
    else { await addTransaction(txData as any); }
    setNewTitle(''); setNewAmount(''); setNewDate(''); setNewTime(''); setEditingTransaction(null);
    setIsModalOpen(false); setNewType('expense'); setNewCategory('General'); setNewClassification('personal');
  };

  const handleRemoveDuplicates = async () => {
    if (!user || !window.confirm('Hapus data duplikat?')) return;
    const seen = new Set<string>();
    const dups = transactions.filter((t) => {
      const key = `${t.title}-${t.amount}-${t.date}-${t.time}-${t.type}`;
      if (seen.has(key)) return true; seen.add(key); return false;
    });
    if (dups.length === 0) { alert('Tidak ada data duplikat.'); return; }
    await deleteTransactions(dups.map((t) => t.id));
    alert(`Berhasil menghapus ${dups.length} duplikat.`);
  };

  const handleClearCurrentMonth = async () => {
    const monthTx = transactions.filter((t) => isSameMonth(parseISO(t.date), selectedMonth));
    if (monthTx.length === 0) { alert('Tidak ada transaksi di bulan ini.'); return; }
    if (!window.confirm('Hapus semua transaksi bulan ini?')) return;
    await deleteTransactions(monthTx.map((t) => t.id));
    alert('Berhasil menghapus transaksi bulan ini.');
  };

  const handleExportCSV = () => {
    const rows = transactions.map((t) => ({ Tanggal: t.date, Waktu: t.time, 'Judul Transaksi': t.title, Jumlah: t.amount, Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', Kategori: t.category, Klasifikasi: t.classification === 'business' ? 'Bisnis' : 'Pribadi' }));
    const blob = new Blob(['\ufeff' + Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `transaksi_${format(new Date(), 'yyyy-MM-dd')}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleExportExcel = () => {
    const rows = transactions.map((t) => ({ Tanggal: t.date, Waktu: t.time, 'Judul Transaksi': t.title, Jumlah: t.amount, Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', Kategori: t.category, Klasifikasi: t.classification === 'business' ? 'Bisnis' : 'Pribadi' }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `transaksi_${format(new Date(), 'yyyy-MM-dd')}.xlsx` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const isExcel = /\.xlsx?$/.test(file.name.toLowerCase());
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let importedData: any[] = [];
        if (isExcel) {
          const wb = XLSX.read(e.target?.result, { type: 'array' });
          importedData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        } else {
          const content = typeof e.target?.result === 'string' ? e.target.result : new TextDecoder().decode(e.target?.result as ArrayBuffer);
          importedData = Papa.parse(content, { header: true, skipEmptyLines: true }).data;
        }
        if (!importedData.length) { setImportStatus({ message: 'File kosong.', type: 'error' }); return; }
        const valid: Transaction[] = [];
        importedData.forEach((row: any, i) => {
          const find = (keys: string[]) => Object.entries(row).find(([k]) => keys.some((key) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')))?.[1];
          const title = String(find(['judultransaksi', 'title', 'nama', 'keterangan']) || 'Tanpa Judul');
          const rawAmt = find(['amount', 'jumlah', 'nominal']);
          const amount = typeof rawAmt === 'number' ? rawAmt : parseFloat(String(rawAmt || '0').replace(/[^\d.]/g, '')) || 0;
          if (amount <= 0) return;
          const typeRaw = String(find(['tipe', 'type']) || 'expense').toLowerCase();
          const type: 'income' | 'expense' = typeRaw.includes('masuk') || typeRaw.includes('in') ? 'income' : 'expense';
          const date = String(find(['tanggal', 'date']) || format(new Date(), 'yyyy-MM-dd'));
          const classification: 'personal' | 'business' = String(find(['klasifikasi', 'classification']) || '').toLowerCase().includes('bisnis') ? 'business' : 'personal';
          valid.push({ id: crypto.randomUUID(), title, amount, type, category: String(find(['kategori', 'category']) || 'Lainnya'), date: date.includes('T') ? date.split('T')[0] : date, time: String(find(['waktu', 'time']) || '00:00'), classification });
        });
        if (!valid.length) { setImportStatus({ message: 'Tidak ada data valid.', type: 'error' }); return; }
        const doImport = async () => {
          try {
            for (const t of valid) await addTransaction(t as any);
            setImportStatus({ message: `Berhasil mengimpor ${valid.length} transaksi.`, type: 'success' });
          } catch { setImportStatus({ message: 'Gagal mengimpor.', type: 'error' }); }
        };
        setImportStatus({ message: `Import ${valid.length} transaksi?`, type: 'confirm', onConfirm: doImport });
      } catch { setImportStatus({ message: 'Gagal membaca file.', type: 'error' }); }
      if (event.target) event.target.value = '';
    };
    isExcel ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  };

  const analyzeBusinessWithAI = async () => {
    if (!geminiApiKey) { alert('Masukkan API Key Gemini di Pengaturan AI.'); return; }
    const biz = filteredTransactions.filter((t) => t.classification === 'business' && isSameMonth(parseISO(t.date), selectedMonth));
    if (!biz.length) { alert('Tidak ada transaksi bisnis bulan ini.'); return; }
    setIsAiAnalyzing(true); setAiAnalysisResult(null);
    try {
      const prompt = `Data transaksi bisnis ${format(selectedMonth, 'MMMM yyyy', { locale: id })}:\n${biz.map((t) => `- ${t.date}: ${t.title} (${t.type === 'income' ? 'Masuk' : 'Keluar'}) ${formatCurrency(t.amount)}`).join('\n')}\n\nBerikan analisis singkat dan saran dalam format yang mudah dibaca dengan emoji.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      setAiAnalysisResult(data.candidates?.[0]?.content?.parts?.[0]?.text || '');
      setIsAiAnalysisModalOpen(true);
    } catch { setAiAnalysisResult('Terjadi kesalahan saat analisis.'); setIsAiAnalysisModalOpen(true); } finally { setIsAiAnalyzing(false); }
  };

  const handleVoiceInput = () => {
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API) { alert('Browser tidak mendukung input suara.'); return; }
    if (isListening) { setIsListening(false); return; }
    const rec = new API(); rec.lang = 'id-ID'; rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.onresult = (ev: any) => {
      const text = ev.results[0]?.[0]?.transcript || '';
      if (text) { setNewTitle(text); setNewTime(format(new Date(), 'HH:mm')); setIsModalOpen(true); }
    };
    rec.start();
  };

  const handleScanReceipt = async (base64Image: string) => {
    if (!base64Image) return;
    setIsScanning(true);
    try {
      if (!geminiApiKey) { alert('Masukkan API Key Gemini.'); return; }
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image } }, { text: 'Extract: title, amount (number), type (income/expense), category, classification (personal/business). Return JSON.' }] }], generationConfig: { responseMimeType: 'application/json' } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      const ex = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
      setNewTitle(ex.title || ''); setNewAmount(formatInputNumber(String(ex.amount || ''))); setNewType(ex.type === 'income' ? 'income' : 'expense');
      setNewCategory(ex.category || 'Lainnya'); setNewClassification(ex.classification || 'personal'); setNewTime(format(new Date(), 'HH:mm'));
      setIsScannerOpen(false); setIsModalOpen(true);
    } catch { alert('Gagal memindai struk.'); } finally { setIsScanning(false); }
  };

  const CATEGORY_CONFIG: Record<string, { color: string; icon: any }> = {
    'Makanan & Minuman': { color: '#FF6B6B', icon: Utensils },
    'Makanan': { color: '#FF6B6B', icon: Utensils },
    'Belanja': { color: '#4ECDC4', icon: ShoppingBag },
    'Transportasi': { color: '#74B9FF', icon: Bus },
    'Bensin': { color: '#FFD93D', icon: Fuel },
    'Kesehatan': { color: '#55EFC4', icon: HeartPulse },
    'Pendidikan': { color: '#A29BFE', icon: GraduationCap },
    'Tagihan & Utilitas': { color: '#FD79A8', icon: MonitorSmartphone },
    'Hiburan': { color: '#6C5CE7', icon: Play },
    'Perbaikan': { color: '#FFEAA7', icon: Wrench },
    'Kecantikan & Perawatan': { color: '#FDCB6E', icon: Scissors },
    'Modal Usaha': { color: '#00B894', icon: Package },
    'Gaji': { color: '#0984E3', icon: Briefcase },
    'Penjualan': { color: '#00CEC9', icon: Store },
    'Bonus': { color: '#FDCB6E', icon: Award },
    'Proyek': { color: '#6C5CE7', icon: Code2 },
    'Freelance': { color: '#E17055', icon: Landmark },
    'Investasi': { color: '#00B894', icon: TrendingUp },
    'Hadiah': { color: '#FF7675', icon: Gift },
    'Transfer Masuk': { color: '#74B9FF', icon: ArrowDownToLine },
    'Pinjaman': { color: '#E17055', icon: Coins },
    'Cicilan': { color: '#636E72', icon: CalendarClock },
    'Lainnya': { color: '#95afc0', icon: LayoutGrid },
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
          {payload.map((entry: any, index: number) => {
            const isIncome = entry.dataKey === 'income';
            const isExpense = entry.dataKey === 'expense' || entry.dataKey === 'amount';
            let Icon = Wallet;
            let color = entry.color || entry.fill || '#00AEEF';
            if (isIncome) Icon = ArrowDownLeft;
            if (isExpense) Icon = ArrowUpRight;
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
    const maxVal = Math.max(...categoryPieData.map((d) => d.value)) || 1;
    const extraRadius = (value / maxVal) * 50;
    const radius = innerRadius + (outerRadius + extraRadius - innerRadius) / 2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const Icon = CATEGORY_CONFIG[name]?.icon || LayoutGrid;
    return (
      <g>
        <foreignObject x={x - 15} y={y - 15} width={30} height={30}>
          <div className="flex items-center justify-center w-full h-full pointer-events-none">
            <Icon size={20} className="text-white drop-shadow-md" />
          </div>
        </foreignObject>
      </g>
    );
  };

  const VariableRadiusSector = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const maxVal = Math.max(...categoryPieData.map((d) => d.value)) || 1;
    const extraRadius = (payload.value / maxVal) * 50;
    return (
      <Sector
        cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + extraRadius}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
        stroke="#fff" strokeWidth={2} className="outline-none cursor-pointer hover:brightness-110 transition-all"
        style={{ outline: 'none' }}
      />
    );
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setIsAuthLoading(true); setAuthError(null);
    try {
      if (authMode === 'register') await signUpWithEmail(authEmail.trim(), authPassword.trim(), authDisplayName.trim());
      else await signInWithEmail(authEmail.trim(), authPassword.trim());
      setIsAuthModalOpen(false); setAuthEmail(''); setAuthPassword(''); setAuthDisplayName('');
    } catch (err: any) {
      let msg = err.message || '';
      if (msg.includes('already')) msg = 'Email sudah digunakan.';
      else if (msg.includes('invalid credentials') || msg.includes('Invalid login')) msg = 'Email atau kata sandi salah.';
      setAuthError(msg);
    } finally { setIsAuthLoading(false); }
  };

  const loginWithGoogle = async () => {
    try { setAuthError(null); await signInWithGoogle(); }
    catch (e: any) { setAuthError(`Login Google gagal: ${e.message}`); }
  };
  const logout = async () => {
    try {
      setTransactions([]); // Clear immediately so UI doesn't show stale data, and tap registers right away
      await auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090B]">
        <Loader2 className="animate-spin text-[#CFFF0F]" size={28} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onGoogleSignIn={loginWithGoogle} googleError={authError} />;
  }

  // ── Main Render ───────────────────────────────────────────────────────────
  const NAV_TABS = [
    { id: 'home', icon: <Wallet size={20} />, label: 'Beranda' },
    { id: 'stats', icon: <TrendingUp size={20} />, label: 'Statistik' },
    { id: 'history', icon: <History size={20} />, label: 'Riwayat' },
    { id: 'profile', icon: <UserIcon size={20} />, label: 'Profil' },
  ] as const;

  return (
    <div className="max-w-md mx-auto bg-[#F8FAFC] dark:bg-[#08090B] text-gray-900 dark:text-white min-h-screen relative shadow-2xl overflow-hidden transition-colors duration-200 border-x border-gray-100 dark:border-[#14181E] flex flex-col">
      {/* Safe area top spacer - NOT sticky, avoids double gap on Android */}
      <div
        className="h-[env(safe-area-inset-top)] shrink-0 transition-colors duration-200"
        style={{ backgroundColor: theme === 'dark' ? '#0D0F12' : '#FFFFFF' }}
      />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header - Only on Home (original layout) */}
        {activeTab === 'home' && (
          <header className="bg-[#FFFFFF] dark:bg-[#0D0F12] p-6 rounded-b-[40px] shadow-sm border-b border-gray-100 dark:border-[#22272F] transition-colors duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 bg-gray-100 dark:bg-[#14181E] rounded-2xl flex items-center justify-center overflow-hidden shadow-sm relative border border-gray-200 dark:border-[#22272F]">
                  <img src="./logo.png" alt="BluTracker" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col select-none">
                  <p className="text-xs text-gray-400 font-medium tracking-wide">{getGreeting()},</p>
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-gray-50 dark:bg-[#14181E] border border-gray-200 dark:border-[#22272F] rounded-lg px-2 py-0.5 text-xs font-semibold text-gray-800 dark:text-white focus:outline-none w-24"
                        placeholder="Nama baru..."
                        disabled={isSavingName}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          else if (e.key === 'Escape') setIsEditingName(false);
                        }}
                      />
                      <button onClick={handleSaveName} disabled={isSavingName} className="p-1 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-emerald-500 transition-colors cursor-pointer">
                        {isSavingName ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                      </button>
                      <button onClick={() => setIsEditingName(false)} disabled={isSavingName} className="p-1 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setTempName(user.displayName || user.email?.split('@')[0] || ''); setIsEditingName(true); }}
                      className="group flex items-center gap-1 cursor-pointer hover:opacity-85 transition-all"
                    >
                      <span className="font-bold text-sm tracking-tight text-gray-950 dark:text-white max-w-[120px] truncate">
                        {user.displayName || user.email?.split('@')[0] || 'Pengguna'}
                      </span>
                      <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CFFF0F]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Balance Card - original micro grid layout (income/expense INSIDE card) */}
            <div className="bg-gray-950 text-white p-6 rounded-[32px] relative overflow-hidden mb-6 border border-white/5 shadow-xl shadow-black/35 select-none bg-gradient-to-br from-[#0D0F12] via-[#14181E] to-[#0D1014]">
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-[#CFFF0F]/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-[#00F5FF]/5 rounded-full blur-[40px] pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold font-display">
                    {isCurrentMonth ? 'Active Portfolio Balance' : 'Portfolio Balance'}
                  </p>
                  <h2 className="text-3xl font-extrabold tracking-tight mt-1 font-display">
                    {formatCurrency(totalBalanceToDisplay)}
                  </h2>
                </div>
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 bg-[#CFFF0F] text-black rounded-lg tracking-wider shadow-sm shadow-[#CFFF0F]/15">
                  IDR
                </span>
              </div>
              {!isCurrentMonth && (
                <p className="text-[11px] text-gray-400 font-medium mb-4 flex items-center gap-1">
                  <span>Saldo Awal Bulan:</span>
                  <span className="text-white font-semibold">{formatCurrency(startBalance)}</span>
                </p>
              )}
              {/* Micro grid - income & expense INSIDE the card */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#CFFF0F]/10 rounded-lg flex items-center justify-center">
                    <ArrowDownLeft size={14} className="text-[#CFFF0F]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Income</p>
                    <p className="text-xs font-bold text-white tracking-wide">{formatCurrency(monthlyIncome)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-white/5 pl-3">
                  <div className="w-7 h-7 bg-[#00F5FF]/10 rounded-lg flex items-center justify-center">
                    <ArrowUpRight size={14} className="text-[#00F5FF]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Expenses</p>
                    <p className="text-xs font-bold text-white tracking-wide">{formatCurrency(monthlyExpense)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Month Selector */}
            <div className="flex items-center justify-between bg-transparent px-4 py-2 text-xs w-full">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 rounded-lg transition-colors text-gray-500 dark:text-gray-300 cursor-pointer select-none">
                <span className="filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_3px_10px_rgba(255,255,255,0.25)] block">
                  <ArrowDownLeft size={14} className="rotate-45" />
                </span>
              </button>
              <div className="font-extrabold text-xs tracking-widest text-gray-800 dark:text-white uppercase font-display">
                {format(selectedMonth, 'MMMM yyyy', { locale: id })}
              </div>
              <button
                onClick={handleNextMonth}
                disabled={isCurrentMonth}
                className={cn("p-1.5 rounded-lg transition-colors cursor-pointer select-none", isCurrentMonth ? "opacity-35 cursor-not-allowed text-gray-300" : "text-gray-500 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/40")}
              >
                <span className="filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_3px_10px_rgba(255,255,255,0.25)] block">
                  <ArrowUpRight size={14} className="rotate-45" />
                </span>
              </button>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="p-6 space-y-8">
          {activeTab === 'home' && (
            <HomeScreen
              theme={theme}
              isCurrentMonth={isCurrentMonth}
              formatCurrency={formatCurrency}
              chartData={chartData}
              weeklyTrend={weeklyTrend}
              totalBalanceToDisplay={totalBalanceToDisplay}
              monthlyIncome={monthlyIncome}
              monthlyExpense={monthlyExpense}
              startBalance={startBalance}
              weatherStatus={weatherStatus}
              weatherData={weatherData}
              locationName={locationName}
              selectedMonth={selectedMonth}
            />
          )}
          {activeTab === 'stats' && (
            <StatsScreen
              theme={theme} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              CATEGORY_CONFIG={CATEGORY_CONFIG} categories={CATEGORIES_BY_TYPE.expense}
              categoryPieData={categoryPieData} transactions={transactions}
              selectedMonth={selectedMonth} formatCurrency={formatCurrency} CustomTooltip={CustomTooltip}
              monthlyExpense={monthlyExpense} setTransactionToDelete={setTransactionToDelete}
              handleEditClick={handleEditClick} handleToggleSettled={handleToggleSettled}
              revealedId={revealedId} handleReveal={handleReveal} statsView={statsView}
              setStatsView={setStatsView} isCurrentMonth={isCurrentMonth}
              handlePrevMonth={handlePrevMonth} handleNextMonth={handleNextMonth}
              hourlyData={hourlyData} chartData={chartData} monthlyChartData={monthlyChartData}
              categoryChartData={categoryChartData} VariableRadiusSector={VariableRadiusSector} renderInsideLabels={renderInsideLabels}
            />
          )}
          {activeTab === 'history' && (
            <HistoryScreen
              theme={theme} transactions={transactions} filteredTransactions={filteredTransactions}
              selectedMonth={selectedMonth} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
              isCurrentMonth={isCurrentMonth} filterClassification={filterClassification}
              setFilterClassification={setFilterClassification} filterCategory={filterCategory}
              setFilterCategory={setFilterCategory} sortBy={sortBy} setSortBy={setSortBy}
              sortOrder={sortOrder} setSortOrder={setSortOrder} searchQuery={searchQuery}
              setSearchQuery={setSearchQuery} filteredMonthlyIncome={filteredMonthlyIncome}
              filteredMonthlyExpense={filteredMonthlyExpense} revealedId={revealedId}
              handleReveal={handleReveal} setTransactionToDelete={setTransactionToDelete}
              handleEditClick={handleEditClick} handleToggleSettled={handleToggleSettled}
              formatCurrency={formatCurrency} isAiAnalyzing={isAiAnalyzing}
              analyzeBusinessWithAI={analyzeBusinessWithAI} handleExportCSV={handleExportCSV}
              handleExportExcel={handleExportExcel} handleUpload={handleUpload}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen
              user={user} theme={theme} toggleTheme={toggleTheme}
              syncStatus={syncStatus} syncPendingCount={syncPendingCount}
              onFlushQueue={() => user && flushQueue(user.uid)}
              selectedAvatar={selectedAvatar} isAvatarPickerOpen={isAvatarPickerOpen}
              setIsAvatarPickerOpen={setIsAvatarPickerOpen} isSavingAvatar={isSavingAvatar}
              isUploadingPhoto={isUploadingPhoto} handleSelectAvatar={handleSelectAvatar}
              handlePhotoUpload={handlePhotoUpload} avatarFileInputRef={avatarFileInputRef}
              isEditingName={isEditingName} setIsEditingName={setIsEditingName}
              tempName={tempName} setTempName={setTempName} isSavingName={isSavingName}
              handleSaveName={handleSaveName} onOpenAiSettings={() => { setTempApiKey(geminiApiKey); setIsAiSettingsModalOpen(true); }}
              onRemoveDuplicates={handleRemoveDuplicates} onClearCurrentMonth={handleClearCurrentMonth}
              onLogout={logout} onLoginClick={() => { setIsAuthModalOpen(true); setAuthError(null); }}
            />
          )}
        </main>
      </div>

      {/* FAB */}
      <AnimatePresence>
        {isAddMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsAddMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90]"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-[104px] right-5 flex flex-col items-end gap-3 z-[100]">
        <AnimatePresence>
          {isAddMenuOpen && (
            <div className="flex flex-col items-end gap-3 mb-1">
              {[
                { icon: <Mic size={20} className="text-[#CFFF0F]" />, label: 'Suara', onClick: () => { setIsAddMenuOpen(false); handleVoiceInput(); } },
                { icon: <Camera size={20} className="text-[#00F5FF]" />, label: 'Scan', onClick: () => { setIsScannerOpen(true); setIsAddMenuOpen(false); } },
                { icon: <Plus size={22} strokeWidth={3} className="text-[#CFFF0F]" />, label: 'Manual', onClick: () => { setNewTime(format(new Date(), 'HH:mm')); setIsModalOpen(true); setIsAddMenuOpen(false); } },
              ].map((item) => (
                <motion.button key={item.label} initial={{ opacity: 0, y: 16, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                  onClick={item.onClick}
                  className="flex items-center gap-3 bg-[#0D0F12] border border-white/10 text-white pl-4 pr-3 h-11 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-xs font-bold text-gray-300">{item.label}</span>
                  {item.icon}
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className={cn('w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer', isAddMenuOpen ? 'bg-gray-800 text-white rotate-45 border border-white/5' : 'bg-[#CFFF0F] text-black shadow-lg shadow-[#CFFF0F]/15')}
        >
          <Plus size={30} strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-[#0D0F12]/90 backdrop-blur-md border-t border-gray-100 dark:border-[#22272F]/80 px-2 py-3 flex justify-around items-center z-50 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {NAV_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex flex-col items-center gap-1 p-1.5 transition-all flex-1 cursor-pointer', activeTab === tab.id ? 'text-gray-950 dark:text-[#CFFF0F]' : 'text-gray-400 dark:text-gray-500')}
          >
            <div className={cn('px-5 py-2 rounded-2xl transition-all', activeTab === tab.id ? 'bg-[#CFFF0F]/20 dark:bg-[#CFFF0F]/10' : 'hover:bg-gray-50 dark:hover:bg-[#14181E]')}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest font-display">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScan={handleScanReceipt} isScanning={isScanning} />}
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
          categoriesByType={CATEGORIES_BY_TYPE} isListening={isListening} onVoiceInput={handleVoiceInput}
        />
      )}

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

      {/* AI Settings modal */}
      <AnimatePresence>
        {isAiSettingsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAiSettingsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-white dark:bg-[#13161A] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-[#22272F]">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3"><Bot size={18} className="text-emerald-500" /><h2 className="font-bold text-gray-800 dark:text-white">Pengaturan AI</h2></div>
                <button onClick={() => setIsAiSettingsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#22272F] flex items-center justify-center text-gray-400"><X size={14} /></button>
              </div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gemini API Key</label>
              <input type="text" value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} placeholder="Masukkan API Key Gemini" className="w-full bg-gray-50 dark:bg-[#0D0F12] border border-gray-200 dark:border-[#22272F] rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-emerald-500 font-mono" />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setIsAiSettingsModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 dark:bg-[#22272F] text-gray-600 dark:text-gray-300">Batal</button>
                <button onClick={() => { setGeminiApiKey(tempApiKey.trim()); setIsAiSettingsModalOpen(false); }} className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-500 text-white">Simpan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import status */}
      {importStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#13161A] w-full max-w-sm rounded-[32px] p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', importStatus.type === 'success' ? 'bg-emerald-100 text-emerald-600' : importStatus.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600')}>
                {importStatus.type === 'success' ? <Check size={28} /> : importStatus.type === 'error' ? <AlertCircle size={28} /> : <Loader2 size={28} />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{importStatus.message}</p>
            </div>
            <div className="flex flex-col gap-2">
              {importStatus.type === 'confirm' && <button onClick={() => { importStatus.onConfirm?.(); setImportStatus(null); }} className="w-full py-3.5 bg-[#CFFF0F] text-black font-bold rounded-2xl">Lanjutkan</button>}
              <button onClick={() => setImportStatus(null)} className={cn('w-full py-3.5 font-bold rounded-2xl', importStatus.type === 'confirm' ? 'bg-gray-100 dark:bg-[#22272F] text-gray-600 dark:text-gray-300' : 'bg-[#CFFF0F] text-black')}>
                {importStatus.type === 'confirm' ? 'Batal' : 'Tutup'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#13161A] w-full max-w-sm rounded-[32px] p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><AlertCircle size={28} /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Hapus Transaksi?</h3>
                <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteTransaction} disabled={isDeleting} className="w-full py-3.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 disabled:opacity-50">
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button onClick={() => setTransactionToDelete(null)} className="w-full py-3.5 bg-gray-100 dark:bg-[#22272F] text-gray-600 dark:text-gray-300 font-bold rounded-2xl">Batal</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Analysis modal */}
      <AnimatePresence>
        {isAiAnalysisModalOpen && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 bg-gray-50 dark:bg-[#08090B] z-[150] flex flex-col">
            <header className="p-6 bg-white dark:bg-[#0D0F12] border-b border-gray-100 dark:border-[#22272F] flex justify-between items-center">
              <div className="flex items-center gap-3"><Sparkles size={20} className="text-[#CFFF0F]" /><h2 className="text-lg font-bold text-gray-800 dark:text-white">Analisis AI Bisnis</h2></div>
              <button onClick={() => setIsAiAnalysisModalOpen(false)} className="p-2 bg-gray-100 dark:bg-[#14181E] rounded-full"><X size={18} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white dark:bg-[#13161A] p-6 rounded-3xl border border-gray-100 dark:border-[#22272F]">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{aiAnalysisResult}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debt modal */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 bg-gray-50 dark:bg-[#08090B] z-[150] flex flex-col">
            <header className="p-6 bg-white dark:bg-[#0D0F12] border-b border-gray-100 dark:border-[#22272F] flex justify-between items-center">
              <div className="flex items-center gap-3"><CreditCard size={20} className="text-orange-500" /><h2 className="text-lg font-bold text-gray-800 dark:text-white">Hutang & Piutang</h2></div>
              <button onClick={() => setIsDebtModalOpen(false)} className="p-2 bg-gray-100 dark:bg-[#14181E] rounded-full"><X size={18} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-3xl border border-orange-100 dark:border-orange-950/40">
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Pinjam</p>
                  <p className="text-xl font-black text-orange-700 dark:text-orange-400">{formatCurrency(debtStats.borrow)}</p>
                </div>
                <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-3xl border border-sky-100 dark:border-sky-950/40">
                  <p className="text-[10px] font-bold text-sky-600 uppercase mb-1">Pinjamkan</p>
                  <p className="text-xl font-black text-sky-700 dark:text-sky-400">{formatCurrency(debtStats.lend)}</p>
                </div>
              </div>
              <div className="space-y-3">
                {transactions.filter((t) => t.type === 'debt').map((t) => (
                  <TransactionItem key={t.id} transaction={t} onDelete={() => setTransactionToDelete(t)} onEdit={() => handleEditClick(t)} onToggleSettled={() => handleToggleSettled(t)} formatCurrency={formatCurrency} isRevealed={revealedId === t.id} onReveal={(r) => handleReveal(t.id, r)} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
