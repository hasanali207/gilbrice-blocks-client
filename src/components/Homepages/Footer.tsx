"use client";
import Image from "next/image";
import { useLang } from "./LanguageProvider";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer>
      <div className="wrap">
        <div className="fgrid">
          <Image src="/images/logo.png" width={130} height={130} alt="Gilbrice Blocks logo" />
          <p style={{ margin: 0, maxWidth: "36ch" }}>{t("Quality concrete blocks in Douala, Cameroon.", "Parpaings de qualité à Douala, Cameroun.")}</p>
          <p style={{ margin: 0 }}>blocks.gilbricelogisticgrp.com</p>
        </div>
        <small>© 2026 Gilbrice Blocks · Gilbrice Logistic Group</small>
      </div>
    </footer>
  );
}
