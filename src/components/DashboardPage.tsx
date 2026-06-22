import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  TrendingUp,
  TrendingDown,
  MapPin,
  Sun as SunIcon,
  Moon
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction } from '../types';
import { cn } from '../lib/utils';

// ─── OPEN-METEO WEATHER INTEGRATION ───
interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

const WMO_CODES: Record<number, { label: string; icon: any }> = {
  0: { label: 'Cerah', icon: Sun },
  1: { label: 'Cerah Berawan', icon: Sun },
  2: { label: 'Berawan', icon: Cloud },
  3: { label: 'Mendung', icon: Cloud },
  45: { label: 'Berkabut', icon: Cloud },
  48: { label: 'Berkabut', icon: Cloud },
  51: { label: 'Gerimis Ringan', icon: CloudRain },
  53: { label: 'Gerimis', icon: CloudRain },
  55: { label: 'Gerimis Lebat', icon: CloudRain },
  61: { label: 'Hujan Ringan', icon: CloudRain },
  63: { label: 'Hujan', icon: CloudRain },
  65: { label: 'Hujan Lebat', icon: CloudRain },
  71: { label: 'Salju Ringan', icon: CloudSnow },
  73: { label: 'Salju', icon: CloudSnow },
  75: { label: 'Salju Lebat', icon: CloudSnow },
  95: { label: 'Petir', icon: CloudLightning },
  96: { label: 'Petir + Hujan Es', icon: CloudLightning },
  99: { label: 'Petir + Hujan Es', icon: CloudLightning },
};

function getWeatherInfo(code: number) {
  return WMO_CODES[code] || { label: 'Tidak Diketahui', icon: Cloud };
}

const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 28, condition: 'Cerah', humidity: 65, windSpeed: 12, location: 'Mencari lokasi...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 300000 });
        });
        const { latitude, longitude } = position.coords;

        let locationName = 'Lokasi Anda';
        try {
          const nominatimRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`,
            { headers: { 'User-Agent': 'BluTracker/1.0' } }
          );
          if (nominatimRes.ok) {
            const geoData = await nominatimRes.json();
            const a = geoData.address || {};
            locationName = a.city || a.town || a.village || a.municipality || a.county || a.state || 'Lokasi Anda';
          }
        } catch (e) {}

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
        );
        const weatherData = await weatherRes.json();
        const current = weatherData.current;
        const info = getWeatherInfo(current.weather_code);

        if (!cancelled) {
          setWeather({
            temp: Math.round(current.temperature_2m),
            condition: info.label,
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            location: locationName
          });
        }
      } catch (err) {
        console.error('Weather fetch failed:', err);
        if (!cancelled) setWeather(prev => ({ ...prev, location: 'Surabaya (Default)' }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { weather, loading };
};

// ─── MINI SPARKLINE ───
const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (data.length < 2) return <div className="h-12" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-12" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy={100 - ((data[data.length - 1] - min) / range) * 80 - 10} r="4" fill={color} />
    </svg>
  );
};

// ─── TREND CARD ───
const TrendCard = ({ title, icon: Icon, todayAmount, yesterdayAmount, data, type }: any) => {
  const diff = yesterdayAmount > 0 ? ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100 : 0;
  const isPositive = diff >= 0;
  const isGood = type === 'income' ? isPositive : !isPositive;
  const color = isGood ? '#10B981' : '#EF4444';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-[24px] border transition-all bg-white dark:bg-[#13161A] border-gray-100 dark:border-[#22272F] shadow-sm hover:shadow-md")}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", type === 'income' ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30")}>
          <Icon size={16} className={type === 'income' ? "text-emerald-500" : "text-red-500"} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-end gap-1 mb-2">
        <span className={cn("text-lg font-bold", isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {isPositive ? '+' : ''}{diff.toFixed(0)}%
        </span>
        {isPositive ? <TrendingUp size={16} className={isGood ? "text-emerald-500" : "text-red-500"} /> 
                   : <TrendingDown size={16} className={isGood ? "text-emerald-500" : "text-red-500"} />}
      </div>
      <MiniSparkline data={data} color={color} />
      <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-2">{isGood ? 'Lebih baik' : 'Perlu perhatian'} dari kemarin</p>
    </motion.div>
  );
};

// ─── WEATHER WIDGET ───
const WeatherWidget = ({ weather, loading }: { weather: WeatherData; loading: boolean }) => {
  const info = getWeatherInfo(weather.condition === 'Cerah' ? 0 : 1);
  const WeatherIcon = info.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={cn("p-5 rounded-[24px] border transition-all h-full bg-white dark:bg-[#13161A] border-gray-100 dark:border-[#22272F] shadow-sm hover:shadow-md flex flex-col justify-between")}>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-[#CFFF0F] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{weather.location}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <WeatherIcon size={40} className="text-amber-400" />
              <div>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{weather.temp}°</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">{weather.condition}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Droplets size={14} className="text-blue-400" />
              <div><p className="text-[9px] text-gray-400">Kelembaban</p><p className="text-xs font-bold text-gray-700 dark:text-gray-300">{weather.humidity}%</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Wind size={14} className="text-teal-400" />
              <div><p className="text-[9px] text-gray-400">Angin</p><p className="text-xs font-bold text-gray-700 dark:text-gray-300">{weather.windSpeed} km/h</p></div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

// ─── PROPS ───
interface DashboardPageProps {
  user: any; transactions: Transaction[]; selectedMonth: Date;
  totalBalance: number; monthlyIncome: number; monthlyExpense: number;
  theme: string; toggleTheme: () => void;
  formatCurrency: (amount: number) => string;
  getGreeting: () => string;
  handlePrevMonth: () => void; handleNextMonth: () => void;
  isCurrentMonth: boolean;
}

export function DashboardPage({
  user, transactions, selectedMonth, totalBalance, monthlyIncome, monthlyExpense,
  theme, toggleTheme, formatCurrency, getGreeting, handlePrevMonth, handleNextMonth, isCurrentMonth
}: DashboardPageProps) {
  const { weather, loading } = useWeather();

  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return format(d, 'yyyy-MM-dd');
    });
    const incomeData = last7Days.map(date => transactions.filter(t => t.type === 'income' && t.date === date).reduce((acc, t) => acc + t.amount, 0));
    const expenseData = last7Days.map(date => transactions.filter(t => t.type === 'expense' && t.date === date).reduce((acc, t) => acc + t.amount, 0));
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    return {
      incomeData, expenseData,
      todayIncome: transactions.filter(t => t.type === 'income' && t.date === today).reduce((acc, t) => acc + t.amount, 0),
      yesterdayIncome: transactions.filter(t => t.type === 'income' && t.date === yesterday).reduce((acc, t) => acc + t.amount, 0),
      todayExpense: transactions.filter(t => t.type === 'expense' && t.date === today).reduce((acc, t) => acc + t.amount, 0),
      yesterdayExpense: transactions.filter(t => t.type === 'expense' && t.date === yesterday).reduce((acc, t) => acc + t.amount, 0),
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <header className="bg-[#FFFFFF] dark:bg-[#0D0F12] p-6 rounded-b-[40px] shadow-sm border-b border-gray-100 dark:border-[#22272F]">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-gray-100 dark:bg-[#14181E] rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-gray-200 dark:border-[#22272F]">
              <img src="./logo.png" alt="BluTracker" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col select-none">
              <p className="text-xs text-gray-400 font-medium tracking-wide">{getGreeting()},</p>
              <span className="font-bold text-sm tracking-tight text-gray-950 dark:text-white max-w-[120px] truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'Pengguna'}
              </span>
            </div>
          </div>
          <button onClick={toggleTheme} className={cn("relative w-[52px] h-[28px] rounded-full transition-all duration-300 cursor-pointer overflow-hidden flex items-center shadow-inner", theme === 'light' ? "bg-sky-200" : "bg-slate-950 border border-slate-800")}>
            <motion.div animate={{ x: theme === 'light' ? 2 : 26 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={cn("absolute w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10", theme === 'light' ? "bg-amber-400" : "bg-slate-700")}>
              {theme === 'light' ? <SunIcon size={13} className="fill-white text-white" /> : <Moon size={13} className="fill-yellow-200 text-yellow-200" />}
            </motion.div>
          </button>
        </div>

        <div className="bg-gray-950 text-white p-6 rounded-[32px] relative overflow-hidden mb-6 border border-white/5 shadow-xl select-none bg-gradient-to-br from-[#0D0F12] via-[#14181E] to-[#0D1014]">
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-[#CFFF0F]/10 rounded-full blur-[40px]" />
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-[#00F5FF]/5 rounded-full blur-[40px]" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">{isCurrentMonth ? 'Active Portfolio Balance' : 'Portfolio Balance'}</p>
              <h2 className="text-3xl font-extrabold tracking-tight mt-1">{formatCurrency(totalBalance)}</h2>
            </div>
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 bg-[#CFFF0F] text-black rounded-lg tracking-wider shadow-sm">IDR</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#CFFF0F]/10 rounded-lg flex items-center justify-center"><ArrowDownLeft size={14} className="text-[#CFFF0F]" /></div>
              <div><p className="text-[10px] text-gray-400 font-medium">Income</p><p className="text-xs font-bold text-white tracking-wide">{formatCurrency(monthlyIncome)}</p></div>
            </div>
            <div className="flex items-center gap-2 border-l border-white/5 pl-3">
              <div className="w-7 h-7 bg-[#00F5FF]/10 rounded-lg flex items-center justify-center"><ArrowUpRight size={14} className="text-[#00F5FF]" /></div>
              <div><p className="text-[10px] text-gray-400 font-medium">Expenses</p><p className="text-xs font-bold text-white tracking-wide">{formatCurrency(monthlyExpense)}</p></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-transparent px-4 py-2 text-xs w-full">
          <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 rounded-lg transition-colors text-gray-500 dark:text-gray-300 cursor-pointer select-none">
            <ArrowDownLeft size={14} className="rotate-45" />
          </button>
          <div className="font-extrabold text-xs tracking-widest text-gray-800 dark:text-white uppercase">{format(selectedMonth, 'MMMM yyyy', { locale: id })}</div>
          <button onClick={handleNextMonth} disabled={isCurrentMonth} className={cn("p-1.5 rounded-lg transition-colors cursor-pointer select-none", isCurrentMonth ? "opacity-35 cursor-not-allowed" : "text-gray-500 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/40")}>
            <ArrowUpRight size={14} className="rotate-45" />
          </button>
        </div>
      </header>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="row-span-2"><WeatherWidget weather={weather} loading={loading} /></div>
          <TrendCard title="Pendapatan" icon={ArrowDownLeft} todayAmount={trendData.todayIncome} yesterdayAmount={trendData.yesterdayIncome} data={trendData.incomeData} type="income" />
          <TrendCard title="Pengeluaran" icon={ArrowUpRight} todayAmount={trendData.todayExpense} yesterdayAmount={trendData.yesterdayExpense} data={trendData.expenseData} type="expense" />
        </div>
      </div>
    </div>
  );
}
