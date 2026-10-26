"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText, Printer, Download, Package, User, Calendar, DollarSign } from "lucide-react";

export default function SalesExpenseViewPage() {
  const params = useParams();
  const branchId = params?.id as string;
  const saleExpenseId = params?.saleExpenseId as string;
  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/expences/sales?branch_id=${branchId}`, { cache: "no-store" });
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const found = list.find((x: any) => String(x.id) === String(saleExpenseId));
        setExpense(found || null);
      } catch {} finally { setLoading(false); }
    };
    if (branchId && saleExpenseId) load();
  }, [branchId, saleExpenseId]);

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    if (!expense) return;
    setDownloading(true);
    try {
      // @ts-ignore - pure jspdf, no html2canvas -> 100% working on Vercel
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");

      doc.setFillColor(0,0,0); doc.rect(0,0,210,32,"F");
      doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(15);
      doc.text("SALES EXPENSE RECEIPT", 14, 14);
      doc.setFontSize(9); doc.setFont("helvetica","normal");
      doc.text(`BRANCH #${branchId} | EXP ID: ${expense.id} | DATE: ${String(expense.date).split("T")[0]}`, 14, 22);
      doc.text(`REF: EXP/${String(expense.id).padStart(6,'0')}`, 150, 14);

      let y = 45;
      doc.setTextColor(0,0,0); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text("EXPENSE DETAILS", 14, y); y+=6; doc.setDrawColor(0); doc.line(14,y,196,y); y+=8;

      doc.setFontSize(10); 
      const addRow = (label: string, value: string) => {
        doc.setFont("helvetica","bold"); doc.text(label, 14, y);
        doc.setFont("helvetica","normal"); doc.text(value, 60, y);
        y+=8;
      };

      addRow("Payee / Person:", String(expense.personName || "-"));
      addRow("Item / Product:", String(expense.item_name || "N/A"));
      addRow("Quantity:", String(expense.quantity || 1));
      addRow("Unit Price:", `LKR ${Number(expense.unit_price || 0).toFixed(2)}`);
      addRow("Date:", String(expense.date).split("T")[0]);
      y+=4; doc.line(14,y,196,y); y+=8;
      doc.setFont("helvetica","bold"); doc.setFontSize(12);
      doc.text(`Total Amount: LKR ${Number(expense.amount).toFixed(2)}`, 14, y);

      y+=15; doc.setFontSize(7); doc.setTextColor(100,100,100);
      doc.text(`System Generated - Dearo Investment | ${new Date().toLocaleString()}`, 14, y);
      y+=8; doc.line(14,y,70,y); doc.line(126,y,182,y); y+=4;
      doc.text("Branch Manager Signature", 14, y); doc.text("Finance Approval", 126, y);

      doc.save(`SALES-EXPENSE-${saleExpenseId}.pdf`);
    } catch(e){ console.error(e); alert("PDF failed"); } finally { setDownloading(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500"/></div>;
  if (!expense) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs"><p>Record not found</p><Link href={`/dashboard/branches/${branchId}/add-expenses/sales`} className="text-emerald-400 mt-2 underline">Back to Expenses</Link></div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-10 flex flex-col items-center font-mono text-xs text-slate-100">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6 no-print">
          <Link href={`/dashboard/branches/${branchId}/add-expenses/sales`} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"><ArrowLeft size={14}/> Back</Link>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center hover:bg-white hover:text-black"><Printer size={14}/></button>
            <button onClick={handlePDF} disabled={downloading} className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 font-black uppercase text-[10px] disabled:opacity-50">{downloading ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}{downloading ? "Downloading..." : "Download PDF"}</button>
          </div>
        </div>

        <div id="pdf-content" className="bg-white text-black rounded-2xl p-8 shadow-2xl border w-full">
          <div className="flex justify-between border-b-2 border-black pb-6 mb-6"><div><h1 className="text-lg font-black uppercase flex items-center gap-2"><FileText size={18}/> Sales Expense Receipt</h1><p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Branch #{branchId} | ID: {expense.id} | Date: {String(expense.date).split("T")[0]}</p></div><div className="text-right"><p className="text-[10px] font-black uppercase border border-black px-3 py-1 rounded-full">Verified</p><p className="text-[9px] mt-2">REF: EXP/{String(expense.id).padStart(6,'0')}</p></div></div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><User size={10}/> Payee</p><p className="font-black mt-1 uppercase text-sm">{expense.personName}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Package size={10}/> Item</p><p className="font-black mt-1">{expense.item_name || "N/A"}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Calendar size={10}/> Date</p><p className="font-black mt-1">{String(expense.date).split("T")[0]}</p></div>
          </div>

          <div className="rounded-xl overflow-hidden border border-black">
            <table className="w-full text-left"><tbody className="divide-y divide-slate-200">
              <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Quantity</td><td className="p-4 text-right font-bold">{expense.quantity || 1}</td></tr>
              <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Unit Price (LKR)</td><td className="p-4 text-right font-bold">LKR {Number(expense.unit_price || 0).toFixed(2)}</td></tr>
              <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Total Amount (LKR)</td><td className="p-4 text-right font-black text-base">LKR {Number(expense.amount || 0).toFixed(2)}</td></tr>
            </tbody></table>
          </div>

          <div className="mt-6 p-4 border border-dashed rounded-xl bg-slate-50"><p className="text-[10px] font-bold uppercase">Note</p><p className="text-[11px] text-slate-600 mt-1">{expense.quantity || 1} x LKR {Number(expense.unit_price || 0).toFixed(2)} = LKR {Number(expense.amount).toFixed(2)} | Payee: {expense.personName} | Branch #{branchId}</p></div>

          <div className="pt-12 grid grid-cols-2 gap-10 text-center mt-10"><div><div className="border-b border-black h-8 mb-2"></div><p className="text-[8px] uppercase tracking-widest font-bold">Branch Manager</p></div><div><div className="border-b border-black h-8 mb-2"></div><p className="text-[8px] uppercase tracking-widest font-bold">Finance Seal</p></div></div>
        </div>
      </div>
    </div>
  );
}