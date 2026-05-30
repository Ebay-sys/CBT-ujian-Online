/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  BookOpen,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  Upload,
  Check,
  X,
  Shuffle,
  Sparkles,
  HelpCircle,
  FileText,
  Bookmark,
  ChevronRight,
  Image as ImageIcon,
  CheckCircle,
  Hash,
  Download,
  AlertCircle
} from "lucide-react";
import { Question, ExamPackage, Subject } from "../types";

interface QuestionsViewProps {
  questions: Question[];
  packages: ExamPackage[];
  subjects: Subject[];
  onAddQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onAddPackage: (p: ExamPackage) => void;
  onEditPackage?: (p: ExamPackage) => void;
  onDeletePackage?: (id: string) => void;
  onChangeActiveTab?: (tab: string) => void;
}

export default function QuestionsView({
  questions,
  packages,
  subjects,
  onAddQuestion,
  onDeleteQuestion,
  onAddPackage,
  onEditPackage,
  onDeletePackage,
  onChangeActiveTab
}: QuestionsViewProps) {
  // Navigation level
  // 1: Select Mapel
  // 2: View Paket Soal under selected Mapel
  // 3: View & Manage Questions inside selected Paket Soal
  const [navLevel, setNavLevel] = useState<1 | 2 | 3>(1);
  const [selectedMapel, setSelectedMapel] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<ExamPackage | null>(null);

  const [pkgToDelete, setPkgToDelete] = useState<{ id: string; name: string } | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchMapel, setSearchMapel] = useState("");
  const [searchPkg, setSearchPkg] = useState("");
  const [searchQuestion, setSearchQuestion] = useState("");

  // Toggles & Modal states
  const [isAddingPkg, setIsAddingPkg] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  // Form states: New Paket Soal
  const [newPkgName, setNewPkgName] = useState("");
  const [newPkgDesc, setNewPkgDesc] = useState("");
  const [newPkgDuration, setNewPkgDuration] = useState(60);
  const [newPkgDifficulty, setNewPkgDifficulty] = useState<"Mudah" | "Sedang" | "Sulit">("Sedang");
  // Custom requested toggles:
  const [newPkgAcakSoal, setNewPkgAcakSoal] = useState(false);
  const [newPkgAcakJawaban, setNewPkgAcakJawaban] = useState(false);

  // Form states: New Question
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<"PG" | "Essay">("PG");
  const [qImage, setQImage] = useState(""); // URL or base64 mock
  const [qBobot, setQBobot] = useState(5);
  // PG options
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [optE, setOptE] = useState("");
  const [correctKey, setCorrectKey] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [qExplanation, setQExplanation] = useState("");

  // Excel Paste area state
  const [excelPasteContent, setExcelPasteContent] = useState("");
  const [parsedImportPreview, setParsedImportPreview] = useState<any[]>([]);

  // Derived unique mapels list combining current subjects plus any categories in packages
  const activeMapels = Array.from(
    new Set([
      ...subjects.map((s) => s.name),
      ...packages.map((p) => p.category)
    ])
  ).filter(Boolean);

  // Handlers
  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMapel) return;
    if (!newPkgName.trim()) {
      alert("Nama paket soal wajib diisi!");
      return;
    }

    const pkgId = `pkg-manual-${Date.now()}`;
    const newPackage: ExamPackage = {
      id: pkgId,
      name: newPkgName,
      category: selectedMapel,
      duration: Number(newPkgDuration) || 60,
      totalQuestions: 0,
      description: newPkgDesc || `Paket Soal ${newPkgName} untuk mata pelajaran ${selectedMapel}.`,
      difficulty: newPkgDifficulty,
      createdAt: new Date().toISOString().split("T")[0]
    };

    // Store custom flags (acakSoal, acakJawaban) on localStorage
    localStorage.setItem(`cbt_pkg_acak_soal_${pkgId}`, String(newPkgAcakSoal));
    localStorage.setItem(`cbt_pkg_acak_jawaban_${pkgId}`, String(newPkgAcakJawaban));

    onAddPackage(newPackage);
    setIsAddingPkg(false);
    setNewPkgName("");
    setNewPkgDesc("");
    setNewPkgDuration(60);
    setNewPkgAcakSoal(false);
    setNewPkgAcakJawaban(false);
    alert(`Sukses merakit Paket Soal "${newPkgName}"!`);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;
    if (!qText.trim()) {
      alert("Butir soal wajib diisi!");
      return;
    }

    // Options mapping depending on question type
    const optionsArray = qType === "PG"
      ? [
          { key: "A" as const, text: optA.trim() || "Pilihan A" },
          { key: "B" as const, text: optB.trim() || "Pilihan B" },
          { key: "C" as const, text: optC.trim() || "Pilihan C" },
          { key: "D" as const, text: optD.trim() || "Pilihan D" },
          ...(optE.trim() ? [{ key: "E" as const, text: optE.trim() }] : [])
        ]
      : [];

    const questionId = `q-manual-${Date.now()}`;
    const newQ: Question = {
      id: questionId,
      packageId: selectedPkg.id,
      questionText: qText,
      options: optionsArray,
      correctAnswer: qType === "PG" ? correctKey : "A", // Default for essay is A or checked text
      explanation: qExplanation.trim() || undefined
    };

    // Save metadata specifically
    localStorage.setItem(`cbt_q_type_${questionId}`, qType);
    localStorage.setItem(`cbt_q_bobot_${questionId}`, String(qBobot));
    if (qImage.trim()) {
      localStorage.setItem(`cbt_q_image_${questionId}`, qImage.trim());
    }

    onAddQuestion(newQ);
    setIsAddingQuestion(false);
    
    // Reset forms
    setQText("");
    setQImage("");
    setQBobot(5);
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setOptE("");
    setCorrectKey("A");
    setQExplanation("");
    alert("Butir soal berhasil ditambahkan!");
  };

  // Excel pasting parser
  const handleParseExcelPaste = () => {
    if (!excelPasteContent.trim()) {
      alert("Harap tempel konten dari Excel atau CSV!");
      return;
    }

    // Format: Pertanyaan \t OpsiA \t OpsiB \t OpsiC \t OpsiD \t Kunci \t Bobot
    const rows = excelPasteContent.split("\n");
    const parsed: any[] = [];

    rows.forEach((row, i) => {
      const cols = row.split("\t");
      if (cols.length >= 5) {
        // Minimum elements parsed
        parsed.push({
          idx: i + 1,
          pertanyaan: cols[0]?.trim(),
          opsiA: cols[1]?.trim() || "Opsi A",
          opsiB: cols[2]?.trim() || "Opsi B",
          opsiC: cols[3]?.trim() || "Opsi C",
          opsiD: cols[4]?.trim() || "Opsi D",
          key: (cols[5]?.trim()?.toUpperCase() || "A") as any,
          bobot: Number(cols[6]?.trim()) || 5
        });
      }
    });

    if (parsed.length === 0) {
      alert("Tidak ada kolom valid yang terdeteksi. Pastikan anda menyalin baris tabel utuh (tab separated).");
    } else {
      setParsedImportPreview(parsed);
    }
  };

  const handleExectuteImport = () => {
    if (!selectedPkg || parsedImportPreview.length === 0) return;

    parsedImportPreview.forEach((item, idx) => {
      const questionId = `q-import-${Date.now()}-${idx}`;
      const newImportQ: Question = {
        id: questionId,
        packageId: selectedPkg.id,
        questionText: item.pertanyaan,
        options: [
          { key: "A", text: item.opsiA },
          { key: "B", text: item.opsiB },
          { key: "C", text: item.opsiC },
          { key: "D", text: item.opsiD }
        ],
        correctAnswer: item.key,
        explanation: "Hasil diimport dari berkas eksternal Excel."
      };
      
      // Save metadata
      localStorage.setItem(`cbt_q_type_${questionId}`, "PG");
      localStorage.setItem(`cbt_q_bobot_${questionId}`, String(item.bobot || 5));

      onAddQuestion(newImportQ);
    });

    alert(`Berhasil mengimpor ${parsedImportPreview.length} butir pertanyaan dari Excel!`);
    setIsImportingExcel(false);
    setExcelPasteContent("");
    setParsedImportPreview([]);
  };

  // Helper getters
  const getPackageQuestions = (packageId: string) => {
    return questions.filter((q) => q.packageId === packageId);
  };

  const getQType = (qId: string) => {
    return localStorage.getItem(`cbt_q_type_${qId}`) || "PG";
  };

  const getQBobot = (qId: string) => {
    return Number(localStorage.getItem(`cbt_q_bobot_${qId}`)) || 5;
  };

  const getQImage = (qId: string) => {
    return localStorage.getItem(`cbt_q_image_${qId}`) || null;
  };

  const getPkgAcakSoal = (pkgId: string) => {
    return localStorage.getItem(`cbt_pkg_acak_soal_${pkgId}`) === "true";
  };

  const getPkgAcakJawaban = (pkgId: string) => {
    return localStorage.getItem(`cbt_pkg_acak_jawaban_${pkgId}`) === "true";
  };

  return (
    <div className="space-y-6">
      {/* Back button for hierarchy navigation */}
      {navLevel > 1 && (
        <div className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-xl shadow-3xs">
          <button
            onClick={() => {
              if (navLevel === 3) {
                setNavLevel(2);
                setSelectedPkg(null);
                setIsAddingQuestion(false);
                setIsImportingExcel(false);
              } else if (navLevel === 2) {
                setNavLevel(1);
                setSelectedMapel(null);
                setIsAddingPkg(false);
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-red-700 cursor-pointer"
          >
            <ArrowLeft size={14} /> Kembali ke halaman sebelumnya
          </button>

          <span className="text-[10px] text-slate-400 font-mono">
            Lokasi: / {selectedMapel} {selectedPkg ? `> ${selectedPkg.name}` : ""}
          </span>
        </div>
      )}

      {/* LEVEL 1: SELEKSI MATA PELAJARAN */}
      {navLevel === 1 && (
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-800 to-red-950 p-6 rounded-2xl shadow text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="bg-red-500/40 border border-red-500/10 text-red-100 text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full">
                Struktur Utama CBT
              </span>
              <h2 className="text-xl md:text-2xl font-black font-heading tracking-tight">
                Bank Soal Mata Pelajaran
              </h2>
              <p className="text-xs text-red-100 max-w-xl leading-relaxed font-sans">
                Pilih mata pelajaran di bawah untuk mengelola bank paket soal. Uji kompetensi siswa dengan naskah soal standar PAS, PTS, dan Tryout yang komprehensif.
              </p>
            </div>

            {onChangeActiveTab && (
              <button
                onClick={() => onChangeActiveTab("dashboard")}
                className="px-4 py-2 bg-white text-red-900 font-black text-xs rounded-xl hover:shadow-md cursor-pointer transition flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-red-600 animate-pulse" /> Pembangkit AI Instan
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <BookOpen size={14} />
            </span>
            <input
              type="text"
              value={searchMapel}
              onChange={(e) => setSearchMapel(e.target.value)}
              placeholder="Cari mata pelajaran terdaftar..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200/90 focus:border-red-500 rounded-xl outline-none text-slate-800"
            />
          </div>

          {/* Grid Mapel Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeMapels
              .filter((m) => m.toLowerCase().includes(searchMapel.toLowerCase()))
              .map((mapel) => {
                const mapelPackages = packages.filter((p) => p.category === mapel);
                const mapelQCount = questions.filter((q) => {
                  const belongingPkg = packages.find((p) => p.id === q.packageId);
                  return belongingPkg && belongingPkg.category === mapel;
                }).length;

                return (
                  <div
                    key={mapel}
                    onClick={() => {
                      setSelectedMapel(mapel);
                      setNavLevel(2);
                    }}
                    className="bg-white border border-slate-200 hover:border-red-200 rounded-2xl p-5 hover:shadow-md cursor-pointer group transition duration-150 flex justify-between items-center"
                  >
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-700 group-hover:bg-red-600 group-hover:text-white transition duration-150">
                        <BookOpen size={20} />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-red-700 transition">
                        {mapel}
                      </h3>
                      <div className="flex gap-2 text-[10px] text-slate-450 font-medium">
                        <span>{mapelPackages.length} Paket Ujian</span>
                        <span>•</span>
                        <span>{mapelQCount} Butir Soal</span>
                      </div>
                    </div>

                    <div className="p-1 px-2.5 bg-slate-50 border border-slate-150 rounded-lg group-hover:bg-red-50 text-[11px] text-slate-500 font-bold flex items-center gap-0.5 group-hover:text-red-750 transition duration-150">
                      Buka <ChevronRight size={13} className="group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* LEVEL 2: DAFTAR PAKET SOAL UNDER SELECTED MAPEL */}
      {navLevel === 2 && selectedMapel && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-3xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block">
                Mata Pelajaran: {selectedMapel}
              </span>
              <h3 className="text-base font-black text-slate-950 font-heading">
                Kelola Paket Soal (Ujian Pas / PTS / Harian)
              </h3>
            </div>

            <button
              onClick={() => setIsAddingPkg(true)}
              className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-1 shadow-3xs"
            >
              <Plus size={14} /> Tambah Paket Baru
            </button>
          </div>

          {/* Form: Add Paket Soal */}
          {isAddingPkg && (
            <form
              onSubmit={handleCreatePackage}
              className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-3xs space-y-4 animate-slideDown"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  📂 Konstruksi Paket Soal Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingPkg(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Nama Paket *</label>
                  <input
                    type="text"
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    placeholder="Contoh: Paket PTS Semester 1, Latihan Tryout..."
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Durasi Pengerjaan (Menit)</label>
                  <input
                    type="number"
                    value={newPkgDuration}
                    onChange={(e) => setNewPkgDuration(Number(e.target.value))}
                    min={1}
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Deskripsi Pembelajaran</label>
                  <textarea
                    value={newPkgDesc}
                    onChange={(e) => setNewPkgDesc(e.target.value)}
                    rows={2}
                    placeholder="Deskripsi singkat topik bahasan..."
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none resize-none"
                  ></textarea>
                </div>

                {/* Acak Soal & Jawaban Toggles */}
                <div className="space-y-2 border border-slate-150 p-3 rounded-xl bg-slate-50/50 md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="acaksoal"
                      checked={newPkgAcakSoal}
                      onChange={(e) => setNewPkgAcakSoal(e.target.checked)}
                      className="rounded border-slate-300 text-red-650 focus:ring-red-500 bg-white"
                    />
                    <label htmlFor="acaksoal" className="text-xs font-bold text-slate-700 cursor-pointer">
                      🔀 Acak Urutan Soal (Siswa)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="acakjawaban"
                      checked={newPkgAcakJawaban}
                      onChange={(e) => setNewPkgAcakJawaban(e.target.checked)}
                      className="rounded border-slate-300 text-red-650 focus:ring-red-500 bg-white"
                    />
                    <label htmlFor="acakjawaban" className="text-xs font-bold text-slate-700 cursor-pointer">
                      🔄 Acak Pilihan Opsi (Siswa)
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Kesulitan Utama</label>
                  <select
                    value={newPkgDifficulty}
                    onChange={(e) => setNewPkgDifficulty(e.target.value as any)}
                    className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none"
                  >
                    <option value="Mudah">🟢 Mudah</option>
                    <option value="Sedang">🟡 Sedang</option>
                    <option value="Sulit">🔴 Sulit</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPkg(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Simpan Paket
                </button>
              </div>
            </form>
          )}

          {/* List layout of packages under chosen Mapel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {packages
              .filter((p) => p.category === selectedMapel)
              .filter((p) => p.name.toLowerCase().includes(searchPkg.toLowerCase()))
              .map((pkg) => {
                const pkgQuestions = getPackageQuestions(pkg.id);
                const isAcakSoal = getPkgAcakSoal(pkg.id);
                const isAcakJawaban = getPkgAcakJawaban(pkg.id);

                return (
                  <div
                    key={pkg.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between shadow-3xs"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-black text-red-700 font-mono tracking-wider">
                          ID: {pkg.id}
                        </span>
                        <div className="flex gap-1.5">
                          {isAcakSoal && (
                            <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 rounded uppercase">
                              Acak Soal
                            </span>
                          )}
                          {isAcakJawaban && (
                            <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-purple-50 text-purple-700 border border-purple-100 rounded uppercase">
                              Acak Opsi
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded border ${
                              pkg.difficulty === "Sulit"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : pkg.difficulty === "Sedang"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}
                          >
                            {pkg.difficulty}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-950 text-sm leading-snug">
                          {pkg.name}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="flex gap-4 text-[11px] text-slate-600 font-semibold bg-slate-50/70 border border-slate-150 p-2 rounded-xl">
                        <span>🕒 Durasi: {pkg.duration} Menit</span>
                        <span>•</span>
                        <span>📝 {pkgQuestions.length} Butir Soal</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setPkgToDelete({ id: pkg.id, name: pkg.name });
                        }}
                        className="p-2 border border-red-100 hover:bg-rose-50 text-red-650 rounded-xl cursor-pointer"
                        title="Hapus Paket"
                      >
                        <Trash2 size={13} />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPkg(pkg);
                          setNavLevel(3);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-red-650 hover:text-white text-slate-700 text-xs font-black rounded-xl flex items-center gap-1 cursor-pointer transition duration-150"
                      >
                        Kelola Soal <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

            {packages.filter((p) => p.category === selectedMapel).length === 0 && (
              <div className="md:col-span-2 text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs shadow-3xs">
                Belum ada paket soal untuk mata pelajaran {selectedMapel}. Silakan klik "Tambah Paket Baru" untuk merakit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL 3: KELOLA SOAL DISALURKAN KE PAKET YANG DIPILIH */}
      {navLevel === 3 && selectedPkg && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-3xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block font-mono">
                {selectedMapel} &gt; {selectedPkg.name}
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-950 font-heading">
                  Daftar Soal CBT Aktif
                </h3>
                <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                  {getPackageQuestions(selectedPkg.id).length} Butir
                </span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setIsImportingExcel(true)}
                className="px-3.5 py-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-750 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Upload size={14} /> Import Excel / CSV
              </button>

              <button
                onClick={() => setIsAddingQuestion(true)}
                className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1 shadow-3xs"
              >
                <Plus size={14} /> Tambah Soal Manual
              </button>
            </div>
          </div>

          {/* Form: Import Excel / CSV paste simulator */}
          {isImportingExcel && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4 animate-slideDown">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wide">
                  <FileText className="text-red-700" size={16} />
                  <span>Import Butir Soal Terstruktur (Excel / CSV)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportingExcel(false);
                    setExcelPasteContent("");
                    setParsedImportPreview([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] bg-red-50 text-red-800 p-2 px-3 rounded-lg block border border-red-150 leading-relaxed font-sans">
                  <strong>Panduan Format Baris (Tab Separated) :</strong> Salin kolom baris dari Excel dengan urutan: <br />
                  <code className="text-red-950 font-bold bg-white/50 p-0.5 rounded px-1 text-[9px] font-mono">Pertanyaan_Soal [TAB] Pilihan_A [TAB] Pilihan_B [TAB] Pilihan_C [TAB] Pilihan_D [TAB] Kunci (A/B/C/D) [TAB] Bobot_Nilai</code>
                </span>

                <textarea
                  value={excelPasteContent}
                  onChange={(e) => setExcelPasteContent(e.target.value)}
                  rows={4}
                  placeholder={`Matahari merupakan pusat...	Bumi	Matahari	Jupiter	Saturnus	B	10
Pernyataan yang tepat...	Opsi A	Opsi B	Opsi C	Opsi D	A	5`}
                  className="w-full text-xs border border-slate-200 p-3 rounded-xl bg-slate-50 font-mono outline-none text-slate-800 resize-none h-32"
                ></textarea>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleParseExcelPaste}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
                >
                  Pratinjau Data Impor (Parse)
                </button>

                {parsedImportPreview.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExectuteImport}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow cursor-pointer transition flex items-center gap-1"
                  >
                    <Check size={14} /> Eksekusi Simpan {parsedImportPreview.length} Soal
                  </button>
                )}
              </div>

              {/* Import Table preview */}
              {parsedImportPreview.length > 0 && (
                <div className="border border-slate-150 rounded-xl overflow-x-auto max-h-48 scrollbar">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 text-[9px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2 text-center w-12">No</th>
                        <th className="p-2">Pertanyaan</th>
                        <th className="p-2 text-center w-12">Kunci</th>
                        <th className="p-2 text-center w-12">Bobot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {parsedImportPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-55">
                          <td className="p-2 text-center font-mono text-slate-400">{item.idx}</td>
                          <td className="p-2 truncate max-w-xs">{item.pertanyaan}</td>
                          <td className="p-2 text-center font-black text-rose-700">{item.key}</td>
                          <td className="p-2 text-center font-mono">{item.bobot}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Form: Add Question manual */}
          {isAddingQuestion && (
            <form
              onSubmit={handleCreateQuestion}
              className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs space-y-4 animate-slideDown"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  ❓ Tambah Butir Soal CBT Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left column: Setup */}
                <div className="md:col-span-2 space-y-4">
                  {/* Text pertanyaan */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Butir Pertanyaan Soal *</label>
                    <textarea
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      rows={5}
                      placeholder="Tulis naskah pertanyaan atau stimulus di sini..."
                      className="w-full text-xs border border-slate-250 p-3 rounded-xl bg-white outline-none focus:border-red-500 text-slate-800 resize-none h-32"
                      required
                    ></textarea>
                  </div>

                  {/* PG Options */}
                  {qType === "PG" && (
                    <div className="space-y-3 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">PILIHAN OPSI JAWABAN</p>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 shrink-0 text-center font-bold text-[10px] bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center text-indigo-700">A</span>
                          <input type="text" value={optA} onChange={(e) => setOptA(e.target.value)} placeholder="Teks Opsi A" className="flex-1 text-xs border border-slate-200 p-2 rounded-lg bg-white" required={qType === "PG"} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 shrink-0 text-center font-bold text-[10px] bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center text-indigo-700">B</span>
                          <input type="text" value={optB} onChange={(e) => setOptB(e.target.value)} placeholder="Teks Opsi B" className="flex-1 text-xs border border-slate-200 p-2 rounded-lg bg-white" required={qType === "PG"} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 shrink-0 text-center font-bold text-[10px] bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center text-indigo-700">C</span>
                          <input type="text" value={optC} onChange={(e) => setOptC(e.target.value)} placeholder="Teks Opsi C" className="flex-1 text-xs border border-slate-200 p-2 rounded-lg bg-white" required={qType === "PG"} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 shrink-0 text-center font-bold text-[10px] bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center text-indigo-700">D</span>
                          <input type="text" value={optD} onChange={(e) => setOptD(e.target.value)} placeholder="Teks Opsi D" className="flex-1 text-xs border border-slate-200 p-2 rounded-lg bg-white" required={qType === "PG"} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 shrink-0 text-center font-bold text-[10px] bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center text-indigo-700">E</span>
                          <input type="text" value={optE} onChange={(e) => setOptE(e.target.value)} placeholder="Teks Opsi E (Opsional)" className="flex-1 text-xs border border-slate-200 p-2 rounded-lg bg-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side: Parameters */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Model Soal</label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value as any)}
                      className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none"
                    >
                      <option value="PG">🔘 Pilihan Ganda</option>
                      <option value="Essay">🖊️ Essay / Isian Bebas</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Bobot Skor Nilai</label>
                    <input
                      type="number"
                      value={qBobot}
                      onChange={(e) => setQBobot(Number(e.target.value))}
                      min={1}
                      max={100}
                      className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Kunci Jawaban</label>
                    {qType === "PG" ? (
                      <select
                        value={correctKey}
                        onChange={(e) => setCorrectKey(e.target.value as any)}
                        className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        {optE.trim() && <option value="E">E</option>}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Contoh: Jawaban Kunci Isian..."
                        className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white outline-none text-slate-800"
                        readOnly
                        value="Diverifikasi Manual oleh Guru"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Upload Gambar (Asset URL)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <ImageIcon size={13} />
                      </span>
                      <input
                        type="text"
                        value={qImage}
                        onChange={(e) => setQImage(e.target.value)}
                        placeholder="Masukkan URL Gambar..."
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Review Pembahasan Akademis</label>
                    <textarea
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      rows={2}
                      placeholder="Analisis jawaban benar..."
                      className="w-full text-xs border border-slate-250 p-2 rounded-xl bg-white outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-black rounded-xl transition shadow-3xs cursor-pointer"
                >
                  Tambah Butir Soal
                </button>
              </div>
            </form>
          )}

          {/* List of active package questions */}
          <div className="space-y-4">
            {getPackageQuestions(selectedPkg.id).map((q, qIdx) => {
              const type = getQType(q.id);
              const bobot = getQBobot(q.id);
              const imgUrl = getQImage(q.id);

              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
                  {/* Header Row */}
                  <div className="py-2 px-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center text-xs">
                    <span className="font-extrabold font-mono text-slate-500">Soal #{qIdx + 1}</span>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] bg-red-100 text-red-800 font-black rounded uppercase">
                        {type === "PG" ? "Pilihan Ganda" : "Essay"}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] bg-slate-100 border border-slate-200 font-bold rounded font-mono text-slate-600 flex items-center gap-0.5">
                        <Hash size={10} /> Bobot: {bobot}
                      </span>
                      <button
                        onClick={() => {
                          setQuestionToDelete({ id: q.id });
                        }}
                        className="text-slate-400 hover:text-red-600 p-0.5 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 space-y-4">
                    {/* Prompt text */}
                    <div className="text-xs font-medium text-slate-900 leading-relaxed font-sans whitespace-pre-wrap">
                      {q.questionText}
                    </div>

                    {/* Associated Image */}
                    {imgUrl && (
                      <div className="border border-slate-200 rounded-xl p-1 bg-slate-50 max-w-sm">
                        <img src={imgUrl} alt="Stimulus asset" referrerPolicy="no-referrer" className="max-h-48 w-full object-cover rounded-lg" />
                      </div>
                    )}

                    {/* Key-options render */}
                    {type === "PG" && q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                              opt.key === q.correctAnswer
                                ? "bg-emerald-50/60 border-emerald-300 text-emerald-800 font-medium"
                                : "bg-slate-50 border-slate-150 text-slate-650"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] ${
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
                    )}

                    {/* Explanatory summary */}
                    {q.explanation && (
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-sans text-indigo-900">
                        <span className="font-bold text-[9px] uppercase text-indigo-700 block mb-0.5">Analisis Pembahasan :</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {getPackageQuestions(selectedPkg.id).length === 0 && (
              <div className="text-center py-12 bg-white border border-dashed border-slate-250 rounded-2xl text-slate-400 text-xs shadow-3xs">
                Belum ada butir pertanyaan pada paket ini. Silakan tambahkan secara manual atau gunakan form Import data Excel.
              </div>
            )}
          </div>
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
                <h4 className="text-base font-black text-slate-950">Konfirmasi Hapus Paket</h4>
                <p className="text-[10px] uppercase font-bold text-slate-400">Tindakan Tidak Dapat Dibatalkan</p>
              </div>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed">
              Apakah Anda yakin ingin menghapus paket <span className="font-extrabold text-slate-850">"{pkgToDelete.name}"</span> beserta seluruh naskah soal kuis di dalamnya secara permanen?
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
                  if (onDeletePackage) {
                    onDeletePackage(pkgToDelete.id);
                    setToastMessage(`Paket soal "${pkgToDelete.name}" berhasil dihapus.`);
                    setTimeout(() => setToastMessage(null), 3500);
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

      {/* Custom Confirmation Modal for Deleting Question */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-950">Hapus Pertanyaan</h4>
                <p className="text-[9px] uppercase font-bold text-slate-400">Menghapus Naskah Butir Soal</p>
              </div>
            </div>
            <p className="text-xs text-slate-655 leading-relaxed">
              Apakah Anda yakin ingin menghapus butir pertanyaan ini? Soal ini akan dihapus secara permanen dari paket.
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

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-400 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center gap-2.5 max-w-sm">
          <div className="p-1 bg-emerald-500/20 rounded-lg text-emerald-400">
            <CheckCircle size={16} />
          </div>
          <span className="text-xs font-bold text-white leading-tight">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
