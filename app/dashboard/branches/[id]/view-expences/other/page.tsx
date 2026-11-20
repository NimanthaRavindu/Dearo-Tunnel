"use client";
import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle,ArrowLeft,Calendar,FileText,RefreshCw,Search,ShieldCheck,Tag,Wallet,X, Trash2, AlertTriangle, Loader2, CheckCircle2, Pencil, Save } from "lucide-react";

interface PageProps { params: Promise<{ id: string }>; }

interface OtherExpense {
  id?: number | string;
  reason?: string;
  expense_type?: string;
  total_payable?: number | string;
  total_paid?: number | string;
  balance?: number | string;
  expense_date?: string;
  date?: string;
  // ✅ QUANTITY - DB eken ena field names okkoma
  crusher_load_qty?: number | string;
  crusher_load_quantity?: number | string;
  crusher_qty?: number | string;
  crusher_load?: number | string;
  outside_load_qty?: number | string;
  outside_load_quantity?: number | string;
  outside_qty?: number | string;
  outside_load?: number | string;
  total_cube?: number | string;
  total_cube_qty?: number | string;
  total_cube_quantity?: number | string;
  total_quantity?: number | string;
}

interface Branch { id: number | string; branchName?: string; bName?: string; }

interface OtherSummary { payable: number; paid: number; balance: number; crusherQty: number; outsideQty: number; totalCube: number; }

type RowEditData = {
  expense_type: string; reason: string; total_payable: string; total_paid: string;
  balance: string; expense_date: string;
  crusher_load_qty: string; outside_load_qty: string; total_cube: string;
};

const EMPTY_SUMMARY: OtherSummary = { payable: 0, paid: 0, balance: 0, crusherQty: 0, outsideQty: 0, totalCube: 0 };

function numeric(value: unknown): number { return Number(value ?? 0) || 0; }
function money(value: unknown): string { return numeric(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function qty(value: unknown): string { return numeric(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function expenseDate(item: OtherExpense): string { return String(item.expense_date || item.date || "").slice(0, 10); }

function getCrusherQty(item: OtherExpense): number {
  return numeric(item.crusher_load_qty ?? item.crusher_load_quantity ?? item.crusher_qty ?? item.crusher_load ?? 0);
}
function getOutsideQty(item: OtherExpense): number {
  return numeric(item.outside_load_qty ?? item.outside_load_quantity ?? item.outside_qty ?? item.outside_load ?? 0);
}
function getTotalCube(item: OtherExpense): number {
  const direct = numeric(item.total_cube ?? item.total_cube_qty ?? item.total_cube_quantity ?? item.total_quantity ?? 0);
  if (direct > 0) return direct;
  return getCrusherQty(item) + getOutsideQty(item);
}
function isBrekerOrLoading(type: string): boolean {
  const t = String(type || "").toLowerCase();
  return t.includes("breker") || t.includes("breaker") || t.includes("loading");
}

export default function ViewOtherExpensesPage({ params }: PageProps) {
  const router = useRouter();
  const routeParams = use(params);
  const branchId = routeParams?.id ? decodeURIComponent(routeParams.id) : "";

  const [data, setData] = useState<OtherExpense[]>([]);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowEditData, setRowEditData] = useState<RowEditData>({
    expense_type: "", reason: "", total_payable: "", total_paid: "", balance: "", expense_date: "",
    crusher_load_qty: "", outside_load_qty: "", total_cube: "",
  });
  const [isRowSaving, setIsRowSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ MAIN FIX - Breker / Loading select kalama WITHARAK column 3ka
  const showQuantityColumns = useMemo(() => {
    return isBrekerOrLoading(categoryFilter);
  }, [categoryFilter]);

  const loadData = async () => {
    if (!branchId || branchId === "[id]") { setLoading(false); return; }
    try {
      setLoading(true); setError("");
      const expenseResponse = await fetch(`/api/expences/other?branchId=${encodeURIComponent(branchId)}`, { cache: "no-store" });
      if (!expenseResponse.ok) throw new Error("Failed to load other expenses.");
      const expenseResult = await expenseResponse.json();
      setData(Array.isArray(expenseResult) ? expenseResult : expenseResult.data || expenseResult.rows || []);
      const branchResponse = await fetch("/api/branch", { cache: "no-store" });
      if (branchResponse.ok) {
        const branchResult = await branchResponse.json();
        if (Array.isArray(branchResult)) {
          const currentBranch = branchResult.find((branch: Branch) => String(branch.id) === String(branchId));
          if (currentBranch) setBranchName(currentBranch.branchName || currentBranch.bName || "");
        }
      }
    } catch (requestError) {
      console.error("Other expenses loading error:", requestError);
      setData([]);
      setError(requestError instanceof Error ? requestError.message : "Unable to load other expenses.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [branchId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true); setError("");
      const res = await fetch(`/api/expences/other?id=${encodeURIComponent(deleteId)}&branchId=${encodeURIComponent(branchId)}`, { method: "DELETE", cache: "no-store" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) throw new Error(result.error || "Failed to delete record.");
      if (editingRowId === deleteId) handleCancelRowEdit();
      setDeleteId(null);
      setSuccessMessage("Other expense record deleted successfully.");
      window.setTimeout(() => setSuccessMessage(""), 3000);
      await loadData();
    } catch (err: any) { setError(err.message || "Failed to delete record."); setDeleteId(null); }
    finally { setIsDeleting(false); }
  };

  const emptyRowEdit = (): RowEditData => ({
    expense_type: "", reason: "", total_payable: "", total_paid: "", balance: "", expense_date: "",
    crusher_load_qty: "", outside_load_qty: "", total_cube: "",
  });

  const handleEditRow = (item: OtherExpense) => {
    setEditingRowId(String(item.id));
    const c = getCrusherQty(item); const o = getOutsideQty(item); const t = getTotalCube(item);
    setRowEditData({
      expense_type: item.expense_type || item.reason || "",
      reason: item.reason || item.expense_type || "",
      total_payable: String(item.total_payable ?? ""),
      total_paid: String(item.total_paid ?? ""),
      balance: String(item.balance ?? Math.max(0, numeric(item.total_payable) - numeric(item.total_paid))),
      expense_date: expenseDate(item) || new Date().toISOString().split("T")[0],
      crusher_load_qty: c ? String(c) : "",
      outside_load_qty: o ? String(o) : "",
      total_cube: t ? String(t) : "",
    });
    setError(""); setSuccessMessage("");
  };

  const handleCancelRowEdit = () => { setEditingRowId(null); setRowEditData(emptyRowEdit()); };

  const handleRowInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRowEditData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "total_payable" || name === "total_paid") {
        const payable = Number(name === "total_payable" ? value : prev.total_payable) || 0;
        const paid = Number(name === "total_paid" ? value : prev.total_paid) || 0;
        next.balance = String(Math.max(0, payable - paid));
      }
      if (name === "expense_type") next.reason = value;
      if (name === "crusher_load_qty" || name === "outside_load_qty") {
        const c = Number(name === "crusher_load_qty" ? value : prev.crusher_load_qty) || 0;
        const o = Number(name === "outside_load_qty" ? value : prev.outside_load_qty) || 0;
        next.total_cube = String(c + o);
      }
      return next;
    });
    setError("");
  };

  const handleSaveRow = async () => {
    if (!editingRowId) return;
    const expense_type = rowEditData.expense_type.trim();
    const reason = rowEditData.reason.trim() || expense_type;
    const total_payable = Number(rowEditData.total_payable);
    const total_paid = Number(rowEditData.total_paid);
    const balance = Number(rowEditData.balance);
    const expense_date = rowEditData.expense_date;
    const crusher_load_qty = Number(rowEditData.crusher_load_qty) || 0;
    const outside_load_qty = Number(rowEditData.outside_load_qty) || 0;
    const total_cube = Number(rowEditData.total_cube) || (crusher_load_qty + outside_load_qty);
    if (!expense_type) { setError("Classification / Expense Type eka danna ona."); return; }
    if (!expense_date) { setError("Date eka danna ona."); return; }
    if (total_payable < 0 || total_paid < 0) { setError("Payable / Paid 0 ta wada adu karanna ba."); return; }
    if (total_paid > total_payable) { setError("Total Paid, Total Payable ta wada wadi karanna ba."); return; }
    try {
      setIsRowSaving(true); setError("");
      const res = await fetch("/api/expences/other", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRowId, branchId: branchId, branch_id: branchId,
          expense_type, expenseType: expense_type, classification_reason: expense_type, reason,
          total_payable, total_paid, balance, expense_date, date: expense_date, expenseDate: expense_date,
          crusher_load_qty, crusher_load_quantity: crusher_load_qty, crusher_qty: crusher_load_qty,
          outside_load_qty, outside_load_quantity: outside_load_qty, outside_qty: outside_load_qty,
          total_cube, total_cube_qty: total_cube, total_cube_quantity: total_cube,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) throw new Error(result.error || result.details || "Failed to update record.");
      setEditingRowId(null); setRowEditData(emptyRowEdit());
      setSuccessMessage(`Updated: ${expense_type} | Payable ${money(total_payable)} | Paid ${money(total_paid)} | Balance ${money(balance)}`);
      window.setTimeout(() => setSuccessMessage(""), 4000);
      await loadData();
    } catch (err: any) { console.error("Save other expense error:", err); setError(err.message || "Failed to update record."); }
    finally { setIsRowSaving(false); }
  };

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((item) => {
      const type = String(item.expense_type || "").toLowerCase();
      const reason = String(item.reason || "").toLowerCase();
      const filterLower = categoryFilter.toLowerCase();
      const matchesCategory = categoryFilter === "ALL" || type === filterLower || reason === filterLower || type.includes(filterLower) || reason.includes(filterLower);
      const matchesDate = !selectedDate || expenseDate(item) === selectedDate;
      const matchesSearch = !query || [item.reason, item.expense_type, item.total_payable, item.total_paid, item.balance, expenseDate(item)].some((value) => String(value ?? "").toLowerCase().includes(query));
      return matchesCategory && matchesDate && matchesSearch;
    });
  }, [data, categoryFilter, selectedDate, search]);

  const summary = useMemo<OtherSummary>(() => {
    return filteredData.reduce<OtherSummary>((total, item) => ({
      payable: total.payable + numeric(item.total_payable),
      paid: total.paid + numeric(item.total_paid),
      balance: total.balance + numeric(item.balance),
      crusherQty: total.crusherQty + getCrusherQty(item),
      outsideQty: total.outsideQty + getOutsideQty(item),
      totalCube: total.totalCube + getTotalCube(item),
    }), EMPTY_SUMMARY);
  }, [filteredData]);

  const clearFilters = () => { setCategoryFilter("ALL"); setSelectedDate(""); setSearch(""); };
  const deleteItem = data.find((x) => String(x.id) === String(deleteId));
  const inputCls = "w-full px-2 py-2 bg-slate-950 border border-amber-500/50 rounded-lg text-slate-100 text-xs focus:border-amber-400 focus:outline-none";
  const totalCols = showQuantityColumns ? 9 : 6;

  return (
    <main className="min-h-screen bg-[#070a12] p-4 font-sans text-slate-300 antialiased md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-900 pb-5 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3.5">
            <button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"><ArrowLeft size={16} /></button>
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-md border border-purple-500/20 bg-purple-500/10 p-1.5 text-purple-400"><Wallet size={15} /></div>
                <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">Operational Overhead Ledger</h1>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-purple-400/80">Scope Context: {branchName || `Branch Node ID: ${branchId}`}{categoryFilter !== "ALL" ? ` • Filter: ${categoryFilter}` : ""}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-lg border border-violet-500/30 bg-slate-950 px-3 py-2 text-xs uppercase tracking-wider text-slate-300 outline-none focus:border-purple-500">
              <option value="ALL">ALL CLASSIFICATIONS</option>
              <option value="Food">Food</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
              <option value="Petty Cash">Petty Cash</option>
              <option value="Monthly Rental">Monthly Rental</option>
              <option value="Chemical Float">Chemical Float</option>
              <option value="Construction Repair">Construction Repair</option>
              <option value="Loading Expenses">Loading Expenses</option>
              <option value="Breker Expenses">Breker Expenses</option>
              <option value="Other Payments">Other Payments</option>
            </select>
            <div className="relative"><Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="rounded-lg border border-slate-800 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-purple-500" /></div>
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-300 outline-none focus:border-purple-500" /></div>
            {(categoryFilter !== "ALL" || selectedDate || search) && (<button type="button" onClick={clearFilters} className="flex items-center justify-center rounded-lg border border-slate-800 px-3 text-slate-400 transition hover:text-white" aria-label="Clear filters"><X size={14} /></button>)}
            <button type="button" onClick={loadData} disabled={loading} className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 transition hover:text-purple-400 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Refresh</button>
            <button type="button" onClick={() => setShowSummary(true)} className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-400 transition hover:bg-purple-500/20"><FileText size={13} className="mr-1 inline" />View Summary</button>
          </div>
        </header>

        {successMessage && (<div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400"><CheckCircle2 size={16} /> {successMessage}</div>)}
        {error && (<div className="mb-5 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"><span>{error}</span><button type="button" onClick={loadData} className="font-bold underline">Retry</button></div>)}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard title={`Total Payable ${categoryFilter !== "ALL" ? `(${categoryFilter})` : ""}`} value={money(summary.payable)} color="purple" />
          <SummaryCard title={`Total Paid ${categoryFilter !== "ALL" ? `(${categoryFilter})` : ""}`} value={money(summary.paid)} color="emerald" />
          <SummaryCard title="Outstanding Balance" value={money(summary.balance)} color="amber" />
        </section>

        {/* ✅ QUANTITY CARDS - Breker / Loading WITHARAK */}
        {showQuantityColumns && (
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard title="Crusher Load Quantity" value={`${qty(summary.crusherQty)} Cube`} color="purple" />
            <SummaryCard title="Outside Load Quantity" value={`${qty(summary.outsideQty)} Cube`} color="emerald" />
            <SummaryCard title="Total Cube Quantity" value={`${qty(summary.totalCube)} Cube`} color="amber" />
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/10 shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/80 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="p-4">Classification Matrix</th>
                  {/* ✅ HEADER - Breker / Loading WITHARAK */}
                  {showQuantityColumns && <th className="p-4 text-right">Crusher Load cube Quantity</th>}
                  {showQuantityColumns && <th className="p-4 text-right">Outside Load cube Quantity</th>}
                  {showQuantityColumns && <th className="p-4 text-right">Total Cube Quantity</th>}
                  <th className="p-4 text-right">Total Payable</th>
                  <th className="p-4 text-right">Total Paid</th>
                  <th className="p-4 text-right">Outstanding Balance</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 font-mono text-[11px]">
                {loading ? (
                  <tr><td colSpan={totalCols} className="p-12 text-center text-slate-500">Loading operational entries...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={totalCols} className="p-12 text-center text-slate-600"><AlertCircle size={18} className="mx-auto mb-2" />No operational records found for {categoryFilter}.</td></tr>
                ) : (
                  filteredData.map((item, index) => {
                    const balance = numeric(item.balance);
                    const settled = balance <= 0;
                    const isEditingRow = String(editingRowId) === String(item.id);
                    const isQtyRow = isBrekerOrLoading(item.expense_type || item.reason || "");
                    if (isEditingRow) {
                      return (
                        <tr key={item.id ?? index} className="bg-amber-500/10 border-2 border-amber-500/40 align-top">
                          <td className="p-2">
                            <div className="flex flex-col gap-1.5 min-w-[170px]">
                              <select name="expense_type" value={rowEditData.expense_type} onChange={handleRowInputChange} className={inputCls}>
                                <option value="">Select Type</option>
                                <option value="Food">Food</option>
                                <option value="Agriculture">Agriculture</option>
                                <option value="Water">Water</option>
                                <option value="Electricity">Electricity</option>
                                <option value="Petty Cash">Petty Cash</option>
                                <option value="Monthly Rental">Monthly Rental</option>
                                <option value="Chemical Float">Chemical Float</option>
                                <option value="Construction Repair">Construction Repair</option>
                                <option value="Loading Expenses">Loading Expenses</option>
                                <option value="Breker Expenses">Breker Expenses</option>
                                <option value="Other Expenses">Other Expenses</option>
                                {rowEditData.expense_type && !["Food","Agriculture","Water","Electricity","Petty Cash","Monthly Rental","Chemical Float","Construction Repair","Loading Expenses","Breker Expenses","Other Expenses"].includes(rowEditData.expense_type) && (<option value={rowEditData.expense_type}>{rowEditData.expense_type}</option>)}
                              </select>
                              <input name="reason" value={rowEditData.reason} onChange={handleRowInputChange} className={inputCls} placeholder="Reason / Note" />
                            </div>
                          </td>
                          {/* ✅ EDIT - Quantity witharak Breker / Loading nam */}
                          {showQuantityColumns && (<><td className="p-2"><input type="number" step="0.01" name="crusher_load_qty" value={rowEditData.crusher_load_qty} onChange={handleRowInputChange} className={inputCls} placeholder="Crusher Qty" /></td><td className="p-2"><input type="number" step="0.01" name="outside_load_qty" value={rowEditData.outside_load_qty} onChange={handleRowInputChange} className={inputCls} placeholder="Outside Qty" /></td><td className="p-2"><input type="number" step="0.01" name="total_cube" value={rowEditData.total_cube} onChange={handleRowInputChange} className={inputCls} placeholder="Total Cube" /></td></>)}
                          <td className="p-2"><input type="number" step="0.01" name="total_payable" value={rowEditData.total_payable} onChange={handleRowInputChange} className={inputCls} /></td>
                          <td className="p-2"><input type="number" step="0.01" name="total_paid" value={rowEditData.total_paid} onChange={handleRowInputChange} className={inputCls} /></td>
                          <td className="p-2"><input type="number" step="0.01" name="balance" value={rowEditData.balance} onChange={handleRowInputChange} className={inputCls} /></td>
                          <td className="p-2"><input type="date" name="expense_date" value={rowEditData.expense_date} onChange={handleRowInputChange} className={inputCls} /></td>
                          <td className="p-2 text-center">
                            <div className="flex flex-col gap-1.5 min-w-[110px]">
                              <button type="button" onClick={handleSaveRow} disabled={isRowSaving} className="inline-flex items-center justify-center gap-1 rounded bg-emerald-600 px-2 py-2 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{isRowSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save</button>
                              <button type="button" onClick={handleCancelRowEdit} disabled={isRowSaving} className="inline-flex items-center justify-center gap-1 rounded bg-slate-700 px-2 py-2 text-[10px] font-bold text-white hover:bg-slate-600"><X size={12} /> Cancel</button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={item.id ?? index} className="transition-colors hover:bg-slate-900/30">
                        <td className="whitespace-nowrap p-4"><span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/10 bg-purple-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-purple-400"><Tag size={10} />{item.expense_type || item.reason || "General Overhead"}</span></td>
                        {/* ✅ BODY - Quantity cells Breker / Loading witharak */}
                        {showQuantityColumns && (<><td className="p-4 text-right font-medium text-cyan-300">{isQtyRow ? `${qty(getCrusherQty(item))} Cube` : "-"}</td><td className="p-4 text-right font-medium text-cyan-300">{isQtyRow ? `${qty(getOutsideQty(item))} Cube` : "-"}</td><td className="p-4 text-right font-bold text-white">{isQtyRow ? `${qty(getTotalCube(item))} Cube` : "-"}</td></>)}
                        <td className="p-4 text-right font-medium text-slate-300">{money(item.total_payable)}</td>
                        <td className="p-4 text-right font-medium text-emerald-400">{money(item.total_paid)}</td>
                        <td className="p-4 text-right font-bold">{settled ? (<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] uppercase tracking-wider text-emerald-400"><ShieldCheck size={10} />Settled</span>) : (<div className="inline-flex flex-col items-end"><span className="text-amber-400">{money(balance)}</span><span className="text-[8px] uppercase tracking-tighter text-amber-600">Deferred</span></div>)}</td>
                        <td className="whitespace-nowrap p-4 text-slate-300"><Calendar size={12} className="mr-2 inline text-slate-600" />{expenseDate(item) || "-"}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button type="button" onClick={() => router.push(`/dashboard/branches/${encodeURIComponent(branchId)}/view-expences/other/${item.id}`)} className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-400 transition hover:bg-purple-600 hover:text-white"><FileText size={11} className="mr-1 inline" />View Summary</button>
                            <button type="button" onClick={() => handleEditRow(item)} className="inline-flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400 transition hover:bg-blue-600 hover:text-white"><Pencil size={11} />Edit</button>
                            <button type="button" onClick={() => setDeleteId(String(item.id))} className="inline-flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-600 hover:text-white"><Trash2 size={11} />Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {!loading && filteredData.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-800 bg-slate-950/70 font-bold">
                    <td className="p-4 text-slate-400">Filtered Total {categoryFilter !== "ALL" ? `(${categoryFilter})` : ""}</td>
                    {showQuantityColumns && (<><td className="p-4 text-right text-cyan-300">{qty(summary.crusherQty)} Cube</td><td className="p-4 text-right text-cyan-300">{qty(summary.outsideQty)} Cube</td><td className="p-4 text-right text-white">{qty(summary.totalCube)} Cube</td></>)}
                    <td className="p-4 text-right text-purple-400">{money(summary.payable)}</td>
                    <td className="p-4 text-right text-emerald-400">{money(summary.paid)}</td>
                    <td className="p-4 text-right text-amber-400">{money(summary.balance)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>

      {showSummary && (
        <SummaryModal title="Operational Expense Summary" count={filteredData.length} values={[["Total Payable", money(summary.payable)], ["Total Paid", money(summary.paid)], ["Outstanding Balance", money(summary.balance)], ...(showQuantityColumns ? [["Crusher Load Quantity", `${qty(summary.crusherQty)} Cube`], ["Outside Load Quantity", `${qty(summary.outsideQty)} Cube`], ["Total Cube Quantity", `${qty(summary.totalCube)} Cube`]] as string[][] : [])]} onClose={() => setShowSummary(false)} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-[#0d1527] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400"><AlertTriangle size={20} /></span><div><p className="font-black text-white uppercase">Delete Record?</p><p className="text-[11px] text-slate-400">Me action eka undo karanna ba.</p></div></div>
            {deleteItem && (<div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-[11px] space-y-1"><p>Type: <b className="text-white">{deleteItem.expense_type || deleteItem.reason || "-"}</b></p><p>Date: <b className="text-white">{expenseDate(deleteItem) || "-"}</b> • Payable: <b className="text-amber-400">LKR {money(deleteItem.total_payable)}</b> • Paid: <b className="text-emerald-400">LKR {money(deleteItem.total_paid)}</b></p><p>Reason: <span className="text-slate-300">{deleteItem.reason || "-"}</span></p>{isBrekerOrLoading(deleteItem.expense_type || deleteItem.reason || "") && (<p>Crusher: <b className="text-cyan-300">{qty(getCrusherQty(deleteItem))} Cube</b> • Outside: <b className="text-cyan-300">{qty(getOutsideQty(deleteItem))} Cube</b> • Total: <b className="text-white">{qty(getTotalCube(deleteItem))} Cube</b></p>)}</div>)}
            <div className="flex gap-2"><button onClick={() => setDeleteId(null)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white">Cancel</button><button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50">{isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Yes, Delete</button></div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ title, value, color }: { title: string; value: string; color: "purple" | "emerald" | "amber"; }) {
  const colors = { purple: "text-purple-400", emerald: "text-emerald-400", amber: "text-amber-400" };
  return (<div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5"><p className="text-[10px] uppercase tracking-wider text-slate-500">{title}</p><p className={`mt-3 text-xl font-black ${colors[color]}`}>{value}</p></div>);
}

function SummaryModal({ title, count, values, onClose }: { title: string; count: number; values: string[][]; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0d1527] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4"><div><h2 className="font-mono text-lg font-bold uppercase text-white">{title}</h2><p className="mt-1 text-xs text-slate-500">{count} records</p></div><button type="button" onClick={onClose} className="text-slate-500 transition hover:text-white" aria-label="Close summary"><X size={18} /></button></div>
        <div className="grid gap-3 sm:grid-cols-2"><SummaryCard title="Records" value={String(count)} color="purple" />{values.map(([label, value]) => (<SummaryCard key={label} title={label} value={value} color="emerald" />))}</div>
      </div>
    </div>
  );
}