/**
 * Tema de gráficos alinhado a `src/index.css` (--chart-1 … --chart-5).
 * Usar estes valores em stroke/fill do Recharts para consistência light/dark.
 */
export const chartColorVars = {
  income: 'hsl(var(--chart-1))',
  expense: 'hsl(var(--chart-2))',
  secondary: 'hsl(var(--chart-3))',
  neutral: 'hsl(var(--chart-4))',
  accent: 'hsl(var(--chart-5))',
  primary: 'hsl(var(--primary))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
} as const;

export type ChartSemanticKey = keyof typeof chartColorVars;

export const chartStroke = {
  income: chartColorVars.income,
  expense: chartColorVars.expense,
  mrr: chartColorVars.primary,
  grid: chartColorVars.grid,
} as const;

/** Paleta rotativa para pizzas / categorias */
export const piePalette = [
  chartColorVars.income,
  chartColorVars.expense,
  chartColorVars.secondary,
  chartColorVars.neutral,
  chartColorVars.accent,
  chartColorVars.primary,
] as const;

/** Cores semânticas por tipo de plano (admin analytics) */
export const adminPlanChartColors: Record<string, string> = {
  monthly: chartColorVars.primary,
  annual: 'hsl(var(--chart-4))',
  lifetime: 'hsl(var(--chart-3))',
  trial: 'hsl(var(--chart-5))',
};
