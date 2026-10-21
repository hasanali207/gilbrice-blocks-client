"use client";

import api from "@/lib/axios";
import { useCurrentToken } from "@/Redux/Features/Auth/authSlice";
import {
  CreditCard,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

type PaymentMethod =
  | "CASH"
  | "MTN_MOBILE_MONEY"
  | "ORANGE_MONEY"
  | "BANK_TRANSFER";

type PaymentType = "PAYMENT" | "REFUND";

interface Payment {
  id: string;
  paymentNumber: string;
  orderId: string;
  amount: number | string;
  method: PaymentMethod;
  paymentDate: string;
  reference?: string | null;
  notes?: string | null;
  status?: string;
  type?: PaymentType;
  correctionOfId?: string | null;
  receivedBy?: {
    id: string;
    name: string;
  } | null;
}

interface Props {
  orderId: string;
  orderNumber: string;
  clientName?: string;
  orderTotal: number;
  initialPaid?: number;
  onUpdated?: () => void;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "MTN_MOBILE_MONEY", label: "MTN Mobile Money" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

const money = (value: number | string | undefined) =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  })} FCFA`;

const dateText = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const today = () => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function OrderPaymentPanel({
  orderId,
  orderNumber,
  clientName = "Customer",
  orderTotal,
  initialPaid = 0,
  onUpdated,
}: Props) {
  const token = useSelector(useCurrentToken);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);

  const [form, setForm] = useState({
    amount: "",
    method: "CASH" as PaymentMethod,
    paymentDate: today(),
    reference: "",
    notes: "",
  });

  const [refundForm, setRefundForm] = useState({
    amount: "",
    reason: "",
  });

  const paid = payments.length
    ? payments.reduce((sum, p) => {
        if (p.status && p.status !== "COMPLETED") return sum;
        return (
          sum + (p.type === "REFUND" ? -Number(p.amount) : Number(p.amount))
        );
      }, 0)
    : initialPaid;

  const outstanding = Math.max(0, orderTotal - paid);

  const loadPayments = useCallback(async () => {
    if (!token || !orderId) return;

    setLoading(true);
    try {
      const res = await api.get(
        `/api/v1/payments?orderId=${encodeURIComponent(orderId)}&page=1&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const result = res.data?.data;
      const rows = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setPayments(rows);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Could not load payment history",
      );
    } finally {
      setLoading(false);
    }
  }, [token, orderId]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const submitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please login again");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    if (!form.paymentDate) {
      toast.error("Payment date is required");
      return;
    }

    // The current backend rejects overpayments.
    if (amount > outstanding) {
      toast.error(
        `Amount exceeds the outstanding balance of ${money(outstanding)}`,
      );
      return;
    }

    setSaving(true);
    try {
      await api.post(
        "/api/v1/payments",
        {
          orderId,
          amount,
          method: form.method,
          paymentDate: new Date(`${form.paymentDate}T12:00:00`).toISOString(),
          reference: form.reference.trim() || undefined,
          notes: form.notes.trim() || undefined,
          idempotencyKey: crypto.randomUUID(),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Payment recorded successfully");
      setForm({
        amount: "",
        method: "CASH",
        paymentDate: today(),
        reference: "",
        notes: "",
      });
      setShowForm(false);
      await loadPayments();
      onUpdated?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const submitRefund = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !refundTarget) return;

    const amount = Number(refundForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid refund amount");
      return;
    }

    if (!refundForm.reason.trim()) {
      toast.error("Refund reason is required");
      return;
    }

    setSaving(true);
    try {
      await api.post(
        `/api/v1/payments/${refundTarget.id}/refund`,
        {
          amount,
          reason: refundForm.reason.trim(),
          idempotencyKey: crypto.randomUUID(),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Refund recorded");
      setRefundTarget(null);
      setRefundForm({ amount: "", reason: "" });
      await loadPayments();
      onUpdated?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to record refund");
    } finally {
      setSaving(false);
    }
  };

  const printReceipt = (payment: Payment) => {
    const receiptWindow = window.open("", "_blank", "width=800,height=700");

    if (!receiptWindow) {
      toast.error("Allow pop-ups to print the receipt");
      return;
    }

    const safe = (value: string) =>
      value.replace(/[&<>"']/g, (char) => {
        const map: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        };
        return map[char];
      });

    receiptWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Receipt ${safe(payment.paymentNumber)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 32px; max-width: 700px; margin: auto; }
          h1 { margin-bottom: 4px; } .muted { color: #6b7280; }
          .row { display: flex; justify-content: space-between; gap: 20px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .amount { font-size: 24px; font-weight: bold; margin-top: 24px; }
          @media print { button { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>PAYMENT RECEIPT</h1>
        <p class="muted">Concrete Block Business</p>
        <div class="row"><span>Receipt number</span><strong>${safe(payment.paymentNumber || payment.id)}</strong></div>
        <div class="row"><span>Order</span><strong>${safe(orderNumber)}</strong></div>
        <div class="row"><span>Customer</span><strong>${safe(clientName)}</strong></div>
        <div class="row"><span>Payment date</span><strong>${safe(dateText(payment.paymentDate))}</strong></div>
        <div class="row"><span>Method</span><strong>${safe(METHODS.find((m) => m.value === payment.method)?.label || payment.method)}</strong></div>
        <div class="row"><span>Reference</span><strong>${safe(payment.reference || "—")}</strong></div>
        <div class="amount">Amount: ${safe(money(payment.amount))}</div>
        <p class="muted">Received by: ${safe(payment.receivedBy?.name || "Recorded employee")}</p>
        <p class="muted">Please keep this receipt for your records.</p>
        <button onclick="window.print()">Print receipt</button>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-gray-900">Payments</h2>
          <p className="mt-1 text-sm text-gray-500">
            Deposits, additional payments and refunds
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={outstanding <= 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CreditCard size={16} />
            Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Order Total</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {money(orderTotal)}
          </p>
        </div>
        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-sm text-green-700">Net Paid</p>
          <p className="mt-1 text-xl font-bold text-green-800">{money(paid)}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm text-amber-700">Outstanding</p>
          <p className="mt-1 text-xl font-bold text-amber-800">
            {money(outstanding)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3">Receipt</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3">Received by</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-gray-500"
                >
                  <Loader2 size={22} className="mx-auto animate-spin" />
                  <p className="mt-2">Loading payments...</p>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-gray-500"
                >
                  No payment records for this order yet.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {payment.paymentNumber || payment.id}
                  </td>
                  <td className="px-5 py-4">{dateText(payment.paymentDate)}</td>
                  <td className="px-5 py-4">
                    {METHODS.find((m) => m.value === payment.method)?.label ||
                      payment.method}
                  </td>
                  <td className="px-5 py-4">{payment.reference || "—"}</td>
                  <td className="px-5 py-4">
                    {payment.receivedBy?.name || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        payment.type === "REFUND"
                          ? "bg-orange-50 text-orange-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {payment.type || "PAYMENT"}
                    </span>
                  </td>
                  <td
                    className={`px-5 py-4 text-right font-semibold ${
                      payment.type === "REFUND"
                        ? "text-orange-700"
                        : "text-gray-900"
                    }`}
                  >
                    {payment.type === "REFUND" ? "− " : ""}
                    {money(payment.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => printReceipt(payment)}
                        title="Print receipt"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      >
                        <Printer size={15} />
                      </button>
                      {payment.type !== "REFUND" &&
                        (!payment.status || payment.status === "COMPLETED") && (
                          <button
                            type="button"
                            onClick={() => {
                              setRefundTarget(payment);
                              setRefundForm({
                                amount: String(payment.amount),
                                reason: "",
                              });
                            }}
                            title="Record refund"
                            className="rounded-lg border border-orange-200 p-2 text-orange-700 hover:bg-orange-50"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={submitPayment}
            className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Record Payment
                </h3>
                <p className="mt-1 text-sm text-gray-500">{orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                Outstanding balance: <strong>{money(outstanding)}</strong>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Amount (FCFA) *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max={outstanding}
                  step="1"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Enter amount received"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Method *
                </label>
                <select
                  required
                  value={form.method}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      method: e.target.value as PaymentMethod,
                    }))
                  }
                  className={inputClass}
                >
                  {METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Date *
                </label>
                <input
                  required
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Transaction Reference
                </label>
                <input
                  value={form.reference}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, reference: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Mobile money transaction ID, bank reference..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className={`${inputClass} min-h-20`}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || outstanding <= 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {refundTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={submitRefund}
            className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Record Refund
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Original receipt: {refundTarget.paymentNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Refund Amount (FCFA) *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max={Number(refundTarget.amount)}
                  step="1"
                  value={refundForm.amount}
                  onChange={(e) =>
                    setRefundForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Reason for Refund *
                </label>
                <textarea
                  required
                  value={refundForm.reason}
                  onChange={(e) =>
                    setRefundForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className={`${inputClass} min-h-24`}
                  placeholder="Explain why this refund is being made"
                />
              </div>
              <p className="text-xs text-gray-500">
                The server must validate the refundable balance and retain the
                refund in the audit history.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => setRefundTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Processing..." : "Confirm Refund"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
