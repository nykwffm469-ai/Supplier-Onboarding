import { redirect } from "next/navigation";

import { DashboardWidget } from "@/components/portal/dashboard-widget";
import { getDemoSession } from "@/lib/demo-auth";

export default async function DashboardPage() {
  const session = await getDemoSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {session.name.split(" ")[0]}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {session.role === "reviewer"
            ? "Here is a summary of supplier activity that needs your attention."
            : "Complete the steps below to finish your supplier onboarding."}
        </p>
      </div>
      <DashboardWidget role={session.role} accountId={session.accountId} />
    </div>
  );
}
