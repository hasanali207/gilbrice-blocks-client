"use client";

import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import api from "@/lib/axios";
import { useCurrentToken } from "@/Redux/Features/Auth/authSlice";
import toast from "react-hot-toast";

interface SalesRep {
  id: string;
  name: string;
}

interface Client {
  id: string;
  clientNumber: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  city: string;
  neighbourhood?: string | null;
  deliveryAddress: string;
  notes?: string | null;
  salesRepId?: string | null;
  salesRep?: SalesRep | null;
  createdAt: string;
}

interface ClientFormData {
  name: string;
  phone: string;
  whatsapp: string;
  city: string;
  neighbourhood: string;
  deliveryAddress: string;
  notes: string;
  salesRepId: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

const emptyForm: ClientFormData = {
  name: "",
  phone: "",
  whatsapp: "",
  city: "",
  neighbourhood: "",
  deliveryAddress: "",
  notes: "",
  salesRepId: "",
};

// Pagination numbers: 1 ... 4 5 6 ... 10
function getPagination(page: number, totalPages: number) {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return pages;
  }

  pages.push(1);

  if (page > 3) pages.push("...");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (page < totalPages - 2) pages.push("...");

  pages.push(totalPages);

  return pages;
}

export default function AllClients() {
  const token = useSelector(useCurrentToken);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // LIST / CREATE / EDIT
  const [view, setView] = useState<"list" | "create" | "edit">("list");

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // SERVER-SIDE PAGINATION
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // SEARCH & FILTER
  const [searchTerm, setSearchTerm] = useState("");
  const [city, setCity] = useState("");

  // FORM
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Client | null>(
    null,
  );

  // =====================================================
  // FETCH CLIENTS
  // =====================================================

  const fetchClients = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));

      if (searchTerm.trim()) {
        params.set("searchTerm", searchTerm.trim());
      }

      if (city.trim()) {
        params.set("city", city.trim());
      }

      const res = await api.get(`api/v1/clients?${params.toString()}`);

      const data: Client[] = res.data?.data || [];
      const meta: PaginationMeta | undefined = res.data?.meta;

      const serverTotal = Number(meta?.total) || 0;
      const pages = Math.max(1, Math.ceil(serverTotal / limit));

      setClients(data);
      setTotal(serverTotal);
      setTotalPages(pages);

      // Current page invalid হলে last valid page-এ যাও
      if (page > pages) {
        setPage(pages);
      }
    } catch (error: any) {
      console.error("Fetch clients error:", error);

      toast.error(
        error?.response?.data?.message || "Clients could not be loaded",
      );
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, searchTerm, city]);

  useEffect(() => {
    if (view === "list") {
      fetchClients();
    }
  }, [fetchClients, view]);

  // =====================================================
  // OPEN CREATE FORM
  // =====================================================

  const openCreateForm = () => {
    setSelectedClient(null);
    setForm(emptyForm);
    setView("create");
  };

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  const openEditForm = (client: Client) => {
    setSelectedClient(client);

    setForm({
      name: client.name || "",
      phone: client.phone || "",
      whatsapp: client.whatsapp || "",
      city: client.city || "",
      neighbourhood: client.neighbourhood || "",
      deliveryAddress: client.deliveryAddress || "",
      notes: client.notes || "",
      salesRepId: client.salesRepId || "",
    });

    setView("edit");
  };

  // =====================================================
  // FORM INPUT HANDLER
  // =====================================================

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CREATE / UPDATE CLIENT
  // =====================================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please login first");
      return;
    }

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.city.trim() ||
      !form.deliveryAddress.trim()
    ) {
      toast.error("Name, phone, city and delivery address are required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || null,
        city: form.city.trim(),
        neighbourhood: form.neighbourhood.trim() || null,
        deliveryAddress: form.deliveryAddress.trim(),
        notes: form.notes.trim() || null,
        ...(form.salesRepId.trim()
          ? { salesRepId: form.salesRepId.trim() }
          : {}),
      };

      if (view === "edit" && selectedClient) {
        await api.patch(`/api/v1/clients/${selectedClient.id}`, payload);

        toast.success("Client updated successfully");
      } else {
        await api.post(`/api/v1/clients`, payload);

        toast.success("Client created successfully");
      }

      // Reset form and return to list
      setForm(emptyForm);
      setSelectedClient(null);
      setView("list");

      // Newly created client will appear on page 1
      setPage(1);
      setSearchTerm("");
      setCity("");
    } catch (error: any) {
      console.error("Save client error:", error);

      toast.error(error?.response?.data?.message || "Could not save client");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE CLIENT
  // Requires DELETE endpoint in backend
  // =====================================================

  const handleDelete = async (client: Client) => {
    if (!token) {
      toast.error("Please login first");
      return;
    }

    setDeletingId(client.id);

    try {
      await api.delete(`/api/v1/clients/${client.id}`);

      toast.success("Client deleted successfully");
      setShowDeleteConfirm(null);

      // Reload after deletion
      if (clients.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchClients();
      }
    } catch (error: any) {
      console.error("Delete client error:", error);

      toast.error(error?.response?.data?.message || "Could not delete client");
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // PAGINATION
  // =====================================================

  const pages = getPagination(page, totalPages);

  // =====================================================
  // SHARED INPUT CLASS
  // =====================================================

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  // =====================================================
  // CREATE / EDIT VIEW
  // =====================================================

  if (view === "create" || view === "edit") {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => {
                setView("list");
                setSelectedClient(null);
              }}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Back to All Clients
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {view === "edit" ? "Edit Client" : "Create Client"}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {view === "edit"
                ? "Update the client information below."
                : "Add a new client to your customer database."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setView("list");
              setSelectedClient(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Users size={17} />
            All Clients
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-7">
            <h2 className="font-semibold text-gray-900">Client Information</h2>
            <p className="mt-1 text-xs text-gray-500">
              Fields marked * are required.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Client Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Enter client name"
                className={inputClass}
                required
                maxLength={150}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                WhatsApp Number
              </label>
              <input
                name="whatsapp"
                type="tel"
                value={form.whatsapp}
                onChange={handleInputChange}
                placeholder="Enter WhatsApp number"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                City *
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleInputChange}
                placeholder="Enter city"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Neighbourhood
              </label>
              <input
                name="neighbourhood"
                value={form.neighbourhood}
                onChange={handleInputChange}
                placeholder="Area / neighbourhood"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sales Representative ID
              </label>
              <input
                name="salesRepId"
                value={form.salesRepId}
                onChange={handleInputChange}
                placeholder="Optional sales rep ID"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                Optional. Permission to assign depends on your role.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Delivery Address *
              </label>
              <textarea
                name="deliveryAddress"
                value={form.deliveryAddress}
                onChange={handleInputChange}
                placeholder="Enter complete delivery address"
                className={`${inputClass} min-h-28 resize-y`}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                placeholder="Additional notes (optional)"
                className={`${inputClass} min-h-24 resize-y`}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={() => {
                setView("list");
                setSelectedClient(null);
              }}
              disabled={saving}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Plus size={17} />
              )}

              {saving
                ? "Saving..."
                : view === "edit"
                  ? "Update Client"
                  : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =====================================================
  // ALL CLIENTS VIEW
  // =====================================================

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Users size={14} />
            CLIENT MANAGEMENT
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            All Clients
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage client information, addresses and contacts.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Client
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Clients</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users size={22} />
            </div>
          </div>
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
          <p className="text-sm text-gray-500">Showing Records</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {clients.length}
            <span className="ml-2 text-base font-medium text-gray-400">
              / {limit}
            </span>
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTER */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
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
              placeholder="Search name, phone, client number..."
              className={`${inputClass} pl-10`}
            />
          </div>

          <div className="relative">
            <MapPin
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by city"
              className={`${inputClass} pl-10`}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setCity("");
              setPage(1);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Client Directory</h2>
            <p className="mt-1 text-xs text-gray-500">
              {total} client(s) found
            </p>
          </div>

          <button
            type="button"
            onClick={fetchClients}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Client</th>
                <th className="px-5 py-4 font-semibold">Contact</th>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Sales Rep</th>
                <th className="px-5 py-4 font-semibold">Created</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Loader2
                      className="mx-auto animate-spin text-blue-600"
                      size={28}
                    />
                    <p className="mt-3 text-sm text-gray-500">
                      Loading clients...
                    </p>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Users size={34} className="mx-auto text-gray-300" />
                    <p className="mt-3 font-semibold text-gray-700">
                      No clients found
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Create a client or change your search filters.
                    </p>

                    <button
                      type="button"
                      onClick={openCreateForm}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Create First Client
                    </button>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="transition hover:bg-gray-50/80"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                          {client.name?.charAt(0)?.toUpperCase() || "C"}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {client.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {client.clientNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone size={14} className="text-gray-400" />
                        {client.phone}
                      </div>
                      {client.whatsapp && (
                        <p className="mt-1 pl-5 text-xs text-gray-400">
                          WhatsApp: {client.whatsapp}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-700">{client.city}</p>
                      {client.neighbourhood && (
                        <p className="mt-1 text-xs text-gray-400">
                          {client.neighbourhood}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {client.salesRep?.name || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {client.createdAt
                        ? new Date(client.createdAt).toLocaleDateString("en-GB")
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Edit client"
                          onClick={() => openEditForm(client)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          title="Delete client"
                          onClick={() => setShowDeleteConfirm(client)}
                          disabled={deletingId === client.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === client.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {total === 0 ? 0 : (page - 1) * limit + 1}
            </span>
            {" - "}
            <span className="font-semibold text-gray-900">
              {Math.min(page * limit, total)}
            </span>
            {" of "}
            <span className="font-semibold text-gray-900">{total}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  onClick={() => setPage(item)}
                  disabled={loading}
                  className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                    page === item
                      ? "bg-blue-600 text-white shadow-sm"
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
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={23} />
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Delete Client?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {showDeleteConfirm.name}
              </span>
              ? This action may fail if the client has related orders or other
              records.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingId !== null}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deletingId !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deletingId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
