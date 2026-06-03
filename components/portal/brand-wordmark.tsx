"use client";

import { useEffect, useState } from "react";

import { BRAND_THEME_CHANGE_EVENT, getBrandTheme, readStoredBrandTheme } from "@/lib/brand-theme";

type BrandWordmarkProps = {
  className?: string;
};

export function BrandWordmark({ className }: BrandWordmarkProps) {
  const [themeId, setThemeId] = useState<string>(() => readStoredBrandTheme());
  const brand = getBrandTheme(themeId);

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const payload = event as CustomEvent<{ themeId?: string }>;
      setThemeId(payload.detail?.themeId ?? readStoredBrandTheme());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "supplierhub-brand-theme") {
        setThemeId(readStoredBrandTheme());
      }
    };

    window.addEventListener(BRAND_THEME_CHANGE_EVENT, onThemeChange as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(BRAND_THEME_CHANGE_EVENT, onThemeChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30">
          <span className="text-[11px] font-semibold uppercase tracking-wide">{brand.logoMark}</span>
        </div>
        <div className="leading-tight">
          <p className="font-semibold tracking-tight text-foreground">{brand.headerTitle}</p>
          <p className="text-xs text-muted-foreground">{brand.headerSubtitle}</p>
        </div>
      </div>
    </div>
  );
}
