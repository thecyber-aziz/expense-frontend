import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("et_theme");
      return saved ? saved === "dark" : false; // light by default
    } catch { return false; }
  });

  useEffect(() => {
    try {
      localStorage.setItem("et_theme", dark ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}