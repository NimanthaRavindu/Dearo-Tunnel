"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Fuel, Loader2 } from "lucide-react";

interface PageProps { params: Promise<{ id: string; recordId: string }> }
const DIESEL_API = "/api/expences/diesel";

function numeric(v: any) { return Number(v ?? 0) || 0; }
function formatMoney(v: number) { return `Rs. ${v.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`; }
function formatDate(v: any) {
  const d = String(v).slice(0, 10);
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
}

export default function DieselDetailPage({ params }: PageProps) {
  const { id, recordId } = use(params);
  const branchId = decodeURIComponent(id);
  const recId = decodeURIComponent(recordId);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecord = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams(); q.set("branch_id", branchId);
      const res = await fetch(`${DIESEL_API}?${q.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const list = data.data || data.expenses || data.rows || (Array.isArray(data) ? data : []);
      const found = Array.isArray(list) ? list.find((r: any) => String(r.id) === String(recId)) : null;
      if (!found) throw new Error(`Record ${recId} not found`);
      setRecord(found);
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally { setLoading(false); }
  }, [branchId, recId]);

  useEffect(() => { loadRecord(); }, [loadRecord]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) { window.print(); return; }
    win.document.write(`<html><head><title>Voucher ${recId}</title><script src="https://cdn.tailwindcss.com"></script><style>@page{size:A4;margin:10mm}body{-webkit-print-color-adjust:exact}</style></head><body>${content.innerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  const handlePDF = async () => {
    if (!record) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const diesel = numeric(record.diesel);
      const amount = numeric(record.amount);
      const rate = diesel > 0 ? amount / diesel : 535;
      const payable = numeric(record.payable ?? amount);
      const paid = numeric(record.paid);
      const balance = payable - paid;

      doc.setFillColor(10, 42, 94);
      doc.rect(0, 0, 210, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17); doc.setFont("helvetica", "bold");
      doc.text("DEARO INVESTMENT LIMITED (PVT)", 15, 14);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text("Infrastructure • Construction • Equipment Services", 15, 20);
      doc.text("DIESEL EXPENSE VOUCHER — DETAILED REPORT", 15, 27);

      doc.setFillColor(balance === 0 ? 22 : 251, balance === 0 ? 163 : 191, balance === 0 ? 74 : 36);
      doc.roundedRect(150, 8, 45, 10, 2, 2, "F");
      doc.setTextColor(0,0,0); if(balance===0) doc.setTextColor(255,255,255);
      doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(balance===0 ? "PAID" : `BALANCE ${formatMoney(balance)}`, 152, 14.5);

      doc.setTextColor(0,0,0); let y = 42;
      doc.setFontSize(10); doc.setFont("helvetica","normal");
      doc.text(`Record ID: ${record.id}`, 15, y);
      doc.text(`Date: ${formatDate(record.date)}`, 80, y);
      doc.text(`Branch ID: ${record.branch_id ?? branchId}`, 145, y); y+=10;

      doc.setFont("helvetica","bold"); doc.setFontSize(11);
      doc.text("MACHINE DETAILS", 15, y); y+=6;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      doc.setFillColor(240,240,240); doc.rect(15, y, 180, 10, "F");
      doc.text(`Equipment / Machine:  ${record.machine || "-"}`, 18, y+6); y+=16;

      doc.setFont("helvetica","bold"); doc.setFontSize(11);
      doc.text("FINANCIAL BREAKDOWN", 15, y); y+=4;
      doc.setFillColor(10,42,94); doc.rect(15, y, 180, 10, "F");
      doc.setTextColor(255,255,255); doc.setFontSize(9);
      doc.text("DESCRIPTION", 17, y+6); doc.text("DETAILS", 90, y+6); doc.text("AMOUNT", 155, y+6);
      y+=10; doc.setTextColor(0,0,0);

      const rows = [
        ["Diesel Volume", `${diesel} L`, "-"],
        ["Fuel Rate", `${formatMoney(rate)} / L`, "-"],
        ["Total Amount", `${diesel} L x ${formatMoney(rate)}`, formatMoney(amount)],
      ];
      rows.forEach((row, i) => {
        if(i===2) doc.setFillColor(230,230,230); else doc.setFillColor(255,255,255);
        doc.rect(15, y, 180, 10, "F"); doc.rect(15, y, 180, 10);
        doc.text(row[0], 17, y+6); doc.text(row[1], 90, y+6); doc.text(row[2], 155, y+6); y+=10;
      });

      y+=4; doc.text(`Payable: ${formatMoney(payable)}`, 15, y); y+=7;
      doc.text(`Paid: ${formatMoney(paid)}`, 15, y); y+=7;
      doc.setFont("helvetica","bold"); doc.text(`Balance: ${formatMoney(balance)}`, 15, y); y+=15;

      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      doc.text("Authorized By:", 15, y); doc.text("Received By:", 120, y); y+=2;
      doc.line(15, y+12, 80, y+12); doc.line(120, y+12, 185, y+12);
      doc.setFontSize(8); doc.text("(Finance / Management)", 15, y+16); doc.text("(Receiver)", 120, y+16);

      doc.setFillColor(10,42,94); doc.rect(0, 285, 210, 12, "F");
      doc.setTextColor(255,255,255); doc.setFontSize(8);
      doc.text("DEARO INVESTMENT LIMITED (PVT) • accounts@dearoinvestment.com • www.dearoinvestment.com", 20, 292);

      doc.save(`Diesel-Voucher-${recId}.pdf`);
    } catch {
      alert("PDF error. Please try Print > Save as PDF");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#070a12] flex items-center justify-center gap-2 text-white"><Loader2 className="animate-spin" /> Loading...</div>;
  if (error || !record) return <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center gap-3 text-white"><p className="text-red-400">{error}</p><button onClick={() => router.back()} className="rounded-lg border px-4 py-2">Back</button></div>;

  const diesel = numeric(record.diesel); const amount = numeric(record.amount);
  const rate = diesel > 0 ? amount / diesel : 535; const payable = numeric(record.payable ?? amount);
  const paid = numeric(record.paid); const balance = payable - paid;

  return (
    <main className="min-h-screen bg-[#070a12] p-4 md:p-6">
      <div className="mx-auto max-w-[850px] mb-6 flex gap-3 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs font-bold text-white"><ArrowLeft size={16} /> Back</button>
        <button onClick={handlePrint} className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black text-black"><Printer size={16} /> PRINT</button>
        <button onClick={handlePDF} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-xs font-black text-black"><Download size={16} /> DOWNLOAD PDF</button>
      </div>

      <div ref={printRef} className="mx-auto max-w-[800px] bg-white text-black border-[3px] border-[#0a2a5e] overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between">
            <div className="flex gap-3">
              <div className="bg-[#0a2a5e] text-white p-3 rounded-xl"><Fuel /></div>
              <div>
                <h1 className="text-[20px] font-black leading-none text-[#0a2a5e]">DEARO INVESTMENT</h1>
                <p className="font-black text-[#0a2a5e] text-[12px] tracking-widest">LIMITED (PVT)</p>
                <p className="text-[10px] text-slate-500 mt-1">Infrastructure • Construction • Equipment Services</p>
              </div>
            </div>
            <div className={`px-5 py-2.5 rounded-lg font-black text-sm h-fit ${balance === 0 ? "bg-green-600 text-white" : "bg-amber-400 text-black"}`}>{balance === 0 ? "PAID ✓" : `BALANCE ${formatMoney(balance)}`}</div>
          </div>
          <div className="h-[2px] bg-[#0a2a5e] mt-6" />
          <h2 className="text-center font-black text-[#0a2a5e] mt-4 text-[13px] tracking-widest">DIESEL EXPENSE VOUCHER — DETAILED REPORT</h2>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="border rounded-xl p-3.5 bg-slate-50"><p className="text-[9px] font-bold text-slate-500">RECORD ID</p><p className="font-bold text-[13px] mt-1">{String(record.id)}</p></div>
            <div className="border rounded-xl p-3.5 bg-slate-50"><p className="text-[9px] font-bold text-slate-500">DATE</p><p className="font-bold text-[13px] mt-1">{formatDate(record.date)}</p></div>
            <div className="border rounded-xl p-3.5 bg-slate-50"><p className="text-[9px] font-bold text-slate-500">BRANCH ID</p><p className="font-bold text-[13px] mt-1">{String(record.branch_id ?? branchId)}</p></div>
          </div>

          <h3 className="font-black text-[#0a2a5e] mt-8 text-[12px] uppercase tracking-wider border-b-2 border-[#0a2a5e] pb-1 w-fit">Machine Details</h3>
          <div className="mt-4 text-[13px]">
            <div className="flex"><span className="bg-slate-200 px-4 py-3 w-36 font-bold text-[11px] uppercase">Equipment:</span><span className="bg-slate-100 flex-1 px-4 py-3 font-bold">{record.machine || "-"}</span></div>
          </div>

          <h3 className="font-black text-center text-[#0a2a5e] mt-8 text-[12px] uppercase tracking-widest">Financial Breakdown</h3>
          <table className="w-full mt-4 border-collapse border-2 border-[#0a2a5e] text-[13px]">
            <thead><tr className="bg-[#0a2a5e] text-white"><th className="p-3 text-left">DESCRIPTION</th><th className="p-3 text-center">DETAILS</th><th className="p-3 text-right">AMOUNT</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="p-3 border-r">Diesel Volume</td><td className="p-3 border-r text-center font-bold">{diesel} L</td><td className="p-3 text-center">-</td></tr>
              <tr className="border-b"><td className="p-3 border-r">Fuel Rate</td><td className="p-3 border-r text-center">{formatMoney(rate)} / L</td><td className="p-3 text-center">-</td></tr>
              <tr className="bg-slate-100 font-black"><td className="p-3 border-r">Total Amount</td><td className="p-3 border-r text-center">{diesel} L × {formatMoney(rate)}</td><td className="p-3 text-right">{formatMoney(amount)}</td></tr>
            </tbody>
          </table>

          <div className="border-2 rounded-xl overflow-hidden text-[13px] mt-6 max-w-[300px]">
            <div className="flex justify-between p-3 border-b"><span>Payable:</span><b>{formatMoney(payable)}</b></div>
            <div className="flex justify-between p-3 border-b bg-green-50"><span>Paid:</span><b className="text-green-700">{formatMoney(paid)}</b></div>
            <div className="flex justify-between p-3 bg-slate-100 font-black"><span>Balance:</span><b className={balance === 0 ? "text-green-600" : "text-red-600"}>{formatMoney(balance)}</b></div>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-12">
            <div><p className="text-[13px] font-bold">Authorized By:</p><div className="border-b border-black mt-14" /><p className="text-[11px] mt-2">(Finance / Management)</p></div>
            <div><p className="text-[13px] font-bold">Received By:</p><div className="border-b border-black mt-14" /><p className="text-[11px] mt-2">(Receiver)</p></div>
          </div>
        </div>
        <div className="bg-[#0a2a5e] text-white text-center p-3 text-[10px]">DEARO INVESTMENT LIMITED (PVT) • www.dearoinvestment.com</div>
      </div>
    </main>
  );
}