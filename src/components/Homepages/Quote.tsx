"use client";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "./LanguageProvider";

export default function Quote() {
  const { t } = useLang();

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockType, setBlockType] = useState("hollow");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      type: blockType,
      qty: String(formData.get("qty") || "").trim(),
      details: String(formData.get("details") || "").trim(),
    };

    setLoading(true);
    setError("");
    setSent(false);

    try {
      // Connect this endpoint to your actual backend before production.
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("QUOTE_SUBMISSION_FAILED");
      }

      setSent(true);
      form.reset();
      setBlockType("hollow");
    } catch {
      setError(
        t(
          "We could not send your request. Please try again or contact us directly.",
          "Nous n’avons pas pu envoyer votre demande. Réessayez ou contactez-nous directement.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const contactItems = [
    {
      icon: Phone,
      label: t("Phone", "Téléphone"),
      value: "+237 6XX XX XX XX",
      href: "tel:+2376XXXXXXXX",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "+237 6XX XX XX XX",
      href: "https://wa.me/2376XXXXXXXX",
    },
    {
      icon: Mail,
      label: "Email",
      value: "blocks@gilbricelogisticgrp.com",
      href: "mailto:blocks@gilbricelogisticgrp.com",
    },
    {
      icon: MapPin,
      label: t("Address", "Adresse"),
      value: "Douala, Cameroun",
      href: null,
    },
  ];

  return (
    <section
      id="quote"
      className="relative isolate overflow-hidden bg-slate-50 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-100/60 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {/* Contact information */}
        <div className="flex flex-col">
          <Badge
            variant="outline"
            className="mb-6 w-fit gap-2 rounded-full border-orange-200 bg-orange-50 px-4 py-1.5 text-orange-600"
          >
            <ClipboardList className="h-4 w-4" />
            {t("Request a quote", "Demander un devis")}
          </Badge>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {t("Get your quote", "Obtenez votre devis")}
          </h2>

          <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
            {t(
              "Fill in the form and we will reply within 24 hours.",
              "Remplissez le formulaire et nous vous répondons sous 24 heures.",
            )}
          </p>

          <div className="mt-9 space-y-3">
            {contactItems.map((item) => {
              const Icon = item.icon;

              const content = (
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-orange-200 hover:shadow-md">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {item.value}
                    </p>
                  </div>
                </div>
              );

              return item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  {content}
                </a>
              ) : (
                <div key={item.label}>{content}</div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />

              <div>
                <h3 className="font-bold text-slate-900">
                  {t("Need a bulk order?", "Besoin d’une commande en gros ?")}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {t(
                    "Tell us your quantity and delivery location so we can help plan your order.",
                    "Indiquez la quantité et le lieu de livraison pour nous aider à planifier votre commande.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quote form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8 lg:p-10">
          <div className="mb-7">
            <h3 className="text-xl font-bold text-slate-950 sm:text-2xl">
              {t("Tell us about your project", "Parlez-nous de votre projet")}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t(
                "Complete the details below to request your quote.",
                "Remplissez les informations ci-dessous pour demander votre devis.",
              )}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="quote-name"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t("Full name", "Nom complet")} *
                </label>

                <Input
                  id="quote-name"
                  name="name"
                  placeholder={t("Your full name", "Votre nom complet")}
                  autoComplete="name"
                  required
                  maxLength={120}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="quote-phone"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t("Phone number", "Numéro de téléphone")} *
                </label>

                <Input
                  id="quote-phone"
                  name="phone"
                  type="tel"
                  placeholder="+237 6XX XX XX XX"
                  autoComplete="tel"
                  required
                  maxLength={30}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="quote-email"
                className="text-sm font-semibold text-slate-700"
              >
                {t("Email address", "Adresse e-mail")}
              </label>

              <Input
                id="quote-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-orange-500"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  {t("Block type", "Type de parpaing")} *
                </label>

                <Select value={blockType} onValueChange={setBlockType} required>
                  <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/50 focus:ring-orange-500">
                    <SelectValue
                      placeholder={t("Select block type", "Choisir un type")}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="hollow">
                      {t("Hollow blocks", "Parpaings creux")}
                    </SelectItem>
                    <SelectItem value="solid">
                      {t("Solid blocks", "Parpaings pleins")}
                    </SelectItem>
                    <SelectItem value="both">
                      {t("Both types", "Les deux types")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="quote-qty"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t("Estimated quantity", "Quantité estimée")}
                </label>

                <Input
                  id="quote-qty"
                  name="qty"
                  type="number"
                  min="1"
                  max="10000000"
                  step="1"
                  inputMode="numeric"
                  placeholder="1000"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="quote-details"
                className="text-sm font-semibold text-slate-700"
              >
                {t("Project details", "Détails du chantier")}
              </label>

              <Textarea
                id="quote-details"
                name="details"
                placeholder={t(
                  "Tell us about your project, delivery address, required sizes or preferred delivery date...",
                  "Décrivez votre projet, l’adresse de livraison, les dimensions souhaitées ou la date de livraison...",
                )}
                rows={5}
                maxLength={3000}
                className="resize-y rounded-xl border-slate-200 bg-slate-50/50 leading-7 focus-visible:ring-orange-500"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
              >
                {error}
              </p>
            )}

            {sent && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  {t(
                    "Thank you! Your request has been submitted successfully. We will get back to you shortly.",
                    "Merci ! Votre demande a bien été envoyée. Nous vous répondrons très bientôt.",
                  )}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-orange-500 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("Sending request...", "Envoi en cours...")}
                </>
              ) : (
                <>
                  {t("Send my request", "Envoyer ma demande")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs leading-5 text-slate-400">
              {t(
                "* Required fields. Your project details help us prepare an accurate quote.",
                "* Champs obligatoires. Les détails de votre projet nous aident à préparer un devis précis.",
              )}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
