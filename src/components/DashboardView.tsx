/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Users,
  CheckCircle,
  TrendingUp,
  Activity,
  Calendar,
  Zap,
  Clock,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Award
} from "lucide-react";
import { Settings as SettingsIcon, Sliders, Globe } from "lucide-react";
import { ExamHistory, LiveParticipant, ExamPackage, ServerTimeConfig } from "../types";
import { REGISTRATION_CHART_DATA } from "../data";

interface DashboardViewProps {
  participants: LiveParticipant[];
  history: ExamHistory[];
  packages: ExamPackage[];
  serverTimeConfig?: ServerTimeConfig;
  onSetServerTimeConfig?: (config: ServerTimeConfig) => void;
}

export default function DashboardView({
  participants,
  history,
  packages,
  serverTimeConfig = { useManualTime: false, offsetMs: 0 },
  onSetServerTimeConfig
}: DashboardViewProps) {
  const [chartFilter, setChartFilter] = useState<"all" | "q1" | "q2">("all");

  // Manual High-Precision UTC Clock States
  const [nowTime, setNowTime] = useState(Date.now());
  const [showTimePanel, setShowTimePanel] = useState(false);
  const [customDateTime, setCustomDateTime] = useState(() => {
    // Return a readable ISO segment (local representation of current datetime for picker)
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    const hr = String(d.getHours()).padStart(2, "0");
    const mn = String(d.getMinutes()).padStart(2, "0");
    return `${yr}-${mo}-${dy}T${hr}:${mn}`;
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getEffectiveServerTime = () => {
    return nowTime + (serverTimeConfig.offsetMs || 0);
  };

  const formatServerTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const yr = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dy = String(d.getUTCDate()).padStart(2, "0");
    const hr = String(d.getUTCHours()).padStart(2, "0");
    const mn = String(d.getUTCMinutes()).padStart(2, "0");
    const sc = String(d.getUTCSeconds()).padStart(2, "0");
    return `${yr}-${mo}-${dy} ${hr}:${mn}:${sc}`;
  };

  const handleUpdateOffset = (offset: number, enableManual: boolean = true) => {
    if (onSetServerTimeConfig) {
      onSetServerTimeConfig({
        useManualTime: enableManual,
        offsetMs: offset
      });
    }
  };

  const handleApplyCustomTime = () => {
    if (!customDateTime) return;
    const selectedDate = new Date(customDateTime);
    const offset = selectedDate.getTime() - Date.now();
    handleUpdateOffset(offset, true);
  };

  const handleResetToRealtime = () => {
    handleUpdateOffset(0, false);
  };

  const getMonthLabel = (dateStr: string) => {
    if (!dateStr) return "Mei";
    const lower = dateStr.toLowerCase();
    if (lower.includes("-01-") || lower.includes("/01/")) return "Jan";
    if (lower.includes("-02-") || lower.includes("/02/")) return "Feb";
    if (lower.includes("-03-") || lower.includes("/03/")) return "Mar";
    if (lower.includes("-04-") || lower.includes("/04/")) return "Apr";
    if (lower.includes("-05-") || lower.includes("/05/")) return "Mei";
    if (lower.includes("-06-") || lower.includes("/06/")) return "Jun";
    if (lower.includes("-07-") || lower.includes("/07/")) return "Jul";
    if (lower.includes("jan")) return "Jan";
    if (lower.includes("feb")) return "Feb";
    if (lower.includes("mar")) return "Mar";
    if (lower.includes("apr")) return "Apr";
    if (lower.includes("mei") || lower.includes("may")) return "Mei";
    if (lower.includes("jun")) return "Jun";
    if (lower.includes("jul")) return "Jul";
    return "Mei";
  };

  const getFilteredChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul"];
    const seenEmails = new Set<string>();
    
    const historyByMonth: Record<string, ExamHistory[]> = {
      Jan: [], Feb: [], Mar: [], Apr: [], Mei: [], Jun: [], Jul: []
    };
    const participantsByMonth: Record<string, LiveParticipant[]> = {
      Jan: [], Feb: [], Mar: [], Apr: [], Mei: [], Jun: [], Jul: []
    };

    history.forEach((h) => {
      const m = getMonthLabel(h.startTime);
      if (historyByMonth[m]) {
        historyByMonth[m].push(h);
      } else {
        historyByMonth["Mei"].push(h);
      }
    });

    participants.forEach((p) => {
      participantsByMonth["Mei"].push(p);
    });

    const chartData = months.map((month) => {
      historyByMonth[month]?.forEach((h) => {
        if (h.studentEmail) {
          seenEmails.add(h.studentEmail.toLowerCase().trim());
        }
      });
      participantsByMonth[month]?.forEach((p) => {
        if (p.email) {
          seenEmails.add(p.email.toLowerCase().trim());
        }
      });

      return {
        label: month,
        count: seenEmails.size,
      };
    });

    if (chartFilter === "q1") {
      return chartData.slice(0, 4);
    }
    if (chartFilter === "q2") {
      return chartData.slice(4);
    }
    return chartData;
  };

  // Quick statistics
  const currentLiveCount = participants.filter((p) => p.status === "Aktif" || p.status === "Mencurigakan" || p.status === "Sedang Mengerjakan").length;
  const recentExams = history.slice(0, 4);

  // Dynamic academic metrics
  const avgScore = history.length > 0 
    ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
    : 0;

  // Calculate unique registered students
  const uniqueStudentEmails = Array.from(new Set([
    ...history.map((h) => h.studentEmail.toLowerCase().trim()),
    ...participants.map((p) => p.email.toLowerCase().trim())
  ]));
  const totalStudentsCount = uniqueStudentEmails.length;

  return (
    <div className="space-y-6">
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-teal-500 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-4">
          <Zap size={240} />
        </div>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 border border-white/20">
              <Sparkles size={12} /> VERSI 2.50 (VIBRANT)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-rose-500 font-bold bg-white/90 px-2 py-0.5 rounded">Server Utama Online</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight font-heading">Selamat Datang, Admin</h1>
          <p className="text-sm text-white/90 max-w-xl font-medium">
            Sistem Computer Based Test (CBT) berjalan lancar. Ambil tindakan cepat untuk monitoring ujian aktif, kelola paket soal, atau analisis hasil pendaftaran siswa secara real-time.
          </p>
        </div>
        
        <button
          onClick={() => setShowTimePanel(!showTimePanel)}
          className={`mt-4 md:mt-0 px-4 py-3 text-right font-mono text-xs rounded-2xl border transition flex items-center gap-3 group shrink-0 ${
            serverTimeConfig.useManualTime
              ? "bg-amber-500/10 border-amber-400 text-amber-300 hover:bg-amber-500/20 shadow-lg shadow-amber-500/10"
              : "bg-white/11 backdrop-blur-sm border-white/10 text-white/95 hover:bg-white/20 shadow-md"
          }`}
          title="Klik untuk membuka Pengaturan Referensi UTC Server Manual"
        >
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-teal-200 flex items-center justify-end gap-1">
              {serverTimeConfig.useManualTime ? "⚡ OVERRIDE MANUAL" : "🛰️ CLOCK SERVER UTC"}
            </div>
            <div className="font-extrabold text-sm tracking-wide mt-0.5 whitespace-nowrap">
              {formatServerTime(getEffectiveServerTime())}
            </div>
          </div>
          <div className="p-1.5 bg-white/10 rounded-lg group-hover:scale-110 transition">
            <Sliders size={14} className={serverTimeConfig.useManualTime ? "text-amber-300 animate-pulse" : "text-white"} />
          </div>
        </button>
      </div>

      {/* High Resolution Server UTC Settings Control Panel */}
      {showTimePanel && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-teal-400" />
                <h3 className="font-bold text-base text-white font-heading">Pengaturan Manual Waktu Server UTC</h3>
              </div>
              <p className="text-xs text-slate-405 text-slate-400 mt-0.5">
                Konfigurasikan sistem referensi waktu UTC secara offline/online agar sinkron presisi 20ms di semua ujian siswa aktif.
              </p>
            </div>
            <button
              onClick={() => setShowTimePanel(false)}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition animate-pulse"
            >
              Tutup Panel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Mode Kontrol Waktu Server
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleResetToRealtime}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    !serverTimeConfig.useManualTime
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold"
                      : "bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${!serverTimeConfig.useManualTime ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}></span>
                  Waktu UTC Riil (Sistem)
                </button>
                <button
                  onClick={() => handleUpdateOffset(serverTimeConfig.offsetMs || 0, true)}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    serverTimeConfig.useManualTime
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-extrabold"
                      : "bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${serverTimeConfig.useManualTime ? "bg-amber-400 animate-pulse" : "bg-slate-600"}`}></span>
                  Waktu UTC Manual
                </button>
              </div>

              {serverTimeConfig.useManualTime && (
                <div className="bg-amber-500/[0.03] border border-amber-500/20 rounded-xl p-3.5 space-y-2">
                  <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                    ⚠️ Aturan Presisi Sinkron
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Semua timer portal siswa, jadwal aktif, sisa waktu hitung mundur, dan log token akan otomatis menyesuaikan diri dengan offset waktu saat ini:{" "}
                    <span className="font-mono text-amber-300">
                      {serverTimeConfig.offsetMs > 0 ? "+" : ""}
                      {Math.round(serverTimeConfig.offsetMs / 1000)}s
                    </span>{" "}
                    terhadap jam sistem.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tentukan Tanggal & Jam Target (Referensi Lokalnya)
                </label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500 transition"
                  />
                  <button
                    onClick={handleApplyCustomTime}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:opacity-90 rounded-xl text-white text-xs font-bold shadow-md transition whitespace-nowrap"
                  >
                    Terapkan Waktu
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Preset Penyesuaian Cepat (Offset Referensi)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      // Set to exactly now
                      setCustomDateTime(() => {
                        const d = new Date();
                        const yr = d.getFullYear();
                        const mo = String(d.getMonth() + 1).padStart(2, "0");
                        const dy = String(d.getDate()).padStart(2, "0");
                        const hr = String(d.getHours()).padStart(2, "0");
                        const mn = String(d.getMinutes()).padStart(2, "0");
                        return `${yr}-${mo}-${dy}T${hr}:${mn}`;
                      });
                      handleUpdateOffset(0, true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    Kini / Sekarang
                  </button>
                  <button
                    onClick={() => {
                      const offsetBefore = serverTimeConfig.offsetMs || 0;
                      handleUpdateOffset(offsetBefore + 3600 * 1000, true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    +1 Jam
                  </button>
                  <button
                    onClick={() => {
                      const offsetBefore = serverTimeConfig.offsetMs || 0;
                      handleUpdateOffset(offsetBefore - 3600 * 1000, true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    -1 Jam
                  </button>
                  <button
                    onClick={() => {
                      const offsetBefore = serverTimeConfig.offsetMs || 0;
                      handleUpdateOffset(offsetBefore + 24 * 3600 * 1000, true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    +1 Hari
                  </button>
                  <button
                    onClick={() => {
                      const offsetBefore = serverTimeConfig.offsetMs || 0;
                      handleUpdateOffset(offsetBefore - 24 * 3600 * 1000, true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-755 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    -1 Hari
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs relative overflow-hidden group hover:shadow-xs hover:border-red-100 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Total Peserta Terdaftar
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {totalStudentsCount}
                </span>
                {totalStudentsCount > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <ArrowUpRight size={12} /> Aktif
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Siswa ujian aktif minggu ini:</span>
            <span className="font-semibold text-slate-700">{currentLiveCount} Peserta</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs relative overflow-hidden group hover:shadow-xs hover:border-red-100 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Jumlah Paket Soal
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {packages.length}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <ArrowUpRight size={12} /> Aktif
                </span>
              </div>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <BookOpen size={22} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Jenis kurikulum:</span>
            <span className="font-semibold text-slate-700">Merdeka Belajar</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs relative overflow-hidden group hover:shadow-xs hover:border-red-100 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Rata-Rata Nilai Siswa
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {avgScore}
                </span>
                {avgScore > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <ArrowUpRight size={12} /> Stabil
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Award size={22} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Skor batas lulus (KKM):</span>
            <span className="font-semibold text-amber-850">70</span>
          </div>
        </div>
      </div>

      {/* Graphic and Live Feeds Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Chart - takes 2 cols on lg screens */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-800 font-heading">Grafik Jumlah Pendaftar</h3>
              <p className="text-xs text-slate-400">Analitik pertumbuhan akun peserta terdaftar tahun ini</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setChartFilter("all")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${chartFilter === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Semua
              </button>
              <button
                onClick={() => setChartFilter("q1")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${chartFilter === "q1" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Jan-Apr
              </button>
              <button
                onClick={() => setChartFilter("q2")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${chartFilter === "q2" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Mei-Jul
              </button>
            </div>
          </div>

          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={getFilteredChartData()}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, "auto"]}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    fontFamily: "Inter"
                  }}
                  itemStyle={{ color: "#fca5a5" }}
                  labelStyle={{ fontWeight: "bold" }}
                  formatter={(val) => [`${val} Siswa`, "Pendaftar"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 1, fill: "#fff", stroke: "#dc2626" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feeds widget - takes 1 col */}
        <div className="space-y-6">
          {/* Status System Health Block */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-950 px-2 py-0.5 rounded flex items-center gap-1">
                <Activity size={12} className="animate-pulse" /> SYSTEM READY
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ID: 9f6c4a8f</span>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-bold text-sm">Status Infrastruktur</h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Load CPU:</span>
                  <span className="text-slate-200">2,4%</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Memori VM:</span>
                  <span className="text-slate-200">248MB / 1GB</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Database Pool:</span>
                  <span className="text-slate-200">OK (99.8%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monitoring Web Hook:</span>
                  <span className="text-emerald-400">Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Live Active Users */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">Sedang Ujian</h3>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-full animate-pulse">
                {currentLiveCount} Live
              </span>
            </div>

            <div className="space-y-3">
              {participants.slice(0, 3).map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-50/50 border border-slate-100">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-700 truncate">{p.name}</p>
                    <p className="text-slate-400 truncate text-[10px]">{p.examName}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                      p.status === "Mencurigakan"
                        ? "bg-amber-50 text-amber-700 border-amber-100 font-extrabold animate-pulse"
                        : p.status === "Aktif" || p.status === "Sedang Mengerjakan"
                        ? "bg-emerald-55 bg-emerald-50 text-emerald-700 border-emerald-100"
                        : p.status === "Selesai" || p.status === "Selesai Mengerjakan"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-slate-50 text-slate-600 border-slate-150"
                    }`}
                  >
                    {p.status === "Selesai" || p.status === "Selesai Mengerjakan"
                      ? "Selesai"
                      : p.status === "Aktif" || p.status === "Sedang Mengerjakan" || p.status === "Mencurigakan"
                      ? "Mengerjakan"
                      : "Belum Mulai"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Histroy Action Logs */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-800 font-heading">Aktivitas & Riwayat Ujian Terbaru</h3>
          <span className="text-xs text-slate-400 font-mono">Menampilkan 4 data terakhir</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-slate-600 text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2 px-3">Nama Peserta</th>
                <th className="py-2 px-3">Paket Ujian</th>
                <th className="py-2 px-3">Waktu Mulai</th>
                <th className="py-2 px-3 text-center">Durasi</th>
                <th className="py-1.5 px-3 text-center">Skor (Maks 100)</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentExams.length > 0 ? (
                recentExams.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{h.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{h.studentEmail}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{h.examName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{h.startTime}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{h.durationMinutes} mnt</td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-800">{h.score}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          h.status === "Lulus"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : h.status === "Remedial"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 bg-slate-50/10 font-medium">
                    Belum ada riwayat aktivitas ujian yang terekam.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
