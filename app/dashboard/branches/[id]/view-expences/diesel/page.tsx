"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Droplets, Fuel, RefreshCw, Wallet, CreditCard, Filter, X, Calendar, Eye, BarChart3, Banknote, FileText, FileSpreadsheet, Download } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type DieselExpense = { id: number; branch_id: string; date: string; machine: string; diesel: number | string; amount: number | string; payable: number | string; paid: number | string; };
type InitialAdd = { id?: number; branch_id?: string; date: string; diesel: number; amount: number };
type CardColor = "cyan" | "blue" | "orange" | "green" | "red" | "violet";
const machines = ["Komatsu","CAT","JCB","Excavator","Loader","Backhoe Loader","Wheel Loader","Breker Machine","Compressor","Tractor"];
const numberValue = (v: any) => Number(v || 0);
const formatNumber = (v: any) => Number(v || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const [modalType, setModalType] = useState<"initial" | "used" | "total" | "remaining">("initial");
  const [filterDate, setFilterDate] = useState("");
  const [filterMachine, setFilterMachine] = useState("");
  // ✅ Diesel Used Modal eke Filter
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
      if (!r.ok) return;
      const j = await r.json();
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
  const displayRemainingDiesel = Math.max(0, displayTotalDiesel - totalUsedDiesel);
  const displayRemainingBalance = displayRemainingDiesel * DIESEL_PRICE;
  const displayInitialDiesel = initialDieselStock;
  const displayInitialAmount = initialTotalAmount;

  const initialByDate = useMemo(() => {
    const map = new Map<string, { date: string; diesel: number; amount: number; count: number }>();
    initialHistory.forEach((h) => { const d = String(h.date || "").slice(0,10) || "No Date"; const cur = map.get(d) || { date: d, diesel: 0, amount: 0, count: 0 }; cur.diesel += numberValue(h.diesel); cur.amount += numberValue(h.amount); cur.count += 1; map.set(d, cur); });
    return Array.from(map.values()).sort((a, b) => { if (a.date === "No Date") return -1; if (b.date === "No Date") return 1; return b.date.localeCompare(a.date); });
  }, [initialHistory]);
  const filteredInitialByDate = useMemo(() => initialByDate.filter(r => !initialFilterDate || r.date === initialFilterDate), [initialByDate, initialFilterDate]);
  const totalInitialHistoryDiesel = useMemo(() => initialHistory.reduce((s, h) => s + numberValue(h.diesel), 0), [initialHistory]);
  const totalInitialHistoryAmount = useMemo(() => initialHistory.reduce((s, h) => s + numberValue(h.amount), 0), [initialHistory]);

  // ✅ DIESEL_EXPENSES TABLE EKE SUMMARY - Date Wise + Machine Wise
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

  // ✅ Diesel Used Modal eke Filter karapu data
  const filteredUsedByDate = useMemo(() => dateWiseSummary.filter(r => (!usedFilterDate || r.date === usedFilterDate) && (!usedFilterMachine || Array.from(r.machines).includes(usedFilterMachine))), [dateWiseSummary, usedFilterDate, usedFilterMachine]);
  const filteredUsedByMachine = useMemo(() => machineWiseSummary.filter(m => !usedFilterMachine || m.machine === usedFilterMachine), [machineWiseSummary, usedFilterMachine]);
  const filteredUsedExpenses = useMemo(() => expenses.filter(e => (!usedFilterDate || String(e.date).slice(0,10) === usedFilterDate) && (!usedFilterMachine || e.machine === usedFilterMachine)), [expenses, usedFilterDate, usedFilterMachine]);
  const filteredUsedDiesel = filteredUsedExpenses.reduce((s, i) => s + numberValue(i.diesel), 0);
  const filteredUsedPayable = filteredUsedExpenses.reduce((s, i) => s + numberValue(i.payable), 0);
  const filteredUsedPaid = filteredUsedExpenses.reduce((s, i) => s + numberValue(i.paid), 0);

  const clearFilters = () => { setFilterDate(""); setFilterMachine(""); };
  const handleCardEye = async (type: "initial" | "used" | "total" | "remaining") => {
    setModalType(type); setUsedFilterDate(""); setUsedFilterMachine(""); setInitialFilterDate("");
    await loadInitialHistory(); await loadExpenses();
    setShowInitialSummary(true);
  };

  // ✅ INITIAL PDF / EXCEL - 745L History
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

  // ✅ DIESEL USED - diesel_expenses SUMMARY PDF - Date Wise + Machine Wise + Full Records
  const downloadUsedPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("DEARO - Diesel Used Summary", 14, 15);
    doc.setFontSize(10); doc.text(`Branch: ${branchId}  |  Date: ${new Date().toLocaleDateString()}`, 14, 23);
    doc.text(`Total Used: ${formatNumber(totalUsedDiesel)} L  |  Total Payable: Rs. ${formatNumber(totalPayable)}  |  Paid: Rs. ${formatNumber(totalPaid)}  |  Balance: Rs. ${formatNumber(totalBalance)}`, 14, 30);
    doc.setFontSize(11); doc.text("1. Date Wise Summary - diesel_expenses", 14, 38);
    autoTable(doc, { startY: 42, head: [["Date", "Records", "Machines", "Diesel Used (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: filteredUsedByDate.map((r) => [r.date, String(r.count), Array.from(r.machines).join(", "), `${formatNumber(r.diesel)} L`, `Rs. ${formatNumber(r.amount)}`, `Rs. ${formatNumber(r.paid)}`, `Rs. ${formatNumber(r.balance)}`]), foot: [["TOTAL", String(filteredUsedExpenses.length), "-", `${formatNumber(filteredUsedDiesel)} L`, `Rs. ${formatNumber(filteredUsedPayable)}`, `Rs. ${formatNumber(filteredUsedPaid)}`, `Rs. ${formatNumber(filteredUsedPayable - filteredUsedPaid)}`]], styles: { fontSize: 9 }, headStyles: { fillColor: [8, 145, 178] } });
    const y1 = (doc as any).lastAutoTable.finalY + 8;
    doc.text("2. Machine Wise Summary", 14, y1);
    autoTable(doc, { startY: y1 + 4, head: [["Machine", "Records", "Diesel Used (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: filteredUsedByMachine.map((m) => [m.machine, String(m.count), `${formatNumber(m.diesel)} L`, `Rs. ${formatNumber(m.amount)}`, `Rs. ${formatNumber(m.paid)}`, `Rs. ${formatNumber(m.balance)}`]), foot: [["TOTAL", String(filteredUsedExpenses.length), `${formatNumber(filteredUsedDiesel)} L`, `Rs. ${formatNumber(filteredUsedPayable)}`, `Rs. ${formatNumber(filteredUsedPaid)}`, `Rs. ${formatNumber(filteredUsedPayable - filteredUsedPaid)}`]], styles: { fontSize: 9 }, headStyles: { fillColor: [249, 115, 22] } });
    const y2 = (doc as any).lastAutoTable.finalY + 8;
    doc.text("3. Full Records - diesel_expenses", 14, y2);
    autoTable(doc, { startY: y2 + 4, head: [["Date", "Machine", "Diesel (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: [...filteredUsedExpenses].sort((a,b)=>String(a.date).localeCompare(String(b.date))).map((e) => [String(e.date).slice(0,10), e.machine, formatNumber(e.diesel), formatNumber(e.payable), formatNumber(e.paid), formatNumber(numberValue(e.payable) - numberValue(e.paid))]), styles: { fontSize: 9 }, headStyles: { fillColor: [30, 41, 59] } });
    doc.save(`Diesel-Used-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ✅ DIESEL USED - diesel_expenses SUMMARY EXCEL - 3 Sheets!
  const downloadUsedExcel = () => {
    const wb = XLSX.utils.book_new();
    // Sheet 1 - Summary
    const summaryData = [["DEARO - Diesel Used Summary", "", "", "", "", ""],[`Branch: ${branchId}`, `Date: ${new Date().toLocaleDateString()}`, "", "", "", ""],[`Total Used: ${formatNumber(totalUsedDiesel)} L`, `Total Payable: Rs. ${formatNumber(totalPayable)}`, `Paid: Rs. ${formatNumber(totalPaid)}`, `Balance: Rs. ${formatNumber(totalBalance)}`, `Records: ${expenses.length}`, ""],[],["Metric", "Value"], ["Total Diesel Used (L)", totalUsedDiesel], ["Total Payable (Rs.)", totalPayable], ["Total Paid (Rs.)", totalPaid], ["Total Balance (Rs.)", totalBalance], ["Total Records", expenses.length], ["Initial Diesel (L)", initialDieselStock], ["Remaining Diesel (L)", displayRemainingDiesel]];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData); ws1["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }]; XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    // Sheet 2 - Date Wise
    const dateData = [["Date", "Records", "Machines", "Diesel Used (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"], ...filteredUsedByDate.map((r) => [r.date, r.count, Array.from(r.machines).join(", "), r.diesel, r.amount, r.paid, r.balance]), ["TOTAL", filteredUsedExpenses.length, "-", filteredUsedDiesel, filteredUsedPayable, filteredUsedPaid, filteredUsedPayable - filteredUsedPaid]];
    const ws2 = XLSX.utils.aoa_to_sheet(dateData); ws2["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }]; XLSX.utils.book_append_sheet(wb, ws2, "Date Wise");
    // Sheet 3 - Machine Wise
    const machineData = [["Machine", "Records", "Diesel Used (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"], ...filteredUsedByMachine.map((m) => [m.machine, m.count, m.diesel, m.amount, m.paid, m.balance]), ["TOTAL", filteredUsedExpenses.length, filteredUsedDiesel, filteredUsedPayable, filteredUsedPaid, filteredUsedPayable - filteredUsedPaid]];
    const ws3 = XLSX.utils.aoa_to_sheet(machineData); ws3["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }]; XLSX.utils.book_append_sheet(wb, ws3, "Machine Wise");
    // Sheet 4 - Full Records
    const recordsData = [["Date", "Machine", "Diesel (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"], ...[...filteredUsedExpenses].sort((a,b)=>String(a.date).localeCompare(String(b.date))).map((e) => [String(e.date).slice(0,10), e.machine, Number(e.diesel), Number(e.payable), Number(e.paid), Number(e.payable) - Number(e.paid)])];
    const ws4 = XLSX.utils.aoa_to_sheet(recordsData); ws4["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }]; XLSX.utils.book_append_sheet(wb, ws4, "All Records");
    XLSX.writeFile(wb, `Diesel-Used-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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
          <SummaryCard title="Initial Diesel" subtitle="Original Stock • Modal eke wage" value={`${formatNumber(displayInitialDiesel)} L`} icon={<Fuel size={22}/>} color="violet" onEye={() => handleCardEye("initial")} eyeTitle="745L kohomada hadune? Date wise balanna" />
          <SummaryCard title="Initial Amount" subtitle={`Original Amount • Total Stock Value`} value={`Rs. ${formatNumber(displayInitialAmount)}`} icon={<Banknote size={22}/>} color="violet" onEye={() => handleCardEye("initial")} eyeTitle="Initial Amount Date wise balanna" />
          <SummaryCard title="Diesel Used" subtitle={isFiltered ? `Filtered: ${fDiesel}L` : "Table eke diesel wala ekathuwa"} value={`${formatNumber(displayDieselUsed)} L`} icon={<Droplets size={22}/>} color="cyan" onEye={() => handleCardEye("used")} eyeTitle="diesel_expenses Summary PDF / Excel walin balanna" />
          <SummaryCard title="Total Amount" subtitle={isFiltered ? `Filtered payable` : "Table eke viyadam wela thiyena amount"} value={`Rs. ${formatNumber(displayTotalAmount)}`} icon={<Wallet size={22}/>} color="blue" onEye={() => handleCardEye("used")} eyeTitle="Total Amount Date wise balanna" />
          <SummaryCard title="Remaining Diesel" subtitle="Total Diesel - Diesel Used" value={`${formatNumber(displayRemainingDiesel)} L`} icon={<Droplets size={22}/>} color="orange" onEye={() => handleCardEye("remaining")} eyeTitle="Remaining Diesel balanna" />
          <SummaryCard title="Remaining Balance" subtitle={`Remaining Diesel x Rs. ${DIESEL_PRICE}`} value={`Rs. ${formatNumber(displayRemainingBalance)}`} icon={<CreditCard size={22}/>} color="green" onEye={() => handleCardEye("remaining")} eyeTitle="Remaining Balance balanna" />
          <SummaryCard title="Total Diesel" subtitle="Initial stock" value={`${formatNumber(displayTotalDiesel)} L`} icon={<AlertCircle size={22}/>} color="red" onEye={() => handleCardEye("total")} eyeTitle="Total Diesel balanna" />
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
          <div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="bg-slate-800/80"><tr className="text-xs text-slate-400 uppercase"><th className="px-5 py-4 text-left">Date</th><th className="px-5 py-4 text-left">Machine</th><th className="px-5 py-4 text-right">Diesel</th><th className="px-5 py-4 text-right">Payable</th><th className="px-5 py-4 text-right">Paid</th><th className="px-5 py-4 text-right">Balance</th></tr></thead><tbody>{filteredExpenses.length===0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No records for {filterDate} {filterMachine} - filter clear karala balanna</td></tr> : filteredExpenses.map(item => { const p = numberValue(item.payable); const pd = numberValue(item.paid); return <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/40"><td className="px-5 py-4 text-sm">{item.date?.slice(0, 10)}</td><td className="px-5 py-4 font-semibold">{item.machine}</td><td className="px-5 py-4 text-right">{formatNumber(item.diesel)}</td><td className="px-5 py-4 text-right font-bold text-blue-400">Rs. {formatNumber(p)}</td><td className="px-5 py-4 text-right font-bold text-green-400">Rs. {formatNumber(pd)}</td><td className="px-5 py-4 text-right font-bold text-red-400">Rs. {formatNumber(Math.max(0, p - pd))}</td></tr> })}</tbody></table></div>
        </section>
      </div>

      {/* ✅ MODAL - Initial nam Initial History, Used nam diesel_expenses Summary */}
      {showInitialSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setShowInitialSummary(false)}>
          <div className="w-full max-w-3xl my-6 rounded-3xl border border-slate-700 bg-[#0d1527] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400"><BarChart3 size={20}/></div><div><h2 className="text-base font-black uppercase tracking-wider">{modalType === "initial" ? "Initial Stock Summary - 745L Kohomada Hadune?" : "Diesel Used Summary - diesel_expenses"}</h2><p className="text-[11px] text-slate-500 mt-0.5">Branch • {branchId} • {expenses.length} Records • {dateWiseSummary.length} Days</p></div></div>
              <button onClick={() => setShowInitialSummary(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white font-black hover:bg-red-600"><X size={16}/></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">

              {/* ✅ DIESEL USED MODAL EKA - diesel_expenses Summary */}
              {modalType === "used" && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(totalUsedDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">{expenses.length} Records</p></div>
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Payable</p><p className="mt-2 text-lg font-black text-blue-300">Rs. {formatNumber(totalPayable)}</p><p className="text-[10px] text-slate-500 mt-1">diesel_expenses</p></div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-2 text-lg font-black text-emerald-300">Rs. {formatNumber(totalPaid)}</p><p className="text-[10px] text-slate-500 mt-1">Paid Total</p></div>
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Balance</p><p className="mt-2 text-lg font-black text-red-300">Rs. {formatNumber(totalBalance)}</p><p className="text-[10px] text-slate-500 mt-1">Payable - Paid</p></div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-600 bg-slate-900 px-3"><Calendar size={14} className="text-slate-400"/><input type="date" value={usedFilterDate} onChange={e=>setUsedFilterDate(e.target.value)} className="bg-transparent text-xs outline-none" /></div>
                    <select value={usedFilterMachine} onChange={e=>setUsedFilterMachine(e.target.value)} className="h-9 rounded-lg border border-slate-600 bg-slate-900 px-3 text-xs outline-none"><option value="">All Machines</option>{machines.map(m=> <option key={m} value={m}>{m}</option>)}{expenses.map(e=>e.machine).filter((v,i,a)=>v && !machines.includes(v) && a.indexOf(v)===i).map(m=> <option key={m} value={m}>{m}</option>)}</select>
                    {(usedFilterDate || usedFilterMachine) && <button onClick={()=>{setUsedFilterDate(""); setUsedFilterMachine("");}} className="h-9 px-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1"><X size={12}/>Clear</button>}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={downloadUsedPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs font-black uppercase"><FileText size={14}/> Download PDF - Used Summary</button>
                    <button onClick={downloadUsedExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel - 4 Sheets</button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3"><h3 className="text-xs font-black uppercase tracking-widest text-cyan-300">Date Wise Summary • diesel_expenses</h3><span className="rounded-lg bg-cyan-500/15 text-cyan-300 px-2.5 py-1 text-[11px] font-bold">{filteredUsedByDate.length} Days • {filteredUsedExpenses.length} Records</span></div>
                    {filteredUsedByDate.length === 0 ? (<p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">Thama records na</p>) : (
                      <div className="overflow-hidden rounded-2xl border border-cyan-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Records</th><th className="px-4 py-3 text-right">Diesel</th><th className="px-4 py-3 text-right">Payable</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Balance</th></tr></thead><tbody className="divide-y divide-slate-800/70">{filteredUsedByDate.map((row) => (<tr key={row.date} className="hover:bg-slate-800/40"><td className="px-4 py-3"><p className="font-bold">{row.date}</p><p className="text-[11px] text-slate-500">{Array.from(row.machines).slice(0,2).join(", ")}{row.machines.size > 2 ? ` +${row.machines.size - 2} more` : ""}</p></td><td className="px-4 py-3 text-center"><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold">{row.count}</span></td><td className="px-4 py-3 text-right font-bold text-cyan-300">{formatNumber(row.diesel)} L</td><td className="px-4 py-3 text-right font-bold">Rs. {formatNumber(row.amount)}</td><td className="px-4 py-3 text-right font-bold text-emerald-300">Rs. {formatNumber(row.paid)}</td><td className="px-4 py-3 text-right font-bold text-red-300">Rs. {formatNumber(row.balance)}</td></tr>))}</tbody><tfoot className="bg-slate-900"><tr className="font-black"><td className="px-4 py-3 text-slate-400">Total</td><td className="px-4 py-3 text-center">{filteredUsedExpenses.length}</td><td className="px-4 py-3 text-right text-cyan-300">{formatNumber(filteredUsedDiesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(filteredUsedPayable)}</td><td className="px-4 py-3 text-right">Rs. {formatNumber(filteredUsedPaid)}</td><td className="px-4 py-3 text-right">Rs. {formatNumber(filteredUsedPayable - filteredUsedPaid)}</td></tr></tfoot></table></div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Machine Wise Summary • diesel_expenses</h3>
                    <div className="space-y-2">{filteredUsedByMachine.map((m) => (<div key={m.machine} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"><div><p className="font-bold text-sm">{m.machine}</p><p className="text-[11px] text-slate-500">{m.count} records</p></div><div className="text-right"><p className="font-black text-cyan-300 text-sm">{formatNumber(m.diesel)} L</p><p className="text-[11px] text-slate-400">Rs. {formatNumber(m.amount)} • Paid Rs. {formatNumber(m.paid)} • Bal Rs. {formatNumber(m.balance)}</p></div></div>))}</div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">All Records • diesel_expenses</h3>
                    <div className="overflow-hidden rounded-2xl border border-slate-800"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Machine</th><th className="px-4 py-3 text-right">Diesel</th><th className="px-4 py-3 text-right">Payable</th><th className="px-4 py-3 text-right">Paid</th></tr></thead><tbody className="divide-y divide-slate-800/70">{[...filteredUsedExpenses].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,50).map((e) => (<tr key={e.id} className="hover:bg-slate-800/40"><td className="px-4 py-3 font-bold">{String(e.date).slice(0,10)}</td><td className="px-4 py-3">{e.machine}</td><td className="px-4 py-3 text-right text-cyan-300 font-bold">{formatNumber(e.diesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(e.payable)}</td><td className="px-4 py-3 text-right text-emerald-300">Rs. {formatNumber(e.paid)}</td></tr>))}</tbody></table></div>
                    <p className="text-[11px] text-slate-500 mt-2">* Modal eke 50 witharai penwanawa. PDF / Excel eke okkoma {filteredUsedExpenses.length} records thiyenawa.</p>
                  </div>
                </>
              )}

              {/* ✅ INITIAL MODAL EKA */}
              {modalType !== "used" && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Diesel</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(initialDieselStock)} L</p><p className="text-[10px] text-slate-500 mt-1">Total Add karapu gaana</p></div>
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Amount</p><p className="mt-2 text-lg font-black text-blue-300">Rs. {formatNumber(initialTotalAmount)}</p><p className="text-[10px] text-slate-500 mt-1">Total Amount</p></div>
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-orange-300">{formatNumber(totalUsedDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">Table eke ekathuwa</p></div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining</p><p className="mt-2 text-lg font-black text-emerald-300">{formatNumber(Math.max(0, initialDieselStock - totalUsedDiesel))} L</p><p className="text-[10px] text-slate-500 mt-1">Rs. {formatNumber(Math.max(0, initialDieselStock - totalUsedDiesel) * DIESEL_PRICE)}</p></div>
                  </div>
                  <div><div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2"><span>Used {initialDieselStock > 0 ? Math.round((totalUsedDiesel / initialDieselStock) * 100) : 0}%</span><span>Remaining {initialDieselStock > 0 ? Math.round((Math.max(0, initialDieselStock - totalUsedDiesel) / initialDieselStock) * 100) : 0}%</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${initialDieselStock > 0 ? Math.min(100, (totalUsedDiesel / initialDieselStock) * 100) : 0}%` }} /></div></div>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><h3 className="text-xs font-black uppercase tracking-widest text-cyan-300">Initial Add History • Date Wise • Branch {branchId}</h3><div className="flex items-center gap-2"><div className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-600 bg-slate-900 px-3"><Calendar size={14} className="text-slate-400"/><input type="date" value={initialFilterDate} onChange={e=>setInitialFilterDate(e.target.value)} className="bg-transparent text-xs outline-none" /></div>{initialFilterDate && <button onClick={()=>setInitialFilterDate("")} className="h-9 px-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1"><X size={12}/>Clear</button>}<span className="rounded-lg bg-cyan-500/15 text-cyan-300 px-2.5 py-1 text-[11px] font-bold">{filteredInitialByDate.length} Days • {initialHistory.length} Adds</span></div></div>
                    <div className="flex gap-2 mb-3"><button onClick={downloadInitialPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-black uppercase"><FileText size={14}/> Download PDF - 745L History</button><button onClick={downloadInitialExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel</button></div>
                    {filteredInitialByDate.length === 0 ? (<p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">Thama Initial Add History na<br/><span className="text-[11px]">DB Total: {formatNumber(initialDieselStock)} L / Rs. {formatNumber(initialTotalAmount)}</span></p>) : (<div className="overflow-hidden rounded-2xl border border-cyan-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Adds</th><th className="px-4 py-3 text-right">Initial Diesel</th><th className="px-4 py-3 text-right">Initial Amount</th><th className="px-4 py-3 text-right">Running Total</th></tr></thead><tbody className="divide-y divide-slate-800/70">{(() => { let running = 0; const sorted = [...filteredInitialByDate].sort((a,b)=>{ if(a.date==="No Date") return -1; if(b.date==="No Date") return 1; return a.date.localeCompare(b.date); }); return sorted.map((row) => { running += row.diesel; return (<tr key={row.date} className="hover:bg-slate-800/40"><td className="px-4 py-3 font-bold">{row.date}</td><td className="px-4 py-3 text-center"><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold">{row.count}</span></td><td className="px-4 py-3 text-right font-bold text-cyan-300">{formatNumber(row.diesel)} L</td><td className="px-4 py-3 text-right font-bold">Rs. {formatNumber(row.amount)}</td><td className="px-4 py-3 text-right font-bold text-emerald-300">{formatNumber(running)} L</td></tr>); }); })()}</tbody><tfoot className="bg-slate-900"><tr className="font-black"><td className="px-4 py-3 text-slate-400">Total (History)</td><td className="px-4 py-3 text-center">{initialHistory.length}</td><td className="px-4 py-3 text-right text-cyan-300">{formatNumber(totalInitialHistoryDiesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(totalInitialHistoryAmount)}</td><td className="px-4 py-3 text-right text-emerald-300">{formatNumber(totalInitialHistoryDiesel)} L</td></tr></tfoot></table></div>)}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-800 bg-slate-900/80 px-6 py-4">
              <button onClick={() => setShowInitialSummary(false)} className="flex-1 rounded-xl bg-cyan-500 py-3 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-400">Close</button>
              {modalType === "used" ? (<><button onClick={downloadUsedPDF} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold hover:bg-red-500"><Download size={14}/> PDF</button><button onClick={downloadUsedExcel} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold hover:bg-emerald-500"><Download size={14}/> Excel</button></>) : (<><button onClick={downloadInitialPDF} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold hover:bg-red-500"><Download size={14}/> PDF</button><button onClick={downloadInitialExcel} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold hover:bg-emerald-500"><Download size={14}/> Excel</button></>)}
              <button onClick={() => window.print()} className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-bold hover:bg-slate-800">Print</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ title, subtitle, value, icon, color, onEye, eyeTitle }: { title: string; subtitle: string; value: string; icon: React.ReactNode; color: CardColor; onEye?: () => void; eyeTitle?: string; }) {
  const s: any = { cyan: { b: "border-cyan-500/25", i: "bg-cyan-500/10 text-cyan-400", v: "text-cyan-300", eye: "bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600 hover:text-white" }, blue: { b: "border-blue-500/25", i: "bg-blue-500/10 text-blue-400", v: "text-blue-300", eye: "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white" }, orange: { b: "border-orange-500/25", i: "bg-orange-500/10 text-orange-400", v: "text-orange-300", eye: "bg-orange-600/20 border-orange-500/40 text-orange-300 hover:bg-orange-600 hover:text-white" }, green: { b: "border-green-500/25", i: "bg-green-500/10 text-green-400", v: "text-green-300", eye: "bg-green-600/20 border-green-500/40 text-green-300 hover:bg-green-600 hover:text-white" }, red: { b: "border-red-500/25", i: "bg-red-500/10 text-red-400", v: "text-red-300", eye: "bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white" }, violet: { b: "border-violet-500/25", i: "bg-violet-500/10 text-violet-400", v: "text-violet-300", eye: "bg-violet-600/20 border-violet-500/40 text-violet-300 hover:bg-violet-600 hover:text-white" } };
  const c = s[color];
  return (
    <div className={`relative rounded-2xl border bg-slate-900 p-5 ${c.b} hover:border-slate-500 transition-all overflow-hidden`}>
      <div className="flex justify-between gap-2"><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{title}</p><p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[28px]">{subtitle}</p></div><span className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl ${c.i}`}>{icon}</span></div>
      <h2 className={`mt-3 text-xl font-bold ${c.v}`}>{value}</h2>
      {onEye && (<button onClick={onEye} title={eyeTitle || `View ${title}`} className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[11px] font-black uppercase tracking-wider transition-all ${c.eye}`}><Eye size={15} /> View Details</button>)}
    </div>
  );
}