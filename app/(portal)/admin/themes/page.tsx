import { redirect } from "next/navigation";

import { ThemeStudio } from "@/components/admin/theme-studio";
import { getDemoSession } from "@/lib/demo-auth";

export default async function AdminThemesPage() {
  const session = await getDemoSession();

  if (!session || session.role !== "reviewer") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Themes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a branded visual system for customer-aligned demos.
        </p>
      </div>

      <ThemeStudio />
    </div>
  );
}
