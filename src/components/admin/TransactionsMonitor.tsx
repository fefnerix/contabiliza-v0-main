import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Period = "today" | "7d" | "30d" | "all";
type TxRow = {
  id: string;
  user_id?: string | null;
  amount: number;
  type: string;
  description: string | null;
  date: string;
  created_at: string | null;
  poupeja_users?: { name: string | null; email: string | null } | null;
  poupeja_categories?: { name: string | null } | null;
};

const PAGE_SIZE = 25;

export function TransactionsMonitor() {
  const [rawRows, setRawRows] = useState<TxRow[]>([]);
  const [dayMetrics, setDayMetrics] = useState({ countToday: 0, income: 0, expense: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [period, setPeriod] = useState<Period>("today");
  const [page, setPage] = useState(0);

  const periodStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (period === "today") return d;
    if (period === "7d") {
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (period === "30d") {
      d.setDate(d.getDate() - 30);
      return d;
    }
    return null;
  }, [period]);

  const fetchDayMetrics = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const { data: todayRows, error } = await (supabase as any)
        .from("poupeja_transactions")
        .select("user_id, amount, type")
        .eq("date", today);
      if (error) throw error;
      const rows = todayRows ?? [];
      const income = rows.filter((r: any) => r.type === "income").reduce((a: number, r: any) => a + Number(r.amount), 0);
      const expense = rows.filter((r: any) => r.type === "expense").reduce((a: number, r: any) => a + Number(r.amount), 0);
      const uid = new Set<string>();
      rows.forEach((r: any) => {
        if (r.user_id) uid.add(r.user_id);
      });
      setDayMetrics({
        countToday: rows.length,
        income,
        expense,
        activeUsers: uid.size,
      });
    } catch {
      setDayMetrics({ countToday: 0, income: 0, expense: 0, activeUsers: 0 });
    }
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      await fetchDayMetrics();
      let q = (supabase as any)
        .from("poupeja_transactions")
        .select(
          "id, user_id, amount, type, description, date, created_at, poupeja_users ( name, email ), poupeja_categories ( name )",
        )
        .order("created_at", { ascending: false })
        .limit(800);
      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      if (periodStart) q = q.gte("date", periodStart.toISOString().slice(0, 10));
      const { data, error } = await q;
      if (error) throw error;
      setRawRows((data ?? []) as TxRow[]);
      setPage(0);
    } catch (e) {
      console.error(e);
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, [periodStart, typeFilter, fetchDayMetrics]);

  const rows = useMemo(() => {
    if (!search.trim()) return rawRows;
    const s = search.trim().toLowerCase();
    return rawRows.filter((r) => {
      const desc = (r.description ?? "").toLowerCase();
      const email = (r.poupeja_users?.email ?? "").toLowerCase();
      const name = (r.poupeja_users?.name ?? "").toLowerCase();
      return desc.includes(s) || email.includes(s) || name.includes(s);
    });
  }, [rawRows, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const exportCsv = () => {
    const header = "usuario,email,tipo,descricao,categoria,valor,data,criado_em";
    const lines = rows.map((r) => {
      const u = r.poupeja_users?.name ?? "";
      const em = r.poupeja_users?.email ?? "";
      const cat = r.poupeja_categories?.name ?? "";
      return `"${u}","${em}","${r.type}","${(r.description ?? "").replace(/"/g, '""')}","${cat}","${r.amount}","${r.date}","${r.created_at ?? ""}"`;
    });
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transacoes-admin.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Transações hoje</p>
            <p className="text-2xl font-semibold">{dayMetrics.countToday}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Receitas hoje</p>
            <p className="text-2xl font-semibold text-emerald-400">{dayMetrics.income.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Gastos hoje</p>
            <p className="text-2xl font-semibold text-red-400">{dayMetrics.expense.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Usuários ativos hoje</p>
            <p className="text-2xl font-semibold">{dayMetrics.activeUsers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Buscar usuário ou descrição…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-zinc-900 border-zinc-700"
        />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="income">Ingreso</SelectItem>
            <SelectItem value="expense">Gasto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => fetchRows()} disabled={loading}>
          Atualizar
        </Button>
        <Button variant="secondary" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
      </div>

      <Card className="border-[#1f1f1f] bg-[#111111]">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Registrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[140px] truncate">
                    {r.poupeja_users?.name ?? "—"}{" "}
                    <span className="text-zinc-500 text-xs block truncate">{r.poupeja_users?.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.type === "income" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      }
                    >
                      {r.type === "income" ? "Ingreso" : "Gasto"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.description ?? "—"}</TableCell>
                  <TableCell>{r.poupeja_categories?.name ?? "—"}</TableCell>
                  <TableCell>{Number(r.amount).toFixed(2)}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {r.created_at ? new Date(r.created_at).toLocaleString("pt-BR") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4 text-sm text-zinc-500">
            <span>
              Página {page + 1} · {rows.length} registros
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={(page + 1) * PAGE_SIZE >= rows.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
