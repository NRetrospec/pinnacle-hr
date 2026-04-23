import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type FontSize = "small" | "medium" | "large";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultFontSize?: FontSize;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultFontSize = "medium",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("fontSize") as FontSize) || defaultFontSize;
    }
    return defaultFontSize;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");

    // Determine the resolved theme
    let resolved: "light" | "dark" = "light";
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      resolved = theme;
    }

    // Apply theme class
    root.classList.add(resolved);
    setResolvedTheme(resolved);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const newResolved = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newResolved);
        setResolvedTheme(newResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous font size classes
    root.classList.remove("text-sm", "text-base", "text-lg");

    // Apply font size
    switch (fontSize) {
      case "small":
        root.classList.add("text-sm");
        root.style.fontSize = "14px";
        break;
      case "large":
        root.classList.add("text-lg");
        root.style.fontSize = "18px";
        break;
      default:
        root.classList.add("text-base");
        root.style.fontSize = "16px";
    }
  }, [fontSize]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  };

  const setFontSize = (newSize: FontSize) => {
    localStorage.setItem("fontSize", newSize);
    setFontSizeState(newSize);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        resolvedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
