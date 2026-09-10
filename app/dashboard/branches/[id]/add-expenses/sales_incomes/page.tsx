"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Loader2, DollarSign, Calendar, FileText, CheckCircle2 } from "lucide-react";

interface SalesIncomeItem {
  id: string;
  name: string;
  date: string;
  amount: number;
}

function SalesIncomesContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = params?.id as string;

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [incomes, setIncomes] = useState<SalesIncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
  });

  useEffect(() => {
    if (branchId) {
      fetchSalesIncomes();
    }
  }, [branchId]);

  const fetchSalesIncomes = async () => {
    try {
      // Corrected API endpoint with branchId query parameter
      const res = await fetch(`/api/expences/sales-incomes?branch_id=${branchId}`);
      const result = await res.json();
      if (result.success) {
        setIncomes(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch sales incomes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.amount || !branchId) return;

    setIsSubmitting(true);
    try {
      // Corrected API endpoint including branch_id in the payload body
      const res = await fetch(`/api/expences/sales-incomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: branchId,
          name: formData.name,
          date: formData.date,
          amount: Number(formData.amount),
        }),
      });

      const result = await res.json();
      if (result.success) {
        setFormData({ name: "", date: new Date().toISOString().split("T")[0], amount: "" });
        setSuccessMessage("Sales income successfully added to ledger.");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchSalesIncomes();
      }
    } catch (error) {
      console.error("Failed to submit sales income:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const queryParams = new URLSearchParams();
    if (selectedSalesId) queryParams.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) queryParams.append("selected_capital_id", selectedCapitalId);
    const query = queryParams.toString();
    router.push(`/dashboard/total-incomes${query ? `?${query}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-6 sm:p-10 flex flex-col items-center relative overflow-hidden font-mono text-xs">
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />
      
      <div className="w-full max-w-4xl space-y-6 relative z-10">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="p-3 bg-slate-900/90 hover:bg-slate-800/90 rounded-xl transition-all duration-200 border border-slate-800 text-slate-400 hover:text-white shadow-lg"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-100">
                Branch Sales Incomes
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Record and manage direct sales revenue entries for Branch Unit #{branchId}
              </p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-4 py-3 rounded-xl text-emerald-400">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-[#0d1527]/60 border border-slate-800 shadow-2xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-4 flex items-center gap-2">
            <Plus size={14} className="text-red-400" /> Add New Sales Income Entry
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} /> Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter name..."
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} /> Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={12} /> Amount (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Save Income Entry</span>
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">
            Registered Sales Incomes Ledger
          </h2>

          {isLoading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-2">
              <Loader2 size={24} className="text-red-500 animate-spin" />
              <p className="text-slate-400">Loading branch entries...</p>
            </div>
          ) : incomes.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No sales income records found for this branch.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {incomes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-200">{item.name}</td>
                      <td className="py-3 px-4 text-slate-400">{item.date}</td>
                      <td className="py-3 px-4 text-right font-black text-red-400">
                        LKR {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

function SalesIncomesFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
      <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="uppercase tracking-widest text-[10px]">Loading Revenue Ledger...</p>
    </div>
  );
}

export default function SalesIncomesPage() {
  return (
    <Suspense fallback={<SalesIncomesFallback />}>
      <SalesIncomesContent />
    </Suspense>
  );
}