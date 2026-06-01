
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';
import { formatCurrency } from '@/utils/transactionUtils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';

interface DashboardStatCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  hideValues: boolean;
  isLoading?: boolean;
  onNavigateToTransactionType: (type: 'income' | 'expense') => void;
}

const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({
  totalIncome,
  totalExpenses,
  balance,
  hideValues,
  isLoading = false,
  onNavigateToTransactionType
}) => {
  const { t, currency } = usePreferences();
  
  const renderHiddenValue = () => '******';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
      variants={itemVariants}
    >
      {/* Card do Saldo */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="relative overflow-hidden border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-primary via-primary/90 to-primary/75">
          <CardContent className="p-4 lg:p-6">
            <div className="text-center text-white relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-white/20">
                  <Wallet className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <p className="text-xs lg:text-sm font-medium opacity-90">{t('stats.currentBalance')}</p>
              </div>
              <p className="text-xl lg:text-2xl xl:text-3xl font-bold">
                {hideValues ? renderHiddenValue() : formatCurrency(balance, currency)}
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 lg:w-16 lg:h-16 bg-white/10 rounded-full" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Card de Receita */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className="relative overflow-hidden border border-primary/15 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-primary/[0.06] dark:bg-primary/10" 
          onClick={() => onNavigateToTransactionType('income')}
        >
          <CardContent className="p-4 lg:p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-primary/15">
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-primary">
                  {t('common.income')}
                </p>
              </div>
              <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-primary">
                {hideValues ? renderHiddenValue() : formatCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-full" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Card de Despesa */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className="sm:col-span-2 lg:col-span-1"
      >
        <Card 
          className="relative overflow-hidden border border-destructive/15 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-destructive/[0.06] dark:bg-destructive/10" 
          onClick={() => onNavigateToTransactionType('expense')}
        >
          <CardContent className="p-4 lg:p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-destructive/15">
                  <TrendingDown className="h-4 w-4 lg:h-5 lg:w-5 text-destructive" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-destructive">
                  {t('common.expense')}
                </p>
              </div>
              <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-destructive">
                {hideValues ? renderHiddenValue() : formatCurrency(totalExpenses, currency)}
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 lg:w-16 lg:h-16 bg-destructive/10 rounded-full" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DashboardStatCards;
