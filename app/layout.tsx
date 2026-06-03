import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { FloatingChatAgent } from "@/components/portal/floating-chat-agent";
import { brandThemes } from "@/lib/brand-theme";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Supplier Hub",
  description: "Supplier onboarding portal",
};

const brandThemeIds = brandThemes.map((theme) => theme.id);
const faviconManifest = Object.fromEntries(
  brandThemes.map((theme) => [
    theme.id,
    {
      bg: theme.chips[0],
      fg: theme.chips[1],
      mark: theme.logoMark,
    },
  ])
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem("supplierhub-theme") || "system";
    const brandTheme = localStorage.getItem("supplierhub-brand-theme") || "default";
    const allowedBrandThemes = new Set(${JSON.stringify(brandThemeIds)});
    const faviconManifest = ${JSON.stringify(faviconManifest)};
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (stored === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    const resolvedBrandTheme = allowedBrandThemes.has(brandTheme) ? brandTheme : "default";
    document.documentElement.dataset.brandTheme = resolvedBrandTheme;

    const faviconDef = faviconManifest[resolvedBrandTheme] || faviconManifest.default;
    const mark = (faviconDef.mark || "SH").slice(0, 3).toUpperCase();
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='" + faviconDef.bg + "'/><text x='32' y='39' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-weight='700' font-size='20' fill='" + faviconDef.fg + "'>" + mark + "</text></svg>";
    const href = "data:image/svg+xml," + svg;
    const link = document.createElement("link");
    link.setAttribute("data-supplierhub", "dynamic-favicon");
    link.rel = "icon";
    link.href = href;
    document.head.appendChild(link);
  } catch {
    /* no-op */
  }
})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <FloatingChatAgent />
      </body>
    </html>
  );
}
