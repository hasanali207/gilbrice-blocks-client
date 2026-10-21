"use client";

import { Download, Loader2, MessageCircle, Printer, X } from "lucide-react";

import { useEffect, useState } from "react";

import toast from "react-hot-toast";

interface PartnerLedgerPdfModalProps {
  open: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  fileName: string;
}

type BusyAction = "print" | "download" | "share" | null;

const isMobileDevice = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const PartnerLedgerPdfModal = ({
  open,
  onClose,
  pdfBlob,
  fileName,
}: PartnerLedgerPdfModalProps) => {
  const [busy, setBusy] = useState<BusyAction>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !pdfBlob) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(pdfBlob);

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, pdfBlob]);

  if (!open || !pdfBlob) {
    return null;
  }

  /* ============================================================
     PRINT
  ============================================================ */

  const handlePrint = async () => {
    try {
      setBusy("print");

      const url = URL.createObjectURL(pdfBlob);

      if (isMobileDevice()) {
        window.open(url, "_blank");

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 60000);

        toast.success("PDF opened. Use Share → Print.");

        onClose();

        return;
      }

      const iframe = document.createElement("iframe");

      iframe.style.position = "fixed";

      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            const printWindow = iframe.contentWindow;

            if (!printWindow) {
              throw new Error("Print window unavailable");
            }

            printWindow.focus();

            printWindow.print();

            const cleanup = () => {
              if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
              }

              URL.revokeObjectURL(url);
            };

            printWindow.addEventListener("afterprint", cleanup, {
              once: true,
            });

            setTimeout(cleanup, 60000);
          } catch (error) {
            console.error(error);

            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }

            URL.revokeObjectURL(url);

            toast.error("Failed to open print dialog");
          }
        }, 400);
      };

      onClose();
    } catch (error) {
      console.error(error);

      toast.error("Failed to print report");
    } finally {
      setBusy(null);
    }
  };

  /* ============================================================
     DOWNLOAD
  ============================================================ */

  const handleDownload = () => {
    try {
      setBusy("download");

      const url = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      toast.success("PDF downloaded");

      onClose();
    } catch (error) {
      console.error(error);

      toast.error("Failed to download PDF");
    } finally {
      setBusy(null);
    }
  };

  /* ============================================================
     SHARE
  ============================================================ */

  const handleShare = async () => {
    try {
      setBusy("share");

      const file = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      const nav: any = typeof navigator !== "undefined" ? navigator : null;

      if (
        nav?.canShare &&
        nav.canShare({
          files: [file],
        })
      ) {
        await nav.share({
          files: [file],

          title: "Partner Ledger Report",

          text: "Partner Ledger Report - Gilbrice Logistic Group",
        });

        onClose();

        return;
      }

      const message = encodeURIComponent(
        "Partner Ledger Report - Gilbrice Logistic Group",
      );

      window.open(`https://wa.me/?text=${message}`, "_blank");

      toast.success("WhatsApp opened. Attach the downloaded PDF.");
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error(error);

        toast.error("Failed to share report");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* BACKDROP */}

      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* MODAL */}

      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}

        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">
              Partner Ledger PDF
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Preview your report, then choose what you'd like to do
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* PREVIEW */}

        <div className="flex-1 min-h-0 bg-gray-100 p-4 overflow-hidden">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title="Partner Ledger PDF Preview"
              className="w-full h-full rounded-xl border border-gray-200 bg-white"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {isMobileDevice() && (
          <p className="text-xs text-gray-400 text-center px-4 py-2">
            Print opens the PDF in a new tab. Use Share → Print from there.
          </p>
        )}

        {/* ACTIONS */}

        <div className="p-5 border-t border-gray-100 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xl mx-auto">
            <button
              type="button"
              onClick={handlePrint}
              disabled={busy !== null}
              className="w-full min-h-[62px] rounded-lg flex flex-col items-center justify-center gap-1.5 px-1 py-2.5 bg-secondary text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {busy === "print" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Printer size={18} />
              )}

              <span className="text-xs sm:text-sm">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={busy !== null}
              className="w-full min-h-[62px] rounded-lg flex flex-col items-center justify-center gap-1.5 px-1 py-2.5 bg-secondary text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {busy === "download" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}

              <span className="text-xs sm:text-sm">Download</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={busy !== null}
              className="w-full min-h-[62px] rounded-lg flex flex-col items-center justify-center gap-1.5 px-1 py-2.5 bg-secondary text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {busy === "share" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <MessageCircle size={18} />
              )}

              <span className="text-xs sm:text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerLedgerPdfModal;
