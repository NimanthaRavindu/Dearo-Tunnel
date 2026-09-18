"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, CheckCircle,IdCard } from "lucide-react";

export default function AddEmployeePage() {
  const { id: branchId } = useParams();
  const router = useRouter();
  
  const [form, setForm] = useState({ empNumber: "", name: "", nicId: "", address: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, branchId }),
      });

      if (response.ok) {
        setStatusMsg("Successful Employee!");
        setForm({ empNumber: "", name: "", nicId: "", address: "", role: "" });
      } else {
        setStatusMsg("Failed to add employee. Try again.");
      }
    } catch (error) {
      setStatusMsg("Server error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto text-white space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sky-400">
          <UserPlus className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Add New Employee</h3>
        </div>
        <button onClick={() => router.push(`/dashboard/branches/${branchId}`)} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 bg-slate-900 border border-slate-800 p-5 rounded-lg text-xs shadow-xl">
        <div>
          <label className="block text-slate-400 mb-1">Employee Number</label>
          <input type="text" required placeholder="e.g., EMP-001" value={form.empNumber} onChange={(e) => setForm({ ...form, empNumber: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-sky-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Full Name</label>
          <input type="text" required placeholder="e.g., Nimantha Ravindu" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-sky-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">NIC ID</label>
          <input type="text" required placeholder="e.g., 199512345V" value={form.nicId} onChange={(e) => setForm({ ...form, nicId: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-sky-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Role / Designation</label>
          <input type="text" required placeholder="e.g., Security Officer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-sky-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Residential Address</label>
          <textarea required placeholder="Enter address details..." rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-sky-500 resize-none" />
        </div>

        {statusMsg && (
          <div className={`p-2.5 rounded text-center border font-semibold ${statusMsg === "Successful Employee!" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            {statusMsg === "Successful Employee!" ? <span className="flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> {statusMsg}</span> : statusMsg}
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 py-2.5 rounded font-semibold transition mt-2">
          {loading ? "Registering..." : "Submit Employee"}
        </button>
      </form>
    </div>
  );
}