"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface PartnerLedgerExportRow {
  partnerId: string;
  companyName: string;
  trackingPrefix: string;
  totalCharges: number;
  totalSettlements: number;
  outstanding: number;
  creditLimit: number | null;
  availableCredit: number | null;
  isActive: boolean;
}

export interface PartnerLedgerExportFilters {
  search: string;
  balanceStatus: "ALL" | "OUTSTANDING" | "SETTLED" | "EXCEEDED";
  dateFrom: string;
  dateTo: string;
}

const COMPANY_NAME = "Gilbrice Logistic Group";
const WEBSITE = "https://gilbricelogisticgrp.com";

const money = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount) ? amount : 0;
};

const formatAmount = (value: number | string | null | undefined) => {
  return money(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ============================================================
   FILTER ROWS
   ============================================================ */

export const filterPartnerLedgerRows = (
  rows: PartnerLedgerExportRow[],
  filters: PartnerLedgerExportFilters,
) => {
  const search = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    /* SEARCH */

    if (
      search &&
      !row.companyName.toLowerCase().includes(search) &&
      !row.trackingPrefix.toLowerCase().includes(search)
    ) {
      return false;
    }

    /* BALANCE STATUS */

    if (filters.balanceStatus === "OUTSTANDING" && row.outstanding <= 0) {
      return false;
    }

    if (filters.balanceStatus === "SETTLED" && row.outstanding > 0) {
      return false;
    }

    if (
      filters.balanceStatus === "EXCEEDED" &&
      !(row.creditLimit !== null && row.outstanding > row.creditLimit)
    ) {
      return false;
    }

    return true;
  });
};

/* ============================================================
   SUMMARY
   ============================================================ */

export const calculatePartnerLedgerSummary = (
  rows: PartnerLedgerExportRow[],
) => {
  return {
    totalPartners: rows.length,

    activePartners: rows.filter((row) => row.isActive).length,

    inactivePartners: rows.filter((row) => !row.isActive).length,

    totalCharges: rows.reduce((sum, row) => sum + money(row.totalCharges), 0),

    totalSettlements: rows.reduce(
      (sum, row) => sum + money(row.totalSettlements),
      0,
    ),

    totalOutstanding: rows.reduce(
      (sum, row) => sum + money(row.outstanding),
      0,
    ),

    totalCreditLimit: rows.reduce(
      (sum, row) => sum + money(row.creditLimit),
      0,
    ),

    totalAvailableCredit: rows.reduce(
      (sum, row) => sum + money(row.availableCredit),
      0,
    ),

    outstandingPartners: rows.filter((row) => row.outstanding > 0).length,

    exceededPartners: rows.filter(
      (row) => row.creditLimit !== null && row.outstanding > row.creditLimit,
    ).length,
  };
};

/* ============================================================
   PDF
   ============================================================ */

export const generatePartnerLedgerReportPdf = (
  rows: PartnerLedgerExportRow[],
  filters: PartnerLedgerExportFilters,
): Blob => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const filteredRows = filterPartnerLedgerRows(rows, filters);

  const summary = calculatePartnerLedgerSummary(filteredRows);

  const pageWidth = doc.internal.pageSize.getWidth();

  /* ========================================================
     HEADER
  ======================================================== */

  doc.setFont("helvetica", "bold");

  doc.setFontSize(18);

  doc.text(COMPANY_NAME, 14, 15);

  doc.setFontSize(14);

  doc.text("Partner Ledger Report", 14, 23);

  doc.setFont("helvetica", "normal");

  doc.setFontSize(8);

  doc.text(`Generated on: ${formatDateTime(new Date())}`, pageWidth - 14, 14, {
    align: "right",
  });

  doc.text(`Printed from: ${WEBSITE}`, pageWidth - 14, 19, {
    align: "right",
  });

  /* ========================================================
     FILTER INFO
  ======================================================== */

  const filterParts: string[] = [];

  if (filters.search.trim()) {
    filterParts.push(`Search: ${filters.search.trim()}`);
  }

  if (filters.balanceStatus !== "ALL") {
    filterParts.push(
      `Balance: ${getBalanceStatusLabel(filters.balanceStatus)}`,
    );
  }

  if (filters.dateFrom) {
    filterParts.push(`From: ${filters.dateFrom}`);
  }

  if (filters.dateTo) {
    filterParts.push(`To: ${filters.dateTo}`);
  }

  const filterText = filterParts.length
    ? `Filters: ${filterParts.join(" | ")}`
    : "Filters: All";

  doc.setFontSize(8);

  doc.text(filterText, 14, 30);

  /* ========================================================
     SUMMARY CARDS
  ======================================================== */

  const summaryY = 36;

  const cards = [
    ["Partners", summary.totalPartners, false],

    ["Total Charges", summary.totalCharges, true],

    ["Settlements", summary.totalSettlements, true],

    ["Outstanding", summary.totalOutstanding, true],

    ["Credit Limit", summary.totalCreditLimit, true],

    ["Available Credit", summary.totalAvailableCredit, true],

    ["Outstanding Partners", summary.outstandingPartners, false],

    ["Over Limit", summary.exceededPartners, false],
  ] as Array<[string, number, boolean]>;

  const cardWidth = 33;
  const cardHeight = 16;
  const gap = 2;

  cards.forEach(([label, value, isMoney], index) => {
    const x = 14 + index * (cardWidth + gap);

    doc.setDrawColor(210, 210, 210);

    doc.setFillColor(248, 249, 250);

    doc.roundedRect(x, summaryY, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFont("helvetica", "normal");

    doc.setFontSize(6);

    doc.text(label, x + 3, summaryY + 5);

    doc.setFont("helvetica", "bold");

    doc.setFontSize(8);

    const displayValue = isMoney ? `$ ${formatAmount(value)}` : String(value);

    doc.text(displayValue, x + 3, summaryY + 11);
  });

  /* ========================================================
     TABLE
  ======================================================== */

  const tableRows = filteredRows.map((row) => {
    const exceeded =
      row.creditLimit !== null && row.outstanding > row.creditLimit;

    let status = "Settled";

    if (!row.isActive) {
      status = "Inactive";
    } else if (exceeded) {
      status = "Over Limit";
    } else if (row.outstanding > 0) {
      status = "Outstanding";
    }

    return [
      row.companyName,

      row.trackingPrefix,

      `$ ${formatAmount(row.totalCharges)}`,

      `$ ${formatAmount(row.totalSettlements)}`,

      `$ ${formatAmount(row.outstanding)}`,

      row.creditLimit !== null
        ? `$ ${formatAmount(row.creditLimit)}`
        : "No limit",

      row.availableCredit !== null
        ? `$ ${formatAmount(row.availableCredit)}`
        : "-",

      status,
    ];
  });

  autoTable(doc, {
    startY: 58,

    head: [
      [
        "Partner",
        "Tracking Prefix",
        "Total Charges",
        "Settlements",
        "Outstanding",
        "Credit Limit",
        "Available Credit",
        "Status",
      ],
    ],

    body: tableRows,

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 2.5,
      valign: "middle",
    },

    headStyles: {
      fontStyle: "bold",
      fillColor: [45, 55, 72],
      textColor: [255, 255, 255],
      fontSize: 7,
    },

    columnStyles: {
      0: {
        cellWidth: 45,
      },

      1: {
        cellWidth: 32,
      },

      2: {
        cellWidth: 31,
        halign: "right",
      },

      3: {
        cellWidth: 31,
        halign: "right",
      },

      4: {
        cellWidth: 31,
        halign: "right",
      },

      5: {
        cellWidth: 31,
        halign: "right",
      },

      6: {
        cellWidth: 34,
        halign: "right",
      },

      7: {
        cellWidth: 30,
        halign: "center",
      },
    },

    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) {
        const value = String(data.cell.raw ?? "");

        if (value === "Over Limit" || value === "Outstanding") {
          data.cell.styles.fontStyle = "bold";
        }
      }
    },

    margin: {
      left: 10,
      right: 10,
      bottom: 18,
    },
  });

  /* ========================================================
     FOOTER
  ======================================================== */

  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont("helvetica", "normal");

    doc.setFontSize(7);

    doc.text(
      `Partner Ledger Report • Page ${page} of ${totalPages}`,
      14,
      pageHeight - 8,
    );

    doc.text(WEBSITE, pageWidth - 14, pageHeight - 8, {
      align: "right",
    });
  }

  return doc.output("blob");
};

/* ============================================================
   EXCEL
   ============================================================ */

export const generatePartnerLedgerReportExcel = (
  rows: PartnerLedgerExportRow[],
  filters: PartnerLedgerExportFilters,
): Blob => {
  const filteredRows = filterPartnerLedgerRows(rows, filters);

  const summary = calculatePartnerLedgerSummary(filteredRows);

  /* ========================================================
     DETAIL SHEET
  ======================================================== */

  const detailRows = filteredRows.map((row) => {
    const exceeded =
      row.creditLimit !== null && row.outstanding > row.creditLimit;

    let status = "Settled";

    if (!row.isActive) {
      status = "Inactive";
    } else if (exceeded) {
      status = "Over Limit";
    } else if (row.outstanding > 0) {
      status = "Outstanding";
    }

    return {
      Partner: row.companyName,

      "Tracking Prefix": row.trackingPrefix,

      "Total Charges": money(row.totalCharges),

      "Total Settlements": money(row.totalSettlements),

      Outstanding: money(row.outstanding),

      "Credit Limit": row.creditLimit !== null ? money(row.creditLimit) : null,

      "Available Credit":
        row.availableCredit !== null ? money(row.availableCredit) : null,

      Status: status,

      Active: row.isActive ? "Yes" : "No",

      "Partner ID": row.partnerId,
    };
  });

  const detailSheet = XLSX.utils.json_to_sheet(detailRows);

  detailSheet["!cols"] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 40 },
  ];

  /* ========================================================
     SUMMARY SHEET
  ======================================================== */

  const summaryRows = [
    {
      Report: "Partner Ledger Report",
      Value: "",
    },

    {
      Report: "Generated On",
      Value: formatDateTime(new Date()),
    },

    {
      Report: "Printed From",
      Value: WEBSITE,
    },

    {
      Report: "Date From",
      Value: filters.dateFrom || "All",
    },

    {
      Report: "Date To",
      Value: filters.dateTo || "All",
    },

    {
      Report: "Balance Filter",
      Value: getBalanceStatusLabel(filters.balanceStatus),
    },

    {
      Report: "Search",
      Value: filters.search || "All",
    },

    {
      Report: "Total Partners",
      Value: summary.totalPartners,
    },

    {
      Report: "Active Partners",
      Value: summary.activePartners,
    },

    {
      Report: "Inactive Partners",
      Value: summary.inactivePartners,
    },

    {
      Report: "Total Charges",
      Value: summary.totalCharges,
    },

    {
      Report: "Total Settlements",
      Value: summary.totalSettlements,
    },

    {
      Report: "Total Outstanding",
      Value: summary.totalOutstanding,
    },

    {
      Report: "Total Credit Limit",
      Value: summary.totalCreditLimit,
    },

    {
      Report: "Total Available Credit",
      Value: summary.totalAvailableCredit,
    },

    {
      Report: "Partners With Outstanding",
      Value: summary.outstandingPartners,
    },

    {
      Report: "Partners Over Credit Limit",
      Value: summary.exceededPartners,
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  summarySheet["!cols"] = [{ wch: 35 }, { wch: 45 }];

  /* ========================================================
     WORKBOOK
  ======================================================== */

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, detailSheet, "Partner Ledger");

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  const arrayBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/* ============================================================
   LABEL
   ============================================================ */

const getBalanceStatusLabel = (
  status: "ALL" | "OUTSTANDING" | "SETTLED" | "EXCEEDED",
) => {
  switch (status) {
    case "OUTSTANDING":
      return "Outstanding";

    case "SETTLED":
      return "Fully Settled";

    case "EXCEEDED":
      return "Credit Exceeded";

    default:
      return "All Balances";
  }
};

/* ============================================================
   DOWNLOAD
   ============================================================ */

export const downloadPartnerLedgerBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};
