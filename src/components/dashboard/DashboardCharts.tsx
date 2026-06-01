import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/utils/transactionUtils";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useDashboardCharts } from "@/hooks/useDashboardCharts";
import { DashboardChartsSkeleton } from "@/components/dashboard/DashboardChartsSkeleton";
import { chartStroke, piePalette, chartColorVars } from "@/lib/chart-theme";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardChartsProps {
  currentMonth?: Date;
  hideValues?: boolean;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  currentMonth = new Date(),
  hideValues = false,
}) => {
  const { currency, t } = usePreferences();
  const { spendingByCategory, summaryData, isLoading } = useDashboardCharts();

  const monthName = format(currentMonth, "MMMM", { locale: es });

  const pieData = useMemo(
    () =>
      spendingByCategory.map((row) => ({
        category: row.category_name,
        amount: row.total_amount,
      })),
    [spendingByCategory]
  );

  const barData = useMemo(() => {
    const income = summaryData
      .filter((row) => row.type === "income")
      .reduce((sum, row) => sum + row.total_amount, 0);
    const expenses = summaryData
      .filter((row) => row.type === "expense")
      .reduce((sum, row) => sum + row.total_amount, 0);
    return [
      { name: t("common.income"), key: "income", value: income, fill: chartStroke.income },
      {
        name: t("common.expense"),
        key: "expense",
        value: expenses,
        fill: chartStroke.expense,
      },
    ];
  }, [summaryData, t]);

  const hasPieData = pieData.some((item) => item.amount > 0);
  const hasBarData = barData.some((item) => item.value > 0);

  const PieCategoryLegend = ({
    items,
  }: {
    items: { category: string; amount: number }[];
  }) => {
    const total = items.reduce((s, i) => s + i.amount, 0) || 1;
    return (
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.category} className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: piePalette[index % piePalette.length] }}
            />
            <span className="truncate" title={item.category}>
              {item.category}{" "}
              <span className="tabular-nums text-muted-foreground/90">
                ({Math.round((item.amount / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    );
  };

  if (isLoading) {
    return <DashboardChartsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("charts.incomeVsExpenses")} - {monthName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              {hasBarData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 12, right: 10, left: 4, bottom: 6 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartStroke.grid}
                      opacity={0.6}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: chartColorVars.axis }}
                      tickMargin={8}
                    />
                    <YAxis
                      width={58}
                      tick={{ fontSize: 11, fill: chartColorVars.axis }}
                      tickMargin={6}
                      axisLine={false}
                      tickFormatter={(value) =>
                        hideValues ? "***" : formatCurrency(value, currency).split(".")[0]
                      }
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        hideValues ? "******" : formatCurrency(value, currency)
                      }
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center px-4">
                  {t("charts.noPeriodData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("charts.expenseBreakdown")} - {monthName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[18rem] flex-col items-stretch justify-center">
              {hasPieData ? (
                <>
                  <div className="min-h-0 w-full flex-1 basis-[11rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                        <Pie
                          data={pieData}
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
                          {pieData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={piePalette[index % piePalette.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            hideValues
                              ? "******"
                              : formatCurrency(Number(value), currency)
                          }
                          labelFormatter={(_, payload) =>
                            (payload?.[0]?.payload as { category?: string })?.category ?? ""
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <PieCategoryLegend items={pieData} />
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center px-4">
                  {t("charts.noPeriodData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
