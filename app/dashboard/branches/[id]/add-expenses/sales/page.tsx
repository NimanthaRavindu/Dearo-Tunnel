"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DollarSign, Calendar, User, PlusCircle, TrendingUp, CreditCard, ArrowLeft, Trash2, Loader2, Receipt, Search, XCircle, ExternalLink } from "lucide-react";
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
      const res = await fetch(`/api/expences/sales?branch_id=${branchId}`);
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
      (item.branch_name &&
        item.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));

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
      
      const isUpdating = selectedId !== null;
      const endpoint = "/api/expences/sales";
      const method = isUpdating ? "PUT" : "POST";
      
      const payload = isUpdating
        ? { ...formData, id: selectedId, branch_id: branchId }
        : { ...formData, branch_id: branchId };

      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (isUpdating) {
          setExpenses((prev) =>
            prev.map((item) =>
              item.id === selectedId
                ? {
                    ...item,
                    personName: formData.personName,
                    amount: Number(formData.amount),
                    date: formData.date,
                  }
                : item
            )
          );
          clearSelection();
          await fetchExpenses();
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
      const res = await fetch(`/api/expences/sales?id=${id}`, {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/branches/${branchId}/add-expenses`}
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-800 shadow-sm"
              title="Back to Expenses Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
                <h1 className="text-base md:text-lg font-semibold tracking-tight text-white">
                  Sales Expenses Management
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Log and monitor operational, distribution, and promotional costs for Branch #{branchId}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-1.5 flex items-center gap-3 shadow-sm min-w-[200px] justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[9px] font-medium tracking-wider uppercase text-slate-400">
                    {selectedRecord ? `Selected: ${selectedRecord.personName}` : "Total Branch Expenses"}
                  </p>
                  <p className="text-xs md:text-sm font-bold font-mono text-emerald-400">
                    LKR{" "}
                    {displayAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {selectedId && (
                <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                  <button
                    onClick={() => router.push(`/dashboard/total-expenses?selected_sales_id=${selectedId}`)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-md transition-colors"
                    title="View Filtered Record in Total Expenses"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearSelection}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                    title="Clear selection"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Form Card */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800/90 rounded-xl p-4 h-fit shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
              <h2 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                {selectedId ? "Selected Person Details" : "New Expense Entry"}
              </h2>
              <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Branch #{branchId}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Payee / Person Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kamal Perera"
                    value={formData.personName}
                    onChange={(e) =>
                      setFormData({ ...formData, personName: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Amount (LKR) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
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
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 font-mono transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition duration-150 ease-in-out shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      {selectedId ? "Update Record" : "Save Record"}
                    </>
                  )}
                </button>
                {selectedId && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-1.5 px-3 rounded-lg text-xs transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Container */}
          <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800/90 rounded-xl p-4 shadow-lg backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-slate-800/80 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  <h2 className="text-xs font-semibold text-slate-200">
                    Branch Expense Logs
                  </h2>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/50">
                    {filteredExpenses.length} Records
                  </span>
                </div>

                <div className="relative min-w-[180px]">
                  <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search payee or branch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 uppercase tracking-wider text-[9px] font-mono">
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Branch</th>
                      <th className="py-2 px-2.5">Payee / Entity</th>
                      <th className="py-2 px-2.5 text-right">Amount (LKR)</th>
                      <th className="py-2 px-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-emerald-400" />
                          Fetching record entries...
                        </td>
                      </tr>
                    ) : filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">
                          <Receipt className="w-6 h-6 mx-auto mb-1 opacity-30" />
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
                          <td className="py-2 px-2.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {item.date ? new Date(item.date).toISOString().split("T")[0] : "N/A"}
                          </td>
                          <td className="py-2 px-2.5 text-emerald-400/90 whitespace-nowrap font-medium text-[11px]">
                            {item.branch_name || `Branch #${item.branch_id}`}
                          </td>
                          <td className="py-2 px-2.5 font-medium text-slate-200 whitespace-nowrap text-[11px]">
                            {item.personName}
                          </td>
                          <td className="py-2 px-2.5 text-right font-medium font-mono text-emerald-400 whitespace-nowrap text-[11px]">
                            {Number(item.amount || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
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