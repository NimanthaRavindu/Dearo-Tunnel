"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Printer, AlertCircle } from "lucide-react";

export default function SalaryVoucherSummaryPage() {
  const router = useRouter();
  
  const [voucher, setVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [derivedExpenseId, setDerivedExpenseId] = useState<string>("");
  const [derivedBranchId, setDerivedBranchId] = useState<string>("");

  useEffect(() => {

    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split("/");
    
    const finalExpenseId = pathSegments[pathSegments.length - 1];
    

    const branchIndex = pathSegments.indexOf("branches");
    const finalBranchId = branchIndex !== -1 ? pathSegments[branchIndex + 1] : "";

    setDerivedExpenseId(finalExpenseId || "");
    setDerivedBranchId(finalBranchId || "");

    if (!finalExpenseId || finalExpenseId === "undefined" || finalExpenseId === "[expenseId]") {
      setErrorMsg("Failed to extract active Voucher ID from browser window context.");
      setLoading(false);
      return;
    }

    const fetchVoucherData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        
        const res = await fetch(`/api/expences/salary/${finalExpenseId}`);
        
        if (res.ok) {
          const data = await res.json();
          setVoucher(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.error || `Server matrix fault: Status ${res.status}`);
        }
      } catch (err) {
        console.error("Voucher fetch fault:", err);
        setErrorMsg("Network execution fault while synchronizing matrix.");
      } finally {
        setLoading(false);
      }
    };

    fetchVoucherData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-xs text-slate-500 animate-pulse font-mono tracking-widest">
        SYNCHRONIZING SECURE VOUCHER MATRIX...
      </div>
    );
  }

  if (errorMsg || !voucher) {
    return (
      <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center text-center p-4 font-mono">
        <div className="text-red-500 text-xs font-bold border border-red-500/30 bg-red-500/10 px-4 py-2 rounded-lg tracking-wider uppercase flex items-center gap-2">
          <AlertCircle size={14} /> {errorMsg || "VOUCHER NOT FOUND."}
        </div>
        <p className="text-[10px] text-slate-500 mt-3">
          Target Identifier Segment: <span className="text-amber-500">"{derivedExpenseId}"</span>
        </p>
        <button 
          onClick={() => router.back()} 
          className="mt-6 text-[11px] text-purple-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={12} /> Return to Ledger Staging
        </button>
      </div>
    );
  }

  const payable = parseFloat(voucher.total_payable || 0);
  const paid = parseFloat(voucher.total_paid || 0);
  const balance = parseFloat(voucher.balance || 0);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-300 p-4 md:p-8 font-mono print:bg-white print:text-black antialiased">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation Actions */}
        <div className="mb-6 flex justify-between items-center border-b border-slate-900/60 pb-4 print:hidden">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Ledger
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95"
          >
            <Printer size={14} /> Export & Print PDF
          </button>
        </div>

        {/* Official Voucher Printable Card */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-8 shadow-2xl print:border-none print:bg-transparent print:p-0">
          
          <div className="border-b border-slate-800 pb-6 text-center print:border-black">
            <h1 className="text-base font-bold text-slate-100 uppercase tracking-widest print:text-black">DEARO TUNNEL SYSTEM</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 print:text-black font-sans">Expenditure Disbursal Voucher</p>
          </div>

          {/* Meta Information Matrix */}
          <div className="grid grid-cols-2 gap-4 my-6 text-[11px] border-b border-slate-900/60 pb-6 print:border-black print:text-black">
            <div className="space-y-1.5">
              <div><span className="text-slate-500 print:text-gray-600">VOUCHER ID :</span> #{derivedExpenseId}</div>
              <div><span className="text-slate-500 print:text-gray-600">BRANCH NODE:</span> {derivedBranchId}</div>
            </div>
            <div className="space-y-1.5 text-right">
              <div><span className="text-slate-500 print:text-gray-600">ALLOCATION DATE:</span> {voucher.expense_date}</div>
              <div>
                <span className="text-slate-500 print:text-gray-600">STATUS : </span> 
                <span className={balance > 0 ? "text-amber-500 font-bold" : "text-emerald-400 font-bold"}>
                  {balance > 0 ? "DEFERRED" : "SETTLED"}
                </span>
              </div>
            </div>
          </div>

          {/* Core Voucher Financial Table */}
          <div className="border border-slate-900 rounded-xl overflow-hidden my-8 print:border-black">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-[10px] text-slate-400 font-bold uppercase print:bg-gray-100 print:border-black print:text-black">
                  <th className="p-4">Description Vector</th>
                  <th className="p-4 text-right">Metrics (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-[11px] print:divide-gray-300 print:text-black">
                <tr>
                  <td className="p-4">
                    <span className="text-slate-500 block text-[9px]">TARGET EMPLOYEE</span> 
                    <span className="font-sans font-bold text-slate-200 capitalize print:text-black">
                      {voucher.employee_name || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-400 print:text-black">ID: {voucher.employee_id}</td>
                </tr>
                <tr>
                  <td className="p-4">
                    <span className="text-slate-500 block text-[9px]">CLASSIFICATION REASON</span> 
                    <span className="font-sans text-slate-300 print:text-black">{voucher.reason}</span>
                  </td>
                  <td className="p-4 text-right text-slate-400 print:text-black">Salary Expense</td>
                </tr>
                <tr className="bg-slate-950/20">
                  <td className="p-4 font-bold text-slate-400 print:text-black">TOTAL EXPENSE (PAYABLE)</td>
                  <td className="p-4 text-right font-bold text-slate-100 print:text-black">
                    {payable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-500 print:text-black">TOTAL PAID AMOUNT</td>
                  <td className="p-4 text-right font-bold text-emerald-400 print:text-black">
                    ({paid.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </td>
                </tr>
                <tr className="bg-slate-950 border-t border-slate-900 font-bold text-sm print:bg-gray-50 print:border-black">
                  <td className="p-4 text-slate-300 print:text-black">TOTAL BALANCE DEFERRED</td>
                  <td className="p-4 text-right text-amber-500 print:text-black">
                    LKR {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Validation Endorsement */}
          <div className="grid grid-cols-2 gap-8 mt-16 text-[10px] text-center text-slate-500 print:text-black">
            <div>
              <div className="border-b border-slate-800 mx-auto w-32 h-8 print:border-black"></div>
              <p className="mt-2 uppercase tracking-wider">Prepared By (Officer)</p>
            </div>
            <div>
              <div className="border-b border-slate-800 mx-auto w-32 h-8 print:border-black"></div>
              <p className="mt-2 uppercase tracking-wider">Authorized Endorsement</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}