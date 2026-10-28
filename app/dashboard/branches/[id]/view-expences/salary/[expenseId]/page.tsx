"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, Printer, Download, AlertCircle } from "lucide-react";

export default function SalaryVoucherSummaryPage() {
  const router = useRouter();
  
  const [voucher, setVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [derivedExpenseId, setDerivedExpenseId] = useState<string>("");
  const [derivedBranchId, setDerivedBranchId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

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
        setErrorMsg("Network execution fault while synchronizing matrix.");
      } finally {
        setLoading(false);
      }
    };
    fetchVoucherData();
  }, []);

  // PRINT - white voucher eka witharak
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) { window.print(); return; }
    win.document.write(`<html><head><title>Salary Voucher ${derivedExpenseId}</title><script src="https://cdn.tailwindcss.com"></script><style>@page{size:A4;margin:10mm}body{-webkit-print-color-adjust:exact}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  // PDF DOWNLOAD - FIXED - CLASSIFICATION REASON OVERLAP NA
  const handleDownloadPDF = async () => {
    if (!voucher) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const payable = parseFloat(voucher.total_payable || voucher.payable || 0);
      const paid = parseFloat(voucher.total_paid || voucher.paid || 0);
      const balance = parseFloat(voucher.balance || 0);

      doc.setFillColor(10, 42, 94);
      doc.rect(0, 0, 210, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text("DEARO INVESTMENT LIMITED (PVT)", 15, 14);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text("EXPENDITURE DISBURSAL VOUCHER - Salary", 15, 21);

      const statusText = balance > 0 ? "DEFERRED" : "SETTLED";
      doc.setFillColor(balance > 0 ? 251 : 22, balance > 0 ? 191 : 163, balance > 0 ? 36 : 74);
      doc.roundedRect(150, 8, 45, 10, 2, 2, "F");
      doc.setTextColor(balance > 0 ? 0 : 255, balance > 0 ? 0 : 255, balance > 0 ? 0 : 255);
      doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text(statusText, 152, 14.5);

      doc.setTextColor(0, 0, 0);
      let y = 42;
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`VOUCHER ID: #${derivedExpenseId}`, 15, y);
      doc.text(`ALLOCATION DATE: ${voucher.expense_date || "-"}`, 110, y); y += 6;
      doc.text(`BRANCH NODE: ${derivedBranchId}`, 15, y);
      doc.text(`STATUS: ${statusText}`, 110, y); y += 10;

      doc.setDrawColor(200, 200, 200); doc.line(15, y, 195, y); y += 8;

      doc.setFillColor(10, 42, 94); doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("DESCRIPTION VECTOR", 17, y + 5); doc.text("METRICS (LKR)", 150, y + 5);
      y += 8; doc.setTextColor(0, 0, 0);

      const rows = [
        { label: "TARGET EMPLOYEE", value: voucher.employee_name || "N/A", metric: `ID: ${voucher.employee_id || "-"}`, h: 12 },
        { label: "CLASSIFICATION REASON", value: voucher.reason || "Monthly structural salary payout", metric: "Salary Expense", h: 14 },
        { label: "TOTAL EXPENSE (PAYABLE)", value: "", metric: payable.toLocaleString("en-US", { minimumFractionDigits: 2 }), h: 10 },
        { label: "TOTAL PAID AMOUNT", value: "", metric: `(${paid.toLocaleString("en-US", { minimumFractionDigits: 2 })})`, h: 10 },
        { label: "TOTAL BALANCE DEFERRED", value: "", metric: `LKR ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, h: 12, isLast: true },
      ];

      rows.forEach((r) => {
        const isLast = !!r.isLast;
        const rowHeight = r.h;
        
        doc.setFillColor(isLast ? 235 : 248, isLast ? 235 : 248, isLast ? 255 : 255);
        doc.setDrawColor(210,210,210);
        doc.rect(15, y, 180, rowHeight, "FD");

        if (r.label === "TARGET EMPLOYEE") {
          doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(100,100,100);
          doc.text(r.label, 17, y + 3.5);
          doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(0,0,0);
          doc.text(r.value.toUpperCase(), 17, y + 8);
          doc.setFont("helvetica", "normal"); doc.setFontSize(8);
          doc.text(r.metric, 150, y + 6.5);
        } else if (r.label === "CLASSIFICATION REASON") {
          doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(100,100,100);
          doc.text(r.label, 17, y + 3.5);
          doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(0,0,0);
          const lines = doc.splitTextToSize(r.value, 110);
          doc.text(lines, 17, y + 8);
          doc.setFontSize(8); doc.setTextColor(80,80,80);
          doc.text(r.metric, 150, y + 7);
        } else {
          doc.setFont("helvetica", isLast ? "bold" : "normal");
          doc.setFontSize(isLast ? 9 : 8);
          doc.setTextColor(0,0,0);
          doc.text(r.label, 17, y + 6.5);
          doc.setFont("helvetica", isLast ? "bold" : "normal");
          doc.text(r.metric, 150, y + 6.5);
        }
        y += rowHeight;
      });

      y += 15;
      doc.setFontSize(8); doc.setTextColor(0,0,0);
      doc.text("PREPARED BY (OFFICER)", 20, y + 10); doc.line(20, y + 8, 70, y + 8);
      doc.text("AUTHORIZED ENDORSEMENT", 125, y + 10); doc.line(125, y + 8, 180, y + 8);

      doc.setFillColor(10, 42, 94); doc.rect(0, 285, 210, 12, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8);
      doc.text("DEARO INVESTMENT LIMITED (PVT) - www.dearoinvestment.com", 20, 292);

      doc.save(`Salary-Voucher-${derivedExpenseId}.pdf`);
    } catch (err) {
      console.error(err);
      handlePrint();
    }
  };

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
        <button onClick={() => router.back()} className="mt-6 text-[11px] text-purple-400 hover:underline flex items-center gap-1">
          <ArrowLeft size={12} /> Return to Ledger Staging
        </button>
      </div>
    );
  }

  const payable = parseFloat(voucher.total_payable || 0);
  const paid = parseFloat(voucher.total_paid || 0);
  const balance = parseFloat(voucher.balance || 0);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-300 p-4 md:p-8 font-mono antialiased">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-6 flex justify-between items-center border-b border-slate-900/60 pb-4 print:hidden">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Ledger
          </button>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all border border-slate-700">
              <Printer size={14} /> Print
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95">
              <Download size={14} /> Export & Print PDF
            </button>
          </div>
        </div>

        {/* SCREEN DARK CARD */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-6 text-center">
            <h1 className="text-base font-bold text-slate-100 uppercase tracking-widest">DEARO INVESTMENT LIMITED (PVT)</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-sans">Expenditure Disbursal Voucher</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6 text-[11px] border-b border-slate-900/60 pb-6">
            <div className="space-y-1.5">
              <div><span className="text-slate-500">VOUCHER ID :</span> #{derivedExpenseId}</div>
              <div><span className="text-slate-500">BRANCH NODE:</span> {derivedBranchId}</div>
            </div>
            <div className="space-y-1.5 text-right">
              <div><span className="text-slate-500">ALLOCATION DATE:</span> {voucher.expense_date}</div>
              <div><span className="text-slate-500">STATUS : </span> <span className={balance > 0 ? "text-amber-500 font-bold" : "text-emerald-400 font-bold"}>{balance > 0 ? "DEFERRED" : "SETTLED"}</span></div>
            </div>
          </div>

          <div className="border border-slate-900 rounded-xl overflow-hidden my-8">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-[10px] text-slate-400 font-bold uppercase">
                  <th className="p-4">Description Vector</th>
                  <th className="p-4 text-right">Metrics (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-[11px]">
                <tr>
                  <td className="p-4"><span className="text-slate-500 block text-[9px]">TARGET EMPLOYEE</span> <span className="font-sans font-bold text-slate-200 capitalize">{voucher.employee_name || "N/A"}</span></td>
                  <td className="p-4 text-right font-bold text-slate-400">ID: {voucher.employee_id}</td>
                </tr>
                <tr>
                  <td className="p-4"><span className="text-slate-500 block text-[9px]">CLASSIFICATION REASON</span> <span className="font-sans text-slate-300">{voucher.reason}</span></td>
                  <td className="p-4 text-right text-slate-400">Salary Expense</td>
                </tr>
                <tr className="bg-slate-950/20">
                  <td className="p-4 font-bold text-slate-400">TOTAL EXPENSE (PAYABLE)</td>
                  <td className="p-4 text-right font-bold text-slate-100">{payable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-500">TOTAL PAID AMOUNT</td>
                  <td className="p-4 text-right font-bold text-emerald-400">({paid.toLocaleString('en-US', { minimumFractionDigits: 2 })})</td>
                </tr>
                <tr className="bg-slate-950 border-t border-slate-900 font-bold text-sm">
                  <td className="p-4 text-slate-300">TOTAL BALANCE DEFERRED</td>
                  <td className="p-4 text-right text-amber-500">LKR {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-16 text-[10px] text-center text-slate-500">
            <div><div className="border-b border-slate-800 mx-auto w-32 h-8"></div><p className="mt-2 uppercase tracking-wider">Prepared By (Officer)</p></div>
            <div><div className="border-b border-slate-800 mx-auto w-32 h-8"></div><p className="mt-2 uppercase tracking-wider">Authorized Endorsement</p></div>
          </div>
        </div>
      </div>

      {/* HIDDEN WHITE VERSION FOR PRINT/PDF */}
      <div className="hidden">
        <div ref={printRef}>
          <div style={{ padding: '40px', fontFamily: 'sans-serif', background: 'white', color: 'black', width: '800px' }}>
            <div style={{ border: '3px solid #0a2a5e', padding: '32px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0a2a5e' }}>DEARO INVESTMENT LIMITED (PVT)</h1>
              <p style={{ fontSize: '12px', color: '#0a2a5e', fontWeight: 'bold', letterSpacing: '0.1em' }}>EXPENDITURE DISBURSAL VOUCHER</p>
              <hr style={{ margin: '16px 0', border: '1px solid #0a2a5e' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>VOUCHER ID: #{derivedExpenseId}</span>
                <span>DATE: {voucher.expense_date}</span>
                <span>BRANCH: {derivedBranchId}</span>
              </div>
              <table style={{ width: '100%', marginTop: '24px', borderCollapse: 'collapse', border: '2px solid #0a2a5e' }}>
                <thead><tr style={{ background: '#0a2a5e', color: 'white' }}><th style={{ padding: '10px', textAlign: 'left' }}>DESCRIPTION</th><th style={{ padding: '10px', textAlign: 'right' }}>AMOUNT (LKR)</th></tr></thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ccc' }}><td style={{ padding: '12px' }}><b>Employee:</b> {voucher.employee_name}</td><td style={{ padding: '12px', textAlign: 'right' }}>ID: {voucher.employee_id}</td></tr>
                  <tr style={{ borderBottom: '1px solid #ccc' }}><td style={{ padding: '12px' }}><b>Reason:</b> {voucher.reason}</td><td style={{ padding: '12px', textAlign: 'right' }}>Salary Expense</td></tr>
                  <tr style={{ borderBottom: '1px solid #ccc', fontWeight: 'bold' }}><td style={{ padding: '12px' }}>TOTAL EXPENSE (PAYABLE)</td><td style={{ padding: '12px', textAlign: 'right' }}>{payable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
                  <tr style={{ borderBottom: '1px solid #ccc' }}><td style={{ padding: '12px' }}>TOTAL PAID AMOUNT</td><td style={{ padding: '12px', textAlign: 'right' }}>({paid.toLocaleString('en-US', { minimumFractionDigits: 2 })})</td></tr>
                  <tr style={{ background: '#f0f0f0', fontWeight: '900', fontSize: '14px' }}><td style={{ padding: '12px' }}>TOTAL BALANCE DEFERRED</td><td style={{ padding: '12px', textAlign: 'right' }}>LKR {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}