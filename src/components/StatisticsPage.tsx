import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { format, parseISO, isSameMonth, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Transaction } from '../types';
import { cn } from '../lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#FF6B6B', 'Shopping': '#4ECDC4', 'Bensin': '#FFD93D',
  'Perbaikan': '#A29BFE', 'Entertainment': '#6C5CE7', 'General': '#95afc0',
  'Salary': '#10B981', 'Bonus': '#F59E0B',
};

const CustomTooltip = ({ active, payload, label, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500">{entry.name}:</span>
            <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface StatisticsPageProps {
  transactions: Transaction[];
  selectedMonth: Date;
  isCurrentMonth: boolean;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  formatCurrency: (amount: number) => string;
  theme: string;
}

export function StatisticsPage({ transactions, selectedMonth, isCurrentMonth, handlePrevMonth, handleNextMonth, formatCurrency, theme }: StatisticsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const weeklyChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return format(d, 'yyyy-MM-dd');
    });
    return last7Days.map(date => ({
      name: format(parseISO(date), 'EEE'),
      income: transactions.filter(t => t.type === 'income' && t.date === date).reduce((acc, t) => acc + t.amount, 0),
      expense: transactions.filter(t => t.type === 'expense' && t.date === date).reduce((acc, t) => acc + t.amount, 0),
    }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
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

  const categoryData = useMemo(() => {
    const cats = ['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'];
    return cats.map(cat => ({
      name: cat,
      value: transactions.filter(t => t.type === 'expense' && t.category === cat && isSameMonth(parseISO(t.date), selectedMonth)).reduce((acc, t) => acc + t.amount, 0)
    })).filter(item => item.value > 0);
  }, [transactions, selectedMonth]);

  const monthlyIncome = useMemo(() => transactions.filter(t => t.type === 'income' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((acc, t) => acc + t.amount, 0), [transactions, selectedMonth]);
  const monthlyExpense = useMemo(() => transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), selectedMonth)).reduce((acc, t) => acc + t.amount, 0), [transactions, selectedMonth]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090B]">
      <header className="bg-[#FFFFFF] dark:bg-[#0D0F12] p-6 border-b border-gray-100 dark:border-[#22272F]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Statistik</h2>
        <div className="flex items-center justify-between bg-[#F8FAFC] dark:bg-[#08090B] rounded-full px-4 py-2 border border-gray-100 dark:border-[#22272F]">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:hover:bg-[#14181E] text-gray-500 dark:text-gray-300 rounded-full transition-colors">
            <ArrowDownLeft size={16} className="rotate-45" />
          </button>
          <div className="text-sm font-bold text-gray-800 dark:text-white tracking-widest uppercase">{format(selectedMonth, 'MMMM yyyy', { locale: id })}</div>
          <button onClick={handleNextMonth} disabled={isCurrentMonth} className={cn("p-1 rounded-full transition-colors", isCurrentMonth ? "opacity-30 text-gray-400" : "hover:bg-white dark:hover:bg-[#14181E] text-gray-500 dark:text-gray-300")}>
            <ArrowUpRight size={16} className="rotate-45" />
          </button>
        </div>
      </header>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center"><ArrowDownLeft size={16} className="text-emerald-500" /></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pemasukan</span>
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="bg-white dark:bg-[#13161A] p-4 rounded-[24px] border border-gray-100 dark:border-[#22272F]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center justify-center"><ArrowUpRight size={16} className="text-red-500" /></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pengeluaran</span>
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(monthlyExpense)}</p>
          </div>
        </div>

        <section className="bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F]">
          <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">7 Hari Terakhir</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#22272F' : '#F1F5F9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                <Bar dataKey="income" fill={theme === 'dark' ? '#CFFF0F' : '#65A30D'} radius={[4, 4, 0, 0]} barSize={10} />
                <Bar dataKey="expense" fill={theme === 'dark' ? '#FF5E5E' : '#DC2626'} radius={[4, 4, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F]">
          <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Saldo Bulan Ini</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs><linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#CFFF0F" stopOpacity={0.3}/><stop offset="95%" stopColor="#CFFF0F" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#22272F' : '#F1F5F9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                <Area type="monotone" dataKey="balance" stroke="#CFFF0F" fill="url(#colorBalance)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F]">
          <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Distribusi Kategori</h3>
          <div className="h-64 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#95afc0'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm">Belum ada data pengeluaran</p>}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#95afc0' }} />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-[#13161A] p-6 rounded-[32px] border border-gray-100 dark:border-[#22272F]">
          <h3 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Rincian per Kategori</h3>
          <div className="space-y-3">
            {categoryData.map(cat => {
              const pct = Math.round((cat.value / (monthlyExpense || 1)) * 100);
              return (
                <div key={cat.name} className="flex justify-between items-center p-3 bg-[#F8FAFC] dark:bg-[#08090B] rounded-2xl border border-gray-100 dark:border-[#22272F]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#95afc0' }} />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">{formatCurrency(cat.value)}</span>
                    <span className="text-[10px] text-gray-400 ml-2">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
