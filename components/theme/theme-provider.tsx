"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "mini-crm-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  // Function to apply theme
  const applyTheme = React.useCallback((themeToApply: Theme) => {
    if (typeof window === "undefined") return;
    
    const root = window.document.documentElement;
    
    // Always remove dark class first
    root.classList.remove("dark");

    let shouldBeDark = false;
    
    // If system, check OS preference
    if (themeToApply === "system") {
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else if (themeToApply === "dark") {
      shouldBeDark = true;
    }

    // Apply the theme
    if (shouldBeDark) {
      root.classList.add("dark");
    } else {
      // Explicitly ensure dark is removed for light mode
      root.classList.remove("dark");
    }
  }, []);

  // Apply theme immediately on mount
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes when theme is set to "system"
  React.useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("dark");
      if (mediaQuery.matches) {
        root.classList.add("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
