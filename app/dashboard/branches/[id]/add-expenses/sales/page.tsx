"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DollarSign, Calendar, User, PlusCircle, TrendingUp, CreditCard, ArrowLeft, Trash2, Loader2, Receipt, Search, XCircle, ExternalLink, Edit3, Filter } from "lucide-react";
import Link from "next/link";

interface SalesExpense {
  id: number;
  branch_id: number;
  branch_name?: string;
  personName: string;
  amount: number;
  date: string;
}

export default function SalesExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchId = params?.id;

  const [expenses, setExpenses] = useState<SalesExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    personName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/expenses/sales?branch_id=${branchId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setExpenses(list);

        const urlSalesId = searchParams.get("selected_sales_id");
        if (urlSalesId) {
          const numId = Number(urlSalesId);
          const found = list.find((item: SalesExpense) => item.id === numId);
          if (found) {
            setSelectedId(found.id);
            setFormData({
              personName: found.personName,
              amount: String(found.amount),
              date: found.date ? found.date.split("T")[0] : new Date().toISOString().split("T")[0],
            });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId, searchParams]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const filteredExpenses = expenses.filter((item) => {
    const isCurrentBranch = String(item.branch_id) === String(branchId);
    const matchesSearch =
      item.personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.branch_name && item.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return isCurrentBranch && matchesSearch;
  });

  const selectedRecord = expenses.find((item) => item.id === selectedId);

  const displayAmount = selectedRecord
    ? Number(selectedRecord.amount || 0)
    : filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName || !formData.amount || !branchId) return;

    try {
      setSubmitting(true);
      const endpoint = "/api/expenses/sales";
      const method = selectedId ? "PUT" : "POST";
      const payload = selectedId
        ? { id: selectedId, branch_id: branchId, ...formData }
        : { ...formData, branch_id: branchId };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (selectedId) {
          setExpenses((prev) =>
            prev.map((item) =>
              item.id === selectedId
                ? { ...item, personName: formData.personName, amount: Number(formData.amount), date: formData.date }
                : item
            )
          );
          clearSelection();
        } else {
          const newRecord = await res.json();
          clearSelection();
          if (newRecord && newRecord.id) {
            setExpenses((prev) => [newRecord, ...prev]);
          } else {
            await fetchExpenses();
          }
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save expense record");
      }
    } catch (err) {
      console.error("Error submitting data:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this expense entry?")) return;

    try {
      const res = await fetch(`/api/expenses/sales?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setExpenses((prev) => prev.filter((item) => item.id !== id));
        if (selectedId === id) {
          clearSelection();
        }
      } else {
        alert("Failed to delete expense entry");
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const handleSelectRow = (item: SalesExpense) => {
    if (selectedId === item.id) {
      clearSelection();
    } else {
      setSelectedId(item.id);
      setFormData({
        personName: item.personName,
        amount: String(item.amount),
        date: item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0],
      });

      window.history.replaceState(null, "", `?selected_sales_id=${item.id}`);
    }
  };

  // 🔹 Redirects to Remaining Balance page with selected sales ID filter
  const handleViewBreakdown = (salesId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/remaining-balance?selected_sales_id=${salesId}`);
  };

  const clearSelection = () => {
    setSelectedId(null);
    setFormData({
      personName: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("selected_sales_id");
    window.history.replaceState(null, "", url.pathname);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80 gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href={`/dashboard/branches/${branchId}/add-expenses`}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-800 shadow-sm"
              title="Back to Expenses Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white">
                  Sales Expenses Management
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Log and monitor operational, distribution, and promotional costs for Branch #{branchId}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm min-w-[220px] justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
                    {selectedRecord ? `Selected: ${selectedRecord.personName}` : "Total Branch Expenses"}
                  </p>
                  <p className="text-sm md:text-base font-bold font-mono text-emerald-400">
                    LKR{" "}
                    {displayAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {selectedId && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/dashboard/remaining-balance?selected_sales_id=${selectedId}`)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg transition-colors"
                    title="View Filtered Record in Remaining Balance"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearSelection}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Clear selection"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 h-fit shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                {selectedId ? <Edit3 className="w-4 h-4 text-emerald-400" /> : <PlusCircle className="w-4 h-4 text-emerald-400" />}
                {selectedId ? "Selected Person Details" : "New Expense Entry"}
              </h2>
              {selectedId ? (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-[10px] uppercase font-mono tracking-wider text-rose-400 hover:underline"
                >
                  Cancel Edit
                </button>
              ) : (
                <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  Branch #{branchId}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Payee / Person Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kamal Perera"
                    value={formData.personName}
                    onChange={(e) =>
                      setFormData({ ...formData, personName: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Amount (LKR) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 font-mono transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-xl text-xs transition duration-150 ease-in-out shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedId ? (
                  <>Update Record</>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Save Record
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Table Section */}
          <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-slate-200">
                    Branch Expense Logs
                  </h2>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/50">
                    {filteredExpenses.length} Records
                  </span>
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search payee or branch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 uppercase tracking-wider text-[10px] font-mono">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3">Payee / Entity</th>
                      <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                          Fetching record entries...
                        </td>
                      </tr>
                    ) : filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500">
                          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No sales expenses found for Branch #{branchId}.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectRow(item)}
                          className={`cursor-pointer transition-colors ${
                            selectedId === item.id
                              ? "bg-emerald-950/50 border-l-2 border-emerald-500"
                              : "hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap font-mono">
                            {item.date ? new Date(item.date).toISOString().split("T")[0] : "N/A"}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400/90 whitespace-nowrap font-medium">
                            {item.branch_name || `Branch #${item.branch_id}`}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-200 whitespace-nowrap">
                            {item.personName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium font-mono text-emerald-400 whitespace-nowrap">
                            {Number(item.amount || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 🔹 Filter Button added to each row to filter directly in Remaining Balance page */}
                              <button
                                onClick={(e) => handleViewBreakdown(item.id, e)}
                                className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 hover:text-emerald-300 border border-emerald-800/60 rounded-lg transition-all flex items-center gap-1 text-[10px] font-mono"
                                title="Filter Breakdown in Remaining Balance"
                              >
                                <Filter size={12} />
                                <span className="hidden sm:inline">Filter</span>
                              </button>

                              <button
                                onClick={(e) => handleDelete(item.id, e)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}