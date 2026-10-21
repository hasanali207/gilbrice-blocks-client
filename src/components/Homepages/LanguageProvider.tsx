"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "fr";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (en: string, fr: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
});

const STORAGE_KEY = "gb-lang";

function isLang(value: string | null): value is Lang {
  return value === "en" || value === "fr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (isLang(saved)) {
        setLangState(saved);
      } else if (navigator.language?.toLowerCase().startsWith("fr")) {
        setLangState("fr");
      }
    } catch {
      // Keep English if browser storage is unavailable.
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);

    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // Language still changes for the current session.
    }
  }, []);

  const t = useCallback(
    (en: string, fr: string) => (lang === "fr" ? fr : en),
    [lang],
  );

  // Render the same default language on server and first client render.
  // Prevent switching controls from flashing before saved preference loads.
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
