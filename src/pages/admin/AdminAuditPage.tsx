import { AdminAuditTab } from "@/components/admin/AdminAuditTab";
import { useAdminLogs } from "@/hooks/useAdminLogs";

const AdminAuditPage = () => {
  const { auditLogs, auditFilters, setAuditFilters, exportAuditCSV } = useAdminLogs();

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Auditoria Admin</h2>
      <AdminAuditTab
        auditLogs={auditLogs}
        auditFilters={auditFilters}
        setAuditFilters={setAuditFilters}
        exportAuditCSV={exportAuditCSV}
      />
    </div>
  );
};

export default AdminAuditPage;
