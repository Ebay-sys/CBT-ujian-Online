/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Calendar,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Settings,
  User,
  CheckCircle,
  X
} from "lucide-react";
import { ExamSchedule, ServerTimeConfig } from "../types";

interface SchedulesViewProps {
  schedules: ExamSchedule[];
  onToggleLock: (id: string) => void;
  onAddSchedule: (schedule: ExamSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  serverTimeConfig?: ServerTimeConfig;
}

export default function SchedulesView({
  schedules,
  onToggleLock,
  onAddSchedule,
  onDeleteSchedule,
  serverTimeConfig = { useManualTime: false, offsetMs: 0 }
}: SchedulesViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [packageName, setPackageName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [proctorName, setProctorName] = useState("");
  const [passTarget, setPassTarget] = useState<number>(75);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !packageName.trim()) {
      alert("Harap isi nama jadwal dan paket CBT!");
      return;
    }
    onAddSchedule({
      id: `sch-${Date.now()}`,
      title,
      packageName,
      startTime: startTime || "2026-05-26 08:00 WIB",
      endTime: endTime || "2026-05-26 11:30 WIB",
      isLocked: false,
      proctorName: proctorName || "Pengawas Sistem",
      passTargetPercentage: passTarget
    });
    // Clear states
    setTitle("");
    setPackageName("");
    setStartTime("");
    setEndTime("");
    setProctorName("");
    setPassTarget(75);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {serverTimeConfig.useManualTime && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl px-5 py-3 font-mono text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span><strong>UTC SERVER OVERRIDE AKTIF:</strong> Semua referensi durasi jadwal dan log disesuaikan offline.</span>
          </div>
          <span className="font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
            {new Date(Date.now() + (serverTimeConfig.offsetMs || 0)).toISOString().replace("T", " ").slice(0, 19)} UTC
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-heading">Manajemen Data & Jadwal Ujian</h2>
          <p className="text-xs text-slate-500 font-sans">
            Atur kalender ujian, tentukan kriteria target kelulusan (KKM), tunjuk pengawas penilai, dan kunci/buka token akses pendaftaran.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition"
          >
            <Plus size={16} /> Buat Sesi Baru
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-250 p-5 space-y-4 animate-fadeIn shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">Buat Sesi & Jadwal CBT Baru</span>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">NAMA PENYELENGGARAAN SELEKSI *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Contoh: Seleksi Mandiri Gelombang II"
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">PAKET SOAL CBT *</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                required
                placeholder="Contoh: Paket Intensif UTBK-SNBT 2026"
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">WAKTU SELESAI & MULAI *</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="08:00 WIB"
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="11:30 WIB"
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">NAMA PENGAWAS RUANG *</label>
              <input
                type="text"
                value={proctorName}
                onChange={(e) => setProctorName(e.target.value)}
                placeholder="Contoh: Ibu Ratna Kartika"
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">TARGET KELULUSAN KKM (%) *</label>
              <input
                type="number"
                value={passTarget}
                onChange={(e) => setPassTarget(Number(e.target.value))}
                min={1}
                max={100}
                required
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
            >
              Terbitkan Pengumuman Jadwal
            </button>
          </div>
        </form>
      )}

      {/* Roster of Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {schedules.map((sch) => (
          <div
            key={sch.id}
            className={`bg-white rounded-xl border p-5 space-y-4 shadow-2xs relative overflow-hidden transition ${
              sch.isLocked ? "border-slate-200 opacity-70" : "border-slate-150 hover:border-red-100"
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> {sch.startTime} - {sch.endTime}
                </span>
                <h3 className="font-bold text-slate-800 text-sm leading-snug">{sch.title}</h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleLock(sch.id)}
                  title={sch.isLocked ? "Buka Akses Sesi" : "Lock / Tutup Akses Ujian"}
                  className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    sch.isLocked
                      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  {sch.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
                 <button
                  type="button"
                  title="Hapus Penjadwalan"
                  disabled={schedules.length <= 1}
                  onClick={() => setScheduleToDeleteId(sch.id)}
                  className="p-1.5 bg-white border border-slate-250 hover:border-red-400 text-slate-400 hover:text-red-700 rounded-lg disabled:opacity-40 disabled:hover:border-slate-200 cursor-pointer transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Middle body detailed block */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs font-sans text-slate-600">
              <div className="flex justify-between">
                <span>Paket Soal CBT:</span>
                <span className="font-semibold text-slate-800">{sch.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pengawas Utama:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <User size={12} className="text-slate-400" />
                  {sch.proctorName}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1">
                <span>Nilai KKM Target Kelulusan:</span>
                <span className="font-bold text-red-600">{sch.passTargetPercentage}%</span>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
              <span className="text-slate-400 uppercase tracking-widest">● KKM AKTIF</span>
              <span className={sch.isLocked ? "text-amber-600" : "text-emerald-600 animate-pulse"}>
                {sch.isLocked ? "TERKUNCI / CLOSED" : "MONITOR REGISTRASI AKTIF"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {scheduleToDeleteId && (() => {
        const schToDelete = schedules.find((s) => s.id === scheduleToDeleteId);
        if (!schToDelete) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 text-red-650 mb-4">
                <div className="p-3 bg-red-50 rounded-full text-red-600">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Jadwal</h3>
                  <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              
              <p className="text-xs text-slate-650 mb-6 leading-relaxed">
                Apakah Anda yakin ingin menghapus jadwal ujian <strong className="text-slate-900 font-extrabold">"{schToDelete.title}"</strong> untuk paket <strong className="text-slate-900 font-bold">"{schToDelete.packageName}"</strong>?
              </p>
              
              <div className="flex items-center justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setScheduleToDeleteId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteSchedule(schToDelete.id);
                    setScheduleToDeleteId(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm hover:shadow transition cursor-pointer"
                >
                  Ya, Hapus Jadwal
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
