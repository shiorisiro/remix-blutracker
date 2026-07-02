import React from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Cloud, CloudSun, CloudFog, CloudRain, CloudLightning, CloudSnow,
  MapPin, TrendingUp, TrendingDown, Loader2, Sun, Moon,
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

const WEATHER_BG: Record<WeatherCategory, { day: string; night: string }> = {
  cerah:         { day: '#E05548',                                         night: '#0D1B4A' },
  cerah_berawan: { day: 'linear-gradient(155deg,#2B5BB0,#4A8ADA)',        night: 'linear-gradient(155deg,#182240,#263458)' },
  berawan:       { day: 'linear-gradient(155deg,#2B5BB0,#4A8ADA)',        night: 'linear-gradient(155deg,#182240,#263458)' },
  berkabut:      { day: 'linear-gradient(155deg,#5A6372,#7A8390)',        night: 'linear-gradient(155deg,#3A3E50,#4E5265)' },
  hujan:         { day: 'linear-gradient(155deg,#3C4A58,#4E5E72)',        night: 'linear-gradient(155deg,#2A3445,#3A4458)' },
  badai:         { day: 'linear-gradient(155deg,#3A3C46,#565662)',        night: 'linear-gradient(155deg,#282A34,#404048)' },
  salju:         { day: 'linear-gradient(155deg,#3A5062,#4E6878)',        night: 'linear-gradient(155deg,#283848,#384858)' },
};

function WeatherIllustration({ category, isDay }: { category: WeatherCategory; isDay: boolean }) {
  const cx = 390, cy = 84;

  const rain = Array.from({ length: 20 }, (_, i) => (
    <line key={i} x1={i * 27 - 15} y1={-5} x2={i * 27 + 42} y2={175}
      stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round" />
  ));

  const wave = (y: number, fill: string, op = 1) => (
    <path key={y} fill={fill} fillOpacity={op}
      d={`M-20,${y} C60,${y - 26} 160,${y + 20} 270,${y - 8} S420,${y + 22} 520,${y} L520,170 L-20,170 Z`} />
  );

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 168" preserveAspectRatio="xMidYMid slice">
      {category === 'cerah' && isDay && <>
        <circle cx={cx} cy={cy} r={175} fill="rgba(255,255,255,0.10)" />
        <circle cx={cx} cy={cy} r={138} fill="#E87848" />
        <circle cx={cx} cy={cy} r={102} fill="#EE9030" />
        <circle cx={cx} cy={cy} r={68}  fill="#F5B428" />
        <circle cx={cx} cy={cy} r={36}  fill="#FFD830" />
      </>}

      {category === 'cerah' && !isDay && <>
        <circle cx={cx} cy={cy} r={175} fill="rgba(255,255,255,0.03)" />
        <circle cx={cx} cy={cy} r={138} fill="rgba(255,255,255,0.06)" />
        <circle cx={cx} cy={cy} r={102} fill="#1A3A8F" />
        <circle cx={cx} cy={cy} r={60}  fill="#E8961E" />
        <circle cx={cx - 22} cy={cy - 18} r={50} fill="#0D1B4A" />
      </>}

      {(category === 'berawan' || category === 'cerah_berawan') && <>
        {isDay
          ? <circle cx={455} cy={-12} r={72} fill="#FFD540" />
          : <circle cx={460} cy={-10} r={66} fill="#E8961E" />}
        {wave(88,  isDay ? 'rgba(90,135,205,0.5)'  : 'rgba(55,72,100,0.55)')}
        {wave(110, isDay ? 'rgba(72,118,190,0.55)' : 'rgba(42,58,85,0.65)')}
        {wave(132, isDay ? 'rgba(52,100,175,0.5)'  : 'rgba(32,48,72,0.55)')}
      </>}

      {category === 'berkabut' && <>
        {wave(80,  'rgba(180,188,196,0.25)')}
        {wave(105, 'rgba(160,170,178,0.30)')}
        {wave(130, 'rgba(142,152,162,0.35)')}
      </>}

      {category === 'hujan' && <>
        {rain}
        {wave(102, '#3A5560', 0.55)}
        {wave(126, '#2D4852', 0.65)}
      </>}

      {category === 'badai' && <>
        <circle cx={255} cy={38} r={56} fill="rgba(80,80,92,0.45)" />
        <circle cx={338} cy={55} r={48} fill="rgba(72,72,84,0.45)" />
        <circle cx={195} cy={52} r={42} fill="rgba(76,76,88,0.40)" />
        {rain}
        <polygon points="296,12 262,86 290,80 252,150 338,64 307,72" fill="#F5D030" />
      </>}

      {category === 'salju' && <>
        {[52,132,208,292,372,438,92,172,252,332,412].map((x, i) => (
          <text key={i} x={x} y={14 + (i % 5) * 30} fontSize="13"
            fill="rgba(255,255,255,0.45)" textAnchor="middle">❄</text>
        ))}
        {wave(114, 'rgba(200,215,228,0.35)')}
        {wave(135, 'rgba(185,200,215,0.40)')}
      </>}
    </svg>
  );
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
        <div className="w-full" style={{ minHeight: 0 }}>
          <ResponsiveContainer width="100%" height={224} minWidth={0}>
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
              <div className="-mx-1 mt-1" style={{ minHeight: 0 }}>
                <ResponsiveContainer width="100%" height={40} minWidth={0}>
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
      <div className="rounded-[28px] overflow-hidden">
        {weatherStatus === 'loading' && (
          <div className="bg-white dark:bg-[#13161A] p-5 rounded-[28px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">Mengambil data cuaca...</span>
          </div>
        )}
        {weatherStatus === 'denied' && (
          <div className="bg-white dark:bg-[#13161A] p-5 rounded-[28px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3">
            <MapPin size={18} className="text-gray-400" />
            <span className="text-xs text-gray-400">Izinkan akses lokasi untuk melihat cuaca</span>
          </div>
        )}
        {weatherStatus === 'error' && (
          <div className="bg-white dark:bg-[#13161A] p-5 rounded-[28px] border border-gray-100 dark:border-[#22272F] flex items-center gap-3">
            <Cloud size={18} className="text-gray-400" />
            <span className="text-xs text-gray-400">Cuaca tidak tersedia saat ini</span>
          </div>
        )}
        {weatherStatus === 'success' && weatherData && (() => {
          const { label, category } = getWeatherTheme(weatherData.code, weatherData.isDay);
          const isDay = weatherData.isDay;
          const bg = WEATHER_BG[category][isDay ? 'day' : 'night'];
          const bgIsGrad = bg.startsWith('linear');
          return (
            <div className="relative overflow-hidden rounded-[28px]" style={{ height: 168, ...(bgIsGrad ? { background: bg } : { backgroundColor: bg }) }}>
              <WeatherIllustration category={category} isDay={isDay} />
              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex justify-between items-start">
                  <span className="text-[13px] font-semibold text-white/90 drop-shadow">{label}</span>
                  <div className="text-right">
                    <div className="text-[32px] font-bold text-white leading-none drop-shadow">{format(new Date(), 'HH:mm')}</div>
                    <div className="text-[10px] text-white/70 mt-0.5">{format(new Date(), 'EEE MM-dd', { locale: enUS })}</div>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[52px] font-bold text-white leading-none drop-shadow">{weatherData.temp}°</span>
                  {locationName && <span className="text-[13px] font-semibold text-white/90 drop-shadow">{locationName}</span>}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
