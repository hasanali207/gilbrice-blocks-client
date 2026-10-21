"use client";

import api from "@/lib/axios";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

// ==========================================================
// TYPES
// ==========================================================

type BlockType = {
  id: string;
  name: string;
  size: string;
  defaultUnitPrice: number | string;
  curingDays: number;
  isActive: boolean;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  client?: { name: string };
  items?: Array<{ blockTypeId: string; quantity: number }>;
};

type Batch = {
  id: string;
  batchNumber: string;
  blockTypeId: string;
  blockType?: BlockType;
  productionDate: string;
  readyDate: string;
  acceptedQty: number;
  rejectedQty: number;
  allocatedQty: number;
  curingDays: number;
  status: string;
  qualityStatus: string;
  notes?: string | null;
  supervisor?: { name: string };
};

type Schedule = {
  id: string;
  plannedDate: string;
  plannedQty: number;
  blockType?: BlockType;
  orderId?: string | null;
  notes?: string | null;
  createdBy?: { name: string };
};

type Meta = { page: number; limit: number; total: number };

type Summary = {
  totalBatches: number;
  acceptedQty: number;
  rejectedQty: number;
  pendingCount: number;
  pendingQty: number;
};

type Tab = "batches" | "schedule" | "allocate" | "quality";

// ==========================================================
// HELPERS
// ==========================================================

const PAGE_SIZES = [10, 20, 50];

const emptyMeta = (limit = 10): Meta => ({ page: 1, limit, total: 0 });

const emptySummary: Summary = {
  totalBatches: 0,
  acceptedQty: 0,
  rejectedQty: 0,
  pendingCount: 0,
  pendingQty: 0,
};

// Backend shape: { success, message, meta?, data }
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

const formatDate = (date?: string) => {
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

const initialBatch = {
  blockTypeId: "",
  productionDate: dateInputValue(),
  acceptedQty: "0",
  rejectedQty: "0",
  curingDays: "",
  notes: "",
};

const initialSchedule = {
  blockTypeId: "",
  plannedDate: dateInputValue(),
  plannedQty: "",
  orderId: "",
  notes: "",
};

const initialAllocation = {
  orderId: "",
  batchId: "",
  quantity: "",
};

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";

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
    APPROVED: "bg-emerald-50 text-emerald-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    REJECTED: "bg-red-50 text-red-700",
    CANCELLED: "bg-red-50 text-red-700",
    READY_FOR_DELIVERY: "bg-blue-50 text-blue-700",
    SCHEDULED: "bg-violet-50 text-violet-700",
    IN_PRODUCTION: "bg-blue-50 text-blue-700",
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

// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function ProductionManagement() {
  const [activeTab, setActiveTab] = useState<Tab>("batches");

  // Lookup data (not paginated)
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [readyBatches, setReadyBatches] = useState<Batch[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);

  // Batches table (paginated)
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchMeta, setBatchMeta] = useState<Meta>(emptyMeta());
  const [batchPage, setBatchPage] = useState(1);
  const [batchLimit, setBatchLimit] = useState(10);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  // Schedule (paginated)
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleMeta, setScheduleMeta] = useState<Meta>(emptyMeta());
  const [schedulePage, setSchedulePage] = useState(1);
  const [scheduleLimit, setScheduleLimit] = useState(10);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [scheduleFrom, setScheduleFrom] = useState("");
  const [scheduleTo, setScheduleTo] = useState("");

  // Quality (paginated pending batches)
  const [qualityBatches, setQualityBatches] = useState<Batch[]>([]);
  const [qualityMeta, setQualityMeta] = useState<Meta>(emptyMeta());
  const [qualityPage, setQualityPage] = useState(1);
  const [qualityLimit, setQualityLimit] = useState(10);
  const [qualityLoading, setQualityLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState("");

  const [batchForm, setBatchForm] = useState(initialBatch);
  const [scheduleForm, setScheduleForm] = useState(initialSchedule);
  const [allocationForm, setAllocationForm] = useState(initialAllocation);

  const [releaseId, setReleaseId] = useState("");
  const [releaseQuantity, setReleaseQuantity] = useState("");
  const [releaseReason, setReleaseReason] = useState("");

  const [qualityReasons, setQualityReasons] = useState<Record<string, string>>(
    {},
  );

  // ==========================================================
  // LOADERS
  // ==========================================================

  const loadLookups = useCallback(async () => {
    const [typeResult, orderResult] = await Promise.allSettled([
      api.get("/api/v1/block-types"),
      api.get("/api/v1/orders?limit=100&page=1"),
    ]);

    if (typeResult.status === "fulfilled") {
      setBlockTypes(
        unwrapList(typeResult.value).filter((type: BlockType) => type.isActive),
      );
    } else {
      toast.error("Failed to load block types");
    }

    if (orderResult.status === "fulfilled") {
      setOrders(unwrapList(orderResult.value));
    } else {
      toast.error("Failed to load orders");
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/productions/batches/summary");
      setSummary(res?.data?.data ?? emptySummary);
    } catch {
      toast.error("Failed to load production summary");
    }
  }, []);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);

    try {
      const res = await api.get("/api/v1/productions/batches", {
        params: {
          page: batchPage,
          limit: batchLimit,
          searchTerm: debouncedSearch || undefined,
        },
      });

      const meta = unwrapMeta(res, batchPage, batchLimit);
      const list = unwrapList(res);

      // current page became empty (e.g. data shrank) -> go to last page
      if (list.length === 0 && batchPage > 1 && meta.total > 0) {
        setBatchPage(Math.max(1, Math.ceil(meta.total / batchLimit)));
        return;
      }

      setBatches(list);
      setBatchMeta(meta);
    } catch {
      toast.error("Failed to load production batches");
    } finally {
      setBatchesLoading(false);
    }
  }, [batchPage, batchLimit, debouncedSearch]);

  const loadSchedules = useCallback(async () => {
    setSchedulesLoading(true);

    try {
      const res = await api.get("/api/v1/productions/schedule", {
        params: {
          page: schedulePage,
          limit: scheduleLimit,
          from: scheduleFrom || undefined,
          to: scheduleTo || undefined,
        },
      });

      const meta = unwrapMeta(res, schedulePage, scheduleLimit);
      const list = unwrapList(res);

      if (list.length === 0 && schedulePage > 1 && meta.total > 0) {
        setSchedulePage(Math.max(1, Math.ceil(meta.total / scheduleLimit)));
        return;
      }

      setSchedules(list);
      setScheduleMeta(meta);
    } catch {
      toast.error("Failed to load production schedule");
    } finally {
      setSchedulesLoading(false);
    }
  }, [schedulePage, scheduleLimit, scheduleFrom, scheduleTo]);

  const loadQuality = useCallback(async () => {
    setQualityLoading(true);

    try {
      const res = await api.get("/api/v1/productions/batches", {
        params: {
          page: qualityPage,
          limit: qualityLimit,
          qualityStatus: "PENDING",
          sortBy: "readyDate",
          sortOrder: "asc",
        },
      });

      const meta = unwrapMeta(res, qualityPage, qualityLimit);
      const list = unwrapList(res);

      // after approving the last item on a page, step back one page
      if (list.length === 0 && qualityPage > 1 && meta.total > 0) {
        setQualityPage(Math.max(1, Math.ceil(meta.total / qualityLimit)));
        return;
      }

      setQualityBatches(list);
      setQualityMeta(meta);
    } catch {
      toast.error("Failed to load pending quality batches");
    } finally {
      setQualityLoading(false);
    }
  }, [qualityPage, qualityLimit]);

  // Approved + cured batches for the allocation dropdown (up to 100)
  const loadReadyBatches = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/productions/batches", {
        params: {
          page: 1,
          limit: 100,
          qualityStatus: "APPROVED",
          readyOnly: true,
          sortBy: "readyDate",
          sortOrder: "desc",
        },
      });

      setReadyBatches(unwrapList(res));
    } catch {
      toast.error("Failed to load approved batches");
    }
  }, []);

  useEffect(() => {
    void loadLookups();
    void loadSummary();
    void loadReadyBatches();
  }, [loadLookups, loadSummary, loadReadyBatches]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    void loadQuality();
  }, [loadQuality]);

  const refreshAll = async () => {
    await Promise.all([
      loadLookups(),
      loadSummary(),
      loadReadyBatches(),
      loadBatches(),
      loadSchedules(),
      loadQuality(),
    ]);
  };

  const anyLoading = batchesLoading || schedulesLoading || qualityLoading;

  // ==========================================================
  // ACTIONS
  // ==========================================================
  const generateKey = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const createBatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const acceptedQty = Number(batchForm.acceptedQty);
    const rejectedQty = Number(batchForm.rejectedQty);

    if (
      !batchForm.blockTypeId ||
      !Number.isInteger(acceptedQty) ||
      !Number.isInteger(rejectedQty) ||
      acceptedQty < 0 ||
      rejectedQty < 0 ||
      acceptedQty + rejectedQty <= 0
    ) {
      toast.error("Enter valid production quantities");
      return;
    }

    setSaving(true);

    try {
      await api.post("/api/v1/productions/batches", {
        blockTypeId: batchForm.blockTypeId,
        productionDate: batchForm.productionDate,
        acceptedQty,
        rejectedQty,
        ...(batchForm.curingDays !== "" && {
          curingDays: Number(batchForm.curingDays),
        }),
        notes: batchForm.notes || undefined,
        idempotencyKey: generateKey(),
      });

      toast.success("Production batch created successfully");
      setBatchForm(initialBatch);

      // newest batch shows on page 1
      setSearch("");
      if (batchPage !== 1) setBatchPage(1);

      await Promise.all([
        loadSummary(),
        loadQuality(),
        loadReadyBatches(),
        batchPage === 1 ? loadBatches() : Promise.resolve(),
      ]);
    } catch (error: any) {
      console.error("CREATE BATCH ERROR:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create batch",
      );
    } finally {
      setSaving(false);
    }
  };

  const createSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !scheduleForm.blockTypeId ||
      !scheduleForm.plannedDate ||
      !Number.isInteger(Number(scheduleForm.plannedQty)) ||
      Number(scheduleForm.plannedQty) <= 0
    ) {
      toast.error("Enter a block type, date and valid quantity");
      return;
    }

    setSaving(true);

    try {
      await api.post("/api/v1/productions/schedule", {
        blockTypeId: scheduleForm.blockTypeId,
        plannedDate: scheduleForm.plannedDate,
        plannedQty: Number(scheduleForm.plannedQty),
        orderId: scheduleForm.orderId || undefined,
        notes: scheduleForm.notes || undefined,
      });

      toast.success("Production scheduled successfully");
      setScheduleForm(initialSchedule);

      if (schedulePage !== 1) setSchedulePage(1);
      else await loadSchedules();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to create production schedule",
      );
    } finally {
      setSaving(false);
    }
  };

  const allocateStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const quantity = Number(allocationForm.quantity);

    if (
      !allocationForm.orderId ||
      !allocationForm.batchId ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      toast.error("Select an order, batch and valid quantity");
      return;
    }

    setSaving(true);

    try {
      await api.post("/api/v1/productions/allocate", {
        orderId: allocationForm.orderId,
        batchId: allocationForm.batchId,
        quantity,
      });

      toast.success("Stock allocated successfully");
      setAllocationForm(initialAllocation);

      await Promise.all([loadLookups(), loadReadyBatches(), loadBatches()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to allocate stock");
    } finally {
      setSaving(false);
    }
  };

  const releaseStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const quantity = Number(releaseQuantity);

    if (
      !releaseId.trim() ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !releaseReason.trim()
    ) {
      toast.error("Allocation ID, quantity and reason are required");
      return;
    }

    setSaving(true);

    try {
      await api.post(
        `/api/v1/productions/allocations/${encodeURIComponent(releaseId.trim())}/release`,
        {
          quantity,
          reason: releaseReason.trim(),
        },
      );

      toast.success("Stock released successfully");
      setReleaseId("");
      setReleaseQuantity("");
      setReleaseReason("");

      await Promise.all([loadReadyBatches(), loadBatches()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to release stock");
    } finally {
      setSaving(false);
    }
  };

  const qualityDecision = async (batch: Batch, approved: boolean) => {
    const action = approved ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} batch ${batch.batchNumber}?`,
    );

    if (!confirmed) return;

    setProcessingId(batch.id);

    try {
      await api.patch(`/api/v1/productions/batches/${batch.id}/quality`, {
        approved,
        reason: qualityReasons[batch.id] || undefined,
      });

      toast.success(
        approved ? "Batch quality approved" : "Batch quality rejected",
      );

      setQualityReasons((previous) => {
        const next = { ...previous };
        delete next[batch.id];
        return next;
      });

      await Promise.all([
        loadSummary(),
        loadQuality(),
        loadReadyBatches(),
        loadBatches(),
      ]);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to record quality decision",
      );
    } finally {
      setProcessingId("");
    }
  };

  // ==========================================================
  // DERIVED
  // ==========================================================

  const tabs: { id: Tab; label: string }[] = [
    { id: "batches", label: "Production Batches" },
    { id: "schedule", label: "Schedule" },
    { id: "allocate", label: "Stock Allocation" },
    { id: "quality", label: "Quality Control" },
  ];

  const openOrders = orders.filter(
    (order) => !["CANCELLED", "DELIVERED"].includes(order.status),
  );

  const selectedAllocationOrder = orders.find(
    (order) => order.id === allocationForm.orderId,
  );

  const eligibleAllocationBatches = readyBatches.filter((batch) => {
    if (!selectedAllocationOrder) return true;

    return selectedAllocationOrder.items?.some(
      (item) => item.blockTypeId === batch.blockTypeId,
    );
  });

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
              Manufacturing
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Production Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage production batches, curing, quality and stock allocation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={anyLoading}
            className={secondaryButton}
          >
            {anyLoading ? "Refreshing..." : "↻ Refresh data"}
          </button>
        </div>

        {/* Summary cards (server-side totals, not affected by pagination) */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={cardClass}>
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Total Batches
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.totalBatches.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Recorded production batches
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Accepted Blocks
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {summary.acceptedQty.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Total accepted production
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Rejected Blocks
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {summary.rejectedQty.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Rejected during inspection
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Pending Quality
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {summary.pendingCount.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {summary.pendingQty.toLocaleString()} blocks awaiting approval
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
                {tab.id === "quality" && summary.pendingCount > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    {summary.pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ====================== BATCHES TAB ====================== */}
        {activeTab === "batches" && (
          <div className="space-y-6">
            <form onSubmit={createBatch} className={cardClass}>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Record Production Batch
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record accepted and rejected quantities for a production run.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Block Type *">
                  <select
                    className={inputClass}
                    required
                    value={batchForm.blockTypeId}
                    onChange={(e) =>
                      setBatchForm((p) => ({
                        ...p,
                        blockTypeId: e.target.value,
                        curingDays:
                          blockTypes
                            .find((b) => b.id === e.target.value)
                            ?.curingDays.toString() ?? "",
                      }))
                    }
                  >
                    <option value="">Select block type</option>
                    {blockTypes.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name} — {block.size}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Production Date *">
                  <input
                    className={inputClass}
                    type="date"
                    required
                    value={batchForm.productionDate}
                    onChange={(e) =>
                      setBatchForm((p) => ({
                        ...p,
                        productionDate: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Curing Days">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="1"
                    value={batchForm.curingDays}
                    placeholder="Use block type default"
                    onChange={(e) =>
                      setBatchForm((p) => ({
                        ...p,
                        curingDays: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Accepted Quantity *">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={batchForm.acceptedQty}
                    onChange={(e) =>
                      setBatchForm((p) => ({
                        ...p,
                        acceptedQty: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Rejected Quantity *">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={batchForm.rejectedQty}
                    onChange={(e) =>
                      setBatchForm((p) => ({
                        ...p,
                        rejectedQty: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Notes">
                  <input
                    className={inputClass}
                    value={batchForm.notes}
                    placeholder="Optional notes"
                    onChange={(e) =>
                      setBatchForm((p) => ({
                        ...p,
                        notes: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-500">
                  Total produced:{" "}
                  <strong>
                    {(
                      Number(batchForm.acceptedQty || 0) +
                      Number(batchForm.rejectedQty || 0)
                    ).toLocaleString()}
                  </strong>{" "}
                  blocks
                </p>

                <button
                  type="submit"
                  disabled={saving || blockTypes.length === 0}
                  className={buttonClass}
                >
                  {saving ? "Saving..." : "+ Record Batch"}
                </button>
              </div>
            </form>

            {/* Batch list */}
            <div className={cardClass}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Production History
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {batchMeta.total.toLocaleString()} batches
                  </p>
                </div>

                <input
                  className={`${inputClass} mt-0 sm:max-w-xs`}
                  placeholder="Search batch number or block type..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setBatchPage(1);
                  }}
                />
              </div>

              <div
                className={`overflow-x-auto transition-opacity ${
                  batchesLoading ? "opacity-50" : ""
                }`}
              >
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Batch</th>
                      <th className="px-3 py-3">Block Type</th>
                      <th className="px-3 py-3">Production Date</th>
                      <th className="px-3 py-3">Accepted</th>
                      <th className="px-3 py-3">Rejected</th>
                      <th className="px-3 py-3">Ready Date</th>
                      <th className="px-3 py-3">Quality</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {batches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50">
                        <td className="px-3 py-4 font-semibold text-blue-700">
                          {batch.batchNumber}
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-medium text-slate-800">
                            {batch.blockType?.name || "—"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {batch.blockType?.size || ""}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          {formatDate(batch.productionDate)}
                        </td>
                        <td className="px-3 py-4 font-semibold text-emerald-700">
                          {batch.acceptedQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-4 font-semibold text-red-600">
                          {batch.rejectedQty.toLocaleString()}
                        </td>
                        <td className="px-3 py-4">
                          {formatDate(batch.readyDate)}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge value={batch.qualityStatus} />
                        </td>
                      </tr>
                    ))}

                    {!batchesLoading && batches.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No production batches found.
                        </td>
                      </tr>
                    )}

                    {batchesLoading && batches.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          Loading production batches...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                meta={batchMeta}
                disabled={batchesLoading}
                onPageChange={setBatchPage}
                onLimitChange={(limit) => {
                  setBatchLimit(limit);
                  setBatchPage(1);
                }}
              />
            </div>
          </div>
        )}

        {/* ====================== SCHEDULE TAB ====================== */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <form onSubmit={createSchedule} className={cardClass}>
              <h2 className="text-lg font-bold text-slate-900">
                Create Production Schedule
              </h2>
              <p className="mb-5 mt-1 text-sm text-slate-500">
                Plan production and optionally associate it with an order.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Block Type *">
                  <select
                    className={inputClass}
                    required
                    value={scheduleForm.blockTypeId}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        blockTypeId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select block type</option>
                    {blockTypes.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name} — {block.size}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Planned Date *">
                  <input
                    className={inputClass}
                    type="date"
                    required
                    value={scheduleForm.plannedDate}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        plannedDate: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Planned Quantity *">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={scheduleForm.plannedQty}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        plannedQty: e.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Related Order (optional)">
                  <select
                    className={inputClass}
                    value={scheduleForm.orderId}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        orderId: e.target.value,
                      }))
                    }
                  >
                    <option value="">No linked order</option>
                    {openOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber}
                        {order.client?.name ? ` — ${order.client.name}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Notes">
                  <input
                    className={inputClass}
                    value={scheduleForm.notes}
                    placeholder="Optional notes"
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        notes: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                <button
                  className={buttonClass}
                  disabled={saving || blockTypes.length === 0}
                  type="submit"
                >
                  {saving ? "Saving..." : "Create Schedule"}
                </button>
              </div>
            </form>

            <div className={cardClass}>
              <div className="flex items-end justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Scheduled Production
                </h2>
                <p className="text-sm text-slate-500">
                  {scheduleMeta.total.toLocaleString()} schedules
                </p>
              </div>

              <div className="my-4 grid gap-3 sm:grid-cols-2">
                <Field label="From Date">
                  <input
                    className={inputClass}
                    type="date"
                    value={scheduleFrom}
                    onChange={(e) => {
                      setScheduleFrom(e.target.value);
                      setSchedulePage(1);
                    }}
                  />
                </Field>

                <Field label="To Date">
                  <input
                    className={inputClass}
                    type="date"
                    value={scheduleTo}
                    onChange={(e) => {
                      setScheduleTo(e.target.value);
                      setSchedulePage(1);
                    }}
                  />
                </Field>
              </div>

              <div
                className={`space-y-3 transition-opacity ${
                  schedulesLoading ? "opacity-50" : ""
                }`}
              >
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {schedule.blockType?.name || "Block type"}{" "}
                        <span className="font-normal text-slate-500">
                          {schedule.blockType?.size || ""}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Planned: {formatDate(schedule.plannedDate)}
                      </p>
                      {schedule.notes && (
                        <p className="mt-1 text-xs text-slate-500">
                          {schedule.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xl font-bold text-blue-700">
                        {schedule.plannedQty.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">blocks planned</p>
                    </div>
                  </div>
                ))}

                {!schedulesLoading && schedules.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No schedules found for the selected dates.
                  </p>
                )}

                {schedulesLoading && schedules.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Loading schedules...
                  </p>
                )}
              </div>

              <Pagination
                meta={scheduleMeta}
                disabled={schedulesLoading}
                onPageChange={setSchedulePage}
                onLimitChange={(limit) => {
                  setScheduleLimit(limit);
                  setSchedulePage(1);
                }}
              />
            </div>
          </div>
        )}

        {/* ====================== ALLOCATE TAB ====================== */}
        {activeTab === "allocate" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={allocateStock} className={cardClass}>
              <h2 className="text-lg font-bold text-slate-900">
                Allocate Stock to Order
              </h2>
              <p className="mb-5 mt-1 text-sm text-slate-500">
                Only cured and quality-approved batches can be allocated.
              </p>

              <div className="space-y-4">
                <Field label="Order *">
                  <select
                    className={inputClass}
                    required
                    value={allocationForm.orderId}
                    onChange={(e) =>
                      setAllocationForm((p) => ({
                        ...p,
                        orderId: e.target.value,
                        batchId: "",
                      }))
                    }
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

                <Field label="Approved Batch *">
                  <select
                    className={inputClass}
                    required
                    value={allocationForm.batchId}
                    onChange={(e) =>
                      setAllocationForm((p) => ({
                        ...p,
                        batchId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select eligible batch</option>
                    {eligibleAllocationBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchNumber} — {batch.blockType?.name} (
                        {batch.blockType?.size}) — Accepted {batch.acceptedQty}
                        {" · "}Allocated {batch.allocatedQty}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Quantity to Allocate *">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={allocationForm.quantity}
                    onChange={(e) =>
                      setAllocationForm((p) => ({
                        ...p,
                        quantity: e.target.value,
                      }))
                    }
                  />
                </Field>

                <button
                  className={`${buttonClass} w-full`}
                  disabled={
                    saving || !allocationForm.orderId || !allocationForm.batchId
                  }
                  type="submit"
                >
                  {saving ? "Allocating..." : "Allocate Stock"}
                </button>
              </div>

              <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                The backend validates remaining order quantity, batch allocation
                capacity and available inventory before saving.
              </p>
            </form>

            <form onSubmit={releaseStock} className={cardClass}>
              <h2 className="text-lg font-bold text-slate-900">
                Release Reserved Stock
              </h2>
              <p className="mb-5 mt-1 text-sm text-slate-500">
                Return unneeded reserved stock to available inventory.
              </p>

              <div className="space-y-4">
                <Field label="Allocation ID *">
                  <input
                    className={inputClass}
                    required
                    value={releaseId}
                    onChange={(e) => setReleaseId(e.target.value)}
                    placeholder="Paste the allocation UUID"
                  />
                </Field>

                <Field label="Quantity to Release *">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={releaseQuantity}
                    onChange={(e) => setReleaseQuantity(e.target.value)}
                  />
                </Field>

                <Field label="Release Reason *">
                  <textarea
                    className={inputClass}
                    rows={3}
                    required
                    value={releaseReason}
                    onChange={(e) => setReleaseReason(e.target.value)}
                    placeholder="Why is the stock being released?"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={saving}
                  className={`${buttonClass} w-full`}
                >
                  {saving ? "Releasing..." : "Release Stock"}
                </button>
              </div>

              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                The server rejects releases that exceed undelivered stock not
                already assigned to active delivery plans.
              </p>
            </form>
          </div>
        )}

        {/* ====================== QUALITY TAB ====================== */}
        {activeTab === "quality" && (
          <div className={cardClass}>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Quality Inspection
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Approve batches after curing is complete, or reject them after
                inspection.
              </p>
            </div>

            <div
              className={`space-y-4 transition-opacity ${
                qualityLoading ? "opacity-50" : ""
              }`}
            >
              {qualityBatches.map((batch) => {
                const curingComplete = new Date(batch.readyDate) <= new Date();

                return (
                  <div
                    key={batch.id}
                    className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-bold text-slate-900">
                          {batch.batchNumber}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {batch.blockType?.name || "Block type"}{" "}
                          {batch.blockType?.size
                            ? `— ${batch.blockType.size}`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Produced: {formatDate(batch.productionDate)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Curing ready date: {formatDate(batch.readyDate)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <StatusBadge
                          value={curingComplete ? "PENDING" : "IN_PRODUCTION"}
                        />
                      </div>
                    </div>

                    <div className="my-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-700">Accepted</p>
                        <p className="mt-1 text-xl font-bold text-emerald-800">
                          {batch.acceptedQty.toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-xl bg-red-50 p-3">
                        <p className="text-xs text-red-700">Rejected</p>
                        <p className="mt-1 text-xl font-bold text-red-800">
                          {batch.rejectedQty.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Field label="Inspection notes / decision reason">
                      <textarea
                        className={inputClass}
                        rows={2}
                        value={qualityReasons[batch.id] || ""}
                        onChange={(e) =>
                          setQualityReasons((p) => ({
                            ...p,
                            [batch.id]: e.target.value,
                          }))
                        }
                        placeholder="Optional inspection notes"
                      />
                    </Field>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={processingId === batch.id}
                        onClick={() => void qualityDecision(batch, false)}
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {processingId === batch.id
                          ? "Processing..."
                          : "Reject Batch"}
                      </button>

                      <button
                        type="button"
                        disabled={processingId === batch.id || !curingComplete}
                        onClick={() => void qualityDecision(batch, true)}
                        className={buttonClass}
                      >
                        {processingId === batch.id
                          ? "Processing..."
                          : curingComplete
                            ? "Approve Quality"
                            : "Curing Not Complete"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {!qualityLoading && qualityMeta.total === 0 && (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
                    ✓
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    All caught up!
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    There are no pending quality decisions.
                  </p>
                </div>
              )}

              {qualityLoading && qualityBatches.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading pending batches...
                </p>
              )}
            </div>

            <Pagination
              meta={qualityMeta}
              disabled={qualityLoading}
              onPageChange={setQualityPage}
              onLimitChange={(limit) => {
                setQualityLimit(limit);
                setQualityPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
