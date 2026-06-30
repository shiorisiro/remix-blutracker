import React from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Sun, Moon, Cloud, CloudRain, CloudSun, CloudFog,
  CloudLightning, CloudSnow, MapPin, TrendingUp, TrendingDown, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from '../lib/utils';

type WeatherCategory = 'cerah' | 'cerah_berawan' | 'berawan' | 'berkabut' | 'hujan' | 'badai' | 'salju';

function getWeatherTheme(code: number | undefined, isDay: boolean) {
  let category: WeatherCategory = 'berawan';
  let label = 'Cloudy';

  if (code === 0) { category = 'cerah'; label = 'Sunny'; }
  else if (code === 1) { category = 'cerah_berawan'; label = 'Mostly Sunny'; }
  else if (code === 2) { category = 'cerah_berawan'; label = 'Partly Cloudy'; }
  else if (code === 3) { category = 'berawan'; label = 'Overcast'; }
  else if (code !== undefined && [45, 48].includes(code)) { category = 'berkabut'; label = 'Foggy'; }
  else if (code !== undefined && [51, 53, 55, 56, 57, 61, 63, 80, 81].includes(code)) { category = 'hujan'; label = 'Light Rain'; }
  else if (code !== undefined && [65, 66, 67, 82].includes(code)) { category = 'hujan'; label = 'Heavy Rain'; }
  else if (code !== undefined && [95, 96, 99].includes(code)) { category = 'badai'; label = 'Thunderstorm'; }
  else if (code !== undefined && [71, 73, 75, 77, 85, 86].includes(code)) { category = 'salju'; label = 'Snow'; }

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
}

interface HomeScreenProps {
  theme: string;
  selectedMonth: Date;
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

export function HomeScreen({
  theme,
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
      {/* Statistik Mingguan */}
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
                  fontFamily: 'Outfit',
                }}
                formatter={(value: number, name: string) => {
                  if (value === 0) return ['', ''];
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
            <div key={key} className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] transition-colors duration-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">{title}</span>
                <TrendIcon size={14} className={statusColor} />
              </div>
              <p className={cn("text-lg font-extrabold", statusColor)}>
                {data.percent === null
                  ? 'Baru'
                  : Math.abs(data.percent) > 100
                    ? `${data.percent >= 0 ? '+' : '-'}100%+`
                    : `${data.percent >= 0 ? '+' : ''}${Math.round(data.percent)}%`}
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
              <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center">vs kemarin</p>
            </div>
          );
        })}
      </div>

      {/* Weather Widget */}
      <div className="rounded-[24px] overflow-hidden">
        {weatherStatus === 'loading' && (
          <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3 transition-colors duration-200">
            <Loader2 size={20} className="animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">Mengambil data cuaca...</span>
          </div>
        )}
        {weatherStatus === 'denied' && (
          <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3 transition-colors duration-200">
            <MapPin size={20} className="text-gray-400" />
            <span className="text-xs text-gray-400">Izinkan akses lokasi untuk melihat cuaca</span>
          </div>
        )}
        {weatherStatus === 'error' && (
          <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3 transition-colors duration-200">
            <Cloud size={20} className="text-gray-400" />
            <span className="text-xs text-gray-400">Cuaca tidak tersedia saat ini</span>
          </div>
        )}
        {weatherStatus === 'success' && weatherData && (() => {
          const { gradient, icon: WeatherIcon, iconColor, label, category } = getWeatherTheme(weatherData.code, weatherData.isDay);
          return (
            <div className={cn("relative bg-gradient-to-r p-4 text-white overflow-hidden flex items-center justify-between", gradient)}>
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {category === 'cerah' && weatherData.isDay && (
                  <>
                    <div className="absolute -right-4 top-0 w-32 h-32 rounded-full bg-white/10" />
                    <div className="absolute right-12 -top-4 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute left-20 bottom-0 w-40 h-24 rounded-t-full bg-white/10 translate-y-12" />
                  </>
                )}
                {category === 'cerah' && !weatherData.isDay && (
                  <>
                    <div className="absolute right-8 -top-8 w-24 h-24 rounded-full bg-[#E5D770]" />
                    <div className="absolute right-2 -top-14 w-36 h-36 rounded-full border-[16px] border-white/5" />
                    <div className="absolute -right-4 -top-20 w-48 h-48 rounded-full border-[16px] border-white/5" />
                  </>
                )}
                {category === 'berawan' && (
                  <div className="absolute right-0 top-0 w-[120%] h-full">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-20">
                      <path fill="white" d="M0,0 Q25,30 50,0 T100,0 L100,100 L0,100 Z" />
                    </svg>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-10 translate-y-4">
                      <path fill="white" d="M0,20 Q30,50 60,10 T100,20 L100,100 L0,100 Z" />
                    </svg>
                  </div>
                )}
                {(category === 'hujan' || category === 'badai') && (
                  <div className="absolute inset-0 flex gap-3 justify-end pr-8 opacity-20 overflow-hidden">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="w-[1px] h-[150%] bg-white -translate-y-4" style={{ transform: 'rotate(25deg)' }} />
                    ))}
                  </div>
                )}
                {category === 'salju' && weatherData.isDay && (
                  <div className="absolute left-0 bottom-0 w-full h-full">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-20">
                      <path fill="white" d="M0,100 L0,50 Q25,20 50,50 T100,30 L100,100 Z" />
                    </svg>
                  </div>
                )}
                {category === 'salju' && !weatherData.isDay && (
                  <div className="absolute inset-0 opacity-80">
                    <div className="absolute left-1/4 top-1/4 w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="absolute left-1/2 top-1/3 w-1 h-1 bg-white rounded-full" />
                    <div className="absolute left-3/4 top-1/4 w-2 h-2 bg-white rounded-full opacity-70" />
                    <div className="absolute right-8 bottom-6 w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="absolute left-2/3 top-1/2 w-3 h-3 bg-white/40 rotate-45" />
                    <div className="absolute right-12 top-1/3 w-2 h-2 bg-white/30 rotate-12" />
                  </div>
                )}
              </div>
              <div className="relative flex flex-col justify-between h-full z-10 pl-1">
                <div className="flex items-center gap-1.5">
                  <WeatherIcon size={14} className={iconColor} strokeWidth={2.5} />
                  <span className="text-[13px] font-medium tracking-wide">{label}</span>
                </div>
                <div className="mt-1">
                  <span className="text-[34px] font-normal leading-none tracking-tight">{weatherData.temp}°</span>
                </div>
              </div>
              <div className="relative flex flex-col items-end text-right z-10 pr-1 gap-[2px]">
                <span className="text-lg font-medium leading-tight">{format(new Date(), 'HH:mm')}</span>
                <span className="text-[9px] opacity-90 uppercase tracking-widest font-medium mt-1">
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
