"use client";

import api from "@/lib/axios";
import { Fragment, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

// ==========================================================
// TYPES
// ==========================================================

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  deliveryAddress?: string;
  client?: { name: string };
};

type Driver = { id: string; name: string; phone?: string | null };

type Allocation = {
  id: string;
  quantity: number;
  deliveredQty: number;
  releasedQty: number;
  blockType?: { name: string; size: string };
  batch?: { batchNumber: string };
};

type DeliveryItem = {
  id: string;
  quantity: number;
  allocation?: {
    blockType?: { name: string; size: string };
    batch?: { batchNumber: string };
  };
};

type Delivery = {
  id: string;
  deliveryNumber: string;
  status: string;
  destination: string;
  vehicle?: string | null;
  plannedDate?: string | null;
  actualDate?: string | null;
  deliveryCost: number | string;
  recipientName?: string | null;
  confirmation?: string | null;
  proofUrl?: string | null;
  createdAt: string;
  order?: {
    orderNumber: string;
    client?: { name: string; phone?: string };
  };
  driver?: { id: string; name: string; phone?: string | null } | null;
  items: DeliveryItem[];
};

type Meta = { page: number; limit: number; total: number };

type Summary = {
  total: number;
  byStatus: Record<string, number>;
};

type Dialog =
  | { type: "confirm"; delivery: Delivery }
  | { type: "cancel"; delivery: Delivery }
  | null;

// ==========================================================
// HELPERS
// ==========================================================

const PAGE_SIZES = [10, 20, 50];

const STATUS_OPTIONS = [
  "PLANNED",
  "IN_TRANSIT",
  "PARTIALLY_DELIVERED",
  "DELIVERED",
  "CANCELLED",
];

const emptyMeta = (limit = 10): Meta => ({ page: 1, limit, total: 0 });

const emptySummary: Summary = {
  total: 0,
  byStatus: {
    PLANNED: 0,
    IN_TRANSIT: 0,
    PARTIALLY_DELIVERED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  },
};

const unwrapList = (response: any): any[] => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
};

const unwrapMeta = (response: any, page: number, limit: number): Meta => {
  const meta = response?.data?.meta;

  return {
    page: Number(meta?.page ?? page),
    limit: Number(meta?.limit ?? limit),
    total: Number(meta?.total ?? unwrapList(response).length),
  };
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const dateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const generateKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

const getPageNumbers = (
  current: number,
  total: number,
): (number | string)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…start");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…end");

  pages.push(total);

  return pages;
};

const initialForm = {
  orderId: "",
  driverId: "",
  vehicle: "",
  plannedDate: dateInputValue(),
  deliveryCost: "0",
  destination: "",
};

const initialConfirm = {
  recipientName: "",
  confirmation: "",
  proofUrl: "",
  actualDate: dateInputValue(),
};

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";

const smallButton =
  "rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50";

// ==========================================================
// SMALL COMPONENTS
// ==========================================================

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function StatusBadge({ value }: { value?: string }) {
  const status = value || "UNKNOWN";

  const styles: Record<string, string> = {
    PLANNED: "bg-violet-50 text-violet-700",
    IN_TRANSIT: "bg-amber-50 text-amber-700",
    PARTIALLY_DELIVERED: "bg-blue-50 text-blue-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function Pagination({
  meta,
  onPageChange,
  onLimitChange,
  disabled,
}: {
  meta: Meta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  disabled?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  if (meta.total === 0) return null;

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Showing <strong className="text-slate-700">{from}</strong>–
          <strong className="text-slate-700">{to}</strong> of{" "}
          <strong className="text-slate-700">{meta.total}</strong>
        </span>

        <select
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
          value={meta.limit}
          disabled={disabled}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          className={secondaryButton}
          disabled={disabled || meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          ← Prev
        </button>

        {getPageNumbers(meta.page, totalPages).map((item) =>
          typeof item === "string" ? (
            <span key={item} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(item)}
              className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                item === meta.page
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className={secondaryButton}
          disabled={disabled || meta.page >= totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function DeliveryManagement() {
  // List (paginated)
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [meta, setMeta] = useState<Meta>(emptyMeta());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Summary + lookups
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [allocLoading, setAllocLoading] = useState(false);
  const [itemQty, setItemQty] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Row actions
  const [expandedId, setExpandedId] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [confirmForm, setConfirmForm] = useState(initialConfirm);
  const [cancelReason, setCancelReason] = useState("");

  // ==========================================================
  // LOADERS
  // ==========================================================

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/deliveries/summary");
      setSummary(res?.data?.data ?? emptySummary);
    } catch {
      toast.error("Failed to load delivery summary");
    }
  }, []);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get("/api/v1/deliveries", {
        params: {
          page,
          limit,
          searchTerm: debouncedSearch || undefined,
          status: statusFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      });

      const nextMeta = unwrapMeta(res, page, limit);
      const list = unwrapList(res);

      // current page became empty -> go to the last page
      if (list.length === 0 && page > 1 && nextMeta.total > 0) {
        setPage(Math.max(1, Math.ceil(nextMeta.total / limit)));
        return;
      }

      setDeliveries(list);
      setMeta(nextMeta);
    } catch (error: any) {
      toast.error(errorMessage(error, "Failed to load deliveries"));
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, fromDate, toDate]);

  const loadLookups = useCallback(async () => {
    const [orderResult, driverResult] = await Promise.allSettled([
      api.get("/api/v1/orders?limit=100&page=1"),
      api.get("/api/v1/deliveries/drivers"),
    ]);

    if (orderResult.status === "fulfilled") {
      setOrders(unwrapList(orderResult.value));
    }

    if (driverResult.status === "fulfilled") {
      const data = driverResult.value?.data?.data;
      setDrivers(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
    void loadLookups();
  }, [loadSummary, loadLookups]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  // Load allocations of the selected order for the create form
  useEffect(() => {
    if (!form.orderId) {
      setAllocations([]);
      return;
    }

    let cancelled = false;
    setAllocLoading(true);

    api
      .get("/api/v1/productions/allocations", {
        params: { orderId: form.orderId, page: 1, limit: 100 },
      })
      .then((res) => {
        if (cancelled) return;

        setAllocations(
          unwrapList(res).filter(
            (a: Allocation) => a.quantity - a.deliveredQty - a.releasedQty > 0,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load order allocations");
      })
      .finally(() => {
        if (!cancelled) setAllocLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.orderId]);

  const refreshAll = async () => {
    await Promise.all([loadSummary(), loadDeliveries(), loadLookups()]);
  };

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const handleOrderChange = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);

    setForm((prev) => ({
      ...prev,
      orderId,
      destination: order?.deliveryAddress ?? "",
    }));
    setItemQty({});
  };

  const createDelivery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const items = Object.entries(itemQty)
      .map(([allocationId, value]) => ({
        allocationId,
        quantity: Number(value),
      }))
      .filter((item) => item.quantity > 0);

    if (!form.orderId || !form.destination.trim() || items.length === 0) {
      toast.error("Select an order, enter a destination and item quantities");
      return;
    }

    if (items.some((item) => !Number.isInteger(item.quantity))) {
      toast.error("Quantities must be whole numbers");
      return;
    }

    const overLimit = items.find((item) => {
      const allocation = allocations.find((a) => a.id === item.allocationId);
      if (!allocation) return false;

      return (
        item.quantity >
        allocation.quantity - allocation.deliveredQty - allocation.releasedQty
      );
    });

    if (overLimit) {
      toast.error("A quantity exceeds the remaining allocation");
      return;
    }

    setSaving(true);

    try {
      await api.post("/api/v1/deliveries", {
        orderId: form.orderId,
        driverId: form.driverId || undefined,
        vehicle: form.vehicle || undefined,
        plannedDate: form.plannedDate || undefined,
        deliveryCost: Number(form.deliveryCost || 0),
        destination: form.destination.trim(),
        items,
        idempotencyKey: generateKey(),
      });

      toast.success("Delivery created successfully");

      setForm(initialForm);
      setItemQty({});
      setAllocations([]);
      setShowForm(false);

      setSearch("");
      setStatusFilter("");
      if (page !== 1) setPage(1);

      await Promise.all([
        loadSummary(),
        page === 1 ? loadDeliveries() : Promise.resolve(),
      ]);
    } catch (error: any) {
      console.error("CREATE DELIVERY ERROR:", error);
      toast.error(errorMessage(error, "Failed to create delivery"));
    } finally {
      setSaving(false);
    }
  };

  const startDelivery = async (delivery: Delivery) => {
    if (!window.confirm(`Start trip for ${delivery.deliveryNumber}?`)) return;

    setProcessingId(delivery.id);

    try {
      await api.patch(`/api/v1/deliveries/${delivery.id}/start`);
      toast.success("Delivery is now in transit");
      await Promise.all([loadSummary(), loadDeliveries()]);
    } catch (error: any) {
      toast.error(errorMessage(error, "Failed to start delivery"));
    } finally {
      setProcessingId("");
    }
  };

  const openConfirm = (delivery: Delivery) => {
    setConfirmForm({
      ...initialConfirm,
      recipientName: delivery.order?.client?.name ?? "",
    });
    setDialog({ type: "confirm", delivery });
  };

  const openCancel = (delivery: Delivery) => {
    setCancelReason("");
    setDialog({ type: "cancel", delivery });
  };

  const submitConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (dialog?.type !== "confirm") return;

    if (!confirmForm.recipientName.trim()) {
      toast.error("Recipient name is required");
      return;
    }

    setProcessingId(dialog.delivery.id);

    try {
      await api.patch(`/api/v1/deliveries/${dialog.delivery.id}/confirm`, {
        recipientName: confirmForm.recipientName.trim(),
        confirmation: confirmForm.confirmation.trim() || undefined,
        proofUrl: confirmForm.proofUrl.trim() || undefined,
        actualDate: confirmForm.actualDate || undefined,
      });

      toast.success("Delivery confirmed");
      setDialog(null);
      await Promise.all([loadSummary(), loadDeliveries()]);
    } catch (error: any) {
      toast.error(errorMessage(error, "Failed to confirm delivery"));
    } finally {
      setProcessingId("");
    }
  };

  const submitCancel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (dialog?.type !== "cancel") return;

    if (!cancelReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }

    setProcessingId(dialog.delivery.id);

    try {
      await api.patch(`/api/v1/deliveries/${dialog.delivery.id}/cancel`, {
        reason: cancelReason.trim(),
      });

      toast.success("Delivery cancelled");
      setDialog(null);
      await Promise.all([loadSummary(), loadDeliveries()]);
    } catch (error: any) {
      toast.error(errorMessage(error, "Failed to cancel delivery"));
    } finally {
      setProcessingId("");
    }
  };

  // ==========================================================
  // DERIVED
  // ==========================================================

  const openOrders = orders.filter(
    (order) => !["CANCELLED", "DELIVERED"].includes(order.status),
  );

  const selectedTotal = Object.values(itemQty).reduce(
    (sum, value) => sum + (Number(value) > 0 ? Number(value) : 0),
    0,
  );

  const summaryCards = [
    { label: "Planned", key: "PLANNED", color: "text-violet-600" },
    { label: "In Transit", key: "IN_TRANSIT", color: "text-amber-600" },
    { label: "Delivered", key: "DELIVERED", color: "text-emerald-600" },
    { label: "Cancelled", key: "CANCELLED", color: "text-red-600" },
  ];

  const itemsSummary = (delivery: Delivery) =>
    delivery.items
      .map(
        (item) =>
          `${item.allocation?.blockType?.size ?? "Block"} × ${item.quantity.toLocaleString()}`,
      )
      .join(", ");

  const isOpen = (status: string) =>
    ["PLANNED", "IN_TRANSIT", "PARTIALLY_DELIVERED"].includes(status);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Logistics
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Delivery Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Plan deliveries from allocated stock, track trips and confirm
              receipt.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={loading}
              className={secondaryButton}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>

            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className={buttonClass}
            >
              {showForm ? "Close form" : "+ New Delivery"}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.key} className={cardClass}>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                {card.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${card.color}`}>
                {(summary.byStatus[card.key] ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                of {summary.total.toLocaleString()} deliveries
              </p>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={createDelivery} className={cardClass}>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Plan a Delivery
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick an order, then choose how much of each allocated batch goes
                on this trip. Stock is deducted when delivery is confirmed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Order *">
                <select
                  className={inputClass}
                  required
                  value={form.orderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                >
                  <option value="">Select order</option>
                  {openOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber}
                      {order.client?.name ? ` — ${order.client.name}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Driver">
                <select
                  className={inputClass}
                  value={form.driverId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, driverId: e.target.value }))
                  }
                >
                  <option value="">Unassigned</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                      {driver.phone ? ` — ${driver.phone}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Vehicle">
                <input
                  className={inputClass}
                  value={form.vehicle}
                  placeholder="e.g. Truck LT-1234"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, vehicle: e.target.value }))
                  }
                />
              </Field>

              <Field label="Planned Date">
                <input
                  className={inputClass}
                  type="date"
                  value={form.plannedDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, plannedDate: e.target.value }))
                  }
                />
              </Field>

              <Field label="Delivery Cost">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deliveryCost}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, deliveryCost: e.target.value }))
                  }
                />
              </Field>

              <Field label="Destination *">
                <input
                  className={inputClass}
                  required
                  value={form.destination}
                  placeholder="Delivery address"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, destination: e.target.value }))
                  }
                />
              </Field>
            </div>

            {/* Items */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900">
                Items from allocated stock
              </h3>

              {!form.orderId && (
                <p className="mt-2 text-sm text-slate-500">
                  Select an order to see its allocated stock.
                </p>
              )}

              {form.orderId && allocLoading && (
                <p className="mt-2 text-sm text-slate-500">
                  Loading allocations...
                </p>
              )}

              {form.orderId && !allocLoading && allocations.length === 0 && (
                <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  This order has no stock left to deliver. Allocate stock first
                  from Production → Stock Allocation.
                </p>
              )}

              {allocations.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                        <th className="px-3 py-3">Block Type</th>
                        <th className="px-3 py-3">Batch</th>
                        <th className="px-3 py-3">Allocated</th>
                        <th className="px-3 py-3">Remaining</th>
                        <th className="px-3 py-3">Quantity on this trip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allocations.map((allocation) => {
                        const remaining =
                          allocation.quantity -
                          allocation.deliveredQty -
                          allocation.releasedQty;

                        return (
                          <tr key={allocation.id}>
                            <td className="px-3 py-3">
                              <p className="font-medium text-slate-800">
                                {allocation.blockType?.name || "—"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {allocation.blockType?.size}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-blue-700">
                              {allocation.batch?.batchNumber || "—"}
                            </td>
                            <td className="px-3 py-3">
                              {allocation.quantity.toLocaleString()}
                            </td>
                            <td className="px-3 py-3 font-semibold text-emerald-700">
                              {remaining.toLocaleString()}
                            </td>
                            <td className="px-3 py-3">
                              <input
                                className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                type="number"
                                min="0"
                                max={remaining}
                                step="1"
                                placeholder="0"
                                value={itemQty[allocation.id] ?? ""}
                                onChange={(e) =>
                                  setItemQty((prev) => ({
                                    ...prev,
                                    [allocation.id]: e.target.value,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-500">
                Total on this trip:{" "}
                <strong>{selectedTotal.toLocaleString()}</strong> blocks
              </p>

              <button
                type="submit"
                disabled={saving || selectedTotal === 0}
                className={buttonClass}
              >
                {saving ? "Saving..." : "Create Delivery"}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className={cardClass}>
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  All Deliveries
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {meta.total.toLocaleString()} deliveries
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                className={`${inputClass} mt-0`}
                placeholder="Search number, order, client, address..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />

              <select
                className={`${inputClass} mt-0`}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>

              <input
                className={`${inputClass} mt-0`}
                type="date"
                value={fromDate}
                title="Created from"
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
              />

              <input
                className={`${inputClass} mt-0`}
                type="date"
                value={toDate}
                title="Created to"
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div
            className={`overflow-x-auto transition-opacity ${
              loading ? "opacity-50" : ""
            }`}
          >
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Delivery</th>
                  <th className="px-3 py-3">Order / Client</th>
                  <th className="px-3 py-3">Destination</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3">Planned</th>
                  <th className="px-3 py-3">Items</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {deliveries.map((delivery) => (
                  <Fragment key={delivery.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          className="font-semibold text-blue-700 hover:underline"
                          onClick={() =>
                            setExpandedId((prev) =>
                              prev === delivery.id ? "" : delivery.id,
                            )
                          }
                        >
                          {delivery.deliveryNumber}
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-800">
                          {delivery.order?.orderNumber || "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {delivery.order?.client?.name || ""}
                        </p>
                      </td>
                      <td className="max-w-[220px] px-3 py-4 text-slate-700">
                        {delivery.destination}
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-slate-800">
                          {delivery.driver?.name || "Unassigned"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {delivery.vehicle || ""}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        {formatDate(delivery.plannedDate)}
                      </td>
                      <td className="max-w-[200px] px-3 py-4 text-xs text-slate-600">
                        {itemsSummary(delivery) || "—"}
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge value={delivery.status} />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {delivery.status === "PLANNED" && (
                            <button
                              type="button"
                              disabled={processingId === delivery.id}
                              onClick={() => void startDelivery(delivery)}
                              className={`${smallButton} bg-amber-50 text-amber-700 hover:bg-amber-100`}
                            >
                              Start
                            </button>
                          )}

                          {isOpen(delivery.status) && (
                            <>
                              <button
                                type="button"
                                disabled={processingId === delivery.id}
                                onClick={() => openConfirm(delivery)}
                                className={`${smallButton} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                              >
                                Confirm
                              </button>

                              <button
                                type="button"
                                disabled={processingId === delivery.id}
                                onClick={() => openCancel(delivery)}
                                className={`${smallButton} bg-red-50 text-red-700 hover:bg-red-100`}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedId === delivery.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                Items
                              </p>
                              <ul className="space-y-1.5 text-sm">
                                {delivery.items.map((item) => (
                                  <li
                                    key={item.id}
                                    className="flex justify-between rounded-lg bg-white px-3 py-2"
                                  >
                                    <span>
                                      {item.allocation?.blockType?.name} (
                                      {item.allocation?.blockType?.size}){" · "}
                                      <span className="text-blue-700">
                                        {item.allocation?.batch?.batchNumber}
                                      </span>
                                    </span>
                                    <strong>
                                      {item.quantity.toLocaleString()}
                                    </strong>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1 text-sm text-slate-600">
                              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                Details
                              </p>
                              <p>
                                Delivery cost:{" "}
                                <strong>
                                  {Number(
                                    delivery.deliveryCost,
                                  ).toLocaleString()}
                                </strong>
                              </p>
                              <p>
                                Actual date:{" "}
                                <strong>
                                  {formatDate(delivery.actualDate)}
                                </strong>
                              </p>
                              <p>
                                Recipient:{" "}
                                <strong>{delivery.recipientName || "—"}</strong>
                              </p>
                              {delivery.confirmation && (
                                <p>Note: {delivery.confirmation}</p>
                              )}
                              {delivery.proofUrl && (
                                <p>
                                  Proof:{" "}
                                  <a
                                    href={delivery.proofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    View proof
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                {!loading && deliveries.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No deliveries found.
                    </td>
                  </tr>
                )}

                {loading && deliveries.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Loading deliveries...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            meta={meta}
            disabled={loading}
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Confirm dialog */}
      {dialog?.type === "confirm" && (
        <Modal
          title={`Confirm ${dialog.delivery.deliveryNumber}`}
          onClose={() => setDialog(null)}
        >
          <form onSubmit={submitConfirm} className="space-y-4">
            <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
              Confirming deducts the delivered quantities from reserved stock
              and updates the order status.
            </p>

            <Field label="Recipient Name *">
              <input
                className={inputClass}
                required
                value={confirmForm.recipientName}
                onChange={(e) =>
                  setConfirmForm((p) => ({
                    ...p,
                    recipientName: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Delivery Date">
              <input
                className={inputClass}
                type="date"
                value={confirmForm.actualDate}
                onChange={(e) =>
                  setConfirmForm((p) => ({ ...p, actualDate: e.target.value }))
                }
              />
            </Field>

            <Field label="Confirmation Note">
              <textarea
                className={inputClass}
                rows={2}
                value={confirmForm.confirmation}
                placeholder="Optional note (e.g. received in good condition)"
                onChange={(e) =>
                  setConfirmForm((p) => ({
                    ...p,
                    confirmation: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Proof URL">
              <input
                className={inputClass}
                type="url"
                value={confirmForm.proofUrl}
                placeholder="https://... (optional)"
                onChange={(e) =>
                  setConfirmForm((p) => ({ ...p, proofUrl: e.target.value }))
                }
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setDialog(null)}
              >
                Back
              </button>
              <button
                type="submit"
                className={buttonClass}
                disabled={processingId === dialog.delivery.id}
              >
                {processingId === dialog.delivery.id
                  ? "Confirming..."
                  : "Confirm Delivery"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel dialog */}
      {dialog?.type === "cancel" && (
        <Modal
          title={`Cancel ${dialog.delivery.deliveryNumber}`}
          onClose={() => setDialog(null)}
        >
          <form onSubmit={submitCancel} className="space-y-4">
            <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Planned deliveries have not consumed stock, so cancelling keeps
              the allocation available for another trip.
            </p>

            <Field label="Cancellation Reason *">
              <textarea
                className={inputClass}
                rows={3}
                required
                value={cancelReason}
                placeholder="Why is this delivery being cancelled?"
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setDialog(null)}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={processingId === dialog.delivery.id}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {processingId === dialog.delivery.id
                  ? "Cancelling..."
                  : "Cancel Delivery"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
