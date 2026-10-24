"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText, Printer, Download } from "lucide-react";

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
      } catch {} finally { setLoading(false); }
    };
    if (branchId && saleId) load();
  }, [branchId, saleId]);

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    if (!sale) return;
    setDownloading(true);
    try {
      // @ts-ignore - no more html2canvas, only jspdf
      const jspdfMod = await import("jspdf");
      const jsPDF = jspdfMod.jsPDF;
      const doc = new jsPDF("p", "mm", "a4");

      const balance = Number(sale.amount) - Number(sale.credit);

      // Header
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("SALES INCOME RECEIPT", 14, 14);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`BRANCH #${branchId} | ID: ${sale.id} | DATE: ${String(sale.date).slice(0,10)}`, 14, 22);

      // Verified
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text(`REF: SALE/${String(sale.id).padStart(6,'0')} | VERIFIED`, 140, 14);

      let y = 40;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("PRODUCT NAME:", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(sale.name).toUpperCase(), 50, y);
      
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.text("DATE:", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(sale.date).slice(0,10), 50, y);

      y += 8;
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL AMOUNT:", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(`LKR ${Number(sale.amount).toFixed(2)}`, 50, y);

      y += 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TRANSACTION BREAKDOWN", 14, y);
      y += 5;
      doc.line(14, y, 196, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const rows = [
        ["Unit Price (LKR)", `LKR ${Number(sale.unit_price).toFixed(2)}`],
        ["Quantity", `${Number(sale.quantity)}`],
        ["Amount (Unit x Qty)", `LKR ${Number(sale.amount).toFixed(2)}`],
        ["Credit (LKR)", `LKR ${Number(sale.credit).toFixed(2)}`],
        ["Net Balance (Amount - Credit)", `LKR ${balance.toFixed(2)}`],
      ];

      rows.forEach((row, i) => {
        const isLast = i === rows.length - 1;
        if (isLast) {
          doc.setFillColor(0, 0, 0);
          doc.rect(14, y - 6, 182, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
          if (i % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(14, y - 6, 182, 10, "F");
          }
        }
        doc.text(row[0], 16, y);
        doc.text(row[1], 196, y, { align: "right" });
        y += 10;
      });

      y += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Calculation Note:", 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`${sale.unit_price} x ${sale.quantity} = ${sale.amount} | Net = ${sale.amount} - ${sale.credit} = ${balance}`, 14, y);

      y += 25;
      doc.line(14, y, 70, y);
      doc.line(130, y, 186, y);
      y += 5;
      doc.setFontSize(7);
      doc.text("Branch Manager Signature", 14, y);
      doc.text("System Seal", 130, y);

      y += 15;
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`System Generated Document - Dearo Investment | ${new Date().toLocaleString()}`, 14, y);

      // 100% working download
      const fileName = `SALES-INCOME-${saleId}.pdf`;
      doc.save(fileName);

    } catch (e) {
      console.error("PDF Error:", e);
      alert("PDF error: " + (e as any).message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#070a12] flex items-center justify-center"><Loader2 className="animate-spin text-red-500"/></div>;
  if (!sale) return <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center text-slate-400 font-mono text-xs"><p>Record not found</p><Link href={`/dashboard/branches/${branchId}/add-expenses/sales_incomes`} className="text-red-400 mt-2 underline">Back</Link></div>;

  const balance = Number(sale.amount) - Number(sale.credit);

  return (
    <div className="min-h-screen bg-[#070a12] p-6 sm:p-10 flex flex-col items-center font-mono text-xs text-slate-100">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6 no-print">
          <Link href={`/dashboard/branches/${branchId}/add-expenses/sales_incomes`} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"><ArrowLeft size={14}/> Back</Link>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center hover:bg-white hover:text-black"><Printer size={14}/></button>
            <button onClick={handlePDF} disabled={downloading} className="h-10 px-5 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 font-black uppercase text-[10px] disabled:opacity-50">
              {downloading ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>} {downloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div id="pdf-content" className="bg-white text-black rounded-2xl p-8 shadow-2xl border border-slate-200 w-full">
          <div className="flex justify-between border-b-2 border-black pb-6 mb-6">
            <div><h1 className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><FileText size={18}/> Sales Income Receipt</h1><p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Branch #{branchId} | ID: {sale.id} | Date: {sale.date?.slice(0,10)}</p></div>
            <div className="text-right"><p className="text-[10px] font-black uppercase border border-black px-3 py-1 rounded-full">Verified</p><p className="text-[9px] mt-2">REF: SALE/{String(sale.id).padStart(6,'0')}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold">Product Name</p><p className="font-black mt-1 uppercase text-sm">{sale.name}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold">Date</p><p className="font-black mt-1">{sale.date?.slice(0,10)}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold">Total Amount</p><p className="font-black mt-1 text-base">LKR {Number(sale.amount).toFixed(2)}</p></div>
          </div>
          <div className="rounded-xl overflow-hidden border border-black">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-200">
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Unit Price (LKR)</td><td className="p-4 text-right font-bold">LKR {Number(sale.unit_price).toFixed(2)}</td></tr>
                <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Quantity</td><td className="p-4 text-right font-bold">{Number(sale.quantity)}</td></tr>
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Amount (Unit x Qty)</td><td className="p-4 text-right font-black">LKR {Number(sale.amount).toFixed(2)}</td></tr>
                <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Credit (LKR)</td><td className="p-4 text-right font-black">LKR {Number(sale.credit).toFixed(2)}</td></tr>
                <tr className="bg-black text-white"><td className="p-4 uppercase text-[10px] font-black">Net Balance</td><td className="p-4 text-right font-black text-lg text-white">LKR {balance.toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}