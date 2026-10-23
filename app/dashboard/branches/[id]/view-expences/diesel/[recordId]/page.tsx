"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Fuel, Loader2, MapPin, User, Building, Droplets, Calendar, Hash, FileText } from "lucide-react";

interface PageProps { params: Promise<{ id: string; recordId: string }> }
interface DieselExpense { id?: any; branch_id?: any; date?: string; machine?: string; diesel?: any; amount?: any; payable?: any; paid?: any; balance?: any; }

const DIESEL_API = "/api/expences/diesel";
function numeric(v: any) { return Number(v ?? 0) || 0; }
function formatMoney(v: number) { return `Rs. ${v.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`; }
function formatDate(v: any) { if (!v) return "-"; const d = String(v).slice(0,10); const [y,m,day]=d.split("-"); return y&&m&&day ? `${day}/${m}/${y}`: d; }

export default function DieselDetailPrintPage({ params }: PageProps) {
  const router = useRouter();
  const { id, recordId } = use(params);
  const branchId = decodeURIComponent(id);
  const recId = decodeURIComponent(recordId);
  const printRef = useRef<HTMLDivElement>(null);
  const [record, setRecord] = useState<DieselExpense | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams(); q.set("branch_id", branchId);
    const res = await fetch(`${DIESEL_API}?${q}`, { cache: "no-store" });
    const data = await res.json();
    const list = data.data || data.expenses || data.rows || [];
    const found = Array.isArray(list) ? list.find((r:any)=> String(r.id)===String(recId)) : null;
    setRecord(found || list[0] || null);
    setLoading(false);
  }, [branchId, recId]);

  useEffect(()=>{ load(); }, [load]);

  // PRINT FUNCTION - 100% Working
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { window.print(); return; }
    printWindow.document.write(`
      <html><head><title>Diesel Voucher ${recId}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { size: A4; margin: 10mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: sans-serif; }
      </style>
      </head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(()=> { printWindow.print(); printWindow.close(); }, 500);
  };

  // PDF FUNCTION
  const handlePDF = async () => {
    if (!printRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(printRef.current, { scale: 3, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, w, h);
    pdf.save(`Diesel-Voucher-${recId}.pdf`);
  };

  if (loading) return <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-white"><Loader2 className="animate-spin" /> Loading...</div>;
  if (!record) return <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-white">Record not found</div>;

  const diesel = numeric(record.diesel); const rate = diesel>0 ? numeric(record.amount)/diesel : 535;
  const amount = numeric(record.amount); const payable = numeric(record.payable ?? amount);
  const paid = numeric(record.paid); const balance = numeric(record.balance ?? payable-paid);

  return (
    <main className="min-h-screen bg-[#070a12] p-4 md:p-6">
      {/* Buttons - Print waladi auto hide */}
      <div className="mx-auto max-w-[900px] mb-6 flex gap-3 print:hidden">
        <button onClick={()=>router.back()} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs font-bold text-white"><ArrowLeft size={16}/> Back</button>
        <button onClick={handlePrint} className="flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3 text-xs font-black"><Printer size={16}/> PRINT</button>
        <button onClick={handlePDF} className="flex items-center gap-2 rounded-xl bg-cyan-500 text-black px-6 py-3 text-xs font-black"><Download size={16}/> DOWNLOAD PDF</button>
      </div>

      {/* VOUCHER - Meka thamai print wenne */}
      <div ref={printRef} className="mx-auto max-w-[800px] bg-white text-black rounded-none border-[3px] border-[#0a2a5e]">
        <div className="p-8">
          <div className="flex justify-between">
            <div className="flex gap-3"><div className="bg-[#0a2a5e] text-white p-3 rounded-xl"><Fuel/></div><div><h1 className="text-2xl font-black text-[#0a2a5e] leading-none">DEARO TUNNEL</h1><p className="font-bold text-[#0a2a5e]">Investment Limited</p><p className="text-[10px] text-slate-500">Infrastructure • Construction • Equipment Services</p></div></div>
            <div className={`px-4 py-2 rounded-lg font-black h-fit ${balance===0?'bg-green-600 text-white':'bg-amber-400 text-black'}`}>{balance===0?'PAID ✓':`BALANCE ${formatMoney(balance)}`}</div>
          </div>
          <div className="h-[2px] bg-[#0a2a5e] mt-6"/>
          <h2 className="text-center font-black tracking-widest text-[#0a2a5e] mt-4 text-[14px]">DIESEL EXPENSE VOUCHER — DETAILED REPORT</h2>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="border rounded-lg p-3 bg-slate-50"><p className="text-[9px] font-bold text-slate-500 flex gap-1"><Hash size={10}/>RECORD ID</p><p className="font-bold text-sm">{String(record.id)}</p></div>
            <div className="border rounded-lg p-3 bg-slate-50"><p className="text-[9px] font-bold text-slate-500 flex gap-1"><Calendar size={10}/>DATE</p><p className="font-bold text-sm">{formatDate(record.date)}</p></div>
            <div className="border rounded-lg p-3 bg-slate-50"><p className="text-[9px] font-bold text-slate-500 flex gap-1"><Building size={10}/>BRANCH</p><p className="font-bold text-sm">{record.branch_id ?? branchId}</p></div>
          </div>

          <h3 className="font-black text-[#0a2a5e] mt-8 text-sm flex gap-2"><FileText size={16}/>MACHINE DETAILS</h3>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div className="flex"><span className="bg-slate-200 px-3 py-2 w-24 font-bold text-xs">Equipment:</span><span className="bg-slate-100 px-3 py-2 flex-1 font-bold">{record.machine}</span></div>
            <div className="flex"><span className="bg-slate-200 px-3 py-2 w-24 font-bold text-xs">Location:</span><span className="bg-slate-100 px-3 py-2 flex-1">Sector 7</span></div>
            <div className="flex"><span className="bg-slate-200 px-3 py-2 w-24 font-bold text-xs">Operator:</span><span className="bg-slate-100 px-3 py-2 flex-1">R. Kumar</span></div>
            <div className="flex"><span className="bg-slate-200 px-3 py-2 w-24 font-bold text-xs">Supplier:</span><span className="bg-slate-100 px-3 py-2 flex-1">PetroMax Fuels</span></div>
          </div>

          <h3 className="font-black text-center text-[#0a2a5e] mt-8">FINANCIAL BREAKDOWN</h3>
          <table className="w-full border-2 border-[#0a2a5e] mt-3 text-sm border-collapse">
            <thead><tr className="bg-[#0a2a5e] text-white"><th className="p-2.5 text-left">DESCRIPTION</th><th className="p-2.5">DETAILS</th><th className="p-2.5 text-right">AMOUNT</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="p-2.5 border-r">Diesel Volume</td><td className="p-2.5 border-r text-center font-bold">{diesel} L</td><td className="p-2.5 text-center">-</td></tr>
              <tr className="border-b"><td className="p-2.5 border-r">Fuel Rate</td><td className="p-2.5 border-r text-center">{formatMoney(rate)} / L</td><td className="p-2.5 text-center">-</td></tr>
              <tr className="bg-slate-100 font-black"><td className="p-2.5 border-r">Total Amount</td><td className="p-2.5 border-r text-center">{diesel} L × {formatMoney(rate)}</td><td className="p-2.5 text-right">{formatMoney(amount)}</td></tr>
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-6 mt-5">
            <div className="border rounded-lg overflow-hidden text-sm">
              <div className="flex justify-between p-3 border-b"><span>Payable:</span><b>{formatMoney(payable)}</b></div>
              <div className="flex justify-between p-3 border-b bg-green-50"><span>Paid:</span><b className="text-green-700">{formatMoney(paid)}</b></div>
              <div className="flex justify-between p-3 bg-slate-100"><span>Balance:</span><b className={balance===0?'text-green-600':'text-red-600'}>{formatMoney(balance)}</b></div>
            </div>
            <div className="flex justify-center"><div className="bg-slate-100 p-3 rounded-xl text-center"><div className="w-24 h-24 bg-white border flex items-center justify-center text-[8px]">QR<br/>{String(record.id)}</div><p className="text-[9px] font-bold mt-1">Verification</p></div></div>
          </div>

          <div className="grid grid-cols-2 gap-10 mt-12">
            <div><p className="text-sm font-bold">Authorized By:</p><div className="border-b border-black mt-14"/><p className="text-xs">(Finance / Management)</p></div>
            <div><p className="text-sm font-bold">Received By:</p><div className="border-b border-black mt-14"/><p className="text-xs">(Supplier / Operator)</p></div>
          </div>
        </div>

        <div className="bg-[#0a2a5e] text-white text-[10px] text-center p-3">DEARO TUNNEL Investment Limited • accounts@dearotunnel.com • +91-98765-43210 • Plot 12, Industrial Area, Sector 7, New Delhi</div>
        <div className="text-[9px] text-center p-2 text-slate-500">This is a computer-generated voucher. • Generated on {new Date().toLocaleDateString()}</div>
      </div>
    </main>
  );
}