"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, User } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  // States
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", isError: false });

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. LocalStorage එකෙන් මුළු සෙස්ෂන් දත්ත String එක ලබා ගැනීම
      const sessionStr = localStorage.getItem("user_session");
      
      if (sessionStr) {
        try {
          // 2. 🛠️ FIX: String එකක් ලෙස ඇති JSON දත්ත Object එකක් බවට පත් කිරීම
          const sessionObj = JSON.parse(sessionStr);
          
          // 3. Object එක ඇතුලෙන් 'username' පමණක් වෙන් කරගෙන State එකට ලබා දීම
          if (sessionObj && sessionObj.username) {
            setUsername(sessionObj.username);
          } else {
            setUsername("Nimantha"); // username එකක් නැත්නම් fallback එකක් ලෙස
          }
        } catch (error) {
          // JSON parse කිරීමට නොහැකි වුවහොත් (සරල string එකක් තිබුනොත්)
          setUsername(sessionStr);
        }
      } else {
        setUsername("Nimantha"); // session එකක්ම නොමැති නම් fallback එකක් ලෙස
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus({ message: "New passwords do not match.", isError: true });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username, // මෙතැනින් යන්නේ වෙන් කරගත් පිරිසිදු username එක පමණි
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ message: data.message, isError: false });
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setStatus({ message: data.message, isError: true });
      }
    } catch (error) {
      setStatus({
        message: "Server connection error occurred.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto text-white">
      
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-3 mb-6">
        <h2 className="text-xl font-semibold text-sky-400">User Password Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Update the account password for the currently authenticated user.</p>
      </div>

      {/* Compact Professional Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs bg-slate-900 border border-slate-800 p-5 rounded-lg shadow-xl">
        
        {/* Username Field */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Username</label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              disabled
              value={username} // දැන් මෙතැන දිස්වන්නේ පිරිසිදු Username එක පමණි (උදා: nimantha)
              className="w-full bg-slate-800/80 border border-slate-700 rounded pl-10 pr-3 py-2.5 text-slate-400 cursor-not-allowed font-semibold"
            />
          </div>
        </div>

        {/* New Password Field */}
        <div>
          <label className="block text-slate-300 mb-1 font-medium">New Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type={showNewPassword ? "text" : "password"}
              required
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-slate-950 border border-slate-700 rounded pl-10 pr-10 py-2.5 focus:border-sky-500 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 text-slate-400 hover:text-white transition"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-slate-300 mb-1 font-medium">Confirm New Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded pl-10 pr-10 py-2.5 focus:border-sky-500 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 text-slate-400 hover:text-white transition"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {status.message && (
          <div
            className={`p-3 rounded text-center text-xs font-medium border ${
              status.isError
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-1/2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded py-2.5 transition font-semibold"
          >
            Go Back
          </button>
          <button
            type="submit"
            disabled={loading || !username}
            className="w-1/2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white rounded py-2.5 transition font-semibold shadow-md"
          >
            {loading ? "Updating..." : "Save Password"}
          </button>
        </div>

      </form>
    </div>
  );
}