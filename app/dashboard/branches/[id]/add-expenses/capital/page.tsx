"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Plus, User, Calendar, Coins, Trash2, FileText, Search, Receipt, Loader2, Filter } from "lucide-react";

interface CapitalExpense {
  id: number | string;
  branchId: number;
  personName: string;
  date: string;
  amount: number;
  description: string;
}

export default function CapitalExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  // Form States
  const [personName, setPersonName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // App Logic States
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState<CapitalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  useEffect(() => {
    async function fetchExpenses() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/expences/capital?branchId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setExpenses(data);
        } else {
          console.error("Failed to fetch expenses:", await res.text());
        }
      } catch (err) {
        console.error("Failed to load records", err);
      }
      finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, [id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !date || !amount || !id) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/expences/capital`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: Number(id),
          personName,
          date,
          amount,
          description,
        }),
      });

      if (res.ok) {
        const savedExpense = await res.json();
        setExpenses([savedExpense, ...expenses]);
        setPersonName("");
        setAmount("");
        setDescription("");
      } else {
        const errorData = await res.json();
        alert(`Failed to save transaction: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number | string) => {
    if (!confirm("Are you sure you want to delete this capital record?")) return;

    try {
      setDeletingId(expenseId);
      const res = await fetch(`/api/expences/capital?id=${expenseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setExpenses(expenses.filter((e) => e.id !== expenseId));
      } else {
        alert("Failed to delete record");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewBreakdown = (capitalId: number | string) => {
    router.push(`/dashboard/total-expenses?selected_capital_id=${capitalId}`);
    router.push(`/dashboard/remaining-balance?selected_capital_id=${capitalId}`);
  };

  const totalCapitalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  const filteredExpenses = expenses.filter(
    (item) =>
      item.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 p-6 md:p-8 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header Console */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/branches/${id}/add-expenses`)}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800 shadow-sm active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-xl font-extrabold tracking-wider uppercase text-slate-100 flex items-center gap-2 font-mono">
                  <Building2 className="text-emerald-400" size={20} /> Capital Expenses Ledger
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Record fixed assets, infrastructure investments, and machinery details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 border border-emerald-500/30 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-md">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Receipt size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block font-mono">
                Total Capital Spent
              </span>
              <span className="text-xl font-black text-slate-100 font-mono">
                LKR {totalCapitalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Form + Table Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Side */}
          <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 pb-4 border-b border-slate-800/80 mb-5 flex items-center gap-2 font-mono">
              <Plus size={16} className="text-emerald-400" /> New Capital Entry
            </h2>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                  Authorized Person Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nimantha Perera"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                  Date
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                  Amount (LKR)
                </label>
                <div className="relative">
                  <Coins size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60 transition-all font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                  Description
                </label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3.5 top-3 text-slate-500" />
                  <textarea
                    rows={3}
                    placeholder="Asset details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/60 transition-all resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 font-mono"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : "Save Capital Record"}
              </button>
            </form>
          </div>

          {/* Table Side */}
          <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Recorded Transactions ({filteredExpenses.length})
              </h2>
              <div className="relative w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg py-1.5 pl-8 pr-2.5 text-[11px] text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500 flex items-center justify-center gap-2 text-xs font-mono">
                <Loader2 className="animate-spin text-emerald-400" size={18} /> Loading ledger database...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs font-bold uppercase tracking-wider font-mono">
                No Capital Expenses Logged
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/40 font-mono">
                      <th className="p-3">Person / Asset</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Amount (LKR)</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {filteredExpenses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-200">{item.personName}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] font-mono">
                          {String(item.date).split("T")[0]}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-400 text-xs font-mono">
                          {Number(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewBreakdown(item.id)}
                              className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 hover:text-emerald-300 border border-emerald-800/60 rounded-lg transition-all flex items-center gap-1 text-[10px] font-mono"
                              title="Filter Breakdown in Total Expenses"
                            >
                              <Filter size={12} />
                              <span className="hidden sm:inline">Filter</span>
                            </button>

                            <button
                              onClick={() => handleDeleteExpense(item.id)}
                              disabled={deletingId === item.id}
                              className="p-1.5 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Record"
                            >
                              {deletingId === item.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}