"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "./LanguageProvider";

function BlockIcon({ variant }: { variant: "block" | "hourdis" }) {
  return (
    <svg
      viewBox="0 0 80 56"
      aria-hidden="true"
      className="h-24 w-32 drop-shadow-md transition-transform duration-300 group-hover:-translate-y-1"
    >
      <path d="M4 18 40 4l36 14-36 14z" fill="#d7d9de" />
      <path d="M4 18v26l36 12V32z" fill="#7a828f" />
      <path d="M40 32v24l36-12V18z" fill="#0b2d6b" />
      {variant === "block" ? (
        <path d="M22 18l18-6 18 6-18 6z" fill="#434a57" />
      ) : (
        <>
          <path d="M14 18l10-4 10 4-10 4z" fill="#434a57" />
          <path d="M30 18l10-4 10 4-10 4z" fill="#434a57" />
          <path d="M46 18l10-4 10 4-10 4z" fill="#434a57" />
        </>
      )}
    </svg>
  );
}

export default function Products() {
  const { t } = useLang();

  const products = [
    {
      number: "01",
      title: "Parpaings de 10",
      sub: t("10 cm blocks", "Blocs de 10 cm"),
      price: 300,
      v: "block" as const,
    },
    {
      number: "02",
      title: "Parpaings de 10/40",
      sub: t("10/40 blocks", "Blocs 10/40"),
      price: 325,
      v: "block" as const,
    },
    {
      number: "03",
      title: "Parpaings de 15",
      sub: t("15 cm blocks", "Blocs de 15 cm"),
      price: 350,
      v: "block" as const,
    },
    {
      number: "04",
      title: "Parpaings de 12/50",
      sub: t("12/50 blocks", "Blocs 12/50"),
      price: 400,
      v: "block" as const,
    },
    {
      number: "05",
      title: "Hourdis",
      sub: t("Hollow floor blocks", "Hourdis pour planchers"),
      price: 450,
      v: "hourdis" as const,
    },
    {
      number: "06",
      title: "Parpaings de 20",
      sub: t("20 cm blocks", "Blocs de 20 cm"),
      price: 450,
      v: "block" as const,
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
            {t(
              "Price list · Douala, Cameroon",
              "Grille tarifaire · Douala, Cameroun",
            )}
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {t("Our blocks", "Nos parpaings")}
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {t(
              "Vibrated concrete blocks. Pick the block that suits your wall. Need a specific size? Tell us and we will check.",
              "Parpaings vibrés. Choisissez le parpaing adapté à votre ouvrage. Besoin d’une dimension précise ? Dites-le-nous.",
            )}
          </p>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article
              key={p.number}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/60"
            >
              {/* Illustration */}
              <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/70">
                <span className="absolute left-5 top-5 text-xs font-bold tracking-[0.2em] text-slate-400">
                  {p.number}
                </span>

                <div className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white/80 text-slate-400 transition-colors group-hover:text-orange-500">
                  <ArrowUpRight className="h-4 w-4" />
                </div>

                <div className="absolute bottom-0 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                <BlockIcon variant={p.v} />
              </div>

              {/* Details */}
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{p.sub}</p>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-orange-500">
                    {p.price}
                  </span>
                  <span className="text-lg font-bold text-orange-500">
                    FCFA
                  </span>
                  <span className="text-xs text-slate-400">
                    / {t("block", "l’unité")}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 pt-5">
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
              "Prices per block. Looking for a large quantity or a custom size?",
              "Prix à l’unité. Vous recherchez une grande quantité ou une dimension spécifique ?",
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
