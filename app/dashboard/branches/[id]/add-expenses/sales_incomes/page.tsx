"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2, TrendingUp, Building2 } from "lucide-react";

interface SalesIncomeItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  created_at?: string;
}

function BranchSalesIncomesContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const branchId = params.id as string;
  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [incomes, setIncomes] = useState<SalesIncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchBranchSalesIncomes();
  }, [branchId]);

  const fetchBranchSalesIncomes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/branches/${branchId}/sales-incomes`);
      const result = await res.json();
      
      if (result.success) {
        setIncomes(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch branch sales incomes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/branches/${branchId}/sales-incomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount),
          date,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setName("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        fetchBranchSalesIncomes();
      }
    } catch (error) {
      console.error("Failed to add sales income entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!confirm("Are you sure you want to delete this sales income record?")) return;

    try {
      const res = await fetch(`/api/branches/${branchId}/sales-incomes?id=${incomeId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        fetchBranchSalesIncomes();
      }
    } catch (error) {
      console.error("Failed to delete sales income entry:", error);
    }
  };

  const handleBack = () => {
    const qParams = new URLSearchParams();
    if (selectedSalesId) qParams.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) qParams.append("selected_capital_id", selectedCapitalId);
    const query = qParams.toString();
    router.push(`/dashboard/branches/${branchId}/add-expenses${query ? `?${query}` : ""}`);
  };

  const totalAmount = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-6 sm:p-10 flex flex-col items-center relative overflow-hidden font-mono text-xs">
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[250px] bg-rose-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl space-y-6 relative z-10">
        
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="p-3 bg-slate-900/95 hover:bg-slate-800 rounded-xl transition-all duration-200 border border-slate-800 text-slate-400 hover:text-white shadow-lg group"
              title="Return to Branch Expenses Hub"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-100">
                  Branch #{branchId} Sales Incomes
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Record and manage direct sales revenue entries for this operational unit
              </p>
            </div>
          </div>
        </div>

        {/* Total Summary Banner */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/60 border border-slate-800 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Branch Revenue</span>
              <div className="text-2xl font-black text-slate-100 mt-0.5">
                LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-semibold">{incomes.length} Entries Recorded</span>
          </div>
        </div>

        {/* Add Income Form Card */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-2">
            <Plus size={15} className="text-red-400" /> Add New Sales Income Entry
          </h2>
          <form onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Daily Collection"
                required
                className="w-full bg-[#090e1a] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500/50 transition-colors text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Amount (LKR)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[#090e1a] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500/50 transition-colors text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#090e1a] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500/50 transition-colors text-xs"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                <span>Save Entry</span>
              </button>
            </div>
          </form>
        </div>

        {/* Income Entries Table */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-2">
            <Building2 size={15} className="text-red-400" /> Recorded Sales Income Entries
          </h2>

          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 size={26} className="text-red-500 animate-spin" />
              <p className="text-[11px] text-slate-400">Loading branch financial records...</p>
            </div>
          ) : incomes.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              No sales income records found for this branch.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount (LKR)</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {incomes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-400">#{item.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{item.name}</td>
                      <td className="py-3 px-4 text-slate-300">{item.date}</td>
                      <td className="py-3 px-4 text-right font-black text-red-400">
                        {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteIncome(item.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 size={13} />
                        </button>
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
  );
}

function FallbackLoader() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
      <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
      <p className="uppercase tracking-widest text-[10px]">Initializing Branch Ledger...</p>
    </div>
  );
}

export default function BranchSalesIncomesPage() {
  return (
    <Suspense fallback={<FallbackLoader />}>
      <BranchSalesIncomesContent />
    </Suspense>
  );
}