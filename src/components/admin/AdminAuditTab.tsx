import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AuditProps = {
  auditLogs: any[];
  auditFilters: any;
  setAuditFilters: (fn: any) => void;
  exportAuditCSV: () => void;
};

/** Conteúdo da auditoria reutilizado na aba “Auditoria” da página de infraestrutura. */
export function AdminAuditTab({ auditLogs, auditFilters, setAuditFilters, exportAuditCSV }: AuditProps) {
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  const admins = useMemo(
    () => Array.from(new Set(auditLogs.map((row: any) => row.admin_id).filter(Boolean))),
    [auditLogs],
  );
  const actions = useMemo(
    () => Array.from(new Set(auditLogs.map((row: any) => row.action).filter(Boolean))),
    [auditLogs],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-2">
          <Select
            value={auditFilters.adminId}
            onValueChange={(value) => setAuditFilters((f: any) => ({ ...f, adminId: value, page: 0 }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Admin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos admins</SelectItem>
              {admins.map((id) => (
                <SelectItem key={String(id)} value={String(id)}>
                  {String(id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={auditFilters.action}
            onValueChange={(value) => setAuditFilters((f: any) => ({ ...f, action: value, page: 0 }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ações</SelectItem>
              {actions.map((action) => (
                <SelectItem key={String(action)} value={String(action)}>
                  {String(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Alvo (tipo/ID)"
            value={auditFilters.target}
            onChange={(e) => setAuditFilters((f: any) => ({ ...f, target: e.target.value, page: 0 }))}
          />
          <div>
            <Label>Início</Label>
            <Input
              type="date"
              value={auditFilters.startDate}
              onChange={(e) => setAuditFilters((f: any) => ({ ...f, startDate: e.target.value, page: 0 }))}
            />
          </div>
          <div>
            <Label>Fim</Label>
            <Input
              type="date"
              value={auditFilters.endDate}
              onChange={(e) => setAuditFilters((f: any) => ({ ...f, endDate: e.target.value, page: 0 }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAuditFilters((f: any) => ({ ...f, page: Math.max(0, f.page - 1) }))}>
            Página anterior
          </Button>
          <Button variant="outline" onClick={() => setAuditFilters((f: any) => ({ ...f, page: f.page + 1 }))}>
            Próxima página
          </Button>
        </div>
        <Button onClick={exportAuditCSV}>Exportar CSV</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((row: any) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelectedAudit(row)}>
                  <TableCell>{row.admin?.name ?? row.admin_id ?? "—"}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.target_type || "—"}</TableCell>
                  <TableCell>{JSON.stringify(row.details ?? {}).slice(0, 80)}</TableCell>
                  <TableCell>{row.ip_address || "—"}</TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedAudit} onOpenChange={(open) => !open && setSelectedAudit(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da auditoria</SheetTitle>
          </SheetHeader>
          <pre className="mt-4 text-xs whitespace-pre-wrap rounded border p-3">
            {selectedAudit ? JSON.stringify(selectedAudit, null, 2) : ""}
          </pre>
        </SheetContent>
      </Sheet>
    </>
  );
}
