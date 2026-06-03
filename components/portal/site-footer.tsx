import Link from "next/link";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

type FooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

type SiteFooterProps = {
  brandLabel: string;
};

const footerColumns: FooterColumn[] = [
  {
    title: "Onboarding",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Profile", href: "/profile" },
      { label: "Questionnaires", href: "/questionnaires" },
      { label: "Capabilities", href: "/capabilities" },
      { label: "Certifications", href: "/certifications" },
      { label: "Credit", href: "/credit" },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Test Center", href: "/test-center" },
      { label: "Access Requests", href: "/admin/requests" },
      { label: "Theme Studio", href: "/admin/themes" },
      { label: "Reviewer Console", href: "/admin" },
    ],
  },
  {
    title: "Demo Tools",
    links: [
      { label: "Reset Demo Story", href: "/test-center" },
      { label: "Theme Export Packs", href: "/admin/themes" },
      { label: "Brand Presets", href: "/admin/themes" },
      { label: "Sample Data Walkthrough", href: "/dashboard" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Portal Guide", href: "/dashboard" },
      { label: "Security Check", href: "/test-center" },
      { label: "Service Health", href: "/test-center" },
      { label: "Contact Reviewer Ops", href: "/admin/requests" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Supplier Hub", href: "/dashboard" },
      { label: "Privacy", href: "/dashboard" },
      { label: "Terms", href: "/dashboard" },
      { label: "Responsible AI", href: "/dashboard" },
    ],
  },
];

export function SiteFooter({ brandLabel }: SiteFooterProps) {
  return (
    <footer className="mt-10 border-t border-border/80 bg-card/70">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-border/80 bg-muted/35 px-4 py-6 sm:px-6">
          <p className="text-center text-base font-semibold text-foreground sm:text-lg">
            Follow {brandLabel}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" aria-label="Follow on Facebook">
              <span className="text-xs font-semibold">f</span>
            </Button>
            <Button variant="outline" size="icon" aria-label="Follow on X">
              <span className="text-xs font-semibold">X</span>
            </Button>
            <Button variant="outline" size="icon" aria-label="Follow on LinkedIn">
              <span className="text-xs font-semibold">in</span>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {footerColumns.map((column) => (
            <section key={column.title}>
              <h2 className="text-lg font-semibold text-foreground">{column.title}</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                {column.links.map((item) => (
                  <li key={`${column.title}-${item.label}`}>
                    <Link className="transition-colors hover:text-foreground" href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-border/80 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>English (United States)</span>
            <span>Privacy Choices</span>
            <span>Consumer Health Privacy</span>
            <span>Safety and Eco</span>
            <span>Recycling</span>
          </div>
          <div className="flex items-center gap-3">
            <span>© Supplier Hub 2026</span>
            <Button asChild size="sm" className="rounded-full px-3">
              <Link href="#top">
                Back to top
                <ArrowUp className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
