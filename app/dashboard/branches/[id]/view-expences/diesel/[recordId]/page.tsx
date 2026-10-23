"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Fuel, Loader2 } from "lucide-react";

interface PageProps { params: Promise<{ id: string; recordId: string }> }
interface DieselExpense { id?: any; branch_id?: any; date?: string; machine?: string; diesel?: any; amount?: any; payable?: any; paid?: any; balance?: any; }

const DIESEL_API = "/api/expences/diesel";

function numeric(v: any) { return Number(v ?? 0) || 0; }
function formatMoney(v: number) { return `Rs. ${v.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function formatDate(v: any) {
  if (!v) return "-";
  const d = String(v).slice(0, 10);
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
}

export default function DieselDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id, recordId } = use(params);
  const branchId = decodeURIComponent(id);
  const recId = decodeURIComponent(recordId);
  const printRef = useRef<HTMLDivElement>(null);
  const [record, setRecord] = useState<DieselExpense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecord = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const q = new URLSearchParams(); q.set("branch_id", branchId);
      const res = await fetch(`${DIESEL_API}?${q.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const list = data.data || data.expenses || data.rows || (Array.isArray(data) ? data : []);
      const found = Array.isArray(list) ? list.find((r: any) => String(r.id) === String(recId)) : null;
      if (!found) throw new Error(`Record ${recId} not found`);
      setRecord(found);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally { setLoading(false); }
  }, [branchId, recId]);

  useEffect(() => { loadRecord(); }, [loadRecord]);

  // PRINT - Aluth window eke witharak voucher eka print wenawa
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) { window.print(); return; }
    win.document.write(`
      <html>
        <head>
          <title>Diesel Voucher ${recId}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4; margin: 12mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: sans-serif; }
          </style>
        </head>
        <body class="bg-white">${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 700);
  };

  // PDF DOWNLOAD
  const handlePDF = async () => {
    if (!printRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(printRef.current, { scale: 2.5, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`Diesel-Voucher-${recId}.pdf`);
    } catch {
      alert("PDF failed, please use Print");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#070a12] flex items-center justify-center gap-2 text-white"><Loader2 className="animate-spin" /> Loading...</div>;
  if (error || !record) return <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center gap-3 text-white"><p className="text-red-400">{error || "Not found"}</p><button onClick={() => router.back()} className="rounded-lg border px-4 py-2">Go Back</button></div>;

  const diesel = numeric(record.diesel);
  const amount = numeric(record.amount);
  const rate = diesel > 0 ? amount / diesel : 535;
  const payable = numeric(record.payable ?? amount);
  const paid = numeric(record.paid);
  const balance = numeric(record.balance ?? payable - paid);

  return (
    <main className="min-h-screen bg-[#070a12] p-4 md:p-6 lg:p-8">
      {/* Buttons - print waladi hide */}
      <div className="mx-auto max-w-[850px] mb-6 flex flex-wrap gap-3 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs font-bold text-slate-300 hover:text-white"><ArrowLeft size={16} /> Back</button>
        <button onClick={handlePrint} className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black text-black hover:bg-slate-100"><Printer size={16} /> PRINT</button>
        <button onClick={handlePDF} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-xs font-black tracking-wider text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"><Download size={16} /> DOWNLOAD PDF</button>
      </div>

      {/* VOUCHER - Meka thamai print wenne */}
      <div ref={printRef} className="mx-auto max-w-[800px] bg-white text-black rounded-none border-[3px] border-[#0a2a5e] shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="h-14 w-14 rounded-xl bg-[#0a2a5e] flex items-center justify-center text-white"><Fuel size={28} /></div>
              <div>
                <h1 className="text-[22px] font-black leading-none text-[#0a2a5e]">DEARO TUNNEL</h1>
                <p className="text-[13px] font-bold tracking-widest text-[#0a2a5e]">Investment Limited</p>
                <p className="text-[10px] text-slate-500 mt-1">Infrastructure • Construction • Equipment Services</p>
              </div>
            </div>
            <div className={`px-5 py-2.5 rounded-lg font-black text-sm ${balance === 0 ? "bg-green-600 text-white" : "bg-amber-400 text-black"}`}>{balance === 0 ? "PAID ✓" : `BALANCE ${formatMoney(balance)}`}</div>
          </div>

          <div className="h-[2px] bg-[#0a2a5e] mt-6" />
          <h2 className="text-center font-black text-[#0a2a5e] mt-4 text-[13px] tracking-[0.15em] uppercase">Diesel Expense Voucher — Detailed Report</h2>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="border rounded-xl p-3.5 bg-slate-50"><p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Record ID</p><p className="font-bold text-[13px] mt-1">{String(record.id)}</p></div>
            <div className="border rounded-xl p-3.5 bg-slate-50"><p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Date</p><p className="font-bold text-[13px] mt-1">{formatDate(record.date)}</p></div>
            <div className="border rounded-xl p-3.5 bg-slate-50"><p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Branch ID</p><p className="font-bold text-[13px] mt-1">{String(record.branch_id ?? branchId)}</p></div>
          </div>

          <h3 className="font-black text-[#0a2a5e] mt-8 text-[12px] uppercase tracking-wider border-b-2 border-[#0a2a5e] pb-1 w-fit">Machine Details</h3>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[13px]">
            <div className="flex"><span className="bg-slate-200 px-3 py-2.5 w-28 font-bold text-[11px]">Equipment:</span><span className="bg-slate-100 flex-1 px-3 py-2.5 font-bold">{record.machine || "-"}</span></div>
            <div className="flex"><span className="bg-slate-200 px-3 py-2.5 w-28 font-bold text-[11px]">Location:</span><span className="bg-slate-100 flex-1 px-3 py-2.5">Sector 7</span></div>
            <div className="flex"><span className="bg-slate-200 px-3 py-2.5 w-28 font-bold text-[11px]">Operator:</span><span className="bg-slate-100 flex-1 px-3 py-2.5">R. Kumar</span></div>
            <div className="flex"><span className="bg-slate-200 px-3 py-2.5 w-28 font-bold text-[11px]">Supplier:</span><span className="bg-slate-100 flex-1 px-3 py-2.5">PetroMax Fuels</span></div>
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

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="border-2 rounded-xl overflow-hidden text-[13px]">
              <div className="flex justify-between p-3 border-b"><span>Payable:</span><b>{formatMoney(payable)}</b></div>
              <div className="flex justify-between p-3 border-b bg-green-50"><span>Paid:</span><b className="text-green-700">{formatMoney(paid)}</b></div>
              <div className="flex justify-between p-3 bg-slate-100 font-black"><span>Balance:</span><b className={balance === 0 ? "text-green-600" : "text-red-600"}>{formatMoney(balance)}</b></div>
            </div>
            <div className="flex justify-center items-center"><div className="bg-slate-100 p-4 rounded-xl text-center"><div className="w-24 h-24 bg-white border flex items-center justify-center text-[9px] font-bold">QR<br/>{String(record.id)}<br/>Verify</div><p className="text-[9px] font-bold mt-2">Verification & Records</p></div></div>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-12">
            <div><p className="text-[13px] font-bold">Authorized By:</p><div className="border-b border-black mt-14" /><p className="text-[11px] mt-2">(Finance / Management)</p><p className="text-[11px]">Date: ___________</p></div>
            <div><p className="text-[13px] font-bold">Received By:</p><div className="border-b border-black mt-14" /><p className="text-[11px] mt-2">(Supplier / Operator)</p><p className="text-[11px]">Date: ___________</p></div>
          </div>
        </div>

        <div className="bg-[#0a2a5e] text-white text-center p-3 text-[10px]">DEARO TUNNEL Investment Limited • Email: accounts@dearotunnel.com • Phone: +91-98765-43210 • www.dearotunnel.com</div>
        <div className="text-center text-[9px] text-slate-500 p-2">This is a computer-generated voucher. No signature required if digitally authorized. • Generated on {new Date().toLocaleDateString()}</div>
      </div>
    </main>
  );
}