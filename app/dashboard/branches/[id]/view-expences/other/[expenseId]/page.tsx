"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Printer, AlertCircle } from "lucide-react";

export default function OtherVoucherSummaryPage() {
  const router = useRouter();
  const params = useParams();
  
  const [voucher, setVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [derivedExpenseId, setDerivedExpenseId] = useState<string>("");
  const [derivedBranchId, setDerivedBranchId] = useState<string>("");

  useEffect(() => {
    let currentExpenseId = params?.expenseId ? (params.expenseId as string) : "";
    let currentBranchId = params?.id ? (params.id as string) : "";

    if (!currentExpenseId || currentExpenseId === "undefined" || currentExpenseId === "[expenseId]") {
      const currentPath = window.location.pathname; 
      const pathSegments = currentPath.split("/").filter(Boolean);
      currentExpenseId = pathSegments[pathSegments.length - 1]; 
      
      const branchIndex = pathSegments.indexOf("branches");
      if (branchIndex !== -1 && pathSegments[branchIndex + 1]) {
        currentBranchId = pathSegments[branchIndex + 1];
      }
    }

    setDerivedExpenseId(currentExpenseId || "");
    setDerivedBranchId(currentBranchId || "");

    if (!currentExpenseId || currentExpenseId === "undefined" || currentExpenseId === "[expenseId]") {
      setErrorMsg("INVALID OTHER VOUCHER ID DETECTED.");
      setLoading(false);
      return;
    }

    const fetchOtherVoucherData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/expences/other/${currentExpenseId}`);
        if (res.ok) {
          const data = await res.json();
          setVoucher(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          setErrorMsg(errData.error || "Voucher Data Absent.");
        }
      } catch (err) {
        setErrorMsg("Network execution fault.");
      } finally {
        setLoading(false);
      }
    };

    fetchOtherVoucherData();
  }, [params]);

  if (loading) {
    return <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-xs text-slate-500 animate-pulse font-mono tracking-widest">SYNCHRONIZING SECURE VOUCHER MATRIX...</div>;
  }

  if (errorMsg || !voucher) {
    return (
      <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center font-mono p-4">
        <div className="text-red-500 text-xs font-bold border border-red-500/30 bg-red-500/10 px-4 py-2 rounded-lg flex items-center gap-2"><AlertCircle size={14} /> {errorMsg}</div>
        <button onClick={() => router.back()} className="mt-6 text-[11px] text-purple-400 hover:underline flex items-center gap-1"><ArrowLeft size={12} /> Return to Ledger</button>
      </div>
    );
  }

  const payable = parseFloat(voucher.total_payable || 0);
  const paid = parseFloat(voucher.total_paid || 0);
  const balance = parseFloat(voucher.balance || 0);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-300 p-4 md:p-8 font-mono print:bg-white print:text-black antialiased">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-6 flex justify-between items-center border-b border-slate-900/60 pb-4 print:hidden">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"><ArrowLeft size={14} /> Back to Ledger</button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all"><Printer size={14} /> Export & Print PDF</button>
        </div>

        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-8 shadow-2xl print:border-none print:bg-transparent print:p-0">
          <div className="border-b border-slate-800 pb-6 text-center print:border-black">
            <h1 className="text-base font-bold text-slate-100 uppercase tracking-widest print:text-black">DEARO TUNNEL SYSTEM</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 print:text-black font-sans">General Expenditure Voucher</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6 text-[11px] border-b border-slate-900/60 pb-6 print:border-black print:text-black">
            <div className="space-y-1.5">
              <div><span className="text-slate-500">VOUCHER ID :</span> #{derivedExpenseId}</div>
              <div><span className="text-slate-500">BRANCH NODE:</span> {derivedBranchId}</div>
            </div>
            <div className="space-y-1.5 text-right">
              <div><span className="text-slate-500">ALLOCATION DATE:</span> {voucher.expense_date}</div>
              <div>
                <span className="text-slate-500">STATUS : </span> 
                <span className={balance > 0 ? "text-amber-500 font-bold" : "text-emerald-400 font-bold"}>
                  {balance > 0 ? "DEFERRED" : "SETTLED"}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-slate-900 rounded-xl overflow-hidden my-8 print:border-black">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-[10px] text-slate-400 font-bold uppercase print:bg-gray-100 print:text-black">
                  <th className="p-4">Description Vector</th>
                  <th className="p-4 text-right">Metrics (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-[11px] print:divide-gray-300 print:text-black">
                <tr>
                  <td className="p-4">
                    <span className="text-slate-500 block text-[9px]">EXPENDITURE REASON</span> 
                    <span className="font-sans text-slate-300 print:text-black">{voucher.reason}</span>
                  </td>
                  <td className="p-4 text-right text-slate-400 print:text-black">General Overhead</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-400 print:text-black">TOTAL COST (PAYABLE)</td>
                  <td className="p-4 text-right font-bold text-slate-200 print:text-black">
                    {payable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 print:text-black">TOTAL PAID AMOUNT</td>
                  <td className="p-4 text-right font-bold text-emerald-400 print:text-black">
                    ({paid.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </td>
                </tr>

                <tr className="bg-slate-950 border-t font-bold text-sm print:bg-gray-50">
                  <td className="p-4 text-slate-300 print:text-black">REMAINING DUE BALANCE</td>
                  <td className="p-4 text-right text-purple-400 print:text-black">
                    LKR {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-16 text-[10px] text-center text-slate-500 print:text-black">
            <div><div className="border-b border-slate-800 mx-auto w-32 h-8 print:border-black"></div><p className="mt-2 uppercase tracking-wider">Prepared By</p></div>
            <div><div className="border-b border-slate-800 mx-auto w-32 h-8 print:border-black"></div><p className="mt-2 uppercase tracking-wider">Authorized Endorsement</p></div>
          </div>
        </div>

      </div>
    </div>
  );
}