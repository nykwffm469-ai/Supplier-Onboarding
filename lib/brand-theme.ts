export type BrandTheme = {
  id: string;
  name: string;
  company: string;
  note: string;
  chips: [string, string, string];
  logoMark: string;
  headerTitle: string;
  headerSubtitle: string;
};

export const BRAND_THEME_STORAGE_KEY = "supplierhub-brand-theme";
export const BRAND_THEME_CHANGE_EVENT = "supplierhub:brand-theme-change";

export const brandThemes: BrandTheme[] = [
  {
    id: "default",
    name: "Supplier Hub Classic",
    company: "Neutral",
    note: "Current default look for broad demos.",
    chips: ["#1d4ed8", "#0f172a", "#f4f7fb"],
    logoMark: "SH",
    headerTitle: "Supplier Hub",
    headerSubtitle: "Onboarding Portal",
  },
  {
    id: "cat",
    name: "CAT Industrial",
    company: "CAT",
    note: "High-contrast construction palette with caution yellow.",
    chips: ["#ffcd11", "#111111", "#353535"],
    logoMark: "CAT",
    headerTitle: "CAT Supplier Hub",
    headerSubtitle: "Industrial Onboarding",
  },
  {
    id: "john-deere",
    name: "Deere Field Ops",
    company: "John Deere",
    note: "Agriculture-forward greens for operator workflows.",
    chips: ["#367c2b", "#f7c845", "#1f2a1c"],
    logoMark: "JD",
    headerTitle: "John Deere Supplier Hub",
    headerSubtitle: "Field Operations Portal",
  },
  {
    id: "ge",
    name: "GE Precision",
    company: "GE",
    note: "Clean engineering blue for enterprise review rooms.",
    chips: ["#005cb9", "#e6f2ff", "#083a6b"],
    logoMark: "GE",
    headerTitle: "GE Supplier Hub",
    headerSubtitle: "Precision Onboarding",
  },
  {
    id: "honeywell",
    name: "Honeywell Flightline",
    company: "Honeywell",
    note: "Aviation-red emphasis with modern graphite support.",
    chips: ["#e01f26", "#1d252d", "#f7f8fa"],
    logoMark: "HW",
    headerTitle: "Honeywell Supplier Hub",
    headerSubtitle: "Flightline Access Portal",
  },
  {
    id: "microsoft",
    name: "Microsoft Boardroom",
    company: "Microsoft",
    note: "Blue-led enterprise visual language.",
    chips: ["#2563eb", "#eef5ff", "#0b1f4a"],
    logoMark: "MS",
    headerTitle: "Microsoft Supplier Hub",
    headerSubtitle: "Partner Onboarding",
  },
  {
    id: "ibm",
    name: "IBM Deep Tech",
    company: "IBM",
    note: "Research-lab navy with subtle cyan accents.",
    chips: ["#0f62fe", "#161616", "#edf5ff"],
    logoMark: "IBM",
    headerTitle: "IBM Supplier Hub",
    headerSubtitle: "Deep Tech Intake",
  },
  {
    id: "oracle",
    name: "Oracle Summit",
    company: "Oracle",
    note: "Confident red/charcoal style for executive updates.",
    chips: ["#c74634", "#1f1f1f", "#f8efed"],
    logoMark: "OR",
    headerTitle: "Oracle Supplier Hub",
    headerSubtitle: "Summit Onboarding",
  },
  {
    id: "salesforce",
    name: "Salesforce Cloud",
    company: "Salesforce",
    note: "Friendly cloud tones for stakeholder-facing demos.",
    chips: ["#0176d3", "#d9eeff", "#16325c"],
    logoMark: "SF",
    headerTitle: "Salesforce Supplier Hub",
    headerSubtitle: "Cloud Partner Portal",
  },
  {
    id: "ford",
    name: "Ford Mobility",
    company: "Ford",
    note: "Automotive cobalt with steel neutrals.",
    chips: ["#003478", "#e8eff9", "#1f2937"],
    logoMark: "FD",
    headerTitle: "Ford Supplier Hub",
    headerSubtitle: "Mobility Intake Portal",
  },
  {
    id: "siemens",
    name: "Siemens Energy Grid",
    company: "Siemens",
    note: "Technology teal for industrial modernization stories.",
    chips: ["#009999", "#effdfd", "#053d3f"],
    logoMark: "SI",
    headerTitle: "Siemens Supplier Hub",
    headerSubtitle: "Energy Grid Onboarding",
  },
];

const brandThemeMap = new Map(brandThemes.map((theme) => [theme.id, theme]));

export function isBrandThemeId(value: string | null | undefined): value is string {
  return Boolean(value && brandThemeMap.has(value));
}

export function getBrandTheme(themeId: string | null | undefined): BrandTheme {
  if (themeId && brandThemeMap.has(themeId)) {
    return brandThemeMap.get(themeId)!;
  }

  return brandThemes[0];
}

export function readStoredBrandTheme(): string {
  if (typeof window === "undefined") {
    return "default";
  }

  const current = document.documentElement.dataset.brandTheme;
  if (isBrandThemeId(current)) {
    return current;
  }

  try {
    const stored = localStorage.getItem(BRAND_THEME_STORAGE_KEY);
    return isBrandThemeId(stored) ? stored : "default";
  } catch {
    return "default";
  }
}

function buildFaviconDataUrl(theme: BrandTheme): string {
  const bg = encodeURIComponent(theme.chips[0]);
  const fg = encodeURIComponent(theme.chips[1]);
  const mark = theme.logoMark.slice(0, 3).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='${bg}'/><text x='32' y='39' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-weight='700' font-size='20' fill='${fg}'>${mark}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

export function updateBrandFavicon(themeId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const theme = getBrandTheme(themeId);
  const href = buildFaviconDataUrl(theme);
  let link = document.querySelector("link[data-supplierhub='dynamic-favicon']") as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("data-supplierhub", "dynamic-favicon");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = href;
}

export function applyBrandTheme(themeId: string): string {
  const resolved = getBrandTheme(themeId).id;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.brandTheme = resolved;
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(BRAND_THEME_STORAGE_KEY, resolved);
    } catch {
      // Ignore storage write failures.
    }

    updateBrandFavicon(resolved);
    window.dispatchEvent(new CustomEvent(BRAND_THEME_CHANGE_EVENT, { detail: { themeId: resolved } }));
  }

  return resolved;
}
