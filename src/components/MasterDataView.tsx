/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  BookOpen,
  Users,
  Grid,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  School,
  Key,
  Shield,
  Briefcase,
  UserCheck
} from "lucide-react";
import { Subject, ClassItem, Teacher, Student } from "../types";

interface MasterDataViewProps {
  subjects: Subject[];
  onAddSubject: (s: Subject) => void;
  onEditSubject: (s: Subject) => void;
  onDeleteSubject: (id: string) => void;

  classes: ClassItem[];
  onAddClass: (c: ClassItem) => void;
  onEditClass: (c: ClassItem) => void;
  onDeleteClass: (id: string) => void;

  teachers: Teacher[];
  onAddTeacher: (t: Teacher) => void;
  onEditTeacher: (t: Teacher) => void;
  onDeleteTeacher: (id: string) => void;

  students: Student[];
  onAddStudent: (s: Student) => void;
  onEditStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export default function MasterDataView({
  subjects,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  classes,
  onAddClass,
  onEditClass,
  onDeleteClass,
  teachers,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  students,
  onAddStudent,
  onEditStudent,
  onDeleteStudent
}: MasterDataViewProps) {
  const [activeTab, setActiveTab] = useState<"mapel" | "kelas" | "guru" | "siswa">("mapel");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals / Editor expansion states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formSubjectName, setFormSubjectName] = useState("");

  const [formClassName, setFormClassName] = useState("");

  const [formTeacherName, setFormTeacherName] = useState("");
  const [formTeacherMapel, setFormTeacherMapel] = useState("");
  const [formTeacherUsername, setFormTeacherUsername] = useState("");
  const [formTeacherPassword, setFormTeacherPassword] = useState("");

  const [formStudentNisn, setFormStudentNisn] = useState("");
  const [formStudentName, setFormStudentName] = useState("");
  const [formStudentKelas, setFormStudentKelas] = useState("");
  const [formStudentUsername, setFormStudentUsername] = useState("");
  const [formStudentPassword, setFormStudentPassword] = useState("");

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormSubjectName("");
    setFormClassName("");
    setFormTeacherName("");
    setFormTeacherMapel("");
    setFormTeacherUsername("");
    setFormTeacherPassword("");
    setFormStudentNisn("");
    setFormStudentName("");
    setFormStudentKelas("");
    setFormStudentUsername("");
    setFormStudentPassword("");
  };

  // Handlers for Save
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectName.trim()) {
      alert("Nama Mata Pelajaran tidak boleh kosong!");
      return;
    }

    if (editingId) {
      onEditSubject({ id: editingId, name: formSubjectName });
    } else {
      onAddSubject({ id: `sub-${Date.now()}`, name: formSubjectName });
    }
    resetForm();
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassName.trim()) {
      alert("Nama Kelas tidak boleh kosong!");
      return;
    }

    if (editingId) {
      onEditClass({ id: editingId, name: formClassName });
    } else {
      onAddClass({ id: `cls-${Date.now()}`, name: formClassName });
    }
    resetForm();
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeacherName.trim() || !formTeacherMapel.trim() || !formTeacherUsername.trim()) {
      alert("Semua isian guru wajib dilengkapi!");
      return;
    }

    const payload: Teacher = {
      id: editingId || `tcr-${Date.now()}`,
      name: formTeacherName,
      mapel: formTeacherMapel,
      username: formTeacherUsername,
      password: formTeacherPassword || "guru123"
    };

    if (editingId) {
      onEditTeacher(payload);
    } else {
      onAddTeacher(payload);
    }
    resetForm();
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentNisn.trim() || !formStudentName.trim() || !formStudentKelas.trim() || !formStudentUsername.trim()) {
      alert("Nisn, Nama, Kelas dan Username wajib diisi!");
      return;
    }

    const payload: Student = {
      id: editingId || `std-${Date.now()}`,
      nisn: formStudentNisn,
      name: formStudentName,
      kelas: formStudentKelas,
      username: formStudentUsername,
      password: formStudentPassword || "siswa123"
    };

    if (editingId) {
      onEditStudent(payload);
    } else {
      onAddStudent(payload);
    }
    resetForm();
  };

  // Populate form for Editing
  const startEditSubject = (s: Subject) => {
    setEditingId(s.id);
    setFormSubjectName(s.name);
    setIsAdding(true);
  };

  const startEditClass = (c: ClassItem) => {
    setEditingId(c.id);
    setFormClassName(c.name);
    setIsAdding(true);
  };

  const startEditTeacher = (t: Teacher) => {
    setEditingId(t.id);
    setFormTeacherName(t.name);
    setFormTeacherMapel(t.mapel);
    setFormTeacherUsername(t.username);
    setFormTeacherPassword(t.password || "");
    setIsAdding(true);
  };

  const startEditStudent = (s: Student) => {
    setEditingId(s.id);
    setFormStudentNisn(s.nisn);
    setFormStudentName(s.name);
    setFormStudentKelas(s.kelas);
    setFormStudentUsername(s.username);
    setFormStudentPassword(s.password || "");
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white text-[10px] uppercase font-black px-2.5 py-0.5 rounded-md tracking-wider">
              CBT Master Data
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              v2.1 Stable
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-heading tracking-tight text-white">
            Panel Master Data Sekolah
          </h2>
          <p className="text-xs text-slate-350 leading-relaxed max-w-xl">
            Kelola data fundamental CBT mulai dari Struktur Mata Pelajaran, Data Kelas, Akun Guru Pengajar, hingga Data Otentik Siswa/NISN.
          </p>
        </div>

        {/* Tab switcher buttons with counts */}
        <div className="bg-slate-800 p-1 rounded-xl flex border border-slate-700 w-full md:w-auto shrink-0 justify-center">
          <button
            onClick={() => {
              setActiveTab("mapel");
              resetForm();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "mapel" ? "bg-red-650 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen size={13} /> Mapel ({subjects.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("kelas");
              resetForm();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "kelas" ? "bg-red-650 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid size={13} /> Kelas ({classes.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("guru");
              resetForm();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "guru" ? "bg-red-650 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Briefcase size={13} /> Guru ({teachers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("siswa");
              resetForm();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "siswa" ? "bg-red-650 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Users size={13} /> Siswa ({students.length})
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Add/Edit Form */}
        {isAdding && (
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {editingId ? "✍️ Edit Data" : "➕ Tambah Data Baru"}
              </h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg cursor-pointer transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* FORM: MATA PELAJARAN */}
            {activeTab === "mapel" && (
              <form onSubmit={handleSaveSubject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Nama Mata Pelajaran (Mapel) *
                  </label>
                  <input
                    type="text"
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    placeholder="Contoh: Matematika, IPA, PPKn..."
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-black rounded-xl transition hover:shadow-sm cursor-pointer"
                >
                  Simpan Mapel
                </button>
              </form>
            )}

            {/* FORM: KELAS */}
            {activeTab === "kelas" && (
              <form onSubmit={handleSaveClass} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Nama Kelas / Rombel *
                  </label>
                  <input
                    type="text"
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    placeholder="Contoh: Kelas 1, Kelas 4-A, Kelas 6..."
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-black rounded-xl transition hover:shadow-sm cursor-pointer"
                >
                  Simpan Kelas
                </button>
              </form>
            )}

            {/* FORM: GURU */}
            {activeTab === "guru" && (
              <form onSubmit={handleSaveTeacher} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Nama Lengkap Guru *
                  </label>
                  <input
                    type="text"
                    value={formTeacherName}
                    onChange={(e) => setFormTeacherName(e.target.value)}
                    placeholder="Contoh: Hendra Wijaya, S.Pd"
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Mata Pelajaran Diampu *
                  </label>
                  <select
                    value={formTeacherMapel}
                    onChange={(e) => setFormTeacherMapel(e.target.value)}
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none"
                    required
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Username Log In *
                  </label>
                  <input
                    type="text"
                    value={formTeacherUsername}
                    onChange={(e) => setFormTeacherUsername(e.target.value)}
                    placeholder="Contoh: hendra"
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Sandi Log In / Password
                  </label>
                  <input
                    type="text"
                    value={formTeacherPassword}
                    onChange={(e) => setFormTeacherPassword(e.target.value)}
                    placeholder="Standar: guru123"
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-black rounded-xl transition hover:shadow-sm cursor-pointer"
                >
                  Simpan Guru
                </button>
              </form>
            )}

            {/* FORM: SISWA */}
            {activeTab === "siswa" && (
              <form onSubmit={handleSaveStudent} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Nomor NISN Siswa *
                  </label>
                  <input
                    type="text"
                    value={formStudentNisn}
                    onChange={(e) => {
                      // restrict alphanumeric and size
                      setFormStudentNisn(e.target.value.replace(/[^0-9]/g, ""));
                    }}
                    placeholder="Contoh: 0142998877"
                    maxLength={10}
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    value={formStudentName}
                    onChange={(e) => setFormStudentName(e.target.value)}
                    placeholder="Contoh: Andi Nugroho"
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Kelas Terdaftar *
                  </label>
                  <select
                    value={formStudentKelas}
                    onChange={(e) => setFormStudentKelas(e.target.value)}
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none"
                    required
                  >
                    <option value="">-- Pilih Rombel Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Username CBT Siswa *
                  </label>
                  <input
                    type="text"
                    value={formStudentUsername}
                    onChange={(e) => setFormStudentUsername(e.target.value)}
                    placeholder="Contoh: andi014"
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">
                    Sandi CBT Siswa
                  </label>
                  <input
                    type="text"
                    value={formStudentPassword}
                    onChange={(e) => setFormStudentPassword(e.target.value)}
                    placeholder="Standar: siswa123"
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-black rounded-xl transition hover:shadow-sm cursor-pointer"
                >
                  Simpan Siswa
                </button>
              </form>
            )}
          </div>
        )}

        {/* Right column: Data List Table */}
        <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs space-y-4 ${isAdding ? "lg:col-span-8" : "lg:col-span-12"}`}>
          {/* List Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder={`Cari data ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 focus:border-red-500 rounded-xl outline-none text-slate-800 bg-slate-50/50"
              />
            </div>

            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="py-2 px-4 bg-red-650 hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer transition"
              >
                <Plus size={14} /> Tambah {activeTab.toUpperCase()}
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            {/* VIEW: MATA PELAJARAN */}
            {activeTab === "mapel" && (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">No</th>
                    <th className="py-3 px-4">Nama Mata Pelajaran (Mapel)</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs">
                  {subjects
                    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => startEditSubject(s)}
                            className="p-1 px-2 border border-slate-200 hover:border-slate-350 rounded text-slate-650 hover:bg-slate-50 cursor-pointer"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus mapel "${s.name}"?`)) onDeleteSubject(s.id);
                            }}
                            className="p-1 px-2 border border-red-100 hover:border-red-250 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Belum ada data mata pelajaran. Klik tambah data untuk membuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* VIEW: KELAS */}
            {activeTab === "kelas" && (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">No</th>
                    <th className="py-3 px-4">Nama Rombel / Kelas</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs">
                  {classes
                    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => startEditClass(c)}
                            className="p-1 px-2 border border-slate-200 hover:border-slate-350 rounded text-slate-650 hover:bg-slate-50 cursor-pointer"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus kelas "${c.name}"?`)) onDeleteClass(c.id);
                            }}
                            className="p-1 px-2 border border-red-100 hover:border-red-250 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {classes.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Belum ada data rombel kelas. Klik tambah data untuk membuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* VIEW: GURU */}
            {activeTab === "guru" && (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">No</th>
                    <th className="py-3 px-4">Nama Lengkap Guru</th>
                    <th className="py-3 px-4">Mapel Diampu</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs">
                  {teachers
                    .filter(
                      (t) =>
                        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.mapel.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{t.name}</td>
                        <td className="py-3 px-4">
                          <span className="bg-red-100/50 border border-red-200/50 text-red-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            {t.mapel}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{t.username}</td>
                        <td className="py-3 px-4 font-mono text-slate-505 select-all">{t.password || "guru123"}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => startEditTeacher(t)}
                            className="p-1 px-2 border border-slate-200 hover:border-slate-350 rounded text-slate-650 hover:bg-slate-50 cursor-pointer"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus akun guru "${t.name}"?`)) onDeleteTeacher(t.id);
                            }}
                            className="p-1 px-2 border border-red-100 hover:border-red-250 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada data guru penghela. Klik tambah data untuk membuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* VIEW: SISWA */}
            {activeTab === "siswa" && (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">No</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Username Log In</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs">
                  {students
                    .filter(
                      (s) =>
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.nisn.includes(searchQuery) ||
                        s.kelas.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-red-700">{s.nisn}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{s.kelas}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{s.username}</td>
                        <td className="py-3 px-4 font-mono text-slate-505 select-all">{s.password || "siswa123"}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={() => startEditStudent(s)}
                            className="p-1 px-2 border border-slate-200 hover:border-slate-350 rounded text-slate-650 hover:bg-slate-50 cursor-pointer"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus siswa "${s.name}"?`)) onDeleteStudent(s.id);
                            }}
                            className="p-1 px-2 border border-red-100 hover:border-red-250 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada data siswa terdaftar. Klik tambah data untuk membuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
