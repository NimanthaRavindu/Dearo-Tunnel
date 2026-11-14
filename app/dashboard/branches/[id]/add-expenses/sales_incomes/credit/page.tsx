"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, Car, CheckCircle2, CreditCard, Loader2, Phone, Plus, Save, User, X, Receipt, Search, Download, DollarSign } from "lucide-react";

interface CreditRecord {
  id: string;
  branch_id?: string;
  bill_number: string;
  product_name: string;
  customer_name: string;
  contact_number: string;
  promise_date: string;
  vehicle_number: string;
  credit_amount: number;
  total_amount: number;
  paid_amount: number;
  created_date: string;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function CreditPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = params?.id as string;

  const billNumber = searchParams.get("bill_number") || "";
  const productName = searchParams.get("product_name") || "";
  const entryDate = searchParams.get("date") || getToday();
  const totalAmount = Number(searchParams.get("total_amount") || 0);
  const paidAmount = Number(searchParams.get("paid_amount") || 0);
  const creditAmountFromURL = Number(searchParams.get("credit_amount") || 0);
  const unitPrice = Number(searchParams.get("unit_price") || 0);
  const quantity = Number(searchParams.get("quantity") || 0);

  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [saleSaved, setSaleSaved] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    contact_number: "",
    promise_date: "",
    vehicle_number: "",
    // ✅ NEW: Credit Amount - form eke enna ona field eka
    credit_amount: creditAmountFromURL > 0 ? String(creditAmountFromURL) : "",
  });

  // ✅ URL eken ena Credit Amount eka form ekata daanawa - page eka open unama
  useEffect(() => {
    if (creditAmountFromURL > 0) {
      setForm((p) => ({ ...p, credit_amount: String(creditAmountFromURL) }));
    }
  }, [creditAmountFromURL]);

  // ✅ Form eke Credit Amount eka thama dan use karanne - URL eke eka nemei
  const creditAmount = Number(form.credit_amount || 0);
  // ✅ Total = Paid + Credit - Auto penna
  const calcTotal = paidAmount + creditAmount;

  const fetchCredits = async () => {
    if (!branchId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/expences/sales-credits?branch_id=${encodeURIComponent(branchId)}`, { cache: "no-store" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Failed to load credits");
      setRecords(result.data || []);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load credits");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (branchId) fetchCredits(); }, [branchId]);

  const dateFiltered = useMemo(() => {
    if (!filterDate) return records;
    return records.filter((r) => (r.created_date || "").slice(0, 10) === filterDate);
  }, [records, filterDate]);

  const totalCredit = useMemo(() => dateFiltered.reduce((t, r) => t + Number(r.credit_amount || 0), 0), [dateFiltered]);
  const totalPaid = useMemo(() => dateFiltered.reduce((t, r) => t + Number(r.paid_amount || 0), 0), [dateFiltered]);
  const totalAmountSum = useMemo(() => dateFiltered.reduce((t, r) => t + Number(r.total_amount || 0), 0), [dateFiltered]);
  const overdueCount = useMemo(() => dateFiltered.filter((r) => r.promise_date && r.promise_date.slice(0, 10) < getToday()).length, [dateFiltered]);
  const dueTodayCount = useMemo(() => dateFiltered.filter((r) => r.promise_date && r.promise_date.slice(0, 10) === getToday()).length, [dateFiltered]);
  const overdueAmount = useMemo(() => dateFiltered.filter((r) => r.promise_date && r.promise_date.slice(0, 10) < getToday()).reduce((t, r) => t + Number(r.credit_amount || 0), 0), [dateFiltered]);

  const filtered = search
    ? dateFiltered.filter((r) =>
        (r.customer_name + r.contact_number + r.vehicle_number + r.bill_number + r.product_name).toLowerCase().includes(search.toLowerCase())
      )
    : dateFiltered;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrorMsg("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.contact_number.trim() || !form.promise_date || !form.vehicle_number.trim()) {
      setErrorMsg("Please complete Customer Name, Contact, Promise Date and Vehicle Number.");
      return;
    }
    // ✅ NEW: Credit Amount validation
    if (!form.credit_amount || creditAmount <= 0) {
      setErrorMsg("Please enter Credit Amount.");
      return;
    }
    try {
      setIsSaving(true);
      setErrorMsg("");

      // 1️⃣ CREDIT EKA SAVE - Form eke Credit Amount eken
      const res = await fetch("/api/expences/sales-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: branchId,
          bill_number: billNumber || null,
          product_name: productName,
          customer_name: form.customer_name.trim(),
          contact_number: form.contact_number.trim(),
          promise_date: form.promise_date,
          vehicle_number: form.vehicle_number.trim().toUpperCase(),
          credit_amount: creditAmount,
          total_amount: totalAmount || calcTotal,
          paid_amount: paidAmount,
          created_date: entryDate,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Failed to save credit");

      if (!saleSaved) {
        const saleRes = await fetch("/api/expences/sales-incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch_id: branchId,
            bill_number: billNumber || null,
            name: productName,
            date: entryDate,
            unit_price: unitPrice,
            quantity: quantity,
            amount: totalAmount || calcTotal,
            credit: paidAmount,
            paid: paidAmount,
            discount: creditAmount,
          }),
        });
        const saleResult = await saleRes.json();
        if (!saleRes.ok || !saleResult.success) {
          throw new Error("Credit saved, but Sale failed: " + (saleResult.error || ""));
        }
        setSaleSaved(true);
      }

      setForm({ customer_name: "", contact_number: "", promise_date: "", vehicle_number: "", credit_amount: "" });
      setSuccessMsg(`Saved Both ✅ Credit: ${form.customer_name} - LKR ${creditAmount.toFixed(2)} | Sale: ${productName} - LKR ${(totalAmount || calcTotal).toFixed(2)} added to Sales Ledger`);
      window.setTimeout(() => setSuccessMsg(""), 5000);
      await fetchCredits();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save credit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this credit record?")) return;
    try {
      const res = await fetch(`/api/expences/sales-credits?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Failed to delete");
      await fetchCredits();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete");
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/branches/${branchId}/add-expenses/sales_incomes`);
  };

  const exportCreditCSV = () => {
    const head = "Bill No,Product,Customer,Contact,Vehicle,Promise Date,Status,Credit Amount,Total,Paid";
    const body = filtered.map((r) => {
      const st = getStatus(r.promise_date);
      return [r.bill_number, `"${r.product_name}"`, `"${r.customer_name}"`, r.contact_number, r.vehicle_number, (r.promise_date || "").slice(0, 10), st.label, r.credit_amount, r.total_amount, r.paid_amount].join(",");
    }).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `credits-branch-${branchId}.csv`;
    a.click();
  };

  const getStatus = (promiseDate: string) => {
    const d = promiseDate?.slice(0, 10) || "";
    const today = getToday();
    if (d < today) return { label: "Overdue", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
    if (d === today) return { label: "Due Today", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    return { label: "Pending", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-6 sm:p-10 flex flex-col items-center font-mono text-xs">
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-400 hover:text-white"><ArrowLeft size={16} /></button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase flex items-center gap-2"><CreditCard size={20} className="text-amber-400" /> Add Credit Details</h1>
              <p className="text-xs text-slate-400 mt-1">Branch Unit #{branchId} • Credit entry for this sales income • Saved to Database</p>
            </div>
          </div>
        </div>

        {successMsg && <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-4 py-3 rounded-xl text-emerald-400"><CheckCircle2 size={16} /><span>{successMsg}</span></div>}
        {errorMsg && <div className="flex items-center justify-between bg-red-950/40 border border-red-500/40 px-4 py-3 rounded-xl text-red-400"><span>{errorMsg}</span><button onClick={() => setErrorMsg("")}><X size={15} /></button></div>}

        {/* ENTRY SUMMARY - Form eke Credit Amount eka wenas unama meka th wenas wenawa */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/60 border border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"><Receipt size={14} className="text-amber-400" /> Sales Entry Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3"><p className="text-[10px] text-slate-500 uppercase">Bill No</p><p className="font-bold mt-1">{billNumber || "-"}</p></div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3"><p className="text-[10px] text-slate-500 uppercase">Product</p><p className="font-bold mt-1">{productName || "-"}</p></div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3"><p className="text-[10px] text-slate-500 uppercase">Date</p><p className="font-bold mt-1">{entryDate}</p></div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3"><p className="text-[10px] text-slate-500 uppercase">Total Amount</p><p className="font-black text-emerald-400 mt-1">LKR {totalAmount > 0 ? totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : calcTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3"><p className="text-[10px] text-slate-500 uppercase">Paid</p><p className="font-black text-slate-200 mt-1">LKR {paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3"><p className="text-[10px] text-amber-400 uppercase">Credit Amount</p><p className="font-black text-amber-400 mt-1">LKR {creditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
          </div>
        </div>

        {/* CREDIT FORM - ✅ Credit Amount field eka meke */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/60 border border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"><Plus size={14} className="text-amber-400" /> Customer Credit Details</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><User size={12} /> Customer Name *</label><input name="customer_name" value={form.customer_name} onChange={handleChange} required placeholder="Ex: Nimantha Perera" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500/60 focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Phone size={12} /> Contact Number *</label><input name="contact_number" value={form.contact_number} onChange={handleChange} required placeholder="Ex: 077 123 4567" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500/60 focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Calendar size={12} /> Promise Date *</label><input type="date" name="promise_date" value={form.promise_date} onChange={handleChange} required className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500/60 focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Car size={12} /> Vehicle Number *</label><input name="vehicle_number" value={form.vehicle_number} onChange={handleChange} required placeholder="Ex: WP ABC-1234" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500/60 focus:outline-none uppercase" /></div>

            {/* ✅ NEW: Credit Amount - meka thama oya illapu field eka */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5"><DollarSign size={12} /> Credit Amount (LKR) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="credit_amount"
                value={form.credit_amount}
                onChange={handleChange}
                required
                placeholder="Ex: 25000.00"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-amber-500/40 rounded-xl focus:border-amber-500 focus:outline-none font-black text-amber-400 text-sm"
              />
              <p className="text-[10px] text-slate-500">
                {creditAmountFromURL > 0
                  ? `Sales page eken auto awa: LKR ${creditAmountFromURL.toLocaleString(undefined, { minimumFractionDigits: 2 })} - ona nam wenas karanna puluwan.`
                  : `Sales page eken Credit Amount ekak awe nathnam, meke type karanna.`}
                {` | Paid: LKR ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} + Credit: LKR ${creditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} = Total: LKR ${calcTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </p>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={handleBack} className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-bold hover:bg-slate-800">Back to Sales</button>
              <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl flex items-center gap-2 disabled:opacity-50">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Credit</button>
            </div>
          </form>
        </div>

        {/* CREDIT TABLE */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} className="text-amber-400" /> All Credit Records</h2>
              <p className="text-[10px] text-slate-500 mt-1">{filtered.length} records • Total Credit LKR {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })} • <span className="text-red-400">{overdueCount} Overdue</span> • <span className="text-amber-400">{dueTodayCount} Due Today</span></p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-slate-500" />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500/60 focus:outline-none" />
                {filterDate && <button onClick={() => setFilterDate("")} className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold">Clear</button>}
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer / vehicle / bill..." className="pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl w-full sm:w-64 focus:border-amber-500/60 focus:outline-none" />
              </div>
              <button onClick={exportCreditCSV} className="px-3 py-2 bg-amber-500 text-black font-bold rounded-xl flex items-center gap-1.5"><Download size={13} /> Export</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-[10px] uppercase text-slate-500">Total Amount</p><p className="mt-1 font-black text-slate-100">LKR {totalAmountSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-[10px] uppercase text-slate-500">Total Paid</p><p className="mt-1 font-black text-emerald-400">LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"><p className="text-[10px] uppercase text-amber-400">Total Credit</p><p className="mt-1 font-black text-amber-400">LKR {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3"><p className="text-[10px] uppercase text-red-400">Overdue Credit</p><p className="mt-1 font-black text-red-400">LKR {overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center flex justify-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={18} /> Loading credits from database...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No credit records yet. {filterDate ? `Date: ${filterDate} - Credit nathi dawasak.` : "Add customer details above."}</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Bill No</th><th className="py-3 px-4">Customer</th><th className="py-3 px-4">Contact</th><th className="py-3 px-4">Vehicle No</th><th className="py-3 px-4">Created Date</th><th className="py-3 px-4">Promise Date</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Credit Amount</th><th className="py-3 px-4 text-center">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filtered.map((r) => {
                    const st = getStatus(r.promise_date);
                    return (
                      <tr key={r.id} className="hover:bg-slate-900/70">
                        <td className="py-3 px-4"><p className="font-bold">{r.bill_number}</p><p className="text-[10px] text-slate-500">{r.product_name}</p></td>
                        <td className="py-3 px-4 font-bold flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">{r.customer_name.charAt(0).toUpperCase()}</span>{r.customer_name}</td>
                        <td className="py-3 px-4">{r.contact_number}</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg font-bold">{r.vehicle_number}</span></td>
                        <td className="py-3 px-4">{r.created_date?.slice(0, 10)}</td>
                        <td className="py-3 px-4">{r.promise_date?.slice(0, 10)}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${st.cls}`}>{st.label}</span></td>
                        <td className="py-3 px-4 text-right font-black text-amber-400">LKR {Number(r.credit_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center"><button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-400 border border-slate-800 rounded-lg"><X size={13} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-amber-500/20 font-black">
                    <td colSpan={7} className="py-3 px-4 text-right uppercase text-slate-300">Total Credit ({filtered.length})</td>
                    <td className="py-3 px-4 text-right text-amber-400">LKR {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Fallback() {
  return <div className="h-screen flex items-center justify-center bg-[#070a12] text-slate-500 font-mono text-xs"><Loader2 className="animate-spin mr-2" size={18} /> Loading Credit Page...</div>;
}

export default function CreditPage() {
  return <Suspense fallback={<Fallback />}><CreditPageContent /></Suspense>;
}
