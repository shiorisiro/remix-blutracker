import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  History, 
  Search,
  ChevronRight,
  TrendingUp,
  CreditCard,
  X,
  Camera,
  RotateCcw,
  Check,
  Loader2,
  ScanLine,
  Trash2,
  AlertCircle,
  Edit2,
  Utensils,
  ShoppingBag,
  Fuel,
  Wrench,
  Play,
  LayoutGrid,
  Download,
  Upload,
  Sparkles,
  Bot,
  Sun,
  Moon,
  Mail,
  Lock,
  User as UserIcon,
  Smile,
  Star,
  Heart,
  Coffee,
  Rocket,
  Flame,
  TrendingDown,
  Cloud,
  CloudRain,
  CloudSun,
  CloudFog,
  CloudLightning,
  CloudSnow,
  MapPin
} from 'lucide-react';
import { format, parseISO, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  Line,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  Sector,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

// Placeholder avatar set (Google-account-picker style). Each option is just an
// icon + background color for now. When custom PNG avatars are ready, swap this
// array's `icon`/`bg` for an `imageUrl` per entry - the picker UI and the
// persistence logic (selectedAvatar / handleSelectAvatar) don't need to change.
const AVATAR_OPTIONS = [
  { id: 'avatar-1', icon: Smile },
  { id: 'avatar-2', icon: Star },
  { id: 'avatar-3', icon: Heart },
  { id: 'avatar-4', icon: Coffee },
  { id: 'avatar-5', icon: Rocket },
  { id: 'avatar-6', icon: Flame },
] as const;
const DEFAULT_AVATAR_ID = AVATAR_OPTIONS[0].id;



import { StatusBar, Style } from '@capacitor/status-bar';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Status Bar handling
  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        // Disable overlay to prevent webview from "penetrating" the status bar
        await StatusBar.setOverlaysWebView({ overlay: false });

        if (theme === 'dark') {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#08090B' });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#F8FAFC' });
        }
      } catch (e) {
        console.log('Status bar not available');
      }
    };
    updateStatusBar();
  }, [theme]);

  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const isDev = window.location.hostname.includes('localhost') || 
                    window.location.hostname.includes('.run.app') || 
                    window.location.hostname.includes('ais-') || 
                    window.location.hostname.includes('web-');
      if (isDev) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          for (let reg of regs) {
            reg.unregister();
          }
        });
      } else {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
          }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
        });
      }
    }
  }, []);

  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
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
    } finally {
      setIsSavingName(false);
    }
  };

  // Profile avatar (placeholder icon set for now - see AVATAR_OPTIONS above).
  // Persisted via the same updateUserProfile()/photoURL field already used for
  // real photo URLs, so swapping in real images later needs no new storage.
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR_ID);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  useEffect(() => {
    if (user?.photoURL && AVATAR_OPTIONS.some(a => a.id === user.photoURL)) {
      setSelectedAvatar(user.photoURL);
    } else if (!user) {
      setSelectedAvatar(DEFAULT_AVATAR_ID);
    }
  }, [user?.photoURL, user]);

  // Weather widget (Dashboard) - functional first pass, styling to be revisited later.
  // Uses the browser's own Geolocation API + Open-Meteo (free, no API key required).
  const [weatherStatus, setWeatherStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading');
  const [weatherData, setWeatherData] = useState<{ temp: number; code: number } | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setWeatherStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
          );
          if (!res.ok) throw new Error('Weather fetch failed');
          const data = await res.json();
          setWeatherData({
            temp: Math.round(data?.current?.temperature_2m),
            code: data?.current?.weather_code,
          });
          setWeatherStatus('success');
        } catch (e) {
          console.error('Gagal mengambil data cuaca:', e);
          setWeatherStatus('error');
        }
      },
      () => setWeatherStatus('denied'),
      { timeout: 10000 }
    );
  }, []);

  // WMO weather codes -> simple icon + label (https://open-meteo.com/en/docs)
  const getWeatherInfo = (code: number | undefined) => {
    if (code === 0) return { icon: Sun, label: 'Cerah' };
    if (code !== undefined && [1, 2, 3].includes(code)) return { icon: CloudSun, label: 'Cerah Berawan' };
    if (code !== undefined && [45, 48].includes(code)) return { icon: CloudFog, label: 'Berkabut' };
    if (code !== undefined && [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: CloudRain, label: 'Hujan' };
    if (code !== undefined && [71, 73, 75, 77, 85, 86].includes(code)) return { icon: CloudSnow, label: 'Salju' };
    if (code !== undefined && [95, 96, 99].includes(code)) return { icon: CloudLightning, label: 'Badai Petir' };
    return { icon: Cloud, label: 'Berawan' };
  };

  const handleSelectAvatar = async (avatarId: string) => {
    if (avatarId === selectedAvatar || isSavingAvatar) return;
    const previousAvatar = selectedAvatar;
    setSelectedAvatar(avatarId);
    try {
      setIsSavingAvatar(true);
      await updateUserProfile({ photoURL: avatarId });
    } catch (e) {
      console.error('Gagal menyimpan avatar:', e);
      setSelectedAvatar(previousAvatar);
      alert('Gagal menyimpan avatar. Coba lagi.');
    } finally {
      setIsSavingAvatar(false);
    }
  };
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('blutracker_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const hasVisited = localStorage.getItem('blutracker_visited');
    if (!hasVisited) {
      localStorage.setItem('blutracker_visited', 'true');
      return INITIAL_TRANSACTIONS;
    }
    return [];
  });

  useEffect(() => {
    if (authReady && !user) {
      localStorage.setItem('blutracker_transactions', JSON.stringify(transactions));
    }
  }, [transactions, user, authReady]);

  useEffect(() => {
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (currentUser) {
        // Sync local transactions to Supabase
        const localSaved = localStorage.getItem('blutracker_transactions');
        if (localSaved) {
          try {
            const localTransactions = JSON.parse(localSaved);
            // Import to Supabase
            localTransactions.forEach(async (t: Transaction) => {
              await db.addTransaction(currentUser.uid, t);
            });
            localStorage.removeItem('blutracker_transactions');
          } catch (e) {
            console.error('Sync error:', e);
          }
        }
      } else {
        // Load from localStorage when logged out
        const saved = localStorage.getItem('blutracker_transactions');
        if (saved) {
          try {
            setTransactions(JSON.parse(saved));
          } catch (e) {
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Initial load
    db.getTransactions(user.uid).then(setTransactions);

    // Realtime subscription
    const unsubscribe = db.subscribeToTransactions(user.uid, (newTransactions) => {
      setTransactions(newTransactions);
    });

    return unsubscribe;
  }, [user]);



  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (e: any) {
      console.log("Login gagal:", e);
      setAuthError(`Gagal login dengan Google: ${e.message || 'Silakan coba lagi.'}`);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setTransactions([]);
    } catch (e) {
      console.log(e);
    }
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'register') {
        if (!authEmail.trim() || !authPassword.trim() || !authDisplayName.trim()) {
          throw new Error("Mohon isi semua data registrasi.");
        }
        if (authPassword.trim().length < 6) {
          throw new Error("Kata sandi minimal 6 karakter.");
        }
        await signUpWithEmail(authEmail.trim(), authPassword.trim(), authDisplayName.trim());
      } else {
        if (!authEmail.trim() || !authPassword.trim()) {
          throw new Error("Mohon isi email dan kata sandi.");
        }
        await signInWithEmail(authEmail.trim(), authPassword.trim());
      }

      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthDisplayName('');
    } catch (err: any) {
      console.log(err);
      let errMsg = err.message || '';
      if (errMsg.includes('already registered') || errMsg.includes('already in use')) {
        errMsg = "Email sudah digunakan oleh akun lain.";
      } else if (errMsg.includes('should be at least') || errMsg.includes('Password should be')) {
        errMsg = "Kata sandi terlalu lemah. Minimal 6 karakter.";
      } else if (errMsg.includes('invalid email') || errMsg.includes('Invalid email')) {
        errMsg = "Format email tidak valid.";
      } else if (errMsg.includes('Invalid login credentials') || errMsg.includes('invalid credentials')) {
        errMsg = "Email atau kata sandi salah. Silakan periksa kembali.";
      } else if (errMsg.includes('not confirmed') || errMsg.includes('belum dikonfirmasi')) {
        errMsg = "Email Anda belum dikonfirmasi. Silakan periksa kotak masuk email Anda.";
      }
      setAuthError(errMsg);
    } finally {
      setIsAuthLoading(false);
    }
  };


  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'history' | 'profile'>('home');
  const [activeHistoryTool, setActiveHistoryTool] = useState<'upload' | 'download' | 'none'>('none');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statsView, setStatsView] = useState<'weekly' | 'daily'>('weekly');
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string, type: 'success' | 'error' | 'confirm', onConfirm?: () => void } | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newCategory, setNewCategory] = useState('General');
  const [newClassification, setNewClassification] = useState<'personal' | 'business'>('personal');
  const [newDebtType, setNewDebtType] = useState<DebtType>('borrow');
  const [newIsSettled, setNewIsSettled] = useState(false);

  // Filter & Sort State
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterClassification, setFilterClassification] = useState<'all' | 'personal' | 'business'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Handle PWA Shortcuts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'scan') {
      setIsScannerOpen(true);
    } else if (action === 'add') {
      setNewTime(format(new Date(), 'HH:mm'));
      setIsModalOpen(true);
    }
    // Clean up URL without refreshing
    if (action) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const handlePrevMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
    setStatsView('weekly');
  };
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));
  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  // Local Keyword Rules for Instant Categorization
  const LOCAL_RULES: Record<string, { category: string, classification: 'personal' | 'business' }> = {
    'bensin': { category: 'Bensin', classification: 'personal' },
    'pertamax': { category: 'Bensin', classification: 'personal' },
    'pertalite': { category: 'Bensin', classification: 'personal' },
    'shell': { category: 'Bensin', classification: 'personal' },
    'bp': { category: 'Bensin', classification: 'personal' },
    'v-power': { category: 'Bensin', classification: 'personal' },
    'servis': { category: 'Perbaikan', classification: 'personal' },
    'oli': { category: 'Perbaikan', classification: 'personal' },
    'bengkel': { category: 'Perbaikan', classification: 'personal' },
    'perbaikan': { category: 'Perbaikan', classification: 'personal' },
    'ban': { category: 'Perbaikan', classification: 'personal' },
    'cuci': { category: 'Perbaikan', classification: 'personal' },
    'makan': { category: 'Food', classification: 'personal' },
    'nasi': { category: 'Food', classification: 'personal' },
    'bakso': { category: 'Food', classification: 'personal' },
    'soto': { category: 'Food', classification: 'personal' },
    'kopi': { category: 'Food', classification: 'personal' },
    'teabreak': { category: 'Food', classification: 'personal' },
    'esteh': { category: 'Food', classification: 'personal' },
    'gaji': { category: 'Salary', classification: 'personal' },
    'salary': { category: 'Salary', classification: 'personal' },
    'netflix': { category: 'Entertainment', classification: 'personal' },
    'spotify': { category: 'Entertainment', classification: 'personal' },
    'bioskop': { category: 'Entertainment', classification: 'personal' },
    'belanja': { category: 'Shopping', classification: 'personal' },
    'indomaret': { category: 'Shopping', classification: 'personal' },
    'alfamart': { category: 'Shopping', classification: 'personal' },
    'shopee': { category: 'Shopping', classification: 'personal' },
    'tokopedia': { category: 'Shopping', classification: 'personal' },
    'bonus': { category: 'Bonus', classification: 'business' },
    'project': { category: 'Bonus', classification: 'business' },
    'klien': { category: 'Bonus', classification: 'business' },
    'parkir': { category: 'Bensin', classification: 'personal' },
    'gojek': { category: 'General', classification: 'personal' },
    'grab': { category: 'General', classification: 'personal' },
  };

  // Reset revealedId when tab changes
  useEffect(() => {
    setRevealedId(null);
  }, [activeTab]);

  const handleReveal = useCallback((id: string, isRevealed: boolean) => {
    setRevealedId(isRevealed ? id : null);
  }, []);

  const CATEGORY_CONFIG: Record<string, { color: string, icon: any }> = {
    'Food': { color: '#FF6B6B', icon: Utensils },
    'Shopping': { color: '#4ECDC4', icon: ShoppingBag },
    'Bensin': { color: '#FFD93D', icon: Fuel },
    'Perbaikan': { color: '#A29BFE', icon: Wrench },
    'Entertainment': { color: '#6C5CE7', icon: Play },
    'General': { color: '#95afc0', icon: LayoutGrid },
  };

  const categoryPieData = useMemo(() => {
    const categories = ['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'];
    return categories.map(cat => {
      const amount = transactions
        .filter(t => t.type === 'expense' && t.category === cat && isSameMonth(parseISO(t.date), selectedMonth))
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: cat, value: amount };
    }).filter(item => item.value > 0);
  }, [transactions, selectedMonth]);

  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      if (t.type === 'debt') {
        if (t.isSettled) return acc; // Settled debts don't affect current balance in this simple model (assuming payment was a separate transaction or just cleared)
        // Actually, if I borrow and it's NOT settled, I have the cash.
        // If it IS settled, I paid it back, so the cash is gone.
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
    transactions
      .filter(t => t.type === 'income' && isSameMonth(parseISO(t.date), selectedMonth))
      .reduce((acc, t) => acc + t.amount, 0)
  , [transactions, selectedMonth]);

  const monthlyExpense = useMemo(() => 
    transactions
      .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), selectedMonth))
      .reduce((acc, t) => acc + t.amount, 0)
  , [transactions, selectedMonth]);

  const startBalance = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    return transactions
      .filter(t => parseISO(t.date) < start)
      .reduce((acc, t) => {
        if (t.type === 'income') return acc + t.amount;
        if (t.type === 'expense') return acc - t.amount;
        if (t.type === 'debt') {
          if (t.isSettled) return acc;
          return t.debtType === 'borrow' ? acc + t.amount : acc - t.amount;
        }
        return acc;
      }, 0);
  }, [transactions, selectedMonth]);

  const endBalance = useMemo(() => {
    return startBalance + transactions.filter(t => t.type === 'income' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((a,b) => a+b.amount, 0) - transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((a,b) => a+b.amount, 0) + transactions.filter(t => t.type === 'debt' && isSameMonth(parseISO(t.date), selectedMonth) && !t.isSettled).reduce((acc, t) => t.debtType === 'borrow' ? acc + t.amount : acc - t.amount, 0);
  }, [startBalance, transactions, selectedMonth]);

  const totalBalanceToDisplay = isCurrentMonth ? totalBalance : endBalance;

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return format(d, 'yyyy-MM-dd');
    });

    return last7Days.map(date => {
      const dayIncome = transactions
        .filter(t => t.type === 'income' && t.date === date)
        .reduce((acc, t) => acc + t.amount, 0);
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && t.date === date)
        .reduce((acc, t) => acc + t.amount, 0);
      
      return {
        name: format(parseISO(date), 'EEE'),
        income: dayIncome,
        expense: dayExpense,
      };
    });
  }, [transactions]);

  // Weekly trend widgets (Dashboard): this 7-day window vs the 7 days before it.
  // Income: going up = good (green). Expense: going up = "boros" = bad (red).
  const weeklyTrend = useMemo(() => {
    const currentStart = startOfDay(subDays(new Date(), 6));
    const currentEnd = endOfDay(new Date());
    const previousEnd = endOfDay(subDays(currentStart, 1));
    const previousStart = startOfDay(subDays(previousEnd, 6));

    const sumInRange = (type: 'income' | 'expense', start: Date, end: Date) =>
      transactions
        .filter(t => {
          if (t.type !== type) return false;
          const d = parseISO(t.date);
          return d >= start && d <= end;
        })
        .reduce((acc, t) => acc + t.amount, 0);

    // null = no baseline last week to compare against ("Baru")
    const pctChange = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr === 0 ? null : 100;
      return ((curr - prev) / prev) * 100;
    };

    const currentIncome = sumInRange('income', currentStart, currentEnd);
    const previousIncome = sumInRange('income', previousStart, previousEnd);
    const currentExpense = sumInRange('expense', currentStart, currentEnd);
    const previousExpense = sumInRange('expense', previousStart, previousEnd);

    return {
      income: {
        percent: pctChange(currentIncome, previousIncome),
        isGood: currentIncome >= previousIncome,
        sparkline: chartData.map(d => d.income),
      },
      expense: {
        percent: pctChange(currentExpense, previousExpense),
        isGood: currentExpense <= previousExpense,
        sparkline: chartData.map(d => d.expense),
      },
    };
  }, [transactions, chartData]);

  const monthlyChartData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = isCurrentMonth ? new Date() : endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });

    // Calculate balance before this month started
    const balanceBeforeMonth = transactions
      .filter(t => new Date(t.date) < start)
      .reduce((acc, t) => {
        if (t.type === 'income') return acc + t.amount;
        if (t.type === 'expense') return acc - t.amount;
        if (t.type === 'debt' && !t.isSettled) {
          return t.debtType === 'borrow' ? acc + t.amount : acc - t.amount;
        }
        return acc;
      }, 0);

    let runningBalance = balanceBeforeMonth;

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayIncome = transactions
        .filter(t => t.type === 'income' && t.date === dateStr)
        .reduce((acc, t) => acc + t.amount, 0);
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((acc, t) => acc + t.amount, 0);
      const dayDebtNet = transactions
        .filter(t => t.type === 'debt' && !t.isSettled && t.date === dateStr)
        .reduce((acc, t) => t.debtType === 'borrow' ? acc + t.amount : acc - t.amount, 0);
      
      runningBalance += (dayIncome - dayExpense + dayDebtNet);
      
      return {
        name: format(day, 'd'),
        balance: runningBalance,
        income: dayIncome,
        expense: dayExpense,
      };
    });
  }, [transactions]);

  const categoryChartData = useMemo(() => {
    if (!selectedCategory) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return format(d, 'yyyy-MM-dd');
    });

    return last7Days.map(date => {
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && t.category === selectedCategory && t.date === date)
        .reduce((acc, t) => acc + t.amount, 0);
      
      return {
        name: format(parseISO(date), 'EEE'),
        amount: dayExpense,
      };
    });
  }, [transactions, selectedCategory]);

  const hourlyData = useMemo(() => {
    // Generate 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    return hours.map(hour => {
      const hourInt = parseInt(hour.split(':')[0]);
      const amount = transactions
        .filter(t => {
          if (t.type !== 'expense' || !t.time || t.date !== today) return false;
          if (selectedCategory && t.category !== selectedCategory) return false;
          const tHour = parseInt(t.time.split(':')[0]);
          return tHour === hourInt;
        })
        .reduce((acc, t) => acc + t.amount, 0);
      
      return {
        name: hour,
        amount,
      };
    });
  }, [transactions, selectedCategory]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveDuplicates = async () => {
    if (!user) return;
    if (!window.confirm("Hapus data duplikat?")) return;

    try {
      const seen = new Set();
      const duplicates = transactions.filter(t => {
        const key = `${t.title}-${t.amount}-${t.date}-${t.time}-${t.type}-${t.category}`;
        if (seen.has(key)) return true;
        seen.add(key);
        return false;
      });

      if (duplicates.length === 0) {
        alert("Tidak ada data duplikat.");
        return;
      }

      const ids = duplicates.map(t => t.id);
      await db.deleteTransactions(user.uid, ids);

      alert(`Berhasil menghapus ${duplicates.length} transaksi duplikat.`);
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus data duplikat.");
    }
  };

  const handleClearCurrentMonth = async () => {
    const monthTx = transactions.filter(t => isSameMonth(parseISO(t.date), selectedMonth));
    if (monthTx.length === 0) {
      alert("Tidak ada transaksi di bulan ini.");
      return;
    }
    if (!window.confirm("Hapus semua transaksi bulan ini?")) return;

    try {
      if (user) {
        if (user) {
  const ids = monthTx.map(tx => tx.id);
  await db.deleteTransactions(user.uid, ids); // Sekali query!
}
        alert("Berhasil menghapus semua transaksi bulan ini.");
      } else {
        const remaining = transactions.filter(t => !isSameMonth(parseISO(t.date), selectedMonth));
        setTransactions(remaining);
        localStorage.setItem('blutracker_transactions', JSON.stringify(remaining));
        alert("Berhasil menghapus transaksi bulan ini (lokal).");
      }
    } catch (e: any) {
      console.log(e);
      alert("Gagal menghapus data: " + e.message);
    }
  };

  const handleExportCSV = () => {
    const mappedTransactions = transactions.map(t => ({
      'Tanggal': t.date,
      'Waktu': t.time,
      'Judul Transaksi': t.title,
      'Jumlah': t.amount,
      'Tipe': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori': t.category,
      'Klasifikasi': t.classification === 'business' ? 'Bisnis' : 'Pribadi'
    }));
    
    const csv = Papa.unparse(mappedTransactions);
    // Add BOM for Excel UTF-8 support
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat_transaksi_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const mappedTransactions = transactions.map(t => ({
      'Tanggal': t.date,
      'Waktu': t.time,
      'Judul Transaksi': t.title,
      'Jumlah': t.amount,
      'Tipe': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori': t.category,
      'Klasifikasi': t.classification === 'business' ? 'Bisnis' : 'Pribadi'
    }));

    const worksheet = XLSX.utils.json_to_sheet(mappedTransactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat_transaksi_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowedTypes.includes(file.type)) {
      setImportStatus({ message: 'Invalid file type. Only CSV and Excel files are allowed.', type: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImportStatus({ message: 'File too large. Maximum size is 5MB.', type: 'error' });
      return;
    }

    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let importedData: any[] = [];

        if (isExcel) {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          importedData = XLSX.utils.sheet_to_json(worksheet);
        } else {
          // Assume CSV
          const content = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
          const parsed = Papa.parse(content, { 
            header: true, 
            skipEmptyLines: true,
            transformHeader: (h) => h.trim()
          });
          importedData = parsed.data;
        }
        
        if (!Array.isArray(importedData) || importedData.length === 0) {
          setImportStatus({ message: 'File kosong atau tidak valid.', type: 'error' });
          return;
        }

        const validTransactions: Transaction[] = [];
        const errors: string[] = [];

        importedData.forEach((t: any, index) => {
          const findValue = (keys: string[]) => {
            const entry = Object.entries(t).find(([key]) => {
              const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              return keys.some(k => {
                const normalizedK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                return normalizedKey === normalizedK;
              });
            });
            return entry ? entry[1] : undefined;
          };

          const title = String(findValue(['judul', 'judultransaksi', 'title', 'name', 'nama', 'description', 'deskripsi', 'label', 'keterangan']) || 'Tanpa Judul');
          
          const rawAmount = findValue(['amount', 'nominal', 'value', 'nilai', 'harga', 'jumlah', 'total']);
          let amount = 0;
          if (typeof rawAmount === 'number') {
            amount = rawAmount;
          } else if (rawAmount !== undefined && rawAmount !== null) {
            let str = String(rawAmount).trim().replace(/[^\d.,-]/g, '');
            const lastDot = str.lastIndexOf('.');
            const lastComma = str.lastIndexOf(',');
            if (lastDot > lastComma) {
              str = str.replace(/,/g, '');
            } else if (lastComma > lastDot) {
              str = str.replace(/\./g, '').replace(/,/g, '.');
            } else if (lastDot !== -1) {
              const parts = str.split('.');
              if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
                str = str.replace(/\./g, '');
              }
            } else if (lastComma !== -1) {
              const parts = str.split(',');
              if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
                str = str.replace(/,/g, '');
              } else {
                str = str.replace(/,/g, '.');
              }
            }
            const parsed = parseFloat(str);
            amount = isNaN(parsed) ? 0 : parsed;
          }
          
          let type = String(findValue(['type', 'tipe', 'kind', 'status', 'kategori_transaksi']) || 'expense').toLowerCase();
          const isIncome = type.includes('in') || type.includes('masuk') || type.includes('pemasukan');
          const finalType: 'income' | 'expense' = isIncome ? 'income' : 'expense';

          const category = String(findValue(['category', 'kategori', 'group', 'kelompok']) || 'General');
          const date = String(findValue(['date', 'tanggal', 'timestamp']) || format(new Date(), 'yyyy-MM-dd'));
          const time = String(findValue(['time', 'jam', 'waktu', 'waktu_transaksi']) || (String(date).includes('T') ? format(new Date(String(date)), 'HH:mm') : '00:00'));
          const classificationRaw = String(findValue(['classification', 'klasifikasi', 'type_pribadi', 'bisnis_pribadi']) || 'personal').toLowerCase();
          const classification: 'personal' | 'business' = (classificationRaw.includes('business') || classificationRaw.includes('bisnis')) ? 'business' : 'personal';

          if (!isNaN(amount) && amount > 0) {
            validTransactions.push({
              id: String(findValue(['id', 'uuid', 'key']) || crypto.randomUUID()),
              title,
              amount,
              type: finalType,
              category,
              date: String(date).includes('T') ? String(date).split('T')[0] : String(date),
              time: String(time).includes(':') ? String(time) : '00:00',
              classification
            });
          } else {
            errors.push(`Baris ${index + 1}`);
          }
        });

        if (validTransactions.length > 0) {
          const performImport = async () => {
            if (!user) {
                setTransactions(prev => {
                    const prevFiltered = prev.filter(p => !validTransactions.some(v => v.id === p.id));
                    return [...validTransactions, ...prevFiltered];
                });
                setRevealedId(null);
                setImportStatus({ message: `Berhasil mengimpor ${validTransactions.length} transaksi di penyimpanan lokal (tidak tersinkronisasi, silakan login).`, type: 'success' });
                return;
            }
            
            try {
                for (const t of validTransactions) {
                  await db.addTransaction(user.uid, t as any);
                }
                setRevealedId(null);
                setImportStatus({ message: `Berhasil mengimpor ${validTransactions.length} transaksi ke akun Anda secara real-time.`, type: 'success' });
            } catch (error: any) {
                const errorDetail = error?.message || String(error);
                setImportStatus({ message: `Gagal mengimpor data ke Cloud: ${errorDetail}`, type: 'error' });
            }
          };

          if (errors.length > 0) {
            setImportStatus({ 
              message: `Ditemukan ${validTransactions.length} transaksi valid dan ${errors.length} data tidak valid. Impor data yang valid saja?`, 
              type: 'confirm',
              onConfirm: performImport
            });
          } else {
            performImport();
          }
        } else {
          setImportStatus({ message: 'Tidak ada data transaksi yang valid ditemukan dalam file ini.', type: 'error' });
        }
      } catch (err) {
        setImportStatus({ message: 'Gagal membaca file. Pastikan formatnya benar.', type: 'error' });
      }
      if (event.target) event.target.value = '';
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Month filter for history
    if (activeTab === 'history') {
      result = result.filter(t => isSameMonth(parseISO(t.date), selectedMonth));
    }

    // Tab filter
    if (activeTab === 'history') {
      result = result.filter(t => t.type !== 'debt');
    }

    // Search filter
    if (searchQuery) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'All') {
      result = result.filter(t => t.category === filterCategory);
    }

    // Classification filter
    if (filterClassification !== 'all') {
      result = result.filter(t => t.classification === filterClassification);
    }

    // Sorting
    // Sorting
result.sort((a, b) => {
  let comparison = 0;
  if (sortBy === 'date') {
    // Bandingkan date dulu
    const dateA = a.date || '';
    const dateB = b.date || '';
    comparison = dateA.localeCompare(dateB);
    // Kalau tanggal sama, bandingkan time (HH:mm)
    if (comparison === 0) {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      comparison = timeA.localeCompare(timeB);
    }
  } else if (sortBy === 'amount') {
    comparison = a.amount - b.amount;
  } else if (sortBy === 'category') {
    comparison = a.category.localeCompare(b.category);
  }
  return sortOrder === 'asc' ? comparison : -comparison;
});
    return result;
  }, [transactions, searchQuery, filterCategory, filterClassification, sortBy, sortOrder, activeTab, selectedMonth]);

  const filteredMonthlyIncome = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === 'income' && isSameMonth(parseISO(t.date), selectedMonth))
      .reduce((acc, t) => acc + t.amount, 0)
  , [filteredTransactions, selectedMonth]);

  const filteredMonthlyExpense = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), selectedMonth))
      .reduce((acc, t) => acc + t.amount, 0)
  , [filteredTransactions, selectedMonth]);

  const analyzeBusinessWithAI = async () => {
    const isGitHubPages = window.location.hostname.includes('github.io');
  if (isGitHubPages) {
    setAiError('Fitur AI belum tersedia di GitHub Pages.');
    return;
  }

    setIsAiLoading(true)
    const businessTransactions = filteredTransactions.filter(
      t => t.classification === 'business' && isSameMonth(parseISO(t.date), selectedMonth)
    );
    if (businessTransactions.length === 0) {
      alert("Tidak ada transaksi bisnis untuk bulan ini.");
      return;
    }

    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);

    try {
      const prompt = `Saya memiliki data transaksi bisnis berikut untuk bulan ${format(selectedMonth, 'MMMM yyyy', {locale: id})}:
${businessTransactions.map(t => `- ${t.date} ${t.time}: ${t.title} (${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}) - ${formatCurrency(t.amount)}`).join('\n')}

Tolong berikan analisis singkat dan saran yang membangun untuk bisnis saya. Fokus pada kesehatan arus kas, kategori pengeluaran terbesar, dan tren pendapatan. Berikan dalam format yang mudah dibaca dengan emoji.`;

      let token = '';
      if (user && isSupabaseConfigured) {
        try {
          token = await auth.getIdToken();
        } catch (e) {
          console.error('Auth error:', e);
        }
      }

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ contents: prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghubungi AI");

      setAiAnalysisResult(data.text);
      setIsAiAnalysisModalOpen(true);
    } catch (error: any) {
      console.error(error);
      if (error?.message?.toLowerCase().includes('api key')) {
         setAiAnalysisResult("Fitur AI: Harap pastikan Anda telah memasukkan API Key Gemini yang valid di menu pengaturan.");
         setIsAiAnalysisModalOpen(true);
      } else {
         setAiAnalysisResult("Maaf, terjadi kesalahan saat menganalisis data.");
         setIsAiAnalysisModalOpen(true);
      }
    } finally {
      setIsAiAnalyzing(false);
      setIsAiLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
          {payload.map((entry: any, index: number) => {
            const isIncome = entry.dataKey === 'income';
            const isExpense = entry.dataKey === 'expense' || entry.dataKey === 'amount';
            
            let Icon = Wallet;
            let color = entry.color || entry.fill || "#00AEEF";
            
            // Match app's icon logic
            if (isIncome) { Icon = ArrowDownLeft; }
            if (isExpense) { Icon = ArrowUpRight; }

            return (
              <div key={index} className="flex items-center gap-1">
                <Icon size={8} style={{ color }} />
                <span className="text-[8px] font-extrabold text-gray-700 leading-none">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
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
      // Local mode
      const savedTx: Transaction = {
        ...txData,
        id: editingTransaction ? editingTransaction.id : crypto.randomUUID(),
        ownerId: 'local',
      } as Transaction;

      if (editingTransaction) {
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? savedTx : t));
      } else {
        setTransactions(prev => [...prev, savedTx]);
      }

      // Save to localStorage
      localStorage.setItem('blutracker_transactions', JSON.stringify(
        editingTransaction 
          ? transactions.map(t => t.id === editingTransaction.id ? savedTx : t)
          : [...transactions, savedTx]
      ));
    } else {
      // Supabase mode
      try {
        if (editingTransaction) {
          await db.updateTransaction(user.uid, editingTransaction.id, txData);
        } else {
          await db.addTransaction(user.uid, txData as any);
        }
      } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Gagal menyimpan transaksi. Silakan coba lagi.');
      }
    }

    // Reset form
    setNewTitle('');
    setNewAmount('');
    setNewDate('');
    setNewTime('');
    setEditingTransaction(null);
    setIsModalOpen(false);
    setNewType('expense');
    setNewCategory('General');
    setNewClassification('personal');
    setNewDebtType('borrow');
    setNewIsSettled(false);
  };

  const handleToggleSettled = async (t: Transaction) => {
    const newStatus = !t.isSettled;

    if (!user) {
      setTransactions(prev => prev.map(item => item.id === t.id ? { ...item, isSettled: newStatus } : item));
      localStorage.setItem('blutracker_transactions', JSON.stringify(
        transactions.map(item => item.id === t.id ? { ...item, isSettled: newStatus } : item)
      ));
      setRevealedId(null);
      return;
    }

    try {
      await db.updateTransaction(user.uid, t.id, { isSettled: newStatus });
      setRevealedId(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setNewTitle(t.title);
    setNewAmount(formatInputNumber(t.amount.toString()));
    setNewType(t.type);
    setNewCategory(t.category);
    setNewDate(t.date);
    setNewTime(t.time || '');
    setNewClassification(t.classification);
    setNewDebtType(t.debtType || 'borrow');
    setNewIsSettled(t.isSettled || false);
    setIsModalOpen(true);
  };
  
const handleDeleteTransaction = async () => {
  if (!transactionToDelete || isDeleting) return;  // ← tambahkan || isDeleting

  // ... (local mode sama)

  setIsDeleting(true);  // ← TAMBAH INI
  try {
    await db.deleteTransaction(user.uid, transactionToDelete.id);
    setTransactionToDelete(null);
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    alert(error.message || 'Gagal menghapus transaksi.');
  } finally {
    setIsDeleting(false);  // ← TAMBAH INI
  }
};

  // AI Suggestion for Category & Classification
  useEffect(() => {
    if (!isModalOpen || isScanning || newTitle.length < 3) return;

    // Check Local Rules First (Instant)
    const lowerTitle = newTitle.toLowerCase();
    const matchedRule = Object.keys(LOCAL_RULES).find(key => lowerTitle.includes(key));
    
    if (matchedRule) {
      const rule = LOCAL_RULES[matchedRule];
      setNewCategory(rule.category);
      setNewClassification(rule.classification);
      return; // Skip AI if local rule matches
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const token = user?.getIdToken ? await user.getIdToken() : '';
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            model: "gemini-2.0-flash",
            contents: [
              {
                text: `Analyze: "${newTitle}". 
                Categories: Food, Salary, Entertainment, Shopping, Bensin, Perbaikan, Bonus, General.
                Classifications: personal, business.
                Return JSON: {category, classification}`,
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  category: { type: "STRING" },
                  classification: { type: "STRING", enum: ["personal", "business"] },
                },
                required: ["category", "classification"],
              },
            }
          })
        });
        
        if (!res.ok) return;
        const data = await res.json();
        const result = JSON.parse(data.text || '{}');
        if (result.category) setNewCategory(result.category);
        if (result.classification) setNewClassification(result.classification);
      } catch (error) {
        console.error("AI Suggestion Error:", error);
      } finally {
        setIsSuggesting(false);
      }
    }, 500); // Reduced debounce to 500ms

    return () => clearTimeout(timer);
  }, [newTitle, isModalOpen, isScanning]);

  const handleScanReceipt = async (base64Image: string) => {
    if (!base64Image) return;

  setIsScanning(true);
    try {                         // ← try untuk SEMUA
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const token = data.session?.access_token || '';

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
                body: JSON.stringify({
          model: "gemini-2.0-flash",
          contents: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
              },
            },
            {
              text: "Extract transaction details from this receipt. Return JSON with fields: title, amount (number), type (income or expense), category (Food, Salary, Entertainment, Shopping, Bensin, Perbaikan, Bonus, General), and classification (personal or business).",
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                amount: { type: "NUMBER" },
                type: { type: "STRING", enum: ["income", "expense"] },
                category: { type: "STRING" },
                classification: { type: "STRING", enum: ["personal", "business"] },
              },
              required: ["title", "amount", "type", "category", "classification"],
            },
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
    } catch (error: any) {      // ← catch untuk SEMUA
      console.error("Scanning failed:", error);
      if (error?.message?.toLowerCase().includes('api key')) {
         alert("Fitur AI: Harap pastikan Anda telah memasukkan API Key Gemini yang valid di menu pengaturan.");
      } else {
         alert("Gagal memindai struk. Pastikan struk terlihat jelas dan lurus.");
      }
    } finally {
      setIsScanning(false);
    }
  };
  
  const renderInsideLabels = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, value } = props;
    const RADIAN = Math.PI / 180;
    const maxVal = Math.max(...categoryPieData.map(d => d.value)) || 1;
    const extraRadius = (value / maxVal) * 50;
    
    // Calculate precise center radius for the variable radius slice
    const radius = innerRadius + (outerRadius + extraRadius - innerRadius) / 2;
    
    // Recharts midAngle is in degrees, 0 is 3 o'clock, clockwise
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
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const maxVal = Math.max(...categoryPieData.map(d => d.value)) || 1;
    const extraRadius = (payload.value / maxVal) * 50;
    
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + extraRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
        className="outline-none cursor-pointer hover:brightness-110 transition-all"
        style={{ outline: 'none' }}
      />
    );
  };

  if (!authReady) {
    return (
      <div className="min-h-[calc(100dvh-env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]
">
        <Loader2 className="animate-spin text-[#171717]" size={24} />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="max-w-md mx-auto bg-[#F8FAFC] dark:bg-[#08090B] text-gray-900 dark:text-white min-h-screen relative shadow-2xl overflow-hidden transition-colors duration-200 border-x border-gray-100 dark:border-[#14181E] flex flex-col">
      {/* Dynamic Top Bar Spacer */}
      <div
        className="h-[env(safe-area-inset-top)] sticky top-0 z-[110] border-b transition-colors duration-200"
        style={{
          backgroundColor: theme === 'dark' ? '#0D0F12' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#22272F' : '#F1F5F9'
        }}
      />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header - Only on Home */}
        {activeTab === 'home' && (
          <header className="bg-[#FFFFFF] dark:bg-[#0D0F12] p-6 rounded-b-[40px] shadow-sm border-b border-gray-100 dark:border-[#22272F] transition-colors duration-200">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 bg-gray-100 dark:bg-[#14181E] rounded-2xl flex items-center justify-center overflow-hidden shadow-sm relative border border-gray-200 dark:border-[#22272F]">
                <img
                  src="./logo.png"
                  alt="BluTracker"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col select-none">
                <p className="text-xs text-gray-400 font-medium tracking-wide">{getGreeting()},</p>
                {user ? (
                  isEditingName ? (
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
                          if (e.key === 'Enter') {
                            handleSaveName();
                          } else if (e.key === 'Escape') {
                            setIsEditingName(false);
                          }
                        }}
                      />
                      <button 
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-emerald-500 transition-colors cursor-pointer"
                        title="Simpan"
                      >
                        {isSavingName ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : (
                          <Check size={12} />
                        )}
                      </button>
                      <button 
                        onClick={() => setIsEditingName(false)}
                        disabled={isSavingName}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Batal"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        const defaultName = user.displayName || user.email?.split('@')[0] || '';
                        setTempName(defaultName);
                        setIsEditingName(true);
                      }}
                      className="group flex items-center gap-1 cursor-pointer hover:opacity-85 transition-all"
                    >
                      <span className="font-bold text-sm tracking-tight text-gray-950 dark:text-white max-w-[120px] truncate">
                        {user.displayName || user.email?.split('@')[0] || 'Pengguna'}
                      </span>
                      <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CFFF0F]" />
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => { setIsAuthModalOpen(true); setAuthError(null); }}
                    className="font-bold text-sm tracking-tight hover:opacity-80 transition-opacity text-left text-gray-950 dark:text-white cursor-pointer"
                  >
                    Klik untuk Login
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-1 justify-end">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="relative flex-1"
                  >
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Cari transaksi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-4 pr-10 py-1.5 bg-gray-50 dark:bg-[#14181E] rounded-xl text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#CFFF0F] transition-all text-sm"
                    />
                    <button 
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              {!isSearchOpen && (
                <div className="flex items-center gap-1">
                  <button 
  onClick={toggleTheme}
  className={cn(
    "relative w-[52px] h-[28px] rounded-full transition-all duration-300 cursor-pointer overflow-hidden flex items-center shadow-inner",
    theme === 'light'
      ? "bg-sky-200"
      : "bg-slate-950 border border-slate-800"
  )}
  title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
>
  {/* Background decorations */}
  <div className="absolute inset-0 pointer-events-none">
    {theme === 'light' ? (
      // Awan di kanan
      <div className="absolute right-2 top-[7px] w-4 h-2 bg-white/90 rounded-full">
        <div className="absolute -top-1 left-1 w-3 h-3 bg-white/90 rounded-full" />
      </div>
   ) : (
  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-[3px] items-center opacity-70">
    <span className="text-white text-[6px] leading-none">✦</span>
    <span className="text-yellow-100 text-[4px] leading-none">✦</span>
    <span className="text-white text-[5px] leading-none">✦</span>
  </div>
)}
  </div>

  {/* Sliding knob — pakai absolute + translate untuk presisi */}
  <motion.div
    animate={{ x: theme === 'light' ? 2 : 26 }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    className={cn(
      "absolute w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10",
      theme === 'light' ? "bg-amber-400" : "bg-slate-700"
    )}
  >
    <motion.div
      animate={{ rotate: theme === 'light' ? 0 : 360 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {theme === 'light'
        ? <Sun size={13} className="fill-white text-white" />
        : <Moon size={13} className="fill-yellow-200 text-yellow-200" />
      }
    </motion.div>
  </motion.div>
</button>
                  <button 
                    onClick={() => setIsDebtModalOpen(true)}
                    className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 rounded-xl transition-all flex items-center justify-center text-gray-700 dark:text-white cursor-pointer"
                    title="Hutang & Piutang"
                  >
                    <span className="filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_3px_10px_rgba(255,255,255,0.35)] transform hover:scale-110 active:scale-95 transition-all inline-block flex items-center justify-center">
                      <CreditCard size={18} />
                    </span>
                  </button>
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 rounded-xl transition-all flex items-center justify-center text-gray-700 dark:text-white cursor-pointer"
                  >
                    <span className="filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_3px_10px_rgba(255,255,255,0.35)] transform hover:scale-110 active:scale-95 transition-all inline-block flex items-center justify-center">
                      <Search size={18} />
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DinarsPay-styled interactive Balance Card */}
          <div className="bg-gray-950 text-white p-6 rounded-[32px] relative overflow-hidden mb-6 border border-white/5 shadow-xl shadow-black/35 select-none bg-gradient-to-br from-[#0D0F12] via-[#14181E] to-[#0D1014]">
            {/* Glowing background highlights */}
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

            {/* Micro grid inside card */}
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

          {/* Month Selector inside header container */}
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
              className={cn("p-1.5 rounded-lg transition-colors cursor-pointer select-none", isCurrentMonth ? "opacity-35 cursor-not-allowed text-gray-300 dark:text-gray-650" : "text-gray-500 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/40")}
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
          <div className="space-y-4">
            {/* Weekly Trend Widgets */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'income', title: 'Pemasukan', data: weeklyTrend.income, color: '#10b981', fillId: 'sparkIncome' },
                { key: 'expense', title: 'Pengeluaran', data: weeklyTrend.expense, color: '#ef4444', fillId: 'sparkExpense' },
              ] as const).map(({ key, title, data, color, fillId }) => {
                const isUp = data.percent !== null && data.percent >= 0;
                const TrendIcon = isUp ? TrendingUp : TrendingDown;
                const statusColor = data.percent === null
                  ? 'text-gray-400 dark:text-gray-500'
                  : data.isGood
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400';
                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">{title}</span>
                      <TrendIcon size={14} className={statusColor} />
                    </div>
                    <p className={cn("text-lg font-extrabold", statusColor)}>
                      {data.percent === null ? 'Baru' : `${data.percent >= 0 ? '+' : ''}${Math.round(data.percent)}%`}
                    </p>
                    <div className="h-10 -mx-1 mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.sparkline.map((v) => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${fillId})`} dot={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center">vs minggu lalu</p>
                  </div>
                );
              })}
            </div>

            {/* Weather Widget - functional first pass, visual polish later */}
            <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3 transition-colors duration-200">
              {weatherStatus === 'loading' && (
                <>
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400">Mengambil data cuaca...</span>
                </>
              )}
              {weatherStatus === 'denied' && (
                <>
                  <MapPin size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Izinkan akses lokasi untuk melihat cuaca</span>
                </>
              )}
              {weatherStatus === 'error' && (
                <>
                  <Cloud size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Cuaca tidak tersedia saat ini</span>
                </>
              )}
              {weatherStatus === 'success' && weatherData && (() => {
                const { icon: WeatherIcon, label } = getWeatherInfo(weatherData.code);
                return (
                  <>
                    <WeatherIcon size={24} className="text-amber-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{weatherData.temp}°C · {label}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* Weekly Chart - moved here from Dashboard */}
            <section className="bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F] transition-all">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">Statistik Mingguan</h3>
              </div>
              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} tabIndex={-1} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#22272F' : '#F1F5F9'} />
                   <XAxis 
                    dataKey="name" 
                    axisLine={{ stroke: theme === 'dark' ? '#374151' : '#E5E7EB', strokeWidth: 1 }}
                    tickLine={{ stroke: theme === 'dark' ? '#374151' : '#E5E7EB', strokeWidth: 1 }}
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} 
/> 
                    <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }}
                    tickFormatter={(value) => formatCurrency(value)}
/>
                    <Tooltip 
  cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
  contentStyle={{ 
    borderRadius: '16px', 
    border: '1px solid',
    borderColor: theme === 'dark' ? '#22272F' : '#E2E8F0',
    background: theme === 'dark' ? '#14181E' : '#FFFFFF',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
    color: theme === 'dark' ? '#FFFFFF' : '#000000',
    fontFamily: 'Outfit'
  }}
  formatter={(value: number, name: string) => {
    if (value === 0) return ['', '']; // Sembunyikan nilai 0
    return [formatCurrency(value), name === 'income' ? 'Pemasukan' : 'Pengeluaran'];
  }}
  labelFormatter={(label: string) => label}
/>

                    <Bar dataKey="income" fill={theme === 'dark' ? '#CFFF0F' : '#65A30D'} radius={[4, 4, 0, 0]} barSize={10} />
                    <Bar dataKey="expense" fill={theme === 'dark' ? '#FF5E5E' : '#DC2626'} radius={[4, 4, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Everything that used to live in the StatsDetailModal popup, now embedded directly in this tab */}
            <StatsDetailModal
              embedded
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              CATEGORY_CONFIG={CATEGORY_CONFIG}
              categoryPieData={categoryPieData}
              transactions={transactions}
              selectedMonth={selectedMonth}
              formatCurrency={formatCurrency}
              CustomTooltip={CustomTooltip}
              monthlyExpense={monthlyExpense}
              setTransactionToDelete={setTransactionToDelete}
              handleEditClick={handleEditClick}
              handleToggleSettled={handleToggleSettled}
              revealedId={revealedId}
              handleReveal={handleReveal}
              statsView={statsView}
              setStatsView={setStatsView}
              isCurrentMonth={isCurrentMonth}
              handlePrevMonth={handlePrevMonth}
              handleNextMonth={handleNextMonth}
              hourlyData={hourlyData}
              chartData={chartData}
              monthlyChartData={monthlyChartData}
              categoryChartData={categoryChartData}
              VariableRadiusSector={VariableRadiusSector}
              renderInsideLabels={renderInsideLabels}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-full px-4 py-2 border border-gray-100 dark:border-gray-800 shadow-sm">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-800 text-gray-500 hover:text-blu-primary rounded-full transition-colors">
                <ArrowDownLeft size={18} className="rotate-45" />
              </button>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-widest uppercase">
                {format(selectedMonth, 'MMMM yyyy', { locale: id })}
              </div>
              <button 
                onClick={handleNextMonth} 
                disabled={isCurrentMonth}
                className={cn("p-1 rounded-full transition-colors", isCurrentMonth ? "opacity-30 text-gray-400" : "hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-800 text-gray-500 hover:text-blu-primary")}
              >
                <ArrowUpRight size={18} className="rotate-45" />
              </button>
            </div>            {/* Action Group: Upload, Download, Delete Submenus */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm space-y-3 transition-colors duration-200">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveHistoryTool(activeHistoryTool === 'upload' ? 'none' : 'upload')}
                  className={cn(
                    "flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-xs font-semibold gap-1.5 transition-all select-none cursor-pointer",
                    activeHistoryTool === 'upload'
                      ? "bg-blu-primary/10 border-blu-primary/35 text-blu-primary dark:bg-purple-950/30 dark:border-purple-500/55 dark:text-purple-400 font-bold"
                      : "bg-gray-50 dark:bg-gray-950/50 hover:bg-gray-50 dark:bg-gray-800/40 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400"
                  )}
                >
                  <Upload size={18} />
                  <span>Unggah</span>
                </button>

                <button
                  onClick={() => setActiveHistoryTool(activeHistoryTool === 'download' ? 'none' : 'download')}
                  className={cn(
                    "flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-xs font-semibold gap-1.5 transition-all select-none cursor-pointer",
                    activeHistoryTool === 'download'
                      ? "bg-blu-primary/10 border-blu-primary/35 text-blu-primary dark:bg-purple-950/30 dark:border-purple-500/55 dark:text-purple-400 font-bold"
                      : "bg-gray-50 dark:bg-gray-950/50 hover:bg-gray-50 dark:bg-gray-800/40 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400"
                  )}
                >
                  <Download size={18} />
                  <span>Unduh</span>
                </button>
              </div>

              {/* Submenu panels loaded inside AnimatePresence for visual pop */}
              <AnimatePresence mode="wait">
                {activeHistoryTool === 'upload' && (
                  <motion.div
                    key="upload-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-gray-50 dark:bg-gray-950/70 dark:bg-gray-950/30 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 space-y-2"
                  >
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Unggah File Spreadsheet</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleUpload} 
                      accept=".csv,.xlsx,.xls" 
                      className="hidden" 
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-750 dark:text-gray-250 transition-colors cursor-pointer"
                    >
                      <Upload size={16} className="text-blu-primary" />
                      <span>Pilih File Excel / CSV (.csv, .xlsx)</span>
                    </button>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">Format file harus menyertakan kolom: Tanggal, Waktu, Judul Transaksi, Jumlah, Tipe, Kategori, Klasifikasi.</p>
                  </motion.div>
                )}

                {activeHistoryTool === 'download' && (
                  <motion.div
                    key="download-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-gray-50 dark:bg-gray-950/70 dark:bg-gray-950/30 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 space-y-2"
                  >
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ekspor Data Transaksi</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleExportCSV}
                        className="py-2.5 px-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                      >
                        <Download size={14} className="text-green-500" />
                        <span>Format CSV</span>
                      </button>
                      <button
                        onClick={handleExportExcel}
                        className="py-2.5 px-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                      >
                        <Download size={14} className="text-emerald-600" />
                        <span>Format Excel XLSX</span>
                      </button>
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
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 160, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="relative"
                    >
                      <input 
                        type="text"
                        autoFocus
                        placeholder="Cari..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blu-primary/20 dark:focus:ring-purple-500/20 transition-all dark:text-white"
                      />
                      <button 
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {!isSearchOpen && (
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-gray-500 dark:text-gray-400 hover:text-blu-primary transition-colors cursor-pointer"
                  >
                    <Search size={18} />
                  </button>
                )}
 
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-gray-500 dark:text-gray-400 hover:text-blu-primary transition-colors cursor-pointer"
                >
                  <TrendingUp size={18} className={cn(sortOrder === 'asc' ? "rotate-180" : "")} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'personal', 'business'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterClassification(c as any)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                      filterClassification === c 
                        ? "bg-blu-primary text-gray-950 shadow-md shadow-blu-primary/20" 
                        : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {c === 'all' ? 'Semua' : c === 'personal' ? 'Pribadi' : 'Bisnis'}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Food', 'Salary', 'Entertainment', 'Shopping', 'Bensin', 'Perbaikan', 'Bonus', 'General'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-all",
                      filterCategory === cat 
                        ? "bg-blu-primary text-gray-950 shadow-md shadow-blu-primary/20" 
                        : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Urutkan:</span>
                <div className="flex gap-2">
                  {(['date', 'amount', 'category'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                        sortBy === s 
                          ? "bg-blu-primary text-gray-950 shadow-md shadow-blu-primary/20" 
                          : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {s === 'date' ? 'Tanggal' : s === 'amount' ? 'Jumlah' : 'Kategori'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            {(filterClassification !== 'all' || filterCategory !== 'All' || searchQuery) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Ringkasan {filterClassification === 'personal' ? 'Pribadi' : filterClassification === 'business' ? 'Bisnis' : ''} • {format(selectedMonth, 'MMMM yyyy', {locale: id})}
                  </p>
                  {filterClassification === 'business' && (
                    <button 
                      onClick={analyzeBusinessWithAI}
                      disabled={isAiAnalyzing}
                      className="text-xs font-bold text-black flex items-center gap-1.5 bg-[#CFFF0F] hover:bg-[#CFFF0F]/90 px-3 py-1.5 rounded-full transition-all duration-300 shadow-md shadow-[#CFFF0F]/20 active:scale-95"
                    >
                      {isAiAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Analisis AI
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-green-500/20 rounded-md">
                        <ArrowDownLeft size={12} className="text-green-600" />
                      </div>
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Pemasukan</p>
                    </div>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(filteredMonthlyIncome)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-red-500/20 rounded-md">
                        <ArrowUpRight size={12} className="text-red-600" />
                      </div>
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Pengeluaran</p>
                    </div>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(filteredMonthlyExpense)}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              <AnimatePresence>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map(t => (
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
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                      <Search size={32} />
                    </div>
                    <p className="text-gray-500 text-sm">Tidak ada transaksi yang ditemukan</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="space-y-6">
            {user ? (
              <div className="bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F] flex flex-col items-center text-center space-y-3 transition-colors duration-200">
                {(() => {
                  const activeAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];
                  const ActiveAvatarIcon = activeAvatar.icon;
                  return (
                    <button
                      onClick={() => setIsAvatarPickerOpen(v => !v)}
                      className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#14181E] border border-gray-200 dark:border-[#22272F] text-gray-600 dark:text-[#CFFF0F] cursor-pointer hover:opacity-85 transition-all"
                      title="Pilih avatar"
                    >
                      <ActiveAvatarIcon size={32} />
                    </button>
                  );
                })()}

                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-gray-50 dark:bg-[#14181E] border border-gray-200 dark:border-[#22272F] rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 dark:text-white focus:outline-none text-center"
                      placeholder="Nama baru..."
                      disabled={isSavingName}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName();
                        } else if (e.key === 'Escape') {
                          setIsEditingName(false);
                        }
                      }}
                    />
                    <button 
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-emerald-500 transition-colors cursor-pointer"
                      title="Simpan"
                    >
                      {isSavingName ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    </button>
                    <button 
                      onClick={() => setIsEditingName(false)}
                      disabled={isSavingName}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-[#14181E] rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Batal"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      const defaultName = user.displayName || user.email?.split('@')[0] || '';
                      setTempName(defaultName);
                      setIsEditingName(true);
                    }}
                    className="relative inline-flex items-center justify-center cursor-pointer hover:opacity-85 transition-all"
                  >
                    <span className="font-bold text-lg tracking-tight text-gray-950 dark:text-white">
                      {user.displayName || user.email?.split('@')[0] || 'Pengguna'}
                    </span>
                    <Edit2 size={12} className="absolute -right-4 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <p className="text-xs text-gray-400">{user.email}</p>

                {/* Avatar Picker - opens on click of the avatar above */}
                <AnimatePresence>
                  {isAvatarPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full overflow-hidden"
                    >
                      <div className="w-full pt-4 border-t border-gray-100 dark:border-[#22272F]">
                        <div className="grid grid-cols-6 gap-2">
                          {AVATAR_OPTIONS.map((avatar) => {
                            const AvatarIcon = avatar.icon;
                            const isActive = selectedAvatar === avatar.id;
                            return (
                              <button
                                key={avatar.id}
                                onClick={async () => {
                                  await handleSelectAvatar(avatar.id);
                                  setIsAvatarPickerOpen(false);
                                }}
                                disabled={isSavingAvatar}
                                className={cn(
                                  "aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50",
                                  isActive
                                    ? "bg-[#CFFF0F]/15 ring-2 ring-[#CFFF0F] text-gray-950 dark:text-[#CFFF0F]"
                                    : "bg-gray-50 dark:bg-[#0D0F12] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#14181E]"
                                )}
                                title={avatar.id}
                              >
                                <AvatarIcon size={18} />
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-2 text-center">Avatar custom (foto sendiri) akan tersedia di update berikutnya</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#13161A] p-8 rounded-[32px] border border-dashed border-gray-200 dark:border-[#22272F] flex flex-col items-center text-center gap-3 transition-colors duration-200">
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#14181E] rounded-full flex items-center justify-center">
                  <UserIcon size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">Belum Login</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Login untuk mengatur profil, avatar, dan sinkronisasi data ke cloud.</p>
                <button
                  onClick={() => { setIsAuthModalOpen(true); setAuthError(null); }}
                  className="mt-2 px-5 py-2.5 bg-blu-primary text-white text-xs font-bold rounded-xl hover:bg-blu-dark transition-colors cursor-pointer"
                >
                  Login Sekarang
                </button>
              </div>
            )}

            {/* Preferences */}
            <div className="bg-white dark:bg-[#13161A] rounded-[32px] border border-gray-100 dark:border-[#22272F] transition-colors duration-200">
              <div className="flex items-center justify-center p-5">
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "relative w-[52px] h-[28px] rounded-full transition-all duration-300 cursor-pointer overflow-hidden flex items-center shadow-inner",
                    theme === 'light'
                      ? "bg-sky-200"
                      : "bg-slate-950 border border-slate-800"
                  )}
                  title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
                >
                  {/* Background decorations */}
                  <div className="absolute inset-0 pointer-events-none">
                    {theme === 'light' ? (
                      <div className="absolute right-2 top-[7px] w-4 h-2 bg-white/90 rounded-full">
                        <div className="absolute -top-1 left-1 w-3 h-3 bg-white/90 rounded-full" />
                      </div>
                    ) : (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-[3px] items-center opacity-70">
                        <span className="text-white text-[6px] leading-none">✦</span>
                        <span className="text-yellow-100 text-[4px] leading-none">✦</span>
                        <span className="text-white text-[5px] leading-none">✦</span>
                      </div>
                    )}
                  </div>

                  {/* Sliding knob */}
                  <motion.div
                    animate={{ x: theme === 'light' ? 2 : 26 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={cn(
                      "absolute w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10",
                      theme === 'light' ? "bg-amber-400" : "bg-slate-700"
                    )}
                  >
                    <motion.div
                      animate={{ rotate: theme === 'light' ? 0 : 360 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      {theme === 'light'
                        ? <Sun size={13} className="fill-white text-white" />
                        : <Moon size={13} className="fill-yellow-200 text-yellow-200" />
                      }
                    </motion.div>
                  </motion.div>
                </button>
              </div>
            </div>

            {/* Pengelolaan & Reset Data - moved here from Riwayat */}
            <div className="bg-white dark:bg-[#13161A] p-5 rounded-[32px] border border-gray-100 dark:border-[#22272F] space-y-3 transition-colors duration-200">
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pengelolaan & Reset Data</p>
              <div className="flex flex-col gap-2">
                {user ? (
                  <button
                    onClick={handleRemoveDuplicates}
                    className="w-full py-2.5 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-red-50/50 dark:hover:bg-red-950/25 border border-red-100 dark:border-red-950/80 rounded-xl flex items-center justify-between text-xs font-bold text-rose-500 dark:text-rose-400 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 size={14} />
                      <span>Hapus Transaksi Ganda (Duplikat)</span>
                    </div>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <div className="p-3 bg-gray-100/50 dark:bg-gray-800/40 rounded-xl text-[10px] text-gray-400 dark:text-gray-500 text-center">
                    Fitur Hapus Data Duplikat di Cloud hanya tersedia untuk pengguna yang masuk (Login).
                  </div>
                )}
                <button
                  onClick={handleClearCurrentMonth}
                  className="w-full py-2.5 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-red-50/50 dark:hover:bg-red-950/25 border border-red-100 dark:border-red-950/80 rounded-xl flex items-center justify-between text-xs font-bold text-rose-500 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 size={14} />
                    <span>Hapus Semua Transaksi Bulan Ini</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Logout - moved here from Dashboard */}
            {user && (
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all cursor-pointer active:scale-95 text-red-500 dark:text-red-400"
              >
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_2px_4px_rgba(239,68,68,0.7)] drop-shadow-[0_2px_4px_rgba(239,68,68,0.7)]"></span>
                <span>Keluar</span>
              </button>
            )}
          </section>
        )}
      </main>
      </div>

      {/* FAB Menu */}
      <AnimatePresence>
        {isAddMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90]"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-[104px] right-6 flex flex-col items-end gap-4 z-[100]">
        <AnimatePresence>
          {isAddMenuOpen && (
            <div className="flex flex-col items-end gap-3 mb-2">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.3 }}
                transition={{ type: "spring", stiffness: 600, damping: 25 }}
              >
                <button 
                  onClick={() => {
                    setIsScannerOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  className="w-12 h-12 bg-gray-900 border border-white/10 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Camera size={20} className="text-[#00F5FF]" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.3 }}
                transition={{ type: "spring", stiffness: 600, damping: 25, delay: 0.05 }}
              >
                <button 
                  onClick={() => {
                    setNewTime(format(new Date(), 'HH:mm'));
                    setIsModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  className="w-12 h-12 bg-[#0D0F12] border border-[#CFFF0F]/30 text-[#CFFF0F] rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer",
            isAddMenuOpen ? "bg-gray-800 text-white rotate-45 border border-white/5" : "bg-[#CFFF0F] text-black shadow-lg shadow-[#CFFF0F]/15"
          )}
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-[#0D0F12]/90 backdrop-blur-md border-t border-gray-100 dark:border-[#22272F]/80 px-2 py-3 flex justify-around items-center z-50 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {[
          { id: 'home', icon: <Wallet size={20} />, label: 'Beranda' },
          { id: 'stats', icon: <TrendingUp size={20} />, label: 'Statistik' },
          { id: 'history', icon: <History size={20} />, label: 'Riwayat' },
          { id: 'profile', icon: <UserIcon size={20} />, label: 'Profil' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => {
              console.log('Switching to tab:', tab.id);
              setActiveTab(tab.id as any);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-1.5 transition-all flex-1 cursor-pointer",
              activeTab === tab.id ? "text-gray-950 dark:text-[#CFFF0F]" : "text-gray-400 dark:text-gray-500"
            )}
          >
            <div className={cn(
              "px-5 py-2 rounded-2xl transition-all",
              activeTab === tab.id ? "bg-[#CFFF0F]/20 dark:bg-[#CFFF0F]/10 text-gray-950 dark:text-[#CFFF0F] sm:scale-105" : "hover:bg-gray-50 dark:hover:bg-[#14181E]"
            )}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest mt-1 font-display">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {isAiAnalysisModalOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-[150] flex flex-col"
          >
            <header className="p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100/50 rounded-xl">
                    <Sparkles size={20} className="text-blu-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Analisis AI Bisnis</h2>
                </div>
                <button 
                  onClick={() => setIsAiAnalysisModalOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-2 mb-6">
                  <Bot size={20} className="text-blu-primary" />
                  <p className="text-sm font-bold text-blu-primary">Insight AI - {format(selectedMonth, 'MMMM yyyy', {locale: id})}</p>
                </div>
                <div className="text-sm text-gray-700 space-y-4 whitespace-pre-wrap leading-relaxed relative z-10">
                  {aiAnalysisResult}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debt Detail Overlay */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-[150] flex flex-col"
          >
            <header className="p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100/50 rounded-xl text-orange-600">
                    <CreditCard size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Hutang & Piutang</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportExcel}
                    className="p-2 text-gray-500 hover:text-blu-primary hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                    title="Export Excel"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => setIsDebtModalOpen(false)}
                    className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-2 -top-2 opacity-10">
                    <ArrowDownLeft size={64} className="text-orange-600" />
                  </div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter mb-1 relative z-10">Piutang (Pinjam)</p>
                  <p className="text-xl font-black text-orange-900 relative z-10">{formatCurrency(debtStats.borrow)}</p>
                  <p className="text-[9px] text-orange-600/60 mt-1">Uang yang kamu pinjam</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-2 -top-2 opacity-10">
                    <ArrowUpRight size={64} className="text-blue-600" />
                  </div>
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
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-950 rounded-full flex items-center justify-center mb-4">
                      <CreditCard size={32} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-bold text-sm">Tidak ada hutang aktif</p>
                    <p className="text-gray-300 text-xs mt-1">Gunakan tombol + untuk menambah</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {transactions.filter(t => t.type === 'debt').map(t => (
                        <TransactionItem 
                          key={t.id}
                          transaction={t} 
                          onDelete={() => setTransactionToDelete(t)} 
                          onEdit={() => {
                            handleEditClick(t);
                          }}
                          onToggleSettled={() => handleToggleSettled(t)}
                          formatCurrency={formatCurrency}
                          isRevealed={revealedId === t.id}
                          onReveal={(isRevealed) => handleReveal(t.id, isRevealed)}
                        />
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
      {isScannerOpen && (
        <ScannerModal 
          onClose={() => setIsScannerOpen(false)} 
          onScan={handleScanReceipt}
          isScanning={isScanning}
        />
      )}

      {/* Add/Edit Transaction Modal */}
      {isModalOpen && (
        <TransactionModal 
          setIsModalOpen={setIsModalOpen}
          editingTransaction={editingTransaction}
          setEditingTransaction={setEditingTransaction}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newAmount={newAmount}
          setNewAmount={setNewAmount}
          newDate={newDate}
          setNewDate={setNewDate}
          newTime={newTime}
          setNewTime={setNewTime}
          newType={newType}
          setNewType={setNewType}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          newClassification={newClassification}
          setNewClassification={setNewClassification}
          newDebtType={newDebtType}
          setNewDebtType={setNewDebtType}
          setNewIsSettled={setNewIsSettled}
          isSuggesting={isSuggesting}
          handleSaveTransaction={handleAddTransaction}
          setIsScannerOpen={setIsScannerOpen}
          formatInputNumber={formatInputNumber}
        />
      )}
      {/* Import Status Modal */}
      {importStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                importStatus.type === 'success' ? "bg-green-100 text-green-600" : 
                importStatus.type === 'error' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
              )}>
                {importStatus.type === 'success' ? <Check size={32} /> : 
                 importStatus.type === 'error' ? <AlertCircle size={32} /> : <Upload size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {importStatus.type === 'success' ? 'Berhasil' : 
                   importStatus.type === 'error' ? 'Kesalahan' : 'Konfirmasi Impor'}
                </h3>
                <p className="text-sm text-gray-500">{importStatus.message}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {importStatus.type === 'confirm' && (
                <button 
                  onClick={() => {
                    importStatus.onConfirm?.();
                  }}
                  className="w-full py-4 bg-blu-primary text-white font-bold rounded-2xl hover:bg-blu-dark transition-colors"
                >
                  Lanjutkan Impor
                </button>
              )}
              <button 
                onClick={() => setImportStatus(null)}
                className={cn(
                  "w-full py-4 font-bold rounded-2xl transition-colors",
                  importStatus.type === 'confirm' ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-blu-primary text-white hover:bg-blu-dark"
                )}
              >
                {importStatus.type === 'confirm' ? 'Batal' : 'Tutup'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Hapus Transaksi?</h3>
                <p className="text-sm text-gray-500">
                  Apakah kamu yakin ingin menghapus transaksi <span className="font-bold text-gray-700">"{transactionToDelete.title}"</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
  onClick={handleDeleteTransaction}
  disabled={isDeleting}  // ← TAMBAH INI
  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}  // ← TAMBAH INI
</button>
              <button 
                onClick={() => setTransactionToDelete(null)}
                className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {isAuthModalOpen && (
        <AuthModal 
          setIsAuthModalOpen={setIsAuthModalOpen}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authDisplayName={authDisplayName}
          setAuthDisplayName={setAuthDisplayName}
          authError={authError}
          setAuthError={setAuthError}
          authMode={authMode}
          setAuthMode={setAuthMode}
          isAuthLoading={isAuthLoading}
          setIsAuthLoading={setIsAuthLoading}
          handleEmailAuth={handleEmailAuth}
          loginWithGoogle={loginWithGoogle}
        />
      )}
      </AnimatePresence>
    </div>
  );
}
