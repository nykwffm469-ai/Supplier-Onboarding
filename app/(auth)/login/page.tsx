import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandWordmark } from "@/components/portal/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoSession } from "@/lib/demo-auth";

export default async function LoginPage() {
  const session = await getDemoSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <BrandWordmark className="rounded-xl border border-border bg-card/85 p-4 shadow-sm backdrop-blur" />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to Supplier Hub</CardTitle>
            <CardDescription>
              Demo mode is enabled. Choose a sample login profile below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/api/demo-auth/login?user=supplier&callbackUrl=/dashboard">
                  Continue as Supplier (Demo)
                </Link>
              </Button>
              <Button asChild className="w-full" variant="secondary">
                <Link href="/api/demo-auth/login?user=reviewer&callbackUrl=/dashboard">
                  Continue as Reviewer (Demo)
                </Link>
              </Button>
              <p className="text-center text-sm text-slate-600">
                Need onboarding access?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Submit a self-registration request
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
