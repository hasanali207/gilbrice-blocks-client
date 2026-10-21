"use client";

import { ArrowUpRight, Scale, ShieldCheck, Timer, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLang } from "./LanguageProvider";

export default function Why() {
  const { t } = useLang();

  const pts = [
    {
      icon: ShieldCheck,
      title: t("Consistent quality", "Qualité constante"),
      text: t(
        "Every block comes out of the same mould, with the same size and density.",
        "Chaque parpaing sort du même moule, avec la même taille et la même densité.",
      ),
    },
    {
      icon: Scale,
      title: t("Proper mix", "Bon dosage"),
      text: t(
        "Cement, sand and aggregate batched carefully before pressing.",
        "Ciment, sable et gravier dosés avec soin avant le pressage.",
      ),
    },
    {
      icon: Timer,
      title: t("Controlled curing", "Séchage maîtrisé"),
      text: t(
        "Blocks cure before delivery, so fewer break on site.",
        "Les parpaings durcissent avant la livraison, pour moins de casse sur le chantier.",
      ),
    },
    {
      icon: Truck,
      title: t("Reliable delivery", "Livraison fiable"),
      text: t(
        "We deliver on the agreed date so your crew is never left waiting.",
        "Nous livrons à la date convenue pour que votre équipe ne perde pas de temps.",
      ),
    },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
        {/* Section heading */}
        <div className="lg:sticky lg:top-24">
          <Badge
            variant="outline"
            className="mb-6 rounded-full border-orange-400/30 bg-orange-400/10 px-4 py-1.5 text-orange-300"
          >
            {t("Why choose us", "Pourquoi nous choisir")}
          </Badge>

          <h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {t(
              "A good wall starts with a good block",
              "Ce qui fait un bon mur, c’est un bon parpaing",
            )}
          </h2>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-400">
            {t(
              "From careful material selection to delivery at your site, we focus on the details that help your construction project move forward.",
              "Du choix rigoureux des matériaux à la livraison sur votre chantier, nous soignons chaque détail pour faire avancer votre projet de construction.",
            )}
          </p>

          <div className="mt-8 flex items-center gap-3 text-sm font-medium text-orange-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-400/20 bg-orange-400/10">
              <ShieldCheck className="h-5 w-5" />
            </span>

            <span>
              {t("Quality you can build on", "Une qualité sur laquelle bâtir")}
            </span>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {pts.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/30 hover:bg-white/[0.07] sm:p-7"
              >
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-400/10 text-orange-300 transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>

                  <span className="text-sm font-semibold tracking-widest text-slate-600">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white sm:text-xl">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {item.text}
                </p>

                <div className="mt-5 flex justify-end">
                  <ArrowUpRight className="h-4 w-4 text-slate-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-400" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
