"use client";

import React, { createContext, useContext, useState } from "react";
import { darkColors, lightColors } from "@/src/theme";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  colors: typeof darkColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      <div data-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeContext must be used inside ThemeProvider");
  return ctx;
}
