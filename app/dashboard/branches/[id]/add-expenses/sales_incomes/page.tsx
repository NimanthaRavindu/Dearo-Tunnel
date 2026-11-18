"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, DollarSign, FileText, Loader2, Plus, X, Hash, Tag, Eye, Receipt, BadgePercent, CreditCard, Search, User, Phone, Car, Pencil, Trash2, AlertTriangle } from "lucide-react";

interface SalesIncomeItem {
  id: string;
  bill_number?: string;
  billNumber?: string;
  name: string;
  date: string;
  amount: number;
  discount: number;
  paid: number;
  credit: number;
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
  paid: string;
}

interface ProductPrice { product_name: string; unit_price: number | null; category: string; }
interface CreditRecord {
  id: string; bill_number: string; product_name: string; customer_name: string;
  contact_number: string; promise_date: string; vehicle_number: string;
  credit_amount: number; total_amount: number; paid_amount: number; created_date: string;
}

const FALLBACK_PRICES: ProductPrice[] = [
  { product_name: "6*9", unit_price: 9000, category: "aggregate" },
  { product_name: "3/4", unit_price: 13000, category: "aggregate" },
  { product_name: "1 inches", unit_price: 12000, category: "aggregate" },
  { product_name: "1 1/2 inches", unit_price: 11000, category: "aggregate" },
  { product_name: "ABC", unit_price: 8000, category: "aggregate" },
  { product_name: "Chip", unit_price: 8000, category: "aggregate" },
  { product_name: "Dust", unit_price: 7000, category: "aggregate" },
  { product_name: "Mix", unit_price: 7500, category: "aggregate" },
  { product_name: "Quer Dust", unit_price: 5000, category: "aggregate" },
  { product_name: "Cucumber", unit_price: null, category: "vegetable" },
  { product_name: "Bell Pepper", unit_price: null, category: "vegetable" },
  { product_name: "Tomato", unit_price: null, category: "vegetable" },
  { product_name: "Gurkin", unit_price: null, category: "vegetable" },
  { product_name: "Carrot", unit_price: null, category: "vegetable" },
  { product_name: "Cabbage", unit_price: null, category: "vegetable" },
  { product_name: "Beans", unit_price: null, category: "vegetable" },
  { product_name: "Leeks", unit_price: null, category: "vegetable" },
];

function getToday(): string { return new Date().toISOString().split("T")[0]; }

function SalesIncomesContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = params?.id as string;
  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [incomes, setIncomes] = useState<SalesIncomeItem[]>([]);
  const [products, setProducts] = useState<ProductPrice[]>(FALLBACK_PRICES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [creditSearch, setCreditSearch] = useState("");
  const [showCredits, setShowCredits] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<SalesIncomeFormData>({
    bill_number: "", name: "", date: getToday(), unit_price: "", quantity: "", paid: "",
  });

  const calculatedAmount = useMemo(() => {
    const up = Number(formData.unit_price) || 0;
    const qty = Number(formData.quantity) || 0;
    return up * qty;
  }, [formData.unit_price, formData.quantity]);

  const calculatedPaid = useMemo(() => Number(formData.paid || 0), [formData.paid]);
  // ✅ Discount = Amount - Paid witharak - Credit eka adu karanne na
  const calculatedDiscountForm = useMemo(() => Math.max(0, calculatedAmount - calculatedPaid), [calculatedAmount, calculatedPaid]);
  const calculatedPayable = useMemo(() => calculatedPaid, [calculatedPaid]);
  const calculatedCredit = useMemo(() => 0, []);

  const filteredIncomes = incomes.filter((item) => {
    const matchDate = filterDate ? item.date.slice(0, 10) === filterDate : true;
    const matchName = filterName ? item.name?.toLowerCase().includes(filterName.toLowerCase()) : true;
    return matchDate && matchName;
  });

  const fetchSalesIncomes = async () => {
    if (!branchId) return;
    try {
      setIsLoading(true); setErrorMessage("");
      const response = await fetch(`/api/expences/sales-incomes?branch_id=${encodeURIComponent(branchId)}`, { method: "GET", cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch sales incomes.");
      setIncomes(result.data || []);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Failed to load sales income records."); }
    finally { setIsLoading(false); }
  };

  const fetchCredits = async () => {
    if (!branchId) return;
    try {
      const res = await fetch(`/api/expences/sales-credits?branch_id=${encodeURIComponent(branchId)}`, { cache: "no-store" });
      const result = await res.json();
      if (result.success) setCredits(result.data || []);
    } catch { }
  };

  const fetchProducts = async () => {
    if (!branchId) return;
    try {
      const res = await fetch(`/api/expences/product-prices?branch_id=${encodeURIComponent(branchId)}`, { cache: "no-store" });
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) setProducts(result.data);
    } catch { }
  };

  useEffect(() => { if (branchId) { fetchSalesIncomes(); fetchProducts(); fetchCredits(); } }, [branchId]);

  const getCreditByBill = (billNo?: string) => {
    if (!billNo || billNo === "-") return undefined;
    return credits.find((c) => String(c.bill_number || "").trim().toLowerCase() === String(billNo).trim().toLowerCase());
  };

  // ✅ Uda table eke Credit eka = Yata table eke credit_amount (nayata ganna mudala)
  const getCreditAmountForItem = (item: SalesIncomeItem) => {
    const billNo = item.bill_number || item.billNumber || "-";
    const rec = getCreditByBill(billNo);
    if (rec) return Number(rec.credit_amount || 0);
    return Number(item.credit || 0);
  };

  // ✅ Totals
  const totalAmount = filteredIncomes.reduce((total, item) => total + Number(item.amount || 0), 0);
  const totalPaid = filteredIncomes.reduce((total, item) => total + Number(item.paid ?? 0), 0);
  const totalCreditTop = filteredIncomes.reduce((total, item) => total + getCreditAmountForItem(item), 0);
  // ✅ Discount = Amount - Paid witharak - Credit eka adu karanne na
  const totalDiscount = Math.max(0, totalAmount - totalPaid);

  const filteredCredits = useMemo(() => {
    let list = credits;
    if (filterDate) list = list.filter((r) => (r.created_date || "").slice(0, 10) === filterDate);
    if (creditSearch) {
      const s = creditSearch.toLowerCase();
      list = list.filter((r) => (r.customer_name + r.contact_number + r.vehicle_number + r.bill_number + r.product_name).toLowerCase().includes(s));
    }
    return list;
  }, [credits, filterDate, creditSearch]);

  const creditTotal = useMemo(() => filteredCredits.reduce((t, r) => t + Number(r.credit_amount || 0), 0), [filteredCredits]);
  const creditOverdueCount = useMemo(() => filteredCredits.filter((r) => (r.promise_date || "").slice(0, 10) < getToday()).length, [filteredCredits]);
  const creditOverdueAmount = useMemo(() => filteredCredits.filter((r) => (r.promise_date || "").slice(0, 10) < getToday()).reduce((t, r) => t + Number(r.credit_amount || 0), 0), [filteredCredits]);

  const getCreditStatus = (promiseDate: string) => {
    const d = (promiseDate || "").slice(0, 10);
    const today = getToday();
    if (d < today) return { label: "Overdue", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
    if (d === today) return { label: "Due Today", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    return { label: "Pending", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrorMessage("");
  };

  const handleNameChange = (value: string) => {
    const found = products.find((p) => p.product_name.toLowerCase() === value.toLowerCase());
    setFormData((prev) => ({ ...prev, name: value, unit_price: found && found.unit_price != null ? String(found.unit_price) : "" }));
    setErrorMessage("");
  };

  const handleEdit = (item: SalesIncomeItem) => {
    setEditingId(String(item.id));
    setFormData({
      bill_number: item.bill_number || item.billNumber || "",
      name: item.name || "",
      date: String(item.date || "").slice(0, 10) || getToday(),
      unit_price: String(item.unit_price ?? ""),
      quantity: String(item.quantity ?? ""),
      paid: String(item.paid ?? ""),
    });
    setErrorMessage(""); setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ bill_number: "", name: "", date: getToday(), unit_price: "", quantity: "", paid: "" });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/expences/sales-incomes?id=${encodeURIComponent(deleteId)}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Failed to delete");
      if (editingId === deleteId) handleCancelEdit();
      setDeleteId(null); setSuccessMessage("Entry deleted successfully.");
      window.setTimeout(() => setSuccessMessage(""), 3000);
      await fetchSalesIncomes(); await fetchCredits();
    } catch (err: any) { setErrorMessage(err.message || "Failed to delete entry"); setDeleteId(null); }
    finally { setIsDeleting(false); }
  };

  const handleOpenCreditPage = () => {
    if (!formData.name.trim()) { setErrorMessage("First enter Product Name, then Add Credit."); return; }
    if (calculatedAmount <= 0) { setErrorMessage("First enter Unit Price and Quantity."); return; }
    const q = new URLSearchParams({
      bill_number: formData.bill_number.trim() || "",
      product_name: formData.name.trim(),
      date: formData.date,
      total_amount: String(calculatedPayable),
      paid_amount: String(calculatedPaid),
      credit_amount: String(calculatedCredit),
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      discount: String(calculatedDiscountForm),
    });
    router.push(`/dashboard/branches/${branchId}/add-expenses/sales_incomes/credit?${q.toString()}`);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bill_number = formData.bill_number.trim();
    const name = formData.name.trim();
    const unit_price = Number(formData.unit_price);
    const quantity = Number(formData.quantity);
    const paid = calculatedPaid;
    const amount = calculatedAmount;
    // ✅ Discount = Amount - Paid witharak
    const discount = calculatedDiscountForm;
    const credit = 0;

    if (!branchId || !name || !formData.date || !formData.unit_price || !formData.quantity) {
      setErrorMessage("Please complete Name, Date, Unit Price and Quantity."); return;
    }
    if (paid < 0) { setErrorMessage("Paid cannot be less than 0."); return; }
    if (paid > amount) { setErrorMessage("Paid cannot be greater than Amount."); return; }

    try {
      setIsSubmitting(true); setErrorMessage("");
      const isEdit = !!editingId;
      const response = await fetch("/api/expences/sales-incomes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, branch_id: branchId, bill_number: bill_number || null, name, date: formData.date, unit_price, quantity, amount, discount, paid, credit }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || (isEdit ? "Failed to update sales income." : "Failed to save sales income."));
      setFormData({ bill_number: "", name: "", date: getToday(), unit_price: "", quantity: "", paid: "" });
      setEditingId(null);
      setSuccessMessage(isEdit ? `Updated: Amount LKR ${amount.toFixed(2)} | Paid LKR ${paid.toFixed(2)} | Discount LKR ${discount.toFixed(2)}` : `Saved: Amount LKR ${amount.toFixed(2)} | Paid LKR ${paid.toFixed(2)} | Discount LKR ${discount.toFixed(2)}`);
      window.setTimeout(() => setSuccessMessage(""), 4000);
      await fetchSalesIncomes(); await fetchCredits();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Failed to save sales income."); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteCredit = async (id: string) => {
    if (!confirm("Delete this credit record?")) return;
    try {
      const res = await fetch(`/api/expences/sales-credits?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Failed to delete");
      await fetchCredits();
    } catch (err: any) { setErrorMessage(err.message || "Failed to delete credit"); }
  };

  const handleBack = () => {
    const queryParams = new URLSearchParams();
    if (selectedSalesId) queryParams.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) queryParams.append("selected_capital_id", selectedCapitalId);
    router.push(`/dashboard/total-incomes${queryParams.toString() ? `?${queryParams}` : ""}`);
  };

  const clearFilters = () => { setFilterDate(""); setFilterName(""); setCreditSearch(""); };
  const deleteItem = incomes.find((x) => String(x.id) === String(deleteId));

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

        <div className={`p-6 rounded-2xl border shadow-2xl ${editingId ? "bg-amber-950/20 border-amber-500/40" : "bg-[#0d1527]/60 border-slate-800"}`}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-4 flex items-center gap-2">
            {editingId ? <><Pencil size={14} className="text-amber-400" /> Edit Sales Income Entry - ID #{editingId}</> : <><Plus size={14} className="text-red-400" /> Add New Sales Income Entry</>}
          </h2>
          {editingId && <p className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px]">Edit mode - Data tika change karala Update Entry click karanna. Cancel karanna nam Cancel Edit click karanna.</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Receipt size={12} />Bill Number</label><input type="text" name="bill_number" value={formData.bill_number} onChange={handleInputChange} placeholder="Ex: B-001" className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><FileText size={12} />Name *</label>
              <input type="text" list="product-list" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} required placeholder="Select / Type Name..." className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" />
              <datalist id="product-list">
                <optgroup label="Aggregate">
                  {products.filter((p) => p.category === "aggregate").map((p) => (
                    <option key={p.product_name} value={p.product_name}>{p.unit_price != null ? `LKR ${Number(p.unit_price).toLocaleString()}` : ""}</option>
                  ))}
                </optgroup>
                <optgroup label="Vegetables - Manual Price">
                  {products.filter((p) => p.category === "vegetable").map((p) => (
                    <option key={p.product_name} value={p.product_name}>Manual Price</option>
                  ))}
                </optgroup>
              </datalist>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} />Date</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Tag size={12} />Unit Price (LKR) - Auto</label><input type="number" step="0.01" min="0" name="unit_price" value={formData.unit_price} onChange={handleInputChange} required placeholder="Auto / Manual" className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Hash size={12} />Quantity</label><input type="number" step="0.01" min="0.01" name="quantity" value={formData.quantity} onChange={handleInputChange} required placeholder="0" className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={12} />Amount (LKR) - Auto</label><div className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-emerald-400 font-black text-sm">LKR {calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={12} />Paid (LKR)</label><input type="number" step="0.01" min="0" name="paid" value={formData.paid} onChange={handleInputChange} placeholder="0.00" className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><BadgePercent size={12} />Discount (LKR) - Auto = Amount - Paid</label><div className="w-full px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-black text-sm">LKR {calculatedDiscountForm.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 mt-2">
              {editingId && <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"><X size={14} /><span>Cancel Edit</span></button>}
              <button type="button" onClick={handleOpenCreditPage} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"><CreditCard size={14} /><span>Add Credit</span></button>
              <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${editingId ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20" : "bg-red-600 hover:bg-red-500 shadow-red-600/20"}`}>{isSubmitting ? <Loader2 size={14} className="animate-spin" /> : editingId ? <Pencil size={14} /> : <Plus size={14} />}<span>{isSubmitting ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update Entry" : "Save Income Entry"}</span></button>
            </div>
          </form>
        </div>

        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div><h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">Registered Sales Incomes Ledger</h2><p className="text-[10px] text-slate-500 mt-1">{filteredIncomes.length} records found</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-slate-400" />
                <input list="filter-product-list" value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Filter by Name... (3/4, Tomato)" className="px-3 py-2 bg-slate-50/80 border border-slate-800 rounded-xl text-slate-900 focus:border-red-500/60 focus:outline-none transition-colors w-56" />
                <datalist id="filter-product-list">
                  {products.map((p) => <option key={p.product_name} value={p.product_name} />)}
                </datalist>
              </div>
              <input id="filter-date" type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} className="px-3 py-2 bg-slate-50/80 border border-slate-800 rounded-xl text-slate-900 focus:border-red-500/60 focus:outline-none transition-colors" />
              {(filterDate || filterName) && (<button type="button" onClick={clearFilters} className="px-3 py-2 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/50 rounded-xl transition-colors text-[10px] font-bold">Clear Filter <X size={12} className="inline" /></button>)}
            </div>
          </div>

          {!isLoading && filteredIncomes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Amount</p><p className="mt-1 text-lg font-black text-red-400">LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-1 text-lg font-black text-emerald-400">LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><p className="text-[10px] uppercase tracking-wider text-amber-400">Total Credit - Nayata Ganna Mudala</p><p className="mt-1 text-lg font-black text-amber-400">LKR {totalCreditTop.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Discount = Amount - Paid</p><p className="mt-1 text-lg font-black text-amber-400">LKR {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            </div>
          )}

          {isLoading ? <div className="py-16 text-center flex flex-col items-center justify-center space-y-2"><Loader2 size={24} className="text-red-500 animate-spin" /><p className="text-slate-400">Loading branch entries...</p></div> : filteredIncomes.length === 0 ? <div className="py-16 text-center text-slate-500">{filterDate || filterName ? `No records found ${filterName ? `for "${filterName}"` : ""} ${filterDate ? `on ${filterDate}` : ""}.` : "No sales income records found for this branch."}</div> : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="py-3 px-4">Bill No</th><th className="py-3 px-4">Name</th><th className="py-3 px-4">Date</th><th className="py-3 px-4 text-right">Unit Price</th><th className="py-3 px-4 text-right">Qty</th><th className="py-3 px-4 text-right">Amount (LKR)</th><th className="py-3 px-4 text-right">Paid (LKR)</th><th className="py-3 px-4 text-right">Credit (LKR)</th><th className="py-3 px-4 text-right">Discount (LKR)</th><th className="py-3 px-4">Credit Customer</th><th className="py-3 px-4 text-center">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filteredIncomes.map((item) => {
                    const billNo = item.bill_number || item.billNumber || "-";
                    const creditRec = getCreditByBill(billNo);
                    const creditAmt = getCreditAmountForItem(item);
                    // ✅ Row Discount = Amount - Paid witharak - Credit adu karanne na
                    const rowDiscount = Math.max(0, Number(item.amount || 0) - Number(item.paid || 0));
                    const isEditingRow = String(editingId) === String(item.id);
                    return (
                      <tr key={item.id} className={`hover:bg-slate-900/70 transition-colors ${isEditingRow ? "bg-amber-500/10" : ""}`}>
                        <td className="py-3 px-4 font-bold text-slate-200">{billNo}</td>
                        <td className="py-3 px-4 font-bold text-slate-200">{item.name}</td>
                        <td className="py-3 px-4 text-slate-400">{item.date?.slice(0, 10)}</td>
                        <td className="py-3 px-4 text-right text-slate-300">LKR {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-slate-300">{Number(item.quantity || 0)}</td>
                        <td className="py-3 px-4 text-right font-black text-red-400">LKR {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-400">LKR {Number(item.paid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-black text-amber-400">LKR {creditAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-black text-amber-400">LKR {rowDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4">
                          {creditRec ? (
                            <div>
                              <p className="font-bold text-amber-300 flex items-center gap-1"><User size={11} /> {creditRec.customer_name}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={10} /> {creditRec.contact_number}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1"><Car size={10} /> {creditRec.vehicle_number}</p>
                            </div>
                          ) : (<span className="text-slate-600">-</span>)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <Link href={`/dashboard/branches/${branchId}/add-expenses/sales_incomes/${item.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">
                              <Eye size={12} /> View
                            </Link>
                            <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 rounded-lg text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                              <Pencil size={12} /> Edit
                            </button>
                            <button onClick={() => setDeleteId(String(item.id))} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/20 border border-red-500/40 text-red-300 rounded-lg text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-amber-500/20 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} className="text-amber-400" /> All Credit Records - This Branch</h2>
              <p className="text-[10px] text-slate-500 mt-1">{filteredCredits.length} records • Total Credit LKR {creditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} • <span className="text-red-400">{creditOverdueCount} Overdue</span> • <span className="text-red-400">Overdue LKR {creditOverdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCredits(!showCredits)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold">{showCredits ? "Hide" : "Show"}</button>
              <input value={creditSearch} onChange={(e) => setCreditSearch(e.target.value)} placeholder="Search customer / vehicle / bill..." className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500/60 focus:outline-none w-56" />
              <button onClick={handleOpenCreditPage} className="px-3 py-2 bg-amber-500 text-black font-bold rounded-xl flex items-center gap-1.5"><Plus size={13} /> Add Credit</button>
            </div>
          </div>
          {showCredits && (
            filteredCredits.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No credit records yet. {filterDate ? `Date: ${filterDate}` : "Use Add Credit button above."}</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="py-3 px-4">Bill No</th><th className="py-3 px-4">Customer</th><th className="py-3 px-4">Contact</th><th className="py-3 px-4">Vehicle</th><th className="py-3 px-4">Created Date</th><th className="py-3 px-4">Promise Date</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Credit Amount</th><th className="py-3 px-4 text-right">Total / Paid</th><th className="py-3 px-4 text-center">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {filteredCredits.map((r) => {
                      const st = getCreditStatus(r.promise_date);
                      return (
                        <tr key={r.id} className="hover:bg-slate-900/70">
                          <td className="py-3 px-4"><p className="font-bold">{r.bill_number || "-"}</p><p className="text-[10px] text-slate-500">{r.product_name}</p></td>
                          <td className="py-3 px-4 font-bold flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">{(r.customer_name || "?").charAt(0).toUpperCase()}</span>{r.customer_name}</td>
                          <td className="py-3 px-4">{r.contact_number}</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg font-bold">{r.vehicle_number}</span></td>
                          <td className="py-3 px-4">{(r.created_date || "").slice(0, 10) || "-"}</td>
                          <td className="py-3 px-4">{(r.promise_date || "").slice(0, 10)}</td>
                          <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${st.cls}`}>{st.label}</span></td>
                          <td className="py-3 px-4 text-right font-black text-amber-400">LKR {Number(r.credit_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right"><p className="text-slate-300">LKR {Number(r.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-emerald-400">Paid LKR {Number(r.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></td>
                          <td className="py-3 px-4 text-center"><button onClick={() => handleDeleteCredit(r.id)} className="p-2 text-slate-400 hover:text-red-400 border border-slate-800 rounded-lg"><X size={13} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-amber-500/20 font-black">
                      <td colSpan={7} className="py-3 px-4 text-right uppercase text-slate-300">Total Credit ({filteredCredits.length})</td>
                      <td className="py-3 px-4 text-right text-amber-400">LKR {creditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !isDeleting && setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0d1527] border border-red-500/40 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400"><AlertTriangle size={20} /></span>
              <div><p className="font-black text-white uppercase">Delete Entry?</p><p className="text-[11px] text-slate-400">Me action eka undo karanna ba.</p></div>
            </div>
            {deleteItem && (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-[11px] space-y-1">
                <p>Bill: <b className="text-white">{deleteItem.bill_number || deleteItem.billNumber || "-"}</b> • {deleteItem.name}</p>
                <p>Date: <b className="text-white">{String(deleteItem.date).slice(0, 10)}</b> • Amount: <b className="text-red-400">LKR {Number(deleteItem.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">{isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Yes, Delete</button>
            </div>
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