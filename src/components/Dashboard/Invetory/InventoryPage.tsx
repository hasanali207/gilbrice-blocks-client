"use client";

import axios from "@/lib/axios";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Warehouse,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type BlockType = {
  id: string;
  name?: string;
  size?: string;
  isActive?: boolean;
  defaultUnitPrice?: number;
};

type InventoryItem = {
  id: string;
  blockTypeId: string;
  availableQty: number;
  curingQty: number;
  reservedQty: number;
  damagedQty: number;
  blockType: BlockType;
};

type InventorySummary = {
  availableQty: number;
  curingQty: number;
  reservedQty: number;
  damagedQty: number;
};

type InventoryResponse = {
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: InventoryItem[];
};

const emptySummary: InventorySummary = {
  availableQty: 0,
  curingQty: 0,
  reservedQty: 0,
  damagedQty: 0,
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value || 0);

const getErrorMessage = (error: any) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>(emptySummary);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const [sortBy, setSortBy] = useState("blockTypeId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [modal, setModal] = useState<"adjust" | "damage" | null>(null);

  const [form, setForm] = useState({
    blockTypeId: "",
    quantity: "",
    reason: "",
  });

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);

    try {
      const response = await axios.get("/api/v1/inventory/summary");
      const payload = response.data?.data;

      // Supports { totals: {...}, data: [...] } from the service
      setSummary(payload?.totals || emptySummary);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadInventory = useCallback(async () => {
    setLoading(true);

    try {
      const params: Record<string, string | number> = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (searchTerm.trim()) {
        params.searchTerm = searchTerm.trim();
      }

      if (activeFilter !== "all") {
        params.isActive = activeFilter;
      }

      const response = await axios.get<InventoryResponse>("/api/v1/inventory", {
        params,
      });

      const payload = response.data;

      setInventory(Array.isArray(payload.data) ? payload.data : []);
      setTotal(payload.meta?.total || 0);
      setTotalPage(Math.max(1, payload.meta?.totalPage || 1));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, activeFilter, sortBy, sortOrder]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const refreshAll = async () => {
    await Promise.all([loadInventory(), loadSummary()]);
  };

  const openModal = (type: "adjust" | "damage", item?: InventoryItem) => {
    setForm({
      blockTypeId: item?.blockTypeId || inventory[0]?.blockTypeId || "",
      quantity: "",
      reason: "",
    });
    setModal(type);
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setForm({
      blockTypeId: "",
      quantity: "",
      reason: "",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = Number(form.quantity);

    if (!form.blockTypeId) {
      toast.error("Please select a block type");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Quantity must be a positive whole number");
      return;
    }

    if (!form.reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setSubmitting(true);

    try {
      if (modal === "adjust") {
        const direction =
          document.querySelector<HTMLInputElement>(
            'input[name="adjustDirection"]:checked',
          )?.value || "add";

        const finalQuantity = direction === "remove" ? -quantity : quantity;

        await axios.post("/api/v1/inventory/adjust", {
          blockTypeId: form.blockTypeId,
          quantity: finalQuantity,
          reason: form.reason.trim(),
        });

        toast.success("Inventory adjusted successfully");
      } else if (modal === "damage") {
        await axios.post("/api/v1/inventory/damage", {
          blockTypeId: form.blockTypeId,
          quantity,
          reason: form.reason.trim(),
        });

        toast.success("Damaged stock recorded successfully");
      }

      setModal(null);
      setForm({
        blockTypeId: "",
        quantity: "",
        reason: "",
      });

      await refreshAll();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBlock = useMemo(
    () => inventory.find((item) => item.blockTypeId === form.blockTypeId),
    [inventory, form.blockTypeId],
  );

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }

    setPage(1);
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Warehouse className="h-4 w-4" />
              Operations
              <span>/</span>
              <span className="text-slate-800">Inventory</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Inventory Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor block stock, manage adjustments and record damaged
              inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void refreshAll()}
              disabled={loading || summaryLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading || summaryLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              onClick={() => openModal("damage")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              <AlertTriangle className="h-4 w-4" />
              Record Damage
            </button>

            <button
              onClick={() => openModal("adjust")}
              disabled={!inventory.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Adjust Stock
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Available Stock"
            value={summary.availableQty}
            description="Ready for allocation"
            icon={<Package className="h-5 w-5" />}
            color="blue"
            loading={summaryLoading}
          />

          <SummaryCard
            title="Curing Stock"
            value={summary.curingQty}
            description="Awaiting curing / quality"
            icon={<Boxes className="h-5 w-5" />}
            color="amber"
            loading={summaryLoading}
          />

          <SummaryCard
            title="Reserved Stock"
            value={summary.reservedQty}
            description="Allocated to orders"
            icon={<ShieldAlert className="h-5 w-5" />}
            color="violet"
            loading={summaryLoading}
          />

          <SummaryCard
            title="Damaged Stock"
            value={summary.damagedQty}
            description="Rejected or damaged blocks"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="rose"
            loading={summaryLoading}
          />
        </div>

        {/* Inventory Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold">Stock Overview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formatNumber(total)} inventory records found
                </p>
              </div>

              <form
                onSubmit={submitSearch}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search block type..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:w-64"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Search
                </button>

                <select
                  value={activeFilter}
                  onChange={(event) => {
                    setActiveFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  aria-label="Filter by block type status"
                >
                  <option value="all">All types</option>
                  <option value="true">Active types</option>
                  <option value="false">Inactive types</option>
                </select>
              </form>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Block Type</th>

                  <SortableHeader
                    label="Available"
                    active={sortBy === "availableQty"}
                    order={sortOrder}
                    onClick={() => toggleSort("availableQty")}
                  />

                  <SortableHeader
                    label="Curing"
                    active={sortBy === "curingQty"}
                    order={sortOrder}
                    onClick={() => toggleSort("curingQty")}
                  />

                  <SortableHeader
                    label="Reserved"
                    active={sortBy === "reservedQty"}
                    order={sortOrder}
                    onClick={() => toggleSort("reservedQty")}
                  />

                  <SortableHeader
                    label="Damaged"
                    active={sortBy === "damagedQty"}
                    order={sortOrder}
                    onClick={() => toggleSort("damagedQty")}
                  />

                  <th className="px-5 py-4 font-semibold">Total Stock</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-500" />
                      <p className="mt-3 text-sm text-slate-500">
                        Loading inventory...
                      </p>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="mt-3 font-semibold">No inventory found</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try another search or check your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const totalStock =
                      item.availableQty +
                      item.curingQty +
                      item.reservedQty +
                      item.damagedQty;

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                              <Boxes className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.blockType?.name || "Unnamed block"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.blockType?.size || "Size not specified"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StockValue value={item.availableQty} color="blue" />
                        </td>

                        <td className="px-5 py-4">
                          <StockValue value={item.curingQty} color="amber" />
                        </td>

                        <td className="px-5 py-4">
                          <StockValue value={item.reservedQty} color="violet" />
                        </td>

                        <td className="px-5 py-4">
                          <StockValue value={item.damagedQty} color="rose" />
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900">
                            {formatNumber(totalStock)}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">
                            blocks
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openModal("adjust", item)}
                              title="Adjust stock"
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:bg-slate-100"
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => openModal("damage", item)}
                              title="Record damaged stock"
                              className="rounded-lg border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {total === 0 ? 0 : (page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(page * limit, total)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {formatNumber(total)}
              </span>{" "}
              records
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none"
                aria-label="Rows per page"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>

              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <span className="min-w-24 text-center text-sm font-medium">
                Page {page} of {totalPage}
              </span>

              <button
                onClick={() =>
                  setPage((current) => Math.min(totalPage, current + 1))
                }
                disabled={page >= totalPage || loading}
                className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Stock Modal */}
        {modal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <section className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      modal === "adjust"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {modal === "adjust" ? (
                      <SlidersHorizontal className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      {modal === "adjust"
                        ? "Adjust Inventory"
                        : "Record Damaged Stock"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {modal === "adjust"
                        ? "Correct the available stock balance."
                        : "Move available stock into damaged inventory."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Block Type <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      required
                      value={form.blockTypeId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          blockTypeId: event.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    >
                      <option value="">Select block type</option>
                      {inventory.map((item) => (
                        <option key={item.blockTypeId} value={item.blockTypeId}>
                          {item.blockType?.name || "Block"} —{" "}
                          {item.blockType?.size || item.blockTypeId}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {selectedBlock && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Available stock</p>
                      <p className="mt-1 text-lg font-bold">
                        {formatNumber(selectedBlock.availableQty)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Block size</p>
                      <p className="mt-1 truncate text-lg font-bold">
                        {selectedBlock.blockType?.size || "—"}
                      </p>
                    </div>
                  </div>
                )}

                {modal === "adjust" && (
                  <fieldset>
                    <legend className="mb-2 block text-sm font-semibold">
                      Adjustment Type
                    </legend>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 transition has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50">
                        <input
                          type="radio"
                          name="adjustDirection"
                          value="add"
                          defaultChecked
                          className="accent-emerald-600"
                        />
                        <ArrowDownToLine className="h-4 w-4 rotate-180 text-emerald-600" />
                        <span className="text-sm font-semibold">Add Stock</span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 transition has-[:checked]:border-rose-300 has-[:checked]:bg-rose-50">
                        <input
                          type="radio"
                          name="adjustDirection"
                          value="remove"
                          className="accent-rose-600"
                        />
                        <ArrowDownToLine className="h-4 w-4 text-rose-600" />
                        <span className="text-sm font-semibold">
                          Remove Stock
                        </span>
                      </label>
                    </div>
                  </fieldset>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    placeholder="Enter number of blocks"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.reason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    placeholder={
                      modal === "adjust"
                        ? "Why is this stock being adjusted?"
                        : "Describe the reason for the damage..."
                    }
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !inventory.length}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 ${
                      modal === "adjust"
                        ? "bg-slate-900 hover:bg-slate-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {submitting
                      ? "Saving..."
                      : modal === "adjust"
                        ? "Save Adjustment"
                        : "Record Damage"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "amber" | "violet" | "rose";
  loading: boolean;
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {loading ? (
              <span className="inline-block h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              formatNumber(value)
            )}
          </div>
        </div>

        <div className={`rounded-xl p-3 ring-1 ${styles[color]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function StockValue({
  value,
  color,
}: {
  value: number;
  color: "blue" | "amber" | "violet" | "rose";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex min-w-16 justify-center rounded-lg px-2.5 py-1.5 font-semibold ${styles[color]}`}
    >
      {formatNumber(value)}
    </span>
  );
}

function SortableHeader({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-5 py-4">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap font-semibold transition hover:text-slate-900 ${
          active ? "text-slate-900" : ""
        }`}
      >
        {label}
        <ArrowUpDown
          className={`h-3.5 w-3.5 ${
            active ? "text-blue-600" : "text-slate-400"
          } ${active && order === "desc" ? "rotate-180" : ""}`}
        />
      </button>
    </th>
  );
}
