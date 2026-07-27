"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Mail, Shield, MapPin } from 'lucide-react';
import Image from 'next/image';

interface Branch{
  id:number;
  branch_name:string;
  branch_code:string;
}

export default function SignupPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username:"",
    email:"",
    password:"",
    role:"Admin",
    branch_name:"",
  });
  
  const [branches,setBranches] = useState<Branch[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branchesLoading,setBranchesLoading] =  useState(true);
  const [message,setMessage]= useState({type:"",text:""});

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("/api/dashboard/summary"); 
        if (!response.ok) throw new Error("API Network response was not ok");
        
        const json = await response.json();
        console.log("Fetched Branches Data:", json); 
        let list: Branch[] = [];
        if (json && json.branches && Array.isArray(json.branches)) {
          list = json.branches;
        } else if (Array.isArray(json)) {
          list = json;
        } else if (json && typeof json === 'object') {
          const dataValues = Object.values(json).find(val => Array.isArray(val));
          if (dataValues) list = dataValues as Branch[];
        }

        setBranches(list);
      } catch (err) {
        console.error("Error loading branches into signup list:", err);
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, []);


  const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)  =>{
    setFormData({...formData,[e.target.name]:e.target.value});
  }

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({type:"",text:""});
   
    const payload = {
      ...formData,
      branch_name:formData.branch_name === "" ? null:formData.branch_name,
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Registration failed."); 

      setMessage({type:"success",text:"User registered successfully!Redirecting to login..."});
      setTimeout(() => router.push("/"));
    } catch (err:any) {
      setMessage({type:"error",text:err.message});
    }
    finally{
      setLoading(false);
    }
  };

  return (
        <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden antialiased">
            {/* Background Layer */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/apex2.gif"
                        alt="Animated Background"
                        fill
                        className="object-cover fixed"
                        priority
                    />
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10" />
                </div>

      {/* SIGNUP CARD */}
      <div className="w-full max-w-md bg-slate-950 border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>

        {/* HEADER */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-3 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 uppercase">
              DEARO TUNNEL
            </h1>
            <p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
              Create Administrative Identity
            </p>
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* SIGNUP FORM */}
        <form onSubmit={handleSignup} className="space-y-4">
          
          {/* USERNAME */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                name="username"
                type="text"
                placeholder="Create a username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm text-slate-200 placeholder-slate-600"
                autoComplete="one-time-code"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-11 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm text-slate-200 placeholder-slate-600"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* EMAIL ADDRESS */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                name="email"
                type="email"
                placeholder="developer@apextunnel.local"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm text-slate-200 placeholder-slate-600"
                autoComplete="one-time-code"
                required
              />
            </div>
          </div>

          {/* ROLE & DESIGNATION */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Role</label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select 
                name="role" value={formData.role} onChange={handleChange}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Operator">Operator</option>
              </select>
            </div>
          </div>  

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5 tracking-wider">
              Assign Branch {branchesLoading && <span className="text-cyan-400 text-[9px] animate-pulse">(Syncing...)</span>}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"><MapPin size={13} /></span>
              <select 
                name="branch_name" 
                value={formData.branch_name} 
                onChange={handleChange}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
              >
                <option value="">Global (No Branch)</option>
                
                {branches && branches.length > 0 && branches.map((branch) => (
                  <option key={branch.id} value={branch.branch_name}>
                    {branch.branch_name} {branch.branch_code ? `(${branch.branch_code})` : ""}
                  </option>
                ))}
              </select>

              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 pointer-events-none text-[9px]">▼</span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
                Register Account <ArrowRight size={16} />               
          </button>
        </form>

        {/* FOOTER LINK TO LOGIN */}
        <div className="mt-6 pt-4 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/" className="text-blue-500 hover:text-blue-400 font-bold transition ml-1">
              Sign In here
            </Link>
          </p>
        </div>

      </div>
    </div>

  );  
}