"use client";

import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
] as const;

const STORAGE_KEY = "craftisle-language";

function getSavedLang(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(STORAGE_KEY) || "en";
}

/**
 * Language switcher dropdown — 10 languages, persisted to localStorage.
 * Switch selects locale preference; translations render on next page load.
 */
export function LanguageSwitcher() {
  // Hide until translations are ready
  if (
    typeof process === "undefined" ||
    !process.env.NEXT_PUBLIC_I18N_ENABLED ||
    process.env.NEXT_PUBLIC_I18N_ENABLED !== "true"
  ) {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentLang(getSavedLang());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(lang: string) {
    setCurrentLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setIsOpen(false);
  }

  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-lg border bg-popover shadow-lg z-50 py-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                currentLang === lang.code
                  ? "text-primary font-medium bg-muted/50"
                  : "text-foreground"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
