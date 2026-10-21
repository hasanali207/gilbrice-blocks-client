"use client";

import {
  ArrowRight,
  ClipboardList,
  Factory,
  FileText,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLang } from "./LanguageProvider";

export default function Process() {
  const { t } = useLang();

  const steps = [
    {
      icon: ClipboardList,
      title: t("Tell us what you need", "Décrivez votre besoin"),
      text: t(
        "Block type, quantity and site address.",
        "Type de parpaing, quantité et adresse du chantier.",
      ),
    },
    {
      icon: FileText,
      title: t("Get your quote", "Recevez votre devis"),
      text: t(
        "A clear price with no surprises, within 24 hours.",
        "Un prix clair, sans surprise, sous 24 heures.",
      ),
    },
    {
      icon: Factory,
      title: t("We produce", "Nous produisons"),
      text: t(
        "Your order is pressed, cured and loaded.",
        "Votre commande est pressée, séchée et chargée.",
      ),
    },
    {
      icon: Truck,
      title: t("Delivery to site", "Livraison sur site"),
      text: t(
        "Blocks arrive on the planned date.",
        "Les parpaings arrivent à la date prévue.",
      ),
    },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
          <Badge
            variant="outline"
            className="mb-5 rounded-full border-orange-400/30 bg-orange-400/10 px-4 py-1.5 text-orange-300"
          >
            {t("How it works", "Comment ça marche")}
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {t("Ordering is simple", "Commander est simple")}
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-400">
            {t(
              "From your first enquiry to delivery at your site, we make ordering concrete blocks straightforward.",
              "De votre première demande à la livraison sur votre chantier, nous simplifions la commande de parpaings.",
            )}
          </p>
        </div>

        {/* Steps */}
        <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <li
                key={step.title}
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/30 hover:bg-white/[0.07] sm:p-7"
              >
                {/* Connector arrow */}
                {index < steps.length - 1 && (
                  <div className="absolute -right-3 top-11 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-500 lg:flex">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/10 text-orange-300 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>

                  <span className="text-3xl font-extrabold tracking-tight text-white/10 transition-colors group-hover:text-orange-400/40">
                    0{index + 1}
                  </span>
                </div>

                <div className="mt-8 flex-1">
                  <h3 className="text-lg font-bold leading-7 text-white">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {step.text}
                  </p>
                </div>

                <div className="mt-7 h-1 w-10 rounded-full bg-orange-500/40 transition-all duration-300 group-hover:w-16 group-hover:bg-orange-500" />
              </li>
            );
          })}
        </ol>

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center sm:flex-row sm:px-8 sm:text-left">
          <div>
            <h3 className="text-lg font-bold text-white">
              {t("Ready to get started?", "Prêt à commencer ?")}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              {t(
                "Tell us about your project and request a quote.",
                "Parlez-nous de votre projet et demandez un devis.",
              )}
            </p>
          </div>

          <a
            href="#quote"
            className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:w-auto"
          >
            {t("Request a quote", "Demander un devis")}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
