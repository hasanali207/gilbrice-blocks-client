"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Check } from "lucide-react";
import { useLang } from "./LanguageProvider";

function BlockIcon({ variant }: { variant: "hollow" | "solid" | "bulk" }) {
  if (variant === "bulk") {
    return (
      <svg
        viewBox="0 0 80 56"
        aria-hidden="true"
        className="h-24 w-32 drop-shadow-md transition-transform duration-300 group-hover:-translate-y-1"
      >
        <path d="M4 30 40 16l36 14-36 14z" fill="#ff6a00" />
        <path d="M4 30v10l36 12V44z" fill="#c24f00" />
        <path d="M40 44v8l36-12V30z" fill="#8f3a00" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 80 56"
      aria-hidden="true"
      className="h-24 w-32 drop-shadow-md transition-transform duration-300 group-hover:-translate-y-1"
    >
      <path d="M4 18 40 4l36 14-36 14z" fill="#d7d9de" />
      <path d="M4 18v26l36 12V32z" fill="#7a828f" />
      <path d="M40 32v24l36-12V18z" fill="#0b2d6b" />
      {variant === "hollow" && (
        <path d="M22 18l18-6 18 6-18 6z" fill="#434a57" />
      )}
    </svg>
  );
}

export default function Products() {
  const { t } = useLang();

  const sizes = ["10 cm", "15 cm", "20 cm"];

  const rows = [
    {
      v: "hollow" as const,
      number: "01",
      title: t("Hollow blocks", "Parpaings creux"),
      text: t(
        "Load-bearing walls, partitions and fences. Lighter to handle and quick to lay.",
        "Murs porteurs, cloisons et clôtures. Plus légers à manipuler et rapides à poser.",
      ),
      chips: sizes,
    },
    {
      v: "solid" as const,
      number: "02",
      title: t("Solid blocks", "Parpaings pleins"),
      text: t(
        "Foundations, plinths and heavily loaded areas that need extra mass.",
        "Fondations, soubassements et zones très sollicitées qui demandent plus de masse.",
      ),
      chips: sizes,
    },
    {
      v: "bulk" as const,
      number: "03",
      title: t("Bulk and project orders", "Commandes en gros"),
      text: t(
        "Full pallets and staged deliveries for contractors and developers.",
        "Palettes complètes et livraisons échelonnées pour les entrepreneurs et les promoteurs.",
      ),
      chips: [t("Made to order", "Sur mesure")],
    },
  ];

  return (
    <section
      id="products"
      className="relative overflow-hidden bg-slate-50 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-orange-100/60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <Badge
            variant="outline"
            className="mb-4 rounded-full border-orange-200 bg-orange-50 px-4 py-1.5 text-orange-600"
          >
            {t("Our products", "Nos produits")}
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {t("Our blocks", "Nos parpaings")}
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {t(
              "Pick the block that suits your wall. Need a specific size? Tell us and we will check.",
              "Choisissez le parpaing adapté à votre ouvrage. Besoin d’une dimension précise ? Dites-le-nous.",
            )}
          </p>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <article
              key={r.v}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/60"
            >
              {/* Illustration */}
              <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/70">
                <span className="absolute left-5 top-5 text-xs font-bold tracking-[0.2em] text-slate-400">
                  {r.number}
                </span>

                <div className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white/80 text-slate-400 transition-colors group-hover:text-orange-500">
                  <ArrowUpRight className="h-4 w-4" />
                </div>

                <div className="absolute bottom-0 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                <BlockIcon variant={r.v} />
              </div>

              {/* Details */}
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  {r.title}
                </h3>

                <p className="mt-3 min-h-[72px] text-sm leading-7 text-slate-500">
                  {r.text}
                </p>

                {/* Available sizes */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {r.chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors group-hover:border-orange-100"
                    >
                      {r.v !== "bulk" && (
                        <Check className="h-3 w-3 text-orange-500" />
                      )}
                      {chip}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-7 border-t border-slate-100 pt-5">
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto w-full justify-between rounded-xl px-3 py-3 font-semibold text-slate-800 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <a href="#quote">
                      {t("Request a quote", "Demander un devis")}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:px-7">
          <p className="text-center text-sm leading-6 text-slate-600 sm:text-left">
            {t(
              "Looking for a custom size or a large quantity?",
              "Vous recherchez une dimension spécifique ou une grande quantité ?",
            )}
          </p>

          <Button
            asChild
            className="w-full shrink-0 rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600 sm:w-auto"
          >
            <a href="#quote">
              {t("Talk to our team", "Contactez notre équipe")}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
