"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Calendar, User, DollarSign, PlusCircle, Trash2, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

interface SalesIncomeItem {
  id: string;
  name: string;
  date: string;
  amount: number;
}

export default function SalesIncomesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  // Form States
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");

  // Data & Loading States
  const [incomes, setIncomes] = useState<SalesIncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // 1. Fetch Sales Incomes from Database on Load
  useEffect(() => {
    fetchIncomes();
  }, [id]);

  const fetchIncomes = async () => {
    try {
      const res = await fetch(`/api/branches/${id}/sales-incomes`);
      const result = await res.json();
      if (result.success) {
        setIncomes(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch sales incomes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Form Submit (Save to Database via API)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !amount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/branches/${id}/sales-incomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, amount: parseFloat(amount) }),
      });

      const result = await res.json();
      if (result.success) {
        // Refresh list or append new item
        fetchIncomes();
        setName("");
        setDate("");
        setAmount("");
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        alert(result.error || "Failed to save record");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete item handler
  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`/api/branches/${id}/sales-incomes?itemId=${itemId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        setIncomes(incomes.filter((item) => item.id !== itemId));
      } else {
        alert("Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  // Calculate Total Sales Income
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 p-6 flex flex-col items-center relative overflow-hidden">
      {/* Background Ambient Red/Rose Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-4xl space-y-6 relative z-10">
        
        {/* Header Console */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/branches/${id}/add-expenses`)}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 rounded-xl transition-all border border-slate-800/80 text-slate-400 hover:text-white shadow-sm hover:scale-105 active:scale-95"
              title="Back to Hub"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <h1 className="text-xl font-extrabold tracking-wide uppercase text-slate-100">
                  Sales Income Management
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Record daily incoming revenues, customer payments, and cash collections
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-400">
            <Sparkles size={13} className="text-red-400" />
            <span>Branch ID: <strong className="text-slate-200">#{id}</strong></span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-fadeIn">
            <CheckCircle2 size={18} />
            <span>Sales income record successfully logged into the database and ledger table!</span>
          </div>
        )}

        {/* Main Grid Layout: Form & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Input Form Card */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-slate-800/80 shadow-xl space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                <TrendingUp size={18} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                New Entry Form
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Record Name / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <User size={13} className="text-red-400" /> Source / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Cash Sale / Client X"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all"
                />
              </div>

              {/* Date Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Calendar size={13} className="text-red-400" /> Transaction Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all"
                />
              </div>

              {/* Amount Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <DollarSign size={13} className="text-red-400" /> Amount (LKR / USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                {isSubmitting ? "Saving..." : "Submit Record"}
              </button>
            </form>
          </div>

          {/* Submitted Records Table & Summary View */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-slate-800/80 shadow-xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Recorded Sales Incomes Ledger
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-red-400">
                  Total Entries: {incomes.length}
                </span>
              </div>

              {isLoading ? (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                  <Loader2 size={28} className="text-red-500 animate-spin" />
                  <p className="text-xs text-slate-400">Loading records from database...</p>
                </div>
              ) : incomes.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="p-4 rounded-full bg-slate-900/80 border border-slate-800 text-slate-600">
                    <TrendingUp size={28} />
                  </div>
                  <p className="text-xs text-slate-400">No sales income records found. Fill out the form to add entries.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-3 px-3">Name / Source</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3 text-right">Amount</th>
                        <th className="py-3 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {incomes.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3.5 px-3 font-medium text-slate-200">{item.name}</td>
                          <td className="py-3.5 px-3 text-slate-400">{item.date}</td>
                          <td className="py-3.5 px-3 text-right font-bold text-red-400">
                            {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all border border-slate-800"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Total Summary Footer */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/40 px-4 py-3 rounded-xl border border-slate-800/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Cumulative Income:
              </span>
              <span className="text-sm font-extrabold text-red-400">
                LKR {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}