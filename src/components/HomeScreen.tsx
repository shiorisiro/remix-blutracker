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


      {/* Weather Widget - Rich Illustrated Card */}
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
          const isRain = category === 'hujan' || category === 'badai';
          const isCloudy = category === 'berawan' || category === 'berkabut' || category === 'cerah_berawan';
          const isSnow = category === 'salju';

          const skyGrad = isDay
            ? isRain ? 'from-[#4a5568] via-[#6b7280] to-[#9ca3af]'
              : isCloudy ? 'from-[#5B7FA6] via-[#7BA3C8] to-[#A8C5DE]'
              : 'from-[#1a7abf] via-[#3b9cd9] to-[#f97316]'
            : isRain ? 'from-[#1a1f2e] via-[#252d3d] to-[#374151]'
              : 'from-[#0a0e1a] via-[#111827] to-[#1e2942]';

          const groundColor = isDay
            ? isRain ? '#4a5568' : isSnow ? '#e2e8f0' : '#2d5a1b'
            : isRain ? '#1a2035' : isSnow ? '#c7d2e0' : '#1a2535';
          const houseColor = isDay ? '#c0392b' : '#8B1A1A';
          const roofColor = isDay ? '#922b21' : '#5D1010';
          const wallColor = isDay ? '#f5cba7' : '#d4a574';
          const windowColor = isDay ? '#f9e4b7' : '#ffd700';
          const treeColor = isDay ? (isRain ? '#2d5016' : '#27ae60') : '#1a3a1a';
          const treeTrunk = isDay ? '#795548' : '#4a2d1a';

          return (
            <div className="relative overflow-hidden rounded-[28px] h-[200px]">
              {/* Sky */}
              <div className={`absolute inset-0 bg-gradient-to-b ${skyGrad}`} />

              {/* Stars at night */}
              {!isDay && !isRain && (
                <div className="absolute inset-0 pointer-events-none">
                  {[[12,12],[28,8],[45,18],[62,6],[78,14],[90,22],[18,28],[55,10],[70,30],[85,8],[35,22],[50,32]].map(([x,y],i) => (
                    <div key={i} className="absolute rounded-full bg-white"
                      style={{ left:`${x}%`, top:`${y}%`, width: i%3===0?3:2, height: i%3===0?3:2, opacity: 0.5+i%4*0.1 }} />
                  ))}
                </div>
              )}

              {/* SUN — always for cerah, day OR night */}
              {category === 'cerah' && (
                <div className="absolute" style={{ right:'14%', top: isDay?'12%':'8%' }}>
                  <div className="absolute rounded-full" style={{ width:64, height:64,
                    background: isDay
                      ? 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
                    transform:'translate(-25%,-25%)' }} />
                  <div className="relative rounded-full" style={{ width:38, height:38,
                    background: isDay
                      ? 'radial-gradient(circle at 35% 35%, #fef08a, #fbbf24)'
                      : 'radial-gradient(circle at 35% 35%, #fde68a, #f59e0b)' }} />
                </div>
              )}

              {/* Moon — non-cerah night */}
              {!isDay && category !== 'cerah' && (
                <div className="absolute" style={{ right:'16%', top:'10%' }}>
                  <div className="relative" style={{ width:32, height:32 }}>
                    <div className="absolute inset-0 rounded-full bg-[#f5e6a3]" />
                    <div className="absolute rounded-full bg-[#1e2942]" style={{ width:26, height:26, top:-4, right:-4 }} />
                  </div>
                </div>
              )}

              {/* Clouds */}
              {(isCloudy || isRain) && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute" style={{ right:'8%', top:'18%' }}>
                    <div className="relative">
                      <div className="absolute rounded-full bg-white/80" style={{ width:48, height:30, top:8, left:0 }} />
                      <div className="absolute rounded-full bg-white/80" style={{ width:36, height:26, top:12, left:20 }} />
                      <div className="absolute rounded-full bg-white/90" style={{ width:32, height:22, top:0, left:10 }} />
                    </div>
                  </div>
                  <div className="absolute" style={{ right:'38%', top:'10%' }}>
                    <div className="relative">
                      <div className="absolute rounded-full bg-white/60" style={{ width:32, height:20, top:4, left:0 }} />
                      <div className="absolute rounded-full bg-white/60" style={{ width:22, height:18, top:0, left:8 }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Partly cloudy cloud */}
              {category === 'cerah_berawan' && (
                <div className="absolute" style={{ right:'6%', top:'22%' }}>
                  <div className="relative">
                    <div className="absolute rounded-full bg-white/70" style={{ width:44, height:28, top:6, left:0 }} />
                    <div className="absolute rounded-full bg-white/70" style={{ width:30, height:24, top:0, left:12 }} />
                  </div>
                </div>
              )}

              {/* Rain */}
              {isRain && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({length:14}).map((_,i) => (
                    <div key={i} className="absolute bg-blue-200/50 rounded-full"
                      style={{ width:1.5, height:10, left:`${8+i*6.5}%`, top:`${30+i%4*8}%`, transform:'rotate(15deg)' }} />
                  ))}
                </div>
              )}

              {/* Snow */}
              {isSnow && (
                <div className="absolute inset-0 pointer-events-none">
                  {[15,30,50,65,80].map((x,i) => (
                    <div key={i} className="absolute text-white/70 text-sm" style={{ left:`${x}%`, top:`${20+i*8}%` }}>❄</div>
                  ))}
                </div>
              )}

              {/* Ground */}
              <div className="absolute bottom-0 left-0 right-0"
                style={{ height:'45%', background: groundColor, borderRadius:'40% 40% 0 0' }} />

              {/* Trees left */}
              <svg className="absolute" style={{ bottom:'32%', left:'6%', width:28, height:55 }} viewBox="0 0 28 55">
                <rect x="11" y="38" width="6" height="17" fill={treeTrunk} />
                <polygon points="14,0 28,38 0,38" fill={treeColor} />
              </svg>
              <svg className="absolute" style={{ bottom:'32%', left:'18%', width:22, height:44 }} viewBox="0 0 22 44">
                <rect x="8" y="30" width="5" height="14" fill={treeTrunk} />
                <polygon points="11,0 22,30 0,30" fill={treeColor} />
              </svg>

              {/* House */}
              <svg className="absolute" style={{ bottom:'30%', left:'50%', transform:'translateX(-50%)', width:80, height:75 }} viewBox="0 0 80 75">
                <polygon points="40,2 76,32 4,32" fill={roofColor} />
                <rect x="8" y="31" width="64" height="44" fill={wallColor} />
                <rect x="30" y="52" width="20" height="23" rx="10" fill={isDay?'#8B6914':'#5a3e0a'} />
                <rect x="10" y="38" width="18" height="14" rx="2" fill={windowColor} />
                <rect x="52" y="38" width="18" height="14" rx="2" fill={windowColor} />
                <line x1="19" y1="38" x2="19" y2="52" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                <line x1="10" y1="45" x2="28" y2="45" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                <line x1="61" y1="38" x2="61" y2="52" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                <line x1="52" y1="45" x2="70" y2="45" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
              </svg>

              {/* Tree right */}
              <svg className="absolute" style={{ bottom:'32%', right:'6%', width:28, height:55 }} viewBox="0 0 28 55">
                <rect x="11" y="38" width="6" height="17" fill={treeTrunk} />
                <polygon points="14,0 28,38 0,38" fill={treeColor} />
              </svg>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-end justify-between">
                <div>
                  <div className="text-[42px] font-light text-white leading-none drop-shadow-lg">{weatherData.temp}°</div>
                  <div className="text-[11px] text-white/80 font-medium mt-1">{label}</div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-semibold text-white leading-tight drop-shadow">{format(new Date(), 'HH:mm')}</div>
                  <div className="text-[9px] text-white/70 uppercase tracking-widest mt-0.5">{format(new Date(), 'EEE, dd MMM', { locale: enUS })}</div>
                  {locationName && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <MapPin size={9} className="text-white/60" />
                      <span className="text-[9px] text-white/70">{locationName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
