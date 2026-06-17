import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutGrid, ArrowDownLeft, PieChart as PieChartIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, Activity, Wallet, X } from 'lucide-react';
import { format, parseISO, isSameMonth, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
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
  return (
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
                  {selectedCategory && (
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <ArrowDownLeft className="rotate-45" size={18} />
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedCategory ? `Statistik ${selectedCategory}` : 'Detail Statistik'}
                  </h2>
                </div>
                <button 
                  onClick={() => {
                    setIsStatsDetailOpen(false);
                    setSelectedCategory(null);
                  }}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Month Picker for Stats */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950 rounded-full px-4 py-2 border border-gray-100 dark:border-gray-800">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:bg-gray-900 text-gray-500 rounded-full transition-colors">
                  <ArrowDownLeft size={16} className="rotate-45" />
                </button>
                <div className="text-sm font-bold text-gray-700 tracking-widest uppercase">
                  {format(selectedMonth, 'MMMM yyyy', { locale: id })}
                </div>
                <button 
                  onClick={handleNextMonth} 
                  disabled={isCurrentMonth}
                  className={cn("p-1 rounded-full transition-colors", isCurrentMonth ? "opacity-30 text-gray-400" : "hover:bg-white dark:bg-gray-900 text-gray-500")}
                >
                  <ArrowUpRight size={16} className="rotate-45" />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {!selectedCategory ? (
                <>
                  <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">Ringkasan Pengeluaran</h3>
                      <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button 
                          onClick={() => setStatsView('weekly')}
                          className={cn(
                            "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                            statsView === 'weekly' ? "bg-white dark:bg-gray-900 text-blu-primary shadow-sm" : "text-gray-500"
                          )}
                        >
                          Bulanan
                        </button>
                        {isCurrentMonth && (
                          <button 
                            onClick={() => setStatsView('daily')}
                            className={cn(
                              "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                              statsView === 'daily' ? "bg-white dark:bg-gray-900 text-blu-primary shadow-sm" : "text-gray-500"
                            )}
                          >
                            Hari Ini
                          </button>
                        )}
                      </div>
                    </div>

                    {statsView === 'daily' && isCurrentMonth ? (
                      <div className="space-y-6">
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} tabIndex={-1}>
                              <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00AEEF" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#00AEEF" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
                                stroke="#00AEEF" 
                                fillOpacity={1} 
                                fill="url(#colorAmount)" 
                                strokeWidth={3}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pengeluaran per Kategori (Hari Ini)</h4>
                          <div className="space-y-3">
                            {['Food', 'Shopping', 'Bensin', 'Perbaikan', 'Entertainment', 'General'].map(cat => {
                              const today = format(new Date(), 'yyyy-MM-dd');
                              const amount = transactions
                                .filter(t => t.type === 'expense' && t.category === cat && t.date === today)
                                .reduce((acc, t) => acc + t.amount, 0);
                              if (amount === 0) return null;
                              return (
                                <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl">
                                  <span className="text-sm font-medium text-gray-600">{cat}</span>
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatCurrency(amount)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="relative h-80 w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart tabIndex={-1}>
                              {/* Center clickable area for Total */}
                              <Pie
                                data={[{ name: 'Total Pengeluaran', value: monthlyExpense }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={40}
                                dataKey="value"
                                stroke="none"
                                fill="transparent"
                                isAnimationActive={false}
                                tabIndex={-1}
                              >
                                <Cell key="center" fill="transparent" />
                              </Pie>

                              <Pie
                                data={categoryPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                labelLine={false}
                                stroke="none"
                                shape={VariableRadiusSector}
                                tabIndex={-1}
                              >
                                {categoryPieData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={CATEGORY_CONFIG[entry.name]?.color || '#00AEEF'}
                                    className="outline-none"
                                  />
                                ))}
                              </Pie>
                              
                              {/* Labels Layer */}
                              <Pie
                                data={categoryPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                label={renderInsideLabels}
                                labelLine={false}
                                stroke="none"
                                fill="transparent"
                                isAnimationActive={false}
                                pointerEvents="none"
                              />

                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Legend Section */}
                        <div className="grid grid-cols-3 gap-x-3 gap-y-6 mt-8 px-4 w-full">
                          {categoryPieData.map((entry, index) => {
                            const Icon = CATEGORY_CONFIG[entry.name]?.icon || LayoutGrid;
                            const percentage = Math.round((entry.value / (monthlyExpense || 1)) * 100);
                            return (
                              <div key={index} className="flex items-center gap-2">
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center relative shrink-0"
                                  style={{ backgroundColor: `${CATEGORY_CONFIG[entry.name]?.color}15` }}
                                >
                                  <Icon size={18} style={{ color: CATEGORY_CONFIG[entry.name]?.color }} />
                                  <span 
                                    className="absolute top-1 right-1 text-[7px] font-black leading-none" 
                                    style={{ color: CATEGORY_CONFIG[entry.name]?.color }}
                                  >
                                    {percentage}%
                                  </span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-none truncate">
                                    {entry.name}
                                  </span>
                                  <span className="text-[9px] font-black text-gray-800 dark:text-gray-100 leading-none mt-1.5">
                                    {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(entry.value)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Perbandingan Mingguan</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} tabIndex={-1}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis hide />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="income" fill="#00AEEF" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="expense" fill="#FFD700" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Analisis Saldo & Arus Kas</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={monthlyChartData} tabIndex={-1}>
                          <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00AEEF" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#00AEEF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
                            stroke="#00AEEF" 
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
                        <Wallet size={10} className="text-[#00AEEF]" />
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Saldo</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowDownLeft size={10} className="text-[#10b981]" />
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Masuk</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight size={10} className="text-[#ef4444]" />
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Keluar</span>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col space-y-4 mb-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">
                          {statsView === 'daily' 
                            ? `Pengeluaran Per Jam (${selectedCategory})` 
                            : `Pengeluaran Harian ${selectedCategory}`}
                        </h3>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {statsView === 'daily' ? 'Total Hari Ini' : 'Total Minggu Ini'}
                          </p>
                          <p className="font-bold text-blu-primary">
                            {statsView === 'daily'
                              ? formatCurrency(hourlyData.reduce((acc, d) => acc + d.amount, 0))
                              : formatCurrency(categoryChartData.reduce((acc, d) => acc + d.amount, 0))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex p-1 bg-gray-100 rounded-xl self-start">
                        <button 
                          onClick={() => setStatsView('weekly')}
                          className={cn(
                            "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                            statsView === 'weekly' ? "bg-white dark:bg-gray-900 text-blu-primary shadow-sm" : "text-gray-500"
                          )}
                        >
                          Mingguan
                        </button>
                        <button 
                          onClick={() => setStatsView('daily')}
                          className={cn(
                            "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                            statsView === 'daily' ? "bg-white dark:bg-gray-900 text-blu-primary shadow-sm" : "text-gray-500"
                          )}
                        >
                          Hari Ini
                        </button>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {statsView === 'daily' ? (
                          <AreaChart data={hourlyData} tabIndex={-1}>
                            <defs>
                              <linearGradient id="colorAmountCat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00AEEF" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00AEEF" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
                              stroke="#00AEEF" 
                              fillOpacity={1} 
                              fill="url(#colorAmountCat)" 
                              strokeWidth={3}
                            />
                          </AreaChart>
                        ) : (
                          <BarChart data={categoryChartData} tabIndex={-1}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="amount" fill="#00AEEF" radius={[8, 8, 0, 0]} barSize={30} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Transaksi {selectedCategory} Terakhir</h3>
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