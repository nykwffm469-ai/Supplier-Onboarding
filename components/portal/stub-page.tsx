import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StubPageProps = {
  title: string;
  description: string;
};

export function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Stub</CardTitle>
          <CardDescription>
            This section is scaffolded and ready for business logic and data integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>UI structure is in place with responsive behavior.</li>
            <li>Role-aware route guard is active via middleware.</li>
            <li>Replace this placeholder with final workflows and APIs.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
