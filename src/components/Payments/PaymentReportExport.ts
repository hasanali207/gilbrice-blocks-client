"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface PaymentReportPartner {
  id: string;
  companyName: string;
}

export interface PaymentReportPayment {
  id: string;
  shipmentId: string;
  direction?: string | null;
  amount: string | number;
  method: string;
  status: string;
  transactionRef?: string | null;
  recordedById?: string | null;
  isVoided?: boolean;
  voidReason?: string | null;
  paidAt: string;
  createdAt: string;

  shipment?: {
    id: string;
    trackingNumber?: string | null;
    partnerId?: string | null;
    finalCustomerAmount?: string | number | null;
    amountPaidByCustomer?: string | number | null;
    customerBalance?: string | number | null;
    status?: string | null;

    customer?: {
      id: string;
      fullName?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
    } | null;
  } | null;

  recordedBy?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export interface PaymentReportFilters {
  partnerFilter: string;
  methodFilter: string;
  statusFilter: string;
  customerSearch: string;
  dateFrom: string;
  dateTo: string;
}

export interface PaymentReportSummary {
  total: number;
  today: number;
  thisMonth: number;
  cash: number;
  stripe: number;
  bankTransfer: number;
  mobileBanking: number;
  voided: number;
}

const COMPANY_NAME = "Gilbrice Logistic Group";
const WEBSITE = "https://gilbricelogisticgrp.com";

const money = (value: string | number | null | undefined): number => {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount) ? amount : 0;
};

const formatAmount = (value: string | number | null | undefined): string => {
  return money(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOnly = (value?: string | null): string => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const paymentMethodLabel = (method?: string | null): string => {
  switch (method) {
    case "CASH":
      return "Cash";

    case "BANK_TRANSFER":
      return "Bank Transfer";

    case "MOBILE_BANKING":
      return "Mobile Banking";

    case "CARD":
      return "Card";

    case "ONLINE_GATEWAY":
      return "Online Gateway";

    case "STRIPE":
      return "Stripe";

    case "CHEQUE":
      return "Cheque";

    default:
      return method || "-";
  }
};

const paymentStatusLabel = (
  status?: string | null,
  isVoided?: boolean,
): string => {
  if (isVoided) return "VOIDED";

  switch (status) {
    case "CONFIRMED":
      return "Confirmed";

    case "PENDING":
      return "Pending";

    case "VOIDED":
      return "Voided";

    default:
      return status || "-";
  }
};

const getPartnerName = (
  payment: PaymentReportPayment,
  partnerMap: Map<string, string>,
): string => {
  const partnerId = payment.shipment?.partnerId;

  if (!partnerId) return "-";

  return partnerMap.get(partnerId) || "-";
};

const getCustomerName = (payment: PaymentReportPayment): string => {
  return payment.shipment?.customer?.fullName || "-";
};

const getTrackingNumber = (payment: PaymentReportPayment): string => {
  return payment.shipment?.trackingNumber || "-";
};

/* ============================================================
   APPLY CLIENT-SIDE CUSTOMER SEARCH
   ============================================================ */

export const filterPaymentReportPayments = (
  payments: PaymentReportPayment[],
  customerSearch: string,
): PaymentReportPayment[] => {
  const term = customerSearch.trim().toLowerCase();

  if (!term) return payments;

  return payments.filter((payment) => {
    const customer = payment.shipment?.customer;

    return (
      customer?.fullName?.toLowerCase().includes(term) ||
      customer?.phone?.toLowerCase().includes(term) ||
      customer?.whatsapp?.toLowerCase().includes(term) ||
      payment.shipment?.trackingNumber?.toLowerCase().includes(term)
    );
  });
};

/* ============================================================
   SUMMARY
   ============================================================ */

export const calculatePaymentReportSummary = (
  payments: PaymentReportPayment[],
): PaymentReportSummary => {
  const confirmed = payments.filter(
    (payment) => !payment.isVoided && payment.status === "CONFIRMED",
  );

  const now = new Date();

  const today = now.toDateString();

  const thisMonth = now.getMonth();

  const thisYear = now.getFullYear();

  const byMethod = (method: string) =>
    confirmed
      .filter((payment) => payment.method === method)
      .reduce((sum, payment) => sum + money(payment.amount), 0);

  return {
    total: confirmed.reduce((sum, payment) => sum + money(payment.amount), 0),

    today: confirmed
      .filter((payment) => new Date(payment.paidAt).toDateString() === today)
      .reduce((sum, payment) => sum + money(payment.amount), 0),

    thisMonth: confirmed
      .filter((payment) => {
        const date = new Date(payment.paidAt);

        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      })
      .reduce((sum, payment) => sum + money(payment.amount), 0),

    cash: byMethod("CASH"),

    stripe: byMethod("STRIPE"),

    bankTransfer: byMethod("BANK_TRANSFER"),

    mobileBanking: byMethod("MOBILE_BANKING"),

    voided: payments
      .filter((payment) => payment.isVoided)
      .reduce((sum, payment) => sum + money(payment.amount), 0),
  };
};

/* ============================================================
   PDF
   ============================================================ */

export const generatePaymentReportPdf = (
  payments: PaymentReportPayment[],
  partners: PaymentReportPartner[],
  filters: PaymentReportFilters,
): Blob => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const partnerMap = new Map(
    partners.map((partner) => [partner.id, partner.companyName]),
  );

  const summary = calculatePaymentReportSummary(payments);

  const filteredPayments = filterPaymentReportPayments(
    payments,
    filters.customerSearch,
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  /* ========================================================
     HEADER
  ======================================================== */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);

  doc.text(COMPANY_NAME, 14, 15);

  doc.setFontSize(14);

  doc.text("Customer Payment Report", 14, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text(
    `Generated on: ${formatDateTime(new Date().toISOString())}`,
    pageWidth - 14,
    14,
    {
      align: "right",
    },
  );

  doc.text(`Printed from: ${WEBSITE}`, pageWidth - 14, 19, {
    align: "right",
  });

  /* ========================================================
     FILTER INFO
  ======================================================== */

  let filterText = "Filters: All";

  const filterParts: string[] = [];

  if (filters.partnerFilter !== "ALL") {
    const partnerName = partnerMap.get(filters.partnerFilter);

    if (partnerName) {
      filterParts.push(`Partner: ${partnerName}`);
    }
  }

  if (filters.methodFilter !== "ALL") {
    filterParts.push(`Method: ${paymentMethodLabel(filters.methodFilter)}`);
  }

  if (filters.statusFilter !== "ALL") {
    filterParts.push(`Status: ${paymentStatusLabel(filters.statusFilter)}`);
  }

  if (filters.dateFrom) {
    filterParts.push(`From: ${filters.dateFrom}`);
  }

  if (filters.dateTo) {
    filterParts.push(`To: ${filters.dateTo}`);
  }

  if (filters.customerSearch.trim()) {
    filterParts.push(`Customer: ${filters.customerSearch.trim()}`);
  }

  if (filterParts.length > 0) {
    filterText = `Filters: ${filterParts.join(" | ")}`;
  }

  doc.setFontSize(8);

  doc.text(filterText, 14, 30);

  /* ========================================================
     SUMMARY
  ======================================================== */

  const summaryY = 36;

  const cards = [
    ["Total Payments", summary.total],
    ["Today", summary.today],
    ["This Month", summary.thisMonth],
    ["Cash", summary.cash],
    ["Stripe", summary.stripe],
    ["Bank Transfer", summary.bankTransfer],
    ["Mobile Banking", summary.mobileBanking],
    ["Voided", summary.voided],
  ];

  const cardWidth = 33;
  const cardHeight = 16;
  const gap = 2;

  cards.forEach(([label, value], index) => {
    const x = 14 + index * (cardWidth + gap);

    doc.setDrawColor(210, 210, 210);
    doc.setFillColor(248, 249, 250);

    doc.roundedRect(x, summaryY, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    doc.text(String(label), x + 3, summaryY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    doc.text(`$ ${formatAmount(value as number)}`, x + 3, summaryY + 11);
  });

  /* ========================================================
     TABLE
  ======================================================== */

  const tableRows = filteredPayments.map((payment) => [
    formatDateOnly(payment.paidAt),

    getPartnerName(payment, partnerMap),

    getTrackingNumber(payment),

    getCustomerName(payment),

    `$ ${formatAmount(payment.amount)}`,

    paymentMethodLabel(payment.method),

    paymentStatusLabel(payment.status, payment.isVoided),

    payment.transactionRef || "-",

    payment.recordedBy?.fullName || "-",
  ]);

  autoTable(doc, {
    startY: 58,

    head: [
      [
        "Date",
        "Partner",
        "Tracking",
        "Customer",
        "Amount",
        "Method",
        "Status",
        "Reference",
        "Recorded By",
      ],
    ],

    body: tableRows,

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 2.2,
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
        cellWidth: 24,
      },

      1: {
        cellWidth: 34,
      },

      2: {
        cellWidth: 35,
      },

      3: {
        cellWidth: 34,
      },

      4: {
        cellWidth: 25,
        halign: "right",
      },

      5: {
        cellWidth: 30,
      },

      6: {
        cellWidth: 24,
      },

      7: {
        cellWidth: 32,
      },

      8: {
        cellWidth: 32,
      },
    },

    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        const value = String(data.cell.raw || "");

        if (value === "VOIDED") {
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

    const height = doc.internal.pageSize.getHeight();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    doc.text(
      `Customer Payment Report • Page ${page} of ${totalPages}`,
      14,
      height - 8,
    );

    doc.text(WEBSITE, pageWidth - 14, height - 8, {
      align: "right",
    });
  }

  return doc.output("blob");
};

/* ============================================================
   EXCEL
   ============================================================ */

export const generatePaymentReportExcel = (
  payments: PaymentReportPayment[],
  partners: PaymentReportPartner[],
  filters: PaymentReportFilters,
): Blob => {
  const partnerMap = new Map(
    partners.map((partner) => [partner.id, partner.companyName]),
  );

  const filteredPayments = filterPaymentReportPayments(
    payments,
    filters.customerSearch,
  );

  const summary = calculatePaymentReportSummary(filteredPayments);

  const rows = filteredPayments.map((payment) => ({
    Date: formatDateTime(payment.paidAt),

    Partner: getPartnerName(payment, partnerMap),

    Tracking: getTrackingNumber(payment),

    Customer: getCustomerName(payment),

    "Customer Phone": payment.shipment?.customer?.phone || "",

    Amount: money(payment.amount),

    Method: paymentMethodLabel(payment.method),

    Status: paymentStatusLabel(payment.status, payment.isVoided),

    Reference: payment.transactionRef || "",

    "Recorded By": payment.recordedBy?.fullName || "",

    "Recorded By Email": payment.recordedBy?.email || "",

    "Shipment Status": payment.shipment?.status || "",

    "Final Customer Amount": money(payment.shipment?.finalCustomerAmount),

    "Amount Paid": money(payment.shipment?.amountPaidByCustomer),

    "Customer Balance": money(payment.shipment?.customerBalance),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  /* ========================================================
     SUMMARY SHEET
  ======================================================== */

  const summaryRows = [
    {
      Report: "Customer Payment Report",
      Value: "",
    },

    {
      Report: "Generated On",
      Value: formatDateTime(new Date().toISOString()),
    },

    {
      Report: "Printed From",
      Value: WEBSITE,
    },

    {
      Report: "Total Payments",
      Value: summary.total,
    },

    {
      Report: "Today's Payments",
      Value: summary.today,
    },

    {
      Report: "This Month",
      Value: summary.thisMonth,
    },

    {
      Report: "Cash",
      Value: summary.cash,
    },

    {
      Report: "Stripe",
      Value: summary.stripe,
    },

    {
      Report: "Bank Transfer",
      Value: summary.bankTransfer,
    },

    {
      Report: "Mobile Banking",
      Value: summary.mobileBanking,
    },

    {
      Report: "Voided",
      Value: summary.voided,
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  /* ========================================================
     COLUMN WIDTHS
  ======================================================== */

  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 15 },
    { wch: 24 },
    { wch: 25 },
    { wch: 32 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
  ];

  summarySheet["!cols"] = [{ wch: 30 }, { wch: 45 }];

  /* ========================================================
     WORKBOOK
  ======================================================== */

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");

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
   DOWNLOAD HELPER
   ============================================================ */

export const downloadBlob = (blob: Blob, fileName: string) => {
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
