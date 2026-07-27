"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import { 
  ArrowLeft, 
  Coins, 
  Wallet, 
  Landmark, 
  Building, 
  ArrowUpRight 
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ViewExpensesMainPage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const branchId = unwrappedParams?.id ? decodeURIComponent(unwrappedParams.id) : "";

  // Infrastructure States
  const [branchName, setBranchName] = useState<string>("");
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    if (!branchId || branchId === "[id]") {
      setLoadingContext(false);
      return;
    }

    const fetchBranchIdentity = async () => {
      try {
        const res = await fetch(`/api/branches`);
        if (res.ok) {
          const branches = await res.json();
          if (Array.isArray(branches)) {
            const currentBranch = branches.find(
              (b: any) => b.id.toString() === branchId.toString()
            );
            if (currentBranch) {
              setBranchName(currentBranch.branchName || currentBranch.bName);
            }
          }
        }
      } catch (err) {
        console.error("Identity Matrix Fetch Error:", err);
      } finally {
        setLoadingContext(false);
      }
    };

    fetchBranchIdentity();
  }, [branchId]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-300 p-4 md:p-6 lg:p-8 antialiased font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Navigation & Brand Header Panel */}
        <div className="mb-6 flex items-center gap-3.5 border-b border-slate-900 pb-5">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${branchId}`)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400">
                <Landmark size={14} />
              </div>
              <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono">
                Expense Ledger Directory
              </h1>
            </div>

            <p className="text-[10px] text-purple-400 mt-0.5 tracking-wide font-mono uppercase flex items-center gap-1">
              <Building size={11} className="opacity-70" /> 
              {loadingContext ? "Syncing Directory Context..." : (branchName || `Branch Node ID: ${branchId}`)}
            </p>
          </div>
        </div>

        {/* Dashboard Selection Matrix Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          
          {/* Card Vector 01: Salary Expenses Selection */}
          <div 
            onClick={() => router.push(`/dashboard/branches/${branchId}/view-expences/salary`)}
            className="group p-4 bg-slate-900/10 border border-slate-900 rounded-xl hover:border-amber-500/30 hover:bg-slate-900/20 transition-all cursor-pointer backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[120px]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 group-hover:scale-105 transition-transform">
                  <Coins size={16} />
                </div>
                <ArrowUpRight size={14} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
              </div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 group-hover:text-amber-400 transition-colors">
                Salary Expenditures
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal mt-2">
              Audit internal employee compensation matrices, disbursed transactions, and outstanding balance logs.
            </p>
          </div>

          {/* Card Vector 02: Other Expenses Selection */}
          <div 
            onClick={() => router.push(`/dashboard/branches/${branchId}/view-expences/other`)}
            className="group p-4 bg-slate-900/10 border border-slate-900 rounded-xl hover:border-purple-500/30 hover:bg-slate-900/20 transition-all cursor-pointer backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[120px]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 group-hover:scale-105 transition-transform">
                  <Wallet size={16} />
                </div>
                <ArrowUpRight size={14} className="text-slate-600 group-hover:text-purple-500 transition-colors" />
              </div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 group-hover:text-purple-400 transition-colors">
                Other Expenditures
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal mt-2">
              Examine utilities indices, food logging statements, and contingent environmental branch node costs.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
