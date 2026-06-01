import { createLocalDate } from "@/utils/transactionUtils";
import type { TimeRange } from "@/types";

export interface ResolvedDateRange {
  start: Date;
  end: Date;
}

function getTodayInTimezone(timezone: string): Date {
  const todayString = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
    new Date()
  );
  return createLocalDate(todayString);
}

/** Resuelve el rango de fechas según timeRange del AppContext (respeta timezone del usuario). */
export function resolveAppDateRange(
  timeRange: string,
  customStartDate: Date | null,
  customEndDate: Date | null
): ResolvedDateRange | null {
  const userTimezone =
    (typeof window !== "undefined" && localStorage.getItem("userTimezone")) ||
    "America/Bogota";
  const today = getTodayInTimezone(userTimezone);

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (timeRange === "custom" && customStartDate && customEndDate) {
    startDate = new Date(customStartDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(customEndDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch (timeRange as TimeRange) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday;
        endDate = yesterday;
        break;
      }
      case "7days": {
        const from = new Date(today);
        from.setDate(from.getDate() - 6);
        startDate = from;
        endDate = today;
        break;
      }
      case "14days": {
        const from = new Date(today);
        from.setDate(from.getDate() - 13);
        startDate = from;
        endDate = today;
        break;
      }
      case "30days":
      default: {
        const from = new Date(today);
        from.setDate(from.getDate() - 29);
        startDate = from;
        endDate = today;
        break;
      }
    }
  }

  if (!startDate || !endDate) return null;

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { start: startDate, end };
}

export function toRpcDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
