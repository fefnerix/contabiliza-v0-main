import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardChartsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando gráficos">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((key) => (
          <Card key={key} className="border border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-52" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
