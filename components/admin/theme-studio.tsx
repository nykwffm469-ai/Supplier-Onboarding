"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applyBrandTheme,
  brandThemes,
  BRAND_THEME_CHANGE_EVENT,
  getBrandTheme,
  isBrandThemeId,
  readStoredBrandTheme,
} from "@/lib/brand-theme";
import { cn } from "@/lib/utils";

export function ThemeStudio() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTheme, setActiveTheme] = useState<string>(() => readStoredBrandTheme());
  const [packStatus, setPackStatus] = useState<string>("");

  const selectedTheme = useMemo(
    () => getBrandTheme(activeTheme),
    [activeTheme]
  );

  useEffect(() => {
    applyBrandTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const payload = event as CustomEvent<{ themeId?: string }>;
      setActiveTheme(payload.detail?.themeId ?? readStoredBrandTheme());
    };

    window.addEventListener(BRAND_THEME_CHANGE_EVENT, onThemeChange as EventListener);
    return () => window.removeEventListener(BRAND_THEME_CHANGE_EVENT, onThemeChange as EventListener);
  }, []);

  function applyTheme(themeId: string) {
    setActiveTheme(applyBrandTheme(themeId));
    setPackStatus("");
  }

  function exportThemePack() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      activeTheme,
      presets: brandThemes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        company: theme.company,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `supplier-hub-theme-pack-${activeTheme}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
    setPackStatus("Theme pack exported.");
  }

  async function handleImportThemePack(event: { target: EventTarget & HTMLInputElement }) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { activeTheme?: unknown; themeId?: unknown };
      const candidate =
        typeof parsed.activeTheme === "string"
          ? parsed.activeTheme
          : typeof parsed.themeId === "string"
            ? parsed.themeId
            : "";

      if (!isBrandThemeId(candidate)) {
        throw new Error("No valid theme id found in the file.");
      }

      setActiveTheme(applyBrandTheme(candidate));
      setPackStatus(`Imported theme pack. Active theme set to ${getBrandTheme(candidate).name}.`);
    } catch (error) {
      setPackStatus(error instanceof Error ? `Import failed: ${error.message}` : "Import failed.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Palette className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Demo Brand Layer</span>
          </div>
          <CardTitle>Theme Studio</CardTitle>
          <CardDescription>
            Switch the entire demo visual identity in one click before walkthroughs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Active preset: <span className="font-semibold text-foreground">{selectedTheme.name}</span>
          </p>
          <p>{selectedTheme.note}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={exportThemePack}>
              Export JSON Pack
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => importInputRef.current?.click()}
            >
              Import JSON Pack
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => void handleImportThemePack(e)}
              aria-label="Import theme pack file"
            />
          </div>
          {packStatus ? <p className="text-xs font-medium text-primary">{packStatus}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {brandThemes.map((theme) => {
          const isActive = theme.id === activeTheme;

          return (
            <Card key={theme.id} className={cn("border-border/80", isActive && "ring-2 ring-ring") }>
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{theme.name}</CardTitle>
                  {isActive ? <Badge className="bg-primary text-primary-foreground">Active</Badge> : null}
                </div>
                <CardDescription>{theme.company}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {theme.chips.map((chip) => (
                    <span
                      key={chip}
                      className="h-6 w-6 rounded-full border border-border"
                      style={{ backgroundColor: chip }}
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{theme.note}</p>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  variant={isActive ? "secondary" : "outline"}
                  onClick={() => applyTheme(theme.id)}
                >
                  {isActive ? <Check className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
                  {isActive ? "Applied" : "Apply theme"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
