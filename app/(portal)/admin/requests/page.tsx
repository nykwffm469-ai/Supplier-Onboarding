import { redirect } from "next/navigation";

import { RequestsTable } from "@/components/admin/requests-table";
import { getDemoSession } from "@/lib/demo-auth";

export default async function AdminRequestsPage() {
  const session = await getDemoSession();

  if (!session || session.role !== "reviewer") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Access Requests
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review and action pending supplier onboarding requests. Approving a request marks the
          linked contact for portal access.
        </p>
      </div>

      <RequestsTable />
    </div>
  );
}
