"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "./LanguageProvider";

export default function Hero() {
  const { t } = useLang();

  return (
    <section className="relative isolate overflow-hidden bg-[#0f1f4d] text-white">
      {/* Background image */}
      <Image
        src="/hero.jpg"
        alt={t(
          "Workers stacking concrete blocks at a block factory",
          "Ouvriers empilant des parpaings dans une usine de blocs",
        )}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-right"
      />

      {/* Navy overlay: strong on the left (text side), fading out to the right */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#0f1f4d] via-[#0f1f4d]/85 to-[#0f1f4d]/10" />

      <div className="mx-auto flex min-h-[580px] max-w-7xl items-center px-5 py-20 sm:px-8 lg:min-h-[720px] lg:px-12 lg:py-28">
        <div className="max-w-2xl">
          {/* Location tag */}
          <div className="mb-7 inline-block border-l-4 border-orange-500 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            {t("Douala, Cameroon", "Douala, Cameroun")}
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
            {t(
              "Quality Concrete Blocks for Your Next Project",
              "Des parpaings de qualité pour vos projets de construction",
            )}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
            {t(
              "Hollow and solid blocks made on an automated press and delivered to your site, from a garden wall to a multi-storey build.",
              "Parpaings creux et pleins, fabriqués sur une presse automatique et livrés sur votre chantier, du petit mur de clôture au grand immeuble.",
            )}
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-sm bg-orange-500 px-6 text-base font-semibold text-white transition hover:bg-orange-600"
            >
              <Link href="#quote">
                {t("Request a quote", "Demander un devis")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-sm border-2 border-white/70 bg-transparent px-6 text-base font-semibold text-white transition hover:bg-white/10 hover:text-white"
            >
              <Link href="#products">
                {t("See our blocks", "Voir nos parpaings")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
