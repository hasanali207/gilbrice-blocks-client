"use client";

import { ArrowUpRight, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "./LanguageProvider";

export default function About() {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Image */}
        <div className="group relative mx-auto w-full max-w-2xl lg:mx-0">
          <div className="absolute -left-4 -top-4 h-32 w-32 rounded-tl-3xl border-l-2 border-t-2 border-orange-400/60 sm:-left-6 sm:-top-6" />

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xl shadow-slate-200/50">
            <Image
              src="/blocks.jpeg"
              width={1200}
              height={900}
              priority={false}
              alt={t(
                "Workers checking freshly pressed concrete blocks beside the block machine",
                "Des ouvriers contrôlent des parpaings fraîchement pressés devant la machine",
              )}
              className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-950/75 p-4 text-white shadow-lg backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold">
                  {t("Quality checked", "Qualité contrôlée")}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
                  {t(
                    "Every batch inspected before dispatch",
                    "Chaque lot contrôlé avant expédition",
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 -right-4 -z-10 h-32 w-32 rounded-br-3xl border-b-2 border-r-2 border-orange-400/60 sm:-bottom-6 sm:-right-6" />
        </div>

        {/* Content */}
        <div className="max-w-2xl">
          <Badge
            variant="outline"
            className="mb-6 gap-2 rounded-full border-orange-200 bg-orange-50 px-4 py-1.5 text-orange-600"
          >
            <MapPin className="h-4 w-4" />
            {t("Made in Douala", "Fabriqué à Douala")}
          </Badge>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {t("Made in Douala, for Douala", "Fabriqué à Douala, pour Douala")}
          </h2>

          <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
            <p>
              {t(
                "Gilbrice Blocks is part of Gilbrice Logistic Group. Our team checks every batch before it leaves the yard, because a solid build begins with good materials.",
                "Gilbrice Blocks fait partie du groupe Gilbrice Logistic. Notre équipe contrôle chaque lot de parpaings avant son départ de l’usine, car un chantier solide commence par de bons matériaux.",
              )}
            </p>

            <p>
              {t(
                "Whether you are building a house, a shop or a warehouse, we help you estimate quantities and plan the delivery.",
                "Que vous construisiez une maison, un magasin ou un entrepôt, nous vous aidons à estimer les quantités et à planifier la livraison.",
              )}
            </p>
          </div>

          {/* Location highlight */}
          <div className="mt-8 flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm ring-1 ring-slate-200">
              <MapPin className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                {t(
                  "Local production, local delivery",
                  "Production locale, livraison locale",
                )}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {t(
                  "Serving construction projects across Douala.",
                  "Au service des chantiers de construction à Douala.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-xl bg-orange-500 px-6 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:w-auto"
            >
              <a href="#quote">
                {t("Talk to our team", "Parler à notre équipe")}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
