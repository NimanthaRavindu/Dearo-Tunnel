"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, Printer, Download, AlertCircle } from "lucide-react";

export default function OtherVoucherSummaryPage() {
  const router = useRouter();
  const params = useParams();
  
  const [voucher, setVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [derivedExpenseId, setDerivedExpenseId] = useState<string>("");
  const [derivedBranchId, setDerivedBranchId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentExpenseId = params?.expenseId ? (params.expenseId as string) : (params as any)?.recordId || "";
    let currentBranchId = params?.id ? (params.id as string) : "";

    if (!currentExpenseId || currentExpenseId === "undefined" || currentExpenseId === "[expenseId]" || currentExpenseId === "[recordId]") {
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
          setVoucher(data.data || data);
        } else {
          // fallback - list eken hoyanawa
          const res2 = await fetch(`/api/expences/other?branch_id=${currentBranchId}`, { cache: "no-store" } as any);
          if (res2.ok) {
            const data2 = await res2.json();
            const list = data2.data || data2.expenses || data2.rows || [];
            const found = Array.isArray(list) ? list.find((r:any)=> String(r.id)===String(currentExpenseId)) : null;
            if (found) setVoucher(found);
            else {
              const errData = await res.json().catch(() => ({}));
              setErrorMsg(errData.error || "Voucher Data Absent.");
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            setErrorMsg(errData.error || "Voucher Data Absent.");
          }
        }
      } catch (err) {
        setErrorMsg("Network execution fault.");
      } finally {
        setLoading(false);
      }
    };
    fetchOtherVoucherData();
  }, [params]);

  // PRINT - white voucher eka witharak
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) { window.print(); return; }
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) { window.print(); return; }
    win.document.write(`<html><head><title>Other Voucher ${derivedExpenseId}</title><script src="https://cdn.tailwindcss.com"></script><style>@page{size:A4;margin:10mm}body{-webkit-print-color-adjust:exact; print-color-adjust:exact;}</style></head><body style="background:white;">${el.innerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(()=>{ win.print(); win.close(); }, 700);
  };

  // PDF DOWNLOAD - 100% working (html2canvas nathi)
  const handleDownloadPDF = async () => {
    if (!voucher) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p","mm","a4");
      const payable = parseFloat(voucher.total_payable || voucher.payable || voucher.amount || 0);
      const paid = parseFloat(voucher.total_paid || voucher.paid || 0);
      const balance = parseFloat(voucher.balance || 0) || (payable - paid);

      doc.setFillColor(10,42,94); doc.rect(0,0,210,32,"F");
      doc.setTextColor(255,255,255);
      doc.setFontSize(16); doc.setFont("helvetica","bold");
      doc.text("DEARO INVESTMENT LIMITED (PVT)", 15, 14);
      doc.setFontSize(9); doc.setFont("helvetica","normal");
      doc.text("GENERAL EXPENDITURE VOUCHER - Other Expenses", 15, 22);

      const status = balance>0 ? "DEFERRED" : "SETTLED";
      doc.setFillColor(balance>0?251:22, balance>0?191:163, balance>0?36:74);
      doc.roundedRect(148, 8, 47, 10, 2,2,"F");
      doc.setTextColor(balance>0?0:255, balance>0?0:255, balance>0?0:255);
      doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(status, 150, 14.5);

      doc.setTextColor(0,0,0); let y=42;
      doc.setFontSize(9); doc.setFont("helvetica","normal");
      doc.text(`VOUCHER ID: #${derivedExpenseId}`, 15, y);
      doc.text(`ALLOCATION DATE: ${voucher.expense_date || voucher.date || "-"}`, 110, y); y+=6;
      doc.text(`BRANCH NODE: ${derivedBranchId}`, 15, y);
      doc.text(`STATUS: ${status}`, 110, y); y+=12;

      doc.setDrawColor(200,200,200); doc.line(15, y, 195, y); y+=8;

      doc.setFillColor(10,42,94); doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
      doc.text("DESCRIPTION VECTOR", 17, y+5); doc.text("METRICS (LKR)", 150, y+5); y+=8;
      doc.setTextColor(0,0,0);

      const rows = [
        ["EXPENDITURE REASON", voucher.reason || voucher.description || voucher.note || "-", "General Overhead"],
        ["TOTAL COST (PAYABLE)", "", payable.toLocaleString('en-US',{minimumFractionDigits:2})],
        ["TOTAL PAID AMOUNT", "", `(${paid.toLocaleString('en-US',{minimumFractionDigits:2})})`],
        ["REMAINING DUE BALANCE", "", `LKR ${balance.toLocaleString('en-US',{minimumFractionDigits:2})}`],
      ];

      rows.forEach((r,i)=>{
        const isLast = i===rows.length-1;
        doc.setFillColor(isLast?240: i%2===0?248:255, isLast?240:248, isLast?255:255);
        doc.rect(15, y, 180, isLast?12:10, "F");
        doc.rect(15, y, 180, isLast?12:10);
        doc.setFont("helvetica", isLast?"bold":"normal");
        doc.setFontSize(isLast?10:8);
        doc.text(r[0], 17, y+6);
        doc.text(r[1], 17, y+ (i===0 ? 6 : 6));
        doc.text(r[2], 150, y+6);
        y+= isLast?12:10;
      });

      y+=15; doc.setFontSize(8); doc.setFont("helvetica","normal");
      doc.text("PREPARED BY", 20, y+10); doc.line(20, y+8, 70, y+8);
      doc.text("AUTHORIZED ENDORSEMENT", 125, y+10); doc.line(125, y+8, 180, y+8);

      doc.setFillColor(10,42,94); doc.rect(0,285,210,12,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(8);
      doc.text("DEARO INVESTMENT LIMITED (PVT) • www.dearoinvestment.com", 20, 292);

      doc.save(`Other-Voucher-${derivedExpenseId}.pdf`);
    } catch(e){
      console.error(e);
      handlePrint();
    }
  };

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
    <div className="min-h-screen bg-[#070a12] text-slate-300 p-4 md:p-8 font-mono antialiased">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-6 flex justify-between items-center border-b border-slate-900/60 pb-4 print:hidden">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"><ArrowLeft size={14} /> Back to Ledger</button>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all"><Printer size={14} /> Print</button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition-all"><Download size={14} /> Export & Print PDF</button>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-6 text-center">
            <h1 className="text-base font-bold text-slate-100 uppercase tracking-widest">DEARO INVESTMENT LIMITED (PVT)</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-sans">General Expenditure Voucher</p>
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
              <thead><tr className="bg-slate-950 border-b border-slate-900 text-[10px] text-slate-400 font-bold uppercase"><th className="p-4">Description Vector</th><th className="p-4 text-right">Metrics (LKR)</th></tr></thead>
              <tbody className="divide-y divide-slate-900 text-[11px]">
                <tr><td className="p-4"><span className="text-slate-500 block text-[9px]">EXPENDITURE REASON</span> <span className="font-sans text-slate-300">{voucher.reason}</span></td><td className="p-4 text-right text-slate-400">General Overhead</td></tr>
                <tr><td className="p-4 font-bold text-slate-400">TOTAL COST (PAYABLE)</td><td className="p-4 text-right font-bold text-slate-200">{payable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
                <tr><td className="p-4 font-bold text-slate-500">TOTAL PAID AMOUNT</td><td className="p-4 text-right font-bold text-emerald-400">({paid.toLocaleString('en-US', { minimumFractionDigits: 2 })})</td></tr>
                <tr className="bg-slate-950 border-t font-bold text-sm"><td className="p-4 text-slate-300">REMAINING DUE BALANCE</td><td className="p-4 text-right text-purple-400">LKR {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-16 text-[10px] text-center text-slate-500">
            <div><div className="border-b border-slate-800 mx-auto w-32 h-8"></div><p className="mt-2 uppercase tracking-wider">Prepared By</p></div>
            <div><div className="border-b border-slate-800 mx-auto w-32 h-8"></div><p className="mt-2 uppercase tracking-wider">Authorized Endorsement</p></div>
          </div>
        </div>
      </div>

      {/* HIDDEN WHITE PRINT VERSION */}
      <div className="hidden">
        <div ref={printRef}>
          <div style={{padding:'40px', background:'white', color:'black', width:'800px', fontFamily:'sans-serif'}}>
            <div style={{border:'3px solid #0a2a5e', padding:'32px'}}>
              <h1 style={{fontSize:'22px', fontWeight:'900', color:'#0a2a5e'}}>DEARO INVESTMENT LIMITED (PVT)</h1>
              <p style={{fontSize:'11px', color:'#0a2a5e', fontWeight:'bold', letterSpacing:'0.1em'}}>GENERAL EXPENDITURE VOUCHER - OTHER EXPENSES</p>
              <hr style={{margin:'16px 0', border:'1px solid #0a2a5e'}}/>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}>
                <span>VOUCHER ID: #{derivedExpenseId}</span>
                <span>DATE: {voucher.expense_date}</span>
                <span>BRANCH: {derivedBranchId}</span>
              </div>
              <table style={{width:'100%', marginTop:'24px', borderCollapse:'collapse', border:'2px solid #0a2a5e'}}>
                <thead><tr style={{background:'#0a2a5e', color:'white'}}><th style={{padding:'10px', textAlign:'left'}}>DESCRIPTION</th><th style={{padding:'10px', textAlign:'right'}}>AMOUNT (LKR)</th></tr></thead>
                <tbody>
                  <tr style={{borderBottom:'1px solid #ccc'}}><td style={{padding:'12px'}}><b>Reason:</b> {voucher.reason}</td><td style={{padding:'12px', textAlign:'right'}}>General Overhead</td></tr>
                  <tr style={{borderBottom:'1px solid #ccc', fontWeight:'bold'}}><td style={{padding:'12px'}}>TOTAL COST (PAYABLE)</td><td style={{padding:'12px', textAlign:'right'}}>{payable.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>
                  <tr style={{borderBottom:'1px solid #ccc'}}><td style={{padding:'12px'}}>TOTAL PAID AMOUNT</td><td style={{padding:'12px', textAlign:'right'}}>({paid.toLocaleString('en-US',{minimumFractionDigits:2})})</td></tr>
                  <tr style={{background:'#f0f0f0', fontWeight:'900', fontSize:'14px'}}><td style={{padding:'12px'}}>REMAINING DUE BALANCE</td><td style={{padding:'12px', textAlign:'right'}}>LKR {balance.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>
                </tbody>
              </table>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'48px', marginTop:'48px'}}>
                <div><div style={{borderBottom:'1px solid black', height:'32px'}}></div><p style={{fontSize:'10px', marginTop:'8px'}}>Prepared By</p></div>
                <div><div style={{borderBottom:'1px solid black', height:'32px'}}></div><p style={{fontSize:'10px', marginTop:'8px'}}>Authorized Endorsement</p></div>
              </div>
              <div style={{background:'#0a2a5e', color:'white', textAlign:'center', padding:'8px', fontSize:'10px', marginTop:'32px'}}>DEARO INVESTMENT LIMITED (PVT) • www.dearoinvestment.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}