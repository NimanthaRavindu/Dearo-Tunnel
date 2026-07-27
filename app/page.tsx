"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const isSuperAdminTyping = username === "Nimantha" && password ==="Nima@2002";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials. Please verify your administrative access logs.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("user_session", JSON.stringify(data.user));
      }

      router.push("/dashboard");

    } catch (err: any) {
      setError(err.message);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden antialiased">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/apex(back).gif"
          alt="Animated Background"
          fill
          className="object-cover fixed"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10" />

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-slate-950 border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative z-10 overflow-hidden">
        {/* TOP ACCENT LINE */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

        {/* SYSTEM LOGO & HEADER */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-3 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              DEARO TUNNEL
            </h1>
            <p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
              Secure Central Gateway
            </p>
          </div>
        </div>

        {/* ERROR MESSAGE ALERT */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* USERNAME FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-slate-600 text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* PASSWORD FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-slate-600 text-xs font-mono"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/10"
          >
            {loading ? "Authenticating Access Logs..." : (
              <>
                Sign In to System <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* SYSTEM NOTICE FOOTER */}
        <div className="mt-8 pt-4 border-t border-slate-900 text-center">
          {isSuperAdminTyping ? (
          <p className="text-[10px] text-slate-600 font-medium">
            Don't have an account yet?{" "}
            <Link href="/signup" className="text-blue-500 hover:text-blue-400 font-bold transition ml-1">
              Sign up here
            </Link>
          </p>
          ):(
            <p className="text-[9px text-slate-800 font-mono tracking-widest select-none">
              SECURE NODE ENCRYPTION ACTIVE
            </p>
          )}
        </div>
      </div>
    </div>
  );
}