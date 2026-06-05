"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      const activeTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark) ? "dark" : "light";
      setTheme(activeTheme);
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Avoid hydration mismatch by rendering a placeholder
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9 rounded-lg" disabled>
        <span className="sr-only">Toggle theme</span>
        <Sun className="size-4 animate-pulse opacity-50" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="size-9 rounded-lg transition-transform hover:scale-105 active:scale-95"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      <span className="sr-only">Toggle theme</span>
      {theme === "light" ? (
        <Sun className="size-4 text-amber-500 transition-all duration-300" />
      ) : (
        <Moon className="size-4 text-blue-400 transition-all duration-300" />
      )}
    </Button>
  );
}
