import React from 'react';
import { StatsDetailModal } from './StatsDetailModal';
import { Transaction } from '../types';

interface StatsScreenProps {
  theme: string;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  CATEGORY_CONFIG: Record<string, { color: string; icon: any }>;
  categories: string[];
  categoryPieData: any[];
  transactions: Transaction[];
  selectedMonth: Date;
  formatCurrency: (n: number) => string;
  CustomTooltip: any;
  monthlyExpense: number;
  setTransactionToDelete: (t: Transaction | null) => void;
  handleEditClick: (t: Transaction) => void;
  handleToggleSettled: (t: Transaction) => void;
  revealedId: string | null;
  handleReveal: (id: string, isRevealed: boolean) => void;
  statsView: 'weekly' | 'daily';
  setStatsView: (v: 'weekly' | 'daily') => void;
  isCurrentMonth: boolean;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  hourlyData: any[];
  chartData: any[];
  monthlyChartData: any[];
  categoryChartData: any[];
  VariableRadiusSector: any;
  renderInsideLabels: any;
}

/**
 * StatsScreen wraps the existing StatsDetailModal in embedded mode.
 * Future: refactor StatsDetailModal into sub-components here.
 */
export function StatsScreen(props: StatsScreenProps) {
  return (
    <div className="space-y-8">
      <StatsDetailModal
        embedded
        {...props}
      />
    </div>
  );
}
