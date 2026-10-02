"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Droplets, Fuel, Plus, RefreshCw, Trash2, Wallet, PackagePlus, Save, CreditCard } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type DieselExpense = { id: number; branch_id: string; date: string; machine: string; diesel: number | string; amount: number | string; payable: number | string; paid: number | string; };
type CardColor = "cyan" | "blue" | "orange" | "green" | "red";
const machines = ["Komatsu","CAT","JCB","Excavator","Backhoe Loader","Wheel Loader","Landy","Other Machine"];
const inputClass = "h-12 w-full rounded-xl border border-slate-600/80 bg-slate-800/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10";
const numberValue = (v: any) => Number(v || 0);
const formatNumber = (v: any) => Number(v || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DieselExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = Array.isArray(params?.id)? params.id[0] : String(params?.id || "");
  const [expenses, setExpenses] = useState<DieselExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingInitial, setSavingInitial] = useState(false);
  const [initialDieselStock, setInitialDieselStock] = useState(0);
  const [initialTotalAmount, setInitialTotalAmount] = useState(0);
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
      const res = await fetch(`/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExpenses(data.expenses || []);
      if (data.summary) {
        const d = Number(data.summary.totalDiesel || 0);
        const a = Number(data.summary.totalAmount || 0);
        setInitialDieselStock(d);
        setInitialTotalAmount(a);
        setIsInitialSet(d > 0 || a > 0);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { if (branchId) loadExpenses(); }, [branchId]);
  const resetForm = () => { setSelectedMachine(""); setOtherMachine(""); setDate(""); setDiesel(""); setPayable(""); setPaid(""); };

  const handleAddInitial = async () => {
    const d = Number(tempInitialDiesel); const a = Number(tempInitialAmount);
    if (!d || d <= 0) return alert("Enter Initial Diesel");
    if (!Number.isFinite(a) || a < 0) return alert("Enter Initial Amount");
    const newDiesel = isInitialSet? initialDieselStock + d : d;
    const newAmount = isInitialSet? initialTotalAmount + a : a;
    try {
      setSavingInitial(true);
      const res = await fetch("/api/expences/diesel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch_id: branchId, initialDiesel: newDiesel, initialAmount: newAmount, action: "set_initial" }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setInitialDieselStock(newDiesel);
      setInitialTotalAmount(newAmount);
      setIsInitialSet(true);
      setTempInitialDiesel(""); setTempInitialAmount("");
      await loadExpenses();
    } catch (e) { alert((e as Error).message); } finally { setSavingInitial(false); }
  };

  const filteredExpenses = useMemo(() => expenses.filter(item => {
    const d = item.date?.slice(0, 10);
    return (!filterDate || d === filterDate) && (!filterMachine || item.machine === filterMachine);
  }), [expenses, filterDate, filterMachine]);

  const totalUsedDiesel = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.diesel), 0), [expenses]);
  const totalPayable = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.payable), 0), [expenses]);
  const totalPaid = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.paid), 0), [expenses]);
  const fDiesel = useMemo(() => filteredExpenses.reduce((s, i) => s + numberValue(i.diesel), 0), [filteredExpenses]);
  const fPayable = useMemo(() => filteredExpenses.reduce((s, i) => s + numberValue(i.payable), 0), [filteredExpenses]);
  const fPaid = useMemo(() => filteredExpenses.reduce((s, i) => s + numberValue(i.paid), 0), [filteredExpenses]);

  const isFiltered = Boolean(filterDate || filterMachine);
  const activeDieselUsed = isFiltered? fDiesel : totalUsedDiesel;
  const activePayable = isFiltered? fPayable : totalPayable;
  const activePaid = isFiltered? fPaid : totalPaid;

  // === FINAL LOGIC - FORM SAVE KALAMA EKATHU WENNE NA, MINUS NA ===
  const displayTotalDiesel = initialDieselStock;
  // Diesel Used = Initial witharak - Form save kalama wadi wenne na
  const displayTotalDieselUsed = isInitialSet? initialDieselStock : 0;
  // Total Amount = Initial Amount witharak - Form save kalama wadi wenne na
  const totalAmountDisplay = isInitialSet? initialTotalAmount : 0;
  // Remaining Diesel = Initial - Used - adu wenawa, minus na 0 ta clamp
  const displayRemainingDiesel = Math.max(0, initialDieselStock - activeDieselUsed);
  const balanceDisplay = Math.max(0, activePayable - activePaid);
  const liveRemainingPreview = Math.max(0, initialDieselStock - activeDieselUsed - numberValue(diesel));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isInitialSet) return alert("Set Initial Stock first");
    if (!selectedMachine) return alert("Select machine");
    if (!date) return alert("Select date");
    const d = Number(diesel); const p = Number(payable); const pd = Number(paid);
    if (d <= 0) return alert("Valid diesel"); if (pd > p) return alert("Paid > Payable");
    const m = selectedMachine === "Other Machine"? otherMachine.trim() : selectedMachine;
    if (!m) return alert("Enter other machine");
    try {
      setSaving(true);
      const res = await fetch("/api/expences/diesel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch_id: branchId, date, machine: m, diesel: d, payable: p, paid: pd }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      resetForm(); await loadExpenses();
    } catch (err) { alert((err as Error).message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/expences/diesel?id=${id}`, { method: "DELETE" });
    if (res.ok) await loadExpenses();
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold"><ArrowLeft size={16}/> Back</button>
        <header className="flex justify-between rounded-3xl border border-slate-700/80 bg-slate-900 p-5">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400"><Fuel size={29}/></div><div><h1 className="text-2xl font-bold">Diesel Expenses</h1><p className="text-sm text-slate-400">Initial Add = Cards wadi | Form Save = Cards wadi wenne na</p></div></div>
          <button onClick={loadExpenses} className="h-11 inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 text-sm font-bold"><RefreshCw size={17} className={loading? "animate-spin" : ""}/>Refresh</button>
        </header>
        <section className="rounded-3xl border border-cyan-500/30 bg-slate-900 p-5">
          <h2 className="text-sm font-bold uppercase mb-4 flex items-center gap-2"><PackagePlus size={18} className="text-cyan-400"/>Initial Stock - Add kalama Diesel Used + Total Amount wadi wenawa</h2>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Initial Diesel (L)"><input type="number" value={tempInitialDiesel} onChange={e => setTempInitialDiesel(e.target.value)} placeholder="331" className={inputClass}/></Field>
            <Field label="Initial Amount (Rs.)"><input type="number" value={tempInitialAmount} onChange={e => setTempInitialAmount(e.target.value)} placeholder="317000" className={inputClass}/></Field>
            <button onClick={handleAddInitial} disabled={savingInitial} className="h-12 self-end inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 font-bold">{savingInitial? <RefreshCw size={17} className="animate-spin"/> : <Save size={17}/>}Add</button>
          </div>
          {isInitialSet && <p className="mt-3 text-xs text-green-400">✓ Initial: {initialDieselStock} L / Rs. {initialTotalAmount.toLocaleString()} - Form save kalama Diesel Used / Total Amount ekathu wenne na</p>}
        </section>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard title="Diesel Used" subtitle="Initial only - Save kala wadi wenne na" value={`${formatNumber(displayTotalDieselUsed)} L`} icon={<Droplets size={22}/>} color="cyan"/>
          <SummaryCard title="Total Amount" subtitle="Initial only - Save kala wadi wenne na" value={`Rs. ${formatNumber(totalAmountDisplay)}`} icon={<Wallet size={22}/>} color="blue"/>
          <SummaryCard title="Remaining Diesel" subtitle="Initial - Used (minus na)" value={`${formatNumber(liveRemainingPreview!== displayRemainingDiesel && Number(diesel) > 0? liveRemainingPreview : displayRemainingDiesel)} L`} icon={<Droplets size={22}/>} color="orange"/>
          <SummaryCard title="Remaining Balance" subtitle="Payable - Paid" value={`Rs. ${formatNumber(balanceDisplay)}`} icon={<CreditCard size={22}/>} color="green"/>
          <SummaryCard title="Total Diesel" subtitle="Initial stock" value={`${formatNumber(displayTotalDiesel)} L`} icon={<AlertCircle size={22}/>} color="red"/>
        </section>
        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-700/80 bg-slate-800/30 px-6 py-5"><h2 className="text-xl font-bold">Add Diesel Expense</h2><p className="text-xs text-slate-400 mt-1">Save kalama Diesel Used / Total Amount wadi wenne na - Remaining witharak adu wenawa</p></div>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Machine"><select value={selectedMachine} onChange={e => { setSelectedMachine(e.target.value); if (e.target.value!== "Other Machine") setOtherMachine(""); }} className={inputClass}><option value="">Select Machine</option>{machines.map(m => <option key={m} value={m}>{m}</option>)}</select>{selectedMachine === "Other Machine" && <input value={otherMachine} onChange={e => setOtherMachine(e.target.value)} placeholder="Other machine name" className={`${inputClass} mt-3`}/>}</Field>
              <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass}/></Field>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Diesel Quantity (L)"><input type="number" min="0" step="0.01" value={diesel} onChange={e => setDiesel(e.target.value)} placeholder="0.00" className={inputClass}/></Field>
              <Field label="Payable Amount (Rs.)"><input type="number" value={payable} onChange={e => setPayable(e.target.value)} placeholder="0.00" className={inputClass}/></Field>
              <Field label="Paid Amount (Rs.)"><input type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0.00" className={inputClass}/></Field>
            </div>
            <div className="flex justify-end border-t border-slate-700/80 pt-6">
              <button type="submit" disabled={saving ||!isInitialSet} className="h-12 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-7 font-bold disabled:opacity-40">{saving? <RefreshCw size={18} className="animate-spin"/> : <Plus size={18}/>}Save Expense</button>
            </div>
          </form>
        </section>
        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 overflow-hidden">
          <div className="flex justify-between p-5 border-b border-slate-700/80"><h2 className="font-bold">Records</h2><span className="text-sm bg-slate-800 px-3 py-1 rounded-xl">{filteredExpenses.length} Records</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="bg-slate-800/80"><tr className="text-xs text-slate-400 uppercase"><th className="px-5 py-4 text-left">Date</th><th className="px-5 py-4 text-left">Machine</th><th className="px-5 py-4 text-right">Diesel</th><th className="px-5 py-4 text-right">Payable</th><th className="px-5 py-4 text-right">Paid</th><th className="px-5 py-4 text-right">Balance</th><th className="px-5 py-4 text-center">Action</th></tr></thead><tbody>{filteredExpenses.map(item => { const p = numberValue(item.payable); const pd = numberValue(item.paid); return <tr key={item.id} className="border-b border-slate-800"><td className="px-5 py-4 text-sm">{item.date?.slice(0, 10)}</td><td className="px-5 py-4 font-semibold">{item.machine}</td><td className="px-5 py-4 text-right">{formatNumber(item.diesel)}</td><td className="px-5 py-4 text-right font-bold text-blue-400">Rs. {formatNumber(p)}</td><td className="px-5 py-4 text-right font-bold text-green-400">Rs. {formatNumber(pd)}</td><td className="px-5 py-4 text-right font-bold text-red-400">Rs. {formatNumber(Math.max(0, p - pd))}</td><td className="px-5 py-4 text-center"><button onClick={() => handleDelete(item.id)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-red-500/10 text-red-400"><Trash2 size={16}/></button></td></tr> })}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}
function SummaryCard({ title, subtitle, value, icon, color }: { title: string; subtitle: string; value: string; icon: React.ReactNode; color: CardColor; }) {
  const s: any = { cyan: { b: "border-cyan-500/25", i: "bg-cyan-500/10 text-cyan-400", v: "text-cyan-300" }, blue: { b: "border-blue-500/25", i: "bg-blue-500/10 text-blue-400", v: "text-blue-300" }, orange: { b: "border-orange-500/25", i: "bg-orange-500/10 text-orange-400", v: "text-orange-300" }, green: { b: "border-green-500/25", i: "bg-green-500/10 text-green-400", v: "text-green-300" }, red: { b: "border-red-500/25", i: "bg-red-500/10 text-red-400", v: "text-red-300" } };
  const c = s[color]; return (<div className={`rounded-2xl border bg-slate-900 p-5 ${c.b}`}><div className="flex justify-between"><div><p className="text-sm font-bold">{title}</p><p className="text-xs text-slate-500 mt-1">{subtitle}</p><h2 className={`mt-4 text-xl font-bold ${c.v}`}>{value}</h2></div><span className={`h-10 w-10 flex items-center justify-center rounded-xl ${c.i}`}>{icon}</span></div></div>);
}
function Field({ label, children }: { label: string; children: React.ReactNode; }) { return (<label className="block"><span className="mb-2 block text-xs font-bold uppercase text-slate-400">{label}</span>{children}</label>); }