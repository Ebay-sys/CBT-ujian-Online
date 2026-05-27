/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Play,
  RotateCcw,
  UserX,
  Radio,
  Clock,
  Laptop,
  Check,
  Search,
  BellRing
} from "lucide-react";
import { LiveParticipant } from "../types";

interface MonitorViewProps {
  participants: LiveParticipant[];
  onSetParticipants: (parts: LiveParticipant[]) => void;
  onForceSubmit: (participant: LiveParticipant) => void;
}

export default function MonitorView({
  participants,
  onSetParticipants,
  onForceSubmit
}: MonitorViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [monitorFilter, setMonitorFilter] = useState<"all" | "working" | "finished" | "not_started">("all");
  const [alertsLog, setAlertsLog] = useState<string[]>([
    "[09:34:12] Amanda Syahputri terdeteksi keluar dari jendela ujian (Tab Switch)",
    "[09:32:05] Bayu Adi Nugroho menyelesaikan ujian Paket Seleksi Saintek",
    "[09:30:15] Laras Dati koneksi terputus (Offline)"
  ]);

  const [secondsPassed, setSecondsPassed] = useState(0);

  // Tick local seconds offset reactively every 20ms for ultra high resolution and smoothness
  useEffect(() => {
    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTick) / 1000;
      lastTick = now;
      setSecondsPassed((prev) => prev + elapsed);
    }, 20);
    return () => clearInterval(timer);
  }, []);

  // When props update (e.g. state synced from server), reset the local timer offset to be perfectly in step
  useEffect(() => {
    setSecondsPassed(0);
  }, [participants]);

  // Format seconds to high-resolution text (hh:mm:ss.SS)
  const formatTime = (totalSecs: number) => {
    if (totalSecs <= 0) return "00:00:00.00";
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);
    const ms = Math.floor((totalSecs % 1) * 100);
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":") + "." + ms.toString().padStart(2, "0");
  };

  const warnParticipant = (id: string, name: string) => {
    onSetParticipants(
      participants.map((p) => {
        if (p.id === id) {
          const nextWarnings = p.warningsCount + 1;
          const nextStatus = nextWarnings >= 3 ? "Offline" : "Mencurigakan";
          
          // Log alert event
          const timestamp = new Date().toLocaleTimeString("id-ID", { hourCycle: "h23" });
          const newAlertMessage = `[${timestamp}] ${p.name} diberi peringatan #${nextWarnings}${nextStatus === "Offline" ? " - Terkunci otomatis!" : ""}`;
          setAlertsLog((prev) => [newAlertMessage, ...prev]);

          return {
            ...p,
            warningsCount: nextWarnings,
            status: nextStatus
          };
        }
        return p;
      })
    );
  };

  const handleSetStatusAktif = (id: string) => {
    onSetParticipants(
      participants.map((p) => {
        if (p.id === id) {
          const timestamp = new Date().toLocaleTimeString("id-ID", { hourCycle: "h23" });
          const newAlertMessage = `[${timestamp}] MANUAL OVERRIDE: Status ${p.name} diaktifkan kembali oleh Pengawas. Sesi dilanjutkan.`;
          setAlertsLog((prev) => [newAlertMessage, ...prev]);
          return {
            ...p,
            warningsCount: 0,
            status: "Aktif"
          };
        }
        return p;
      })
    );
  };

  const handleSetStatusTidakAktif = (id: string) => {
    onSetParticipants(
      participants.map((p) => {
        if (p.id === id) {
          const timestamp = new Date().toLocaleTimeString("id-ID", { hourCycle: "h23" });
          const newAlertMessage = `[${timestamp}] KEPUTUSAN PENGAWAS: Sesi ${p.name} dinonaktifkan (TIDAK AKTIF). Ujian di-lock.`;
          setAlertsLog((prev) => [newAlertMessage, ...prev]);
          return {
            ...p,
            status: "Tidak Aktif"
          };
        }
        return p;
      })
    );
  };

  const getFilteredParticipants = () => {
    let list = participants;
    if (monitorFilter === "working") {
      list = list.filter((p) => p.status === "Aktif" || p.status === "Mencurigakan" || p.status === "Sedang Mengerjakan");
    } else if (monitorFilter === "finished") {
      list = list.filter((p) => p.status === "Selesai" || p.status === "Selesai Mengerjakan");
    } else if (monitorFilter === "not_started") {
      list = list.filter((p) => p.status === "Offline" || p.status === "Tidak Aktif" || p.status === "Belum Mengerjakan" || p.currentQuestion === 0);
    }

    return list.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.examName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filtered = getFilteredParticipants();

  // Filter category counts Dynamically
  const countAll = participants.length;
  const countWorking = participants.filter((p) => p.status === "Aktif" || p.status === "Mencurigakan" || p.status === "Sedang Mengerjakan").length;
  const countFinished = participants.filter((p) => p.status === "Selesai" || p.status === "Selesai Mengerjakan").length;
  const countNotStarted = participants.filter((p) => p.status === "Offline" || p.status === "Tidak Aktif" || p.status === "Belum Mengerjakan" || p.currentQuestion === 0).length;
  
  // Filter for suspicious, warning-rich, or deactivated candidates
  const suspiciousList = participants.filter(
    (p) => p.status === "Mencurigakan" || p.status === "Tidak Aktif" || p.warningsCount > 0
  );

  return (
    <div className="space-y-6">
      {/* Visual Live indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-teal-500 via-purple-600 to-pink-500 border border-white/10 p-5 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative flex shrink-0 h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-300"></span>
          </div>
          <div>
            <h2 className="text-sm font-black flex items-center gap-1 uppercase tracking-wider font-heading text-white">
              <Radio size={16} className="animate-pulse" /> MONITOR LIVE UJIAN SEDANG BERJALAN
            </h2>
            <p className="text-xs text-white/90">
              Sistem Lockdown CBT mendeteksi seluruh pergerakan browser, status token aktif, dan sisa waktu pengerjaan murid secara langsung.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono font-bold text-slate-900 bg-white px-4 py-2 rounded-xl shadow-xs">
          TOTAL DIPANTAU: {participants.length} SISWA
        </div>
      </div>

      {/* SPECIAL PANEL: DETEKSI PESERTA MENCURIGAKAN */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-black text-rose-650 text-slate-800 text-sm flex items-center gap-2">
              <span className="p-1 px-2.5 bg-rose-100 text-rose-600 rounded-full font-mono text-xs">PELANGGARAN</span> 
              🚨 DAFTAR PESERTA DIDIK MENCURIGAKAN / NONAKTIF
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Menu kontrol khusus untuk mengubah status ujian siswa antara <strong className="text-emerald-600">Aktif</strong> (izinkan kembali pengerjaan) dan <strong className="text-rose-650 text-red-650 text-rose-600">Tidak Aktif</strong> (tangguhkan/kunci lembar jawaban).
            </p>
          </div>
          <span className="text-[10px] bg-slate-200/80 text-slate-600 font-bold px-3 py-1 rounded-full font-mono">
            TERDETEKSI: {suspiciousList.length} SISWA
          </span>
        </div>

        {suspiciousList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 p-5 space-y-1">
            <span className="text-2xl">🌱</span>
            <p className="text-xs font-bold text-slate-600">Aman Terkendali!</p>
            <p className="text-[10px] text-slate-400">Tidak ada rincian aktivitas mencurigakan atau pelanggaran tab-switching saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suspiciousList.map((p) => (
              <div 
                key={p.id} 
                className={`p-4 rounded-2xl border transition-all duration-200 bg-white shadow-xs ${
                  p.status === "Tidak Aktif" 
                    ? "border-red-200 bg-red-50/20" 
                    : "border-amber-200 bg-amber-50/10"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 uppercase">{p.name}</h4>
                    <p className="text-[9.5px] text-slate-400 font-mono leading-none mt-0.5">{p.email}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-1">IP Address: {p.ipAddress}</p>
                  </div>
                  <span 
                    className={`text-[9px] px-2 py-0.5 font-black uppercase rounded-full font-mono ${
                      p.status === "Tidak Aktif" 
                        ? "bg-red-100 text-red-700 border border-red-200 animate-pulse" 
                        : "bg-amber-150 bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {p.status === "Tidak Aktif" ? "Tidak Aktif" : "Mencurigakan"}
                  </span>
                </div>

                <div className="my-3 p-2 bg-slate-50 rounded-xl space-y-1 text-[10.5px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Mata Ujian:</span>
                    <strong className="text-slate-700 max-w-[130px] truncate" title={p.examName}>{p.examName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Batas Tab-Outs:</span>
                    <strong className={`font-mono ${p.warningsCount >= 3 ? "text-red-650 text-rose-600" : "text-amber-600"}`}>
                      {p.warningsCount}/3 Pelanggaran
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Sisa Waktu:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {p.status === "Selesai" 
                        ? "-" 
                        : formatTime(Math.max(0, p.timeRemaining - (p.status === "Aktif" || p.status === "Mencurigakan" ? secondsPassed : 0)))}
                    </span>
                  </div>
                </div>

                {/* ACTIVE AND INACTIVE MENU ACTIONS */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSetStatusAktif(p.id)}
                    className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[9.5px] flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <Check size={11} /> Set Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatusTidakAktif(p.id)}
                    disabled={p.status === "Tidak Aktif"}
                    className={`flex-1 py-1 px-2.5 font-extrabold rounded-lg text-[9.5px] flex items-center justify-center gap-1 transition shadow-xs ${
                      p.status === "Tidak Aktif" 
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                        : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    }`}
                  >
                    <ShieldAlert size={11} /> Set Tidak Aktif
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Left - table, Right - logs/activities */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Participants Table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-150 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">Roster Peserta Aktif</h3>
              <p className="text-[10px] text-slate-400">Grupifikasi & filter peserta ujian berdasarkan status keaktifan live sistem CBT.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Cari proctoring name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 focus:border-red-500 outline-none rounded-lg w-48 bg-slate-50"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            <button
              type="button"
              onClick={() => setMonitorFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                monitorFilter === "all"
                  ? "bg-[#1e293b] text-white border-[#1e293b]"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span>Sudah Login</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono leading-none ${monitorFilter === "all" ? "bg-white/20 text-white font-extrabold" : "bg-slate-200/80 text-slate-700"}`}>
                {countAll}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMonitorFilter("working")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                monitorFilter === "working"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span>Sedang Mengerjakan</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono leading-none ${monitorFilter === "working" ? "bg-white/20 text-white font-extrabold" : "bg-slate-200/80 text-slate-700"}`}>
                {countWorking}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMonitorFilter("finished")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                monitorFilter === "finished"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span>Selesai Mengerjakan</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono leading-none ${monitorFilter === "finished" ? "bg-white/20 text-white font-extrabold" : "bg-slate-200/80 text-slate-700"}`}>
                {countFinished}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMonitorFilter("not_started")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                monitorFilter === "not_started"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span>Belum Mengerjakan</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono leading-none ${monitorFilter === "not_started" ? "bg-white/20 text-white font-extrabold" : "bg-slate-200/80 text-slate-700"}`}>
                {countNotStarted}
              </span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Informasi Peserta</th>
                  <th className="py-2.5 px-3">Ujian Sesi</th>
                  <th className="py-2.5 px-3 text-center">Soal</th>
                  <th className="py-2.5 px-3 text-center">Sisa Waktu</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Peringatan</th>
                  <th className="py-2.5 px-3 text-center">Tindakan Protokol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition leading-relaxed">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Laptop size={13} className="text-slate-400" />
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pl-5">{p.email}</div>
                      <div className="text-[9px] text-slate-400 pl-5 font-mono">IP: {p.ipAddress}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-700 max-w-[150px] truncate" title={p.examName}>
                        {p.examName}
                      </div>
                      <div className="text-[9px] text-slate-400">Aktif: {p.lastActive}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="font-bold font-mono text-slate-700">
                        {p.currentQuestion}/{p.totalQuestions}
                      </div>
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="bg-red-600 h-full rounded-full"
                          style={{ width: `${(p.currentQuestion / p.totalQuestions) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold font-mono text-slate-700">
                      {p.status === "Selesai" 
                        ? "-" 
                        : formatTime(Math.max(0, p.timeRemaining - (p.status === "Aktif" || p.status === "Mencurigakan" ? secondsPassed : 0)))}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider border ${
                          p.status === "Tidak Aktif"
                            ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                            : p.status === "Mencurigakan"
                            ? "bg-amber-150 bg-amber-100 text-amber-700 border-amber-200"
                            : p.status === "Aktif" || p.status === "Sedang Mengerjakan"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : p.status === "Selesai" || p.status === "Selesai Mengerjakan"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {p.status === "Selesai" || p.status === "Selesai Mengerjakan"
                          ? "Selesai Mengerjakan"
                          : p.status === "Aktif" || p.status === "Sedang Mengerjakan" || p.status === "Mencurigakan"
                          ? "Sedang Mengerjakan"
                          : p.status === "Tidak Aktif"
                          ? "Belum Mengerjakan (Locked)"
                          : "Belum Mengerjakan"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block w-5 h-5 leading-5 rounded-full font-bold font-mono text-[11px] ${
                          p.warningsCount >= 3
                            ? "bg-red-600 text-white"
                            : p.warningsCount > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {p.warningsCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="flex items-center justify-center gap-1">
                        {p.status !== "Selesai" && p.status !== "Offline" && p.status !== "Tidak Aktif" && (
                          <button
                            type="button"
                            onClick={() => warnParticipant(p.id, p.name)}
                            className="p-1 text-amber-600 hover:text-amber-800 bg-amber-50 rounded"
                            title="Beri Peringatan Tab-Lock"
                          >
                            <AlertTriangle size={13} />
                          </button>
                        )}
                        {p.status !== "Selesai" && (p.status === "Tidak Aktif" || p.status === "Mencurigakan" || p.warningsCount > 0) && (
                          <button
                            type="button"
                            onClick={() => handleSetStatusAktif(p.id)}
                            className="p-1 text-emerald-600 hover:text-emerald-800 bg-emerald-50 rounded"
                            title="Set Status AKTIF (Aktivasi / Pulihkan)"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        {p.status !== "Selesai" && p.status !== "Tidak Aktif" && (
                          <button
                            type="button"
                            onClick={() => handleSetStatusTidakAktif(p.id)}
                            className="p-1 text-red-600 hover:text-red-850 bg-red-50 rounded"
                            title="Set Status TIDAK AKTIF (Suspend)"
                          >
                            <ShieldAlert size={13} />
                          </button>
                        )}
                        {p.status !== "Selesai" && (
                          <button
                            type="button"
                            onClick={() => onForceSubmit(p)}
                            className="p-1 text-rose-600 hover:text-rose-800 bg-rose-50 rounded"
                            title="Paksa Kumpulkan (Selesai)"
                          >
                            <UserX size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time System Warning logs */}
        <div className="bg-slate-900 rounded-xl p-4 text-white space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <BellRing size={16} className="text-rose-500 animate-bounce" />
              <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-rose-400">LOG AKTIVITAS CBT</h4>
            </div>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto text-[10px] font-mono leading-relaxed text-slate-300">
              {alertsLog.map((log, index) => (
                <div key={index} className="p-2 bg-slate-950/40 rounded border border-slate-850/30">
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-center uppercase font-mono tracking-widest">
            ● PEREKAMAN DEFENSIF AKTIF
          </div>
        </div>
      </div>
    </div>
  );
}
