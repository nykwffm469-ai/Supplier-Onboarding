import { redirect } from "next/navigation";

import { CreditPanel } from "@/components/portal/credit-panel";
import { getDemoSession } from "@/lib/demo-auth";

export default async function CreditPage() {
  const session = await getDemoSession();
  if (!session) redirect("/login");

  return <CreditPanel role={session.role} />;
}
