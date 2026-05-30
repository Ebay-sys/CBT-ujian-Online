/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
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
  AlertTriangle,
  Download,
  Upload,
  Database,
  Search,
  KeyRound
} from "lucide-react";
import { UserAccount, ExamPackage, Question, ExamHistory, SystemActivityLog } from "../types";

interface AccountsViewProps {
  accounts: UserAccount[];
  onToggleStatus: (id: string) => void;
  onAddAccount: (acc: UserAccount) => void;
  onDeleteAccount: (id: string) => void;
  onResetApp?: (options: { resetHistory: boolean; resetSchedules: boolean; resetAccounts: boolean }) => void;
  packages: ExamPackage[];
  questions: Question[];
  history: ExamHistory[];
  onImportBackup?: (data: { packages?: ExamPackage[]; questions?: Question[]; history?: ExamHistory[] }) => void;
  userRole?: string | null;
  activityLogs?: SystemActivityLog[];
  onAddActivityLog?: (name: string, role: string, email: string, action: string) => void;
}

export default function AccountsView({
  accounts,
  onToggleStatus,
  onAddAccount,
  onDeleteAccount,
  onResetApp,
  packages,
  questions,
  history,
  onImportBackup,
  userRole,
  activityLogs = [],
  onAddActivityLog
}: AccountsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"accounts" | "logs">("accounts");
  
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Admin" | "Guru" | "Pengawas" | "Viewer">("Pengawas");
  const [showPassword, setShowPassword] = useState(false);
  
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);

  // States for resetting database and application
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetHistory, setResetHistory] = useState(true);
  const [resetSchedules, setResetSchedules] = useState(false);
  const [resetAccounts, setResetAccounts] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const [searchLogQuery, setSearchLogQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === "admin" || userRole === "Admin";

  const handleDownloadBackup = () => {
    try {
      const backupData = {
        app: "CBT SDN 14 Singkawang App State",
        version: "1.0",
        backupDate: new Date().toISOString(),
        packages,
        questions,
        history,
        accounts
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const localDate = new Date().toISOString().slice(0, 10);
      link.download = `cbt_backup_sdn14_singkawang_${localDate}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Gagal mengunduh berkas cadangan: " + err?.message);
    }
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== "string") return;

        const parsed = JSON.parse(result);
        
        // Match base validation
        if (!parsed || (!parsed.packages && !parsed.questions && !parsed.history)) {
          alert("Gagal memulihkan database: File JSON yang diunggah tidak memiliki struktur data CBT yang valid.");
          return;
        }

        const confirmMsg = `PERINGATAN PEMULIHAN SISTEM!\n\n` +
          `Aplikasi akan dimuat ulang menggunakan data dari berkas cadangan tanggal: ${
            parsed.backupDate ? new Date(parsed.backupDate).toLocaleString("id-ID") : "Tidak Diketahui"
          }.\n\n` +
          `Detail Data yang Dideteksi:\n` +
          `- Paket Soal (Packages): ${parsed.packages?.length || 0} entri\n` +
          `- Bank Soal (Questions): ${parsed.questions?.length || 0} butir\n` +
          `- Riwayat Nilai (History): ${parsed.history?.length || 0} siswa\n\n` +
          `Apakah Anda yakin ingin menimpa database aktif saat ini dengan data cadangan di atas? Data aktif yang tidak di-backup akan hilang selamanya.`;

        if (window.confirm(confirmMsg)) {
          if (onImportBackup) {
            onImportBackup(parsed);
          }
        }
      } catch (err: any) {
        alert("Gagal mengurai file JSON cadangan: " + err?.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !username.trim() || !password.trim()) {
      alert("Mohon lengkapi seluruh kolom formulir termasuk Username dan Password!");
      return;
    }

    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, "");
    const cleanEmail = email.trim().toLowerCase();

    // Prevent duplicate user registration
    const duplicate = accounts.find(
      (a) =>
        a.email.trim().toLowerCase() === cleanEmail ||
        (a.username && a.username.trim().toLowerCase() === cleanUser)
    );

    if (duplicate) {
      alert("Nama pengguna (Username) atau Alamat Email tersebut sudah terdaftar di sistem!");
      return;
    }

    onAddAccount({
      id: `acc-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      username: cleanUser,
      password: password,
      role,
      status: "Aktif",
      lastLogin: "Belum pernah log in"
    });

    setName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setRole("Pengawas");
    setIsAdding(false);
    setShowPassword(false);
  };

  const filteredLogs = activityLogs.filter(
    (log) =>
      log.userName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.userRole.toLowerCase().includes(searchLogQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-heading">Kelola Akun & Riwayat Audit</h2>
          <p className="text-xs text-slate-500 font-sans">
            Konfigurasi data hak akses panitia, tambah pengawas proctor baru, dan pantau log audit tindakan sistem real-time.
          </p>
        </div>
        {activeSubTab === "accounts" && !isAdding && (
          <div>
            {isAdmin ? (
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
              >
                <UserPlus size={16} /> Daftarkan Akun Baru
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                <Lock size={12} className="text-slate-400" /> Mode Terkunci (Hanya Admin)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-1 select-none">
        <button
          onClick={() => {
            setActiveSubTab("accounts");
            setIsAdding(false);
          }}
          className={`px-5 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 -mb-px transition cursor-pointer font-sans duration-150 ${
            activeSubTab === "accounts"
              ? "border-red-500 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={14} /> Kelola Daftar Akun ({accounts.length})
        </button>
        <button
          onClick={() => {
            setActiveSubTab("logs");
            setIsAdding(false);
          }}
          className={`px-5 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 -mb-px transition cursor-pointer font-sans duration-150 ${
            activeSubTab === "logs"
              ? "border-red-500 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity size={14} /> Log Aktivitas Sistem ({activityLogs.length})
        </button>
      </div>

      {/* Tab 1: Control & Accounts Table List */}
      {activeSubTab === "accounts" && (
        <div className="space-y-6">
          {/* Add Account Panel - Only visible for Admin */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-205 p-5 space-y-4 animate-fadeIn shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserPlus size={14} className="text-red-500" />
                  Form Registrasi Hak Akses Pengawas/Panitia CBT
                </span>
                <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {/* Form Grid Layout (Responsive 1/2/3 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">NAMA LENGKAP *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Contoh: Hendra Wijaya, S.Pd"
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-slate-50 focus:border-red-500 focus:bg-white font-medium transition"
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
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-slate-50 focus:border-red-500 focus:bg-white font-mono transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">HAK AKSES PERAN *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-white font-semibold text-slate-755 focus:border-red-500 h-[38px] cursor-pointer"
                  >
                    <option value="Admin">Administrator (Akses Penuh)</option>
                    <option value="Guru">Guru (Hanya Soal & Paket)</option>
                    <option value="Pengawas">Pengawas (Proctor & Monitoring)</option>
                    <option value="Viewer">Viewer (Hanya Dasbor & Riwayat)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">NAMA PENGGUNA (USERNAME) *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Contoh: hendrawijaya"
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-slate-50 focus:border-red-500 focus:bg-white font-mono transition"
                  />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">KATA SANDI (PASSWORD) *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Masukkan kata sandi aman"
                      className="w-full text-xs border border-slate-200 p-2.5 pr-10 rounded-lg outline-none bg-slate-50 focus:border-red-500 focus:bg-white font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-650 cursor-pointer focus:outline-none"
                    >
                      {showPassword ? <X size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-650 hover:bg-red-700 bg-red-600 text-white font-semibold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Simpan & Daftarkan Akun
                </button>
              </div>
            </form>
          )}

          {/* Table Container - Responsive & Horizontal Scrolling */}
          <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                    <th className="py-3 px-4">Nama Keanggotaan</th>
                    <th className="py-3 px-4">Informasi Login / Kredensial</th>
                    <th className="py-3 px-4">Hak Akses</th>
                    <th className="py-3 px-4">Login Terakhir</th>
                    <th className="py-3 px-4 text-center">Status Akun</th>
                    <th className="py-3 px-4 text-center">Tindakan Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/30 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-600 select-none">
                          {acc.name ? acc.name[0].toUpperCase() : "U"}
                        </div>
                        <div className="flex flex-col">
                          <span>{acc.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">ID: {acc.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        <div className="font-semibold text-slate-700">{acc.email}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1.5 items-center">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200/50">
                            Username: <strong className="text-slate-800">{acc.username || acc.email.split("@")[0]}</strong>
                          </span>
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono border border-amber-100">
                            Pass: <strong className="text-slate-950 font-semibold">{acc.password || "user123"}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            acc.role === "Admin"
                              ? "bg-slate-900 text-slate-100"
                              : acc.role === "Guru"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : acc.role === "Pengawas"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          }`}
                        >
                          <Shield size={10} /> {acc.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono font-medium">{acc.lastLogin || "Belum pernah log in"}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => onToggleStatus(acc.id)}
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase select-none tracking-wide transition ${
                            isAdmin ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-80"
                          } ${
                            acc.status === "Aktif"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {acc.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={!isAdmin || acc.email === "admin.sdn14@singkawang.sch.id" || acc.id === "acc-1"}
                          onClick={() => setAccountToDelete(acc)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-50 hover:text-red-600 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
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
        </div>
      )}

      {/* Tab 2: Logs Tracking Panel */}
      {activeSubTab === "logs" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">Riwayat Audit Operasi</h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Laporan audit real-time tindakan mutasi database, reset, dan log in operator sesuai waktu Indonesia bagian Barat (WIB).
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari log atau nama..."
                  value={searchLogQuery}
                  onChange={(e) => setSearchLogQuery(e.target.value)}
                  className="w-full text-xs border border-slate-200 pl-8 pr-3 py-2 rounded-xl outline-none bg-slate-50 focus:border-red-500 focus:bg-white transition"
                />
              </div>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-extrabold px-2.5 py-1.5 uppercase shrink-0">
                {filteredLogs.length} Log
              </span>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Activity className="mx-auto text-slate-300" size={32} />
                <p className="text-xs font-semibold">Tidak ditemukan log aktivitas yang cocok.</p> 
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/40 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="space-y-1 font-sans">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-xs">{log.userName}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase select-none ${
                        log.userRole.toLowerCase() === "admin"
                          ? "bg-slate-950 text-slate-50"
                          : log.userRole.toLowerCase() === "guru"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {log.userRole}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">({log.userEmail || "System"})</span>
                    </div>
                    <p className="text-xs text-slate-650 font-medium leading-relaxed">{log.action}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/50">
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
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

      {/* Database Backup Section - Visible to Admin */}
      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">Pencadangan & Backup Database</h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Ekspor seluruh data atau pulihkan dari berkas eksternal untuk dipindahkan atau diamankan secara aman.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* Card Expor CADANGAN */}
            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/65 flex flex-col justify-between space-y-3.5 hover:border-slate-300 hover:bg-slate-50 transition duration-150">
              <div className="space-y-1">
                <span className="inline-block px-1.5 py-0.5 bg-emerald-100/80 text-emerald-800 text-[8px] font-extrabold uppercase rounded font-mono select-none">
                  EKSPOR DATA (.JSON)
                </span>
                <h4 className="font-bold text-xs text-slate-705 text-slate-800">Unduh Salinan Database Cadangan</h4>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Menyalin seluruh data aktif berupa <strong className="text-slate-700 font-semibold">Paket Soal ({packages.length})</strong>, <strong className="text-slate-700 font-semibold">Butir Soal ({questions.length})</strong>, <strong className="text-slate-700 font-semibold">Riwayat Nilai ({history.length})</strong>, serta daftar Akun Panitia ke dalam satu file terenkode JSON.
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full sm:w-auto self-start px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
              >
                <Download size={14} /> Ekspor Data Cadangan (.json)
              </button>
            </div>

            {/* Card Impor CADANGAN */}
            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/65 flex flex-col justify-between space-y-3.5 hover:border-slate-300 hover:bg-slate-50 transition duration-150">
              <div className="space-y-1">
                <span className="inline-block px-1.5 py-0.5 bg-amber-100/80 text-amber-800 text-[8px] font-extrabold uppercase rounded font-mono select-none">
                  RESTORASI DATABASE
                </span>
                <h4 className="font-bold text-xs text-slate-705 text-slate-800">Unggah & Terapkan Berkas Cadangan</h4>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Mengambil file format <strong className="text-slate-700 font-semibold">.json</strong> hasil ekspor untuk disalin ulang/ditimpa ke penyimpanan lokal. Berguna saat ingin memulihkan bank soal setelah melakukan reset aplikasi.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadBackup}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs border-dashed"
                >
                  <Upload size={14} className="text-slate-500" /> Impor & Pulihkan Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone: Reset Data - Only visible to Admin */}
      {isAdmin && onResetApp && (
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
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-400 h-4 w-4 cursor-pointer"
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
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-400 h-4 w-4 cursor-pointer"
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
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-400 h-4 w-4 cursor-pointer"
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
