"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import { ArrowLeft,Search,Users,ShieldCheck,CreditCard,MapPin,RefreshCw,Database,Hash,Pencil,Trash2,Save,X,AlertTriangle,Loader2,CheckCircle2} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ViewEmployeePage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  // System States
  const [employees, setEmployees] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ EDIT / DELETE States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    nicId: "",
    role: "",
    address: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // Fetch Personnel Records Function
  const fetchPersonnelData = async () => {
    if (!id || id === "[id]") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/employees?branchId=${id}`);
      if (!res.ok) {
        throw new Error("CORE_DATA_SYNC_FAILURE: Unable to map personnel ledger matrix.");
      }
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Data integrity failure:", err);
      setError(err.message);
      setEmployees([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPersonnelData();
  }, [id]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchPersonnelData();
  };

  // ✅ EDIT 
  const handleEditRow = (emp: any) => {
    setEditingId(String(emp.id));
    setEditData({
      name: emp.name || "",
      nicId: emp.nicId || "",
      role: emp.role || "",
      address: emp.address || "",
    });
    setActionError("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ name: "", nicId: "", role: "", address: "" });
  };

  // ✅ SAVE 
  const handleSaveRow = async () => {
    if (!editingId) return;
    if (!editData.name.trim()) {
      setActionError("Name eka danna ona!");
      return;
    }
    try {
      setIsSaving(true);
      setActionError("");
      const res = await fetch(`/api/employees?id=${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          branchId: id,
          name: editData.name.trim(),
          nicId: editData.nicId.trim(),
          role: editData.role.trim(),
          address: editData.address.trim(),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || result.error || "Update karanna ba!");
      
      setEditingId(null);
      setSuccessMessage(`Updated: ${editData.name} ✅`);
      setTimeout(() => setSuccessMessage(""), 3000);
      await fetchPersonnelData();
    } catch (err: any) {
      setActionError(err.message || "Update karanna ba!");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ DELETE 
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      setActionError("");
      const res = await fetch(`/api/employees?id=${encodeURIComponent(deleteId)}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || result.error || "Delete karanna ba!");
      
      if (editingId === deleteId) handleCancelEdit();
      setDeleteId(null);
      setSuccessMessage("Entry deleted successfully ✅");
      setTimeout(() => setSuccessMessage(""), 3000);
      await fetchPersonnelData();
    } catch (err: any) {
      setActionError(err.message || "Delete karanna ba!");
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Advanced Multi-Column Live Filter
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;
    return (
      emp.name?.toLowerCase().includes(searchLower) ||
      emp.empNumber?.toString().toLowerCase().includes(searchLower) ||
      emp.nicId?.toLowerCase().includes(searchLower) ||
      emp.role?.toLowerCase().includes(searchLower)
    );
  });

  const deleteItem = employees.find((x) => String(x.id) === String(deleteId));
  const inputCls = "w-full px-2 py-1.5 bg-slate-950 border border-cyan-500/50 rounded-lg text-slate-100 text-[12px] focus:border-cyan-400 focus:outline-none";

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 p-4 md:p-6 lg:p-8 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Upper Control Bar & Navigation */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/branches/${id}`)}
            className="group flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-400 hover:text-white transition-all duration-200 shadow-sm"
            title="Return to Operational Dashboard"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-md text-cyan-400">
                <Users size={16} className="animate-pulse" />
              </div>
              <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase font-mono">
                Personnel Registry
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium tracking-wide">
              Authenticated administrative ledger & structural profile matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800/80 hover:bg-slate-850 text-slate-400 hover:text-cyan-400 disabled:opacity-50 transition-all duration-200 shrink-0"
            title="Force Grid Recalculation"
          >
            <RefreshCw size={14} className={`${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
            <input
              type="text"
              placeholder="Query structural index (Name, ID, NIC)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all font-sans"
            />
          </div>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto mb-4 flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-4 py-3 rounded-xl text-emerald-400 text-xs">
          <CheckCircle2 size={16} /><span>{successMessage}</span>
        </div>
      )}
      {actionError && (
        <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between gap-3 bg-red-950/40 border border-red-500/40 px-4 py-3 rounded-xl text-red-400 text-xs">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")}><X size={15} /></button>
        </div>
      )}

      {/* Primary Infrastructure Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl bg-slate-900/20 border border-slate-900/60 backdrop-blur-sm">
            <RefreshCw className="animate-spin text-cyan-500/70 mb-3" size={24} />
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
              Synchronizing Ledger Matrix...
            </span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 font-mono text-[11px] flex items-start gap-3 shadow-inner">
            <Database size={14} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">System Fault Identified</span>
              {error}
            </div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-16 px-4 rounded-xl bg-slate-900/20 border border-slate-900/50 text-center backdrop-blur-sm">
            <Database className="mx-auto text-slate-700 mb-2.5" size={20} />
            <p className="text-xs font-medium text-slate-400">
              No matching records isolated within this sector node.
            </p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Node Parameter Context: branch_id={id}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    <th className="py-3 px-4 w-28 text-center border-r border-slate-900/60">ID Token</th>
                    <th className="py-3 px-5 w-56">Legal Identification Name</th>
                    <th className="py-3 px-5 w-40">Identity Document</th>
                    <th className="py-3 px-5 w-44">Structural Allocation</th>
                    <th className="py-3 px-5">Geographic Vector</th>
                    <th className="py-3 px-4 w-44 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-[12px] text-slate-300 font-sans">
                  {filteredEmployees.map((emp) => {
                    const isEditing = String(editingId) === String(emp.id);

                    // ✅ EDIT MODE
                    if (isEditing) {
                      return (
                        <tr key={emp.id} className="bg-cyan-500/10 border-2 border-cyan-500/40 align-top">
                          <td className="py-2.5 px-4 font-mono text-center bg-slate-950/20 text-cyan-400/90 font-medium tracking-tight border-r border-slate-900/40 text-[11px]">
                            <span className="inline-flex items-center gap-1 text-slate-500 select-none"><Hash size={10} /></span>
                            {emp.empNumber}
                          </td>
                          <td className="py-2.5 px-2">
                            <input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Name" />
                          </td>
                          <td className="py-2.5 px-2">
                            <input value={editData.nicId} onChange={(e) => setEditData((p) => ({ ...p, nicId: e.target.value }))} className={inputCls} placeholder="NIC" />
                          </td>
                          <td className="py-2.5 px-2">
                            <input value={editData.role} onChange={(e) => setEditData((p) => ({ ...p, role: e.target.value }))} className={inputCls} placeholder="Role" />
                          </td>
                          <td className="py-2.5 px-2">
                            <input value={editData.address} onChange={(e) => setEditData((p) => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="Address" />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex flex-col gap-1.5">
                              <button onClick={handleSaveRow} disabled={isSaving} className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase disabled:opacity-50">
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                              </button>
                              <button onClick={handleCancelEdit} disabled={isSaving} className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-black uppercase">
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // ✅ NORMAL MODE - Data + Edit / Delete Buttons
                    return (
                      <tr key={emp.id} className="hover:bg-slate-900/60 group transition-all duration-150 ease-in-out">
                        <td className="py-2.5 px-4 font-mono text-center bg-slate-950/20 text-cyan-400/90 font-medium tracking-tight border-r border-slate-900/40 text-[11px]">
                          <span className="inline-flex items-center gap-1 text-slate-500 select-none"><Hash size={10} /></span>
                          {emp.empNumber}
                        </td>
                        <td className="py-2.5 px-5 font-medium text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                          {emp.name}
                        </td>
                        <td className="py-2.5 px-5 text-slate-400 font-mono text-[11px]">
                          <div className="flex items-center gap-2">
                            <CreditCard size={12} className="text-slate-600 shrink-0" />
                            <span className="tracking-tighter">{emp.nicId || "N/A"}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-850 text-[10px] font-medium text-slate-300 font-mono uppercase tracking-wide">
                            <ShieldCheck size={11} className="text-emerald-500/80 shrink-0" />
                            {emp.role || "Unassigned"}
                          </span>
                        </td>
                        <td className="py-2.5 px-5 text-slate-400 truncate">
                          <div className="flex items-center gap-2 max-w-xs md:max-w-sm">
                            <MapPin size={12} className="text-slate-600 shrink-0" />
                            <span className="truncate">{emp.address || "No record on file"}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleEditRow(emp)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 rounded-lg text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                              <Pencil size={12} /> Edit
                            </button>
                            <button onClick={() => setDeleteId(String(emp.id))} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600/20 border border-red-500/40 text-red-300 rounded-lg text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">
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

            <div className="p-3 bg-slate-950/40 border-t border-slate-900/80 flex flex-row items-center justify-between px-5 text-[10px] font-mono text-slate-500 tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LEDGER_COUNT: {filteredEmployees.length} RECORDS ACCESSED</span>
              </div>
              <span className="text-slate-600 uppercase">NODE_REF: BRANCH_{id}</span>
            </div>
          </div>
        )}
      </div>

      {/* ✅ DELETE CONFIRM POPUP */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !isDeleting && setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0d1527] border border-red-500/40 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400"><AlertTriangle size={20} /></span>
              <div><p className="font-black text-white uppercase">Delete Entry?</p><p className="text-[11px] text-slate-400">Me action eka undo karanna ba.</p></div>
            </div>
            {deleteItem && (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-[11px] space-y-1">
                <p>Emp No: <b className="text-white">{deleteItem.empNumber}</b> • {deleteItem.name}</p>
                <p>NIC: <b className="text-white">{deleteItem.nicId || "N/A"}</b> • Role: <b className="text-white">{deleteItem.role || "Unassigned"}</b></p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-xs">{isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}