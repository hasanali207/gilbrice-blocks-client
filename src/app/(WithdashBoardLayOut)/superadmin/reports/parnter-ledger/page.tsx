"use client";

import api from "@/lib/axios";

import { formatAmount, IPartner, IPartnerLedgerEntry } from "@/lib/types";

import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";

import toast from "react-hot-toast";

import PartnerLedgerPdfModal from "@/components/Partners/PartnerLedgerReportPdfModal";
import {
  downloadPartnerLedgerBlob,
  generatePartnerLedgerReportExcel,
  generatePartnerLedgerReportPdf,
  PartnerLedgerExportFilters,
  PartnerLedgerExportRow,
} from "@/components/Partners/partnerLedgerReportExport";

/* ============================================================
   PAGE: /staff/reports/partner-ledger
   ============================================================ */

interface IPartnerLedgerSummaryRow {
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

const StaffPartnerLedgerReportPage = () => {
  const [rows, setRows] = useState<IPartnerLedgerSummaryRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  /* ========================================================
       PDF MODAL
    ======================================================== */

  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const [pdfFileName, setPdfFileName] = useState("partner-ledger-report.pdf");

  /* ========================================================
       FILTERS
    ======================================================== */

  const [balanceStatus, setBalanceStatus] = useState<
    "ALL" | "OUTSTANDING" | "SETTLED" | "EXCEEDED"
  >("ALL");

  const [search, setSearch] = useState("");

  const [dateFrom, setDateFrom] = useState("");

  const [dateTo, setDateTo] = useState("");

  /* ========================================================
       FETCH DATA
    ======================================================== */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [entriesRes, partnersRes] = await Promise.all([
        api.get("/api/v1/partner-ledger", {
          params: {
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

      const entries: IPartnerLedgerEntry[] = entriesRes.data?.data ?? [];

      const partners: IPartner[] = partnersRes.data?.data ?? [];

      const partnerById = new Map(
        partners.map((partner) => [partner.id, partner]),
      );

      /* ==================================================
           GROUP LEDGER ENTRIES
        ================================================== */

      const grouped = new Map<
        string,
        {
          companyName: string;
          trackingPrefix: string;
          debit: number;
          credit: number;
        }
      >();

      for (const entry of entries) {
        const partnerId = entry.partnerId;

        const existing = grouped.get(partnerId);

        const debit = Number(entry.debit);

        const credit = Number(entry.credit);

        if (existing) {
          existing.debit += debit;

          existing.credit += credit;
        } else {
          grouped.set(partnerId, {
            companyName: entry.partner?.companyName ?? "-",

            trackingPrefix: entry.partner?.trackingPrefix ?? "-",

            debit,
            credit,
          });
        }
      }

      /* ==================================================
           BUILD SUMMARY ROWS
        ================================================== */

      const summaryRows: IPartnerLedgerSummaryRow[] = Array.from(
        grouped.entries(),
      ).map(([partnerId, group]) => {
        const master = partnerById.get(partnerId);

        const outstanding = group.debit - group.credit;

        const creditLimit = master?.creditLimit
          ? Number(master.creditLimit)
          : null;

        const availableCredit =
          creditLimit !== null ? Math.max(creditLimit - outstanding, 0) : null;

        return {
          partnerId,

          companyName: master?.companyName ?? group.companyName,

          trackingPrefix: master?.trackingPrefix ?? group.trackingPrefix,

          totalCharges: group.debit,

          totalSettlements: group.credit,

          outstanding,

          creditLimit,

          availableCredit,

          isActive: master?.isActive ?? true,
        };
      });

      /* ==================================================
           INCLUDE ZERO ACTIVITY PARTNERS
        ================================================== */

      for (const partner of partners) {
        if (grouped.has(partner.id)) {
          continue;
        }

        const creditLimit = partner.creditLimit
          ? Number(partner.creditLimit)
          : null;

        summaryRows.push({
          partnerId: partner.id,

          companyName: partner.companyName,

          trackingPrefix: partner.trackingPrefix,

          totalCharges: 0,

          totalSettlements: 0,

          outstanding: 0,

          creditLimit,

          availableCredit: creditLimit,

          isActive: partner.isActive ?? true,
        });
      }

      /* ==================================================
           SORT
        ================================================== */

      summaryRows.sort((a, b) => b.outstanding - a.outstanding);

      setRows(summaryRows);
    } catch (error: any) {
      console.error("Failed to fetch partner ledger report:", error);

      toast.error(error?.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  /* ========================================================
       FILTERED TABLE DATA
    ======================================================== */

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      /* SEARCH */

      if (
        search.trim() &&
        !row.companyName.toLowerCase().includes(search.trim().toLowerCase()) &&
        !row.trackingPrefix.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }

      /* BALANCE */

      if (balanceStatus === "OUTSTANDING" && row.outstanding <= 0) {
        return false;
      }

      if (balanceStatus === "SETTLED" && row.outstanding > 0) {
        return false;
      }

      if (
        balanceStatus === "EXCEEDED" &&
        !(row.creditLimit !== null && row.outstanding > row.creditLimit)
      ) {
        return false;
      }

      return true;
    });
  }, [rows, search, balanceStatus]);

  /* ========================================================
       EXPORT FILTER OBJECT
    ======================================================== */

  const getExportFilters = (): PartnerLedgerExportFilters => ({
    search,

    balanceStatus,

    dateFrom,

    dateTo,
  });

  /* ========================================================
       EXPORT ROWS
    ======================================================== */

  const getExportRows = (): PartnerLedgerExportRow[] =>
    filtered.map((row) => ({
      partnerId: row.partnerId,

      companyName: row.companyName,

      trackingPrefix: row.trackingPrefix,

      totalCharges: row.totalCharges,

      totalSettlements: row.totalSettlements,

      outstanding: row.outstanding,

      creditLimit: row.creditLimit,

      availableCredit: row.availableCredit,

      isActive: row.isActive,
    }));

  /* ========================================================
       PDF EXPORT
    ======================================================== */

  const handlePdfExport = async () => {
    try {
      setExporting("pdf");

      const exportRows = getExportRows();

      const blob = generatePartnerLedgerReportPdf(
        exportRows,
        getExportFilters(),
      );

      const today = new Date().toISOString().split("T")[0];

      const fileName = `partner-ledger-report-${today}.pdf`;

      setPdfBlob(blob);

      setPdfFileName(fileName);

      setPdfModalOpen(true);
    } catch (error) {
      console.error("PDF export failed:", error);

      toast.error("Failed to generate PDF report");
    } finally {
      setExporting(null);
    }
  };

  /* ========================================================
       EXCEL EXPORT
    ======================================================== */

  const handleExcelExport = async () => {
    try {
      setExporting("excel");

      const exportRows = getExportRows();

      const blob = generatePartnerLedgerReportExcel(
        exportRows,
        getExportFilters(),
      );

      const today = new Date().toISOString().split("T")[0];

      const fileName = `partner-ledger-report-${today}.xlsx`;

      downloadPartnerLedgerBlob(blob, fileName);

      toast.success("Excel report downloaded");
    } catch (error) {
      console.error("Excel export failed:", error);

      toast.error("Failed to generate Excel report");
    } finally {
      setExporting(null);
    }
  };

  /* ========================================================
       LOADING
    ======================================================== */

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

  /* ========================================================
       UI
    ======================================================== */

  return (
    <>
      <div className="max-w-7xl mx-auto py-10 px-4">
        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Partner Ledger Report
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Financial position across all partners
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

        {/* FILTERS */}

        <div className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partner"
            className="border rounded-md px-3 py-2 text-sm"
          />

          <select
            value={balanceStatus}
            onChange={(e) =>
              setBalanceStatus(
                e.target.value as
                  | "ALL"
                  | "OUTSTANDING"
                  | "SETTLED"
                  | "EXCEEDED",
              )
            }
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="ALL">All Balances</option>

            <option value="OUTSTANDING">Outstanding</option>

            <option value="SETTLED">Fully Settled</option>

            <option value="EXCEEDED">Credit Exceeded</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* TABLE */}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-secondary text-white">
                <tr>
                  <th className="border p-3 text-left">Partner</th>

                  <th className="border p-3 text-right">Total Charges</th>

                  <th className="border p-3 text-right">Total Settlements</th>

                  <th className="border p-3 text-right">Outstanding</th>

                  <th className="border p-3 text-right">Credit Limit</th>

                  <th className="border p-3 text-right">Available Credit</th>

                  <th className="border p-3 text-center">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row) => {
                  const exceeded =
                    row.creditLimit !== null &&
                    row.outstanding > row.creditLimit;

                  return (
                    <tr
                      key={row.partnerId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="border p-3">
                        <Link
                          href={`/staff/partners/${row.partnerId}/ledger`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {row.companyName}
                        </Link>

                        <div className="text-xs text-gray-400 font-mono">
                          {row.trackingPrefix}
                        </div>
                      </td>

                      <td className="border p-3 text-right">
                        $ {formatAmount(row.totalCharges)}
                      </td>

                      <td className="border p-3 text-right text-green-600">
                        $ {formatAmount(row.totalSettlements)}
                      </td>

                      <td className="border p-3 text-right font-semibold text-red-600">
                        $ {formatAmount(row.outstanding)}
                      </td>

                      <td className="border p-3 text-right">
                        {row.creditLimit !== null
                          ? `$ ${formatAmount(row.creditLimit)}`
                          : "No limit"}
                      </td>

                      <td className="border p-3 text-right">
                        {row.availableCredit !== null
                          ? `$ ${formatAmount(row.availableCredit)}`
                          : "-"}
                      </td>

                      <td className="border p-3 text-center">
                        {!row.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                            Inactive
                          </span>
                        ) : exceeded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                            <AlertTriangle size={12} />
                            Over Limit
                          </span>
                        ) : row.outstanding > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                            Outstanding
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No partners match the selected filters.
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

      <PartnerLedgerPdfModal
        open={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        pdfBlob={pdfBlob}
        fileName={pdfFileName}
      />
    </>
  );
};

export default StaffPartnerLedgerReportPage;
