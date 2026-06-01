import { Transaction, TimeRange } from '../types';
import { getIntlLocale } from '@/utils/locale';

/** Valores monetários vindos do Supabase (numeric) chegam como string em runtime. */
export function toTransactionAmount(amount: unknown): number {
  const n = Number(amount);
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------------------------------------------ */
/* Preferências salvas (com fallbacks seguros)                         */
/* ------------------------------------------------------------------ */

const getSavedLanguage = (): 'pt' | 'en' | 'es' => {
  try {
    const v =
      typeof window !== 'undefined'
        ? (localStorage.getItem('language') as 'pt' | 'en' | 'es' | null)
        : null;
    return v === 'pt' || v === 'en' || v === 'es' ? v : 'es'; // default ES
  } catch {
    return 'es';
  }
};

const getSavedCurrency = (): string => {
  try {
    const v = typeof window !== 'undefined' ? localStorage.getItem('currency') : null;
    return v || 'USD'; // default USD
  } catch {
    return 'USD';
  }
};

/* ------------------------------------------------------------------ */
/* Datas utilitárias (sempre zerando horário)                          */
/* ------------------------------------------------------------------ */

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getYesterdayStart = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
};

const getDaysAgoStart = (days: number) => {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  daysAgo.setHours(0, 0, 0, 0);
  return daysAgo;
};

/* ------------------------------------------------------------------ */
/* Parsing de datas (evita offset de timezone em YYYY-MM-DD)           */
/* ------------------------------------------------------------------ */

/** Data de calendário local (sem deslocar dia por UTC). Aceita YYYY-MM-DD ou ISO com prefixo YYYY-MM-DD. */
/** Ordena por fecha DESC y, a igualdad, created_at DESC. */
export const sortTransactionsByDateDesc = (transactions: Transaction[]): Transaction[] => {
  return [...transactions].sort((a, b) => {
    const dateDiff =
      createLocalDate(b.date).getTime() - createLocalDate(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bCreated - aCreated;
  });
};

export const createLocalDate = (dateInput: string | Date | null | undefined): Date => {
  if (dateInput == null) return new Date(NaN);
  if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  const dateString = String(dateInput);
  const ymd = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (ymd) {
    const [year, month, day] = ymd[1].split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return new Date(NaN);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

/* ------------------------------------------------------------------ */
/* Filtros por período                                                 */
/* ------------------------------------------------------------------ */

export const filterTransactionsByTimeRange = (
  transactions: Transaction[],
  timeRange: TimeRange,
  customStartDate?: Date,
  customEndDate?: Date
): Transaction[] => {
  const sortedTransactions = sortTransactionsByDateDesc(transactions);

  const now = new Date();
  now.setHours(23, 59, 59, 999); // fim de hoje

  switch (timeRange) {
    case 'today': {
      const todayStart = getTodayStart();
      return sortedTransactions.filter(
        (t) => createLocalDate(t.date) >= todayStart && createLocalDate(t.date) <= now
      );
    }
    case 'yesterday': {
      const yesterdayStart = getYesterdayStart();
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return sortedTransactions.filter(
        (t) => createLocalDate(t.date) >= yesterdayStart && createLocalDate(t.date) <= yesterdayEnd
      );
    }
    case '7days': {
      const sevenDaysAgo = getDaysAgoStart(7);
      return sortedTransactions.filter(
        (t) => createLocalDate(t.date) >= sevenDaysAgo && createLocalDate(t.date) <= now
      );
    }
    case '14days': {
      const fourteenDaysAgo = getDaysAgoStart(14);
      return sortedTransactions.filter(
        (t) => createLocalDate(t.date) >= fourteenDaysAgo && createLocalDate(t.date) <= now
      );
    }
    case '30days': {
      const thirtyDaysAgo = getDaysAgoStart(30);
      return sortedTransactions.filter(
        (t) => createLocalDate(t.date) >= thirtyDaysAgo && createLocalDate(t.date) <= now
      );
    }
    case 'custom': {
      if (!customStartDate || !customEndDate) return sortedTransactions;
      const startDate = new Date(customStartDate); startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEndDate);     endDate.setHours(23, 59, 59, 999);
      return sortedTransactions.filter(
        (t) => createLocalDate(t.date) >= startDate && createLocalDate(t.date) <= endDate
      );
    }
    default:
      return sortedTransactions;
  }
};

/* ------------------------------------------------------------------ */
/* Somatórios                                                          */
/* ------------------------------------------------------------------ */

export const calculateTotalIncome = (transactions: Transaction[]): number =>
  transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + toTransactionAmount(t.amount), 0);

export const calculateTotalExpenses = (transactions: Transaction[]): number =>
  transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + toTransactionAmount(t.amount), 0);

/* ------------------------------------------------------------------ */
/* Cálculo mensal                                                      */
/* ------------------------------------------------------------------ */

export const calculateMonthlyFinancialData = (
  allTransactions: Transaction[],
  selectedMonth: Date
) => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const selectedMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const selectedMonthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);

  // Apenas as transações do mês selecionado
  const monthTransactions = allTransactions.filter((transaction) => {
    const d = createLocalDate(transaction.date);
    return d >= selectedMonthStart && d <= selectedMonthEnd;
  });

  const monthlyIncome = calculateTotalIncome(monthTransactions);
  const monthlyExpenses = calculateTotalExpenses(monthTransactions);

  let accumulatedBalance = 0;

  if (selectedMonthStart < currentMonth) {
    // saldo acumulado até o fim do mês selecionado
    const upToSelected = allTransactions.filter((transaction) => {
      const d = createLocalDate(transaction.date);
      return d <= selectedMonthEnd;
    });
    accumulatedBalance =
      calculateTotalIncome(upToSelected) - calculateTotalExpenses(upToSelected);
  } else if (selectedMonthStart.getTime() === currentMonth.getTime()) {
    // saldo acumulado até hoje
    const currentDateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const upToCurrent = allTransactions.filter((transaction) => {
      const d = createLocalDate(transaction.date);
      return d <= currentDateEnd;
    });
    accumulatedBalance =
      calculateTotalIncome(upToCurrent) - calculateTotalExpenses(upToCurrent);
  } else {
    // meses futuros: usa saldo atual
    const currentDateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const upToCurrent = allTransactions.filter((transaction) => {
      const d = createLocalDate(transaction.date);
      return d <= currentDateEnd;
    });
    accumulatedBalance =
      calculateTotalIncome(upToCurrent) - calculateTotalExpenses(upToCurrent);
  }

  const result = {
    monthlyIncome,
    monthlyExpenses,
    accumulatedBalance,
    monthTransactions: sortTransactionsByDateDesc(monthTransactions),
  };

  return result;
};

/* ------------------------------------------------------------------ */
/* Filtros por mês                                                     */
/* ------------------------------------------------------------------ */

export const getTransactionsForMonth = (
  transactions: Transaction[],
  selectedMonth: Date
): Transaction[] => {
  const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);

  return transactions.filter((transaction) => {
    const d = createLocalDate(transaction.date);
    return d >= monthStart && d <= monthEnd;
  });
};

export const getGoalsForMonth = (goals: any[], selectedMonth: Date) =>
  goals.filter((goal) => {
    if (!goal.targetDate) return true; // metas sem prazo ficam ativas
    const goalDate = createLocalDate(goal.targetDate);
    const selectedMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    return goalDate >= selectedMonthStart;
  });

/* ------------------------------------------------------------------ */
/* Formatação (moeda/data/hora)                                        */
/* ------------------------------------------------------------------ */

/** Formata moeda usando preferências atuais.
 *  - se currency não vier, usa a salva (default USD)
 *  - locale deriva do idioma salvo (default ES -> es-419)
 */
export const formatCurrency = (
  amount: number,
  currencyArg?: string,
  languageArg?: 'pt' | 'en' | 'es'
): string => {
  const currency = currencyArg || getSavedCurrency();
  const language = languageArg || getSavedLanguage();
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: 'currency',
    currency,
  }).format(amount ?? 0);
};

export const formatDate = (dateString: string): string => {
  const language = getSavedLanguage();
  const locale = getIntlLocale(language);

  if (dateString.includes('-') && dateString.length === 10) {
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const date = new Date(dateString);
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatTime = (dateString: string): string => {
  const language = getSavedLanguage();
  const locale = getIntlLocale(language);
  const date = new Date(dateString);
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

export const formatDateForInput = (dateString: string): string => {
  if (dateString.includes('-') && dateString.length === 10) return dateString;
  const date = createLocalDate(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/* ------------------------------------------------------------------ */
/* Sumario por categoría                                               */
/* ------------------------------------------------------------------ */

export const calculateCategorySummaries = (
  transactions: Transaction[],
  type: 'income' | 'expense'
) => {
  const filtered = transactions.filter((t) => t.type === type);
  const totalAmount = filtered.reduce((sum, t) => sum + toTransactionAmount(t.amount), 0);

  const categories = filtered.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + toTransactionAmount(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const colors = [
    '#16a34a', '#FF6B6B', '#16a34a', '#FBBF24', '#8B5CF6',
    '#EC4899', '#10B981', '#94A3B8', '#F43F5E', '#F59E0B',
  ];

  return Object.entries(categories).map(([category, amount], index) => ({
    category,
    amount,
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    color: colors[index % colors.length],
  }));
};
