"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText, Calendar, Tag, Hash, DollarSign, Printer, Download } from "lucide-react";

export default function SaleViewPage() {
  const params = useParams();
  const branchId = params?.id as string;
  const saleId = params?.saleId as string;
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/expences/sales-incomes?branch_id=${branchId}`, { cache: "no-store" });
        const json = await res.json();
        const found = json.data?.find((x: any) => String(x.id) === String(saleId));
        setSale(found || null);
      } catch {
        setSale(null);
      } finally {
        setLoading(false);
      }
    };
    if (branchId && saleId) load();
  }, [branchId, saleId]);

  const handlePrint = () => {
    window.print();
  };

  const handlePDF = async () => {
    try {
      setDownloading(true);
      const el = document.getElementById("receipt-card");
      if (!el) return;

      // @ts-ignore - dynamic import, no type error
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;

      // @ts-ignore - fix for jspdf path error
      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.jsPDF;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d1527",
      } as any);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SALES-${saleId}.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <Loader2 className="animate-spin text-red-500" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
        <p>Record not found</p>
        <Link href={`/dashboard/branches/${branchId}/add-expenses/sales_incomes`} className="text-red-400 mt-2 underline">Back to Ledger</Link>
      </div>
    );
  }

  const balance = Number(sale.amount) - Number(sale.credit);

  return (
    <div className="min-h-screen bg-[#070a12] p-6 sm:p-10 flex flex-col items-center font-mono text-xs text-slate-100">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6 print:hidden">
          <Link href={`/dashboard/branches/${branchId}/add-expenses/sales_incomes`} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center hover:bg-white hover:text-black transition-all">
              <Printer size={14} />
            </button>
            <button onClick={handlePDF} disabled={downloading} className="h-10 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-wider disabled:opacity-50">
              {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} {downloading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div id="receipt-card" className="bg-[#0d1527]/60 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-between border-b border-slate-800 pb-6 mb-6">
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><FileText size={14} className="text-red-400" /> Sales Income Summary</h1>
              <p className="text-[10px] text-slate-500 mt-1">BRANCH #{branchId} | ID: {sale.id} | REF: SALE/{String(sale.id).padStart(6, '0')}</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-green-950/40 border border-green-500/40 text-green-400 rounded-full text-[9px] font-black uppercase">Verified</span>
              <p className="text-[10px] text-slate-500 mt-2">{sale.date?.slice(0, 10)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800"><p className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><FileText size={10} /> Name</p><p className="font-black mt-1 text-slate-200">{sale.name}</p></div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800"><p className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><Calendar size={10} /> Date</p><p className="font-black mt-1 text-slate-200">{sale.date?.slice(0, 10)}</p></div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800"><p className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><DollarSign size={10} /> Total Amount</p><p className="font-black mt-1 text-red-400 text-base">LKR {Number(sale.amount).toFixed(2)}</p></div>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-800">
                <tr className="bg-slate-900/30"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold"><Tag size={10} className="inline mr-1" /> Unit Price (LKR)</td><td className="p-4 text-right font-bold">LKR {Number(sale.unit_price).toFixed(2)}</td></tr>
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold"><Hash size={10} className="inline mr-1" /> Quantity</td><td className="p-4 text-right font-bold">{Number(sale.quantity)}</td></tr>
                <tr className="bg-slate-900/30"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Amount (Unit x Qty)</td><td className="p-4 text-right font-black text-red-400">LKR {Number(sale.amount).toFixed(2)}</td></tr>
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Credit (LKR)</td><td className="p-4 text-right font-black text-amber-400">LKR {Number(sale.credit).toFixed(2)}</td></tr>
                <tr className="bg-red-950/20 border-t border-red-500/20"><td className="p-4 text-red-300 uppercase text-[10px] font-black tracking-widest">Net Balance (Amount - Credit)</td><td className="p-4 text-right font-black text-lg text-red-400">LKR {balance.toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 border border-dashed border-slate-700 bg-slate-900/20 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold">System Note</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Calculation: {sale.unit_price} x {sale.quantity} = {sale.amount}. Net Balance = {sale.amount} - {sale.credit} = {balance}. System generated record for Branch {branchId}.</p>
          </div>

          <div className="pt-14 grid grid-cols-2 gap-10 text-center opacity-60">
            <div><div className="border-b border-slate-700 h-8 mb-2"></div><p className="text-[8px] uppercase tracking-widest text-slate-500">Branch Manager Signature</p></div>
            <div><div className="border-b border-slate-700 h-8 mb-2"></div><p className="text-[8px] uppercase tracking-widest text-slate-500">System Seal</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}