"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowLeft, User, ShieldCheck, AlertCircle,FileText, Calendar } from "lucide-react";

export default function ViewSalaryExpensesPage() {
  const router = useRouter();
  const params = useParams();
  const branchId = params?.id ? decodeURIComponent(params.id as string) : "";

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId || branchId === "[id]") return;
    
    const fetchSalaryLogs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/expences/salary?branchId=${branchId}`);
        if (res.ok) {
          const resData = await res.json();
          setData(Array.isArray(resData) ? resData : []);
        }
      } catch (err) {
        console.error("Pipeline fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryLogs();
  }, [branchId]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-300 p-8 antialiased">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-900 pb-4">
          <button onClick={() => router.back()} className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
              Salary Expenditure Ledger
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">SCOPE NODE ID: {branchId}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-900/10 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/80 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="p-4">Employee Name</th>
                <th className="p-4">Classification Reason</th>
                <th className="p-4 text-right">Total Payable</th>
                <th className="p-4 text-right">Total Paid</th>
                <th className="p-4 text-right">Balance</th>
                <th className="p-4 text-center">Date</th>
                <th className="p-4 text-center">Actions</th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-[11px] font-mono">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">Synchronizing ledger matrix...</td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-600">
                    <div className="flex flex-col items-center gap-1 py-2">
                      <AlertCircle size={14} />
                      <span>No synchronized records found for Branch {branchId}.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  
                  // 🔗 BINDING EMPLOYEE NAME AND OTHER METRICS
                  const empName = item.employee_name || `ID: ${item.employee_id || "UNKNOWN"}`;
                  const reason = item.reason || "Monthly salary payout";
                  const payable = parseFloat(item.total_payable || 0);
                  const paid = parseFloat(item.total_paid || 0);
                  const balance = parseFloat(item.balance || 0);
                  const date = item.expense_date || "2026-07-17";

                  return (
                    <tr key={index} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-600" />
                          <span className="font-sans text-xs font-semibold text-slate-200 capitalize">
                            {empName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 font-sans text-xs">{reason}</td>
                      <td className="p-4 text-right text-slate-300">
                        {payable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-emerald-400">
                        {paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-amber-400 font-bold">
                        {balance > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="text-amber-400 font-bold">
                              {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[8px] text-amber-600 font-bold">DEFERRED</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                            <ShieldCheck size={10} /> SETTLED
                          </span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-600" />
                          <span className="font-sans text-xs font-semibold text-slate-200 capitalize">
                            {date}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                         <button 
                           onClick={() => router.push(`/dashboard/branches/${branchId}/view-expences/salary/${item.id}`)}
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
  );
}