/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Download,
  CheckCircle,
  XCircle,
  AlertOctagon,
  FileText,
  User,
  ShieldAlert,
  BarChart,
  Grid,
  Trash2
} from "lucide-react";
import { ExamHistory } from "../types";

interface HistoryViewProps {
  history: ExamHistory[];
  onDeleteHistory?: (id: string) => void;
  onDeleteMultipleHistory?: (ids: string[]) => void;
}

export default function HistoryView({ history, onDeleteHistory, onDeleteMultipleHistory }: HistoryViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Semua" | "Lulus" | "Gagal" | "Remedial">("Semua");
  const [selectedResult, setSelectedResult] = useState<ExamHistory | null>(null);
  const [historyToDelete, setHistoryToDelete] = useState<ExamHistory | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const getFilteredHistory = () => {
    return history.filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(search.toLowerCase()) ||
        item.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        item.examName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "Semua" || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  };

  const exportCSV = () => {
    const list = getFilteredHistory();
    if (list.length === 0) {
      triggerToast("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["ID", "Nama Peserta", "Mulai", "Nama Ujian", "Skor", "Status Kelulusan"];
    const csvRows = [headers.join(",")];
    list.forEach((item) => {
      csvRows.push(
        `"${item.id}","${item.studentName}","${item.startTime}","${item.examName}",${item.score},"${item.status}"`
      );
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CBT_Riwayat_Ujian_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
  };

  const filteredHistory = getFilteredHistory();

  const allFilteredSelected = filteredHistory.length > 0 && filteredHistory.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredItemIds = filteredHistory.map((item) => item.id);
      setSelectedIds((prev) => prev.filter((id) => !filteredItemIds.includes(id)));
    } else {
      const filteredItemIds = filteredHistory.map((item) => item.id);
      setSelectedIds((prev) => {
        const union = new Set([...prev, ...filteredItemIds]);
        return Array.from(union);
      });
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-heading">Riwayat Hasil Tes Ujian</h2>
          <p className="text-xs text-slate-500">
            Daftar lengkap rekapitulasi ujian siswa yang telah selesai dikerjakan, lengkap dengan detail perolehan nilai dan status kelulusan.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
        >
          <Download size={14} /> Ekspor Laporan CSV
        </button>
      </div>

      {/* Filter and search parameters */}
      <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-col md:flex-row gap-3.5 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama peserta, email, kelompok paket..."
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-red-500 outline-none rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <SlidersHorizontal size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(["Semua", "Lulus", "Gagal", "Remedial"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  statusFilter === status
                    ? "bg-white text-slate-800 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Items Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50/80 border border-red-100 px-4 py-3 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-red-800">
            <ShieldAlert size={16} className="text-red-500 shrink-0" />
            <span className="text-xs font-semibold">
              Terpilih <strong className="text-red-900 font-bold">{selectedIds.length}</strong> data riwayat ujian. Anda dapat melakukan penghapusan secara massal.
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer transition"
            >
              Batal Pilihan
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Trash2 size={13} /> Hapus Terpilih ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Table card */}
      <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-3 px-4 w-11 text-center select-none">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-400 h-4 w-4 cursor-pointer transition duration-150"
                  />
                </th>
                <th className="py-3 px-4">Nama Peserta</th>
                <th className="py-3 px-4">Nama Paket Ujian</th>
                <th className="py-3 px-4">Waktu Penyelesaian</th>
                <th className="py-3 px-4 text-center">Durasi</th>
                <th className="py-3 px-4 text-center">Skor Akhir</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => {
                  const isRowSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition ${isRowSelected ? "bg-red-50/15 hover:bg-red-50/25" : "hover:bg-slate-50/40"}`}
                    >
                      <td className="py-3 px-4 w-11 text-center select-none">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleSelectOne(item.id)}
                          className="rounded border-slate-300 text-red-600 focus:ring-red-400 h-4 w-4 cursor-pointer transition duration-150"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{item.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.studentEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{item.examName}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{item.startTime}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{item.durationMinutes} mnt</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800 font-mono text-sm">{item.score}</span>{" "}
                        <span className="text-[10px] text-slate-400">/{item.maxScore}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === "Lulus"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : item.status === "Remedial"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setSelectedResult(item)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition duration-150"
                            title="Rincian Nilai"
                          >
                            <FileText size={12} /> Rincian
                          </button>
                          {onDeleteHistory && (
                            <button
                              onClick={() => setHistoryToDelete(item)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition duration-150 border border-rose-100"
                              title="Hapus Nilai"
                            >
                              <Trash2 size={12} /> Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 bg-slate-50/20 font-medium">
                    Tidak ditemukan riwayat ujian yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup - Transcript Breakdown details */}
      {selectedResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-red-100 block">HASIL TRANSKRIP CBT</span>
                <h3 className="font-bold text-base font-heading">Detail Nilai Ujian</h3>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-1 text-white hover:text-red-100 cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Profile Card block */}
              <div className="flex gap-3 items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="p-2.5 bg-white text-slate-500 rounded-full border border-slate-100 shadow-2xs">
                  <User size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{selectedResult.studentName}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedResult.studentEmail}</p>
                </div>
              </div>

              {/* Data specifications Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="border border-slate-100 p-3 rounded-lg bg-white">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Ujian Diikuti</span>
                  <span className="font-bold text-slate-700 font-sans leading-none">{selectedResult.examName}</span>
                </div>
                <div className="border border-slate-100 p-3 rounded-lg bg-white">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Tgl Selesai</span>
                  <span className="font-bold text-slate-700">{selectedResult.startTime}</span>
                </div>
                <div className="border border-slate-100 p-3 rounded-lg bg-white">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Waktu Tempuh</span>
                  <span className="font-bold text-slate-700">{selectedResult.durationMinutes} menit</span>
                </div>
                <div className="border border-slate-100 p-3 rounded-lg bg-white">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Status Kelulusan</span>
                  <span
                    className={`font-extrabold font-sans text-[11px] ${
                      selectedResult.status === "Lulus" ? "text-emerald-600" : selectedResult.status === "Remedial" ? "text-amber-600" : "text-red-600"
                    }`}
                  >
                    {selectedResult.status}
                  </span>
                </div>
              </div>

              {/* Score Circular Wheel preview */}
              <div className="bg-slate-50/50 p-4 rounded-lg flex flex-col items-center justify-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perolehan Skor</span>
                <span className="text-4xl font-black font-heading text-red-600 tracking-tight">{selectedResult.score}</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Skor Maksimal Batas Kelulusan: {selectedResult.maxScore}</span>

                {/* Simulated correct questions percentage */}
                <div className="w-full mt-4 space-y-1 text-xs">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Akurasi Soal Terjawab Benar</span>
                    <span>{Math.round((selectedResult.score / selectedResult.maxScore) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedResult.score >= 70 ? "bg-emerald-500" : selectedResult.score >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${(selectedResult.score / selectedResult.maxScore) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  triggerToast(`Transkrip digital ${selectedResult.studentName} sukses ditandatangani secara digital.`);
                  setSelectedResult(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer transition"
              >
                Kirim PDF ke Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup - Confirm Delete */}
      {historyToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-5 overflow-hidden shadow-lg animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertOctagon size={24} className="shrink-0 text-red-500 animate-bounce" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-heading">Hapus Riwayat Ujian</h3>
                <p className="text-[10px] text-slate-400">Tindakan ini bersifat permanen!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed text-left">
              Apakah Anda yakin ingin menghapus data riwayat ujian milik <strong className="text-slate-800 font-bold">"{historyToDelete.studentName}"</strong> untuk ujian <strong className="text-slate-800 font-bold">"{historyToDelete.examName}"</strong>? Data nilai dan sertifikat terkait akan terhapus secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2 text-xs font-bold font-sans">
              <button
                type="button"
                onClick={() => setHistoryToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteHistory) {
                    onDeleteHistory(historyToDelete.id);
                  }
                  triggerToast(`Riwayat ujian "${historyToDelete.studentName}" berhasil dihapus.`);
                  setHistoryToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition cursor-pointer text-center"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup - Confirm Bulk Delete */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-5 overflow-hidden shadow-lg animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertOctagon size={24} className="shrink-0 text-red-500 animate-bounce" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-heading">Hapus Massal Riwayat</h3>
                <p className="text-[10px] text-slate-400">Tindakan ini bersifat permanen!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed text-left">
              Apakah Anda yakin ingin menghapus sebanyak <strong className="text-slate-800 font-bold">{selectedIds.length}</strong> data riwayat ujian terpilih secara massal? Seluruh data nilai dan sertifikat terkait akan terhapus secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2 text-xs font-bold font-sans">
              <button
                type="button"
                onClick={() => setConfirmBulkDelete(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMultipleHistory) {
                    onDeleteMultipleHistory(selectedIds);
                  } else if (onDeleteHistory) {
                    selectedIds.forEach((id) => onDeleteHistory(id));
                  }
                  triggerToast(`${selectedIds.length} data riwayat ujian berhasil dihapus.`);
                  setSelectedIds([]);
                  setConfirmBulkDelete(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition cursor-pointer text-center"
              >
                Ya, Hapus Semua ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900/95 border border-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 z-50 text-xs font-semibold animate-slideIn">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
