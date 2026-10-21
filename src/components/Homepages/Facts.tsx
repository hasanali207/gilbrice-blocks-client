"use client";

import { ArrowUpRight, Blocks, Clock3, Settings2, Truck } from "lucide-react";

import { useLang } from "./LanguageProvider";

const icons = [Blocks, Settings2, Truck, Clock3];

export default function Facts() {
  const { t } = useLang();

  const items = [
    {
      title: t("Hollow and solid", "Creux et pleins"),
      sub: t(
        "Several thicknesses available",
        "Plusieurs épaisseurs disponibles",
      ),
    },
    {
      title: t("Machine pressed", "Pressés à la machine"),
      sub: t("Consistent shape and density", "Forme et densité régulières"),
    },
    {
      title: t("Delivery in Douala", "Livraison à Douala"),
      sub: t("Straight to your site", "Directement sur votre chantier"),
    },
    {
      title: t("Fast quotes", "Devis rapide"),
      sub: t("Reply within 24 hours", "Réponse sous 24 heures"),
    },
  ];

  return (
    <section className="relative z-10 bg-white px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = icons[index];

            return (
              <div
                key={item.title}
                className="group relative flex items-start gap-4 p-5 transition-colors duration-300 hover:bg-orange-50/70 sm:p-6 lg:p-5 xl:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:ring-orange-500">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold leading-6 text-slate-900 sm:text-base">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.sub}
                  </p>
                </div>

                <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-orange-500 group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
