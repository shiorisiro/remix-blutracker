import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutGrid, ArrowDownLeft, PieChart as PieChartIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, Activity, Wallet, X } from 'lucide-react';
import { format, parseISO, isSameMonth, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, subDays, eachWeekOfInterval, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, ComposedChart } from 'recharts';
import { Transaction } from '../types';
import { TransactionItem } from './TransactionItem';
import { cn } from '../lib/utils';

export function StatsDetailModal({
  setIsStatsDetailOpen,
  selectedCategory,
  setSelectedCategory,
  CATEGORY_CONFIG,
  categoryPieData,
  transactions,
  selectedMonth,
  formatCurrency,
  CustomTooltip,
  monthlyExpense,
  setTransactionToDelete,
  handleEditClick,
  handleToggleSettled,
  revealedId,
  handleReveal,
  statsView,
  setStatsView,
  isCurrentMonth,
  handlePrevMonth,
  handleNextMonth,
  hourlyData,
  chartData,
  monthlyChartData,
  categoryChartData,
  VariableRadiusSector,
  renderInsideLabels
}: any) {

  // === DATA LOGIC YANG DIPERBAIKI ===

  // 1. Data Ringkasan Pengeluaran (Line Chart per kategori sepanjang bulan)
  const monthlyCategoryLineData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = isCurrentMonth ? new Date() : endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData: any = { name: format(day, 'd') };

      // Hitung total per kategori untuk hari ini
      ['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'].forEach(cat => {
        const amount = transactions
          .filter(t => t.type === 'expense' && t.category === cat && t.date === dateStr)
          .reduce((acc, t) => acc + t.amount, 0);
        dayData[cat] = amount;
      });

      return dayData;
    });
  }, [transactions, selectedMonth, isCurrentMonth]);

  // 2. Data Perbandingan Mingguan -> sekarang berdasarkan BULAN yang dipilih
  const monthlyWeeklyComparisonData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = isCurrentMonth ? new Date() : endOfMonth(selectedMonth);

    // Ambil semua minggu dalam bulan yang dipilih
    const weeks = eachWeekOfInterval(
      { start, end },
      { weekStartsOn: 1 } // Senin
    );

    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const actualEnd = weekEnd > end ? end : weekEnd;

      const weekIncome = transactions
        .filter(t => {
          if (t.type !== 'income') return false;
          const tDate = parseISO(t.date);
          return isWithinInterval(tDate, { start: weekStart, end: actualEnd });
        })
        .reduce((acc, t) => acc + t.amount, 0);

      const weekExpense = transactions
        .filter(t => {
          if (t.type !== 'expense') return false;
          const tDate = parseISO(t.date);
          return isWithinInterval(tDate, { start: weekStart, end: actualEnd });
        })
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        name: `Mg ${index + 1}`,
        income: weekIncome,
        expense: weekExpense,
      };
    });
  }, [transactions, selectedMonth, isCurrentMonth]);

  // 3. Data hourly yang responsif terhadap selectedMonth (untuk hari ini saja)
  const selectedMonthHourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const today = format(new Date(), 'yyyy-MM-dd');

    return hours.map(hour => {
      const hourInt = parseInt(hour.split(':')[0]);
      const amount = transactions
        .filter(t => {
          if (t.type !== 'expense' || !t.time) return false;
          if (selectedCategory && t.category !== selectedCategory) return false;
          const tHour = parseInt(t.time.split(':')[0]);
          return tHour === hourInt && t.date === today;
        })
        .reduce((acc, t) => acc + t.amount, 0);

      return { name: hour, amount };
    });
  }, [transactions, selectedCategory]);

  // Warna kategori untuk line chart
  const categoryColors: Record<string, string> = {
    'Food': '#FF6B6B',
    'Shopping': '#4ECDC4', 
    'Bensin': '#FFD93D',
    'Perbaikan': '#A29BFE',
    'Entertainment': '#6C5CE7',
    'General': '#95afc0',
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-[#F8FAFC] dark:bg-[#08090B] z-[150] flex flex-col"
    >
      <header className="p-6 bg-[#FFFFFF] dark:bg-[#0D0F12] border-b border-gray-100 dark:border-[#22272F] flex flex-col gap-4 transition-colors duration-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-2 bg-gray-100 dark:bg-[#14181E] text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-[#1a1f28] transition-colors"
              >
                <ArrowDownLeft className="rotate-45" size={18} />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {selectedCategory ? `Statistik ${selectedCategory}` : 'Detail Statistik'}
            </h2>
          </div>
          <button 
            onClick={() => {
              setIsStatsDetailOpen(false);
              setSelectedCategory(null);
            }}
            className="p-2 bg-gray-100 dark:bg-[#14181E] text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-[#1a1f28] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Month Picker for Stats */}
        <div className="flex items-center justify-between bg-[#F8FAFC] dark:bg-[#08090B] rounded-full px-4 py-2 border border-gray-100 dark:border-[#22272F]">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:hover:bg-[#14181E] text-gray-500 dark:text-gray-300 rounded-full transition-colors">
            <ArrowDownLeft size={16} className="rotate-45" />
          </button>
          <div className="text-sm font-bold text-gray-800 dark:text-white tracking-widest uppercase font-display">
            {format(selectedMonth, 'MMMM yyyy', { locale: id })}
          </div>
          <button 
            onClick={handleNextMonth} 
            disabled={isCurrentMonth}
            className={cn("p-1 rounded-full transition-colors", isCurrentMonth ? "opacity-30 text-gray-400" : "hover:bg-white dark:hover:bg-[#14181E] text-gray-500 dark:text-gray-300")}
          >
            <ArrowUpRight size={16} className="rotate-45" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {!selectedCategory ? (
          <>
            {/* === RINGKASAN PENGELUARAN: LINE CHART === */}
            <section className="bg-[#FFFFFF] dark:bg-[#13161A] p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-[#22272F] transition-colors duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">
                  {statsView === 'daily' && isCurrentMonth ? 'Pengeluaran Hari Ini (Per Jam)' : 'Pengeluaran Bulanan'}
                </h3>
                <div className="flex p-1 bg-gray-100 dark:bg-[#14181E] rounded-xl">
                  <button 
                    onClick={() => setStatsView('weekly')}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                      statsView === 'weekly' ? "bg-white dark:bg-[#0D0F12] text-gray-950 dark:text-[#CFFF0F] shadow-sm" : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    Bulanan
                  </button>
                  {isCurrentMonth && (
                    <button 
                      onClick={() => setStatsView('daily')}
                      className={cn(
                        "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                        statsView === 'daily' ? "bg-white dark:bg-[#0D0F12] text-gray-950 dark:text-[#CFFF0F] shadow-sm" : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      Hari Ini
                    </button>
                  )}
                </div>
              </div>

              {statsView === 'daily' && isCurrentMonth ? (
                /* === MODE HARI INI: Area Chart per jam === */
                <div className="space-y-6">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedMonthHourlyData} tabIndex={-1}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#CFFF0F" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#CFFF0F" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#22272F" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 8, fill: '#9ca3af' }}
                          interval={3}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#CFFF0F" 
                          fillOpacity={1} 
                          fill="url(#colorAmount)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">Pengeluaran per Kategori (Hari Ini)</h4>
                    <div className="space-y-3">
                      {['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'].map(cat => {
                        const today = format(new Date(), 'yyyy-MM-dd');
                        const amount = transactions
                          .filter(t => t.type === 'expense' && t.category === cat && t.date === today)
                          .reduce((acc, t) => acc + t.amount, 0);
                        if (amount === 0) return null;
                        return (
                          <div key={cat} className="flex justify-between items-center p-3 bg-[#F8FAFC] dark:bg-[#08090B] rounded-2xl border border-gray-100 dark:border-[#22272F]">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{cat}</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white">{formatCurrency(amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* === MODE BULANAN: Line Chart per kategori === */
                <div className="space-y-6">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyCategoryLineData} tabIndex={-1}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#22272F" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fill: '#9ca3af' }}
                          interval={Math.floor(monthlyCategoryLineData.length / 7)}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} />
                        {['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'].map(cat => (
                          <Line
                            key={cat}
                            type="monotone"
                            dataKey={cat}
                            stroke={categoryColors[cat]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 3 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend Kategori */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'].map(cat => {
                      const total = transactions
                        .filter(t => t.type === 'expense' && t.category === cat && isSameMonth(parseISO(t.date), selectedMonth))
                        .reduce((acc, t) => acc + t.amount, 0);
                      if (total === 0) return null;
                      return (
                        <div key={cat} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{cat}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ringkasan Total per Kategori */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">Total per Kategori - {format(selectedMonth, 'MMMM yyyy', { locale: id })}</h4>
                    <div className="space-y-2">
                      {['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'].map(cat => {
                        const total = transactions
                          .filter(t => t.type === 'expense' && t.category === cat && isSameMonth(parseISO(t.date), selectedMonth))
                          .reduce((acc, t) => acc + t.amount, 0);
                        if (total === 0) return null;
                        const percentage = Math.round((total / (monthlyExpense || 1)) * 100);
                        return (
                          <div key={cat} className="flex justify-between items-center p-3 bg-[#F8FAFC] dark:bg-[#08090B] rounded-2xl border border-gray-100 dark:border-[#22272F]">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{cat}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-gray-800 dark:text-white">{formatCurrency(total)}</span>
                              <span className="text-[10px] text-gray-400 ml-2">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* === PERBANDINGAN MINGGUAN: BERDASARKAN BULAN YANG DIPILIH === */}
            <section className="bg-[#FFFFFF] dark:bg-[#13161A] p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-[#22272F] transition-colors duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">
                  Perbandingan Mingguan - {format(selectedMonth, 'MMMM yyyy', { locale: id })}
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyWeeklyComparisonData} tabIndex={-1}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#22272F" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" fill="#CFFF0F" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="expense" fill="#FF5E5E" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* === ANALISIS SALDO & ARUS KAS: LINE CHART BULANAN === */}
            <section className="bg-[#FFFFFF] dark:bg-[#13161A] p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-[#22272F] transition-colors duration-200">
              <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display mb-4">
                Analisis Saldo & Arus Kas - {format(selectedMonth, 'MMMM yyyy', { locale: id })}
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyChartData} tabIndex={-1}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CFFF0F" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#CFFF0F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#22272F" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      interval={Math.floor(monthlyChartData.length / 7)}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#CFFF0F" 
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
                <div className="flex items-center gap-1.5">
                  <Wallet size={10} className="text-[#CFFF0F]" />
                  <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Saldo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowDownLeft size={10} className="text-[#10b981]" />
                  <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Masuk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight size={10} className="text-[#ef4444]" />
                  <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Keluar</span>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* === KATEGORI TERPILIH === */}
            <section className="bg-[#FFFFFF] dark:bg-[#13161A] p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-[#22272F] transition-colors duration-200">
              <div className="flex flex-col space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">
                    {statsView === 'daily' 
                      ? `Pengeluaran Per Jam (${selectedCategory})` 
                      : `Pengeluaran Harian ${selectedCategory}`}
                  </h3>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {statsView === 'daily' ? 'Total Hari Ini' : 'Total Minggu Ini'}
                    </p>
                    <p className="font-bold text-gray-950 dark:text-[#CFFF0F]">
                      {statsView === 'daily'
                        ? formatCurrency(selectedMonthHourlyData.reduce((acc, d) => acc + d.amount, 0))
                        : formatCurrency(categoryChartData.reduce((acc, d) => acc + d.amount, 0))}
                    </p>
                  </div>
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-[#14181E] rounded-xl self-start">
                  <button 
                    onClick={() => setStatsView('weekly')}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                      statsView === 'weekly' ? "bg-white dark:bg-[#0D0F12] text-gray-950 dark:text-[#CFFF0F] shadow-sm" : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    Mingguan
                  </button>
                  <button 
                    onClick={() => setStatsView('daily')}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                      statsView === 'daily' ? "bg-white dark:bg-[#0D0F12] text-gray-950 dark:text-[#CFFF0F] shadow-sm" : "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    Hari Ini
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {statsView === 'daily' ? (
                    <AreaChart data={selectedMonthHourlyData} tabIndex={-1}>
                      <defs>
                        <linearGradient id="colorAmountCat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#CFFF0F" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#CFFF0F" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#22272F" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 8, fill: '#9ca3af' }}
                        interval={3}
                      />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#CFFF0F" 
                        fillOpacity={1} 
                        fill="url(#colorAmountCat)" 
                        strokeWidth={3}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={categoryChartData} tabIndex={-1}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#22272F" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#CFFF0F" radius={[8, 8, 0, 0]} barSize={30} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">Transaksi {selectedCategory} Terakhir</h3>
              <div className="space-y-3">
                {transactions
                  .filter(t => t.category === selectedCategory)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map(t => (
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
                  ))}
              </div>
            </section>
          </>
        )}
      </div>
    </motion.div>
  );
}
