
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, createLocalDate, toTransactionAmount } from '@/utils/transactionUtils';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { calculateCategorySummaries } from '@/utils/transactionUtils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { chartStroke, piePalette, chartColorVars } from '@/lib/chart-theme';

interface DashboardChartsProps {
  currentMonth?: Date;
  hideValues?: boolean;
  monthTransactions?: any[]; // NEW: Accept month-specific transactions
}

// Generate chart data from the actual transaction data
const generateChartData = (transactions: any[], month: Date) => {
  // Create a map to group transactions by day
  const transactionsByDay = new Map();
  
  // Initialize with all days in the month
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(month.getFullYear(), month.getMonth(), i);
    transactionsByDay.set(i, {
      day: i,
      income: 0,
      expenses: 0,
      dateLabel: `${i}/${month.getMonth() + 1}`
    });
  }
  
  // Fill with actual transaction data
  transactions.forEach(transaction => {
    const transactionDate = createLocalDate(transaction.date);
    const day = transactionDate.getDate();
    
    // Skip if not from the current month
    if (transactionDate.getMonth() !== month.getMonth() || 
        transactionDate.getFullYear() !== month.getFullYear()) {
      return;
    }
    
    const dayData = transactionsByDay.get(day) || {
      day,
      income: 0, 
      expenses: 0,
      dateLabel: `${day}/${month.getMonth() + 1}`
    };
    
    if (transaction.type === 'income') {
      dayData.income += toTransactionAmount(transaction.amount);
    } else {
      dayData.expenses += toTransactionAmount(transaction.amount);
    }
    
    transactionsByDay.set(day, dayData);
  });
  
  // Convert map to array and calculate balance
  const result = Array.from(transactionsByDay.values());
  result.forEach(item => {
    item.balance = item.income - item.expenses;
  });
  
  // Sort by day
  result.sort((a, b) => a.day - b.day);
  
  // If we have too many days, reduce by grouping
  if (daysInMonth > 10) {
    const condensedData = [];
    const step = Math.ceil(daysInMonth / 10);
    
    for (let i = 0; i < daysInMonth; i += step) {
      const group = result.slice(i, i + step);
      if (group.length > 0) {
        const groupData = {
          day: group[0].day,
          dateLabel: `${group[0].day}-${group[group.length - 1].day}/${month.getMonth() + 1}`,
          income: group.reduce((sum, item) => sum + item.income, 0),
          expenses: group.reduce((sum, item) => sum + item.expenses, 0),
          balance: group.reduce((sum, item) => sum + item.balance, 0)
        };
        condensedData.push(groupData);
      }
    }
    
    return condensedData;
  }
  
  return result;
};

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  currentMonth = new Date(), 
  hideValues = false,
  monthTransactions 
}) => {
  const { filteredTransactions } = useAppContext();
  const { currency, t } = usePreferences();
  
  // Use monthTransactions if provided, otherwise fall back to filteredTransactions
  const transactionsToUse = monthTransactions || filteredTransactions;
  const expenseSummaries = calculateCategorySummaries(transactionsToUse, 'expense');
  
  // Generate data for the current month using the provided transactions
  const monthData = generateChartData(transactionsToUse, currentMonth);
  const monthName = format(currentMonth, 'MMMM', { locale: pt });
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'income' 
                ? t('common.income') 
                : entry.name === 'expenses' 
                  ? t('common.expense')
                  : t('common.balance')}: {
                    hideValues 
                      ? '******' 
                      : formatCurrency(entry.value, currency)
                  }
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  const PieCategoryLegend = ({
    items,
  }: {
    items: ReturnType<typeof calculateCategorySummaries>;
  }) => (
    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.category} className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: piePalette[index % piePalette.length] }}
          />
          <span className="truncate" title={item.category}>
            {item.category}{' '}
            <span className="tabular-nums text-muted-foreground/90">({item.percentage}%)</span>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Income/Expense Chart */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.incomeVsExpenses')} - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthData}
                  margin={{ top: 12, right: 10, left: 4, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStroke.grid} opacity={0.6} vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: chartColorVars.axis }}
                    tickMargin={10}
                    angle={-32}
                    textAnchor="end"
                    height={52}
                    interval={0}
                  />
                  <YAxis
                    width={58}
                    tick={{ fontSize: 11, fill: chartColorVars.axis }}
                    tickMargin={6}
                    axisLine={false}
                    domain={[0, 'auto']}
                    tickFormatter={(value) =>
                      hideValues
                        ? '***'
                        : formatCurrency(value, currency).split('.')[0]
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 4 }} iconType="line" />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    name={t('common.income')} 
                    stroke={chartStroke.income} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    name={t('common.expense')} 
                    stroke={chartStroke.expense} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories Pie Chart */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.expenseBreakdown')} - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[18rem] flex-col items-stretch justify-center">
              {expenseSummaries.length > 0 ? (
                <>
                  <div className="min-h-0 w-full flex-1 basis-[11rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                        <Pie
                          data={expenseSummaries}
                          cx="50%"
                          cy="50%"
                          innerRadius="52%"
                          outerRadius="72%"
                          paddingAngle={2}
                          dataKey="amount"
                          nameKey="category"
                          label={false}
                          strokeWidth={0}
                        >
                          {expenseSummaries.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={piePalette[index % piePalette.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            hideValues
                              ? '******'
                              : formatCurrency(Number(value), currency)
                          }
                          labelFormatter={(_, payload) =>
                            (payload?.[0]?.payload as { category?: string })?.category ?? ''
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <PieCategoryLegend items={expenseSummaries} />
                </>
              ) : (
                <p className="text-muted-foreground">{t('common.noData')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
