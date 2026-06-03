import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/portal/app-shell";
import { getDemoSession } from "@/lib/demo-auth";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getDemoSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell
      role={session.role}
      userName={session.name}
      contactId={session.contactId}
      accountId={session.accountId}
    >
      {children}
    </AppShell>
  );
}
