import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNCTIONS = [
  "get-public-settings", "generate-pwa-manifest", "get-plan-config", "validate-registration", "validate-profile-update",
  "check-subscription-status", "stripe-webhook", "hotmart-webhook", "generic-webhook", "grant-access",
  "create-admin-user", "get-admin-settings", "update-admin-settings", "send-email", "send-broadcast",
  "get-analytics", "get-health-scores", "manage-plan", "export-my-data", "delete-my-data",
  "create-checkout-session", "create-user-profile", "confirm-registration", "upload-avatar", "list-user-files",
  "delete-user-file", "validate-invite", "resend-verification", "update-user-email", "get-public-content",
  "sync-subscription", "n8n-dispatch", "status-page-health", "audit-ingest",
];

export const useAdminLogs = () => {
  const [edgeLogs, setEdgeLogs] = useState<any[]>([]);
  const [edgeLogsLoading, setEdgeLogsLoading] = useState(false);
  const [edgeFilter, setEdgeFilter] = useState({ fn: "all", period: "24h" });

  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsFilter, setEventsFilter] = useState({ provider: "all", status: "all" });

  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentFilter, setIncidentFilter] = useState("all");

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    adminId: "all",
    action: "all",
    target: "",
    startDate: "",
    endDate: "",
    page: 0,
  });

  const fetchEdgeLogs = useCallback(async () => {
    setEdgeLogsLoading(true);
    try {
      // Fallback prático: usa eventos de webhook como fonte operacional de logs de edge
      const { data, error } = await (supabase as any)
        .from("poupeja_webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const now = Date.now();
      const periodMs = edgeFilter.period === "1h" ? 3600000 : edgeFilter.period === "6h" ? 21600000 : edgeFilter.period === "24h" ? 86400000 : 7 * 86400000;
      const mapped = (data ?? [])
        .map((row: any) => ({
          id: row.id,
          function_name: `${row.provider || "unknown"}-webhook`,
          timestamp: row.created_at,
          status: row.error ? 500 : 200,
          duration_ms: Number(row.processing_time_ms ?? 0),
          error: row.error ?? "",
          stdout: JSON.stringify(row.payload ?? {}, null, 2),
          stderr: row.error ?? "",
        }))
        .filter((row: any) => now - new Date(row.timestamp).getTime() <= periodMs)
        .filter((row: any) => edgeFilter.fn === "all" || row.function_name === edgeFilter.fn);
      setEdgeLogs(mapped);
    } finally {
      setEdgeLogsLoading(false);
    }
  }, [edgeFilter.fn, edgeFilter.period]);

  const fetchWebhookEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      let query = (supabase as any).from("poupeja_webhook_events").select("*").order("created_at", { ascending: false }).limit(300);
      if (eventsFilter.provider !== "all") query = query.eq("provider", eventsFilter.provider);
      if (eventsFilter.status === "errors") query = query.not("error", "is", null);
      if (eventsFilter.status === "processed") query = query.eq("processed", true);
      const { data, error } = await query;
      if (error) throw error;
      setWebhookEvents(data ?? []);
    } finally {
      setEventsLoading(false);
    }
  }, [eventsFilter.provider, eventsFilter.status]);

  const reprocessEvent = useCallback(async (id: string) => {
    const { error } = await (supabase as any).from("poupeja_webhook_events").update({ processed: false, error: null }).eq("id", id);
    if (error) throw error;
    await fetchWebhookEvents();
  }, [fetchWebhookEvents]);

  const ignoreEvent = useCallback(async (id: string) => {
    const { error } = await (supabase as any).from("poupeja_webhook_events").update({ processed: true }).eq("id", id);
    if (error) throw error;
    await fetchWebhookEvents();
  }, [fetchWebhookEvents]);

  const fetchIncidents = useCallback(async () => {
    setIncidentsLoading(true);
    try {
      let query = (supabase as any).from("poupeja_incidents").select("*").order("created_at", { ascending: false });
      if (incidentFilter !== "all") query = query.eq("status", incidentFilter);
      const { data, error } = await query;
      if (error) throw error;
      setIncidents(data ?? []);
    } finally {
      setIncidentsLoading(false);
    }
  }, [incidentFilter]);

  const createIncident = useCallback(async (data: { title: string; severity: string; description: string }) => {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("poupeja_incidents").insert({
      title: data.title,
      severity: data.severity,
      description: data.description,
      status: "open",
      created_by: auth?.user?.id ?? null,
    });
    if (error) throw error;
    await fetchIncidents();
  }, [fetchIncidents]);

  const updateIncidentStatus = useCallback(async (id: string, status: "open" | "investigating" | "resolved") => {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (status === "resolved") payload.resolved_at = new Date().toISOString();
    const { error } = await (supabase as any).from("poupeja_incidents").update(payload).eq("id", id);
    if (error) throw error;
    await fetchIncidents();
  }, [fetchIncidents]);

  const resolveIncident = useCallback(async (id: string) => {
    await updateIncidentStatus(id, "resolved");
  }, [updateIncidentStatus]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      let query = (supabase as any).from("poupeja_admin_audit").select("*").order("created_at", { ascending: false }).range(auditFilters.page * 50, auditFilters.page * 50 + 49);
      if (auditFilters.adminId !== "all") query = query.eq("admin_id", auditFilters.adminId);
      if (auditFilters.action !== "all") query = query.eq("action", auditFilters.action);
      if (auditFilters.target) query = query.or(`target_type.ilike.%${auditFilters.target}%,target_id.ilike.%${auditFilters.target}%`);
      if (auditFilters.startDate) query = query.gte("created_at", `${auditFilters.startDate}T00:00:00`);
      if (auditFilters.endDate) query = query.lte("created_at", `${auditFilters.endDate}T23:59:59`);
      const { data, error } = await query;
      if (error) throw error;
      const adminIds = Array.from(new Set((data ?? []).map((row: any) => row.admin_id).filter(Boolean)));
      const { data: users } = adminIds.length
        ? await (supabase as any).from("poupeja_users").select("id,name,email,profile_image").in("id", adminIds)
        : { data: [] };
      const enriched = (data ?? []).map((row: any) => ({
        ...row,
        admin: (users ?? []).find((u: any) => u.id === row.admin_id) ?? null,
      }));
      setAuditLogs(enriched);
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilters]);

  const exportAuditCSV = useCallback(() => {
    const header = "admin,action,target_type,target_id,ip_address,created_at";
    const body = auditLogs.map((row: any) =>
      `"${row.admin?.name ?? row.admin_id ?? ""}","${row.action ?? ""}","${row.target_type ?? ""}","${row.target_id ?? ""}","${row.ip_address ?? ""}","${row.created_at ?? ""}"`,
    );
    const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-audit.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [auditLogs]);

  const edgeMetrics = useMemo(() => {
    const total = edgeLogs.length;
    const success = edgeLogs.filter((row: any) => row.status >= 200 && row.status < 300).length;
    const errors = edgeLogs.filter((row: any) => row.status >= 400).length;
    const avgDuration = total ? Math.round(edgeLogs.reduce((acc: number, row: any) => acc + Number(row.duration_ms || 0), 0) / total) : 0;
    return { total, success, errors, avgDuration };
  }, [edgeLogs]);

  useEffect(() => { fetchEdgeLogs(); }, [fetchEdgeLogs]);
  useEffect(() => { fetchWebhookEvents(); }, [fetchWebhookEvents]);
  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);
  useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);

  return {
    functionOptions: EDGE_FUNCTIONS,
    edgeLogs,
    edgeMetrics,
    edgeLogsLoading,
    edgeFilter,
    setEdgeFilter,
    fetchEdgeLogs,
    webhookEvents,
    eventsLoading,
    eventsFilter,
    setEventsFilter,
    reprocessEvent,
    ignoreEvent,
    incidents,
    incidentsLoading,
    incidentFilter,
    setIncidentFilter,
    createIncident,
    updateIncidentStatus,
    resolveIncident,
    auditLogs,
    auditLoading,
    auditFilters,
    setAuditFilters,
    exportAuditCSV,
  };
};

