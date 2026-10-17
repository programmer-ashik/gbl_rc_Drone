// src/contexts/ThemeContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// Theme types
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

// Color schemes
export const COLOR_SCHEMES = {
  BLUE: "blue",
  PURPLE: "purple",
  GREEN: "green",
  RED: "red",
  ORANGE: "orange",
  PINK: "pink",
};

// Theme configuration
const themeConfig = {
  [COLOR_SCHEMES.BLUE]: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554",
    },
  },
  [COLOR_SCHEMES.PURPLE]: {
    primary: {
      50: "#f5f3ff",
      100: "#ede9fe",
      200: "#ddd6fe",
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
      800: "#5b21b6",
      900: "#4c1d95",
      950: "#2e1065",
    },
  },
  [COLOR_SCHEMES.GREEN]: {
    primary: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
      950: "#052e16",
    },
  },
  [COLOR_SCHEMES.RED]: {
    primary: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a",
    },
  },
  [COLOR_SCHEMES.ORANGE]: {
    primary: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
      950: "#431407",
    },
  },
  [COLOR_SCHEMES.PINK]: {
    primary: {
      50: "#fdf2f8",
      100: "#fce7f3",
      200: "#fbcfe8",
      300: "#f9a8d4",
      400: "#f472b6",
      500: "#ec4899",
      600: "#db2777",
      700: "#be185d",
      800: "#9d174d",
      900: "#831843",
      950: "#500724",
    },
  },
};

// Context
const ThemeContext = createContext(null);

// Storage keys
const STORAGE_KEYS = {
  THEME: "theme_preference",
  COLOR_SCHEME: "color_scheme_preference",
  FONT_SIZE: "font_size_preference",
};

// Font sizes
export const FONT_SIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
  XLARGE: "xlarge",
};

const fontSizeConfig = {
  [FONT_SIZES.SMALL]: {
    base: "14px",
    scale: 0.9,
  },
  [FONT_SIZES.MEDIUM]: {
    base: "16px",
    scale: 1,
  },
  [FONT_SIZES.LARGE]: {
    base: "18px",
    scale: 1.1,
  },
  [FONT_SIZES.XLARGE]: {
    base: "20px",
    scale: 1.2,
  },
};

export const ThemeProvider = ({ children }) => {
  // State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved || THEMES.SYSTEM;
  });

  const [colorScheme, setColorScheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME);
    return saved || COLOR_SCHEMES.BLUE;
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    return saved || FONT_SIZES.MEDIUM;
  });

  const [systemTheme, setSystemTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // Detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Get current effective theme
  const effectiveTheme = theme === THEMES.SYSTEM ? systemTheme : theme;

  // Apply theme to document
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }

    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);

    // Apply color scheme
    const colors = themeConfig[colorScheme];
    if (colors) {
      Object.entries(colors.primary).forEach(([key, value]) => {
        root.style.setProperty(`--color-primary-${key}`, value);
      });
    }

    // Apply font size
    const fontConfig = fontSizeConfig[fontSize];
    if (fontConfig) {
      root.style.fontSize = fontConfig.base;
      root.style.setProperty("--font-scale", fontConfig.scale);
    }

    // Store preferences
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, colorScheme);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize);

    // Update meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = effectiveTheme === "dark" ? "#1f2937" : "#ffffff";
      metaThemeColor.setAttribute("content", color);
    }
  }, [theme, colorScheme, fontSize, effectiveTheme, mounted]);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === THEMES.LIGHT) return THEMES.DARK;
      if (prev === THEMES.DARK) return THEMES.SYSTEM;
      return THEMES.LIGHT;
    });
  }, []);

  // Set specific theme
  const setThemeMode = useCallback((newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    }
  }, []);

  // Change color scheme
  const changeColorScheme = useCallback((newScheme) => {
    if (Object.values(COLOR_SCHEMES).includes(newScheme)) {
      setColorScheme(newScheme);
    }
  }, []);

  // Change font size
  const changeFontSize = useCallback((newSize) => {
    if (Object.values(FONT_SIZES).includes(newSize)) {
      setFontSize(newSize);
    }
  }, []);

  // Get current theme colors
  const getThemeColors = useCallback(() => {
    return themeConfig[colorScheme] || themeConfig[COLOR_SCHEMES.BLUE];
  }, [colorScheme]);

  // Check if dark mode is active
  const isDark = effectiveTheme === "dark";

  // Context value
  const value = {
    // Current state
    theme,
    effectiveTheme,
    colorScheme,
    fontSize,
    isDark,
    mounted,
    systemTheme,

    // Actions
    toggleTheme,
    setTheme: setThemeMode,
    changeColorScheme,
    changeFontSize,

    // Getters
    getThemeColors,
    getColorScheme: () => colorScheme,
    getFontSize: () => fontSize,

    // Constants
    THEMES,
    COLOR_SCHEMES,
    FONT_SIZES,
    themeConfig,
    fontSizeConfig,

    // Utility
    isSystem: theme === THEMES.SYSTEM,
    isLight: effectiveTheme === "light",
    isDarkMode: effectiveTheme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// HOC to inject theme
export const withTheme = (Component) => {
  return function WrappedComponent(props) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};
