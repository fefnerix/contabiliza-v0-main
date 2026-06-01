import { Skeleton } from "@/components/ui/skeleton";

interface TransactionListSkeletonProps {
  rows?: number;
}

export function TransactionListSkeleton({ rows = 5 }: TransactionListSkeletonProps) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando transacciones">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-3 w-[45%]" />
          </div>
          <Skeleton className="h-5 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
