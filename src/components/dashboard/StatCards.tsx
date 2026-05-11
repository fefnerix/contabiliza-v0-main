
import React from 'react';
import StatCard from '../common/StatCard';
import { formatCurrency, calculateTotalIncome, calculateTotalExpenses } from '@/utils/transactionUtils';
import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppContext } from '@/contexts/AppContext';

interface StatCardsProps {
  transactions: any[];
}

const StatCards: React.FC<StatCardsProps> = ({ transactions }) => {
  const { currency, t } = usePreferences();
  const { goals } = useAppContext();
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const balance = totalIncome - totalExpenses;
  
  // Calculate goal progress percentage (all goals combined)
  const totalGoalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalGoalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const goalPercentage = totalGoalTarget > 0 
    ? Math.round((totalGoalCurrent / totalGoalTarget) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title={t('stats.currentBalance')}
        value={formatCurrency(balance, currency)}
        icon={<Wallet className="h-4 w-4 text-primary-foreground" />}
        className="border-none bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-md hover:shadow-lg transition-all"
      />
      <StatCard
        title={t('stats.totalIncome')}
        value={formatCurrency(totalIncome, currency)}
        icon={<TrendingUp className="h-4 w-4 text-white" />}
        className="border-none bg-gradient-to-br from-chart-1 to-primary/80 text-white shadow-md hover:shadow-lg transition-all"
      />
      <StatCard
        title={t('stats.totalExpenses')}
        value={formatCurrency(totalExpenses, currency)}
        icon={<TrendingDown className="h-4 w-4 text-destructive-foreground" />}
        className="border-none bg-gradient-to-br from-destructive to-destructive/85 text-destructive-foreground shadow-md hover:shadow-lg transition-all"
      />
      <StatCard
        title={t('stats.goalProgress')}
        value={`${goalPercentage}%`}
        icon={<Target className="h-4 w-4 text-white" />}
        className="border-none bg-gradient-to-br from-chart-3 to-chart-5 text-white shadow-md hover:shadow-lg transition-all"
        change={goalPercentage > 0 ? {
          value: goalPercentage,
          isPositive: true
        } : undefined}
      />
    </div>
  );
};

export default StatCards;
