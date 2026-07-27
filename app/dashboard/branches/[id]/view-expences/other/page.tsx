"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import { 
  ArrowLeft, 
  Wallet, 
  Tag, 
  ShieldCheck,
  Calendar, 
  AlertCircle,
  Building,
  FileText
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ViewOtherExpensesPage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const branchId = unwrappedParams?.id ? decodeURIComponent(unwrappedParams.id) : "";

  const [data, setData] = useState<any[]>([]);
  const [branchName, setBranchName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    if (!branchId || branchId === "[id]") return;

    const fetchBranchSpecificOperationalLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/expences/other?branchId=${branchId}`);
        if (res.ok) {
          const resData = await res.json();
          setData(Array.isArray(resData) ? resData : []);
        }

        const branchRes = await fetch(`/api/branch`);
        if (branchRes.ok) {
          const branches = await branchRes.json();
          if (Array.isArray(branches)) {
            const currentBranch = branches.find((b: any) => b.id.toString() === branchId.toString());
            if (currentBranch) setBranchName(currentBranch.branchName || currentBranch.bName);
          }
        }
      } catch (err) {
        console.error("Ledger operational isolation fault:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchSpecificOperationalLogs();
  }, [branchId]);

  const filteredData = categoryFilter === "ALL" 
    ? data 
    : data.filter(item => (item.expense_type || "").toUpperCase() === categoryFilter.toUpperCase());

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-300 p-4 md:p-6 lg:p-8 antialiased font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Grid Setup */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-400">
                  <Wallet size={14} />
                </div>
                <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono">
                  Operational Overhead Ledger
                </h1>
              </div>
              <p className="text-[10px] text-purple-400/80 mt-0.5 tracking-wide font-mono uppercase flex items-center gap-1">
                <Building size={10} /> Scope Context: {branchName || `Branch Node ID: ${branchId}`}
              </p>
            </div>
          </div>

          {/* Classification Filter Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500/40 transition-all font-mono uppercase tracking-wider"
            >
              <option value="ALL">-- ALL CLASSIFICATIONS --</option>
              <option value="Food">Food & Entertainment</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Water">Water Utilities</option>
              <option value="Electricity">Electricity Grid</option>
              <option value="Other Payments">Other Contingent</option>
            </select>
          </div>
        </div>

        {/* Corporate Grid Table */}
        <div className="bg-slate-900/10 border border-slate-900 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/80 font-mono text-[10px] uppercase text-slate-400 tracking-widest">
                  <th className="p-4 font-bold">Classification Matrix</th>
                  <th className="p-4 font-bold text-right">Total Payable</th>
                  <th className="p-4 font-bold text-right">Total Paid</th>
                  <th className="p-4 font-bold text-right">Outstanding Balance</th>
                  <th className="p-4 text-center">Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-[11px] font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 text-xs tracking-wide font-mono animate-pulse">
                      Filtering operational entries for node...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-600 text-xs">
                      <div className="flex flex-col items-center gap-1.5 justify-center py-4">
                        <AlertCircle size={16} className="text-slate-700" />
                        <span>No operational records discovered under this specific branch context.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => {
                    const balanceAmt = parseFloat(item.balance) || 0;
                    return (
                      <tr key={index} className="hover:bg-slate-900/30 transition-colors group">
                        <td className="p-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/5 border border-purple-500/10 text-purple-400 font-semibold text-[10px] uppercase tracking-wide">
                            <Tag size={10} className="opacity-70" />
                            {item.reason || "General Overhead"}
                          </span>
                        </td>
                        <td className="p-4 text-right text-slate-300 font-medium">
                          {parseFloat(item.total_payable).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right text-emerald-400 font-medium">
                          {parseFloat(item.total_paid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right text-amber-400 font-bold">
                          {balanceAmt > 0 ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="text-amber-500 font-bold">{balanceAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              <span className="text-[8px] text-amber-600 uppercase tracking-tighter font-semibold">DEFERRED</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                              <ShieldCheck size={10} /> Settled
                            </span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-600" />
                            <span className="font-sans text-xs font-semibold text-slate-200 capitalize">
                            {item.expense_date	|| "2026-07-17"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button 
                            onClick={() => router.push(`/dashboard/branches/${branchId}/view-expences/other/${item.id}`)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white transition-all text-[10px] font-bold"
                          >
                             <FileText size={11}/>View Summary
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}