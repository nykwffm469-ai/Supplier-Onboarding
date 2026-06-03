import Link from "next/link";
import { redirect } from "next/navigation";

import { AccessRequestForm } from "@/components/auth/access-request-form";
import { getDemoSession } from "@/lib/demo-auth";

export default async function RegisterPage() {
  const session = await getDemoSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Request Supplier Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New supplier users can self-register and track request approval decisions.
        </p>
      </div>

      <AccessRequestForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have access?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Go to demo login
        </Link>
      </p>
    </div>
  );
}
