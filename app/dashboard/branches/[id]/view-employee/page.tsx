"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import { 
  ArrowLeft, 
  Search, 
  Users, 
  ShieldCheck, 
  CreditCard, 
  MapPin, 
  RefreshCw, 
  Database,
  Hash
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ViewEmployeePage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id; // URL Dynamic Parameter (Branch ID)

  // System States
  const [employees, setEmployees] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

        {/* Global Control Interface */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Action: Manual Data Resync */}
          <button
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800/80 hover:bg-slate-850 text-slate-400 hover:text-cyan-400 disabled:opacity-50 transition-all duration-200 shrink-0"
            title="Force Grid Recalculation"
          >
            <RefreshCw size={14} className={`${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          {/* Contextual Live Search Input */}
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

      {/* Primary Infrastructure Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          /* Professional Skeleton/Loader State */
          <div className="flex flex-col items-center justify-center py-24 rounded-xl bg-slate-900/20 border border-slate-900/60 backdrop-blur-sm">
            <RefreshCw className="animate-spin text-cyan-500/70 mb-3" size={24} />
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
              Synchronizing Ledger Matrix...
            </span>
          </div>
        ) : error ? (
          /* Isolated Error Terminal Frame */
          <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 font-mono text-[11px] flex items-start gap-3 shadow-inner">
            <Database size={14} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">System Fault Identified</span>
              {error}
            </div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          /* Empty Dataset Placeholder */
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
          /* Standardized Data Grid Implementation */
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    <th className="py-3 px-4 w-28 text-center border-r border-slate-900/60">ID Token</th>
                    <th className="py-3 px-5 w-56">Legal Identification Name</th>
                    <th className="py-3 px-5 w-40">Identity Document</th>
                    <th className="py-3 px-5 w-44">Structural Allocation</th>
                    <th className="py-3 px-5">Geographic Vector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-[12px] text-slate-300 font-sans">
                  {filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-slate-900/60 group transition-all duration-150 ease-in-out"
                    >
                      {/* Column: Employee Number */}
                      <td className="py-2.5 px-4 font-mono text-center bg-slate-950/20 text-cyan-400/90 font-medium tracking-tight border-r border-slate-900/40 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-slate-500 select-none">
                          <Hash size={10} />
                        </span>
                        {emp.empNumber}
                      </td>
                      
                      {/* Column: Name */}
                      <td className="py-2.5 px-5 font-medium text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                        {emp.name}
                      </td>
                      
                      {/* Column: NIC */}
                      <td className="py-2.5 px-5 text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <CreditCard size={12} className="text-slate-600 shrink-0" />
                          <span className="tracking-tighter">{emp.nicId || "N/A"}</span>
                        </div>
                      </td>
                      
                      {/* Column: Role / Designation */}
                      <td className="py-2.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-850 text-[10px] font-medium text-slate-300 font-mono uppercase tracking-wide">
                          <ShieldCheck size={11} className="text-emerald-500/80 shrink-0" />
                          {emp.role || "Unassigned"}
                        </span>
                      </td>
                      
                      {/* Column: Residential Address */}
                      <td className="py-2.5 px-5 text-slate-400 truncate">
                        <div className="flex items-center gap-2 max-w-xs md:max-w-sm">
                          <MapPin size={12} className="text-slate-600 shrink-0" />
                          <span className="truncate">{emp.address || "No record on file"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix Operational Footer Summary */}
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
    </div>
  );
}