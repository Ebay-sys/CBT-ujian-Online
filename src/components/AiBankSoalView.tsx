/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
  Calendar,
  Award,
  SlidersHorizontal,
  Info,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { ExamPackage, Question, ExamSchedule, Subject, ClassItem } from "../types";

interface AiBankSoalViewProps {
  packages: ExamPackage[];
  questions: Question[];
  schedules: ExamSchedule[];
  subjects?: Subject[];
  classes?: ClassItem[];
  onAddPackage: (pkg: ExamPackage) => void;
  onEditPackage: (pkg: ExamPackage) => void;
  onDeletePackage: (id: string) => void;
  onAddPackageWithQuestions: (pkg: ExamPackage, questions: any[]) => void;
  onAddQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
}

export default function AiBankSoalView({
  packages,
  questions,
  schedules,
  subjects = [],
  classes = [],
  onAddPackage,
  onEditPackage,
  onDeletePackage,
  onAddPackageWithQuestions,
  onAddQuestion,
  onDeleteQuestion
}: AiBankSoalViewProps) {
  // Navigation tabs of AiBankSoalView
  const [activeSubTab, setActiveSubTab] = useState<"generator" | "collection">("generator");

  // Form states for AI Questions Generation
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [jenjang, setJenjang] = useState<"SD" | "SMP" | "SMA">("SD");
  const [kelas, setKelas] = useState("Kelas 4");
  const [fase, setFase] = useState("Fase B");
  const [topic, setTopic] = useState("");
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [duration, setDuration] = useState<number>(60);
  const [difficulty, setDifficulty] = useState<"Mudah" | "Sedang" | "Sulit">("Sedang");
  const [jumlahOpsi, setJumlahOpsi] = useState<"ABC" | "ABCD" | "ABCDE">("ABCD");

  const [pkgToDelete, setPkgToDelete] = useState<{ id: string; name: string } | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string } | null>(null);
  const [draftToDiscard, setDraftToDiscard] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<"gemini" | "fallback" | null>(null);

  // States for previewing the generated exam draft before compiling
  const [generatedDraft, setGeneratedDraft] = useState<{
    packageInfo: {
      name: string;
      category: string;
      description: string;
      duration: number;
      totalQuestions: number;
      difficulty: "Mudah" | "Sedang" | "Sulit";
    };
    questions: {
      questionText: string;
      options: { key: "A" | "B" | "C" | "D" | "E"; text: string }[];
      correctAnswer: "A" | "B" | "C" | "D" | "E";
      explanation: string;
    }[];
  } | null>(null);

  // Draft review details edit state
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);
  const [draftEditQuestionText, setDraftEditQuestionText] = useState("");
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  // Collection panel states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedPkgIdForDrilldown, setSelectedPkgIdForDrilldown] = useState<string | null>(null);

  // Presets of popular Indonesian school subjects (Mapel) - Dynamically synchronized with registered subjects
  const mapelPresets = React.useMemo(() => {
    if (subjects && subjects.length > 0) {
      return subjects.map((sub) => sub.name);
    }
    return [
      "Matematika",
      "IPAS (Sains & Sosial)",
      "Bahasa Indonesia",
      "Bahasa Inggris",
      "Pendidikan Pancasila",
      "Seni Budaya",
      "Pendidikan Jasmani & Kesehatan (PJOK)"
    ];
  }, [subjects]);

  // Grade/Kelas mapping based on selected Jenjang
  const handleJenjangChange = (selected: "SD" | "SMP" | "SMA") => {
    setJenjang(selected);
    if (selected === "SD") {
      setKelas("Kelas 4");
      setFase("Fase B");
      setJumlahOpsi("ABCD");
    } else if (selected === "SMP") {
      setKelas("Kelas 7");
      setFase("Fase D");
      setJumlahOpsi("ABCD");
    } else {
      setKelas("Kelas 10");
      setFase("Fase E");
      setJumlahOpsi("ABCDE");
    }
  };

  const handleKelasChange = (val: string) => {
    setKelas(val);
    if (val === "Kelas 1" || val === "Kelas 2") {
      setFase("Fase A");
    } else if (val === "Kelas 3" || val === "Kelas 4") {
      setFase("Fase B");
    } else if (val === "Kelas 5" || val === "Kelas 6") {
      setFase("Fase C");
    } else if (val === "Kelas 7" || val === "Kelas 8" || val === "Kelas 9") {
      setFase("Fase D");
    } else if (val === "Kelas 10") {
      setFase("Fase E");
    } else if (val === "Kelas 11" || val === "Kelas 12") {
      setFase("Fase F");
    }
  };

  const currentSubject = subject === "Custom" ? customSubject : subject;

  // Search & Filters for Collection
  const uniqueCategories = Array.from(new Set(packages.map((p) => p.category))).filter(Boolean);
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || pkg.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "All" || pkg.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Call server-side API to generate full package
  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === "Custom" ? customSubject : subject;

    if (!finalSubject.trim()) {
      alert("Harap pilih atau tulis Mata Pelajaran!");
      return;
    }
    if (!topic.trim()) {
      alert("Harap tulis topik atau lingkup materi yang ingin diujikan!");
      return;
    }

    setIsGenerating(true);
    setGenerationSource(null);
    setGeneratedDraft(null);

    try {
      const res = await fetch("/api/gemini/generate-full-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jenjang,
          kelas,
          fase,
          subject: finalSubject,
          topic,
          totalQuestions,
          duration,
          difficulty,
          jumlahOpsi
        })
      });

      const data = await res.json();
      if (data.success && data.package && data.questions) {
        setGeneratedDraft({
          packageInfo: {
            name: data.package.name || `Try Out ${finalSubject}: ${topic}`,
            category: data.package.category || finalSubject,
            description: data.package.description || `Paket Soal hasil Generasi AI untuk materi ${topic}.`,
            duration: Number(data.package.duration) || duration,
            totalQuestions: Number(data.package.totalQuestions) || data.questions.length,
            difficulty: (data.package.difficulty as any) || difficulty
          },
          questions: data.questions
        });
        setGenerationSource(data.source === "gemini-ai" ? "gemini" : "fallback");
      } else {
        throw new Error(data.error || "Format respons tidak valid.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal membuat bank soal: ${err.message || "Terdapat kendala koneksi."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Compile and Save Draft to Main Application State
  const handleSaveAndCompileDraft = () => {
    if (!generatedDraft) return;

    // Create unique ID for package
    const pkgId = `pkg-ai-${Date.now()}`;
    const newPkg: ExamPackage = {
      id: pkgId,
      name: generatedDraft.packageInfo.name,
      category: generatedDraft.packageInfo.category,
      duration: generatedDraft.packageInfo.duration,
      totalQuestions: generatedDraft.questions.length,
      description: generatedDraft.packageInfo.description,
      difficulty: generatedDraft.packageInfo.difficulty,
      createdAt: new Date().toISOString().split("T")[0]
    };

    onAddPackageWithQuestions(newPkg, generatedDraft.questions);
    alert(
      `Sukses! Bank Soal Mapel "${generatedDraft.packageInfo.name}" berhasil dirakit dengan ${generatedDraft.questions.length} butir soal, dan disimpan ke database lokal.`
    );

    // Navigate to Collection mapping to view the generated package
    setGeneratedDraft(null);
    setActiveSubTab("collection");
    setSelectedPkgIdForDrilldown(pkgId);
  };

  const toggleExplanation = (index: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Upper Navigation & Info Hero Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-red-700 to-red-900 text-white p-6 rounded-2xl shadow-md">
        <div className="space-y-1">
          <span className="bg-red-500/30 text-red-100 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-red-500/20">
            Sistem Integrasi Guru Pintar
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight font-heading">
            Bank Soal Mata Pelajaran (AI Engine)
          </h2>
          <p className="text-xs text-red-200 font-sans leading-relaxed max-w-xl">
            Rakit bank butir soal berkualitas tinggi secara instan menggunakan Gemini AI terintegrasi, disesuaikan langsung dengan Kurikulum Merdeka & Standar AKM Nasional.
          </p>
        </div>
        
        {/* Toggle Option Tabs */}
        <div className="bg-white/10 p-1 rounded-xl flex border border-white/10 shrink-0 self-stretch md:self-auto justify-center">
          <button
            onClick={() => {
              setActiveSubTab("generator");
              setSelectedPkgIdForDrilldown(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-2 cursor-pointer ${
              activeSubTab === "generator"
                ? "bg-white text-red-800 shadow-sm"
                : "text-white/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles size={14} /> Pembangkit AI
          </button>
          <button
            onClick={() => setActiveSubTab("collection")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-2 cursor-pointer ${
              activeSubTab === "collection"
                ? "bg-white text-red-800 shadow-sm"
                : "text-white/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen size={14} /> Bank Soal Aktif ({packages.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: DYNAMIC QUESTION GENERATOR */}
      {activeSubTab === "generator" && (
        <div className="space-y-6 animate-fadeIn">
          {!generatedDraft ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Generator Configuration Panel */}
              <form
                onSubmit={handleGenerateAI}
                className="lg:col-span-12 bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-3xs space-y-5"
              >
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Sparkles className="text-red-600 animate-pulse" size={16} />
                      Konfigurasi Soal Ujian sesuai Capaian Pembelajaran
                    </h3>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      Pilih mata pelajaran, sub-materi kontekstual, dan biarkan AI menyusun naskah butir soal AKM.
                    </p>
                  </div>
                  <HelpCircle size={16} className="text-slate-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column Input */}
                  <div className="space-y-4">
                    {/* Select/Input Mapel */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Mata Pelajaran (Mapel) *
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <select
                          value={subject}
                          onChange={(e) => {
                            setSubject(e.target.value);
                            if (e.target.value !== "Custom") {
                              setCustomSubject("");
                            }
                          }}
                          className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 focus:border-red-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Mata Pelajaran --</option>
                          {mapelPresets.map((preset) => (
                            <option key={preset} value={preset}>
                              {preset}
                            </option>
                          ))}
                          <option value="Custom">✍️ Tulis Kustom Sendiri</option>
                        </select>

                        {subject === "Custom" && (
                          <input
                            type="text"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            placeholder="Tulis mata pelajaran kustom..."
                            required
                            className="w-full text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-800"
                          />
                        )}
                      </div>
                    </div>

                    {/* Jenjang, Kelas & Fase */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Jenjang Sekolah *
                      </label>
                      <div className="flex gap-2">
                        {(["SD", "SMP", "SMA"] as const).map((lvl) => (
                          <button
                            type="button"
                            key={lvl}
                            onClick={() => handleJenjangChange(lvl)}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                              jenjang === lvl
                                ? "bg-red-600 text-white shadow-3xs"
                                : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grid of details */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Kelas</label>
                        <select
                          value={kelas}
                          onChange={(e) => handleKelasChange(e.target.value)}
                          className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none"
                        >
                          {jenjang === "SD" && (
                            classes && classes.length > 0 ? (
                              classes.map((cls) => (
                                <option key={cls.id} value={cls.name}>
                                  {cls.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Kelas 1">Kelas 1</option>
                                <option value="Kelas 2">Kelas 2</option>
                                <option value="Kelas 3">Kelas 3</option>
                                <option value="Kelas 4">Kelas 4</option>
                                <option value="Kelas 5">Kelas 5</option>
                                <option value="Kelas 6">Kelas 6</option>
                              </>
                            )
                          )}
                          {jenjang === "SMP" && (
                            <>
                              <option value="Kelas 7">Kelas 7</option>
                              <option value="Kelas 8">Kelas 8</option>
                              <option value="Kelas 9">Kelas 9</option>
                            </>
                          )}
                          {jenjang === "SMA" && (
                            <>
                              <option value="Kelas 10">Kelas 10</option>
                              <option value="Kelas 11">Kelas 11</option>
                              <option value="Kelas 12">Kelas 12</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Fase Kurikulum</label>
                        <select
                          value={fase}
                          onChange={(e) => setFase(e.target.value)}
                          className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-850 outline-none"
                        >
                          <option value="Fase A">Fase A (Kelas 1 & 2)</option>
                          <option value="Fase B">Fase B (Kelas 3 & 4)</option>
                          <option value="Fase C">Fase C (Kelas 5 & 6)</option>
                          <option value="Fase D">Fase D (Kelas 7, 8, 9)</option>
                          <option value="Fase E">Fase E (Kelas 10)</option>
                          <option value="Fase F">Fase F (Kelas 11 & 12)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column Input */}
                  <div className="space-y-4 md:col-span-2">
                    {/* Topik / Materi Utama */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Topik atau Cakupan Ruang Lingkup Materi Ujian *
                      </label>
                      <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        rows={3}
                        placeholder="Contoh: Perkalian & pembagian pecahan campuran, operasi desimal, atau siklus penyerapan air dalam geografi tanah."
                        className="w-full text-xs border border-slate-250 p-3 rounded-xl outline-none focus:border-red-500 resize-none text-slate-800"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Jumlah Soal */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Jumlah Soal</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={totalQuestions}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTotalQuestions(val > 0 ? val : 1);
                          }}
                          className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none font-bold"
                          placeholder="Contoh: 10"
                        />
                      </div>

                      {/* Durasi Pengerjaan */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Durasi (Menit)</label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none"
                        >
                          <option value={30}>30 Menit</option>
                          <option value={60}>60 Menit</option>
                          <option value={90}>90 Menit</option>
                          <option value={120}>120 Menit</option>
                        </select>
                      </div>

                      {/* Kesulitan Paket */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Kesulitan Utama</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                          className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none"
                        >
                          <option value="Mudah">🟢 Mudah</option>
                          <option value="Sedang">🟡 Sedang</option>
                          <option value="Sulit">🔴 Sulit</option>
                        </select>
                      </div>

                      {/* Jumlah Opsi Pilihan */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Jumlah Opsi</label>
                        <select
                          value={jumlahOpsi}
                          onChange={(e) => setJumlahOpsi(e.target.value as any)}
                          className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none"
                        >
                          <option value="ABC">3 Pilihan (A-C)</option>
                          <option value="ABCD">4 Pilihan (A-D)</option>
                          <option value="ABCDE">5 Pilihan (A-E)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 leading-relaxed">
                    <Info size={12} className="text-red-500 shrink-0" />
                    <span>Gemini AI akan memformulasikan Stimulus Kontekstual yang autentik agar relevan dengan materi sehari-hari.</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 hover:shadow-md transition cursor-pointer text-center font-heading"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Mengevaluasi Capaian & Merakit Soal Ujian via AI...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Tulis Soal Ujian (AI Generate)
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* PREVIEW BOARD & DRAFT EDIT AREA */
            <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider border border-emerald-100">
                    Draft Berhasil Dirakit {generationSource === "gemini" ? "✨ Gemini Pro" : "💻 Built-in Engine"}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {generatedDraft.packageInfo.name}
                  </h3>
                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    Tinjau stimulus dan butir soal di bawah sebelum dikompilasi menjadi Bank Soal Mapel aktif yang siap dijadwalkan siswa.
                  </p>
                </div>

                <div className="flex gap-2 self-stretch sm:self-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setGeneratedDraft(null)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer text-center"
                  >
                    Kembali Ke Form
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndCompileDraft}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl hover:shadow cursor-pointer tracking-tight text-center font-heading"
                  >
                    Simpan &amp; Kompilasi Paket Ujian 🚀
                  </button>
                </div>
              </div>

              {/* Draft Package Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                  <BookOpen size={18} className="text-red-600" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Mata Pelajaran</p>
                    <p className="text-xs font-bold text-slate-700">{generatedDraft.packageInfo.category}</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                  <Clock size={18} className="text-red-600" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Waktu Alokasi</p>
                    <p className="text-xs font-bold text-slate-700">{generatedDraft.packageInfo.duration} Menit</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                  <Award size={18} className="text-red-600" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Kesulitan Paket</p>
                    <p className="text-xs font-bold text-slate-700">{generatedDraft.packageInfo.difficulty}</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                  <BarChart3 size={18} className="text-red-600" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Total Pertanyaan</p>
                    <p className="text-xs font-mono font-bold text-slate-700">{generatedDraft.questions.length} Butir</p>
                  </div>
                </div>
              </div>

              {/* List of generated draft questions */}
              <div className="space-y-4">
                {generatedDraft.questions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                    {/* Header Row */}
                    <div className="py-2.5 px-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
                      <span className="text-xs font-bold font-mono text-slate-700">Soal #{qIdx + 1}</span>
                      <span className="px-2 py-0.5 text-[9px] bg-red-50 text-red-700 border border-red-100 uppercase rounded-sm font-black">
                        Pilihan Ganda ({q.options.length} Opsi)
                      </span>
                    </div>

                    <div className="p-4 md:p-5 space-y-4">
                      {/* Formatted Question & Stimulus */}
                      <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                        {q.questionText}
                      </div>

                      {/* Display Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border transition ${
                              opt.key === q.correctAnswer
                                ? "bg-emerald-50/60 border-emerald-300 text-emerald-800"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                opt.key === q.correctAnswer
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-300/80 text-slate-700"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="font-medium">{opt.text}</span>
                          </div>
                        ))}
                      </div>

                      {/* Answer details and description */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                            Kunci: {q.correctAnswer}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleExplanation(qIdx)}
                            className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer transition focus:outline-none"
                          >
                            <span>{expandedExplanations[qIdx] ? "Sembunyikan" : "Tampilkan"} Pembahasan</span>
                            {expandedExplanations[qIdx] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Academic Explanations */}
                      {expandedExplanations[qIdx] && (
                        <div className="p-3 bg-red-50/40 border border-red-100 rounded-xl text-xs text-red-950 font-sans italic animate-slideDown">
                          <p className="font-bold text-[10px] uppercase tracking-wide text-red-800 not-italic mb-1">
                            Review Akademis (Pembahasan)
                          </p>
                          {q.explanation || "Pembahasan belum dirumuskan untuk materi butir ujian ini."}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Duplicate Bottom Compile Actions bar */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftToDiscard(true);
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer font-sans"
                >
                  Buang Hasil &amp; Mulai Ulang
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndCompileDraft}
                  className="px-6 py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-black rounded-xl hover:shadow cursor-pointer transition text-center font-heading"
                >
                  Selesai &amp; Jadwalkan Soal Ujian (Compile)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: COMPREHENSIVE BANK SOAL MASTER LIST COLLECTION */}
      {activeSubTab === "collection" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main search and filter strip */}
          <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-3xs flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search input container */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari mata pelajaran, materi, atau draf nama..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-red-200 rounded-xl outline-none text-xs text-slate-800"
                />
              </div>

              {/* Filters dropdowns */}
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none w-40 cursor-pointer"
                >
                  <option value="All">Semua Mapel</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none w-40 cursor-pointer"
                >
                  <option value="All">Semua Tingkat</option>
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Sulit">Sulit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drilldown modal/panel details if selected, otherwise grid of packages */}
          {selectedPkgIdForDrilldown ? (
            (() => {
              const pkg = packages.find((p) => p.id === selectedPkgIdForDrilldown);
              if (!pkg) {
                setSelectedPkgIdForDrilldown(null);
                return null;
              }
              const pkgQuestions = questions.filter((q) => q.packageId === pkg.id);

              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-3xs animate-fadeIn">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedPkgIdForDrilldown(null)}
                        className="text-red-700 hover:text-red-800 text-xs font-bold mb-1 flex items-center gap-1 cursor-pointer"
                      >
                        ← Kembali Ke Daftar Bank Soal
                      </button>
                      <h3 className="font-extrabold text-slate-900 text-base">{pkg.name}</h3>
                      <p className="text-xs text-slate-450 leading-relaxed">{pkg.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        setPkgToDelete({ id: pkg.id, name: pkg.name });
                      }}
                      className="p-2 sm:px-3 sm:py-1.5 border border-red-100 text-red-600 hover:bg-red-50 text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition self-start"
                      title="Hapus Bank Ujian"
                    >
                      <Trash2 size={13} />
                      <span className="hidden sm:inline">Hapus Bank Soal</span>
                    </button>
                  </div>

                  {/* Stat columns in drilldown view */}
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Mata Pelajaran</p>
                      <p className="font-extrabold text-slate-750">{pkg.category}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Durasi Tes</p>
                      <p className="font-extrabold text-slate-750">{pkg.duration} Menit</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Jumlah Butir</p>
                      <p className="font-extrabold text-slate-750">{pkgQuestions.length} Soal</p>
                    </div>
                  </div>

                  {/* List of actual questions in package */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      Butir Soal CBT Aktif ({pkgQuestions.length})
                    </h4>
                    {pkgQuestions.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        Belum ada butir pertanyaan yang dimasukkan ke bank soal ini.
                      </div>
                    ) : (
                      pkgQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="border border-slate-150 rounded-xl p-4 md:p-5 hover:border-red-100 transition space-y-4"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-700">Soal #{idx + 1}</span>
                            <button
                              onClick={() => {
                                setQuestionToDelete({ id: q.id });
                              }}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-md transition cursor-pointer"
                              title="Hapus Soal"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                            {q.questionText}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {q.options.map((opt) => (
                              <div
                                key={opt.key}
                                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                                  opt.key === q.correctAnswer
                                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-800 font-medium"
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                    opt.key === q.correctAnswer
                                      ? "bg-emerald-500 text-white"
                                      : "bg-slate-300/80 text-slate-600"
                                  }`}
                                >
                                  {opt.key}
                                </span>
                                <span>{opt.text}</span>
                              </div>
                            ))}
                          </div>

                          {q.explanation && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-700">
                              <span className="font-bold text-[10px] text-slate-500 uppercase block mb-1">
                                Pembahasan Akhir / Analisis :
                              </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      )
                    )) || []}
                  </div>
                </div>
              );
            })()
          ) : (
            /* Collection List View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPackages.map((pkg) => {
                const itemQuestionsCount = questions.filter((q) => q.packageId === pkg.id).length;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgIdForDrilldown(pkg.id)}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-red-200 hover:shadow-md hover:scale-[1.01] transition-all duration-150 cursor-pointer flex flex-col justify-between overflow-hidden relative"
                  >
                    {/* Top Accent line based on difficulty */}
                    <div
                      className={`h-[4px] w-full ${
                        pkg.difficulty === "Sulit"
                          ? "bg-red-500"
                          : pkg.difficulty === "Sedang"
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                      }`}
                    ></div>

                    <div className="p-5 space-y-4">
                      {/* Sub Info */}
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-150 text-slate-600 text-[9px] font-extrabold uppercase rounded-md tracking-wider">
                          {pkg.category}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-md uppercase border ${
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

                      {/* Title and summary */}
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-red-700 transition leading-snug">
                          {pkg.name}
                        </h4>
                        <p className="text-xs text-slate-450 line-clamp-3 h-12 leading-relaxed">
                          {pkg.description || "Tidak ada deskripsi tambahan pada bank soal mata pelajaran ini."}
                        </p>
                      </div>

                      {/* Spec summary pills */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono py-1.5">
                        <div className="bg-slate-50 border border-slate-150 px-2.5 py-2 rounded-xl flex items-center gap-1.5 text-slate-600 font-semibold">
                          <Clock size={13} className="text-slate-400 shrink-0" />
                          <span>{pkg.duration} Menit</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 px-2.5 py-2 rounded-xl flex items-center gap-1.5 text-slate-600 font-semibold">
                          <BookOpen size={13} className="text-red-650 shrink-0" />
                          <span>{itemQuestionsCount} Butir Soal</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom strip action display indicator */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-500 font-bold group-hover:bg-red-50/30 transition">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400 text-[10px]" />
                        Dibuat: {pkg.createdAt}
                      </span>
                      <span className="text-red-700 flex items-center gap-0.5 group-hover:translate-x-1 transition duration-150">
                        Kelola Soal <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Custom Confirmation Modal for Deleting Package */}
      {pkgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-950">Hapus Bank Soal</h4>
                <p className="text-[10px] uppercase font-bold text-slate-400">Tindakan Tidak Dapat Dibatalkan</p>
              </div>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed">
              Apakah Anda yakin ingin menghapus bank soal mapel <span className="font-extrabold text-slate-850">"{pkgToDelete.name}"</span> beserta seluruh naskah soal di dalamnya secara permanen?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPkgToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePackage(pkgToDelete.id);
                  setToastMessage(`Bank Soal "${pkgToDelete.name}" berhasil dihapus.`);
                  setSelectedPkgIdForDrilldown(null);
                  setTimeout(() => setToastMessage(null), 3000);
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

      {/* Custom Confirmation Modal for Deleting Question */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-950">Hapus Butir Soal</h4>
                <p className="text-[9px] uppercase font-bold text-slate-400">Menghapus Soal Secara Permanen</p>
              </div>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed">
              Apakah Anda yakin ingin menghapus butir soal kuis ini? Soal ini akan dihapus secara permanen dari paket.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteQuestion(questionToDelete.id);
                  setToastMessage("Butir soal berhasil dihapus.");
                  setTimeout(() => setToastMessage(null), 3000);
                  setQuestionToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Discarding Draft */}
      {draftToDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-xl font-heading">
                ⚠️
              </div>
              <div>
                <h4 className="text-base font-black text-slate-950">Buang Draft AI?</h4>
                <p className="text-[10px] uppercase font-bold text-slate-400">Mulai Ulang Proses</p>
              </div>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed">
              Apakah Anda yakin ingin membuang seluruh draft rancangan soal AI ini? Seluruh kuis yang dirakit sementara ini akan hilang.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDraftToDiscard(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratedDraft(null);
                  setDraftToDiscard(false);
                  setToastMessage("Draft kuis berhasil dibuang.");
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition cursor-pointer"
              >
                Ya, Buang Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-400 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center gap-2.5 max-w-sm animate-fade-in">
          <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-400">
            <CheckCircle2 size={16} />
          </div>
          <span className="text-xs font-bold text-white leading-tight">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
