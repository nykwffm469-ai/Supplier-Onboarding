import { redirect } from "next/navigation";

import { QuestionnairesList } from "@/components/portal/questionnaires-list";
import { getDemoSession } from "@/lib/demo-auth";

export default async function QuestionnairesPage() {
  const session = await getDemoSession();
  if (!session) redirect("/login");

  return (
    <QuestionnairesList
      role={session.role}
      accountId={session.accountId}
      contactId={session.contactId}
    />
  );
}
