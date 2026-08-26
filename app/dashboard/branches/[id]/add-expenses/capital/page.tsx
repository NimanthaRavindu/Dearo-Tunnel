"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DollarSign, Calendar, Building2, PlusCircle, CreditCard, ArrowLeft, Trash2, Loader2, Receipt, Search, XCircle } from "lucide-react";
import Link from "next/link";

interface CapitalExpense {
  id: number;
  branch_id: number;
  branch_name?: string;
  itemName: string;
  amount: number;
  date: string;
}

export default function CapitalExpensesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = params?.id;

  const [expenses, setExpenses] = useState<CapitalExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    itemName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/expences/capital?branch_id=${branchId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setExpenses(list);

        const urlCapitalId = searchParams.get("selected_capital_id");
        if (urlCapitalId) {
          const numId = Number(urlCapitalId);
          const found = list.find((item: CapitalExpense) => item.id === numId);
          if (found) {
            setSelectedId(found.id);
            setFormData({
              itemName: found.itemName,
              amount: String(found.amount),
              date: found.date ? found.date.split("T")[0] : new Date().toISOString().split("T")[0],
            });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching capital data:", err);
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
      item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.branch_name && item.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return isCurrentBranch && matchesSearch;
  });

  const selectedRecord = expenses.find((item) => item.id === selectedId);

  const displayAmount = selectedRecord
    ? Number(selectedRecord.amount || 0)
    : filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.amount || !branchId) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/expences/capital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, branch_id: branchId }),
      });

      if (res.ok) {
        const newRecord = await res.json();
        clearSelection();
        if (newRecord && newRecord.id) {
          setExpenses((prev) => [newRecord, ...prev]);
        } else {
          await fetchExpenses();
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to record capital expense");
      }
    } catch (err) {
      console.error("Error submitting data:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`/api/expences/capital?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setExpenses((prev) => prev.filter((item) => item.id !== id));
        if (selectedId === id) clearSelection();
      } else {
        alert("Failed to delete entry");
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const handleSelectRow = (item: CapitalExpense) => {
    if (selectedId === item.id) {
      clearSelection();
    } else {
      setSelectedId(item.id);
      setFormData({
        itemName: item.itemName,
        amount: String(item.amount),
        date: item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0],
      });

      const url = new URL(window.location.href);
      url.searchParams.set("selected_capital_id", String(item.id));
      window.history.replaceState(null, "", url.toString());
    }
  };

  const clearSelection = () => {
    setSelectedId(null);
    setFormData({
      itemName: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("selected_capital_id");
    window.history.replaceState(null, "", url.pathname + (url.search ? `?${url.searchParams.toString()}` : ""));
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80 gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/branches/${branchId}/add-expenses`}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-800/80 shadow-sm"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 bg-sky-500/10 text-sky-400 rounded-md border border-sky-500/20">
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                  Capital Expenses Management
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Long-term asset acquisition & structural investments for Branch #{branchId}
              </p>
            </div>
          </div>

          {/* Metric Summary Card */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl px-3.5 py-2 flex items-center justify-between gap-4 shadow-sm min-w-[240px]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-md">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-semibold tracking-wider uppercase text-slate-400">
                  {selectedRecord ? "Selected Asset" : "Total Capital Outlay"}
                </p>
                <p className="text-sm font-bold font-mono text-sky-400">
                  LKR {displayAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {selectedId && (
              <button
                onClick={clearSelection}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                title="Clear selection"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Form Panel (Compact) */}
          <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 h-fit shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3.5">
              <h2 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
                {selectedId ? "Edit Asset Record" : "New Capital Entry"}
              </h2>
              <span className="text-[9px] font-mono tracking-wider bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">
                Branch #{branchId}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Asset / Item Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Server Rack / AC Unit"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Amount (LKR) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500/50 font-mono transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-all shadow-md shadow-sky-950/40 flex items-center justify-center gap-1.5 mt-2"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><PlusCircle className="w-3.5 h-3.5" /> Save Record</>}
              </button>
            </form>
          </div>

          {/* Table Panel */}
          <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-2.5 mb-3.5">
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-sky-400" />
                  <h2 className="text-xs font-semibold text-slate-200">Capital Ledger Records</h2>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/40">
                    {filteredExpenses.length} Entries
                  </span>
                </div>

                <div className="relative min-w-[190px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search asset..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-950/50 uppercase tracking-wider text-[9px] font-mono">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Branch</th>
                      <th className="py-2 px-3">Asset / Item Name</th>
                      <th className="py-2 px-3 text-right">Amount (LKR)</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-sky-400" />
                          Loading records...
                        </td>
                      </tr>
                    ) : filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500">
                          <Receipt className="w-7 h-7 mx-auto mb-1.5 opacity-30" />
                          No capital expenses recorded.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectRow(item)}
                          className={`cursor-pointer transition-colors ${
                            selectedId === item.id
                              ? "bg-sky-950/40 border-l-2 border-sky-500"
                              : "hover:bg-slate-800/30"
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {item.date ? new Date(item.date).toISOString().split("T")[0] : "N/A"}
                          </td>
                          <td className="py-2 px-3 text-sky-400/90 whitespace-nowrap font-medium text-[11px]">
                            {item.branch_name || `Branch #${item.branch_id}`}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-200 whitespace-nowrap">
                            {item.itemName}
                          </td>
                          <td className="py-2 px-3 text-right font-medium font-mono text-sky-400 whitespace-nowrap">
                            {Number(item.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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