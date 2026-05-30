/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Settings,
  User,
  CheckCircle,
  X,
  RefreshCw,
  KeyRound,
  Grid,
  BookOpen,
  Clock,
  ExternalLink,
  Shield,
  HelpCircle
} from "lucide-react";
import { ExamSchedule, ServerTimeConfig, ExamPackage, Subject, ClassItem } from "../types";

// High-precision Indonesian & Standard Date-Time parser for schedule endTime
const getScheduleEndTimeMs = (endTimeStr: string): number | null => {
  if (!endTimeStr) return null;
  let s = endTimeStr.trim();
  
  if (s.toUpperCase().includes("WIB")) {
    s = s.replace(/WIB/gi, "").trim();
    s = s.replace(/\s+/g, "T");
    s = s.replace(/(\d{1,2})\.(\d{2})/, "$1:$2");
    if (s.match(/T\d{1,2}:\d{2}$/)) {
      s = s + ":00";
    }
    s = s + "+07:00";
    const t = Date.parse(s);
    if (!isNaN(t)) return t;
  }

  const regex = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2})[\.:](\d{2})/;
  const match = s.match(regex);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);
    return new Date(year, month, day, hour, minute).getTime();
  }

  const parsed = Date.parse(s);
  if (!isNaN(parsed)) return parsed;

  return null;
};

interface SchedulesViewProps {
  schedules: ExamSchedule[];
  onToggleLock: (id: string) => void;
  onAddSchedule: (schedule: ExamSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  serverTimeConfig?: ServerTimeConfig;
  packages: ExamPackage[];
  subjects: Subject[];
  classes: ClassItem[];
}

export default function SchedulesView({
  schedules,
  onToggleLock,
  onAddSchedule,
  onDeleteSchedule,
  serverTimeConfig = { useManualTime: false, offsetMs: 0 },
  packages = [],
  subjects = [],
  classes = []
}: SchedulesViewProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Core required fields for add scheduling
  const [selectedMapel, setSelectedMapel] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [inputDate, setInputDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [inputTime, setInputTime] = useState("08:00");
  const [inputDuration, setInputDuration] = useState(90); // default 90 minutes
  const [inputToken, setInputToken] = useState("");
  const [inputProctor, setInputProctor] = useState("Pak Hendra Wijaya, S.Pd");
  const [inputKKM, setInputKKM] = useState(70);

  // Auto-lock configuration state (persisted in localStorage)
  const [autoLockConfig, setAutoLockConfig] = useState(() => {
    const saved = localStorage.getItem("cbt_auto_lock_config");
    return saved ? JSON.parse(saved) : { enabled: false, bufferMinutes: 0, checkInterval: 5 };
  });

  const [lastCheckTimeText, setLastCheckTimeText] = useState<string>("");
  const [numAutoLockedSchedules, setNumAutoLockedSchedules] = useState<number>(0);
  const [tickerTick, setTickerTick] = useState(0);

  // Background timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerTick((prev) => prev + 1);
    }, autoLockConfig.checkInterval * 1000);
    return () => clearInterval(timer);
  }, [autoLockConfig.checkInterval]);

  // Save auto-lock config to localStorage
  useEffect(() => {
    localStorage.setItem("cbt_auto_lock_config", JSON.stringify(autoLockConfig));
  }, [autoLockConfig]);

  // Run auto-lock check
  useEffect(() => {
    if (!autoLockConfig.enabled) return;

    // Current effective server time
    const effectiveTime = Date.now() + (serverTimeConfig.offsetMs || 0);
    
    // Format live check time string
    const checkDate = new Date(effectiveTime + 7 * 60 * 60 * 1000);
    const hrs = checkDate.getUTCHours().toString().padStart(2, "0");
    const mins = checkDate.getUTCMinutes().toString().padStart(2, "0");
    const secs = checkDate.getUTCSeconds().toString().padStart(2, "0");
    setLastCheckTimeText(`${hrs}:${mins}:${secs} WIB`);

    schedules.forEach((sch) => {
      if (sch.isLocked) return; // already locked, skip

      const endTimeMs = getScheduleEndTimeMs(sch.endTime);
      if (!endTimeMs) return; // unable to parse, skip

      // Calculate deadline with the delay buffer
      const autoLockDeadline = endTimeMs + (autoLockConfig.bufferMinutes * 60 * 1000);

      // Check if effective server time is beyond deadline
      if (effectiveTime >= autoLockDeadline) {
        onToggleLock(sch.id);
        setNumAutoLockedSchedules((prev) => prev + 1);
      }
    });
  }, [tickerTick, autoLockConfig.enabled, schedules, serverTimeConfig.offsetMs]);

  // Automatically roll a random 5-letter capital token
  const generateRandomToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // clear readable chars
    let token = "";
    for (let i = 0; i < 5; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInputToken(token);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMapel) {
      alert("Silakan pilih Mata Pelajaran!");
      return;
    }
    if (!selectedPkgId) {
      alert("Silakan pilih Paket Soal!");
      return;
    }
    if (!selectedKelas) {
      alert("Silakan pilih Kelas / Rombel!");
      return;
    }
    if (!inputToken.trim()) {
      alert("Silakan buat Token Akses Ujian!");
      return;
    }

    // Find pkg object
    const selectedPkg = packages.find((p) => p.id === selectedPkgId);
    if (!selectedPkg) return;

    // Construct times representation
    // inputDate is "YYYY-MM-DD", inputTime is "HH:MM"
    const startString = `${inputDate} ${inputTime}`;
    
    // Calculate end time
    const startMs = new Date(`${inputDate}T${inputTime}:00`).getTime();
    const endMs = startMs + inputDuration * 60 * 1000;
    const endDate = new Date(endMs);
    const endHrs = String(endDate.getHours()).padStart(2, "0");
    const endMins = String(endDate.getMinutes()).padStart(2, "0");
    const endString = `${inputDate} ${endHrs}:${endMins}`;

    const newSchedule: ExamSchedule = {
      id: `sch-${Date.now()}`,
      title: `${selectedPkg.name} - ${selectedKelas}`,
      packageName: selectedPkg.name,
      startTime: `${startString} WIB`,
      endTime: `${endString} WIB`,
      isLocked: false,
      proctorName: inputProctor || "Umum",
      passTargetPercentage: Number(inputKKM) || 70,
      mapel: selectedMapel,
      kelas: selectedKelas,
      token: inputToken.toUpperCase().trim()
    };

    onAddSchedule(newSchedule);
    setIsAdding(false);
    
    // Reset inputs
    setSelectedMapel("");
    setSelectedPkgId("");
    setSelectedKelas("");
    setInputToken("");
    alert("Sukses menerbitkan Jadwal Sesi Ujian Baru!");
  };

  // Filter package options based on active selected mapel
  const filteredPackages = packages.filter((p) => p.category === selectedMapel);

  return (
    <div className="space-y-6">
      {/* Header and system indicators */}
      <div className="bg-gradient-to-r from-red-800 to-red-950 p-6 rounded-2xl shadow text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/15 border border-white/10 text-white text-[9px] uppercase font-black px-2.5 py-0.5 rounded-md tracking-wider">
              CBT Scheduler Pro
            </span>
            <span className="text-[10px] text-red-200">
              Sinkronisasi Server: AKTIF
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-heading tracking-tight">
            Penjadwalan Roster Sesi Ujian
          </h2>
          <p className="text-xs text-red-100 max-w-xl leading-relaxed">
            Atur kalender ujian, rekrut pengawas penghela, bagikan token ujian rahasia, serta kunci/buka akses siswa secara real-time.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              generateRandomToken();
            }}
            className="px-4 py-2 bg-white text-red-950 font-black text-xs rounded-xl hover:shadow-md cursor-pointer transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Buat Sesi Baru
          </button>
        )}
      </div>

      {/* Auto lock protection tools */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-red-100 text-red-800 rounded-xl shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 font-heading flex flex-wrap items-center gap-2">
                Proteksi Auto-Lock Sesi Ujian (Selesai Otomatis)
                {autoLockConfig.enabled && (
                  <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-0.5 rounded-full animate-pulse">
                    PEMANTAU AKTIF
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                Sistem secara otomatis mengunci pendaftaran/akses sesi ujian begitu jam penutupan (End Time) terlewati.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setAutoLockConfig((prev: any) => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-4 py-2 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer select-none shrink-0 border ${
              autoLockConfig.enabled
                ? "bg-red-650 text-white border-red-700 hover:bg-red-700 shadow-sm"
                : "bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-250"
            }`}
          >
            {autoLockConfig.enabled ? "Nonaktifkan" : "Aktifkan Auto-Lock"}
          </button>
        </div>

        {autoLockConfig.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/60 pt-4 animate-fadeIn">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">
                ⏳ Toleransi Keterlambatan Batas Sesi
              </label>
              <select
                value={autoLockConfig.bufferMinutes}
                onChange={(e) => setAutoLockConfig((prev: any) => ({ ...prev, bufferMinutes: Number(e.target.value) }))}
                className="w-full text-xs border border-slate-250 p-2 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800 font-bold"
              >
                <option value={0}>0 menit (Kunci Tepat Waktu)</option>
                <option value={1}>1 menit toleransi</option>
                <option value={5}>5 menit toleransi</option>
                <option value={10}>10 menit toleransi</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">
                🛰️ Siklus Deteksi Timer
              </label>
              <select
                value={autoLockConfig.checkInterval}
                onChange={(e) => setAutoLockConfig((prev: any) => ({ ...prev, checkInterval: Number(e.target.value) }))}
                className="w-full text-xs border border-slate-250 p-2 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800 font-bold"
              >
                <option value={2}>Setiap 2 detik (Sangat Presisi)</option>
                <option value={5}>Setiap 5 detik (Default)</option>
                <option value={10}>Setiap 10 detik</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 text-white rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-400">Pemeriksaan Terakhir:</span>
                <span className="font-bold text-teal-300 bg-slate-800 px-1.5 py-0.5 rounded">
                  {lastCheckTimeText || "Menunggu Detak..."}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400">Belum Terkunci: </span>
                  <span className="font-bold text-red-400">{schedules.filter(s => !s.isLocked).length}</span>
                </div>
                <div>
                  <span className="text-slate-400">Berhasil Terkunci: </span>
                  <span className="font-bold text-emerald-400">+{numAutoLockedSchedules}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FORM: BUAT JADWAL SESI BARU */}
      {isAdding && (
        <form onSubmit={handleCreateSchedule} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-slideDown shadow-3xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              📅 Master Penjadwalan Jadwal Ujian
            </span>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Pilih Mata Pelajaran */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 block uppercase">1. Pilih Mata Pelajaran *</label>
              <select
                value={selectedMapel}
                onChange={(e) => {
                  setSelectedMapel(e.target.value);
                  setSelectedPkgId(""); // reset selected package
                }}
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800"
                required
              >
                <option value="">-- Pilih Mapel --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Pilih Paket Soal */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 block uppercase">2. Pilih Paket Soal *</label>
              <select
                value={selectedPkgId}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                disabled={!selectedMapel}
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none focus:border-red-500 disabled:opacity-50 text-slate-800"
                required
              >
                <option value="">-- Pilih Paket Soal --</option>
                {filteredPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Pilih Kelas */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 block uppercase">3. Pilih Sasaran Kelas *</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800"
                required
              >
                <option value="">-- Pilih Rombel Kelas --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Tentukan Tanggal */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 block uppercase">4. Tanggal Seleksi *</label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800 font-sans"
                required
              />
            </div>

            {/* 5. Tentukan Jam Mulai */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 block uppercase">5. Jam Mulai (WIB) *</label>
              <input
                type="time"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800 font-mono"
                required
              />
            </div>

            {/* 6. Durasi */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 block uppercase">6. Durasi Ujian (Menit) *</label>
              <input
                type="number"
                value={inputDuration}
                onChange={(e) => setInputDuration(Number(e.target.value))}
                min={10}
                max={300}
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800"
                required
              />
            </div>

            {/* 7. Generate Token */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-450 block uppercase">7. TOKEN AKSES PESERTA (WAJIB JAGA KERAHASIAAN) *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                  placeholder="Ketuk Roll Token"
                  maxLength={5}
                  className="flex-1 text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 bg-slate-50 font-mono font-black text-center text-red-800 tracking-widest uppercase"
                  required
                />
                <button
                  type="button"
                  onClick={generateRandomToken}
                  className="px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition shrink-0"
                >
                  <KeyRound size={13} /> Roll Token
                </button>
              </div>
            </div>

            {/* Proctor Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 block uppercase">Nama Pengawas Utama</label>
              <input
                type="text"
                value={inputProctor}
                onChange={(e) => setInputProctor(e.target.value)}
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-200 text-slate-650 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Batalkan Sesi
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-black rounded-xl cursor-pointer transition shadow-3xs"
            >
              Terbitkan Jadwal Sesi
            </button>
          </div>
        </form>
      )}

      {/* Roster of Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {schedules.map((sch) => (
          <div
            key={sch.id}
            className={`bg-white rounded-2xl border p-5 space-y-4 shadow-3xs relative overflow-hidden transition duration-150 ${
              sch.isLocked ? "border-slate-200 opacity-70 bg-slate-50/50" : "border-slate-150 hover:border-red-200"
            }`}
          >
            {/* Top row */}
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-red-700 font-mono flex items-center gap-1">
                  <Calendar size={11} /> {sch.startTime}
                </span>
                <h4 className="font-extrabold text-slate-950 text-sm leading-normal">
                  {sch.packageName}
                </h4>
                {sch.kelas && (
                  <div className="flex gap-2 text-[10px] mt-1 font-semibold text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">Mapel: {sch.mapel || "Umum"}</span>
                    <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded-md">Sasar: {sch.kelas}</span>
                  </div>
                )}
              </div>

              {/* Lock Status indicator */}
              <button
                onClick={() => onToggleLock(sch.id)}
                className={`p-2 rounded-xl border select-none cursor-pointer transition ${
                  sch.isLocked
                    ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                }`}
                title={sch.isLocked ? "Buka Kunci Akses Sesi" : "Kunci Sesi Ujian"}
              >
                {sch.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>

            {/* Token element indicator */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-white">
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">
                  TOKEN CBT AKTIF
                </span>
                <span className="font-black text-sm tracking-widest text-yellow-400 font-mono select-all">
                  {sch.token || "BELUM_DI_SET"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                KKM: {sch.passTargetPercentage || 70}%
              </span>
            </div>

            {/* Footer row */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
              <span>Pengawas: <strong>{sch.proctorName}</strong></span>

              <button
                onClick={() => {
                  if (confirm(`Hapus jadwal ujian "${sch.packageName}"?`)) onDeleteSchedule(sch.id);
                }}
                className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs shadow-3xs">
            Belum ada jadwal sesi terdaftar. Ketuk "Buat Sesi Baru" untuk menugaskan.
          </div>
        )}
      </div>
    </div>
  );
}
