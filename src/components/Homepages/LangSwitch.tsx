"use client";

import { Check, Languages } from "lucide-react";
import { useLang } from "./LanguageProvider";

export default function LangSwitch() {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Language / Langue"
      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
    >
      <Languages className="ml-2 h-4 w-4 text-slate-400" />

      {(["en", "fr"] as const).map((l) => {
        const active = lang === l;

        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(l)}
            className={`inline-flex h-9 min-w-12 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 ${
              active
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
