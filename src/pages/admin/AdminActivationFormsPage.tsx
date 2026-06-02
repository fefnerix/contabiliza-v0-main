import { useEffect } from "react";
import { ClipboardList, Download, FileJson, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  ACTIVATION_FORM_FIELD_LABELS,
  formatActivationFieldValue,
} from "@/lib/activationFormLabels";
import { ActivationFormRow, useAdminActivationForms } from "@/hooks/useAdminActivationForms";

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-419", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const isRecoveredFromSignup = (row: ActivationFormRow) =>
  row.form_data?.recovered_from_signup === true;

const formatMoney = (n: number | null, currency?: string | null) => {
  if (n == null) return "—";
  const suffix = currency ? ` ${currency}` : "";
  return `${n.toLocaleString("es-419")}${suffix}`;
};

const DetailSheet = ({
  row,
  open,
  onOpenChange,
}: {
  row: ActivationFormRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!row) return null;
  const entries = Object.entries(row.form_data).filter(
    ([key]) => key !== "debts" || (Array.isArray(row.form_data.debts) && row.form_data.debts.length > 0)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl bg-[#111] border-zinc-800 text-zinc-100">
        <SheetHeader>
          <SheetTitle className="text-left">{row.full_name || row.email || "Formulario"}</SheetTitle>
          <p className="text-sm text-zinc-400 text-left">
            {row.submitted_at
              ? `Enviado: ${formatDate(row.submitted_at)}`
              : isRecoveredFromSignup(row)
                ? "Recuperado del cadastro — formulario completo pendiente"
                : "Borrador — aún no enviado"}
          </p>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-3">
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-800 p-3 space-y-2 text-sm">
              <p><span className="text-zinc-400">Email:</span> {row.email ?? "—"}</p>
              <p><span className="text-zinc-400">WhatsApp:</span> {row.phone ?? "—"}</p>
              <p><span className="text-zinc-400">País:</span> {row.country ?? "—"}</p>
              <p><span className="text-zinc-400">Moneda:</span> {row.currency ?? "—"}</p>
              <p><span className="text-zinc-400">Ingreso mensual:</span> {formatMoney(row.monthly_income, row.currency)}</p>
              <p><span className="text-zinc-400">Meta 12m:</span> {formatMoney(row.goal_amount, row.currency)}</p>
              <p><span className="text-zinc-400">Deuda total:</span> {formatMoney(row.total_debt, row.currency)}</p>
            </div>
            {entries.map(([key, value]) => (
              <div key={key} className="rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-medium text-emerald-400/90 mb-1">
                  {ACTIVATION_FORM_FIELD_LABELS[key] ?? key}
                </p>
                <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">
                  {formatActivationFieldValue(value) || "—"}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const AdminActivationFormsPage = () => {
  const { toast } = useToast();
  const {
    forms,
    loading,
    stats,
    search,
    setSearch,
    page,
    setPage,
    selected,
    setSelected,
    fetchForms,
    fetchStats,
    refresh,
    exportCSV,
    exportJSON,
    totalCount,
    totalPages,
  } = useAdminActivationForms();

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      void fetchForms(search, 0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const rangeLabel = () => {
    const from = totalCount === 0 ? 0 : page * 20 + 1;
    const to = Math.min(totalCount, page * 20 + 20);
    return `${from}-${to} de ${totalCount}`;
  };

  const handleExport = async (type: "csv" | "json") => {
    try {
      if (type === "csv") await exportCSV();
      else await exportJSON();
      toast({ title: "Exportación lista", description: "El archivo se descargó en tu equipo." });
    } catch (e: any) {
      toast({
        title: "Error al exportar",
        description: e?.message ?? "No se pudo exportar. ¿Aplicaste la migration de admin en Supabase?",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Formularios de activación
          </h2>
          <p className="text-zinc-400 text-sm">
            Respuestas del Camino de Abundancia guardadas en la base de datos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleExport("csv")}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleExport("json")}>
            <FileJson className="h-4 w-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[#111] border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Total enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-100">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{stats.today}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Últimos 7 días</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-100">{stats.last7Days}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111] border-zinc-800">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Respuestas</CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              className="pl-8 bg-zinc-900 border-zinc-700"
              placeholder="Buscar nombre, email, teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-400 py-8 text-center">Cargando...</p>
          ) : forms.length === 0 ? (
            <p className="text-sm text-zinc-400 py-8 text-center">
              No hay formularios guardados aún. Los usuarios deben completar el onboarding después del registro.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((row) => (
                    <TableRow key={row.user_id} className="border-zinc-800">
                      <TableCell className="font-medium">{row.full_name ?? "—"}</TableCell>
                      <TableCell>{row.email ?? "—"}</TableCell>
                      <TableCell>{row.country ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-zinc-800">
                          {row.currency ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        {row.submitted_at ? (
                          formatDate(row.submitted_at)
                        ) : isRecoveredFromSignup(row) ? (
                          <Badge className="bg-amber-500/20 text-amber-300">Recuperado (cadastro)</Badge>
                        ) : (
                          <Badge variant="secondary">Borrador</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(row)}
                        >
                          Ver respuestas
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
                <span>{rangeLabel()}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 0}
                    onClick={() => {
                      const p = page - 1;
                      setPage(p);
                      void fetchForms(search, p);
                    }}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages - 1}
                    onClick={() => {
                      const p = page + 1;
                      setPage(p);
                      void fetchForms(search, p);
                    }}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DetailSheet
        row={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
};

export default AdminActivationFormsPage;
