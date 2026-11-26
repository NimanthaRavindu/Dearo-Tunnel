"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Droplets, Fuel, RefreshCw, Wallet, CreditCard, Filter, X, Calendar, Eye, BarChart3, Banknote, FileText, FileSpreadsheet, Download, Minus, Equal, TrendingDown, AlertTriangle } from "lucide-react";
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
  const displayRemainingDiesel = displayTotalDiesel - totalUsedDiesel;
  const displayRemainingBalance = displayRemainingDiesel * DIESEL_PRICE;
  const displayInitialDiesel = initialDieselStock;
  const displayInitialAmount = initialTotalAmount;
  const usedPercent = initialDieselStock > 0 ? (totalUsedDiesel / initialDieselStock) * 100 : 0;
  const remainingPercent = 100 - usedPercent;
  const isOverUsed = displayRemainingDiesel < 0;
  const overUsedDiesel = Math.max(0, -displayRemainingDiesel);
  const overUsedAmount = overUsedDiesel * DIESEL_PRICE;

  const overUsedBreakdown = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => {
      const d = String(a.date || "").localeCompare(String(b.date || ""));
      if (d !== 0) return d;
      return Number(a.id) - Number(b.id);
    });
    let runningUsed = 0;
    return sorted.map((e) => {
      const diesel = numberValue(e.diesel);
      const before = runningUsed;
      runningUsed += diesel;
      const after = runningUsed;
      const remainingAfter = initialDieselStock - after;
      let overPart = 0;
      let normalPart = diesel;
      if (after > initialDieselStock) { overPart = Math.min(diesel, after - initialDieselStock); normalPart = diesel - overPart; }
      const isOverRow = overPart > 0;
      const isCrossRow = before < initialDieselStock && after >= initialDieselStock;
      return { ...e, diesel, before, after, remainingAfter, normalPart, overPart, isOverRow, isCrossRow, payable: numberValue(e.payable), paid: numberValue(e.paid), overAmount: overPart * DIESEL_PRICE };
    });
  }, [expenses, initialDieselStock]);

  const onlyOverRows = useMemo(() => overUsedBreakdown.filter(r => r.isOverRow), [overUsedBreakdown]);
  const crossRow = useMemo(() => overUsedBreakdown.find(r => r.isCrossRow), [overUsedBreakdown]);
  const overByMachine = useMemo(() => {
    const map = new Map<string, { machine: string; overDiesel: number; overAmount: number; count: number; totalDiesel: number }>();
    onlyOverRows.forEach((r) => {
      const cur = map.get(r.machine) || { machine: r.machine, overDiesel: 0, overAmount: 0, count: 0, totalDiesel: 0 };
      cur.overDiesel += r.overPart; cur.overAmount += r.overAmount; cur.count += 1; cur.totalDiesel += r.diesel; map.set(r.machine, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.overDiesel - a.overDiesel);
  }, [onlyOverRows]);
  const overByDate = useMemo(() => {
    const map = new Map<string, { date: string; overDiesel: number; overAmount: number; count: number }>();
    onlyOverRows.forEach((r) => {
      const d = String(r.date).slice(0,10);
      const cur = map.get(d) || { date: d, overDiesel: 0, overAmount: 0, count: 0 };
      cur.overDiesel += r.overPart; cur.overAmount += r.overAmount; cur.count += 1; map.set(d, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [onlyOverRows]);

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

  // ✅ DIESEL USED PDF 
  const downloadUsedPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(16); doc.text("DEARO - Diesel Used Summary", 14, 15); doc.setFontSize(10); doc.text(`Branch: ${branchId}  |  Date: ${new Date().toLocaleDateString()}`, 14, 23); doc.text(`Total Used: ${formatNumber(totalUsedDiesel)} L  |  Total Payable: Rs. ${formatNumber(totalPayable)}  |  Paid: Rs. ${formatNumber(totalPaid)}  |  Balance: Rs. ${formatNumber(totalBalance)}`, 14, 30);
    doc.setFontSize(11); doc.text("1. Date Wise Summary - diesel_expenses", 14, 38);
    autoTable(doc, { startY: 42, head: [["Date", "Records", "Machines", "Diesel Used (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: filteredUsedByDate.map((r) => [r.date, String(r.count), Array.from(r.machines).join(", "), `${formatNumber(r.diesel)} L`, `Rs. ${formatNumber(r.amount)}`, `Rs. ${formatNumber(r.paid)}`, `Rs. ${formatNumber(r.balance)}`]), foot: [["TOTAL", String(filteredUsedExpenses.length), "-", `${formatNumber(filteredUsedDiesel)} L`, `Rs. ${formatNumber(filteredUsedPayable)}`, `Rs. ${formatNumber(filteredUsedPaid)}`, `Rs. ${formatNumber(filteredUsedPayable - filteredUsedPaid)}`]], styles: { fontSize: 9 }, headStyles: { fillColor: [8, 145, 178] } });
    const y1 = (doc as any).lastAutoTable.finalY + 8; doc.text("2. Full Records - diesel_expenses", 14, y1);
    autoTable(doc, { startY: y1 + 4, head: [["Date", "Machine", "Diesel (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: [...filteredUsedExpenses].sort((a,b)=>String(a.date).localeCompare(String(b.date))).map((e) => [String(e.date).slice(0,10), e.machine, formatNumber(e.diesel), formatNumber(e.payable), formatNumber(e.paid), formatNumber(numberValue(e.payable) - numberValue(e.paid))]), styles: { fontSize: 9 }, headStyles: { fillColor: [30, 41, 59] } });
    doc.save(`Diesel-Used-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  // ✅ DIESEL USED EXCEL 
  const downloadUsedExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = [["DEARO - Diesel Used Summary", "", "", "", "", ""],[`Branch: ${branchId}`, `Date: ${new Date().toLocaleDateString()}`, "", "", "", ""],[`Total Used: ${formatNumber(totalUsedDiesel)} L`, `Total Payable: Rs. ${formatNumber(totalPayable)}`, `Paid: Rs. ${formatNumber(totalPaid)}`, `Balance: Rs. ${formatNumber(totalBalance)}`, `Records: ${expenses.length}`, ""],[],["Metric", "Value"], ["Total Diesel Used (L)", totalUsedDiesel], ["Total Payable (Rs.)", totalPayable], ["Total Paid (Rs.)", totalPaid], ["Total Balance (Rs.)", totalBalance], ["Total Records", expenses.length], ["Initial Diesel (L)", initialDieselStock], ["Remaining Diesel (L)", displayRemainingDiesel]];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData); ws1["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }]; XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    const dateData = [["Date", "Records", "Machines", "Diesel Used (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"], ...filteredUsedByDate.map((r) => [r.date, r.count, Array.from(r.machines).join(", "), r.diesel, r.amount, r.paid, r.balance]), ["TOTAL", filteredUsedExpenses.length, "-", filteredUsedDiesel, filteredUsedPayable, filteredUsedPaid, filteredUsedPayable - filteredUsedPaid]];
    const ws2 = XLSX.utils.aoa_to_sheet(dateData); ws2["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }]; XLSX.utils.book_append_sheet(wb, ws2, "Date Wise");
    const recordsData = [["Date", "Machine", "Diesel (L)", "Payable (Rs.)", "Paid (Rs.)", "Balance (Rs.)"], ...[...filteredUsedExpenses].sort((a,b)=>String(a.date).localeCompare(String(b.date))).map((e) => [String(e.date).slice(0,10), e.machine, Number(e.diesel), Number(e.payable), Number(e.paid), Number(e.payable) - Number(e.paid)])];
    const ws3 = XLSX.utils.aoa_to_sheet(recordsData); ws3["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }]; XLSX.utils.book_append_sheet(wb, ws3, "All Records");
    XLSX.writeFile(wb, `Diesel-Used-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const downloadTotalAmountPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(16); doc.text("DEARO - Total Amount Summary", 14, 15); doc.setFontSize(10); doc.text(`Branch: ${branchId}  |  Date: ${new Date().toLocaleDateString()}`, 14, 23); doc.text(`Total Amount (Payable): Rs. ${formatNumber(totalPayable)}  |  Paid: Rs. ${formatNumber(totalPaid)}  |  Balance: Rs. ${formatNumber(totalBalance)}  |  Diesel Used: ${formatNumber(totalUsedDiesel)} L`, 14, 30);
    doc.setFontSize(11); doc.text("Date Wise - Total Amount", 14, 38);
    autoTable(doc, { startY: 42, head: [["Date", "Records", "Diesel (L)", "Payable - Total Amount (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: filteredUsedByDate.map((r) => [r.date, String(r.count), `${formatNumber(r.diesel)} L`, `Rs. ${formatNumber(r.amount)}`, `Rs. ${formatNumber(r.paid)}`, `Rs. ${formatNumber(r.balance)}`]), foot: [["TOTAL", String(filteredUsedExpenses.length), `${formatNumber(filteredUsedDiesel)} L`, `Rs. ${formatNumber(filteredUsedPayable)}`, `Rs. ${formatNumber(filteredUsedPaid)}`, `Rs. ${formatNumber(filteredUsedPayable - filteredUsedPaid)}`]], styles: { fontSize: 9 }, headStyles: { fillColor: [37, 99, 235] } });
    const y1 = (doc as any).lastAutoTable.finalY + 8; doc.text("Machine Wise - Total Amount", 14, y1);
    autoTable(doc, { startY: y1 + 4, head: [["Machine", "Records", "Diesel (L)", "Total Amount (Rs.)", "Paid (Rs.)", "Balance (Rs.)"]], body: filteredUsedByMachine.map((m) => [m.machine, String(m.count), `${formatNumber(m.diesel)} L`, `Rs. ${formatNumber(m.amount)}`, `Rs. ${formatNumber(m.paid)}`, `Rs. ${formatNumber(m.balance)}`]), styles: { fontSize: 9 }, headStyles: { fillColor: [30, 41, 59] } });
    doc.save(`Total-Amount-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const downloadTotalAmountExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([["DEARO - Total Amount Summary"],[`Branch: ${branchId}`, `Date: ${new Date().toLocaleDateString()}`],[],["Metric","Value"],["Total Amount - Payable (Rs.)", totalPayable],["Total Paid (Rs.)", totalPaid],["Total Balance (Rs.)", totalBalance],["Total Diesel Used (L)", totalUsedDiesel],["Total Records", expenses.length]]); ws1["!cols"] = [{ wch: 30 }, { wch: 20 }]; XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    const ws2 = XLSX.utils.aoa_to_sheet([["Date","Records","Diesel (L)","Total Amount - Payable (Rs.)","Paid (Rs.)","Balance (Rs.)"], ...filteredUsedByDate.map((r) => [r.date, r.count, r.diesel, r.amount, r.paid, r.balance]), ["TOTAL", filteredUsedExpenses.length, filteredUsedDiesel, filteredUsedPayable, filteredUsedPaid, filteredUsedPayable - filteredUsedPaid]]); ws2["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 16 }]; XLSX.utils.book_append_sheet(wb, ws2, "Date Wise");
    const ws3 = XLSX.utils.aoa_to_sheet([["Machine","Records","Diesel (L)","Total Amount (Rs.)","Paid (Rs.)","Balance (Rs.)"], ...filteredUsedByMachine.map((m) => [m.machine, m.count, m.diesel, m.amount, m.paid, m.balance])]); ws3["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 16 }]; XLSX.utils.book_append_sheet(wb, ws3, "Machine Wise");
    XLSX.writeFile(wb, `Total-Amount-Summary-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadRemainingPDF = () => {
    const doc = new jsPDF(); doc.setFontSize(16); doc.text("DEARO - Remaining Diesel & Balance - MINUS Calculation", 14, 15); doc.setFontSize(10); doc.text(`Branch: ${branchId}  |  Date: ${new Date().toLocaleDateString()}`, 14, 23);
    doc.setFontSize(11); doc.text("MINUS Calculation - Remaining Diesel", 14, 31);
    autoTable(doc, { startY: 35, head: [["", "Description", "Diesel (L)", "Amount (Rs.)"]], body: [
      ["", "Initial Diesel Stock", `${formatNumber(initialDieselStock)} L`, `Rs. ${formatNumber(initialTotalAmount)}`],
      ["-", "Minus (-) Diesel Used", `${formatNumber(totalUsedDiesel)} L`, `Rs. ${formatNumber(totalPayable)}`],
      ["=", "Remaining Diesel", `${formatNumber(displayRemainingDiesel)} L`, `Rs. ${formatNumber(displayRemainingBalance)}`],
      ["", "OVER USED (Vediyen)", `${formatNumber(overUsedDiesel)} L`, `Rs. ${formatNumber(overUsedAmount)}`],
    ], styles: { fontSize: 10 }, headStyles: { fillColor: [220, 38, 38] } });
    const y1 = (doc as any).lastAutoTable.finalY + 6;
    doc.text("MINUS Calculation - Remaining Balance", 14, y1);
    autoTable(doc, { startY: y1 + 4, head: [["", "Description", "Calculation", "Value"]], body: [
      ["", "Remaining Diesel", `${formatNumber(displayRemainingDiesel)} L`, `${formatNumber(displayRemainingDiesel)} L`],
      ["x", "Diesel Price", `x Rs. ${DIESEL_PRICE}`, `Rs. ${DIESEL_PRICE}`],
      ["=", "Remaining Balance", `${formatNumber(displayRemainingDiesel)} L x Rs. ${DIESEL_PRICE}`, `Rs. ${formatNumber(displayRemainingBalance)}`],
    ], styles: { fontSize: 10 }, headStyles: { fillColor: [16, 185, 129] } });
    const y2 = (doc as any).lastAutoTable.finalY + 6;
    doc.text(`Formula Diesel: ${formatNumber(initialDieselStock)} L - ${formatNumber(totalUsedDiesel)} L = ${formatNumber(displayRemainingDiesel)} L`, 14, y2);
    doc.text(`Formula Balance: ${formatNumber(displayRemainingDiesel)} L x Rs. ${DIESEL_PRICE} = Rs. ${formatNumber(displayRemainingBalance)}`, 14, y2 + 7);
    doc.text(`OVER USED Formula: ${formatNumber(totalUsedDiesel)} L - ${formatNumber(initialDieselStock)} L = ${formatNumber(overUsedDiesel)} L vediyen`, 14, y2 + 14);
    const y3 = y2 + 22;
    doc.text(`OVER USED ${formatNumber(overUsedDiesel)} L Mokakda? - Machine Wise`, 14, y3);
    autoTable(doc, { startY: y3 + 4, head: [["Machine", "Records (Over)", "Over Used Diesel (L)", "Over Amount (Rs.)", "Total Diesel in those Records"]], body: overByMachine.map((m) => [m.machine, String(m.count), `${formatNumber(m.overDiesel)} L`, `Rs. ${formatNumber(m.overAmount)}`, `${formatNumber(m.totalDiesel)} L`]), foot: [["TOTAL OVER", String(onlyOverRows.length), `${formatNumber(overUsedDiesel)} L`, `Rs. ${formatNumber(overUsedAmount)}`, ""]], styles: { fontSize: 9 }, headStyles: { fillColor: [220, 38, 38] } });
    const y4 = (doc as any).lastAutoTable.finalY + 6;
    doc.text(`OVER USED ${formatNumber(overUsedDiesel)} L Mokakda? - Date Wise`, 14, y4);
    autoTable(doc, { startY: y4 + 4, head: [["Date", "Records (Over)", "Over Used Diesel (L)", "Over Amount (Rs.)"]], body: overByDate.map((r) => [r.date, String(r.count), `${formatNumber(r.overDiesel)} L`, `Rs. ${formatNumber(r.overAmount)}`]), foot: [["TOTAL OVER", String(onlyOverRows.length), `${formatNumber(overUsedDiesel)} L`, `Rs. ${formatNumber(overUsedAmount)}`]], styles: { fontSize: 9 }, headStyles: { fillColor: [249, 115, 22] } });
    const y5 = (doc as any).lastAutoTable.finalY + 6;
    doc.text("Full Running - 745L Iwara Wune Koheda?", 14, y5);
    autoTable(doc, { startY: y5 + 4, head: [["Date", "Machine", "Diesel (L)", "Running Used", "Remaining After", "Over Part"]], body: overUsedBreakdown.map((r) => [String(r.date).slice(0,10), r.machine, `${formatNumber(r.diesel)} L`, `${formatNumber(r.after)} L`, `${formatNumber(r.remainingAfter)} L`, r.isOverRow ? `${formatNumber(r.overPart)} L OVER` : "-"]), styles: { fontSize: 8 }, headStyles: { fillColor: [30, 41, 59] } });
    doc.save(`Over-Used-${formatNumber(overUsedDiesel)}L-Breakdown-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const downloadRemainingExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ["DEARO - Remaining Diesel & Balance - MINUS Calculation"],
      [`Branch: ${branchId}`, `Date: ${new Date().toLocaleDateString()}`],
      [],
      ["", "Description", "Diesel (L)", "Amount (Rs.)"],
      ["", "Initial Diesel Stock", initialDieselStock, initialTotalAmount],
      ["-", "Minus (-) Diesel Used", totalUsedDiesel, totalPayable],
      ["=", "Remaining Diesel", displayRemainingDiesel, displayRemainingBalance],
      ["", "OVER USED (Vediyen)", overUsedDiesel, overUsedAmount],
      [],
      ["Formula Diesel", `${initialDieselStock} - ${totalUsedDiesel} = ${displayRemainingDiesel} L`],
      ["Formula Balance", `${displayRemainingDiesel} x ${DIESEL_PRICE} = Rs. ${displayRemainingBalance}`],
      ["OVER USED Formula", `Used ${totalUsedDiesel} - Initial ${initialDieselStock} = ${overUsedDiesel} L`],
    ]); ws1["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 22 }, { wch: 22 }]; XLSX.utils.book_append_sheet(wb, ws1, "Remaining Minus");
    const ws2 = XLSX.utils.aoa_to_sheet([["Machine","Over Records","Over Used Diesel (L)","Over Amount (Rs.)","Total Diesel in those Records"], ...overByMachine.map((m) => [m.machine, m.count, m.overDiesel, m.overAmount, m.totalDiesel]), ["TOTAL OVER", onlyOverRows.length, overUsedDiesel, overUsedAmount, ""]]); ws2["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 26 }]; XLSX.utils.book_append_sheet(wb, ws2, "Over By Machine");
    const ws3 = XLSX.utils.aoa_to_sheet([["Date","Over Records","Over Used Diesel (L)","Over Amount (Rs.)"], ...overByDate.map((r) => [r.date, r.count, r.overDiesel, r.overAmount]), ["TOTAL OVER", onlyOverRows.length, overUsedDiesel, overUsedAmount]]); ws3["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 20 }]; XLSX.utils.book_append_sheet(wb, ws3, "Over By Date");
    const ws4 = XLSX.utils.aoa_to_sheet([["Date","Machine","Diesel (L)","Running Used (L)","Remaining After (L)","Normal Part (L)","Over Part (L)","Over Amount (Rs.)","Is Cross (745L Iwara Wune?)"], ...overUsedBreakdown.map((r) => [String(r.date).slice(0,10), r.machine, r.diesel, r.after, r.remainingAfter, r.normalPart, r.overPart, r.overAmount, r.isCrossRow ? "YES - 745L Iwara Wune" : r.isOverRow ? "OVER" : ""])]); ws4["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 24 }]; XLSX.utils.book_append_sheet(wb, ws4, "Full Running");
    const ws5 = XLSX.utils.aoa_to_sheet([["Date","Records","Diesel Used (L)","Payable (Rs.)"], ...filteredUsedByDate.map((r) => [r.date, r.count, r.diesel, r.amount]), ["TOTAL", filteredUsedExpenses.length, filteredUsedDiesel, filteredUsedPayable]]); ws5["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 22 }]; XLSX.utils.book_append_sheet(wb, ws5, "Date Wise Used");
    XLSX.writeFile(wb, `Over-Used-Breakdown-Branch-${branchId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getModalTitle = () => {
    if (modalType === "initial") return "Initial Stock Summary - 745L Kohomada Hadune?";
    if (modalType === "used") return "Diesel Used Summary - diesel_expenses";
    if (modalType === "totalAmount") return "Total Amount Summary - Payable Total";
    if (modalType === "remaining") return "Remaining Diesel - MINUS + OVER USED Breakdown";
    if (modalType === "remainingBalance") return "Remaining Balance - MINUS + OVER USED Breakdown";
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
          <SummaryCard title="Remaining Diesel" subtitle={`${formatNumber(displayTotalDiesel)} L - ${formatNumber(totalUsedDiesel)} L = ${formatNumber(displayRemainingDiesel)} L ${isOverUsed ? `• OVER ${formatNumber(overUsedDiesel)} L!` : ""}`} value={`${formatNumber(displayRemainingDiesel)} L`} icon={<Droplets size={22}/>} color="orange" onEye={() => handleCardEye("remaining")} eyeTitle="Over Used 190L Mokakda? Balanna" isNegative={isOverUsed} extra={isOverUsed ? `OVER USED: ${formatNumber(overUsedDiesel)} L` : undefined} />
          <SummaryCard title="Remaining Balance" subtitle={`${formatNumber(displayRemainingDiesel)} L x Rs. ${DIESEL_PRICE} = Rs. ${formatNumber(displayRemainingBalance)}`} value={`Rs. ${formatNumber(displayRemainingBalance)}`} icon={<CreditCard size={22}/>} color="green" onEye={() => handleCardEye("remainingBalance")} eyeTitle="Over Used Amount Balanna" isNegative={isOverUsed} extra={isOverUsed ? `OVER AMOUNT: Rs. ${formatNumber(overUsedAmount)}` : undefined} />
          <SummaryCard title="Total Diesel" subtitle="Initial stock" value={`${formatNumber(displayTotalDiesel)} L`} icon={<AlertCircle size={22}/>} color="red" onEye={() => handleCardEye("total")} eyeTitle="Total Diesel" />
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-700/80 space-y-4">
            <div className="flex justify-between items-center"><h2 className="font-bold">Records</h2><span className="text-sm bg-slate-800 px-3 py-1 rounded-xl">{filteredExpenses.length} / {expenses.length} Records {isOverUsed && <span className="text-red-400 font-bold">• OVER {formatNumber(overUsedDiesel)} L</span>}</span></div>
            <div className="flex flex-wrap gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2"><Filter size={14} className="text-slate-400"/><span className="text-xs font-bold text-slate-400 uppercase">Filter:</span></div>
              <select value={filterMachine} onChange={e=>setFilterMachine(e.target.value)} className="h-9 rounded-lg border border-slate-600 bg-slate-900 px-3 text-xs outline-none"><option value="">All Machines</option>{machines.map(m=> <option key={m} value={m}>{m}</option>)}{expenses.map(e=>e.machine).filter((v,i,a)=>v && !machines.includes(v) && a.indexOf(v)===i).map(m=> <option key={m} value={m}>{m}</option>)}</select>
              <div className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-600 bg-slate-50 px-3"><Calendar size={14} className="text-slate-900"/><input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="bg-transparent text-xs outline-none" /></div>
              {isFiltered && (<button onClick={clearFilters} className="h-9 inline-flex items-center gap-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 px-3 text-xs font-bold"><X size={12}/>Clear</button>)}
            </div>
            {isOverUsed && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"><AlertTriangle size={16}/> OVER USED: {formatNumber(overUsedDiesel)} L vediyen use wela! Initial {formatNumber(initialDieselStock)} L iwara wela, thawa {formatNumber(overUsedDiesel)} L ona wela thiyenawa! - Remaining Card eke View Details eka click karanna, mokakda me {formatNumber(overUsedDiesel)} L kiyala balanna!</div>
            )}
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1000px]"><thead className="bg-slate-800/80"><tr className="text-xs text-slate-400 uppercase"><th className="px-5 py-4 text-left">Date</th><th className="px-5 py-4 text-left">Machine</th><th className="px-5 py-4 text-right">Diesel</th><th className="px-5 py-4 text-right">Running Used</th><th className="px-5 py-4 text-right">Remaining After</th><th className="px-5 py-4 text-right">Payable</th><th className="px-5 py-4 text-right">Paid</th><th className="px-5 py-4 text-right">Balance</th></tr></thead><tbody>{filteredExpenses.length===0 ? <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">No records</td></tr> : [...filteredExpenses].sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(item => {
            const breakdown = overUsedBreakdown.find(r => r.id === item.id);
            const p = numberValue(item.payable); const pd = numberValue(item.paid);
            return <tr key={item.id} className={`border-b border-slate-800 hover:bg-slate-800/40 ${breakdown?.isOverRow ? "bg-red-500/10" : ""} ${breakdown?.isCrossRow ? "bg-orange-500/10" : ""}`}><td className="px-5 py-4 text-sm">{item.date?.slice(0, 10)} {breakdown?.isCrossRow && <span className="ml-1 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-black text-white">745L IWARA</span>} {breakdown?.isOverRow && <span className="ml-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">OVER {formatNumber(breakdown.overPart)} L</span>}</td><td className="px-5 py-4 font-semibold">{item.machine}</td><td className="px-5 py-4 text-right">{formatNumber(item.diesel)}</td><td className="px-5 py-4 text-right text-slate-300">{breakdown ? `${formatNumber(breakdown.after)} L` : "-"}</td><td className={`px-5 py-4 text-right font-bold ${breakdown && breakdown.remainingAfter < 0 ? "text-red-400" : "text-emerald-300"}`}>{breakdown ? `${formatNumber(breakdown.remainingAfter)} L` : "-"}</td><td className="px-5 py-4 text-right font-bold text-blue-400">Rs. {formatNumber(p)}</td><td className="px-5 py-4 text-right font-bold text-green-400">Rs. {formatNumber(pd)}</td><td className="px-5 py-4 text-right font-bold text-red-400">Rs. {formatNumber(p - pd)}</td></tr> })}</tbody></table></div>
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

              {(modalType === "remaining" || modalType === "remainingBalance") && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Diesel</p><p className="mt-2 text-lg font-black text-violet-300">{formatNumber(initialDieselStock)} L</p><p className="text-[10px] text-slate-500 mt-1">Rs. {formatNumber(initialTotalAmount)}</p></div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(totalUsedDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">Rs. {formatNumber(totalPayable)}</p></div>
                    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining Diesel</p><p className="mt-2 text-lg font-black text-red-400">{formatNumber(displayRemainingDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">{remainingPercent.toFixed(1)}% Left</p></div>
                    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining Balance</p><p className="mt-2 text-lg font-black text-red-400">Rs. {formatNumber(displayRemainingBalance)}</p><p className="text-[10px] text-slate-500 mt-1">{formatNumber(displayRemainingDiesel)} L x Rs. {DIESEL_PRICE}</p></div>
                  </div>

                  {isOverUsed && (
                    <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4">
                      <p className="flex items-center gap-2 text-sm font-black text-red-300"><AlertTriangle size={16}/> OVER USED: {formatNumber(overUsedDiesel)} L vediyen use wela!</p>
                      <p className="text-xs text-slate-300 mt-2">Initial {formatNumber(initialDieselStock)} L iwara wela, thawa <span className="font-black text-red-300">{formatNumber(overUsedDiesel)} L</span> vediyen use wela thiyenawa! Eke Amount eka <span className="font-black text-red-300">Rs. {formatNumber(overUsedAmount)}</span> ( {formatNumber(overUsedDiesel)} L x Rs. {DIESEL_PRICE} )</p>
                      {crossRow && <p className="text-xs text-orange-300 mt-1">⚡ 745L iwara wune: <span className="font-black">{String(crossRow.date).slice(0,10)} - {crossRow.machine} - {formatNumber(crossRow.diesel)} L</span> record eken!</p>}
                    </div>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-orange-500/30">
                    <div className="bg-slate-900 px-4 py-3"><h3 className="text-xs font-black uppercase tracking-widest text-orange-300">Minus Calculation - Remaining Diesel</h3></div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-800/70">
                        <tr><td className="px-4 py-3 w-10 text-center"></td><td className="px-4 py-3 font-bold">Initial Diesel Stock</td><td className="px-4 py-3 text-right font-bold text-violet-300">{formatNumber(initialDieselStock)} L</td><td className="px-4 py-3 text-right text-slate-400">Rs. {formatNumber(initialTotalAmount)}</td></tr>
                        <tr className="bg-red-500/5"><td className="px-4 py-3 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"><Minus size={14}/></span></td><td className="px-4 py-3 font-bold text-red-300">Minus (-) Diesel Used</td><td className="px-4 py-3 text-right font-bold text-red-300">{formatNumber(totalUsedDiesel)} L</td><td className="px-4 py-3 text-right text-red-300">Rs. {formatNumber(totalPayable)}</td></tr>
                        <tr className="bg-slate-900"><td className="px-4 py-3 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Equal size={14}/></span></td><td className="px-4 py-3 font-black">Remaining Diesel</td><td className="px-4 py-3 text-right font-black text-base text-red-400">{formatNumber(displayRemainingDiesel)} L</td><td className="px-4 py-3 text-right font-black text-red-400">Rs. {formatNumber(displayRemainingBalance)}</td></tr>
                      </tbody>
                    </table>
                    <div className="bg-slate-900/60 px-4 py-3 text-center text-xs font-bold text-slate-300">
                      {formatNumber(initialDieselStock)} L <span className="text-red-400 mx-1">-</span> {formatNumber(totalUsedDiesel)} L <span className="text-emerald-400 mx-1">=</span> <span className="text-red-400">{formatNumber(displayRemainingDiesel)} L</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 text-sm">
                    <p><span className="text-slate-400">Formula Diesel:</span> <span className="font-bold text-white">{formatNumber(initialDieselStock)} L - {formatNumber(totalUsedDiesel)} L = <span className="text-red-400">{formatNumber(displayRemainingDiesel)} L</span></span></p>
                    <p><span className="text-slate-400">Formula Balance:</span> <span className="font-bold text-white">{formatNumber(displayRemainingDiesel)} L x Rs. {DIESEL_PRICE} = <span className="text-red-400">Rs. {formatNumber(displayRemainingBalance)}</span></span></p>
                    <p><span className="text-slate-400">OVER USED Formula:</span> <span className="font-bold text-white">{formatNumber(totalUsedDiesel)} L - {formatNumber(initialDieselStock)} L = <span className="text-red-400">{formatNumber(overUsedDiesel)} L vediyen</span></span></p>
                    <div><div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2"><span>Used {usedPercent.toFixed(1)}%</span><span>Remaining {remainingPercent.toFixed(1)}%</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, usedPercent))}%` }} /></div></div>
                  </div>

                  <div className="flex gap-2"><button onClick={downloadRemainingPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs font-black uppercase"><FileText size={14}/> Download PDF - Over Used Breakdown</button><button onClick={downloadRemainingExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel - Over Used</button></div>

                  {isOverUsed && (
                    <>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-red-300 mb-3">⚠️ {formatNumber(overUsedDiesel)} L Vediyen Giye Mokakda? - Machine Wise</h3>
                        <div className="space-y-2">{overByMachine.map((m) => (<div key={m.machine} className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3"><div><p className="font-bold text-sm">{m.machine}</p><p className="text-[11px] text-slate-400">{m.count} record(s) vediyen giya • Total in those records {formatNumber(m.totalDiesel)} L</p></div><div className="text-right"><p className="font-black text-red-400 text-sm">{formatNumber(m.overDiesel)} L OVER</p><p className="text-[11px] text-slate-400">Rs. {formatNumber(m.overAmount)}</p></div></div>))}</div>
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-orange-300 mb-3">⚠️ {formatNumber(overUsedDiesel)} L Vediyen Giye Mokakda? - Date Wise</h3>
                        <div className="overflow-hidden rounded-2xl border border-orange-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Over Records</th><th className="px-4 py-3 text-right">Over Diesel</th><th className="px-4 py-3 text-right">Over Amount</th></tr></thead><tbody className="divide-y divide-slate-800/70">{overByDate.map((r) => (<tr key={r.date}><td className="px-4 py-3 font-bold">{r.date}</td><td className="px-4 py-3 text-center">{r.count}</td><td className="px-4 py-3 text-right font-bold text-red-400">{formatNumber(r.overDiesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(r.overAmount)}</td></tr>))}</tbody><tfoot className="bg-slate-900"><tr className="font-black text-red-400"><td className="px-4 py-3">TOTAL OVER</td><td className="px-4 py-3 text-center">{onlyOverRows.length}</td><td className="px-4 py-3 text-right">{formatNumber(overUsedDiesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(overUsedAmount)}</td></tr></tfoot></table></div>
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-3">Full Running - 745L Iwara Wune Koheda? Date Anuwa</h3>
                        <div className="overflow-hidden rounded-2xl border border-slate-800"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Machine</th><th className="px-4 py-3 text-right">Diesel</th><th className="px-4 py-3 text-right">Running Used</th><th className="px-4 py-3 text-right">Remaining After</th><th className="px-4 py-3 text-right">Over Part</th></tr></thead><tbody className="divide-y divide-slate-800/70">{overUsedBreakdown.map((r) => (<tr key={r.id} className={r.isOverRow ? "bg-red-500/10" : r.isCrossRow ? "bg-orange-500/10" : ""}><td className="px-4 py-3 font-bold">{String(r.date).slice(0,10)} {r.isCrossRow && <span className="ml-1 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-black text-white">745L IWARA</span>}</td><td className="px-4 py-3">{r.machine}</td><td className="px-4 py-3 text-right">{formatNumber(r.diesel)} L</td><td className="px-4 py-3 text-right text-slate-300">{formatNumber(r.after)} L</td><td className={`px-4 py-3 text-right font-bold ${r.remainingAfter < 0 ? "text-red-400" : "text-emerald-300"}`}>{formatNumber(r.remainingAfter)} L</td><td className="px-4 py-3 text-right font-bold text-red-400">{r.isOverRow ? `${formatNumber(r.overPart)} L OVER` : "-"}</td></tr>))}</tbody><tfoot className="bg-slate-900"><tr className="font-black"><td className="px-4 py-3" colSpan={2}>TOTAL</td><td className="px-4 py-3 text-right">{formatNumber(totalUsedDiesel)} L</td><td className="px-4 py-3 text-right">{formatNumber(totalUsedDiesel)} L</td><td className="px-4 py-3 text-right text-red-400">{formatNumber(displayRemainingDiesel)} L</td><td className="px-4 py-3 text-right text-red-400">{formatNumber(overUsedDiesel)} L OVER</td></tr></tfoot></table></div>
                      </div>
                    </>
                  )}
                </>
              )}

              {modalType === "totalAmount" && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Amount</p><p className="mt-2 text-lg font-black text-blue-300">Rs. {formatNumber(totalPayable)}</p><p className="text-[10px] text-slate-500 mt-1">Payable Total</p></div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-2 text-lg font-black text-emerald-300">Rs. {formatNumber(totalPaid)}</p><p className="text-[10px] text-slate-500 mt-1">Paid Total</p></div>
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Balance</p><p className="mt-2 text-lg font-black text-red-300">Rs. {formatNumber(totalBalance)}</p><p className="text-[10px] text-slate-500 mt-1">Payable - Paid</p></div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(totalUsedDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">{expenses.length} Records</p></div>
                  </div>
                  <div className="flex gap-2"><button onClick={downloadTotalAmountPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs font-black uppercase"><FileText size={14}/> Download PDF - Total Amount</button><button onClick={downloadTotalAmountExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel</button></div>
                  <div><h3 className="text-xs font-black uppercase tracking-widest text-blue-300 mb-3">Date Wise - Total Amount</h3><div className="overflow-hidden rounded-2xl border border-blue-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Records</th><th className="px-4 py-3 text-right">Diesel</th><th className="px-4 py-3 text-right">Total Amount</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Balance</th></tr></thead><tbody className="divide-y divide-slate-800/70">{filteredUsedByDate.map((row) => (<tr key={row.date}><td className="px-4 py-3 font-bold">{row.date}</td><td className="px-4 py-3 text-center"><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold">{row.count}</span></td><td className="px-4 py-3 text-right text-cyan-300 font-bold">{formatNumber(row.diesel)} L</td><td className="px-4 py-3 text-right font-bold text-blue-300">Rs. {formatNumber(row.amount)}</td><td className="px-4 py-3 text-right text-emerald-300">Rs. {formatNumber(row.paid)}</td><td className="px-4 py-3 text-right text-red-300">Rs. {formatNumber(row.balance)}</td></tr>))}</tbody><tfoot className="bg-slate-900"><tr className="font-black"><td className="px-4 py-3 text-slate-400">Total</td><td className="px-4 py-3 text-center">{filteredUsedExpenses.length}</td><td className="px-4 py-3 text-right">{formatNumber(filteredUsedDiesel)} L</td><td className="px-4 py-3 text-right text-blue-300">Rs. {formatNumber(filteredUsedPayable)}</td><td className="px-4 py-3 text-right">Rs. {formatNumber(filteredUsedPaid)}</td><td className="px-4 py-3 text-right">Rs. {formatNumber(filteredUsedPayable - filteredUsedPaid)}</td></tr></tfoot></table></div></div>
                  <div><h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Machine Wise - Total Amount</h3><div className="space-y-2">{filteredUsedByMachine.map((m) => (<div key={m.machine} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"><div><p className="font-bold text-sm">{m.machine}</p><p className="text-[11px] text-slate-500">{m.count} records • {formatNumber(m.diesel)} L</p></div><div className="text-right"><p className="font-black text-blue-300 text-sm">Rs. {formatNumber(m.amount)}</p><p className="text-[11px] text-slate-400">Paid Rs. {formatNumber(m.paid)} • Bal Rs. {formatNumber(m.balance)}</p></div></div>))}</div></div>
                </>
              )}

              {/* ✅ DIESEL USED MODAL */}
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
                  <div className="flex gap-2"><button onClick={downloadUsedPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-3 text-xs font-black uppercase"><FileText size={14}/> Download PDF - Used Summary</button><button onClick={downloadUsedExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel - 3 Sheets</button></div>
                  <div><div className="flex items-center justify-between mb-3"><h3 className="text-xs font-black uppercase tracking-widest text-cyan-300">1. Date Wise Summary • diesel_expenses</h3><span className="rounded-lg bg-cyan-500/15 text-cyan-300 px-2.5 py-1 text-[11px] font-bold">{filteredUsedByDate.length} Days • {filteredUsedExpenses.length} Records</span></div><div className="overflow-hidden rounded-2xl border border-cyan-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Records</th><th className="px-4 py-3 text-right">Diesel</th><th className="px-4 py-3 text-right">Payable</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Balance</th></tr></thead><tbody className="divide-y divide-slate-800/70">{filteredUsedByDate.map((row) => (<tr key={row.date}><td className="px-4 py-3"><p className="font-bold">{row.date}</p><p className="text-[11px] text-slate-500">{Array.from(row.machines).slice(0,2).join(", ")}{row.machines.size > 2 ? ` +${row.machines.size - 2} more` : ""}</p></td><td className="px-4 py-3 text-center"><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold">{row.count}</span></td><td className="px-4 py-3 text-right font-bold text-cyan-300">{formatNumber(row.diesel)} L</td><td className="px-4 py-3 text-right font-bold">Rs. {formatNumber(row.amount)}</td><td className="px-4 py-3 text-right font-bold text-emerald-300">Rs. {formatNumber(row.paid)}</td><td className="px-4 py-3 text-right font-bold text-red-300">Rs. {formatNumber(row.balance)}</td></tr>))}</tbody><tfoot className="bg-slate-900"><tr className="font-black"><td className="px-4 py-3 text-slate-400">Total</td><td className="px-4 py-3 text-center">{filteredUsedExpenses.length}</td><td className="px-4 py-3 text-right text-cyan-300">{formatNumber(filteredUsedDiesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(filteredUsedPayable)}</td><td className="px-4 py-3 text-right">Rs. {formatNumber(filteredUsedPaid)}</td><td className="px-4 py-3 text-right">Rs. {formatNumber(filteredUsedPayable - filteredUsedPaid)}</td></tr></tfoot></table></div></div>
                
                  <div><h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">2. All Records • diesel_expenses</h3><div className="overflow-hidden rounded-2xl border border-slate-800"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Machine</th><th className="px-4 py-3 text-right">Diesel</th><th className="px-4 py-3 text-right">Payable</th><th className="px-4 py-3 text-right">Paid</th></tr></thead><tbody className="divide-y divide-slate-800/70">{[...filteredUsedExpenses].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,50).map((e) => (<tr key={e.id}><td className="px-4 py-3 font-bold">{String(e.date).slice(0,10)}</td><td className="px-4 py-3">{e.machine}</td><td className="px-4 py-3 text-right text-cyan-300 font-bold">{formatNumber(e.diesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(e.payable)}</td><td className="px-4 py-3 text-right text-emerald-300">Rs. {formatNumber(e.paid)}</td></tr>))}</tbody></table></div><p className="text-[11px] text-slate-500 mt-2">* Modal eke 50 witharai penwanawa. PDF / Excel eke okkoma {filteredUsedExpenses.length} records thiyenawa.</p></div>
                </>
              )}

              {(modalType === "initial" || modalType === "total") && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Diesel</p><p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(initialDieselStock)} L</p><p className="text-[10px] text-slate-500 mt-1">Total Add karapu gaana</p></div>
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Amount</p><p className="mt-2 text-lg font-black text-blue-300">Rs. {formatNumber(initialTotalAmount)}</p><p className="text-[10px] text-slate-500 mt-1">Total Amount</p></div>
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p><p className="mt-2 text-lg font-black text-orange-300">{formatNumber(totalUsedDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">Table eke ekathuwa</p></div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining</p><p className={`mt-2 text-lg font-black ${isOverUsed ? "text-red-400" : "text-emerald-300"}`}>{formatNumber(displayRemainingDiesel)} L</p><p className="text-[10px] text-slate-500 mt-1">Rs. {formatNumber(displayRemainingBalance)}</p></div>
                  </div>
                  <div><div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2"><span>Used {initialDieselStock > 0 ? Math.round((totalUsedDiesel / initialDieselStock) * 100) : 0}%</span><span>Remaining {initialDieselStock > 0 ? Math.round((displayRemainingDiesel / initialDieselStock) * 100) : 0}%</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${initialDieselStock > 0 ? Math.min(100, Math.max(0, (totalUsedDiesel / initialDieselStock) * 100)) : 0}%` }} /></div></div>
                  <div><div className="flex flex-wrap items-center justify-between gap-2 mb-3"><h3 className="text-xs font-black uppercase tracking-widest text-cyan-300">Initial Add History • Date Wise • Branch {branchId}</h3><div className="flex items-center gap-2"><div className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-600 bg-slate-900 px-3"><Calendar size={14} className="text-slate-400"/><input type="date" value={initialFilterDate} onChange={e=>setInitialFilterDate(e.target.value)} className="bg-transparent text-xs outline-none" /></div>{initialFilterDate && <button onClick={()=>setInitialFilterDate("")} className="h-9 px-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1"><X size={12}/>Clear</button>}<span className="rounded-lg bg-cyan-500/15 text-cyan-300 px-2.5 py-1 text-[11px] font-bold">{filteredInitialByDate.length} Days • {initialHistory.length} Adds</span></div></div><div className="flex gap-2 mb-3"><button onClick={downloadInitialPDF} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-black uppercase"><FileText size={14}/> Download PDF - 745L History</button><button onClick={downloadInitialExcel} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-black uppercase"><FileSpreadsheet size={14}/> Download Excel</button></div>{filteredInitialByDate.length === 0 ? (<p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">Thama Initial Add History na<br/><span className="text-[11px]">DB Total: {formatNumber(initialDieselStock)} L / Rs. {formatNumber(initialTotalAmount)}</span></p>) : (<div className="overflow-hidden rounded-2xl border border-cyan-500/20"><table className="w-full text-sm"><thead className="bg-slate-900"><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Adds</th><th className="px-4 py-3 text-right">Initial Diesel</th><th className="px-4 py-3 text-right">Initial Amount</th><th className="px-4 py-3 text-right">Running Total</th></tr></thead><tbody className="divide-y divide-slate-800/70">{(() => { let running = 0; const sorted = [...filteredInitialByDate].sort((a,b)=>{ if(a.date==="No Date") return -1; if(b.date==="No Date") return 1; return a.date.localeCompare(b.date); }); return sorted.map((row) => { running += row.diesel; return (<tr key={row.date} className="hover:bg-slate-800/40"><td className="px-4 py-3 font-bold">{row.date}</td><td className="px-4 py-3 text-center"><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold">{row.count}</span></td><td className="px-4 py-3 text-right font-bold text-cyan-300">{formatNumber(row.diesel)} L</td><td className="px-4 py-3 text-right font-bold">Rs. {formatNumber(row.amount)}</td><td className="px-4 py-3 text-right font-bold text-emerald-300">{formatNumber(running)} L</td></tr>); }); })()}</tbody><tfoot className="bg-slate-900"><tr className="font-black"><td className="px-4 py-3 text-slate-400">Total (History)</td><td className="px-4 py-3 text-center">{initialHistory.length}</td><td className="px-4 py-3 text-right text-cyan-300">{formatNumber(totalInitialHistoryDiesel)} L</td><td className="px-4 py-3 text-right">Rs. {formatNumber(totalInitialHistoryAmount)}</td><td className="px-4 py-3 text-right text-emerald-300">{formatNumber(totalInitialHistoryDiesel)} L</td></tr></tfoot></table></div>)}</div>
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

function SummaryCard({ title, subtitle, value, icon, color, onEye, eyeTitle, isNegative, extra }: { title: string; subtitle: string; value: string; icon: React.ReactNode; color: CardColor; onEye?: () => void; eyeTitle?: string; isNegative?: boolean; extra?: string; }) {
  const s: any = { cyan: { b: "border-cyan-500/25", i: "bg-cyan-500/10 text-cyan-400", v: "text-cyan-300", eye: "bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600 hover:text-white" }, blue: { b: "border-blue-500/25", i: "bg-blue-500/10 text-blue-400", v: "text-blue-300", eye: "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white" }, orange: { b: "border-orange-500/25", i: "bg-orange-500/10 text-orange-400", v: "text-orange-300", eye: "bg-orange-600/20 border-orange-500/40 text-orange-300 hover:bg-orange-600 hover:text-white" }, green: { b: "border-green-500/25", i: "bg-green-500/10 text-green-400", v: "text-green-300", eye: "bg-green-600/20 border-green-500/40 text-green-300 hover:bg-green-600 hover:text-white" }, red: { b: "border-red-500/25", i: "bg-red-500/10 text-red-400", v: "text-red-300", eye: "bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white" }, violet: { b: "border-violet-500/25", i: "bg-violet-500/10 text-violet-400", v: "text-violet-300", eye: "bg-violet-600/20 border-violet-500/40 text-violet-300 hover:bg-violet-600 hover:text-white" } };
  const c = s[color];
  return (
    <div className={`relative rounded-2xl border bg-slate-900 p-5 ${c.b} ${isNegative ? "border-red-500/50" : ""} hover:border-slate-500 transition-all overflow-hidden`}>
      <div className="flex justify-between gap-2"><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{title}</p><p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[28px]">{subtitle}</p></div><span className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl ${c.i}`}>{icon}</span></div>
      <h2 className={`mt-3 text-xl font-bold ${isNegative ? "text-red-400" : c.v}`}>{value}</h2>
      {extra && <p className="text-[11px] font-black text-red-400 mt-1">⚠️ {extra}</p>}
      {onEye && (<button onClick={onEye} title={eyeTitle || `View ${title}`} className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[11px] font-black uppercase tracking-wider transition-all ${c.eye}`}><Eye size={15} /> View Details</button>)}
    </div>
  );
}