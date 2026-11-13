"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, DollarSign, FileText, Loader2, Plus, X, Hash, Tag, Eye, Receipt, BadgePercent, User, Phone, Car, Clock, CreditCard, Save } from "lucide-react";

interface SalesIncomeItem {
  id: string;
  bill_number?: string;
  billNumber?: string;
  name: string;
  date: string;
  amount: number;
  credit: number;
  paid?: number;
  discount?: number;
  unit_price?: number;
  quantity?: number;
  branch_id?: string;
  created_at?: string;
}

interface SalesIncomeFormData {
  bill_number: string;
  name: string;
  date: string;
  unit_price: string;
  quantity: string;
  credit: string;
}

// ✅ Credit Details - Aluth Type eka
interface CreditRecord {
  id: string;
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

interface CreditFormData {
  customer_name: string;
  contact_number: string;
  promise_date: string;
  vehicle_number: string;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function SalesIncomesContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = params?.id as string;

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [incomes, setIncomes] = useState<SalesIncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [formData, setFormData] = useState<SalesIncomeFormData>({
    bill_number: "",
    name: "",
    date: getToday(),
    unit_price: "",
    quantity: "",
    credit: "",
  });

  // ✅ Credit Modal + Records
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([]);
  const [isSavingCredit, setIsSavingCredit] = useState(false);
  const [creditForm, setCreditForm] = useState<CreditFormData>({
    customer_name: "",
    contact_number: "",
    promise_date: "",
    vehicle_number: "",
  });

  const calculatedAmount = useMemo(() => {
    const up = Number(formData.unit_price) || 0;
    const qty = Number(formData.quantity) || 0;
    return up * qty;
  }, [formData.unit_price, formData.quantity]);

  // ✅ Discount = Amount - Paid - AUTO
  const calculatedDiscount = useMemo(() => {
    const paid = Number(formData.credit || 0);
    return calculatedAmount - paid;
  }, [calculatedAmount, formData.credit]);

  const filteredIncomes = filterDate ? incomes.filter((item) => item.date.slice(0, 10) === filterDate) : incomes;
  const totalAmount = filteredIncomes.reduce((total, item) => total + Number(item.amount || 0), 0);
  const totalCredit = filteredIncomes.reduce((total, item) => total + Number(item.credit ?? item.paid ?? 0), 0);
  const totalDiscount = filteredIncomes.reduce((total, item) => total + Number(item.discount ?? 0), 0);
  const totalCreditRecords = creditRecords.reduce((t, r) => t + r.credit_amount, 0);

  const fetchSalesIncomes = async () => {
    if (!branchId) return;
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await fetch(`/api/expences/sales-incomes?branch_id=${encodeURIComponent(branchId)}`, { method: "GET", cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch sales incomes.");
      setIncomes(result.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load sales income records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (branchId) fetchSalesIncomes(); }, [branchId]);

  // ✅ Credit Records - localStorage eken load karanawa (page refresh unath nathi wenna)
  useEffect(() => {
    if (!branchId) return;
    try {
      const saved = localStorage.getItem(`credit_records_${branchId}`);
      if (saved) setCreditRecords(JSON.parse(saved));
    } catch {}
  }, [branchId]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrorMessage("");
  };

  const handleCreditInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCreditForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Add Credit Button Click - Modal Open
  const handleOpenCreditModal = () => {
    if (!formData.name.trim()) {
      setErrorMessage("First enter Product Name, then Add Credit.");
      return;
    }
    if (calculatedAmount <= 0) {
      setErrorMessage("First enter Unit Price and Quantity.");
      return;
    }
    if (calculatedDiscount <= 0) {
      setErrorMessage("No credit balance. Paid is equal to Amount.");
      return;
    }
    setCreditForm({
      customer_name: formData.name.trim(),
      contact_number: "",
      promise_date: "",
      vehicle_number: "",
    });
    setShowCreditModal(true);
  };

  // ✅ Credit Save
  const handleSaveCredit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!creditForm.customer_name.trim() || !creditForm.contact_number.trim() || !creditForm.promise_date || !creditForm.vehicle_number.trim()) {
      setErrorMessage("Please complete Customer Name, Contact, Promise Date and Vehicle Number.");
      return;
    }
    setIsSavingCredit(true);
    try {
      const newRecord: CreditRecord = {
        id: `CR-${Date.now()}`,
        bill_number: formData.bill_number.trim() || `B-${Date.now().toString().slice(-4)}`,
        product_name: formData.name.trim(),
        customer_name: creditForm.customer_name.trim(),
        contact_number: creditForm.contact_number.trim(),
        promise_date: creditForm.promise_date,
        vehicle_number: creditForm.vehicle_number.trim().toUpperCase(),
        credit_amount: calculatedDiscount,
        total_amount: calculatedAmount,
        paid_amount: Number(formData.credit || 0),
        created_date: formData.date,
      };
      const updated = [newRecord, ...creditRecords];
      setCreditRecords(updated);
      localStorage.setItem(`credit_records_${branchId}`, JSON.stringify(updated));
      setShowCreditModal(false);
      setSuccessMessage(`Credit Saved: ${newRecord.customer_name} - LKR ${calculatedDiscount.toFixed(2)} | Promise: ${creditForm.promise_date}`);
      window.setTimeout(() => setSuccessMessage(""), 4000);
    } finally {
      setIsSavingCredit(false);
    }
  };

  const handleDeleteCredit = (id: string) => {
    if (!confirm("Delete this credit record?")) return;
    const updated = creditRecords.filter((r) => r.id !== id);
    setCreditRecords(updated);
    localStorage.setItem(`credit_records_${branchId}`, JSON.stringify(updated));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bill_number = formData.bill_number.trim();
    const name = formData.name.trim();
    const unit_price = Number(formData.unit_price);
    const quantity = Number(formData.quantity);
    const credit = Number(formData.credit || 0);
    const amount = calculatedAmount;
    const discount = calculatedDiscount;

    if (!branchId || !name || !formData.date || !formData.unit_price || !formData.quantity) {
      setErrorMessage("Please complete Name, Date, Unit Price and Quantity.");
      return;
    }
    if (credit < 0) { setErrorMessage("Paid cannot be less than 0."); return; }
    if (credit > amount) { setErrorMessage("Paid cannot be greater than Amount."); return; }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const response = await fetch("/api/expences/sales-incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch_id: branchId, bill_number: bill_number || null, name, date: formData.date, unit_price, quantity, amount, credit, paid: credit, discount }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to save sales income.");
      setFormData({ bill_number: "", name: "", date: getToday(), unit_price: "", quantity: "", credit: "" });
      setSuccessMessage(`Saved: ${quantity} x LKR ${unit_price.toFixed(2)} = LKR ${amount.toFixed(2)} | Discount LKR ${discount.toFixed(2)} | Paid LKR ${credit.toFixed(2)}`);
      window.setTimeout(() => setSuccessMessage(""), 3000);
      await fetchSalesIncomes();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save sales income.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const queryParams = new URLSearchParams();
    if (selectedSalesId) queryParams.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) queryParams.append("selected_capital_id", selectedCapitalId);
    router.push(`/dashboard/total-incomes${queryParams.toString() ? `?${queryParams}` : ""}`);
  };

  const getPromiseStatus = (promiseDate: string) => {
    const today = getToday();
    if (promiseDate < today) return { label: "Overdue", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
    if (promiseDate === today) return { label: "Due Today", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    return { label: "Pending", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-6 sm:p-10 flex flex-col items-center relative overflow-hidden font-mono text-xs">
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="w-full max-w-6xl space-y-6 relative z-10">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleBack} className="p-3 bg-slate-900/90 hover:bg-slate-800/90 rounded-xl transition-all duration-200 border border-slate-800 text-slate-400 hover:text-white shadow-lg" title="Back"><ArrowLeft size={16} /></button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-100">Branch Sales Incomes</h1>
              <p className="text-xs text-slate-400 mt-1">Record and manage direct sales revenue entries for Branch Unit #{branchId}</p>
            </div>
          </div>
        </div>

        {successMessage && (<div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-4 py-3 rounded-xl text-emerald-400"><CheckCircle2 size={16} /><span>{successMessage}</span></div>)}
        {errorMessage && (<div className="flex items-center justify-between gap-3 bg-red-950/40 border border-red-500/40 px-4 py-3 rounded-xl text-red-400"><span>{errorMessage}</span><button type="button" onClick={() => setErrorMessage("")} className="hover:text-red-200"><X size={15} /></button></div>)}

        {/* FORM */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/60 border border-slate-800 shadow-2xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-4 flex items-center gap-2"><Plus size={14} className="text-red-400" />Add New Sales Income Entry</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Receipt size={12} />Bill Number</label><input type="text" name="bill_number" value={formData.bill_number} onChange={handleInputChange} placeholder="Ex: B-001" className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><FileText size={12} />Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter name..." className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} />Date</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Tag size={12} />Unit Price (LKR)</label><input type="number" step="0.01" min="0" name="unit_price" value={formData.unit_price} onChange={handleInputChange} required placeholder="0.00" className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Hash size={12} />Quantity</label><input type="number" step="0.01" min="0.01" name="quantity" value={formData.quantity} onChange={handleInputChange} required placeholder="0" className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={12} />Amount (LKR) - Auto</label><div className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-emerald-400 font-black text-sm">LKR {calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><BadgePercent size={12} />Discount (LKR) - Auto</label><div className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-amber-400 font-black text-sm">LKR {calculatedDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={12} />Paid (LKR)</label><input type="number" step="0.01" min="0" name="credit" value={formData.credit} onChange={handleInputChange} placeholder="0.00" className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 mt-2">
              <button type="button" onClick={handleOpenCreditModal} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"><CreditCard size={14} /><span>Add Credit</span></button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}<span>{isSubmitting ? "Saving..." : "Save Income Entry"}</span></button>
            </div>
          </form>
        </div>

        {/* CREDIT RECORDS - Professional Table */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200 flex items-center gap-2"><CreditCard size={14} className="text-amber-400" />Credit Records</h2>
              <p className="text-[10px] text-slate-500 mt-1">{creditRecords.length} credit records • Total Credit LKR {totalCreditRecords.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <button type="button" onClick={handleOpenCreditModal} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-[11px] flex items-center gap-2"><Plus size={13} /> Add Credit</button>
          </div>

          {creditRecords.length === 0 ? (
            <div className="py-10 text-center text-slate-500">No credit records yet. Click <span className="text-amber-400 font-bold">Add Credit</span> to add customer credit details.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Bill No</th><th className="py-3 px-4">Customer Name</th><th className="py-3 px-4">Contact</th><th className="py-3 px-4">Vehicle No</th><th className="py-3 px-4">Promise Date</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Credit Amount</th><th className="py-3 px-4 text-center">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {creditRecords.map((rec) => {
                    const st = getPromiseStatus(rec.promise_date);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-900/70 transition-colors">
                        <td className="py-3 px-4"><p className="font-bold text-slate-200">{rec.bill_number}</p><p className="text-[10px] text-slate-500">{rec.product_name}</p></td>
                        <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">{rec.customer_name.charAt(0).toUpperCase()}</span>{rec.customer_name}</td>
                        <td className="py-3 px-4 text-slate-300">{rec.contact_number}</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg font-bold text-slate-200">{rec.vehicle_number}</span></td>
                        <td className="py-3 px-4 text-slate-300">{rec.promise_date}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${st.cls}`}>{st.label}</span></td>
                        <td className="py-3 px-4 text-right font-black text-amber-400">LKR {rec.credit_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center"><button onClick={() => handleDeleteCredit(rec.id)} className="p-2 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/50 rounded-lg"><X size={13} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* LEDGER */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div><h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">Registered Sales Incomes Ledger</h2><p className="text-[10px] text-slate-500 mt-1">{filteredIncomes.length} records found</p></div>
            <div className="flex items-center gap-2"><input id="filter-date" type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} className="px-3 py-2 bg-slate-50/80 border border-slate-800 rounded-xl text-slate-900 focus:border-red-500/60 focus:outline-none transition-colors" />{filterDate && (<button type="button" onClick={() => setFilterDate("")} className="p-2 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/50 rounded-xl transition-colors"><X size={14} /></button>)}</div>
          </div>
          {!isLoading && filteredIncomes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Amount</p><p className="mt-1 text-lg font-black text-red-400">LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Discount</p><p className="mt-1 text-lg font-black text-emerald-400">LKR {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-1 text-lg font-black text-amber-400">LKR {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            </div>
          )}
          {isLoading ? <div className="py-16 text-center flex flex-col items-center justify-center space-y-2"><Loader2 size={24} className="text-red-500 animate-spin" /><p className="text-slate-400">Loading branch entries...</p></div> : filteredIncomes.length === 0 ? <div className="py-16 text-center text-slate-500">{filterDate ? `No sales income records found for ${filterDate}.` : "No sales income records found for this branch."}</div> : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="py-3 px-4">Bill No</th><th className="py-3 px-4">Name</th><th className="py-3 px-4">Date</th><th className="py-3 px-4 text-right">Unit Price</th><th className="py-3 px-4 text-right">Qty</th><th className="py-3 px-4 text-right">Amount (LKR)</th><th className="py-3 px-4 text-right">Discount (LKR)</th><th className="py-3 px-4 text-right">Paid (LKR)</th><th className="py-3 px-4 text-center">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filteredIncomes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-200">{item.bill_number || item.billNumber || "-"}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{item.name}</td>
                      <td className="py-3 px-4 text-slate-400">{item.date?.slice(0,10)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">LKR {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{Number(item.quantity || 0)}</td>
                      <td className="py-3 px-4 text-right font-black text-red-400">LKR {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400">LKR {Number(item.discount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-black text-amber-400">LKR {Number(item.credit ?? item.paid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-center"><Link href={`/dashboard/branches/${branchId}/add-expenses/sales_incomes/${item.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"><Eye size={12}/> View Summary</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ✅ CREDIT MODAL - Aluth Pituwak Wage */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d1527] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
              <div><h3 className="text-black font-black uppercase tracking-widest text-sm flex items-center gap-2"><CreditCard size={16} /> Add Credit Details</h3><p className="text-black/70 text-[11px] mt-0.5">Bill: {formData.bill_number || "-"} • {formData.name}</p></div>
              <button onClick={() => setShowCreditModal(false)} className="w-8 h-8 bg-black/20 hover:bg-black/40 rounded-lg flex items-center justify-center text-black"><X size={16} /></button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-3 bg-slate-950/40">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"><p className="text-[10px] text-slate-500 uppercase">Total Amount</p><p className="font-black text-slate-100 mt-1">LKR {calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"><p className="text-[10px] text-amber-400 uppercase">Credit Amount (Discount)</p><p className="font-black text-amber-400 mt-1">LKR {calculatedDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            </div>

            <form onSubmit={handleSaveCredit} className="p-6 space-y-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><User size={12} /> Customer Name *</label><input name="customer_name" value={creditForm.customer_name} onChange={handleCreditInputChange} required placeholder="Ex: Nimantha Perera" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-amber-500/60 focus:outline-none" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Phone size={12} /> Contact Number *</label><input name="contact_number" value={creditForm.contact_number} onChange={handleCreditInputChange} required placeholder="Ex: 077 123 4567" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-amber-500/60 focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Clock size={12} /> Promise Date *</label><input type="date" name="promise_date" value={creditForm.promise_date} onChange={handleCreditInputChange} required className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-amber-500/60 focus:outline-none" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Car size={12} /> Vehicle Number *</label><input name="vehicle_number" value={creditForm.vehicle_number} onChange={handleCreditInputChange} required placeholder="Ex: WP ABC-1234" className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-amber-500/60 focus:outline-none uppercase" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreditModal(false)} className="flex-1 py-3 bg-slate-900 border border-slate-800 rounded-xl font-bold hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={isSavingCredit} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">{isSavingCredit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Credit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SalesIncomesFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
      <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
      <p className="uppercase tracking-widest text-[10px]">Loading Revenue Ledger...</p>
    </div>
  );
}

export default function SalesIncomesPage() {
  return (<Suspense fallback={<SalesIncomesFallback />}><SalesIncomesContent /></Suspense>);
}