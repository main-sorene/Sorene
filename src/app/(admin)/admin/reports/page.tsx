"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { ReportsDashboard } from "@/components/admin/ReportsDashboard";

export default function ReportsPage() {
  return (
    <AdminShell>
      <ReportsDashboard />
    </AdminShell>
  );
}
