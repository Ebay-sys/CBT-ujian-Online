/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  X,
  Clock,
  BookOpen,
  Search,
  Filter,
  Grid,
  List,
  BarChart3,
  Layers,
  Calendar,
  Award,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { ExamPackage } from "../types";

interface PackagesViewProps {
  packages: ExamPackage[];
  onAddPackage: (pkg: ExamPackage) => void;
  onEditPackage: (pkg: ExamPackage) => void;
  onDeletePackage: (id: string) => void;
  onAddPackageWithQuestions?: (pkg: ExamPackage, questions: any[]) => void;
}

export default function PackagesView({
  packages,
  onAddPackage,
  onEditPackage,
  onDeletePackage,
  onAddPackageWithQuestions
}: PackagesViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<ExamPackage | null>(null);

  // Form states for add / edit
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState<number>(120);
  const [totalQuestions, setTotalQuestions] = useState<number>(100);
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"Mudah" | "Sedang" | "Sulit">("Sedang");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Calculate dynamic stats for the top Bento Box dashboard
  const totalPackages = packages.length;
  const totalAllQuestions = packages.reduce((acc, p) => acc + p.totalQuestions, 0);
  const avgDurationMinutes = Math.round(
    packages.reduce((acc, p) => acc + p.duration, 0) / (packages.length || 1)
  );

  const difficultyCounts = packages.reduce(
    (acc, p) => {
      if (p.difficulty === "Mudah" || p.difficulty === "Sedang" || p.difficulty === "Sulit") {
        acc[p.difficulty]++;
      }
      return acc;
    },
    { Mudah: 0, Sedang: 0, Sulit: 0 }
  );

  // Get list of unique categories to populate the category filter dropdown dynamically
  const uniqueCategories = Array.from(new Set(packages.map((p) => p.category))).filter(Boolean);

  // Filter packages based on active query, category, and difficulty status
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || pkg.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "All" || pkg.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    clearForm();
  };

  const clearForm = () => {
    setName("");
    setCategory("");
    setDuration(120);
    setTotalQuestions(100);
    setDescription("");
    setDifficulty("Sedang");
  };

  const handleEditClick = (pkg: ExamPackage) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setCategory(pkg.category);
    setDuration(pkg.duration);
    setTotalQuestions(pkg.totalQuestions);
    setDescription(pkg.description);
    setDifficulty(pkg.difficulty);
    // Auto scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) {
      alert("Mohon isi seluruh bidang wajib!");
      return;
    }

    if (editingId) {
      onEditPackage({
        id: editingId,
        name,
        category,
        duration,
        totalQuestions,
        description,
        difficulty,
        createdAt: packages.find((p) => p.id === editingId)?.createdAt || "2026-05-26"
      });
    } else {
      onAddPackage({
        id: `pkg-${Date.now()}`,
        name,
        category,
        duration,
        totalQuestions,
        description,
        difficulty,
        createdAt: new Date().toISOString().split("T")[0]
      });
    }
    closeForm();
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading tracking-tight">Manajemen Paket Soal</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Kelola paket materi kompetensi, atur waktu pengerjaan, muatan bank butir soal, serta kategori ujian CBT.
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              clearForm();
              setIsAdding(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:shadow-md transition duration-150 cursor-pointer text-center font-heading"
          >
            <Plus size={16} className="stroke-[2.5]" /> Buat Paket Manual
          </button>
        )}
      </div>

      {/* Modern Bento Stats Grid - Beautiful, Clean, and Dynamic */}
      {!isAdding && !editingId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Packages */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Paket</p>
              <h3 className="text-xl font-extrabold text-slate-800 font-mono mt-0.5">{totalPackages} <span className="text-xs font-semibold text-slate-400 font-sans">Paket</span></h3>
            </div>
          </div>

          {/* Card 2: Total Questions */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Soal CBT</p>
              <h3 className="text-xl font-extrabold text-slate-800 font-mono mt-0.5">{totalAllQuestions} <span className="text-xs font-semibold text-slate-400 font-sans">Butir</span></h3>
            </div>
          </div>

          {/* Card 3: Avg Duration */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Rata-rata Durasi</p>
              <h3 className="text-xl font-extrabold text-slate-800 font-mono mt-0.5">{avgDurationMinutes} <span className="text-xs font-semibold text-slate-400 font-sans">Menit</span></h3>
            </div>
          </div>

          {/* Card 4: Difficulty Distribution */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
              <BarChart3 size={11} /> Distribusi Tingkat Kesulitan
            </p>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {difficultyCounts.Mudah} Mdh
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> {difficultyCounts.Sedang} Sdg
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> {difficultyCounts.Sulit} Slt
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Package Interactive Form Area with Responsive Sections */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-5 animate-fadeIn max-w-4xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <Plus size={16} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingId ? "Edit Konfigurasi Paket Soal" : "Buat Paket Ujian Baru"}
                </h3>
                <p className="text-[10px] text-slate-450">Tentukan durasi, jumlah soal, dan mata pelajaran penunjatif.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Input Nama Paket */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Nama Paket Soal *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Contoh: Try Out Asesmen Akhir Semester Matematika"
                  className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 font-sans focus:ring-1 focus:ring-red-100 transition whitespace-nowrap overflow-hidden text-ellipsis text-slate-850"
                />
              </div>
            </div>

            {/* Input Kategori */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Mata Pelajaran / Kategori *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="Contoh: Matematika SD / IPAS"
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 font-sans focus:ring-1 focus:ring-red-100 transition text-slate-850"
              />
            </div>

            {/* Input Jumlah Soal */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Jumlah Soal (Butir) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs">
                  <BookOpen size={13} />
                </span>
                <input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  required
                  min={1}
                  placeholder="Contoh: 30"
                  className="w-full text-xs border border-slate-250 pl-8 pr-3 py-2.5 rounded-xl outline-none focus:border-red-500 bg-white text-slate-850"
                />
              </div>
            </div>

            {/* Input Durasi */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Durasi Ujian (Menit) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs">
                  <Clock size={13} />
                </span>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                  min={5}
                  placeholder="Contoh: 90"
                  className="w-full text-xs border border-slate-250 pl-8 pr-3 py-2.5 rounded-xl outline-none focus:border-red-500 text-slate-850"
                />
              </div>
            </div>

            {/* Input Tingkat Kesulitan */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Tingkat Kesulitan *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs">
                  <Award size={13} />
                </span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full text-xs border border-slate-250 pl-8 pr-3 py-2.5 rounded-xl outline-none focus:border-red-500 bg-white text-slate-850 cursor-pointer"
                >
                  <option value="Mudah">🟢 Mudah</option>
                  <option value="Sedang">🟡 Sedang</option>
                  <option value="Sulit">🔴 Sulit</option>
                </select>
              </div>
            </div>

            {/* Input Deskripsi Singkat */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Deskripsi Singkat Paket Soal
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tuliskan petunjuk teknis, sub-materi, atau deskripsi ringkas paket tryout di sini..."
                className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 resize-none text-slate-850 transition"
              ></textarea>
            </div>
          </div>

          {/* Form Actions with elegant layout */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeForm}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer text-center"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition cursor-pointer text-center font-heading"
            >
              {editingId ? "Simpan Perubahan Paket" : "Tambahkan Paket Soal"}
            </button>
          </div>
        </form>
      )}

      {/* Responsive Filter and Search Controls Row */}
      {!isAdding && !editingId && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-4 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* Search Input Container */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-450">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama paket, mata pelajaran, materi..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-red-200 rounded-xl outline-none text-xs focus:ring-1 focus:ring-red-100 font-sans transition text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dropdown Filters with Responsive Grid */}
            <div className="grid grid-cols-2 lg:flex lg:items-center gap-2">
              {/* Category Dropdown */}
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 flex-grow">
                <span className="text-slate-450 mr-1.5 shrink-0">
                  <SlidersHorizontal size={13} />
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-[11px] font-semibold text-slate-700 outline-none w-full cursor-pointer pr-1"
                >
                  <option value="All">Semua Mapel</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Dropdown */}
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 flex-grow">
                <span className="text-slate-450 mr-1.5 shrink-0">
                  <Filter size={13} />
                </span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-transparent text-[11px] font-semibold text-slate-700 outline-none w-full cursor-pointer pr-1"
                >
                  <option value="All">Semua Tingkat</option>
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Sulit">Sulit</option>
                </select>
              </div>

              {/* Grid/List Toggle Mode Buttons */}
              <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shrink-0 p-0.5 col-span-2 lg:col-span-1 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-red-600 shadow-3xs border border-slate-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Grid size={12} /> Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-red-600 shadow-3xs border border-slate-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <List size={12} /> Tabel
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(searchQuery || selectedCategory !== "All" || selectedDifficulty !== "All") && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400 font-medium">Filter terpasang:</span>
              {searchQuery && (
                <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full flex items-center gap-1">
                  Kata Kunci: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600"><X size={10} /></button>
                </span>
              )}
              {selectedCategory !== "All" && (
                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full flex items-center gap-1">
                  Mapel: {selectedCategory}
                  <button onClick={() => setSelectedCategory("All")} className="text-indigo-400 hover:text-indigo-600"><X size={10} /></button>
                </span>
              )}
              {selectedDifficulty !== "All" && (
                <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                  Kesulitan: {selectedDifficulty}
                  <button onClick={() => setSelectedDifficulty("All")} className="text-amber-400 hover:text-amber-700"><X size={10} /></button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedDifficulty("All");
                }}
                className="text-red-600 hover:text-red-700 font-bold ml-1 cursor-pointer transition"
              >
                Reset Semua
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Packages Content Render */}
      {!isAdding && !editingId && (
        <>
          {filteredPackages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center shadow-3xs space-y-3.5 max-w-lg mx-auto">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-4xs">
                <Search size={20} className="stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Tidak ada paket soal ditemukan</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kami tidak faham kata kunci di bawah saringan filter Anda. Silakan reset filter pencarian atau buat paket soal CBT yang baru.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedDifficulty("All");
                }}
                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition shadow-4xs"
              >
                Atur Ulang Pencarian
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* Responsive Bento-inspired Grid Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-red-200 hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden relative"
                >
                  {/* Package Top Accenting Border */}
                  <div
                    className={`h-[4px] w-full ${
                      pkg.difficulty === "Sulit"
                        ? "bg-red-500"
                        : pkg.difficulty === "Sedang"
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    }`}
                  ></div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-150 text-slate-550 text-[10px] font-bold uppercase rounded-md tracking-wider">
                        {pkg.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase border ${
                          pkg.difficulty === "Sulit"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : pkg.difficulty === "Sedang"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }`}
                      >
                        {pkg.difficulty === "Sulit" ? "🔴 Sulit" : pkg.difficulty === "Sedang" ? "🟡 Sedang" : "🟢 Mudah"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-red-700 transition leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-slate-450 line-clamp-2 h-8 leading-relaxed">
                        {pkg.description || "Tidak ada rincian diskripsi tambahan untuk paket ini."}
                      </p>
                    </div>

                    {/* Specification Stats Cards */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
                      <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-750">{pkg.duration} <span className="text-[10px] font-sans font-semibold text-slate-400">Min</span></span>
                      </div>
                      <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl flex items-center gap-2 text-slate-600">
                        <BookOpen size={14} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-750">{pkg.totalQuestions} <span className="text-[10px] font-sans font-semibold text-slate-400">Soal</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-150 flex justify-between items-center mt-auto">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 font-semibold">
                      <Calendar size={11} className="text-slate-350" />
                      Dibuat: {pkg.createdAt || "2026-05-26"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        title="Edit Informasi Paket"
                        onClick={() => handleEditClick(pkg)}
                        className="p-2 bg-white border border-slate-200 hover:border-red-400 text-slate-500 hover:text-red-700 rounded-lg cursor-pointer transition shadow-4xs"
                      >
                        <Edit2 size={12} className="stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        title="Hapus Paket"
                        disabled={packages.length <= 1}
                        onClick={() => setPackageToDelete(pkg)}
                        className="p-2 bg-white border border-slate-200 hover:border-red-400 text-slate-500 hover:text-red-700 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition shadow-4xs"
                      >
                        <Trash2 size={12} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Redesigned, Clean, High-Contrast and Fully Responsive Table List */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-3xs max-w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left text-slate-600 min-w-[700px]">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-150 font-bold font-mono">
                    <tr>
                      <th className="py-3 px-4">Nama Paket &amp; Mapel</th>
                      <th className="py-3 px-4">Kesulitan</th>
                      <th className="py-3 px-4 text-center">Durasi</th>
                      <th className="py-3 px-4 text-center">Total Soal</th>
                      <th className="py-3 px-4 text-center">Tanggal Buat</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {filteredPackages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="py-3.5 px-4">
                          <div className="max-w-[325px]">
                            <p className="font-bold text-slate-850 hover:text-red-700 transition cursor-pointer mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                              {pkg.name}
                            </p>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase rounded-md tracking-wider border border-slate-150">
                              {pkg.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase border ${
                              pkg.difficulty === "Sulit"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : pkg.difficulty === "Sedang"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}
                          >
                            {pkg.difficulty === "Sulit" ? "🔴 Sulit" : pkg.difficulty === "Sedang" ? "🟡 Sedang" : "🟢 Mudah"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                          {pkg.duration} <span className="text-[10px] font-sans font-normal text-slate-400">min</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                          {pkg.totalQuestions} <span className="text-[10px] font-sans font-normal text-slate-400">soal</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-450">
                          {pkg.createdAt || "2026-05-26"}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditClick(pkg)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg cursor-pointer transition"
                              title="Edit"
                            >
                              <Edit2 size={12} className="stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              disabled={packages.length <= 1}
                              onClick={() => setPackageToDelete(pkg)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition"
                              title="Hapus"
                            >
                              <Trash2 size={12} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modern High-Contrast Delete Confirmation Dialog Backdrop Modal (Responsive and Fluid) */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-50 rounded-full text-red-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Hapus Paket Soal CBT</h3>
                <p className="text-xs text-slate-450">Tindakan ini permanen dan tidak dapat ditarik kembali</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Apakah Anda benar-benar yakin ingin menghapus paket ujian <strong className="text-slate-900 font-extrabold">"{packageToDelete.name}"</strong>? Seluruh draf soal, opsi jawaban, dan riwayat yang berafiliasi dengan paket ini akan turut dibersihkan dari panel sistem CBT.
            </p>

            <div className="flex items-center justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePackage(packageToDelete.id);
                  setPackageToDelete(null);
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs hover:shadow transition cursor-pointer text-center"
              >
                Ya, Hapus Paket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
