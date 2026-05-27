/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Activity,
  Check,
  X,
  Lock,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { UserAccount } from "../types";

interface AccountsViewProps {
  accounts: UserAccount[];
  onToggleStatus: (id: string) => void;
  onAddAccount: (acc: UserAccount) => void;
  onDeleteAccount: (id: string) => void;
  onResetApp?: (options: { resetHistory: boolean; resetSchedules: boolean; resetAccounts: boolean }) => void;
}

export default function AccountsView({
  accounts,
  onToggleStatus,
  onAddAccount,
  onDeleteAccount,
  onResetApp
}: AccountsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Pengawas" | "Fasilitator">("Pengawas");
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);

  // States for resetting database and application
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetHistory, setResetHistory] = useState(true);
  const [resetSchedules, setResetSchedules] = useState(false);
  const [resetAccounts, setResetAccounts] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Mohon lengkapi seluruh kolom formulir!");
      return;
    }
    onAddAccount({
      id: `acc-${Date.now()}`,
      name,
      email,
      role,
      status: "Aktif",
      lastLogin: "Baru terdaftar"
    });
    setName("");
    setEmail("");
    setRole("Pengawas");
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-heading">Manajemen Akun Panitia & Pengawas</h2>
          <p className="text-xs text-slate-500 font-sans">
            Konfigurasi data hak akses panitia, tambah proctor baru, dan nonaktifkan akses untuk sementara waktu demi keamanan data ujian.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
          >
            <UserPlus size={16} /> Daftarkan Akun Baru
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-205 p-5 space-y-4 animate-fadeIn shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">Form Pendaftaran Pengawas/Panitia CBT</span>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">NAMA LENGKAP *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Contoh: Hendra Wijaya, S.Pd"
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-slate-50 focus:border-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">ALAMAT EMAIL *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Contoh: hendra@cbt.id"
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-slate-50 focus:border-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block uppercase">HAK AKSES PERAN *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-white font-semibold text-slate-700"
              >
                <option value="Admin">Administrator</option>
                <option value="Pengawas">Pengawas (Proctor)</option>
                <option value="Fasilitator">Fasilitator / Penguji</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              Simpan & Daftarkan Akun
            </button>
          </div>
        </form>
      )}

      {/* List of Accounts */}
      <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Keanggotaan</th>
                <th className="py-3 px-4">Alamat Email</th>
                <th className="py-3 px-4">Hak Akses</th>
                <th className="py-3 px-4">Login Terakhir</th>
                <th className="py-3 px-4 text-center">Status Akun</th>
                <th className="py-3 px-4 text-center">Tindakan Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/30 transition">
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {acc.name[0]}
                    </div>
                    {acc.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{acc.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        acc.role === "Admin"
                          ? "bg-slate-900 text-slate-100"
                          : acc.role === "Pengawas"
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      <Shield size={11} /> {acc.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{acc.lastLogin}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(acc.id)}
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase select-none tracking-wide cursor-pointer ${
                        acc.status === "Aktif"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}
                    >
                      {acc.status}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      disabled={acc.email === "dedyhendriawansusanto@gmail.com"}
                      onClick={() => setAccountToDelete(acc)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                      title="Hapus Akun Panitia/Pengawas"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-650 mb-4">
              <div className="p-3 bg-red-50 rounded-full text-red-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Akun</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-650 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus keanggotaan <strong className="text-slate-900 font-extrabold">"{accountToDelete.name}"</strong> ({accountToDelete.email}) dari sistem? Pengawas ini tidak akan lagi memiliki akses ke panel monitoring.
            </p>
            
            <div className="flex items-center justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAccount(accountToDelete.id);
                  setAccountToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm hover:shadow transition cursor-pointer"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zona Bahaya - Reset Data Aplikasi */}
      {onResetApp && (
        <div className="bg-red-50/40 border border-red-100 rounded-xl p-5 mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle size={18} className="text-rose-600 animate-pulse" />
              <span>Zona Bahaya: Pembersihan & Optimasi Aplikasi</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Apabila database dirasakan terlalu berat atau pengerjaan ujian periode sebelumnya telah selesai, Anda dapat melakukan reset data (riwayat hasil ujian, sesi pengerjaan, dlsb) secara massal untuk membebaskan ruang memori dan mempercepat muatan aplikasi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowResetModal(true);
              setConfirmInput("");
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-xs shrink-0 self-stretch sm:self-auto justify-center"
          >
            <RefreshCw size={14} /> Reset Data Aplikasi
          </button>
        </div>
      )}

      {/* Modal - Reset App & Data Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-rose-100 flex items-center gap-3 text-rose-650 bg-rose-50/40">
              <RefreshCw size={24} className="text-rose-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">Reset Konfigurasi & Database</h3>
                <p className="text-[10px] text-slate-500 font-sans">Pilih jenis data yang ingin Anda bersihkan secara permanen</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-650 leading-relaxed font-sans">
                Centang kategori data yang ingin dihapus untuk mengoptimalkan kinerja aplikasi:
              </p>

              <div className="space-y-3 font-sans">
                <label className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-xs cursor-pointer hover:bg-slate-100/50 select-none transition">
                  <input
                    type="checkbox"
                    checked={resetHistory}
                    onChange={(e) => setResetHistory(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-400 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Hapus Riwayat & Hasil Ujian (Disarankan)</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Menghapus seluruh daftar nilai siswa, statistik di dashboard, data log selesai, dan riwayat transkrip.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-xs cursor-pointer hover:bg-slate-100/50 select-none transition">
                  <input
                    type="checkbox"
                    checked={resetSchedules}
                    onChange={(e) => setResetSchedules(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-400 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Hapus Jadwal Ujian & Paket Soal</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Menghapus paket bank soal terdaftar dan rilis agenda jadwal pengerjaan aktif.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-xs cursor-pointer hover:bg-slate-100/50 select-none transition">
                  <input
                    type="checkbox"
                    checked={resetAccounts}
                    onChange={(e) => setResetAccounts(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-400 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Hapus Semua Akun Pengawas Keanggotaan</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Menurunkan/menghapus seluruh hak akses panitia lain dan menyisakan administrator utama.</span>
                  </div>
                </label>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 block uppercase">
                  Ketik <strong className="text-rose-600">RESET</strong> untuk mengonfirmasi tindakan :
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Ketik RESET di sini"
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-slate-50 focus:border-rose-500 focus:bg-white uppercase font-bold tracking-widest text-center"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-bold font-sans">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== "RESET" || (!resetHistory && !resetSchedules && !resetAccounts)}
                onClick={() => {
                  if (onResetApp) {
                    onResetApp({ resetHistory, resetSchedules, resetAccounts });
                  }
                  setShowResetModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition h-9 shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ya, Bersihkan Data Terpilih
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
