"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import { ArrowLeft, Calendar, Building, Wallet, CreditCard, FileText,Layers,CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AddOperationalExpensePage({ params }: PageProps) {
  const router = useRouter();

  const unwrappedParams = use(params);
  const branchIdFromUrl = unwrappedParams?.id;

  // Infrastructure States
  const [branchName, setBranchName] = useState<string>("LOADING BRANCH CONTEXT...");
  const [loadingContext, setLoadingContext] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Consolidated Form State
  const [form, setForm] = useState({
    branchId: "",
    expenseType: "Food", // Default Classification
    expenseDate: new Date().toISOString().split("T")[0],
    totalPayable: "",
    totalPaid: "",
    balance: "0.00",
  });

  useEffect(() => {
    if (branchIdFromUrl && branchIdFromUrl !== "[id]") {
      setForm((prev) => ({ ...prev, branchId: branchIdFromUrl }));
    }
  }, [branchIdFromUrl]);

  useEffect(() => {
    if (!branchIdFromUrl || branchIdFromUrl === "[id]") return;

    const fetchBranchContext = async () => {
      setLoadingContext(true);
      try {
        const res = await fetch(`/api/branch`);
        if (res.ok) {
          const branches = await res.json();
          if (Array.isArray(branches)) {
            const currentBranch = branches.find(
              (b: any) => b.id.toString() === branchIdFromUrl.toString()
            );
            if (currentBranch) {
              setBranchName(currentBranch.branchName || currentBranch.bName || "Operational Node");
            } else {
              setBranchName(`BRANCH ID: ${branchIdFromUrl}`);
            }
          }
        }
      } catch (err) {
        console.error("Context synchronization fault:", err);
        setBranchName("OPERATIONAL NODE");
      } finally {
        setLoadingContext(false);
      }
    };

    fetchBranchContext();
  }, [branchIdFromUrl]);

  // Real-time Balance Calculation Matrix
  useEffect(() => {
    const payable = parseFloat(form.totalPayable) || 0;
    const paid = parseFloat(form.totalPaid) || 0;
    const calcBalance = payable - paid;
    
    setForm((prev) => ({
      ...prev,
      balance: calcBalance >= 0 ? calcBalance.toFixed(2) : "0.00",
    }));
  }, [form.totalPayable, form.totalPaid]);

  // Data Submission Engine
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branchId || form.branchId === "[id]") {
      setStatusMessage({ type: "error", text: "CRITICAL: Cannot commit ledger without a valid Branch Context." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/expences/other`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: Number(form.branchId),
          expenseType: form.expenseType,
          expenseDate: form.expenseDate,
          totalPayable: parseFloat(form.totalPayable),
          totalPaid: parseFloat(form.totalPaid),
          balance: parseFloat(form.balance),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ledger ingestion fault.");

      setStatusMessage({ type: "success", text: "LEDGER INTEGRATION SUCCESS: Operational expense successfully committed." });

      setForm((prev) => ({
        ...prev,
        totalPayable: "",
        totalPaid: "",
        balance: "0.00",
      }));
    } catch (err: any) {
      setStatusMessage({ type: "error", text: `EXECUTION FAULT: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 p-4 md:p-6 lg:p-8 font-sans antialiased">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Header Navigation */}
        <div className="mb-6 flex items-center gap-4 border-b border-slate-900 pb-5">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${branchIdFromUrl}/add-expenses`)}
            className="group flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800/80 hover:bg-slate-850 hover:text-white transition-all"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-400">
                <Layers size={16} />
              </div>
              <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase font-mono">
                Add Operational Expense
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium tracking-wide">
              Log utility matrix statements, food, and environmental payments
            </p>
          </div>
        </div>

        {/* Transaction Alerts */}
        {statusMessage && (
          <div className={`mb-6 p-3.5 rounded-xl border font-mono text-[11px] flex items-start gap-2.5 shadow-md ${
            statusMessage.type === "success" ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400" : "bg-red-950/20 border-red-900/40 text-red-400"
          }`}>
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            <div>{statusMessage.text}</div>
          </div>
        )}

        {/* Main Operational Entry Interface */}
        <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 md:p-6 space-y-5 backdrop-blur-sm">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Designated Branch Field (Read-only/Disabled for consistency) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Building size={11} className="text-slate-500" /> Designated Branch Node
              </label>
              <div className="w-full px-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-purple-400 font-semibold uppercase tracking-wider shadow-inner min-h-[38px] flex items-center select-none">
                {loadingContext ? "SYNCING CONTEXT..." : branchName.toUpperCase()}
              </div>
            </div>

            {/* Expense Allocation Date Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Calendar size={11} className="text-slate-500" /> Expense Allocation Date
              </label>
              <input
                required
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 transition-all font-mono"
              />
            </div>

          </div>

          {/* Expense Classification Reason Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <FileText size={11} className="text-slate-500" /> Expense Classification Reason
            </label>
            <select
              required
              value={form.expenseType}
              onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 transition-all font-medium tracking-wide"
            >
              <option value="Food">Food</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
              <option value="Other Payments">Other Payments</option>
            </select>
          </div>

          {/* Financial Dimensions Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Wallet size={11} className="text-slate-500" /> Total Payable Amount (LKR)
              </label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.totalPayable}
                onChange={(e) => setForm({ ...form, totalPayable: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 transition-all font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <CreditCard size={11} className="text-slate-500" /> Total Paid Amount (LKR)
              </label>
              <input
                
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.totalPaid}
                onChange={(e) => setForm({ ...form, totalPaid: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-900 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 transition-all font-mono"
              />
            </div>
          </div>

          {/* Balance Evaluation Frame */}
          <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center justify-between shadow-inner">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Auto-Calculated Balance
            </span>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mr-1.5">LKR</span>
              <span className={`text-sm font-bold font-mono ${parseFloat(form.balance) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {form.balance}
              </span>
            </div>
          </div>

          {/* Ingestion Trigger Button */}
          <button
            type="submit"
            disabled={isSubmitting || loadingContext || !form.branchId || form.branchId === "[id]"}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "COMMIT IN PROGRESS..." : "COMMIT EXPENSE RECORD"}
          </button>

        </form>
      </div>
    </div>
  );
}