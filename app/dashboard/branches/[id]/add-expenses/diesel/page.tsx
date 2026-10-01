"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CreditCard, Droplets, Fuel, Plus, RefreshCw, Trash2, Wallet, PackagePlus, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type DieselExpense = { id: number; branch_id: string; date: string; machine: string; diesel: any; payable: any; paid: any; };
type CardColor = "cyan" | "blue" | "orange" | "green" | "red";
const machines = ["Komatsu","CAT","JCB","Excavator","Backhoe Loader","Wheel Loader","Landy","Other Machine"];
const inputClass = "h-12 w-full rounded-xl border border-slate-600/80 bg-slate-800/80 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10";
const numberValue = (v: any) => Number(v || 0);
const formatNumber = (v: any) => Number(v || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DieselExpensesPage() {
  const params = useParams(); const router = useRouter();
  const branchId = Array.isArray(params?.id)? params.id[0] : String(params?.id || "");
  const [expenses, setExpenses] = useState<DieselExpense[]>([]);
  const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false); const [savingInitial, setSavingInitial] = useState(false);
  const [initialDieselStock, setInitialDieselStock] = useState(0); const [initialTotalAmount, setInitialTotalAmount] = useState(0);
  const [tempInitialDiesel, setTempInitialDiesel] = useState(""); const [tempInitialAmount, setTempInitialAmount] = useState("");
  const [isInitialSet, setIsInitialSet] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(""); const [date, setDate] = useState(""); const [diesel, setDiesel] = useState(""); const [payable, setPayable] = useState(""); const [paid, setPaid] = useState("");

  const loadExpenses = async () => {
    if (!branchId) return;
    try { setLoading(true);
      const res = await fetch(`/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}`, { cache: "no-store" });
      const data = await res.json();
      setExpenses(data.expenses || []);
      const totalD = Number(data.summary?.totalDiesel || data.summary?.initialDieselStock || 0);
      const totalA = Number(data.summary?.totalAmount || data.summary?.initialTotalAmount || 0);
      setInitialDieselStock(totalD); setInitialTotalAmount(totalA); setIsInitialSet(totalD > 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { if (branchId) loadExpenses(); }, [branchId]);

  const handleAddInitial = async () => {
    const d = Number(tempInitialDiesel); const a = Number(tempInitialAmount);
    if (!d || d <= 0) return alert("Initial Diesel danna");
    try { setSavingInitial(true);
      const res = await fetch("/api/expences/diesel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch_id: branchId, initialDiesel: d, initialAmount: a, action: "set_initial" }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      // Click kalama witharak cards walata ekathu wenawa
      setInitialDieselStock(d); setInitialTotalAmount(a); setIsInitialSet(true);
      setTempInitialDiesel(""); setTempInitialAmount("");
      await loadExpenses();
    } catch (e) { alert((e as Error).message); } finally { setSavingInitial(false); }
  };

  const totalUsedDiesel = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.diesel), 0), [expenses]);
  const totalPayable = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.payable), 0), [expenses]);
  const totalPaid = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.paid), 0), [expenses]);

  // === FINAL FIX - OYA ILLAPU WIDIYATA ===
  // Initial Diesel -> Diesel Used card ekata ekathu wenawa (0 newei, 331 penawa)
  // Initial Amount -> Total Amount card ekata ekathu wenawa (0 newei, 317000 penawa)
  const totalDieselCard = isInitialSet? initialDieselStock : 0;
  const dieselUsedCard = isInitialSet? initialDieselStock : 0; // <-- FIX: 0 newei, initial agaya
  const totalAmountCard = isInitialSet? initialTotalAmount : 0; // <-- FIX: 0 newei, initial agaya
  const remainingDieselCard = isInitialSet? Math.max(0, initialDieselStock - totalUsedDiesel) : 0; // Submit kalama adu wenawa
  const remainingBalanceCard = Math.max(0, totalPayable - totalPaid); // Payable - Paid
  const formBalance = Math.max(0, numberValue(payable) - numberValue(paid));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isInitialSet) return alert("Initial Stock set karanna");
    const d = Number(diesel); const p = Number(payable); const pd = Number(paid);
    if (d <= 0) return alert("Diesel quantity danna");
    try { setSaving(true);
      const res = await fetch("/api/expences/diesel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch_id: branchId, date, machine: selectedMachine, diesel: d, payable: p, paid: pd }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setDiesel(""); setPayable(""); setPaid(""); await loadExpenses();
    } catch (err) { alert((err as Error).message); } finally { setSaving(false); }
  };
  const handleDelete = async (id: number) => { if (!confirm("Delete?")) return; const res = await fetch(`/api/expences/diesel?id=${id}`, { method: "DELETE" }); if (res.ok) await loadExpenses(); };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex justify-between rounded-3xl border border-slate-700/80 bg-slate-900 p-5">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400"><Fuel size={29}/></div><div><h1 className="text-2xl font-bold">Diesel Expenses</h1><p className="text-sm text-slate-400">Initial Add = Cards add</p></div></div>
          <button onClick={loadExpenses} className="h-11 inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 text-sm font-bold"><RefreshCw size={17} className={loading? "animate-spin" : ""}/>Refresh</button>
        </header>

        <section className="rounded-3xl border border-cyan-500/30 bg-slate-900 p-5">
          <h2 className="text-sm font-bold uppercase mb-4 flex items-center gap-2"><PackagePlus size={18} className="text-cyan-400"/>Initial Stock - Add kalama cards walata add wenawa</h2>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase text-slate-400">Initial Diesel (L)</span><input type="number" value={tempInitialDiesel} onChange={e => setTempInitialDiesel(e.target.value)} placeholder="331" className={inputClass}/></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase text-slate-400">Initial Amount (Rs.)</span><input type="number" value={tempInitialAmount} onChange={e => setTempInitialAmount(e.target.value)} placeholder="317000" className={inputClass}/></label>
            <button onClick={handleAddInitial} disabled={savingInitial} className="h-12 self-end inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 font-bold">{savingInitial? <RefreshCw size={17} className="animate-spin"/> : <Save size={17}/>}Add</button>
          </div>
          {isInitialSet && <p className="mt-3 text-xs text-green-400">✓ Initial {initialDieselStock} L / Rs.{initialTotalAmount.toLocaleString()} cards walata add wela</p>}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard title="Diesel Used" subtitle="Initial Diesel add wela" value={`${formatNumber(dieselUsedCard)} L`} icon={<Droplets size={22}/>} color="cyan"/>
          <SummaryCard title="Total Amount" subtitle="Initial Amount add wela" value={`Rs. ${formatNumber(totalAmountCard)}`} icon={<Wallet size={22}/>} color="blue"/>
          <SummaryCard title="Remaining Diesel" subtitle="Initial - Used (adu wenawa)" value={`${formatNumber(remainingDieselCard)} L`} icon={<Droplets size={22}/>} color="orange"/>
          <SummaryCard title="Remaining Balance" subtitle="Payable - Paid" value={`Rs. ${formatNumber(remainingBalanceCard)}`} icon={<CreditCard size={22}/>} color="green"/>
          <SummaryCard title="Total Diesel" subtitle="Initial stock" value={`${formatNumber(totalDieselCard)} L`} icon={<AlertCircle size={22}/>} color="red"/>
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-700/80 bg-slate-800/30 px-6 py-5"><h2 className="text-xl font-bold">Add Diesel Expense - Balance = Payable - Paid</h2></div>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase text-slate-400">Machine</span><select value={selectedMachine} onChange={e => setSelectedMachine(e.target.value)} className={inputClass}><option value="">Select Machine</option>{machines.map(m => <option key={m} value={m}>{m}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase text-slate-400">Date</span><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass}/></label>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase text-slate-400">Diesel Quantity (L)</span><input type="number" value={diesel} onChange={e => setDiesel(e.target.value)} placeholder="0.00" className={inputClass}/></label>
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase text-slate-400">Payable Amount (Rs.)</span><input type="number" value={payable} onChange={e => setPayable(e.target.value)} placeholder="0.00" className={inputClass}/></label>
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase text-slate-400">Paid Amount (Rs.)</span><input type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0.00" className={inputClass}/></label>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4"><p className="text-[10px] font-bold uppercase text-green-400">Form Balance = Payable - Paid</p><h3 className="text-xl font-bold text-green-300 mt-1">Rs. {formatNumber(formBalance)}</h3></div>
            <div className="flex justify-end border-t border-slate-700/80 pt-6"><button type="submit" disabled={saving ||!isInitialSet} className="h-12 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-7 font-bold disabled:opacity-40">{saving? <RefreshCw size={18} className="animate-spin"/> : <Plus size={18}/>}Save Expense</button></div>
          </form>
        </section>
      </div>
    </main>
  );
}
function SummaryCard({ title, subtitle, value, icon, color }: { title: string; subtitle: string; value: string; icon: React.ReactNode; color: CardColor; }) {
  const s: any = { cyan: { b: "border-cyan-500/25", i: "bg-cyan-500/10 text-cyan-400", v: "text-cyan-300" }, blue: { b: "border-blue-500/25", i: "bg-blue-500/10 text-blue-400", v: "text-blue-300" }, orange: { b: "border-orange-500/25", i: "bg-orange-500/10 text-orange-400", v: "text-orange-300" }, green: { b: "border-green-500/25", i: "bg-green-500/10 text-green-400", v: "text-green-300" }, red: { b: "border-red-500/25", i: "bg-red-500/10 text-red-400", v: "text-red-300" } };
  const c = s[color]; return (<div className={`rounded-2xl border bg-slate-900 p-5 ${c.b}`}><div className="flex justify-between"><div><p className="text-sm font-bold">{title}</p><p className="text-xs text-slate-500 mt-1">{subtitle}</p><h2 className={`mt-4 text-xl font-bold ${c.v}`}>{value}</h2></div><span className={`h-10 w-10 flex items-center justify-center rounded-xl ${c.i}`}>{icon}</span></div></div>);
}