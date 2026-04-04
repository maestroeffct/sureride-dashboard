"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { darkColors, lightColors } from "@/src/theme";
import { fetchPublicPlatformConfig } from "@/src/lib/publicPlatformConfig";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  colors: typeof darkColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "sureride_dashboard_theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(resolveInitialTheme);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    const loadBrandTheme = async () => {
      const config = await fetchPublicPlatformConfig();
      if (!mounted || !config?.themeSettings) {
        return;
      }

      const brandColor = config.themeSettings.brandColor?.trim();
      const secondaryColor = config.themeSettings.secondaryColor?.trim();
      const root = document.documentElement;

      if (brandColor) {
        root.style.setProperty("--brand-primary", brandColor);
        root.style.setProperty("--control-accent", brandColor);
        root.style.setProperty("--control-border-hover", brandColor);
      }

      if (secondaryColor) {
        root.style.setProperty("--brand-secondary", secondaryColor);
      }
    };

    void loadBrandTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used inside ThemeProvider");
  }
  return ctx;
}
