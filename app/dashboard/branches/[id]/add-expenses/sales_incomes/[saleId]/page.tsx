"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText, Printer, Download, User, Phone, Car, CreditCard, Building2, Calendar, Hash, Receipt } from "lucide-react";

const fmt = (n: any) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const num = (v: any) => Number(v ?? 0) || 0;

// Field name eka lassana label ekakata
const labelOf = (k: string) => {
  const map: any = {
    id: "Record ID", bill_number: "Bill Number", billNumber: "Bill Number",
    name: "Product / Name", product_name: "Product Name",
    date: "Date", created_date: "Created Date", created_at: "Created At",
    unit_price: "Unit Price", quantity: "Quantity", qty: "Quantity",
    amount: "Amount (Total)", total_amount: "Total Amount",
    discount: "Discount", paid: "Paid", credit: "Credit",
    customer_name: "Customer Name", contact_number: "Contact Number", contact: "Contact",
    vehicle_number: "Vehicle Number", branch_id: "Branch ID", branchId: "Branch ID",
    payable: "Payable", balance: "Balance", promise_date: "Promise Date",
  };
  return map[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
};

export default function SaleViewPage() {
  const params = useParams();
  const branchId = params?.id as string;
  const saleId = params?.saleId as string;
  const [sale, setSale] = useState<any>(null);
  const [creditRec, setCreditRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/expences/sales-incomes?branch_id=${branchId}`, { cache: "no-store" });
        const json = await res.json();
        const found = json.data?.find((x: any) => String(x.id) === String(saleId));
        setSale(found || null);

        // ✅ E record ekata adala Credit record eka - sales_credits table eken
        // Bill Number eken match karanawa
        if (found) {
          try {
            const cr = await fetch(`/api/expences/sales-credits?branch_id=${branchId}`, { cache: "no-store" });
            const cj = await cr.json();
            const list = Array.isArray(cj?.data) ? cj.data : [];
            const bill = String(found.bill_number || found.billNumber || "");
            const match = list.find((c: any) =>
              bill && String(c.bill_number || "") === bill
            ) || list.find((c: any) =>
              String(c.customer_name || "") === String(found.customer_name || "") &&
              String(c.created_date || "").slice(0, 10) === String(found.date || "").slice(0, 10) &&
              num(c.credit_amount) > 0
            );
            setCreditRec(match || null);
          } catch { setCreditRec(null); }
        }
      } catch {} finally { setLoading(false); }
    };
    if (branchId && saleId) load();
  }, [branchId, saleId]);

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    if (!sale) return;
    setDownloading(true);
    try {
      // @ts-ignore
      const jspdfMod = await import("jspdf");
      const jsPDF = jspdfMod.jsPDF;
      const doc = new jsPDF("p", "mm", "a4");

      const amount = num(sale.amount);
      const paid = num(sale.paid ?? sale.credit ?? 0);
      const discount = num(sale.discount ?? 0);
      const credit = num(sale.credit ?? creditRec?.credit_amount ?? 0);
      const balance = amount - discount - paid;

      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("SALES INCOME RECEIPT", 14, 14);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`BRANCH #${branchId} | ID: ${sale.id} | DATE: ${String(sale.date).slice(0, 10)}`, 14, 22);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text(`REF: SALE/${String(sale.id).padStart(6, "0")} | VERIFIED`, 140, 14);

      let y = 40;
      doc.setFontSize(10);
      const info: any[][] = [
        ["Bill Number", String(sale.bill_number || sale.billNumber || "-")],
        ["Product Name", String(sale.name || sale.product_name || "-").toUpperCase()],
        ["Date", String(sale.date).slice(0, 10)],
        ["Customer", String(sale.customer_name || creditRec?.customer_name || "-")],
        ["Contact", String(sale.contact_number || creditRec?.contact_number || "-")],
        ["Vehicle", String(sale.vehicle_number || creditRec?.vehicle_number || "-")],
        ["Total Amount", `LKR ${amount.toFixed(2)}`],
      ];
      info.forEach(([k, v]) => {
        doc.setFont("helvetica", "bold"); doc.text(`${k.toUpperCase()}:`, 14, y);
        doc.setFont("helvetica", "normal"); doc.text(v, 55, y);
        y += 8;
      });

      y += 7;
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("TRANSACTION BREAKDOWN", 14, y);
      y += 5; doc.line(14, y, 196, y); y += 10;

      doc.setFontSize(10);
      const rows = [
        ["Unit Price (LKR)", `LKR ${num(sale.unit_price).toFixed(2)}`],
        ["Quantity", `${num(sale.quantity)}`],
        ["Amount (Unit x Qty)", `LKR ${amount.toFixed(2)}`],
        ["Discount (LKR)", `LKR ${discount.toFixed(2)}`],
        ["Paid (LKR)", `LKR ${paid.toFixed(2)}`],
        ["Credit (LKR)", `LKR ${credit.toFixed(2)}`],
        ["Net Balance (Amount - Discount - Paid)", `LKR ${balance.toFixed(2)}`],
      ];
      rows.forEach((row, i) => {
        const isLast = i === rows.length - 1;
        if (isLast) {
          doc.setFillColor(0, 0, 0); doc.rect(14, y - 6, 182, 10, "F");
          doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
          if (i % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(14, y - 6, 182, 10, "F"); }
        }
        doc.text(row[0], 16, y);
        doc.text(row[1], 196, y, { align: "right" });
        y += 10;
      });

      if (creditRec) {
        y += 8;
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("CREDIT RECORD", 14, y); y += 8;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text(`Credit Amount: LKR ${num(creditRec.credit_amount).toFixed(2)} | Promise Date: ${String(creditRec.promise_date || "-").slice(0, 10)} | Total: LKR ${num(creditRec.total_amount).toFixed(2)}`, 14, y);
      }

      y += 25;
      doc.line(14, y, 70, y); doc.line(130, y, 186, y); y += 5;
      doc.setFontSize(7); doc.text("Branch Manager Signature", 14, y); doc.text("System Seal", 130, y);
      y += 15; doc.setFontSize(7); doc.setTextColor(100, 100, 100);
      doc.text(`System Generated Document - Dearo Investment | ${new Date().toLocaleString()}`, 14, y);

      doc.save(`SALES-INCOME-${saleId}.pdf`);
    } catch (e) {
      console.error("PDF Error:", e);
      alert("PDF error: " + (e as any).message);
    } finally { setDownloading(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#070a12] flex items-center justify-center"><Loader2 className="animate-spin text-red-500" /></div>;
  if (!sale) return <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center text-slate-400 font-mono text-xs"><p>Record not found</p><Link href={`/dashboard/branches/${branchId}/add-expenses/sales_incomes`} className="text-red-400 mt-2 underline">Back</Link></div>;

  const amount = num(sale.amount);
  const paid = num(sale.paid ?? sale.credit ?? 0);
  const discount = num(sale.discount ?? 0);
  const credit = num(sale.credit ?? creditRec?.credit_amount ?? 0);
  const balance = amount - discount - paid;

  // ✅ Siyalu field tika - table eke nopenena ewayuth auto penawa
  const allEntries = Object.entries(sale).filter(([k, v]) => v !== null && v !== undefined && String(v) !== "");
  const customerName = sale.customer_name || creditRec?.customer_name || "-";
  const contactNumber = sale.contact_number || creditRec?.contact_number || "-";
  const vehicleNumber = sale.vehicle_number || creditRec?.vehicle_number || "-";

  return (
    <div className="min-h-screen bg-[#070a12] p-6 sm:p-10 flex flex-col items-center font-mono text-xs text-slate-100">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6 no-print">
          <Link href={`/dashboard/branches/${branchId}/add-expenses/sales_incomes`} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"><ArrowLeft size={14} /> Back</Link>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center hover:bg-white hover:text-black"><Printer size={14} /></button>
            <button onClick={handlePDF} disabled={downloading} className="h-10 px-5 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 font-black uppercase text-[10px] disabled:opacity-50">
              {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} {downloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div id="pdf-content" className="bg-white text-black rounded-2xl p-8 shadow-2xl border border-slate-200 w-full">
          <div className="flex justify-between border-b-2 border-black pb-6 mb-6">
            <div><h1 className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><FileText size={18} /> Sales Income Receipt</h1><p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Branch #{branchId} | ID: {sale.id} | Date: {sale.date?.slice(0, 10)}</p></div>
            <div className="text-right"><p className="text-[10px] font-black uppercase border border-black px-3 py-1 rounded-full">Verified</p><p className="text-[9px] mt-2">REF: SALE/{String(sale.id).padStart(6, "0")}</p></div>
          </div>

          {/* ✅ Cards - Siyalu mukhya data */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Hash size={10} /> Bill Number</p><p className="font-black mt-1 uppercase text-sm">{sale.bill_number || sale.billNumber || "-"}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold">Product Name</p><p className="font-black mt-1 uppercase text-sm">{sale.name || sale.product_name || "-"}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Calendar size={10} /> Date</p><p className="font-black mt-1">{sale.date?.slice(0, 10)}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold">Total Amount</p><p className="font-black mt-1 text-base">{fmt(amount)}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold">Discount</p><p className="font-black mt-1 text-base">{fmt(discount)}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold">Paid</p><p className="font-black mt-1 text-base">{fmt(paid)}</p></div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200"><p className="text-[9px] text-amber-600 uppercase font-bold flex items-center gap-1"><CreditCard size={10} /> Credit</p><p className="font-black mt-1 text-base text-amber-700">{fmt(credit)}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Building2 size={10} /> Branch</p><p className="font-black mt-1">#{sale.branch_id || branchId}</p></div>
            <div className="p-4 rounded-xl bg-slate-50 border"><p className="text-[9px] text-slate-500 uppercase font-bold">Record ID</p><p className="font-black mt-1">{sale.id}</p></div>
          </div>

          {/* ✅ Customer / Contact - Kalin penne nathi tika */}
          <div className="rounded-xl border border-black overflow-hidden mb-6">
            <p className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-2"><User size={12} /> Customer Details</p>
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-200">
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold flex items-center gap-2"><User size={12} /> Customer Name</td><td className="p-4 text-right font-bold">{customerName}</td></tr>
                <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold flex items-center gap-2"><Phone size={12} /> Contact Number</td><td className="p-4 text-right font-bold">{contactNumber}</td></tr>
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold flex items-center gap-2"><Car size={12} /> Vehicle Number</td><td className="p-4 text-right font-bold">{vehicleNumber}</td></tr>
              </tbody>
            </table>
          </div>

          {/* ✅ Transaction Breakdown */}
          <div className="rounded-xl overflow-hidden border border-black mb-6">
            <p className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-2"><Receipt size={12} /> Transaction Breakdown</p>
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-200">
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Bill Number</td><td className="p-4 text-right font-bold">{sale.bill_number || sale.billNumber || "-"}</td></tr>
                <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Unit Price (LKR)</td><td className="p-4 text-right font-bold">{fmt(sale.unit_price)}</td></tr>
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Quantity</td><td className="p-4 text-right font-bold">{num(sale.quantity)}</td></tr>
                <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Amount (Unit x Qty)</td><td className="p-4 text-right font-black">{fmt(amount)}</td></tr>
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Discount (LKR)</td><td className="p-4 text-right font-black">{fmt(discount)}</td></tr>
                <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Paid (LKR)</td><td className="p-4 text-right font-black">{fmt(paid)}</td></tr>
                <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Credit (LKR)</td><td className="p-4 text-right font-black text-amber-600">{fmt(credit)}</td></tr>
                <tr className="bg-black text-white"><td className="p-4 uppercase text-[10px] font-black">Net Balance (Amount - Discount - Paid)</td><td className="p-4 text-right font-black text-lg text-white">{fmt(balance)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* ✅ Credit Record - sales_credits table eken */}
          {creditRec && (
            <div className="rounded-xl overflow-hidden border border-amber-300 mb-6">
              <p className="bg-amber-400 text-black px-4 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-2"><CreditCard size={12} /> Linked Credit Record • {creditRec.id}</p>
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Credit Amount</td><td className="p-4 text-right font-black">{fmt(creditRec.credit_amount)}</td></tr>
                  <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Total Amount</td><td className="p-4 text-right font-bold">{fmt(creditRec.total_amount)}</td></tr>
                  <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Paid Amount</td><td className="p-4 text-right font-bold">{fmt(creditRec.paid_amount)}</td></tr>
                  <tr className="bg-slate-50"><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Promise Date</td><td className="p-4 text-right font-bold">{String(creditRec.promise_date || "-").slice(0, 10)}</td></tr>
                  <tr><td className="p-4 text-slate-500 uppercase text-[10px] font-bold">Created Date</td><td className="p-4 text-right font-bold">{String(creditRec.created_date || "-").slice(0, 10)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ✅ All Data - DB eke thiyena siyalu field tika */}
          <div className="rounded-xl overflow-hidden border border-slate-300">
            <p className="bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-wider">All Record Data • {allEntries.length} Fields</p>
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-200">
                {allEntries.map(([k, v], i) => (
                  <tr key={k} className={i % 2 === 0 ? "" : "bg-slate-50"}>
                    <td className="p-3 text-slate-500 uppercase text-[10px] font-bold">{labelOf(k)}</td>
                    <td className="p-3 text-right font-bold break-all">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] text-slate-400 mt-4 text-center">Calculation: {sale.unit_price} x {sale.quantity} = {amount} | Net = {amount} - {discount} - {paid} = {balance}</p>
        </div>
      </div>
    </div>
  );
}