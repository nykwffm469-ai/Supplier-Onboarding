import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoSession } from "@/lib/demo-auth";

export default async function AdminPage() {
  const session = await getDemoSession();

  if (!session || session.role !== "reviewer") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reviewer Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal workspace for reviewer assignments, SLAs, and approval policies.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/requests">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Access Requests</CardTitle>
              <CardDescription>
                Review pending supplier onboarding requests and approve or reject them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-medium text-primary">Open -&gt;</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/themes">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Theme Studio</CardTitle>
              <CardDescription>
                Instantly switch branded color systems for customer-specific demos and executive walkthroughs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-medium text-primary">Open -&gt;</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
