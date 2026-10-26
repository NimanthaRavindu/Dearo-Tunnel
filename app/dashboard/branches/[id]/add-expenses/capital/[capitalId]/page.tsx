"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText, Printer, Download, User, Calendar, DollarSign } from "lucide-react";

export default function CapitalViewPage() {
  const params = useParams();
  const branchId = params?.id as string;
  const capitalId = params?.capitalId as string;
  const [capital, setCapital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/expences/capital?branchId=${branchId}`, { cache: "no-store" });
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const found = list.find((x: any) => String(x.id) === String(capitalId));
        setCapital(found || null);
      } catch {} finally { setLoading(false); }
    };
    if (branchId && capitalId) load();
  }, [branchId, capitalId]);

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    if (!capital) return;
    setDownloading(true);
    try {
      // @ts-ignore - pure jspdf only - Vercel eke 100% working
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");

      doc.setFillColor(0,0,0); doc.rect(0,0,210,32,"F");
      doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(15);
      doc.text("CAPITAL EXPENSE RECEIPT", 14, 15);
      doc.setFontSize(9); doc.setFont("helvetica","normal");
      doc.text(`BRANCH #${branchId} | ID: ${capital.id} | DATE: ${String(capital.date).split("T")[0]}`, 14, 23);
      doc.setTextColor(0,0,0);

      let y = 45;
      doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text("CAPITAL DETAILS", 14, y);
      y+=5; doc.line(14,y,196,y); y+=10;

      doc.setFontSize(10);
      const addRow = (label: string, value: string) => {
        doc.setFont("helvetica","bold"); doc.text(label, 14, y);
        doc.setFont("helvetica","normal"); doc.text(value, 55, y);
        y+=9;
      };

      addRow("Person:", String(capital.personName || "-"));
      addRow("Date:", String(capital.date).split("T")[0]);
      addRow("Amount:", `LKR ${Number(capital.amount).toFixed(2)}`);
      y+=2;
      doc.setFont("helvetica","bold"); doc.text("Description:", 14, y); y+=6;
      doc.setFont("helvetica","normal"); 
      const desc = doc.splitTextToSize(String(capital.description || "No description provided"), 170);
      doc.text(desc, 14, y);
      y += desc.length * 5 + 10;

      doc.line(14,y,196,y); y+=10;
      doc.setFont("helvetica","bold"); doc.setFontSize(13);
      doc.text(`Total Capital: LKR ${Number(capital.amount).toFixed(2)}`, 14, y);

      y+=20;
      doc.setFontSize(8); doc.setTextColor(100,100,100);
      doc.text(`System Generated - Dearo Investment | ${new Date().toLocaleString()}`, 14, y);
      y+=10;
      doc.setDrawColor(0); doc.line(14,y,70,y); doc.line(126,y,182,y); y+=5;
      doc.setTextColor(0,0,0); doc.text("Branch Manager", 14, y); doc.text("Finance Approval", 126, y);

      doc.save(`CAPITAL-${capitalId}.pdf`);
    } catch(e){ console.error(e); alert("PDF failed"); } finally { setDownloading(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#080d1a] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500"/></div>;
  if (!capital) return <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center text-slate-400 font-mono text-xs"><p>Record not found</p><Link href={`/dashboard/branches/${branchId}/add-expenses/capital`} className="text-emerald-400 mt-2 underline">Back</Link></div>;

  return (
    <div className="min-h-screen bg-[#080d1a] p-6 sm:p-10 flex flex-col items-center font-mono text-xs text-slate-100">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6 no-print">
          <Link href={`/dashboard/branches/${branchId}/add-expenses/capital`} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"><ArrowLeft size={14}/> Back</Link>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center hover:bg-white hover:text-black"><Printer size={14}/></button>
            <button onClick={handlePDF} disabled={downloading} className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 font-black uppercase text-[10px] disabled:opacity-50">{downloading ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}{downloading ? "Downloading..." : "Download PDF"}</button>
          </div>
        </div>

        <div id="pdf-content" className="bg-white text-black rounded-2xl p-8 shadow-2xl border w-full">
          <div className="flex justify-between border-b-2 border-black pb-6 mb-6"><div><h1 className="text-lg font-black uppercase flex items-center gap-2"><FileText size={18}/> Capital Expense Receipt</h1><p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Branch #{branchId} | ID: {capital.id} | Date: {String(capital.date).split("T")[0]}</p></div><div className="text-right"><p className="text-[10px] font-black uppercase border border-black px-3 py-1 rounded-full">Verified Capital</p><p className="text-[9px] mt-2">REF: CAP/{String(capital.id).padStart(6,'0')}</p></div></div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><User size={10}/> Person</p><p className="font-black mt-1 uppercase text-sm">{capital.personName}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Calendar size={10}/> Date</p><p className="font-black mt-1">{String(capital.date).split("T")[0]}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><DollarSign size={10}/> Amount</p><p className="font-black mt-1 text-base text-emerald-600">LKR {Number(capital.amount).toFixed(2)}</p></div>
          </div>

          <div className="rounded-xl border border-black overflow-hidden">
            <div className="p-4 bg-slate-50 border-b"><p className="text-[10px] font-bold uppercase">Description / Asset Details</p><p className="text-[13px] mt-2 leading-relaxed">{capital.description || "No description provided"}</p></div>
            <table className="w-full text-left"><tbody><tr className="bg-black text-white"><td className="p-4 uppercase text-[11px] font-black tracking-widest">Total Capital Investment</td><td className="p-4 text-right font-black text-lg">LKR {Number(capital.amount).toFixed(2)}</td></tr></tbody></table>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-10 text-center mt-10"><div><div className="border-b border-black h-8 mb-2"></div><p className="text-[8px] uppercase tracking-widest font-bold">Branch Manager Signature</p></div><div><div className="border-b border-black h-8 mb-2"></div><p className="text-[8px] uppercase tracking-widest font-bold">Finance Approval</p></div></div>
          <div className="mt-8 pt-4 border-t text-[8px] text-slate-400 flex justify-between uppercase font-bold"><span>System Generated - Dearo Investment</span><span>{new Date().toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );
}