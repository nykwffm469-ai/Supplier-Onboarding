"use client";

import { useSyncExternalStore } from "react";

import { BRAND_THEME_CHANGE_EVENT, getBrandTheme, readStoredBrandTheme } from "@/lib/brand-theme";

type BrandWordmarkProps = {
  className?: string;
};

export function BrandWordmark({ className }: BrandWordmarkProps) {
  const themeId = useSyncExternalStore(
    (onStoreChange) => {
      const onThemeChange = () => {
        onStoreChange();
      };

      const onStorage = (event: StorageEvent) => {
        if (event.key === "supplierhub-brand-theme") {
          onStoreChange();
        }
      };

      window.addEventListener(BRAND_THEME_CHANGE_EVENT, onThemeChange);
      window.addEventListener("storage", onStorage);

      return () => {
        window.removeEventListener(BRAND_THEME_CHANGE_EVENT, onThemeChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    readStoredBrandTheme,
    () => "default"
  );
  const brand = getBrandTheme(themeId);

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
