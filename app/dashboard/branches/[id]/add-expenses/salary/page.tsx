"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Landmark, Users, Calendar, DollarSign, Wallet, CheckCircle2, AlertCircle } from "lucide-react";

export default function AddSalaryExpensePage() {
  const router = useRouter();
  const params = useParams();
  
  const rawBranchId = params?.id ? decodeURIComponent(params.id as string) : "";

  // UI & Loading States
  const [branchName, setBranchName] = useState("");
  const [isBranchLoading, setIsBranchLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  
  // Form Control States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [allocationDate, setAllocationDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalPayable, setTotalPayable] = useState("");
  const [totalPaid, setTotalPaid] = useState("");
  
  // Execution Log States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!rawBranchId || rawBranchId === "[id]") return;

    const fetchBranchContext = async () => {
      try {
        setIsBranchLoading(true);
        const res = await fetch(`/api/branches/${rawBranchId}`); 
        if (res.ok) {
          const bData = await res.json();
          setBranchName(bData.name || "Active Operations Node");
        }
      } catch (err) {
        console.error("Context synchronization fault:", err);
      } finally {
        setIsBranchLoading(false);
      }
    };

    const fetchBranchEmployees = async () => {
      try {
        setIsEmployeesLoading(true);
        const res = await fetch(`/api/employees?branchId=${rawBranchId}`);
        if (res.ok) {
          const eData = await res.json();
          setEmployees(Array.isArray(eData) ? eData : []);
        }
      } catch (err) {
        console.error("Employee roster streaming fault:", err);
      } finally {
        setIsEmployeesLoading(false);
      }
    };

    fetchBranchContext();
    fetchBranchEmployees();
  }, [rawBranchId]);


  const payableAmt = parseFloat(totalPayable) || 0;
  const paidAmt = parseFloat(totalPaid) || 0;
  const calculatedBalance = Math.max(0, payableAmt - paidAmt);

  const handleCommitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // 🛡️ CRITICAL GATEKEEPER VALIDATION 
    if (!rawBranchId || rawBranchId === "[id]" || isBranchLoading) {
      setErrorMessage("EXECUTION FAULT: Branch Node ID context is unstable or uninitialized.");
      return;
    }

    if (!selectedEmployeeId) {
      setErrorMessage("VALIDATION FAULT: Targeted employee vector must be explicitly defined.");
      return;
    }

    if (payableAmt <= 0) {
      setErrorMessage("VALIDATION FAULT: Total payable amount must be greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        branchId: rawBranchId, 
        employeeId: selectedEmployeeId,
        reason: "Monthly structural salary payout",
        totalPayable: payableAmt,
        totalPaid: paidAmt,
        date: allocationDate
      };

      const res = await fetch("/api/expences/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMessage("TRANSACTION INGESTED: Salary ledger matrix updated successfully.");

        setTimeout(() => {
          router.push(`/dashboard/branches/${rawBranchId}/view-expences/salary`);
          router.refresh();
        }, 1500);
      } else {
        setErrorMessage(result.error || "Transaction ingestion pipeline rejected.");
      }
    } catch (err) {
      setErrorMessage("NETWORK FAULT: Secure payout pipeline deployment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-300 p-8 antialiased font-mono">
      <div className="max-w-2xl mx-auto">
        
        {/* Top Header Navigation */}
        <div className="mb-8 flex items-center gap-3 border-b border-slate-900 pb-4">
          <button 
            type="button"
            onClick={() => router.back()} 
            className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Log Salary Expense
            </h1>
            <p className="text-[10px] text-slate-500">Disburse individual employee compensation metrics into central ledger</p>
          </div>
        </div>

        {/* Status Alerts Display */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div><span className="font-bold">EXECUTION FAULT:</span> {errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div><span className="font-bold">SUCCESS:</span> {successMessage}</div>
          </div>
        )}

        {/* Main Operational Card Form */}
        <form onSubmit={handleCommitRecord} className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-sm">
          
          {/* Row 1: Designated Branch & Expense Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Landmark size={12} className="text-slate-500" /> Designated Branch Node
              </label>
              <input
                type="text"
                readOnly
                className="w-full bg-slate-950 border border-slate-900/80 p-3 rounded-xl text-xs text-slate-400 select-none focus:outline-none focus:border-slate-800"
                value={isBranchLoading ? "LOADING BRANCH CONTEXT..." : `${branchName.toUpperCase()} (NODE ID: ${rawBranchId})`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-200" /> Expense Allocation Date
              </label>
              <input
                type="date"
                required
                className="w-full bg-slate-950 border border-slate-900 p-3 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-600 transition-colors"
                value={allocationDate}
                onChange={(e) => setAllocationDate(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Select Target Employee Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users size={12} className="text-slate-500" /> Select Target Employee Vector
            </label>
            <select
              required
              disabled={isEmployeesLoading}
              className="w-full bg-slate-950 border border-slate-900 p-3 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-600 transition-colors capitalize disabled:opacity-50"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="" className="text-slate-600 font-sans">
                {isEmployeesLoading ? "Synchronizing branch staff index..." : "-- SELECT TARGET VECTOR --"}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="text-slate-300 font-sans bg-slate-950">
                  [{emp.id}] - {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Static Reason Field */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Expense Classification Reason
            </label>
            <input
              type="text"
              readOnly
              className="w-full bg-slate-950 border border-slate-900/60 p-3 rounded-xl text-xs text-slate-500 select-none focus:outline-none"
              value="Salary"
            />
          </div>

          {/* Row 4: Financial Input Elements (Payable & Paid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign size={12} className="text-slate-500" /> Total Payable Amount (LKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-900 p-3 rounded-xl text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-purple-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                  value={totalPayable}
                  onChange={(e) => setTotalPayable(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wallet size={12} className="text-slate-500" /> Total Paid Amount (LKR)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-900 p-3 rounded-xl text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-purple-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                value={totalPaid}
                onChange={(e) => setTotalPaid(e.target.value)}
              />
            </div>
          </div>

          {/* Row 5: Dynamic Auto-Calculated Balance Box */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Auto-Calculated Balance Deferred</span>
            <span className={`text-xs font-bold ${calculatedBalance > 0 ? "text-amber-400" : "text-slate-500"}`}>
              LKR {calculatedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Row 6: Submit Ledger Button Component */}
          <button
            type="submit"
            disabled={isBranchLoading || isSubmitting}
            className={`w-full p-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              isBranchLoading || isSubmitting
                ? "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-900/50"
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/10 active:scale-[0.99]"
            }`}
          >
            {isSubmitting ? "Ingesting Ledger Matrix..." : "Commit Expense Record"}
          </button>

        </form>
      </div>
    </div>
  );
}