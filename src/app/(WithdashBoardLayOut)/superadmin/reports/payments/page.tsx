"use client";

import {
  Ban,
  Banknote,
  Building2,
  CreditCard,
  Download,
  FileSpreadsheet,
  Loader2,
  Smartphone,
  Wallet,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import toast from "react-hot-toast";

import api from "@/lib/axios";

import {
  formatAmount,
  formatDate,
  IPartner,
  IPayment,
  PaymentMethod,
  PaymentStatusT,
} from "@/lib/types";

import PaymentReportPdfModal from "@/components/Payments/PaymentReportPdfModal";

import { MethodBadge, PaymentStatusBadge } from "@/components/Payments/Badges";
import {
  calculatePaymentReportSummary,
  downloadBlob,
  generatePaymentReportExcel,
  generatePaymentReportPdf,
  PaymentReportPartner,
  PaymentReportPayment,
} from "@/components/Payments/PaymentReportExport";

/* ============================================================
   PAGE
   ============================================================ */

const StaffPaymentReportPage = () => {
  const [payments, setPayments] = useState<IPayment[]>([]);

  const [partners, setPartners] = useState<IPartner[]>([]);

  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const [paymentPdfBlob, setPaymentPdfBlob] = useState<Blob | null>(null);

  const [paymentPdfFileName, setPaymentPdfFileName] = useState(
    "customer-payment-report.pdf",
  );

  /* ============================================================
     FILTERS
     ============================================================ */

  const [partnerFilter, setPartnerFilter] = useState("ALL");

  const [methodFilter, setMethodFilter] = useState<"ALL" | PaymentMethod>(
    "ALL",
  );

  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentStatusT>(
    "ALL",
  );

  const [customerSearch, setCustomerSearch] = useState("");

  const [dateFrom, setDateFrom] = useState("");

  const [dateTo, setDateTo] = useState("");

  /* ============================================================
     FETCH
     ============================================================ */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [paymentsRes, partnersRes] = await Promise.all([
        api.get("/api/v1/payment", {
          params: {
            /*
             * Normal report table can use the API's
             * current pagination/default response.
             */

            ...(partnerFilter !== "ALL"
              ? {
                  partnerId: partnerFilter,
                }
              : {}),

            ...(methodFilter !== "ALL"
              ? {
                  method: methodFilter,
                }
              : {}),

            ...(statusFilter !== "ALL"
              ? {
                  status: statusFilter,
                }
              : {}),

            ...(dateFrom
              ? {
                  dateFrom,
                }
              : {}),

            ...(dateTo
              ? {
                  dateTo,
                }
              : {}),
          },
        }),

        api.get("/api/v1/partner"),
      ]);

      const { data } = paymentsRes.data;

      setPayments(Array.isArray(data) ? data : []);

      setPartners(partnersRes.data?.data ?? []);
    } catch (error: any) {
      console.error("Failed to fetch report data:", error);

      toast.error(error?.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerFilter, methodFilter, statusFilter, dateFrom, dateTo]);

  /* ============================================================
     CLIENT SEARCH
     ============================================================ */

  const filtered = useMemo(() => {
    if (!customerSearch.trim()) {
      return payments;
    }

    const term = customerSearch.trim().toLowerCase();

    return payments.filter((payment) => {
      const customer = payment.shipment?.customer;

      return (
        customer?.fullName?.toLowerCase().includes(term) ||
        customer?.phone?.toLowerCase().includes(term) ||
        customer?.whatsapp?.toLowerCase().includes(term) ||
        payment.shipment?.trackingNumber?.toLowerCase().includes(term)
      );
    });
  }, [payments, customerSearch]);

  /* ============================================================
     SUMMARY
     ============================================================ */

  const summary = useMemo(() => {
    return calculatePaymentReportSummary(
      filtered as unknown as PaymentReportPayment[],
    );
  }, [filtered]);

  /* ============================================================
     EXPORT FILTER OBJECT
     ============================================================ */

  const exportFilters = (): {
    partnerFilter: string;
    methodFilter: string;
    statusFilter: string;
    customerSearch: string;
    dateFrom: string;
    dateTo: string;
  } => ({
    partnerFilter,
    methodFilter,
    statusFilter,
    customerSearch,
    dateFrom,
    dateTo,
  });

  /* ============================================================
     EXPORT DATA
     ============================================================ */

  const prepareExportData = () => {
    const paymentData = filtered as unknown as PaymentReportPayment[];

    const partnerData = partners as unknown as PaymentReportPartner[];

    return {
      paymentData,
      partnerData,
    };
  };

  /* ============================================================
     PDF EXPORT
     ============================================================ */

  const handlePdfExport = async () => {
    try {
      setExporting("pdf");

      /*
       * PDF is generated completely on frontend
       * from the payment API response.
       */

      const { paymentData, partnerData } = prepareExportData();

      const blob = generatePaymentReportPdf(
        paymentData,
        partnerData,
        exportFilters(),
      );

      const today = new Date().toISOString().split("T")[0];

      const fileName = `customer-payment-report-${today}.pdf`;

      setPaymentPdfBlob(blob);

      setPaymentPdfFileName(fileName);

      setPdfModalOpen(true);
    } catch (error) {
      console.error("PDF export failed:", error);

      toast.error("Failed to generate PDF report");
    } finally {
      setExporting(null);
    }
  };

  /* ============================================================
     EXCEL EXPORT
     ============================================================ */

  const handleExcelExport = async () => {
    try {
      setExporting("excel");

      const { paymentData, partnerData } = prepareExportData();

      const blob = generatePaymentReportExcel(
        paymentData,
        partnerData,
        exportFilters(),
      );

      const today = new Date().toISOString().split("T")[0];

      const fileName = `customer-payment-report-${today}.xlsx`;

      downloadBlob(blob, fileName);

      toast.success("Excel report downloaded");
    } catch (error) {
      console.error("Excel export failed:", error);

      toast.error("Failed to generate Excel report");
    } finally {
      setExporting(null);
    }
  };

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading report...
        </div>
      </div>
    );
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <>
      <div className="max-w-7xl mx-auto py-10 px-4">
        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Customer Payment Report
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Platform-wide customer payment summary and export
            </p>
          </div>

          {/* EXPORT BUTTONS */}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExcelExport}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {exporting === "excel" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={16} />
              )}

              {exporting === "excel" ? "Generating..." : "Excel"}
            </button>

            <button
              type="button"
              onClick={handlePdfExport}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {exporting === "pdf" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}

              {exporting === "pdf" ? "Generating..." : "PDF"}
            </button>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <SummaryCard
            label="Total Customer Payments"
            value={summary.total}
            icon={<Wallet size={20} />}
            color="green"
          />

          <SummaryCard
            label="Today's Payments"
            value={summary.today}
            icon={<Wallet size={20} />}
            color="blue"
          />

          <SummaryCard
            label="This Month"
            value={summary.thisMonth}
            icon={<Wallet size={20} />}
            color="blue"
          />

          <SummaryCard
            label="Voided"
            value={summary.voided}
            icon={<Ban size={20} />}
            color="red"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="Cash"
            value={summary.cash}
            icon={<Banknote size={20} />}
            color="gray"
          />

          <SummaryCard
            label="Stripe"
            value={summary.stripe}
            icon={<CreditCard size={20} />}
            color="gray"
          />

          <SummaryCard
            label="Bank Transfer"
            value={summary.bankTransfer}
            icon={<Building2 size={20} />}
            color="gray"
          />

          <SummaryCard
            label="Mobile Banking"
            value={summary.mobileBanking}
            icon={<Smartphone size={20} />}
            color="gray"
          />
        </div>

        {/* FILTERS */}

        <div className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          />

          <select
            value={partnerFilter}
            onChange={(event) => setPartnerFilter(event.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="ALL">All Partners</option>

            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.companyName}
              </option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(event.target.value as "ALL" | PaymentMethod)
            }
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="ALL">All Methods</option>

            <option value="CASH">Cash</option>

            <option value="BANK_TRANSFER">Bank Transfer</option>

            <option value="MOBILE_BANKING">Mobile Banking</option>

            <option value="CARD">Card</option>

            <option value="STRIPE">Stripe</option>

            <option value="ONLINE_GATEWAY">Online Gateway</option>

            <option value="CHEQUE">Cheque</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | PaymentStatusT)
            }
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>

            <option value="CONFIRMED">Confirmed</option>

            <option value="PENDING">Pending</option>

            <option value="VOIDED">Voided</option>
          </select>

          <input
            value={customerSearch}
            onChange={(event) => setCustomerSearch(event.target.value)}
            placeholder="Search customer / tracking"
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* REPORT TABLE */}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-secondary text-white">
                <tr>
                  <th className="border p-3 text-left">Date</th>

                  <th className="border p-3 text-left">Partner</th>

                  <th className="border p-3 text-left">Tracking</th>

                  <th className="border p-3 text-left">Customer</th>

                  <th className="border p-3 text-right">Amount</th>

                  <th className="border p-3 text-left">Method</th>

                  <th className="border p-3 text-center">Status</th>

                  <th className="border p-3 text-left">Reference</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="border p-3 whitespace-nowrap">
                      {formatDate(payment.paidAt)}
                    </td>

                    <td className="border p-3">
                      {getPartnerNameForTable(payment, partners)}
                    </td>

                    <td className="border p-3 font-mono text-xs">
                      {payment.shipment?.trackingNumber ?? "-"}
                    </td>

                    <td className="border p-3">
                      {payment.shipment?.customer?.fullName ?? "-"}
                    </td>

                    <td className="border p-3 text-right font-medium">
                      $ {formatAmount(payment.amount)}
                    </td>

                    <td className="border p-3">
                      <MethodBadge method={payment.method} />
                    </td>

                    <td className="border p-3 text-center">
                      <PaymentStatusBadge
                        status={payment.status}
                        isVoided={payment.isVoided}
                      />
                    </td>

                    <td className="border p-3 text-xs">
                      {payment.transactionRef ?? "-"}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      No payments match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================
          PDF MODAL
      ====================================================== */}

      <PaymentReportPdfModal
        open={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        pdfBlob={paymentPdfBlob}
        fileName={paymentPdfFileName}
      />
    </>
  );
};

/* ============================================================
   PARTNER NAME FOR TABLE
   ============================================================ */

const getPartnerNameForTable = (
  payment: IPayment,
  partners: IPartner[],
): string => {
  const partnerId = payment.shipment?.partnerId;

  if (!partnerId) {
    return "-";
  }

  return (
    partners.find((partner) => partner.id === partnerId)?.companyName ?? "-"
  );
};

/* ============================================================
   SUMMARY CARD
   ============================================================ */

const SummaryCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "green" | "blue" | "red" | "gray";
}) => {
  const colorMap = {
    green: "bg-green-100 text-green-600",

    blue: "bg-blue-100 text-blue-600",

    red: "bg-red-100 text-red-600",

    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 border flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{label}</p>

        <p className="text-lg font-bold text-gray-800 mt-1">
          $ {formatAmount(value)}
        </p>
      </div>

      <div className={`p-2.5 rounded-full ${colorMap[color]}`}>{icon}</div>
    </div>
  );
};

export default StaffPaymentReportPage;
