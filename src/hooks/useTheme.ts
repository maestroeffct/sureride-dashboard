import { useThemeContext } from "@/src/providers/ThemeProvider";

export const useTheme = () => {
  return useThemeContext();
};
