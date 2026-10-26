"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText, Printer, Download, Fuel, Calendar, Droplets } from "lucide-react";

export default function DieselDetailPage() {
  const params = useParams();
  const branchId = Array.isArray(params?.id) ? params.id[0] : String(params?.id || "");
  const dieselId = params?.dieselId as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}`, { cache: "no-store" });
        const data = await res.json();
        const list = data.expenses || data.data || data || [];
        const found = list.find((x: any) => String(x.id) === String(dieselId));
        setItem(found || null);
      } catch {} finally { setLoading(false); }
    };
    if (branchId && dieselId) load();
  }, [branchId, dieselId]);

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    if (!item) return;
    setDownloading(true);
    try {
      // @ts-ignore - pure jspdf only -> 100% working on Vercel
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const balance = Number(item.payable) - Number(item.paid);

      doc.setFillColor(0,0,0); doc.rect(0,0,210,32,"F");
      doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(15);
      doc.text("DIESEL EXPENSE RECEIPT", 14, 15);
      doc.setFontSize(9); doc.setFont("helvetica","normal");
      doc.text(`BRANCH #${branchId} | ID: ${item.id} | DATE: ${String(item.date).slice(0,10)}`, 14, 23);

      let y = 45;
      doc.setTextColor(0,0,0); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text("DIESEL DETAILS", 14, y); y+=5; doc.line(14,y,196,y); y+=10;

      doc.setFontSize(10);
      const addRow = (label: string, value: string) => {
        doc.setFont("helvetica","bold"); doc.text(label, 14, y);
        doc.setFont("helvetica","normal"); doc.text(value, 55, y);
        y+=9;
      };

      addRow("Machine:", String(item.machine || "-"));
      addRow("Date:", String(item.date).slice(0,10));
      addRow("Diesel Qty:", `${Number(item.diesel).toFixed(2)} L`);
      addRow("Payable:", `Rs. ${Number(item.payable).toFixed(2)}`);
      addRow("Paid:", `Rs. ${Number(item.paid).toFixed(2)}`);
      addRow("Balance:", `Rs. ${balance.toFixed(2)}`);

      y+=8; doc.line(14,y,196,y); y+=10;
      doc.setFont("helvetica","bold"); doc.setFontSize(13);
      doc.text(`Total: ${Number(item.diesel).toFixed(2)} L | Payable Rs. ${Number(item.payable).toFixed(2)}`, 14, y);

      y+=20; doc.setFontSize(8); doc.setTextColor(100,100,100);
      doc.text(`System Generated - Dearo Investment | ${new Date().toLocaleString()}`, 14, y);
      y+=10; doc.setDrawColor(0); doc.line(14,y,70,y); doc.line(126,y,182,y); y+=5;
      doc.setTextColor(0,0,0); doc.text("Branch Manager", 14, y); doc.text("Finance Seal", 126, y);

      doc.save(`DIESEL-${dieselId}.pdf`);
    } catch(e){ console.error(e); alert("PDF failed"); } finally { setDownloading(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400"/></div>;
  if (!item) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs"><p>Record not found</p><Link href={`/dashboard/branches/${branchId}/add-expenses/diesel`} className="text-cyan-400 mt-2 underline">Back</Link></div>;

  const balance = Number(item.payable) - Number(item.paid);

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-10 flex flex-col items-center font-mono text-xs text-slate-100">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6 no-print">
          <Link href={`/dashboard/branches/${branchId}/add-expenses/diesel`} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"><ArrowLeft size={14}/> Back</Link>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center hover:bg-white hover:text-black"><Printer size={14}/></button>
            <button onClick={handlePDF} disabled={downloading} className="h-10 px-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl flex items-center gap-2 font-black uppercase text-[10px] disabled:opacity-50">{downloading ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}{downloading ? "Downloading..." : "Download PDF"}</button>
          </div>
        </div>

        <div id="pdf-content" className="bg-white text-black rounded-2xl p-8 shadow-2xl border w-full">
          <div className="flex justify-between border-b-2 border-black pb-6 mb-6"><div><h1 className="text-lg font-black uppercase flex items-center gap-2"><Fuel size={18}/> Diesel Expense Receipt</h1><p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Branch #{branchId} | ID: {item.id} | Date: {String(item.date).slice(0,10)}</p></div><div className="text-right"><p className="text-[10px] font-black uppercase border border-black px-3 py-1 rounded-full">Verified Diesel</p><p className="text-[9px] mt-2">REF: DSL/{String(item.id).padStart(6,'0')}</p></div></div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Fuel size={10}/> Machine</p><p className="font-black mt-1 uppercase text-sm">{item.machine}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Calendar size={10}/> Date</p><p className="font-black mt-1">{String(item.date).slice(0,10)}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Droplets size={10}/> Diesel</p><p className="font-black mt-1 text-base">{Number(item.diesel).toFixed(2)} L</p></div>
          </div>

          <div className="rounded-xl overflow-hidden border border-black">
            <table className="w-full text-left"><tbody className="divide-y divide-slate-200">
              <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Diesel Qty</td><td className="p-4 text-right font-bold">{Number(item.diesel).toFixed(2)} L</td></tr>
              <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Payable Amount</td><td className="p-4 text-right font-bold">Rs. {Number(item.payable).toFixed(2)}</td></tr>
              <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Paid Amount</td><td className="p-4 text-right font-bold">Rs. {Number(item.paid).toFixed(2)}</td></tr>
              <tr className="bg-black text-white"><td className="p-4 uppercase text-[11px] font-black">Balance (Payable - Paid)</td><td className="p-4 text-right font-black text-lg">Rs. {balance.toFixed(2)}</td></tr>
            </tbody></table>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-10 text-center mt-10"><div><div className="border-b border-black h-8 mb-2"></div><p className="text-[8px] uppercase tracking-widest font-bold">Branch Manager Signature</p></div><div><div className="border-b border-black h-8 mb-2"></div><p className="text-[8px] uppercase tracking-widest font-bold">Finance Approval</p></div></div>
        </div>
      </div>
    </div>
  );
}