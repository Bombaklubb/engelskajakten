"use client";

import { useState } from "react";
import { fetchTeacherStats, type TeacherStats } from "@/services/analyticsService";
import { RefreshCw, LogOut, Monitor, Users } from "lucide-react";
import UnionJack from "@/components/ui/UnionJack";

export default function LararePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [statsError, setStatsError] = useState("");

  const todayDate = new Date().toLocaleDateString("sv-SE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await fetchTeacherStats(password);
      setStats(data);
      setAuthenticated(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fel lösenord");
    }
    setLoading(false);
  }

  async function refreshStats() {
    setLoading(true);
    try {
      const data = await fetchTeacherStats(password);
      setStats(data);
      setStatsError("");
    } catch {
      setStatsError("Kunde inte hämta statistik");
    }
    setLoading(false);
  }

  // Statistiken hämtas vid inloggningen och när läraren trycker på Uppdatera –
  // inte av sig själv. Förut hämtades den varannan minut medan fliken syntes,
  // och en flik som stod öppen en skoldag kostade runt 240 anrop mot Vercels tak.

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <UnionJack fit="fill" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white">Lärarvy</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Engelskajakten</p>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 mt-4">
            Ange lösenord för att se anonym statistik.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Lösenord"
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              autoFocus
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-3 rounded-xl font-bold transition"
            >
              {loading ? "Loggar in..." : "Logga in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UnionJack fit="fill" className="w-9 h-9 rounded-lg" />
            <div>
              <h1 className="text-lg font-black text-slate-800 dark:text-white">
                Lärarvy – Engelskajakten
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Anonymiserad aggregerad statistik · GDPR-säkrad
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="hidden md:block text-sm text-slate-400 dark:text-slate-500 mr-2">
              {todayDate}
            </p>
            <button
              onClick={refreshStats}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Uppdatera
            </button>
            <button
              onClick={() => setAuthenticated(false)}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logga ut
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {statsError && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-xl">
            {statsError}
          </div>
        )}

        <section>
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3">Översikt</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="min-w-0 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border-2 border-emerald-300 dark:border-emerald-700 text-center flex flex-col items-center gap-2 shadow-sm">
              <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{stats?.activeNow ?? "–"}</div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Inloggade nu</div>
            </div>
            <div className="min-w-0 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center gap-2 shadow-sm">
              <div className="w-11 h-11 bg-sky-100 dark:bg-sky-900/50 rounded-full flex items-center justify-center">
                <Monitor className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{stats?.visitorsToday ?? "–"}</div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Enheter idag</div>
            </div>
            <div className="min-w-0 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center gap-2 shadow-sm">
              <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{stats?.uniqueDevices ?? "–"}</div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Unika enheter totalt</div>
            </div>
          </div>
        </section>

        {/* GDPR – samma ruta i alla jakter */}
        <section className="rounded-2xl overflow-hidden border border-green-700/40" style={{ background: "#0d1f1a" }}>
          <div className="p-4 sm:p-5">
            <p className="font-black text-green-400 text-sm mb-2">🔒 GDPR-säkrad statistik</p>
            <p className="text-green-300 text-sm mb-2">
              Inga personuppgifter samlas in. Varje enhet identifieras av ett slumpmässigt anonymt ID som inte kan kopplas till en person. All statistik är aggregerad och visas aldrig på individnivå.
            </p>
            <ul className="space-y-0.5 text-green-400 text-sm">
              <li>✓ Inga namn, IP-adresser eller inloggningsuppgifter lagras</li>
              <li>✓ Anonymt enhets-ID (UUID) – kan inte kopplas till en elev</li>
              <li>✓ Endast summerad data visas (antal enheter)</li>
            </ul>
          </div>
          <div className="border-t border-green-700/40 px-4 sm:px-5 py-3 flex items-center gap-2">
            <span className="text-base" aria-hidden="true">📅</span>
            <p className="text-green-300 text-sm">
              Engelskajakten började samla in anonym statistik{" "}
              <strong className="text-green-200">14 april 2026</strong>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
