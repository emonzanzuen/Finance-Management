import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage("theme", "system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    let isDarkMode = false;
    if (theme === "dark") {
      isDarkMode = true;
    } else if (theme === "light") {
      isDarkMode = false;
    } else {
      isDarkMode = prefersDark;
    }

    setIsDark(isDarkMode);

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const setLight = () => setTheme("light");
  const setDark = () => setTheme("dark");
  const setSystem = () => setTheme("system");

  return {
    theme,
    isDark,
    toggleTheme,
    setLight,
    setDark,
    setSystem,
  };
};

export default useTheme;