import React, { useMemo } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Sun, Moon, Cloud, CloudRain, CloudSun, CloudFog,
  CloudLightning, CloudSnow, MapPin, TrendingUp, TrendingDown, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { format, parseISO, isSameMonth, subMonths, addMonths } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { Transaction } from '../types';
import { cn } from '../lib/utils';
import { AppUser } from '../auth';

interface HomeScreenProps {
  user: AppUser | null;
  theme: string;
  transactions: Transaction[];
  selectedMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isCurrentMonth: boolean;
  formatCurrency: (n: number) => string;
  chartData: any[];
  weeklyTrend: any;
  totalBalanceToDisplay: number;
  monthlyIncome: number;
  monthlyExpense: number;
  startBalance: number;
  weatherStatus: 'loading' | 'success' | 'error' | 'denied';
  weatherData: { temp: number; code: number; isDay: boolean } | null;
  locationName: string | null;
}

const getWeatherTheme = (code: number | undefined, isDay: boolean) => {
  let category: 'cerah' | 'cerah_berawan' | 'berawan' | 'berkabut' | 'hujan' | 'badai' | 'salju' = 'berawan';
  let label = 'Cloudy';
  if (code === 0) { category = 'cerah'; label = 'Sunny'; }
  else if (code === 1 || code === 2) { category = 'cerah_berawan'; label = code === 1 ? 'Mostly Sunny' : 'Partly Cloudy'; }
  else if (code === 3) { category = 'berawan'; label = 'Overcast'; }
  else if (code !== undefined && [45, 48].includes(code)) { category = 'berkabut'; label = 'Foggy'; }
  else if (code !== undefined && [51,53,55,56,57,61,63,80,81].includes(code)) { category = 'hujan'; label = 'Light Rain'; }
  else if (code !== undefined && [65,66,67,82].includes(code)) { category = 'hujan'; label = 'Heavy Rain'; }
  else if (code !== undefined && [95,96,99].includes(code)) { category = 'badai'; label = 'Thunderstorm'; }
  else if (code !== undefined && [71,73,75,77,85,86].includes(code)) { category = 'salju'; label = 'Snow'; }

  const THEMES = {
    cerah: {
      day: { gradient: 'from-[#E96D63] to-[#F1A957]', icon: Sun, iconColor: 'text-white' },
      night: { gradient: 'from-[#1F3E74] to-[#1E3765]', icon: Moon, iconColor: 'text-white' },
    },
    cerah_berawan: {
      day: { gradient: 'from-[#F5A642] to-[#E8C96A]', icon: CloudSun, iconColor: 'text-white' },
      night: { gradient: 'from-[#2A3F6B] to-[#3A5080]', icon: Cloud, iconColor: 'text-white' },
    },
    berawan: {
      day: { gradient: 'from-[#3283E2] to-[#4EA3ED]', icon: Cloud, iconColor: 'text-white' },
      night: { gradient: 'from-[#3283E2] to-[#4EA3ED]', icon: Cloud, iconColor: 'text-white' },
    },
    berkabut: {
      day: { gradient: 'from-[#7F8C8D] to-[#95A5A6]', icon: CloudFog, iconColor: 'text-white' },
      night: { gradient: 'from-[#4A4E5A] to-[#5C6070]', icon: CloudFog, iconColor: 'text-white' },
    },
    hujan: {
      day: { gradient: 'from-[#33354C] to-[#393C55]', icon: CloudRain, iconColor: 'text-white' },
      night: { gradient: 'from-[#33354C] to-[#393C55]', icon: CloudRain, iconColor: 'text-white' },
    },
    badai: {
      day: { gradient: 'from-[#33354C] to-[#393C55]', icon: CloudLightning, iconColor: 'text-white' },
      night: { gradient: 'from-[#33354C] to-[#393C55]', icon: CloudLightning, iconColor: 'text-white' },
    },
    salju: {
      day: { gradient: 'from-[#F0AC74] to-[#F3B880]', icon: CloudSnow, iconColor: 'text-white' },
      night: { gradient: 'from-[#213054] to-[#24355D]', icon: CloudSnow, iconColor: 'text-white' },
    },
  } as const;

  const variant = isDay ? THEMES[category].day : THEMES[category].night;
  return { ...variant, label, category };
};

export function HomeScreen({
  theme,
  transactions,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
  formatCurrency,
  chartData,
  weeklyTrend,
  totalBalanceToDisplay,
  monthlyIncome,
  monthlyExpense,
  startBalance,
  weatherStatus,
  weatherData,
  locationName,
}: HomeScreenProps) {
  return (
    <div className="space-y-4">
      {/* Balance Hero Card */}
      <div className="bg-gray-950 text-white p-6 rounded-[32px] relative overflow-hidden border border-white/5 shadow-xl shadow-black/35 bg-gradient-to-br from-[#0D0F12] via-[#14181E] to-[#0D1014]">
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
          <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 bg-[#CFFF0F] text-black rounded-lg tracking-wider">
            IDR
          </span>
        </div>

        {!isCurrentMonth && (
          <p className="text-[11px] text-gray-400 font-medium mb-4 flex items-center gap-1">
            <span>Saldo Awal Bulan:</span>
            <span className="text-white font-semibold">{formatCurrency(startBalance)}</span>
          </p>
        )}

        {/* Month selector inside balance card */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button onClick={onPrevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 cursor-pointer select-none">
            <ArrowDownLeft size={14} className="rotate-45" />
          </button>
          <span className="font-extrabold text-xs tracking-widest text-white uppercase font-display">
            {format(selectedMonth, 'MMMM yyyy', { locale: id })}
          </span>
          <button
            onClick={onNextMonth}
            disabled={isCurrentMonth}
            className={cn('p-1.5 rounded-lg transition-colors cursor-pointer select-none', isCurrentMonth ? 'opacity-30 cursor-not-allowed text-gray-600' : 'hover:bg-white/10 text-gray-400')}
          >
            <ArrowUpRight size={14} className="rotate-45" />
          </button>
        </div>
      </div>

      {/* Income + Expense summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
            <ArrowDownLeft size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Pemasukan</p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(monthlyIncome)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-950/30 rounded-xl flex items-center justify-center">
            <ArrowUpRight size={16} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Pengeluaran</p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(monthlyExpense)}</p>
          </div>
        </div>
      </div>

      {/* Weekly overview chart */}
      <section className="bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F]">
        <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display mb-6">
          Statistik Mingguan
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} tabIndex={-1} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#22272F' : '#F1F5F9'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: theme === 'dark' ? '#22272F' : '#E2E8F0',
                  background: theme === 'dark' ? '#14181E' : '#FFFFFF',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000',
                }}
                formatter={(value: number, name: string) => {
                  if (value === 0) return ['', ''];
                  return [formatCurrency(value), name === 'income' ? 'Pemasukan' : 'Pengeluaran'];
                }}
              />
              <Bar dataKey="income" fill={theme === 'dark' ? '#CFFF0F' : '#65A30D'} radius={[4, 4, 0, 0]} barSize={10} />
              <Bar dataKey="expense" fill={theme === 'dark' ? '#FF5E5E' : '#DC2626'} radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Trend widgets */}
      <div className="grid grid-cols-2 gap-3">
        {([ 
          { key: 'income', title: 'Pemasukan', data: weeklyTrend.income, color: '#10b981', fillId: 'sparkIncome' },
          { key: 'expense', title: 'Pengeluaran', data: weeklyTrend.expense, color: '#ef4444', fillId: 'sparkExpense' },
        ] as const).map(({ key, title, data, color, fillId }) => {
          const isUp = data.percent !== null && data.percent >= 0;
          const TrendIcon = isUp ? TrendingUp : TrendingDown;
          const statusColor = data.percent === null
            ? 'text-gray-400 dark:text-gray-500'
            : data.isGood ? 'text-emerald-500' : 'text-rose-500';
          return (
            <div key={key} className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-display">{title}</span>
                <TrendIcon size={14} className={statusColor} />
              </div>
              <p className={cn('text-lg font-extrabold', statusColor)}>
                {data.percent === null ? 'Baru' : `${data.percent >= 0 ? '+' : ''}${Math.round(Math.abs(data.percent) > 100 ? (data.percent >= 0 ? 100 : -100) : data.percent)}%`}
              </p>
              <div className="h-10 -mx-1 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.sparkline.map((v: number) => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
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
              <p className="text-[9px] text-gray-400 text-center mt-1">vs kemarin</p>
            </div>
          );
        })}
      </div>

      {/* Weather widget (secondary) */}
      <div className="rounded-[24px] overflow-hidden">
        {weatherStatus === 'loading' && (
          <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">Mengambil data cuaca...</span>
          </div>
        )}
        {weatherStatus === 'denied' && (
          <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3">
            <MapPin size={20} className="text-gray-400" />
            <span className="text-xs text-gray-400">Izinkan akses lokasi untuk melihat cuaca</span>
          </div>
        )}
        {weatherStatus === 'error' && (
          <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3">
            <Cloud size={20} className="text-gray-400" />
            <span className="text-xs text-gray-400">Cuaca tidak tersedia saat ini</span>
          </div>
        )}
        {weatherStatus === 'success' && weatherData && (() => {
          const { gradient, icon: WeatherIcon, iconColor, label } = getWeatherTheme(weatherData.code, weatherData.isDay);
          return (
            <div className={cn('relative bg-gradient-to-r p-4 text-white overflow-hidden flex items-center justify-between', gradient)}>
              <div className="relative flex flex-col gap-1 z-10">
                <div className="flex items-center gap-1.5">
                  <WeatherIcon size={14} className={iconColor} strokeWidth={2.5} />
                  <span className="text-[13px] font-medium">{label}</span>
                </div>
                <span className="text-[34px] font-normal leading-none">{weatherData.temp}°</span>
              </div>
              <div className="relative flex flex-col items-end text-right z-10 gap-[2px]">
                <span className="text-lg font-medium">{format(new Date(), 'HH:mm')}</span>
                <span className="text-[9px] opacity-90 uppercase tracking-widest font-medium">
                  {format(new Date(), 'EEE MM-dd', { locale: enUS })}
                </span>
                <span className="text-[10px] opacity-90 font-medium">{locationName || '—'}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
