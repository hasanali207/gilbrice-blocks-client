"use client";

import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarDays,
  Eye,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import api from "@/lib/axios";
import { useCurrentToken } from "@/Redux/Features/Auth/authSlice";
import toast from "react-hot-toast";
import OrderPaymentPanel from "./OrderPaymentPanel";

type OrderStatus =
  | "CONFIRMED"
  | "SCHEDULED"
  | "IN_PRODUCTION"
  | "CURING"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

interface Client {
  id: string;
  name: string;
  phone: string;
  city: string;
  deliveryAddress: string;
}

interface BlockType {
  id: string;
  name: string;
  size?: string;
  defaultUnitPrice?: string | number;
  isActive?: boolean;
}

interface OrderItem {
  id: string;
  blockTypeId: string;
  quantity: number;
  unitPrice: string | number;
  blockType?: BlockType;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  clientId: string;
  client: Client;
  salesRepId?: string | null;
  items: OrderItem[];
  discount: string | number;
  deliveryFee: string | number;
  deliveryAddress: string;
  deliveryInstructions?: string | null;
  notes?: string | null;
  orderDate: string;
  plannedStartDate?: string | null;
  plannedCompletionDate?: string | null;
  promisedDeliveryDate?: string | null;
  cancellationReason?: string | null;
  subtotal?: number;
  total?: number;
  paid?: number;
  outstanding?: number;
  remainingProduction?: {
    blockTypeId: string;
    orderedQty: number;
    allocatedQty: number;
    remainingQty: number;
  }[];
  remainingDelivery?: {
    blockTypeId: string;
    orderedQty: number;
    deliveredQty: number;
  }[];
}

interface OrderFormItem {
  blockTypeId: string;
  quantity: number;
  unitPrice: number;
}

const STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "SCHEDULED",
  "IN_PRODUCTION",
  "CURING",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED: "SCHEDULED",
  SCHEDULED: "IN_PRODUCTION",
  IN_PRODUCTION: "CURING",
  CURING: "READY_FOR_DELIVERY",
};

const statusStyle: Record<OrderStatus, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  SCHEDULED: "bg-violet-50 text-violet-700 ring-violet-600/20",
  IN_PRODUCTION: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CURING: "bg-orange-50 text-orange-700 ring-orange-600/20",
  READY_FOR_DELIVERY: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  DELIVERED: "bg-green-50 text-green-700 ring-green-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
};

const emptyForm = {
  clientId: "",
  deliveryAddress: "",
  deliveryInstructions: "",
  notes: "",
  discount: 0,
  deliveryFee: 0,
  plannedStartDate: "",
  plannedCompletionDate: "",
  promisedDeliveryDate: "",
};

const money = (value: number | string | undefined) =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  })} FCFA`;

const dateFormat = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

function getPagination(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (page > 3) pages.push("...");

  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  ) {
    pages.push(i);
  }

  if (page < totalPages - 2) pages.push("...");

  pages.push(totalPages);

  return pages;
}

export default function AllOrders() {
  const token = useSelector(useCurrentToken);

  const [view, setView] = useState<"list" | "create" | "details">("list");

  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [statusTarget, setStatusTarget] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [statusReason, setStatusReason] = useState("");

  const [form, setForm] = useState({ ...emptyForm });
  const [items, setItems] = useState<OrderFormItem[]>([
    { blockTypeId: "", quantity: 1, unitPrice: 0 },
  ]);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  // =====================================================
  // FETCH ORDERS
  // =====================================================

  const fetchOrders = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));

      if (searchTerm.trim()) {
        params.set("searchTerm", searchTerm.trim());
      }

      if (statusFilter) params.set("status", statusFilter);
      if (clientFilter) params.set("clientId", clientFilter);

      const res = await api.get(`/api/v1/orders?${params.toString()}`);

      const data: Order[] = res.data?.data || [];
      const serverTotal = Number(res.data?.meta?.total) || 0;
      const pages = Math.max(1, Math.ceil(serverTotal / limit));

      setOrders(data);
      setTotal(serverTotal);
      setTotalPages(pages);

      if (page > pages) setPage(pages);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, searchTerm, statusFilter, clientFilter]);

  useEffect(() => {
    if (view === "list") fetchOrders();
  }, [view, fetchOrders]);

  // =====================================================
  // LOAD CLIENTS + BLOCK TYPES
  // =====================================================

  useEffect(() => {
    if (!token || view !== "create") return;

    const loadOptions = async () => {
      const [clientRes, blockRes] = await Promise.allSettled([
        api.get(`/api/v1/clients?page=1&limit=100`),
        api.get(`/api/v1/block-types?isActive=true`),
      ]);

      if (clientRes.status === "fulfilled") {
        setClients(clientRes.value.data?.data || []);
      } else {
        console.error(
          "Clients error:",
          clientRes.reason?.response ?? clientRes.reason,
        );
        toast.error(
          `Clients: ${clientRes.reason?.response?.data?.message || "failed to load"}`,
        );
      }

      if (blockRes.status === "fulfilled") {
        setBlockTypes(
          (blockRes.value.data?.data || []).filter(
            (item: BlockType) => item.isActive !== false,
          ),
        );
      } else {
        console.error(
          "Block types error:",
          blockRes.reason?.response ?? blockRes.reason,
        );
        toast.error(
          `Block types: ${blockRes.reason?.response?.data?.message || "failed to load"}`,
        );
      }
    };

    loadOptions();
  }, [token, view]);

  // =====================================================
  // OPEN CREATE FORM
  // =====================================================

  const openCreate = () => {
    setForm({ ...emptyForm });
    setItems([{ blockTypeId: "", quantity: 1, unitPrice: 0 }]);
    setView("create");
  };

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  const updateForm = (key: keyof typeof emptyForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateItem = (
    index: number,
    key: keyof OrderFormItem,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { blockTypeId: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const totalAmount =
    subtotal - Number(form.discount || 0) + Number(form.deliveryFee || 0);

  // ⬇️ ekhane boshao
  const selectBlockType = (index: number, blockTypeId: string) => {
    const type = blockTypes.find((b) => b.id === blockTypeId);

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              blockTypeId,
              unitPrice: type ? Number(type.defaultUnitPrice ?? 0) : 0,
            }
          : item,
      ),
    );
  };
  // =====================================================
  // CREATE ORDER
  // =====================================================

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) return toast.error("Please login first");

    if (!form.clientId) {
      return toast.error("Please select a client");
    }

    if (!form.deliveryAddress.trim()) {
      return toast.error("Delivery address is required");
    }

    if (
      items.some(
        (item) =>
          !item.blockTypeId ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) <= 0 ||
          !Number.isFinite(Number(item.unitPrice)) ||
          Number(item.unitPrice) < 0,
      )
    ) {
      return toast.error("Please check all order items");
    }

    if (new Set(items.map((item) => item.blockTypeId)).size !== items.length) {
      return toast.error("A block type cannot be added more than once");
    }

    if (
      Number(form.discount) < 0 ||
      Number(form.deliveryFee) < 0 ||
      Number(form.discount) > subtotal
    ) {
      return toast.error("Invalid discount or delivery fee");
    }

    setSaving(true);

    try {
      const payload = {
        clientId: form.clientId,
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryInstructions: form.deliveryInstructions || undefined,
        notes: form.notes || undefined,
        discount: Number(form.discount),
        deliveryFee: Number(form.deliveryFee),
        plannedStartDate: form.plannedStartDate || undefined,
        plannedCompletionDate: form.plannedCompletionDate || undefined,
        promisedDeliveryDate: form.promisedDeliveryDate || undefined,
        items: items.map((item) => ({
          blockTypeId: item.blockTypeId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      await api.post(`/api/v1/orders`, payload);

      toast.success("Order created successfully");

      setView("list");
      setPage(1);
      setSearchTerm("");
      setStatusFilter("");
      setClientFilter("");
      setForm({ ...emptyForm });
      setItems([{ blockTypeId: "", quantity: 1, unitPrice: 0 }]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // VIEW DETAILS
  // =====================================================

  const openDetails = async (order: Order) => {
    if (!token) return;

    setActionLoading(true);

    try {
      const res = await api.get(`/api/v1/orders/${order.id}`);

      setSelectedOrder(res.data?.data || order);
      setView("details");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to load order details",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const submitCancel = async () => {
    if (!token || !cancelTarget) return;

    if (!cancelReason.trim()) {
      return toast.error("Cancellation reason is required");
    }

    setActionLoading(true);

    try {
      await api.patch(
        `/api/v1/orders/${cancelTarget.id}/cancel`,
        { reason: cancelReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Order cancelled");

      setCancelTarget(null);
      setCancelReason("");
      await fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // CHANGE STATUS
  // =====================================================

  const submitStatusChange = async () => {
    if (!token || !statusTarget || !nextStatus) return;

    setActionLoading(true);

    try {
      await api.patch(
        `/api/v1/orders/${statusTarget.id}/status`,
        {
          status: nextStatus,
          reason: statusReason.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Order status updated");

      setStatusTarget(null);
      setNextStatus("");
      setStatusReason("");

      if (view === "details") {
        await openDetails(statusTarget);
      } else {
        await fetchOrders();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Could not update order status",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const pages = getPagination(page, totalPages);

  // =====================================================
  // HEADER
  // =====================================================

  const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <button
          type="button"
          onClick={() => setView("list")}
          className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to All Orders
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={() => setView("list")}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <ShoppingCart size={17} />
        All Orders
      </button>
    </div>
  );

  // =====================================================
  // CREATE ORDER VIEW
  // =====================================================

  if (view === "create") {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
        <Header
          title="Create Order"
          subtitle="Select a client, add products and set delivery information."
        />

        <form onSubmit={handleCreate} className="space-y-6">
          {/* CUSTOMER */}

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Client & Delivery</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Client *
                </label>

                <select
                  required
                  value={form.clientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const client = clients.find((c) => c.id === id);

                    setForm((prev) => ({
                      ...prev,
                      clientId: id,
                      deliveryAddress:
                        prev.deliveryAddress || client?.deliveryAddress || "",
                    }));
                  }}
                  className={inputClass}
                >
                  <option value="">Select client</option>

                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} — {client.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Delivery Address *
                </label>

                <input
                  required
                  value={form.deliveryAddress}
                  onChange={(e) =>
                    updateForm("deliveryAddress", e.target.value)
                  }
                  placeholder="Delivery address"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Delivery Instructions
                </label>

                <textarea
                  value={form.deliveryInstructions}
                  onChange={(e) =>
                    updateForm("deliveryInstructions", e.target.value)
                  }
                  placeholder="Delivery instructions (optional)"
                  className={`${inputClass} min-h-20`}
                />
              </div>
            </div>
          </section>

          {/* ITEMS */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">Order Items</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Each block type can only be added once.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-4 p-5">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] sm:items-end"
                >
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-600">
                      Block Type *
                    </label>

                    <select
                      required
                      value={item.blockTypeId}
                      onChange={(e) => selectBlockType(index, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select block type</option>

                      {blockTypes.map((type) => (
                        <option
                          key={type.id}
                          value={type.id}
                          disabled={items.some(
                            (other, i) =>
                              i !== index && other.blockTypeId === type.id,
                          )}
                        >
                          {type.name} — {money(type.defaultUnitPrice)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-600">
                      Quantity *
                    </label>

                    <input
                      required
                      type="number"
                      min={1}
                      step={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", Number(e.target.value))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-600">
                      Unit Price (FCFA) *
                    </label>

                    <input
                      required
                      type="number"
                      min={0}
                      step={1}
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(index, "unitPrice", Number(e.target.value))
                      }
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    title="Remove item"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-3 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <X size={16} />
                    <span className="sm:hidden">Remove item</span>
                  </button>

                  <div className="text-right text-sm font-semibold text-gray-700 sm:col-span-4">
                    Line Total: {money(item.quantity * item.unitPrice)}
                  </div>
                </div>
              ))}
            </div>

            {blockTypes.length === 0 && (
              <p className="px-5 pb-5 text-sm text-amber-700">
                No block types loaded. Check the block-types API endpoint and
                create active block types first.
              </p>
            )}
          </section>

          {/* SCHEDULE */}

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Schedule & Notes</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Planned Start
                </label>
                <input
                  type="date"
                  value={form.plannedStartDate}
                  onChange={(e) =>
                    updateForm("plannedStartDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Planned Completion
                </label>
                <input
                  type="date"
                  value={form.plannedCompletionDate}
                  onChange={(e) =>
                    updateForm("plannedCompletionDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Promised Delivery
                </label>
                <input
                  type="date"
                  value={form.promisedDeliveryDate}
                  onChange={(e) =>
                    updateForm("promisedDeliveryDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Internal order notes"
                  className={`${inputClass} min-h-20`}
                />
              </div>
            </div>
          </section>

          {/* TOTALS */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 font-semibold text-gray-900">Order Summary</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Discount (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  max={subtotal}
                  step={1}
                  value={form.discount}
                  onChange={(e) =>
                    updateForm("discount", Number(e.target.value))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Delivery Fee (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.deliveryFee}
                  onChange={(e) =>
                    updateForm("deliveryFee", Number(e.target.value))
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col justify-center rounded-xl bg-blue-50 p-4">
                <span className="text-sm text-blue-700">Total Amount</span>
                <span className="mt-1 text-2xl font-bold text-blue-900">
                  {money(totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Discount</span>
                <span>− {money(form.discount)}</span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Delivery Fee</span>
                <span>{money(form.deliveryFee)}</span>
              </div>

              <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
                <span>Grand Total</span>
                <span>{money(totalAmount)}</span>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setView("list")}
              disabled={saving}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || blockTypes.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Plus size={17} />
              )}
              {saving ? "Creating Order..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =====================================================
  // ORDER DETAILS VIEW
  // =====================================================

  if (view === "details" && selectedOrder) {
    const order = selectedOrder;

    const computedSubtotal = order.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    const computedTotal =
      order.total ??
      computedSubtotal -
        Number(order.discount || 0) +
        Number(order.deliveryFee || 0);

    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
        <Header
          title={order.orderNumber}
          subtitle="Order details, payment summary and production progress."
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {order.orderNumber}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Created: {dateFormat(order.orderDate)}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                statusStyle[order.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {order.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Subtotal",
                value: money(order.subtotal ?? computedSubtotal),
              },
              { label: "Grand Total", value: money(computedTotal) },
              { label: "Paid", value: money(order.paid) },
              { label: "Outstanding", value: money(order.outstanding) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-2 text-xl font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Client Information</h2>

            <p className="mt-4 font-semibold text-gray-800">
              {order.client?.name || "—"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {order.client?.phone || "—"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {order.client?.city || "—"}
            </p>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase text-gray-400">
                Delivery Address
              </p>
              <p className="mt-2 text-sm text-gray-700">
                {order.deliveryAddress}
              </p>
              {order.deliveryInstructions && (
                <p className="mt-2 text-sm text-gray-500">
                  {order.deliveryInstructions}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Schedule Information
            </h2>

            <div className="mt-4 space-y-4">
              {[
                ["Order Date", order.orderDate],
                ["Planned Start", order.plannedStartDate],
                ["Planned Completion", order.plannedCompletionDate],
                ["Promised Delivery", order.promisedDeliveryDate],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">
                    {dateFormat(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Order Items</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Block Type</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {item.blockType?.name || item.blockTypeId}
                    </td>
                    <td className="px-5 py-4">{item.quantity}</td>
                    <td className="px-5 py-4">{money(item.unitPrice)}</td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {money(Number(item.unitPrice) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 border-t border-gray-100 p-5 sm:ml-auto sm:max-w-sm">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{money(order.subtotal ?? computedSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Discount</span>
              <span>− {money(order.discount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery Fee</span>
              <span>{money(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
              <span>Total</span>
              <span>{money(computedTotal)}</span>
            </div>
          </div>
        </section>

        <OrderPaymentPanel
          orderId={order.id}
          orderNumber={order.orderNumber}
          clientName={order.client?.name || "Customer"}
          orderTotal={computedTotal}
          initialPaid={Number(order.paid || 0)}
          onUpdated={() => {
            void openDetails(order);
            void fetchOrders();
          }}
        />
        {(order.remainingProduction || order.remainingDelivery) && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {order.remainingProduction && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900">
                  Production Progress
                </h2>

                <div className="mt-4 space-y-4">
                  {order.remainingProduction.map((item) => (
                    <div key={item.blockTypeId}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-gray-600">
                          {order.items.find(
                            (i) => i.blockTypeId === item.blockTypeId,
                          )?.blockType?.name || item.blockTypeId}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {item.allocatedQty} / {item.orderedQty}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${
                              item.orderedQty
                                ? Math.min(
                                    100,
                                    (item.allocatedQty / item.orderedQty) * 100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Remaining: {item.remainingQty}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.remainingDelivery && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900">
                  Delivery Progress
                </h2>

                <div className="mt-4 space-y-4">
                  {order.remainingDelivery.map((item) => (
                    <div key={item.blockTypeId}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-gray-600">
                          {order.items.find(
                            (i) => i.blockTypeId === item.blockTypeId,
                          )?.blockType?.name || item.blockTypeId}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {item.deliveredQty} / {item.orderedQty}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-600"
                          style={{
                            width: `${
                              item.orderedQty
                                ? Math.min(
                                    100,
                                    (item.deliveredQty / item.orderedQty) * 100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {order.notes && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
              {order.notes}
            </p>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          {NEXT_STATUS[order.status] && (
            <button
              type="button"
              onClick={() => {
                setStatusTarget(order);
                setNextStatus(NEXT_STATUS[order.status] || "");
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Move to {NEXT_STATUS[order.status]?.replaceAll("_", " ")}
            </button>
          )}

          {!["DELIVERED", "CANCELLED"].includes(order.status) && (
            <button
              type="button"
              onClick={() => setCancelTarget(order)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Ban size={16} />
              Cancel Order
            </button>
          )}
        </div>

        {/* Shared confirmation dialogs rendered below */}
        {renderDialogs()}
      </div>
    );
  }

  // =====================================================
  // LIST VIEW
  // =====================================================

  function renderDialogs() {
    return (
      <>
        {cancelTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
              <p className="mt-2 text-sm text-gray-500">
                {cancelTarget.orderNumber}. Enter a cancellation reason.
              </p>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Cancellation reason..."
                className={`${inputClass} mt-4 min-h-28`}
              />

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCancelTarget(null);
                    setCancelReason("");
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={submitCancel}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {actionLoading ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {statusTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900">
                Update Order Status
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {statusTarget.orderNumber}
              </p>

              <label className="mb-2 mt-5 block text-sm font-medium text-gray-700">
                New Status
              </label>
              <select
                value={nextStatus}
                onChange={(e) =>
                  setNextStatus(e.target.value as OrderStatus | "")
                }
                className={inputClass}
              >
                <option value="">Select next status</option>
                {NEXT_STATUS[statusTarget.status] && (
                  <option value={NEXT_STATUS[statusTarget.status]}>
                    {NEXT_STATUS[statusTarget.status]?.replaceAll("_", " ")}
                  </option>
                )}
              </select>

              <label className="mb-2 mt-4 block text-sm font-medium text-gray-700">
                Reason (optional)
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Add a note..."
                className={`${inputClass} min-h-20`}
              />

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setStatusTarget(null);
                    setNextStatus("");
                    setStatusReason("");
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !nextStatus}
                  onClick={submitStatusChange}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {actionLoading ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Package size={14} />
            ORDER MANAGEMENT
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            All Orders
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage orders, production stages and customer deliveries.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{total}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Current Page</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {page}
            <span className="ml-2 text-base font-medium text-gray-400">
              / {totalPages}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Records Per Page</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{limit}</p>
        </div>
      </div>

      {/* FILTERS */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search order number or client..."
              className={`${inputClass} pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <input
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Client ID filter"
            className={inputClass}
          />

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setClientFilter("");
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Order Directory</h2>
            <p className="mt-1 text-xs text-gray-500">{total} order(s)</p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Order</th>
                <th className="px-5 py-4 font-semibold">Client</th>
                <th className="px-5 py-4 font-semibold">Items</th>
                <th className="px-5 py-4 font-semibold">Order Date</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-blue-600"
                    />
                    <p className="mt-3 text-sm text-gray-500">
                      Loading orders...
                    </p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <ShoppingCart size={34} className="mx-auto text-gray-300" />
                    <p className="mt-3 font-semibold text-gray-700">
                      No orders found
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Create an order or change your filters.
                    </p>

                    <button
                      type="button"
                      onClick={openCreate}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Create First Order
                    </button>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const subtotal = order.items.reduce(
                    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
                    0,
                  );

                  const totalAmount =
                    subtotal -
                    Number(order.discount || 0) +
                    Number(order.deliveryFee || 0);

                  return (
                    <tr
                      key={order.id}
                      className="transition hover:bg-gray-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">{order.id}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {order.client?.name || "—"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {order.client?.phone || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-700">
                          {order.items.length} type(s)
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {order.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0,
                          )}{" "}
                          total units
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-gray-400" />
                          {dateFormat(order.orderDate)}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {money(totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            statusStyle[order.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(order)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {NEXT_STATUS[order.status] && (
                            <button
                              type="button"
                              onClick={() => {
                                setStatusTarget(order);
                                setNextStatus(NEXT_STATUS[order.status] || "");
                              }}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                              Update
                            </button>
                          )}

                          {!["DELIVERED", "CANCELLED"].includes(
                            order.status,
                          ) && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(order)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                            >
                              <Ban size={13} />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <strong className="text-gray-900">
              {total === 0 ? 0 : (page - 1) * limit + 1}
            </strong>{" "}
            -{" "}
            <strong className="text-gray-900">
              {Math.min(page * limit, total)}
            </strong>{" "}
            of <strong className="text-gray-900">{total}</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:opacity-40"
            >
              <ArrowLeft size={15} />
              Prev
            </button>

            {pages.map((item, index) =>
              item === "..." ? (
                <span
                  key={`dots-${index}`}
                  className="flex h-9 w-9 items-center justify-center text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  type="button"
                  key={item}
                  disabled={loading}
                  onClick={() => setPage(item)}
                  className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${
                    page === item
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:opacity-40"
            >
              Next
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {renderDialogs()}
    </div>
  );
}
