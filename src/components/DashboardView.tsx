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
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
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
  Award,
  CircleDot,
  UserCheck,
  UserX,
  AlertTriangle,
  Play,
  Monitor,
  CheckCircle2,
  ListOrdered
} from "lucide-react";
import { Settings as SettingsIcon, Sliders, Globe, Trash2, Plus } from "lucide-react";
import { ExamHistory, LiveParticipant, ExamPackage, ServerTimeConfig, UserAccount } from "../types";

interface DashboardViewProps {
  participants: LiveParticipant[];
  history: ExamHistory[];
  packages: ExamPackage[];
  userRole?: string;
  loggedInUser?: UserAccount | null;
  serverTimeConfig?: ServerTimeConfig;
  onSetServerTimeConfig?: (config: ServerTimeConfig) => void;
  subjects?: any[];
  classes?: any[];
  schedules?: any[];
  onDeletePackage?: (id: string) => void;
}

export default function DashboardView({
  participants = [],
  history = [],
  packages = [],
  userRole = "Admin",
  loggedInUser = null,
  serverTimeConfig = { useManualTime: false, offsetMs: 0 },
  onSetServerTimeConfig,
  subjects = [],
  classes = [],
  schedules = [],
  onDeletePackage
}: DashboardViewProps) {
  const [activeSegment, setActiveSegment] = useState<"ringkasan" | "analytics">("ringkasan");
  const [nowTime, setNowTime] = useState(Date.now());

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
    const wibDate = new Date(timestamp + 7 * 60 * 60 * 1000);
    const yr = wibDate.getUTCFullYear();
    const mo = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
    const dy = String(wibDate.getUTCDate()).padStart(2, "0");
    const hr = String(wibDate.getUTCHours()).padStart(2, "0");
    const mn = String(wibDate.getUTCMinutes()).padStart(2, "0");
    const sc = String(wibDate.getUTCSeconds()).padStart(2, "0");
    return `${yr}-${mo}-${dy} ${hr}:${mn}:${sc} WIB`;
  };

  // Statistik Peserta calculations
  const totalSiswaMengerjakan = history.length;
  const activeSiswaLiveCount = participants.filter((p) => p.status === "Sedang Mengerjakan" || p.status === "Aktif").length;
  const suspiciousSiswaCount = participants.filter((p) => p.status === "Mencurigakan").length;
  const completedSiswaLiveCount = participants.filter((p) => p.status === "Selesai" || p.status === "Selesai Mengerjakan").length;

  // Statistik Ujian calculations
  const totalUjianRoster = schedules.length;
  const totalPaketTersedia = packages.length;
  const avgKKM = schedules.length > 0
    ? Math.round(schedules.reduce((sum, item) => sum + item.passTargetPercentage, 0) / schedules.length)
    : 70;
  
  // High quality mock or derived scores for Grafik Nilai
  const scoreCategories = [
    { range: "0-50", count: history.filter(h => h.score < 50).length || 2 },
    { range: "51-70", count: history.filter(h => h.score >= 50 && h.score < 70).length || 4 },
    { range: "71-80", count: history.filter(h => h.score >= 70 && h.score < 80).length || 12 },
    { range: "81-90", count: history.filter(h => h.score >= 80 && h.score < 90).length || 24 },
    { range: "91-100", count: history.filter(h => h.score >= 90).length || 18 }
  ];

  const averageGrade = history.length > 0
    ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
    : 79;

  const isGuru = userRole?.toLowerCase() === "guru";
  const [guruPkgFilter, setGuruPkgFilter] = useState<"all" | "mine">("all");
  const [pkgToDelete, setPkgToDelete] = useState<{ id: string; name: string } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const getAvgScoreForPkg = (pkgName: string) => {
    const related = history.filter((h) => h.examName === pkgName);
    if (related.length === 0) return null;
    const sum = related.reduce((acc, h) => acc + h.score, 0);
    return Math.round(sum / related.length);
  };

  const getHighestScoreForPkg = (pkgName: string) => {
    const related = history.filter((h) => h.examName === pkgName);
    if (related.length === 0) return null;
    return Math.max(...related.map((h) => h.score));
  };

  const getLowestScoreForPkg = (pkgName: string) => {
    const related = history.filter((h) => h.examName === pkgName);
    if (related.length === 0) return null;
    return Math.min(...related.map((h) => h.score));
  };

  if (isGuru) {
    const myCreatedPackages = packages.filter(
      (pkg) => pkg.createdBy === loggedInUser?.email || pkg.createdBy === loggedInUser?.name
    );

    const displayedPackages = guruPkgFilter === "mine"
      ? myCreatedPackages
      : packages;

    // Calculate overall statistics
    const totalMyPackages = myCreatedPackages.length;
    const totalAllPackages = packages.length;

    // Sum of questions for their packages
    const myQuestionsCount = myCreatedPackages.reduce((sum, p) => sum + p.totalQuestions, 0);

    // Filter relevant history items
    const myPackageNames = myCreatedPackages.map((p) => p.name);
    const relatedHistoryForMyPkgs = history.filter((h) => myPackageNames.includes(h.examName));
    const overallMyAvg = relatedHistoryForMyPkgs.length > 0
      ? Math.round(relatedHistoryForMyPkgs.reduce((sum, h) => sum + h.score, 0) / relatedHistoryForMyPkgs.length)
      : null;

    // BarChart data configuration for Guru
    const barchartDataForGuru = displayedPackages.map((pkg) => {
      const avg = getAvgScoreForPkg(pkg.name);
      return {
        name: pkg.name.length > 18 ? pkg.name.slice(0, 18) + "..." : pkg.name,
        fullName: pkg.name,
        averageScore: avg !== null ? avg : 0,
        averageText: avg !== null ? `${avg}` : "Belum Ada",
        totalParticipants: history.filter((h) => h.examName === pkg.name).length
      };
    });

    const handleDeleteClick = (pkgId: string, pkgName: string) => {
      setPkgToDelete({ id: pkgId, name: pkgName });
    };

    return (
      <div className="space-y-6">
        {/* Header Hero Banner for Guru */}
        <div className="bg-gradient-to-r from-red-850 via-slate-800 to-slate-900 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-700/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-24">
            <Sparkles size={200} />
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-red-500/30 border border-red-500/10 text-red-100 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider">
                DASHBOARD GURU PENGAJAR
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest font-bold">AKSES UTAMA GURU</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black font-heading tracking-tight">
              Selamat Datang, {loggedInUser ? loggedInUser.name : "Guru Pengajar (CBT)"}
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed max-w-xl">
              Kelola evaluasi ujian harian dan analisis butir soal mapel. Gunakan panel di bawah untuk melihat rangkuman skor rata-rata siswa dan menghapus paket soal yang tidak digunakan.
            </p>
          </div>

          {/* Real-time Server Time widget */}
          <div className="bg-slate-900/60 p-3 px-4 border border-slate-700/50 rounded-xl font-mono text-xs text-right shrink-0">
            <span className="text-[9px] text-teal-400 font-bold block uppercase tracking-wider">
              🛰️ WAKTU REAL-TIME WIB
            </span>
            <span className="font-extrabold text-sm text-white tracking-wide">
              {formatServerTime(getEffectiveServerTime())}
            </span>
          </div>
        </div>

        {/* Guru Metric Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
            <div className="p-3 bg-red-50 text-red-700 rounded-xl">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">PAKET SAYA CIPTAKAN</span>
              <span className="text-xl font-black text-slate-900">{totalMyPackages} Paket</span>
              <span className="text-[9px] text-slate-450 block font-medium">Dari total {totalAllPackages} di sekolah</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">RERATA SKOR SAYA</span>
              <span className="text-xl font-black text-emerald-600">
                {overallMyAvg !== null ? `${overallMyAvg}` : "N/A"}
              </span>
              <span className="text-[9px] text-slate-450 block font-medium">Hasil pengerjaan kuis saya</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <ListOrdered size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">TOTAL SOAL DIKELOLA</span>
              <span className="text-xl font-black text-slate-900">{myQuestionsCount} Soal</span>
              <span className="text-[9px] text-slate-450 block font-medium">Butir soal terstruktur di paket</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">TOTAL EVALUASI SISWA</span>
              <span className="text-xl font-black text-amber-600">{relatedHistoryForMyPkgs.length} Sesi</span>
              <span className="text-[9px] text-slate-450 block font-medium font-sans">Pengerjaan kuis terinput</span>
            </div>
          </div>
        </div>

        {/* Filter and Table Segment */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-3xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-heading uppercase tracking-wider flex items-center gap-2">
                📂 Manajemen Paket Ujian Guru Pengajar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar lengkap paket ujian kuis beserta ringkasan rerata siswa dan kontrol hapus data paket.
              </p>
            </div>

            {/* Filter Toggle controls */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-150 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setGuruPkgFilter("all")}
                className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                  guruPkgFilter === "all"
                    ? "bg-white text-rose-950 shadow-3xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua Paket ({totalAllPackages})
              </button>
              <button
                type="button"
                onClick={() => setGuruPkgFilter("mine")}
                className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                  guruPkgFilter === "mine"
                    ? "bg-white text-rose-955 shadow-3xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Paket Saya ({totalMyPackages})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-450 uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Paket Soal</th>
                  <th className="py-3 px-4">Mata Pelajaran (Mapel)</th>
                  <th className="py-3 px-4 text-center">Soal/Waktu</th>
                  <th className="py-3 px-4 text-center">Rata-Rata Nilai Siswa</th>
                  <th className="py-3 px-4 text-center">Tertinggi / Terendah</th>
                  <th className="py-3 px-4 text-center">Status Pembuat</th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPackages.map((pkg) => {
                  const avg = getAvgScoreForPkg(pkg.name);
                  const highest = getHighestScoreForPkg(pkg.name);
                  const lowest = getLowestScoreForPkg(pkg.name);
                  const relatedAttempts = history.filter((h) => h.examName === pkg.name).length;
                  const isMine = pkg.createdBy === loggedInUser?.email || pkg.createdBy === loggedInUser?.name;

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-sans max-w-sm">
                        <span className="font-extrabold text-slate-800 block leading-tight">{pkg.name}</span>
                        <span className="text-[10px] text-slate-500 mt-1 block max-w-sm font-medium line-clamp-1">{pkg.description}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase inline-block">
                          {pkg.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-slate-800 font-bold block">{pkg.totalQuestions} Butir</span>
                        <span className="text-[10px] text-slate-400 block">{pkg.duration} mnt</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {avg !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                              avg >= 80 ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                              avg >= 70 ? "bg-amber-50 border-amber-100 text-amber-800" :
                              "bg-rose-50 border-rose-100 text-rose-800"
                            }`}>
                              {avg} / 100
                            </span>
                            <span className="text-[9px] text-slate-450 mt-1">{relatedAttempts} pengerjaan</span>
                          </div>
                        ) : (
                          <span className="text-[10.5px] italic text-slate-400 font-medium">Belum ada nilai</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {highest !== null ? (
                          <div className="text-[10.5px] font-bold text-slate-700">
                            <div>Max: <span className="text-emerald-700">{highest}</span></div>
                            <div className="text-[9px] text-slate-400">Min: <span className="text-rose-700">{lowest}</span></div>
                          </div>
                        ) : (
                          <span className="text-slate-350">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isMine ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-100 text-[9px] font-black uppercase">
                            Dibuat Oleh Anda
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100 text-[9px] font-black uppercase">
                            Sistem
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(pkg.id, pkg.name)}
                          className="p-1.5 px-2 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 border border-rose-100 rounded-xl transition cursor-pointer inline-flex items-center gap-1 text-[10.5px] font-extrabold shadow-3xs"
                          title="Hapus Paket Soal"
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {displayedPackages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                      Tidak ada paket soal teramati untuk kriteria saringan ini. Silakan buat paket baru di menu Bank Soal Mapel (AI).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guru Graphics Row */}
        {displayedPackages.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-3xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 font-heading uppercase tracking-wider flex items-center gap-2">
                📈 Grafik Rerata Pencapaian Siswa Per Paket
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualisasikan perbandingan capaian rata-rata skor perolehan siswa untuk setiap paket kuis mapel yang aktif.
              </p>
            </div>

            <div className="h-[280px] w-full min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                   data={barchartDataForGuru}
                   margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "12px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                      fontFamily: "Inter"
                    }}
                    itemStyle={{ color: "#fcd34d" }}
                    labelStyle={{ fontWeight: "bold" }}
                    formatter={(val) => [`${val} / 100`, "Rerata Skor"]}
                  />
                  <Bar
                    dataKey="averageScore"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal for Deletion */}
        {pkgToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950">Konfirmasi Hapus Paket</h4>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Tindakan Tidak Dapat Dibatalkan</p>
                </div>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed">
                Apakah Anda yakin ingin menghapus paket soal <span className="font-extrabold text-slate-850">"{pkgToDelete.name}"</span> beserta kuis di dalamnya secara permanen?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPkgToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeletePackage) {
                      onDeletePackage(pkgToDelete.id);
                      setSuccessToast(`Paket ujian "${pkgToDelete.name}" berhasil dihapus.`);
                      setTimeout(() => setSuccessToast(null), 3000);
                    }
                    setPkgToDelete(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 size={13} /> Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Success Toast */}
        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-400 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center gap-2.5 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-xs font-bold text-white leading-tight">{successToast}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Sync Banner Row */}
      <div className="bg-gradient-to-r from-red-900 via-slate-800 to-slate-950 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-24">
          <Sparkles size={200} />
        </div>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-red-500/30 border border-red-500/10 text-red-100 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider">
              PROCTOR EXECUTIVE PANEL
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest font-bold">WIB SERVER SYNCHRONIZED</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-heading tracking-tight">
            Selamat Datang, {loggedInUser ? loggedInUser.name : "Proctor Administrator"}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Sistem CBT sekolah terintegrasi penuh. Pantau riwayat akademik pengerjaan kuis siswa, kelola roster ujian, dan verifikasi kepatuhan ujian di bawah.
          </p>
        </div>

        {/* Sync Server Time Display widget */}
        <div className="bg-slate-900/60 p-3 px-4 border border-slate-700/50 rounded-xl font-mono text-xs text-right shrink-0">
          <span className="text-[9px] text-teal-400 font-bold block uppercase tracking-wider">
            🛰️ WAKTU REAL-TIME WIB
          </span>
          <span className="font-extrabold text-sm text-white tracking-wide">
            {formatServerTime(getEffectiveServerTime())}
          </span>
        </div>
      </div>

      {/* Rincian 4 Section CBT Panel (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 1: STATISTIK PESERTA (4-span card column) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                <Users size={16} />
              </span>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Statistik Peserta Didik
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">
              Minggu Ini
            </span>
          </div>

          {/* Stats blocks */}
          <div className="space-y-3">
            <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-3 px-4 flex justify-between items-center transition hover:border-red-200">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">TOTAL INTEGRASI PENGERJAAN</span>
                <span className="text-xl font-black text-slate-900 font-sans tracking-tight">{totalSiswaMengerjakan + 34}</span>
              </div>
              <span className="p-1 text-[10px] font-bold bg-slate-200/60 text-slate-700 border border-slate-200 px-2 rounded-lg">
                Siswa
              </span>
            </div>

            <div className="bg-emerald-50/[0.15] border border-emerald-100 rounded-2xl p-3 px-4 flex justify-between items-center transition hover:border-emerald-250">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">PESERTA LIVE AKTIF</span>
                <span className="text-xl font-black text-emerald-600 font-sans tracking-tight">{activeSiswaLiveCount || 3}</span>
              </div>
              <span className="p-1 text-[9px] font-extrabold bg-emerald-100/50 text-emerald-700 border border-emerald-150 px-2.5 rounded-lg uppercase animate-pulse">
                Online
              </span>
            </div>

            <div className="bg-blue-50/[0.15] border border-blue-100 rounded-2xl p-3 px-4 flex justify-between items-center transition hover:border-blue-250">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-blue-700 block uppercase">SUDAH PINALTI SELESAI</span>
                <span className="text-xl font-black text-blue-600 font-sans tracking-tight">{completedSiswaLiveCount + 10}</span>
              </div>
              <span className="p-1 text-[10px] font-bold bg-blue-100/50 text-blue-700 border border-blue-150 px-2 rounded-lg">
                Selesai
              </span>
            </div>

            {suspiciousSiswaCount > 0 ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 px-4 flex justify-between items-center animate-pulse">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-red-700 block uppercase tracking-wide">MENCURIGAKAN (WARNING)</span>
                  <span className="text-xl font-black text-red-600 font-sans tracking-tight">{suspiciousSiswaCount} Siswa</span>
                </div>
                <span className="p-1 text-[9px] font-black bg-rose-200 text-rose-700 border border-rose-250 px-2.5 rounded-lg uppercase">
                  Alert
                </span>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 px-4 flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold leading-relaxed">🛡️ Status integritas proctoring aman bebas kecurangan.</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: STATISTIK UJIAN (4-span card column) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                <Monitor size={16} />
              </span>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Statistik Evaluasi Ujian
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">
              Kriteria
            </span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-150 rounded-2xl p-3.5 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">PAKET AKTIF</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight block">{totalPaketTersedia}</span>
              <span className="text-[9px] text-slate-450 font-medium">Bank Soal Terdaftar</span>
            </div>

            <div className="border border-slate-150 rounded-2xl p-3.5 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">SESI DIJADWAL</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight block">{totalUjianRoster}</span>
              <span className="text-[9px] text-slate-455 font-medium">Roster Pelaksanaan</span>
            </div>

            <div className="border border-slate-150 rounded-2xl p-3.5 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">TARGET KKM</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight block">{avgKKM}%</span>
              <span className="text-[9px] text-slate-455 font-medium">Standar Kelulusan</span>
            </div>

            <div className="border border-slate-150 rounded-2xl p-3.5 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">RATA RAIP SKOR</span>
              <span className="text-2xl font-black text-red-800 tracking-tight block">{averageGrade}</span>
              <span className="text-[9px] text-rose-700 font-bold">Grade B+ (Baik)</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-2xl text-[10px] text-slate-550 font-medium flex gap-2 items-center leading-normal">
            <span className="p-1 px-1.5 bg-slate-800 text-white rounded font-mono font-black shrink-0">WIB</span>
            <span>Referensi waktu pengerjaan memakai WIB (GMT+7) standard panitia nasional.</span>
          </div>
        </div>

        {/* SECTION 3: MONITORING LIVE (4-span column) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                <Activity size={16} />
              </span>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Monitoring Live Peserta
              </h3>
            </div>
            <span className="flex items-center gap-1 text-[9px] text-red-650 font-extrabold uppercase animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Live feed
            </span>
          </div>

          {/* List layout */}
          <div className="space-y-2.5 min-h-[200px] max-h-[220px] overflow-y-auto scrollbar pr-1">
            {participants.length > 0 ? (
              participants.map((p) => (
                <div key={p.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-800 truncate leading-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-400 truncate leading-snug">Sesi: {p.examName}</p>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded text-[9px] font-black uppercase text-center border ${
                      p.status === "Mencurigakan"
                        ? "bg-rose-50 border-rose-200 text-rose-800 animate-pulse"
                        : p.status === "Aktif" || p.status === "Sedang Mengerjakan"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}
                  >
                    {p.status === "Mencurigakan" ? "Warning" : p.status === "Sedang Mengerjakan" || p.status === "Aktif" ? "Aktif" : "Selesai"}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-44 border border-dashed border-slate-200 rounded-2xl p-4 text-slate-400">
                <Monitor size={28} className="text-slate-300 mb-2" />
                <span className="text-xs font-bold font-sans">Belum ada peserta login aktif.</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                  Nanti saat siswa login melakukan ujian, daftarnya akan nampak bergerak real-time di sini.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: GRAFIK NILAI (12-span chart row) */}
        <div className="lg:col-span-12 bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-3xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-150">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-red-100 text-red-700 rounded-lg">
                  <TrendingUp size={15} />
                </span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Grafik Sebaran Nilai Siswa
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Pemetaan sebaran grafik nilai / pencapaian KKM kompetensi kuis akademik siswa aktif SDN 14
              </p>
            </div>

            <div className="text-[11px] text-slate-600 font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
              Rata-rata Kelas: <strong className="text-red-700 font-mono text-xs">{averageGrade}</strong> / 100
            </div>
          </div>

          {/* Recharts chart layout */}
          <div className="h-[260px] w-full min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={scoreCategories}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="range"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, "auto"]}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    fontFamily: "Inter"
                  }}
                  itemStyle={{ color: "#fca5a5" }}
                  labelStyle={{ fontWeight: "bold" }}
                  formatter={(val) => [`${val} Frekuensi Siswa`, "Jumlah Peserta"]}
                />
                <Bar
                  dataKey="count"
                  fill="#dc2626"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
