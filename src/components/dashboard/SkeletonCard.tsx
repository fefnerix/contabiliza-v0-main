import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder de card de estatística do dashboard (saldo, receita, gasto). */
export function SkeletonCard() {
  return (
    <Card className="border border-border/40 shadow-sm overflow-hidden">
      <CardContent className="p-4 lg:p-6 space-y-4">
        <div className="flex justify-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-28 self-center" />
        </div>
        <Skeleton className="h-8 w-36 mx-auto" />
      </CardContent>
    </Card>
  );
}
