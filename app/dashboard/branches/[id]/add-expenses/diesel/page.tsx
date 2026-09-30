"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CalendarDays, CreditCard, Droplets, Fuel, Plus, RefreshCw, Trash2, Truck, Wallet, PackagePlus, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type DieselExpense = { id: number; branch_id: string; date: string; machine: string; diesel: number | string; amount: number | string; payable: number | string; paid: number | string; };
type CardColor = "cyan" | "blue" | "orange" | "green" | "red";
const machines = ["Komatsu","CAT","JCB","Excavator","Backhoe Loader","Wheel Loader","Landy","Other Machine"];
const inputClass = "h-12 w-full rounded-xl border border-slate-600/80 bg-slate-800/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10";
const numberValue = (value: number | string | undefined) => Number(value || 0);
const formatNumber = (value: number | string) => Number(value || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DieselExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = Array.isArray(params?.id)? params.id[0] : String(params?.id || "");
  const [expenses, setExpenses] = useState<DieselExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingInitial, setSavingInitial] = useState(false);
  const [initialDieselStock, setInitialDieselStock] = useState<number>(0);
  const [initialTotalAmount, setInitialTotalAmount] = useState<number>(0);
  const [tempInitialDiesel, setTempInitialDiesel] = useState("");
  const [tempInitialAmount, setTempInitialAmount] = useState("");
  const [isInitialSet, setIsInitialSet] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [otherMachine, setOtherMachine] = useState("");
  const [date, setDate] = useState("");
  const [diesel, setDiesel] = useState("");
  const [payable, setPayable] = useState("");
  const [paid, setPaid] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMachine, setFilterMachine] = useState("");

  const loadExpenses = async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}`, { method: "GET", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load");
      setExpenses(Array.isArray(data.expenses)? data.expenses : []);
      if (data.summary) {
        const totalDiesel = Number(data.summary.totalDiesel || data.summary.initialDieselStock || 0);
        const totalAmount = Number(data.summary.totalAmount || data.summary.initialTotalAmount || 0);
        setInitialDieselStock(totalDiesel);
        setInitialTotalAmount(totalAmount);
        setIsInitialSet(totalDiesel > 0);
      }
    } catch (error) { console.error("LOAD ERROR:", error); } finally { setLoading(false); }
  };

  useEffect(() => { if (branchId) loadExpenses(); }, [branchId]);
  const resetForm = () => { setSelectedMachine(""); setOtherMachine(""); setDate(""); setDiesel(""); setPayable(""); setPaid(""); };

  const handleAddInitial = async () => {
    const d = Number(tempInitialDiesel); const a = Number(tempInitialAmount);
    if (!d || d <= 0) return alert("Please enter valid Initial Diesel");
    if (!branchId) return alert("Branch ID missing");
    try {
      setSavingInitial(true);
      const res = await fetch("/api/expences/diesel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch_id: branchId, initialDiesel: d, initialAmount: a, action: "set_initial" }), });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setInitialDieselStock(d); setInitialTotalAmount(a); setIsInitialSet(true); setTempInitialDiesel(""); setTempInitialAmount(""); await loadExpenses();
    } catch (e) { alert(e instanceof Error? e.message : "Failed"); } finally { setSavingInitial(false); }
  };

  const formPayable = numberValue(payable); const formPaid = numberValue(paid); const formDieselQty = numberValue(diesel); const formBalance = Math.max(0, formPayable - formPaid);

  const filteredExpenses = useMemo(() => expenses.filter((item) => {
    const itemDate = item.date?.slice(0, 10);
    return (!filterDate || itemDate === filterDate) && (!filterMachine || item.machine === filterMachine);
  }), [expenses, filterDate, filterMachine]);

  const totalUsedDieselFromList = useMemo(() => expenses.reduce((sum, item) => sum + numberValue(item.diesel), 0), [expenses]);
  const totalPayableFromList = useMemo(() => expenses.reduce((sum, item) => sum + numberValue(item.payable), 0), [expenses]);
  const totalPaidFromList = useMemo(() => expenses.reduce((sum, item) => sum + numberValue(item.paid), 0), [expenses]);
  const filteredDieselTotal = useMemo(() => filteredExpenses.reduce((sum, item) => sum + numberValue(item.diesel), 0), [filteredExpenses]);
  const filteredPayableTotal = useMemo(() => filteredExpenses.reduce((sum, item) => sum + numberValue(item.payable), 0), [filteredExpenses]);
  const filteredPaidTotal = useMemo(() => filteredExpenses.reduce((sum, item) => sum + numberValue(item.paid), 0), [filteredExpenses]);

  const isFiltered = Boolean(filterDate || filterMachine);
  const activeDieselUsed = isFiltered? filteredDieselTotal : totalUsedDieselFromList;
  const activePayable = isFiltered? filteredPayableTotal : totalPayableFromList;
  const activePaid = isFiltered? filteredPaidTotal : totalPaidFromList;
  const activeBalance = Math.max(0, activePayable - activePaid);

  // === CARDS LOGIC - OYA ILLAPU WIDIYATA ===
  // Diesel Used = ithuru stock - form qty = 0 vitharai
  const baseRemainingDiesel = isInitialSet? initialDieselStock - activeDieselUsed : 0;
  const baseRemainingAmountStock = isInitialSet? initialTotalAmount - activePayable : 0; // stock eken adu wena eka

  const dieselUsedDisplay = isInitialSet? Math.max(0, baseRemainingDiesel - formDieselQty) : 0; // Remaining Diesel card eke pennanne
  const displayRemainingDiesel = dieselUsedDisplay;

  // Total Amount = Payable ekathuwa + form eke payable (oya illapu eka)
  const totalAmountDisplay = activePayable + formPayable;
  // Balance = Payable - Paid + form eke (payable - paid)
  const balanceDisplay = Math.max(0, (activePayable - activePaid) + (formPayable - formPaid));

  // Total Diesel = Initial stock (nathnam 0)
  const displayTotalDiesel = isInitialSet? initialDieselStock : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isInitialSet) return alert("Please set Initial Stock first");
    if (!branchId) return alert("Branch ID is missing.");
    if (!selectedMachine) return alert("Please select a machine.");
    if (selectedMachine === "Other Machine" &&!otherMachine.trim()) return alert("Please enter machine name.");
    if (!date) return alert("Please select a date.");
    const dieselValue = Number(diesel); const payableValue = Number(payable); const paidValue = Number(paid);
    if (!Number.isFinite(dieselValue) || dieselValue <= 0) return alert("Valid diesel quantity");
    if (paidValue > payableValue) return alert("Paid cannot be greater than payable");
    const machineName = selectedMachine === "Other Machine"? otherMachine.trim() : selectedMachine;
    try {
      setSaving(true);
      const response = await fetch("/api/expences/diesel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch_id: branchId, date, machine: machineName, diesel: dieselValue, payable: payableValue, paid: paidValue }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save");
      resetForm(); await loadExpenses();
    } catch (error) { alert(error instanceof Error? error.message : "Failed to save"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete?")) return;
    try {
      const response = await fetch(`/api/expences/diesel?id=${encodeURIComponent(String(id))}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed");
      await loadExpenses();
    } catch (error) { alert(error instanceof Error? error.message : "Failed to delete"); }
  };

  const machineOptions = Array.from(new Set(expenses.map((item) => item.machine)));

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white">
          <ArrowLeft size={16} /> Back to Expenses
        </button>

        <header className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-700/80 bg-slate-900 p-5 shadow-2xl md:flex-row md:items-center md:p-6">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-400/20"><Fuel size={29} /></div><div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-400">Expense Management</p><h1 className="text-2xl font-bold md:text-3xl">Diesel Expenses</h1><p className="mt-1 text-sm text-slate-400">Manage machine-wise diesel usage and payments</p></div></div>
          <button type="button" onClick={loadExpenses} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 text-sm font-bold transition hover:bg-slate-700 disabled:opacity-60"><RefreshCw size={17} className={loading? "animate-spin" : ""} />{loading? "Refreshing..." : "Refresh"}</button>
        </header>

        <section className="rounded-3xl border border-cyan-500/30 bg-slate-900 p-5 shadow-xl">
          <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400"><PackagePlus size={20} /></div><div><h2 className="text-sm font-bold uppercase tracking-wide">Initial Diesel Stock</h2><p className="mt-1 text-xs text-slate-500">{isInitialSet? `Current: ${initialDieselStock} L / Rs. ${initialTotalAmount.toLocaleString()}` : "Set initial stock - cards 0 wenakan thiyenawa"}</p></div></div>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Initial Diesel (L)"><div className="relative"><Droplets size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" /><input type="number" min="0" step="0.01" value={tempInitialDiesel} onChange={(e) => setTempInitialDiesel(e.target.value)} placeholder="331.00" className={`${inputClass} pl-11`} /></div></Field>
            <Field label="Initial Amount (Rs.)"><input type="number" min="0" step="0.01" value={tempInitialAmount} onChange={(e) => setTempInitialAmount(e.target.value)} placeholder="317000.00" className={inputClass} /></Field>
            <button type="button" onClick={handleAddInitial} disabled={savingInitial} className="h-12 self-end inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 text-sm font-bold transition hover:bg-cyan-500 disabled:opacity-50">{savingInitial? <RefreshCw size={17} className="animate-spin"/> : <Save size={17} />}Add</button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold uppercase tracking-wide">Filter Records</h2><p className="mt-1 text-xs text-slate-500">View records by date and machine</p></div>{isFiltered && <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">Filter active</span>}</div>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Filter Date"><div className="relative"><CalendarDays size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" /><input type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} className={`${inputClass} pl-11`} /></div></Field>
            <Field label="Filter Machine"><div className="relative"><Truck size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" /><select value={filterMachine} onChange={(event) => setFilterMachine(event.target.value)} className={`${inputClass} cursor-pointer appearance-none pl-11`}><option value="">All Machines</option>{machineOptions.map((machine) => (<option key={machine} value={machine}>{machine}</option>))}</select></div></Field>
            <button type="button" onClick={() => { setFilterDate(""); setFilterMachine(""); }} className="h-12 self-end rounded-xl border border-slate-600 bg-slate-800 px-5 text-sm font-bold transition hover:bg-slate-700">Clear Filters</button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard title="Diesel Used" subtitle="Ithuru - Form = 0 vitharai" value={`${formatNumber(displayRemainingDiesel)} L`} icon={<Droplets size={22} />} color="cyan" />
          <SummaryCard title="Total Amount" subtitle="Payable total - form add wenawa" value={`Rs. ${formatNumber(totalAmountDisplay)}`} icon={<Wallet size={22} />} color="blue" />
          <SummaryCard title="Remaining Diesel" subtitle="Initial - Used" value={`${formatNumber(displayRemainingDiesel)} L`} icon={<Droplets size={22} />} color="orange" />
          <SummaryCard title="Remaining Balance" subtitle="Payable - Paid = Balance" value={`Rs. ${formatNumber(balanceDisplay)}`} icon={<CreditCard size={22} />} color="green" />
          <SummaryCard title="Total Diesel" subtitle={isInitialSet? "Initial stock" : "Not set - 0"} value={`${formatNumber(displayTotalDiesel)} L`} icon={<AlertCircle size={22} />} color="red" />
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-700/80 bg-slate-800/30 px-6 py-5"><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20"><Plus size={22} /></div><div><h2 className="text-xl font-bold">Add Diesel Expense</h2><p className="mt-1 text-sm text-slate-400">Enter machine usage and payment information</p></div></div></div>
          <form onSubmit={handleSubmit} className="space-y-7 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Machine"><div className="relative"><Truck size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" /><select value={selectedMachine} onChange={(event) => { setSelectedMachine(event.target.value); if (event.target.value!== "Other Machine") { setOtherMachine(""); } }} className={`${inputClass} cursor-pointer appearance-none pl-11`}><option value="">Select Machine</option>{machines.map((machine) => (<option key={machine} value={machine}>{machine}</option>))}</select></div></Field>
              <Field label="Date"><div className="relative"><CalendarDays size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={`${inputClass} pl-11`} /></div></Field>
            </div>
            {selectedMachine === "Other Machine" && (<Field label="Machine Name"><input type="text" value={otherMachine} onChange={(event) => setOtherMachine(event.target.value)} placeholder="Enter machine name" className={inputClass} /></Field>)}
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Diesel Quantity (L)"><div className="relative"><Droplets size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" /><input type="number" min="0" step="0.01" value={diesel} onChange={(event) => setDiesel(event.target.value)} placeholder="0.00" className={`${inputClass} pl-11`} /></div></Field>
              <Field label="Payable Amount (Rs.) - Total Amount vidiyata"><input type="number" min="0" step="0.01" value={payable} onChange={(event) => setPayable(event.target.value)} placeholder="0.00" className={`${inputClass} ring-2 ring-blue-500/20`} /></Field>
              <Field label="Paid Amount (Rs.)"><input type="number" min="0" step="0.01" value={paid} onChange={(event) => setPaid(event.target.value)} placeholder="0.00" className={`${inputClass} ring-2 ring-green-500/20`} /></Field>
            </div>
            {(formPayable > 0 || formPaid > 0) && (
              <div className="flex gap-3 rounded-xl bg-slate-800/60 p-3 text-xs">
                <span className="text-slate-400">Live Preview:</span>
                <span className="font-bold text-blue-300">Total = Rs. {formatNumber(totalAmountDisplay)}</span>
                <span className="text-slate-600">|</span>
                <span className="font-bold text-green-300">Balance (Payable-Paid) = Rs. {formatNumber(formBalance)} / Total Balance Rs. {formatNumber(balanceDisplay)}</span>
              </div>
            )}
            <div className="flex justify-end border-t border-slate-700/80 pt-6"><button type="submit" disabled={saving ||!isInitialSet} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-7 text-sm font-bold transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40">{saving? (<RefreshCw size={18} className="animate-spin" />) : (<Plus size={18} />)}{saving? "Saving..." : "Save Diesel Expense"}</button></div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-700/80 p-5 md:flex-row md:items-center md:p-6"><div><h2 className="text-xl font-bold">Diesel Expense Records</h2><p className="mt-1 text-sm text-slate-400">Payable = Total, Balance = Payable - Paid</p></div><div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-300">{filteredExpenses.length} Records</div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1050px]"><thead className="bg-slate-800/80"><tr className="border-b border-slate-700 text-left"><TableHeader>Date</TableHeader><TableHeader>Machine</TableHeader><TableHeader align="right">Diesel (L)</TableHeader><TableHeader align="right">Payable (Total)</TableHeader><TableHeader align="right">Paid</TableHeader><TableHeader align="right">Balance (Pay-Paid)</TableHeader><TableHeader align="center">Action</TableHeader></tr></thead><tbody>{loading? (<tr><td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-400"><RefreshCw size={18} className="mx-auto animate-spin text-cyan-400" /></td></tr>) : filteredExpenses.length === 0? (<tr><td colSpan={7} className="px-5 py-14 text-center"><Fuel size={30} className="mx-auto mb-3 text-slate-600" /><p className="font-semibold text-slate-300">No diesel expenses found</p></td></tr>) : (filteredExpenses.map((item) => { const itemPayable = numberValue(item.payable); const itemPaid = numberValue(item.paid); const itemBalance = Math.max(0, itemPayable - itemPaid); return (<tr key={item.id} className="border-b border-slate-800 transition hover:bg-slate-800/50"><td className="px-5 py-4 text-sm text-slate-300">{item.date? new Date(`${item.date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB") : "-"}</td><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400"><Truck size={15} /></span><span className="font-semibold text-slate-200">{item.machine}</span></div></td><td className="px-5 py-4 text-right text-sm font-semibold text-slate-300">{formatNumber(item.diesel)}</td><td className="px-5 py-4 text-right text-sm font-bold text-blue-400">Rs. {formatNumber(itemPayable)}</td><td className="px-5 py-4 text-right text-sm font-bold text-green-400">Rs. {formatNumber(itemPaid)}</td><td className="px-5 py-4 text-right text-sm font-bold text-red-400">Rs. {formatNumber(itemBalance)}</td><td className="px-5 py-4 text-center"><button type="button" onClick={() => handleDelete(item.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"><Trash2 size={16} /></button></td></tr>); }))}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}
function SummaryCard({ title, subtitle, value, icon, color }: { title: string; subtitle: string; value: string; icon: React.ReactNode; color: CardColor; }) {
  const styles: Record<CardColor, { border: string; icon: string; value: string }> = { cyan: { border: "border-cyan-500/25 hover:border-cyan-400/50", icon: "bg-cyan-500/10 text-cyan-400", value: "text-cyan-300" }, blue: { border: "border-blue-500/25 hover:border-blue-400/50", icon: "bg-blue-500/10 text-blue-400", value: "text-blue-300" }, orange: { border: "border-orange-500/25 hover:border-orange-400/50", icon: "bg-orange-500/10 text-orange-400", value: "text-orange-300" }, green: { border: "border-green-500/25 hover:border-green-400/50", icon: "bg-green-500/10 text-green-400", value: "text-green-300" }, red: { border: "border-red-500/25 hover:border-red-400/50", icon: "bg-red-500/10 text-red-400", value: "text-red-300" } };
  const selected = styles[color];
  return (<div className={`rounded-2xl border bg-slate-900 p-5 shadow-xl transition ${selected.border}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-300">{title}</p><p className="mt-1 truncate text-xs text-slate-500">{subtitle}</p><h2 className={`mt-4 break-words text-xl font-bold ${selected.value}`}>{value}</h2></div><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected.icon}`}>{icon}</span></div></div>);
}
function Field({ label, children }: { label: string; children: React.ReactNode; }) { return (<label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>{children}</label>); }
function TableHeader({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center"; }) { const alignment = { left: "text-left", right: "text-right", center: "text-center" }; return (<th className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 ${alignment[align]}`}>{children}</th>); }