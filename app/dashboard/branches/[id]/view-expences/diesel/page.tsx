"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Droplets, Fuel, RefreshCw, Wallet, CreditCard, Filter, X, Calendar, Eye, BarChart3, Banknote, FileText, FileSpreadsheet, Download, Minus, Equal, TrendingDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type DieselExpense = { id: number; branch_id: string; date: string; machine: string; diesel: number | string; amount: number | string; payable: number | string; paid: number | string; };
type InitialAdd = { id?: number; branch_id?: string; date: string; diesel: number; amount: number };
type CardColor = "cyan" | "blue" | "orange" | "green" | "red" | "violet";
const machines = ["Komatsu","CAT","JCB","Excavator","Loader","Backhoe Loader","Wheel Loader","Breker Machine","Compressor","Tractor"];
const numberValue = (v: any) => Number(v || 0);
// ✅ MINUS PENNA ONA NISA - Negative value walata - sign eka enawa
const formatNumber = (v: any) => Number(v || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMinus = (v: any) => {
  const n = Number(v || 0);
  if (n < 0) return `- ${formatNumber(Math.abs(n))}`;
  return formatNumber(n);
};
const DIESEL_PRICE = 397;

export default function ViewDieselExpensesPage() {
  const params = useParams(); const router = useRouter();
  const branchId = Array.isArray(params?.id)? params.id[0] : String(params?.id || "");
  const [expenses, setExpenses] = useState<DieselExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialDieselStock, setInitialDieselStock] = useState(0);
  const [initialTotalAmount, setInitialTotalAmount] = useState(0);
  const [showInitialSummary, setShowInitialSummary] = useState(false);
  const [initialHistory, setInitialHistory] = useState<InitialAdd[]>([]);
  const [initialFilterDate, setInitialFilterDate] = useState("");
  const [modalType, setModalType] = useState<"initial" | "used" | "totalAmount" | "remaining" | "remainingBalance" | "total">("initial");
  const [filterDate, setFilterDate] = useState("");
  const [filterMachine, setFilterMachine] = useState("");
  const [usedFilterDate, setUsedFilterDate] = useState("");
  const [usedFilterMachine, setUsedFilterMachine] = useState("");

  const mapHistory = (arr: any[]) => (arr || [])
    .filter((h: any) => !h.branch_id || String(h.branch_id) === String(branchId))
    .map((h: any) => {
      let rawDate = String(h.stock_date || h.initial_date || h.created_at || h.date || "").slice(0,10);
      if (!rawDate || rawDate === "null" || rawDate === "Invalid Date" || rawDate.startsWith("0000")) rawDate = "No Date";
      return { id: h.id, branch_id: h.branch_id, date: rawDate, diesel: Number(h.added_diesel ?? h.total_diesel ?? h.diesel ?? 0), amount: Number(h.added_amount ?? h.total_amount ?? h.amount ?? 0) };
    });

  const loadExpenses = async () => {
    if (!branchId) return;
    try { setLoading(true);
      const res = await fetch(`/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}`, { cache: "no-store" });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setExpenses((data.expenses || []).filter((e:any)=> String(e.branch_id)===String(branchId)));
      if (data.summary) { setInitialDieselStock(Number(data.summary.totalDiesel || 0)); setInitialTotalAmount(Number(data.summary.totalAmount || 0)); }
      if (Array.isArray(data.history)) setInitialHistory(mapHistory(data.history));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const loadInitialHistory = async () => {
    if (!branchId) return;
    try {
      const r = await fetch(`/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}&type=history`, { cache: "no-store" });
      if (!r.ok) return; const j = await r.json();
      const arr = Array.isArray(j) ? j : (Array.isArray(j.history) ? j.history : []);
      setInitialHistory(mapHistory(arr));
    } catch {}
  };
  useEffect(() => { setExpenses([]); setInitialHistory([]); setInitialDieselStock(0); setInitialTotalAmount(0); if (branchId) { loadExpenses(); loadInitialHistory(); } }, [branchId]);
  useEffect(() => { if (!showInitialSummary) return; const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowInitialSummary(false); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [showInitialSummary]);

  const filteredExpenses = useMemo(() => expenses.filter(item => { const d = item.date?.slice(0, 10); return (!filterMachine || item.machine === filterMachine) && (!filterDate || d === filterDate); }), [expenses, filterDate, filterMachine]);
  const totalUsedDiesel = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.diesel), 0), [expenses]);
  const totalPayable = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.payable), 0), [expenses]);
  const totalPaid = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.paid), 0), [expenses]);
  const totalBalance = totalPayable - totalPaid;
  const fDiesel = useMemo(() => filteredExpenses.reduce((s, i) => s + numberValue(i.diesel), 0), [filteredExpenses]);
  const fPayable = useMemo(() => filteredExpenses.reduce((s, i) => s + numberValue(i.payable), 0), [filteredExpenses]);
  const isFiltered = Boolean(filterDate || filterMachine);
  const activeDieselUsed = isFiltered? fDiesel : totalUsedDiesel;
  const activePayable = isFiltered? fPayable : totalPayable;
  const displayTotalDiesel = initialDieselStock;
  const displayDieselUsed = activeDieselUsed;
  const displayTotalAmount = activePayable;

  // ✅ FIX - REMAINING MINUS CORRECT - Math.max(0) NA - 745 - 935 = -190
  const displayRemainingDiesel = displayTotalDiesel - totalUsedDiesel;
  const displayRemainingBalance = displayRemainingDiesel * DIESEL_PRICE; // -190 x 397 = -75430
  const displayInitialDiesel = initialDieselStock;
  const displayInitialAmount = initialTotalAmount;
  const usedPercent = initialDieselStock > 0 ? (totalUsedDiesel / initialDieselStock) * 100 : 0;
  const remainingPercent = 100 - usedPercent; // -25.5% wenna puluwan - eka hari
  const isOverUsed = displayRemainingDiesel < 0;

  const initialByDate = useMemo(() => {
    const map = new Map<string, { date: string; diesel: number; amount: number; count: number }>();
    initialHistory.forEach((h) => { const d = String(h.date || "").slice(0,10) || "No Date"; const cur = map.get(d) || { date: d, diesel: 0, amount: 0, count: 0 }; cur.diesel += numberValue(h.diesel); cur.amount += numberValue(h.amount); cur.count += 1; map.set(d, cur); });
    return Array.from(map.values()).sort((a, b) => { if (a.date === "No Date") return -1; if (b.date === "No Date") return 1; return b.date.localeCompare(a.date); });
  }, [initialHistory]);
  const filteredInitialByDate = useMemo(() => initialByDate.filter(r => !initialFilterDate || r.date === initialFilterDate), [initialByDate, initialFilterDate]);
  const totalInitialHistoryDiesel = useMemo(() => initialHistory.reduce((s, h) => s + numberValue(h.diesel), 0), [initialHistory]);
  const totalInitialHistoryAmount = useMemo(() => initialHistory.reduce((s, h) => s + numberValue(h.amount), 0), [initialHistory]);

  const dateWiseSummary = useMemo(() => {
    const map = new Map<string, { date: string; diesel: number; amount: number; paid: number; balance: number; count: number; machines: Set<string> }>();
    expenses.forEach((item) => {
      const d = String(item.date || "").slice(0, 10) || "-";
      const cur = map.get(d) || { date: d, diesel: 0, amount: 0, paid: 0, balance: 0, count: 0, machines: new Set<string>() };
      cur.diesel += numberValue(item.diesel); cur.amount += numberValue(item.payable ?? item.amount); cur.paid += numberValue(item.paid); cur.balance += numberValue(item.payable ?? item.amount) - numberValue(item.paid); cur.count += 1; if (item.machine) cur.machines.add(item.machine); map.set(d, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses]);
  const machineWiseSummary = useMemo(() => {
    const map = new Map<string, { machine: string; diesel: number; amount: number; paid: number; balance: number; count: number }>();
    expenses.forEach((item) => {
      const key = item.machine || "-";
      const cur = map.get(key) || { machine: key, diesel: 0, amount: 0, paid: 0, balance: 0, count: 0 };
      cur.diesel += numberValue(item.diesel); cur.amount += numberValue(item.payable ?? item.amount); cur.paid += numberValue(item.paid); cur.balance += numberValue(item.payable ?? item.amount) - numberValue(item.paid); cur.count += 1; map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.diesel - a.diesel);
  }, [expenses]);
  const filteredUsedByDate = useMemo(() => dateWiseSummary.filter(r => (!usedFilterDate || r.date === usedFilterDate) && (!usedFilterMachine || Array.from(r.machines).includes(usedFilterMachine))), [dateWiseSummary, usedFilterDate, usedFilterMachine]);
  const filteredUsedByMachine = useMemo(() => machineWiseSummary.filter(m => !usedFilterMachine || m.machine === usedFilterMachine), [machineWiseSummary, usedFilterMachine]);
  const filteredUsedExpenses = useMemo(() => expenses.filter(e => (!usedFilterDate || String(e.date).slice(0,10) === usedFilterDate) && (!usedFilterMachine || e.machine === usedFilterMachine)), [expenses, usedFilterDate, usedFilterMachine]);
  const filteredUsedDiesel = filteredUsedExpenses.reduce((s, i) => s + numberValue(i.diesel), 0);
  const filteredUsedPayable = filteredUsedExpenses.reduce((s, i) => s + numberValue(i.payable), 0);
  const filteredUsedPaid = filteredUsedExpenses.reduce((s, i) => s + numberValue(i.paid), 0);

  const clearFilters = () => { setFilterDate(""); setFilterMachine(""); };
  const handleCardEye = async (type: "initial" | "used" | "totalAmount" | "remaining" | "remainingBalance" | "total") => {
    setModalType(type); setUsedFilterDate(""); setUsedFilterMachine(""); setInitialFilterDate("");
    await loadInitialHistory(); await loadExpenses(); setShowInitialSummary(true);
  };

  const downloadInitialPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(16); doc.text("DEARO - Initial Diesel Stock History", 14, 15); doc.setFontSize(10); doc.text(`Branch: ${branchId}  |  Date: ${new Date().toLocaleDateString()}`, 14, 23); doc.text(`Total Initial Diesel: ${formatNumber(initialDieselStock)} L  |  Total Amount: Rs. ${formatNumber(initialTotalAmount)}`, 14, 30);
    let running = 0; const sorted = [...filteredInitialByDate].sort((a, b) => { if (a.date === "No Date") return -1; if (b.date === "No Date") return 1; return a.date.localeCompare(b.date); });
    const body = sorted.map((r) => { running += r.diesel; return [r.date, String(r.count), `${formatNumber(r.diesel)} L`, `Rs. ${formatNumber(r.amount)}`, `${formatNumber(running)} L`]; });
    autoTable(doc, { startY: 35, head: [["Date", "Adds", "Added Diesel (L)", "Added Amount (Rs.)", "Running Total (L)"]], body, foot: [["TOTAL", String(initialHistory.length), `${formatNumber(totalInitialHistoryDiesel)} L`, `Rs. ${formatNumber(totalInitialHistoryAmount)}`, `${formatNumber(totalInitialHistoryDiesel)} L`]], styles: { fontSize: 10 }, headStyles: { fillColor: [139, 92, 246] } });
    doc.save(`Initial-Diesel-History-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const downloadInitialExcel = () => {
    let running = 0; const sorted = [...filteredInitialByDate].sort((a, b) => { if (a.date === "No Date") return -1; if (b.date === "No Date") return 1; return a.date.localeCompare(b.date); });
    const wsData = [["DEARO - Initial Diesel Stock History", "", "", "", ""],[`Branch: ${branchId}`, `Date: ${new Date().toLocaleDateString()}`, "", "", ""],[`Total Initial Diesel: ${formatNumber(initialDieselStock)} L`, `Total Amount: Rs. ${formatNumber(initialTotalAmount)}`, "", "", ""],[],["Date", "Adds", "Added Diesel (L)", "Added Amount (Rs.)", "Running Total (L)"],...sorted.map((r) => { running += r.diesel; return [r.date, r.count, r.diesel, r.amount, running]; }),["TOTAL", initialHistory.length, totalInitialHistoryDiesel, totalInitialHistoryAmount, totalInitialHistoryDiesel]];
    const ws = XLSX.utils.aoa_to_sheet(wsData); ws["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 20 }]; const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Initial Diesel History"); XLSX.writeFile(wb, `Initial-Diesel-History-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const downloadUsedPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(16); doc.text("DEARO - Diesel Used Summary", 14, 15); doc.setFontSize(10); doc.text(`Branch: ${branchId}  |  Date: ${new Date().toLocaleDateString()}`, 14, 23); doc.text(`Total Used: ${formatNumber(totalUsedDiesel)} L  |  Total Payable: Rs. ${formatNumber(totalPayable)}  |  Paid: Rs. ${formatNumber(totalPaid)}  |  Balance: Rs. ${formatNumber(totalBalance)}`, 14, 30);
    doc.setFontSize(11); doc.text("Date Wise Summary - diesel_expenses", 14, 38);
    autoTable(doc, { startY: 42, head: [["Date", "Records", "Machines", "Diesel Used (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: filteredUsedByDate.map((r) => [r.date, String(r.count), Array.from(r.machines).join(", "), `${formatNumber(r.diesel)} L`, `Rs. ${formatNumber(r.amount)}`, `Rs. ${formatNumber(r.paid)}`, `Rs. ${formatNumber(r.balance)}`]), foot: [["TOTAL", String(filteredUsedExpenses.length), "-", `${formatNumber(filteredUsedDiesel)} L`, `Rs. ${formatNumber(filteredUsedPayable)}`, `Rs. ${formatNumber(filteredUsedPaid)}`, `Rs. ${formatNumber(filteredUsedPayable - filteredUsedPaid)}`]], styles: { fontSize: 9 }, headStyles: { fillColor: [8, 145, 178] } });
    doc.save(`Diesel-Used-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const downloadUsedExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([["DEARO - Diesel Used Summary"],[`Branch: ${branchId}`, `Date: ${new Date().toLocaleDateString()}`],[],["Metric","Value"],["Total Diesel Used (L)", totalUsedDiesel],["Total Payable (Rs.)", totalPayable],["Total Paid (Rs.)", totalPaid],["Total Balance (Rs.)", totalBalance],["Total Records", expenses.length],["Initial Diesel (L)", initialDieselStock],["Remaining Diesel (L)", displayRemainingDiesel]]); ws1["!cols"] = [{ wch: 25 }, { wch: 20 }]; XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    XLSX.writeFile(wb, `Diesel-Used-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const downloadTotalAmountPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(16); doc.text("DEARO - Total Amount Summary", 14, 15); doc.setFontSize(10); doc.text(`Branch: ${branchId}  |  Date: ${new Date().toLocaleDateString()}`, 14, 23); doc.text(`Total Amount (Payable): Rs. ${formatNumber(totalPayable)}  |  Paid: Rs. ${formatNumber(totalPaid)}  |  Balance: Rs. ${formatNumber(totalBalance)}`, 14, 30);
    autoTable(doc, { startY: 38, head: [["Date", "Records", "Diesel (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: filteredUsedByDate.map((r) => [r.date, String(r.count), `${formatNumber(r.diesel)} L`, `Rs. ${formatNumber(r.amount)}`, `Rs. ${formatNumber(r.paid)}`, `Rs. ${formatNumber(r.balance)}`]), styles: { fontSize: 9 }, headStyles: { fillColor: [37, 99, 235] } });
    doc.save(`Total-Amount-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const downloadTotalAmountExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([["DEARO - Total Amount Summary"],[`Branch: ${branchId}`],[],["Metric","Value"],["Total Amount - Payable (Rs.)", totalPayable],["Total Paid (Rs.)", totalPaid],["Total Balance (Rs.)", totalBalance]]); XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    XLSX.writeFile(wb, `Total-Amount-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ✅ REMAINING PDF - MINUS CORRECT - 745 - 935 = -190, -190 x 397 = -75430
  const downloadRemainingPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(16); doc.text("DEARO - Remaining Diesel & Balance - MINUS Calculation", 14, 15); doc.setFontSize(10); doc.text(`Branch: ${branchId}  |  Date: ${new Date().toLocaleDateString()}`, 14, 23);
    doc.setFontSize(11); doc.text("MINUS Calculation - Remaining Diesel", 14, 31);
    autoTable(doc, { startY: 35, head: [["", "Description", "Diesel (L)", "Amount (Rs.)"]], body: [
      ["", "Initial Diesel Stock", `${formatNumber(initialDieselStock)} L`, `Rs. ${formatNumber(initialTotalAmount)}`],
      ["-", "Minus (-) Diesel Used", `- ${formatNumber(totalUsedDiesel)} L`, `- Rs. ${formatNumber(totalPayable)}`],
      ["=", "Remaining Diesel", `${formatNumber(displayRemainingDiesel)} L`, `Rs. ${formatNumber(displayRemainingBalance)}`],
    ], styles: { fontSize: 10 }, headStyles: { fillColor: [249, 115, 22] } });
    const y1 = (doc as any).lastAutoTable.finalY + 6;
    doc.text("MINUS Calculation - Remaining Balance", 14, y1);
    autoTable(doc, { startY: y1 + 4, head: [["", "Description", "Calculation", "Value"]], body: [
      ["", "Remaining Diesel", `${formatNumber(displayRemainingDiesel)} L`, `${formatNumber(displayRemainingDiesel)} L`],
      ["x", "Diesel Price", `x Rs. ${DIESEL_PRICE}`, `Rs. ${DIESEL_PRICE}`],
      ["=", "Remaining Balance", `${formatNumber(displayRemainingDiesel)} L x Rs. ${DIESEL_PRICE}`, `Rs. ${formatNumber(displayRemainingBalance)}`],
    ], styles: { fontSize: 10 }, headStyles: { fillColor: [16, 185, 129] } });
    const y2 = (doc as any).lastAutoTable.finalY + 6;
    doc.text("Formula", 14, y2);
    doc.setFontSize(10); doc.text(`Formula Diesel: ${formatNumber(initialDieselStock)} L - ${formatNumber(totalUsedDiesel)} L = ${formatNumber(displayRemainingDiesel)} L`, 14, y2 + 7);
    doc.text(`Formula Balance: ${formatNumber(displayRemainingDiesel)} L x Rs. ${DIESEL_PRICE} = Rs. ${formatNumber(displayRemainingBalance)}`, 14, y2 + 14);
    if (isOverUsed) doc.text(`OVER USED: Used ${formatNumber(totalUsedDiesel)} L > Initial ${formatNumber(initialDieselStock)} L - Need ${formatNumber(Math.abs(displayRemainingDiesel))} L more!`, 14, y2 + 21);
    doc.save(`Remaining-Minus-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const downloadRemainingExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ["DEARO - Remaining Diesel & Balance - MINUS Calculation"],
      [`Branch: ${branchId}`, `Date: ${new Date().toLocaleDateString()}`],
      [],
      ["", "Description", "Diesel (L)", "Amount (Rs.)"],
      ["", "Initial Diesel Stock", initialDieselStock, initialTotalAmount],
      ["-", "Minus (-) Diesel Used", -totalUsedDiesel, -totalPayable],
      ["=", "Remaining Diesel", displayRemainingDiesel, displayRemainingBalance],
      [],
      ["Formula Diesel", `${initialDieselStock} - ${totalUsedDiesel} = ${displayRemainingDiesel} L`],
      ["Formula Balance", `${displayRemainingDiesel} x ${DIESEL_PRICE} = Rs. ${displayRemainingBalance}`],
      ...(isOverUsed ? [["OVER USED", `Need ${Math.abs(displayRemainingDiesel)} L more`]] : []),
    ]); ws1["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 22 }, { wch: 22 }]; XLSX.utils.book_append_sheet(wb, ws1, "Remaining Minus");
    const ws2 = XLSX.utils.aoa_to_sheet([["Date","Records","Minus Diesel Used (L)","Minus Payable (Rs.)"], ...filteredUsedByDate.map((r) => [r.date, r.count, -r.diesel, -r.amount]), ["TOTAL MINUS", filteredUsedExpenses.length, -filteredUsedDiesel, -filteredUsedPayable]]); ws2["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 22 }]; XLSX.utils.book_append_sheet(wb, ws2, "Date Wise Minus");
    XLSX.writeFile(wb, `Remaining-Minus-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getModalTitle = () => {
    if (modalType === "initial") return "Initial Stock Summary - 745L Kohomada Hadune?";
    if (modalType === "used") return "Diesel Used Summary - diesel_expenses";
    if (modalType === "totalAmount") return "Total Amount Summary - Payable Total";
    if (modalType === "remaining") return "Remaining Diesel Summary - Initial - Used";
    if (modalType === "remainingBalance") return "Remaining Balance Summary - Remaining x Rs.397";
    return "Total Diesel Summary";
  };
  const getModalPDF = () => { if (modalType === "used") return downloadUsedPDF; if (modalType === "totalAmount") return downloadTotalAmountPDF; if (modalType === "remaining" || modalType === "remainingBalance") return downloadRemainingPDF; return downloadInitialPDF; };
  const getModalExcel = () => { if (modalType === "used") return downloadUsedExcel; if (modalType === "totalAmount") return downloadTotalAmountExcel; if (modalType === "remaining" || modalType === "remainingBalance") return downloadRemainingExcel; return downloadInitialExcel; };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold"><ArrowLeft size={16}/> Back</button>
        <header className="flex justify-between rounded-3xl border border-slate-700/80 bg-slate-900 p-5">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400"><Fuel size={29}/></div><div><h1 className="text-2xl font-bold">Diesel Expenses</h1><p className="text-sm text-slate-400">View Only - Card + Filter + Table • Branch: {branchId}</p></div></div>
          <div className="flex gap-2">
            <button onClick={async () => { await loadInitialHistory(); setModalType("initial"); setShowInitialSummary(true); }} className="h-11 inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 text-sm font-bold"><Eye size={16}/> View</button>
            <button onClick={() => { loadExpenses(); loadInitialHistory(); }} className="h-11 inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 text-sm font-bold"><RefreshCw size={17} className={loading? "animate-spin" : ""}/>Refresh</button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SummaryCard title="Initial Diesel" subtitle="Original Stock" value={`${formatNumber(displayInitialDiesel)} L`} icon={<Fuel size={22}/>} color="violet" onEye={() => handleCardEye("initial")} eyeTitle="745L kohomada hadune?" />
          <SummaryCard title="Initial Amount" subtitle={`Original Amount`} value={`Rs. ${formatNumber(displayInitialAmount)}`} icon={<Banknote size={22}/>} color="violet" onEye={() => handleCardEye("initial")} eyeTitle="Initial Amount" />
          <SummaryCard title="Diesel Used" subtitle={isFiltered ? `Filtered: ${fDiesel}L` : "Table eke diesel wala ekathuwa"} value={`${formatNumber(displayDieselUsed)} L`} icon={<Droplets size={22}/>} color="cyan" onEye={() => handleCardEye("used")} eyeTitle="diesel_expenses Summary" />
          <SummaryCard title="Total Amount" subtitle={isFiltered ? `Filtered payable` : "Table eke viyadam"} value={`Rs. ${formatNumber(displayTotalAmount)}`} icon={<Wallet size={22}/>} color="blue" onEye={() => handleCardEye("totalAmount")} eyeTitle="Total Amount Summary" />
          {/* ✅ REMAINING - MINUS CORRECT - Card ekeuth -190 penawa */}
          <SummaryCard title="Remaining Diesel" subtitle={`${formatNumber(displayTotalDiesel)} L - ${formatNumber(totalUsedDiesel)} L = ${formatNumber(displayRemainingDiesel)} L ${isOverUsed ? "• OVER USED!" : ""}`} value={`${formatNumber(displayRemainingDiesel)} L`} icon={<Droplets size={22}/>} color="orange" onEye={() => handleCardEye("remaining")} eyeTitle="Remaining Diesel Minus Calculation" isNegative={isOverUsed} />
          <SummaryCard title="Remaining Balance" subtitle={`${formatNumber(displayRemainingDiesel)} L x Rs. ${DIESEL_PRICE} = Rs. ${formatNumber(displayRemainingBalance)}`} value={`Rs. ${formatNumber(displayRemainingBalance)}`} icon={<CreditCard size={22}/>} color="green" onEye={() => handleCardEye("remainingBalance")} eyeTitle="Remaining Balance Minus Calculation" isNegative={isOverUsed} />
          <SummaryCard title="Total Diesel" subtitle="Initial stock" value={`${formatNumber(displayTotalDiesel)} L`} icon={<AlertCircle size={22}/>} color="red" onEye={() => handleCardEye("total")} eyeTitle="Total Diesel" />
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-700/80 space-y-4">
            <div className="flex justify-between items-center"><h2 className="font-bold">Records</h2><span className="text-sm bg-slate-800 px-3 py-1 rounded-xl">{filteredExpenses.length} / {expenses.length} Records</span></div>
            <div className="flex flex-wrap gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2"><Filter size={14} className="text-slate-400"/><span className="text-xs font-bold text-slate-400 uppercase">Filter:</span></div>
              <select value={filterMachine} onChange={e=>setFilterMachine(e.target.value)} className="h-9 rounded-lg border border-slate-600 bg-slate-900 px-3 text-xs outline-none"><option value="">All Machines</option>{machines.map(m=> <option key={m} value={m}>{m}</option>)}{expenses.map(e=>e.machine).filter((v,i,a)=>v && !machines.includes(v) && a.indexOf(v)===i).map(m=> <option key={m} value={m}>{m}</option>)}</select>
              <div className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-600 bg-slate-50 px-3"><Calendar size={14} className="text-slate-900"/><input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="bg-transparent text-xs outline-none" /></div>
              {isFiltered && (<button onClick={clearFilters} className="h-9 inline-flex items-center gap-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 px-3 text-xs font-bold"><X size={12}/>Clear</button>)}
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="bg-slate-800/80"><tr className="text-xs text-slate-400 uppercase"><th className="px-5 py-4 text-left">Date</th><th className="px-5 py-4 text-left">Machine</th><th className="px-5 py-4 text-right">Diesel</th><th className="px-5 py-4 text-right">Payable</th><th className="px-5 py-4 text-right">Paid</th><th className="px-5 py-4 text-right">Balance</th></tr></thead><tbody>{filteredExpenses.length===0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No records</td></tr> : filteredExpenses.map(item => { const p = numberValue(item.payable); const pd = numberValue(item.paid); return <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/40"><td className="px-5 py-4 text-sm">{item.date?.slice(0, 10)}</td><td className="px-5 py-4 font-semibold">{item.machine}</td><td className="px-5 py-4 text-right">{formatNumber(item.diesel)}</td><td className="px-5 py-4 text-right font-bold text-blue-400">Rs. {formatNumber(p)}</td><td className="px-5 py-4 text-right font-bold text-green-400">Rs. {formatNumber(pd)}</td><td className="px-5 py-4 text-right font-bold text-red-400">Rs. {formatNumber(p - pd)}</td></tr> })}</tbody></table></div>
        </section>
      </div>

      {showInitialSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setShowInitialSummary(false)}>
          <div className="w-full max-w-3xl my-6 rounded-3xl border border-slate-700 bg-[#0d1527] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400"><BarChart3 size={20}/></div><div><h2 className="text-base font-black uppercase tracking-wider">{getModalTitle()}</h2><p className="text-[11px] text-slate-500 mt-0.5">Branch • {branchId} • {expenses.length} Records • {dateWiseSummary.length} Days</p></div></div>
              <button onClick={() => setShowInitialSummary(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white font-black hover:bg-red-600"><X size={16}/></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">

              {/* ✅ REMAINING - MINUS CORRECT - Screenshot eke meka thamai fix karanna one */}
              {(modalType === "remaining" || modalType === "remainingBalance") && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Diesel</p><p className="mt-2 text-lg font-black text-violet-300">{formatNumber(initialDieselStock)} L</p><p className="text-[10px] text-slate-500 mt-1">Rs. {formatNumber(initialTotalAmount)}</p></div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(totalUsedDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">Rs. {formatNumber(totalPayable)}</p></div>
                    <div className={`rounded-2xl border p-4 ${isOverUsed ? "border-red-500/40 bg-red-500/10" : "border-orange-500/20 bg-orange-500/5"}`}><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining Diesel</p><p className={`mt-2 text-lg font-black ${isOverUsed ? "text-red-400" : "text-orange-300"}`}>{formatNumber(displayRemainingDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">{remainingPercent.toFixed(1)}% Left {isOverUsed ? "• OVER USED!" : ""}</p></div>
                    <div className={`rounded-2xl border p-4 ${isOverUsed ? "border-red-500/40 bg-red-500/10" : "border-emerald-500/20 bg-emerald-500/5"}`}><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining Balance</p><p className={`mt-2 text-lg font-black ${isOverUsed ? "text-red-400" : "text-emerald-300"}`}>Rs. {formatNumber(displayRemainingBalance)}</p><p className="text-[10px] text-slate-500 mt-1">{formatNumber(displayRemainingDiesel)} L x Rs. {DIESEL_PRICE}</p></div>
                  </div>

                  {isOverUsed && (
                    <div className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"><TrendingDown size={16}/> OVER USED! Used {formatNumber(totalUsedDiesel)} L &gt; Initial {formatNumber(initialDieselStock)} L — Thawa {formatNumber(Math.abs(displayRemainingDiesel))} L ona!</div>
                  )}

                  {/* ✅ MINUS TABLE */}
                  <div className="overflow-hidden rounded-2xl border border-orange-500/30">
                    <div className="bg-slate-900 px-4 py-3"><h3 className="text-xs font-black uppercase tracking-widest text-orange-300">Minus Calculation - Remaining Diesel</h3></div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-800/70">
                        <tr><td className="px-4 py-3 w-10 text-center text-slate-500 font-black"></td><td className="px-4 py-3 font-bold">Initial Diesel Stock</td><td className="px-4 py-3 text-right font-bold text-violet-300">{formatNumber(initialDieselStock)} L</td><td className="px-4 py-3 text-right text-slate-400">Rs. {formatNumber(initialTotalAmount)}</td></tr>
                        <tr className="bg-red-500/5"><td className="px-4 py-3 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"><Minus size={14}/></span></td><td className="px-4 py-3 font-bold text-red-300">Minus (-) Diesel Used</td><td className="px-4 py-3 text-right font-bold text-red-300">- {formatNumber(totalUsedDiesel)} L</td><td className="px-4 py-3 text-right text-red-300">- Rs. {formatNumber(totalPayable)}</td></tr>
                        <tr className="bg-slate-900"><td className="px-4 py-3 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Equal size={14}/></span></td><td className="px-4 py-3 font-black">Remaining Diesel</td><td className="px-4 py-3 text-right font-black text-base text-red-400">{formatNumber(displayRemainingDiesel)} L</td><td className="px-4 py-3 text-right font-black text-red-400">Rs. {formatNumber(displayRemainingBalance)}</td></tr>
                      </tbody>
                    </table>
                    <div className="bg-slate-900/60 px-4 py-3 text-center text-xs font-bold text-slate-300">
                      {formatNumber(initialDieselStock)} L <span className="text-red-400 mx-1">-</span> {formatNumber(totalUsedDiesel)} L <span className="text-emerald-400 mx-1">=</span> <span className="text-red-400">{formatNumber(displayRemainingDiesel)} L</span>
                    </div>
                  </div>

                  {/* ✅ FORMULA DIESEL + FORMULA BALANCE - SCREENSHOT EKE MEKA FIX */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 text-sm">
                    <p><span className="text-slate-400">Formula Diesel:</span> <span className="font-bold text-white">{formatNumber(initialDieselStock)} L - {formatNumber(totalUsedDiesel)} L = <span className="text-red-400">{formatNumber(displayRemainingDiesel)} L</span></span></p>
                    <p><span className="text-slate-400">Formula Balance:</span> <span className="font-bold text-white">{formatNumber(displayRemainingDiesel)} L x Rs. {DIESEL_PRICE} = <span className="text-red-400">Rs. {formatNumber(displayRemainingBalance)}</span></span></p>
                    <div><div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2"><span>Used {usedPercent.toFixed(1)}%</span><span>Remaining {remainingPercent.toFixed(1)}%</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all ${isOverUsed ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-cyan-500 to-orange-500"}`} style={{ width: `${Math.min(100, Math.max(0, usedPercent))}%` }} /></div></div>
                  </div>

                  <div className="flex gap-2"><button onClick={downloadRemainingPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs font-black uppercase"><FileText size={14}/> Download PDF - Minus</button><button onClick={downloadRemainingExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel - Minus</button></div>

                  <div><h3 className="text-xs font-black uppercase tracking-widest text-orange-300 mb-3">Date Wise Used - Minus karanna ona gaana</h3><div className="overflow-hidden rounded-2xl border border-orange-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Records</th><th className="px-4 py-3 text-right">Minus Diesel Used</th><th className="px-4 py-3 text-right">Minus Payable</th></tr></thead><tbody className="divide-y divide-slate-800/70">{filteredUsedByDate.map((row) => (<tr key={row.date} className="hover:bg-slate-800/40"><td className="px-4 py-3 font-bold">{row.date}</td><td className="px-4 py-3 text-center"><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold">{row.count}</span></td><td className="px-4 py-3 text-right font-bold text-red-300">- {formatNumber(row.diesel)} L</td><td className="px-4 py-3 text-right text-red-300">- Rs. {formatNumber(row.amount)}</td></tr>))}</tbody><tfoot className="bg-slate-900"><tr className="font-black"><td className="px-4 py-3 text-slate-400">Total Minus</td><td className="px-4 py-3 text-center">{filteredUsedExpenses.length}</td><td className="px-4 py-3 text-right text-red-300">- {formatNumber(filteredUsedDiesel)} L</td><td className="px-4 py-3 text-right text-red-300">- Rs. {formatNumber(filteredUsedPayable)}</td></tr><tr className="font-black text-red-400"><td className="px-4 py-3">Remaining</td><td className="px-4 py-3 text-center">-</td><td className="px-4 py-3 text-right">{formatNumber(displayRemainingDiesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(displayRemainingBalance)}</td></tr></tfoot></table></div></div>
                </>
              )}

              {/* ✅ TOTAL AMOUNT */}
              {modalType === "totalAmount" && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Amount</p><p className="mt-2 text-lg font-black text-blue-300">Rs. {formatNumber(totalPayable)}</p></div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-2 text-lg font-black text-emerald-300">Rs. {formatNumber(totalPaid)}</p></div>
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Balance</p><p className="mt-2 text-lg font-black text-red-300">Rs. {formatNumber(totalBalance)}</p></div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(totalUsedDiesel)} L</p></div>
                  </div>
                  <div className="flex gap-2"><button onClick={downloadTotalAmountPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs font-black uppercase"><FileText size={14}/> Download PDF</button><button onClick={downloadTotalAmountExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel</button></div>
                </>
              )}

              {/* ✅ USED */}
              {modalType === "used" && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(totalUsedDiesel)} L</p></div>
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Payable</p><p className="mt-2 text-lg font-black text-blue-300">Rs. {formatNumber(totalPayable)}</p></div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-2 text-lg font-black text-emerald-300">Rs. {formatNumber(totalPaid)}</p></div>
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Balance</p><p className="mt-2 text-lg font-black text-red-300">Rs. {formatNumber(totalBalance)}</p></div>
                  </div>
                  <div className="flex gap-2"><button onClick={downloadUsedPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs font-black uppercase"><FileText size={14}/> Download PDF - Used</button><button onClick={downloadUsedExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel</button></div>
                  <div><h3 className="text-xs font-black uppercase tracking-widest text-cyan-300 mb-3">Date Wise Summary</h3><div className="overflow-hidden rounded-2xl border border-cyan-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Records</th><th className="px-4 py-3 text-right">Diesel</th><th className="px-4 py-3 text-right">Payable</th><th className="px-4 py-3 text-right">Paid</th></tr></thead><tbody className="divide-y divide-slate-800/70">{filteredUsedByDate.map((row) => (<tr key={row.date}><td className="px-4 py-3 font-bold">{row.date}</td><td className="px-4 py-3 text-center">{row.count}</td><td className="px-4 py-3 text-right text-cyan-300 font-bold">{formatNumber(row.diesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(row.amount)}</td><td className="px-4 py-3 text-right text-emerald-300">Rs. {formatNumber(row.paid)}</td></tr>))}</tbody></table></div></div>
                </>
              )}

              {/* ✅ INITIAL */}
              {(modalType === "initial" || modalType === "total") && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Diesel</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(initialDieselStock)} L</p></div>
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Amount</p><p className="mt-2 text-lg font-black text-blue-300">Rs. {formatNumber(initialTotalAmount)}</p></div>
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-orange-300">{formatNumber(totalUsedDiesel)} L</p></div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining</p><p className={`mt-2 text-lg font-black ${isOverUsed ? "text-red-400" : "text-emerald-300"}`}>{formatNumber(displayRemainingDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">Rs. {formatNumber(displayRemainingBalance)}</p></div>
                  </div>
                  <div className="flex gap-2"><button onClick={downloadInitialPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-black uppercase"><FileText size={14}/> Download PDF - 745L History</button><button onClick={downloadInitialExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel</button></div>
                  <div><h3 className="text-xs font-black uppercase tracking-widest text-cyan-300 mb-3">Initial Add History • Date Wise</h3>{filteredInitialByDate.length === 0 ? (<p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">Thama Initial Add History na</p>) : (<div className="overflow-hidden rounded-2xl border border-cyan-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Adds</th><th className="px-4 py-3 text-right">Initial Diesel</th><th className="px-4 py-3 text-right">Initial Amount</th><th className="px-4 py-3 text-right">Running Total</th></tr></thead><tbody className="divide-y divide-slate-800/70">{(() => { let running = 0; const sorted = [...filteredInitialByDate].sort((a,b)=>{ if(a.date==="No Date") return -1; if(b.date==="No Date") return 1; return a.date.localeCompare(b.date); }); return sorted.map((row) => { running += row.diesel; return (<tr key={row.date}><td className="px-4 py-3 font-bold">{row.date}</td><td className="px-4 py-3 text-center">{row.count}</td><td className="px-4 py-3 text-right font-bold text-cyan-300">{formatNumber(row.diesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(row.amount)}</td><td className="px-4 py-3 text-right font-bold text-emerald-300">{formatNumber(running)} L</td></tr>); }); })()}</tbody></table></div>)}</div>
                </>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-800 bg-slate-900/80 px-6 py-4">
              <button onClick={() => setShowInitialSummary(false)} className="flex-1 rounded-xl bg-cyan-500 py-3 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-400">Close</button>
              <button onClick={getModalPDF()} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold hover:bg-red-500"><Download size={14}/> PDF</button>
              <button onClick={getModalExcel()} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold hover:bg-emerald-500"><Download size={14}/> Excel</button>
              <button onClick={() => window.print()} className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-bold hover:bg-slate-800">Print</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ title, subtitle, value, icon, color, onEye, eyeTitle, isNegative }: { title: string; subtitle: string; value: string; icon: React.ReactNode; color: CardColor; onEye?: () => void; eyeTitle?: string; isNegative?: boolean; }) {
  const s: any = { cyan: { b: "border-cyan-500/25", i: "bg-cyan-500/10 text-cyan-400", v: "text-cyan-300", eye: "bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600 hover:text-white" }, blue: { b: "border-blue-500/25", i: "bg-blue-500/10 text-blue-400", v: "text-blue-300", eye: "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white" }, orange: { b: "border-orange-500/25", i: "bg-orange-500/10 text-orange-400", v: "text-orange-300", eye: "bg-orange-600/20 border-orange-500/40 text-orange-300 hover:bg-orange-600 hover:text-white" }, green: { b: "border-green-500/25", i: "bg-green-500/10 text-green-400", v: "text-green-300", eye: "bg-green-600/20 border-green-500/40 text-green-300 hover:bg-green-600 hover:text-white" }, red: { b: "border-red-500/25", i: "bg-red-500/10 text-red-400", v: "text-red-300", eye: "bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white" }, violet: { b: "border-violet-500/25", i: "bg-violet-500/10 text-violet-400", v: "text-violet-300", eye: "bg-violet-600/20 border-violet-500/40 text-violet-300 hover:bg-violet-600 hover:text-white" } };
  const c = s[color];
  return (
    <div className={`relative rounded-2xl border bg-slate-900 p-5 ${c.b} ${isNegative ? "border-red-500/50" : ""} hover:border-slate-500 transition-all overflow-hidden`}>
      <div className="flex justify-between gap-2"><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{title}</p><p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[28px]">{subtitle}</p></div><span className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl ${c.i}`}>{icon}</span></div>
      <h2 className={`mt-3 text-xl font-bold ${isNegative ? "text-red-400" : c.v}`}>{value}</h2>
      {isNegative && <p className="text-[11px] font-bold text-red-400 mt-1">⚠️ OVER USED!</p>}
      {onEye && (<button onClick={onEye} title={eyeTitle || `View ${title}`} className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[11px] font-black uppercase tracking-wider transition-all ${c.eye}`}><Eye size={15} /> View Details</button>)}
    </div>
  );
}